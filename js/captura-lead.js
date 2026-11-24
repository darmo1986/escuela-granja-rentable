/* Captura de correo (mejora 6, v. tema). Bind de form[data-gr-captura].
   No toca form[data-gr-form] (lista, afiliados, registro, app): esos siguen en site.js.
   Envía JSON al formEndpoint, igual que site.js (text/plain para evitar preflight).
   Campo tema: pienso | ponedoras | empezar. El selector manda; si no hay, se deduce de la URL. */
(function () {
  var GR = window.GR || {};
  var endpoint = (GR.formEndpoint || "").trim();
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var TEMAS = { pienso: true, ponedoras: true, empezar: true };
  var MSG = {
    contacto: "Listo. Hemos guardado tu consulta. Te responderemos a ese correo.",
    calculadora: "Listo. Guardamos tu correo. Te escribiremos con el enlace a las hojas de registro gratis y novedades.",
    curso: "Listo. Guardamos tu correo. Te avisaremos de nuevas lecciones y te enviaremos el enlace a las hojas de registro gratis.",
    video: "Listo. Guardamos tu correo. Te avisaremos cuando haya videos nuevos y te enviaremos el enlace a las hojas de registro gratis.",
    ok: "Listo. Guardamos tu correo."
  };
  var ERR = {
    sin_consentimiento: "No se guardó: falta marcar la casilla de privacidad.",
    sin_correo: "No se guardó: falta un correo válido.",
    sin_mensaje: "Escribe un mensaje un poco más largo (al menos 10 caracteres)."
  };

  function normalizarTema(v) {
    v = String(v || "").toLowerCase().trim();
    if (TEMAS[v]) return v;
    if (/pienso|alimento|saco|coste-docena|coste_docena|comedero/.test(v)) return "pienso";
    if (/ponedoras|puesta|yema|alimenta-ponedoras/.test(v)) return "ponedoras";
    if (/empezar|inicio|incub|lista/.test(v)) return "empezar";
    return "";
  }

  function temaDesdeUbicacion(path, hash, interes) {
    var t = ((path || "") + " " + (hash || "") + " " + (interes || "")).toLowerCase();
    if (/#coste-docena|#alimento|#sacos|pienso-hacer|pienso-elegir|pienso-iniciador|l04a|l04b/.test(t)) return "pienso";
    if (/alimenta-ponedoras|ponedoras|puesta|l05/.test(t)) return "ponedoras";
    if (/guia-empezar|empezar-con-10|lista\.html|l01|l02|l03/.test(t)) return "empezar";
    return "empezar";
  }

  function temaDeFormulario(form) {
    var sel = form.querySelector("select[name=tema]");
    var n = sel ? normalizarTema(sel.value) : "";
    if (n) return n;
    var hid = form.querySelector("input[name=tema]");
    n = hid ? normalizarTema(hid.value) : "";
    if (n) return n;
    var interesEl = form.querySelector("[name=interes]");
    var interes = interesEl ? interesEl.value : "";
    return temaDesdeUbicacion(location.pathname, location.hash, interes);
  }

  function preseleccionarTema() {
    document.querySelectorAll("form[data-gr-captura] select[name=tema]").forEach(function (sel) {
      if (sel.getAttribute("data-user") === "1") return;
      var form = sel.form;
      var auto = temaDesdeUbicacion(location.pathname, location.hash, "");
      if (TEMAS[auto]) sel.value = auto;
    });
  }

  window.GRTema = {
    normalizar: normalizarTema,
    desdeUbicacion: temaDesdeUbicacion
  };

  function say(form, t) {
    var msg = form.querySelector(".form-msg, [role=status]");
    if (msg) msg.textContent = t;
  }

  function cookieRef() {
    try {
      var m = document.cookie.match(/(?:^|; )gr_ref=([^;]*)/);
      return m ? decodeURIComponent(m[1]) : "";
    } catch (e) { return ""; }
  }

  function postToSheet(url, data) {
    return fetch(url, {
      method: "POST",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(data)
    }).then(function (r) {
      return r.text().then(function (t) {
        var body = {};
        try { body = JSON.parse(t); } catch (e) { body = {}; }
        if (!r.ok || !body || body.ok !== true) {
          var err = new Error((body && body.error) || "post");
          err.code = body && body.error;
          throw err;
        }
      });
    });
  }

  preseleccionarTema();
  document.querySelectorAll("form[data-gr-captura] select[name=tema]").forEach(function (sel) {
    sel.addEventListener("change", function () { sel.setAttribute("data-user", "1"); });
  });

  document.querySelectorAll("form[data-gr-captura]").forEach(function (form) {
    if (endpoint) form.action = endpoint;
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (form.dataset.sending === "1") return;
      var hp = form.querySelector("[name=_gotcha]");
      if (hp && hp.value) { say(form, "Listo."); return; }
      var nombre = form.querySelector("[name=nombre]");
      var emailEl = form.querySelector("[name=email]");
      var emailVal = emailEl ? emailEl.value.trim() : "";
      if (nombre && nombre.hasAttribute("required") && !nombre.value.trim()) {
        say(form, "Escribe tu nombre.");
        nombre.focus();
        return;
      }
      if (!emailVal) { say(form, "Escribe tu correo."); if (emailEl) emailEl.focus(); return; }
      if (!EMAIL_RE.test(emailVal)) { say(form, "Ese correo no parece válido."); emailEl.focus(); return; }
      var consent = form.querySelector("[name=consentimiento]");
      if (!consent || !consent.checked) {
        say(form, "Para continuar, marca la casilla de privacidad.");
        if (consent) consent.focus();
        return;
      }
      var mensajeEl = form.querySelector("[name=mensaje]");
      if (mensajeEl && mensajeEl.hasAttribute("required")) {
        var texto = mensajeEl.value.trim();
        if (texto.length < 10) {
          say(form, ERR.sin_mensaje);
          mensajeEl.focus();
          return;
        }
      }
      if (!endpoint) {
        say(form, "Ahora mismo el formulario no puede enviar los datos. Si te urge, escríbenos a ventas@granjarentable.com o por WhatsApp.");
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      var typo = form.getAttribute("data-gr-captura") || data.tipo || "";
      data.tipo = typo;
      if (data.motivo && !data.interes) data.interes = data.motivo;
      data.tema = temaDeFormulario(form);
      try {
        var pais = window.localStorage ? localStorage.getItem("gr_pais") : "";
        if (pais) data.pais = pais;
      } catch (e) {}
      if (!data.ref) data.ref = cookieRef();
      data.origen = location.href;
      data.consentimiento = "si";
      if (!data._gotcha) data._gotcha = "";
      say(form, "Enviando…");
      var btn = form.querySelector("[type=submit]");
      form.dataset.sending = "1";
      if (btn) btn.disabled = true;
      postToSheet(endpoint, data).then(function () {
        say(form, MSG[typo] || MSG.ok);
        form.reset();
        preseleccionarTema();
        form.dataset.sending = "";
        if (btn) btn.disabled = false;
      }).catch(function (err) {
        say(form, ERR[err && err.code] || "No se pudo enviar. Revisa tu conexión o escríbenos a ventas@granjarentable.com.");
        form.dataset.sending = "";
        if (btn) btn.disabled = false;
      });
    });
  });
})();
