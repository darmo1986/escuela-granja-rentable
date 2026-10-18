export function env(nombre) {
  return String(Deno.env.get(nombre) || "").trim();
}

export function origenPermitido(origin) {
  if (origin === "https://granjarentable.com" || origin === "https://www.granjarentable.com") return true;
  if (origin === "https://darmo1986.github.io") return true;
  return /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin);
}

export function cabeceras(req) {
  const h = new Headers({
    "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin"
  });
  const origin = req.headers.get("origin") || "";
  if (origenPermitido(origin)) h.set("Access-Control-Allow-Origin", origin);
  return h;
}

export function json(req, body, status = 200) {
  const h = cabeceras(req);
  h.set("Content-Type", "application/json");
  return new Response(JSON.stringify(body), { status, headers: h });
}

export function vueltaSegura(raw, reserva) {
  const caida = reserva || "https://granjarentable.com/cuenta.html";
  try {
    const u = new URL(String(raw || ""));
    const hostOk = u.hostname === "granjarentable.com" || u.hostname === "www.granjarentable.com" ||
      u.hostname === "darmo1986.github.io" || u.hostname === "127.0.0.1" || u.hostname === "localhost";
    if ((u.protocol !== "https:" && u.protocol !== "http:") || !hostOk) return caida;
    if (!/\/(cuenta|premium)(?:\.html)?$/.test(u.pathname)) return caida;
    return u.origin + u.pathname;
  } catch {
    return caida;
  }
}

export async function usuarioDeJwt(req) {
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  const anon = env("SUPABASE_ANON_KEY");
  const servicio = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !servicio) return { error: "Faltan secretos de Supabase.", status: 500 };
  if (!anon || anon === servicio) return { error: "Falta la clave anon de Supabase.", status: 500 };
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt || jwt === anon || jwt === servicio) {
    return { error: "Entra en tu cuenta.", status: 401 };
  }
  const respuesta = await fetch(base + "/auth/v1/user", {
    headers: { apikey: anon, Authorization: "Bearer " + jwt }
  });
  if (!respuesta.ok) return { error: "La sesión no vale. Vuelve a entrar.", status: 401 };
  const usuario = await respuesta.json();
  if (!usuario || !usuario.id) return { error: "La sesión no vale. Vuelve a entrar.", status: 401 };
  return { usuario, jwt, base, servicio, anon };
}
