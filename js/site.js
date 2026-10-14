/* Configuración del sitio unificado.
   Cambia aquí el ID de Amazon, el envío del formulario y el enlace de la app.
   Los enlaces del HTML se actualizan al cargar; si el navegador no ejecuta
   JavaScript, siguen valiendo las direcciones escritas en cada página. */
window.GR = {
  tiendaUrl: "https://granjarentable-incubadora.netlify.app/?pais=ES",
  youtubeUrl: "https://www.youtube.com/@GranjaRentable",
  facebookUrl: "https://www.facebook.com/granjarentable",
  whatsappUrl: "https://wa.me/34656267726",
  /* ÚNICO ID de Amazon Asociados (tag). Vacío hasta que exista. Ejemplo: "granjarentable-21". */
  amazonTag: "",
  /* URL que recibe el POST del formulario. Vacío = no se envía nada.
     Recomendado: https://formspree.io/f/xxxxxxxx  (ver README). */
  formEndpoint: "",
  /* Enlace de Google Play cuando la app esté publicada. Vacío = botón desactivado. */
  appDownloadUrl: ""
};

(function () {
  const GR = window.GR;
  const enlace = {
    tienda: GR.tiendaUrl,
    youtube: GR.youtubeUrl,
    facebook: GR.facebookUrl,
    whatsapp: GR.whatsappUrl
  };
  document.querySelectorAll("[data-gr-link]").forEach(function (a) {
    const url = enlace[a.getAttribute("data-gr-link")];
    if (url) a.href = url;
  });

  document.querySelectorAll("[data-amazon-query]").forEach(function (a) {
    const q = a.getAttribute("data-amazon-query") || "";
    let url = "https://www.amazon.es/s?k=" + encodeURIComponent(q);
    const tag = (GR.amazonTag || "").trim();
    if (tag) url += "&tag=" + encodeURIComponent(tag);
    a.href = url;
  });
  const tagNota = document.querySelector("[data-amazon-estado]");
  if (tagNota) {
    const tag = (GR.amazonTag || "").trim();
    tagNota.textContent = tag
      ? "ID de afiliado activo: " + tag + "."
      : "ID de afiliado pendiente. Los botones abren la búsqueda en Amazon.es sin tag de seguimiento.";
  }

  const descarga = document.getElementById("btn-descarga");
  if (descarga && (GR.appDownloadUrl || "").trim()) {
    const a = document.createElement("a");
    a.className = "btn";
    a.href = GR.appDownloadUrl.trim();
    a.target = "_blank";
    a.rel = "noopener";
    a.textContent = "Descargar para Android";
    descarga.replaceWith(a);
  }

  const archivo = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  const enCurso = /\/lecciones\//.test(location.pathname) || archivo === "curso.html" || archivo === "examen-final.html";
  document.querySelectorAll(".menu a, .foot-nav a").forEach(function (a) {
    const href = (a.getAttribute("href") || "").split("/").pop();
    const esCurso = href === "curso.html" && enCurso;
    const esEsta = href === archivo && !a.classList.contains("menu-social");
    if (esCurso || esEsta) a.setAttribute("aria-current", "page");
  });

  const toggle = document.querySelector(".nav-toggle");
  const menu = document.getElementById("menu-principal");
  function cerrarMenu() {
    if (!menu || !toggle) return;
    menu.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      const abierto = menu.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", abierto ? "true" : "false");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.closest("a")) cerrarMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") cerrarMenu();
    });
  }

  function preparar(form) {
    const nombre = form.querySelector('input[name="nombre"]');
    const email = form.querySelector('input[name="email"]');
    const consentimiento = form.querySelector('input[name="consentimiento"]');
    const android = form.querySelector('input[name="android"]');
    const esBeta = form.dataset.form === "beta";
    if (nombre) nombre.setCustomValidity(nombre.value.trim() ? "" : "Escribe tu nombre.");
    if (email) {
      const valor = email.value.trim();
      if (!valor) email.setCustomValidity("Escribe tu correo.");
      else if (esBeta && !/@g(oogle)?mail\.com$/i.test(valor)) email.setCustomValidity("Tiene que ser un Gmail, por ejemplo nombre@gmail.com.");
      else if (!esBeta && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor)) email.setCustomValidity("Ese correo no es válido.");
      else email.setCustomValidity("");
    }
    if (consentimiento) {
      consentimiento.setCustomValidity(consentimiento.checked ? "" : "Hace falta aceptar la política de privacidad para registrarte.");
    }
    if (android) {
      android.setCustomValidity(android.checked ? "" : "Confirma que tienes Android y que este Gmail es el de Google Play.");
    }
  }

  document.querySelectorAll("form.formulario").forEach(function (form) {
    const estado = form.querySelector(".form-status");
    const nombre = form.querySelector('input[name="nombre"]');
    const email = form.querySelector('input[name="email"]');
    const probar = form.querySelector('input[name="probar_app"]');
    const pista = form.querySelector(".pista");
    form.querySelectorAll("input").forEach(function (input) {
      input.addEventListener("input", function () { input.setCustomValidity(""); });
      input.addEventListener("change", function () { input.setCustomValidity(""); });
    });
    if (probar && email && pista) {
      function avisoGmail() {
        if (!probar.checked) { pista.hidden = true; return; }
        pista.hidden = /@g(oogle)?mail\.com$/i.test(email.value.trim());
      }
      probar.addEventListener("change", avisoGmail);
      email.addEventListener("input", avisoGmail);
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (estado) {
        estado.className = "form-status";
        estado.textContent = "";
      }
      if (email) email.value = email.value.trim();
      if (nombre) nombre.value = nombre.value.trim();
      preparar(form);
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const bot = form.querySelector('input[name="_gotcha"]');
      if (bot && bot.value) return;
      const endpoint = (GR.formEndpoint || "").trim();
      if (!endpoint) {
        if (estado) {
          estado.className = "form-status pendiente";
          estado.textContent = "Todavía no podemos guardar el alta: el envío no está conectado. Tus datos no se han enviado.";
        }
        return;
      }
      const boton = form.querySelector('button[type="submit"]');
      if (boton) boton.disabled = true;
      fetch(endpoint, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      }).then(function (res) {
        if (!res.ok) throw new Error("respuesta");
        form.reset();
        if (pista) pista.hidden = true;
        if (estado) {
          estado.className = "form-status ok";
          estado.textContent = form.dataset.form === "beta"
            ? "Listo. Hemos recibido tu solicitud para probar la app."
            : "Listo. Ya estás en la lista.";
        }
      }).catch(function () {
        if (estado) {
          estado.className = "form-status error";
          estado.textContent = "No se ha podido enviar. Inténtalo de nuevo en unos minutos o escríbenos por WhatsApp.";
        }
      }).then(function () {
        if (boton) boton.disabled = false;
      });
    });
  });

  function ajustarWhatsapp() {
    const wa = document.querySelector(".wa-float");
    const banner = document.getElementById("cookie-banner");
    if (banner) {
      const alto = Math.ceil(banner.getBoundingClientRect().height);
      if (wa) wa.style.bottom = (alto + 16) + "px";
      document.body.style.paddingBottom = (alto + 28) + "px";
    } else {
      if (wa) wa.style.bottom = "";
      document.body.style.paddingBottom = "";
    }
  }
  new MutationObserver(ajustarWhatsapp).observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", ajustarWhatsapp);
  ajustarWhatsapp();
})();
