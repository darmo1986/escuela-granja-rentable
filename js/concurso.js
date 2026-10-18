/* Ronda de 10 preguntas. El apodo lo escribe quien juega: no sale de un correo.
   Con concursoPublicado en false, la página practica en este navegador y no llama a Supabase.
   Cuando Pablo publica el SQL, el servidor califica: esta página no inserta el puntaje. */
(function () {
  var RONDA = 10;
  var LIMITE_MS = 30000;
  var CLAVE = "gr_concurso_partidas";
  var PAISES = [
    ["", "Prefiero no decirlo"],
    ["MX", "México"], ["US", "Estados Unidos"], ["CO", "Colombia"], ["PE", "Perú"],
    ["ES", "España"], ["AR", "Argentina"], ["VE", "Venezuela"], ["EC", "Ecuador"],
    ["DO", "República Dominicana"], ["CL", "Chile"], ["PY", "Paraguay"], ["UY", "Uruguay"],
    ["BO", "Bolivia"], ["GT", "Guatemala"], ["HN", "Honduras"], ["SV", "El Salvador"],
    ["NI", "Nicaragua"], ["CR", "Costa Rica"], ["PA", "Panamá"]
  ];
  var NOMBRE = {};
  var RAICES = ["put", "mierd", "pend", "cabr", "maric", "nazi", "nigg", "hitler", "faggot", "asshole", "gilipoll", "verga", "culer", "ching", "hdp", "malparid", "gonorre", "conch", "bolud", "pelotud", "huevon", "cojud", "viagra", "casino", "porno", "cripto"];
  PAISES.forEach(function (p) { if (p[0]) NOMBRE[p[0]] = p[1]; });

  var root = document.body.getAttribute("data-root") || "";
  var banco = [];
  var ronda = [];
  var indice = 0;
  var fase = "inicio";
  var aciertos = 0;
  var puntaje = 0;
  var bonus = 0;
  var segundos = 0;
  var endsAt = 0;
  var timerId = 0;
  var avisoSeg = 0;
  var apodo = "";
  var pais = "";
  var estadoNube = "local";
  var publicada = false;
  var sonda = null;
  var partidaId = null;
  var enServidor = false;
  var relojListo = false;
  var cortada = false;

  var hero = document.getElementById("concurso-hero");
  var inicio = document.getElementById("paso-inicio");
  var juego = document.getElementById("paso-juego");
  var fin = document.getElementById("paso-fin");
  var ranking = document.getElementById("ranking");
  var form = document.getElementById("concurso-form");
  var error = document.getElementById("concurso-error");
  var modo = document.getElementById("concurso-modo");
  var lista = document.getElementById("ranking-lista");
  var live = document.getElementById("concurso-live");
  if (!inicio || !juego || !form) return;

  function decir(t) {
    if (live) live.textContent = t || "";
  }

  function puntosDe(ok, ms) {
    if (!ok) return { puntos: 0, base: 0, rapido: 0 };
    var usado = ms < 0 ? 0 : ms;
    if (usado > LIMITE_MS) usado = LIMITE_MS;
    var rapido = Math.round(5 * (1 - usado / LIMITE_MS));
    return { puntos: 10 + rapido, base: 10, rapido: rapido };
  }

  function barajar(lista) {
    var a = lista.slice();
    var i;
    for (i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function normaliza(t) {
    return String(t || "").toLowerCase()
      .replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i")
      .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n")
      .replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a")
      .replace(/5/g, "s").replace(/7/g, "t").replace(/@/g, "a")
      .replace(/[._\-\s]/g, "");
  }

  function prohibido(t) {
    var n = normaliza(t);
    var i;
    for (i = 0; i < RAICES.length; i++) {
      if (n.indexOf(RAICES[i]) >= 0) return true;
    }
    return false;
  }

  function apodoValido(t) {
    t = String(t || "").replace(/\s+/g, " ").trim();
    if (t.length < 2 || t.length > 40) return "El apodo necesita entre 2 y 40 caracteres.";
    if (t.indexOf("@") >= 0 || /\d{8,}/.test(t)) return "Sin correo ni teléfono: solo un apodo.";
    if (prohibido(t)) return "Ese apodo no se puede usar. Elige otro, sin insultos.";
    return "";
  }

  function apodoDeCuenta() {
    try {
      var u = window.GRAuth && typeof GRAuth.usuario === "function" ? GRAuth.usuario() : null;
      if (!u || !u.nombre) return "";
      return String(u.nombre).replace(/\s+/g, " ").trim();
    } catch (e) {
      return "";
    }
  }

  function aplicarApodoCuenta() {
    var campo = document.getElementById("concurso-apodo");
    var nota = document.getElementById("concurso-apodo-nota");
    var nombre = apodoDeCuenta();
    if (!campo || !nombre) {
      if (nota) nota.hidden = true;
      return;
    }
    campo.value = nombre;
    if (nota) nota.hidden = false;
  }

  function mejorMarca(a, b) {
    if (!a) return b;
    if (!b) return a;
    if (b.puntaje !== a.puntaje) return b.puntaje > a.puntaje ? b : a;
    if (a.segundos !== b.segundos) return a.segundos < b.segundos ? a : b;
    return a;
  }

  function compactar(filas) {
    var mapa = {};
    (filas || []).forEach(function (f) {
      if (!f || !f.apodo || !(Number(f.puntaje) > 0)) return;
      var k = String(f.apodo).toLowerCase();
      mapa[k] = mejorMarca(mapa[k], f);
    });
    return Object.keys(mapa).map(function (k) { return mapa[k]; });
  }

  function leerLocal() {
    try {
      var raw = JSON.parse(localStorage.getItem(CLAVE) || "[]");
      return compactar(Array.isArray(raw) ? raw : []);
    } catch (e) {
      return [];
    }
  }

  function guardarLocal(fila) {
    var marcas = ordenar(compactar(leerLocal().concat(fila ? [fila] : [])));
    if (marcas.length > 50) marcas = marcas.slice(0, 50);
    try { localStorage.setItem(CLAVE, JSON.stringify(marcas)); } catch (e) {}
  }

  function ordenar(filas) {
    return filas.slice().sort(function (a, b) {
      if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje;
      if (a.segundos !== b.segundos) return a.segundos - b.segundos;
      return String(a.creado || "").localeCompare(String(b.creado || ""));
    });
  }

  function nube() {
    var c = (window.GR && GR.comunidad) || {};
    var url = String(c.supabaseUrl || "").replace(/\/$/, "");
    var key = String(c.supabaseAnonKey || "").trim();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) return null;
    if (!key || /tu_clave|placeholder|ejemplo/i.test(key)) return null;
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && !/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) return null;
    return { url: url, key: key };
  }

  function pedir(path, opts) {
    var cfg = nube();
    if (!cfg) return Promise.resolve({ ok: false, status: 0, data: null, red: true });
    var headers = {
      apikey: cfg.key,
      Authorization: "Bearer " + cfg.key,
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

  function textoError(res) {
    if (!res || !res.data) return "";
    return String(res.data.message || res.data.error_description || res.data.hint || "");
  }

  function sinTabla(res) {
    if (!res || res.red) return false;
    if (res.status === 404) return true;
    var code = res.data && res.data.code;
    var msg = textoError(res);
    return code === "PGRST205" || code === "PGRST202" || /schema cache|does not exist|Could not find/i.test(msg);
  }

  function textoModo() {
    if (estadoNube === "limite") return "Hoy ya hay varias marcas con ese apodo. Esta quedó en este navegador.";
    if (estadoNube === "general") return "Ranking de quienes jugaron. Se ve el apodo y, si lo indicaron, el país.";
    if (estadoNube === "red") return "No se pudo leer el ranking general. Ves las mejores marcas de este navegador.";
    return "Por ahora el ranking general no está publicado. Ves las mejores marcas de este navegador.";
  }

  function pintarRanking(filas) {
    if (modo && !modo.hidden) modo.textContent = textoModo();
    else if (modo) modo.textContent = textoModo();
    if (!lista) return;
    lista.textContent = "";
    var top = ordenar(filas.filter(function (f) { return f && f.puntaje > 0; })).slice(0, 20);
    if (!top.length) {
      var vacio = document.createElement("p");
      vacio.textContent = "Todavía no hay marcas. Juega una ronda para abrir la lista.";
      lista.appendChild(vacio);
      return;
    }
    var ol = document.createElement("ol");
    top.forEach(function (f, i) {
      var li = document.createElement("li");
      if (fase === "fin" && apodo && f.apodo === apodo && f.puntaje === puntaje && f.segundos === segundos) {
        li.className = "concurso-yo";
      }
      var pos = document.createElement("span");
      pos.className = "concurso-pos";
      pos.textContent = String(i + 1);
      var caja = document.createElement("div");
      var nom = document.createElement("p");
      nom.textContent = f.apodo;
      var det = document.createElement("p");
      det.className = "fine";
      var paisTxt = f.pais && NOMBRE[f.pais] ? NOMBRE[f.pais] + " · " : "";
      det.textContent = paisTxt + f.puntaje + " puntos · " + f.aciertos + " de 10";
      caja.appendChild(nom);
      caja.appendChild(det);
      li.appendChild(pos);
      li.appendChild(caja);
      ol.appendChild(li);
    });
    lista.appendChild(ol);
  }

  function mostrarLocal() {
    pintarRanking(leerLocal());
  }

  function asegurar() {
    if (sonda) return sonda;
    var publicado = window.GR && GR.comunidad && GR.comunidad.concursoPublicado === true;
    if (!publicado) {
      estadoNube = "local";
      mostrarLocal();
      sonda = Promise.resolve("no");
      return sonda;
    }
    var cfg = nube();
    if (!cfg) {
      estadoNube = "red";
      mostrarLocal();
      sonda = Promise.resolve("red");
      return sonda;
    }
    sonda = pedir("/rest/v1/concurso_partidas?select=apodo,pais,puntaje,aciertos,segundos,creado&order=puntaje.desc,segundos.asc&limit=20").then(function (res) {
      if (sinTabla(res)) {
        estadoNube = "local";
        mostrarLocal();
        return "no";
      }
      if (!res.ok || !Array.isArray(res.data)) {
        estadoNube = "red";
        mostrarLocal();
        return "red";
      }
      estadoNube = "general";
      pintarRanking(res.data.map(function (f) {
        return {
          apodo: f.apodo,
          pais: f.pais || "",
          puntaje: f.puntaje,
          aciertos: f.aciertos,
          segundos: f.segundos,
          creado: f.creado
        };
      }));
      return "si";
    });
    return sonda;
  }

  function pantalla(id) {
    if (hero) hero.hidden = id !== "inicio";
    if (modo) modo.hidden = id === "juego";
    inicio.hidden = id !== "inicio";
    juego.hidden = id !== "juego";
    fin.hidden = id !== "fin";
    if (ranking) ranking.hidden = id === "juego";
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

  function preguntaActual() {
    return ronda[indice];
  }

  function pintarPregunta() {
    var q = preguntaActual();
    var titulo = document.getElementById("preg-titulo");
    var paso = document.getElementById("paso-txt");
    var tema = document.getElementById("preg-tema");
    var ops = document.getElementById("preg-ops");
    var fb = document.getElementById("preg-fb");
    var exp = document.getElementById("preg-exp");
    var fuente = document.getElementById("preg-fuente");
    var next = document.getElementById("preg-siguiente");
    if (paso) paso.textContent = "Pregunta " + (indice + 1) + " de " + ronda.length;
    if (tema) tema.textContent = q.tema;
    if (titulo) titulo.textContent = q.pregunta;
    if (ops) {
      ops.textContent = "";
      q.ops.forEach(function (op, i) {
        var b = document.createElement("button");
      b.type = "button";
      b.className = "btn sec concurso-opcion";
      b.disabled = true;
      b.textContent = op.t;
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
    pararReloj();
    if (juego && juego.scrollIntoView) juego.scrollIntoView({ block: "start" });
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
    var q = preguntaActual();
    if (!q || q.cerrada) return;
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

  function marcarOpcion(boton, buena, texto) {
    boton.classList.add(buena ? "is-ok" : "is-bad");
    boton.appendChild(document.createTextNode(" "));
    var marca = document.createElement("span");
    marca.className = "concurso-mark";
    marca.textContent = texto;
    boton.appendChild(marca);
  }

  function mostrarCierre(i, ok, puntosTxt, explicacion, fuenteTxt, indiceCorrecto) {
    var fb = document.getElementById("preg-fb");
    var exp = document.getElementById("preg-exp");
    var fuente = document.getElementById("preg-fuente");
    var next = document.getElementById("preg-siguiente");
    var botones = document.querySelectorAll("#preg-ops .concurso-opcion");
    botones.forEach(function (b, k) {
      b.disabled = true;
      if (k === indiceCorrecto) marcarOpcion(b, true, "Correcta");
      else if (k === i) marcarOpcion(b, false, "Incorrecta");
    });
    if (fb) {
      fb.hidden = false;
      fb.classList.remove("is-ok", "is-bad");
      fb.classList.add(ok ? "is-ok" : "is-bad");
      fb.textContent = puntosTxt;
    }
    if (exp) {
      exp.hidden = false;
      exp.textContent = explicacion || "";
    }
    if (fuente && fuenteTxt) {
      fuente.hidden = false;
      fuente.textContent = "Fuente: " + fuenteTxt;
    }
    if (next && !cortada) {
      next.hidden = false;
      next.textContent = indice + 1 >= ronda.length ? "Ver resultado" : "Siguiente pregunta";
      next.focus();
    }
    decir(puntosTxt + " " + (explicacion || ""));
  }

  function textoPuntos(i, ok, muyRapido, p) {
    if (i < 0) return "Se acabó el tiempo. Incorrecto. Sumas 0.";
    if (muyRapido) return "Correcto, pero hace falta al menos 1 segundo para sumar. Sumas 0.";
    if (!ok) return "Incorrecto. Sumas 0.";
    var extra = p.rapido ? " y " + p.rapido + " por rapidez" : "";
    return "Correcto. Sumas " + p.puntos + " puntos (" + p.base + " del acierto" + extra + ").";
  }

  function responder(i) {
    if (fase !== "juego" || cortada) return;
    var q = preguntaActual();
    if (!q || q.cerrada || !relojListo) return;
    if (i >= 0 && quedaMs() <= 0) i = -1;
    q.cerrada = true;
    relojListo = false;
    pararReloj();
    bloquearOpciones();
    if (enServidor) {
      responderServidor(i);
      return;
    }
    var usado = i < 0 ? LIMITE_MS : Math.min(LIMITE_MS, Math.max(0, Math.round(LIMITE_MS - quedaMs())));
    var elegida = i >= 0 && q.ops[i] && q.ops[i].ok;
    var muyRapido = elegida && usado < 1000;
    var suma = elegida && !muyRapido;
    var p = suma ? puntosDe(true, usado) : { puntos: 0, base: 0, rapido: 0 };
    var segUsado = i < 0 ? 30 : Math.max(1, Math.min(30, Math.ceil(usado / 1000)));
    if (suma) aciertos += 1;
    puntaje += p.puntos;
    bonus += p.rapido || 0;
    segundos += segUsado;
    var bueno = -1;
    q.ops.forEach(function (op, k) { if (op.ok) bueno = k; });
    mostrarCierre(i, elegida, textoPuntos(i, suma, muyRapido, p), q.explicacion, q.fuente, bueno);
  }

  function responderServidor(i) {
    var fb = document.getElementById("preg-fb");
    if (fb) {
      fb.hidden = false;
      fb.classList.remove("is-ok", "is-bad");
      fb.textContent = "Calificando…";
    }
    pedir("/rest/v1/rpc/concurso_responder", {
      method: "POST",
      body: { p_partida: partidaId, p_opcion: i }
    }).then(function (res) {
      if (!res.ok || !res.data) {
        cortarPartida("No se pudo calificar esta pregunta. Recarga la página e inténtalo de nuevo.");
        return;
      }
      var r = res.data;
      var suma = !!r.ok;
      var muyRapido = !!r.muy_rapido && !!r.acertada;
      var acertada = !!r.acertada && !r.timeout;
      var elegido = r.timeout ? -1 : i;
      var bueno = (r.indice_correcto === null || r.indice_correcto === undefined) ? -1 : Number(r.indice_correcto);
      puntaje = Number(r.puntaje) || 0;
      aciertos = Number(r.aciertos) || 0;
      segundos = Number(r.segundos) || 0;
      bonus += Number(r.rapido) || 0;
      var q = preguntaActual();
      if (q) {
        q.explicacion = r.explicacion || "";
        q.fuente = r.fuente || "";
      }
      mostrarCierre(
        elegido,
        acertada,
        textoPuntos(elegido, suma, muyRapido, { puntos: r.puntos, base: r.base, rapido: r.rapido }),
        r.explicacion,
        r.fuente,
        bueno
      );
    });
  }

  function cortarPartida(mensaje) {
    cortada = true;
    enServidor = false;
    pararReloj();
    relojListo = false;
    bloquearOpciones();
    var fb = document.getElementById("preg-fb");
    if (fb) {
      fb.hidden = false;
      fb.classList.remove("is-ok");
      fb.classList.add("is-bad");
      fb.textContent = mensaje;
    }
    var next = document.getElementById("preg-siguiente");
    if (next) {
      next.hidden = false;
      next.textContent = "Volver al inicio";
    }
  }

  function filaResultado() {
    return {
      apodo: apodo,
      pais: pais || "",
      puntaje: puntaje,
      aciertos: aciertos,
      segundos: segundos,
      creado: new Date().toISOString()
    };
  }

  function publicar(fila) {
    if (publicada) return;
    publicada = true;
    guardarLocal(fila);
    if (!enServidor) {
      mostrarLocal();
      return;
    }
    sonda = null;
    estadoNube = "general";
    asegurar();
  }

  function pintarFin() {
    pantalla("fin");
    var h = document.getElementById("fin-titulo");
    var pts = document.getElementById("fin-puntos");
    var det = document.getElementById("fin-detalle");
    var wa = document.getElementById("fin-wa");
    if (pts) pts.textContent = String(puntaje);
    if (det) {
      det.textContent = aciertos + " de " + ronda.length + " aciertos. Bonus por rapidez: " + bonus + ". Tiempo usado: " + segundos + " s. Jugaste como " + apodo + ".";
    }
    if (wa) {
      var sitio = (window.GR && GR.siteUrl ? GR.siteUrl : "https://granjarentable.com").replace(/\/$/, "");
      var texto = "En el concurso de avicultura de Granja Rentable hice " + aciertos + " de " + ronda.length + " y " + puntaje + " puntos. ¿Lo superas? " + sitio + "/concurso.html";
      wa.href = "https://wa.me/?text=" + encodeURIComponent(texto);
    }
    publicar(filaResultado());
    if (h) {
      h.tabIndex = -1;
      h.focus();
    }
  }

  function reiniciarMarcador() {
    indice = 0;
    aciertos = 0;
    puntaje = 0;
    bonus = 0;
    segundos = 0;
    publicada = false;
    cortada = false;
    relojListo = false;
  }

  function armarRonda() {
    var copia = banco.map(function (q) {
      return {
        tema: q.tema,
        pregunta: q.pregunta,
        explicacion: q.explicacion,
        fuente: q.fuente,
        ops: q.opciones.map(function (t, i) { return { t: t, ok: i === q.correcta }; })
      };
    });
    ronda = barajar(copia).slice(0, RONDA).map(function (q) {
      q.ops = barajar(q.ops);
      q.cerrada = false;
      return q;
    });
    reiniciarMarcador();
    enServidor = false;
    partidaId = null;
  }

  function empezarLocal() {
    if (!banco.length) {
      if (error) error.textContent = "Todavía no cargan las preguntas. Revisa la conexión.";
      return;
    }
    armarRonda();
    pantalla("juego");
    pintarPregunta();
    arrancarReloj();
  }

  function preguntasServidor(lista) {
    return lista.map(function (q) {
      var ops = Array.isArray(q.opciones) ? q.opciones : [];
      return {
        tema: q.tema || "",
        pregunta: q.pregunta || "",
        explicacion: "",
        fuente: "",
        ops: ops.map(function (t) { return { t: typeof t === "string" ? t : String(t) }; }),
        cerrada: false
      };
    });
  }

  function empezarServidor() {
    return pedir("/rest/v1/rpc/concurso_empezar", {
      method: "POST",
      body: { p_apodo: apodo, p_pais: pais }
    }).then(function (res) {
      var msg = textoError(res);
      if (sinTabla(res) || res.red) {
        estadoNube = res.red ? "red" : "local";
        if (error) error.textContent = "";
        empezarLocal();
        return;
      }
      if (!res.ok) {
        if (/apodo no permitido|pais no permitido/i.test(msg)) {
          if (error) error.textContent = "Ese apodo no se puede usar. Elige otro, sin insultos.";
          return;
        }
        if (/limite de envios/i.test(msg)) {
          estadoNube = "limite";
          if (error) error.textContent = "";
          empezarLocal();
          return;
        }
        if (error) error.textContent = "No se pudo abrir la partida. Inténtalo otra vez.";
        return;
      }
      var data = res.data || {};
      var qs = data.preguntas;
      if (!data.partida || !Array.isArray(qs) || qs.length < RONDA) {
        if (error) error.textContent = "No se pudo abrir la partida. Inténtalo otra vez.";
        return;
      }
      enServidor = true;
      partidaId = data.partida;
      ronda = preguntasServidor(qs);
      reiniciarMarcador();
      enServidor = true;
      pantalla("juego");
      pintarPregunta();
      arrancarReloj();
    });
  }

  function empezar(ev) {
    if (ev) ev.preventDefault();
    aplicarApodoCuenta();
    var campo = document.getElementById("concurso-apodo");
    var sel = document.getElementById("concurso-pais");
    var msg = apodoValido(campo ? campo.value : "");
    if (msg) {
      if (error) error.textContent = msg;
      if (campo) campo.focus();
      return;
    }
    if (error) error.textContent = "";
    apodo = String(campo.value || "").replace(/\s+/g, " ").trim();
    pais = sel && sel.value ? sel.value : "";
    var publicado = window.GR && GR.comunidad && GR.comunidad.concursoPublicado === true && nube();
    var btn = form.querySelector("[type=submit]");
    if (btn) btn.disabled = true;
    var hecho = publicado ? empezarServidor() : Promise.resolve(empezarLocal());
    Promise.resolve(hecho).then(function () {
      if (btn) btn.disabled = false;
    }, function () {
      if (btn) btn.disabled = false;
      if (error) error.textContent = "No se pudo abrir la partida. Inténtalo otra vez.";
    });
  }

  function siguiente() {
    if (cortada) {
      otra();
      return;
    }
    if (indice + 1 >= ronda.length) {
      pintarFin();
      return;
    }
    indice += 1;
    if (!enServidor) {
      pintarPregunta();
      arrancarReloj();
      return;
    }
    pintarPregunta();
    pedir("/rest/v1/rpc/concurso_abrir", {
      method: "POST",
      body: { p_partida: partidaId }
    }).then(function (res) {
      if (!res.ok) {
        cortarPartida("No se pudo abrir la siguiente pregunta. Recarga la página e inténtalo de nuevo.");
        return;
      }
      arrancarReloj();
    });
  }

  function otra() {
    publicada = false;
    puntaje = 0;
    segundos = 0;
    aciertos = 0;
    pantalla("inicio");
    var campo = document.getElementById("concurso-apodo");
    if (campo) {
      campo.value = apodo;
      campo.focus();
    }
    if (estadoNube === "general") {
      sonda = null;
      asegurar();
    } else mostrarLocal();
  }

  function llenarPaises() {
    var sel = document.getElementById("concurso-pais");
    if (!sel) return;
    PAISES.forEach(function (p) {
      var o = document.createElement("option");
      o.value = p[0];
      o.textContent = p[1];
      sel.appendChild(o);
    });
    sel.value = "";
  }

  document.addEventListener("visibilitychange", function () {
    if (document.hidden || fase !== "juego" || cortada || !relojListo) return;
    var q = preguntaActual();
    if (!q || q.cerrada) return;
    if (quedaMs() <= 0) {
      bloquearOpciones();
      responder(-1);
    }
  });

  document.getElementById("preg-siguiente").addEventListener("click", siguiente);
  document.getElementById("fin-otra").addEventListener("click", otra);
  form.addEventListener("submit", empezar);
  form.classList.add("concurso-form");
  llenarPaises();
  aplicarApodoCuenta();
  window.addEventListener("gr-auth", aplicarApodoCuenta);
  mostrarLocal();
  asegurar();

  fetch(root + "data/concurso.json", { credentials: "omit" }).then(function (r) {
    if (!r.ok) throw new Error("preguntas");
    return r.json();
  }).then(function (data) {
    var qs = data && data.preguntas;
    if (!Array.isArray(qs) || qs.length < 40) throw new Error("banco");
    qs.forEach(function (q) {
      if (!q || !q.pregunta || !Array.isArray(q.opciones) || q.opciones.length !== 4) throw new Error("forma");
      if (q.correcta < 0 || q.correcta > 3) throw new Error("forma");
    });
    banco = qs;
  }).catch(function () {
    if (error) error.textContent = "No se pudieron cargar las preguntas. Recarga la página.";
    var btn = form.querySelector("[type=submit]");
    if (btn) btn.disabled = true;
  });
})();
