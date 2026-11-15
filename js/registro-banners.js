/* Impresiones y clics de los banners propios (ebooks y Amazon).
   Una impresión por banner y carga de página, al verse al menos la mitad.
   No usa cookies ni guarda IP ni datos personales. */
(function () {
  var GR = window.GR || {};
  var endpoint = String(GR.formEndpoint || "").trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint)) return;

  var vistos = Object.create(null);
  var banners = document.querySelectorAll("[data-banner]");

  function dominio(ref) {
    if (!ref) return "";
    try {
      return new URL(ref).hostname.replace(/^www\./, "").slice(0, 80);
    } catch (e) {
      return "";
    }
  }

  function idDe(nodo) {
    if (!nodo) return "";
    var id = nodo.getAttribute("data-banner") || "";
    if (/^[a-z0-9-]{1,40}$/.test(id)) return id;
    var enlace = nodo.querySelector("a[href]");
    if (!enlace) return "";
    try {
      var url = new URL(enlace.getAttribute("href"), location.href);
      return (url.pathname + url.hash).replace(/[^a-z0-9#/_-]/gi, "").slice(0, 40);
    } catch (e2) {
      return "";
    }
  }

  function enviar(id, evento) {
    if (!id || (evento !== "impresion" && evento !== "clic")) return;
    var cuerpo = new URLSearchParams();
    cuerpo.set("accion", "banner");
    cuerpo.set("fecha", new Date().toISOString());
    cuerpo.set("banner", id);
    cuerpo.set("evento", evento);
    cuerpo.set("pagina", location.pathname.slice(0, 200));
    cuerpo.set("referrer", dominio(document.referrer));
    var url = endpoint + "?accion=banner";
    var texto = cuerpo.toString();
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(url, new Blob(
        [texto],
        { type: "application/x-www-form-urlencoded;charset=UTF-8" }
      ))) return;
    } catch (e) {}
    fetch(url, {
      method: "POST",
      mode: "no-cors",
      keepalive: true,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: texto
    }).catch(function () {});
  }

  // El informe usa los registros guias-{grupo}-{evento}, separados de los
  // banners propios. Una visita cuenta aunque el proveedor no sirva creatividad.
  var grupoEnsayo = "";
  function ensayoVigente() {
    try {
      return grupoEnsayo && localStorage.getItem("gr_adsterra_consent_v1") === "si" &&
        document.querySelector("[data-ensayo-guias]") && !(window.esPremiumLocal && window.esPremiumLocal());
    } catch (e) { return false; }
  }
  function registrarEnsayo() {
    if (!window.ads || !window.ads.ensayoGuias || grupoEnsayo) return;
    var zona = document.querySelector("[data-ensayo-guias]");
    if (!zona) return;
    var grupo = zona.dataset.ensayoGuias;
    if (grupo !== "final" && grupo !== "interior") return;
    grupoEnsayo = grupo;
    if (!ensayoVigente()) return;
    enviar("guias-" + grupo + "-visita", "impresion");
    var lectura = document.querySelector("[data-lectura-ensayo]");
    if (!lectura || !("IntersectionObserver" in window)) return;
    var observadorLectura = new IntersectionObserver(function (entradas) {
      if (entradas.some(function (e) { return e.isIntersecting && e.intersectionRatio >= 0.5; })) {
        observadorLectura.disconnect();
        if (ensayoVigente()) enviar("guias-" + grupo + "-lectura", "impresion");
      }
    }, { threshold: 0.5 });
    observadorLectura.observe(lectura);
  }
  document.addEventListener("gr-ensayo-guias", registrarEnsayo);
  registrarEnsayo();
  if ("IntersectionObserver" in window && banners.length) {
    var visibles = new Set();
    function registrarVisible(nodo) {
      if (!visibles.has(nodo) || nodo.closest('[aria-hidden="true"], [inert]')) return;
      var id = idDe(nodo);
      if (!id || vistos[id]) return;
      vistos[id] = true;
      observador.unobserve(nodo);
      visibles.delete(nodo);
      enviar(id, "impresion");
    }
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting || entrada.intersectionRatio < 0.5) {
          visibles.delete(entrada.target);
          return;
        }
        visibles.add(entrada.target);
        registrarVisible(entrada.target);
      });
    }, { threshold: [0.5] });
    banners.forEach(function (nodo) { observador.observe(nodo); });
    document.addEventListener("gr-promo-change", function () {
      banners.forEach(registrarVisible);
    });
  }

  document.addEventListener("click", function (ev) {
    var enlace = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!enlace) return;
    if (ensayoVigente() && enlace.closest("main")) {
      var destino = new URL(enlace.href, location.href);
      var categoria = "";
      if (destino.origin === location.origin) {
        if (/^\/ebooks(?:\/|$)/.test(destino.pathname)) categoria = "ebooks";
        if (/^\/tienda(?:\/|\.html$|$)/.test(destino.pathname)) categoria = "tienda";
      } else if (/^(?:www\.)?(?:amazon\.com|amzn\.to)$/.test(destino.hostname)) {
        categoria = "amazon";
      }
      if (categoria) enviar("guias-" + grupoEnsayo + "-" + categoria, "clic");
    }
    var nodo = enlace.closest("[data-banner]");
    if (!nodo) return;
    enviar(idDe(nodo), "clic");
  });
})();
