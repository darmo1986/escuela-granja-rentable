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
  var REF_RE = /^(?:[A-Za-z0-9_-]{2,40}|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,24})$/;

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

  function storeUrl(hash) {
    var u = new URL(GR.tiendaBase || "https://granjarentable-incubadora.netlify.app/");
    /* Siempre el país elegido en el sitio. La tienda, si no recibe ?pais=, cae en Perú. */
    u.searchParams.set("pais", pais);
    var ref = readRef();
    if (ref) u.searchParams.set("ref", ref);
    if (hash) u.hash = String(hash).replace(/^#/, "");
    return u.toString();
  }

  function slug(s) {
    return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }

  function fillText(el, text) {
    if (el) el.textContent = text || "";
  }

  function catalogMap() {
    var map = {};
    (window.GR_CATALOGO || []).forEach(function (item) { map[item.id] = item; });
    return map;
  }

  function productHref(id) {
    return root + "producto/" + id + ".html";
  }

  function waProduct(name) {
    var u = new URL(GR.whatsapp || "https://wa.me/34656267726");
    u.searchParams.set("text", "Hola, escribo desde el sitio de Granja Rentable. Me interesa: " + name);
    return u.toString();
  }

  function usdLabel(moneda, precio, texto) {
    if (moneda === "USD") return texto || ("US$ " + precio);
    var rate = GR.fx && GR.fx[moneda];
    if (!rate) return "";
    return "Unos US$ " + Math.round(precio / rate);
  }

  function paintSku(card, usd, local, meta, nota, badgeText, ctaOpts) {
    fillText(card.querySelector(".js-sku-usd"), usd);
    fillText(card.querySelector(".js-sku-local"), local);
    fillText(card.querySelector(".js-sku-meta"), meta);
    fillText(card.querySelector(".js-sku-nota"), nota);
    var badge = card.querySelector(".js-sku-badge");
    if (badge) {
      badge.hidden = !badgeText;
      badge.textContent = badgeText || "";
    }
    var usdEl = card.querySelector(".js-sku-usd");
    if (usdEl) {
      var priceLike = /^(Unos |US\$|\$|S\/)/.test(usd || "") || /\d/.test(String(usd || "").slice(0, 8));
      usdEl.classList.toggle("is-note", !!(usd && !priceLike));
    }
    var cta = card.querySelector(".js-sku-cta");
    if (cta && ctaOpts) {
      cta.textContent = ctaOpts.text;
      cta.href = ctaOpts.href;
      if (ctaOpts.store) {
        cta.setAttribute("data-checkout", "");
        if (ctaOpts.hash) cta.setAttribute("data-checkout-hash", ctaOpts.hash);
        else cta.removeAttribute("data-checkout-hash");
      } else {
        cta.removeAttribute("data-checkout");
        cta.removeAttribute("data-checkout-hash");
      }
      cta.classList.toggle("gold", !!ctaOpts.buy);
      cta.classList.toggle("sec", !ctaOpts.buy);
    }
  }

  function applyFeatured() {
    var box = document.querySelector("[data-featured]");
    if (!box) return;
    var skuBox = box.querySelector("[data-sku]");
    if (!skuBox) return;
    var id = (PAISES[pais] && PAISES[pais].envio && pais === "US") ? "incubadora-wonegg-48" : "incubadora-24egg-dual";
    skuBox.setAttribute("data-sku", id);
    var item = catalogMap()[id];
    if (!item) return;
    var img = box.querySelector(".js-feat-img");
    var link = box.querySelector(".js-feat-link");
    var more = box.querySelector(".js-feat-more");
    var name = box.querySelector(".js-feat-name");
    var res = box.querySelector(".js-feat-resumen");
    if (img && item.imagen) {
      img.src = root + item.imagen;
      img.alt = item.alt || item.nombre;
    }
    if (link) link.href = productHref(id);
    if (more) more.href = productHref(id);
    if (name) name.textContent = item.nombre;
    if (res) res.textContent = item.resumen || "";
  }

  function ensureAsk(card) {
    var id = card.getAttribute("data-sku");
    var item = catalogMap()[id];
    if (!item) return;
    var nameEl = card.querySelector(".js-sku-name, .js-feat-name");
    var nombre = (nameEl && nameEl.textContent.trim()) || item.nombre;
    var cta = card.querySelector(".js-sku-cta");
    var host = (cta && cta.parentNode) || card;
    var wa = card.querySelector(".js-sku-wa");
    if (!wa) {
      wa = document.createElement("a");
      wa.className = "btn sec js-sku-wa";
      if (cta) cta.insertAdjacentElement("afterend", wa);
      else host.appendChild(wa);
    }
    var alreadyWa = cta && /wa\.me/i.test(cta.getAttribute("href") || "");
    wa.hidden = !!alreadyWa;
    wa.textContent = "Pregunta por WhatsApp";
    wa.href = waProduct(nombre);
    var pay = card.querySelector(".pay-note");
    var buying = cta && cta.hasAttribute("data-checkout");
    if (buying) {
      if (!pay) {
        pay = document.createElement("p");
        pay.className = "pay-note";
        pay.textContent = "Pago seguro con Stripe. No vemos el número de tu tarjeta.";
        wa.insertAdjacentElement("afterend", pay);
      }
      pay.hidden = false;
    } else if (pay) {
      pay.hidden = true;
    }
  }

  function applySkus() {
    var map = catalogMap();
    var p = PAISES[pais];
    var fecha = (GR.fx && GR.fx.fecha) || "";
    if (!p) return;
    document.querySelectorAll("[data-sku]").forEach(function (card) {
      var item = map[card.getAttribute("data-sku")];
      if (!item) return;
      try {
      var nameEl = card.querySelector(".js-sku-name");
      if (item.soon) {
        if (nameEl) nameEl.textContent = item.nombre;
        paintSku(card, "Próximamente", item.resumen || "", "", "Todavía no tiene precio ni foto.", "Próximamente", {
          text: "Avísame",
          href: root + "registro.html?interes=" + encodeURIComponent(item.id),
          buy: false,
          store: false
        });
        return;
      }
      if (item.checkout === "store" && !p.envio) {
        if (nameEl) nameEl.textContent = item.nombre;
        paintSku(card, "Sin envío a " + p.nombre, "Te avisamos cuando podamos enviar.", "", "", "Sin envío", {
          text: "Avísame",
          href: root + "registro.html?interes=envio",
          buy: false,
          store: false
        });
        return;
      }
      var offer = item.offers && item.offers[pais];
      if (!offer) {
        var alt = item.altPais && item.altPais[pais];
        var msg = (item.ausente && item.ausente[pais]) || ("Hoy no enviamos este producto a " + p.nombre + ".");
        if (nameEl) nameEl.textContent = item.nombre;
        if (alt && map[alt]) {
          paintSku(card, msg, "En " + p.nombre + " está a la venta: " + map[alt].nombre + ".", "", "", "Otro modelo", {
            text: "Ver el modelo de tu país",
            href: productHref(alt),
            buy: false,
            store: false
          });
        } else {
          var ref = item.base ? ("Referencia de catálogo: " + item.base.texto + ". No es el precio de " + p.nombre + ".") : "";
          paintSku(card, msg, ref, "", "", "No disponible aquí", {
            text: "Preguntar por WhatsApp",
            href: waProduct(item.nombre),
            buy: false,
            store: false
          });
        }
        return;
      }
      var nombre = offer.nombre || item.nombre;
      if (nameEl) nameEl.textContent = nombre;
      var usdTxt = usdLabel(offer.moneda, offer.precio, offer.texto);
      var localTxt = "Pagas " + offer.texto + ".";
      if (offer.antes) localTxt += " Antes " + offer.antes + ".";
      if (item.categoria === "incubadoras" && offer.moneda !== "USD") localTxt = "Pagas " + offer.texto + ", envío incluido a " + p.nombre + ".";
      if (item.categoria === "incubadoras" && offer.moneda === "USD") localTxt = "Precio con envío a " + p.nombre + ".";
      var meta = [offer.voltaje || "", offer.entrega || "", item.capacidad || ""].filter(Boolean).join(" · ");
      var nota = offer.nota || "";
      if (offer.moneda !== "USD" && fecha && item.checkout === "store") {
        nota += (nota ? " " : "") + "El dólar es una referencia del " + fecha + ". El cargo es en " + offer.moneda + ".";
      }
      if (item.checkout === "whatsapp") {
        paintSku(card, usdTxt, localTxt, meta, nota, item.badge || "Tienda anterior", {
          text: "Pedir por WhatsApp",
          href: waProduct(nombre),
          buy: true,
          store: false
        });
        return;
      }
      var hash = item.categoria === "complementos" ? "complementos" : "";
      paintSku(card, usdTxt, localTxt, meta, nota, "", {
        text: "Comprar",
        href: storeUrl(hash),
        buy: true,
        store: true,
        hash: hash
      });
      } finally { ensureAsk(card); }
    });
    var buy = document.querySelector(".js-comprar");
    if (buy) {
      if (!p.envio) {
        buy.textContent = "Avísame";
        buy.href = root + "registro.html?interes=envio";
        buy.removeAttribute("data-checkout");
      } else {
        buy.textContent = "Comprar";
        buy.setAttribute("data-checkout", "");
      }
    }
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

    applyFeatured();
    applySkus();

    document.querySelectorAll("[data-checkout]").forEach(function (a) {
      a.href = storeUrl(a.getAttribute("data-checkout-hash") || "");
    });

    document.querySelectorAll(".js-pais").forEach(function (sel) {
      if (sel.value !== pais && sel.querySelector('option[value="' + pais + '"]')) sel.value = pais;
    });
    document.querySelectorAll(".js-pais-nombre").forEach(function (el) { el.textContent = p.nombre; });

    document.querySelectorAll(".js-red-nota").forEach(function (el) {
      if (pais === "ES") el.textContent = "En España estos enlaces abren eBay. La incubadora se compra en nuestra tienda, no aquí.";
      else if (pais === "US") el.textContent = "En Estados Unidos estos enlaces abren eBay. La incubadora se compra en nuestra tienda, en dólares.";
      else el.textContent = "En " + p.nombre + " el primer enlace abre Mercado Libre y el segundo, eBay. El precio está en esa tienda. La incubadora se compra en la nuestra.";
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
        if (net === "tienda") {
          var sku = card.getAttribute("data-sku");
          var item = catalogMap()[sku];
          var offer = item && item.offers && item.offers[pais];
          if (!item || item.soon || !offer) {
            a.classList.add("is-off");
            return;
          }
          a.classList.remove("is-off");
          a.href = productHref(sku);
        } else if (net === "mercadolibre") {
          var host = ML_HOST[pais];
          if (!host) {
            a.classList.add("is-off");
            return;
          }
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
      var primary = true;
      card.querySelectorAll("[data-net]").forEach(function (a) {
        var on = !a.classList.contains("is-off");
        a.classList.toggle("gold", on && primary);
        a.classList.toggle("sec", !on || !primary);
        if (on && primary) primary = false;
      });
    });
  }

  document.querySelectorAll(".js-pais").forEach(function (sel) {
    sel.addEventListener("change", function () { applyPais(sel.value, true); });
  });

  var navBtn = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (nav && location.hash === "#menu") {
    nav.classList.add("is-open");
    if (navBtn) {
      navBtn.setAttribute("aria-expanded", "true");
      navBtn.textContent = "Cerrar";
    }
  }
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
      navBtn.textContent = open ? "Cerrar" : "Menú";
    });
  }

  document.querySelectorAll(".nav-parent, .nav-redes").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var drop = btn.closest(".nav-drop");
      if (!drop) return;
      var open = drop.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });
  if (nav) {
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        if (window.matchMedia("(max-width: 1039px)").matches) {
          nav.classList.remove("is-open");
          if (navBtn) {
            navBtn.setAttribute("aria-expanded", "false");
            navBtn.textContent = "Menú";
          }
        }
      });
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

  var FORM_ERR = {
    sin_consentimiento: "No se guardó: falta marcar la casilla de privacidad.",
    sin_correo: "No se guardó: falta un correo válido.",
    gmail: "No se guardó: la prueba de Google Play solo acepta un correo @gmail.com."
  };

  document.querySelectorAll("form[data-gr-form]").forEach(function (form) {
    var metodo = form.querySelector("[name=metodo_pago]");
    var paypal = form.querySelector("[data-paypal]");
    var endpoint = (GR.formEndpoint || "").trim();
    if (endpoint) form.action = endpoint;
    if (metodo && paypal) {
      var sync = function () { paypal.hidden = metodo.value !== "paypal"; };
      metodo.addEventListener("change", sync);
      sync();
    }
    form.setAttribute("novalidate", "");
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (form.dataset.sending === "1") return;
      var msg = form.querySelector(".form-msg");
      var say = function (t) { if (msg) { msg.textContent = t; } };
      var hp = form.querySelector("[name=_gotcha]");
      if (hp && hp.value) { say("Listo."); return; }
      var nombre = form.querySelector("[name=nombre]");
      var emailEl = form.querySelector("[name=email]");
      var emailVal = emailEl ? emailEl.value.trim() : "";
      if (nombre && !nombre.value.trim()) { say("Escribe tu nombre."); nombre.focus(); return; }
      if (emailEl && !emailVal) { say("Escribe tu correo."); emailEl.focus(); return; }
      if (emailEl && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { say("Ese correo no parece válido."); emailEl.focus(); return; }
      var consent = form.querySelector("[name=consentimiento]");
      if (!consent || !consent.checked) {
        say("Para continuar, marca la casilla de privacidad.");
        if (consent) consent.focus();
        return;
      }
      var tipo = form.getAttribute("data-gr-form");
      if (tipo === "beta" && !/@gmail\.com$/i.test(emailVal)) {
        say("Para la prueba de Google Play el correo tiene que ser de Gmail (@gmail.com).");
        if (emailEl) emailEl.focus();
        return;
      }
      if (tipo === "afiliado" && metodo && metodo.value === "paypal") {
        var pay = form.querySelector("[name=paypal]");
        if (!pay || !pay.value.trim()) {
          say("Escribe el correo de PayPal donde quieres el pago.");
          if (pay) pay.focus();
          return;
        }
      }
      if (tipo === "lead") {
        var fecha = form.querySelector("[name=fecha_inicio]");
        if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha.value)) {
          say("Elige el día en que pones los huevos.");
          if (fecha) fecha.focus();
          return;
        }
        var interesLead = form.querySelector("[name=interes]");
        if (interesLead) interesLead.value = "checklist " + fecha.value;
      }
      if (!endpoint) {
        say("El formulario está listo, pero todavía no envía datos: falta la URL de Google Apps Script en js/config.js. No salió nada de este navegador. Si te urge, escríbenos por WhatsApp.");
        return;
      }
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      data.pais = pais;
      data.ref = readRef();
      data.origen = "test" === new URLSearchParams(location.search).get("origen") ? "test" : location.href;
      data.consentimiento = "si";
      if (!data._gotcha) data._gotcha = "";
      say("Enviando…");
      var btn = form.querySelector("[type=submit]");
      form.dataset.sending = "1";
      if (btn) btn.disabled = true;
      postToSheet(endpoint, data).then(function () {
        if (tipo === "afiliado") {
          var code = emailVal.toLowerCase();
          var link = (GR.siteUrl || "https://granjarentable.net").replace(/\/$/, "") + "/?ref=" + encodeURIComponent(code);
          if (msg) {
            msg.textContent = "";
            msg.appendChild(document.createTextNode("Listo. Tu enlace personal es "));
            var a = document.createElement("a");
            a.href = link;
            a.textContent = link;
            msg.appendChild(a);
            msg.appendChild(document.createTextNode(". Si alguien compra con ese enlace, te corresponde el 10 %."));
          }
        } else if (tipo === "beta") {
          say("Listo. Anotamos tu Gmail para la prueba de Google Play. Si hay plaza, te escribimos.");
        } else if (tipo === "lead") {
          var iso = "";
          var fechaEl = form.querySelector("[name=fecha_inicio]");
          if (fechaEl) iso = fechaEl.value;
          entregarLista(msg, iso);
        } else {
          say("Listo. Guardamos tu registro. Te escribimos a ese correo cuando haya novedad.");
        }
        form.reset();
        if (metodo && paypal) paypal.hidden = metodo.value !== "paypal";
      }).catch(function (err) {
        say(FORM_ERR[err && err.code] || "No se pudo enviar. Revisa tu conexión o escríbenos por WhatsApp.");
        form.dataset.sending = "";
        if (btn) btn.disabled = false;
      });
    });
  });

  var interes = new URLSearchParams(location.search).get("interes");
  if (interes) {
    var aviso = document.getElementById("interes-envio");
    if (aviso) {
      aviso.hidden = false;
      if (interes !== "envio") aviso.textContent = "Anotamos tu interés. Déjanos el correo y te escribimos cuando haya novedad.";
    }
    var regForm = document.querySelector("form[data-gr-form]");
    if (regForm && !regForm.querySelector("[name=interes]")) {
      var hid = document.createElement("input");
      hid.type = "hidden";
      hid.name = "interes";
      hid.value = interes;
      regForm.appendChild(hid);
    }
  }

  function entregarLista(msg, iso) {
    if (!msg || !window.GR_lista) {
      if (msg) msg.textContent = "Listo. Guardamos tu correo.";
      return;
    }
    msg.textContent = "";
    msg.appendChild(document.createTextNode("Listo. Tu lista y tu calendario: "));
    var txt = document.createElement("a");
    txt.href = URL.createObjectURL(new Blob([window.GR_lista.texto(iso)], { type: "text/plain;charset=utf-8" }));
    txt.download = "lista-granja-rentable.txt";
    txt.textContent = "Descargar lista";
    msg.appendChild(txt);
    var cal = window.GR_lista.ics(iso);
    if (cal) {
      msg.appendChild(document.createTextNode(" · "));
      var a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([cal], { type: "text/calendar;charset=utf-8" }));
      a.download = "incubacion-gallina.ics";
      a.textContent = "Descargar calendario";
      msg.appendChild(a);
    }
  }

  function postToSheet(endpoint, data) {
    return fetch(endpoint, {
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

  var refBox = document.getElementById("ref-ejemplo");
  if (refBox) {
    refBox.textContent = (GR.siteUrl || "https://granjarentable.net") + "/?ref=TUCODIGO";
  }

  document.querySelectorAll(".foot-brand").forEach(function (p) {
    if ((p.textContent || "").trim() !== "Sitio") return;
    var ul = p.parentElement && p.parentElement.querySelector("ul");
    if (!ul) return;
    [
      ["calculadoras.html", "Calculadoras"],
      ["razas.html", "Líneas de aves"],
      ["lista.html", "Lista y calendario"],
      ["faq.html", "Preguntas"],
      ["guias.html", "Guías"]
    ].forEach(function (pair) {
      var href = root + pair[0];
      if (ul.querySelector('a[href="' + href + '"]')) return;
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = href;
      a.textContent = pair[1];
      li.appendChild(a);
      ul.appendChild(li);
    });
  });

  document.querySelectorAll("[data-yt-list]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (btn.querySelector("iframe")) return;
      var list = btn.getAttribute("data-yt-list") || "";
      if (!/^UU[\w-]{10,}$/.test(list)) return;
      var frame = document.createElement("iframe");
      frame.src = "https://www.youtube-nocookie.com/embed/videoseries?list=" + encodeURIComponent(list);
      frame.title = "Canal de YouTube de Granja Rentable";
      frame.setAttribute("allow", "autoplay; encrypted-media; picture-in-picture");
      frame.allowFullscreen = true;
      btn.textContent = "";
      btn.appendChild(frame);
    });
  });

  (function productJsonLd() {
    var box = document.querySelector(".pdp-buy[data-sku]");
    if (!box) return;
    var item = catalogMap()[box.getAttribute("data-sku")];
    if (!item) return;
    var site = (GR.siteUrl || "https://granjarentable.net").replace(/\/$/, "");
    var data = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": item.nombre,
      "description": item.resumen || "",
      "sku": item.id,
      "url": site + "/producto/" + item.id + ".html",
      "seller": { "@type": "Organization", "name": "Granja Rentable", "url": site + "/" }
    };
    if (item.imagen) data.image = site + "/" + String(item.imagen).replace(/^\//, "");
    var offer = item.offers && item.offers[pais];
    if (offer && offer.precio > 0 && offer.moneda) {
      data.offers = {
        "@type": "Offer",
        "price": String(offer.precio),
        "priceCurrency": offer.moneda,
        "url": data.url,
        "availability": item.checkout === "whatsapp" ? "https://schema.org/LimitedAvailability" : "https://schema.org/InStock"
      };
    }
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  })();

  applyPais(pais, false);
  window.GR_estado = function () {
    return { pais: pais, ref: readRef(), tienda: (PAISES[pais] && PAISES[pais].envio) ? storeUrl() : "" };
  };
})();
