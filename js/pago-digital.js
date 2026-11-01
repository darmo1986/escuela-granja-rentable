/* Cobro de productos digitales por enlace (pack de 4 ebooks y Kit Granja en Orden).
   Habla con el mismo Apps Script que los ebooks, pero con tipos propios
   ("paypal-digital", "stripe-digital", "oferta-kit") para no tocar el cobro
   de los ebooks sueltos. El precio lo decide SIEMPRE el servidor por la clave. */
(function (root) {
  var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyeSZCE95DI1wdls0MiNoKdh92i8ve0GkkJHy4GAY3p4pWsBCRhs0hb3bmUMTV-Xw0Wzw/exec";
  var NOMBRE = {
    "pack-4-ebooks": "los 4 ebooks",
    "kit-granja-en-orden": "el Kit Granja en Orden",
    "kit-tras-ebook": "el Kit Granja en Orden"
  };
  function llamar(datos) {
    return fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(datos)
    }).then(function (r) { return r.json(); });
  }
  function decir(el, texto) {
    if (typeof el === "string") el = document.getElementById(el) || document.querySelector('[data-stripe-mensaje="' + el + '"]');
    if (el) el.textContent = texto;
  }
  function textoOk(clave, ya) {
    var que = NOMBRE[clave] || "tu compra";
    if (ya) return "Este pedido ya estaba entregado: revisa tu correo (y el spam). Ahí tienes el enlace para descargar " + que + ".";
    return "¡Pago completado! Te hemos enviado por correo el enlace para descargar " + que +
      ". Si no lo ves en unos minutos, revisa la carpeta de spam.";
  }

  // PayPal: el SDK lo carga ebooks.html; en kit.html lo carga cargarPaypal().
  function cargarPaypal() {
    if (root.paypal && root.paypal.Buttons) return Promise.resolve(root.paypal);
    if (root.__grPaypalCargando) return root.__grPaypalCargando;
    root.__grPaypalCargando = llamar({ tipo: "paypal-ebook", accion: "client-id-publico" }).then(function (d) {
      if (!(d && d.clientId)) throw new Error("sin_client_id");
      return new Promise(function (ok, ko) {
        var s = document.createElement("script");
        s.src = "https://www.paypal.com/sdk/js?client-id=" + encodeURIComponent(d.clientId) +
          "&currency=USD&intent=capture&components=buttons";
        s.onload = function () { ok(root.paypal); };
        s.onerror = ko;
        document.head.appendChild(s);
      });
    });
    return root.__grPaypalCargando;
  }
  function esperarPaypal(ms) {
    return new Promise(function (ok, ko) {
      var t0 = Date.now();
      (function mira() {
        if (root.paypal && root.paypal.Buttons) return ok(root.paypal);
        if (Date.now() - t0 > (ms || 20000)) return ko(new Error("paypal_no_carga"));
        setTimeout(mira, 300);
      })();
    });
  }
  function montarPaypal(contenedorId, mensajeId, clave, token) {
    root.paypal.Buttons({
      style: { shape: "rect", layout: "vertical", color: "gold", label: "paypal" },
      createOrder: function () {
        return llamar({ tipo: "paypal-digital", accion: "crear", producto: clave, token: token || "" })
          .then(function (d) {
            if (d && d.id) return d.id;
            throw new Error((d && d.error) || "no_se_pudo_crear_el_pedido");
          })
          .catch(function (err) {
            decir(mensajeId, String(err && err.message) === "oferta_no_valida"
              ? "Esta oferta ya no es válida. Puedes comprar el kit a 12 $ en granjarentable.com/kit.html."
              : "No se pudo iniciar el pago con PayPal. Inténtalo de nuevo.");
            throw err;
          });
      },
      onApprove: function (data, actions) {
        return llamar({ tipo: "paypal-digital", accion: "capturar", orderID: data.orderID, producto: clave, token: token || "" })
          .then(function (d) {
            if (d && d.motivo === "INSTRUMENT_DECLINED") return actions.restart();
            if (d && d.ok) { decir(mensajeId, textoOk(d.clave || clave, d.ya_enviado)); return; }
            throw new Error((d && d.error) || "captura_fallida");
          })
          .catch(function () {
            decir(mensajeId, "No se pudo completar el pago. No se ha cobrado ni enviado nada. Inténtalo de nuevo o escríbenos.");
          });
      },
      onError: function () { decir(mensajeId, "Hubo un problema con PayPal. Inténtalo de nuevo."); }
    }).render("#" + contenedorId);
  }

  // Stripe: botones con data-stripe-digital="clave" (y data-token si es la oferta).
  function enlazarStripe(ambito) {
    (ambito || document).querySelectorAll("[data-stripe-digital]").forEach(function (b) {
      if (b.__grListo) return;
      b.__grListo = true;
      b.addEventListener("click", function () {
        var clave = b.getAttribute("data-stripe-digital");
        var msg = b.getAttribute("data-mensaje") || clave;
        b.disabled = true;
        decir(msg, "Redirigiendo a la página de pago seguro…");
        llamar({ tipo: "stripe-digital", accion: "crear", producto: clave,
                 token: b.getAttribute("data-token") || "", pagina: location.pathname.split("/").pop() || "ebooks.html" })
          .then(function (d) {
            if (d && d.url) { location.href = d.url; return; }
            throw new Error((d && d.error) || "no_se_pudo_crear_la_sesion");
          })
          .catch(function (err) {
            b.disabled = false;
            decir(msg, String(err && err.message) === "oferta_no_valida"
              ? "Esta oferta ya no es válida. Puedes comprar el kit a 12 $."
              : "No se pudo iniciar el pago con tarjeta. Inténtalo de nuevo.");
          });
      });
    });
  }
  function confirmarStripeAlVolver(mensajePorDefecto) {
    var p = new URLSearchParams(location.search);
    var sid = p.get("stripe_digital");
    var limpiar = function () { try { history.replaceState(null, "", location.pathname + location.hash); } catch (e) {} };
    if (p.get("stripe_digital_cancelado")) {
      decir(p.get("producto") || mensajePorDefecto, "Pago cancelado: no se ha cobrado nada.");
      limpiar();
      return;
    }
    if (!sid) return;
    llamar({ tipo: "stripe-digital", accion: "confirmar", sessionId: sid }).then(function (d) {
      var clave = (d && d.clave) || mensajePorDefecto;
      var destino = document.querySelector('[data-stripe-mensaje="' + clave + '"]') ? clave : mensajePorDefecto;
      if (d && d.ok) { decir(destino, textoOk(clave, d.ya_enviado)); limpiar(); return; }
      decir(destino, "No pudimos confirmar el pago todavía. Si se te ha cobrado, escríbenos a ventas@granjarentable.com y te lo enviamos.");
    }).catch(function () {
      decir(mensajePorDefecto, "No pudimos confirmar el pago. Recarga la página; si se te ha cobrado, escríbenos.");
    });
  }

  // Oferta del kit a 10 $ justo después de comprar un ebook de 2 $.
  // El servidor comprueba el pago del ebook y devuelve un token de un solo uso.
  function ofertaKit(pago, referencia, mensajeAncla) {
    var caja = document.getElementById("oferta-kit");
    if (!caja || !referencia) return;
    llamar({ tipo: "oferta-kit", accion: "emitir", pago: pago, ref: referencia }).then(function (d) {
      if (!(d && d.ok && d.token)) return;
      var ancla = document.getElementById(mensajeAncla) || document.querySelector('[data-stripe-mensaje="' + mensajeAncla + '"]');
      if (ancla && ancla.parentNode) ancla.parentNode.insertBefore(caja, ancla.nextSibling);
      var ver = caja.querySelector("[data-oferta-ver]");
      if (ver) ver.href = "kit.html?oferta=" + encodeURIComponent(d.token);
      var tarjeta = caja.querySelector("[data-stripe-digital]");
      if (tarjeta) tarjeta.setAttribute("data-token", d.token);
      caja.hidden = false;
      enlazarStripe(caja);
      esperarPaypal().then(function () {
        montarPaypal("paypal-boton-oferta-kit", "paypal-mensaje-oferta-kit", "kit-tras-ebook", d.token);
      }).catch(function () {
        decir("paypal-mensaje-oferta-kit", "PayPal no disponible ahora. Prueba con tarjeta.");
      });
      var no = caja.querySelector("[data-oferta-cerrar]");
      if (no) no.addEventListener("click", function () { caja.hidden = true; });
    }).catch(function () {});
  }

  root.GR_digital = {
    llamar: llamar, cargarPaypal: cargarPaypal, esperarPaypal: esperarPaypal,
    montarPaypal: montarPaypal, enlazarStripe: enlazarStripe,
    confirmarStripeAlVolver: confirmarStripeAlVolver, ofertaKit: ofertaKit, decir: decir
  };
})(window);
