/* Concurso mensual. La página no lleva las respuestas.
   Con concursoPublicado en false no llama a Supabase y no hay modo local.
   El apodo es perfiles.nombre. El premio es el de quiz_premios: 20 €. */
(function () {
  var LIMITE_MS = 30000;
  var PAISES = [
    ["", "Prefiero no decirlo"],
    ["MX", "México"], ["US", "Estados Unidos"], ["CO", "Colombia"], ["PE", "Perú"],
    ["ES", "España"], ["AR", "Argentina"], ["VE", "Venezuela"], ["EC", "Ecuador"],
    ["DO", "República Dominicana"], ["CL", "Chile"], ["PY", "Paraguay"], ["UY", "Uruguay"],
    ["BO", "Bolivia"], ["GT", "Guatemala"], ["HN", "Honduras"], ["SV", "El Salvador"],
    ["NI", "Nicaragua"], ["CR", "Costa Rica"], ["PA", "Panamá"]
  ];
  var NOMBRE = {};
  var VETADAS = {
    puta: 1, puto: 1, mierda: 1, pendejo: 1, pendeja: 1, cabron: 1, cabrona: 1,
    maricon: 1, marica: 1, verga: 1, culero: 1, culera: 1, culo: 1, hdp: 1,
    hijueputa: 1, malparido: 1, malparida: 1, gonorrea: 1,
    boludo: 1, boluda: 1, pelotudo: 1, pelotuda: 1, huevon: 1, huevona: 1,
    cojudo: 1, cojuda: 1, cono: 1, polla: 1, zorra: 1, pinche: 1, idiota: 1,
    fuck: 1, perra: 1, joto: 1, cerote: 1, carajo: 1, imbecil: 1, subnormal: 1,
    mamaguevo: 1, pija: 1, follar: 1, joder: 1, shit: 1, bitch: 1,
    nazi: 1, nigger: 1, nigga: 1, hitler: 1, faggot: 1, asshole: 1, gilipollas: 1,
    porno: 1, viagra: 1
  };
  var COMPUESTAS = { hijodeputa: 1, hijaputa: 1, putamadre: 1, hijueputa: 1 };
  PAISES.forEach(function (p) { if (p[0]) NOMBRE[p[0]] = p[1]; });

  var root = document.body.getAttribute("data-root") || "";
  var fase = "inicio";
  var indice = 0;
  var total = 10;
  var aciertos = 0;
  var segundos = 0;
  var endsAt = 0;
  var timerId = 0;
  var avisoSeg = 0;
  var apodo = "";
  var esVecino = false;
  var publicada = false;
  var abierta = false;
  var partidaId = null;
  var relojListo = false;
  var cortada = false;
  var reinicioMs = 0;
  var cuentaId = 0;

  var hero = document.getElementById("concurso-hero");
  var inicio = document.getElementById("paso-inicio");
  var juego = document.getElementById("paso-juego");
  var fin = document.getElementById("paso-fin");
  var ranking = document.getElementById("ranking");
  var form = document.getElementById("concurso-form");
  var error = document.getElementById("concurso-error");
  var modo = document.getElementById("concurso-modo");
  var lista = document.getElementById("ranking-lista");
  var ganadoresBox = document.getElementById("ganadores-lista");
  var live = document.getElementById("concurso-live");
  var quien = document.getElementById("concurso-quien");
  var nota = document.getElementById("concurso-apodo-nota");
  var boton = document.getElementById("concurso-empezar");
  var reclamo = document.getElementById("concurso-reclamo");
  if (!inicio || !juego || !form) return;

  function decir(t) {
    if (live) live.textContent = t || "";
  }

  function euros() {
    var n = window.GR && GR.comunidad && Number(GR.comunidad.premioEuros);
    return n > 0 ? n : 20;
  }

  function escTexto(s) {
    return String(s == null ? "" : s);
  }

  function limpiar(s) {
    return String(s || "").normalize("NFKC")
      .replace(/[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
      .replace(/\p{Cf}/gu, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function plegar(s, volverU) {
    var t = s.toLowerCase()
      .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
      .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n")
      .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e")
      .replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t");
    if (volverU) t = t.replace(/v/g, "u");
    return t;
  }

  function revisa(plegado) {
    var partes = plegado.split(/\s+/);
    var i;
    var sq;
    for (i = 0; i < partes.length; i++) {
      if (VETADAS[partes[i].replace(/[._-]/g, "")]) return true;
    }
    sq = plegado.replace(/[^a-z0-9]/g, "");
    return !!(VETADAS[sq] || COMPUESTAS[sq]);
  }

  function apodoPermitido(t) {
    t = limpiar(t);
    if (t.length < 2 || t.length > 40) return false;
    if (t.indexOf("@") >= 0 || /\d{8,}/.test(t)) return false;
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ._-]{2,40}$/.test(t)) return false;
    return !revisa(plegar(t, false)) && !revisa(plegar(t, true));
  }

  function esPlaceholder(t) {
    return /^Vecino [0-9a-f]{4}$/i.test(limpiar(t));
  }

  function nube() {
    var c = (window.GR && GR.comunidad) || {};
    var url = String(c.supabaseUrl || "").replace(/\/$/, "");
    var key = String(c.supabaseAnonKey || "").trim();
    var oficial = /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
    var local = /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url);
    if (!oficial && !local) return null;
    if (!key) return null;
    if (oficial && !/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && !/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) return null;
    return { url: url, key: key };
  }

  function tokenDeSesion() {
    if (window.GRAuth && typeof GRAuth.token === "function") return GRAuth.token();
    return Promise.resolve("");
  }

  function pedir(path, opts) {
    var cfg = nube();
    if (!cfg) return Promise.resolve({ ok: false, status: 0, data: null, red: true });
    function enviar(token) {
      var headers = {
        apikey: cfg.key,
        Authorization: "Bearer " + (token || cfg.key),
        Accept: "application/json"
      };
      if (opts && opts.body) headers["Content-Type"] = "application/json";
      return fetch(cfg.url + path, {
        method: (opts && opts.method) || "GET",
        headers: headers,
        body: opts && opts.body ? JSON.stringify(opts.body) : undefined
      }).then(function (r) {
        return r.text().then(function (t) {
          var data = null;
          if (t) {
            try { data = JSON.parse(t); } catch (e) { data = null; }
          }
          return { ok: r.ok, status: r.status, data: data };
        });
      }).catch(function () {
        return { ok: false, status: 0, data: null, red: true };
      });
    }
    if (opts && opts.auth) return tokenDeSesion().then(enviar);
    return enviar("");
  }

  function textoError(res) {
    if (!res) return "No se pudo conectar. Inténtalo más tarde.";
    if (res.red) return "No se pudo conectar. Inténtalo más tarde.";
    if (res.status === 404 || (res.data && (res.data.code === "PGRST202" || res.data.code === "PGRST205"))) {
      return "El concurso no está disponible. Inténtalo más tarde.";
    }
    var msg = res.data && (res.data.message || res.data.error_description || res.data.hint);
    if (msg) return String(msg);
    return "No se pudo completar. Inténtalo más tarde.";
  }

  function partesMadrid(ms) {
    var o = {};
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Madrid",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
    return o;
  }

  function desfaseMadrid(ms) {
    var q = partesMadrid(ms);
    var comoUtc = Date.UTC(+q.year, +q.month - 1, +q.day, +q.hour, +q.minute, +q.second);
    return comoUtc - ms;
  }

  function proximoMes(ahora) {
    var p = partesMadrid(ahora);
    var y = +p.year;
    var m = +p.month;
    var ny = m === 12 ? y + 1 : y;
    var nm = m === 12 ? 1 : m + 1;
    var guess = Date.UTC(ny, nm - 1, 1, 0, 0, 0);
    var t = guess - desfaseMadrid(guess);
    return guess - desfaseMadrid(t);
  }

  function textoCuenta(ms) {
    var falta = Math.max(0, ms - Date.now());
    var dias = Math.floor(falta / 86400000);
    var horas = Math.floor((falta % 86400000) / 3600000);
    var min = Math.floor((falta % 3600000) / 60000);
    if (dias > 0) return "El ranking vuelve a cero en " + dias + " d " + horas + " h " + min + " min.";
    if (horas > 0) return "El ranking vuelve a cero en " + horas + " h " + min + " min.";
    return "El ranking vuelve a cero en " + min + " min.";
  }

  function pintarPremio(iso) {
    var premio = document.getElementById("concurso-premio");
    var cuenta = document.getElementById("concurso-cuenta");
    if (premio) premio.textContent = "Premio de este mes: " + euros() + " €";
    if (iso) {
      var t = Date.parse(iso);
      if (!isNaN(t)) reinicioMs = t;
    }
    if (!reinicioMs) reinicioMs = proximoMes(Date.now());
    if (cuenta) cuenta.textContent = textoCuenta(reinicioMs);
  }

  function arrancarCuenta() {
    pintarPremio();
    if (cuentaId) clearInterval(cuentaId);
    cuentaId = setInterval(function () { pintarPremio(); }, 30000);
  }

  function formatoSeg(n) {
    var v = Number(n);
    if (!isFinite(v)) v = 0;
    return v.toLocaleString("es", { minimumFractionDigits: 0, maximumFractionDigits: 1 }) + " s";
  }

  function pintarRanking(filas) {
    if (!lista) return;
    lista.textContent = "";
    var top = (filas || []).filter(function (f) { return f && Number(f.aciertos) > 0; }).slice(0, 20);
    if (!top.length) {
      var vacio = document.createElement("p");
      vacio.textContent = publicada && abierta
        ? "Todavía no hay marcas este mes."
        : "El concurso todavía no está abierto.";
      lista.appendChild(vacio);
      return;
    }
    var ol = document.createElement("ol");
    top.forEach(function (f, i) {
      var li = document.createElement("li");
      if (fase === "fin" && apodo && f.apodo === apodo && Number(f.aciertos) === aciertos) {
        li.className = "concurso-yo";
      }
      var pos = document.createElement("span");
      pos.className = "concurso-pos";
      pos.textContent = String(i + 1);
      var caja = document.createElement("div");
      var nom = document.createElement("p");
      nom.textContent = escTexto(f.apodo);
      var det = document.createElement("p");
      det.className = "fine";
      var paisTxt = f.pais && NOMBRE[f.pais] ? NOMBRE[f.pais] + " · " : "";
      det.textContent = paisTxt + f.aciertos + " de 10 · " + formatoSeg(f.segundos);
      caja.appendChild(nom);
      caja.appendChild(det);
      li.appendChild(pos);
      li.appendChild(caja);
      ol.appendChild(li);
    });
    lista.appendChild(ol);
  }

  function pintarGanadores(filas) {
    if (!ganadoresBox) return;
    ganadoresBox.textContent = "";
    var rows = filas || [];
    if (!rows.length) {
      var vacio = document.createElement("p");
      vacio.textContent = "Cuando cierre un mes, aquí queda el apodo del ganador.";
      ganadoresBox.appendChild(vacio);
      return;
    }
    var ol = document.createElement("ol");
    rows.forEach(function (f) {
      var li = document.createElement("li");
      var pos = document.createElement("span");
      pos.className = "concurso-pos";
      pos.textContent = escTexto(f.periodo);
      var nom = document.createElement("p");
      nom.textContent = escTexto(f.apodo);
      li.appendChild(pos);
      li.appendChild(nom);
      ol.appendChild(li);
    });
    ganadoresBox.appendChild(ol);
  }

  function pintarReclamo(mi) {
    if (!reclamo) return;
    var txt = document.getElementById("reclamo-txt");
    if (!mi || !mi.periodo || (mi.estado !== "pendiente" && mi.estado !== "reclamado")) {
      reclamo.hidden = true;
      return;
    }
    reclamo.hidden = false;
    if (txt) {
      txt.textContent = mi.estado === "reclamado"
        ? "Ya recibimos tus datos de " + mi.periodo + ". Te escribimos para confirmar el pago de " + euros() + " €."
        : "Ganaste los " + euros() + " € de " + mi.periodo + ". Elige PayPal o Bizum. No se publica.";
    }
    var formPago = document.getElementById("reclamo-form");
    if (formPago) formPago.hidden = mi.estado !== "pendiente";
  }

  function textoModo() {
    if (!publicada) return "El concurso todavía no está abierto.";
    if (!abierta) return "El concurso no está disponible. Inténtalo más tarde.";
    return "Ranking de este mes. Gana quien más acierta; si empatan, el menor tiempo del servidor.";
  }

  function aplicarEstado(data) {
    abierta = !!(data && data.abierto);
    if (data && data.premio_euros) {
      if (window.GR && GR.comunidad) GR.comunidad.premioEuros = Number(data.premio_euros) || 20;
    }
    pintarPremio(data && data.reinicio);
    pintarRanking(data && data.ranking);
    pintarGanadores(data && data.ganadores);
    pintarReclamo(data && data.mi_premio);
    if (modo) modo.textContent = textoModo();
  }

  function cargarEstado() {
    if (!publicada) {
      abierta = false;
      pintarPremio();
      pintarRanking([]);
      pintarGanadores([]);
      pintarReclamo(null);
      if (modo) modo.textContent = textoModo();
      return Promise.resolve();
    }
    return pedir("/rest/v1/rpc/concurso_estado", { method: "POST", body: {}, auth: true }).then(function (res) {
      if (!res.ok || !res.data) {
        abierta = false;
        if (modo) modo.textContent = textoError(res);
        pintarRanking([]);
        return;
      }
      aplicarEstado(res.data);
    });
  }

  function usuario() {
    try {
      return window.GRAuth && typeof GRAuth.usuario === "function" ? GRAuth.usuario() : null;
    } catch (e) {
      return null;
    }
  }

  function pintarIdentidad() {
    var u = usuario();
    var sel = document.getElementById("concurso-pais");
    if (!publicada) {
      if (quien) quien.textContent = "El concurso todavía no está abierto.";
      if (nota) nota.hidden = true;
      if (boton) boton.textContent = "Empezar";
      if (sel) sel.disabled = true;
      return;
    }
    if (!u) {
      apodo = "";
      esVecino = false;
      if (quien) quien.textContent = "Para jugar hace falta la cuenta gratis del sitio. El ranking usa el apodo de esa cuenta.";
      if (nota) nota.hidden = true;
      if (boton) boton.textContent = "Entrar para jugar";
      if (sel) sel.disabled = true;
      return;
    }
    if (sel) sel.disabled = false;
    pedir("/rest/v1/perfiles?id=eq." + encodeURIComponent(u.id) + "&select=nombre", { auth: true }).then(function (res) {
      var fila = res.ok && Array.isArray(res.data) ? res.data[0] : null;
      apodo = fila && fila.nombre ? limpiar(fila.nombre) : "";
      esVecino = !apodo || esPlaceholder(apodo);
      if (quien) {
        quien.textContent = apodo
          ? "Juegas como " + apodo + "."
          : "No pudimos leer el apodo de tu cuenta.";
      }
      if (nota) {
        nota.hidden = false;
        nota.textContent = "";
        nota.appendChild(document.createTextNode(
          esVecino
            ? "Elige un apodo antes de jugar. "
            : "Para cambiar el apodo, entra en "
        ));
        var a = document.createElement("a");
        a.href = root + "cuenta.html";
        a.textContent = "Mi cuenta";
        nota.appendChild(a);
        nota.appendChild(document.createTextNode("."));
      }
      if (boton) boton.textContent = esVecino ? "Elegir apodo" : "Empezar";
    });
  }

  function alinear(el) {
    if (!el || !el.getBoundingClientRect) return;
    var head = document.querySelector("header.top");
    var alto = head ? head.getBoundingClientRect().height : 140;
    var y = el.getBoundingClientRect().top + window.scrollY - alto - 18;
    window.scrollTo(0, Math.max(0, y));
  }

  function pantalla(id) {
    if (hero) hero.hidden = id !== "inicio";
    if (modo) modo.hidden = id === "juego";
    inicio.hidden = id !== "inicio";
    juego.hidden = id !== "juego";
    fin.hidden = id !== "fin";
    if (ranking) ranking.hidden = id === "juego";
    var g = document.getElementById("concurso-ganadores");
    var b = document.getElementById("concurso-bases");
    if (g) g.hidden = id === "juego";
    if (b) b.hidden = id === "juego";
    fase = id;
  }

  function pararReloj() {
    if (timerId) clearInterval(timerId);
    timerId = 0;
  }

  function quedaMs() {
    return Math.max(0, endsAt - performance.now());
  }

  function quedaSeg() {
    var left = quedaMs();
    if (left <= 0) return 0;
    return Math.ceil(left / 1000);
  }

  function pintarReloj() {
    var n = quedaSeg();
    var num = document.getElementById("reloj-num");
    var txt = document.getElementById("reloj-txt");
    var barra = document.getElementById("reloj-barra");
    var box = document.getElementById("reloj");
    if (num) num.textContent = String(n);
    if (txt) txt.textContent = n <= 10 ? "Últimos " + n + " s" : "Quedan " + n + " s";
    if (barra) barra.style.width = Math.round(n / 30 * 100) + "%";
    if (box) {
      box.classList.toggle("urgente", n <= 10);
      box.setAttribute("aria-valuenow", String(n));
    }
    if ((n === 10 || n === 5) && n !== avisoSeg) {
      avisoSeg = n;
      decir("Quedan " + n + " segundos.");
    }
  }

  function pintarPregunta(q, n) {
    var titulo = document.getElementById("preg-titulo");
    var paso = document.getElementById("paso-txt");
    var tema = document.getElementById("preg-tema");
    var ops = document.getElementById("preg-ops");
    var fb = document.getElementById("preg-fb");
    var exp = document.getElementById("preg-exp");
    var fuente = document.getElementById("preg-fuente");
    var next = document.getElementById("preg-siguiente");
    indice = n;
    if (paso) paso.textContent = "Pregunta " + n + " de " + total;
    if (tema) tema.textContent = q.tema || "";
    if (titulo) titulo.textContent = q.pregunta || "";
    if (ops) {
      ops.textContent = "";
      (q.opciones || []).forEach(function (op, i) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn sec concurso-opcion";
        b.disabled = true;
        b.textContent = String(op);
        b.addEventListener("click", function () { responder(i); });
        ops.appendChild(b);
      });
    }
    if (fb) {
      fb.hidden = true;
      fb.textContent = "";
      fb.classList.remove("is-ok", "is-bad");
    }
    if (exp) { exp.hidden = true; exp.textContent = ""; }
    if (fuente) { fuente.hidden = true; fuente.textContent = ""; }
    if (next) next.hidden = true;
    relojListo = false;
    cortada = false;
    pararReloj();
    alinear(paso || juego);
    if (titulo) {
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    }
  }

  function bloquearOpciones() {
    document.querySelectorAll("#preg-ops .concurso-opcion").forEach(function (b) {
      b.disabled = true;
    });
  }

  function arrancarReloj() {
    if (fase !== "juego" || cortada) return;
    relojListo = true;
    avisoSeg = 0;
    endsAt = performance.now() + LIMITE_MS;
    pintarReloj();
    pararReloj();
    document.querySelectorAll("#preg-ops .concurso-opcion").forEach(function (b) {
      b.disabled = false;
    });
    timerId = setInterval(function () {
      if (fase !== "juego") return;
      if (quedaMs() <= 0) {
        pintarReloj();
        bloquearOpciones();
        responder(-1);
        return;
      }
      pintarReloj();
    }, 200);
  }

  function marcarOpcion(botonEl, buena, texto) {
    botonEl.classList.add(buena ? "is-ok" : "is-bad");
    botonEl.appendChild(document.createTextNode(" "));
    var marca = document.createElement("span");
    marca.className = "concurso-mark";
    marca.textContent = texto;
    botonEl.appendChild(marca);
  }

  function textoCierre(r) {
    if (r.timeout) return "Se acabó el tiempo. Incorrecto.";
    if (r.muy_rapido && r.acertada) return "Correcto, pero hace falta al menos 1 segundo para que cuente.";
    if (!r.ok) return "Incorrecto.";
    return "Correcto. Llevas " + r.aciertos + " de 10.";
  }

  function mostrarCierre(elegida, r) {
    var fb = document.getElementById("preg-fb");
    var exp = document.getElementById("preg-exp");
    var fuente = document.getElementById("preg-fuente");
    var next = document.getElementById("preg-siguiente");
    var botones = document.querySelectorAll("#preg-ops .concurso-opcion");
    var frase = textoCierre(r);
    botones.forEach(function (b, k) {
      b.disabled = true;
      if (k === r.indice_correcto) marcarOpcion(b, true, "Correcta");
      else if (k === elegida) marcarOpcion(b, false, "Incorrecta");
    });
    if (fb) {
      fb.hidden = false;
      fb.classList.remove("is-ok", "is-bad");
      fb.classList.add(r.ok ? "is-ok" : "is-bad");
      fb.textContent = frase;
    }
    if (exp) {
      exp.hidden = false;
      exp.textContent = r.explicacion || "";
    }
    if (fuente && r.fuente) {
      fuente.hidden = false;
      fuente.textContent = "Fuente: " + r.fuente;
    }
    if (next) {
      next.hidden = false;
      next.textContent = r.acabada ? "Ver resultado" : "Siguiente pregunta";
      next.focus();
    }
    aciertos = Number(r.aciertos) || 0;
    segundos = Number(r.segundos) || 0;
    decir(frase);
  }

  function responder(i) {
    if (fase !== "juego" || cortada || !relojListo || !partidaId) return;
    if (i >= 0 && quedaMs() <= 0) i = -1;
    relojListo = false;
    pararReloj();
    bloquearOpciones();
    var fb = document.getElementById("preg-fb");
    if (fb) {
      fb.hidden = false;
      fb.classList.remove("is-ok", "is-bad");
      fb.textContent = "Calificando…";
    }
    pedir("/rest/v1/rpc/concurso_responder", {
      method: "POST",
      auth: true,
      body: { p_partida: partidaId, p_opcion: i }
    }).then(function (res) {
      if (!res.ok || !res.data || res.data.explicacion == null) {
        cortada = true;
        if (error) error.textContent = textoError(res);
        if (fb) {
          fb.classList.add("is-bad");
          fb.textContent = textoError(res);
        }
        return;
      }
      mostrarCierre(i, res.data);
    });
  }

  function mostrarResultado() {
    pantalla("fin");
    var puntos = document.getElementById("fin-puntos");
    var detalle = document.getElementById("fin-detalle");
    var wa = document.getElementById("fin-wa");
    var titulo = document.getElementById("fin-titulo");
    if (titulo) titulo.textContent = "Tu marca";
    if (puntos) puntos.textContent = aciertos + " de 10";
    if (detalle) {
      detalle.textContent = "Tiempo del servidor: " + formatoSeg(segundos) + ". El premio del mes lo gana quien más acierta; si empatan, el menor tiempo.";
    }
    if (wa) {
      var texto = "Jugué el concurso de Granja Rentable: " + aciertos + " de 10 en " + formatoSeg(segundos) + ".";
      wa.href = "https://wa.me/?text=" + encodeURIComponent(texto);
    }
    cargarEstado();
    alinear(document.getElementById("fin-titulo") || fin);
  }

  function abrirSiguiente() {
    pedir("/rest/v1/rpc/concurso_abrir", {
      method: "POST",
      auth: true,
      body: { p_partida: partidaId }
    }).then(function (res) {
      if (!res.ok || !res.data || !res.data.pregunta) {
        cortada = true;
        pantalla("inicio");
        if (error) error.textContent = textoError(res);
        return;
      }
      pintarPregunta(res.data.pregunta, Number(res.data.indice) || indice + 1);
      arrancarReloj();
    });
  }

  function empezar(ev) {
    ev.preventDefault();
    if (error) error.textContent = "";
    if (!publicada) {
      if (error) error.textContent = "El concurso todavía no está abierto.";
      return;
    }
    var u = usuario();
    if (!u) {
      if (window.GRAuth && typeof GRAuth.abrir === "function") GRAuth.abrir("entrar");
      return;
    }
    if (esVecino || esPlaceholder(apodo) || !apodoPermitido(apodo)) {
      if (window.GRAuth && typeof GRAuth.abrir === "function") GRAuth.abrir("apodo");
      if (error) error.textContent = "Elige un apodo en Mi cuenta antes de jugar.";
      return;
    }
    if (!abierta) {
      if (error) error.textContent = "El concurso no está disponible. Inténtalo más tarde.";
      return;
    }
    var sel = document.getElementById("concurso-pais");
    var pais = sel ? sel.value : "";
    if (boton) boton.disabled = true;
    pedir("/rest/v1/rpc/concurso_empezar", {
      method: "POST",
      auth: true,
      body: { p_pais: pais }
    }).then(function (res) {
      if (boton) boton.disabled = false;
      if (!res.ok || !res.data || !res.data.pregunta || !res.data.partida) {
        if (error) error.textContent = textoError(res);
        return;
      }
      partidaId = res.data.partida;
      total = Number(res.data.total) || 10;
      aciertos = 0;
      segundos = 0;
      cortada = false;
      if (res.data.premio_euros && window.GR && GR.comunidad) {
        GR.comunidad.premioEuros = Number(res.data.premio_euros) || 20;
      }
      pintarPremio(res.data.reinicio);
      pantalla("juego");
      pintarPregunta(res.data.pregunta, Number(res.data.indice) || 1);
      arrancarReloj();
    });
  }

  function prepararPais() {
    var sel = document.getElementById("concurso-pais");
    if (!sel || sel.options.length) return;
    PAISES.forEach(function (p) {
      var o = document.createElement("option");
      o.value = p[0];
      o.textContent = p[1];
      sel.appendChild(o);
    });
    sel.value = "";
  }

  publicada = !!(window.GR && GR.comunidad && GR.comunidad.concursoPublicado === true);
  prepararPais();
  arrancarCuenta();
  pantalla("inicio");
  pintarIdentidad();
  cargarEstado();

  form.addEventListener("submit", empezar);
  var siguiente = document.getElementById("preg-siguiente");
  if (siguiente) {
    siguiente.addEventListener("click", function () {
      if (siguiente.textContent.indexOf("resultado") >= 0) {
        mostrarResultado();
        return;
      }
      abrirSiguiente();
    });
  }
  var otra = document.getElementById("fin-otra");
  if (otra) {
    otra.addEventListener("click", function () {
      partidaId = null;
      pantalla("inicio");
      pintarIdentidad();
      cargarEstado();
    });
  }
  var formPago = document.getElementById("reclamo-form");
  if (formPago) {
    formPago.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var err = document.getElementById("reclamo-error");
      var metodo = document.getElementById("reclamo-metodo");
      var dato = document.getElementById("reclamo-dato");
      if (err) err.textContent = "";
      pedir("/rest/v1/rpc/concurso_estado", { method: "POST", body: {}, auth: true }).then(function (estado) {
        var mi = estado.ok && estado.data && estado.data.mi_premio;
        if (!mi || mi.estado !== "pendiente") {
          if (err) err.textContent = "No hay un premio pendiente a tu nombre.";
          return null;
        }
        return pedir("/rest/v1/rpc/concurso_reclamar", {
          method: "POST",
          auth: true,
          body: {
            p_periodo: mi.periodo,
            p_metodo: metodo ? metodo.value : "",
            p_dato: dato ? dato.value : ""
          }
        });
      }).then(function (res) {
        if (!res) return;
        if (!res.ok) {
          if (err) err.textContent = textoError(res);
          return;
        }
        if (dato) dato.value = "";
        cargarEstado();
      });
    });
  }
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState !== "visible") return;
    if (fase === "juego" && relojListo && quedaMs() <= 0) responder(-1);
  });
  window.addEventListener("gr-auth", function () {
    if (fase === "inicio") {
      pintarIdentidad();
      cargarEstado();
    }
  });
})();
