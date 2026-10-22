/* Carrito de compra de la Tienda de Granja Rentable.
   - Persistencia: localStorage «gr_carrito_v1» = { items: { slug: cantidad } }.
     Los precios NO se guardan: se resuelven siempre del catálogo
     (window.GR_TIENDA_CATALOGO) con el país detectado, la misma lógica
     de país de tienda.js, que nos pasa el país con GRCart.setPais().
   - Tope por producto: si el producto define «stock» en el catálogo,
     manda ese número; el catálogo actual no lo define (el stock se
     vigila con check_stock.py y el flag «activo»), así que el tope
     por defecto es 10 unidades por producto.
   - «Comprar»/WhatsApp de cada ficha NO cambia: el carrito convive.
   - Finalizar compra: ver checkout(), la función única de cierre. */
(function () {
  "use strict";
  var CAT = window.GR_TIENDA_CATALOGO;
  if (!CAT || !CAT.productos) return;
  var WA = "34656267726";
  var CLAVE = "gr_carrito_v1";
  var TOPE_DEFECTO = 10;

  var paisActual = null;
  var uiLista = false;

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

  /* ---------- Interfaz: botón de cabecera + panel lateral ---------- */
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
        '<div class="cart-foot" id="gr-cart-foot">' +
          '<div class="cart-confianza">' +
            '<p class="cart-confianza-t">🛡️ Compra protegida</p>' +
            '<p>Estamos activando el pago con depósito en garantía: un tercero neutral (Trustap) retiene tu dinero y solo lo libera al proveedor cuando recibes tu pedido. Si algo sale mal, recuperas tu dinero.</p>' +
            '<p class="cart-confianza-sellos">✓ Envío con seguimiento<br>✓ Devolución en 14 días gestionada por Granja Rentable<br>✓ Te confirmamos el pedido por WhatsApp antes de cobrar nada</p>' +
          '</div>' +
          '<p class="cart-linea"><span>Subtotal</span><strong id="gr-cart-subtotal">—</strong></p>' +
          '<p class="cart-linea cart-total"><span>Total</span><strong id="gr-cart-total">—</strong></p>' +
          '<p class="cart-envio" id="gr-cart-envio"></p>' +
          '<p class="cart-nota">El precio de cada producto ya incluye el envío a tu país. Al finalizar te abrimos WhatsApp con tu pedido listo: confirmamos contigo el total y el plazo antes de cobrar nada.</p>' +
          '<button type="button" class="btn gold cart-checkout" id="gr-cart-checkout">Finalizar compra por WhatsApp</button>' +
          '<p class="cart-msg" id="gr-cart-msg" role="status"></p>' +
          '<button type="button" class="cart-vaciar" id="gr-cart-vaciar">Vaciar el carrito</button>' +
        '</div>' +
      '</aside>' +
      '<div class="cart-toast" id="gr-cart-toast" role="status"></div>';
    var div = document.createElement("div");
    div.innerHTML = html;
    while (div.firstChild) document.body.appendChild(div.firstChild);
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

  /* ---------- Pintado del panel ---------- */
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
    var foot = $("#gr-cart-foot");
    var ls = lineas();
    if (!ls.length) {
      zona.innerHTML = '<div class="cart-vacio"><p><strong>Tu carrito está vacío.</strong></p>' +
        "<p>Cuando veas algo que te sirva, pulsa «Añadir al carrito» y aparecerá aquí.</p>" +
        '<p><button type="button" class="btn sec" id="gr-cart-seguir">Seguir viendo la tienda</button></p></div>';
      if (foot) foot.hidden = true;
      var seguir = $("#gr-cart-seguir");
      if (seguir) seguir.addEventListener("click", cerrar);
      return;
    }
    if (foot) foot.hidden = false;
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

  /* ---------- Registro de la intención (el mecanismo de la casa) ---------- */
  function registrarIntencion(pedido) {
    var resumen = String(pedido.resumen || "").slice(0, 140);
    try {
      var GR = window.GR || {};
      /* 1) Aviso al correo vía Apps Script (tipo «compra»), como js/site.js. */
      var endpoint = (GR.formEndpoint || "").trim();
      if (endpoint) {
        var cuerpo = new URLSearchParams({
          tipo: "compra", interes: resumen, origen: (location.pathname || "") + " (carrito)"
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon(endpoint, cuerpo);
        } else if (window.fetch) {
          fetch(endpoint, { method: "POST", body: cuerpo, keepalive: true, mode: "no-cors" }).catch(function () {});
        }
      }
      /* 2) Fila en el panel (public.intenciones_compra), como js/site.js. */
      var com = GR.comunidad || {};
      var SB = (com.supabaseUrl || "").replace(/\/+$/, "");
      var KEY = com.supabaseAnonKey || "";
      if (SB && KEY && window.fetch) {
        fetch(SB + "/rest/v1/intenciones_compra", {
          method: "POST",
          credentials: "omit",
          keepalive: true,
          headers: {
            "apikey": KEY,
            "Authorization": "Bearer " + KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify({
            producto: resumen, canal: "carrito",
            ruta: location.pathname || "", pais: paisActual
          })
        }).catch(function () {});
      }
    } catch (e) { /* el registro nunca frena la compra */ }
  }

  /* ---------- Finalizar compra ---------- */
  function construirPedido() {
    var ls = lineas().filter(function (l) { return !!l.d; });
    var t = totales(ls);
    var texto = "Hola, escribo desde la tienda de Granja Rentable. Quiero hacer un pedido:\n\n" +
      ls.map(function (l) {
        return "• " + l.cant + " × " + l.p.nombre + " — " + formatoPrecio(l.subtotal, l.d.moneda);
      }).join("\n") +
      "\n\nTotal: " + formatoPrecio(t.total, t.moneda) + " (" + nombrePais() + ")" +
      (t.plazos.length ? "\nEnvío estimado: " + t.plazos.join(" / ") : "") +
      "\n\nGracias.";
    var resumen = "Pedido carrito: " +
      ls.map(function (l) { return l.cant + "× " + l.p.slug; }).join(", ") +
      " · Total " + formatoPrecio(t.total, t.moneda) + " · " + nombrePais();
    return { lineas: ls, total: t.total, moneda: t.moneda, texto: texto, resumen: resumen };
  }

  /* ==================================================================
     FUNCIÓN ÚNICA DE CIERRE DEL CARRITO. Todo el flujo llama aquí.
     Hoy: registra la intención y abre WhatsApp con el pedido completo
     (la venta se confirma en la conversación, como el resto de la
     tienda). Los dos métodos de pago futuros se enchufan en esta
     misma función, sin tocar el resto del carrito:

     → STRIPE CHECKOUT: crear la sesión de pago con pedido.lineas
       (slug, cantidad, precio y moneda ya resueltos por país) y
       redirigir a la URL de la sesión en lugar de abrir WhatsApp.

     → TRUSTAP «PAGO PROTEGIDO» (escrow, proveedor candidato): un
       tercero neutral retiene el pago del cliente y solo lo libera
       al proveedor cuando el cliente confirma que ha recibido el
       pedido. Punto de integración: sustituir el cuerpo de esta
       función por iniciarPagoProtegidoTrustap(pedido), que deberá
       (1) crear la transacción en Trustap por pedido.total y
       pedido.moneda, (2) registrar la intención con canal
       «carrito-trustap» reutilizando registrarIntencion() y
       (3) redirigir al enlace de pago que devuelva Trustap.
       NO activar sin el alta de la cuenta ni las claves API.
     ================================================================== */
  function checkout(pedido) {
    registrarIntencion(pedido);
    var url = "https://wa.me/" + WA + "?text=" + encodeURIComponent(pedido.texto);
    window.open(url, "_blank");
  }

  function finalizarCompra() {
    var msg = $("#gr-cart-msg");
    function di(texto) { if (msg) msg.textContent = texto; }
    if (!paisActual) {
      di("Todavía estamos detectando tu país. Espera un segundo y vuelve a intentarlo.");
      return;
    }
    var pedido = construirPedido();
    if (!pedido.lineas.length) {
      di("Tu carrito está vacío o no tiene productos disponibles en tu país. Ajusta el carrito y vuelve a intentarlo.");
      return;
    }
    checkout(pedido);
    di("Te hemos abierto WhatsApp con tu pedido listo para enviar. Si no se abrió, escríbenos al +34 656 267 726 indicando tu pedido.");
  }

  /* ---------- Eventos (delegación: vale para tarjetas y ficha,
     que tienda.js repinta, sin tocar sus botones «Comprar») ---------- */
  document.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest ? ev.target : null;
    if (!t) return;
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
    anadir: anadir
  };
})();
