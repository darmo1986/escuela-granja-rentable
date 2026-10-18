// Cierra la cuenta. Antes cancela en Stripe cada suscripción que siga viva,
// para que el cobro no continúe cuando la fila ya no exista.

import { esUuid } from "../_shared/premium_estado.mjs";
import { env, json, usuarioDeJwt } from "../_shared/sesion.mjs";
import { stripePedir } from "../_shared/stripe_api.mjs";

async function cancelar(base: string, servicio: string, stripe: string, userId: string): Promise<string> {
  const lista = await fetch(
    base + "/rest/v1/suscripciones?select=stripe_subscription_id,estado&user_id=eq." + encodeURIComponent(userId),
    { headers: { apikey: servicio, Authorization: "Bearer " + servicio } }
  );
  if (!lista.ok) return "No se pudieron leer las suscripciones.";
  const filas = await lista.json() as Array<{ stripe_subscription_id?: string; estado?: string }>;
  const vivas = filas.filter(function (f) {
    return f.stripe_subscription_id && f.estado !== "canceled" && f.estado !== "incomplete_expired";
  });
  if (vivas.length && !stripe) return "No se puede cerrar la cuenta mientras el pago no esté conectado, porque no podríamos cancelar el cobro.";
  for (const fila of vivas) {
    const id = String(fila.stripe_subscription_id);
    const baja = await stripePedir("subscriptions/" + encodeURIComponent(id), stripe, { method: "DELETE" });
    if (!baja.ok && baja.status !== 404) return "Stripe no canceló la suscripción. La cuenta sigue abierta.";
  }
  return "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: json(req, {}).headers });
  if (req.method !== "POST") return json(req, { error: "Método" }, 405);

  const sesion = await usuarioDeJwt(req);
  if (sesion.error || !sesion.usuario) return json(req, { error: sesion.error || "Entra en tu cuenta." }, sesion.status || 401);
  if (!esUuid(sesion.usuario.id)) return json(req, { error: "La sesión no vale. Vuelve a entrar." }, 401);

  const fallo = await cancelar(sesion.base, sesion.servicio, env("STRIPE_SECRET_KEY"), sesion.usuario.id);
  if (fallo) return json(req, { error: fallo }, fallo.indexOf("no esté conectado") === -1 ? 502 : 503);

  const baja = await fetch(sesion.base + "/auth/v1/admin/users/" + encodeURIComponent(sesion.usuario.id), {
    method: "DELETE",
    headers: { apikey: sesion.servicio, Authorization: "Bearer " + sesion.servicio }
  });
  if (!baja.ok) return json(req, { error: "Se canceló el cobro, pero no se pudo borrar la cuenta. Escríbenos." }, 502);
  return json(req, { ok: true });
});
