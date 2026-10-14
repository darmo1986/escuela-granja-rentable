(function () {
  var GR = window.GR || {};
  var PAISES = window.GR_PAISES || {};
  var root = document.body.getAttribute("data-root") || "";
  var ML_HOST = {
    MX: "listado.mercadolibre.com.mx",
    CO: "listado.mercadolibre.com.co",
    PE: "listado.mercadolibre.com.pe",
    AR: "listado.mercadolibre.com.ar",
    VE: "listado.mercadolibre.com.ve",
    EC: "listado.mercadolibre.com.ec",
    DO: "listado.mercadolibre.com.do",
    CL: "listado.mercadolibre.cl",
    PY: "listado.mercadolibre.com.py",
    UY: "listado.mercadolibre.com.uy",
    BO: "listado.mercadolibre.com.bo",
    GT: "listado.mercadolibre.com.gt",
    HN: "listado.mercadolibre.com.hn",
    SV: "listado.mercadolibre.com.sv",
    NI: "listado.mercadolibre.com.ni",
    CR: "listado.mercadolibre.co.cr",
    PA: "listado.mercadolibre.com.pa"
  };
  var REF_RE = /^[A-Za-z0-9_-]{2,32}$/;

  function valid(code) {
    code = String(code || "").toUpperCase();
    return PAISES[code] ? code : "MX";
  }

  var pais = valid(document.documentElement.dataset.pais || "MX");

  function readRef() {
    try {
      var raw = localStorage.getItem("gr_ref");
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.exp > Date.now() && REF_RE.test(o.code)) return o.code;
      }
    } catch (e) {}
    var m = document.cookie.match(/(?:^|; )gr_ref=([^;]+)/);
    if (m) {
      try {
        var c = decodeURIComponent(m[1]);
        if (REF_RE.test(c)) return c;
      } catch (e2) {}
    }
    return "";
  }

  function saveRef(code) {
    var days = GR.refDays || 30;
    var exp = Date.now() + days * 86400000;
    try { localStorage.setItem("gr_ref", JSON.stringify({ code: code, exp: exp })); } catch (e) {}
    document.cookie = "gr_ref=" + encodeURIComponent(code) + "; Max-Age=" + (days * 86400) + "; Path=/; SameSite=Lax";
  }

  (function captureRef() {
    var q = new URLSearchParams(location.search).get("ref");
    if (q && REF_RE.test(q)) saveRef(q);
  })();

  function usdOf(p) {
    if (!p || !p.envio) return null;
    if (p.moneda === "USD") return p.precio;
    var rate = GR.fx && GR.fx[p.moneda];
    if (!rate) return null;
    return Math.round(p.precio / rate);
  }

  function storeUrl() {
    var u = new URL(GR.tiendaBase || "https://granjarentable-incubadora.netlify.app/");
    u.searchParams.set("pais", pais);
    var ref = readRef();
    if (ref) u.searchParams.set("ref", ref);
    return u.toString();
  }

  function slug(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function fillText(el, text) {
    if (el) el.textContent = text || "";
  }

  function applyPais(code, persist) {
    pais = valid(code);
    document.documentElement.dataset.pais = pais;
    if (persist) {
      try { localStorage.setItem("gr_pais", pais); } catch (e) {}
    }
    var p = PAISES[pais];
    var usd = usdOf(p);
    var fecha = (GR.fx && GR.fx.fecha) || "";

    document.querySelectorAll("[data-price-card]").forEach(function (card) {
      var usdEl = card.querySelector(".js-usd");
      var localEl = card.querySelector(".js-local");
      var metaEl = card.querySelector(".js-meta");
      var notaEl = card.querySelector(".js-nota");
      var cta = card.querySelector(".js-cta");
      var extra = card.querySelector(".js-extra");
      if (!p.envio) {
        fillText(usdEl, "Todavía no enviamos la incubadora a " + p.nombre + ".");
        fillText(localEl, "Cuando haya envío, el precio se verá en dólares y en moneda local.");
        fillText(metaEl, "");
        fillText(notaEl, "Déjanos tu correo y te avisamos. Mientras, el equipo suelto está en Mercado Libre.");
        if (extra) extra.hidden = true;
        if (cta) {
          cta.textContent = "Avísame cuando llegue";
          cta.href = root + "registro.html?interes=envio";
          cta.removeAttribute("data-checkout");
        }
        return;
      }
      if (p.moneda === "USD") {
        fillText(usdEl, "US$ " + p.precio);
        fillText(localEl, "Ese es el precio, con envío incluido a " + p.nombre + ".");
      } else {
        fillText(usdEl, usd != null ? ("Unos US$ " + usd) : p.texto);
        fillText(localEl, "Pagas " + p.texto + ", envío incluido a " + p.nombre + ".");
      }
      fillText(metaEl, [p.voltaje, "llega en " + p.entrega, "capacidad real: unos 16–18 huevos de gallina"].filter(Boolean).join(" · "));
      var nota = p.impuesto || "";
      if (p.moneda !== "USD" && fecha) {
        nota += (nota ? " " : "") + "El dólar es una referencia del " + fecha + " para comparar. El cargo es en " + p.moneda + ".";
      }
      if (p.moneda === "USD" && pais !== "US") {
        nota += (nota ? " " : "") + "Tu banco puede sumar una comisión por pagar en dólares.";
      }
      fillText(notaEl, nota);
      if (extra) extra.hidden = false;
      if (cta) {
        cta.textContent = "Comprar la incubadora";
        cta.setAttribute("data-checkout", "");
      }
    });

    document.querySelectorAll("[data-checkout]").forEach(function (a) {
      a.href = storeUrl();
    });

    document.querySelectorAll(".js-pais").forEach(function (sel) {
      if (sel.value !== pais && sel.querySelector('option[value="' + pais + '"]')) sel.value = pais;
    });
    document.querySelectorAll(".js-pais-nombre").forEach(function (el) { el.textContent = p.nombre; });

    document.querySelectorAll(".js-red-nota").forEach(function (el) {
      if (pais === "ES") el.textContent = "En España estos enlaces abren eBay. La incubadora se compra en nuestra tienda, no aquí.";
      else if (pais === "US") el.textContent = "En Estados Unidos estos enlaces abren eBay. La incubadora se compra en nuestra tienda, en dólares.";
      else el.textContent = "En " + p.nombre + " estos enlaces abren Mercado Libre. La incubadora se compra en nuestra tienda.";
    });

    buildRecLinks();
    var ref = readRef();
    var note = document.getElementById("ref-note");
    if (note) {
      if (ref) {
        note.hidden = false;
        note.textContent = ref === "DEMO"
          ? "Código de prueba DEMO guardado en este navegador (30 días). No genera comisión. Si compras en nuestra tienda, el enlace lleva ?ref=DEMO."
          : "Llegaste con la recomendación " + ref + ". La guardamos 30 días para poder pagarle a esa persona si compras en nuestra tienda.";
      } else note.hidden = true;
    }
  }

  function buildRecLinks() {
    var p = PAISES[pais];
    var ids = (GR.redes && GR.redes.mercadolibre && GR.redes.mercadolibre.ids) || {};
    var param = (GR.redes && GR.redes.mercadolibre && GR.redes.mercadolibre.param) || "matt_tool";
    var ebayAll = (GR.redes && GR.redes.ebay) || {};
    document.querySelectorAll("[data-product]").forEach(function (card) {
      var stores = (card.getAttribute("data-tiendas") || "").split(/\s+/);
      card.querySelectorAll("[data-net]").forEach(function (a) {
        var net = a.getAttribute("data-net");
        var allowed = stores.indexOf(net) !== -1;
        a.classList.toggle("is-off", !allowed);
        if (!allowed) return;
        if (net === "mercadolibre") {
          var host = ML_HOST[pais] || ML_HOST.MX;
          var u = new URL("https://" + host + "/" + slug(a.getAttribute("data-q")));
          var id = p.ml ? (ids[p.ml] || "") : "";
          if (id) u.searchParams.set(param, id);
          a.href = u.toString();
        } else if (net === "ebay") {
          var es = pais === "ES";
          var q = es ? (a.getAttribute("data-q-es") || a.getAttribute("data-q") || "") : (a.getAttribute("data-q-en") || a.getAttribute("data-q") || "");
          var cfg = es ? (ebayAll.es || {}) : (ebayAll.com || {});
          var u2 = new URL(es ? "https://www.ebay.es/sch/i.html" : "https://www.ebay.com/sch/i.html");
          u2.searchParams.set("_nkw", q);
          if (cfg.campid) {
            u2.searchParams.set("mkcid", "1");
            if (cfg.mkrid) u2.searchParams.set("mkrid", cfg.mkrid);
            u2.searchParams.set("siteid", es ? "186" : "0");
            u2.searchParams.set("campid", cfg.campid);
            u2.searchParams.set("toolid", "10001");
            u2.searchParams.set("mkevt", "1");
          }
          a.href = u2.toString();
        }
      });
    });
  }

  document.querySelectorAll(".js-pais").forEach(function (sel) {
    sel.addEventListener("change", function () { applyPais(sel.value, true); });
  });

  var navBtn = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
      navBtn.textContent = open ? "Cerrar" : "Menú";
    });
  }

  document.querySelectorAll("[data-social]").forEach(function (a) {
    var k = a.getAttribute("data-social");
    if (k === "youtube" && GR.youtubeUrl) a.href = GR.youtubeUrl;
    if (k === "facebook" && GR.facebookUrl) a.href = GR.facebookUrl;
    if (k === "whatsapp" && GR.whatsapp) a.href = GR.whatsapp;
  });

  document.querySelectorAll("[data-app-download]").forEach(function (a) {
    var url = (GR.appUrl || "").trim();
    if (!url) {
      a.setAttribute("aria-disabled", "true");
      a.addEventListener("click", function (e) { e.preventDefault(); });
    } else {
      a.href = url;
      a.removeAttribute("aria-disabled");
      a.textContent = "Descargar para Android";
    }
  });

  document.querySelectorAll("form[data-gr-form]").forEach(function (form) {
    var metodo = form.querySelector("[name=metodo_pago]");
    var paypal = form.querySelector("[data-paypal]");
    if (metodo && paypal) {
      var sync = function () { paypal.hidden = metodo.value !== "paypal"; };
      metodo.addEventListener("change", sync);
      sync();
    }
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var msg = form.querySelector(".form-msg");
      var say = function (t) { if (msg) msg.textContent = t; };
      var hp = form.querySelector("[name=_gotcha]");
      if (hp && hp.value) { say("Listo."); return; }
      var nombre = form.querySelector("[name=nombre]");
      var email = form.querySelector("[name=email]");
      if (nombre && !nombre.value.trim()) { say("Escribe tu nombre."); nombre.focus(); return; }
      if (email && !email.value.trim()) { say("Escribe tu correo."); email.focus(); return; }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) { say("Ese correo no parece válido."); email.focus(); return; }
      var consent = form.querySelector("[name=consentimiento]");
      if (!consent || !consent.checked) {
        say("Para continuar, marca la casilla de privacidad.");
        if (consent) consent.focus();
        return;
      }
      if (form.getAttribute("data-gr-form") === "beta") {
        var email = (form.email && form.email.value || "").trim();
        if (!/@gmail\.com$/i.test(email)) {
          say("Para la prueba de Google Play necesitamos un correo @gmail.com.");
          if (form.email) form.email.focus();
          return;
        }
      }
      if (form.getAttribute("data-gr-form") === "afiliado" && metodo && metodo.value === "paypal") {
        var pay = form.querySelector("[name=paypal]");
        if (!pay || !pay.value.trim()) {
          say("Escribe el correo de PayPal donde quieres el pago.");
          if (pay) pay.focus();
          return;
        }
      }
      var endpoint = (GR.formEndpoint || "").trim();
      if (!endpoint) {
        say("El formulario está listo, pero todavía no envía datos: falta la URL de Google Apps Script en js/config.js. No salió nada de este navegador. Si te urge, escríbenos por WhatsApp.");
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.pais = pais;
      data.ref = readRef();
      data.origen = location.href;
      say("Enviando…");
      var btn = form.querySelector("[type=submit]");
      if (btn) btn.disabled = true;
      postToSheet(endpoint, data).then(function () {
        say("Listo. Quedó anotado. Si no lo ves en la hoja en un minuto, escríbenos por WhatsApp.");
        form.reset();
        if (metodo && paypal) paypal.hidden = metodo.value !== "paypal";
      }).catch(function () {
        say("No se pudo enviar. Revisa tu conexión o escríbenos por WhatsApp.");
      }).then(function () { if (btn) btn.disabled = false; });
    });
  });

  if (new URLSearchParams(location.search).get("interes") === "envio") {
    var aviso = document.getElementById("interes-envio");
    if (aviso) aviso.hidden = false;
  }

  function postToSheet(endpoint, data) {
    return new Promise(function (resolve, reject) {
      var iframe = document.createElement("iframe");
      iframe.name = "grform" + Date.now();
      iframe.hidden = true;
      iframe.setAttribute("aria-hidden", "true");
      iframe.style.display = "none";
      var form = document.createElement("form");
      form.method = "POST";
      form.action = endpoint;
      form.target = iframe.name;
      form.acceptCharset = "UTF-8";
      Object.keys(data).forEach(function (k) {
        var input = document.createElement("input");
        input.type = "hidden";
        input.name = k;
        input.value = data[k] == null ? "" : String(data[k]);
        form.appendChild(input);
      });
      var done = false;
      function finish(ok) {
        if (done) return;
        done = true;
        clearTimeout(timer);
        form.remove();
        setTimeout(function () { iframe.remove(); }, 1200);
        if (ok) resolve(); else reject(new Error("post"));
      }
      var armed = false;
      iframe.addEventListener("load", function () { if (armed) finish(true); });
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      var timer = setTimeout(function () { finish(true); }, 6000);
      try {
        armed = true;
        form.submit();
      } catch (e) {
        finish(false);
      }
    });
  }

  var refBox = document.getElementById("ref-ejemplo");
  if (refBox) {
    refBox.textContent = (GR.siteUrl || "https://granjarentable.net") + "/?ref=TUCODIGO";
  }

  applyPais(pais, false);
  window.GR_estado = function () {
    return { pais: pais, ref: readRef(), tienda: (PAISES[pais] && PAISES[pais].envio) ? storeUrl() : "" };
  };
})();
