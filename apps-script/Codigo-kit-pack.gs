/* =====================================================================
 * GRANJA RENTABLE · COBRO DE PRODUCTOS DIGITALES POR ENLACE
 * Pack de los 4 ebooks (6 $) · Kit Granja en Orden (12 $)
 * Kit tras comprar un ebook de 2 $ (10 $, con token de un solo uso)
 *
 * Archivo NUEVO para el proyecto Apps Script «Granja Rentable formularios»
 * (el mismo que ya cobra los ebooks). NO sustituye a nada: añade tres
 * tipos de petición que la web nueva (js/pago-digital.js) manda por POST:
 *   tipo "paypal-digital"  accion "crear" | "capturar"
 *   tipo "stripe-digital"  accion "crear" | "confirmar"
 *   tipo "oferta-kit"      accion "emitir"
 * y una URL de descarga por GET:  <URL /exec>?descarga=TOKEN
 *
 * Ver INSTRUCCIONES.md para pegarlo, las propiedades y las pruebas.
 * Aquí NO hay ninguna clave: todo sale de Propiedades del script.
 * ===================================================================== */

var DIGITAL = {
  moneda: "USD",
  web: "https://granjarentable.com/",
  remitente: "ventas@granjarentable.com",
  nombreRemitente: "Pablo · Granja Rentable",
  hojaVentas: "Ventas digitales",
  hojaOfertas: "Ofertas kit",
  precioEbookSuelto: "2.00",   // importe del ebook que da derecho a la oferta
  horasOferta: 48,             // la oferta vale hasta 48 h después del pago del ebook
  diasEnlace: 30,              // validez del enlace de descarga
  descargasMax: 15,            // aperturas máximas del enlace
  productos: {
    "pack-4-ebooks": {
      precio: "6.00", nombre: "Los 4 ebooks de Granja Rentable",
      propArchivos: "DIGITAL_DRIVE_PACK_4_EBOOKS", pagina: "ebooks.html"
    },
    "kit-granja-en-orden": {
      precio: "12.00", nombre: "Kit Granja en Orden",
      propArchivos: "DIGITAL_DRIVE_KIT", pagina: "kit.html"
    },
    "kit-tras-ebook": {
      precio: "10.00", nombre: "Kit Granja en Orden (oferta tras tu ebook)",
      propArchivos: "DIGITAL_DRIVE_KIT", pagina: "kit.html", requiereOferta: true
    }
  }
};

/* ---------- Enganche con Codigo.gs ----------
 * En doPost, justo después de  var p = leer_(e);  y del _gotcha, añadir:
 *     var dig = digital_router_(p);
 *     if (dig) return json_(dig);
 * En doGet, cambiar  function doGet()  por  function doGet(e)  y añadir
 * como primera línea:
 *     var des = digital_doGet_(e); if (des) return des;
 */
function digital_router_(p) {
  var tipo = String(p.tipo || "");
  try {
    if (tipo === "paypal-digital") return paypalDigital_(p);
    if (tipo === "stripe-digital") return stripeDigital_(p);
    if (tipo === "oferta-kit") return ofertaKit_(p);
  } catch (err) {
    console.error("digital " + tipo + ": " + (err && err.stack || err));
    return { ok: false, error: "error_servidor" };
  }
  return null;
}

function prop_(nombre, obligatorio) {
  var v = PropertiesService.getScriptProperties().getProperty(nombre);
  if (obligatorio && !v) throw new Error("Falta la propiedad del script " + nombre);
  return v || "";
}
function producto_(clave) {
  var pr = DIGITAL.productos[String(clave || "")];
  if (!pr) throw new Error("producto_desconocido");
  return pr;
}
function centimos_(precio) { return Math.round(Number(precio) * 100); }

/* ======================= PAYPAL ======================= */
// Mismas credenciales que los ebooks. Si el código de los ebooks usa otros
// nombres de propiedad, cámbialos SOLO aquí (ver INSTRUCCIONES.md).
var PROP_PAYPAL_ID = "PAYPAL_CLIENT_ID";
var PROP_PAYPAL_SECRET = "PAYPAL_SECRET";
var PROP_PAYPAL_ENTORNO = "PAYPAL_ENTORNO"; // "live" o "sandbox"

function paypalBase_() {
  return prop_(PROP_PAYPAL_ENTORNO) === "sandbox"
    ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
}
function paypalToken_() {
  var cache = CacheService.getScriptCache();
  var t = cache.get("pp_token_digital");
  if (t) return t;
  var r = UrlFetchApp.fetch(paypalBase_() + "/v1/oauth2/token", {
    method: "post", muteHttpExceptions: true,
    headers: { Authorization: "Basic " + Utilities.base64Encode(prop_(PROP_PAYPAL_ID, true) + ":" + prop_(PROP_PAYPAL_SECRET, true)) },
    payload: { grant_type: "client_credentials" }
  });
  var d = JSON.parse(r.getContentText());
  if (!d.access_token) throw new Error("paypal_sin_token");
  cache.put("pp_token_digital", d.access_token, Math.min(3000, (d.expires_in || 3000) - 60));
  return d.access_token;
}
function paypalApi_(metodo, ruta, cuerpo, extraCabeceras) {
  var cab = { Authorization: "Bearer " + paypalToken_(), "Content-Type": "application/json" };
  Object.keys(extraCabeceras || {}).forEach(function (k) { cab[k] = extraCabeceras[k]; });
  var r = UrlFetchApp.fetch(paypalBase_() + ruta, {
    method: metodo, headers: cab, muteHttpExceptions: true,
    payload: cuerpo ? JSON.stringify(cuerpo) : null
  });
  var txt = r.getContentText();
  return { codigo: r.getResponseCode(), datos: txt ? JSON.parse(txt) : {} };
}

function paypalDigital_(p) {
  var accion = String(p.accion || "");
  if (accion === "crear") {
    var clave = String(p.producto || ""), pr = producto_(clave);
    var token = String(p.token || "");
    if (pr.requiereOferta && !ofertaValida_(token)) return { ok: false, error: "oferta_no_valida" };
    var r = paypalApi_("post", "/v2/checkout/orders", {
      intent: "CAPTURE",
      purchase_units: [{
        reference_id: clave,
        custom_id: pr.requiereOferta ? token : clave,
        description: pr.nombre,
        amount: { currency_code: DIGITAL.moneda, value: pr.precio }
      }],
      application_context: { brand_name: "Granja Rentable", shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW", locale: "es-ES" }
    });
    if (r.codigo >= 300 || !r.datos.id) return { ok: false, error: "paypal_crear_" + r.codigo };
    return { id: r.datos.id };
  }

  if (accion === "capturar") {
    var orderID = String(p.orderID || "").replace(/[^A-Za-z0-9-]/g, "");
    if (!orderID) return { ok: false, error: "falta_orderID" };
    var previa = buscarVenta_(orderID);
    if (previa) return { ok: true, ya_enviado: true, clave: previa.clave, producto: previa.nombre };

    var r2 = paypalApi_("post", "/v2/checkout/orders/" + orderID + "/capture", null, { "PayPal-Request-Id": "cap-" + orderID });
    var issue = r2.datos && r2.datos.details && r2.datos.details[0] && r2.datos.details[0].issue;
    if (issue === "INSTRUMENT_DECLINED") return { ok: false, motivo: "INSTRUMENT_DECLINED" };
    if (issue === "ORDER_ALREADY_CAPTURED" || r2.codigo === 422) r2 = paypalApi_("get", "/v2/checkout/orders/" + orderID);
    var o = r2.datos || {};
    var pu = (o.purchase_units || [])[0] || {};
    var cap = (((pu.payments || {}).captures) || [])[0] || {};
    // La clave sale del pedido que creó ESTE servidor, nunca del navegador.
    var claveOk = String(pu.reference_id || "");
    var prOk = DIGITAL.productos[claveOk];
    if (o.status !== "COMPLETED" || cap.status !== "COMPLETED" || !prOk ||
        !cap.amount || cap.amount.currency_code !== DIGITAL.moneda || cap.amount.value !== prOk.precio) {
      return { ok: false, error: "pago_no_valido" };
    }
    if (prOk.requiereOferta && !gastarOferta_(String(pu.custom_id || ""), orderID)) {
      // Ya se cobró: se entrega igualmente y queda anotado para revisarlo a mano.
      console.warn("Oferta ya usada o caducada en el pedido " + orderID);
    }
    var email = (o.payer && o.payer.email_address) || "";
    var nombre = (o.payer && o.payer.name && o.payer.name.given_name) || "";
    entregar_("paypal", orderID, claveOk, email, nombre, cap.amount.value);
    return { ok: true, clave: claveOk, producto: prOk.nombre };
  }
  return { ok: false, error: "accion_desconocida" };
}

/* ======================= STRIPE ======================= */
var PROP_STRIPE_SECRET = "STRIPE_SECRET_KEY";

function stripeApi_(metodo, ruta, form) {
  var r = UrlFetchApp.fetch("https://api.stripe.com/v1" + ruta, {
    method: metodo, muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + prop_(PROP_STRIPE_SECRET, true) },
    payload: form || null
  });
  return { codigo: r.getResponseCode(), datos: JSON.parse(r.getContentText() || "{}") };
}

function stripeDigital_(p) {
  var accion = String(p.accion || "");
  if (accion === "crear") {
    var clave = String(p.producto || ""), pr = producto_(clave);
    var token = String(p.token || "");
    if (pr.requiereOferta && !ofertaValida_(token)) return { ok: false, error: "oferta_no_valida" };
    var vuelta = DIGITAL.web + pr.pagina; // la página la fija el servidor, no el navegador
    var r = stripeApi_("post", "/checkout/sessions", {
      "mode": "payment",
      "locale": "es",
      "line_items[0][quantity]": "1",
      "line_items[0][price_data][currency]": DIGITAL.moneda.toLowerCase(),
      "line_items[0][price_data][unit_amount]": String(centimos_(pr.precio)),
      "line_items[0][price_data][product_data][name]": pr.nombre,
      "metadata[producto]": clave,
      "metadata[oferta]": pr.requiereOferta ? token : "",
      "success_url": vuelta + "?stripe_digital={CHECKOUT_SESSION_ID}",
      "cancel_url": vuelta + "?stripe_digital_cancelado=1&producto=" + encodeURIComponent(clave)
    });
    if (r.codigo >= 300 || !r.datos.url) return { ok: false, error: "stripe_crear_" + r.codigo };
    return { url: r.datos.url };
  }

  if (accion === "confirmar") {
    var sid = String(p.sessionId || "").replace(/[^A-Za-z0-9_]/g, "");
    if (!/^cs_/.test(sid)) return { ok: false, error: "sesion_no_valida" };
    var previa = buscarVenta_(sid);
    if (previa) return { ok: true, ya_enviado: true, clave: previa.clave, producto: previa.nombre };
    var r2 = stripeApi_("get", "/checkout/sessions/" + sid);
    var s = r2.datos || {};
    var claveOk = String((s.metadata || {}).producto || "");
    var prOk = DIGITAL.productos[claveOk];
    if (r2.codigo !== 200 || s.payment_status !== "paid" || !prOk ||
        String(s.currency).toUpperCase() !== DIGITAL.moneda || s.amount_total !== centimos_(prOk.precio)) {
      return { ok: false, error: "pago_no_valido" };
    }
    if (prOk.requiereOferta && !gastarOferta_(String(s.metadata.oferta || ""), sid)) {
      console.warn("Oferta ya usada o caducada en la sesión " + sid);
    }
    var cd = s.customer_details || {};
    entregar_("stripe", sid, claveOk, cd.email || "", String(cd.name || "").split(" ")[0], prOk.precio);
    return { ok: true, clave: claveOk, producto: prOk.nombre };
  }
  return { ok: false, error: "accion_desconocida" };
}

/* ============ OFERTA: KIT A 10 $ TRAS UN EBOOK DE 2 $ ============ */
function ofertaKit_(p) {
  if (String(p.accion || "") !== "emitir") return { ok: false, error: "accion_desconocida" };
  var pago = String(p.pago || ""), ref = String(p.ref || "").replace(/[^A-Za-z0-9_-]/g, "");
  if (!ref) return { ok: false };
  var hoja = hojaOfertas_(), filas = hoja.getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    if (String(filas[i][1]) === ref) {
      return filas[i][4] ? { ok: false, error: "oferta_usada" } : { ok: true, token: String(filas[i][2]) };
    }
  }
  var pagadoEn = null;
  if (pago === "paypal") {
    var r = paypalApi_("get", "/v2/checkout/orders/" + ref);
    var pu = ((r.datos.purchase_units || [])[0]) || {};
    var cap = (((pu.payments || {}).captures) || [])[0] || {};
    if (r.datos.status === "COMPLETED" && cap.status === "COMPLETED" && cap.amount &&
        cap.amount.currency_code === DIGITAL.moneda && cap.amount.value === DIGITAL.precioEbookSuelto) {
      pagadoEn = new Date(cap.create_time || r.datos.create_time);
    }
  } else if (pago === "stripe" && /^cs_/.test(ref)) {
    var s = stripeApi_("get", "/checkout/sessions/" + ref).datos || {};
    if (s.payment_status === "paid" && String(s.currency).toUpperCase() === DIGITAL.moneda &&
        s.amount_total === centimos_(DIGITAL.precioEbookSuelto)) {
      pagadoEn = new Date((s.created || 0) * 1000);
    }
  }
  if (!pagadoEn || (Date.now() - pagadoEn.getTime()) > DIGITAL.horasOferta * 3600000) return { ok: false };
  var token = Utilities.getUuid();
  hoja.appendRow([new Date(), ref, token, pago, ""]);
  return { ok: true, token: token };
}
function hojaOfertas_() {
  var ss = SpreadsheetApp.getActive(), h = ss.getSheetByName(DIGITAL.hojaOfertas);
  if (!h) { h = ss.insertSheet(DIGITAL.hojaOfertas); h.appendRow(["fecha", "ref_ebook", "token", "pago", "usado_en"]); h.setFrozenRows(1); }
  return h;
}
function ofertaValida_(token) {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return false;
  var filas = hojaOfertas_().getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    if (String(filas[i][2]) === token) {
      var edad = Date.now() - new Date(filas[i][0]).getTime();
      return !filas[i][4] && edad <= DIGITAL.horasOferta * 3600000;
    }
  }
  return false;
}
function gastarOferta_(token, refPago) {
  if (!ofertaValida_(token)) return false;
  var h = hojaOfertas_(), filas = h.getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    if (String(filas[i][2]) === token) { h.getRange(i + 1, 5).setValue(refPago); return true; }
  }
  return false;
}

/* ============ ENTREGA POR ENLACE + REGISTRO ============ */
function hojaVentas_() {
  var ss = SpreadsheetApp.getActive(), h = ss.getSheetByName(DIGITAL.hojaVentas);
  if (!h) {
    h = ss.insertSheet(DIGITAL.hojaVentas);
    h.appendRow(["fecha", "pago", "referencia", "clave", "producto", "importe_usd", "email", "token_descarga", "caduca", "descargas", "correo_enviado"]);
    h.setFrozenRows(1);
  }
  return h;
}
function buscarVenta_(referencia) {
  var filas = hojaVentas_().getDataRange().getValues();
  for (var i = 1; i < filas.length; i++) {
    if (String(filas[i][2]) === referencia) return { fila: i + 1, clave: String(filas[i][3]), nombre: String(filas[i][4]) };
  }
  return null;
}
function entregar_(pago, referencia, clave, email, nombre, importe) {
  var pr = producto_(clave);
  var token = Utilities.getUuid().replace(/-/g, "") + Utilities.getUuid().replace(/-/g, "").slice(0, 8);
  var caduca = new Date(Date.now() + DIGITAL.diasEnlace * 86400000);
  var h = hojaVentas_();
  h.appendRow([new Date(), pago, referencia, clave, pr.nombre, importe, email, token, caduca, 0, ""]);
  var fila = h.getLastRow();
  if (!email) { h.getRange(fila, 11).setValue("SIN EMAIL: enviar a mano"); return; }
  var enlace = ScriptApp.getService().getUrl() + "?descarga=" + token;
  enviarCorreoEntrega_(email, nombre, pr, enlace);
  h.getRange(fila, 11).setValue(new Date());
}

function enviarCorreoEntrega_(email, nombre, pr, enlace) {
  var saludo = nombre ? "Hola, " + nombre + ":" : "Hola:";
  var asunto = "Tu descarga: " + pr.nombre;
  var texto = [
    saludo, "",
    "Gracias por tu compra. Aquí tienes el enlace para descargar " + pr.nombre + ":",
    enlace, "",
    "El enlace funciona durante " + DIGITAL.diasEnlace + " días. Descarga los archivos y guárdalos en tu móvil o en tu ordenador.",
    "Si algo no se abre o el archivo llega dañado, responde a este correo y te lo reenvío o te devuelvo el dinero.", "",
    "Son guías y hojas orientativas: no sustituyen al veterinario ni al técnico de tu zona.", "",
    "Un saludo,", "Pablo", "Granja Rentable · granjarentable.com"
  ].join("\n");
  var html = '<p>' + saludo + '</p><p>Gracias por tu compra. Aquí tienes el enlace para descargar <strong>' + pr.nombre + '</strong>:</p>' +
    '<p><a href="' + enlace + '" style="background:#1F5E2E;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block">Descargar</a></p>' +
    '<p>El enlace funciona durante ' + DIGITAL.diasEnlace + ' días. Descarga los archivos y guárdalos en tu móvil o en tu ordenador.</p>' +
    '<p>Si algo no se abre o el archivo llega dañado, responde a este correo y te lo reenvío o te devuelvo el dinero.</p>' +
    '<p style="color:#3E5146;font-size:13px">Son guías y hojas orientativas: no sustituyen al veterinario ni al técnico de tu zona.</p>' +
    '<p>Un saludo,<br>Pablo<br>Granja Rentable · <a href="https://granjarentable.com">granjarentable.com</a></p>';
  var opciones = { htmlBody: html, name: DIGITAL.nombreRemitente, replyTo: DIGITAL.remitente };
  // Enviar DESDE ventas@ solo es posible si es un alias «Enviar como» de la cuenta
  // dueña del script. Si no lo es, sale de esa cuenta con Responder-a = ventas@.
  var alias = [];
  try { alias = GmailApp.getAliases(); } catch (e) {}
  if (alias.indexOf(DIGITAL.remitente) >= 0) {
    opciones.from = DIGITAL.remitente;
    GmailApp.sendEmail(email, asunto, texto, opciones);
  } else {
    MailApp.sendEmail(email, asunto, texto, opciones);
  }
}

/* GET ?descarga=TOKEN -> página con el/los botón(es) de descarga.
 * Apps Script no puede responder con una redirección HTTP: se muestra una
 * página mínima con enlaces target="_top" a los archivos de Drive. */
function digital_doGet_(e) {
  var token = e && e.parameter && String(e.parameter.descarga || "");
  if (!token) return null;
  var lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    var h = hojaVentas_(), filas = h.getDataRange().getValues();
    for (var i = 1; i < filas.length; i++) {
      if (String(filas[i][7]) !== token) continue;
      if (new Date(filas[i][8]).getTime() < Date.now()) return paginaDescarga_("Este enlace ha caducado", "Escríbenos a " + DIGITAL.remitente + " y te mandamos uno nuevo.", []);
      if (Number(filas[i][9]) >= DIGITAL.descargasMax) return paginaDescarga_("Has usado este enlace muchas veces", "Escríbenos a " + DIGITAL.remitente + " y te ayudamos.", []);
      var pr = producto_(String(filas[i][3]));
      var archivos;
      try {
        archivos = prop_(pr.propArchivos, true).split(",").map(function (s) { return s.trim(); }).filter(String).map(function (id) {
        var f = DriveApp.getFileById(id);
        return { nombre: f.getName(), url: "https://drive.google.com/uc?export=download&id=" + encodeURIComponent(id) };
      });
      } catch (err) {
        console.error("descarga " + pr.propArchivos + ": " + err);
        return paginaDescarga_("La descarga no está lista", "Escríbenos a " + DIGITAL.remitente + " y te mandamos los archivos.", []);
      }
      h.getRange(i + 1, 10).setValue(Number(filas[i][9]) + 1);
      return paginaDescarga_(pr.nombre, "Pulsa para descargar. Si el archivo es grande, Google puede pedirte que confirmes la descarga.", archivos);
    }
    return paginaDescarga_("Enlace no válido", "Revisa que has copiado el enlace completo del correo o escríbenos a " + DIGITAL.remitente + ".", []);
  } finally { lock.releaseLock(); }
}
function paginaDescarga_(titulo, texto, archivos) {
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var botones = archivos.map(function (a) {
    return '<p><a target="_top" href="' + esc(a.url) + '" style="background:#1F5E2E;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none;display:inline-block">Descargar ' + esc(a.nombre) + '</a></p>';
  }).join("");
  var html = '<div style="font-family:Arial,sans-serif;max-width:560px;margin:40px auto;padding:24px;background:#F6F3EA;border-radius:12px;color:#1C2B22">' +
    '<h1 style="color:#1F5E2E;font-size:22px">' + esc(titulo) + '</h1><p>' + esc(texto) + '</p>' + botones +
    '<p style="font-size:13px;color:#3E5146">Granja Rentable · granjarentable.com</p></div>';
  return HtmlService.createHtmlOutput(html).setTitle("Descarga · Granja Rentable");
}

/* ---------- Prueba manual desde el editor (no cobra nada) ---------- */
function probarCorreoEntregaDigital() {
  var yo = Session.getActiveUser().getEmail();
  enviarCorreoEntrega_(yo, "Pablo", producto_("kit-granja-en-orden"), ScriptApp.getService().getUrl() + "?descarga=PRUEBA");
}
