/* Carrito de compra de la Tienda de Granja Rentable.
   - Persistencia: localStorage «gr_carrito_v1» = { items: { slug: cantidad } }.
     Los precios NO se guardan: se resuelven siempre del catálogo
     (window.GR_TIENDA_CATALOGO) con el país detectado, la misma lógica
     de país de tienda.js, que nos pasa el país con GRCart.setPais().
   - Tope por producto: si el producto define «stock» en el catálogo,
     manda ese número; el catálogo actual no lo define (el stock se
     vigila con check_stock.py y el flag «activo»), así que el tope
     por defecto es 10 unidades por producto.
   - Cierre de la compra (decisión de Pablo, 23-oct-2026): NADA de
     WhatsApp para tramitar pedidos. «Finalizar compra» abre un
     formulario (nombre, correo y dirección de envío) y el pedido se
     registra con tipo «pedido» en el endpoint de formularios
     (GR.formEndpoint): el Apps Script guarda la fila y envía el correo
     de confirmación al cliente y el aviso con todos los datos a Pablo.
     WhatsApp queda solo como canal de preguntas en la tienda.
   - Protección Trustap (opcional, por pedido): casilla en el
     formulario con la comisión calculada en vivo. La elección viaja
     en el payload (proteccion_trustap / proteccion_importe) y se le
     recuerda al cliente en la confirmación. La creación real de la
     transacción Trustap queda comentada en checkout(): requiere el
     alta de la cuenta de Pablo y sus claves API. */
(function () {
  "use strict";
  var CAT = window.GR_TIENDA_CATALOGO;
  if (!CAT || !CAT.productos) return;
  var CLAVE = "gr_carrito_v1";
  var TOPE_DEFECTO = 10;

  /* Tarifas publicadas de Trustap que usa la explicación de la casilla.
     EUR: 3 % + 0,40 € · USD: 4,4 % + 0,40 $. Para el resto de monedas
     del catálogo (MXN, COP, PEN, CLP…) no hay tarifa en la tabla: se
     aplica la de EUR como REFERENCIA y así se le dice al cliente. */
  var TARIFAS_TRUSTAP = {
    EUR: { pct: 0.03, fijo: 0.40 },
    USD: { pct: 0.044, fijo: 0.40 }
  };
  var TARIFA_REFERENCIA = "EUR";

  var paisActual = null;
  var uiLista = false;
  var vista = "carrito"; /* carrito | pedido | ok */
  var enviando = false;
  var ultimoProtegido = false;
  var ultimoPaypalUrl = "";

  /* ---------- Utilidades (mismo criterio que tienda.js) ---------- */
  function $(s, c) { return (c || document).querySelector(s); }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }
  function formatoPrecio(valor, moneda) {
    var loc = moneda === "EUR" ? "es-ES" : moneda === "MXN" ? "es-MX" : "en-US";
    try {
      return new Intl.NumberFormat(loc, { style: "currency", currency: moneda }).format(valor);
    } catch (e) { return valor + " " + moneda; }
  }
  function datosPais(p, pais) { return p.paises && p.paises[pais] ? p.paises[pais] : null; }
  function visible(p, pais) {
    if (!p.activo) return false;
    var d = datosPais(p, pais);
    return !!(d && d.disponible);
  }
  function imagenDe(p) {
    if (p.imagenes && p.imagenes.length) return p.imagenes[0];
    return p.imagen_local || "";
  }
  function productoPorSlug(slug) {
    var found = null;
    CAT.productos.forEach(function (x) { if (x.slug === slug) found = x; });
    return found;
  }
  function topeDe(p) {
    var s = Number(p && p.stock);
    return isFinite(s) && s >= 1 ? Math.floor(s) : TOPE_DEFECTO;
  }
  function nombrePais() {
    return (paisActual && CAT.paises[paisActual] && CAT.paises[paisActual].nombre) || paisActual || "";
  }
  function textoEnvio(d) {
    if (d.origen_envio === "local") return "Envío desde almacén en tu país: " + d.dias_envio;
    return "Envío internacional con seguimiento: " + d.dias_envio;
  }
  function redondea2(n) { return Math.round(n * 100) / 100; }

  /* ---------- PayPal.Me: enlace de pago con el total del pedido ----------
     Sin API: la base sale de GR.paypalMe (js/config.js). PayPal.Me admite
     importe y moneda en la propia URL (…/16.95EUR): se adjuntan solo en
     las monedas habituales de PayPal.Me; en el resto va el enlace pelado
     y el cliente escribe el total que ve en su pedido. */
  function paypalBase() {
    var GR = window.GR || {};
    return String(GR.paypalMe || "").trim().replace(/\/+$/, "");
  }
  function paypalUrlPara(total, moneda) {
    var base = paypalBase();
    if (!base) return "";
    if (["EUR", "USD", "MXN", "GBP"].indexOf(moneda) !== -1) {
      return base + "/" + total.toFixed(2) + moneda;
    }
    return base;
  }

  /* ---------- Protección Trustap: comisión sobre el subtotal ---------- */
  function comisionTrustap(subtotal, moneda) {
    var directa = TARIFAS_TRUSTAP[moneda] || null;
    var t = directa || TARIFAS_TRUSTAP[TARIFA_REFERENCIA];
    return {
      importe: redondea2(subtotal * t.pct + t.fijo),
      pct: t.pct,
      fijo: t.fijo,
      monedaTarifa: directa ? moneda : TARIFA_REFERENCIA,
      esReferencia: !directa
    };
  }
  function textoComision(c, monedaPedido) {
    var pctTxt = String(Math.round(c.pct * 1000) / 10).replace(".", ",") + " %";
    var fijoTxt = formatoPrecio(c.fijo, c.monedaTarifa);
    var importeTxt = formatoPrecio(c.importe, monedaPedido);
    if (c.esReferencia) {
      return "Coste de la protección: " + importeTxt + " (calculado con la tarifa de referencia en euros: " +
        pctTxt + " + " + fijoTxt + ").";
    }
    return "Coste de la protección: " + importeTxt + " (" + pctTxt + " + " + fijoTxt + ").";
  }

  /* ---------- Estado ---------- */
  function leer() {
    try {
      var o = JSON.parse(localStorage.getItem(CLAVE) || "null");
      if (o && o.items && typeof o.items === "object") return o;
    } catch (e) {}
    return { items: {} };
  }
  function guardar(estado) {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {}
  }
  function numUnidades() {
    var estado = leer();
    var n = 0;
    Object.keys(estado.items).forEach(function (slug) {
      if (productoPorSlug(slug)) n += Math.max(0, parseInt(estado.items[slug], 10) || 0);
    });
    return n;
  }

  /* País provisional con las mismas claves que usa tienda.js.
     Su detección por IP manda: al terminar llama a GRCart.setPais(). */
  function paisLocal() {
    try {
      var q = new URLSearchParams(location.search).get("pais");
      if (q && CAT.paises[q.toUpperCase()]) return q.toUpperCase();
    } catch (e) {}
    try {
      var prev = sessionStorage.getItem("gr_tienda_preview");
      if (prev && CAT.paises[prev]) return prev;
      var man = localStorage.getItem("gr_tienda_pais_manual");
      if (man && CAT.paises[man]) return man;
      var raw = localStorage.getItem("gr_tienda_pais_ip");
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.pais && CAT.paises[o.pais]) return o.pais;
      }
    } catch (e) {}
    return null;
  }

  /* ---------- Carrito resuelto contra catálogo + país ---------- */
  function lineas() {
    var estado = leer();
    var out = [];
    Object.keys(estado.items).forEach(function (slug) {
      var p = productoPorSlug(slug);
      if (!p) return;
      var cant = Math.min(Math.max(1, parseInt(estado.items[slug], 10) || 1), topeDe(p));
      var d = paisActual && visible(p, paisActual) ? datosPais(p, paisActual) : null;
      out.push({ p: p, cant: cant, d: d, subtotal: d ? d.precio * cant : 0 });
    });
    return out;
  }
  function totales(ls) {
    var subtotal = 0, moneda = null, plazos = [];
    ls.forEach(function (l) {
      if (!l.d) return;
      subtotal += l.subtotal;
      moneda = l.d.moneda;
      if (l.d.dias_envio && plazos.indexOf(l.d.dias_envio) === -1) plazos.push(l.d.dias_envio);
    });
    return { subtotal: subtotal, total: subtotal, moneda: moneda, plazos: plazos };
  }
  function lineasDisponibles() {
    return lineas().filter(function (l) { return !!l.d; });
  }

  /* ---------- Interfaz: botón de cabecera + panel lateral ---------- */
  function opcionesPais() {
    var orden = CAT.orden_paises && CAT.orden_paises.length ? CAT.orden_paises : Object.keys(CAT.paises);
    return orden.map(function (code) {
      var p = CAT.paises[code];
      return p ? '<option value="' + esc(code) + '">' + esc(p.nombre) + "</option>" : "";
    }).join("");
  }
  function inyectarUI() {
    if (uiLista) return;
    uiLista = true;
    var html =
      '<div class="cart-overlay" id="gr-cart-overlay"></div>' +
      '<aside class="cart-drawer" id="gr-cart" aria-label="Carrito de compra" aria-hidden="true">' +
        '<div class="cart-head">' +
          '<h2>🛒 Tu carrito</h2>' +
          '<button type="button" class="cart-close" id="gr-cart-close" aria-label="Cerrar el carrito">✕</button>' +
        '</div>' +
        '<p class="cart-pais" id="gr-cart-pais"></p>' +
        '<div class="cart-items" id="gr-cart-items"></div>' +
        '<section class="cart-pedido" id="gr-cart-pedido" hidden aria-label="Datos del pedido">' +
          '<form id="gr-ped-form" novalidate>' +
            '<h3 class="cart-form-t">Datos del pedido</h3>' +
            '<p class="cart-form-resumen" id="gr-ped-resumen"></p>' +
            '<label class="cart-campo">Nombre y apellidos' +
              '<input type="text" id="gr-ped-nombre" autocomplete="name" required></label>' +
            '<label class="cart-campo">Correo electrónico' +
              '<input type="email" id="gr-ped-email" autocomplete="email" required></label>' +
            '<label class="cart-campo">Dirección de envío (calle y número)' +
              '<input type="text" id="gr-ped-calle" autocomplete="street-address" required></label>' +
            '<div class="cart-fila">' +
              '<label class="cart-campo">Ciudad' +
                '<input type="text" id="gr-ped-ciudad" autocomplete="address-level2" required></label>' +
              '<label class="cart-campo">Código postal' +
                '<input type="text" id="gr-ped-cp" autocomplete="postal-code" required></label>' +
            '</div>' +
            '<label class="cart-campo">País de envío' +
              '<select id="gr-ped-pais">' + opcionesPais() + "</select></label>" +
            '<div class="cart-trustap">' +
              '<label class="cart-trustap-lab">' +
                '<input type="checkbox" id="gr-ped-trustap">' +
                "<span><strong>Quiero compra protegida con Trustap</strong></span>" +
              "</label>" +
              '<p class="cart-trustap-txt" id="gr-ped-trustap-txt"></p>' +
            "</div>" +
            (paypalBase()
              ? '<div class="cart-pago">' +
                  '<p class="cart-pago-t"><strong>¿Cómo quieres pagar?</strong></p>' +
                  '<label class="cart-pago-lab">' +
                    '<input type="radio" name="gr-ped-metodo" value="paypal" checked>' +
                    "<span><strong>Pagar ahora con PayPal</strong> — con la Protección del comprador de PayPal.</span>" +
                  "</label>" +
                  '<label class="cart-pago-lab">' +
                    '<input type="radio" name="gr-ped-metodo" value="correo">' +
                    "<span><strong>Pagar después por correo</strong> — te escribimos para cerrar el pago.</span>" +
                  "</label>" +
                "</div>"
              : "") +
            '<p class="cart-linea"><span>Subtotal</span><strong id="gr-ped-subtotal">—</strong></p>' +
            '<p class="cart-linea" id="gr-ped-linea-trustap" hidden><span>Protección Trustap</span><strong id="gr-ped-trustap-imp">—</strong></p>' +
            '<p class="cart-linea cart-total"><span>Total</span><strong id="gr-ped-total">—</strong></p>' +
            '<button type="submit" class="btn gold cart-checkout" id="gr-ped-enviar">Enviar pedido</button>' +
            '<p class="cart-msg" id="gr-ped-msg" role="alert"></p>' +
            '<button type="button" class="cart-vaciar" id="gr-ped-volver">← Volver al carrito</button>' +
          "</form>" +
        "</section>" +
        '<section class="cart-ok-wrap" id="gr-cart-ok" hidden aria-label="Pedido recibido">' +
          '<div class="cart-ok">' +
            '<p class="cart-ok-t">✅ Pedido recibido</p>' +
            "<p>Tu pedido se está procesando. Te hemos enviado un correo con los datos de tu pedido; cuando salga, te enviaremos también el seguimiento por correo.</p>" +
            '<p class="cart-ok-trustap" id="gr-cart-ok-trustap" hidden>🛡️ Tu compra está protegida con Trustap: el pago solo se libera al proveedor cuando recibas tu pedido.</p>' +
            '<p class="cart-ok-paypal" id="gr-cart-ok-paypal" hidden>💳 <strong>Solo te falta pagar tu pedido:</strong><br>' +
              '<a class="btn gold" id="gr-cart-ok-paypal-btn" href="#" target="_blank" rel="noopener">Pagar ahora con PayPal</a><br>' +
              '<span class="cart-ok-paypal-nota">El importe ya va rellenado con el total de tu pedido. Cruzamos tu pago con el correo que nos has dado.</span></p>' +
            '<p><button type="button" class="btn sec" id="gr-cart-ok-cerrar">Seguir viendo la tienda</button></p>' +
          "</div>" +
        "</section>" +
        '<div class="cart-foot" id="gr-cart-foot">' +
          '<div class="cart-confianza">' +
            '<p class="cart-confianza-t">🛡️ Compra protegida</p>' +
            '<p>Estamos activando el pago con depósito en garantía: un tercero neutral (Trustap) retiene tu dinero y solo lo libera al proveedor cuando recibes tu pedido. Si algo sale mal, recuperas tu dinero.</p>' +
            '<p class="cart-confianza-sellos">✓ Envío con seguimiento<br>✓ Devolución en 14 días gestionada por Granja Rentable<br>✓ Te confirmamos el pedido por correo electrónico</p>' +
          '</div>' +
          '<p class="cart-linea"><span>Subtotal</span><strong id="gr-cart-subtotal">—</strong></p>' +
          '<p class="cart-linea cart-total"><span>Total</span><strong id="gr-cart-total">—</strong></p>' +
          '<p class="cart-envio" id="gr-cart-envio"></p>' +
          '<p class="cart-nota">El precio de cada producto ya incluye el envío a tu país. Al finalizar la compra rellenas un formulario corto y tu pedido queda registrado: te enviamos un correo con los datos del pedido y, cuando salga, otro con el seguimiento.</p>' +
          '<button type="button" class="btn gold cart-checkout" id="gr-cart-checkout">Finalizar compra</button>' +
          '<p class="cart-msg" id="gr-cart-msg" role="status"></p>' +
          '<button type="button" class="cart-vaciar" id="gr-cart-vaciar">Vaciar el carrito</button>' +
        '</div>' +
      '</aside>' +
      '<div class="cart-toast" id="gr-cart-toast" role="status"></div>';
    var div = document.createElement("div");
    div.innerHTML = html;
    while (div.firstChild) document.body.appendChild(div.firstChild);
    var form = $("#gr-ped-form");
    if (form) form.addEventListener("submit", enviarPedido);
    var chk = $("#gr-ped-trustap");
    if (chk) chk.addEventListener("change", pintarForm);
    var volver = $("#gr-ped-volver");
    if (volver) volver.addEventListener("click", function () { vista = "carrito"; render(); });
    var okCerrar = $("#gr-cart-ok-cerrar");
    if (okCerrar) okCerrar.addEventListener("click", cerrar);
    asegurarBotonCabecera();
  }
  function asegurarBotonCabecera() {
    if ($("#gr-cart-open")) return;
    var head = $(".site-head .head-in") || $(".head-in");
    if (!head) return;
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cart-head-btn";
    b.id = "gr-cart-open";
    b.setAttribute("aria-label", "Abrir el carrito de compra");
    b.innerHTML = '🛒 <span class="cart-head-txt">Carrito</span> <span class="cart-count" id="gr-cart-count" hidden>0</span>';
    head.appendChild(b);
    pintarContador();
  }
  function pintarContador() {
    var c = $("#gr-cart-count");
    if (!c) return;
    var n = numUnidades();
    c.textContent = n;
    c.hidden = n === 0;
  }
  function abrir() {
    inyectarUI();
    if (vista === "ok") vista = "carrito"; /* la confirmación ya se vio */
    render();
    var d = $("#gr-cart"), o = $("#gr-cart-overlay");
    if (d) { d.classList.add("on"); d.setAttribute("aria-hidden", "false"); }
    if (o) o.classList.add("on");
    document.body.classList.add("cart-abierto");
  }
  function cerrar() {
    var d = $("#gr-cart"), o = $("#gr-cart-overlay");
    if (d) { d.classList.remove("on"); d.setAttribute("aria-hidden", "true"); }
    if (o) o.classList.remove("on");
    document.body.classList.remove("cart-abierto");
  }
  var toastTimer = null;
  function toast(texto) {
    inyectarUI();
    var t = $("#gr-cart-toast");
    if (!t) return;
    t.textContent = texto;
    t.classList.add("on");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("on"); }, 2800);
  }

  /* ---------- Vistas del panel: carrito / formulario / confirmación ---------- */
  function pintarVista() {
    var items = $("#gr-cart-items"), ped = $("#gr-cart-pedido"),
        ok = $("#gr-cart-ok"), foot = $("#gr-cart-foot");
    var hayLineas = lineas().length > 0;
    if (items) items.hidden = vista !== "carrito";
    if (ped) ped.hidden = vista !== "pedido";
    if (ok) ok.hidden = vista !== "ok";
    if (foot) foot.hidden = vista !== "carrito" || !hayLineas;
    if (vista === "ok") {
      var t = $("#gr-cart-ok-trustap");
      if (t) t.hidden = !ultimoProtegido;
      var pp = $("#gr-cart-ok-paypal");
      if (pp) {
        pp.hidden = !ultimoPaypalUrl;
        var btn = $("#gr-cart-ok-paypal-btn");
        if (btn && ultimoPaypalUrl) btn.href = ultimoPaypalUrl;
      }
    }
    if (vista === "pedido") pintarForm();
  }

  /* ---------- Pintado del panel (vista carrito) ---------- */
  function render() {
    pintarContador();
    var zona = $("#gr-cart-items");
    if (!zona) return;
    var etiquetaPais = $("#gr-cart-pais");
    if (etiquetaPais) {
      etiquetaPais.textContent = paisActual
        ? "Precios y plazos para: " + nombrePais()
        : "Detectando tu país…";
    }
    var ls = lineas();
    if (!ls.length) {
      zona.innerHTML = '<div class="cart-vacio"><p><strong>Tu carrito está vacío.</strong></p>' +
        "<p>Cuando veas algo que te sirva, pulsa «Añadir al carrito» y aparecerá aquí.</p>" +
        '<p><button type="button" class="btn sec" id="gr-cart-seguir">Seguir viendo la tienda</button></p></div>';
      var seguir = $("#gr-cart-seguir");
      if (seguir) seguir.addEventListener("click", cerrar);
    } else {
      zona.innerHTML = ls.map(function (l) {
        var img = imagenDe(l.p);
        var media = img
          ? '<img src="' + esc(img) + '" alt="" loading="lazy" width="64" height="64">'
          : '<div class="cart-sin-foto">Sin foto</div>';
        var detalle, controles;
        if (l.d) {
          detalle = '<p class="cart-precio">' + esc(formatoPrecio(l.d.precio, l.d.moneda)) + " ud.</p>" +
            '<p class="cart-plazo">' + esc(textoEnvio(l.d)) + "</p>";
          controles =
            '<button type="button" data-cart-dec="' + esc(l.p.slug) + '" aria-label="Quitar una unidad">−</button>' +
            '<span class="cart-cant" aria-label="Cantidad">' + l.cant + "</span>" +
            '<button type="button" data-cart-inc="' + esc(l.p.slug) + '" aria-label="Añadir una unidad">+</button>' +
            '<button type="button" class="cart-del" data-cart-del="' + esc(l.p.slug) + '">Quitar</button>' +
            (l.cant >= topeDe(l.p) ? '<span class="cart-tope">Máximo por pedido: ' + topeDe(l.p) + "</span>" : "");
        } else {
          detalle = '<p class="cart-nodis">Este producto no está disponible en tu país ahora mismo. Quí­talo o cambia de país en la tienda.</p>';
          controles = '<button type="button" class="cart-del" data-cart-del="' + esc(l.p.slug) + '">Quitar</button>';
        }
        return '<div class="cart-item">' +
          '<div class="cart-thumb">' + media + "</div>" +
          '<div class="cart-info">' +
            '<p class="cart-nombre">' + esc(l.p.nombre) + "</p>" +
            detalle +
            '<div class="cart-controles">' + controles + "</div>" +
          "</div>" +
          '<p class="cart-linea-total">' + (l.d ? esc(formatoPrecio(l.subtotal, l.d.moneda)) : "—") + "</p>" +
        "</div>";
      }).join("");
      var t = totales(ls);
      var sub = $("#gr-cart-subtotal"), tot = $("#gr-cart-total"), env = $("#gr-cart-envio");
      if (sub) sub.textContent = t.moneda ? formatoPrecio(t.subtotal, t.moneda) : "—";
      if (tot) tot.textContent = t.moneda ? formatoPrecio(t.total, t.moneda) : "—";
      if (env) {
        env.textContent = !paisActual
          ? "Detectando tu país para calcular precios y plazos…"
          : t.plazos.length
            ? "Plazo de envío estimado: " + t.plazos.join(" · ")
            : "Sin productos disponibles en tu país: ajusta el carrito para continuar.";
      }
      var vaciarBtn = $("#gr-cart-vaciar");
      if (vaciarBtn) vaciarBtn.hidden = false;
    }
    pintarVista();
  }

  /* ---------- Formulario de pedido ---------- */
  function pintarForm() {
    var ls = lineasDisponibles();
    var t = totales(ls);
    var resumen = $("#gr-ped-resumen");
    if (resumen) {
      var n = 0;
      ls.forEach(function (l) { n += l.cant; });
      resumen.textContent = n
        ? n + (n === 1 ? " producto" : " productos") + " · Precios para " + nombrePais()
        : "Sin productos disponibles en tu país.";
    }
    var chk = $("#gr-ped-trustap");
    var comision = t.moneda ? comisionTrustap(t.subtotal, t.moneda) : null;
    var txt = $("#gr-ped-trustap-txt");
    if (txt) {
      txt.textContent = "Un tercero neutral (Trustap) retiene el pago y solo lo libera al proveedor " +
        "cuando recibes tu pedido. Si algo sale mal, te devuelven el dinero. " +
        (comision ? textoComision(comision, t.moneda) : "");
    }
    var sub = $("#gr-ped-subtotal"), lin = $("#gr-ped-linea-trustap"),
        imp = $("#gr-ped-trustap-imp"), tot = $("#gr-ped-total");
    var conProteccion = !!(chk && chk.checked && comision);
    if (sub) sub.textContent = t.moneda ? formatoPrecio(t.subtotal, t.moneda) : "—";
    if (lin) lin.hidden = !conProteccion;
    if (imp && comision) imp.textContent = formatoPrecio(comision.importe, t.moneda);
    if (tot) {
      tot.textContent = t.moneda
        ? formatoPrecio(t.subtotal + (conProteccion ? comision.importe : 0), t.moneda)
        : "—";
    }
  }
  function mostrarFormulario() {
    vista = "pedido";
    var sel = $("#gr-ped-pais");
    if (sel && paisActual && CAT.paises[paisActual]) sel.value = paisActual;
    render();
    var n = $("#gr-ped-nombre");
    if (n) { try { n.focus({ preventScroll: true }); } catch (e) { n.focus(); } }
  }
  function leerForm() {
    function v(id) { var el = $(id); return el ? String(el.value || "").trim() : ""; }
    var sel = $("#gr-ped-pais");
    var chk = $("#gr-ped-trustap");
    return {
      nombre: v("#gr-ped-nombre"),
      email: v("#gr-ped-email"),
      calle: v("#gr-ped-calle"),
      ciudad: v("#gr-ped-ciudad"),
      cp: v("#gr-ped-cp"),
      paisEnvio: sel && sel.value ? sel.value : (paisActual || ""),
      trustap: !!(chk && chk.checked),
      metodo: (function () {
        var r = document.querySelector('input[name="gr-ped-metodo"]:checked');
        return r ? r.value : (paypalBase() ? "paypal" : "correo");
      })()
    };
  }
  function validarForm(f) {
    if (f.nombre.length < 2) return "Escribe tu nombre y apellidos, por favor.";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return "Escribe un correo electrónico válido: ahí te enviaremos los datos de tu pedido y el seguimiento.";
    if (!f.calle || !f.ciudad || !f.cp) return "Completa la dirección de envío: calle y número, ciudad y código postal.";
    if (!f.paisEnvio || !CAT.paises[f.paisEnvio]) return "Elige el país de envío.";
    return "";
  }

  /* ---------- Construcción del pedido ---------- */
  function construirPedido(f) {
    var ls = lineasDisponibles();
    var t = totales(ls);
    var comision = f.trustap && t.moneda ? comisionTrustap(t.subtotal, t.moneda) : null;
    var fee = comision ? comision.importe : 0;
    var totalFinal = redondea2(t.subtotal + fee);
    var paisEnvioNombre = (CAT.paises[f.paisEnvio] && CAT.paises[f.paisEnvio].nombre) || f.paisEnvio;
    var direccion = f.calle + ", " + f.ciudad + ", " + f.cp + ", " + paisEnvioNombre;
    /* Método de pago efectivo: si el cliente marcó Trustap, la compra
       protegida MANDA sobre PayPal (no se le ofrece pagar por PayPal.Me
       un dinero que debe ir a la custodia). */
    var metodoEfectivo = comision ? "trustap"
      : (f.metodo === "paypal" && paypalBase() ? "paypal" : "correo");
    var urlPaypal = metodoEfectivo === "paypal" ? paypalUrlPara(totalFinal, t.moneda) : "";
    /* Resumen COMPLETO del pedido: viaja en «interes» del tipo «pedido»
       SIN el recorte de 140 caracteres de las intenciones «compra»
       (el Apps Script lo guarda entero en la hoja y lo mete en los
       dos correos: confirmación al cliente y aviso a Pablo). */
    var resumen = "Pedido desde la tienda (carrito):\n" +
      ls.map(function (l) {
        return "• " + l.cant + " × " + l.p.nombre + " — " + formatoPrecio(l.subtotal, l.d.moneda);
      }).join("\n") +
      "\nSubtotal: " + formatoPrecio(t.subtotal, t.moneda) +
      (comision ? "\nProtección Trustap: " + formatoPrecio(fee, t.moneda) : "") +
      "\nTotal: " + formatoPrecio(totalFinal, t.moneda) + " (precios para " + nombrePais() + ")" +
      "\nMétodo de pago: " + (metodoEfectivo === "paypal"
        ? "PayPal (pago inmediato)"
        : metodoEfectivo === "trustap"
          ? "Compra protegida con Trustap"
          : "A acordar por correo") +
      (urlPaypal ? "\nEnlace de pago PayPal: " + urlPaypal : "") +
      (t.plazos.length ? "\nEnvío estimado: " + t.plazos.join(" / ") : "") +
      "\n\nCliente: " + f.nombre +
      "\nCorreo: " + f.email +
      "\nDirección de envío: " + direccion;
    return {
      lineas: ls, subtotal: t.subtotal, moneda: t.moneda,
      proteccion: comision, fee: fee, total: totalFinal,
      metodo: metodoEfectivo, paypalUrl: urlPaypal,
      resumen: resumen, datos: f, direccion: direccion,
      paisEnvioNombre: paisEnvioNombre
    };
  }

  /* ---------- Registro del pedido (endpoint de formularios) ---------- */
  function registrarPedido(pedido) {
    var GR = window.GR || {};
    var endpoint = (GR.formEndpoint || "").trim();
    if (!endpoint || !window.fetch) return Promise.resolve(false);
    var cuerpo = new URLSearchParams({
      tipo: "pedido",
      nombre: pedido.datos.nombre,
      email: pedido.datos.email,
      pais: pedido.paisEnvioNombre,
      direccion: pedido.direccion,
      interes: pedido.resumen,
      total: formatoPrecio(pedido.total, pedido.moneda),
      proteccion_trustap: pedido.proteccion ? "si" : "no",
      proteccion_importe: pedido.proteccion ? pedido.fee.toFixed(2) : "",
      metodo_pago: pedido.metodo || "correo",
      paypal_link: pedido.paypalUrl || "",
      origen: (location.pathname || "") + " (carrito)",
      consentimiento: "si"
    });
    return fetch(endpoint, { method: "POST", body: cuerpo, mode: "cors" })
      .then(function (r) { return r.json(); })
      .then(function (j) { return !!(j && j.ok); })
      .catch(function () { return false; });
  }

  /* ==================================================================
     FUNCIÓN ÚNICA DE CIERRE DEL CARRITO. Todo el flujo llama aquí.
     Hoy: registra el pedido con tipo «pedido» en el endpoint de
     formularios y el Apps Script hace el resto (fila en la hoja,
     correo de confirmación al cliente y aviso completo a Pablo).
     Devuelve una promesa con true si el registro se confirmó: solo
     entonces se vacía el carrito y se muestra la confirmación.

     Métodos futuros, a enchufar en esta misma función:

     → STRIPE CHECKOUT: crear la sesión de pago con pedido.lineas
       (slug, cantidad, precio y moneda ya resueltos por país) y
       redirigir a la URL de la sesión tras registrar el pedido.

     → PAYPAL (PayPal.Me): YA integrado sin API. Si el cliente eligió
       PayPal y no marcó Trustap, pedido.paypalUrl lleva el enlace con
       el total ya rellenado: se le muestra como botón en la pantalla
       de confirmación y viaja en el payload (metodo_pago y
       paypal_link) para que el Apps Script lo meta también en su
       correo de confirmación. La base se configura en GR.paypalMe
       (js/config.js); vacío = el método no se ofrece.

     → TRUSTAP «PAGO PROTEGIDO» (escrow): si el cliente marcó la
       casilla, pedido.proteccion trae la comisión ya calculada y su
       elección YA viaja en el payload (proteccion_trustap=si y
       proteccion_importe). Punto de integración: tras el registro,
       crear aquí la transacción en Trustap por pedido.total y
       pedido.moneda y redirigir al enlace de pago que devuelva.
       NO activar sin el alta de la cuenta de Pablo ni sus claves API.
     ================================================================== */
  function checkout(pedido) {
    return registrarPedido(pedido);
  }

  function finalizarCompra() {
    var msg = $("#gr-cart-msg");
    function di(texto) { if (msg) msg.textContent = texto; }
    if (!paisActual) {
      di("Todavía estamos detectando tu país. Espera un segundo y vuelve a intentarlo.");
      return;
    }
    if (!lineasDisponibles().length) {
      di("Tu carrito está vacío o no tiene productos disponibles en tu país. Ajusta el carrito y vuelve a intentarlo.");
      return;
    }
    di("");
    mostrarFormulario();
  }

  function enviarPedido(ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    if (enviando) return;
    var msg = $("#gr-ped-msg");
    function di(texto) { if (msg) msg.textContent = texto; }
    if (!paisActual) {
      di("Todavía estamos detectando tu país. Espera un segundo y vuelve a intentarlo.");
      return;
    }
    var f = leerForm();
    var error = validarForm(f);
    if (error) { di(error); return; }
    if (!lineasDisponibles().length) {
      di("Tu carrito no tiene productos disponibles en tu país. Vuelve al carrito y ajústalo.");
      return;
    }
    var pedido = construirPedido(f);
    var btn = $("#gr-ped-enviar");
    enviando = true;
    if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }
    di("");
    checkout(pedido).then(function (ok) {
      enviando = false;
      if (btn) { btn.disabled = false; btn.textContent = "Enviar pedido"; }
      if (ok) {
        ultimoProtegido = !!pedido.proteccion;
        ultimoPaypalUrl = pedido.paypalUrl || "";
        guardar({ items: {} }); /* el carrito se vacía SOLO con el pedido registrado */
        vista = "ok";
        render();
      } else {
        di("No hemos podido registrar tu pedido (ha fallado la conexión). Tu carrito sigue intacto: inténtalo de nuevo en un momento.");
      }
    });
  }

  /* ---------- Operaciones ---------- */
  function anadir(slug) {
    var p = productoPorSlug(slug);
    if (!p) return;
    var estado = leer();
    var cant = Math.min((parseInt(estado.items[slug], 10) || 0) + 1, topeDe(p));
    estado.items[slug] = cant;
    guardar(estado);
    render();
    toast("Añadido al carrito: " + p.nombre);
  }
  /* «Comprar ahora» (ficha): mete el producto y abre el formulario
     de pedido directamente, sin pasar por WhatsApp. */
  function comprarAhora(slug) {
    var p = productoPorSlug(slug);
    if (!p) return;
    var estado = leer();
    var cant = Math.min((parseInt(estado.items[slug], 10) || 0) + 1, topeDe(p));
    estado.items[slug] = cant;
    guardar(estado);
    abrir();
    finalizarCompra();
  }
  function fijarCantidad(slug, cant) {
    var p = productoPorSlug(slug);
    if (!p) return;
    var estado = leer();
    cant = Math.max(0, Math.min(cant, topeDe(p)));
    if (cant <= 0) delete estado.items[slug];
    else estado.items[slug] = cant;
    guardar(estado);
    render();
  }
  function quitar(slug) { fijarCantidad(slug, 0); }
  function vaciar() {
    guardar({ items: {} });
    render();
  }

  /* ---------- Eventos (delegación: vale para tarjetas y ficha,
     que tienda.js repinta) ---------- */
  document.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null;
    if (!t) return;
    var buy = t.closest ? t.closest("[data-cart-buy]") : null;
    if (buy) { comprarAhora(buy.getAttribute("data-cart-buy")); return; }
    var add = t.closest ? t.closest("[data-cart-add]") : null;
    if (add) { anadir(add.getAttribute("data-cart-add")); return; }
    if (t.closest && t.closest("#gr-cart-open")) { abrir(); return; }
    if (t.closest && (t.closest("#gr-cart-close") || t.closest("#gr-cart-overlay"))) { cerrar(); return; }
    var inc = t.closest ? t.closest("[data-cart-inc]") : null;
    if (inc) {
      var s1 = inc.getAttribute("data-cart-inc");
      fijarCantidad(s1, (parseInt(leer().items[s1], 10) || 0) + 1);
      return;
    }
    var dec = t.closest ? t.closest("[data-cart-dec]") : null;
    if (dec) {
      var s2 = dec.getAttribute("data-cart-dec");
      fijarCantidad(s2, (parseInt(leer().items[s2], 10) || 0) - 1);
      return;
    }
    var del = t.closest ? t.closest("[data-cart-del]") : null;
    if (del) { quitar(del.getAttribute("data-cart-del")); return; }
    if (t.closest && t.closest("#gr-cart-vaciar")) { vaciar(); return; }
    if (t.closest && t.closest("#gr-cart-checkout")) { finalizarCompra(); return; }
    if (t.closest && t.closest("#gr-cart-toast")) { abrir(); return; }
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key === "Escape") cerrar();
  });

  /* ---------- Arranque ---------- */
  paisActual = paisLocal();
  function init() {
    inyectarUI();
    render();
    /* La cabecera puede ser retocada por otros scripts: reasegurar. */
    setTimeout(asegurarBotonCabecera, 400);
    setTimeout(asegurarBotonCabecera, 1500);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  /* API para tienda.js: cuando la detección de país termina (o el
     visitante cambia el país en el selector), nos pasa el país y
     repintamos precios, plazos y totales con ese país. */
  window.GRCart = {
    setPais: function (p) {
      if (p && CAT.paises[p]) { paisActual = p; render(); }
    },
    abrir: abrir,
    anadir: anadir,
    comprarAhora: comprarAhora
  };
})();
