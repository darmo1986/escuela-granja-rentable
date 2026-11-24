/* Captura de correo (mejora 6). Bind de form[data-gr-captura].
   No toca form[data-gr-form] (lista, afiliados, registro, app): esos siguen en site.js.
   Envía JSON al formEndpoint, igual que site.js (text/plain para evitar preflight). */
(function () {
  var GR = window.GR || {};
  var endpoint = (GR.formEndpoint || "").trim();
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  var MSG = {
    contacto: "Listo. Hemos guardado tu consulta. Te responderemos a ese correo.",
    calculadora: "Listo. Guardamos tu correo. Te escribiremos con el enlace a la guía (el ebook se compra en la web, a 3,00 USD) y con novedades del curso.",
    curso: "Listo. Guardamos tu correo. Te avisaremos cuando salgan nuevas lecciones y te escribiremos con el enlace a los ebooks (se compran en la web, a 3,00 USD).",
    video: "Listo. Guardamos tu correo. Te avisaremos cuando haya videos nuevos.",
    ok: "Listo. Guardamos tu correo."
  };
  var ERR = {
    sin_consentimiento: "No se guardó: falta marcar la casilla de privacidad.",
    sin_correo: "No se guardó: falta un correo válido.",
    sin_mensaje: "Escribe un mensaje un poco más largo (al menos 10 caracteres)."
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
      var tipo = form.getAttribute("data-gr-captura") || data.tipo || "";
      data.tipo = tipo;
      if (data.motivo && !data.interes) {
        data.interes = data.motivo;
      }
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
        say(form, MSG[tipo] || MSG.ok);
        form.reset();
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
