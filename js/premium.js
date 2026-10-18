/* Página Premium. El pago lo abre el servidor con la sesión.
   El navegador no elige el precio ni el id de la cuenta. La tarjeta no pasa por esta web. */
(function () {
  var UE = {
    AT: 1, BE: 1, BG: 1, HR: 1, CY: 1, CZ: 1, DK: 1, EE: 1, FI: 1, FR: 1,
    DE: 1, GR: 1, HU: 1, IE: 1, IT: 1, LV: 1, LT: 1, LU: 1, MT: 1, NL: 1,
    PL: 1, PT: 1, RO: 1, SK: 1, SI: 1, ES: 1, SE: 1
  };
  var ANUAL = {
    usd: {
      cifra: "US$ 39",
      periodo: "/ año",
      nota: "Fuera de la Unión Europea: precio en dólares, sin impuestos españoles. El menú no decide el impuesto.",
      igic: "",
      ahorro: "Ahorras un 35 % frente al mensual"
    },
    eur: {
      cifra: "39 €",
      periodo: "/ año",
      nota: "Canarias: 39 € con el IGIC del 7 % incluido.",
      igic: "39 € = 36,45 € + 2,55 € de IGIC.",
      ahorro: "Ahorras un 35 % frente al mensual"
    }
  };
  var MENSUAL = {
    usd: {
      cifra: "US$ 4,99",
      periodo: "/ mes",
      nota: "Fuera de la Unión Europea: precio en dólares, sin impuestos españoles. El menú no decide el impuesto.",
      igic: "",
      ahorro: ""
    },
    eur: {
      cifra: "4,99 €",
      periodo: "/ mes",
      nota: "Canarias: 4,99 € con el IGIC del 7 % incluido.",
      igic: "4,99 € = 4,66 € + 0,33 € de IGIC.",
      ahorro: ""
    }
  };
  var PAISES_FACTURA = [
    ["ES", "España"],
    ["MX", "México"], ["US", "Estados Unidos"], ["CO", "Colombia"], ["PE", "Perú"],
    ["AR", "Argentina"], ["CL", "Chile"], ["EC", "Ecuador"], ["VE", "Venezuela"],
    ["UY", "Uruguay"], ["PY", "Paraguay"], ["BO", "Bolivia"], ["GT", "Guatemala"],
    ["HN", "Honduras"], ["SV", "El Salvador"], ["NI", "Nicaragua"], ["CR", "Costa Rica"],
    ["PA", "Panamá"], ["DO", "República Dominicana"], ["BR", "Brasil"], ["GB", "Reino Unido"],
    ["CH", "Suiza"], ["CA", "Canadá"],
    ["FR", "Francia"], ["DE", "Alemania"], ["IT", "Italia"], ["PT", "Portugal"], ["NL", "Países Bajos"]
  ];
  var PERMITIDOS = { P: 1, BR: 1, STRONG: 1, EM: 1, UL: 1, OL: 1, LI: 1, H2: 1, H3: 1, A: 1, BLOCKQUOTE: 1 };

  function pais() {
    var sel = document.querySelector(".js-pais");
    if (sel && sel.value) return sel.value;
    return document.documentElement.dataset.pais || "";
  }

  function monedaAnunciada(code, origen, geo, ads) {
    code = String(code || "").toUpperCase();
    if (UE[code]) return "eur";
    if (origen === "elegido") return "usd";
    if (origen === "inferido" && ads === "libre") return "usd";
    if (geo === "ok" && (origen === "inferido" || origen === "geo")) return "usd";
    return "eur";
  }

  function senalAds() {
    var html = document.documentElement;
    if (html.dataset.ads === "libre") return "libre";
    var origen = html.dataset.paisOrigen || "";
    var code = String(pais() || html.dataset.pais || "").toUpperCase();
    var consent = "";
    try { consent = localStorage.getItem("gr_consent") || ""; } catch (e) {}
    if (consent !== "si" && origen === "inferido" && (code === "MX" || code === "CO")) {
      return "libre";
    }
    return html.dataset.ads || "";
  }

  function moneda() {
    var html = document.documentElement;
    return monedaAnunciada(pais(), html.dataset.paisOrigen || "", html.dataset.geo || "", senalAds());
  }

  function plan() {
    var mensual = document.getElementById("plan-mensual");
    return mensual && mensual.classList.contains("is-on") ? "mensual" : "anual";
  }

  function usuario() {
    return window.GRAuth && GRAuth.usuario ? GRAuth.usuario() : null;
  }

  function monedaVisible() {
    var region = regionElegida();
    if (region === "canarias") return "eur";
    if (region === "fuera") return "usd";
    return moneda();
  }

  function pintarPrecio() {
    var region = regionElegida();
    var tarifa = (plan() === "mensual" ? MENSUAL : ANUAL)[monedaVisible()];
    var linea = document.getElementById("precio-linea");
    var nota = document.getElementById("precio-nota");
    var ahorro = document.getElementById("precio-ahorro");
    if (linea) linea.innerHTML = tarifa.cifra + " <small>" + tarifa.periodo + "</small>";
    if (nota) nota.textContent = region === "bloqueada" ? "Próximamente en tu región" : tarifa.nota;
    var igic = document.getElementById("precio-igic");
    if (igic) {
      if (region === "bloqueada") igic.textContent = "Próximamente en tu región";
      else if (region === "fuera") igic.textContent = "Fuera de la UE no se añade IGIC ni IVA español.";
      else igic.textContent = tarifa.igic || "Fuera de la UE no se añade IGIC ni IVA español.";
    }
    if (ahorro) {
      ahorro.hidden = !tarifa.ahorro;
      ahorro.textContent = tarifa.ahorro;
    }
    pintarBoton();
  }

  function regionElegida() {
    var sel = document.getElementById("premium-pais");
    var cp = document.getElementById("premium-cp");
    var code = sel && sel.value ? sel.value : "";
    var postal = cp && cp.value ? cp.value : "";
    if (!code) return "";
    if (code === "ES") return /^(35|38)\d{3}$/.test(String(postal).replace(/\D/g, "")) ? "canarias" : "bloqueada";
    if (UE[code]) return "bloqueada";
    return "fuera";
  }

  function pintarRegion() {
    var nota = document.getElementById("premium-region");
    if (!nota) return;
    var region = regionElegida();
    if (!region) nota.textContent = "Elige el país y el código postal de facturación. Solo vendemos en Canarias (códigos 35 y 38) y fuera de la Unión Europea.";
    else if (region === "bloqueada") nota.textContent = "Próximamente en tu región";
    else if (region === "canarias") nota.textContent = "Canarias: el precio lleva el IGIC del 7 % incluido.";
    else nota.textContent = "Fuera de la UE: se cobra en US$ y sin impuestos españoles.";
  }

  function pintarBoton() {
    var boton = document.getElementById("premium-cta");
    var aviso = document.getElementById("premium-aviso");
    var acepto = document.getElementById("premium-acepto");
    if (!boton) return;
    var u = usuario();
    pintarRegion();
    if (!(window.GR && GR.premium && GR.premium.activo) && !(u && u.premium)) {
      boton.disabled = true;
      boton.textContent = "Próximamente";
      if (aviso) aviso.textContent = "Próximamente. El pago todavía no está conectado.";
      return;
    }
    if (regionElegida() === "bloqueada") {
      boton.disabled = true;
      boton.textContent = "Próximamente en tu región";
      if (aviso) aviso.textContent = "Próximamente en tu región";
      return;
    }
    if (u && u.premium) {
      boton.disabled = false;
      boton.textContent = "Ir a mi cuenta";
      if (aviso) aviso.textContent = "Ya eres Premium. Gestionas la tarjeta y la baja en la página de Stripe, en dos clics.";
      return;
    }
    if (acepto && !acepto.checked) {
      boton.disabled = true;
      boton.textContent = "Acepta las condiciones";
      if (aviso) aviso.textContent = "Marca la casilla para seguir a la página de pago de Stripe. Son 7 días de prueba.";
      return;
    }
    boton.disabled = false;
    boton.textContent = u ? "Probar 7 días gratis" : "Entra para probar 7 días gratis";
    if (aviso) aviso.textContent = "El pago lo abre el servidor con tu sesión. En Canarias el IGIC va incluido. No vemos el número de tu tarjeta.";
  }

  function elegir(cual) {
    var anual = document.getElementById("plan-anual");
    var mensual = document.getElementById("plan-mensual");
    if (anual) {
      anual.classList.toggle("is-on", cual === "anual");
      anual.setAttribute("aria-pressed", cual === "anual" ? "true" : "false");
    }
    if (mensual) {
      mensual.classList.toggle("is-on", cual === "mensual");
      mensual.setAttribute("aria-pressed", cual === "mensual" ? "true" : "false");
    }
    pintarPrecio();
  }

  function ir() {
    var u = usuario();
    if (u && u.premium) {
      location.href = "cuenta.html";
      return;
    }
    var acepto = document.getElementById("premium-acepto");
    if (acepto && !acepto.checked) return;
    if (!u) {
      if (window.GRAuth && GRAuth.abrir) GRAuth.abrir("entrar");
      else location.href = "cuenta.html";
      return;
    }
    var boton = document.getElementById("premium-cta");
    var aviso = document.getElementById("premium-aviso");
    if (!window.GRAuth || !GRAuth.iniciarPago) {
      if (boton) { boton.disabled = true; boton.textContent = "Próximamente"; }
      return;
    }
    if (boton) { boton.disabled = true; boton.textContent = "Abriendo el pago…"; }
    var sel = document.getElementById("premium-pais");
    var cp = document.getElementById("premium-cp");
    var region = regionElegida();
    if (region !== "canarias" && region !== "fuera") {
      if (boton) { boton.disabled = true; boton.textContent = "Próximamente en tu región"; }
      if (aviso) aviso.textContent = "Próximamente en tu región";
      return;
    }
    var ipOk = false;
    try { ipOk = localStorage.getItem("gr_consent") === "si"; } catch (eIp) {}
    GRAuth.iniciarPago(plan(), true, {
      pais: sel ? sel.value : "",
      cp: cp ? cp.value : "",
      ipOk: ipOk
    }).then(function (res) {
      var url = res && res.data && res.data.url;
      if (url) {
        location.href = url;
        return;
      }
      var detalle = (res && res.data && res.data.error) || "";
      var pronto = !detalle || /Próximamente|no está conectado|Failed to send|not found|404|FunctionsFetch|Failed to fetch/i.test(detalle);
      if (boton) {
        boton.disabled = !!pronto;
        boton.textContent = pronto ? "Próximamente" : "Probar 7 días gratis";
      }
      if (aviso) aviso.textContent = pronto ? "Próximamente. El pago todavía no está conectado." : detalle;
    }).catch(function () {
      if (boton) { boton.disabled = true; boton.textContent = "Próximamente"; }
      if (aviso) aviso.textContent = "Próximamente. El pago todavía no está conectado.";
    });
  }

  function limpio(html) {
    var doc = new DOMParser().parseFromString(String(html || ""), "text/html");
    function anda(nodo) {
      Array.prototype.slice.call(nodo.childNodes).forEach(function (h) {
        if (h.nodeType === 3) return;
        if (h.nodeType !== 1 || !PERMITIDOS[h.tagName]) {
          if (h.remove) h.remove();
          return;
        }
        Array.prototype.slice.call(h.attributes).forEach(function (at) {
          if (h.tagName === "A" && at.name.toLowerCase() === "href") {
            var href = at.value.trim();
            if (!/^https:\/\//i.test(href) && href.charAt(0) !== "#") h.removeAttribute(at.name);
          } else h.removeAttribute(at.name);
        });
        if (h.tagName === "A" && /^https:\/\//i.test(h.getAttribute("href") || "")) {
          h.setAttribute("rel", "noopener");
          h.setAttribute("target", "_blank");
        }
        anda(h);
      });
    }
    anda(doc.body);
    return doc.body.innerHTML;
  }

  function pintarInsignia() {
    var caja = document.getElementById("insignia-mia");
    if (!caja) return;
    var u = usuario();
    caja.textContent = "";
    if (!u) {
      caja.textContent = "Cuando entres, aquí verás tu apodo.";
      return;
    }
    caja.appendChild(document.createTextNode(u.nombre));
    if (u.premium) {
      var s = document.createElement("span");
      s.className = "insignia-premium";
      s.textContent = "Premium";
      caja.appendChild(document.createTextNode(" "));
      caja.appendChild(s);
    }
  }

  function pintarLotes(filas, error) {
    var lista = document.getElementById("lotes-lista");
    var nota = document.getElementById("lotes-nota");
    if (!lista) return;
    lista.textContent = "";
    if (error) {
      if (nota) nota.textContent = "No se pudo guardar. Solo una cuenta Premium escribe en esta lista.";
      return;
    }
    if (nota) nota.textContent = "";
    if (!filas || !filas.length) {
      var vacio = document.createElement("p");
      vacio.textContent = "Todavía no hay lotes guardados.";
      lista.appendChild(vacio);
      return;
    }
    var tabla = document.createElement("table");
    tabla.innerHTML = "<thead><tr><th>Lote</th><th>Aves</th><th>Margen del lote</th><th></th></tr></thead>";
    var cuerpo = document.createElement("tbody");
    filas.forEach(function (f) {
      var margen = (Number(f.precio_venta) - Number(f.costo_ave)) * Number(f.aves);
      var tr = document.createElement("tr");
      var c1 = document.createElement("td");
      c1.textContent = f.nombre;
      var c2 = document.createElement("td");
      c2.textContent = String(f.aves);
      var c3 = document.createElement("td");
      c3.textContent = (isFinite(margen) ? margen.toLocaleString("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
      var c4 = document.createElement("td");
      var b = document.createElement("button");
      b.type = "button";
      b.className = "btn sec";
      b.textContent = "Quitar";
      b.addEventListener("click", function () {
        GRAuth.borrarLote(f.id).then(cargarMiembros).catch(function () { pintarLotes(filas, true); });
      });
      c4.appendChild(b);
      tr.appendChild(c1);
      tr.appendChild(c2);
      tr.appendChild(c3);
      tr.appendChild(c4);
      cuerpo.appendChild(tr);
    });
    tabla.appendChild(cuerpo);
    var marco = document.createElement("div");
    marco.className = "tabla";
    marco.appendChild(tabla);
    lista.appendChild(marco);
  }

  function pintarContenido(filas, cerrado) {
    var caja = document.getElementById("premium-contenido");
    if (!caja) return;
    caja.textContent = "";
    if (cerrado === "fuera") {
      var p = document.createElement("p");
      p.textContent = "Entra con tu cuenta de Granja Rentable para abrir el contenido.";
      caja.appendChild(p);
      return;
    }
    if (cerrado === "no") {
      var q = document.createElement("p");
      q.textContent = "El curso avanzado y las plantillas se abren al suscribirte. Si no eres Premium, la base no devuelve el texto ni el archivo.";
      caja.appendChild(q);
      return;
    }
    if (!filas || !filas.length) {
      var r = document.createElement("p");
      r.textContent = "Todavía no hay piezas publicadas. El curso de verdad se cargará en Supabase, no en esta página.";
      caja.appendChild(r);
      return;
    }
    filas.forEach(function (fila) {
      var art = document.createElement("article");
      art.className = "premium-pieza";
      if (fila.ejemplo) {
        var marca = document.createElement("p");
        marca.className = "ejemplo";
        marca.textContent = "EJEMPLO. No es el curso ni una plantilla real. El equipo lo sustituirá.";
        art.appendChild(marca);
      }
      var h = document.createElement("h3");
      h.textContent = fila.titulo;
      art.appendChild(h);
      var cuerpo = document.createElement("div");
      cuerpo.innerHTML = limpio(fila.html);
      art.appendChild(cuerpo);
      if (fila.archivo) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn sec";
        b.textContent = "Descargar el ejemplo (2 minutos)";
        var estado = document.createElement("p");
        estado.className = "fine";
        b.addEventListener("click", function () {
          estado.textContent = "Pidiendo el enlace…";
          GRAuth.enlaceArchivo(fila.archivo).then(function (res) {
            if (!res || res.error || !res.data || !res.data.signedUrl) {
              estado.textContent = "El archivo de ejemplo todavía no está en el almacén privado, o esta cuenta no es Premium.";
              return;
            }
            estado.textContent = "";
            var a = document.createElement("a");
            a.href = res.data.signedUrl;
            a.textContent = "Abrir ejemplo/plantilla-costos.txt";
            a.rel = "noopener";
            estado.appendChild(a);
          }).catch(function () {
            estado.textContent = "No se pudo abrir el archivo.";
          });
        });
        art.appendChild(b);
        art.appendChild(estado);
      }
      caja.appendChild(art);
    });
  }

  function cargarMiembros() {
    var u = usuario();
    var form = document.getElementById("lotes-form");
    if (form) {
      Array.prototype.forEach.call(form.querySelectorAll("input, button"), function (el) {
        el.disabled = !(u && u.premium);
      });
    }
    pintarInsignia();
    if (!window.GRAuth || !GRAuth.leerPremium) return;
    if (!u) {
      pintarContenido(null, "fuera");
      pintarLotes([]);
      return;
    }
    if (!u.premium) {
      pintarContenido(null, "no");
      pintarLotes([]);
      return;
    }
    GRAuth.leerPremium().then(function (res) {
      if (!res) {
        pintarContenido(null, "fuera");
        return;
      }
      var cont = res.contenido && !res.contenido.error ? res.contenido.data : null;
      var lotes = res.lotes && !res.lotes.error ? res.lotes.data : [];
      if (res.contenido && res.contenido.error) pintarContenido(null, "no");
      else pintarContenido(cont || [], null);
      pintarLotes(lotes || []);
    }).catch(function () {
      pintarContenido(null, "no");
    });
  }

  var selPais = document.getElementById("premium-pais");
  var campoCp = document.getElementById("premium-cp");
  if (selPais) {
    PAISES_FACTURA.forEach(function (par) {
      var op = document.createElement("option");
      op.value = par[0];
      op.textContent = par[1];
      selPais.appendChild(op);
    });
    selPais.addEventListener("change", pintarPrecio);
  }
  if (campoCp) campoCp.addEventListener("input", pintarPrecio);
  var anual = document.getElementById("plan-anual");
  var mensual = document.getElementById("plan-mensual");
  var boton = document.getElementById("premium-cta");
  var acepto = document.getElementById("premium-acepto");
  var form = document.getElementById("lotes-form");
  if (anual) anual.addEventListener("click", function () { elegir("anual"); });
  if (mensual) mensual.addEventListener("click", function () { elegir("mensual"); });
  if (acepto) acepto.addEventListener("change", pintarBoton);
  if (boton) boton.addEventListener("click", ir);
  if (form) form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    var nota = document.getElementById("lotes-nota");
    var aves = parseInt(form.aves.value, 10);
    var costo = Number(String(form.costo.value).replace(",", "."));
    var venta = Number(String(form.venta.value).replace(",", "."));
    if (!form.nombre.value.trim() || !isFinite(aves) || aves < 1 || !isFinite(costo) || !isFinite(venta)) {
      if (nota) nota.textContent = "Revisa el nombre, las aves y los dos importes.";
      return;
    }
    if (!window.GRAuth || !GRAuth.guardarLote) return;
    GRAuth.guardarLote({ nombre: form.nombre.value, aves: aves, costo: costo, venta: venta })
      .then(function () { form.reset(); cargarMiembros(); })
      .catch(function () { pintarLotes([], true); });
  });

  window.addEventListener("gr-pais", pintarPrecio);
  window.addEventListener("gr-auth", function () {
    pintarBoton();
    cargarMiembros();
  });
  pintarPrecio();
  cargarMiembros();
})();
