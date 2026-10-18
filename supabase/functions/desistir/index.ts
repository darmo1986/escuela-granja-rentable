// Botón de desistimiento. La Directiva (UE) 2023/2673 se aplica desde el 19 de junio de 2026.
// Dentro de los 14 días cancela la suscripción y pide a Stripe la devolución de lo cobrado.
// Pasados esos días no cancela: la baja al final del periodo se hace en el portal.

import { esUuid } from "../_shared/premium_estado.mjs";
import { env, json, usuarioDeJwt } from "../_shared/sesion.mjs";
import { stripeGet, stripePedir } from "../_shared/stripe_api.mjs";

const CATORCE_DIAS = 14 * 24 * 60 * 60 * 1000;

function idDe(valor: unknown): string {
  if (typeof valor === "string") return valor;
  if (valor && typeof valor === "object" && typeof (valor as { id?: string }).id === "string") {
    return (valor as { id: string }).id;
  }
  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: json(req, {}).headers });
  if (req.method !== "POST") return json(req, { error: "Método" }, 405);

  const stripe = env("STRIPE_SECRET_KEY");
  if (!stripe) return json(req, { error: "Próximamente. El pago todavía no está conectado." }, 503);

  const sesion = await usuarioDeJwt(req);
  if (sesion.error || !sesion.usuario) return json(req, { error: sesion.error || "Entra en tu cuenta." }, sesion.status || 401);
  if (!esUuid(sesion.usuario.id)) return json(req, { error: "La sesión no vale. Vuelve a entrar." }, 401);

  const lista = await fetch(
    sesion.base + "/rest/v1/suscripciones?select=stripe_subscription_id,estado&user_id=eq." + encodeURIComponent(sesion.usuario.id),
    { headers: { apikey: sesion.servicio, Authorization: "Bearer " + sesion.servicio } }
  );
  if (!lista.ok) return json(req, { error: "No se pudieron leer las suscripciones." }, 500);
  const filas = await lista.json() as Array<{ stripe_subscription_id?: string; estado?: string }>;
  const vivas = filas.filter(function (f) {
    return f.stripe_subscription_id && f.estado !== "canceled" && f.estado !== "incomplete_expired";
  });
  if (!vivas.length) return json(req, { error: "No hay una suscripción que desistir." }, 404);

  const ahora = Date.now();
  let dentro = 0;
  let fuera = 0;
  for (const fila of vivas) {
    const id = String(fila.stripe_subscription_id);
    const leida = await stripeGet("subscriptions/" + encodeURIComponent(id), stripe);
    if (!leida.ok || !leida.data) return json(req, { error: "Stripe no devolvió la suscripción." }, 502);
    const creada = Number((leida.data as { created?: number }).created) * 1000;
    if (!Number.isFinite(creada) || ahora - creada > CATORCE_DIAS) {
      fuera += 1;
      continue;
    }
    const facturas = await stripeGet("invoices?subscription=" + encodeURIComponent(id) + "&status=paid&limit=10", stripe);
    const pagadas = facturas.ok && facturas.data ? (facturas.data as { data?: Array<Record<string, unknown>> }).data || [] : [];
    for (const factura of pagadas) {
      const pago = idDe(factura.payment_intent);
      const cargo = idDe(factura.charge);
      const cuerpo = pago
        ? "payment_intent=" + encodeURIComponent(pago)
        : (cargo ? "charge=" + encodeURIComponent(cargo) : "");
      if (!cuerpo) continue;
      const devolucion = await stripePedir("refunds", stripe, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: cuerpo
      });
      if (!devolucion.ok && devolucion.status !== 400) {
        return json(req, { error: "No se pudo pedir la devolución. La suscripción sigue activa. Escríbenos." }, 502);
      }
    }
    const baja = await stripePedir("subscriptions/" + encodeURIComponent(id), stripe, { method: "DELETE" });
    if (!baja.ok && baja.status !== 404) {
      return json(req, { error: "Pedimos la devolución, pero Stripe no canceló la suscripción." }, 502);
    }
    dentro += 1;
  }

  if (!dentro && fuera) {
    return json(req, {
      error: "Ya pasaron los 14 días. Cancela en Gestionar suscripción: sigues hasta el día que ya pagaste."
    }, 409);
  }
  const texto = fuera
    ? "Desististe de la suscripción reciente: queda cancelada y pedimos la devolución de lo cobrado. Otra suscripción ya pasó de 14 días; esa se cancela en Gestionar suscripción."
    : "Desististe. Cancelamos la suscripción y, si hubo un cobro, pedimos la devolución a Stripe.";
  return json(req, { ok: true, mensaje: texto });
});
