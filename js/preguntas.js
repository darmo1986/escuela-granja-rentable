/* Foro de preguntas. Con la URL de ejemplo de js/config.js no llama a Supabase:
   todo queda en localStorage. Con una URL y una clave anónima reales usa la API. */
(function (root, factory) {
  var api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.GR_preguntas = api;
  if (!root || !root.document || !root.document.getElementById("qa-lista")) return;
  api.iniciar();
})(typeof window !== "undefined" ? window : null, function (root) {
  var FILTRO = ["viagra", "casino", "porno", "criptomoneda", "puta", "mierda", "cabron", "maricon"];
  var REGLAS = {
    pregunta: [{ ventana: 60000, tope: 1 }, { ventana: 3600000, tope: 5 }],
    respuesta: [{ ventana: 20000, tope: 1 }, { ventana: 600000, tope: 8 }],
    reporte: [{ ventana: 3600000, tope: 5 }],
    voto: [{ ventana: 60000, tope: 30 }]
  };
  var CLAVE = "gr_preguntas_v1";
  var CLAVE_ADMIN = "gr_preguntas_admin";
  var CLAVE_TOKEN = "gr_preguntas_token";
  var CLAVE_NOMBRE = "gr_preguntas_nombre";

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

  function insignia(respuestas, utiles) {
    if (respuestas >= 10 && utiles >= 25) return { clave: "referente", nombre: "Referente" };
    if (utiles >= 10) return { clave: "buena", nombre: "Buena mano" };
    if (respuestas >= 3) return { clave: "vecino", nombre: "Vecino" };
    return { clave: "semilla", nombre: "Semilla" };
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

  function ordenarPreguntas(preguntas, respuestas, modo) {
    function votos(p) { return (p.votos || []).length; }
    function nResp(p) {
      var n = 0;
      var i;
      for (i = 0; i < respuestas.length; i++) {
        if (respuestas[i].pregunta === p.id && !respuestas[i].oculto) n++;
      }
      return n;
    }
    var list = (preguntas || []).slice();
    list.sort(function (a, b) {
      if (modo === "votadas" && votos(b) !== votos(a)) return votos(b) - votos(a);
      if (modo === "sin") {
        var sa = nResp(a) === 0 ? 0 : 1;
        var sb = nResp(b) === 0 ? 0 : 1;
        if (sa !== sb) return sa - sb;
      }
      return b.creado - a.creado;
    });
    return list;
  }

  function ranking(usuarios, respuestas) {
    return (usuarios || []).map(function (u) {
      var n = 0;
      var utiles = 0;
      var i;
      for (i = 0; i < respuestas.length; i++) {
        if (respuestas[i].autor !== u.id || respuestas[i].oculto) continue;
        n++;
        utiles += (respuestas[i].utiles || []).length;
      }
      return {
        id: u.id,
        nombre: u.nombre,
        respuestas: n,
        utiles: utiles,
        puntos: n + utiles,
        insignia: insignia(n, utiles)
      };
    }).filter(function (r) { return r.respuestas > 0; }).sort(function (a, b) {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      if (b.respuestas !== a.respuestas) return b.respuestas - a.respuestas;
      return String(a.nombre).localeCompare(String(b.nombre), "es");
    });
  }

  var PREMIO = { minLetras: 80, topeMes: 2, esperaMs: 7 * 86400000 };

  function textoPremio() {
    var c = (typeof window !== "undefined" && window.GR && window.GR.comunidad) || {};
    var nombre = String(c.premioNombre || "").trim();
    if (!nombre || /lo decides|placeholder|tu_premio/i.test(nombre)) return "Premio del mes (lo decides tú)";
    return nombre;
  }

  function puedeOptar(respuesta, pregunta) {
    if (!respuesta || !pregunta) return { ok: false, motivo: "falta" };
    if (respuesta.oculto) return { ok: false, motivo: "oculta" };
    if (respuesta.autor === pregunta.autor) return { ok: false, motivo: "propia" };
    if (String(respuesta.cuerpo || "").trim().length < PREMIO.minLetras) return { ok: false, motivo: "corta" };
    return { ok: true, motivo: "" };
  }

  function cupoPremio(premios, usuarioId, ahora) {
    var vivos = (premios || []).filter(function (p) {
      return p.ganador === usuarioId && p.estado !== "anulado" && p.estado !== "sin_premio";
    });
    var d = new Date(ahora);
    var inicio = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
    var enMes = 0;
    var ultimo = 0;
    var i;
    for (i = 0; i < vivos.length; i++) {
      if (vivos[i].creado >= inicio) enMes++;
      if (vivos[i].creado > ultimo) ultimo = vivos[i].creado;
    }
    if (enMes >= PREMIO.topeMes) return { ok: false, motivo: "mes" };
    if (ultimo && ahora - ultimo < PREMIO.esperaMs) return { ok: false, motivo: "espera", espera: PREMIO.esperaMs - (ahora - ultimo) };
    return { ok: true, motivo: "" };
  }

  function premioActivo(premios, preguntaId) {
    var i;
    var lista = premios || [];
    for (i = lista.length - 1; i >= 0; i--) {
      if (lista[i].pregunta === preguntaId && lista[i].estado !== "anulado") return lista[i];
    }
    return null;
  }

  function senalCompartida(usuarios, dispositivo, ganadorId) {
    if (!dispositivo) return [];
    return (usuarios || []).filter(function (u) {
      return u.id !== ganadorId && u.dispositivo && u.dispositivo === dispositivo;
    });
  }

  function ids(pref, n) {
    var a = [];
    var i;
    for (i = 1; i <= n; i++) a.push(pref + i);
    return a;
  }

  function semilla() {
    var H = 3600000;
    var ahora = Date.now();
    function hace(horas) { return ahora - horas * H; }
    return {
      v: 2,
      usuarios: [
        { id: "u-marta", nombre: "Marta López", correo: "marta@ejemplo.test", dispositivo: "dev-marta" },
        { id: "u-luis", nombre: "Luis Herrera", correo: "luis@ejemplo.test", dispositivo: "dev-compartido" },
        { id: "u-ana", nombre: "Ana Ruiz", correo: "ana@ejemplo.test", dispositivo: "dev-ana" },
        { id: "u-pedro", nombre: "Pedro Díaz", correo: "pedro@ejemplo.test", dispositivo: "dev-pedro" },
        { id: "u-carmen", nombre: "Carmen Soto", correo: "carmen@ejemplo.test", dispositivo: "dev-carmen" },
        { id: "u-anuncio", nombre: "Anuncio raro", correo: "anuncio@ejemplo.test", dispositivo: "dev-anuncio" },
        { id: "u-sombra", nombre: "Cuenta repetida", correo: "sombra@ejemplo.test", dispositivo: "dev-compartido" }
      ],
      sesion: null,
      preguntas: [
        { id: "q-calcio", autor: "u-ana", titulo: "¿Cuánto calcio dejo a libre disposición en postura?", cuerpo: "Tengo 30 gallinas ponedoras y no sé si mezclar la concha con el pienso o dejarla aparte.", creado: hace(90), oculto: false, votos: ["u-marta", "u-luis", "u-pedro", "u-carmen", "v-cal"], valida: "a1" },
        { id: "q-temp", autor: "u-carmen", titulo: "¿A qué temperatura dejo los pollitos la primera semana?", cuerpo: "Acaban de nacer en la incubadora y los pasé a la criadora. No quiero ni asarlos ni dejarlos tiritar.", creado: hace(6), oculto: false, votos: ["u-marta"], valida: "a7" },
        { id: "q-isa", autor: "u-pedro", titulo: "Mi Isa Brown dejó de poner a los 8 meses", cuerpo: "Comen y beben normal. El día ya es más corto. ¿Puede ser la luz o se vienen a la muda?", creado: hace(30), oculto: false, votos: ["u-carmen"] },
        { id: "q-cobb", autor: "u-luis", titulo: "Cobb 500 a las 7 semanas, ¿sigo o los preparo para carne?", cuerpo: "Están grandes y comen mucho. No busco huevos con esta línea.", creado: hace(50), oculto: false, votos: [] },
        { id: "q-amon", autor: "u-marta", titulo: "Huele a amoníaco al entrar al gallinero", cuerpo: "La cama lleva tres semanas. ¿La cambio toda o solo la parte húmeda?", creado: hace(12), oculto: false, votos: ["u-luis", "u-ana"] }
      ],
      respuestas: [
        { id: "a1", pregunta: "q-calcio", autor: "u-marta", cuerpo: "En postura, el calcio va aparte, a libre disposición: unos 3–5 g por gallina y día. Por el día, calcio fino. Por la tarde-noche, concha de ostra o grano grueso. Es orientativo.", creado: hace(88), oculto: false, utiles: ids("cal", 18) },
        { id: "a2", pregunta: "q-calcio", autor: "u-luis", cuerpo: "Yo dejo un recipiente aparte de concha. Cuando se vacía muy rápido, pongo otro.", creado: hace(70), oculto: false, utiles: ids("lu1", 8) },
        { id: "a3", pregunta: "q-calcio", autor: "u-ana", cuerpo: "Gracias. Los dejé aparte y el recipiente baja solo, sin mezclarlo con el pienso.", creado: hace(40), oculto: false, utiles: ids("an1", 1) },
        { id: "a4", pregunta: "q-calcio", autor: "u-marta", cuerpo: "No lo mezcles con el pienso: si pueden elegir, lo pican cuando lo necesitan.", creado: hace(60), oculto: false, utiles: [] },
        { id: "a5", pregunta: "q-calcio", autor: "u-marta", cuerpo: "Si el huevo sale blando, revisa también el agua y que no estén enfermas. El calcio no lo arregla todo.", creado: hace(55), oculto: false, utiles: [] },
        { id: "a6", pregunta: "q-temp", autor: "u-marta", cuerpo: "La primera semana muchos dejan la criadora cerca de 32–35 °C y van bajando. Si se amontonan, tienen frío. Si se apartan de la lámpara, tienen calor. Orientativo.", creado: hace(5), oculto: false, utiles: ids("te", 4) },
        { id: "a7", pregunta: "q-temp", autor: "u-luis", cuerpo: "En mi criadora miro el corro: juntos es frío, en los bordes es calor. Así ajusto la lámpara sin un número fijo.", creado: hace(4), oculto: false, utiles: ids("lu2", 2) },
        { id: "a8", pregunta: "q-temp", autor: "u-pedro", cuerpo: "¿La lámpara va todo el día la primera semana o solo de noche?", creado: hace(3), oculto: false, utiles: [] },
        { id: "a9", pregunta: "q-temp", autor: "u-marta", cuerpo: "Un termómetro a la altura de los pollitos vale más que adivinar. No es una receta única.", creado: hace(2.5), oculto: false, utiles: [] },
        { id: "a10", pregunta: "q-temp", autor: "u-marta", cuerpo: "Deja también una zona más fresca para que ellos elijan dónde ponerse.", creado: hace(2), oculto: false, utiles: [] },
        { id: "a11", pregunta: "q-amon", autor: "u-marta", cuerpo: "Si pica al respirar, saca la cama húmeda y ventila sin una corriente directa sobre las aves.", creado: hace(11), oculto: false, utiles: ids("am", 4) },
        { id: "a12", pregunta: "q-amon", autor: "u-luis", cuerpo: "A mí me funcionó cambiar la cama húmeda cada semana en época de lluvias.", creado: hace(9), oculto: false, utiles: ids("lu3", 2) },
        { id: "a13", pregunta: "q-amon", autor: "u-ana", cuerpo: "Probé a ventilar la puerta una hora y el olor bajó, pero la cama seguía mojada.", creado: hace(8), oculto: false, utiles: ids("an2", 1) },
        { id: "a14", pregunta: "q-amon", autor: "u-marta", cuerpo: "Remover solo la costra a veces no alcanza. La parte mojada es la que suelta el amoníaco.", creado: hace(7), oculto: false, utiles: [] },
        { id: "a15", pregunta: "q-amon", autor: "u-ana", cuerpo: "Al final saqué la parte húmeda y mejoró al día siguiente.", creado: hace(6.5), oculto: false, utiles: [] },
        { id: "a16", pregunta: "q-cobb", autor: "u-marta", cuerpo: "Cobb y Ross se crían para carne, no para huevo. Hacia las 6–8 semanas ya suelen estar en peso de faena, según el manejo.", creado: hace(48), oculto: false, utiles: [] },
        { id: "a17", pregunta: "q-cobb", autor: "u-luis", cuerpo: "Los míos a las 7 semanas ya no crecían igual y comían de más. Los destinamos a carne.", creado: hace(46), oculto: false, utiles: [] },
        { id: "a18", pregunta: "q-cobb", autor: "u-marta", cuerpo: "Si sigues más semanas, el pienso se come el margen. Míralo en la calculadora antes de decidir.", creado: hace(44), oculto: false, utiles: [] },
        { id: "a19", pregunta: "q-cobb", autor: "u-pedro", cuerpo: "Yo los faené.", creado: hace(40), oculto: false, utiles: [] },
        { id: "a-oculto", pregunta: "q-isa", autor: "u-anuncio", cuerpo: "Escríbeme para venderte un lote milagroso que pone el doble.", creado: hace(20), oculto: true, utiles: [] }
      ],
      reportes: [
        { id: "r1", tipo: "pregunta", objetivo: "q-isa", usuario: "u-luis", motivo: "Creo que está repetida", creado: hace(10) },
        { id: "r2", tipo: "respuesta", objetivo: "a-oculto", usuario: "u-ana", motivo: "Spam o publicidad", creado: hace(18) }
      ],
      premios: [
        { id: "prem-calcio", pregunta: "q-calcio", respuesta: "a1", ganador: "u-marta", marcadoPor: "u-ana", estado: "pendiente", motivo: "", reclamo: null, dispositivo: "dev-marta", creado: hace(80) },
        { id: "prem-temp", pregunta: "q-temp", respuesta: "a7", ganador: "u-luis", marcadoPor: "u-carmen", estado: "reclamado", motivo: "", reclamo: { nombre: "Luis Herrera", pais: "México" }, dispositivo: "dev-compartido", creado: hace(3) }
      ],
      ritmo: { pregunta: [], respuesta: [], reporte: [], voto: [] }
    };
  }

  function configNube(gr) {
    var c = (gr && gr.comunidad) || (typeof window !== "undefined" && window.GR && window.GR.comunidad) || {};
    var url = String(c.supabaseUrl || "").replace(/\/$/, "");
    var key = String(c.supabaseAnonKey || "").trim();
    if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)) return null;
    if (/tu-proyecto/i.test(url)) return null;
    if (!key || /tu_clave|placeholder|ejemplo/i.test(key)) return null;
    return { url: url, key: key };
  }

  var cfgNube = null;
  var estado = null;
  var orden = "nuevas";
  var abiertas = {};
  var ocupado = false;

  function modoDemo() { return !cfgNube; }

  function ritmoVacio() {
    return { pregunta: [], respuesta: [], reporte: [], voto: [] };
  }

  function textoEspera(ms) {
    var s = Math.max(1, Math.ceil(ms / 1000));
    if (s < 60) return "Espera " + s + " segundos para volver a publicar.";
    return "Espera " + Math.ceil(s / 60) + " minutos para volver a publicar.";
  }

  function validar(titulo, cuerpo, conTitulo) {
    titulo = String(titulo || "").trim();
    cuerpo = String(cuerpo || "").trim();
    if (conTitulo && (titulo.length < 8 || titulo.length > 140)) return "El título necesita entre 8 y 140 letras.";
    if (cuerpo.length < 8 || cuerpo.length > 4000) return "El texto necesita entre 8 y 4.000 letras.";
    if (textoProhibido(conTitulo ? titulo + " " + cuerpo : cuerpo)) return "Ese texto no se puede publicar. Quita insultos, publicidad o los enlaces de más.";
    return "";
  }

  function correoValido(s) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || "").trim());
  }

  function nombreValido(s) {
    var n = String(s || "").trim();
    return n.length >= 2 && n.length <= 40;
  }

  function haceTexto(ms) {
    var s = Math.max(0, Date.now() - ms) / 1000;
    if (s < 90) return "ahora";
    if (s < 3600) return "hace " + Math.floor(s / 60) + " min";
    if (s < 86400) return "hace " + Math.floor(s / 3600) + " h";
    var d = Math.floor(s / 86400);
    return d === 1 ? "hace 1 día" : "hace " + d + " días";
  }

  function aviso(texto, malo) {
    var n = document.getElementById("qa-aviso");
    if (!n) return;
    n.textContent = texto || "";
    n.classList.toggle("malo", !!malo && !!texto);
  }

  function errorHumano(e) {
    var m = String((e && e.message) || e || "");
    if (/row-level security/i.test(m)) return "No tienes permiso para hacer eso.";
    if (/Demasiados envíos/i.test(m)) return m;
    if (/no se puede publicar/i.test(m)) return m;
    if (/No puedes votar/i.test(m)) return m;
    if (/Failed to fetch|NetworkError|Load failed/i.test(m)) return "No hay conexión con Supabase.";
    return m || "No se pudo completar.";
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function esAdmin() {
    if (cfgNube) return !!(estado && estado.esAdmin);
    var box = document.getElementById("qa-admin");
    return !!(box && box.checked);
  }

  function nombreDe(id) {
    var i;
    for (i = 0; i < estado.usuarios.length; i++) {
      if (estado.usuarios[i].id === id) return estado.usuarios[i].nombre;
    }
    return "Alguien";
  }

  function statsDe(id) {
    var n = 0;
    var u = 0;
    var i;
    for (i = 0; i < estado.respuestas.length; i++) {
      if (estado.respuestas[i].autor !== id || estado.respuestas[i].oculto) continue;
      n++;
      u += (estado.respuestas[i].utiles || []).length;
    }
    return insignia(n, u);
  }

  function reportesDe(tipo, id) {
    var n = 0;
    var i;
    for (i = 0; i < estado.reportes.length; i++) {
      if (estado.reportes[i].tipo === tipo && estado.reportes[i].objetivo === id) n++;
    }
    return n;
  }

  function yaReporto(tipo, id) {
    if (!estado.sesion) return false;
    var i;
    for (i = 0; i < estado.reportes.length; i++) {
      var r = estado.reportes[i];
      if (r.tipo === tipo && r.objetivo === id && r.usuario === estado.sesion.id) return true;
    }
    return false;
  }

  function nVisibles(preguntaId) {
    var n = 0;
    var i;
    for (i = 0; i < estado.respuestas.length; i++) {
      if (estado.respuestas[i].pregunta === preguntaId && !estado.respuestas[i].oculto) n++;
    }
    return n;
  }

  function guardarDemo() {
    try { localStorage.setItem(CLAVE, JSON.stringify(estado)); }
    catch (e) { aviso("No pude guardar en este navegador.", true); }
  }

  function aplicarCupo(tipo) {
    if (!estado.ritmo) estado.ritmo = ritmoVacio();
    var res = cupo(estado.ritmo[tipo] || [], Date.now(), REGLAS[tipo]);
    estado.ritmo[tipo] = res.marcas;
    if (!res.ok) return res;
    estado.ritmo[tipo].push(Date.now());
    return { ok: true, espera: 0 };
  }

  function nid(pref) {
    if (root && root.crypto && root.crypto.randomUUID) return pref + root.crypto.randomUUID();
    return pref + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function sb(path, opts) {
    opts = opts || {};
    var token = (estado && estado.token && estado.token.access_token) || cfgNube.key;
    var headers = {
      apikey: cfgNube.key,
      Authorization: "Bearer " + token,
      "Content-Type": "application/json"
    };
    if (!opts.auth) headers.Prefer = "return=representation";
    return fetch(cfgNube.url + path, {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (r.status === 204) return null;
      return r.text().then(function (t) {
        var data = null;
        try { data = t ? JSON.parse(t) : null; } catch (e) { data = { message: t }; }
        if (!r.ok) {
          var msg = (data && (data.message || data.msg || data.error_description || data.error)) || ("Error " + r.status);
          throw new Error(typeof msg === "string" ? msg : "Error " + r.status);
        }
        return data;
      });
    });
  }

  function leerToken() {
    try {
      var raw = localStorage.getItem(CLAVE_TOKEN);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  function guardarToken(token) {
    try {
      if (token) localStorage.setItem(CLAVE_TOKEN, JSON.stringify(token));
      else localStorage.removeItem(CLAVE_TOKEN);
    } catch (e) {}
  }

  function leerHash() {
    if (!root.location || !root.location.hash || root.location.hash.indexOf("access_token=") === -1) return null;
    var p = new URLSearchParams(root.location.hash.replace(/^#/, ""));
    var access = p.get("access_token");
    if (!access) return null;
    var exp = Number(p.get("expires_in") || 3600);
    try { root.history.replaceState(null, "", root.location.pathname + root.location.search); } catch (e) {}
    return {
      access_token: access,
      refresh_token: p.get("refresh_token") || "",
      expires_at: Date.now() + exp * 1000
    };
  }

  function asegurarToken() {
    if (!estado.token) return Promise.resolve();
    if (estado.token.expires_at && estado.token.expires_at - Date.now() > 60000) return Promise.resolve();
    if (!estado.token.refresh_token) return Promise.resolve();
    return sb("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      auth: true,
      body: { refresh_token: estado.token.refresh_token }
    }).then(function (data) {
      estado.token = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || estado.token.refresh_token,
        expires_at: Date.now() + Number(data.expires_in || 3600) * 1000
      };
      guardarToken(estado.token);
    });
  }

  function volcarVotos(filas, votos) {
    var map = {};
    var i;
    for (i = 0; i < filas.length; i++) {
      filas[i].creado = Date.parse(filas[i].creado) || 0;
      filas[i].oculto = !!filas[i].oculto;
      if (!filas[i].votos) filas[i].votos = [];
      if (!filas[i].utiles) filas[i].utiles = [];
      map[filas[i].id] = filas[i];
    }
    for (i = 0; i < votos.length; i++) {
      var v = votos[i];
      var fila = map[v.objetivo];
      if (!fila) continue;
      if (v.tipo === "pregunta") fila.votos.push(v.usuario);
      if (v.tipo === "respuesta") fila.utiles.push(v.usuario);
    }
    return filas;
  }

  function refrescarNube() {
    return asegurarToken().then(function () {
      if (!estado.token) return null;
      return sb("/auth/v1/user", { auth: true });
    }).then(function (user) {
      if (!user) return;
      estado.sesion = { id: user.id, nombre: "", correo: user.email || "" };
      return sb("/rest/v1/perfiles?id=eq." + encodeURIComponent(user.id) + "&select=id,nombre,es_admin");
    }).then(function (perfiles) {
      if (!estado.sesion) return;
      var p = perfiles && perfiles[0];
      if (!p) throw new Error("No hay ficha de perfil. Revisa el trigger alta_perfil en el SQL.");
      var pendiente = "";
      try { pendiente = localStorage.getItem(CLAVE_NOMBRE) || ""; } catch (e) {}
      if (nombreValido(pendiente) && pendiente.trim() !== p.nombre) {
        return sb("/rest/v1/perfiles?id=eq." + encodeURIComponent(estado.sesion.id), {
          method: "PATCH",
          body: { nombre: pendiente.trim() }
        }).then(function () {
          try { localStorage.removeItem(CLAVE_NOMBRE); } catch (e2) {}
          estado.sesion.nombre = pendiente.trim();
          estado.esAdmin = !!p.es_admin;
        });
      }
      estado.sesion.nombre = p.nombre;
      estado.esAdmin = !!p.es_admin;
    }).then(function () {
      var tareas = [
        sb("/rest/v1/perfiles?select=id,nombre&order=nombre.asc&limit=200"),
        sb("/rest/v1/preguntas?select=id,titulo,cuerpo,creado,oculto,autor&order=creado.desc&limit=100"),
        sb("/rest/v1/respuestas?select=id,pregunta,cuerpo,creado,oculto,autor&order=creado.asc&limit=500"),
        sb("/rest/v1/votos?select=usuario,tipo,objetivo&limit=2000")
      ];
      if (estado.sesion) tareas.push(sb("/rest/v1/reportes?select=id,usuario,tipo,objetivo,motivo,creado&order=creado.desc&limit=200"));
      return Promise.all(tareas);
    }).then(function (rows) {
      if (!rows) return;
      estado.usuarios = rows[0] || [];
      var votos = rows[3] || [];
      estado.preguntas = volcarVotos(rows[1] || [], votos.filter(function (v) { return v.tipo === "pregunta"; }));
      estado.respuestas = volcarVotos(rows[2] || [], votos.filter(function (v) { return v.tipo === "respuesta"; }));
      estado.respuestas.forEach(function (r) { r.utiles = r.utiles || r.votos || []; });
      estado.reportes = (rows[4] || []).map(function (r) {
        r.creado = Date.parse(r.creado) || 0;
        return r;
      });
    }).catch(function (e) {
      if (/401|JWT|invalid claim|session/i.test(String(e.message || ""))) {
        estado.token = null;
        estado.sesion = null;
        guardarToken(null);
      }
      throw e;
    });
  }

  function lanzar(trabajo) {
    if (ocupado) return;
    ocupado = true;
    Promise.resolve().then(trabajo).then(function (cambio) {
      ocupado = false;
      if (cambio !== false) pintar();
    }).catch(function (e) {
      ocupado = false;
      aviso(errorHumano(e), true);
    });
  }

  function exigirSesion() {
    if (estado.sesion) return true;
    aviso("Entra con tu nombre para hacer eso.", true);
    var f = document.getElementById("qa-entrar");
    if (f && !f.hidden) {
      var campo = f.querySelector("input[name=nombre]");
      if (campo) campo.focus();
    }
    return false;
  }

  function publicarPregunta(titulo, cuerpo) {
    var msg = validar(titulo, cuerpo, true);
    if (msg) { aviso(msg, true); return false; }
    if (modoDemo()) {
      var cup = aplicarCupo("pregunta");
      guardarDemo();
      if (!cup.ok) { aviso(textoEspera(cup.espera), true); return false; }
      estado.preguntas.push({
        id: nid("q-"),
        autor: estado.sesion.id,
        titulo: titulo.trim(),
        cuerpo: cuerpo.trim(),
        creado: Date.now(),
        oculto: false,
        votos: []
      });
      guardarDemo();
      document.getElementById("qa-titulo").value = "";
      document.getElementById("qa-cuerpo").value = "";
      orden = "nuevas";
      aviso("Pregunta publicada en este navegador.", false);
      return true;
    }
    return sb("/rest/v1/preguntas", {
      method: "POST",
      body: { autor: estado.sesion.id, titulo: titulo.trim(), cuerpo: cuerpo.trim() }
    }).then(function () {
      document.getElementById("qa-titulo").value = "";
      document.getElementById("qa-cuerpo").value = "";
      orden = "nuevas";
      aviso("Pregunta publicada.", false);
      return refrescarNube();
    });
  }

  function publicarRespuesta(preguntaId, cuerpo) {
    var msg = validar("", cuerpo, false);
    if (msg) { aviso(msg, true); return false; }
    if (modoDemo()) {
      var cup = aplicarCupo("respuesta");
      guardarDemo();
      if (!cup.ok) { aviso(textoEspera(cup.espera), true); return false; }
      estado.respuestas.push({
        id: nid("a-"),
        pregunta: preguntaId,
        autor: estado.sesion.id,
        cuerpo: cuerpo.trim(),
        creado: Date.now(),
        oculto: false,
        utiles: []
      });
      abiertas[preguntaId] = true;
      guardarDemo();
      aviso("Respuesta publicada en este navegador.", false);
      return true;
    }
    return sb("/rest/v1/respuestas", {
      method: "POST",
      body: { pregunta: preguntaId, autor: estado.sesion.id, cuerpo: cuerpo.trim() }
    }).then(function () {
      abiertas[preguntaId] = true;
      aviso("Respuesta publicada.", false);
      return refrescarNube();
    });
  }

  function alternarVoto(tipo, id, lista) {
    if (!exigirSesion()) return false;
    var fila = null;
    var i;
    var arr = tipo === "pregunta" ? estado.preguntas : estado.respuestas;
    for (i = 0; i < arr.length; i++) if (arr[i].id === id) fila = arr[i];
    if (!fila || fila.oculto) return false;
    if (fila.autor === estado.sesion.id) { aviso("No puedes votar lo que escribiste.", true); return false; }
    var campo = tipo === "pregunta" ? "votos" : "utiles";
    var ya = (fila[campo] || []).indexOf(estado.sesion.id) !== -1;
    if (modoDemo()) {
      if (!ya) {
        var cup = aplicarCupo("voto");
        guardarDemo();
        if (!cup.ok) { aviso(textoEspera(cup.espera), true); return false; }
        fila[campo].push(estado.sesion.id);
      } else {
        fila[campo] = fila[campo].filter(function (x) { return x !== estado.sesion.id; });
      }
      guardarDemo();
      return true;
    }
    var quitar = ya
      ? sb("/rest/v1/votos?usuario=eq." + encodeURIComponent(estado.sesion.id) + "&tipo=eq." + tipo + "&objetivo=eq." + encodeURIComponent(id), { method: "DELETE" })
      : sb("/rest/v1/votos", { method: "POST", body: { usuario: estado.sesion.id, tipo: tipo, objetivo: id } });
    return quitar.then(function () { return refrescarNube(); });
  }

  function enviarReporte(tipo, id, motivo) {
    if (!exigirSesion()) return false;
    motivo = String(motivo || "").trim();
    if (motivo.length < 3) { aviso("Cuenta en pocas palabras por qué lo reportas.", true); return false; }
    if (yaReporto(tipo, id)) { aviso("Ya habías reportado esto.", false); return false; }
    if (textoProhibido(motivo)) { aviso("Ese texto no se puede publicar. Quita insultos, publicidad o los enlaces de más.", true); return false; }
    if (modoDemo()) {
      var cup = aplicarCupo("reporte");
      guardarDemo();
      if (!cup.ok) { aviso(textoEspera(cup.espera), true); return false; }
      estado.reportes.push({ id: nid("r-"), tipo: tipo, objetivo: id, usuario: estado.sesion.id, motivo: motivo, creado: Date.now() });
      guardarDemo();
      aviso("Reporte guardado en este navegador. Un admin de prueba puede ocultarlo.", false);
      return true;
    }
    return sb("/rest/v1/reportes", {
      method: "POST",
      body: { usuario: estado.sesion.id, tipo: tipo, objetivo: id, motivo: motivo }
    }).then(function () {
      aviso("Reporte enviado.", false);
      return refrescarNube();
    });
  }

  function ponerOculto(tipo, id, oculto) {
    if (!esAdmin()) return false;
    var tabla = tipo === "pregunta" ? estado.preguntas : estado.respuestas;
    var i;
    if (modoDemo()) {
      for (i = 0; i < tabla.length; i++) if (tabla[i].id === id) tabla[i].oculto = oculto;
      guardarDemo();
      aviso(oculto ? "Quedó oculto en este navegador." : "Volvió a verse en este navegador.", false);
      return true;
    }
    var path = (tipo === "pregunta" ? "/rest/v1/preguntas?id=eq." : "/rest/v1/respuestas?id=eq.") + encodeURIComponent(id);
    return sb(path, { method: "PATCH", body: { oculto: oculto } }).then(function () {
      aviso(oculto ? "Quedó oculto." : "Volvió a verse.", false);
      return refrescarNube();
    });
  }

  function dispositivo() {
    var clave = "gr_preguntas_dispositivo";
    try {
      var id = localStorage.getItem(clave);
      if (!id) {
        id = nid("disp-");
        localStorage.setItem(clave, id);
      }
      return id;
    } catch (e) { return ""; }
  }

  function buscar(lista, id) {
    var i;
    for (i = 0; i < (lista || []).length; i++) if (lista[i].id === id) return lista[i];
    return null;
  }

  function usuarioDe(id) {
    return buscar(estado.usuarios, id);
  }

  function marcarValida(respuestaId) {
    if (!exigirSesion()) return false;
    if (!modoDemo()) { aviso("El premio en el servidor se enciende con el SQL. Esta vista es la demo.", true); return false; }
    var respuesta = buscar(estado.respuestas, respuestaId);
    var pregunta = respuesta && buscar(estado.preguntas, respuesta.pregunta);
    if (!respuesta || !pregunta) return false;
    var puede = esAdmin() || estado.sesion.id === pregunta.autor;
    if (!puede) { aviso("Solo quien preguntó, o un admin, marca la respuesta válida.", true); return false; }
    if (premioActivo(estado.premios, pregunta.id)) { aviso("Esta pregunta ya tiene una respuesta válida.", true); return false; }
    var opta = puedeOptar(respuesta, pregunta);
    if (!opta.ok && opta.motivo === "propia") { aviso("Responder la propia pregunta no opta al premio.", true); return false; }
    if (!opta.ok && opta.motivo === "corta") { aviso("Para el premio hacen falta al menos 80 letras. Un «ok» no gana.", true); return false; }
    if (!opta.ok) { aviso("Esa respuesta no puede llevarse el premio.", true); return false; }
    var ganador = usuarioDe(respuesta.autor);
    var cup = cupoPremio(estado.premios, respuesta.autor, Date.now());
    var estadoPremio = cup.ok ? "pendiente" : "sin_premio";
    var motivo = "";
    if (!cup.ok && cup.motivo === "espera") motivo = "Aún no pasan 7 días desde su premio anterior.";
    if (!cup.ok && cup.motivo === "mes") motivo = "Ya tiene 2 premios este mes.";
    pregunta.valida = respuesta.id;
    estado.premios.push({
      id: nid("prem-"),
      pregunta: pregunta.id,
      respuesta: respuesta.id,
      ganador: respuesta.autor,
      marcadoPor: estado.sesion.id,
      estado: estadoPremio,
      motivo: motivo,
      reclamo: null,
      dispositivo: (ganador && ganador.dispositivo) || "",
      creado: Date.now()
    });
    guardarDemo();
    aviso(cup.ok
      ? "Quedó como primera respuesta válida. Puede reclamar el premio."
      : "Quedó como respuesta válida. Sin premio: " + motivo, false);
    return true;
  }

  function reclamar(premioId, nombre, pais, acepta) {
    if (!modoDemo()) { aviso("El premio en el servidor se enciende con el SQL. Esta vista es la demo.", true); return false; }
    var premio = buscar(estado.premios, premioId);
    if (!premio || !estado.sesion || premio.ganador !== estado.sesion.id) { aviso("Solo quien ganó puede reclamar.", true); return false; }
    if (premio.estado !== "pendiente") { aviso("Esta reclamación ya está enviada.", false); return false; }
    if (!acepta) { aviso("Hay que aceptar las bases para reclamar.", true); return false; }
    nombre = String(nombre || "").trim();
    pais = String(pais || "").trim();
    if (!nombreValido(nombre)) { aviso("El nombre necesita entre 2 y 40 letras.", true); return false; }
    if (pais.length < 2) { aviso("Elige el país. Solo hace falta para saber cómo entregar.", true); return false; }
    premio.estado = "reclamado";
    premio.reclamo = { nombre: nombre, pais: pais };
    premio.dispositivo = dispositivo();
    var usuario = usuarioDe(estado.sesion.id);
    if (usuario) usuario.dispositivo = premio.dispositivo;
    guardarDemo();
    aviso("Reclamación enviada. Un admin la aprueba antes de entregar nada. En la demo no se envía.", false);
    return true;
  }

  function resolverPremio(premioId, accion, motivo) {
    if (!esAdmin()) return false;
    if (!modoDemo()) { aviso("El premio en el servidor se enciende con el SQL. Esta vista es la demo.", true); return false; }
    var premio = buscar(estado.premios, premioId);
    if (!premio || premio.estado === "anulado") return false;
    if (accion === "aprobar") {
      if (premio.estado !== "reclamado") { aviso("Primero tiene que reclamarlo.", true); return false; }
      premio.estado = "aprobado";
      guardarDemo();
      aviso("Aprobado en la demo. No se entrega nada: el premio concreto lo decides tú.", false);
      return true;
    }
    if (accion === "anular") {
      premio.estado = "anulado";
      premio.motivo = String(motivo || "Anulado por el admin").trim();
      var pregunta = buscar(estado.preguntas, premio.pregunta);
      if (pregunta && pregunta.valida === premio.respuesta) pregunta.valida = "";
      guardarDemo();
      aviso("Premio anulado. La pregunta puede volver a tener una respuesta válida.", false);
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
      user = { id: nid("u-"), nombre: nombre, correo: correo };
      estado.usuarios.push(user);
    }
    user.dispositivo = dispositivo();
    estado.sesion = { id: user.id, nombre: user.nombre, correo: user.correo };
    guardarDemo();
    aviso("Entraste en la demo. Nada salió de este navegador.", false);
    return true;
  }

  function entrarCorreo(nombre, correo) {
    correo = String(correo || "").trim();
    if (!correoValido(correo)) { aviso("Escribe un correo válido.", true); return false; }
    if (nombreValido(nombre)) {
      try { localStorage.setItem(CLAVE_NOMBRE, String(nombre).trim()); } catch (e) {}
    }
    var vuelta = root.location.origin + root.location.pathname;
    return sb("/auth/v1/otp", {
      method: "POST",
      auth: true,
      body: { email: correo, create_user: true, options: { email_redirect_to: vuelta } }
    }).then(function () {
      aviso("Revisa el correo. El enlace abre esta misma página.", false);
    });
  }

  function entrarGoogle(nombre) {
    if (nombreValido(nombre)) {
      try { localStorage.setItem(CLAVE_NOMBRE, String(nombre).trim()); } catch (e) {}
    }
    var vuelta = root.location.origin + root.location.pathname;
    root.location.href = cfgNube.url + "/auth/v1/authorize?provider=google&redirect_to=" + encodeURIComponent(vuelta);
  }

  function salir() {
    if (modoDemo()) {
      estado.sesion = null;
      guardarDemo();
      aviso("Saliste de la demo. Las preguntas siguen en este navegador.", false);
      return true;
    }
    var token = estado.token;
    estado.token = null;
    estado.sesion = null;
    estado.esAdmin = false;
    guardarToken(null);
    var hecho = token
      ? sb("/auth/v1/logout", { method: "POST", auth: true, body: {} }).catch(function () {})
      : Promise.resolve();
    return hecho.then(function () {
      aviso("Saliste.", false);
      return refrescarNube().catch(function () {});
    });
  }

  function boton(cls, acc, id, texto, extra) {
    var b = el("button", "btn " + cls, texto);
    b.type = "button";
    b.setAttribute("data-acc", acc);
    b.setAttribute("data-id", id);
    if (extra) {
      Object.keys(extra).forEach(function (k) { b.setAttribute(k, extra[k]); });
    }
    return b;
  }

  function bloqueReporte(tipo, id) {
    var box = el("div", "qa-reporte");
    if (!estado.sesion) {
      box.appendChild(el("p", "fine", "Entra para reportar."));
      return box;
    }
    if (yaReporto(tipo, id)) {
      box.appendChild(el("p", "fine", "Ya lo reportaste."));
      return box;
    }
    var form = el("form", "qa-reporte-form");
    form.setAttribute("data-tipo", tipo);
    form.setAttribute("data-id", id);
    var label = el("label", "", "Motivo");
    var sel = el("select");
    sel.name = "motivo";
    ["Spam o publicidad", "Insultos", "No es de aves", "Otro"].forEach(function (op) {
      var o = el("option", "", op);
      o.value = op;
      sel.appendChild(o);
    });
    label.appendChild(sel);
    form.appendChild(label);
    var go = el("button", "btn sec", "Enviar reporte");
    go.type = "submit";
    form.appendChild(go);
    box.appendChild(form);
    return box;
  }

  function pintaRespuesta(r, pregunta, admin) {
    var premio = premioActivo(estado.premios, pregunta && pregunta.id);
    var esValida = premio && premio.respuesta === r.id;
    var art = el("div", "qa-respuesta" + (r.oculto ? " qa-oculto" : "") + (esValida ? " qa-valida" : ""));
    var cabeza = el("p", "qa-meta");
    cabeza.appendChild(el("strong", "", nombreDe(r.autor)));
    var badge = statsDe(r.autor);
    cabeza.appendChild(document.createTextNode(" "));
    cabeza.appendChild(el("span", "badge " + badge.clave, badge.nombre));
    cabeza.appendChild(document.createTextNode(" · " + haceTexto(r.creado)));
    if (r.oculto) cabeza.appendChild(document.createTextNode(" · oculto"));
    if (esValida) {
      cabeza.appendChild(document.createTextNode(" "));
      cabeza.appendChild(el("span", "badge valida", "Respuesta válida"));
    }
    art.appendChild(cabeza);
    art.appendChild(el("p", "", r.cuerpo));
    var actions = el("div", "qa-actions");
    if (!r.oculto) {
      var marcado = estado.sesion && (r.utiles || []).indexOf(estado.sesion.id) !== -1;
      actions.appendChild(boton(marcado ? "gold" : "sec", "voto", r.id, (marcado ? "Útil · " : "Me sirve · ") + (r.utiles || []).length, { "data-tipo": "respuesta" }));
    }
    var rep = reportesDe("respuesta", r.id);
    if (admin && rep) actions.appendChild(el("span", "badge", rep + (rep === 1 ? " reporte" : " reportes")));
    if (admin) actions.appendChild(boton("sec", "ocultar", r.id, r.oculto ? "Volver a mostrar" : "Ocultar", { "data-tipo": "respuesta", "data-oculto": r.oculto ? "0" : "1" }));
    var det = el("details");
    det.appendChild(el("summary", "", "Reportar"));
    det.appendChild(bloqueReporte("respuesta", r.id));
    actions.appendChild(det);
    var puedeMarcar = estado.sesion && pregunta && (admin || estado.sesion.id === pregunta.autor) && !premio;
    if (puedeMarcar && !r.oculto) {
      var opta = puedeOptar(r, pregunta);
      if (!opta.ok && opta.motivo === "propia") actions.appendChild(el("span", "fine", "Tu respuesta no opta al premio."));
      else if (!opta.ok && opta.motivo === "corta") actions.appendChild(el("span", "fine", "Menos de 80 letras: no opta al premio."));
      else if (opta.ok) actions.appendChild(boton("gold", "valida", r.id, "Es la respuesta válida"));
    }
    art.appendChild(actions);
    if (esValida && premio.estado === "sin_premio") art.appendChild(el("p", "fine", "Respuesta válida. Sin premio: " + (premio.motivo || "tope del mes.")));
    if (esValida && estado.sesion && estado.sesion.id === premio.ganador && premio.estado === "pendiente") art.appendChild(formularioReclamo(premio));
    if (esValida && estado.sesion && estado.sesion.id === premio.ganador && premio.estado === "reclamado") art.appendChild(el("p", "fine", "Reclamación enviada. Un admin la aprueba antes de entregar nada."));
    if (esValida && estado.sesion && estado.sesion.id === premio.ganador && premio.estado === "aprobado") art.appendChild(el("p", "fine", "Aprobado. El premio concreto lo anuncia quien organiza. En la demo no se envía."));
    return art;
  }

  function formularioReclamo(premio) {
    var form = el("form", "qa-reclamo qa");
    form.setAttribute("data-id", premio.id);
    form.appendChild(el("p", "", "Reclamar: " + textoPremio()));
    form.appendChild(el("p", "fine", "Solo el nombre, el correo de tu cuenta y el país. El correo no se cambia aquí."));
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
    corIn.type = "email";
    corIn.readOnly = true;
    corIn.value = estado.sesion.correo || "";
    cor.appendChild(corIn);
    form.appendChild(cor);
    var pais = el("label", "", "País");
    var sel = el("select");
    sel.name = "pais";
    sel.required = true;
    ["", "México", "España", "Colombia", "Perú", "Argentina", "Estados Unidos", "Otro"].forEach(function (op) {
      var o = el("option", "", op || "Elige");
      o.value = op;
      sel.appendChild(o);
    });
    pais.appendChild(sel);
    form.appendChild(pais);
    var ok = el("label", "check");
    var box = el("input");
    box.type = "checkbox";
    box.name = "bases";
    box.required = true;
    ok.appendChild(box);
    ok.appendChild(document.createTextNode(" Acepto las bases, que aún son un borrador."));
    form.appendChild(ok);
    var go = el("button", "btn gold", "Enviar reclamación");
    go.type = "submit";
    form.appendChild(go);
    return form;
  }

  function pintaPregunta(p, admin) {
    var visibles = [];
    var ocultas = [];
    var i;
    for (i = 0; i < estado.respuestas.length; i++) {
      var r = estado.respuestas[i];
      if (r.pregunta !== p.id) continue;
      if (r.oculto) ocultas.push(r);
      else visibles.push(r);
    }
    visibles.sort(function (a, b) { return a.creado - b.creado; });
    var art = el("article", "qa-card" + (p.oculto ? " qa-oculto" : ""));
    art.id = "p-" + p.id;
    art.appendChild(el("h3", "", p.titulo));
    var meta = el("p", "qa-meta");
    meta.appendChild(el("strong", "", nombreDe(p.autor)));
    meta.appendChild(document.createTextNode(" · " + haceTexto(p.creado) + " · " + (p.votos || []).length + " votos"));
    var nv = visibles.length;
    meta.appendChild(document.createTextNode(nv === 0 ? " · sin respuestas" : " · " + nv + (nv === 1 ? " respuesta" : " respuestas")));
    if (p.oculto) meta.appendChild(document.createTextNode(" · oculto"));
    if (p.valida && premioActivo(estado.premios, p.id)) meta.appendChild(document.createTextNode(" · con respuesta válida"));
    art.appendChild(meta);
    art.appendChild(el("p", "", p.cuerpo));
    var actions = el("div", "qa-actions");
    if (!p.oculto) {
      var marcado = estado.sesion && (p.votos || []).indexOf(estado.sesion.id) !== -1;
      actions.appendChild(boton(marcado ? "gold" : "sec", "voto", p.id, (marcado ? "Votada · " : "Votar · ") + (p.votos || []).length, { "data-tipo": "pregunta" }));
    }
    var rep = reportesDe("pregunta", p.id);
    if (admin && rep) actions.appendChild(el("span", "badge", rep + (rep === 1 ? " reporte" : " reportes")));
    if (admin) actions.appendChild(boton("sec", "ocultar", p.id, p.oculto ? "Volver a mostrar" : "Ocultar", { "data-tipo": "pregunta", "data-oculto": p.oculto ? "0" : "1" }));
    var det = el("details");
    det.appendChild(el("summary", "", "Reportar"));
    det.appendChild(bloqueReporte("pregunta", p.id));
    actions.appendChild(det);
    art.appendChild(actions);

    var mostrar = abiertas[p.id] ? visibles : visibles.slice(0, 2);
    mostrar.forEach(function (r) { art.appendChild(pintaRespuesta(r, p, admin)); });
    if (!abiertas[p.id] && visibles.length > 2) {
      art.appendChild(boton("sec qa-mas", "mas", p.id, "Ver las otras " + (visibles.length - 2) + " respuestas"));
    }
    if (admin) ocultas.forEach(function (r) { art.appendChild(pintaRespuesta(r, p, admin)); });

    if (estado.sesion && !p.oculto) {
      var form = el("form", "qa-responder");
      form.setAttribute("data-id", p.id);
      var lab = el("label", "", "Tu respuesta");
      var ta = el("textarea");
      ta.name = "cuerpo";
      ta.required = true;
      ta.minLength = 8;
      ta.maxLength = 4000;
      ta.rows = 3;
      lab.appendChild(ta);
      form.appendChild(lab);
      form.appendChild(el("p", "fine", "Para el premio hacen falta al menos 80 letras. Responder tu propia pregunta no cuenta."));
      var go = el("button", "btn", "Publicar respuesta");
      go.type = "submit";
      form.appendChild(go);
      art.appendChild(form);
    } else if (!estado.sesion && !p.oculto) {
      art.appendChild(el("p", "fine", "Entra para responder."));
    }
    return art;
  }

  function pintar() {
    var admin = esAdmin();
    var demo = document.getElementById("qa-demo");
    if (demo) demo.hidden = !modoDemo();
    var entrar = document.getElementById("qa-entrar");
    var preguntar = document.getElementById("qa-preguntar");
    var ses = document.getElementById("qa-sesion");
    var hola = document.getElementById("qa-hola");
    if (estado.sesion) {
      entrar.hidden = true;
      preguntar.hidden = false;
      ses.hidden = false;
      hola.textContent = "Hola, " + estado.sesion.nombre + ".";
    } else {
      entrar.hidden = false;
      preguntar.hidden = true;
      ses.hidden = true;
    }
    document.getElementById("qa-entrar-demo").hidden = !modoDemo();
    document.getElementById("qa-entrar-correo").hidden = modoDemo();
    document.getElementById("qa-entrar-google").hidden = modoDemo();
    document.getElementById("qa-admin-fila").hidden = !modoDemo();
    document.getElementById("qa-admin-nota").hidden = !modoDemo();
    document.getElementById("qa-reset").hidden = !modoDemo();
    document.getElementById("qa-entrar-nota").textContent = modoDemo()
      ? "Demo: el nombre y el correo se quedan en este navegador. No se envían. Si escribes marta@ejemplo.test entras como Marta López."
      : "El correo sirve para entrar con Google o con un enlace. No se muestra junto a las preguntas.";

    document.querySelectorAll("[data-orden]").forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-orden") === orden ? "true" : "false");
    });

    var lista = document.getElementById("qa-lista");
    lista.textContent = "";
    var preguntas = estado.preguntas.filter(function (p) { return admin || !p.oculto; });
    ordenarPreguntas(preguntas, estado.respuestas, orden).forEach(function (p) {
      lista.appendChild(pintaPregunta(p, admin));
    });
    if (!lista.childNodes.length) lista.appendChild(el("p", "", "Todavía no hay preguntas."));

    var ol = document.getElementById("qa-ranking");
    ol.textContent = "";
    var nombrePremio = document.getElementById("qa-premio-nombre");
    if (nombrePremio) nombrePremio.textContent = textoPremio();
    pintarBanda();
    pintarCola(admin);

    ranking(estado.usuarios, estado.respuestas).forEach(function (r, i) {
      var li = el("li");
      li.appendChild(el("span", "qa-pos", String(i + 1)));
      var body = el("div");
      var nom = el("p", "qa-rank-nom");
      nom.appendChild(el("strong", "", r.nombre));
      nom.appendChild(document.createTextNode(" "));
      nom.appendChild(el("span", "badge " + r.insignia.clave, r.insignia.nombre));
      body.appendChild(nom);
      body.appendChild(el("p", "fine", r.respuestas + (r.respuestas === 1 ? " respuesta" : " respuestas") + " · " + r.utiles + " votos útiles"));
      li.appendChild(body);
      ol.appendChild(li);
    });
  }

  function estadoPremio(clave) {
    if (clave === "pendiente") return "Sin reclamar";
    if (clave === "reclamado") return "Reclamado, por aprobar";
    if (clave === "aprobado") return "Aprobado, sin entregar";
    if (clave === "sin_premio") return "Válida, sin premio";
    if (clave === "anulado") return "Anulado";
    return clave;
  }

  function pintarBanda() {
    var box = document.getElementById("qa-premio-banda");
    if (!box) return;
    box.textContent = "";
    if (!estado.sesion) { box.hidden = true; return; }
    var mios = (estado.premios || []).filter(function (p) {
      return p.ganador === estado.sesion.id && p.estado !== "anulado" && p.estado !== "sin_premio";
    });
    if (!mios.length) { box.hidden = true; return; }
    box.hidden = false;
    mios.forEach(function (p) {
      var pregunta = buscar(estado.preguntas, p.pregunta);
      var titulo = pregunta ? pregunta.titulo : "una pregunta";
      if (p.estado === "pendiente") {
        box.appendChild(el("p", "", "Tu respuesta en «" + titulo + "» es la primera válida. Puedes reclamar el premio."));
        box.appendChild(boton("gold", "ir", p.pregunta, "Ir a reclamar"));
      } else if (p.estado === "reclamado") {
        box.appendChild(el("p", "", "Reclamaste el premio de «" + titulo + "». Falta que un admin lo apruebe."));
      } else if (p.estado === "aprobado") {
        box.appendChild(el("p", "", "El premio de «" + titulo + "» está aprobado. En la demo no se envía."));
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
    var filas = estado.premios || [];
    if (!filas.length) {
      lista.appendChild(el("p", "", "No hay premios en la cola."));
      return;
    }
    filas.forEach(function (p) {
      var pregunta = buscar(estado.preguntas, p.pregunta);
      var item = el("article", "qa-cola-item");
      item.appendChild(el("h3", "", (pregunta && pregunta.titulo) || "Pregunta"));
      var meta = el("p", "qa-meta");
      meta.appendChild(document.createTextNode(nombreDe(p.ganador) + " · " + estadoPremio(p.estado)));
      if (p.reclamo && p.reclamo.pais) meta.appendChild(document.createTextNode(" · " + p.reclamo.pais));
      item.appendChild(meta);
      if (p.motivo) item.appendChild(el("p", "fine", p.motivo));
      var otras = senalCompartida(estado.usuarios, p.dispositivo, p.ganador);
      if (otras.length) {
        item.appendChild(el("p", "qa-senal", "Señal suave: el mismo aparato que " + otras.map(function (u) { return u.nombre; }).join(", ") + ". No basta para anular; míralo antes de aprobar."));
      }
      item.appendChild(el("p", "fine", "La IP no se lee en la demo. Con Supabase se guarda la de la petición, solo para esta cola."));
      if (p.estado !== "anulado") {
        var actions = el("div", "qa-actions");
        if (p.estado === "reclamado") actions.appendChild(boton("gold", "aprobar", p.id, "Aprobar"));
        var sel = el("select");
        sel.className = "qa-anular-motivo";
        ["Abuso o spam", "Cuenta repetida", "La respuesta no servía", "Otro"].forEach(function (op) {
          var o = el("option", "", op);
          o.value = op;
          sel.appendChild(o);
        });
        actions.appendChild(sel);
        actions.appendChild(boton("sec", "anular", p.id, "Anular premio"));
        item.appendChild(actions);
      }
      lista.appendChild(item);
    });
  }

  function normalizar(o) {
    o.usuarios = o.usuarios || [];
    o.preguntas = o.preguntas || [];
    o.respuestas = o.respuestas || [];
    o.reportes = o.reportes || [];
    o.premios = o.premios || [];
    o.ritmo = o.ritmo || ritmoVacio();
    ["pregunta", "respuesta", "reporte", "voto"].forEach(function (k) {
      if (!o.ritmo[k]) o.ritmo[k] = [];
    });
    return o;
  }

  function cargarDemo() {
    try {
      var raw = localStorage.getItem(CLAVE);
      if (raw) {
        var o = JSON.parse(raw);
        if (o && o.v === 2 && Array.isArray(o.preguntas) && Array.isArray(o.premios)) return normalizar(o);
      }
    } catch (e) {}
    return semilla();
  }

  function prepararClicks() {
    document.querySelectorAll("[data-orden]").forEach(function (b) {
      b.addEventListener("click", function () {
        orden = b.getAttribute("data-orden");
        pintar();
      });
    });
    document.getElementById("qa-lista").addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-acc]");
      if (!b) return;
      var acc = b.getAttribute("data-acc");
      var id = b.getAttribute("data-id");
      if (acc === "mas") { abiertas[id] = true; pintar(); return; }
      if (acc === "voto") { lanzar(function () { return alternarVoto(b.getAttribute("data-tipo"), id); }); return; }
      if (acc === "ocultar") {
        lanzar(function () { return ponerOculto(b.getAttribute("data-tipo"), id, b.getAttribute("data-oculto") === "1"); });
        return;
      }
      if (acc === "valida") { lanzar(function () { return marcarValida(id); }); return; }
      if (acc === "ir") {
        abiertas[id] = true;
        pintar();
        var destino = document.getElementById("p-" + id);
        if (destino) destino.scrollIntoView({ block: "start" });
      }
    });
    var banda = document.getElementById("qa-premio-banda");
    if (banda) banda.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-acc=ir]");
      if (!b) return;
      var id = b.getAttribute("data-id");
      abiertas[id] = true;
      pintar();
      var destino = document.getElementById("p-" + id);
      if (destino) destino.scrollIntoView({ block: "start" });
    });
    var cola = document.getElementById("qa-cola");
    if (cola) cola.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-acc]");
      if (!b) return;
      var id = b.getAttribute("data-id");
      if (b.getAttribute("data-acc") === "aprobar") lanzar(function () { return resolverPremio(id, "aprobar"); });
      if (b.getAttribute("data-acc") === "anular") {
        var item = b.closest(".qa-cola-item");
        var sel = item && item.querySelector("select");
        lanzar(function () { return resolverPremio(id, "anular", sel ? sel.value : ""); });
      }
    });
    document.getElementById("qa-lista").addEventListener("submit", function (ev) {
      var form = ev.target;
      if (form.classList.contains("qa-responder")) {
        ev.preventDefault();
        if (!exigirSesion()) return;
        var texto = form.querySelector("textarea").value;
        var id = form.getAttribute("data-id");
        lanzar(function () { return publicarRespuesta(id, texto); });
      }
      if (form.classList.contains("qa-reporte-form")) {
        ev.preventDefault();
        var sel = form.querySelector("select");
        lanzar(function () { return enviarReporte(form.getAttribute("data-tipo"), form.getAttribute("data-id"), sel.value); });
      }
      if (form.classList.contains("qa-reclamo")) {
        ev.preventDefault();
        var datos = new FormData(form);
        var acepta = !!form.querySelector("[name=bases]").checked;
        lanzar(function () { return reclamar(form.getAttribute("data-id"), datos.get("nombre"), datos.get("pais"), acepta); });
      }
    });
    document.getElementById("qa-entrar").addEventListener("submit", function (ev) {
      ev.preventDefault();
      var fd = new FormData(ev.target);
      if (modoDemo()) lanzar(function () { entrarDemo(fd.get("nombre"), fd.get("correo")); });
      else lanzar(function () { return entrarCorreo(fd.get("nombre"), fd.get("correo")); });
    });
    document.getElementById("qa-entrar-correo").addEventListener("click", function () {
      var f = document.getElementById("qa-entrar");
      lanzar(function () { return entrarCorreo(f.nombre.value, f.correo.value); });
    });
    document.getElementById("qa-entrar-google").addEventListener("click", function () {
      entrarGoogle(document.getElementById("qa-entrar").nombre.value);
    });
    document.getElementById("qa-preguntar").addEventListener("submit", function (ev) {
      ev.preventDefault();
      if (!exigirSesion()) return;
      lanzar(function () { return publicarPregunta(document.getElementById("qa-titulo").value, document.getElementById("qa-cuerpo").value); });
    });
    document.getElementById("qa-salir").addEventListener("click", function () {
      lanzar(function () { return salir(); });
    });
    var admin = document.getElementById("qa-admin");
    admin.addEventListener("change", function () {
      try { localStorage.setItem(CLAVE_ADMIN, admin.checked ? "1" : "0"); } catch (e) {}
      pintar();
    });
    document.getElementById("qa-reset").addEventListener("click", function () {
      if (!modoDemo()) return;
      try {
        localStorage.removeItem(CLAVE);
        localStorage.removeItem(CLAVE_ADMIN);
      } catch (e) {}
      admin.checked = false;
      estado = semilla();
      abiertas = {};
      orden = "nuevas";
      aviso("Volviste a los datos de ejemplo.", false);
      pintar();
    });
  }

  function iniciar() {
    prepararClicks();
    cfgNube = configNube();
    if (!cfgNube) {
      estado = cargarDemo();
      try { document.getElementById("qa-admin").checked = localStorage.getItem(CLAVE_ADMIN) === "1"; } catch (e) {}
      pintar();
      return;
    }
    estado = {
      v: 1,
      usuarios: [],
      sesion: null,
      esAdmin: false,
      preguntas: [],
      respuestas: [],
      reportes: [],
      ritmo: ritmoVacio(),
      token: leerHash() || leerToken()
    };
    if (estado.token) guardarToken(estado.token);
    aviso(estado.token ? "Entrando…" : "", false);
    refrescarNube().then(function () {
      aviso("", false);
      pintar();
    }).catch(function (e) {
      aviso(errorHumano(e), true);
      pintar();
    });
  }

  return {
    FILTRO: FILTRO,
    REGLAS: REGLAS,
    textoProhibido: textoProhibido,
    insignia: insignia,
    cupo: cupo,
    ordenarPreguntas: ordenarPreguntas,
    ranking: ranking,
    PREMIO: PREMIO,
    puedeOptar: puedeOptar,
    cupoPremio: cupoPremio,
    premioActivo: premioActivo,
    senalCompartida: senalCompartida,
    semilla: semilla,
    configNube: configNube,
    iniciar: iniciar
  };
});
