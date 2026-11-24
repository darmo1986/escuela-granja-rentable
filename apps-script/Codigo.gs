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
 * Tipos de captura de la mejora 6 (misma hoja, no crear otra):
 *   contacto, calculadora, curso, video.
 * El tipo lead (lista y calendario) también entra en el seguimiento de
 * novedades, porque ya consiente «esta lista y novedades».
 * No uses servicios de pago ni n8n: esta aplicación web es gratis.
 *
 * SEGUIMIENTO DE LEADS (día 0 y día 3): DESACTIVADO por defecto.
 * No se envía ningún correo de seguimiento hasta que Pablo lo autorice
 * y se pongan ENVIO_ACTIVO=true y DRY_RUN=false. Ver enviarSeguimientoLeads().
 * NO confundir con enviarSeguimientos() (número de seguimiento de PEDIDOS,
 * columnas M y N). Esa función no se toca.
 */
var HOJA = "Respuestas";
/* Correo que recibe el aviso de intención de compra. Cámbialo si hace falta. */
var CORREO_AVISO = "pablopersonal86@gmail.com";
/* Respuestas de consulta y reply-to de los seguimientos. */
var CORREO_VENTAS = "ventas@granjarentable.com";
var COLUMNAS = [
  "fecha", "tipo", "nombre", "email", "quiero_app", "metodo_pago",
  "paypal", "pais", "ref", "interes", "origen", "consentimiento"
];
/* Columnas extra de la mejora 6. Se AÑADEN al final de la fila de cabecera
   (después de M «seguimiento» y N «seguimiento_enviado» de los pedidos,
   o más a la derecha si ya hay otras). Nunca se insertan en medio. */
var COLUMNAS_SEGUIMIENTO = [
  "mensaje", "token_baja", "baja", "dia0_enviado", "dia3_enviado", "tema"
];
/* Tipos que reciben (cuando esté activo) el correo del día 0 y del día 3. */
var TIPOS_SEGUIMIENTO_LEAD = {
  contacto: true,
  calculadora: true,
  curso: true,
  video: true,
  lead: true
};

/* ===== Interruptores de envío de SEGUIMIENTO DE LEADS (mejora 6) =====
 * Por defecto no se envía nada. Calidad debe hacer QC en seco.
 * Pablo autoriza el encendido. Entonces:
 *   1) dejar DRY_RUN=true y ENVIO_ACTIVO=true, ejecutar enviarSeguimientoLeads
 *      y revisar la hoja (debe escribir «DRY_RUN …» en dia0/dia3, sin MailApp);
 *   2) cuando Calidad y Pablo den el OK, DRY_RUN=false.
 * El aviso a CORREO_AVISO/VENTAS de una consulta (tipo contacto) usa el
 * mismo par de interruptores: con DRY_RUN o ENVIO_ACTIVO=false no sale. */
var ENVIO_ACTIVO = false;
var DRY_RUN = true;
var LIMITE_CORREOS_POR_PASADA = 40;
var SITE = "https://granjarentable.com";
var URL_EBOOKS = SITE + "/ebooks/";
var URL_CURSO = SITE + "/curso.html";
var URL_PRIVACIDAD = SITE + "/privacidad.html";
var URL_YOUTUBE_JOIN = "https://www.youtube.com/@GranjaRentable/join";
var URL_FACEBOOK = "https://www.facebook.com/GranjaRentable";
var URL_DESCARGAS = SITE + "/descargas/";
var URL_HOJA_PUESTA = SITE + "/hoja-registro-puesta.html";
var URL_EBOOK_PIENSO_HACER = SITE + "/ebooks/#pienso-hacer";
var URL_EBOOK_PIENSO_ELEGIR = SITE + "/ebooks/#pienso-elegir";
var URL_EBOOK_EMPEZAR = SITE + "/ebooks/#guia-empezar";
var URL_EBOOK_PONEDORAS = SITE + "/ebooks/#alimenta-ponedoras";
var URL_GUIA_10_PONEDORAS = SITE + "/blog/empezar-con-10-gallinas-ponedoras.html";
var URL_TABLA_PIENSO = SITE + "/blog/pienso-iniciador-pollitos.html";

function doGet(e) {
  var token = (e && e.parameter && e.parameter.baja) ? String(e.parameter.baja).trim() : "";
  if (token) return baja_(token);
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
    var email = String(p.email || p.correo || "").trim();
    if (!email || email.indexOf("@") < 1) return json_({ ok: false, error: "sin_correo" });
    if (String(p.tipo || "") === "beta" && !/@gmail\.com$/i.test(email)) {
      return json_({ ok: false, error: "gmail" });
    }
    p.email = email;
    if (String(p.tipo || "") === "contacto") {
      var motivo = String(p.motivo || p.interes || "").slice(0, 120);
      var mensaje = String(p.mensaje || "").slice(0, 3000);
      p.interes = motivo;
      p.mensaje = mensaje;
    }
    var hoja = abrirHoja_();
    hoja.appendRow(COLUMNAS.map(function (col) {
      if (col === "fecha") return new Date();
      return p[col] || "";
    }));
    if (TIPOS_SEGUIMIENTO_LEAD[String(p.tipo || "")]) {
      prepararFilaSeguimientoLead_(hoja, p);
      if (String(p.tipo || "") === "contacto") {
        avisarConsultaContacto_(p);
      }
    }
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
  asegurarColumnasSeguimiento_(hoja);
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

/* ===== Mejora 6: captura y correos día 0 / día 3 ===== */

function asegurarColumnasSeguimiento_(hoja) {
  /* enviarSeguimientos() lee el seguimiento de pedidos en las columnas 13 y 14
     (M y N) por posición, no por nombre. Si la hoja solo tiene A–L, hay que
     reservar M y N antes de añadir las columnas de leads; si no, mensaje y
     token_baja ocuparían esas posiciones y se romperían los correos de paquete. */
  var ultimaCol = Math.max(hoja.getLastColumn(), COLUMNAS.length);
  if (ultimaCol < 14) {
    hoja.getRange(1, 13, 1, 2).setValues([["seguimiento", "seguimiento_enviado"]]);
    ultimaCol = 14;
  }
  var cabecera = hoja.getRange(1, 1, 1, ultimaCol).getValues()[0];
  var hay = {};
  var i;
  for (i = 0; i < cabecera.length; i++) {
    var nombre = String(cabecera[i] || "").trim();
    if (nombre) hay[nombre] = true;
  }
  var anadidas = [];
  for (i = 0; i < COLUMNAS_SEGUIMIENTO.length; i++) {
    if (!hay[COLUMNAS_SEGUIMIENTO[i]]) anadidas.push(COLUMNAS_SEGUIMIENTO[i]);
  }
  if (!anadidas.length) return;
  hoja.getRange(1, ultimaCol + 1, 1, anadidas.length).setValues([anadidas]);
}

function mapaCabecera_(hoja) {
  var ultimaCol = Math.max(hoja.getLastColumn(), 1);
  var cabecera = hoja.getRange(1, 1, 1, ultimaCol).getValues()[0];
  var mapa = {};
  for (var i = 0; i < cabecera.length; i++) {
    var nombre = String(cabecera[i] || "").trim();
    if (nombre) mapa[nombre] = i + 1;
  }
  return mapa;
}

function prepararFilaSeguimientoLead_(hoja, p) {
  asegurarColumnasSeguimiento_(hoja);
  var mapa = mapaCabecera_(hoja);
  var fila = hoja.getLastRow();
  var token = Utilities.getUuid();
  if (mapa.token_baja) hoja.getRange(fila, mapa.token_baja).setValue(token);
  if (mapa.mensaje && p.mensaje) hoja.getRange(fila, mapa.mensaje).setValue(String(p.mensaje).slice(0, 3000));
  if (mapa.tema) hoja.getRange(fila, mapa.tema).setValue(inferirTema_(p));
}

function puedeEnviar_() {
  return ENVIO_ACTIVO === true && DRY_RUN === false;
}

function marcarEnvio_(hoja, fila, col, valor) {
  if (col) hoja.getRange(fila, col).setValue(valor);
}

function avisarConsultaContacto_(p) {
  var cuerpo =
    "Ha entrado una consulta desde el formulario de contacto (ya no es un mailto).\n\n" +
    "Nombre: " + String(p.nombre || "") + "\n" +
    "Correo: " + String(p.email || "") + "\n" +
    "Motivo: " + String(p.interes || p.motivo || "") + "\n" +
    "Página: " + String(p.origen || "") + "\n" +
    "Fecha: " + new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" }) + "\n\n" +
    "----- Mensaje -----\n" +
    String(p.mensaje || "");
  if (!puedeEnviar_()) {
    /* Con el envío apagado la consulta queda SOLO en la hoja Respuestas.
       Hay que mirar la pestaña hasta que Pablo encienda los interruptores. */
    return;
  }
  try {
    MailApp.sendEmail({
      to: CORREO_AVISO,
      cc: CORREO_VENTAS,
      replyTo: String(p.email || CORREO_VENTAS),
      name: "Granja Rentable",
      subject: "Nueva consulta en granjarentable.com",
      body: cuerpo
    });
  } catch (ignoraAviso) {}
}

function urlBaja_(token) {
  /* ScriptApp.getService().getUrl() es la URL /exec de esta implementación. */
  var url = ScriptApp.getService().getUrl() || "";
  return url + (url.indexOf("?") >= 0 ? "&" : "?") + "baja=" + encodeURIComponent(token);
}

function ahoraMadrid_() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Madrid" }));
}

function diasEntre_(fecha, ahora) {
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) return -1;
  var a = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  var b = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

function normalizarTema_(v) {
  v = String(v || "").toLowerCase().trim();
  if (v === "pienso" || v === "ponedoras" || v === "empezar") return v;
  if (/pienso|alimento|saco|coste-docena|coste_docena|comedero/.test(v)) return "pienso";
  if (/ponedoras|puesta|yema|alimenta-ponedoras/.test(v)) return "ponedoras";
  if (/empezar|inicio|incub|lista/.test(v)) return "empezar";
  return "";
}

function temaDesdeUbicacion_(path, hash, interes) {
  var t = ((path || "") + " " + (hash || "") + " " + (interes || "")).toLowerCase();
  if (/#coste-docena|#alimento|#sacos|pienso-hacer|pienso-elegir|pienso-iniciador|l04a|l04b/.test(t)) return "pienso";
  if (/alimenta-ponedoras|ponedoras|puesta|l05/.test(t)) return "ponedoras";
  if (/guia-empezar|empezar-con-10|lista\.html|l01|l02|l03/.test(t)) return "empezar";
  return "empezar";
}

function inferirTema_(p) {
  var n = normalizarTema_(p && p.tema);
  if (n) return n;
  var origen = String((p && p.origen) || "");
  var path = origen, hash = "";
  var i = origen.indexOf("#");
  if (i >= 0) {
    path = origen.slice(0, i);
    hash = origen.slice(i);
  }
  try {
    if (origen && origen.indexOf("http") === 0) {
      /* URL completa: nos quedamos con ruta y ancla. */
      var corte = origen.split("?")[0];
      var proto = corte.indexOf("://");
      if (proto >= 0) {
        var slash = corte.indexOf("/", proto + 3);
        corte = slash >= 0 ? corte.slice(slash) : "/";
      }
      i = corte.indexOf("#");
      if (i >= 0) {
        path = corte.slice(0, i);
        hash = corte.slice(i);
      } else {
        path = corte;
        hash = "";
      }
    }
  } catch (ignoraUrl) {}
  return temaDesdeUbicacion_(path, hash, (p && (p.interes || p.motivo)) || "");
}

function cierreBaja_(fila) {
  var baja = urlBaja_(fila.token_baja);
  return "\n\nSi no quieres más correos nuestros, date de baja aquí:\n" + baja +
    "\n\nLa política de privacidad está en " + URL_PRIVACIDAD +
    "\n\n— Granja Rentable";
}

function bloqueMembresia_() {
  return "Si te interesa, hay una membresía de 2,99 € al mes en YouTube, con vídeos exclusivos (como el de genética de ponedoras):\n" +
    URL_YOUTUBE_JOIN + "\n" +
    "También está la suscripción de la página en Facebook: " + URL_FACEBOOK;
}

function bloqueRegalo_() {
  return "Las hojas de registro de Granja Rentable son gratis (puesta diaria, finanzas, salud, engorde e incubación). Se descargan aquí, sin pago:\n" +
    URL_DESCARGAS;
}

function textoCorreoDia_(dia, fila) {
  var nombre = String(fila.nombre || "").trim();
  var saludo = nombre ? ("Hola, " + nombre + ":") : "Hola:";
  var tema = inferirTema_({ tema: fila.tema, origen: fila.origen, interes: fila.interes });
  var prefijo = "";
  if (dia === 0 && fila.tipo === "contacto") {
    prefijo = "Hemos recibido tu consulta en Granja Rentable. Te responderemos a este mismo correo. " +
      "Si te urge, escríbenos también a " + CORREO_VENTAS + ".\n\n";
  }
  var cuerpo;
  if (dia === 0) {
    if (tema === "pienso") {
      cuerpo = "Gracias por dejar tu correo en Granja Rentable.\n\n" +
        bloqueRegalo_() + "\n\n" +
        "Si estás comparando sacos, también tienes esta tabla gratuita del pienso iniciador:\n" +
        URL_TABLA_PIENSO + "\n\n" +
        "El curso gratis está en " + URL_CURSO + "\n\n" +
        "Si quieres profundizar en la alimentación, en la web hay dos ebooks a 3,00 USD cada uno (se compran ahí, no van adjuntos):\n" +
        "Cómo hacer tu propio pienso: " + URL_EBOOK_PIENSO_HACER + "\n" +
        "Cómo elegir el pienso: " + URL_EBOOK_PIENSO_ELEGIR + "\n\n" +
        bloqueMembresia_();
    } else if (tema === "ponedoras") {
      cuerpo = "Gracias por dejar tu correo en Granja Rentable.\n\n" +
        bloqueRegalo_() + "\n" +
        "Para anotar huevos y pienso también está la hoja de puesta, que se descarga sin dejar el correo: " + URL_HOJA_PUESTA + "\n\n" +
        "Y una guía gratuita para empezar con diez ponedoras:\n" + URL_GUIA_10_PONEDORAS + "\n\n" +
        "El curso gratis está en " + URL_CURSO + "\n\n" +
        "Si quieres profundizar, el ebook «Alimenta bien a tus ponedoras» cuesta 3,00 USD y se compra en la web:\n" +
        URL_EBOOK_PONEDORAS + "\n\n" +
        bloqueMembresia_();
    } else {
      cuerpo = "Gracias por dejar tu correo en Granja Rentable.\n\n" +
        bloqueRegalo_() + "\n\n" +
        "El curso gratis de avicultura está en " + URL_CURSO + "\n\n" +
        "Si estás empezando, también puedes usar la hoja de puesta y pienso (se descarga sin correo):\n" +
        URL_HOJA_PUESTA + "\n\n" +
        "Si quieres profundizar, el ebook «Guía para empezar tu granja» cuesta 3,00 USD y se compra en la web:\n" +
        URL_EBOOK_EMPEZAR + "\n\n" +
        bloqueMembresia_();
    }
  } else {
    /* Día 3 */
    if (tema === "pienso") {
      cuerpo = "Hace unos días nos dejaste tu correo en Granja Rentable. Te escribo por si no tuviste un momento para descargar las hojas de registro gratis:\n" +
        URL_DESCARGAS + "\n\n" +
        "Si estás en el pienso, la tabla gratuita del iniciador sigue aquí: " + URL_TABLA_PIENSO + "\n\n" +
        "Y si quieres el método completo, estos dos ebooks cuestan 3,00 USD cada uno y se compran en la web:\n" +
        "Cómo hacer tu propio pienso: " + URL_EBOOK_PIENSO_HACER + "\n" +
        "Cómo elegir el pienso: " + URL_EBOOK_PIENSO_ELEGIR + "\n\n" +
        "El curso gratis sigue en " + URL_CURSO + "\n\n" +
        bloqueMembresia_();
    } else if (tema === "ponedoras") {
      cuerpo = "Hace unos días nos dejaste tu correo en Granja Rentable. Te escribo por si no tuviste un momento para descargar las hojas de registro gratis:\n" +
        URL_DESCARGAS + "\n\n" +
        "La guía gratuita para empezar con diez ponedoras está en " + URL_GUIA_10_PONEDORAS + "\n" +
        "La hoja de puesta y pienso, en " + URL_HOJA_PUESTA + "\n\n" +
        "Si quieres profundizar en la alimentación de las ponedoras, el ebook «Alimenta bien a tus ponedoras» cuesta 3,00 USD y se compra en la web:\n" +
        URL_EBOOK_PONEDORAS + "\n\n" +
        "El curso gratis sigue en " + URL_CURSO + "\n\n" +
        bloqueMembresia_();
    } else {
      cuerpo = "Hace unos días nos dejaste tu correo en Granja Rentable. Te escribo por si no tuviste un momento para mirar esto:\n\n" +
        "Las hojas de registro gratis: " + URL_DESCARGAS + "\n" +
        "El curso gratis: " + URL_CURSO + "\n\n" +
        "Si estás empezando y quieres la guía escrita, el ebook «Guía para empezar tu granja» cuesta 3,00 USD y se compra en la web:\n" +
        URL_EBOOK_EMPEZAR + "\n\n" +
        bloqueMembresia_();
    }
  }
  return saludo + "\n\n" + prefijo + cuerpo + cierreBaja_(fila);
}

function asuntoDia_(dia, tipo) {
  if (dia === 0 && tipo === "contacto") return "Hemos recibido tu consulta en Granja Rentable";
  if (dia === 0) return "Gracias por dejar tu correo en Granja Rentable";
  return "Por si te sirve: el curso, las hojas gratis y un ebook de tu tema";
}

/**
 * Disparador diario (o ejecución manual). Envía, o simula, los correos
 * de día 0 y día 3. Un solo correo de cada tipo por dirección, aunque
 * la persona haya rellenado varios formularios. Las filas antiguas sin
 * token_baja no se tocan (no hay seguimiento retrospectivo).
 */
function enviarSeguimientoLeads() {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var hoja = abrirHoja_();
    var ultima = hoja.getLastRow();
    if (ultima < 2) return;
    var mapa = mapaCabecera_(hoja);
    var ultimaCol = hoja.getLastColumn();
    var datos = hoja.getRange(2, 1, ultima - 1, ultimaCol).getValues();
    var ahora = ahoraMadrid_();
    var i;
    /* Primera pasada: estado por correo. */
    var porEmail = {};
    for (i = 0; i < datos.length; i++) {
      var rec = leerFilaSeguimiento_(datos[i], mapa);
      rec._fila = i + 2;
      if (!rec.email || rec.email.indexOf("@") < 1) continue;
      if (!TIPOS_SEGUIMIENTO_LEAD[rec.tipo]) continue;
      var clave = rec.email.toLowerCase();
      if (!porEmail[clave]) {
        porEmail[clave] = { baja: false, dia0: false, dia3: false, pendientes: [] };
      }
      var g = porEmail[clave];
      if (rec.baja) g.baja = true;
      if (rec.dia0_enviado) g.dia0 = true;
      if (rec.dia3_enviado) g.dia3 = true;
      if (rec.token_baja) g.pendientes.push(rec);
    }
    var enviados = 0;
    var claves = Object.keys(porEmail);
    for (i = 0; i < claves.length; i++) {
      var grupo = porEmail[claves[i]];
      if (grupo.baja) continue;
      if (!grupo.pendientes.length) continue;
      grupo.pendientes.sort(function (a, b) {
        return (a.fecha && b.fecha) ? (a.fecha - b.fecha) : 0;
      });
      var base = grupo.pendientes[0];
      var dias = diasEntre_(base.fecha, ahora);
      var cuales = [];
      if (!grupo.dia0 && dias >= 0) cuales.push(0);
      if (!grupo.dia3 && dias >= 3) cuales.push(3);
      for (var c = 0; c < cuales.length; c++) {
        if (enviados >= LIMITE_CORREOS_POR_PASADA) return;
        var dia = cuales[c];
        var colNombre = dia === 0 ? "dia0_enviado" : "dia3_enviado";
        var col = mapa[colNombre];
        var marca = (DRY_RUN || !ENVIO_ACTIVO)
          ? ("DRY_RUN " + ahora.toISOString())
          : new Date();
        if (puedeEnviar_()) {
          try {
            MailApp.sendEmail({
              to: base.email,
              replyTo: CORREO_VENTAS,
              name: "Granja Rentable",
              subject: asuntoDia_(dia, base.tipo),
              body: textoCorreoDia_(dia, base)
            });
          } catch (ignoraLead) {
            continue;
          }
        }
        marcarEnvio_(hoja, base._fila, col, marca);
        enviados++;
        if (dia === 0) grupo.dia0 = true;
        if (dia === 3) grupo.dia3 = true;
      }
    }
  } finally {
    lock.releaseLock();
  }
}

function leerFilaSeguimiento_(valores, mapa) {
  function val(nombre) {
    var col = mapa[nombre];
    return col ? valores[col - 1] : "";
  }
  var fecha = val("fecha");
  return {
    fecha: (fecha instanceof Date) ? fecha : (fecha ? new Date(fecha) : null),
    tipo: String(val("tipo") || "").trim(),
    nombre: String(val("nombre") || "").trim(),
    email: String(val("email") || "").trim(),
    token_baja: String(val("token_baja") || "").trim(),
    baja: String(val("baja") || "").trim(),
    dia0_enviado: String(val("dia0_enviado") || "").trim(),
    dia3_enviado: String(val("dia3_enviado") || "").trim(),
    tema: String(val("tema") || "").trim(),
    origen: String(val("origen") || "").trim(),
    interes: String(val("interes") || "").trim()
  };
}

function baja_(token) {
  var ok = false;
  try {
    var hoja = abrirHoja_();
    var mapa = mapaCabecera_(hoja);
    if (!mapa.token_baja || !mapa.baja) {
      return htmlBaja_("No se pudo completar la baja. Escríbenos a " + CORREO_VENTAS + ".");
    }
    var ultima = hoja.getLastRow();
    if (ultima >= 2) {
      var ultimaCol = hoja.getLastColumn();
      var datos = hoja.getRange(2, 1, ultima - 1, ultimaCol).getValues();
      var email = "";
      var i;
      for (i = 0; i < datos.length; i++) {
        if (String(datos[i][mapa.token_baja - 1] || "").trim() === token) {
          email = String(datos[i][(mapa.email || 4) - 1] || "").trim().toLowerCase();
          break;
        }
      }
      if (email) {
        var ahora = new Date();
        for (i = 0; i < datos.length; i++) {
          var em = String(datos[i][(mapa.email || 4) - 1] || "").trim().toLowerCase();
          if (em === email) {
            hoja.getRange(i + 2, mapa.baja).setValue(ahora);
            ok = true;
          }
        }
      }
    }
  } catch (ignoraBaja) {}
  if (ok) {
    return htmlBaja_("Listo. Hemos dado de baja tu correo. Ya no te enviaremos los seguimientos de Granja Rentable. Si era una consulta pendiente, puedes escribir a " + CORREO_VENTAS + ".");
  }
  return htmlBaja_("No hemos encontrado esa baja. Si sigues recibiendo correo, escríbenos a " + CORREO_VENTAS + " y lo dejamos apuntado a mano.");
}

function htmlBaja_(texto) {
  var html = "<!doctype html><html lang=\"es\"><head><meta charset=\"utf-8\">" +
    "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">" +
    "<title>Baja de correo · Granja Rentable</title></head><body " +
    "style=\"font-family:Georgia,serif;max-width:40rem;margin:2rem auto;padding:0 1rem;color:#17291e\">" +
    "<p><strong>Granja Rentable</strong></p><p>" + texto.replace(/</g, "") + "</p>" +
    "<p><a href=\"" + SITE + "\">Volver a granjarentable.com</a></p></body></html>";
  return HtmlService.createHtmlOutput(html)
    .setTitle("Baja de correo · Granja Rentable")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function crearDisparadorSeguimientoLeads_() {
  var existentes = ScriptApp.getProjectTriggers();
  for (var i = 0; i < existentes.length; i++) {
    if (existentes[i].getHandlerFunction() === "enviarSeguimientoLeads") {
      ScriptApp.deleteTrigger(existentes[i]);
    }
  }
  ScriptApp.newTrigger("enviarSeguimientoLeads").timeBased().everyDays(1).atHour(9).create();
}
