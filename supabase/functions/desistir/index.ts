// Botón de desistimiento. La Directiva (UE) 2023/2673 se aplica desde el 19 de junio de 2026.
// El plazo es el de las condiciones: 14 días naturales desde el primer cobro
// (y, si todavía no hubo cobro, 14 días desde el alta).
// Pide la devolución en invoice.payments (API basil). Si no puede devolver o no puede
// enviar el acuse, no cancela.

import { enviarAcuse } from "../_shared/acuse.mjs";
import {
  dentroDePlazo,
  devolucionYaHecha,
  esUuid,
  facturaExigeDevolucion,
  intencionesDePago
} from "../_shared/premium_estado.mjs";
import { env, json, usuarioDeJwt } from "../_shared/sesion.mjs";
import { stripeGet, stripePedir } from "../_shared/stripe_api.mjs";

function ipDe(req: Request): string {
  const directa = req.headers.get("cf-connecting-ip") || "";
  if (directa) return directa.slice(0, 80);
  const cadena = req.headers.get("x-forwarded-for") || "";
  return cadena.split(",")[0].trim().slice(0, 80);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: json(req, {}).headers });
  if (req.method !== "POST") return json(req, { error: "Método" }, 405);

  const stripe = env("STRIPE_SECRET_KEY");
  if (!stripe) return json(req, { error: "Próximamente. El pago todavía no está conectado." }, 503);

  let cuerpo: { confirmado?: boolean } = {};
  try {
    cuerpo = await req.json();
  } catch {
    cuerpo = {};
  }
  if (cuerpo.confirmado !== true) {
    return json(req, { error: "Confirma el desistimiento en Mi cuenta." }, 400);
  }

  const sesion = await usuarioDeJwt(req);
  if (sesion.error || !sesion.usuario) return json(req, { error: sesion.error || "Entra en tu cuenta." }, sesion.status || 401);
  if (!esUuid(sesion.usuario.id)) return json(req, { error: "La sesión no vale. Vuelve a entrar." }, 401);

  const correo = String(sesion.usuario.email || "").trim();
  if (!correo) return json(req, { error: "La cuenta no tiene correo. No podemos enviar el acuse." }, 409);

  const claveCorreo = env("RESEND_API_KEY");
  const desde = env("CORREO_DESDE");
  if (!claveCorreo || !desde) {
    return json(req, { error: "El acuse por correo no está conectado. No cancelamos la suscripción." }, 503);
  }

  const cab = { apikey: sesion.servicio, Authorization: "Bearer " + sesion.servicio };
  const lista = await fetch(
    sesion.base + "/rest/v1/suscripciones?select=stripe_subscription_id,estado&user_id=eq." + encodeURIComponent(sesion.usuario.id),
    { headers: cab }
  );
  if (!lista.ok) return json(req, { error: "No se pudieron leer las suscripciones." }, 500);
  const filas = await lista.json() as Array<{ stripe_subscription_id?: string; estado?: string }>;
  const vivas = filas.filter(function (f) {
    return f.stripe_subscription_id && f.estado !== "canceled" && f.estado !== "incomplete_expired";
  });
  if (!vivas.length) return json(req, { error: "No hay una suscripción que desistir." }, 404);

  const perfil = await fetch(
    sesion.base + "/rest/v1/perfiles?select=nombre&id=eq." + encodeURIComponent(sesion.usuario.id) + "&limit=1",
    { headers: cab }
  );
  let apodo = "";
  if (perfil.ok) {
    const nombres = await perfil.json() as Array<{ nombre?: string }>;
    apodo = nombres[0] && nombres[0].nombre ? String(nombres[0].nombre) : "";
  }

  const ahora = Date.now();
  const dentro: Array<{ id: string; pagos: string[] }> = [];
  let fuera = 0;

  for (const fila of vivas) {
    const id = String(fila.stripe_subscription_id);
    const leida = await stripeGet("subscriptions/" + encodeURIComponent(id), stripe);
    if (!leida.ok || !leida.data) {
      return json(req, { error: "Stripe no devolvió la suscripción. Sigue activa." }, 502);
    }
    const facturas = await stripeGet(
      "invoices?subscription=" + encodeURIComponent(id) + "&status=paid&limit=10&expand[]=data.payments",
      stripe
    );
    if (!facturas.ok) {
      return json(req, { error: "Stripe no devolvió las facturas. La suscripción sigue activa." }, 502);
    }
    const pagadas = ((facturas.data as { data?: Array<Record<string, unknown>> }).data) || [];
    const creada = Number((leida.data as { created?: number }).created);
    if (!Number.isFinite(creada) || creada <= 0) {
      return json(req, { error: "Stripe no dio la fecha del contrato. La suscripción sigue activa." }, 502);
    }
    if (!dentroDePlazo(creada, pagadas, ahora)) {
      fuera += 1;
      continue;
    }
    const pagos: string[] = [];
    for (const factura of pagadas) {
      if (!facturaExigeDevolucion(factura)) continue;
      const ids = intencionesDePago(factura);
      if (!ids.length) {
        return json(req, {
          error: "Hay un cobro y Stripe no dio el pago para devolverlo. La suscripción sigue activa."
        }, 502);
      }
      ids.forEach(function (pi) {
        if (pagos.indexOf(pi) === -1) pagos.push(pi);
      });
    }
    dentro.push({ id, pagos });
  }

  if (!dentro.length && fuera) {
    return json(req, {
      error: "Ya pasaron los 14 días desde el primer cobro. Cancela en Gestionar suscripción: sigues hasta el día que ya pagaste."
    }, 409);
  }

  const cuando = new Date();
  const ids = dentro.map(function (d) { return d.id; });
  const acuse = await enviarAcuse({
    clave: claveCorreo,
    desde,
    correo,
    apodo,
    suscripciones: ids,
    cuando
  });
  if (!acuse.ok) {
    return json(req, { error: "No se pudo enviar el acuse por correo. La suscripción sigue activa." }, 502);
  }

  const ip = ipDe(req);
  for (const item of dentro) {
    const alta = await fetch(sesion.base + "/rest/v1/desistimientos", {
      method: "POST",
      headers: Object.assign({ "Content-Type": "application/json", Prefer: "return=minimal" }, cab),
      body: JSON.stringify({
        user_id: sesion.usuario.id,
        stripe_subscription_id: item.id,
        pedido_en: cuando.toISOString(),
        ip: ip || null,
        correo
      })
    });
    if (!alta.ok) {
      return json(req, { error: "Enviamos el acuse, pero no se pudo guardar. La suscripción sigue activa." }, 500);
    }
  }

  for (const item of dentro) {
    for (const pi of item.pagos) {
      const dev = await stripePedir("refunds", stripe, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Idempotency-Key": "desistir-" + pi
        },
        body: "payment_intent=" + encodeURIComponent(pi) + "&metadata[motivo]=desistimiento"
      });
      if (!dev.ok && !devolucionYaHecha(dev.status, dev.data)) {
        return json(req, { error: "No se pudo pedir la devolución. La suscripción sigue activa. Escríbenos." }, 502);
      }
    }
    const baja = await stripePedir("subscriptions/" + encodeURIComponent(item.id), stripe, { method: "DELETE" });
    if (!baja.ok && baja.status !== 404) {
      return json(req, { error: "Pedimos la devolución, pero Stripe no canceló la suscripción." }, 502);
    }
  }

  const texto = fuera
    ? "Desististe de la suscripción reciente: queda cancelada y pedimos la devolución de lo cobrado. El acuse está en tu correo. Otra suscripción ya pasó de 14 días desde el primer cobro; esa se cancela en Gestionar suscripción."
    : "Desististe. Te enviamos el acuse por correo, cancelamos la suscripción y, si hubo un cobro, pedimos la devolución a Stripe.";
  return json(req, { ok: true, mensaje: texto });
});
