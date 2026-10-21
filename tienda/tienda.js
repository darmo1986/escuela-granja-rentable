/* Tienda nueva de Granja Rentable: escaparate por país.
   REGLA DE LA CASA: cada visitante ve ÚNICAMENTE el catálogo de su
   país, detectado por IP. No hay selector de país en la interfaz.
   - Países activos, por orden de despliegue: MX, ES, US.
   - Si el país detectado aún no tiene catálogo activo, se muestra el
     aviso «estamos llegando a tu país» con el contacto de WhatsApp.
   - Vista previa del dueño (no aparece en la interfaz): añadir
     ?pais=XX a la URL, por ejemplo /tienda/?pais=CO. Se guarda en la
     sesión para poder navegar a las fichas sin perder el país. */
(function () {
  "use strict";
  var CAT = window.GR_TIENDA_CATALOGO;
  if (!CAT) return;
  var WA = "34656267726";

  var CATS = {
    bebederos: "Bebederos",
    comederos: "Comederos",
    incubacion: "Incubación",
    crianza: "Crianza y calor",
    gallinero: "Gallinero y cercas",
    mallas: "Mallas y huerto"
  };
  var ORDEN_CATS = ["bebederos", "comederos", "incubacion", "crianza", "gallinero", "mallas"];

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
  function estrellas(r) {
    var n = Math.round(Number(r) || 0);
    var s = "";
    for (var i = 0; i < 5; i++) s += i < n ? "★" : "☆";
    return s;
  }
  /* «Más vendido» solo si el dato del catálogo lo sostiene: pedidos >= 1000.
     El campo pedidos es texto del anuncio («1,000+», «2,269», «810 al mes»…);
     se extrae la cifra y no se inventa nada. */
  function pedidosNum(p) {
    var n = parseInt(String(p.pedidos == null ? "" : p.pedidos).replace(/[^0-9]/g, ""), 10);
    return isNaN(n) ? 0 : n;
  }
  function esMasVendido(p) { return pedidosNum(p) >= 1000; }
  function norm(s) {
    return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* ---------- Filtros de la portada (categoría + buscador) ---------- */
  var filtro = { cat: "todas", q: "" };
  var portada = { pais: null, lista: [] };
  var filtrosListos = false;

  /* ---------- Detección de país SOLO por IP ---------- */
  function paisDeUrl() {
    try {
      var p = new URLSearchParams(location.search).get("pais");
      if (p && CAT.paises[p.toUpperCase()]) return p.toUpperCase();
    } catch (e) {}
    return null;
  }
  function guardarPreview(p) {
    try { sessionStorage.setItem("gr_tienda_preview", p); } catch (e) {}
  }
  function leerPreview() {
    try {
      var p = sessionStorage.getItem("gr_tienda_preview");
      return p && CAT.paises[p] ? p : null;
    } catch (e) { return null; }
  }
  function paisCache() {
    try {
      var raw = localStorage.getItem("gr_tienda_pais_ip");
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (o && o.pais && Date.now() - (o.ts || 0) < 7 * 24 * 3600 * 1000) return o.pais;
    } catch (e) {}
    return null;
  }
  function guardarCache(p) {
    try {
      localStorage.setItem("gr_tienda_pais_ip", JSON.stringify({ pais: p, ts: Date.now() }));
      localStorage.setItem("gr_pais_ip", p); /* coherencia con js/site.js */
    } catch (e) {}
  }
  function fetchConTimeout(url, ms) {
    return new Promise(function (resolve, reject) {
      var ok = false;
      var t = setTimeout(function () { if (!ok) reject(new Error("timeout")); }, ms);
      fetch(url).then(function (r) { ok = true; clearTimeout(t); resolve(r); })
        .catch(function (e) { clearTimeout(t); reject(e); });
    });
  }
  function detectarPais() {
    var preview = paisDeUrl();
    if (preview) { guardarPreview(preview); return Promise.resolve(preview); }
    preview = leerPreview();
    if (preview) return Promise.resolve(preview);
    var cache = paisCache();
    if (cache) return Promise.resolve(cache);
    return fetchConTimeout("https://ipapi.co/country/", 3500)
      .then(function (r) { return r.text(); })
      .then(function (txt) {
        var code = (txt || "").trim().toUpperCase();
        if (!/^[A-Z]{2}$/.test(code)) throw new Error("ip");
        guardarCache(code);
        return code;
      })
      .catch(function () {
        return fetchConTimeout("/cdn-cgi/trace", 3500)
          .then(function (r) { return r.text(); })
          .then(function (txt) {
            var m = /loc=([A-Z]{2})/.exec(txt || "");
            if (m) { guardarCache(m[1]); return m[1]; }
            return "MX"; /* sin señal: primer mercado del despliegue */
          })
          .catch(function () { return "MX"; });
      });
  }

  /* ---------- Datos ---------- */
  function datosPais(p, pais) { return p.paises && p.paises[pais] ? p.paises[pais] : null; }
  function visible(p, pais) {
    if (!p.activo) return false;
    var d = datosPais(p, pais);
    return !!(d && d.disponible);
  }
  function imagenDe(p) {
    if (p.imagenes && p.imagenes.length) return { src: p.imagenes[0], nota: "" };
    if (p.imagen_local) return { src: p.imagen_local, nota: p.imagen_local_nota || "" };
    return { src: "", nota: "" };
  }
  function textoEnvio(d) {
    if (d.origen_envio === "local") return "Envío desde almacén en tu país: " + d.dias_envio;
    return "Envío internacional con seguimiento: " + d.dias_envio;
  }
  function enlaceWhats(p, paisNombre) {
    var msg = "Hola, escribo desde la tienda de Granja Rentable. Me interesa: " + p.nombre + " (" + paisNombre + ")";
    return "https://wa.me/" + WA + "?text=" + encodeURIComponent(msg);
  }
  function botonCompra(p, pais, paisNombre) {
    var d = datosPais(p, pais);
    if (p.link_pago) {
      return '<a class="btn gold js-comprar" data-checkout href="' + esc(p.link_pago) +
        '" data-producto="' + esc(p.nombre) + '">Comprar · ' + esc(formatoPrecio(d.precio, d.moneda)) + "</a>";
    }
    return '<a class="btn gold" target="_blank" rel="noopener" href="' +
      esc(enlaceWhats(p, paisNombre)) + '">Pedir por WhatsApp · ' +
      esc(formatoPrecio(d.precio, d.moneda)) + "</a>";
  }

  /* ---------- Portada de la tienda ---------- */
  function tarjeta(p, pais) {
    var d = datosPais(p, pais);
    var img = imagenDe(p);
    var media = img.src
      ? '<img src="' + esc(img.src) + '" alt="' + esc(p.nombre) + '" loading="lazy" width="640" height="480">'
      : '<div class="t-sin-foto">Foto en preparación</div>';
    var badge = esMasVendido(p) ? '<span class="t-badge">Más vendido</span>' : "";
    return '<article class="pcard">' +
      '<a class="pcard-media" href="producto.html?p=' + esc(p.slug) + '" aria-label="' + esc(p.nombre) + '">' + media + badge + "</a>" +
      '<div class="pcard-body">' +
      '<span class="pcard-cat">' + esc(CATS[p.categoria] || p.categoria) + "</span>" +
      '<h3><a href="producto.html?p=' + esc(p.slug) + '">' + esc(p.nombre) + "</a></h3>" +
      '<p class="t-desc">' + esc(p.descripcion_corta) + "</p>" +
      '<p class="t-rating"><span class="t-stars" aria-hidden="true">' + estrellas(p.rating) + "</span> " +
      Number(p.rating).toFixed(1).replace(".", ",") + " · " + esc(p.pedidos) + " vendidos</p>" +
      '<p class="t-precio">' + esc(formatoPrecio(d.precio, d.moneda)) + "</p>" +
      '<p class="t-envio">' + esc(textoEnvio(d)) + "</p>" +
      '<a class="btn sec" href="producto.html?p=' + esc(p.slug) + '">Ver ficha y pedir</a>' +
      "</div></article>";
  }
  function pintarChips() {
    var caja = $("#tienda-chips");
    if (!caja) return;
    var presentes = ORDEN_CATS.filter(function (c) {
      return portada.lista.some(function (p) { return p.categoria === c; });
    });
    portada.lista.forEach(function (p) {
      if (ORDEN_CATS.indexOf(p.categoria) === -1 && presentes.indexOf(p.categoria) === -1) presentes.push(p.categoria);
    });
    var html = '<button type="button" class="t-chip" data-cat="todas" aria-pressed="' +
      (filtro.cat === "todas") + '">Todo (' + portada.lista.length + ")</button>";
    presentes.forEach(function (c) {
      var n = portada.lista.filter(function (p) { return p.categoria === c; }).length;
      html += '<button type="button" class="t-chip" data-cat="' + esc(c) + '" aria-pressed="' +
        (filtro.cat === c) + '">' + esc(CATS[c] || c) + " (" + n + ")</button>";
    });
    caja.innerHTML = html;
  }
  function coincide(p) {
    if (filtro.cat !== "todas" && p.categoria !== filtro.cat) return false;
    if (!filtro.q) return true;
    var texto = norm(p.nombre + " " + (p.descripcion_corta || "") + " " + (CATS[p.categoria] || p.categoria));
    return texto.indexOf(filtro.q) !== -1;
  }
  function pintarGrid() {
    var zona = $("#tienda-catalogo");
    if (!zona || !portada.pais) return;
    var pais = portada.pais;
    var filtrando = filtro.cat !== "todas" || !!filtro.q;
    if (!filtrando) {
      var html = "";
      ORDEN_CATS.forEach(function (c) {
        var grupo = portada.lista.filter(function (p) { return p.categoria === c; });
        if (!grupo.length) return;
        html += '<h2 class="t-cat">' + esc(CATS[c]) + '</h2><div class="pgrid">' +
          grupo.map(function (p) { return tarjeta(p, pais); }).join("") + "</div>";
      });
      var resto = portada.lista.filter(function (p) { return ORDEN_CATS.indexOf(p.categoria) === -1; });
      if (resto.length) {
        html += '<h2 class="t-cat">Más equipamiento</h2><div class="pgrid">' +
          resto.map(function (p) { return tarjeta(p, pais); }).join("") + "</div>";
      }
      zona.innerHTML = html;
      return;
    }
    var res = portada.lista.filter(coincide);
    if (!res.length) {
      zona.innerHTML = '<div class="t-vacio"><p><strong>Ningún producto coincide con ese filtro.</strong></p>' +
        "<p>Prueba con otra palabra o revisa el catálogo completo de tu país.</p>" +
        '<p><button type="button" class="btn sec" id="tienda-limpiar">Ver todo el catálogo</button></p></div>';
      var limpiar = $("#tienda-limpiar");
      if (limpiar) limpiar.addEventListener("click", limpiarFiltros);
      return;
    }
    zona.innerHTML = '<p class="t-resultados">' + res.length + (res.length === 1 ? " producto" : " productos") +
      ' para tu país</p><div class="pgrid">' +
      res.map(function (p) { return tarjeta(p, pais); }).join("") + "</div>";
  }
  function limpiarFiltros() {
    filtro.cat = "todas";
    filtro.q = "";
    var input = $("#tienda-buscar");
    if (input) input.value = "";
    pintarChips();
    pintarGrid();
  }
  function prepararFiltros() {
    if (filtrosListos) return;
    var chips = $("#tienda-chips");
    var buscar = $("#tienda-buscar");
    if (!chips || !buscar) return;
    filtrosListos = true;
    chips.addEventListener("click", function (ev) {
      var b = ev.target.closest ? ev.target.closest("button[data-cat]") : null;
      if (!b) return;
      filtro.cat = b.getAttribute("data-cat") || "todas";
      var botones = chips.querySelectorAll("button[data-cat]");
      for (var i = 0; i < botones.length; i++) {
        botones[i].setAttribute("aria-pressed", botones[i] === b ? "true" : "false");
      }
      pintarGrid();
    });
    buscar.addEventListener("input", function () {
      filtro.q = norm(buscar.value).trim();
      pintarGrid();
    });
  }
  function pintarPortada(pais) {
    var nombrePais = (CAT.paises[pais] && CAT.paises[pais].nombre) || pais;
    var etiqueta = $("#tienda-pais");
    if (etiqueta) etiqueta.textContent = "Envíos a: " + nombrePais;
    var zona = $("#tienda-catalogo");
    var llegando = $("#tienda-llegando");
    var cajaFiltros = $("#tienda-filtros");
    var como = $("#tienda-como");
    var activo = CAT.paises_activos.indexOf(pais) !== -1;
    var lista = activo ? CAT.productos.filter(function (p) { return visible(p, pais); }) : [];
    portada.pais = pais;
    portada.lista = lista;
    if (!lista.length) {
      if (zona) zona.innerHTML = "";
      if (cajaFiltros) cajaFiltros.hidden = true;
      if (como) como.hidden = true;
      if (llegando) {
        llegando.hidden = false;
        var t = $("#llegando-titulo");
        if (t) t.textContent = "Estamos llegando a " + nombrePais;
        var b = $("#llegando-wa");
        if (b) b.href = "https://wa.me/" + WA + "?text=" +
          encodeURIComponent("Hola, escribo desde la tienda de Granja Rentable. Soy de " + nombrePais + " y quiero saber cuándo podré comprar.");
      }
      return;
    }
    if (llegando) llegando.hidden = true;
    if (como) como.hidden = false;
    if (cajaFiltros) cajaFiltros.hidden = false;
    prepararFiltros();
    pintarChips();
    pintarGrid();
  }

  /* ---------- Ficha de producto ---------- */
  function pintarFicha(pais) {
    var zona = $("#tienda-ficha");
    if (!zona) return;
    var slug = null;
    try { slug = new URLSearchParams(location.search).get("p"); } catch (e) {}
    var p = null;
    CAT.productos.forEach(function (x) { if (x.slug === slug) p = x; });
    var nombrePais = (CAT.paises[pais] && CAT.paises[pais].nombre) || pais;
    if (!p) {
      zona.innerHTML = '<div class="note"><p>Ese producto no está en el catálogo. ' +
        '<a href="./">Volver a la tienda</a></p></div>';
      return;
    }
    document.title = p.nombre + " · Tienda Granja Rentable";
    var img = imagenDe(p);
    var galeria = img.src
      ? '<img src="' + esc(img.src) + '" alt="' + esc(p.nombre) + '" width="760" height="570">' +
        (img.nota ? '<p class="t-nota-foto">' + esc(img.nota) + "</p>" : "")
      : '<div class="t-sin-foto t-sin-foto-grande">Foto en preparación</div>';
    var d = visible(p, pais) ? datosPais(p, pais) : null;
    var compra;
    if (d) {
      compra = '<p class="t-precio t-precio-grande">' + esc(formatoPrecio(d.precio, d.moneda)) + "</p>" +
        '<p class="t-envio">' + esc(textoEnvio(d)) + "</p>" +
        (d.nota ? '<p class="t-nota-pais">' + esc(d.nota) + "</p>" : "") +
        botonCompra(p, pais, nombrePais) +
        '<p class="t-garantia">Selección curada por Granja Rentable: solo vendemos productos con nota alta y cientos de pedidos reales. El pedido lo prepara y envía el proveedor con número de seguimiento. Devolución en 14 días si el producto no es el de la ficha.</p>';
    } else if (!p.activo) {
      compra = '<div class="note"><p><strong>Producto no disponible ahora mismo.</strong> Lo hemos retirado de la venta mientras revisamos su stock con el proveedor. Escríbenos por WhatsApp y te avisamos en cuanto vuelva.</p>' +
        '<a class="btn gold" target="_blank" rel="noopener" href="' + esc(enlaceWhats(p, nombrePais)) + '">Avisarme por WhatsApp</a></div>';
    } else {
      compra = '<div class="note"><p><strong>Todavía no enviamos este producto a ' + esc(nombrePais) + ".</strong> " +
        "Estamos abriendo países por orden y el tuyo está en la lista. Por WhatsApp te contamos alternativas y te avisamos cuando esté activo.</p>" +
        '<a class="btn gold" target="_blank" rel="noopener" href="' + esc(enlaceWhats(p, nombrePais)) + '">Preguntar por WhatsApp</a></div>';
    }
    var incluye = (p.incluye || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("");
    var utilidades = (p.utilidades || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("");
    var uso = (p.como_se_usa || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("");
    zona.innerHTML =
      '<p class="pdp-cat">' + esc(CATS[p.categoria] || p.categoria) + " · Tienda Granja Rentable</p>" +
      "<h1>" + esc(p.nombre) + "</h1>" +
      '<p class="t-rating t-rating-ficha"><span class="t-stars" aria-hidden="true">' + estrellas(p.rating) + "</span> " +
      Number(p.rating).toFixed(1).replace(".", ",") + " de nota media · " + esc(p.pedidos) + " vendidos</p>" +
      '<div class="pdp-grid"><div class="pdp-media">' + galeria + '</div>' +
      '<div class="pdp-buy">' + compra + "</div></div>" +
      '<div class="pdp-copy"><p>' + esc(p.descripcion) + "</p>" +
      (incluye ? "<h2>Qué incluye</h2><ul>" + incluye + "</ul>" : "") +
      (utilidades ? "<h2>Utilidades</h2><ul>" + utilidades + "</ul>" : "") +
      (uso ? "<h2>Cómo se usa</h2><ol>" + uso + "</ol>" : "") +
      "<h2>Cómo funciona tu pedido</h2><p>Granja Rentable selecciona y verifica cada producto. Al pedir, el proveedor prepara tu paquete y lo envía con número de seguimiento hasta tu país; el plazo que ves arriba ya es el estimado para " + esc(nombrePais) + ". Si el producto llega distinto a la ficha o defectuoso, tienes 14 días para escribirnos y gestionamos la devolución o el reembolso contigo.</p></div>";
    var volver = $("#tienda-volver");
    if (volver) volver.hidden = false;
  }

  /* ---------- Arranque ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    detectarPais().then(function (pais) {
      pintarPortada(pais);
      pintarFicha(pais);
    });
  });
})();
