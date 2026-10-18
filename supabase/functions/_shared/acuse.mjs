/** Texto del acuse (art. 11 bis): contenido, fecha y hora. Sin clave ni secreto. */
export function textoAcuse(opts) {
  var cuando = opts && opts.cuando instanceof Date ? opts.cuando : new Date();
  var hora = new Intl.DateTimeFormat("es-ES", {
    timeZone: "Atlantic/Canary",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short"
  }).format(cuando);
  var subs = (opts && opts.suscripciones || []).filter(Boolean).join(", ");
  return [
    "Acuse de recibo del desistimiento",
    "",
    "Granja Rentable ha recibido tu desistimiento del contrato de Premium.",
    "Contenido: desistimiento del contrato de suscripción Granja Rentable Premium" +
      (subs ? " (" + subs + ")" : "") + ".",
    "Apodo: " + ((opts && opts.apodo) || "—"),
    "Correo de respuesta: " + ((opts && opts.correo) || "—"),
    "Fecha y hora de recepción: " + hora + ".",
    "UTC: " + cuando.toISOString() + ".",
    "",
    "A continuación pedimos a Stripe la devolución de lo cobrado dentro del plazo y la cancelación de esa suscripción.",
    "Este mensaje es el acuse en soporte duradero. El correo de cancelación de Stripe no lo sustituye."
  ].join("\n");
}

/**
 * Envía el acuse con Resend. Si faltan RESEND_API_KEY o CORREO_DESDE, no envía.
 * No incluye la clave en el resultado.
 */
export async function enviarAcuse(opts) {
  var clave = String((opts && opts.clave) || "").trim();
  var desde = String((opts && opts.desde) || "").trim();
  var correo = String((opts && opts.correo) || "").trim();
  if (!clave || !desde || !correo) return { ok: false, falta: true };
  var res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + clave,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: desde,
      to: [correo],
      subject: "Acuse de desistimiento — Granja Rentable",
      text: textoAcuse(opts)
    })
  });
  return { ok: res.ok, status: res.status, falta: false };
}
