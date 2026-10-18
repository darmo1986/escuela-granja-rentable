/* Registro de pollos en el navegador. Datos en localStorage. */
(function () {
  var KEY = "gr_pollos_v1";
  var TEMA = "gr_pollos_tema";
  /* Ross 308/308 FF, as-hatched, Aviagen 2022. Índice = día (0–56).
     El día 1 no trae consumo diario; se usa el acumulado, 12 g.
     Algún día difiere 1 g del acumulado: así viene redondeada la tabla. */
  var ROSS_PESO = [44,62,81,102,125,151,181,213,249,288,330,376,425,477,533,592,655,720,789,860,935,1012,1092,1174,1258,1345,1434,1524,1616,1710,1805,1901,1999,2097,2196,2296,2396,2496,2597,2697,2798,2898,2998,3097,3197,3295,3393,3490,3586,3681,3776,3869,3961,4052,4142,4230,4318];
  var ROSS_CONS = [0,12,16,20,24,27,31,35,39,44,48,52,57,62,67,72,77,83,88,94,100,105,111,117,122,128,134,139,145,150,156,161,166,171,176,180,185,189,193,197,201,204,207,211,213,216,219,221,223,225,227,229,230,231,233,233,234];
  var RAZAS = [
    ["ross308", "Ross 308"],
    ["cobb500", "Cobb 500"],
    ["arbor", "Arbor Acres Plus"],
    ["indian", "Indian River"],
    ["hubbard", "Hubbard"],
    ["otra", "Otra estirpe de engorde"]
  ];
  var MESES = ["enero","febrero","marzo","abril","mayo","junio","julio","agosto","septiembre","octubre","noviembre","diciembre"];

  function esPremium() {
    try {
      if (window.GR && window.GR.premium === true) return true;
      if (window.GRAuth && typeof GRAuth.premium === "function" && GRAuth.premium()) return true;
      if (localStorage.getItem("gr_premium") !== "si") return false;
      var hasta = localStorage.getItem("gr_premium_hasta");
      if (!hasta) return true;
      var t = Date.parse(hasta);
      return !isNaN(t) && t > Date.now();
    } catch (e) { return false; }
  }
  function apagarAnuncios() {
    if (!esPremium()) return;
    window.ads = window.ads || {};
    window.ads.activo = false;
    if (document.querySelectorAll) {
      document.querySelectorAll(".ad-inline").forEach(function (el) { el.remove(); });
    }
  }
  apagarAnuncios();

  function vacio() { return { version: 1, activo: null, lotes: [] }; }
  var avisoCarga = "";
  function cargar() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { return vacio(); }
    if (!raw) return vacio();
    var d;
    try { d = JSON.parse(raw); }
    catch (e) {
      try { localStorage.setItem(KEY + "_corrupto", raw); } catch (e2) {}
      avisoCarga = "Había una copia dañada. La apartamos en este navegador y empezamos de cero. Si tienes un JSON exportado, impórtalo.";
      return vacio();
    }
    if (!d || !Array.isArray(d.lotes)) {
      try { localStorage.setItem(KEY + "_corrupto", raw); } catch (e2) {}
      avisoCarga = "Había una copia dañada. La apartamos en este navegador y empezamos de cero. Si tienes un JSON exportado, impórtalo.";
      return vacio();
    }
    var lotes = [];
    var mal = 0;
    d.lotes.forEach(function (l) {
      var s = sanearLote(l);
      if (!s) { mal++; return; }
      mal += s._malos || 0;
      delete s._malos;
      lotes.push(s);
    });
    if (mal) avisoCarga = "Había datos que no cuadraban y no se mostraron. Si tienes un JSON exportado, puedes compararlo.";
    var activo = idOk(d.activo) && lotes.some(function (l) { return l.id === d.activo; }) ? d.activo : (lotes[0] ? lotes[0].id : null);
    return { version: 1, activo: activo, lotes: lotes };
  }
  var store = cargar();
  var vista = "lista";
  var paso = 0;
  var borrador = {};
  var error = avisoCarga;

  function guardar() {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
      return true;
    } catch (e) {
      error = "No se pudo guardar: el navegador no tiene espacio. Exporta una copia y borra lotes viejos.";
      return false;
    }
  }
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function num(n, d) {
    if (n == null || isNaN(n)) return "";
    var s = Number(n).toFixed(d == null ? 0 : d);
    var p = s.split(".");
    var sign = "";
    if (p[0].charAt(0) === "-") { sign = "-"; p[0] = p[0].slice(1); }
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return sign + (p.length > 1 ? p[0] + "," + p[1] : p[0]);
  }
  function hoyISO() {
    var d = new Date();
    return d.getFullYear() + "-" + dos(d.getMonth() + 1) + "-" + dos(d.getDate());
  }
  function dos(n) { return (n < 10 ? "0" : "") + n; }
  function parseISO(s) {
    var p = String(s || "").split("-");
    if (p.length < 3) return NaN;
    return Date.UTC(+p[0], +p[1] - 1, +p[2]);
  }
  function diasEntre(a, b) { return Math.round((parseISO(b) - parseISO(a)) / 86400000); }
  function fechaTexto(iso) {
    var p = String(iso || "").split("-");
    if (p.length < 3 || !MESES[+p[1] - 1]) return iso || "";
    return (+p[2]) + " de " + MESES[+p[1] - 1] + " de " + p[0];
  }
  function leerNum(v) {
    if (v == null) return null;
    var raw = String(v).trim().replace(/\s/g, "");
    if (!raw) return null;
    if (/[eE]/.test(raw)) return NaN;
    var milesPunto = /^[-+]?\d{1,3}(?:\.\d{3})+(?:,\d+)?$/;
    var milesComa = /^[-+]?\d{1,3}(?:,\d{3})+(?:\.\d+)?$/;
    var simple = /^[-+]?\d+(?:[.,]\d+)?$/;
    if (!milesPunto.test(raw) && !milesComa.test(raw) && !simple.test(raw)) return NaN;
    var s = raw;
    var ultimaComa = s.lastIndexOf(",");
    var ultimoPunto = s.lastIndexOf(".");
    if (ultimaComa >= 0 && ultimoPunto >= 0) {
      if (ultimaComa > ultimoPunto) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
    } else if (ultimaComa >= 0) s = s.replace(",", ".");
    var n = Number(s);
    return isNaN(n) ? NaN : n;
  }
  function fechaOk(s) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(s || "")) && !isNaN(parseISO(s));
  }
  function idOk(s) { return /^[\w-]{1,40}$/.test(String(s || "")); }
  function sanearRegistro(r) {
    if (!r || typeof r !== "object" || Array.isArray(r)) return null;
    if (!idOk(r.id) || !fechaOk(r.fecha)) return null;
    var dia = leerNum(r.dia);
    if (dia == null || isNaN(dia) || dia !== Math.round(dia) || dia < 0 || dia > 400) return null;
    var peso = r.pesoG == null || r.pesoG === "" ? null : leerNum(r.pesoG);
    var pienso = r.piensoKg == null || r.piensoKg === "" ? null : leerNum(r.piensoKg);
    var agua = r.aguaL == null || r.aguaL === "" ? null : leerNum(r.aguaL);
    var bajas = r.bajas == null || r.bajas === "" ? 0 : leerNum(r.bajas);
    if (peso != null && (isNaN(peso) || peso < 0)) return null;
    if (pienso != null && (isNaN(pienso) || pienso < 0)) return null;
    if (agua != null && (isNaN(agua) || agua < 0)) return null;
    if (bajas == null || isNaN(bajas) || bajas < 0 || bajas !== Math.round(bajas)) return null;
    return {
      id: String(r.id),
      tipo: r.tipo === "semana" ? "semana" : "dia",
      dia: dia,
      fecha: String(r.fecha),
      pesoG: peso,
      piensoKg: pienso,
      aguaL: agua,
      bajas: bajas
    };
  }
  function sanearLote(l) {
    if (!l || typeof l !== "object" || Array.isArray(l)) return null;
    if (!idOk(l.id) || !fechaOk(l.entrada)) return null;
    var aves = leerNum(l.aves);
    if (aves == null || isNaN(aves) || aves !== Math.round(aves) || aves < 1 || aves > 200000) return null;
    var tolvas = l.tolvas == null || l.tolvas === "" ? null : leerNum(l.tolvas);
    var tolvaKg = l.tolvaKg == null || l.tolvaKg === "" ? null : leerNum(l.tolvaKg);
    var m2 = l.m2 == null || l.m2 === "" ? null : leerNum(l.m2);
    if (tolvas != null && (isNaN(tolvas) || tolvas < 0)) return null;
    if (tolvaKg != null && (isNaN(tolvaKg) || tolvaKg < 0)) return null;
    if (m2 != null && (isNaN(m2) || m2 < 0)) return null;
    var registros = [];
    var malos = 0;
    (Array.isArray(l.registros) ? l.registros : []).forEach(function (r) {
      var s = sanearRegistro(r);
      if (s) registros.push(s); else malos++;
    });
    var nombre = String(l.nombre == null ? "" : l.nombre);
    if (/^'[=+\-@]/.test(nombre)) nombre = nombre.slice(1);
    nombre = nombre.slice(0, 60).trim();
    return {
      id: String(l.id),
      nombre: nombre || "Lote",
      entrada: String(l.entrada),
      aves: aves,
      raza: String(l.raza || "ross308").slice(0, 40),
      tolvas: tolvas,
      tolvaKg: tolvaKg,
      m2: m2,
      registros: registros,
      _malos: malos
    };
  }
  function idNuevo() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function nombreRaza(id) {
    for (var i = 0; i < RAZAS.length; i++) if (RAZAS[i][0] === id) return RAZAS[i][1];
    return id || "Engorde";
  }
  function loteActivo() {
    for (var i = 0; i < store.lotes.length; i++) {
      if (store.lotes[i] && store.lotes[i].id === store.activo) return store.lotes[i];
    }
    return null;
  }
  function guiaPeso(dia) {
    if (dia < 0 || dia >= ROSS_PESO.length) return null;
    return ROSS_PESO[dia];
  }
  function guiaCons(dia) {
    if (dia < 0 || dia >= ROSS_CONS.length) return null;
    return ROSS_CONS[dia];
  }
  function tempRoss(dia) {
    if (dia < 3) return 30;
    if (dia < 6) return 28;
    if (dia < 9) return 27;
    if (dia < 12) return 26;
    if (dia < 15) return 25;
    if (dia < 18) return 24;
    if (dia < 21) return 23;
    if (dia < 24) return 22;
    if (dia < 27) return 21;
    return 20;
  }
  function fasePienso(dia) {
    if (dia <= 10) return "Arranque, días 0 a 10: 23 % de proteína, migaja (Ross 308).";
    if (dia <= 24) return "Crecimiento, días 11 a 24: 21,5 % de proteína, gránulo (Ross 308).";
    return "Acabado, del día 25 en adelante: 19,5 % de proteína, gránulo (Ross 308).";
  }
  function regs(lote) {
    var lista = lote && Array.isArray(lote.registros) ? lote.registros : [];
    return lista.slice().sort(function (a, b) { return a.dia - b.dia; });
  }
  function avesVivas(lote, antesDeDia) {
    var b = 0;
    regs(lote).forEach(function (r) {
      if (antesDeDia == null || r.dia < antesDeDia) b += (+r.bajas || 0);
    });
    return Math.max(0, (+lote.aves || 0) - b);
  }
  function textoTolvas(n) {
    n = +n;
    return num(n) + (n === 1 ? " tolva" : " tolvas");
  }
  function gmdDe(lote, up) {
    if (!up || up.pesoG == null) return null;
    var prev = null;
    regs(lote).forEach(function (r) {
      if (r.dia < up.dia && r.pesoG != null) prev = r;
    });
    if (prev) {
      var entre = up.dia - prev.dia;
      if (entre <= 0) return null;
      return (up.pesoG - prev.pesoG) / entre;
    }
    if (!(up.dia > 0)) return null;
    return (up.pesoG - 44) / up.dia;
  }
  function icaDe(lote, up) {
    if (!up || !(up.pesoG > 0)) return null;
    var pienso = 0;
    var hay = false;
    regs(lote).forEach(function (r) {
      if (r.piensoKg != null && !isNaN(r.piensoKg)) { pienso += +r.piensoKg; hay = true; }
    });
    if (!hay || !(pienso > 0)) return null;
    var vivas = avesVivas(lote);
    var ganado = vivas * (up.pesoG / 1000) - (+lote.aves || 0) * 0.044;
    if (!(ganado > 0)) return null;
    return pienso / ganado;
  }
  function ultimoPeso(lote) {
    var list = regs(lote);
    for (var i = list.length - 1; i >= 0; i--) if (list[i].pesoG != null) return list[i];
    return null;
  }
  function nivelPeso(real, guia) {
    if (guia == null || real == null) return null;
    var r = real / guia;
    if (r >= 0.9) return "verde";
    if (r >= 0.8) return "ambar";
    return "rojo";
  }
  function textoNivel(n) {
    if (n === "verde") return "Verde · va bien";
    if (n === "ambar") return "Ámbar · un poco por debajo";
    return "Rojo · muy por debajo";
  }

  function aplicarTema() {
    var t = "";
    try { t = localStorage.getItem(TEMA) || ""; } catch (e) {}
    var oscuro = t === "oscuro" || (!t && window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
    document.body.classList.toggle("pollos-oscuro", !!oscuro);
  }
  function alternarTema() {
    var oscuro = document.body.classList.contains("pollos-oscuro");
    try { localStorage.setItem(TEMA, oscuro ? "claro" : "oscuro"); } catch (e) {}
    aplicarTema();
    pintar();
  }

  function barra() {
    var oscuro = document.body.classList.contains("pollos-oscuro");
    return '<div class="pollos-acciones">' +
      (vista === "lista" ? "" : '<button type="button" class="btn sec" id="btn-lotes">Ver lotes</button>') +
      '<button type="button" class="btn gold" id="btn-nuevo">Nuevo lote</button>' +
      '<button type="button" class="btn sec" id="btn-tema">' + (oscuro ? "Modo claro" : "Modo oscuro") + "</button>" +
      "</div>";
  }
  function cajaError() {
    return '<p class="pollos-error" id="pollos-error" role="alert">' + esc(error) + "</p>";
  }

  function htmlLista() {
    var h = barra() + cajaError() + "<h2>Tus lotes</h2>";
    if (!store.lotes.length) {
      h += '<p class="panel">Todavía no hay lotes. Crea el primero: fecha de entrada, cuántas aves y la raza.</p>';
      return h + htmlCopia();
    }
    h += '<ul class="pollos-regs">';
    store.lotes.forEach(function (l) {
      h += "<li><strong>" + esc(l.nombre) + "</strong><br>" + esc(fechaTexto(l.entrada)) +
        " · " + num(avesVivas(l)) + " aves vivas · " + esc(nombreRaza(l.raza)) +
        '<div class="pollos-acciones"><button type="button" class="btn" data-abrir="' + esc(l.id) + '">Abrir</button></div></li>';
    });
    h += "</ul>" + htmlCopia();
    return h;
  }

  function htmlNuevo() {
    var titulos = ["¿Cuándo entraron?", "¿Cuántas aves?", "¿Qué raza o estirpe?", "Tolvas y espacio"];
    var h = '<p class="fine">Paso ' + (paso + 1) + " de 4. " + esc(titulos[paso]) + "</p><div class=\"panel\">";
    if (paso === 0) {
      h += '<label>Fecha de entrada<input id="f-fecha" type="date" required value="' + esc(borrador.entrada || hoyISO()) + '"></label>';
      h += '<p class="note">Sugerida: hoy. Si llegaron antes, cambia el día.</p>';
    } else if (paso === 1) {
      h += '<label>Número de aves<input id="f-aves" type="text" inputmode="numeric" autocomplete="off" required value="' + esc(borrador.aves || "20") + '"></label>';
      h += '<p class="note">Sugerido: 20, el ejemplo de un patio en la ficha de la app. Pon las que entraron de verdad.</p>';
    } else if (paso === 2) {
      h += '<label>Raza o estirpe<select id="f-raza">';
      RAZAS.forEach(function (r) {
        h += '<option value="' + r[0] + '"' + (borrador.raza === r[0] ? " selected" : "") + ">" + esc(r[1]) + "</option>";
      });
      h += "</select></label>";
      h += '<p class="note">La curva día a día de esta página es Ross 308 (Aviagen, 2022). Si eliges otra estirpe, la gráfica sirve de orientación. Cobb 500, en la lección L01, se cita con unos 2,2 kg al día 35 y unos 2,9 kg al día 42: son cifras de catálogo, no una tabla diaria.</p>';
    } else {
      var aves = parseInt(borrador.aves, 10) || 0;
      var sug = aves > 0 ? Math.ceil(aves / 70) : "";
      if (!borrador.tolvas && sug) borrador.tolvas = String(sug);
      h += '<label>Nombre del lote<input id="f-nombre" maxlength="60" value="' + esc(borrador.nombre || "") + '" placeholder="Si lo dejas vacío, se arma con la fecha"></label>';
      h += '<label>Tolvas<input id="f-tolvas" type="text" inputmode="numeric" autocomplete="off" value="' + esc(borrador.tolvas || "") + '"></label>';
      h += '<p class="note">Sugeridas: ' + esc(sug || "—") + ". La lección L04A usa 70 pollos por tolva. Llénalas de un tercio a la mitad, nunca vacías.</p>";
      h += '<label>Kilos que caben en una tolva<input id="f-tolva" type="text" inputmode="decimal" autocomplete="off" value="' + esc(borrador.tolvaKg || "") + '" placeholder="Opcional, para calcular la media carga"></label>';
      h += '<label>Metros cuadrados del galpón<input id="f-m2" type="text" inputmode="decimal" autocomplete="off" value="' + esc(borrador.m2 || "") + '" placeholder="Opcional"></label>';
      h += '<p class="note">Si anotas los m², se avisa al pasar de 33 kg/m² (Directiva 2007/43/CE y RD 692/2010).</p>';
    }
    h += cajaError();
    h += '<div class="pollos-acciones">';
    h += '<button type="button" class="btn sec" id="btn-cancelar">Cancelar</button>';
    if (paso > 0) h += '<button type="button" class="btn sec" id="btn-atras">Atrás</button>';
    if (paso < 3) h += '<button type="button" class="btn gold" id="btn-siguiente">Siguiente</button>';
    else h += '<button type="button" class="btn gold" id="btn-guardar-lote">Guardar lote</button>';
    h += "</div></div>";
    return h;
  }

  function marcaGuia(n) {
    if (n == null || isNaN(n)) return "";
    return String(Math.round(n * 1000) / 1000).replace(".", ",");
  }
  function sugerencias(lote) {
    var vacioSug = { dia: 0, peso: "", pienso: "", agua: "", kg: 0 };
    if (!lote) return vacioSug;
    var dia = diasEntre(lote.entrada, borrador.fecha || hoyISO());
    if (isNaN(dia) || dia < 0) return vacioSug;
    var vivas = avesVivas(lote, dia);
    var peso = "";
    var g = guiaPeso(dia);
    if (g != null) peso = String(g);
    var diasPeriodo = borrador.tipo === "semana" ? Math.min(7, dia + 1) : 1;
    var desde = borrador.tipo === "semana" ? Math.max(0, dia - diasPeriodo + 1) : dia;
    var suma = 0;
    var ok = true;
    for (var d = desde; d <= dia; d++) {
      var c = guiaCons(d);
      if (c == null) { ok = false; break; }
      suma += c;
    }
    var kg = 0;
    var pienso = "";
    if (ok && vivas > 0 && suma > 0) {
      kg = Math.round(vivas * suma / 10) / 100;
      pienso = marcaGuia(kg);
    }
    var base = (borrador.pienso === "" || borrador.pienso == null) ? kg : leerNum(borrador.pienso);
    var agua = base > 0 ? marcaGuia(Math.round(base * 1.7 * 10) / 10) : "";
    return { dia: dia, peso: peso, pienso: pienso, agua: agua, kg: kg };
  }

  function htmlAnotar() {
    var lote = loteActivo();
    var titulos = ["¿Qué día anotas?", "Peso medio", "Alimento (pienso)", "Agua", "Bajas"];
    var sug = sugerencias(lote);
    var dia = sug.dia;
    var h = '<p class="fine">Paso ' + (paso + 1) + " de 5. " + esc(titulos[paso]) + "</p><div class=\"panel\">";
    if (paso === 0) {
      h += '<label>Periodo<select id="f-tipo"><option value="dia"' + (borrador.tipo !== "semana" ? " selected" : "") + '>Un día</option><option value="semana"' + (borrador.tipo === "semana" ? " selected" : "") + ">Una semana</option></select></label>";
      h += '<label>Fecha del pesaje<input id="f-fecha-reg" type="date" required value="' + esc(borrador.fecha || hoyISO()) + '"></label>';
      h += '<p class="note">La edad se cuenta desde la entrada (' + esc(lote ? fechaTexto(lote.entrada) : "") + ").</p>";
    } else if (paso === 1) {
      var gp = guiaPeso(dia);
      h += '<label>Peso medio, en gramos<input id="f-peso" type="text" inputmode="decimal" autocomplete="off" required value="' + esc(borrador.peso || "") + '" placeholder="' + esc(sug.peso) + '"></label>';
      h += '<p class="note">Sugerido: ' + (gp == null ? "la guía Ross llega al día 56. A partir de ahí no hay cifra publicada." : num(gp) + " g, el objetivo Ross 308 as-hatched del día " + dia + ". Es una guía: no se guarda si no la escribes.") + "</p>";
    } else if (paso === 2) {
      h += '<label>Alimento (pienso) del periodo, en kilos<input id="f-pienso" type="text" inputmode="decimal" autocomplete="off" value="' + esc(borrador.pienso || "") + '" placeholder="' + esc(sug.pienso) + '"></label>';
      h += '<p class="note">Sugerido con el consumo diario de la guía Ross, por ave viva. Si no lo mediste, déjalo en blanco: el texto gris no se guarda.</p>';
    } else if (paso === 3) {
      h += '<label>Agua del periodo, en litros<input id="f-agua" type="text" inputmode="decimal" autocomplete="off" value="' + esc(borrador.agua || "") + '" placeholder="' + esc(sug.agua) + '"></label>';
      h += '<p class="note">Sugerido: 1,7 L por kilo de alimento (pienso), el punto medio de 1,6–1,8 L/kg a 21 °C (L04A). Si no la mediste, déjala en blanco.</p>';
    } else {
      h += '<label>Bajas de este periodo<input id="f-bajas" type="text" inputmode="numeric" autocomplete="off" value="' + esc(borrador.bajas || "0") + '"></label>';
      h += '<p class="note">Sugerido: 0. No puede ser mayor que las aves que seguían vivas.</p>';
    }
    h += cajaError();
    h += '<div class="pollos-acciones">';
    h += '<button type="button" class="btn sec" id="btn-cancelar">Cancelar</button>';
    if (paso > 0) h += '<button type="button" class="btn sec" id="btn-atras">Atrás</button>';
    if (paso < 4) h += '<button type="button" class="btn gold" id="btn-siguiente">Siguiente</button>';
    else h += '<button type="button" class="btn gold" id="btn-guardar-registro">Guardar registro</button>';
    h += "</div></div>";
    return h;
  }

  function erroresEdad(dia) {
    var t = tempRoss(dia);
    if (dia < 7) return {
      titulo: "Semana 1 · errores que evitar",
      items: [
        "Precalienta: el aire el día 0 es 30 °C en la curva Ross (L04A). Hoy, con " + dia + " días, la curva marca " + t + " °C.",
        "Mira el buche: 75 % lleno a las 2 horas y más del 95 % a las 24 horas.",
        "Pienso y agua a 2 metros o menos. Papel en al menos el 70 % del área el día de llegada.",
        "No dejes la cama mojada. Humedad relativa 60–70 % los días 0 a 3.",
        "Llena la tolva solo de un tercio a la mitad. No la dejes vacía."
      ]
    };
    if (dia < 14) return {
      titulo: "Semana 2 · errores que evitar",
      items: [
        "El día 7 el peso debería ser al menos 4,5 veces el de llegada. En la guía Ross la llegada son 44 g.",
        "No te quedes en 30 °C. Hoy la curva marca " + t + " °C.",
        "Desde el día 7, deja oscuridad. En la UE, al menos 6 horas, 4 de ellas seguidas.",
        "Tolva con el borde a la altura del lomo, de un tercio a media carga.",
        "Pesa el lote. Un lote sin pesaje no se puede comparar con la guía."
      ]
    };
    if (dia < 21) return {
      titulo: "Semana 3 · errores que evitar",
      items: [
        "Hoy la curva de temperatura marca " + t + " °C. Amontonados es frío; jadeo en los bordes es calor.",
        fasePienso(dia),
        "Agua: 1,6 a 1,8 litros por kilo de pienso a 21 °C. Si hace más calor, la lección suma 6,5 % por cada grado.",
        "No pases de 33 kg/m² si anotaste los metros (Directiva 2007/43/CE).",
        "Tolvas a media carga. Vacía o llena del todo, las dos fallan."
      ]
    };
    if (dia < 28) return {
      titulo: "Semana 4 · errores que evitar",
      items: [
        "Hoy la curva marca " + t + " °C. Del día 27 en adelante se queda en 20 °C.",
        fasePienso(dia),
        "70 pollos por tolva. Si hay más, falta comedero.",
        "Prueba del puñado: si la cama se queda hecha bola, está húmeda.",
        "Sigue pesando cada semana."
      ]
    };
    return {
      titulo: "De la semana 5 en adelante · errores que evitar",
      items: [
        "Si ya pasaste el día 27, la curva Ross se queda en 20 °C.",
        "No dejes las tolvas vacías ni llenas del todo: de un tercio a la mitad.",
        "Antes del sacrificio, ayuno de 8 a 12 horas. Nunca más de 12. Agua hasta la carga.",
        "33 kg/m² es la base de la norma. 42 kg/m² es el techo y solo con condiciones extra.",
        "La guía Ross 2022 marca 2.296 g el día 35 y 2.998 g el día 42. Los ~2,2 kg y ~2,9 kg de L01 son de catálogo, no esta curva."
      ]
    };
  }

  function alertasDe(lote) {
    var out = [];
    var edad = diasEntre(lote.entrada, hoyISO());
    var vivas = avesVivas(lote);
    var up = ultimoPeso(lote);
    if (up && guiaPeso(up.dia) != null) {
      var guia = guiaPeso(up.dia);
      var niv = nivelPeso(up.pesoG, guia);
      var pct = Math.round(up.pesoG / guia * 100);
      if (niv === "ambar" || niv === "rojo") {
        out.push({
          nivel: niv,
          titulo: textoNivel(niv),
          detalle: "Día " + up.dia + ": " + num(up.pesoG) + " g reales, guía Ross " + num(guia) + " g (" + pct + " % de la guía).",
          que: "Revisa que estén comiendo: buche, tolva a media carga y no vacía, y la temperatura de la curva (" + tempRoss(up.dia) + " °C a esta edad). Revisa también el agua. Si siguen por debajo, llama al veterinario. Esto no es un diagnóstico."
        });
      }
    }
    if (edad >= 7) {
      var d7 = null;
      regs(lote).forEach(function (r) {
        if (r.dia >= 6 && r.dia <= 8 && r.pesoG != null) {
          if (!d7 || Math.abs(r.dia - 7) < Math.abs(d7.dia - 7)) d7 = r;
        }
      });
      var meta = 4.5 * 44;
      if (!d7) {
        out.push({
          nivel: "ambar",
          titulo: "Falta el pesaje del día 7",
          detalle: "La lección L04A pide un peso a los 7 días de al menos 4,5 veces el de llegada. En la guía Ross la llegada son 44 g, así que el suelo es " + num(meta) + " g. Vale un pesaje del día 6, 7 u 8.",
          que: "Pesa hoy, aunque ya pasaron los 7 días, y anótalo con la fecha real. El arranque se juega con calor (30 °C el día 0), alimento cerca y agua."
        });
      } else if (d7.pesoG < meta) {
        out.push({
          nivel: "ambar",
          titulo: "El peso del día " + d7.dia + " quedó por debajo de 4,5 veces el de llegada",
          detalle: "Anotaste " + num(d7.pesoG) + " g. 4,5 × 44 g de la guía Ross son " + num(meta) + " g.",
          que: "No recuperes a la fuerza con un cambio brusco. Revisa temperatura, tolva y agua, y coméntalo con el veterinario si el lote no reacciona."
        });
      }
      if (+lote.aves > 0) {
        var bajas7 = 0;
        regs(lote).forEach(function (r) { if (r.dia <= 8) bajas7 += (+r.bajas || 0); });
        var pm = bajas7 / +lote.aves * 100;
        if (pm > 1) {
          out.push({
            nivel: "ambar",
            titulo: "Mortalidad por encima del 1 % en la primera semana",
            detalle: "Hasta el día 8 se anotaron " + num(bajas7) + " bajas, el " + num(pm, 1) + " % de las " + num(lote.aves) + " de entrada. Cobb 2021, igual que la app, usa el 1 % a los 7 días como aviso.",
            que: "Revisa calor, agua y si el arranque fue parejo. Si la mortalidad sigue, llama al veterinario. Esto no es un diagnóstico."
          });
        }
      }
    }
    var agua = null;
    regs(lote).forEach(function (r) { if (r.aguaL != null && r.piensoKg > 0) agua = r; });
    if (agua) {
      var ratio = agua.aguaL / agua.piensoKg;
      if (ratio < 1.6 || ratio > 1.8) {
        out.push({
          nivel: "ambar",
          titulo: "Agua fuera de 1,6–1,8 L por kilo",
          detalle: "En el día " + agua.dia + " salen " + num(ratio, 2) + " L de agua por kilo de pienso. La lección, a 21 °C, marca 1,6 a 1,8.",
          que: "Revisa fugas, bebederos secos y si el galpón está más caliente: la lección suma 6,5 % de agua por cada grado por encima de 21 °C. No inventes un tratamiento."
        });
      }
    }
    if (+lote.tolvas > 0 && vivas / +lote.tolvas > 70) {
      out.push({
        nivel: "ambar",
        titulo: "Hay más de 70 aves por tolva",
        detalle: num(vivas) + " aves vivas y " + textoTolvas(lote.tolvas) + ": tocan " + num(vivas / lote.tolvas, 0) + " por tolva. L04A usa 70.",
        que: "Añade comederos. Mientras tanto, no dejes la tolva vacía ni la llenes más de la mitad."
      });
    }
    if (+lote.m2 > 0 && up && up.pesoG) {
      var kgm = vivas * up.pesoG / 1000 / +lote.m2;
      if (kgm > 33) {
        out.push({
          nivel: kgm > 42 ? "rojo" : "ambar",
          titulo: kgm > 42 ? "Pasaste el techo de 42 kg/m²" : "Pasaste 33 kg/m²",
          detalle: "Con el último peso salen " + num(kgm, 1) + " kg/m². La norma pone 33 kg/m², 39 con condiciones y 42 solo si además la mortalidad es baja.",
          que: "Da más espacio o saca aves a otro corral. 42 kg/m² no es una meta: es el techo de la Directiva 2007/43/CE cuando se cumplen otras condiciones."
        });
      }
    }
    return out;
  }

  function htmlTolvas(lote) {
    var vivas = avesVivas(lote);
    var edad = Math.max(0, diasEntre(lote.entrada, hoyISO()));
    var g = guiaCons(Math.min(56, edad));
    var h = '<section class="panel pollos-card"><h2>Tolvas a media carga</h2>';
    h += "<p>Llena las tolvas solo hasta la mitad y no las dejes vacías. La lección L04A dice de un tercio a un medio, con el borde a la altura del lomo.</p>";
    var n = +lote.tolvas || 0;
    var kg = +lote.tolvaKg || 0;
    if (n > 0) h += "<p>Para " + num(lote.aves) + " aves de entrada, 70 por tolva dan " + textoTolvas(Math.ceil(lote.aves / 70)) + ". Anotaste " + textoTolvas(n) + ".</p>";
    else h += "<p>Si anotas cuántas tolvas hay, se avisa al pasar de 70 aves por tolva.</p>";
    if (kg > 0 && n > 0 && vivas > 0 && g > 0) {
      var media = kg * n * 0.5;
      var alDia = vivas * g / 1000;
      var dias = media / alDia;
      h += "<p>Media carga: " + num(media, 1) + " kg en total. Con el consumo del día " + Math.min(56, edad) + " de la guía (" + num(g) + " g por ave) y " + num(vivas) + " aves vivas, esa media carga dura unos <strong>" + num(dias, 1) + " días</strong>.</p>";
    } else if (!(kg > 0)) {
      h += "<p>Para calcular los días de media carga, anota cuántos kilos caben en una tolva. No uso una capacidad inventada.</p>";
    } else if (!(g > 0)) {
      h += "<p>La guía no publica consumo el día 0. Desde el día 1 son 12 g por ave.</p>";
    }
    h += '<label>Kilos de una tolva<input id="f-tolva-kg" type="text" inputmode="decimal" autocomplete="off" value="' + esc(lote.tolvaKg || "") + '"></label>';
    h += '<label>Número de tolvas<input id="f-tolvas-lote" type="text" inputmode="numeric" autocomplete="off" value="' + esc(lote.tolvas || "") + '"></label>';
    h += '<div class="pollos-acciones"><button type="button" class="btn" id="btn-guardar-tolva">Guardar tolvas</button></div></section>';
    return h;
  }

  function htmlLote() {
    var lote = loteActivo();
    if (!lote) return htmlLista();
    var edad = diasEntre(lote.entrada, hoyISO());
    var up = ultimoPeso(lote);
    var guia = up ? guiaPeso(up.dia) : null;
    var niv = up && guia != null ? nivelPeso(up.pesoG, guia) : null;
    var h = barra() + cajaError();
    h += "<h2>" + esc(lote.nombre) + "</h2>";
    var bajasTot = 0;
    regs(lote).forEach(function (r) { bajasTot += (+r.bajas || 0); });
    var mort = +lote.aves > 0 ? bajasTot / +lote.aves * 100 : 0;
    var gmd = gmdDe(lote, up);
    var ica = icaDe(lote, up);
    h += '<p class="fine">Entrada ' + esc(fechaTexto(lote.entrada)) + " · " + num(lote.aves) + " aves al entrar · " + num(avesVivas(lote)) + " vivas · mortalidad " + num(mort, 1) + " % · " + esc(nombreRaza(lote.raza)) + " · día " + (isNaN(edad) ? "—" : edad) + "</p>";
    if (gmd != null || ica != null) {
      h += '<p class="fine">';
      if (gmd != null) h += "Ganancia diaria " + num(gmd, 1) + " g";
      if (gmd != null && ica != null) h += " · ";
      if (ica != null) h += "ICA " + num(ica, 2);
      h += ". La ganancia sale del último pesaje. El ICA es el alimento (pienso) acumulado partido por el peso ganado desde los 44 g de llegada.</p>";
    }
    if (lote.raza !== "ross308") {
      h += '<p class="note">La curva de la gráfica es Ross 308, Aviagen 2022, como orientación. No es la tabla de ' + esc(nombreRaza(lote.raza)) + ".</p>";
    }
    h += '<div class="pollos-acciones"><button type="button" class="btn gold" id="btn-anotar">Anotar peso y consumo</button></div>';
    h += '<div id="pollos-estado" class="pollos-estado pollos-' + (niv || "verde") + '">';
    if (!up) h += "<p>Aún no hay un pesaje. La línea dorada es la guía.</p>";
    else if (guia == null) h += "<p>Pesaje del día " + esc(up.dia) + ": " + num(up.pesoG) + " g. La guía Ross publicada llega al día 56, así que este día no se compara.</p>";
    else {
      var extra = up.pesoG > guia * 1.1 ? " Va por encima de la franja de +10 %." : "";
      h += "<p><strong>" + esc(textoNivel(niv)) + "</strong></p>";
      h += "<p>Día " + esc(up.dia) + ": " + num(up.pesoG) + " g reales · guía Ross " + num(guia) + " g · " + Math.round(up.pesoG / guia * 100) + " % de la guía." + extra + "</p>";
    }
    h += "</div>";
    h += '<div class="pollos-leyenda"><span><i class="pollos-oro"></i>Guía Ross</span><span><i class="pollos-real"></i>Tu lote</span></div>';
    h += '<div class="pollos-lienzo"><canvas id="pollos-grafica" aria-label="Gráfica de peso objetivo y peso real"></canvas></div>';
    h += '<div class="pollos-acciones"><button type="button" class="btn sec" id="btn-como-grafica">¿Cómo se lee esta gráfica?</button></div>';
    var avisos = alertasDe(lote);
    if (avisos.length) {
      var peor = avisos.some(function (a) { return a.nivel === "rojo"; }) ? "rojo" : "ambar";
      h += '<div id="pollos-alerta" class="pollos-alerta pollos-' + peor + '">';
      avisos.forEach(function (a) {
        h += "<p><strong>" + esc(a.titulo) + ".</strong> " + esc(a.detalle) + "</p>";
      });
      h += '<div class="pollos-acciones"><button type="button" class="btn" id="btn-que-hago">Qué hago</button></div></div>';
    }
    h += htmlTolvas(lote);
    var card = erroresEdad(Math.max(0, isNaN(edad) ? 0 : edad));
    h += '<section class="panel pollos-card" id="pollos-errores"><h2>' + esc(card.titulo) + "</h2><ul>";
    card.items.forEach(function (it) { h += "<li>" + esc(it) + "</li>"; });
    h += "</ul><p class=\"fine\">Sale de la lección <a href=\"lecciones/l04a.html\">L04A</a> y de la curva Ross. No es una receta.</p></section>";
    h += "<h3>Registros</h3>";
    var list = regs(lote);
    if (!list.length) h += "<p>Cuando anotes el primero, aparece aquí.</p>";
    else {
      h += '<ul class="pollos-regs">';
      list.forEach(function (r) {
        h += "<li><strong>" + esc(fechaTexto(r.fecha)) + "</strong> · día " + esc(r.dia) + " · " + (r.tipo === "semana" ? "semana" : "día");
        h += "<br>Peso " + (r.pesoG == null ? "—" : num(r.pesoG) + " g");
        h += " · alimento (pienso) " + (r.piensoKg == null ? "—" : num(r.piensoKg, 2) + " kg");
        h += " · agua " + (r.aguaL == null ? "—" : num(r.aguaL, 1) + " L");
        h += " · bajas " + num(r.bajas || 0);
        h += '<div class="pollos-acciones"><button type="button" class="btn sec" data-quitar="' + esc(r.id) + '">Quitar</button></div></li>';
      });
      h += "</ul>";
    }
    h += htmlCopia();
    h += '<div class="pollos-acciones"><button type="button" class="btn sec" id="btn-borrar">Borrar este lote</button></div>';
    h += dialogoGrafica() + dialogoQue(avisos);
    return h;
  }

  function htmlCopia() {
    return '<section class="panel pollos-card"><h2>Copia de seguridad</h2><p>Los datos viven en este navegador. Si lo borras o cambias de aparato, se pierden. Saca una copia.</p>' +
      '<div class="pollos-acciones"><button type="button" class="btn" id="btn-exportar-json">Exportar JSON</button><button type="button" class="btn sec" id="btn-exportar-csv">Exportar CSV</button></div>' +
      '<label>Importar JSON o CSV<input id="file-importar" type="file" accept=".json,.csv,application/json,text/csv"></label></section>';
  }
  function dialogoGrafica() {
    return '<dialog class="pollos-dlg" id="dlg-grafica"><h2>¿Cómo se lee esta gráfica?</h2>' +
      "<ul><li>La línea dorada es el peso objetivo Ross 308, machos y hembras juntos, Aviagen 2022.</li>" +
      "<li>La franja clara es ±10 % de esa guía. Dentro, o por encima, la ficha de la app lo llama «va bien».</li>" +
      "<li>La línea verde es el peso que anotaste.</li>" +
      "<li>Ámbar: por debajo de la franja, pero menos del 20 % bajo la guía. En la ficha, «un poco por debajo».</li>" +
      "<li>Rojo: 20 % o más por debajo. En la ficha, «muy por debajo».</li></ul>" +
      "<p>Ese corte del 20 % lo pone esta página para separar las dos frases. Aviagen no publica ese número.</p>" +
      "<p>Si la raza no es Ross 308, la curva sigue siendo Ross y solo orienta.</p>" +
      '<form method="dialog"><button class="btn" type="submit">Cerrar</button></form></dialog>';
  }
  function dialogoQue(avisos) {
    var h = '<dialog class="pollos-dlg" id="dlg-que"><h2>Qué hago</h2>';
    if (!avisos.length) h += "<p>Ahora no hay una alerta ámbar ni roja.</p>";
    avisos.forEach(function (a) { h += "<p><strong>" + esc(a.titulo) + ".</strong> " + esc(a.que) + "</p>"; });
    h += "<p><strong>Aviso.</strong> Los consejos y la ayuda por síntomas son orientativos y no sustituyen al veterinario. La app no receta medicamentos.</p>";
    h += '<form method="dialog"><button class="btn" type="submit">Cerrar</button></form></dialog>';
    return h;
  }

  function leerNuevo() {
    if (paso === 0) borrador.entrada = val("f-fecha");
    else if (paso === 1) borrador.aves = val("f-aves");
    else if (paso === 2) borrador.raza = val("f-raza");
    else {
      borrador.nombre = val("f-nombre");
      borrador.tolvas = val("f-tolvas");
      borrador.tolvaKg = val("f-tolva");
      borrador.m2 = val("f-m2");
    }
  }
  function leerAnotar() {
    if (paso === 0) { borrador.tipo = val("f-tipo"); borrador.fecha = val("f-fecha-reg"); }
    else if (paso === 1) borrador.peso = val("f-peso");
    else if (paso === 2) borrador.pienso = val("f-pienso");
    else if (paso === 3) borrador.agua = val("f-agua");
    else borrador.bajas = val("f-bajas");
  }
  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value : "";
  }
  function validarNuevoPaso() {
    if (paso === 0) {
      if (!borrador.entrada) return "Pon la fecha de entrada.";
      if (diasEntre(borrador.entrada, hoyISO()) < 0) return "La fecha de entrada no puede ser futura.";
      if (+borrador.entrada.slice(0, 4) < 2015) return "Esa fecha queda muy lejos. Revísala.";
    } else if (paso === 1) {
      var n = leerNum(borrador.aves);
      if (n == null || n !== Math.round(n) || n < 1 || n > 200000) return "El número de aves tiene que ser un entero entre 1 y 200.000.";
    } else if (paso === 3) {
      if (borrador.tolvas) {
        var t = leerNum(borrador.tolvas);
        if (!(t >= 1) || t !== Math.round(t)) return "Las tolvas tienen que ser un entero de 1 para arriba, o déjalas vacías.";
      }
      if (borrador.tolvaKg && !(leerNum(borrador.tolvaKg) > 0)) return "Los kilos de la tolva no cuadran. Déjalo vacío si no los sabes.";
      if (borrador.m2 && !(leerNum(borrador.m2) > 0)) return "Los metros cuadrados no cuadran. Déjalos vacíos si no los sabes.";
    }
    return "";
  }
  function validarAnotarPaso() {
    var lote = loteActivo();
    if (!lote) return "No hay un lote abierto.";
    if (paso === 0) {
      if (!borrador.fecha) return "Pon la fecha del pesaje.";
      var dia = diasEntre(lote.entrada, borrador.fecha);
      if (isNaN(dia)) return "Esa fecha no se entiende.";
      if (dia < 0) return "Esa fecha es anterior a la entrada del lote.";
      if (diasEntre(borrador.fecha, hoyISO()) < 0) return "La fecha no puede ser futura.";
      if (regs(lote).some(function (r) { return r.dia === dia; })) return "Ya hay un registro de ese día. Quita el anterior si te equivocaste.";
    } else if (paso === 1) {
      var p = leerNum(borrador.peso);
      if (p == null) return "Anota el peso medio en gramos.";
      if (p < 15 || p > 6000) return "Ese peso no es creíble para un pollo de engorde (entre 15 g y 6.000 g). Revísalo.";
    } else if (paso === 2 || paso === 3) {
      var campo = paso === 2 ? borrador.pienso : borrador.agua;
      if (campo === "" || campo == null) return "";
      var x = leerNum(campo);
      if (!(x >= 0)) return "Ese número no puede ser negativo. Si no lo mediste, déjalo en blanco.";
    } else {
      var msg = revisarRegistro(lote, false);
      if (msg) return msg;
    }
    return "";
  }
  function revisarRegistro(lote, final) {
    var dia = diasEntre(lote.entrada, borrador.fecha);
    var peso = leerNum(borrador.peso);
    var pienso = borrador.pienso === "" || borrador.pienso == null ? null : leerNum(borrador.pienso);
    var agua = borrador.agua === "" || borrador.agua == null ? null : leerNum(borrador.agua);
    var bajas = leerNum(borrador.bajas == null || borrador.bajas === "" ? "0" : borrador.bajas);
    if (bajas == null || bajas < 0 || bajas !== Math.round(bajas)) return "Las bajas tienen que ser un entero de cero para arriba.";
    var vivas = avesVivas(lote, dia);
    if (bajas > vivas) return "Las bajas (" + num(bajas) + ") son más que las aves vivas ese día (" + num(vivas) + ").";
    var periodo = borrador.tipo === "semana" ? Math.min(7, dia + 1) : 1;
    if (pienso != null && vivas > 0 && pienso * 1000 / vivas / periodo > 400) {
      return "Ese pienso pasa de 400 g por ave y día. La guía Ross, en su día más alto, anda por 234 g. Revísalo.";
    }
    if (agua === 0 && pienso > 0) return "Si comieron, anota el agua. Si no la mediste, déjala en blanco: no pongas cero.";
    if (agua != null && pienso > 0 && agua / pienso > 8) return "Esa agua pasa de 8 litros por kilo de pienso. La referencia es 1,6 a 1,8. Revísala.";
    if (final) {
      var prev = null;
      regs(lote).forEach(function (r) { if (r.dia < dia && r.pesoG != null) prev = r; });
      if (prev && peso < prev.pesoG * 0.85 && !borrador.confirmar) {
        borrador.confirmar = true;
        return "El peso baja más de un 15 % respecto al anterior (" + num(prev.pesoG) + " g). Si está bien, pulsa otra vez Guardar registro.";
      }
    }
    return "";
  }

  function pintar() {
    var root = document.getElementById("pollos-app");
    if (!root) return;
    var html = vista === "nuevo" ? htmlNuevo() : vista === "anotar" ? htmlAnotar() : loteActivo() && vista === "lote" ? htmlLote() : htmlLista();
    root.innerHTML = html;
    enganchar();
    var c = document.getElementById("pollos-grafica");
    if (c && loteActivo()) dibujar(c, loteActivo());
  }
  function enganchar() {
    var n = document.getElementById("btn-nuevo");
    if (n) n.onclick = function () {
      vista = "nuevo"; paso = 0; error = "";
      borrador = { entrada: hoyISO(), aves: "20", raza: "ross308", nombre: "", tolvas: "", tolvaKg: "", m2: "" };
      pintar();
    };
    var tema = document.getElementById("btn-tema");
    if (tema) tema.onclick = alternarTema;
    var lotes = document.getElementById("btn-lotes");
    if (lotes) lotes.onclick = function () { vista = "lista"; error = ""; pintar(); };
    document.querySelectorAll("[data-abrir]").forEach(function (b) {
      b.onclick = function () {
        var prev = store.activo;
        store.activo = b.getAttribute("data-abrir");
        if (!guardar()) { store.activo = prev; pintar(); return; }
        vista = "lote";
        pintar();
      };
    });
    var sig = document.getElementById("btn-siguiente");
    if (sig) sig.onclick = function () {
      if (vista === "nuevo") leerNuevo(); else leerAnotar();
      error = vista === "nuevo" ? validarNuevoPaso() : validarAnotarPaso();
      if (error) { pintar(); return; }
      error = "";
      if (vista === "anotar" && paso === 0) {
        borrador.peso = "";
        borrador.pienso = "";
        borrador.agua = "";
      }
      paso += 1;
      pintar();
    };
    var atras = document.getElementById("btn-atras");
    if (atras) atras.onclick = function () {
      if (vista === "nuevo") leerNuevo(); else leerAnotar();
      error = "";
      if (paso > 0) paso -= 1;
      pintar();
    };
    var cancelar = document.getElementById("btn-cancelar");
    if (cancelar) cancelar.onclick = function () {
      error = "";
      vista = loteActivo() ? "lote" : "lista";
      pintar();
    };
    var gl = document.getElementById("btn-guardar-lote");
    if (gl) gl.onclick = guardarLote;
    var gr = document.getElementById("btn-guardar-registro");
    if (gr) gr.onclick = guardarRegistro;
    var an = document.getElementById("btn-anotar");
    if (an) an.onclick = function () {
      var lote = loteActivo();
      vista = "anotar"; paso = 0; error = "";
      borrador = { tipo: "dia", fecha: hoyISO(), peso: "", pienso: "", agua: "", bajas: "0", confirmar: false };
      if (lote && diasEntre(lote.entrada, borrador.fecha) < 0) borrador.fecha = lote.entrada;
      pintar();
    };
    var bt = document.getElementById("btn-guardar-tolva");
    if (bt) bt.onclick = guardarTolva;
    var como = document.getElementById("btn-como-grafica");
    if (como) como.onclick = function () { var d = document.getElementById("dlg-grafica"); if (d.showModal) d.showModal(); };
    var qh = document.getElementById("btn-que-hago");
    if (qh) qh.onclick = function () { var d = document.getElementById("dlg-que"); if (d.showModal) d.showModal(); };
    document.querySelectorAll("[data-quitar]").forEach(function (b) {
      b.onclick = function () { quitarRegistro(b.getAttribute("data-quitar")); };
    });
    var bor = document.getElementById("btn-borrar");
    if (bor) bor.onclick = borrarLote;
    var ej = document.getElementById("btn-exportar-json");
    if (ej) ej.onclick = function () { descargar("registro-pollos.json", JSON.stringify(store, null, 2), "application/json"); };
    var ec = document.getElementById("btn-exportar-csv");
    if (ec) ec.onclick = function () { descargar("registro-pollos.csv", "\uFEFF" + aCSV(), "text/csv"); };
    var fi = document.getElementById("file-importar");
    if (fi) fi.onchange = function () {
      var f = fi.files && fi.files[0];
      if (!f) return;
      var lector = new FileReader();
      lector.onload = function () { importar(String(lector.result || ""), f.name); };
      lector.readAsText(f);
    };
  }

  function guardarLote() {
    leerNuevo();
    error = validarNuevoPaso();
    if (error) { pintar(); return; }
    var aves = leerNum(borrador.aves);
    var lote = {
      id: idNuevo(),
      nombre: (borrador.nombre || "").trim() || ("Lote del " + fechaTexto(borrador.entrada)),
      entrada: borrador.entrada,
      aves: aves,
      raza: borrador.raza || "ross308",
      tolvas: borrador.tolvas ? leerNum(borrador.tolvas) : null,
      tolvaKg: borrador.tolvaKg ? leerNum(borrador.tolvaKg) : null,
      m2: borrador.m2 ? leerNum(borrador.m2) : null,
      registros: []
    };
    var copia = JSON.parse(JSON.stringify(store));
    store.lotes.push(lote);
    store.activo = lote.id;
    if (!guardar()) {
      store.lotes = copia.lotes;
      store.activo = copia.activo;
      pintar();
      return;
    }
    vista = "lote";
    error = "";
    pintar();
  }
  function guardarRegistro() {
    var lote = loteActivo();
    leerAnotar();
    error = revisarRegistro(lote, true);
    if (error) { pintar(); return; }
    var dia = diasEntre(lote.entrada, borrador.fecha);
    var copiaReg = JSON.parse(JSON.stringify(store));
    lote.registros.push({
      id: idNuevo(),
      tipo: borrador.tipo === "semana" ? "semana" : "dia",
      dia: dia,
      fecha: borrador.fecha,
      pesoG: leerNum(borrador.peso),
      piensoKg: borrador.pienso === "" || borrador.pienso == null ? null : leerNum(borrador.pienso),
      aguaL: borrador.agua === "" || borrador.agua == null ? null : leerNum(borrador.agua),
      bajas: leerNum(borrador.bajas || "0") || 0
    });
    if (!guardar()) {
      store.lotes = copiaReg.lotes;
      store.activo = copiaReg.activo;
      pintar();
      return;
    }
    vista = "lote";
    error = "";
    pintar();
  }
  function guardarTolva() {
    var lote = loteActivo();
    if (!lote) return;
    var kg = val("f-tolva-kg");
    var n = val("f-tolvas-lote");
    if (kg && !(leerNum(kg) > 0)) { error = "Esos kilos no cuadran."; pintar(); return; }
    if (n && (!(leerNum(n) >= 1) || leerNum(n) !== Math.round(leerNum(n)))) { error = "El número de tolvas no cuadra."; pintar(); return; }
    var copiaTolva = JSON.parse(JSON.stringify(store));
    lote.tolvaKg = kg ? leerNum(kg) : null;
    lote.tolvas = n ? leerNum(n) : null;
    if (!guardar()) {
      store.lotes = copiaTolva.lotes;
      store.activo = copiaTolva.activo;
      pintar();
      return;
    }
    error = "";
    pintar();
  }
  function quitarRegistro(id) {
    var lote = loteActivo();
    if (!lote || !window.confirm("¿Quitas este registro?")) return;
    var copiaQ = JSON.parse(JSON.stringify(store));
    lote.registros = (lote.registros || []).filter(function (r) { return r.id !== id; });
    if (!guardar()) {
      store.lotes = copiaQ.lotes;
      store.activo = copiaQ.activo;
    }
    pintar();
  }
  function borrarLote() {
    var lote = loteActivo();
    if (!lote || !window.confirm("¿Borras este lote y sus registros de este navegador?")) return;
    var copiaB = JSON.parse(JSON.stringify(store));
    var siguiente = store.lotes.filter(function (l) { return l.id !== lote.id; });
    store.lotes = siguiente;
    store.activo = siguiente.length ? siguiente[0].id : null;
    if (!guardar()) {
      store.lotes = copiaB.lotes;
      store.activo = copiaB.activo;
      pintar();
      return;
    }
    vista = store.activo ? "lote" : "lista";
    pintar();
  }

  function descargar(nombre, texto, tipo) {
    var blob = new Blob([texto], { type: tipo + ";charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1500);
  }
  var SEP = ";";
  function csvNum(v) {
    if (v == null || v === "") return "";
    return String(v).replace(".", ",");
  }
  function csvCelda(v) {
    var s = v == null ? "" : String(v);
    if (/^[=+\-@]/.test(s)) s = "'" + s;
    if (/[;"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
    return s;
  }
  function aCSV() {
    var cols = ["lote_id","lote_nombre","entrada","aves","raza","tolvas","tolva_kg","m2","registro_id","tipo","dia","fecha","peso_g","pienso_kg","agua_l","bajas"];
    var lineas = [cols.join(SEP)];
    store.lotes.forEach(function (l) {
      var base = [l.id, l.nombre, l.entrada, csvNum(l.aves), l.raza, csvNum(l.tolvas), csvNum(l.tolvaKg), csvNum(l.m2)];
      var rs = l.registros || [];
      if (!rs.length) lineas.push(base.map(csvCelda).concat(["","","","","","",""]).join(SEP));
      rs.forEach(function (r) {
        lineas.push(base.concat([
          r.id, r.tipo, csvNum(r.dia), r.fecha, csvNum(r.pesoG), csvNum(r.piensoKg), csvNum(r.aguaL), csvNum(r.bajas)
        ]).map(csvCelda).join(SEP));
      });
    });
    return lineas.join("\r\n");
  }
  function separadorCSV(texto) {
    var linea = (texto.split(/\r?\n/)[0] || "");
    var sc = 0;
    var cc = 0;
    var com = false;
    for (var i = 0; i < linea.length; i++) {
      var ch = linea.charAt(i);
      if (ch === '"') com = !com;
      else if (!com && ch === ";") sc++;
      else if (!com && ch === ",") cc++;
    }
    return sc > cc ? ";" : ",";
  }
  function partirCSV(texto) {
    var sep = separadorCSV(texto);
    var filas = [];
    var fila = [];
    var cel = "";
    var com = false;
    for (var i = 0; i < texto.length; i++) {
      var ch = texto.charAt(i);
      if (com) {
        if (ch === '"') {
          if (texto.charAt(i + 1) === '"') { cel += '"'; i++; }
          else com = false;
        } else cel += ch;
      } else if (ch === '"') com = true;
      else if (ch === sep) { fila.push(cel); cel = ""; }
      else if (ch === "\n") { fila.push(cel); filas.push(fila); fila = []; cel = ""; }
      else if (ch !== "\r") cel += ch;
    }
    if (cel.length || fila.length) { fila.push(cel); filas.push(fila); }
    return filas;
  }
  function meterLotes(lista, activo) {
    var copia = JSON.parse(JSON.stringify(store));
    var descartados = 0;
    var ids = [];
    lista.forEach(function (l) {
      var s = sanearLote(l);
      if (!s) { descartados++; return; }
      descartados += s._malos || 0;
      delete s._malos;
      var i = store.lotes.findIndex(function (x) { return x.id === s.id; });
      if (i >= 0) store.lotes[i] = s; else store.lotes.push(s);
      ids.push(s.id);
    });
    if (!ids.length) {
      store.lotes = copia.lotes;
      store.activo = copia.activo;
      error = "No se importó nada: los lotes no cuadran. Revisa el archivo.";
      return false;
    }
    if (idOk(activo) && store.lotes.some(function (l) { return l.id === activo; })) store.activo = activo;
    else store.activo = ids[ids.length - 1];
    if (!guardar()) {
      store.lotes = copia.lotes;
      store.activo = copia.activo;
      return false;
    }
    error = descartados
      ? "Se importó la copia. Se dejaron fuera " + descartados + (descartados === 1 ? " lote o registro que no cuadraba." : " lotes o registros que no cuadraban.")
      : "";
    return true;
  }
  function importar(texto, nombre) {
    try {
      var limpio = String(texto || "").replace(/^\uFEFF/, "").trim();
      if (!limpio) throw new Error("vacío");
      if (limpio.charAt(0) === "{" || limpio.charAt(0) === "[" || /\.json$/i.test(nombre || "")) {
        var data = JSON.parse(limpio);
        var lotes = Array.isArray(data) ? data : (data && data.lotes);
        if (!Array.isArray(lotes)) throw new Error("sin lotes");
        if (!meterLotes(lotes, data && data.activo)) { pintar(); return; }
      } else {
        var filas = partirCSV(limpio);
        if (filas.length < 2) throw new Error("vacío");
        var head = filas[0].map(function (x) { return String(x || "").trim(); });
        var idx = {};
        head.forEach(function (c, i) { idx[c] = i; });
        if (idx.lote_id == null) throw new Error("csv");
        var mapa = {};
        var orden = [];
        for (var r = 1; r < filas.length; r++) {
          var f = filas[r];
          if (!f || !f.length || !f[idx.lote_id]) continue;
          var id = String(f[idx.lote_id]).trim();
          if (!mapa[id]) {
            mapa[id] = {
              id: id,
              nombre: f[idx.lote_nombre] || "Lote",
              entrada: f[idx.entrada],
              aves: f[idx.aves],
              raza: f[idx.raza] || "ross308",
              tolvas: f[idx.tolvas],
              tolvaKg: f[idx.tolva_kg],
              m2: f[idx.m2],
              registros: []
            };
            orden.push(mapa[id]);
          }
          if (f[idx.registro_id]) {
            mapa[id].registros.push({
              id: String(f[idx.registro_id]).trim(),
              tipo: f[idx.tipo] === "semana" ? "semana" : "dia",
              dia: f[idx.dia],
              fecha: f[idx.fecha],
              pesoG: f[idx.peso_g],
              piensoKg: f[idx.pienso_kg],
              aguaL: f[idx.agua_l],
              bajas: f[idx.bajas]
            });
          }
        }
        if (!meterLotes(orden, orden.length ? orden[orden.length - 1].id : null)) { pintar(); return; }
      }
      vista = loteActivo() ? "lote" : "lista";
      pintar();
    } catch (e) {
      error = "No se pudo leer ese archivo. Usa un JSON exportado aquí o el CSV con la misma cabecera.";
      pintar();
    }
  }

  function dibujar(canvas, lote) {
    var caja = canvas.parentElement;
    var cssW = Math.max(280, (caja && caja.clientWidth) || 320);
    var cssH = Math.round(Math.min(420, Math.max(220, cssW * 0.62)));
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = cssW + "px";
    canvas.style.height = cssH + "px";
    var ctx = canvas.getContext("2d");
    var oscuro = document.body.classList.contains("pollos-oscuro");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    ctx.fillStyle = oscuro ? "#1c2620" : "#fff";
    ctx.fillRect(0, 0, cssW, cssH);
    var edad = Math.max(0, diasEntre(lote.entrada, hoyISO()));
    var puntos = regs(lote).filter(function (r) { return r.pesoG != null; });
    var ultimoDia = puntos.length ? puntos[puntos.length - 1].dia : 0;
    var maxDia = Math.min(56, Math.max(35, edad, ultimoDia));
    if (ultimoDia > 56) maxDia = ultimoDia;
    var maxY = guiaPeso(Math.min(56, maxDia)) || 1000;
    puntos.forEach(function (p) { if (p.pesoG > maxY) maxY = p.pesoG; });
    maxY = maxY * 1.12;
    var pad = { l: 46, r: 12, t: 16, b: 32 };
    var iw = cssW - pad.l - pad.r;
    var ih = cssH - pad.t - pad.b;
    function xDe(d) { return pad.l + (maxDia === 0 ? 0 : d / maxDia) * iw; }
    function yDe(g) { return pad.t + ih - (g / maxY) * ih; }
    ctx.strokeStyle = oscuro ? "#3d5246" : "#e4e0d4";
    ctx.fillStyle = oscuro ? "#c5d0c8" : "#3e5146";
    ctx.lineWidth = 1;
    ctx.font = "12px system-ui, sans-serif";
    ctx.textAlign = "right";
    for (var i = 0; i <= 4; i++) {
      var g = maxY * i / 4;
      var y = yDe(g);
      ctx.beginPath();
      ctx.moveTo(pad.l, y);
      ctx.lineTo(cssW - pad.r, y);
      ctx.stroke();
      ctx.fillText(num(g), pad.l - 6, y + 4);
    }
    ctx.textAlign = "center";
    ctx.fillText("Día 0", xDe(0), cssH - 10);
    ctx.fillText("Día " + maxDia, xDe(maxDia), cssH - 10);
    ctx.beginPath();
    for (var d = 0; d <= Math.min(56, maxDia); d++) {
      var yb = yDe(guiaPeso(d) * 1.1);
      if (d === 0) ctx.moveTo(xDe(d), yb); else ctx.lineTo(xDe(d), yb);
    }
    for (var d2 = Math.min(56, maxDia); d2 >= 0; d2--) ctx.lineTo(xDe(d2), yDe(guiaPeso(d2) * 0.9));
    ctx.closePath();
    ctx.fillStyle = "rgba(196,160,53,0.18)";
    ctx.fill();
    ctx.beginPath();
    ctx.strokeStyle = "#C4A035";
    ctx.lineWidth = 2.5;
    for (var d3 = 0; d3 <= Math.min(56, maxDia); d3++) {
      var yg = yDe(guiaPeso(d3));
      if (d3 === 0) ctx.moveTo(xDe(d3), yg); else ctx.lineTo(xDe(d3), yg);
    }
    ctx.stroke();
    if (puntos.length) {
      ctx.beginPath();
      ctx.strokeStyle = "#1F5E2E";
      ctx.lineWidth = 2.5;
      puntos.forEach(function (p, i) {
        var x = xDe(p.dia), y = yDe(p.pesoG);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.stroke();
      puntos.forEach(function (p) {
        ctx.beginPath();
        ctx.fillStyle = "#1F5E2E";
        ctx.arc(xDe(p.dia), yDe(p.pesoG), 4, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  function iniciar() {
    aplicarTema();
    apagarAnuncios();
    if (loteActivo()) vista = "lote";
    pintar();
    window.addEventListener("resize", function () {
      var c = document.getElementById("pollos-grafica");
      if (c && loteActivo() && vista === "lote") dibujar(c, loteActivo());
    });
    var n = 0;
    var reloj = setInterval(function () {
      n += 1;
      apagarAnuncios();
      if (n > 20) clearInterval(reloj);
    }, 500);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
