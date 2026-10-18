export const STRIPE_VERSION = "2025-03-31.basil";

export async function stripePedir(ruta, clave, init) {
  const headers = new Headers((init && init.headers) || {});
  headers.set("Authorization", "Bearer " + clave);
  headers.set("Stripe-Version", STRIPE_VERSION);
  const res = await fetch("https://api.stripe.com/v1/" + ruta, Object.assign({}, init, { headers }));
  const texto = await res.text();
  let data = null;
  try {
    data = texto ? JSON.parse(texto) : null;
  } catch {
    data = null;
  }
  return { ok: res.ok, status: res.status, data };
}

export function stripeGet(ruta, clave) {
  return stripePedir(ruta, clave, { method: "GET" });
}

export function codificarForma(pares) {
  return pares.map(function (par) {
    var enc = encodeURIComponent(String(par[1]));
    if (par[2] === "sesion") enc = enc.replace("%7BCHECKOUT_SESSION_ID%7D", "{CHECKOUT_SESSION_ID}");
    return encodeURIComponent(par[0]) + "=" + enc;
  }).join("&");
}

export function stripeForm(ruta, clave, cuerpo, method, extra) {
  return stripePedir(ruta, clave, {
    method: method || "POST",
    headers: Object.assign({ "Content-Type": "application/x-www-form-urlencoded" }, extra || {}),
    body: typeof cuerpo === "string" ? cuerpo : codificarForma(cuerpo)
  });
}
