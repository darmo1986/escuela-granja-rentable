/* Infolinks en granjarentable.com. Apagado hasta pegar el PID y el WSID.
   El aviso de cookies es el de esta web (gr_consent y data-ads de boot.js).
   En el EEE, Reino Unido, Suiza y el resto de zonas donde el sitio pide
   Aceptar, no se descarga resources.infolinks.com hasta gr_consent = si.
   Adsterra no se configura aquí. */
var INFOLINKS_ENABLED = false;
var INFOLINKS_PID = "";
var INFOLINKS_WSID = "";

(function () {
  var SCRIPT = "https://resources.infolinks.com/js/infolinks_main.js";
  var CK = "gr_consent";

  function pidOk(v) {
    return /^[1-9][0-9]{0,11}$/.test(String(v == null ? "" : v).trim());
  }
  function wsidOk(v) {
    return /^[0-9]{1,12}$/.test(String(v == null ? "" : v).trim());
  }
  function encendido() {
    return INFOLINKS_ENABLED === true && pidOk(INFOLINKS_PID) && wsidOk(INFOLINKS_WSID);
  }
  function adsDeEstaWeb() {
    return !!(window.ads && window.ads.activo === true);
  }
  function premium() {
    if (document.documentElement.classList.contains("ad-off")) return true;
    if (typeof window.GR_esPremium === "function" && window.GR_esPremium()) return true;
    var u = window.GRAuth && window.GRAuth.usuarioActual;
    if (u && u.premium) {
      var fh = u.premiumHasta || u.premium_hasta;
      if (fh && Date.parse(fh) > Date.now()) return true;
    }
    return false;
  }
  function ruta() {
    var path = "";
    try { path = decodeURIComponent(location.pathname || ""); } catch (e) { path = location.pathname || ""; }
    return path.toLowerCase();
  }
  /* Lecciones, examen, certificado y Premium: el script no entra.
     Infolinks recorre toda la página; no hay forma de dejar el test fuera
     si el script ya se pidió. */
  function paginaExcluida() {
    var path = ruta();
    var partes = path.split("/").filter(Boolean);
    var ultimo = partes[partes.length - 1] || "";
    if (/^(curso|leccion|examen-final|preguntas|premium)(\.html)?$/.test(ultimo)) return true;
    if (partes.indexOf("lecciones") >= 0 || partes.indexOf("premium") >= 0) return true;
    if (/certific|diploma|constancia/.test(path)) return true;
    if (document.querySelector("section.quiz, [data-exam]")) return true;
    return false;
  }
  function estricto() {
    return document.documentElement.dataset.ads !== "libre";
  }
  function consentimiento() {
    try { return localStorage.getItem(CK); } catch (e) { return null; }
  }
  function pedirDeNuevo() {
    try { return sessionStorage.getItem("gr_pedir_cookies") === "1"; } catch (e) { return false; }
  }
  function esperaPremium() {
    try {
      if (/[?&]premium=ok(?:&|$)/.test(location.search)) sessionStorage.setItem("gr_premium_espera", String(Date.now()));
      var t = Number(sessionStorage.getItem("gr_premium_espera") || 0);
      return t > 0 && Date.now() - t < 120000;
    } catch (e) { return false; }
  }
  function puedeCargar() {
    if (!encendido() || premium() || paginaExcluida() || esperaPremium()) return false;
    var c = consentimiento();
    if (c === "no") return false;
    if (estricto() || pedirDeNuevo()) return c === "si";
    return true;
  }
  function yaEsta() {
    return !!document.querySelector('script[src="' + SCRIPT + '"]');
  }
  /* Snippet público de Infolinks: infolinks_pid, infolinks_wsid y
     resources.infolinks.com/js/infolinks_main.js.
     No hay una variable documentada para apagar InScreen, intersticiales
     o pop-ups: eso se deja apagado en el panel (ver el README). */
  function cargar() {
    if (window.__infolinksLoaded || yaEsta()) return;
    if (!puedeCargar()) return;
    window.__infolinksLoaded = 1;
    var pid = String(INFOLINKS_PID).trim();
    var wsid = String(INFOLINKS_WSID).trim();
    window.infolinks_pid = Number(pid);
    window.infolinks_wsid = Number(wsid);
    var inline = document.createElement("script");
    inline.type = "text/javascript";
    inline.text = "var infolinks_pid = " + pid + ";\nvar infolinks_wsid = " + wsid + ";";
    document.body.appendChild(inline);
    var s = document.createElement("script");
    s.type = "text/javascript";
    s.async = false;
    s.src = SCRIPT;
    document.body.appendChild(s);
  }
  function raiz() {
    return (document.body && document.body.dataset && document.body.dataset.root) || "";
  }
  function cerrarPregunta() {
    try { sessionStorage.removeItem("gr_pedir_cookies"); } catch (e) {}
  }
  function guardar(c) {
    try { localStorage.setItem(CK, c); } catch (e) {}
    cerrarPregunta();
  }
  function banner() {
    if (document.getElementById("cookie-banner") || document.getElementById("cookie-note")) return;
    if (!encendido() || premium()) return;
    var b = document.createElement("div");
    b.id = "cookie-banner";
    b.setAttribute("role", "dialog");
    b.setAttribute("aria-labelledby", "cookie-title");
    b.innerHTML = '<strong id="cookie-title">Aviso de cookies</strong><p style="margin:.3em 0">Usamos cookies de publicidad (Infolinks) para mostrar anuncios discretos y así mantener el curso gratis. Solo se activan si aceptas. La cuenta, si entras, se guarda aparte en este navegador y no depende de este aviso. <a href="' + raiz() + 'cookies.html">Política de cookies</a></p><div class="row"><button class="btn" type="button" data-c="si">Aceptar</button><button class="btn sec" type="button" data-c="no">Rechazar</button></div>';
    b.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-c]") : e.target;
      var c = t && t.getAttribute && t.getAttribute("data-c");
      if (c !== "si" && c !== "no") return;
      guardar(c);
      b.remove();
      if (c === "si") cargar();
    });
    document.body.appendChild(b);
  }
  function notaLibre() {
    if (adsDeEstaWeb() || document.getElementById("cookie-note") || document.getElementById("cookie-banner")) return;
    if (!encendido() || premium() || paginaExcluida()) return;
    var n = document.createElement("aside");
    n.id = "cookie-note";
    n.setAttribute("role", "note");
    n.innerHTML = '<span>Mostramos anuncios de Infolinks para mantener el curso gratis.</span> <a href="' + raiz() + 'cookies.html">Política de cookies</a> <button type="button" class="btn sec" data-c="no">Rechazar</button>';
    n.addEventListener("click", function (e) {
      var t = e.target && e.target.closest ? e.target.closest("[data-c]") : e.target;
      if (!t || !t.getAttribute || t.getAttribute("data-c") !== "no") return;
      guardar("no");
      n.remove();
      if (window.__infolinksLoaded) location.reload();
    });
    var main = document.querySelector("main");
    if (main && main.prepend) main.prepend(n);
    else document.body.appendChild(n);
  }
  function arrancar() {
    if (!encendido() || premium() || esperaPremium()) return;
    if (adsDeEstaWeb()) {
      if (puedeCargar()) cargar();
      return;
    }
    if (paginaExcluida()) return;
    var c = consentimiento();
    if (estricto() || pedirDeNuevo()) {
      if (c === "si" && !pedirDeNuevo()) cargar();
      else if (!c || pedirDeNuevo()) banner();
      return;
    }
    if (c === "no") return;
    cargar();
    notaLibre();
  }
  document.addEventListener("click", function (e) {
    var a = e.target && e.target.closest ? e.target.closest("[data-cookie-config]") : null;
    if (!a || !encendido() || premium() || adsDeEstaWeb()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    try { localStorage.removeItem(CK); } catch (err) {}
    try { sessionStorage.setItem("gr_pedir_cookies", "1"); } catch (err2) {}
    window.__infolinksLoaded = 0;
    var prev = document.getElementById("cookie-banner");
    if (prev) prev.remove();
    var note = document.getElementById("cookie-note");
    if (note) note.remove();
    banner();
  }, true);
  document.addEventListener("click", function (e) {
    var t = e.target && e.target.closest ? e.target.closest("[data-c]") : null;
    if (!t || !t.getAttribute || t.getAttribute("data-c") !== "si") return;
    if (t.closest && t.closest("#cookie-banner") && !adsDeEstaWeb()) return;
    cargar();
  });
  function cuandoSeSepaPremium() {
    if (!encendido()) return;
    if (premium() || esperaPremium()) return;
    var sesion = false;
    var listo = false;
    try { sesion = !!localStorage.getItem("gr-auth"); } catch (e) {}
    try { listo = localStorage.getItem("gr_premium_listo") === "1"; } catch (e2) {}
    if (!sesion || listo) { arrancar(); return; }
    var hecho = false;
    function seguir() {
      if (hecho || premium() || esperaPremium()) { hecho = true; return; }
      var ok = false;
      try { ok = localStorage.getItem("gr_premium_listo") === "1"; } catch (e3) {}
      if (!ok) return;
      hecho = true;
      arrancar();
    }
    window.addEventListener("gr-premium", seguir);
    setTimeout(function () {
      if (hecho || premium() || esperaPremium()) return;
      hecho = true;
      arrancar();
    }, 1500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", cuandoSeSepaPremium);
  else cuandoSeSepaPremium();
})();
