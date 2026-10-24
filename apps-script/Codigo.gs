/**
 * Formulario gratis de Granja Rentable.
 * Pegado en Extensiones → Apps Script de una hoja de Google.
 * Escribe registro, prueba de la app, altas de afiliado y la lista (tipo lead).
 * Además: tipo «compra» = alguien pulsó Comprar o un WhatsApp de producto en
 * la web. No lleva datos personales (ni correo ni consentimiento): se apunta
 * en la hoja y sale un correo de aviso a CORREO_AVISO.
 * OJO: es una INTENCIÓN de compra (el clic), no un pago confirmado.
 * Y tipo «pedido» = el cliente FINALIZÓ una compra desde el carrito de la
 * tienda (formulario con nombre, correo y dirección). Se apunta la fila con
 * el resumen COMPLETO del pedido en «interes» (sin el recorte de 140 de las
 * intenciones) y la dirección en «ref», y salen DOS correos: la confirmación
 * al cliente («se está procesando») y el aviso completo a CORREO_AVISO para
 * tramitarlo con el proveedor. Los pedidos NO se tramitan por WhatsApp.
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
    if (String(p.tipo || "") === "pedido") {
      /* Pedido REAL del carrito: lleva datos personales, exige el
         consentimiento del formulario, como los leads. El resumen del
         pedido viaja en «interes» SIN recorte (no es una intención:
         es el pedido entero, línea a línea) y la dirección en «ref». */
      if (String(p.consentimiento || "") !== "si") return json_({ ok: false, error: "sin_consentimiento" });
      var emailPed = String(p.email || "").trim();
      if (!emailPed || emailPed.indexOf("@") < 1) return json_({ ok: false, error: "sin_correo" });
      var nombrePed = String(p.nombre || "").slice(0, 160);
      var paisPed = String(p.pais || "").slice(0, 80);
      var direccionPed = String(p.direccion || "").slice(0, 400);
      var resumenPed = String(p.interes || "");
      var totalPed = String(p.total || "").slice(0, 60);
      var origenPed = String(p.origen || "").slice(0, 200);
      var conTrustap = String(p.proteccion_trustap || "") === "si";
      var importeTrustap = String(p.proteccion_importe || "").slice(0, 30);
      var metodoPago = String(p.metodo_pago || "").slice(0, 30);
      var paypalLink = String(p.paypal_link || "").slice(0, 300);
      var hojaPed = abrirHoja_();
      hojaPed.appendRow(COLUMNAS.map(function (col) {
        if (col === "fecha") return new Date();
        if (col === "tipo") return "pedido";
        if (col === "nombre") return nombrePed;
        if (col === "email") return emailPed;
        if (col === "metodo_pago") return metodoPago;
        if (col === "paypal") return paypalLink;
        if (col === "pais") return paisPed;
        if (col === "ref") return direccionPed;
        if (col === "interes") return resumenPed;
        if (col === "origen") return origenPed;
        if (col === "consentimiento") return "si";
        return "";
      }));
      var fechaPed = new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
      /* 1) Correo al CLIENTE: confirmación «se está procesando». */
      try {
        MailApp.sendEmail(
          emailPed,
          "Tu pedido en Granja Rentable se está procesando",
          "Hola, " + (nombrePed || "gracias por tu compra") + ":\n\n" +
          "Ya hemos recibido tu pedido en Granja Rentable y se está procesando. " +
          "Estos son los datos de tu pedido:\n\n" +
          resumenPed + "\n\n" +
          (conTrustap
            ? "🛡️ Tu compra está protegida con Trustap: el pago solo se libera " +
              "al proveedor cuando recibas tu pedido.\n\n"
            : "") +
          (metodoPago === "paypal" && paypalLink && !conTrustap
            ? "💳 Paga ahora tu pedido con PayPal: " + paypalLink + "\n" +
              "El importe ya va rellenado con el total de tu pedido. " +
              "Tu pedido empezará a prepararse cuando recibamos el pago.\n\n"
            : "") +
          "Cuando tu pedido salga, te enviaremos otro correo con el número de " +
          "seguimiento para que puedas seguirlo hasta tu casa.\n\n" +
          "Si tienes cualquier duda, responde a este correo.\n\n" +
          "— Granja Rentable"
        );
      } catch (ignoraCorreoCliente) {}
      /* 2) Aviso a PABLO con TODOS los datos para tramitar el pedido
         con el proveedor (a mano, como siempre). */
      try {
        MailApp.sendEmail(
          CORREO_AVISO,
          "🧾 Nuevo pedido en granjarentable.com",
          "Ha entrado un pedido nuevo desde el carrito de la tienda. " +
          "Hay que tramitarlo con el proveedor.\n\n" +
          "Cliente: " + nombrePed + "\n" +
          "Correo: " + emailPed + "\n" +
          "Dirección de envío: " + direccionPed + "\n" +
          "País de envío: " + paisPed + "\n" +
          "Total: " + totalPed + "\n" +
          "Protección Trustap: " + (conTrustap ? "SÍ (comisión " + importeTrustap + ")" : "no") + "\n" +
          "Método de pago: " + (conTrustap
            ? "Trustap (compra protegida)"
            : metodoPago === "paypal"
              ? "PayPal (comprueba el ingreso en tu PayPal)"
              : "A acordar por correo") + "\n" +
          "Página: " + origenPed + "\n" +
          "Fecha: " + fechaPed + "\n\n" +
          "----- Resumen del pedido -----\n" +
          resumenPed
        );
      } catch (ignoraCorreoAviso) {}
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

/* ===== Seguimiento: segundo correo al cliente =====
 * Cuando pablo tramita el pedido con el proveedor, pega el número de
 * seguimiento en la columna M («seguimiento») de la fila del pedido.
 * Este disparador (cada hora) detecta las filas de pedidos con
 * seguimiento y sin avisar, envía al cliente el correo «ya está en
 * camino» con su número y marca la columna N («seguimiento_enviado»)
 * con la fecha del envío. Ejecutar crearDisparador_() UNA vez desde el
 * editor para activar el disparador horario. */
function enviarSeguimientos() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActive();
    var hoja = ss.getSheetByName(HOJA);
    if (!hoja) return;
    var ultima = hoja.getLastRow();
    if (ultima < 2) return;
    var datos = hoja.getRange(2, 1, ultima - 1, 14).getValues();
    for (var i = 0; i < datos.length; i++) {
      var fila = datos[i];
      if (String(fila[1]) !== "pedido") continue;
      var seguimiento = String(fila[12] || "").trim();
      var yaEnviado = String(fila[13] || "").trim();
      if (!seguimiento || yaEnviado) continue;
      var email = String(fila[3] || "").trim();
      if (!email || email.indexOf("@") < 1) continue;
      var nombre = String(fila[2] || "");
      var resumen = String(fila[9] || "");
      var primeraLinea = resumen.split("\n").filter(function (l) {
        return l.indexOf("•") === 0;
      }).join("\n");
      var esCodigo = seguimiento.indexOf(" ") < 0 && seguimiento.length >= 8;
      try {
        MailApp.sendEmail(
          email,
          "📦 Tu pedido de Granja Rentable ya está en camino",
          "Hola, " + (nombre || "gracias por tu compra") + ":\n\n" +
          "¡Buenas noticias! Tu pedido de Granja Rentable ya salió y está en camino.\n\n" +
          (primeraLinea ? primeraLinea + "\n\n" : "") +
          "Número de seguimiento: " + seguimiento + "\n" +
          (esCodigo
            ? "Puedes seguirlo aquí: https://www.17track.net/es?nums=" + encodeURIComponent(seguimiento) + "\n"
            : "Puedes seguirlo en la web de la empresa de transporte con ese número.\n") +
          "\nSi tienes cualquier duda, responde a este correo.\n\n" +
          "— Granja Rentable"
        );
        hoja.getRange(i + 2, 14).setValue(new Date());
      } catch (ignora) {}
    }
  } finally {
    lock.releaseLock();
  }
}

function crearDisparador_() {
  var existentes = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existentes.length; i++) {
    if (existentes[i].getHandlerFunction() === "enviarSeguimientos") {
      ScriptApp.deleteTrigger(existentes[i]);
    }
  }
  ScriptApp.newTrigger("enviarSeguimientos").timeBased().everyHours(1).create();
}
