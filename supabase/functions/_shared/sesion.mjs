export function env(nombre) {
  return String(Deno.env.get(nombre) || "").trim();
}

function entornoLocal() {
  return env("ENTORNO") === "local";
}

export function origenPermitido(origin) {
  if (origin === "https://granjarentable.com" || origin === "https://www.granjarentable.com") return true;
  if (origin === "https://darmo1986.github.io") return true;
  if (!entornoLocal()) return false;
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
    const local = entornoLocal() && (u.hostname === "127.0.0.1" || u.hostname === "localhost");
    const hostOk = u.hostname === "granjarentable.com" || u.hostname === "www.granjarentable.com" ||
      u.hostname === "darmo1986.github.io" || local;
    if (u.protocol !== "https:" && !local) return caida;
    if (!hostOk) return caida;
    if (!/\/(cuenta|premium)(?:\.html)?$/.test(u.pathname)) return caida;
    return u.origin + u.pathname;
  } catch {
    return caida;
  }
}

/**
 * Siempre devuelve las mismas claves. error vacío significa que la sesión vale.
 * @returns {Promise<{error:string,status:number,usuario:any,jwt:string,base:string,servicio:string,anon:string}>}
 */
export async function usuarioDeJwt(req) {
  const vacio = function (error, status, base, servicio, anon) {
    return { error: error, status: status, usuario: null, jwt: "", base: base || "", servicio: servicio || "", anon: anon || "" };
  };
  const base = env("SUPABASE_URL").replace(/\/$/, "");
  const anon = env("SUPABASE_ANON_KEY");
  const servicio = env("SUPABASE_SERVICE_ROLE_KEY");
  if (!base || !servicio) return vacio("Faltan secretos de Supabase.", 500, base, servicio, anon);
  if (!anon || anon === servicio) return vacio("Falta la clave anon de Supabase.", 500, base, servicio, anon);
  const jwt = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!jwt || jwt === anon || jwt === servicio) return vacio("Entra en tu cuenta.", 401, base, servicio, anon);
  const respuesta = await fetch(base + "/auth/v1/user", {
    headers: { apikey: anon, Authorization: "Bearer " + jwt }
  });
  if (!respuesta.ok) return vacio("La sesión no vale. Vuelve a entrar.", 401, base, servicio, anon);
  const usuario = await respuesta.json();
  if (!usuario || !usuario.id) return vacio("La sesión no vale. Vuelve a entrar.", 401, base, servicio, anon);
  return { error: "", status: 0, usuario: usuario, jwt: jwt, base: base, servicio: servicio, anon: anon };
}
