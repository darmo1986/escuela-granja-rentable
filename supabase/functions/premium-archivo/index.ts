// Enlace de descarga de un archivo Premium. Caduca a los 120 segundos.
// Ese plazo está fijo aquí: el navegador no lo elige.
// Solo firma la service_role, y solo si la cuenta sigue siendo Premium.

import { esUuid } from "../_shared/premium_estado.mjs";
import { json, usuarioDeJwt } from "../_shared/sesion.mjs";

const CADUCA_SEGUNDOS = 120;

function rutaValida(valor: unknown): string {
  const ruta = String(valor || "");
  if (!/^[a-zA-Z0-9._/-]{1,160}$/.test(ruta) || ruta.indexOf("..") !== -1) return "";
  return ruta;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: json(req, {}).headers });
  if (req.method !== "POST") return json(req, { error: "Método" }, 405);

  const sesion = await usuarioDeJwt(req);
  if (sesion.error || !sesion.usuario) return json(req, { error: sesion.error || "Entra en tu cuenta." }, sesion.status || 401);
  if (!esUuid(sesion.usuario.id)) return json(req, { error: "La sesión no vale. Vuelve a entrar." }, 401);

  let cuerpo: { ruta?: string } = {};
  try {
    cuerpo = await req.json();
  } catch {
    cuerpo = {};
  }
  const ruta = rutaValida(cuerpo.ruta);
  if (!ruta) return json(req, { error: "Ruta no válida." }, 400);

  const cab = { apikey: sesion.servicio, Authorization: "Bearer " + sesion.servicio };
  const perfilRes = await fetch(
    sesion.base + "/rest/v1/perfiles?select=premium,premium_hasta&id=eq." + encodeURIComponent(sesion.usuario.id) + "&limit=1",
    { headers: cab }
  );
  if (!perfilRes.ok) return json(req, { error: "No se pudo comprobar la suscripción." }, 500);
  const perfiles = await perfilRes.json() as Array<{ premium?: boolean; premium_hasta?: string | null }>;
  const perfil = perfiles[0];
  const hasta = perfil && perfil.premium_hasta ? Date.parse(perfil.premium_hasta) : NaN;
  if (!perfil || !perfil.premium || !Number.isFinite(hasta) || hasta <= Date.now()) {
    return json(req, { error: "Esta cuenta no es Premium." }, 403);
  }

  const piezaRes = await fetch(
    sesion.base + "/rest/v1/contenido_premium?select=archivo&archivo=eq." + encodeURIComponent(ruta) + "&limit=1",
    { headers: cab }
  );
  if (!piezaRes.ok) return json(req, { error: "No se pudo comprobar el archivo." }, 500);
  const piezas = await piezaRes.json() as Array<{ archivo?: string }>;
  if (!piezas.length) return json(req, { error: "Ese archivo no está publicado." }, 404);

  const limpia = ruta.split("/").map(encodeURIComponent).join("/");
  const firma = await fetch(sesion.base + "/storage/v1/object/sign/premium/" + limpia, {
    method: "POST",
    headers: { ...cab, "Content-Type": "application/json" },
    body: JSON.stringify({ expiresIn: CADUCA_SEGUNDOS })
  });
  if (!firma.ok) return json(req, { error: "No se pudo abrir el archivo." }, 404);
  const firmado = await firma.json() as { signedURL?: string; signedUrl?: string };
  const camino = firmado.signedURL || firmado.signedUrl || "";
  if (!camino) return json(req, { error: "No se pudo abrir el archivo." }, 502);
  const abs = camino.startsWith("http") ? camino : sesion.base + "/storage/v1" + camino;
  return json(req, { signedUrl: abs });
});
