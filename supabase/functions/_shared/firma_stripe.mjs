/** Comprueba la cabecera Stripe-Signature. El cuerpo tiene que ser el texto crudo. */

function igual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function firmaValida(cuerpo, cabecera, secreto, ahoraSeg) {
  if (!cuerpo || !cabecera || !secreto) return false;
  var t = "";
  var firmas = [];
  String(cabecera).split(",").forEach(function (trozo) {
    var p = trozo.trim();
    var i = p.indexOf("=");
    if (i < 1) return;
    var k = p.slice(0, i);
    var v = p.slice(i + 1);
    if (k === "t") t = v;
    if (k === "v1" && /^[0-9a-f]+$/i.test(v)) firmas.push(v.toLowerCase());
  });
  if (!/^\d+$/.test(t) || !firmas.length) return false;
  var ahora = Number.isFinite(ahoraSeg) ? ahoraSeg : Date.now() / 1000;
  if (Math.abs(ahora - Number(t)) > 300) return false;
  var key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  var mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(t + "." + cuerpo));
  var hex = Array.from(new Uint8Array(mac)).map(function (b) {
    return b.toString(16).padStart(2, "0");
  }).join("");
  return firmas.some(function (f) { return igual(f, hex); });
}
