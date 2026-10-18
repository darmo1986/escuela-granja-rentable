/* Ronda de 10 preguntas. El apodo lo escribe quien juega: no sale de un correo.
   Si concurso_partidas todavía no existe, el ranking queda en este navegador. */
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
  var FILTRO = ["viagra", "casino", "porno", "criptomoneda", "puta", "puto", "mierda", "cabron", "maricon", "pendejo", "pendeja", "nigger", "nigga", "hitler", "gilipollas", "faggot", "asshole"];
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
      .replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n");
  }

  function prohibido(t) {
    var n = normaliza(t);
    var i;
    for (i = 0; i < FILTRO.length; i++) {
      var re = new RegExp("(^|[^a-z0-9])" + FILTRO[i] + "([^a-z0-9]|$)");
      if (re.test(n)) return true;
    }
    return false;
  }

  function apodoValido(t) {
    t = String(t || "").replace(/\s+/g, " ").trim();
    if (t.length < 2 || t.length > 20) return "El apodo necesita entre 2 y 20 caracteres.";
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9][A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9 ._-]{0,18}[A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9]$/.test(t)) {
      return "Usa letras y números. Sin correo ni símbolos raros.";
    }
    if (t.indexOf("@") >= 0 || /\d{8,}/.test(t)) return "Sin correo ni teléfono: solo un apodo.";
    if (prohibido(t)) return "Ese apodo no se puede usar. Elige otro, sin insultos.";
    return "";
  }

  function leerLocal() {
    try {
      var raw = JSON.parse(localStorage.getItem(CLAVE) || "[]");
      return Array.isArray(raw) ? raw : [];
    } catch (e) {
      return [];
    }
  }

  function guardarLocal(fila) {
    var marcas = leerLocal();
    marcas.push(fila);
    if (marcas.length > 50) marcas = marcas.slice(marcas.length - 50);
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
    if (opts && opts.body) {
      headers["Content-Type"] = "application/json";
      headers.Prefer = "return=minimal";
    }
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

  function sinTabla(res) {
    if (!res || res.red) return false;
    if (res.status === 404) return true;
    var code = res.data && res.data.code;
    var msg = res.data && res.data.message ? String(res.data.message) : "";
    return code === "PGRST205" || /schema cache|does not exist|Could not find the table/i.test(msg);
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
    var top = ordenar(filas).slice(0, 20);
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
        b.textContent = op.t;
        b.addEventListener("click", function () { responder(i); });
        ops.appendChild(b);
      });
    }
    if (fb) { fb.hidden = true; fb.textContent = ""; }
    if (exp) { exp.hidden = true; exp.textContent = ""; }
    if (fuente) { fuente.hidden = true; fuente.textContent = ""; }
    if (next) next.hidden = true;
    avisoSeg = 0;
    endsAt = performance.now() + LIMITE_MS;
    pintarReloj();
    pararReloj();
    timerId = setInterval(function () {
      if (fase !== "juego") return;
      if (quedaMs() <= 0) {
        pintarReloj();
        responder(-1);
        return;
      }
      pintarReloj();
    }, 200);
    if (juego && juego.scrollIntoView) juego.scrollIntoView({ block: "start" });
    if (titulo) {
      titulo.tabIndex = -1;
      titulo.focus({ preventScroll: true });
    }
  }

  function responder(i) {
    if (fase !== "juego") return;
    var q = preguntaActual();
    if (!q || q.cerrada) return;
    q.cerrada = true;
    pararReloj();
    var seg = i < 0 ? 0 : quedaSeg();
    var ms = i < 0 ? LIMITE_MS : Math.min(LIMITE_MS, Math.max(0, Math.round(LIMITE_MS - seg * 1000)));
    var ok = i >= 0 && q.ops[i] && q.ops[i].ok;
    var p = puntosDe(ok, ms);
    if (ok) aciertos += 1;
    puntaje += p.puntos;
    bonus += p.rapido || 0;
    segundos += (30 - seg);
    var fb = document.getElementById("preg-fb");
    var exp = document.getElementById("preg-exp");
    var fuente = document.getElementById("preg-fuente");
    var next = document.getElementById("preg-siguiente");
    var botones = document.querySelectorAll("#preg-ops .concurso-opcion");
    botones.forEach(function (b, k) {
      b.disabled = true;
      if (q.ops[k].ok) {
        b.classList.add("is-ok");
        b.appendChild(document.createTextNode(" "));
        var okm = document.createElement("span");
        okm.className = "concurso-mark";
        okm.textContent = "Correcta";
        b.appendChild(okm);
      } else if (k === i) {
        b.classList.add("is-bad");
        b.appendChild(document.createTextNode(" "));
        var bad = document.createElement("span");
        bad.className = "concurso-mark";
        bad.textContent = "Incorrecta";
        b.appendChild(bad);
      }
    });
    var cabeza = i < 0 ? "Se acabó el tiempo. Incorrecto." : (ok ? "Correcto." : "Incorrecto.");
    if (fb) {
      fb.hidden = false;
      fb.textContent = cabeza + (ok ? " Sumas " + p.puntos + " puntos (" + p.base + " del acierto" + (p.rapido ? " y " + p.rapido + " por rapidez" : "") + ")." : " Sumas 0.");
    }
    if (exp) {
      exp.hidden = false;
      exp.textContent = q.explicacion;
    }
    if (fuente) {
      fuente.hidden = false;
      fuente.textContent = "Fuente: " + q.fuente;
    }
    if (next) {
      next.hidden = false;
      next.textContent = indice + 1 >= ronda.length ? "Ver resultado" : "Siguiente pregunta";
      next.focus();
    }
    decir(cabeza + " " + q.explicacion);
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
    asegurar().then(function (estado) {
      if (estado !== "si") {
        mostrarLocal();
        return;
      }
      var body = {
        apodo: fila.apodo,
        puntaje: fila.puntaje,
        aciertos: fila.aciertos,
        segundos: fila.segundos
      };
      if (fila.pais) body.pais = fila.pais;
      pedir("/rest/v1/concurso_partidas", { method: "POST", body: body }).then(function (res) {
        if (sinTabla(res)) {
          estadoNube = "local";
          mostrarLocal();
          return;
        }
        if (!res.ok) {
          var msg = res.data && res.data.message ? String(res.data.message) : "";
          estadoNube = /limite de envios/i.test(msg) ? "limite" : "red";
          mostrarLocal();
          return;
        }
        sonda = null;
        estadoNube = "general";
        asegurar();
      });
    });
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
    indice = 0;
    aciertos = 0;
    puntaje = 0;
    bonus = 0;
    segundos = 0;
    publicada = false;
  }

  function empezar(ev) {
    if (ev) ev.preventDefault();
    if (!banco.length) {
      if (error) error.textContent = "Todavía no cargan las preguntas. Revisa la conexión.";
      return;
    }
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
    armarRonda();
    pantalla("juego");
    pintarPregunta();
  }

  function siguiente() {
    if (indice + 1 >= ronda.length) {
      pintarFin();
      return;
    }
    indice += 1;
    pintarPregunta();
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
    var detectado = (document.documentElement.dataset.pais || "").toUpperCase();
    if (NOMBRE[detectado]) sel.value = detectado;
  }

  document.getElementById("preg-siguiente").addEventListener("click", siguiente);
  document.getElementById("fin-otra").addEventListener("click", otra);
  form.addEventListener("submit", empezar);
  form.classList.add("concurso-form");
  llenarPaises();
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
