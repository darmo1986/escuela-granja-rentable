// Abre el portal de cliente de Stripe para que la persona cancele en dos clics.
// Exige el JWT de Supabase (la persona tiene que haber entrado).
// Usa STRIPE_SECRET_KEY, la misma clave restringida del webhook, con permiso de portal.

function env(nombre: string): string {
  return String(Deno.env.get(nombre) || "").trim();
}

function origenPermitido(origin: string): boolean {
  if (origin === "https://granjarentable.com" || origin === "https://www.granjarentable.com") return true;
  if (origin === "https://darmo1986.github.io") return true;
  return /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
}

function cabeceras(req: Request): Headers {
  const h = new Headers({
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin"
  });
  const origin = req.headers.get("origin") || "";
  if (origenPermitido(origin)) h.set("Access-Control-Allow-Origin", origin);
  return h;
}

function json(req: Request, body: unknown, status = 200): Response {
  const h = cabeceras(req);
  h.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers: h });
}

function vueltaSegura(raw: unknown): string {
  const reserva = "https://granjarentable.com/cuenta.html";
  try {
    const u = new URL(String(raw || ""));
    const hostOk = u.hostname === "granjarentable.com" || u.hostname === "www.granjarentable.com" ||
      u.hostname === "darmo1986.github.io" || u.hostname === "127.0.0.1" || u.hostname === "localhost";
    if ((u.protocol !== "https:" && u.protocol !== "http:") || !hostOk) return reserva;
    if (!/\/(cuenta|premium)(?:\.html)?\/?$/.test(u.pathname)) return u.origin + "/cuenta.html";
    return u.origin + u.pathname;
  } catch {
    return reserva;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cabeceras(req) });
  if (req.method !== "POST") return json(req, { error: "Método" }, 405);

  const base = env("SUPABASE_URL").replace(/\/$/, "");
  const servicio = env("SUPABASE_SERVICE_ROLE_KEY");
  const anon = env("SUPABASE_ANON_KEY") || servicio;
  const stripe = env("STRIPE_SECRET_KEY");
  if (!base || !servicio) return json(req, { error: "Faltan secretos de Supabase." }, 500);
  if (!stripe) return json(req, { error: "El portal todavía no está conectado." }, 503);

  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt || jwt === anon || jwt === servicio) {
    return json(req, { error: "Entra en tu cuenta para gestionar la suscripción." }, 401);
  }

  const usuarioRes = await fetch(base + "/auth/v1/user", {
    headers: { apikey: anon, Authorization: "Bearer " + jwt }
  });
  if (!usuarioRes.ok) return json(req, { error: "La sesión no vale. Vuelve a entrar." }, 401);
  const usuario = await usuarioRes.json() as { id?: string };
  if (!usuario.id) return json(req, { error: "La sesión no vale. Vuelve a entrar." }, 401);

  const filasRes = await fetch(
    base + "/rest/v1/suscripciones?select=stripe_customer_id&user_id=eq." + encodeURIComponent(usuario.id) + "&limit=1",
    { headers: { apikey: servicio, Authorization: "Bearer " + servicio } }
  );
  if (!filasRes.ok) return json(req, { error: "No se pudo leer la suscripción." }, 500);
  const filas = await filasRes.json() as Array<{ stripe_customer_id?: string }>;
  const customer = filas[0] && filas[0].stripe_customer_id;
  if (!customer) {
    return json(req, { error: "Todavía no hay una suscripción en Stripe para esta cuenta." }, 404);
  }

  let vuelta = "https://granjarentable.com/cuenta.html";
  try {
    const cuerpo = await req.json();
    vuelta = vueltaSegura(cuerpo && (cuerpo as { vuelta?: string }).vuelta);
  } catch {
    vuelta = "https://granjarentable.com/cuenta.html";
  }

  const alta = await fetch("https://api.stripe.com/v1/billing_portal/sessions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + stripe,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({ customer, return_url: vuelta })
  });
  if (!alta.ok) return json(req, { error: "Stripe no abrió el portal. Revisa la clave restringida." }, 502);
  const sesion = await alta.json() as { url?: string };
  if (!sesion.url) return json(req, { error: "Stripe no devolvió la página." }, 502);
  return json(req, { url: sesion.url });
});
