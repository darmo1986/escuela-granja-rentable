// Crea la sesión de pago en el servidor, con el id de quien ha entrado.
// El navegador solo dice «mensual» o «anual». No elige el precio ni el cliente de Stripe.
// Secretos: STRIPE_SECRET_KEY, STRIPE_PRECIO_MENSUAL, STRIPE_PRECIO_ANUAL.
// Hace falta la clave anon (SUPABASE_ANON_KEY). No se usa la service_role para leer el JWT.

import { esUuid } from "../_shared/premium_estado.mjs";
import { env, json, usuarioDeJwt, vueltaSegura } from "../_shared/sesion.mjs";
import { codificarForma, stripeForm, stripeGet, stripePedir } from "../_shared/stripe_api.mjs";

const DIAS_PRUEBA = "7";

function precioDe(plan: string): string {
  if (plan === "mensual") return env("STRIPE_PRECIO_MENSUAL");
  if (plan === "anual") return env("STRIPE_PRECIO_ANUAL");
  return "";
}

type FilaCliente = { stripe_customer_id?: string; prueba_usada?: boolean; checkout_en?: string };

function cabecera(servicio: string, prefer?: string): HeadersInit {
  const h: Record<string, string> = {
    apikey: servicio,
    Authorization: "Bearer " + servicio,
    "Content-Type": "application/json"
  };
  if (prefer) h.Prefer = prefer;
  return h;
}

async function leerCliente(base: string, servicio: string, userId: string): Promise<FilaCliente | null> {
  const res = await fetch(
    base + "/rest/v1/clientes_stripe?select=stripe_customer_id,prueba_usada,checkout_en&user_id=eq." + encodeURIComponent(userId) + "&limit=1",
    { headers: cabecera(servicio) }
  );
  if (!res.ok) return null;
  const filas = await res.json() as FilaCliente[];
  return filas[0] || null;
}

async function clienteDe(userId: string, email: string, clave: string): Promise<string> {
  const consulta = "metadata['user_id']:'" + userId + "'";
  const busqueda = await stripeGet("customers/search?query=" + encodeURIComponent(consulta), clave);
  const hallados = busqueda.ok && busqueda.data && (busqueda.data as { data?: Array<{ id?: string }> }).data;
  if (hallados && hallados[0] && hallados[0].id) return hallados[0].id;
  const pares: Array<[string, string]> = [["metadata[user_id]", userId]];
  if (email) pares.push(["email", email]);
  const alta = await stripeForm("customers", clave, pares, "POST", { "Idempotency-Key": "cliente-" + userId });
  const id = alta.ok && alta.data && (alta.data as { id?: string }).id;
  return id || "";
}

async function caducarSesiones(customer: string, clave: string): Promise<boolean> {
  const abiertas = await stripeGet(
    "checkout/sessions?customer=" + encodeURIComponent(customer) + "&status=open&limit=10",
    clave
  );
  if (!abiertas.ok) return false;
  const lista = ((abiertas.data as { data?: Array<{ id?: string }> }).data) || [];
  for (const sesion of lista) {
    if (!sesion.id) continue;
    const baja = await stripePedir(
      "checkout/sessions/" + encodeURIComponent(sesion.id) + "/expire",
      clave,
      { method: "POST" }
    );
    if (!baja.ok) return false;
  }
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: json(req, {}).headers });
  if (req.method !== "POST") return json(req, { error: "Método" }, 405);

  const clave = env("STRIPE_SECRET_KEY");
  if (!clave) return json(req, { error: "Próximamente. El pago todavía no está conectado." }, 503);

  const sesion = await usuarioDeJwt(req);
  if (sesion.error || !sesion.usuario) return json(req, { error: sesion.error || "Entra en tu cuenta." }, sesion.status || 401);
  if (!esUuid(sesion.usuario.id)) return json(req, { error: "La sesión no vale. Vuelve a entrar." }, 401);

  let cuerpo: { plan?: string; exito?: string; cancel?: string; acepto?: boolean } = {};
  try {
    cuerpo = await req.json();
  } catch {
    cuerpo = {};
  }
  const plan = cuerpo.plan === "mensual" ? "mensual" : (cuerpo.plan === "anual" ? "anual" : "");
  if (!plan) return json(req, { error: "Elige el plan mensual o el anual." }, 400);
  const precio = precioDe(plan);
  if (!precio) return json(req, { error: "Próximamente. El pago todavía no está conectado." }, 503);

  if (cuerpo.acepto !== true) {
    return json(req, { error: "Acepta las condiciones para continuar." }, 400);
  }

  const filasRes = await fetch(
    sesion.base + "/rest/v1/suscripciones?select=estado,vence&user_id=eq." + encodeURIComponent(sesion.usuario.id),
    { headers: { apikey: sesion.servicio, Authorization: "Bearer " + sesion.servicio } }
  );
  if (!filasRes.ok) return json(req, { error: "No se pudieron leer las suscripciones." }, 500);
  const filas = await filasRes.json() as Array<{ estado?: string; vence?: string }>;
  const viva = function (estado: string | undefined, vence: string | undefined) {
    if (estado !== "active" && estado !== "trialing" && estado !== "past_due") return false;
    const t = vence ? Date.parse(vence) : NaN;
    return Number.isFinite(t) && t > Date.now();
  };
  if (filas.some(function (f) { return viva(f.estado, f.vence); })) {
    return json(req, { error: "Ya tienes Premium. Cambia de plan en Gestionar suscripción." }, 409);
  }
  let yaProbo = filas.length > 0;

  const email = String(sesion.usuario.email || "");
  const previa = await leerCliente(sesion.base, sesion.servicio, sesion.usuario.id);
  if (previa && previa.prueba_usada) yaProbo = true;
  let customer = previa && previa.stripe_customer_id ? previa.stripe_customer_id : "";
  if (!customer) {
    customer = await clienteDe(sesion.usuario.id, email, clave);
    if (!customer) return json(req, { error: "Stripe no abrió la ficha del cliente." }, 502);
  }

  const ahoraIso = new Date().toISOString();
  const hace = new Date(Date.now() - 120000).toISOString();
  const altaCliente = await fetch(sesion.base + "/rest/v1/clientes_stripe", {
    method: "POST",
    headers: cabecera(sesion.servicio, "return=representation"),
    body: JSON.stringify({
      user_id: sesion.usuario.id,
      stripe_customer_id: customer,
      prueba_usada: yaProbo,
      checkout_en: ahoraIso
    })
  });
  if (!altaCliente.ok) {
    if (altaCliente.status !== 409) return json(req, { error: "No se pudo reservar el cliente." }, 500);
    const toma = await fetch(
      sesion.base + "/rest/v1/clientes_stripe?user_id=eq." + encodeURIComponent(sesion.usuario.id) +
        "&or=(checkout_en.is.null,checkout_en.lt." + encodeURIComponent(hace) + ")",
      {
        method: "PATCH",
        headers: cabecera(sesion.servicio, "return=representation"),
        body: JSON.stringify({ checkout_en: ahoraIso })
      }
    );
    const tomadas = toma.ok ? await toma.json() as FilaCliente[] : [];
    if (!tomadas.length) {
      return json(req, { error: "Ya se está abriendo un pago. Espera un momento y vuelve a pulsar." }, 409);
    }
    if (tomadas[0].stripe_customer_id) customer = tomadas[0].stripe_customer_id;
    if (tomadas[0].prueba_usada) yaProbo = true;
  }

  const soltar = async () => {
    await fetch(
      sesion.base + "/rest/v1/clientes_stripe?user_id=eq." + encodeURIComponent(sesion.usuario.id),
      {
        method: "PATCH",
        headers: cabecera(sesion.servicio, "return=minimal"),
        body: JSON.stringify({ checkout_en: null })
      }
    );
  };

  try {
    const remotas = await stripeGet(
      "subscriptions?customer=" + encodeURIComponent(customer) + "&status=all&limit=10",
      clave
    );
    if (!remotas.ok) return json(req, { error: "Stripe no confirmó si este cliente ya tuvo una prueba." }, 502);
    const otras = ((remotas.data as { data?: Array<{ status?: string }> }).data) || [];
    if (otras.length) yaProbo = true;
    if (otras.some(function (s) { return s.status === "active" || s.status === "trialing" || s.status === "past_due"; })) {
      return json(req, { error: "Ya tienes Premium. Cambia de plan en Gestionar suscripción." }, 409);
    }
    if (!(await caducarSesiones(customer, clave))) {
      return json(req, { error: "No se pudieron cerrar los pagos abiertos. Inténtalo otra vez." }, 502);
    }

    const exito = vueltaSegura(cuerpo.exito, "https://granjarentable.com/cuenta.html");
    const cancel = vueltaSegura(cuerpo.cancel, "https://granjarentable.com/premium.html");
    const exitoConSesion = exito + (exito.indexOf("?") === -1 ? "?" : "&") + "premium=ok&session_id={CHECKOUT_SESSION_ID}";
    const aceptoEn = new Date().toISOString();
    const avisoCasilla = "Pido que el contenido empiece durante la prueba y sé que, al acceder, pierdo el desistimiento. Aun así, en 14 días naturales desde el primer cobro devolvemos ese cobro.";

    const pares: Array<[string, string] | [string, string, string]> = [
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
      ["consent_collection[terms_of_service]", "required"],
      ["custom_text[terms_of_service_acceptance][message]", avisoCasilla],
      ["subscription_data[metadata][user_id]", sesion.usuario.id],
      ["subscription_data[metadata][acepto]", aceptoEn],
      ["metadata[user_id]", sesion.usuario.id],
      ["metadata[acepto]", aceptoEn]
    ];
    if (!yaProbo) pares.push(["subscription_data[trial_period_days]", DIAS_PRUEBA]);

    const alta = await stripeForm("checkout/sessions", clave, codificarForma(pares));
    const url = alta.ok && alta.data && (alta.data as { url?: string }).url;
    if (!url) return json(req, { error: "Stripe no abrió el pago. Revisa los precios y Stripe Tax." }, 502);
    return json(req, { url });
  } finally {
    await soltar();
  }
});
