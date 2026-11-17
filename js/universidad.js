/* Suscripción de la Universidad. El importe lo fija el Apps Script.
   Con UNI_MODO distinto de "live" el botón de pago no se muestra,
   salvo la prueba que el propietario abre con UNI_PRUEBA y ?prueba=1. */
(function () {
  var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyeSZCE95DI1wdls0MiNoKdh92i8ve0GkkJHy4GAY3p4pWsBCRhs0hb3bmUMTV-Xw0Wzw/exec";
  var CONSENT_VERSION = "digital-inmediato-v1";
  var TOKEN_KEY = "gr_uni_sesion";
  var errores = {
    no_disponible: "Esta suscripción todavía no está a la venta.",
    sin_consentimiento: "Marca la casilla del contenido digital para poder suscribirte.",
    sin_secreto: "El pago no está configurado. Escríbenos y no repitas el intento.",
    stripe: "No se pudo hablar con Stripe. Inténtalo de nuevo.",
    pago_no_confirmado: "Stripe todavía no confirma la suscripción. Si se te ha cobrado, no vuelvas a pagar: entra con el mismo correo o escríbenos.",
    sin_suscripcion: "No hay una suscripción activa para este correo. Si acabas de pagar, espera un momento y entra con el mismo correo del pago.",
    codigo_invalido: "Código incorrecto, caducado o con demasiados intentos. Pide otro.",
    google: "Google no ha confirmado la entrada. Prueba con el código del correo.",
    google_no_configurado: "La entrada con Google todavía no está activada. Usa el código del correo.",
    portal_no_configurado: "No se ha podido abrir el portal de Stripe. Escribe a ventas@granjarentable.com para cancelar. El acceso sigue solo mientras la suscripción esté activa.",
    sesion: "La sesión ha caducado. Entra otra vez.",
    firma_no_configurada: "El acceso todavía no está configurado. Escríbenos.",
    email: "Escribe un correo válido.",
    interno: "No se ha podido completar. Inténtalo de nuevo."
  };
  var noDisponible = document.getElementById("uni-no-disponible");
  var compra = document.getElementById("uni-compra");
  var pruebaNota = document.getElementById("uni-prueba");
  var estadoEl = document.getElementById("uni-estado");
  var aula = document.getElementById("uni-aula");
  var temasEl = document.getElementById("uni-temas");
  var quien = document.getElementById("uni-quien");
  var googleCaja = document.getElementById("uni-google");
  var pagoEnCurso = false;
  var modo = "test";

  function pruebaEnUrl() {
    return /(?:^|[?&])prueba=1(?:&|$)/.test(location.search);
  }

  function decir(texto) {
    if (estadoEl) estadoEl.textContent = texto || "";
  }

  function textoError(d) {
    var clave = d && d.error;
    var base = errores[clave] || errores.interno;
    if (clave === "portal_no_configurado" && d.instruccion) return base;
    return base;
  }

  function llamar(datos) {
    return fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(datos)
    }).then(function (r) { return r.json(); });
  }

  function idGoogle() {
    var u = window.GR && GR.universidad;
    var id = u && String(u.googleClientId || "").trim();
    if (!/^[0-9]+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/.test(id)) return "";
    return id;
  }

  function tokenGuardado() {
    try { return localStorage.getItem(TOKEN_KEY) || ""; } catch (e) { return ""; }
  }

  function guardarToken(token) {
    try {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (e) {}
  }

  function pintarAula(d) {
    if (!aula || !d || !d.ok) return;
    aula.hidden = false;
    if (quien) quien.textContent = "Has entrado con " + (d.email || "tu correo") + ". El acceso sigue mientras la suscripción esté activa" + (d.hasta ? ", hasta el " + d.hasta.slice(0, 10) + "." : ".");
    if (!temasEl) return;
    temasEl.textContent = "";
    (d.temas || []).forEach(function (tema) {
      var item = document.createElement("li");
      var titulo = document.createElement("strong");
      titulo.textContent = tema.titulo || "";
      item.appendChild(titulo);
      if (tema.estado === "proximamente") {
        var marca = document.createElement("span");
        marca.textContent = " Próximamente.";
        item.appendChild(marca);
      }
      var p = document.createElement("p");
      p.textContent = tema.texto || "";
      item.appendChild(p);
      var url = String(tema.video || "");
      if (/^https:\/\/github\.com\/darmo1986\/granja-rentable-curso-videos\/releases\/download\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.mp4$/.test(url)) {
        var video = document.createElement("video");
        video.controls = true;
        video.preload = "metadata";
        video.setAttribute("playsinline", "");
        video.style.width = "100%";
        video.style.maxWidth = "720px";
        video.src = url;
        item.appendChild(video);
      }
      temasEl.appendChild(item);
    });
    if (d.whatsapp) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = d.whatsapp;
      a.textContent = "Escribir por WhatsApp";
      a.setAttribute("data-social", "whatsapp");
      li.appendChild(a);
      temasEl.appendChild(li);
    }
  }

  function entrarCon(d) {
    if (!d || !d.ok || !d.token) {
      if (aula) aula.hidden = true;
      decir(textoError(d));
      return;
    }
    guardarToken(d.token);
    decir("");
    pintarAula(d);
  }

  function actualizarBoton() {
    var caja = document.getElementById("uni-check");
    var boton = document.getElementById("uni-pagar");
    if (boton) boton.disabled = pagoEnCurso || !caja || !caja.checked;
  }

  function mostrarCompra(estado) {
    var abierta = estado && (estado.disponible === true || (pruebaEnUrl() && estado.prueba === true));
    if (!abierta) return;
    if (noDisponible) noDisponible.hidden = true;
    if (compra) compra.hidden = false;
    if (pruebaNota) pruebaNota.hidden = !(estado && estado.prueba === true);
    actualizarBoton();
  }

  function prepararGoogle() {
    var id = idGoogle();
    if (!id || !googleCaja || !window.google || !google.accounts || !google.accounts.id) return;
    googleCaja.hidden = false;
    google.accounts.id.initialize({
      client_id: id,
      callback: function (resp) {
        if (!resp || !resp.credential) {
          decir(errores.google);
          return;
        }
        decir("Comprobando Google…");
        llamar({ tipo: "universidad", accion: "entrar_google", id_token: resp.credential })
          .then(entrarCon)
          .catch(function () { decir(errores.interno); });
      }
    });
    google.accounts.id.renderButton(googleCaja, {
      type: "standard",
      theme: "outline",
      size: "large",
      text: "signin_with",
      shape: "rectangular",
      width: 280
    });
  }

  function cargarGoogle() {
    if (!idGoogle() || !googleCaja) return;
    var s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.onload = prepararGoogle;
    s.onerror = function () {
      if (googleCaja) googleCaja.hidden = true;
    };
    document.head.appendChild(s);
  }

  var caja = document.getElementById("uni-check");
  if (caja) caja.addEventListener("change", actualizarBoton);
  actualizarBoton();

  var botonPagar = document.getElementById("uni-pagar");
  if (botonPagar) botonPagar.addEventListener("click", function () {
    if (pagoEnCurso) return;
    if (!caja || !caja.checked) {
      decir(errores.sin_consentimiento);
      actualizarBoton();
      return;
    }
    var marca = { version: CONSENT_VERSION, producto: "universidad-privada-v1", en: new Date().toISOString() };
    try { localStorage.setItem("gr_uni_consent", JSON.stringify(marca)); } catch (e) {}
    pagoEnCurso = true;
    actualizarBoton();
    decir("Redirigiendo a la página de pago seguro…");
    var datos = {
      tipo: "universidad",
      accion: "crear",
      consentimiento: CONSENT_VERSION,
      consentimiento_en: marca.en
    };
    if (pruebaEnUrl() && modo === "test") datos.prueba = "si";
    llamar(datos).then(function (d) {
      if (d && d.url && String(d.url).indexOf("https://checkout.stripe.com/") === 0) {
        window.location.href = d.url;
        return;
      }
      throw d || new Error("sin_url");
    }).catch(function (d) {
      pagoEnCurso = false;
      actualizarBoton();
      decir(textoError(d));
    });
  });

  window.addEventListener("pageshow", function (evento) {
    if (!evento.persisted) return;
    pagoEnCurso = false;
    actualizarBoton();
    if (estadoEl && estadoEl.textContent === "Redirigiendo a la página de pago seguro…") {
      decir("Has vuelto sin completar el pago. Revisa el estado antes de iniciar otra suscripción.");
    }
  });

  var formCodigo = document.getElementById("uni-codigo-form");
  if (formCodigo) formCodigo.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var email = document.getElementById("uni-email").value;
    var boton = formCodigo.querySelector("button");
    if (boton) boton.disabled = true;
    decir("Si ese correo tiene una suscripción activa, te enviamos un código. Revisa también el spam.");
    llamar({ tipo: "universidad", accion: "enviar_codigo", email: email }).then(function (d) {
      if (d && d.ok) {
        document.getElementById("uni-verificar").hidden = false;
        return;
      }
      decir(textoError(d));
    }).catch(function () { decir(errores.interno); })
      .then(function () { if (boton) boton.disabled = false; });
  });

  var formVerificar = document.getElementById("uni-verificar");
  if (formVerificar) formVerificar.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var boton = formVerificar.querySelector("button");
    if (boton) boton.disabled = true;
    decir("Comprobando el código…");
    llamar({
      tipo: "universidad",
      accion: "verificar_codigo",
      email: document.getElementById("uni-email").value,
      codigo: document.getElementById("uni-codigo").value
    }).then(entrarCon).catch(function () { decir(errores.interno); })
      .then(function () { if (boton) boton.disabled = false; });
  });

  var botonPortal = document.getElementById("uni-portal");
  if (botonPortal) botonPortal.addEventListener("click", function () {
    var token = tokenGuardado();
    if (!token) { decir(errores.sesion); return; }
    botonPortal.disabled = true;
    decir("Abriendo el portal de Stripe…");
    llamar({ tipo: "universidad", accion: "portal", token: token }).then(function (d) {
      if (d && d.url && String(d.url).indexOf("https://billing.stripe.com/") === 0) {
        window.location.href = d.url;
        return;
      }
      decir(textoError(d));
    }).catch(function () { decir(errores.interno); })
      .then(function () { botonPortal.disabled = false; });
  });

  var salir = document.getElementById("uni-salir");
  if (salir) salir.addEventListener("click", function () {
    guardarToken("");
    if (aula) aula.hidden = true;
    decir("Has salido de este navegador. La suscripción sigue en Stripe hasta que la canceles.");
  });

  llamar({ tipo: "universidad", accion: "estado" }).then(function (d) {
    if (!d || !d.ok) return;
    modo = d.modo === "live" ? "live" : "test";
    mostrarCompra(d);
  }).catch(function () {});

  var params = new URLSearchParams(window.location.search);
  var sessionId = params.get("uni_session");
  if (sessionId) {
    decir("Comprobando la suscripción con Stripe…");
    llamar({ tipo: "universidad", accion: "confirmar", sessionId: sessionId }).then(function (d) {
      if (d && d.ok) {
        decir("Suscripción registrada" + (d.email ? " para " + d.email : "") + ". Entra abajo con ese mismo correo. El aula no se abre solo con volver de Stripe.");
        try { history.replaceState(null, "", window.location.pathname + "#acceso"); } catch (e) {}
        return;
      }
      decir(textoError(d));
    }).catch(function () { decir(errores.pago_no_confirmado); });
  } else if (params.get("uni_cancelado")) {
    decir("Has vuelto del pago. No se ha activado ninguna suscripción desde esta página.");
  } else if (tokenGuardado()) {
    llamar({ tipo: "universidad", accion: "acceso", token: tokenGuardado() }).then(function (d) {
      if (d && d.ok) entrarCon(d);
      else if (d && d.error === "sin_suscripcion") {
        guardarToken("");
        if (aula) aula.hidden = true;
        decir(errores.sin_suscripcion);
      } else if (d && d.error === "sesion") {
        guardarToken("");
      }
    }).catch(function () {});
  }

  cargarGoogle();
})();
