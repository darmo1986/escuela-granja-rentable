(function () {
  var GR = window.GR || {};
  var PAISES = window.GR_PAISES || {};
  var root = document.body.getAttribute("data-root") || "";
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
    var u = new URL(GR.tiendaBase || "https://granjarentable.com/tienda/");
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
    var notaEl = card.querySelector(".js-sku-nota");
    fillText(notaEl, nota);
    if (notaEl) notaEl.hidden = !nota;
    var badge = card.querySelector(".js-sku-badge");
    if (badge) {
      badge.hidden = !badgeText;
      badge.textContent = badgeText || "";
    }
    var usdEl = card.querySelector(".js-sku-usd");
    if (usdEl) {
      var priceLike = /^(Unos |US\$|\$|S\/|Precio |Gratis)/.test(usd || "") || /\d/.test(String(usd || "").slice(0, 8));
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


  function paisRow(id) {
    var book = window.GR_PAIS_CATALOGO;
    if (!book || !book.paises) return null;
    var bucket = book.paises[pais] || book.paises.RESTO;
    if (!bucket || !bucket.productos) return null;
    return bucket.productos[id] || null;
  }

  function paintProximamente(card, item, detalle) {
    var nameEl = card.querySelector(".js-sku-name");
    if (nameEl) nameEl.textContent = item.nombre;
    var href = root + "registro.html?interes=" + encodeURIComponent(item.id);
    var text = "Avísame";
    if (item.checkout === "app") {
      href = root + "app.html";
      text = "Quiero ser tester";
    }
    paintSku(card, "Precio próximamente", detalle || "Te avisamos cuando haya precio para tu país.", "", "", "Próximamente", {
      text: text,
      href: href,
      buy: false,
      store: false
    });
  }

  function paintGratis(card, item) {
    var nameEl = card.querySelector(".js-sku-name");
    if (nameEl) nameEl.textContent = item.nombre;
    paintSku(card, "Gratis", item.resumen || "El curso de este sitio no tiene costo.", "", "", "", {
      text: "Entrar al curso",
      href: root + "curso.html",
      buy: true,
      store: false
    });
  }

  var CAT_LABEL = {
    incubadoras: "Incubadoras",
    complementos: "Complementos",
    calefaccion: "Calefacción",
    guias: "Guías",
    app: "App",
    curso: "Curso"
  };

  function catLabel(item) {
    return (item && (item.etiqueta || CAT_LABEL[item.categoria])) || "";
  }

  function mergePaisOffers() {
    (window.GR_CATALOGO || []).forEach(function (item) {
      var row = paisRow(item.id);
      if (!(row && row.estado === "confirmado" && row.texto && row.precio > 0)) return;
      item.offers = item.offers || {};
      var prev = item.offers[pais] || {};
      item.offers[pais] = {
        moneda: row.moneda || prev.moneda,
        precio: row.precio,
        texto: row.texto,
        nota: row.nota || prev.nota || "",
        entrega: row.entrega || prev.entrega || "",
        voltaje: prev.voltaje || "",
        antes: prev.antes || "",
        nombre: prev.nombre || ""
      };
    });
  }

  function chargedOffer(item) {
    if (!item || item.gratis || item.checkout === "curso" || item.checkout === "whatsapp") return null;
    var offer = item.offers && item.offers[pais];
    if (!offer || !(offer.precio > 0) || !offer.texto) return null;
    if (/próximamente/i.test(offer.texto)) return null;
    return offer;
  }

  function priceLines(item, offer, p) {
    var big = offer.texto;
    var ref = "";
    if (offer.moneda !== "USD") {
      var usd = usdLabel(offer.moneda, offer.precio, offer.texto);
      if (usd) ref = usd + " de referencia.";
    }
    var small = "";
    if (item.categoria === "incubadoras") {
      small = offer.moneda === "USD"
        ? "Precio con envío a " + p.nombre + "."
        : "Envío incluido a " + p.nombre + (ref ? ". " + ref : ".");
    } else {
      small = ref;
    }
    if (offer.antes) small = (small ? small + " " : "") + "Antes " + offer.antes + ".";
    return { big: big, small: small };
  }

  function renderSoon(map) {
    var list = document.getElementById("soon-list");
    var sec = document.getElementById("proximamente");
    if (!list || !sec) return;
    list.textContent = "";
    var pending = [];
    (window.GR_CATALOGO || []).forEach(function (item) {
      if (!item || item.gratis || item.checkout === "curso" || item.checkout === "app") return;
      if (chargedOffer(item)) return;
      pending.push(item);
    });
    if (!pending.length) {
      sec.hidden = true;
      return;
    }
    sec.hidden = false;
    pending.forEach(function (item) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.href = productHref(item.id);
      a.textContent = item.nombre;
      li.appendChild(a);
      list.appendChild(li);
    });
    document.querySelectorAll(".pcard-cat").forEach(function (el) {
      var card = el.closest("[data-sku]");
      var item = card && map[card.getAttribute("data-sku")];
      var label = catLabel(item);
      if (label) el.textContent = label;
    });
  }

  function applySkus() {
    mergePaisOffers();
    var map = catalogMap();
    var p = PAISES[pais];
    var fecha = (GR.fx && GR.fx.fecha) || "";
    if (!p) return;
    document.querySelectorAll("[data-sku]").forEach(function (card) {
      var item = map[card.getAttribute("data-sku")];
      if (!item) return;
      try {
      var nameEl = card.querySelector(".js-sku-name");
      var inGrid = card.classList.contains("pcard");
      if (item.gratis || item.checkout === "curso") {
        paintGratis(card, item);
        if (inGrid) card.hidden = true;
        return;
      }
      if (item.checkout === "app") {
        if (inGrid) card.hidden = true;
        if (nameEl) nameEl.textContent = item.nombre;
        paintSku(card, "Gratis", "4 MB · Android 8 o superior · gratis", "", item.resumen || "", "", {
          text: "Descargar para Android",
          href: root + "app.html",
          buy: true,
          store: false
        });
        return;
      }
      var offer = chargedOffer(item);
      if (!offer) {
        if (inGrid) {
          card.hidden = true;
          return;
        }
        var alt = item.altPais && item.altPais[pais];
        if (nameEl) nameEl.textContent = item.nombre;
        if (alt && map[alt]) {
          var msg = (item.ausente && item.ausente[pais]) || ("Hoy no enviamos este producto a " + p.nombre + ".");
          paintSku(card, msg, "En " + p.nombre + " está a la venta: " + map[alt].nombre + ".", "", "", "Otro modelo", {
            text: "Ver el modelo de tu país",
            href: productHref(alt),
            buy: false,
            store: false
          });
        } else {
          paintProximamente(card, item, item.resumen);
        }
        return;
      }
      if (inGrid) card.hidden = false;
      var nombre = offer.nombre || item.nombre;
      if (nameEl) nameEl.textContent = nombre;
      var lines = priceLines(item, offer, p);
      var meta = [offer.voltaje || "", offer.entrega || "", item.capacidad || ""].filter(Boolean).join(" · ");
      var nota = offer.nota || "";
      if (offer.moneda !== "USD" && fecha && item.checkout === "store") {
        nota += (nota ? " " : "") + "El dólar es una referencia del " + fecha + ". El cargo es en " + offer.moneda + ".";
      }
      var hash = item.categoria === "complementos" ? "complementos" : "";
      paintSku(card, lines.big, lines.small, meta, nota, "", {
        text: "Comprar",
        href: storeUrl(hash),
        buy: true,
        store: true,
        hash: hash
      });
      } finally { ensureAsk(card); }
    });
    document.querySelectorAll("section.block").forEach(function (sec) {
      var cards = sec.querySelectorAll(".pcard");
      if (!cards.length) return;
      var visible = false;
      cards.forEach(function (c) { if (!c.hidden) visible = true; });
      sec.hidden = !visible;
    });
    var hero = document.querySelector(".shop-hero");
    if (hero) {
      var copy = hero.querySelector("[data-sku]");
      var hItem = copy && map[copy.getAttribute("data-sku")];
      hero.hidden = !(hItem && chargedOffer(hItem));
    }
    var vacio = document.getElementById("sin-envio");
    if (vacio) {
      if (hero) vacio.hidden = !hero.hidden;
      else {
        var any = false;
        document.querySelectorAll(".pcard[data-sku]").forEach(function (c) { if (!c.hidden) any = true; });
        vacio.hidden = any;
      }
    }
    renderSoon(map);
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
        fillText(usdEl, "Precio próximamente");
        fillText(localEl, "Todavía no hay un precio publicado para " + p.nombre + ".");
        fillText(metaEl, "");
        fillText(notaEl, "Precio próximamente para " + p.nombre + ". Déjanos tu correo y lo publicamos aquí.");
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
        fillText(usdEl, p.texto);
        fillText(localEl, (usd != null ? "Unos US$ " + usd + " de referencia. " : "") + "Envío incluido a " + p.nombre + ".");
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
    writeProductJsonLd();

    document.querySelectorAll("[data-checkout]").forEach(function (a) {
      a.href = storeUrl(a.getAttribute("data-checkout-hash") || "");
    });

    document.querySelectorAll(".js-pais").forEach(function (sel) {
      if (sel.value !== pais && sel.querySelector('option[value="' + pais + '"]')) sel.value = pais;
    });
    document.querySelectorAll(".js-pais-nombre").forEach(function (el) { el.textContent = p.nombre; });

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
    try { window.dispatchEvent(new CustomEvent("gr-pais", { detail: pais })); } catch (ePaisEvt) {}
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

  if (nav) {
    nav.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".nav-parent, .nav-redes");
      if (btn && nav.contains(btn)) {
        var drop = btn.closest(".nav-drop");
        if (drop) {
          drop.classList.remove("is-dismissed");
          var open = drop.classList.toggle("is-open");
          drop.querySelectorAll(".nav-parent, .nav-redes").forEach(function (b) {
            b.setAttribute("aria-expanded", open ? "true" : "false");
          });
        }
      }
      var enlace = ev.target.closest("a");
      if (enlace && nav.contains(enlace) && window.matchMedia("(max-width: 1039px)").matches) {
        nav.classList.remove("is-open");
        if (navBtn) {
          navBtn.setAttribute("aria-expanded", "false");
          navBtn.textContent = "Menú";
        }
      }
    });
    function cerrarDesplegables(dismiss) {
      nav.querySelectorAll(".nav-drop").forEach(function (drop) {
        drop.classList.remove("is-open");
        if (dismiss) drop.classList.add("is-dismissed");
        else drop.classList.remove("is-dismissed");
        drop.querySelectorAll(".nav-parent, .nav-redes").forEach(function (b) {
          b.setAttribute("aria-expanded", "false");
        });
      });
    }
    function soltarDesplegable(ev) {
      var drop = ev.target.closest && ev.target.closest(".nav-drop");
      if (!drop || !nav.contains(drop)) return;
      if (ev.type === "focusin" && ev.target.closest(".nav-redes, .nav-parent")) return;
      drop.classList.remove("is-dismissed");
    }
    function botonVisible(drop) {
      var botones = drop.querySelectorAll(".nav-redes, .nav-parent");
      var i;
      for (i = 0; i < botones.length; i++) {
        if (botones[i].getClientRects().length) return botones[i];
      }
      return botones[0] || null;
    }
    nav.addEventListener("mouseover", soltarDesplegable);
    nav.addEventListener("focusin", soltarDesplegable);
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "Escape") return;
      if (nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        cerrarDesplegables(false);
        if (navBtn) {
          navBtn.setAttribute("aria-expanded", "false");
          navBtn.textContent = "Menú";
          navBtn.focus();
        }
        return;
      }
      var activo = document.activeElement;
      var drop = activo && activo.closest && activo.closest(".nav-drop");
      if (!drop || !nav.contains(drop)) drop = nav.querySelector(".nav-drop.is-open");
      var devolver = !!(drop && nav.contains(drop) && (drop.classList.contains("is-open") || (activo && drop.contains(activo))));
      var boton = devolver ? botonVisible(drop) : null;
      cerrarDesplegables(true);
      if (boton) boton.focus();
    });
    document.addEventListener("click", function (ev) {
      if (nav.contains(ev.target)) return;
      cerrarDesplegables(false);
    });
  }

  document.querySelectorAll("[data-social]").forEach(function (a) {
    var k = a.getAttribute("data-social");
    if (k === "youtube" && GR.youtubeUrl) a.href = GR.youtubeUrl;
    if (k === "facebook" && GR.facebookUrl) a.href = GR.facebookUrl;
    if (k === "whatsapp" && GR.whatsapp) a.href = GR.whatsapp;
    if (k === "instagram" && GR.instagramUrl) a.href = GR.instagramUrl;
    if (k === "x" && GR.xUrl) a.href = GR.xUrl;
  });

  document.querySelectorAll("[data-app-download]").forEach(function (a) {
    var url = (GR.appUrl || "").trim();
    if (!url) {
      a.setAttribute("aria-disabled", "true");
      a.removeAttribute("download");
      a.addEventListener("click", function (e) { e.preventDefault(); });
    } else {
      a.href = url;
      a.removeAttribute("aria-disabled");
      a.textContent = "Descargar para Android";
      if (/\.apk(?:$|\?)/i.test(url)) {
        var nombre = url.split("/").pop().split("?")[0] || "registro-pollos.apk";
        a.setAttribute("download", nombre);
      } else {
        a.removeAttribute("download");
      }
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
        say("Ahora mismo el formulario no puede enviar los datos. No salió nada de este navegador. Si te urge, escríbenos por WhatsApp.");
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
          say("Listo. Te anotamos en la lista de espera. Cuando el seguimiento del cobro esté activo, te escribimos. Hoy una compra todavía no genera comisión.");
        } else if (tipo === "beta") {
          say("Listo. Anotamos tu Gmail para avisarte cuando la prueba de Google Play esté abierta. Si hay plaza, te escribimos. La versión 1.0.10 ya se descarga en esta página.");
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
    refBox.textContent = (GR.siteUrl || "https://granjarentable.com") + "/?ref=TUCODIGO";
  }

  (function addToolNav() {
    var barra = document.getElementById("site-nav");
    if (!barra || document.getElementById("nav-herramientas")) return;
    var drop = document.createElement("div");
    drop.className = "nav-drop";
    drop.innerHTML = '<div class="nav-row">' +
      '<button class="nav-redes nav-tools" type="button" aria-expanded="false" aria-controls="nav-herramientas">' +
      '<span class="nav-ico"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M6 8h8v8H6zm12 0h8v8h-8zM6 20h8v6H6zm12 0h8v6h-8z"/></svg></span>' +
      '<span class="nav-label">Herramientas</span></button>' +
      '<button class="nav-parent nav-more" type="button" aria-expanded="false" aria-controls="nav-herramientas" aria-label="Calculadora, enfermedades y juegos"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M6 8.5 12 15l6-6.5H6z"/></svg></button>' +
      '</div><div class="nav-sub" id="nav-herramientas"></div>';
    var sub = drop.querySelector("#nav-herramientas");
    function enlace(href, html, actual) {
      var full = root + href;
      var a = barra.querySelector('a[href="' + full + '"]') || barra.querySelector('a[href$="' + href + '"]');
      if (!a) {
        a = document.createElement("a");
        a.href = full;
      }
      if (html) a.innerHTML = html;
      if (actual) a.setAttribute("aria-current", "page");
      sub.appendChild(a);
      return a;
    }
    var ruta = location.pathname || "";
    enlace(
      "calculadora.html",
      '<span class="nav-ico"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M8 3.5h16a2.5 2.5 0 0 1 2.5 2.5v20a2.5 2.5 0 0 1-2.5 2.5H8A2.5 2.5 0 0 1 5.5 26V6A2.5 2.5 0 0 1 8 3.5zM10 7.2h12v4.6H10V7.2zM10 14.2h4v4h-4v-4zm6 0h4v4h-4v-4zM10 20.2h4v4h-4v-4zm6 0h4v4h-4v-4z"/></svg></span><span class="nav-label">Calculadora</span>',
      /\/calculadora(?:\.html)?\/?$/.test(ruta)
    );
    enlace(
      "enfermedades.html",
      '<span class="nav-ico"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="11" fill="none" stroke="currentColor" stroke-width="2.2"/><path fill="currentColor" d="M14.2 8.2h3.6v6h6v3.6h-6v6h-3.6v-6h-6v-3.6h6z"/></svg></span><span class="nav-label">Enfermedades</span>',
      /\/enfermedades(?:\.html|\/)/.test(ruta)
    );
    /* Juegos queda el último de este desplegable.
       El concurso, cuando exista su página, se inserta justo después de este enlace. */
    var juegos = enlace("juegos.html", "", /\/juegos(?:\.html)?\/?$/.test(ruta));
    if (!juegos.querySelector(".nav-label")) {
      juegos.innerHTML = '<span class="nav-ico"><svg viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="M13.2 4h12.2v8.6L14.2 28 4 17.6V8.8L8.6 4h4.6zm8.4 6.2a2.1 2.1 0 1 1-4.2 0 2.1 2.1 0 0 1 4.2 0z"/></svg></span><span class="nav-label">Juegos</span>';
    }
    var appLink = barra.querySelector('a[href$="app.html"]');
    if (appLink) barra.insertBefore(drop, appLink);
    else barra.appendChild(drop);
  })();

  document.querySelectorAll(".foot-brand").forEach(function (p) {
    if ((p.textContent || "").trim() !== "Sitio") return;
    var ul = p.parentElement && p.parentElement.querySelector("ul");
    if (!ul) return;
    [
      ["calculadora.html", "Calculadora de rentabilidad"],
      ["calculadoras.html", "Calculadoras"],
      ["razas.html", "Líneas de aves"],
      ["lista.html", "Lista y calendario"],
      ["cuenta.html", "Mi cuenta"],
      ["enfermedades.html", "Enfermedades"],
      ["faq.html", "Preguntas frecuentes"],
      ["guias.html", "Guías"],
      ["juegos.html", "Juegos"]
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

  (function cargarCuenta() {
    if (window.GRAuth) return;
    var s = document.createElement("script");
    s.src = root + "js/auth.js";
    document.body.appendChild(s);
  })();

  function writeProductJsonLd() {
    var prev = document.getElementById("product-jsonld");
    if (prev) prev.remove();
    var box = document.querySelector(".pdp-buy[data-sku]");
    if (!box) return;
    var item = catalogMap()[box.getAttribute("data-sku")];
    var offer = chargedOffer(item);
    if (!offer || !offer.moneda) return;
    var site = (GR.siteUrl || "https://granjarentable.com").replace(/\/$/, "");
    var data = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": (offer.nombre || item.nombre),
      "description": item.resumen || "",
      "sku": item.id,
      "url": site + "/producto/" + item.id + ".html",
      "seller": { "@type": "Organization", "name": "Granja Rentable", "url": site + "/" },
      "offers": {
        "@type": "Offer",
        "price": String(offer.precio),
        "priceCurrency": offer.moneda,
        "url": site + "/producto/" + item.id + ".html",
        "availability": "https://schema.org/InStock"
      }
    };
    if (item.imagen) data.image = site + "/" + String(item.imagen).replace(/^\//, "");
    var s = document.createElement("script");
    s.id = "product-jsonld";
    s.type = "application/ld+json";
    s.textContent = JSON.stringify(data);
    document.head.appendChild(s);
  }

  applyPais(pais, false);
  fetch(root + "data/catalogo-paises.json", { credentials: "omit" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.paises) return;
      window.GR_PAIS_CATALOGO = data;
      applyPais(pais, false);
    })
    .catch(function () {});
  function askGeo() {
    try {
      if (!(window.ads && window.ads.activo === true)) return;
      if (localStorage.getItem("gr_pais")) return;
      if (localStorage.getItem("gr_consent") !== "si") return;
      if (window.__grGeoAsked) return;
      window.__grGeoAsked = 1;
      fetch("https://get.geojs.io/v1/ip/country.json", { credentials: "omit" })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var code = String((d && (d.country || d.country_code)) || "").toUpperCase();
          if (!PAISES[code]) return;
          try { localStorage.setItem("gr_pais_ip", code); } catch (e1) {}
          if (code !== pais && !localStorage.getItem("gr_pais")) applyPais(code, false);
        })
        .catch(function () {});
    } catch (eGeo) {}
  }
  askGeo();
  document.addEventListener("click", function (ev) {
    var t = ev.target && ev.target.closest ? ev.target.closest("[data-c]") : null;
    if (t && t.getAttribute("data-c") === "si") askGeo();
  });
  window.GR_estado = function () {
    return { pais: pais, ref: readRef(), tienda: (PAISES[pais] && PAISES[pais].envio) ? storeUrl() : "" };
  };
})();

/* === Panel: registro de visitas e intenciones de compra (sin cookies) ===
   Una fila por página vista en public.visitas y una por clic en «Comprar»
   (tienda) o en un WhatsApp de producto en public.intenciones_compra.
   Sin IP, sin huella, sin datos personales: solo ruta, dominio de origen y país.
   Si las tablas aún no existen (migración 20261020193000_panel.sql sin correr),
   los envíos fallan en silencio y la web ni se entera.
   También inyecta la baliza de Cloudflare Web Analytics si hay token en
   js/config.js (GR.analitica.cfToken); sin token no carga nada. */
(function () {
  try {
    var GR = window.GR || {};
    var com = GR.comunidad || {};
    var SB = (com.supabaseUrl || "").replace(/\/+$/, "");
    var KEY = com.supabaseAnonKey || "";
    var ruta = location.pathname || "/";

    function pais() {
      try {
        var p = (localStorage.getItem("gr_pais") || "").toUpperCase();
        return /^[A-Z]{2}$/.test(p) ? p : null;
      } catch (e) { return null; }
    }

    function enviar(tabla, datos) {
      if (!SB || !KEY) return;
      try {
        fetch(SB + "/rest/v1/" + tabla, {
          method: "POST",
          credentials: "omit",
          keepalive: true,
          headers: {
            "apikey": KEY,
            "Authorization": "Bearer " + KEY,
            "Content-Type": "application/json",
            "Prefer": "return=minimal"
          },
          body: JSON.stringify(datos)
        }).catch(function () {});
      } catch (e) {}
    }

    /* Cloudflare Web Analytics: solo si pablo pegó el token en config.js. */
    var cfToken = (GR.analitica && GR.analitica.cfToken) || "";
    if (cfToken) {
      var cf = document.createElement("script");
      cf.defer = true;
      cf.src = "https://static.cloudflareinsights.com/beacon.min.js";
      cf.setAttribute("data-cf-beacon", JSON.stringify({ token: cfToken }));
      (document.head || document.documentElement).appendChild(cf);
    }

    /* El panel no se cuenta a sí mismo. */
    if (ruta === "/panel.html" || ruta === "/panel") return;

    var refHost = "";
    try { refHost = document.referrer ? new URL(document.referrer).hostname : ""; } catch (e) {}
    if (refHost === location.hostname) refHost = "";

    function visita() {
      enviar("visitas", { ruta: ruta, referer: refHost || null, pais: pais() });
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", visita);
    } else {
      visita();
    }

    /* Intención de compra: clic en Comprar o en WhatsApp de producto.
       No se frena la navegación: el envío va con keepalive y en segundo plano. */
    document.addEventListener("click", function (ev) {
      var t = ev.target && ev.target.closest ? ev.target.closest("a") : null;
      if (!t) return;
      var href = t.href || "";
      var esTienda = t.hasAttribute("data-checkout") || t.classList.contains("js-comprar");
      var esWhats = href.indexOf("wa.me/") > -1;
      if (!esTienda && !esWhats) return;

      var producto = "";
      var canal = "";
      if (esTienda) {
        canal = "tienda";
        producto = t.getAttribute("data-producto") || "Incubadora 24Egg Dual";
      } else {
        canal = "whatsapp";
        var m = /[?&]text=([^&]+)/.exec(href);
        var texto = "";
        try { texto = m ? decodeURIComponent(m[1].replace(/\+/g, " ")) : ""; } catch (e) {}
        var mi = /Me interesa:\s*(.+)$/.exec(texto);
        producto = mi ? mi[1].trim() : "Consulta por WhatsApp";
      }
      producto = producto.slice(0, 140);
      if (!producto) return;

      enviar("intenciones_compra", {
        producto: producto, canal: canal, ruta: ruta, pais: pais()
      });

      /* Aviso al correo vía la aplicación de formularios (Apps Script):
         solo surte efecto con el Codigo.gs actualizado (tipo «compra»). */
      var endpoint = (GR.formEndpoint || "").trim();
      if (endpoint) {
        try {
          var cuerpo = new URLSearchParams({
            tipo: "compra", interes: producto, origen: ruta
          });
          if (navigator.sendBeacon) {
            navigator.sendBeacon(endpoint, cuerpo);
          } else {
            fetch(endpoint, { method: "POST", body: cuerpo, keepalive: true, mode: "no-cors" }).catch(function () {});
          }
        } catch (e) {}
      }
    }, true);
  } catch (e) {}
})();
