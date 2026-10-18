// Webhook de Stripe para Granja Rentable Premium.
// Se despliega SIN verificación JWT: quien llama es Stripe y se autentica con la firma.
// Secretos (solo en Supabase, nunca en el repositorio):
//   STRIPE_WEBHOOK_SECRET  whsec_…
//   STRIPE_SECRET_KEY      clave restringida de prueba (rk_test_…), no la clave completa
//   SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY los pone Supabase solo.
// Mientras STRIPE_PERMITIR_REAL no sea «si», un evento de modo real se ignora.

import { decidirAcceso, esUuid } from "../_shared/premium_estado.mjs";
import { firmaValida } from "../_shared/firma_stripe.mjs";

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

async function stripeGet(ruta: string, clave: string): Promise<Record<string, unknown> | null> {
  const res = await fetch("https://api.stripe.com/v1/" + ruta, {
    headers: { Authorization: "Bearer " + clave }
  });
  if (!res.ok) return null;
  return await res.json();
}

async function db(ruta: string, init: RequestInit): Promise<unknown> {
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  const clave = env("SUPABASE_SERVICE_ROLE_KEY");
  const headers = new Headers(init.headers || {});
  headers.set("apikey", clave);
  headers.set("Authorization", "Bearer " + clave);
  if (!headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const res = await fetch(base + ruta, { ...init, headers });
  const texto = await res.text();
  let data: unknown = null;
  try {
    data = texto ? JSON.parse(texto) : null;
  } catch {
    data = texto;
  }
  if (!res.ok) {
    console.error("supabase", res.status);
    throw new Error("supabase");
  }
  return data;
}

async function buscarUsuario(customer: string, subId: string): Promise<string> {
  const filtros = [];
  if (customer) filtros.push("stripe_customer_id=eq." + encodeURIComponent(customer));
  if (subId) filtros.push("stripe_subscription_id=eq." + encodeURIComponent(subId));
  for (const filtro of filtros) {
    const filas = await db(
      "/rest/v1/suscripciones?select=user_id&" + filtro + "&limit=1",
      { method: "GET" }
    );
    if (Array.isArray(filas) && filas[0] && esUuid((filas[0] as { user_id?: string }).user_id)) {
      return (filas[0] as { user_id: string }).user_id;
    }
  }
  return "";
}

async function guardar(userId: string, fila: {
  customer: string;
  subId: string;
  premium: boolean;
  premium_hasta: string | null;
  estado: string;
  plan: string | null;
  moneda: string | null;
  eventoEn: string;
}): Promise<void> {
  const previas = await db(
    "/rest/v1/suscripciones?select=evento_en,stripe_customer_id,stripe_subscription_id,plan,moneda&user_id=eq." +
      userId + "&limit=1",
    { method: "GET" }
  );
  const previa = Array.isArray(previas) ? previas[0] as {
    evento_en?: string;
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    plan?: string;
    moneda?: string;
  } : null;
  if (previa && previa.evento_en && fila.eventoEn && previa.evento_en > fila.eventoEn) return;

  const cuerpo = {
    user_id: userId,
    stripe_customer_id: fila.customer || previa?.stripe_customer_id || null,
    stripe_subscription_id: fila.subId || previa?.stripe_subscription_id || null,
    estado: fila.estado,
    plan: fila.plan || previa?.plan || null,
    moneda: fila.moneda || previa?.moneda || null,
    vence: fila.premium_hasta,
    evento_en: fila.eventoEn,
    actualizado: new Date().toISOString()
  };

  if (previa) {
    await db("/rest/v1/suscripciones?user_id=eq." + userId, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(cuerpo)
    });
  } else {
    await db("/rest/v1/suscripciones", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(cuerpo)
    });
  }

  await db("/rest/v1/perfiles?id=eq." + userId, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      premium: fila.premium,
      premium_hasta: fila.premium_hasta
    })
  });
}

function usuarioDe(meta: unknown, referencia: unknown): string {
  if (esUuid(referencia)) return String(referencia);
  if (meta && typeof meta === "object") {
    const m = meta as { user_id?: string; client_reference_id?: string };
    if (esUuid(m.user_id)) return String(m.user_id);
    if (esUuid(m.client_reference_id)) return String(m.client_reference_id);
  }
  return "";
}

async function aplicar(evento: {
  type: string;
  created: number;
  data: { object: Record<string, unknown> };
}): Promise<void> {
  const objeto = evento.data.object || {};
  const eventoEn = new Date((Number(evento.created) || 0) * 1000).toISOString();
  const clave = env("STRIPE_SECRET_KEY");

  if (evento.type === "checkout.session.completed") {
    const userId = usuarioDe(objeto.metadata, objeto.client_reference_id);
    if (!userId) return;
    const customer = idStripe(objeto.customer);
    const subId = idStripe(objeto.subscription);
    let acceso = {
      premium: objeto.payment_status === "paid" || objeto.payment_status === "no_payment_required",
      premium_hasta: null as string | null,
      estado: objeto.payment_status === "no_payment_required" ? "trialing" : "active",
      plan: null as string | null,
      moneda: null as string | null
    };
    if (subId && clave) {
      const sub = await stripeGet("subscriptions/" + encodeURIComponent(subId), clave);
      if (sub) acceso = decidirAcceso(sub, Date.now());
    }
    await guardar(userId, {
      customer,
      subId,
      premium: acceso.premium,
      premium_hasta: acceso.premium_hasta,
      estado: acceso.estado,
      plan: acceso.plan,
      moneda: acceso.moneda,
      eventoEn
    });
    return;
  }

  if (evento.type.startsWith("customer.subscription.")) {
    const customer = idStripe(objeto.customer);
    const subId = idStripe(objeto.id);
    let userId = usuarioDe(objeto.metadata, null);
    if (!userId) userId = await buscarUsuario(customer, subId);
    if (!userId) throw new Error("sin usuario");
    const acceso = decidirAcceso(objeto, Date.now());
    await guardar(userId, {
      customer,
      subId,
      premium: acceso.premium,
      premium_hasta: acceso.premium_hasta,
      estado: acceso.estado,
      plan: acceso.plan,
      moneda: acceso.moneda,
      eventoEn
    });
    return;
  }

  const customer = idStripe(objeto.customer);
  const subId = idStripe(objeto.subscription);
  let userId = usuarioDe(objeto.metadata, objeto.client_reference_id);
  if (!userId) userId = await buscarUsuario(customer, subId);
  if (!userId) throw new Error("sin usuario");

  let sub: Record<string, unknown> | null = null;
  if (subId && clave) sub = await stripeGet("subscriptions/" + encodeURIComponent(subId), clave);

  if (evento.type === "invoice.payment_failed") {
    const acceso = sub
      ? decidirAcceso(sub, Date.now())
      : { premium: false, premium_hasta: null, estado: "past_due", plan: null, moneda: null };
    const quitar = acceso.estado === "past_due" || acceso.estado === "unpaid" ||
      acceso.estado === "canceled" || acceso.estado === "incomplete" || !sub;
    await guardar(userId, {
      customer,
      subId,
      premium: quitar ? false : acceso.premium,
      premium_hasta: acceso.premium_hasta,
      estado: quitar ? (acceso.estado === "active" || acceso.estado === "trialing" ? "past_due" : acceso.estado) : acceso.estado,
      plan: acceso.plan,
      moneda: acceso.moneda,
      eventoEn
    });
    return;
  }

  const acceso = sub
    ? decidirAcceso(sub, Date.now())
    : { premium: true, premium_hasta: null, estado: "active", plan: null, moneda: null };
  await guardar(userId, {
    customer,
    subId,
    premium: acceso.premium,
    premium_hasta: acceso.premium_hasta,
    estado: acceso.estado,
    plan: acceso.plan,
    moneda: acceso.moneda,
    eventoEn
  });
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ ok: false }, 405);
  if (!env("STRIPE_WEBHOOK_SECRET") || !env("SUPABASE_SERVICE_ROLE_KEY") || !env("SUPABASE_URL")) {
    return json({ ok: false, error: "Faltan secretos" }, 500);
  }
  const crudo = await req.text();
  const ok = await firmaValida(crudo, req.headers.get("stripe-signature") || "", env("STRIPE_WEBHOOK_SECRET"));
  if (!ok) return json({ ok: false, error: "Firma" }, 400);

  let evento: { type?: string; livemode?: boolean; created?: number; data?: { object?: Record<string, unknown> } };
  try {
    evento = JSON.parse(crudo);
  } catch {
    return json({ ok: false }, 400);
  }
  if (evento.livemode === true && env("STRIPE_PERMITIR_REAL") !== "si") {
    return json({ ok: true, ignorado: "modo real" });
  }
  if (!evento.type || !EVENTOS.has(evento.type) || !evento.data || !evento.data.object) {
    return json({ ok: true, ignorado: evento.type || "vacio" });
  }
  try {
    await aplicar(evento as {
      type: string;
      created: number;
      data: { object: Record<string, unknown> };
    });
    return json({ ok: true });
  } catch (e) {
    console.error("webhook", evento.type, e instanceof Error ? e.message : "error");
    return json({ ok: false }, 500);
  }
});
