// Webhook de Stripe para Granja Rentable Premium.
// Se despliega SIN verificación JWT: quien llama es Stripe y se autentica con la firma.
// Secretos (solo en Supabase, nunca en el repositorio):
//   STRIPE_WEBHOOK_SECRET  whsec_…
//   STRIPE_SECRET_KEY      clave restringida de prueba (rk_test_…), con permiso de leer eventos
//   SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solo.
// Mientras STRIPE_PERMITIR_REAL no sea «si», un evento de modo real se ignora.
// El id de la cuenta sale de metadata.user_id, puesto al crear el checkout. No del navegador.

import {
  decidirAcceso,
  esUuid,
  eventoNuevo,
  resumirPremium,
  suscripcionDeFactura,
  usuarioAutorizado,
  usuariosCompatibles
} from "../_shared/premium_estado.mjs";
import { firmaValida } from "../_shared/firma_stripe.mjs";
import { stripeGet, stripePedir } from "../_shared/stripe_api.mjs";

const EVENTOS = new Set([
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed"
]);

function env(nombre: string): string {
  return String(Deno.env.get(nombre) || "").trim();
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

function idStripe(valor: unknown): string {
  if (typeof valor === "string" && valor) return valor;
  if (valor && typeof valor === "object" && typeof (valor as { id?: string }).id === "string") {
    return (valor as { id: string }).id;
  }
  return "";
}

async function db(ruta: string, init: RequestInit): Promise<{ ok: boolean; status: number; data: unknown }> {
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  const clave = env("SUPABASE_SERVICE_ROLE_KEY");
  const headers = new Headers(init.headers || {});
  headers.set("apikey", clave);
  headers.set("Authorization", "Bearer " + clave);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const res = await fetch(base + ruta, { ...init, headers });
  const texto = await res.text();
  let data: unknown = null;
  try {
    data = texto ? JSON.parse(texto) : null;
  } catch {
    data = texto;
  }
  return { ok: res.ok, status: res.status, data };
}

async function buscarUsuario(customer: string, subId: string): Promise<string> {
  const filtros = [];
  if (customer) filtros.push("stripe_customer_id=eq." + encodeURIComponent(customer));
  if (subId) filtros.push("stripe_subscription_id=eq." + encodeURIComponent(subId));
  for (const filtro of filtros) {
    const res = await db(
      "/rest/v1/suscripciones?select=user_id&" + filtro + "&limit=1",
      { method: "GET" }
    );
    if (!res.ok) throw new Error("supabase");
    const filas = res.data;
    if (Array.isArray(filas) && filas[0] && esUuid((filas[0] as { user_id?: string }).user_id)) {
      return (filas[0] as { user_id: string }).user_id;
    }
  }
  return "";
}

async function perfilExiste(userId: string): Promise<boolean> {
  const res = await db(
    "/rest/v1/perfiles?select=id&id=eq." + encodeURIComponent(userId) + "&limit=1",
    { method: "GET" }
  );
  if (!res.ok) throw new Error("supabase");
  return Array.isArray(res.data) && res.data.length > 0;
}

async function guardarFila(userId: string, fila: {
  customer: string;
  subId: string;
  estado: string;
  plan: string | null;
  moneda: string | null;
  vence: string | null;
  eventoEn: string;
}): Promise<void> {
  if (!fila.subId) throw new Error("sin suscripcion");
  const previaRes = await db(
    "/rest/v1/suscripciones?select=evento_en,user_id&stripe_subscription_id=eq." +
      encodeURIComponent(fila.subId) + "&limit=1",
    { method: "GET" }
  );
  if (!previaRes.ok) throw new Error("supabase");
  const previa = Array.isArray(previaRes.data) ? previaRes.data[0] as {
    evento_en?: string;
    user_id?: string;
  } : null;
  if (previa && previa.user_id && previa.user_id !== userId) return;
  if (previa && previa.evento_en && fila.eventoEn && Date.parse(previa.evento_en) > Date.parse(fila.eventoEn)) return;

  const cuerpo = {
    stripe_subscription_id: fila.subId,
    user_id: userId,
    stripe_customer_id: fila.customer || null,
    estado: fila.estado,
    plan: fila.plan,
    moneda: fila.moneda,
    vence: fila.vence,
    evento_en: fila.eventoEn,
    actualizado: new Date().toISOString()
  };
  const alta = await db("/rest/v1/suscripciones?on_conflict=stripe_subscription_id", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify(cuerpo)
  });
  if (!alta.ok) throw new Error("supabase");
}

async function recalcular(userId: string): Promise<void> {
  const res = await db(
    "/rest/v1/suscripciones?select=estado,vence&user_id=eq." + encodeURIComponent(userId),
    { method: "GET" }
  );
  if (!res.ok) throw new Error("supabase");
  const resumen = resumirPremium(Array.isArray(res.data) ? res.data as Array<{ estado?: string; vence?: string }> : [], Date.now());
  if (resumen.premium && !resumen.premium_hasta) throw new Error("premium sin fecha");
  const patch = await db("/rest/v1/perfiles?id=eq." + encodeURIComponent(userId), {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      premium: resumen.premium,
      premium_hasta: resumen.premium_hasta
    })
  });
  if (!patch.ok) throw new Error("supabase");
}

async function aplicarSuscripcion(sub: Record<string, unknown>, eventoEn: string, clave: string): Promise<void> {
  const subId = idStripe(sub.id);
  if (!subId) throw new Error("sin suscripcion");
  const fresco = await stripeGet("subscriptions/" + encodeURIComponent(subId), clave);
  if (!fresco.ok || !fresco.data) throw new Error("no se pudo leer la suscripcion");
  const real = fresco.data as Record<string, unknown>;
  const customer = idStripe(real.customer);
  let deCliente = "";
  if (customer) {
    const cus = await stripeGet("customers/" + encodeURIComponent(customer), clave);
    if (cus.ok && cus.data) deCliente = usuarioAutorizado((cus.data as { metadata?: unknown }).metadata);
  }
  const deSub = usuarioAutorizado(real.metadata);
  if (!usuariosCompatibles(deSub, deCliente)) return;
  let userId = deSub || deCliente;
  if (!userId) userId = await buscarUsuario(customer, subId);
  if (!userId) {
    const estado = String(real.status || "");
    if (estado === "canceled" || estado === "incomplete_expired") return;
    // Un Payment Link antiguo o una suscripción creada a mano no trae user_id
    // y no está en la tabla. 200: Stripe no la reintenta tres días.
    console.warn("suscripcion sin usuario y sin fila: " + subId);
    return;
  }
  if (!(await perfilExiste(userId))) return;
  const dueno = await buscarUsuario("", subId);
  if (dueno && dueno !== userId) return;
  const duenoCliente = customer ? await buscarUsuario(customer, "") : "";
  if (duenoCliente && duenoCliente !== userId) return;

  if (customer) {
    const cliente = await db(
      "/rest/v1/clientes_stripe?select=stripe_customer_id,prueba_usada,prueba_sub&user_id=eq." +
        encodeURIComponent(userId) + "&limit=1",
      { method: "GET" }
    );
    if (!cliente.ok) throw new Error("supabase");
    const filaCliente = Array.isArray(cliente.data) ? cliente.data[0] as {
      stripe_customer_id?: string;
      prueba_usada?: boolean;
      prueba_sub?: string;
    } : null;
    if (filaCliente && filaCliente.stripe_customer_id && filaCliente.stripe_customer_id !== customer) {
      console.warn("otro cliente de stripe, no se aplica: " + subId);
      return;
    }
    const esPrueba = String(real.status || "") === "trialing";
    if (esPrueba && filaCliente && filaCliente.prueba_usada && filaCliente.prueba_sub && filaCliente.prueba_sub !== subId) {
      console.warn("segunda prueba, se cancela: " + subId);
      await stripePedir("subscriptions/" + encodeURIComponent(subId), clave, { method: "DELETE" });
      return;
    }
  }

  const acceso = decidirAcceso(real, Date.now());
  if ((acceso.estado === "active" || acceso.estado === "trialing") && !acceso.premium_hasta) {
    throw new Error("sin fecha de fin");
  }
  const viva = acceso.estado === "active" || acceso.estado === "trialing" || acceso.estado === "past_due";
  if (viva) {
    const otras = await db(
      "/rest/v1/suscripciones?select=stripe_subscription_id&user_id=eq." + encodeURIComponent(userId) +
        "&estado=in.(active,trialing,past_due)&stripe_subscription_id=neq." + encodeURIComponent(subId) + "&limit=1",
      { method: "GET" }
    );
    if (!otras.ok) throw new Error("supabase");
    const hayOtra = Array.isArray(otras.data) && otras.data.length > 0;
    if (hayOtra) {
      if (String(real.status || "") === "trialing") {
        console.warn("segunda prueba con otra suscripcion viva, se cancela: " + subId);
        await stripePedir("subscriptions/" + encodeURIComponent(subId), clave, { method: "DELETE" });
      } else {
        console.warn("ya hay una suscripcion viva, no se añade otra: " + subId);
      }
      return;
    }
  }
  await guardarFila(userId, {
    customer,
    subId,
    estado: acceso.estado,
    plan: acceso.plan,
    moneda: acceso.moneda,
    vence: acceso.premium_hasta,
    eventoEn
  });
  if (customer) {
    const marca = await db("/rest/v1/clientes_stripe?on_conflict=user_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        user_id: userId,
        stripe_customer_id: customer,
        prueba_usada: true,
        prueba_sub: subId
      })
    });
    if (!marca.ok && marca.status !== 409) throw new Error("supabase");
  }
  await recalcular(userId);
}

async function aplicar(evento: {
  type: string;
  created: number;
  data: { object: Record<string, unknown> };
}, clave: string): Promise<void> {
  const objeto = evento.data.object || {};
  const eventoEn = new Date((Number(evento.created) || 0) * 1000).toISOString();

  if (evento.type === "checkout.session.completed") {
    const sesionId = idStripe(objeto.id);
    if (!sesionId) throw new Error("sin sesion");
    const leida = await stripeGet("checkout/sessions/" + encodeURIComponent(sesionId), clave);
    if (!leida.ok || !leida.data) throw new Error("no se pudo leer la sesion");
    const sesion = leida.data as Record<string, unknown>;
    const subId = idStripe(sesion.subscription);
    if (!subId) throw new Error("sin suscripcion");
    await aplicarSuscripcion({ id: subId }, eventoEn, clave);
    return;
  }

  if (evento.type.startsWith("customer.subscription.")) {
    await aplicarSuscripcion(objeto, eventoEn, clave);
    return;
  }

  const subId = suscripcionDeFactura(objeto);
  if (!subId) throw new Error("sin suscripcion");
  await aplicarSuscripcion({ id: subId }, eventoEn, clave);
}

async function marcarEvento(id: string, tipo: string): Promise<boolean> {
  const res = await db("/rest/v1/stripe_eventos?on_conflict=id", {
    method: "POST",
    headers: { Prefer: "resolution=ignore-duplicates,return=representation" },
    body: JSON.stringify({ id, tipo, recibido: new Date().toISOString() })
  });
  if (res.status === 409) return false;
  if (!res.ok) throw new Error("supabase");
  return eventoNuevo(res.data as unknown[]);
}

async function olvidarEvento(id: string): Promise<void> {
  await db("/rest/v1/stripe_eventos?id=eq." + encodeURIComponent(id), { method: "DELETE" });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  const clave = env("STRIPE_SECRET_KEY");
  if (!env("STRIPE_WEBHOOK_SECRET") || !env("SUPABASE_SERVICE_ROLE_KEY") || !env("SUPABASE_URL") || !clave) {
    return json({ ok: false, error: "Faltan secretos" }, 500);
  }
  const crudo = await req.text();
  const ok = await firmaValida(crudo, req.headers.get("stripe-signature") || "", env("STRIPE_WEBHOOK_SECRET"));
  if (!ok) return json({ ok: false, error: "Firma" }, 400);

  let aviso: { id?: string };
  try {
    aviso = JSON.parse(crudo);
  } catch {
    return json({ ok: false }, 400);
  }
  if (!aviso.id) return json({ ok: false }, 400);

  const leido = await stripeGet("events/" + encodeURIComponent(aviso.id), clave);
  if (!leido.ok || !leido.data || (leido.data as { object?: string }).object !== "event") {
    return json({ ok: false }, 500);
  }
  const evento = leido.data as {
    id?: string;
    type?: string;
    livemode?: boolean;
    created?: number;
    data?: { object?: Record<string, unknown> };
  };
  if (evento.livemode === true && env("STRIPE_PERMITIR_REAL") !== "si") {
    return json({ ok: true, ignorado: "modo real" });
  }
  if (!evento.type || !EVENTOS.has(evento.type) || !evento.data || !evento.data.object) {
    return json({ ok: true, ignorado: evento.type || "vacio" });
  }

  const nuevo = await marcarEvento(String(evento.id || aviso.id), evento.type);
  if (!nuevo) return json({ ok: true, repetido: true });

  try {
    await aplicar(evento as {
      type: string;
      created: number;
      data: { object: Record<string, unknown> };
    }, clave);
    return json({ ok: true });
  } catch (e) {
    await olvidarEvento(String(evento.id || aviso.id));
    console.error("webhook", evento.type, e instanceof Error ? e.message : "error");
    return json({ ok: false }, 500);
  }
});
