/**
 * Formulario gratis de Granja Rentable.
 * Pegado en Extensiones → Apps Script de una hoja de Google.
 * Escribe registro, prueba de la app, altas de afiliado y la lista (tipo lead).
 * Además: tipo «compra» = alguien pulsó Comprar o un WhatsApp de producto en
 * la web. No lleva datos personales (ni correo ni consentimiento): se apunta
 * en la hoja y sale un correo de aviso a CORREO_AVISO.
 * OJO: es una INTENCIÓN de compra (el clic), no un pago confirmado.
 * No uses servicios de pago ni n8n: esta aplicación web es gratis.
 */
var HOJA = "Respuestas";
/* Correo que recibe el aviso de intención de compra. Cámbialo si hace falta. */
var CORREO_AVISO = "pablopersonal86@gmail.com";
var COLUMNAS = [
  "fecha", "tipo", "nombre", "email", "quiero_app", "metodo_pago",
  "paypal", "pais", "ref", "interes", "origen", "consentimiento"
];

function doGet() {
  return ContentService
    .createTextOutput("Granja Rentable: el formulario está publicado. Los datos entran por POST.")
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var p = leer_(e);
    if (p._gotcha) return json_({ ok: true });
    if (String(p.tipo || "") === "compra") {
      var producto = String(p.interes || "").slice(0, 140);
      var origen = String(p.origen || "").slice(0, 200);
      var hojaCompra = abrirHoja_();
      hojaCompra.appendRow(COLUMNAS.map(function (col) {
        if (col === "fecha") return new Date();
        if (col === "tipo") return "compra";
        if (col === "interes") return producto;
        if (col === "origen") return origen;
        return "";
      }));
      try {
        MailApp.sendEmail(
          CORREO_AVISO,
          "🛒 Intención de compra en granjarentable.com",
          "Alguien ha pulsado «Comprar» o un WhatsApp de producto en la web.\n\n" +
          "Producto: " + producto + "\n" +
          "Página: " + origen + "\n" +
          "Fecha: " + new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" }) + "\n\n" +
          "Ojo: es una intención (el clic), no un pago confirmado. " +
          "La venta se confirma en la tienda (Stripe) o en la conversación de WhatsApp."
        );
      } catch (ignoraCorreo) {}
      return json_({ ok: true });
    }
    if (String(p.consentimiento || "") !== "si") return json_({ ok: false, error: "sin_consentimiento" });
    var email = String(p.email || "").trim();
    if (!email || email.indexOf("@") < 1) return json_({ ok: false, error: "sin_correo" });
    if (String(p.tipo || "") === "beta" && !/@gmail\.com$/i.test(email)) {
      return json_({ ok: false, error: "gmail" });
    }
    var hoja = abrirHoja_();
    hoja.appendRow(COLUMNAS.map(function (col) {
      if (col === "fecha") return new Date();
      return p[col] || "";
    }));
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function leer_(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  if (e && e.postData && e.postData.contents) {
    try {
      var body = JSON.parse(e.postData.contents);
      Object.keys(body).forEach(function (k) {
        if (p[k] == null || p[k] === "") p[k] = body[k];
      });
    } catch (ignore) {}
  }
  return p;
}

function abrirHoja_() {
  var ss = SpreadsheetApp.getActive();
  var hoja = ss.getSheetByName(HOJA);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA);
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
  } else if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
