// Abre el portal de cliente de Stripe para que la persona cancele en dos clics.
// Exige el JWT de Supabase. La clave anon tiene que existir: no se sustituye por la service_role.

import { env, json, usuarioDeJwt, vueltaSegura } from "../_shared/sesion.mjs";
import { stripeForm } from "../_shared/stripe_api.mjs";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: json(req, {}).headers });
  if (req.method !== "POST") return json(req, { error: "Método" }, 405);

  const stripe = env("STRIPE_SECRET_KEY");
  if (!stripe) return json(req, { error: "El portal todavía no está conectado." }, 503);

  const sesion = await usuarioDeJwt(req);
  if (sesion.error || !sesion.usuario) return json(req, { error: sesion.error || "Entra en tu cuenta." }, sesion.status || 401);

  const filasRes = await fetch(
    sesion.base + "/rest/v1/suscripciones?select=stripe_customer_id&user_id=eq." + encodeURIComponent(sesion.usuario.id) + "&limit=1",
    { headers: { apikey: sesion.servicio, Authorization: "Bearer " + sesion.servicio } }
  );
  if (!filasRes.ok) return json(req, { error: "No se pudo leer la suscripción." }, 500);
  const filas = await filasRes.json() as Array<{ stripe_customer_id?: string }>;
  const customer = filas[0] && filas[0].stripe_customer_id;
  if (!customer) return json(req, { error: "Todavía no hay una suscripción en Stripe para esta cuenta." }, 404);

  let vuelta = "https://granjarentable.com/cuenta.html";
  try {
    const cuerpo = await req.json();
    vuelta = vueltaSegura(cuerpo && (cuerpo as { vuelta?: string }).vuelta);
  } catch {
    vuelta = "https://granjarentable.com/cuenta.html";
  }

  const alta = await stripeForm("billing_portal/sessions", stripe, [
    ["customer", customer],
    ["return_url", vuelta]
  ]);
  const url = alta.ok && alta.data && (alta.data as { url?: string }).url;
  if (!url) return json(req, { error: "Stripe no abrió el portal. Revisa la clave restringida." }, 502);
  return json(req, { url });
});
