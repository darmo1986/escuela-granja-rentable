/**
 * Formulario gratis de Granja Rentable.
 * Pegado en Extensiones → Apps Script de una hoja de Google.
 * Escribe registro, prueba de la app y altas de afiliado.
 * No uses servicios de pago ni n8n: esta aplicación web es gratis.
 */
var HOJA = "Respuestas";
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
