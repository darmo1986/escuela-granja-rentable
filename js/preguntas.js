/* Reto del mes. Con la URL de ejemplo de js/config.js no llama a Supabase.
   La clave de cada pregunta vive en este script solo para la demo: el HTML no la marca.
   Con Supabase, responder() del SQL es quien dice si acertaste, después de contestar. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GR_preguntas = api;
  if (!root || !root.document || !root.document.getElementById("qa-lista")) return;
  api.iniciar();
})(typeof window !== "undefined" ? window : null, function (root) {
  var FILTRO = ["viagra", "casino", "porno", "criptomoneda", "puta", "mierda", "cabron", "maricon"];
  var REGLAS = {
    intento: [{ ventana: 3000, tope: 1 }, { ventana: 3600000, tope: 40 }],
    sugerencia: [{ ventana: 86400000, tope: 3 }]
  };
  var PUNTOS = { acierto: 10, primero: 5, rapidoMax: 5 };
  var LIMITE_S = 30;
  var GRACIA_MS = 2000;
  var GUIAS = {
    coriza: "Coriza infecciosa",
    carencias: "Carencias nutricionales",
    pollitos: "Problemas de los pollitos"
  };
  var CLAVE = "gr_preguntas_v1";
  var CLAVE_ADMIN = "gr_preguntas_admin";
  var CLAVE_NOMBRE = "gr_preguntas_nombre";
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

  function normaliza(s) {
    return String(s || "").toLowerCase().replace(/[áàä]/g, "a").replace(/[éèë]/g, "e").replace(/[íìï]/g, "i").replace(/[óòö]/g, "o").replace(/[úùü]/g, "u").replace(/ñ/g, "n");
  }

  function textoProhibido(t) {
    var limpio = normaliza(t);
    var i;
    for (i = 0; i < FILTRO.length; i++) {
      var re = new RegExp("(^|[^a-z0-9])" + FILTRO[i] + "([^a-z0-9]|$)");
      if (re.test(limpio)) return true;
    }
    var links = String(t || "").match(/https?:\/\//gi);
    return !!(links && links.length > 2);
  }

  function cupo(marcas, ahora, reglas) {
    var maxV = 0;
    var i;
    var j;
    for (i = 0; i < reglas.length; i++) if (reglas[i].ventana > maxV) maxV = reglas[i].ventana;
    var lista = [];
    for (i = 0; i < (marcas || []).length; i++) {
      if (ahora - marcas[i] < maxV) lista.push(marcas[i]);
    }
    for (i = 0; i < reglas.length; i++) {
      var dentro = [];
      for (j = 0; j < lista.length; j++) {
        if (ahora - lista[j] < reglas[i].ventana) dentro.push(lista[j]);
      }
      if (dentro.length >= reglas[i].tope) {
        var oldest = dentro[0];
        for (j = 1; j < dentro.length; j++) if (dentro[j] < oldest) oldest = dentro[j];
        return { ok: false, espera: reglas[i].ventana - (ahora - oldest), marcas: lista };
      }
    }
    return { ok: true, espera: 0, marcas: lista };
  }

  function periodoDe(ms) {
    var s = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid", year: "numeric", month: "2-digit" }).format(new Date(ms));
    return s.slice(0, 7);
  }

  function nombrePeriodo(p) {
    var m = Number(String(p || "").slice(5, 7));
    var y = String(p || "").slice(0, 4);
    if (!MESES[m - 1]) return String(p || "");
    return MESES[m - 1] + " de " + y;
  }

  function eurosValidos(n) {
    n = Math.round(Number(n));
    if (n < 20 || n > 30) return null;
    return n;
  }

  function puntosIntento(acierto, ms, limiteMs, esPrimero) {
    if (!acierto) return { puntos: 0, base: 0, rapido: 0, primero: 0 };
    var usado = ms;
    if (usado < 0) usado = 0;
    if (limiteMs > 0 && usado > limiteMs) usado = limiteMs;
    var rapido = limiteMs > 0 ? Math.round(PUNTOS.rapidoMax * (1 - usado / limiteMs)) : 0;
    var primero = esPrimero ? PUNTOS.primero : 0;
    return { puntos: PUNTOS.acierto + rapido + primero, base: PUNTOS.acierto, rapido: rapido, primero: primero };
  }

  function semillaNum(s) {
    var h = 2166136261;
    var i;
    s = String(s || "");
    for (i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function barajar(lista, semilla) {
    var a = (lista || []).slice();
    var s = semilla >>> 0;
    var i;
    var j;
    var t;
    for (i = a.length - 1; i > 0; i--) {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      j = s % (i + 1);
      t = a[i];
      a[i] = a[j];
      a[j] = t;
    }
    return a;
  }

  function rankingMes(usuarios, intentos, preguntas, periodo) {
    var dePregunta = {};
    var i;
    for (i = 0; i < (preguntas || []).length; i++) dePregunta[preguntas[i].id] = preguntas[i];
    var por = {};
    for (i = 0; i < (intentos || []).length; i++) {
      var it = intentos[i];
      if (it.anulado) continue;
      var preg = dePregunta[it.pregunta];
      if (!preg || preg.periodo !== periodo) continue;
      if (!por[it.usuario]) por[it.usuario] = { id: it.usuario, puntos: 0, aciertos: 0, llegado: 0 };
      var fila = por[it.usuario];
      fila.puntos += it.puntos || 0;
      if (it.acierto && it.puntos > 0) fila.aciertos++;
      if ((it.puntos || 0) > 0 && it.creado > fila.llegado) fila.llegado = it.creado;
    }
    var nombres = {};
    for (i = 0; i < (usuarios || []).length; i++) nombres[usuarios[i].id] = usuarios[i].nombre;
    return Object.keys(por).map(function (id) {
      var f = por[id];
      f.nombre = nombres[id] || "Alguien";
      return f;
    }).filter(function (f) { return f.puntos > 0; }).sort(function (a, b) {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (a.llegado !== b.llegado) return a.llegado - b.llegado;
      if (b.aciertos !== a.aciertos) return b.aciertos - a.aciertos;
      return String(a.nombre).localeCompare(String(b.nombre), "es");
    });
  }

  function senalCompartida(usuarios, dispositivo, ganadorId) {
    if (!dispositivo) return [];
    return (usuarios || []).filter(function (u) {
      return u.id !== ganadorId && u.dispositivo && u.dispositivo === dispositivo;
    });
  }

  function configNube(gr) {
    var c = (gr && gr.comunidad) || (typeof window !== "undefined" && window.GR && window.GR.comunidad) || {};
    var url = String(c.supabaseUrl || "").replace(/\/$/, "");
    var key = String(c.supabaseAnonKey || "").trim();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) return null;
    if (/tu-proyecto/i.test(url)) return null;
    if (!key || /tu_clave|placeholder|ejemplo/i.test(key)) return null;
    if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key) && !/^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) return null;
    return { url: url, key: key };
  }

  function eurosIniciales() {
    var c = (typeof window !== "undefined" && window.GR && window.GR.comunidad) || {};
    return eurosValidos(c.premioEuros) || 25;
  }

  function segundosIniciales() {
    return LIMITE_S;
  }

  function diasReclamo() {
    var c = (typeof window !== "undefined" && window.GR && window.GR.comunidad) || {};
    var n = Math.round(Number(c.diasReclamo));
    if (n < 7 || n > 30) return 15;
    return n;
  }

  function semilla() {
    var H = 3600000;
    var ahora = Date.now();
    function hace(horas) { return ahora - horas * H; }
    var periodo = periodoDe(ahora);
    var limite = LIMITE_S * 1000;
    var intentos = [];
    function anotar(pregunta, usuario, opcion, acierto, ms, creado, dispositivo) {
      var primero = !!(acierto && !intentos.some(function (i) {
        return i.pregunta === pregunta && i.acierto && !i.anulado && i.puntos > 0;
      }));
      var p = puntosIntento(acierto, ms, limite, primero);
      intentos.push({
        id: "i-" + pregunta + "-" + usuario,
        pregunta: pregunta,
        usuario: usuario,
        opcion: opcion,
        acierto: !!acierto,
        puntos: p.puntos,
        base: p.base,
        rapido: p.rapido,
        primero: p.primero,
        ms: ms,
        creado: creado,
        anulado: false,
        motivo: "",
        dispositivo: dispositivo
      });
    }
    anotar("q-calcio", "u-marta", "c2", true, 8000, hace(80), "dev-marta");
    anotar("q-calcio", "u-luis", "c2", true, 30000, hace(70), "dev-compartido");
    anotar("q-temp", "u-marta", "t2", true, 12000, hace(60), "dev-marta");
    anotar("q-temp", "u-ana", "t2", true, 20000, hace(50), "dev-ana");
    anotar("q-cobb", "u-luis", "k2", true, 10000, hace(40), "dev-compartido");
    anotar("q-cobb", "u-marta", "k1", false, 15000, hace(30), "dev-marta");
    anotar("q-amon", "u-ana", "m2", true, 5000, hace(20), "dev-ana");
    anotar("q-amon", "u-pedro", "m1", false, 20000, hace(18), "dev-pedro");
    return {
      v: 5,
      premioEuros: eurosIniciales(),
      usuarios: [
        { id: "u-marta", nombre: "Marta López", correo: "marta@ejemplo.test", dispositivo: "dev-marta" },
        { id: "u-luis", nombre: "Luis Herrera", correo: "luis@ejemplo.test", dispositivo: "dev-compartido" },
        { id: "u-ana", nombre: "Ana Ruiz", correo: "ana@ejemplo.test", dispositivo: "dev-ana" },
        { id: "u-pedro", nombre: "Pedro Díaz", correo: "pedro@ejemplo.test", dispositivo: "dev-pedro" },
        { id: "u-sombra", nombre: "Cuenta repetida", correo: "sombra@ejemplo.test", dispositivo: "dev-compartido" }
      ],
      sesion: null,
      preguntas: [
        { id: "q-puesta", periodo: periodo, origen: "", segundos: LIMITE_S, texto: "¿Cuándo empiezan a poner, de forma orientativa, las ponedoras comerciales?", explica: "Suelen empezar hacia las 18–22 semanas. Si partes de pollitos, no cuentes huevos antes de unos 5 meses. Es orientativo.", correcta: "p2", opciones: [
          { id: "p1", texto: "A la semana de nacer" },
          { id: "p2", texto: "Hacia las 18–22 semanas" },
          { id: "p3", texto: "Al cumplir el año justo" },
          { id: "p4", texto: "Solo en primavera el primer año" }
        ] },
        { id: "q-calcio", periodo: periodo, origen: "", segundos: LIMITE_S, guia: "carencias", texto: "En postura, ¿dónde dejo el calcio?", explica: "El calcio va aparte, a libre disposición: unos 3–5 g por gallina y día. De día, calcio fino. De tarde-noche, concha o grano grueso. Es orientativo.", correcta: "c2", opciones: [
          { id: "c1", texto: "Mezclado en el pienso, para que no elijan" },
          { id: "c2", texto: "Aparte, a libre disposición" },
          { id: "c3", texto: "Solo disuelto en el agua" },
          { id: "c4", texto: "No hace falta calcio extra en postura" }
        ] },
        { id: "q-temp", periodo: periodo, origen: "", segundos: LIMITE_S, guia: "pollitos", texto: "La primera semana, ¿qué temperatura orientativa se usa en la criadora?", explica: "Muchos dejan la criadora cerca de 32–35 °C la primera semana y van bajando. Si se amontonan, tienen frío. Si se apartan de la lámpara, tienen calor. Es orientativo.", correcta: "t2", opciones: [
          { id: "t1", texto: "18–20 °C" },
          { id: "t2", texto: "32–35 °C" },
          { id: "t3", texto: "40–42 °C" },
          { id: "t4", texto: "La del ambiente, sin lámpara" }
        ] },
        { id: "q-cobb", periodo: periodo, origen: "", segundos: LIMITE_S, texto: "Cobb 500 y Ross 308, ¿para qué se crían?", explica: "Son líneas de engorde. No se crían para huevo. Hacia las 6–8 semanas suelen estar en peso de faena, según el manejo. Es orientativo.", correcta: "k2", opciones: [
          { id: "k1", texto: "Huevo de mesa" },
          { id: "k2", texto: "Carne, no para huevo" },
          { id: "k3", texto: "Incubar huevos de raza pura" },
          { id: "k4", texto: "Solo de adorno" }
        ] },
        { id: "q-amon", periodo: periodo, origen: "", segundos: LIMITE_S, guia: "coriza", texto: "Si el gallinero huele a amoníaco, ¿qué miro primero?", explica: "La cama mojada suelta amoníaco. Se saca esa parte y se ventila sin una corriente directa sobre las aves. Es orientativo. Ese ambiente favorece los problemas respiratorios.", correcta: "m2", opciones: [
          { id: "m1", texto: "Echo más pienso" },
          { id: "m2", texto: "La cama húmeda y la ventilación" },
          { id: "m3", texto: "Cierro todo para que no entre frío" },
          { id: "m4", texto: "Tiro agua al suelo" }
        ] }
      ],
      sugerencias: [
        { id: "s-agua", autor: "u-pedro", texto: "¿Cada cuánto cambio el agua de las gallinas?", explica: "El agua se cambia a diario y el bebedero se mantiene limpio. Es orientativo.", correcta: "sa2", estado: "pendiente", creado: hace(5), opciones: [
          { id: "sa1", texto: "No hace falta cambiarla" },
          { id: "sa2", texto: "A diario, y el bebedero se limpia" },
          { id: "sa3", texto: "Una vez al mes basta" },
          { id: "sa4", texto: "Con que beban de un charco vale" }
        ] }
      ],
      intentos: intentos,
      abiertas: [],
      premios: [
        { id: "prem-2026-09", periodo: "2026-09", ganador: "u-luis", euros: 25, estado: "pendiente", reclamo: null, dispositivo: "dev-compartido", motivo: "", creado: Date.parse("2026-10-01T08:00:00Z") }
      ],
      ritmo: { intento: [], sugerencia: [] }
    };
  }

  var cfgNube = null;
  var demoForzada = false;
  var estado = null;
  var reloj = null;
  var ocupado = false;

  function modoDemo() { return demoForzada || !cfgNube; }

  function buscar(lista, id) {
    var i;
    for (i = 0; i < (lista || []).length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  function nombreDe(id) {
    var u = buscar(estado.usuarios, id);
    return u ? u.nombre : "Alguien";
  }

  function intentoDe(usuarioId, preguntaId) {
    var i;
    for (i = 0; i < estado.intentos.length; i++) {
      var it = estado.intentos[i];
      if (it.usuario === usuarioId && it.pregunta === preguntaId) return it;
    }
    return null;
  }

  function abiertaDe(usuarioId, preguntaId) {
    var i;
    for (i = 0; i < estado.abiertas.length; i++) {
      var a = estado.abiertas[i];
      if (a.usuario === usuarioId && a.pregunta === preguntaId) return a;
    }
    return null;
  }

  function esAdmin() {
    var box = document.getElementById("qa-admin");
    return !!(box && box.checked);
  }

  function dispositivo() {
    var clave = "gr_preguntas_dispositivo";
    try {
      var id = localStorage.getItem(clave);
      if (!id) {
        id = "disp-" + Math.random().toString(36).slice(2, 10);
        localStorage.setItem(clave, id);
      }
      return id;
    } catch (e) { return ""; }
  }

  function aviso(texto, malo) {
    var n = document.getElementById("qa-aviso");
    if (!n) return;
    n.textContent = texto || "";
    n.classList.toggle("malo", !!malo);
  }

  function textoEspera(ms) {
    var s = Math.max(1, Math.ceil(ms / 1000));
    if (s < 60) return "Espera " + s + " segundos para volver a intentarlo.";
    return "Espera " + Math.ceil(s / 60) + " minutos para volver a intentarlo.";
  }

  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); } catch (e) {}
  }

  function normalizar(o) {
    o.usuarios = o.usuarios || [];
    o.preguntas = o.preguntas || [];
    o.sugerencias = o.sugerencias || [];
    o.intentos = o.intentos || [];
    o.abiertas = o.abiertas || [];
    o.premios = o.premios || [];
    o.ritmo = o.ritmo || { intento: [], sugerencia: [] };
    if (!o.ritmo.intento) o.ritmo.intento = [];
    if (!o.ritmo.sugerencia) o.ritmo.sugerencia = [];
    if (!eurosValidos(o.premioEuros)) o.premioEuros = eurosIniciales();
    return o;
  }

  function cargar() {
    try {
      var raw = localStorage.getItem(CLAVE);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.v === 5 && Array.isArray(o.preguntas) && Array.isArray(o.intentos)) return normalizar(o);
      }
    } catch (e) {}
    return semilla();
  }

  function el(tag, cls, texto) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (texto != null) n.textContent = texto;
    return n;
  }

  function boton(cls, acc, id, texto, extra) {
    var b = el("button", "btn " + cls, texto);
    b.type = "button";
    b.setAttribute("data-acc", acc);
    b.setAttribute("data-id", id);
    if (extra) Object.keys(extra).forEach(function (k) { b.setAttribute(k, extra[k]); });
    return b;
  }

  function nombreValido(s) {
    s = String(s || "").trim();
    return s.length >= 2 && s.length <= 40;
  }

  function correoValido(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
  }

  function aplicarCuenta() {
    if (!estado) return;
    var u = window.GRAuth && GRAuth.usuario();
    if (!u) {
      if (estado.sesion) {
        estado.sesion = null;
        guardar();
      }
      return;
    }
    var user = null;
    var i;
    for (i = 0; i < estado.usuarios.length; i++) {
      if (String(estado.usuarios[i].correo || "").toLowerCase() === String(u.correo || "").toLowerCase() || estado.usuarios[i].id === u.id) {
        user = estado.usuarios[i];
      }
    }
    if (!user) {
      user = { id: u.id, nombre: u.nombre, correo: u.correo, dispositivo: dispositivo() };
      estado.usuarios.push(user);
    }
    user.nombre = u.nombre || user.nombre;
    user.correo = u.correo || user.correo;
    user.dispositivo = user.dispositivo || dispositivo();
    estado.sesion = { id: user.id, nombre: user.nombre, correo: user.correo, cuenta: true };
    guardar();
  }

  function exigirSesion() {
    if (estado.sesion) return true;
    if (window.GRAuth) GRAuth.abrir("entrar");
    aviso("Entra con tu cuenta para responder y salir en el ranking.", true);
    return false;
  }

  function lanzar(trabajo) {
    if (ocupado) return;
    ocupado = true;
    Promise.resolve().then(trabajo).then(function (cambio) {
      ocupado = false;
      if (cambio !== false) pintar();
    }).catch(function (e) {
      ocupado = false;
      aviso(e && e.message ? e.message : "No se pudo completar.", true);
    });
  }

  function tomarCupo(clave) {
    var ahora = Date.now();
    var r = cupo(estado.ritmo[clave], ahora, REGLAS[clave]);
    if (!r.ok) return r;
    r.marcas.push(ahora);
    estado.ritmo[clave] = r.marcas;
    return r;
  }

  function esPrimero(preguntaId) {
    var i;
    for (i = 0; i < estado.intentos.length; i++) {
      var it = estado.intentos[i];
      if (it.pregunta === preguntaId && it.acierto && !it.anulado && it.puntos > 0) return false;
    }
    return true;
  }

  function anotarCierre(usuarioId, pregunta, opcionId, ms, servida, modo) {
    if (intentoDe(usuarioId, pregunta.id)) return false;
    var propia = pregunta.origen && pregunta.origen === usuarioId;
    var aTiempo = modo === "" && ms <= LIMITE_S * 1000 + GRACIA_MS;
    var acierto = aTiempo && opcionId === pregunta.correcta;
    var primero = acierto && !propia && esPrimero(pregunta.id);
    var p = puntosIntento(acierto && !propia, Math.min(ms, LIMITE_S * 1000), LIMITE_S * 1000, primero);
    if (propia) p = { puntos: 0, base: 0, rapido: 0, primero: 0 };
    var motivo = modo === "recarga" ? "Recarga" : (modo === "tiempo" ? "Tiempo" : "");
    estado.intentos.push({
      id: "i-" + Math.random().toString(36).slice(2, 10),
      pregunta: pregunta.id,
      usuario: usuarioId,
      opcion: aTiempo ? (opcionId || "") : "",
      acierto: !!acierto,
      puntos: p.puntos,
      base: p.base,
      rapido: p.rapido,
      primero: p.primero,
      ms: ms,
      servida: servida,
      recibida: Date.now(),
      creado: Date.now(),
      anulado: false,
      motivo: motivo,
      dispositivo: dispositivo(),
      propia: !!propia
    });
    estado.abiertas = estado.abiertas.filter(function (a) {
      return !(a.usuario === usuarioId && a.pregunta === pregunta.id);
    });
    return p;
  }

  function cerrarIntento(pregunta, opcionId, ms, modo) {
    var abierta = abiertaDe(estado.sesion.id, pregunta.id);
    var p = anotarCierre(estado.sesion.id, pregunta, opcionId, ms, abierta ? abierta.inicio : Date.now(), modo);
    if (!p) return false;
    var user = buscar(estado.usuarios, estado.sesion.id);
    if (user) user.dispositivo = dispositivo();
    guardar();
    if (modo === "tiempo") aviso("Se acabaron los 30 s. Cuenta como fallo: 0 puntos y el intento usado.", false);
    else if (modo === "recarga") aviso("Se cerró o se recargó la página. Cuenta como fallo: 0 puntos y el intento usado.", false);
    else if (pregunta.origen && pregunta.origen === estado.sesion.id && opcionId === pregunta.correcta) aviso("Acertaste, pero propusiste esta pregunta: no suma puntos.", false);
    else if (p.puntos > 0) aviso("Correcta. " + p.puntos + " puntos" + (p.primero ? " (incluye el extra de ser el primero)." : "."), false);
    else aviso("Esta no era. No suma puntos. Abajo va la explicación.", false);
    return true;
  }

  function fallarAbiertas(motivo) {
    var n = 0;
    var copia = (estado.abiertas || []).slice();
    var i;
    for (i = 0; i < copia.length; i++) {
      var a = copia[i];
      var pregunta = buscar(estado.preguntas, a.pregunta);
      if (!pregunta || intentoDe(a.usuario, a.pregunta)) {
        estado.abiertas = estado.abiertas.filter(function (x) { return x !== a; });
        continue;
      }
      var ms = Math.max(0, Date.now() - a.inicio);
      anotarCierre(a.usuario, pregunta, "", ms, a.inicio, motivo || "recarga");
      n++;
    }
    if (n) guardar();
    return n;
  }

  function empezar(preguntaId) {
    if (!modoDemo()) { aviso("En el servidor, empezar y responder los hace el SQL. Esta vista es la demo.", true); return false; }
    if (!exigirSesion()) return false;
    var pregunta = buscar(estado.preguntas, preguntaId);
    if (!pregunta || pregunta.periodo !== periodoDe(Date.now())) { aviso("Esa pregunta no está en el mes.", true); return false; }
    if (intentoDe(estado.sesion.id, preguntaId)) { aviso("Ya respondiste esta. Un intento por cuenta.", true); return false; }
    if (abiertaDe(estado.sesion.id, preguntaId)) return true;
    var previsto = cupo(estado.ritmo.intento, Date.now(), REGLAS.intento);
    if (!previsto.ok) { aviso(textoEspera(previsto.espera), true); return false; }
    var otras = estado.abiertas.filter(function (a) { return a.usuario === estado.sesion.id; });
    if (otras.length) {
      otras.forEach(function (a) {
        var previa = buscar(estado.preguntas, a.pregunta);
        if (previa) anotarCierre(estado.sesion.id, previa, "", Math.max(0, Date.now() - a.inicio), a.inicio, "recarga");
      });
      aviso("La pregunta que tenías abierta cuenta como fallo.", false);
    }
    var cup = tomarCupo("intento");
    if (!cup.ok) { aviso(textoEspera(cup.espera), true); return false; }
    estado.abiertas.push({ usuario: estado.sesion.id, pregunta: preguntaId, inicio: Date.now() });
    guardar();
    return true;
  }

  function responder(preguntaId, opcionId) {
    if (!modoDemo()) { aviso("En el servidor, la función responder comprueba el acierto con la hora del servidor. Esta vista es la demo.", true); return false; }
    if (!exigirSesion()) return false;
    var pregunta = buscar(estado.preguntas, preguntaId);
    var abierta = abiertaDe(estado.sesion.id, preguntaId);
    if (!pregunta || !abierta) { aviso("Pulsa Empezar. El tiempo corre desde ahí.", true); return false; }
    if (intentoDe(estado.sesion.id, preguntaId)) {
      if (opcionId) aviso("Ya respondiste esta. Un intento por cuenta.", true);
      return false;
    }
    var ms = Date.now() - abierta.inicio;
    var limite = LIMITE_S * 1000;
    if (ms > limite + GRACIA_MS || !opcionId) return cerrarIntento(pregunta, "", ms, "tiempo");
    var valida = (pregunta.opciones || []).some(function (o) { return o.id === opcionId; });
    if (!valida) { aviso("Esa opción no es de esta pregunta.", true); return false; }
    return cerrarIntento(pregunta, opcionId, ms, "");
  }

  function leerOpciones(form) {
    var opciones = [];
    var i;
    for (i = 1; i <= 4; i++) {
      var texto = String(form["o" + i].value || "").trim();
      if (texto.length < 2 || texto.length > 140) return null;
      opciones.push({ id: "o-" + Math.random().toString(36).slice(2, 8), texto: texto });
    }
    var n = Number(form.correcta.value);
    if (n < 1 || n > 4) return null;
    return { opciones: opciones, correcta: opciones[n - 1].id };
  }

  function crearPregunta(form) {
    if (!esAdmin()) return false;
    if (!modoDemo()) { aviso("En el servidor las crea el admin con el SQL. Esta vista es la demo.", true); return false; }
    var texto = String(form.texto.value || "").trim();
    var explica = String(form.explica.value || "").trim();
    if (texto.length < 8 || explica.length < 8) { aviso("La pregunta y la explicación necesitan al menos 8 letras.", true); return false; }
    var pack = leerOpciones(form);
    if (!pack) { aviso("Haz cuatro opciones y marca la correcta.", true); return false; }
    if (textoProhibido(texto + " " + explica + " " + pack.opciones.map(function (o) { return o.texto; }).join(" "))) { aviso("Ese texto no se puede publicar.", true); return false; }
    estado.preguntas.unshift({
      id: "q-" + Math.random().toString(36).slice(2, 8),
      periodo: periodoDe(Date.now()),
      origen: "",
      segundos: segundosIniciales(),
      texto: texto,
      explica: explica,
      correcta: pack.correcta,
      opciones: pack.opciones
    });
    form.reset();
    guardar();
    aviso("Pregunta publicada en este mes. La clave no se muestra hasta que alguien contesta.", false);
    return true;
  }

  function sugerir(form) {
    if (!modoDemo()) { aviso("En el servidor la sugerencia espera al admin. Esta vista es la demo.", true); return false; }
    if (!exigirSesion()) return false;
    var texto = String(form.texto.value || "").trim();
    var explica = String(form.explica.value || "").trim();
    if (texto.length < 8 || explica.length < 8) { aviso("La pregunta y la explicación necesitan al menos 8 letras.", true); return false; }
    var pack = leerOpciones(form);
    if (!pack) { aviso("Haz cuatro opciones y marca la que crees correcta.", true); return false; }
    if (textoProhibido(texto + " " + explica + " " + pack.opciones.map(function (o) { return o.texto; }).join(" "))) { aviso("Ese texto no se puede publicar.", true); return false; }
    var cup = tomarCupo("sugerencia");
    if (!cup.ok) { aviso(textoEspera(cup.espera), true); return false; }
    estado.sugerencias.push({
      id: "s-" + Math.random().toString(36).slice(2, 8),
      autor: estado.sesion.id,
      texto: texto,
      explica: explica,
      correcta: pack.correcta,
      opciones: pack.opciones,
      estado: "pendiente",
      creado: Date.now()
    });
    form.reset();
    guardar();
    aviso("Propuesta enviada. Un admin la aprueba antes de que se pueda jugar.", false);
    return true;
  }

  function resolverSugerencia(id, accion) {
    if (!esAdmin() || !modoDemo()) return false;
    var s = buscar(estado.sugerencias, id);
    if (!s || s.estado !== "pendiente") return false;
    if (accion === "aprobar") {
      s.estado = "aprobada";
      estado.preguntas.unshift({
        id: "q-" + Math.random().toString(36).slice(2, 8),
        periodo: periodoDe(Date.now()),
        origen: s.autor,
        segundos: segundosIniciales(),
        texto: s.texto,
        explica: s.explica,
        correcta: s.correcta,
        opciones: s.opciones
      });
      guardar();
      aviso("Quedó publicada. Quien la propuso puede jugarla, pero no suma puntos.", false);
      return true;
    }
    s.estado = "rechazada";
    guardar();
    aviso("Propuesta rechazada.", false);
    return true;
  }

  function anularIntento(id, motivo) {
    if (!esAdmin() || !modoDemo()) return false;
    var it = buscar(estado.intentos, id);
    if (!it || it.anulado) return false;
    it.anulado = true;
    it.motivo = String(motivo || "Anulado por el admin").trim();
    guardar();
    aviso("Intento anulado. Esos puntos salen del ranking y no se puede repetir la pregunta.", false);
    return true;
  }

  function fijarEuros(n) {
    if (!esAdmin()) return false;
    var v = eurosValidos(n);
    if (v == null) { aviso("El premio del mes va de 20 a 30 €.", true); return false; }
    estado.premioEuros = v;
    guardar();
    aviso("Premio del mes: " + v + " €. El pago sigue siendo manual.", false);
    return true;
  }

  function reclamar(premioId, datos) {
    if (!modoDemo()) { aviso("En el servidor el admin aprueba antes de pagar. Esta vista es la demo.", true); return false; }
    var premio = buscar(estado.premios, premioId);
    if (!premio || !estado.sesion || premio.ganador !== estado.sesion.id) { aviso("Solo quien ganó el mes puede reclamar.", true); return false; }
    if (premio.estado !== "pendiente") { aviso("Esta reclamación ya está enviada.", false); return false; }
    if (!datos.mayor) { aviso("Hay que tener 18 años o más.", true); return false; }
    if (!datos.bases) { aviso("Hay que aceptar las bases para reclamar.", true); return false; }
    var nombre = String(datos.nombre || "").trim();
    var pais = String(datos.pais || "").trim();
    if (!nombreValido(nombre)) { aviso("El nombre necesita entre 2 y 40 letras.", true); return false; }
    if (pais.length < 2) { aviso("Elige el país.", true); return false; }
    var metodo = datos.metodo;
    if (metodo !== "paypal" && metodo !== "ebay" && metodo !== "curso") { aviso("Elige cómo quieres recibirlo.", true); return false; }
    var paypal = String(datos.paypal || "").trim();
    if (metodo === "paypal" && !correoValido(paypal)) { aviso("Para PayPal hace falta el correo de esa cuenta.", true); return false; }
    premio.estado = "reclamado";
    premio.reclamo = { nombre: nombre, pais: pais, metodo: metodo, paypal: metodo === "paypal" ? paypal : "" };
    premio.dispositivo = dispositivo();
    var user = buscar(estado.usuarios, estado.sesion.id);
    if (user) user.dispositivo = premio.dispositivo;
    guardar();
    aviso("Reclamación enviada. El admin comprueba la identidad y paga a mano. La demo no envía dinero.", false);
    return true;
  }

  function resolverPremio(premioId, accion, motivo) {
    if (!esAdmin() || !modoDemo()) return false;
    var premio = buscar(estado.premios, premioId);
    if (!premio || premio.estado === "anulado" || premio.estado === "pagado") return false;
    if (accion === "aprobar") {
      if (premio.estado !== "reclamado") { aviso("Primero tiene que reclamarlo.", true); return false; }
      premio.estado = "aprobado";
      guardar();
      aviso("Aprobado. Aún no está pagado: lo envías tú, a mano.", false);
      return true;
    }
    if (accion === "pagar") {
      if (premio.estado !== "aprobado") { aviso("Apruébalo antes de anotarlo como pagado.", true); return false; }
      premio.estado = "pagado";
      guardar();
      aviso("Anotado como pagado a mano. La demo no ha movido dinero.", false);
      return true;
    }
    if (accion === "anular") {
      premio.estado = "anulado";
      premio.motivo = String(motivo || "Anulado por el admin").trim();
      guardar();
      aviso("Premio anulado.", false);
      return true;
    }
    return false;
  }

  function entrarDemo(nombre, correo) {
    nombre = String(nombre || "").trim();
    correo = String(correo || "").trim().toLowerCase();
    if (!nombreValido(nombre)) { aviso("El nombre necesita entre 2 y 40 letras.", true); return false; }
    if (!correoValido(correo)) { aviso("Escribe un correo válido. En la demo no se envía.", true); return false; }
    var i;
    var user = null;
    for (i = 0; i < estado.usuarios.length; i++) {
      if (String(estado.usuarios[i].correo || "").toLowerCase() === correo) user = estado.usuarios[i];
    }
    if (!user) {
      user = { id: "u-" + Math.random().toString(36).slice(2, 8), nombre: nombre, correo: correo };
      estado.usuarios.push(user);
    }
    user.dispositivo = dispositivo();
    estado.sesion = { id: user.id, nombre: user.nombre, correo: user.correo };
    guardar();
    aviso("Entraste en la demo. El correo no se comprueba aquí. Encendido de verdad: enlace o Google.", false);
    return true;
  }

  function salir() {
    if (window.GRAuth) {
      GRAuth.salir();
      aviso("Saliste de la cuenta.", false);
      return true;
    }
    estado.sesion = null;
    guardar();
    aviso("Saliste de la demo.", false);
    return true;
  }

  function textoPuntos(it) {
    if (it.propia) return "No suma: propusiste esta pregunta.";
    if (!it.acierto) return "0 puntos.";
    var partes = [it.base + " por acertar"];
    if (it.rapido) partes.push(it.rapido + " por rapidez");
    if (it.primero) partes.push(it.primero + " por ser el primero");
    return it.puntos + " puntos (" + partes.join(", ") + ").";
  }

  function pintaPregunta(p) {
    var art = el("article", "qa-card");
    art.id = "p-" + p.id;
    var sesion = estado.sesion && estado.sesion.id;
    var it = sesion && intentoDe(sesion, p.id);
    var abierta = sesion && abiertaDe(sesion, p.id);
    art.appendChild(el("h3", "", p.texto));
    var meta = el("p", "qa-meta");
    meta.textContent = nombrePeriodo(p.periodo) + " · " + LIMITE_S + " s · un intento";
    if (p.origen) meta.appendChild(document.createTextNode(" · propuesta de " + nombreDe(p.origen)));
    art.appendChild(meta);
    if (!sesion) {
      art.appendChild(el("p", "fine", "Entra para responder. Las opciones se mezclan y la explicación sale después."));
      return art;
    }
    if (it) {
      var buena = buscar(p.opciones, p.correcta);
      var elegida = buscar(p.opciones, it.opcion);
      var cierre = it.acierto ? "Correcta." : (it.motivo === "Recarga" ? "Se cerró o se recargó. Cuenta como fallo." : (it.motivo === "Tiempo" || !it.opcion ? "Se acabaron los 30 s. Cuenta como fallo." : "No era esa."));
      art.appendChild(el("p", "", cierre));
      if (elegida) art.appendChild(el("p", "fine", "Elegiste: " + elegida.texto));
      if (buena) art.appendChild(el("p", "", "Respuesta: " + buena.texto));
      art.appendChild(el("p", "qa-explica", p.explica));
      if (p.guia && GUIAS[p.guia]) {
        var guia = el("p", "fine");
        guia.appendChild(document.createTextNode("Para seguir leyendo, de forma orientativa: "));
        var enlace = document.createElement("a");
        enlace.href = "enfermedades/" + p.guia + ".html";
        enlace.textContent = GUIAS[p.guia];
        guia.appendChild(enlace);
        guia.appendChild(document.createTextNode(". No es un diagnóstico."));
        art.appendChild(guia);
      }
      art.appendChild(el("p", "fine", textoPuntos(it)));
      if (esAdmin() && !it.anulado) {
        art.appendChild(boton("sec", "anular-intento", it.id, "Anular este intento"));
      }
      if (it.anulado) art.appendChild(el("p", "fine", "Anulado: " + (it.motivo || "sin puntos.")));
      return art;
    }
    if (!abierta) {
      art.appendChild(el("p", "fine", "Al pulsar Empezar corren 30 segundos. Si recargas o cierras, cuenta como fallo."));
      art.appendChild(boton("gold", "empezar", p.id, "Empezar"));
      return art;
    }
    art.appendChild(pintaReloj(p.id, abierta));
    var caja = el("div", "qa-opciones");
    var orden = barajar(p.opciones, semillaNum(sesion + ":" + p.id));
    orden.forEach(function (o) {
      caja.appendChild(boton("sec qa-opcion", "opcion", p.id, o.texto, { "data-op": o.id }));
    });
    art.appendChild(caja);
    return art;
  }

  function estadoPremio(clave) {
    if (clave === "pendiente") return "Sin reclamar";
    if (clave === "reclamado") return "Reclamado, por aprobar";
    if (clave === "aprobado") return "Aprobado, falta pagarlo a mano";
    if (clave === "pagado") return "Anotado como pagado";
    if (clave === "anulado") return "Anulado";
    return clave;
  }

  function formularioReclamo(premio) {
    var form = el("form", "qa-reclamo qa");
    form.setAttribute("data-id", premio.id);
    form.appendChild(el("p", "", "Reclamar " + premio.euros + " € de " + nombrePeriodo(premio.periodo)));
    form.appendChild(el("p", "fine", "Nombre, correo de la cuenta, país, mayoría de edad y cómo prefieres cobrar. El admin lo comprueba y paga a mano."));
    var nom = el("label", "", "Nombre");
    var nomIn = el("input");
    nomIn.name = "nombre";
    nomIn.maxLength = 40;
    nomIn.required = true;
    nomIn.value = estado.sesion.nombre || "";
    nom.appendChild(nomIn);
    form.appendChild(nom);
    var cor = el("label", "", "Correo de la cuenta");
    var corIn = el("input");
    corIn.name = "correo";
    corIn.readOnly = true;
    corIn.value = estado.sesion.correo || "";
    cor.appendChild(corIn);
    form.appendChild(cor);
    var pais = el("label", "", "País");
    var sel = el("select");
    sel.name = "pais";
    sel.required = true;
    ["", "España", "México", "Colombia", "Perú", "Argentina", "Otro"].forEach(function (op) {
      var o = el("option", "", op || "Elige");
      o.value = op;
      sel.appendChild(o);
    });
    pais.appendChild(sel);
    form.appendChild(pais);
    var met = el("label", "", "Cómo prefieres cobrar");
    var metSel = el("select");
    metSel.name = "metodo";
    metSel.required = true;
    [["", "Elige"], ["paypal", "PayPal"], ["ebay", "Tarjeta regalo de eBay"], ["curso", "Crédito del curso"]].forEach(function (par) {
      var o = el("option", "", par[1]);
      o.value = par[0];
      metSel.appendChild(o);
    });
    met.appendChild(metSel);
    form.appendChild(met);
    var pay = el("label", "", "Correo de PayPal, si eliges PayPal");
    var payIn = el("input");
    payIn.name = "paypal";
    payIn.type = "email";
    payIn.value = estado.sesion.correo || "";
    pay.appendChild(payIn);
    form.appendChild(pay);
    function caja(name, texto) {
      var lab = el("label", "check");
      var box = el("input");
      box.type = "checkbox";
      box.name = name;
      box.required = true;
      lab.appendChild(box);
      lab.appendChild(document.createTextNode(" " + texto));
      form.appendChild(lab);
    }
    caja("mayor", "Tengo 18 años o más.");
    caja("bases", "Acepto las bases, que aún son un borrador.");
    var go = el("button", "btn gold", "Enviar reclamación");
    go.type = "submit";
    form.appendChild(go);
    return form;
  }

  function pintarBanda() {
    var box = document.getElementById("qa-premio-banda");
    if (!box) return;
    box.textContent = "";
    if (!estado.sesion) { box.hidden = true; return; }
    var mios = estado.premios.filter(function (p) {
      return p.ganador === estado.sesion.id && p.estado !== "anulado";
    });
    if (!mios.length) { box.hidden = true; return; }
    box.hidden = false;
    mios.forEach(function (p) {
      if (p.estado === "pendiente") {
        box.appendChild(el("p", "", "Ganaste " + nombrePeriodo(p.periodo) + " (" + p.euros + " €). Tienes " + diasReclamo() + " días desde el aviso para reclamar."));
        box.appendChild(formularioReclamo(p));
      } else if (p.estado === "reclamado") {
        box.appendChild(el("p", "", "Reclamaste " + nombrePeriodo(p.periodo) + ". Falta que un admin lo apruebe y lo pague a mano."));
      } else if (p.estado === "aprobado") {
        box.appendChild(el("p", "", nombrePeriodo(p.periodo) + " está aprobado. El pago aún lo haces tú, a mano."));
      } else if (p.estado === "pagado") {
        box.appendChild(el("p", "", nombrePeriodo(p.periodo) + " figura como pagado. En la demo no se envió dinero."));
      }
    });
  }

  function pintarCola(admin) {
    var box = document.getElementById("qa-cola");
    var lista = document.getElementById("qa-cola-lista");
    if (!box || !lista) return;
    box.hidden = !admin;
    lista.textContent = "";
    if (!admin) return;
    var hubo = false;
    estado.sugerencias.forEach(function (s) {
      if (s.estado !== "pendiente") return;
      hubo = true;
      var item = el("article", "qa-cola-item");
      item.appendChild(el("h3", "", "Propuesta: " + s.texto));
      item.appendChild(el("p", "qa-meta", nombreDe(s.autor)));
      var actions = el("div", "qa-actions");
      actions.appendChild(boton("gold", "aprobar-sug", s.id, "Aprobar y publicar"));
      actions.appendChild(boton("sec", "rechazar-sug", s.id, "Rechazar"));
      item.appendChild(actions);
      lista.appendChild(item);
    });
    estado.premios.forEach(function (p) {
      hubo = true;
      var item = el("article", "qa-cola-item");
      item.appendChild(el("h3", "", nombrePeriodo(p.periodo) + " · " + p.euros + " €"));
      var meta = el("p", "qa-meta", nombreDe(p.ganador) + " · " + estadoPremio(p.estado));
      if (p.reclamo && p.reclamo.pais) meta.appendChild(document.createTextNode(" · " + p.reclamo.pais));
      if (p.reclamo && p.reclamo.metodo) meta.appendChild(document.createTextNode(" · " + p.reclamo.metodo));
      item.appendChild(meta);
      if (p.motivo) item.appendChild(el("p", "fine", p.motivo));
      var otras = senalCompartida(estado.usuarios, p.dispositivo, p.ganador);
      if (otras.length) {
        item.appendChild(el("p", "qa-senal", "Señal suave: el mismo aparato que " + otras.map(function (u) { return u.nombre; }).join(", ") + ". No basta para anular."));
      }
      item.appendChild(el("p", "fine", "La IP no se lee en la demo. Con Supabase se guarda la de la petición, solo para esta cola."));
      if (p.estado !== "anulado" && p.estado !== "pagado") {
        var actions = el("div", "qa-actions");
        if (p.estado === "reclamado") actions.appendChild(boton("gold", "aprobar-premio", p.id, "Aprobar"));
        if (p.estado === "aprobado") actions.appendChild(boton("gold", "pagar-premio", p.id, "Anotar como pagado a mano"));
        var sel = el("select");
        sel.className = "qa-anular-motivo";
        ["Abuso o multicuenta", "No superó la identidad", "Fuera de plazo", "Otro"].forEach(function (op) {
          var o = el("option", "", op);
          o.value = op;
          sel.appendChild(o);
        });
        actions.appendChild(sel);
        actions.appendChild(boton("sec", "anular-premio", p.id, "Anular premio"));
        item.appendChild(actions);
      }
      lista.appendChild(item);
    });
    if (!hubo) lista.appendChild(el("p", "", "No hay propuestas ni premios en la cola."));
  }

  function pintar() {
    var admin = esAdmin();
    var demo = document.getElementById("qa-demo");
    if (demo) demo.hidden = !modoDemo();
    var entrar = document.getElementById("qa-entrar");
    var ses = document.getElementById("qa-sesion");
    var hola = document.getElementById("qa-hola");
    var sugerirF = document.getElementById("qa-sugerir");
    var crearF = document.getElementById("qa-crear");
    if (estado.sesion) {
      entrar.hidden = true;
      ses.hidden = false;
      hola.textContent = "Hola, " + estado.sesion.nombre + ".";
      if (sugerirF) sugerirF.hidden = false;
    } else {
      entrar.hidden = false;
      ses.hidden = true;
      if (sugerirF) sugerirF.hidden = true;
    }
    if (crearF) crearF.hidden = !admin;
    document.getElementById("qa-admin-fila").hidden = !modoDemo();
    document.getElementById("qa-admin-nota").hidden = !modoDemo();
    document.getElementById("qa-reset").hidden = !modoDemo();
    var eurosFila = document.getElementById("qa-euros-fila");
    if (eurosFila) eurosFila.hidden = !admin;
    var euros = document.getElementById("qa-euros");
    if (euros && document.activeElement !== euros) euros.value = String(estado.premioEuros);
    document.getElementById("qa-entrar-nota").textContent = modoDemo()
      ? "Hace falta la cuenta del sitio. En la demo puedes probar como Ana Ruiz: ya tiene puntos de ejemplo. El correo no se publica."
      : "Entra con Google, con correo y contraseña o con un enlace. El correo no se publica.";

    var periodo = periodoDe(Date.now());
    var filas = rankingMes(estado.usuarios, estado.intentos, estado.preguntas, periodo);
    var nombrePremio = document.getElementById("qa-premio-nombre");
    if (nombrePremio) nombrePremio.textContent = estado.premioEuros + " €";
    var periodoN = document.getElementById("qa-periodo");
    if (periodoN) periodoN.textContent = nombrePeriodo(periodo);
    var liderN = document.getElementById("qa-lider");
    if (liderN) {
      liderN.textContent = filas.length
        ? "Si el mes cerrara ahora, iría primero " + filas[0].nombre + " (" + filas[0].puntos + " puntos)."
        : "Todavía no hay puntos este mes.";
    }
    pintarBanda();
    pintarCola(admin);

    var lista = document.getElementById("qa-lista");
    lista.textContent = "";
    var preguntas = estado.preguntas.filter(function (p) { return p.periodo === periodo; });
    preguntas.sort(function (a, b) {
      var ia = estado.sesion && intentoDe(estado.sesion.id, a.id) ? 1 : 0;
      var ib = estado.sesion && intentoDe(estado.sesion.id, b.id) ? 1 : 0;
      return ia - ib;
    });
    preguntas.forEach(function (p) { lista.appendChild(pintaPregunta(p)); });
    if (!lista.childNodes.length) lista.appendChild(el("p", "", "Este mes todavía no hay preguntas."));

    var ol = document.getElementById("qa-ranking");
    ol.textContent = "";
    if (!filas.length) ol.appendChild(el("li", "", "Todavía no hay puntos."));
    filas.forEach(function (r, i) {
      var li = el("li");
      li.appendChild(el("span", "qa-pos", String(i + 1)));
      var body = el("div");
      var nom = el("p", "qa-rank-nom");
      nom.appendChild(el("strong", "", r.nombre));
      if (i === 0) {
        nom.appendChild(document.createTextNode(" "));
        nom.appendChild(el("span", "badge valida", "Va primero"));
      }
      body.appendChild(nom);
      body.appendChild(el("p", "fine", r.puntos + " puntos · " + r.aciertos + (r.aciertos === 1 ? " acierto" : " aciertos")));
      li.appendChild(body);
      ol.appendChild(li);
    });
  }

  function quedaSegundos(abierta) {
    return Math.max(0, Math.ceil((LIMITE_S * 1000 - (Date.now() - abierta.inicio)) / 1000));
  }

  function pintaReloj(preguntaId, abierta) {
    var queda = quedaSegundos(abierta);
    var box = el("div", "qa-reloj" + (queda <= 10 ? " urgente" : ""));
    box.setAttribute("data-reloj", preguntaId);
    box.setAttribute("role", "timer");
    var num = el("span", "qa-reloj-num", String(queda));
    box.appendChild(num);
    box.appendChild(el("span", "qa-reloj-txt", queda <= 10 ? "Últimos " + queda + " s" : "Quedan " + queda + " s"));
    var barra = el("span", "qa-reloj-barra");
    barra.style.width = Math.round(queda / LIMITE_S * 100) + "%";
    box.appendChild(barra);
    return box;
  }

  function tick() {
    if (!estado || !estado.sesion) return;
    var cerrar = null;
    document.querySelectorAll("[data-reloj]").forEach(function (n) {
      var id = n.getAttribute("data-reloj");
      var abierta = abiertaDe(estado.sesion.id, id);
      if (!abierta) return;
      var queda = quedaSegundos(abierta);
      if (queda <= 0) cerrar = id;
      else {
        n.classList.toggle("urgente", queda <= 10);
        var num = n.querySelector(".qa-reloj-num");
        var txt = n.querySelector(".qa-reloj-txt");
        var barra = n.querySelector(".qa-reloj-barra");
        if (num) num.textContent = String(queda);
        if (txt) txt.textContent = queda <= 10 ? "Últimos " + queda + " s" : "Quedan " + queda + " s";
        if (barra) barra.style.width = Math.round(queda / LIMITE_S * 100) + "%";
      }
    });
    if (cerrar) lanzar(function () { return responder(cerrar, ""); });
  }

  function preparar() {
    document.getElementById("qa-lista").addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-acc]");
      if (!b) return;
      var acc = b.getAttribute("data-acc");
      var id = b.getAttribute("data-id");
      if (acc === "empezar") lanzar(function () { return empezar(id); });
      if (acc === "opcion") lanzar(function () { return responder(id, b.getAttribute("data-op")); });
      if (acc === "anular-intento") lanzar(function () { return anularIntento(id, "Anulado por el admin"); });
    });
    var cola = document.getElementById("qa-cola");
    if (cola) cola.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-acc]");
      if (!b) return;
      var id = b.getAttribute("data-id");
      var acc = b.getAttribute("data-acc");
      var item = b.closest(".qa-cola-item");
      var sel = item && item.querySelector("select");
      if (acc === "aprobar-sug") lanzar(function () { return resolverSugerencia(id, "aprobar"); });
      if (acc === "rechazar-sug") lanzar(function () { return resolverSugerencia(id, "rechazar"); });
      if (acc === "aprobar-premio") lanzar(function () { return resolverPremio(id, "aprobar"); });
      if (acc === "pagar-premio") lanzar(function () { return resolverPremio(id, "pagar"); });
      if (acc === "anular-premio") lanzar(function () { return resolverPremio(id, "anular", sel ? sel.value : ""); });
    });
    document.getElementById("qa-abrir-cuenta").addEventListener("click", function () {
      if (window.GRAuth) GRAuth.abrir("entrar");
      else aviso("La cuenta todavía se está cargando. Prueba otra vez.", true);
    });
    document.getElementById("qa-salir").addEventListener("click", function () {
      lanzar(function () { return salir(); });
    });
    document.getElementById("qa-sugerir").addEventListener("submit", function (ev) {
      ev.preventDefault();
      lanzar(function () { return sugerir(ev.target); });
    });
    document.getElementById("qa-crear").addEventListener("submit", function (ev) {
      ev.preventDefault();
      lanzar(function () { return crearPregunta(ev.target); });
    });
    document.getElementById("qa-lista").addEventListener("submit", function (ev) {
      var form = ev.target;
      if (!form.classList.contains("qa-reclamo")) return;
      ev.preventDefault();
      var datos = new FormData(form);
      lanzar(function () {
        return reclamar(form.getAttribute("data-id"), {
          nombre: datos.get("nombre"),
          pais: datos.get("pais"),
          metodo: datos.get("metodo"),
          paypal: datos.get("paypal"),
          mayor: !!form.querySelector("[name=mayor]").checked,
          bases: !!form.querySelector("[name=bases]").checked
        });
      });
    });
    var banda = document.getElementById("qa-premio-banda");
    if (banda) banda.addEventListener("submit", function (ev) {
      var form = ev.target;
      if (!form.classList.contains("qa-reclamo")) return;
      ev.preventDefault();
      var datos = new FormData(form);
      lanzar(function () {
        return reclamar(form.getAttribute("data-id"), {
          nombre: datos.get("nombre"),
          pais: datos.get("pais"),
          metodo: datos.get("metodo"),
          paypal: datos.get("paypal"),
          mayor: !!form.querySelector("[name=mayor]").checked,
          bases: !!form.querySelector("[name=bases]").checked
        });
      });
    });
    var admin = document.getElementById("qa-admin");
    admin.addEventListener("change", function () {
      try { localStorage.setItem(CLAVE_ADMIN, admin.checked ? "1" : "0"); } catch (e) {}
      pintar();
    });
    var euros = document.getElementById("qa-euros");
    if (euros) euros.addEventListener("change", function () {
      lanzar(function () { return fijarEuros(euros.value); });
    });
    document.getElementById("qa-reset").addEventListener("click", function () {
      if (!modoDemo()) return;
      try {
        localStorage.removeItem(CLAVE);
        localStorage.removeItem(CLAVE_ADMIN);
      } catch (e) {}
      admin.checked = false;
      estado = semilla();
      aplicarCuenta();
      aviso("Volviste a los datos de ejemplo.", false);
      pintar();
    });
    window.addEventListener("gr-auth", function () {
      if (!estado) return;
      aplicarCuenta();
      pintar();
    });
  }

  function notaReto(texto) {
    var demo = document.getElementById("qa-demo");
    if (!demo) return;
    demo.hidden = false;
    demo.textContent = texto;
  }

  function iniciar() {
    preparar();
    cfgNube = configNube();
    /* El acierto de verdad lo dirá responder cuando las migraciones estén
       ejecutadas y esta página las llame. Hasta entonces se juega la demo. */
    demoForzada = true;
    estado = cargar();
    var cerradas = fallarAbiertas("recarga");
    try { document.getElementById("qa-admin").checked = localStorage.getItem(CLAVE_ADMIN) === "1"; } catch (e) {}
    if (cerradas) aviso("Se cerró o se recargó una pregunta a medio hacer. Cuenta como fallo: 0 puntos y el intento usado.", false);
    aplicarCuenta();
    if (cfgNube) notaReto("La cuenta usa Supabase. El reto sigue en demo en este navegador mientras no estén ejecutadas las migraciones.");
    pintar();
    if (reloj) clearInterval(reloj);
    reloj = setInterval(tick, 250);
    if (!cfgNube) return;
    fetch(cfgNube.url + "/rest/v1/rpc/preguntas_publicas", {
      method: "POST",
      headers: {
        apikey: cfgNube.key,
        Authorization: "Bearer " + cfgNube.key,
        "Content-Type": "application/json"
      },
      body: "{}"
    }).then(function (r) {
      if (!r.ok) throw new Error("sin sql");
      notaReto("Supabase ya tiene la función del reto. Esta página sigue en demo: todavía no envía el intento al servidor.");
    }).catch(function () {
      notaReto("La cuenta usa Supabase. El reto sigue en demo: faltan las migraciones de supabase/migrations.");
    });
  }

  return {
    FILTRO: FILTRO,
    REGLAS: REGLAS,
    PUNTOS: PUNTOS,
    textoProhibido: textoProhibido,
    cupo: cupo,
    periodoDe: periodoDe,
    nombrePeriodo: nombrePeriodo,
    eurosValidos: eurosValidos,
    puntosIntento: puntosIntento,
    semillaNum: semillaNum,
    barajar: barajar,
    rankingMes: rankingMes,
    senalCompartida: senalCompartida,
    semilla: semilla,
    configNube: configNube,
    iniciar: iniciar
  };
});
