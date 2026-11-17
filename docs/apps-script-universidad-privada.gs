/**
 * AÑADIR al proyecto de Apps Script «Granja Rentable formularios».
 * No sustituye doGet ni doPost. No toca los ebooks, el Premium ni los banners.
 *
 * URL /exec que ya usan los ebooks (tiene que seguir siendo la misma):
 * https://script.google.com/macros/s/AKfycbyeSZCE95DI1wdls0MiNoKdh92i8ve0GkkJHy4GAY3p4pWsBCRhs0hb3bmUMTV-Xw0Wzw/exec
 *
 * Dónde va el if, sin tocar las ramas de stripe-ebook, asesoramiento,
 * compra, pedido, formulario o banner:
 *
 *   En doPost, justo después del cebo (_gotcha) y ANTES del if de
 *   tipo "stripe-ebook":
 *
 *     var respuestaUniversidad = universidadDesdeEvento_(e);
 *     if (respuestaUniversidad) return respuestaUniversidad;
 *
 *   universidadDesdeEvento_ devuelve null si el tipo no es "universidad",
 *   así que el resto del doPost sigue igual.
 *
 * Propiedades del script (Proyecto → Configuración del proyecto →
 * Propiedades del script). No reutilices la clave secreta de los ebooks
 * con otro nombre dentro de su código: esta suscripción lee solo las suyas.
 *
 *   UNI_MODO              "test" o "live". Si falta o no es exactamente
 *                         "live", se queda en test. Por defecto: test.
 *   STRIPE_SECRET_TEST    sk_test_...  Solo se usa en test.
 *   STRIPE_SECRET_LIVE    sk_live_...  Solo se usa en live. Puede ser el
 *                         mismo valor que la clave de los ebooks, copiado
 *                         aquí. No cambies la propiedad que ya usan los ebooks.
 *   UNI_PRUEBA            "si" abre el formulario de prueba en la web
 *                         (con ?prueba=1). Si falta, no hay checkout.
 *   UNI_FIRMA             texto largo y aleatorio para firmar la sesión.
 *   UNI_GOOGLE_CLIENT_ID  el Client ID (….apps.googleusercontent.com).
 *                         Vacío = Google no entra; el código por correo sí.
 *   UNI_URL_VENTAS        opcional. Por defecto
 *                         https://granjarentable.com/universidad.html
 *
 * El modo test nunca usa sk_live_, y el modo live nunca usa sk_test_.
 * Pasar a cobros reales: UNI_MODO = live, borrar UNI_PRUEBA, nueva versión
 * de ESTA implementación (la URL no cambia) y quitar el noindex de la página.
 *
 * Despliegue (la URL no debe cambiar):
 * 1. Abre la hoja ligada a «Granja Rentable formularios».
 * 2. Extensiones → Apps Script.
 * 3. Pega este archivo en el proyecto. No borres el código de Stripe de los ebooks.
 * 4. Añade el if de arriba.
 * 5. Rellena las propiedades. Deja UNI_MODO en test.
 * 6. Implementar → Gestionar implementaciones → el lápiz de la aplicación
 *    web que ya termina en /exec → Nueva versión → Implementar.
 *    Quién tiene acceso: Cualquiera. No crees una implementación nueva.
 */

var UNI_PRODUCTO = "universidad-privada-v1";
var UNI_IMPORTE = 1200;
var UNI_MONEDA = "eur";
var UNI_INTERVALO = "month";
var UNI_NOMBRE = "Universidad Granja Rentable";
var UNI_CONSENT = "digital-inmediato-v1";
var UNI_HOJA = "Universidad suscripciones";
var UNI_HOJA_CODIGOS = "Universidad codigos";
var UNI_COLUMNAS = ["email", "customer_id", "subscription_id", "status", "period_end", "session_id", "actualizado", "avisado"];
var UNI_COLUMNAS_CODIGO = ["email", "hash", "expira", "intentos"];
var UNI_CORREO_AVISO = "ventas@granjarentable.com";
var UNI_URL_DEFECTO = "https://granjarentable.com/universidad.html";

/* UNI_REGLAS_INICIO */
function uniCorreo_(valor) {
  var s = String(valor || "").trim().toLowerCase();
  if (s.length > 200 || s.length < 6) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return "";
  return s;
}

function uniModoEsLive_(valor) {
  return String(valor || "").trim() === "live";
}

function uniClaveSecreto_(modoLive) {
  return modoLive ? "STRIPE_SECRET_LIVE" : "STRIPE_SECRET_TEST";
}

function uniSecretoPermitido_(modoLive, secreto) {
  var s = String(secreto || "");
  if (modoLive) return s.indexOf("sk_live_") === 0;
  return s.indexOf("sk_test_") === 0;
}

function uniConsentimientoOk_(valor) {
  return String(valor || "") === "digital-inmediato-v1";
}

function uniPuedeCrear_(modoLive, pruebaAbierta, pruebaPeticion) {
  if (modoLive) return true;
  return pruebaAbierta === true && String(pruebaPeticion || "") === "si";
}

function uniFinPeriodo_(sub) {
  if (!sub || typeof sub !== "object") return 0;
  if (sub.current_period_end) return Number(sub.current_period_end);
  var item = sub.items && sub.items.data && sub.items.data[0];
  if (item && item.current_period_end) return Number(item.current_period_end);
  return 0;
}

function uniPrecioOk_(precio) {
  if (!precio || typeof precio !== "object") return "precio";
  if (Number(precio.unit_amount) !== 1200) return "importe";
  if (String(precio.currency || "").toLowerCase() !== "eur") return "moneda";
  var rec = precio.recurring;
  if (!rec || rec.interval !== "month") return "intervalo";
  if (rec.interval_count && Number(rec.interval_count) !== 1) return "intervalo";
  return "";
}

function uniSuscripcionVigente_(sub, ahoraMs) {
  var ahora = Number(ahoraMs || 0);
  if (!sub || typeof sub !== "object" || typeof sub === "string") return "suscripcion";
  if ((sub.metadata || {}).producto !== "universidad-privada-v1") return "metadata";
  var estado = String(sub.status || "");
  if (estado !== "active" && estado !== "trialing") return "estado";
  var fin = uniFinPeriodo_(sub);
  if (!(fin * 1000 > ahora)) return "periodo";
  var item = sub.items && sub.items.data && sub.items.data[0];
  if (item && item.price && typeof item.price === "object") {
    var mal = uniPrecioOk_(item.price);
    if (mal) return mal;
  }
  return "";
}

function uniPagoOk_(sesion) {
  var pago = String((sesion && sesion.payment_status) || "");
  if (pago === "paid") return "";
  var estado = sesion && sesion.subscription && sesion.subscription.status;
  if (pago === "no_payment_required" && estado === "trialing") return "";
  return "pago";
}

function uniCorreoSesion_(sesion) {
  if (!sesion) return "";
  if (sesion.customer_details && sesion.customer_details.email) return uniCorreo_(sesion.customer_details.email);
  if (sesion.customer && typeof sesion.customer === "object" && sesion.customer.email) return uniCorreo_(sesion.customer.email);
  return "";
}

function uniSesionCobrable_(sesion, ahoraMs) {
  if (!sesion || typeof sesion !== "object") return "sesion";
  if (sesion.mode !== "subscription") return "modo";
  if (String(sesion.currency || "").toLowerCase() !== "eur") return "moneda";
  if (Number(sesion.amount_total) !== 1200) return "importe";
  if ((sesion.metadata || {}).producto !== "universidad-privada-v1") return "metadata";
  var malPago = uniPagoOk_(sesion);
  if (malPago) return malPago;
  var sub = sesion.subscription;
  var malSub = uniSuscripcionVigente_(sub, ahoraMs);
  if (malSub) return malSub;
  if (!uniCorreoSesion_(sesion)) return "email";
  var items = (sesion.line_items && sesion.line_items.data) || [];
  if (items.length !== 1) return "precio";
  return uniPrecioOk_(items[0].price);
}

function uniGoogleOk_(info, clientId, ahoraMs) {
  var ahora = Number(ahoraMs || 0);
  if (!info || typeof info !== "object" || info.error) return "google";
  var id = String(clientId || "");
  if (!/^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(id)) return "aud";
  if (info.aud !== id) return "aud";
  var iss = String(info.iss || "");
  if (iss !== "accounts.google.com" && iss !== "https://accounts.google.com") return "iss";
  if (String(info.email_verified) !== "true") return "email_verificado";
  if (!(Number(info.exp || 0) * 1000 > ahora)) return "exp";
  if (!uniCorreo_(info.email)) return "email";
  return "";
}
/* UNI_REGLAS_FIN */

function universidadDesdeEvento_(e) {
  var p = universidadLeer_(e);
  if (String(p.tipo || "") !== "universidad") return null;
  return universidadEntrada_(p);
}

function universidadEntrada_(p) {
  try {
    if (p && p._gotcha) return uniJson_({ ok: true });
    if (String(p.tipo || "") !== "universidad") return null;
    var accion = String(p.accion || "");
    if (accion === "estado") return uniEstado_();
    if (accion === "crear") return uniCrear_(p);
    if (accion === "confirmar") return uniConfirmar_(p);
    if (accion === "enviar_codigo") return uniEnviarCodigo_(p);
    if (accion === "verificar_codigo") return uniVerificarCodigo_(p);
    if (accion === "entrar_google") return uniEntrarGoogle_(p);
    if (accion === "acceso") return uniAcceso_(p);
    if (accion === "portal") return uniPortal_(p);
    return uniJson_({ ok: false, error: "accion" });
  } catch (err) {
    return uniJson_({ ok: false, error: "interno" });
  }
}

function universidadLeer_(e) {
  var p = {};
  var clave;
  if (e && e.parameter) {
    for (clave in e.parameter) if (Object.prototype.hasOwnProperty.call(e.parameter, clave)) p[clave] = e.parameter[clave];
  }
  var raw = e && e.postData && e.postData.contents;
  if (!raw) return p;
  var tipo = String((e.postData && e.postData.type) || "");
  if (raw.charAt(0) === "{" || tipo.indexOf("json") !== -1 || tipo.indexOf("text/plain") === 0) {
    try {
      var json = JSON.parse(raw);
      for (clave in json) if (Object.prototype.hasOwnProperty.call(json, clave)) p[clave] = json[clave];
    } catch (ignora) {}
  }
  return p;
}

function uniJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function uniProps_() {
  return PropertiesService.getScriptProperties();
}

function uniModoLive_() {
  return uniModoEsLive_(uniProps_().getProperty("UNI_MODO"));
}

function uniPruebaAbierta_() {
  if (uniModoLive_()) return false;
  return String(uniProps_().getProperty("UNI_PRUEBA") || "") === "si";
}

function uniFirma_() {
  var firma = String(uniProps_().getProperty("UNI_FIRMA") || "");
  if (firma.length < 24) return "";
  return firma;
}

function uniClientId_() {
  var id = String(uniProps_().getProperty("UNI_GOOGLE_CLIENT_ID") || "").trim();
  if (!/^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(id)) return "";
  return id;
}

function uniUrlVentas_() {
  var u = String(uniProps_().getProperty("UNI_URL_VENTAS") || UNI_URL_DEFECTO).trim().split("#")[0];
  if (u.indexOf("https://granjarentable.com/universidad.html") !== 0 &&
      u.indexOf("https://www.granjarentable.com/universidad.html") !== 0) {
    return UNI_URL_DEFECTO;
  }
  return u;
}

function uniSecreto_() {
  var live = uniModoLive_();
  var nombre = uniClaveSecreto_(live);
  var secreto = String(uniProps_().getProperty(nombre) || "");
  if (!uniSecretoPermitido_(live, secreto)) return "";
  return secreto;
}

function uniEstado_() {
  return uniJson_({
    ok: true,
    modo: uniModoLive_() ? "live" : "test",
    disponible: uniModoLive_(),
    prueba: uniPruebaAbierta_(),
    google: !!uniClientId_()
  });
}

function uniStripe_(metodo, ruta, params) {
  var secreto = uniSecreto_();
  if (!secreto) return { code: 0, body: { error: { message: "sin_secreto" } } };
  var opciones = {
    method: metodo,
    headers: { Authorization: "Bearer " + secreto },
    muteHttpExceptions: true
  };
  if (params) {
    opciones.payload = params;
    opciones.contentType = "application/x-www-form-urlencoded";
  }
  var res = UrlFetchApp.fetch("https://api.stripe.com" + ruta, opciones);
  var texto = res.getContentText() || "{}";
  var body;
  try { body = JSON.parse(texto); } catch (e) { body = {}; }
  return { code: res.getResponseCode(), body: body };
}

function uniErrorStripe_(body) {
  var msg = String(body && body.error && body.error.message || "");
  if (/portal|configuration/i.test(msg)) return "portal_no_configurado";
  if (msg === "sin_secreto") return "sin_secreto";
  return "stripe";
}

function uniCrear_(p) {
  var live = uniModoLive_();
  if (!uniPuedeCrear_(live, uniPruebaAbierta_(), p.prueba)) return uniJson_({ ok: false, error: "no_disponible" });
  if (!uniConsentimientoOk_(p.consentimiento)) return uniJson_({ ok: false, error: "sin_consentimiento" });
  if (!uniSecreto_()) return uniJson_({ ok: false, error: "sin_secreto" });
  var vuelta = uniUrlVentas_();
  var cuando = String(p.consentimiento_en || "").slice(0, 40);
  var creado = uniStripe_("post", "/v1/checkout/sessions", {
    mode: "subscription",
    locale: "es",
    success_url: vuelta + "?uni_session={CHECKOUT_SESSION_ID}",
    cancel_url: vuelta + "?uni_cancelado=1",
    "automatic_tax[enabled]": "false",
    "metadata[producto]": UNI_PRODUCTO,
    "metadata[consentimiento]": UNI_CONSENT,
    "metadata[consentimiento_en]": cuando,
    "subscription_data[metadata][producto]": UNI_PRODUCTO,
    "line_items[0][quantity]": "1",
    "line_items[0][price_data][currency]": UNI_MONEDA,
    "line_items[0][price_data][unit_amount]": String(UNI_IMPORTE),
    "line_items[0][price_data][tax_behavior]": "inclusive",
    "line_items[0][price_data][recurring][interval]": UNI_INTERVALO,
    "line_items[0][price_data][product_data][name]": UNI_NOMBRE,
    "line_items[0][price_data][product_data][metadata][producto]": UNI_PRODUCTO
  });
  var url = creado.body && creado.body.url;
  if (creado.code !== 200 || !url || String(url).indexOf("https://checkout.stripe.com/") !== 0) {
    return uniJson_({ ok: false, error: uniErrorStripe_(creado.body) });
  }
  return uniJson_({ ok: true, url: url });
}

function uniLeerSesion_(sessionId) {
  var id = String(sessionId || "");
  if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return null;
  if (uniModoLive_() && id.indexOf("cs_live_") !== 0) return null;
  if (!uniModoLive_() && id.indexOf("cs_test_") !== 0) return null;
  var ruta = "/v1/checkout/sessions/" + encodeURIComponent(id) +
    "?expand[]=line_items&expand[]=subscription&expand[]=customer";
  var leido = uniStripe_("get", ruta, null);
  if (leido.code !== 200) return null;
  return leido.body;
}

function uniConfirmar_(p) {
  if (!uniSecreto_()) return uniJson_({ ok: false, error: "sin_secreto" });
  var sesion = uniLeerSesion_(p.sessionId);
  if (!sesion) return uniJson_({ ok: false, error: "pago_no_confirmado" });
  var mal = uniSesionCobrable_(sesion, Date.now());
  if (mal) return uniJson_({ ok: false, error: "pago_no_confirmado" });
  var email = uniCorreoSesion_(sesion);
  var sub = sesion.subscription;
  var customerId = "";
  if (sesion.customer && typeof sesion.customer === "object") customerId = String(sesion.customer.id || "");
  else customerId = String(sesion.customer || "");
  var fin = uniFinPeriodo_(sub);
  var nuevo = uniGuardarSuscripcion_({
    email: email,
    customer_id: customerId,
    subscription_id: String(sub.id || ""),
    status: String(sub.status || ""),
    period_end: new Date(fin * 1000).toISOString(),
    session_id: String(sesion.id || "")
  });
  if (nuevo) uniAvisar_(email, fin);
  return uniJson_({ ok: true, email: email, producto: UNI_NOMBRE, clave: "universidad" });
}

function uniGuardarSuscripcion_(fila) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var hoja = uniHoja_(UNI_HOJA, UNI_COLUMNAS);
    var ultima = hoja.getLastRow();
    var encontrada = 0;
    var ya = false;
    if (ultima >= 2) {
      var valores = hoja.getRange(2, 1, ultima - 1, 8).getValues();
      for (var i = 0; i < valores.length; i++) {
        if (String(valores[i][0] || "") === fila.email || String(valores[i][5] || "") === fila.session_id) {
          encontrada = i + 2;
          ya = String(valores[i][7] || "") === "si";
          break;
        }
      }
    }
    var celdas = [fila.email, fila.customer_id, fila.subscription_id, fila.status, fila.period_end, fila.session_id, new Date().toISOString(), ya ? "si" : ""];
    if (encontrada) hoja.getRange(encontrada, 1, 1, 8).setValues([celdas]);
    else hoja.appendRow(celdas);
    return !ya;
  } finally {
    lock.releaseLock();
  }
}

function uniAvisar_(email, finSegundos) {
  var cuando = new Date(finSegundos * 1000).toLocaleString("es-ES", { timeZone: "Europe/Madrid" });
  var prueba = uniModoLive_() ? "" : "Esto es un pago de prueba de Stripe. No es un cobro real.\n\n";
  var texto = prueba +
    "Hemos registrado tu suscripción a la Universidad Granja Rentable (12 € al mes).\n\n" +
    "Para abrir el aula, entra en " + uniUrlVentas_() + "#acceso con este mismo correo (" + email + "), " +
    "con Google o con el código que te enviamos si lo pides en esa página.\n\n" +
    "Se renueva cada mes hasta que la canceles. Puedes cancelarla desde el aula, en «Gestionar o cancelar la suscripción». " +
    "Si cancelas al final del periodo, el acceso sigue hasta el " + cuando + " (hora de Madrid) y no se vuelve a cobrar.\n\n" +
    "— Granja Rentable";
  try {
    MailApp.sendEmail(email, "Universidad Granja Rentable: suscripción registrada", texto);
    MailApp.sendEmail(UNI_CORREO_AVISO, "Nueva suscripción Universidad Granja Rentable", "Correo: " + email + "\nFin del periodo: " + cuando + "\nModo: " + (uniModoLive_() ? "live" : "test"));
    uniMarcarAvisado_(email);
  } catch (ignora) {}
}

function uniMarcarAvisado_(email) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var hoja = uniHoja_(UNI_HOJA, UNI_COLUMNAS);
    var ultima = hoja.getLastRow();
    if (ultima < 2) return;
    var valores = hoja.getRange(2, 1, ultima - 1, 1).getValues();
    for (var i = 0; i < valores.length; i++) {
      if (String(valores[i][0] || "") === email) hoja.getRange(i + 2, 8).setValue("si");
    }
  } finally {
    lock.releaseLock();
  }
}

function uniFilaPorEmail_(email) {
  var hoja = uniHoja_(UNI_HOJA, UNI_COLUMNAS);
  var ultima = hoja.getLastRow();
  if (ultima < 2) return null;
  var valores = hoja.getRange(2, 1, ultima - 1, 8).getValues();
  for (var i = valores.length - 1; i >= 0; i--) {
    if (String(valores[i][0] || "") === email) {
      return {
        fila: i + 2,
        email: email,
        customer_id: String(valores[i][1] || ""),
        subscription_id: String(valores[i][2] || ""),
        status: String(valores[i][3] || ""),
        period_end: String(valores[i][4] || "")
      };
    }
  }
  return null;
}

function uniLeerSuscripcion_(id) {
  if (!/^sub_[A-Za-z0-9]+$/.test(String(id || ""))) return null;
  var leido = uniStripe_("get", "/v1/subscriptions/" + encodeURIComponent(id) + "?expand[]=customer", null);
  if (leido.code !== 200) return null;
  return leido.body;
}

function uniRefrescar_(fila) {
  var sub = uniLeerSuscripcion_(fila.subscription_id);
  if (!sub) return { ok: false, error: "pago_no_confirmado" };
  var correoStripe = sub.customer && typeof sub.customer === "object" ? uniCorreo_(sub.customer.email) : fila.email;
  if (!correoStripe || correoStripe !== fila.email) return { ok: false, error: "sin_suscripcion" };
  var mal = uniSuscripcionVigente_(sub, Date.now());
  var fin = uniFinPeriodo_(sub);
  var hoja = uniHoja_(UNI_HOJA, UNI_COLUMNAS);
  hoja.getRange(fila.fila, 3, 1, 3).setValues([[String(sub.id || fila.subscription_id), String(sub.status || ""), fin ? new Date(fin * 1000).toISOString() : ""]]);
  if (mal) return { ok: false, error: "sin_suscripcion" };
  return { ok: true, email: fila.email, hasta: new Date(fin * 1000).toISOString(), customer_id: fila.customer_id };
}

function uniTemas_() {
  return [
    {
      id: "genetica-ponedoras",
      titulo: "Primer tema: Genética de ponedoras",
      estado: "abierto",
      texto: "Cómo se hereda la puesta, qué anotar de cada gallina y cómo leer un árbol sencillo antes de cruzar. No promete más huevos. El vídeo de la clase se publica en esta aula. Todavía no hay un archivo de vídeo distinto del curso gratis."
    },
    {
      id: "chat",
      titulo: "Atención por chat",
      estado: "abierto",
      texto: "Por WhatsApp, mientras la suscripción esté activa. Orientación por escrito sobre el temario. No es una consulta veterinaria ni una respuesta inmediata. Respondemos en días laborables."
    },
    {
      id: "app",
      titulo: "App «Mi Gallinero»",
      estado: "proximamente",
      texto: "Árbol genealógico y registro de huevos por gallina. Próximamente: todavía no está en la suscripción."
    },
    {
      id: "pdfs",
      titulo: "PDFs descargables",
      estado: "proximamente",
      texto: "Próximamente: todavía no están en la suscripción."
    }
  ];
}

function uniEmitir_(email) {
  var firma = uniFirma_();
  if (!firma) return "";
  var exp = Date.now() + 12 * 60 * 60 * 1000;
  var cuerpo = uniB64_(email + "|" + String(exp));
  return cuerpo + "." + uniHmac_(cuerpo, firma);
}

function uniLeerToken_(token) {
  var firma = uniFirma_();
  if (!firma) return "";
  var partes = String(token || "").split(".");
  if (partes.length !== 2 || !uniIgual_(uniHmac_(partes[0], firma), partes[1])) return "";
  var plano = "";
  try { plano = Utilities.newBlob(Utilities.base64DecodeWebSafe(uniPad_(partes[0]))).getDataAsString(); }
  catch (e) { return ""; }
  var trozos = plano.split("|");
  if (trozos.length !== 2) return "";
  var email = uniCorreo_(trozos[0]);
  if (!email || !(Number(trozos[1]) > Date.now())) return "";
  return email;
}

function uniRespuestaAcceso_(email) {
  if (!uniFirma_()) return uniJson_({ ok: false, error: "firma_no_configurada" });
  if (!uniSecreto_()) return uniJson_({ ok: false, error: "sin_secreto" });
  var fila = uniFilaPorEmail_(email);
  if (!fila || !fila.subscription_id) return uniJson_({ ok: false, error: "sin_suscripcion" });
  var fresco = uniRefrescar_(fila);
  if (!fresco.ok) return uniJson_({ ok: false, error: fresco.error || "sin_suscripcion" });
  var token = uniEmitir_(email);
  if (!token) return uniJson_({ ok: false, error: "firma_no_configurada" });
  return uniJson_({
    ok: true,
    token: token,
    email: email,
    hasta: fresco.hasta,
    temas: uniTemas_(),
    whatsapp: "https://wa.me/34656267726?text=" + encodeURIComponent("Hola, soy suscriptor de la Universidad Granja Rentable")
  });
}

function uniEnviarCodigo_(p) {
  var email = uniCorreo_(p.email);
  if (!email) return uniJson_({ ok: false, error: "email" });
  if (!uniFirma_()) return uniJson_({ ok: false, error: "firma_no_configurada" });
  var cache = CacheService.getScriptCache();
  var cuenta = Number(cache.get("uni_n_" + email) || "0");
  if (cuenta >= 5) return uniJson_({ ok: true, enviado: true });
  cache.put("uni_n_" + email, String(cuenta + 1), 3600);
  var fila = uniFilaPorEmail_(email);
  if (fila) {
    var codigo = uniCodigo_();
    var expira = Date.now() + 15 * 60 * 1000;
    uniGuardarCodigo_(email, uniHashCodigo_(email, codigo), expira);
    try {
      MailApp.sendEmail(email, "Código para entrar en la Universidad Granja Rentable",
        "Tu código es " + codigo + ".\n\nCaduca en 15 minutos y solo sirve una vez.\nSi no lo has pedido, ignora este correo.\n\n— Granja Rentable");
    } catch (ignora) {}
  }
  return uniJson_({ ok: true, enviado: true });
}

function uniVerificarCodigo_(p) {
  var email = uniCorreo_(p.email);
  var codigo = String(p.codigo || "").replace(/\s+/g, "");
  if (!email || !/^\d{6}$/.test(codigo)) return uniJson_({ ok: false, error: "codigo_invalido" });
  if (!uniCodigoValido_(email, codigo)) return uniJson_({ ok: false, error: "codigo_invalido" });
  return uniRespuestaAcceso_(email);
}

function uniEntrarGoogle_(p) {
  var clientId = uniClientId_();
  if (!clientId) return uniJson_({ ok: false, error: "google_no_configurado" });
  var token = String(p.id_token || "");
  if (token.length < 20 || token.length > 4000) return uniJson_({ ok: false, error: "google" });
  var res = UrlFetchApp.fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(token), { muteHttpExceptions: true });
  var info;
  try { info = JSON.parse(res.getContentText() || "{}"); } catch (e) { info = {}; }
  if (uniGoogleOk_(info, clientId, Date.now())) return uniJson_({ ok: false, error: "google" });
  return uniRespuestaAcceso_(uniCorreo_(info.email));
}

function uniAcceso_(p) {
  var email = uniLeerToken_(p.token);
  if (!email) return uniJson_({ ok: false, error: "sesion" });
  return uniRespuestaAcceso_(email);
}

function uniPortal_(p) {
  var email = uniLeerToken_(p.token);
  if (!email) return uniJson_({ ok: false, error: "sesion" });
  var fila = uniFilaPorEmail_(email);
  if (!fila || fila.customer_id.indexOf("cus_") !== 0) return uniJson_({ ok: false, error: "sin_suscripcion" });
  var creado = uniStripe_("post", "/v1/billing_portal/sessions", {
    customer: fila.customer_id,
    return_url: uniUrlVentas_() + "#acceso"
  });
  var url = creado.body && creado.body.url;
  if (creado.code !== 200 || !url || String(url).indexOf("https://billing.stripe.com/") !== 0) {
    return uniJson_({
      ok: false,
      error: uniErrorStripe_(creado.body),
      instruccion: "En Stripe, activa el portal del cliente en el mismo modo (prueba o real): Ajustes → Facturación → Portal de clientes. Permite cancelar la suscripción y guarda."
    });
  }
  return uniJson_({ ok: true, url: url });
}

function uniHoja_(nombre, columnas) {
  var ss = SpreadsheetApp.getActive();
  var hoja = ss.getSheetByName(nombre);
  if (!hoja) {
    hoja = ss.insertSheet(nombre);
    hoja.appendRow(columnas);
    hoja.setFrozenRows(1);
  } else if (hoja.getLastRow() === 0) {
    hoja.appendRow(columnas);
    hoja.setFrozenRows(1);
  }
  return hoja;
}

function uniGuardarCodigo_(email, hash, expira) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var hoja = uniHoja_(UNI_HOJA_CODIGOS, UNI_COLUMNAS_CODIGO);
    var ultima = hoja.getLastRow();
    var encontrada = 0;
    if (ultima >= 2) {
      var valores = hoja.getRange(2, 1, ultima - 1, 1).getValues();
      for (var i = 0; i < valores.length; i++) {
        if (String(valores[i][0] || "") === email) { encontrada = i + 2; break; }
      }
    }
    var celdas = [email, hash, String(expira), "0"];
    if (encontrada) hoja.getRange(encontrada, 1, 1, 4).setValues([celdas]);
    else hoja.appendRow(celdas);
  } finally {
    lock.releaseLock();
  }
}

function uniCodigoValido_(email, codigo) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var hoja = uniHoja_(UNI_HOJA_CODIGOS, UNI_COLUMNAS_CODIGO);
    var ultima = hoja.getLastRow();
    if (ultima < 2) return false;
    var valores = hoja.getRange(2, 1, ultima - 1, 4).getValues();
    for (var i = 0; i < valores.length; i++) {
      if (String(valores[i][0] || "") !== email) continue;
      var intentos = Number(valores[i][3] || 0);
      if (intentos >= 5 || Number(valores[i][2] || 0) < Date.now()) return false;
      var vale = uniIgual_(String(valores[i][1] || ""), uniHashCodigo_(email, codigo));
      if (!vale) {
        hoja.getRange(i + 2, 4).setValue(String(intentos + 1));
        return false;
      }
      hoja.getRange(i + 2, 2, 1, 3).setValues([["", "0", "5"]]);
      return true;
    }
    return false;
  } finally {
    lock.releaseLock();
  }
}

function uniHashCodigo_(email, codigo) {
  var firma = uniFirma_();
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, email + "|" + codigo + "|" + firma, Utilities.Charset.UTF_8);
  return uniHex_(bytes);
}

function uniCodigo_() {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + String(Date.now()));
  var n = ((uniByte_(bytes[0]) << 16) | (uniByte_(bytes[1]) << 8) | uniByte_(bytes[2])) % 1000000;
  var s = String(n);
  while (s.length < 6) s = "0" + s;
  return s;
}

function uniHmac_(texto, secreto) {
  return uniHex_(Utilities.computeHmacSha256Signature(texto, secreto));
}

function uniHex_(bytes) {
  return bytes.map(function (b) {
    var v = uniByte_(b);
    return (v < 16 ? "0" : "") + v.toString(16);
  }).join("");
}

function uniByte_(b) {
  var n = Number(b) || 0;
  if (n < 0) n += 256;
  return n;
}

function uniB64_(texto) {
  return Utilities.base64EncodeWebSafe(texto, Utilities.Charset.UTF_8).replace(/=+$/, "");
}

function uniPad_(s) {
  var out = String(s || "");
  while (out.length % 4) out += "=";
  return out;
}

function uniIgual_(a, b) {
  var x = String(a);
  var y = String(b);
  if (x.length !== y.length) return false;
  var diff = 0;
  for (var i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}
