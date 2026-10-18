// Crea la sesión de pago en el servidor, con el id de quien ha entrado.
// El navegador solo dice «mensual» o «anual». No elige el precio ni el cliente de Stripe.
// Secretos: STRIPE_SECRET_KEY, STRIPE_PRECIO_MENSUAL, STRIPE_PRECIO_ANUAL.
// Hace falta la clave anon (SUPABASE_ANON_KEY). No se usa la service_role para leer el JWT.

import { esUuid } from "../_shared/premium_estado.mjs";
import { env, json, usuarioDeJwt, vueltaSegura } from "../_shared/sesion.mjs";
import { codificarForma, stripeForm, stripeGet } from "../_shared/stripe_api.mjs";

const DIAS_PRUEBA = "7";

function precioDe(plan: string): string {
  if (plan === "mensual") return env("STRIPE_PRECIO_MENSUAL");
  if (plan === "anual") return env("STRIPE_PRECIO_ANUAL");
  return "";
}

async function clienteDe(userId: string, email: string, clave: string, base: string, servicio: string): Promise<string> {
  const guardado = await fetch(
    base + "/rest/v1/suscripciones?select=stripe_customer_id&user_id=eq." + encodeURIComponent(userId) + "&stripe_customer_id=not.is.null&limit=1",
    { headers: { apikey: servicio, Authorization: "Bearer " + servicio } }
  );
  if (guardado.ok) {
    const filas = await guardado.json() as Array<{ stripe_customer_id?: string }>;
    if (filas[0] && filas[0].stripe_customer_id) return filas[0].stripe_customer_id;
  }
  const consulta = "metadata['user_id']:'" + userId + "'";
  const busqueda = await stripeGet("customers/search?query=" + encodeURIComponent(consulta), clave);
  const hallados = busqueda.ok && busqueda.data && (busqueda.data as { data?: Array<{ id?: string }> }).data;
  if (hallados && hallados[0] && hallados[0].id) return hallados[0].id;
  const pares: Array<[string, string]> = [["metadata[user_id]", userId]];
  if (email) pares.push(["email", email]);
  const alta = await stripeForm("customers", clave, pares);
  const id = alta.ok && alta.data && (alta.data as { id?: string }).id;
  if (!id) return "";
  return id;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: json(req, {}).headers });
  if (req.method !== "POST") return json(req, { error: "Método" }, 405);

  const clave = env("STRIPE_SECRET_KEY");
  if (!clave) return json(req, { error: "Próximamente. El pago todavía no está conectado." }, 503);

  const sesion = await usuarioDeJwt(req);
  if (sesion.error || !sesion.usuario) return json(req, { error: sesion.error || "Entra en tu cuenta." }, sesion.status || 401);
  if (!esUuid(sesion.usuario.id)) return json(req, { error: "La sesión no vale. Vuelve a entrar." }, 401);

  let cuerpo: { plan?: string; exito?: string; cancel?: string } = {};
  try {
    cuerpo = await req.json();
  } catch {
    cuerpo = {};
  }
  const plan = cuerpo.plan === "mensual" ? "mensual" : (cuerpo.plan === "anual" ? "anual" : "");
  if (!plan) return json(req, { error: "Elige el plan mensual o el anual." }, 400);
  const precio = precioDe(plan);
  if (!precio) return json(req, { error: "Próximamente. El pago todavía no está conectado." }, 503);

  const email = String(sesion.usuario.email || "");
  const customer = await clienteDe(sesion.usuario.id, email, clave, sesion.base, sesion.servicio);
  if (!customer) return json(req, { error: "Stripe no abrió la ficha del cliente." }, 502);

  const exito = vueltaSegura(cuerpo.exito, "https://granjarentable.com/cuenta.html");
  const cancel = vueltaSegura(cuerpo.cancel, "https://granjarentable.com/premium.html");
  const exitoConSesion = exito + (exito.indexOf("?") === -1 ? "?" : "&") + "premium=ok&session_id={CHECKOUT_SESSION_ID}";

  const alta = await stripeForm("checkout/sessions", clave, codificarForma([
    ["mode", "subscription"],
    ["customer", customer],
    ["client_reference_id", sesion.usuario.id],
    ["success_url", exitoConSesion, "sesion"],
    ["cancel_url", cancel],
    ["line_items[0][price]", precio],
    ["line_items[0][quantity]", "1"],
    ["billing_address_collection", "required"],
    ["automatic_tax[enabled]", "true"],
    ["customer_update[address]", "auto"],
    ["subscription_data[trial_period_days]", DIAS_PRUEBA],
    ["subscription_data[metadata][user_id]", sesion.usuario.id],
    ["metadata[user_id]", sesion.usuario.id]
  ]));
  const url = alta.ok && alta.data && (alta.data as { url?: string }).url;
  if (!url) return json(req, { error: "Stripe no abrió el pago. Revisa los precios y Stripe Tax." }, 502);
  return json(req, { url });
});
