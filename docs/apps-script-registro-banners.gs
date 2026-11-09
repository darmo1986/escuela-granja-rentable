/**
 * AÑADIR al proyecto de Apps Script «Granja Rentable formularios».
 * No sustituye doGet ni doPost. El pago de Stripe no está en este
 * repositorio (ebooks llama a Codigo-stripe-ebooks.gs, que no está aquí).
 *
 * URL /exec que ya usan los ebooks, y que debe seguir siendo la misma:
 * https://script.google.com/macros/s/AKfycbyeSZCE95DI1wdls0MiNoKdh92i8ve0GkkJHy4GAY3p4pWsBCRhs0hb3bmUMTV-Xw0Wzw/exec
 *
 * Dónde va el if, sin tocar las ramas de Stripe, compra, pedido o formulario:
 *
 * 1. doGet tiene que recibir el evento. Si hoy es function doGet() { ... },
 *    cámbialo a function doGet(e) y pon ESTO como primeras líneas, antes
 *    de cualquier return:
 *
 *      if (e && String((e.parameter || {}).accion || "") === "banner") {
 *        return registrarBanner_(e);
 *      }
 *
 * 2. En doPost, justo después de leer el cuerpo y del cebo (_gotcha),
 *    y ANTES del if de tipo "stripe-ebook", "compra" o "pedido":
 *
 *      if (String(p.accion || "") === "banner") return registrarBanner_(e);
 *
 *    accion=banner no coincide con accion=crear ni accion=confirmar,
 *    que son las del pago. Esas ramas siguen igual.
 *
 * Despliegue (la URL no debe cambiar):
 * 1. Abre la hoja ligada a «Granja Rentable formularios».
 * 2. Extensiones → Apps Script.
 * 3. Pega este archivo al final del proyecto. No borres el código de Stripe.
 * 4. Añade los dos if de arriba.
 * 5. Implementar → Gestionar implementaciones → el lápiz de la aplicación
 *    web que ya termina en /exec → Nueva versión → Implementar.
 *    Quién tiene acceso: Cualquiera. No crees una implementación nueva.
 * 6. En el editor, ejecuta resumenBanners una vez para crear la hoja.
 *    Opcional: ejecuta crearDisparadorResumenBanners_ una vez para
 *    rehacer el resumen cada día.
 */

function celdaTexto_(valor) {
  var s = String(valor == null ? "" : valor);
  if (/^[=+\-@]/.test(s)) return "'" + s;
  return s;
}

var HOJA_BANNERS = "Registro banners";
var HOJA_RESUMEN_BANNERS = "Resumen banners";
var COLUMNAS_BANNERS = ["fecha", "banner", "evento", "página", "referrer"];

function registrarBanner_(e) {
  var p = (e && e.parameter) ? e.parameter : {};
  if (e && e.postData && e.postData.contents && e.postData.type &&
      e.postData.type.indexOf("application/x-www-form-urlencoded") === 0) {
    e.postData.contents.split("&").forEach(function (par) {
      var trozos = par.split("=");
      var clave = decodeURIComponent((trozos[0] || "").replace(/\+/g, " "));
      var valor = decodeURIComponent((trozos.slice(1).join("=") || "").replace(/\+/g, " "));
      if (!p[clave]) p[clave] = valor;
    });
  }
  var fecha = String(p.fecha || "");
  var banner = String(p.banner || "");
  var evento = String(p.evento || "");
  var pagina = String(p.pagina || p["página"] || "");
  var referrer = String(p.referrer || "");
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(fecha)) return jsonBanner_({ ok: false, error: "fecha" });
  if (!/^[a-z0-9-]{1,40}$/.test(banner)) return jsonBanner_({ ok: false, error: "banner" });
  if (evento !== "impresion" && evento !== "clic") return jsonBanner_({ ok: false, error: "evento" });
  if (!/^\/[A-Za-z0-9._~/-]{0,180}$/.test(pagina)) return jsonBanner_({ ok: false, error: "pagina" });
  if (referrer && !/^[A-Za-z0-9.-]{1,80}$/.test(referrer)) return jsonBanner_({ ok: false, error: "referrer" });
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var hoja = abrirHojaBanners_();
    hoja.appendRow([
      celdaTexto_(fecha.slice(0, 25)),
      celdaTexto_(banner),
      celdaTexto_(evento),
      celdaTexto_(pagina),
      celdaTexto_(referrer)
    ]);
    return jsonBanner_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function abrirHojaBanners_() {
  var ss = SpreadsheetApp.getActive();
  var hoja = ss.getSheetByName(HOJA_BANNERS);
  if (!hoja) {
    hoja = ss.insertSheet(HOJA_BANNERS);
    hoja.appendRow(COLUMNAS_BANNERS);
    hoja.setFrozenRows(1);
  } else if (hoja.getLastRow() === 0) {
    hoja.appendRow(COLUMNAS_BANNERS);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function resumenBanners() {
  var origen = abrirHojaBanners_();
  var ultima = origen.getLastRow();
  var totales = {};
  if (ultima >= 2) {
    var filas = origen.getRange(2, 1, ultima - 1, 5).getValues();
    filas.forEach(function (fila) {
      var dia = String(fila[0] || "").slice(0, 10);
      var banner = String(fila[1] || "");
      var evento = String(fila[2] || "");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dia) || !banner) return;
      var clave = dia + "\t" + banner;
      if (!totales[clave]) totales[clave] = { dia: dia, banner: banner, impresiones: 0, clics: 0 };
      if (evento === "impresion") totales[clave].impresiones += 1;
      if (evento === "clic") totales[clave].clics += 1;
    });
  }
  var ss = SpreadsheetApp.getActive();
  var hoja = ss.getSheetByName(HOJA_RESUMEN_BANNERS);
  if (!hoja) hoja = ss.insertSheet(HOJA_RESUMEN_BANNERS);
  hoja.clear();
  hoja.appendRow(["fecha", "banner", "impresiones", "clics", "ctr"]);
  hoja.setFrozenRows(1);
  var claves = Object.keys(totales).sort();
  claves.forEach(function (clave) {
    var fila = totales[clave];
    var ctr = fila.impresiones ? fila.clics / fila.impresiones : 0;
    hoja.appendRow([celdaTexto_(fila.dia), celdaTexto_(fila.banner), fila.impresiones, fila.clics, ctr]);
  });
  if (claves.length) hoja.getRange(2, 5, claves.length, 1).setNumberFormat("0.00%");
}

function crearDisparadorResumenBanners_() {
  var existentes = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existentes.length; i++) {
    if (existentes[i].getHandlerFunction() === "resumenBanners") {
      ScriptApp.deleteTrigger(existentes[i]);
    }
  }
  ScriptApp.newTrigger("resumenBanners").timeBased().everyDays(1).create();
}

function jsonBanner_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
