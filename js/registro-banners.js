/* Impresiones y clics de los banners propios (ebooks y Amazon).
   Una impresión por banner y carga de página, al verse al menos la mitad.
   No usa cookies ni guarda IP ni datos personales. */
(function () {
  var GR = window.GR || {};
  var endpoint = String(GR.formEndpoint || "").trim();
  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(endpoint)) return;

  var vistos = Object.create(null);
  var banners = document.querySelectorAll("[data-banner]");
  if (!banners.length) return;

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
      body: texto
    }).catch(function () {});
  }

  if ("IntersectionObserver" in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting || entrada.intersectionRatio < 0.5) return;
        var id = idDe(entrada.target);
        if (!id || vistos[id]) return;
        vistos[id] = true;
        observador.unobserve(entrada.target);
        enviar(id, "impresion");
      });
    }, { threshold: [0.5] });
    banners.forEach(function (nodo) { observador.observe(nodo); });
  }

  document.addEventListener("click", function (ev) {
    var enlace = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if (!enlace) return;
    var nodo = enlace.closest("[data-banner]");
    if (!nodo) return;
    enviar(idDe(nodo), "clic");
  });
})();
