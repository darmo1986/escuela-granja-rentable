/* Calculadora de rentabilidad y de comederos. Todo el cálculo ocurre en el navegador. */
(function () {
  var DIAS_MES = 365 / 12;
  var EGG_START = 5 * DIAS_MES;
  var LOTE_ENGORDE = 49;
  var LOTE_CAMPERO = 70;
  var STORE = "gr_calc_rentabilidad";

  /* Gramos y proteína por tamaño. Rangos orientativos, no fichas de catálogo.
     Media: cifras de partida (arranque 20–45, recría 60–90, postura 110–125).
     Ligera y enana: más bajas, con la postura que indica el tamaño.
     Pesada: postura 125–150; arranque y recría, +10–15 % sobre la media.
     Engorde industrial: rampa a libre disposición, sacrificio hacia las 6–8 semanas.
     Campero: crecimiento lento, 8–12 semanas. */
  var PLANTILLAS = {
    media: etapas({
      arranque: [20, 45, 20, 22, "Pienso de arranque"],
      recria: [60, 90, 16, 18, "Pienso de crecimiento o recría"],
      puesta: [110, 125, 16, 17, "Pienso de puesta", true],
      muda: [80, 110, 16, 16, "Pienso de muda o de puesta, con buena proteína para la pluma"]
    }),
    ligera: etapas({
      arranque: [18, 40, 20, 22, "Pienso de arranque"],
      recria: [55, 80, 16, 18, "Pienso de crecimiento o recría"],
      puesta: [100, 115, 16, 17, "Pienso de puesta", true],
      muda: [75, 100, 16, 16, "Pienso de muda o de puesta, con buena proteína para la pluma"]
    }),
    pesada: etapas({
      arranque: [22, 52, 20, 22, "Pienso de arranque"],
      recria: [66, 104, 16, 18, "Pienso de crecimiento o recría"],
      puesta: [125, 150, 16, 17, "Pienso de puesta", true],
      muda: [90, 130, 16, 16, "Pienso de muda o de puesta, con buena proteína para la pluma"]
    }),
    enana: etapas({
      arranque: [10, 25, 20, 22, "Pienso de arranque"],
      recria: [30, 50, 16, 18, "Pienso de crecimiento o recría"],
      puesta: [60, 80, 16, 17, "Pienso de puesta", true],
      muda: [40, 70, 16, 16, "Pienso de muda o de puesta, con buena proteína para la pluma"]
    }),
    engorde: {
      arranque: bloque([20, 60], [20, 23], "Pienso de engorde de inicio", false, true, "En Cobb y Ross el arranque ya es engorde, a libre disposición. No se quedan semanas enteras a 20 g: la cantidad sube cada semana."),
      recria: { noAplica: true, aviso: "El pollo industrial no hace una recría de 7 a 18 semanas. Se sacrifica hacia las 6–8 semanas. Mira engorde inicio y engorde final." },
      puesta: { noAplica: true, aviso: "No se cría para huevo." },
      muda: { noAplica: true, aviso: "En un ciclo de 6–8 semanas no hay muda de puesta." },
      engordeInicio: bloque([20, 60], [20, 23], "Pienso de engorde de inicio", false, true, "Primeras semanas, a libre disposición. Orientativo: unos 20–60 g, y sube deprisa."),
      engordeFinal: bloque([140, 180], [18, 20], "Pienso de engorde de finalización", false, true, "Hacia las 6–8 semanas. Rango ancho y orientativo. L01 cita un ejemplo de unos 2,2 kg a los 35 días con conversión ~1,5: unos 3,3 kg de pienso en 35 días (media cercana a 94 g al día). El día a día va de poco al principio a bastante más al final.")
    },
    campero: {
      arranque: bloque([20, 40], [20, 22], "Pienso de arranque", false, false, "Crecimiento lento. No uses la rampa del pollo de engorde industrial (Cobb o Ross)."),
      recria: bloque([55, 95], [16, 18], "Pienso de crecimiento", false, false, ""),
      puesta: bloque([100, 125], [16, 17], "Pienso de puesta", true, false, "Solo si se deja de adulta. Si se sacrifica a las 8–12 semanas, no llega a postura."),
      muda: bloque([80, 110], [16, 16], "Pienso de muda o de puesta, con buena proteína para la pluma", false, false, ""),
      engordeInicio: bloque([20, 40], [20, 22], "Pienso de arranque", false, false, "Ciclo orientativo de 8–12 semanas. No es Cobb ni Ross."),
      engordeFinal: bloque([90, 130], [16, 18], "Pienso de crecimiento", false, false, "Hacia las 8–12 semanas. Orientativo, más bajo que el engorde industrial.")
    }
  };

  var CLASE = {
    ligera: "Ligera",
    media: "Media",
    pesada: "Pesada",
    enana: "Enana",
    engorde: "Engorde industrial",
    campero: "Campero"
  };

  var RAZAS = [
    raza("isa-brown", "Isa Brown", "híbrida Francia", [280, 320], "dócil", "sí", "media", "hibrida"),
    raza("lohmann-brown", "Lohmann Brown", "híbrida Alemania", [280, 320], "dócil", "sí", "media", "hibrida"),
    raza("hy-line-brown", "Hy-Line Brown", "híbrida EE. UU.", [280, 320], "tranquila", "sí", "media", "hibrida"),
    raza("red-sex-link", "Red Sex Link", "cruce EE. UU.", [250, 300], "dócil", "sí", "media", "hibrida"),
    raza("leghorn", "Leghorn blanca", "Italia", [250, 300], "nerviosa", "medio", "ligera", "raza"),
    raza("rhode-island", "Rhode Island Red", "EE. UU.", [200, 280], "rústica", "sí", "media", "raza"),
    raza("australorp", "Australorp", "Australia", [220, 300], "tranquila", "sí", "pesada", "raza"),
    raza("plymouth", "Plymouth Rock barrada", "EE. UU.", [200, 280], "tranquila", "sí", "pesada", "raza"),
    raza("sussex", "Sussex", "Inglaterra", [200, 260], "dócil", "sí", "pesada", "raza"),
    raza("new-hampshire", "New Hampshire", "EE. UU.", [200, 250], "tranquila", "sí", "media", "raza"),
    raza("delaware", "Delaware", "EE. UU.", [180, 250], "tranquila", "sí", "media", "raza"),
    raza("wyandotte", "Wyandotte", "EE. UU.", [180, 240], "tranquila", "sí", "pesada", "raza"),
    raza("orpington", "Orpington", "Inglaterra", [150, 200], "muy dócil", "sí", "pesada", "raza"),
    raza("ameraucana", "Ameraucana", "EE. UU.", [150, 250], "tranquila", "sí", "media", "raza"),
    raza("araucana", "Araucana", "Chile", [150, 200], "algo arisca", "medio", "ligera", "raza"),
    raza("marans", "Marans", "Francia", [150, 200], "tranquila", "sí", "pesada", "raza"),
    raza("welsummer", "Welsummer", "Países Bajos", [160, 200], "activa", "sí", "media", "raza"),
    raza("barnevelder", "Barnevelder", "Países Bajos", [150, 200], "tranquila", "sí", "media", "raza"),
    raza("faverolles", "Faverolles", "Francia", [150, 200], "muy dócil", "sí", "pesada", "raza"),
    raza("castellana", "Castellana negra", "España", [180, 220], "activa", "medio", "ligera", "raza"),
    raza("andaluza", "Andaluza azul", "España", [160, 200], "activa", "medio", "ligera", "raza"),
    raza("menorca", "Menorca", "España", [180, 220], "activa", "medio", "ligera", "raza"),
    raza("prat", "Prat leonada", "Cataluña", [180, 220], "tranquila", "sí", "media", "raza"),
    raza("hamburgo", "Hamburgo", "Alemania/Países Bajos", [180, 220], "muy activa", "medio", "ligera", "raza"),
    raza("cuello-desnudo", "Cuello desnudo", "Europa del Este", [150, 200], "resistente al calor", "sí", "media", "raza"),
    raza("jersey-giant", "Jersey Giant", "EE. UU.", [150, 200], "dócil, pesada", "sí", "pesada", "raza"),
    raza("brahma", "Brahma", "Asia/EE. UU.", [120, 180], "dócil, pesada", "sí", "pesada", "raza"),
    raza("cochinchina", "Cochinchina", "China", [100, 160], "muy dócil, pesada", "sí", "pesada", "raza"),
    raza("criolla", "Gallina criolla", "Latinoamérica", [80, 150], "muy rústica", "sí", "media", "raza"),
    raza("sedosa", "Sedosa (Silkie)", "Asia", [80, 120], "muy dócil", "sí", "enana", "raza"),
    raza("bovans", "Bovans Goldline", "híbrida Países Bajos", [280, 320], "dócil", "sí", "media", "hibrida"),
    raza("shaver", "Shaver Brown", "híbrida Canadá", [280, 320], "dócil", "sí", "media", "hibrida"),
    raza("novogen", "Novogen Brown", "híbrida Francia", [280, 320], "dócil", "sí", "media", "hibrida"),
    raza("dekalb", "Dekalb White", "híbrida Países Bajos", [280, 320], "activa", "sí", "ligera", "hibrida"),
    raza("black-star", "Black Star (negra híbrida)", "cruce EE. UU.", [250, 300], "dócil", "sí", "media", "hibrida"),
    raza("cobb-500", "Cobb 500", "engorde industrial EE. UU.", null, "tranquilo", "sí, con buen manejo", "engorde", "engorde", "No se cría para huevo"),
    raza("ross-308", "Ross 308", "engorde industrial Escocia/EE. UU.", null, "tranquilo", "sí, con buen manejo", "engorde", "engorde", "No se cría para huevo"),
    raza("pollo-campero", "Pollo campero (tipo Label Rouge / crecimiento lento)", "Francia", [150, 200], "rústico", "sí", "campero", "engorde", "No aplica, o 150–200 si se deja", true),
    raza("cornish", "Cornish", "Inglaterra", [80, 150], "tranquila", "medio", "pesada", "raza"),
    raza("bresse", "Bresse", "Francia", [180, 250], "activa", "medio", "media", "raza"),
    raza("penedesenca", "Penedesenca", "Cataluña", [150, 200], "activa", "medio", "ligera", "raza", "150–200 (huevo muy oscuro)"),
    raza("empordanesa", "Empordanesa", "Cataluña", [150, 200], "activa", "medio", "media", "raza"),
    raza("utrerana", "Utrerana", "Andalucía", [180, 220], "activa", "medio", "ligera", "raza"),
    raza("pita-pinta", "Pita Pinta asturiana", "Asturias", [150, 200], "tranquila", "sí", "pesada", "raza"),
    raza("dorking", "Dorking", "Inglaterra", [150, 190], "tranquila", "sí", "pesada", "raza"),
    raza("langshan", "Langshan", "China", [150, 200], "tranquila", "sí", "pesada", "raza"),
    raza("chantecler", "Chantecler", "Canadá", [150, 200], "tranquila", "sí", "pesada", "raza", "150–200 (aguanta el frío)"),
    raza("dominique", "Dominique", "EE. UU.", [180, 230], "tranquila", "sí", "media", "raza"),
    raza("java", "Java", "EE. UU.", [150, 200], "tranquila", "sí", "pesada", "raza"),
    raza("ayam-cemani", "Ayam Cemani", "Indonesia", [60, 100], "arisca", "medio", "ligera", "raza")
  ];

  function etapas(map) {
    var out = {};
    Object.keys(map).forEach(function (k) {
      var row = map[k];
      out[k] = bloque([row[0], row[1]], [row[2], row[3]], row[4], !!row[5], false, "");
    });
    return out;
  }
  function bloque(g, prot, pienso, calcio, adLib, nota) {
    return { g: g, prot: prot, pienso: pienso, calcio: !!calcio, adLib: !!adLib, nota: nota || "" };
  }
  function raza(id, nombre, origen, huevos, caracter, principio, clase, grupo, huevosTexto, huevosOpcional) {
    return {
      id: id,
      nombre: nombre,
      origen: origen,
      huevos: huevos,
      huevosTexto: huevosTexto || (huevos ? huevos[0] + "–" + huevos[1] : "No se cría para huevo"),
      huevosOpcional: !!huevosOpcional,
      caracter: caracter,
      principio: principio,
      clase: clase,
      grupo: grupo
    };
  }
  function porId(id) {
    for (var i = 0; i < RAZAS.length; i++) if (RAZAS[i].id === id) return RAZAS[i];
    return RAZAS[0];
  }
  function medio(par) { return (par[0] + par[1]) / 2; }
  /* La coma y el punto son decimales. «0.520» es 0,52 y «2,5» es 2,5.
     Si hay coma y punto, el último es el decimal. Varios separadores iguales
     y grupos de tres cifras son miles («1.234.567»). En un campo entero,
     «1.000» y «1,000» también son miles. No se admite 1e21. */
  function interpretarDecimal(s) {
    var tienePunto = s.indexOf(".") !== -1;
    var tieneComa = s.indexOf(",") !== -1;
    if (tienePunto && tieneComa) {
      if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
      else s = s.replace(/,/g, "");
    } else if (tieneComa) {
      if (s.split(",").length > 2) {
        if (!/^\d{1,3}(,\d{3})+$/.test(s)) return null;
        s = s.replace(/,/g, "");
      } else s = s.replace(",", ".");
    } else if (tienePunto && s.split(".").length > 2) {
      if (!/^\d{1,3}(\.\d{3})+$/.test(s)) return null;
      s = s.replace(/\./g, "");
    }
    if (!/^\d+(\.\d+)?$/.test(s)) return null;
    var n = Number(s);
    return isFinite(n) ? n : null;
  }
  function textoTope(n) {
    var s = String(n);
    var p = s.split(".");
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return p.length > 1 ? p[0] + "," + p[1] : p[0];
  }
  function avisoMiles(original, decimal, miles) {
    var mostrado = String(decimal);
    if (/e/i.test(mostrado)) mostrado = decimal.toFixed(10).replace(/0+$/, "").replace(/\.$/, "");
    mostrado = mostrado.replace(".", ",");
    return "¿" + original + " es " + mostrado + " o " + miles + "? Para miles escribe " + miles + " sin punto ni coma.";
  }
  function leerNumero(raw, opts) {
    opts = opts || {};
    if (typeof raw === "number") {
      if (!isFinite(raw)) return { ok: false, error: "Escribe un número." };
      raw = String(raw);
    }
    var s = String(raw == null ? "" : raw).replace(/\u2212/g, "-").replace(/\u00a0/g, " ").trim();
    if (!s) {
      if (opts.opcional) return { ok: true, value: 0, vacio: true };
      return { ok: false, error: "Escribe un número." };
    }
    if (/\s/.test(s)) {
      var compacto = s.replace(/\s+/g, " ");
      if (/^[+-]?\d{1,3}(?: \d{3})+$/.test(compacto)) s = compacto.replace(/ /g, "");
      else return { ok: false, error: "Escribe el número sin espacios, o en grupos de tres: 1 000." };
    }
    if (/[eE]/.test(s)) return { ok: false, error: "Escribe un número, sin notación científica." };
    if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(s)) return { ok: false, error: "Escribe un número, sin letras." };
    if (s.charAt(0) === "-") return { ok: false, error: "Escribe un número positivo." };
    if (s.charAt(0) === "+") s = s.slice(1);
    if (/[^0-9.,]/.test(s)) return { ok: false, error: "Escribe un número, sin letras." };
    var aviso = "";
    if (opts.entero && /^\d{1,3}[.,]\d{3}$/.test(s)) {
      s = s.replace(/[.,]/, "");
    } else if (!opts.entero && /^(\d+)[.,](\d{3})$/.test(s)) {
      var partes = s.match(/^(\d+)[.,](\d{3})$/);
      if (partes && Number(partes[1]) !== 0) {
        var comoDecimal = interpretarDecimal(s);
        if (comoDecimal != null) aviso = avisoMiles(s, comoDecimal, String(Number(partes[1] + partes[2])));
      }
    }
    var n = interpretarDecimal(s);
    if (n == null) return { ok: false, error: "Escribe un número." };
    if (opts.entero && Math.abs(n - Math.round(n)) > 1e-9) {
      return { ok: false, error: opts.enteroMsg || "Escribe un número entero." };
    }
    if (opts.entero) n = Math.round(n);
    if (opts.min != null && n < opts.min - 1e-9) return { ok: false, error: "El mínimo es " + textoTope(opts.min) + "." };
    if (opts.max != null && n > opts.max + 1e-9) return { ok: false, error: "El máximo es " + textoTope(opts.max) + "." };
    var out = { ok: true, value: n };
    if (aviso) out.aviso = aviso;
    return out;
  }
  function num(v, entero) {
    if (typeof v === "number") return isFinite(v) ? v : 0;
    var leido = leerNumero(v, { entero: !!entero, opcional: true });
    if (!leido.ok) return NaN;
    return leido.value;
  }
  function numOrNull(v) {
    if (v == null) return null;
    if (typeof v === "string" && String(v).trim() === "") return null;
    var n = num(v);
    return isFinite(n) ? n : NaN;
  }
  function fmt(n, dec) {
    if (!isFinite(n) || Math.abs(n) >= 1e15) return "—";
    var sign = n < 0 ? "−" : "";
    var s = Math.abs(n).toFixed(dec);
    var p = s.split(".");
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return sign + (dec ? p[0] + "," + p[1] : p[0]);
  }
  function fmtR(n) {
    if (!isFinite(n) || Math.abs(n) >= 1e15) return "—";
    var sign = n < 0 ? "−" : "";
    var s = (Math.round(Math.abs(n) * 100) / 100).toFixed(2).replace(".", ",");
    s = s.replace(/,00$/, "").replace(/,(\d)0$/, ",$1");
    var p = s.split(",");
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return sign + p.join(",");
  }
  function rango(par) { return fmtR(par[0]) + "–" + fmtR(par[1]); }
  function textoProt(prot) {
    if (!prot) return "";
    return prot[0] === prot[1] ? "unos " + prot[0] + " %" : prot[0] + "–" + prot[1] + " %";
  }
  function principioTxt(v) {
    if (v === "medio") return "Medio";
    if (v === "sí, con buen manejo") return "Sí, con buen manejo";
    return "Sí";
  }
  function textoPuestaTabla(item) {
    if (item.clase === "engorde") return "No se cría para huevo. Inicio 20–60 g; final 140–180 g.";
    var p = PLANTILLAS[item.clase].puesta;
    return p.g[0] + "–" + p.g[1] + " g";
  }

  function bloqueEtapa(item, etapa) {
    var p = PLANTILLAS[item.clase];
    if (etapa === "engorde-inicio" || etapa === "engorde-final") {
      if (item.clase === "engorde" || item.clase === "campero") {
        return p[etapa === "engorde-inicio" ? "engordeInicio" : "engordeFinal"];
      }
      var base = etapa === "engorde-inicio" ? p.arranque : p.recria;
      return {
        g: base.g,
        prot: base.prot,
        pienso: base.pienso,
        calcio: false,
        adLib: false,
        nota: "No es raza de engorde industrial. Te dejo el rango de " + (etapa === "engorde-inicio" ? "arranque" : "crecimiento") + " de su tamaño (" + CLASE[item.clase].toLowerCase() + "). Para Cobb o Ross, elige esas razas."
      };
    }
    return p[etapa] || p.puesta;
  }

  function racion(item, etapa, aves) {
    var n = Math.max(0, num(aves));
    var b = bloqueEtapa(item, etapa);
    if (!b || b.noAplica) {
      return {
        aplica: false,
        aviso: (b && b.aviso) || "Esta etapa no aplica.",
        calcio: "no",
        aves: n,
        nombre: item.nombre,
        clase: CLASE[item.clase]
      };
    }
    var g = b.g;
    var toma = [g[0] / 2, g[1] / 2];
    var kgDia = [n * g[0] / 1000, n * g[1] / 1000];
    var kgToma = [kgDia[0] / 2, kgDia[1] / 2];
    var kgSem = [kgDia[0] * 7, kgDia[1] * 7];
    return {
      aplica: true,
      aviso: "",
      nombre: item.nombre,
      clase: CLASE[item.clase],
      aves: n,
      g: g,
      toma: toma,
      kgDia: kgDia,
      kgToma: kgToma,
      kgSem: kgSem,
      pienso: b.pienso,
      prot: textoProt(b.prot),
      calcio: b.calcio ? "si" : (etapa === "muda" ? "muda" : "no"),
      adLib: !!b.adLib,
      nota: b.nota || "",
      caDia: [n * 3, n * 5],
      caSem: [n * 3 * 7, n * 5 * 7]
    };
  }

  function lotesEnteros(dias, cria, vacio) {
    var hueco = cria + Math.max(0, vacio);
    if (!(dias > 0) || !(cria > 0)) return 0;
    var n = Math.floor((dias + vacio) / hueco);
    if (n < 1 && dias + 0.01 >= cria * 0.95) n = 1;
    return n;
  }
  function plan(state) {
    var dias = Math.max(0, num(state.meses)) * DIAS_MES;
    var vacio = Math.max(0, num(state.vacio));
    if (!isFinite(vacio)) vacio = 14;
    var clase = state.clase;
    var obj = state.objetivo;
    if (clase === "engorde") {
      var n = lotesEnteros(dias, LOTE_ENGORDE, vacio);
      var segs = [];
      segs.push({ id: "engordeInicio", from: 0, to: 21 });
      segs.push({ id: "engordeFinal", from: 21, to: LOTE_ENGORDE });
      return {
        nLots: n, diasBase: LOTE_ENGORDE, segs: n ? segs : [], huevos: false,
        aviso: "Pollos de engorde (Cobb o Ross): cada lote dura 7 semanas y luego " + Math.round(vacio) + " días de vacío para limpiar. Solo cuentan lotes enteros."
      };
    }
    if (clase === "campero" && obj === "carne") {
      var nC = lotesEnteros(dias, LOTE_CAMPERO, vacio);
      var segsC = [];
      segsC.push({ id: "engordeInicio", from: 0, to: 21 });
      segsC.push({ id: "engordeFinal", from: 21, to: LOTE_CAMPERO });
      return {
        nLots: nC, diasBase: LOTE_CAMPERO, segs: nC ? segsC : [], huevos: false,
        aviso: "Campero de carne: cada lote dura 10 semanas y luego " + Math.round(vacio) + " días de vacío. Solo cuentan lotes enteros. No es la rampa de Cobb o Ross."
      };
    }
    if (obj === "carne") {
      return {
        nLots: 1, diasBase: dias, segs: dias > 0 ? [{ id: "recria", from: 0, to: dias }] : [], huevos: false,
        aviso: "Carne con esta raza: entra el pienso de crecimiento durante todo el plazo, sin huevos. No es un pollo de engorde industrial (Cobb o Ross)."
      };
    }
    var hayHuevos = state.huevosAplica !== false;
    if (state.inicio === "pollito") {
      var segsP = [];
      var a = Math.min(42, dias);
      if (a > 0) segsP.push({ id: "arranque", from: 0, to: a });
      var b = Math.min(126, dias);
      if (b > 42) segsP.push({ id: "recria", from: 42, to: b });
      if (dias > 126) segsP.push({ id: "puesta", from: 126, to: dias });
      var avisoP = "Empiezas con pollitos. El pienso de postura entra hacia la semana 18. Los huevos no cuentan hasta unos 5 meses (la puesta suele arrancar entre las 18 y las 22 semanas).";
      if (state.huevosOpcional) avisoP += " En el campero, los huevos solo entran si se deja de adulto.";
      return { nLots: 1, diasBase: dias, segs: segsP, huevos: hayHuevos, aviso: avisoP };
    }
    var avisoL = "Empiezas con pollitas cerca de poner: huevos y pienso de postura desde el primer día del plazo.";
    if (state.huevosOpcional) avisoL += " En el campero, esos huevos solo cuentan si de verdad se deja de adulta. Si no, pon 0.";
    if (!hayHuevos) avisoL = "Esta raza no se cría para huevo.";
    return {
      nLots: 1, diasBase: dias,
      segs: dias > 0 ? [{ id: "puesta", from: 0, to: dias }] : [],
      huevos: hayHuevos, aviso: avisoL
    };
  }

  function precioDe(state, id) {
    var propio = state.precioEtapa ? numOrNull(state.precioEtapa[id]) : null;
    return propio == null ? num(state.precioPienso) : propio;
  }

  var GRAMOS_ID = {
    arranque: "c-g-arranque",
    recria: "c-g-recria",
    puesta: "c-g-puesta",
    engordeInicio: "c-g-einicio",
    engordeFinal: "c-g-efinal"
  };
  var PRECIO_ID = {
    arranque: "c-p-arranque",
    recria: "c-p-recria",
    puesta: "c-p-puesta",
    engordeInicio: "c-p-einicio",
    engordeFinal: "c-p-efinal"
  };

  function validarEstado(state) {
    var errores = {};
    var avisos = {};
    function tomar(id, raw, opts) {
      var leido = leerNumero(raw, opts);
      if (!leido.ok) errores[id] = leido.error;
      else if (leido.aviso) avisos[id] = leido.aviso;
      return leido;
    }
    tomar("c-aves", state.aves, { min: 1, max: 100000, entero: true, enteroMsg: "Escribe un número entero de aves." });
    tomar("c-mortalidad", state.mortalidad, { min: 0, max: 100 });
    tomar("c-meses", state.meses, { min: 0.01, max: 120 });
    tomar("c-vacio", state.vacio, { min: 0, max: 365, entero: true, enteroMsg: "Escribe un número entero de días." });
    tomar("c-precio-ave", state.precioAve, { min: 0, max: 1000000 });
    tomar("c-precio-pienso", state.precioPienso, { min: 0, max: 1000000 });
    tomar("c-instalacion", state.instalacion, { min: 0, max: 100000000 });
    tomar("c-anios", state.anios, { min: 0, max: 50 });
    tomar("c-otros", state.otrosMes, { min: 0, max: 10000000 });
    if (state.manoModo === "horas") {
      tomar("c-horas", state.horasDia, { min: 0, max: 24 });
      tomar("c-precio-hora", state.precioHora, { min: 0, max: 1000000 });
    } else {
      tomar("c-mano-mes", state.manoMes, { min: 0, max: 10000000 });
    }
    Object.keys(PRECIO_ID).forEach(function (id) {
      var raw = state.precioEtapa ? state.precioEtapa[id] : "";
      if (raw == null || String(raw).trim() === "") return;
      tomar(PRECIO_ID[id], raw, { min: 0, max: 1000000 });
    });
    var pl = plan(state);
    var usados = {};
    (pl.segs || []).forEach(function (seg) { usados[seg.id] = true; });
    Object.keys(GRAMOS_ID).forEach(function (id) {
      if (!usados[id]) return;
      tomar(GRAMOS_ID[id], state.gramos && state.gramos[id], { min: 1, max: 500 });
    });
    if (pl.huevos) {
      tomar("c-huevos", state.huevosAnio, { min: 0, max: 400 });
      tomar("c-precio-huevo", state.precioHuevo, { min: 0, max: 100000 });
      tomar("c-vendibles", state.vendibles, { min: 0, max: 100 });
    }
    var venta = state.precioVenta;
    if (venta != null && String(venta).trim() !== "") tomar("c-precio-venta", venta, { min: 0, max: 10000000 });
    var peso = state.pesoKg;
    if (state.ventaModo === "kg") tomar("c-peso", peso, { min: 0.01, max: 30 });
    else if (peso != null && String(peso).trim() !== "") tomar("c-peso", peso, { min: 0, max: 30 });
    return { ok: Object.keys(errores).length === 0, errores: errores, avisos: avisos };
  }

  function calcular(state) {
    var chequeo = validarEstado(state);
    if (!chequeo.ok) {
      return { ok: false, error: "Revisa los campos marcados.", errores: chequeo.errores, avisos: chequeo.avisos, luz: "" };
    }
    var avesPedidas = Math.max(0, num(state.aves, true));
    var aves = avesPedidas;
    var tope = "";
    if (aves > 100000) {
      aves = 100000;
      tope = "El máximo de esta cuenta es 100.000 aves.";
    }
    var mort = Math.min(100, Math.max(0, num(state.mortalidad))) / 100;
    var meses = Math.max(0, num(state.meses));
    var pl = plan(state);
    if (!(aves > 0) || !(meses > 0)) {
      return { ok: false, error: "Escribe el número de aves y los meses del ciclo.", errores: chequeo.errores, avisos: chequeo.avisos, luz: "" };
    }
    var etapas = [];
    var kg = 0;
    var costePienso = 0;
    pl.segs.forEach(function (seg) {
      var len = seg.to - seg.from;
      if (!(len > 0) || !(pl.diasBase > 0)) return;
      var t0 = seg.from / pl.diasBase;
      var t1 = seg.to / pl.diasBase;
      var birds = aves * (1 - mort * (t0 + t1) / 2);
      var gramos = num(state.gramos && state.gramos[seg.id]);
      var precio = precioDe(state, seg.id);
      var kgSeg = birds * (gramos / 1000) * len * pl.nLots;
      var coste = kgSeg * precio;
      kg += kgSeg;
      costePienso += coste;
      etapas.push({ id: seg.id, dias: len, aves: birds, gramos: gramos, kg: kgSeg, coste: coste, precio: precio });
    });
    var costeAves = aves * pl.nLots * num(state.precioAve);
    var anios = num(state.anios);
    var costeInst = anios > 0 ? num(state.instalacion) * (meses / 12) / anios : 0;
    var costeMano = state.manoModo === "horas"
      ? num(state.horasDia) * num(state.precioHora) * meses * DIAS_MES
      : num(state.manoMes) * meses;
    var costeOtros = num(state.otrosMes) * meses;
    var manoCero = state.manoModo === "horas"
      ? !(num(state.horasDia) > 0 && num(state.precioHora) > 0)
      : !(num(state.manoMes) > 0);
    var raro = aves === 1 && num(state.otrosMes) >= 100
      ? "Revisa la cifra: 1 ave con otros costes muy altos. El punto es decimal: si querías mil, escribe 1000."
      : "";
    var costes = costePienso + costeAves + costeInst + costeMano + costeOtros;
    var huevosProd = 0;
    var dias = meses * DIAS_MES;
    if (pl.huevos && dias > 0) {
      var start = state.inicio === "pollito" ? EGG_START : 0;
      var laying = Math.max(0, dias - start);
      if (laying > 0) {
        var t0e = (dias - laying) / dias;
        var birdsE = aves * (1 - mort * (t0e + 1) / 2);
        huevosProd = birdsE * num(state.huevosAnio) * (laying / 365);
      }
    }
    var vend = Math.min(100, Math.max(0, num(state.vendibles))) / 100;
    var huevosVend = huevosProd * vend;
    var precioUnidad = state.huevoModo === "docena" ? num(state.precioHuevo) / 12 : num(state.precioHuevo);
    var ingresoHuevos = huevosVend * precioUnidad;
    var vivos = aves * (1 - mort) * pl.nLots;
    var ingresoAves = state.ventaModo === "kg"
      ? vivos * num(state.pesoKg) * num(state.precioVenta)
      : vivos * num(state.precioVenta);
    var ingresos = ingresoHuevos + ingresoAves;
    var beneficio = ingresos - costes;
    var margen = null;
    if (ingresos > 0) margen = beneficio / ingresos * 100;
    else if (costes > 0) margen = -100;
    var netoHuevo = costes - ingresoAves;
    var costeHuevo = huevosVend > 0 ? Math.max(0, netoHuevo) / huevosVend : null;
    var costeDocena = costeHuevo == null ? null : costeHuevo * 12;
    var minDocena = costeDocena;
    var minAve = vivos > 0 ? (costes - ingresoHuevos) / vivos : null;
    var hayPrecio = num(state.precioPienso) > 0 || num(state.precioHuevo) > 0 || num(state.precioVenta) > 0 || num(state.precioAve) > 0;
    if (!hayPrecio) {
      return { ok: false, vacio: true, error: "Escribe los precios", avisos: chequeo.avisos, luz: "" };
    }
    var luz = "";
    var faltan = "";
    if (margen != null && (costes > 0 || ingresos > 0)) {
      if (manoCero) {
        luz = "faltan";
        faltan = "Faltan costes. Con la mano de obra a 0 el semáforo no se pone en verde.";
      } else if (margen > 15) luz = "verde";
      else if (margen >= 0) luz = "ambar";
      else luz = "rojo";
    }
    return {
      ok: true,
      error: "",
      aviso: [pl.aviso, tope, raro, faltan].filter(Boolean).join(" "),
      tope: tope,
      raro: raro,
      faltan: faltan,
      nLots: pl.nLots,
      etapas: etapas,
      kg: kg,
      kgMes: meses > 0 ? kg / meses : 0,
      costePienso: costePienso,
      costeAves: costeAves,
      costeInst: costeInst,
      costeMano: costeMano,
      costeOtros: costeOtros,
      costes: costes,
      huevosProd: Math.round(huevosProd),
      huevosVend: Math.round(huevosVend),
      ingresoHuevos: ingresoHuevos,
      ingresoAves: ingresoAves,
      ingresos: ingresos,
      beneficio: beneficio,
      margen: margen,
      netoHuevo: netoHuevo,
      costeHuevo: costeHuevo,
      costeDocena: costeDocena,
      avisos: chequeo.avisos,
      minDocena: minDocena,
      minAve: minAve,
      vivos: Math.round(vivos),
      luz: luz,
      huevos: pl.huevos
    };
  }

  var api = {
    razas: RAZAS,
    plantillas: PLANTILLAS,
    racion: racion,
    calcular: calcular,
    leerNumero: leerNumero,
    validarEstado: validarEstado,
    plan: plan,
    porId: porId,
    fmt: fmt,
    fmtR: fmtR
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.GR_rent = api;
  if (typeof document === "undefined") return;

  var ETAPA_UI = {
    arranque: "Arranque",
    recria: "Crecimiento",
    puesta: "Postura",
    engordeInicio: "Engorde inicio",
    engordeFinal: "Engorde final"
  };
  var silent = false;
  var mesesTouched = false;
  var feederRazaTouched = false;
  var feederAvesTouched = false;
  var saveTimer = 0;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[m];
    });
  }
  function campo(id) { return num($("c-" + id) ? $("c-" + id).value : 0); }
  function radio(name) {
    var el = document.querySelector("input[name='" + name + "']:checked");
    return el ? el.value : "";
  }
  var MONEDA = {
    EUR: { s: "€", delante: false, etiq: "€" },
    MXN: { s: "$", delante: true, etiq: "MXN" },
    COP: { s: "$", delante: true, etiq: "COP" },
    PEN: { s: "S/", delante: true, etiq: "PEN" },
    ARS: { s: "$", delante: true, etiq: "ARS" },
    USD: { s: "US$", delante: true, etiq: "US$" }
  };
  function monedaActual() {
    var m = ($("c-moneda") && $("c-moneda").value) || "EUR";
    if (m === "€") m = "EUR";
    if (m === "$") m = "MXN";
    if (m === "otra" || m === "OTRA") {
      var t = ($("c-moneda-custom") && $("c-moneda-custom").value || "").trim().slice(0, 4);
      return { s: t || "¤", delante: true, etiq: t || "¤" };
    }
    return MONEDA[m] || MONEDA.EUR;
  }
  function simbolo() { return monedaActual().s; }
  function cifra(n, dec) {
    var m = monedaActual();
    var t = fmt(n, dec == null ? 2 : dec);
    return m.delante ? m.s + " " + t : t + " " + m.s;
  }
  function dinero(n) { return esc(cifra(n)); }
  function etiquetasMoneda() {
    var et = monedaActual().etiq;
    document.querySelectorAll("[data-etiq]").forEach(function (el) {
      if (el.id === "lbl-venta-txt") return;
      var base = el.getAttribute("data-etiq");
      el.textContent = base + " (" + et + ")";
    });
    var venta = $("lbl-venta-txt");
    if (venta) {
      var st = radio("objetivo");
      var baseV = st === "huevo" ? "Precio de la gallina de desvieje" : "Precio de venta del ave";
      venta.textContent = baseV + " (" + et + ")";
    }
  }
  function poner(id, texto) { if ($(id)) $(id).textContent = texto; }
  function mostrar(id, on) { var el = $(id); if (el) el.hidden = !on; }

  function fillSelect(select, selected) {
    var grupos = [
      ["hibrida", "Híbridas y cruces de huevo"],
      ["engorde", "Engorde y campero"],
      ["raza", "Razas"]
    ];
    select.innerHTML = "";
    grupos.forEach(function (g) {
      var og = document.createElement("optgroup");
      og.label = g[1];
      RAZAS.forEach(function (item) {
        if (item.grupo !== g[0]) return;
        var op = document.createElement("option");
        op.value = item.id;
        op.textContent = item.nombre;
        og.appendChild(op);
      });
      select.appendChild(og);
    });
    select.value = selected || "isa-brown";
  }

  function hintsDe(item) {
    ["arranque", "recria", "puesta", "engordeInicio", "engordeFinal"].forEach(function (id) {
      var b = bloqueEtapa(item, id === "engordeInicio" ? "engorde-inicio" : id === "engordeFinal" ? "engorde-final" : id);
      var el = $("hint-" + id);
      if (!el) return;
      if (!b || b.noAplica || !b.g) {
        el.textContent = (b && b.aviso) || "";
        return;
      }
      el.textContent = "Orientativo: " + b.g[0] + "–" + b.g[1] + " g/ave/día. Proteína " + textoProt(b.prot) + (b.calcio ? ", más calcio aparte." : ".") + " Ajusta según la etiqueta de tu pienso.";
    });
    var h = $("hint-huevos");
    if (h) {
      if (!item.huevos) h.textContent = "No se cría para huevo. Esta cuenta no suma huevos.";
      else h.textContent = "Rango orientativo de " + item.nombre + ": " + item.huevosTexto + ". Tamaño " + CLASE[item.clase].toLowerCase() + ". El punto medio es editable.";
    }
    var n = $("nota-raza");
    if (n) {
      n.textContent = item.nombre + " · " + item.origen + " · " + item.caracter + " · para empezar: " + principioTxt(item.principio) + " · tamaño " + CLASE[item.clase].toLowerCase() + ".";
    }
  }

  function setCampo(id, n) {
    var el = $("c-" + id);
    if (!el) return;
    el.value = fmtR(n).replace(/\./g, "");
  }

  function aplicarRaza(item) {
    var p = PLANTILLAS[item.clase];
    function mid(b) { return b && b.g ? medio(b.g) : 0; }
    setCampo("g-arranque", mid(p.arranque));
    setCampo("g-recria", mid(p.recria));
    setCampo("g-puesta", mid(p.puesta));
    setCampo("g-einicio", mid(p.engordeInicio || p.arranque));
    setCampo("g-efinal", mid(p.engordeFinal || p.recria));
    var huevos = $("c-huevos");
    if (item.huevos) {
      huevos.disabled = false;
      setCampo("huevos", medio(item.huevos));
    } else {
      huevos.value = "";
      huevos.disabled = true;
    }
    hintsDe(item);
    if (item.clase === "engorde") setCampo("meses", 1.6);
    else if (item.clase === "campero" && radio("objetivo") === "carne") setCampo("meses", 2.8);
    if (!feederRazaTouched) {
      $("f-raza").value = item.id;
      if (item.clase === "engorde" || (item.clase === "campero" && radio("objetivo") === "carne")) $("f-etapa").value = "engorde-inicio";
      else if ($("f-etapa").value.indexOf("engorde") === 0 && item.clase !== "campero") $("f-etapa").value = "puesta";
    }
  }

  function estado() {
    var item = porId($("c-raza").value);
    return {
      clase: item.clase,
      huevosAplica: !!item.huevos,
      huevosOpcional: !!item.huevosOpcional,
      objetivo: radio("objetivo") || "huevo",
      inicio: radio("inicio") || "pollita",
      aves: $("c-aves").value,
      mortalidad: $("c-mortalidad").value,
      meses: $("c-meses").value,
      vacio: $("c-vacio") ? $("c-vacio").value : 14,
      precioAve: $("c-precio-ave").value,
      precioPienso: $("c-precio-pienso").value,
      precioEtapa: {
        arranque: $("c-p-arranque").value,
        recria: $("c-p-recria").value,
        puesta: $("c-p-puesta").value,
        engordeInicio: $("c-p-einicio").value,
        engordeFinal: $("c-p-efinal").value
      },
      gramos: {
        arranque: $("c-g-arranque").value,
        recria: $("c-g-recria").value,
        puesta: $("c-g-puesta").value,
        engordeInicio: $("c-g-einicio").value,
        engordeFinal: $("c-g-efinal").value
      },
      huevosAnio: item.huevos ? $("c-huevos").value : 0,
      instalacion: $("c-instalacion").value,
      anios: $("c-anios").value,
      manoModo: radio("mano") || "mes",
      horasDia: $("c-horas").value,
      precioHora: $("c-precio-hora").value,
      manoMes: $("c-mano-mes").value,
      otrosMes: $("c-otros").value,
      huevoModo: radio("huevo-modo") || "docena",
      precioHuevo: $("c-precio-huevo").value,
      vendibles: $("c-vendibles").value,
      ventaModo: radio("venta-modo") || "unidad",
      precioVenta: $("c-precio-venta").value,
      pesoKg: $("c-peso").value
    };
  }

  function syncCampos(st) {
    var pl = plan(st);
    var usados = {};
    pl.segs.forEach(function (s) { usados[s.id] = true; });
    mostrar("grp-arranque", !!usados.arranque);
    mostrar("grp-recria", !!usados.recria);
    mostrar("grp-puesta", !!usados.puesta);
    mostrar("grp-einicio", !!usados.engordeInicio);
    mostrar("grp-efinal", !!usados.engordeFinal);
    mostrar("grp-huevos", pl.huevos);
    mostrar("grp-vendibles", pl.huevos);
    mostrar("grp-precio-huevo", pl.huevos);
    mostrar("grp-horas", st.manoModo === "horas");
    mostrar("grp-mano-mes", st.manoModo !== "horas");
    mostrar("grp-peso", st.ventaModo === "kg");
    mostrar("grp-custom", $("c-moneda").value === "OTRA" || $("c-moneda").value === "otra");
    etiquetasMoneda();
    var nota = $("nota-plan");
    if (nota) nota.textContent = pl.aviso;
    var ini = document.getElementById("grp-inicio");
    if (ini) ini.hidden = st.clase === "engorde" || (st.clase === "campero" && st.objetivo === "carne");
  }

  function fila(nombre, valor) {
    return "<div><dt>" + esc(nombre) + "</dt><dd>" + valor + "</dd></div>";
  }

  function pintar(res) {
    var luz = $("semaforo");
    var resumen = $("out-resumen");
    var box = $("out-desglose");
    if (!res.ok) {
      luz.className = "semaforo";
      luz.textContent = res.error;
      resumen.textContent = "";
      box.innerHTML = "";
      draw($("calc-chart"), 0, 0, true);
      return;
    }
    var nombres = {
      verde: "Verde: margen por encima del 15 %.",
      ambar: "Ámbar: margen entre 0 % y 15 %.",
      rojo: "Rojo: el lote sale a pérdida."
    };
    var margenTxt = res.margen == null ? "" : (res.margen < -100 ? " Margen < −100 %." : " Margen " + fmt(res.margen, 1) + " %.");
    var cola = (res.tope ? " " + res.tope : "") + (res.raro ? " " + res.raro : "");
    luz.className = "semaforo " + (res.luz || "");
    if (res.luz === "faltan") luz.textContent = res.faltan + margenTxt + cola;
    else if (res.luz) luz.textContent = nombres[res.luz] + margenTxt + cola;
    else luz.textContent = "Escribe precios para ver el semáforo.";
    var extra = res.nLots > 1 ? " Lotes enteros en el plazo: " + String(res.nLots) + "." : (res.nLots === 1 ? " Lotes enteros en el plazo: 1." : " No cabe un lote entero en ese plazo.");
    resumen.textContent = "Beneficio " + cifra(res.beneficio) + ". Ingresos " + cifra(res.ingresos) + ". Costes " + cifra(res.costes) + "." + extra;
    var html = "";
    html += fila("Pienso", dinero(res.costePienso));
    res.etapas.forEach(function (e) {
      html += fila(ETAPA_UI[e.id] || e.id, esc(fmtR(e.gramos) + " g/ave/día · " + fmtR(e.kg) + " kg · " + cifra(e.coste)));
    });
    html += fila("Aves compradas", dinero(res.costeAves));
    html += fila("Instalaciones (amortizadas)", dinero(res.costeInst));
    html += fila("Mano de obra", dinero(res.costeMano));
    html += fila("Otros costes", dinero(res.costeOtros));
    html += fila("Costes totales", dinero(res.costes));
    if (res.huevos) {
      html += fila("Huevos producidos", esc(fmtR(res.huevosProd)));
      html += fila("Huevos vendidos", esc(fmtR(res.huevosVend)));
      html += fila("Ingresos por huevos", dinero(res.ingresoHuevos));
    } else {
      html += fila("Huevos", "No entran en esta cuenta");
    }
    html += fila("Ingresos por venta de aves", dinero(res.ingresoAves));
    html += fila("Beneficio neto", dinero(res.beneficio));
    html += fila("Margen", res.margen == null ? "—" : esc(res.margen < -100 ? "< −100 %" : fmt(res.margen, 1) + " %"));
    if (res.costeHuevo != null) {
      if (res.netoHuevo <= 0) {
        html += fila("Coste por huevo", esc("0 (las aves ya cubren el coste)"));
        html += fila("Coste por docena", esc("0 (las aves ya cubren el coste)"));
      } else {
        var decHuevo = 3;
        if (res.costeHuevo !== 0 && Math.abs(Math.round(res.costeHuevo * 1000) / 1000) === 0) decHuevo = 4;
        html += fila("Coste por huevo", esc(cifra(res.costeHuevo, decHuevo)));
        html += fila("Coste por docena", dinero(res.costeDocena));
      }
      html += fila("Precio mínimo de la docena", res.minDocena <= 0 ? esc(cifra(0)) + " (las aves ya cubren el coste)" : dinero(res.minDocena));
    }
    if (!res.huevos && res.minAve != null) html += fila("Precio mínimo por ave", dinero(res.minAve));
    html += fila("Pienso total", esc(fmtR(res.kg) + " kg"));
    html += fila("Pienso al mes (media)", esc(fmtR(res.kgMes) + " kg. La mortalidad se reparte a lo largo del plazo."));
    box.innerHTML = html;
    draw($("calc-chart"), res.costes, res.ingresos);
    $("calc-chart").setAttribute("aria-label", "Gráfica de barras: costes " + cifra(res.costes) + ", ingresos " + cifra(res.ingresos));
  }

  function draw(canvas, cost, income, vacio) {
    if (!canvas || !canvas.getContext) return;
    var cssW = canvas.clientWidth || 320;
    var cssH = 180;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);
    if (vacio) return;
    var max = Math.max(cost, income, 1);
    var bars = [
      { label: "Costes", value: Math.max(0, cost), color: "#8C2F2F" },
      { label: "Ingresos", value: Math.max(0, income), color: "#1F5E2E" }
    ];
    var gap = 28;
    var bw = Math.min(120, (cssW - gap * 3) / 2);
    var base = cssH - 36;
    var top = 28;
    bars.forEach(function (bar, i) {
      var h = (base - top) * (bar.value / max);
      var x = cssW / 2 - bw - gap / 2 + i * (bw + gap);
      var y = base - h;
      ctx.fillStyle = bar.color;
      ctx.fillRect(x, y, bw, Math.max(h, 0));
      ctx.fillStyle = "#0F3D1C";
      ctx.font = "700 14px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(bar.label, x + bw / 2, cssH - 14);
      ctx.font = "700 13px system-ui, sans-serif";
      ctx.fillText(fmt(bar.value, 0), x + bw / 2, Math.max(16, y - 6));
    });
  }

  function textoRango(par, unidad) {
    return rango(par) + " " + unidad;
  }

  function pintarComedero() {
    var item = porId($("f-raza").value);
    var etapa = $("f-etapa").value;
    var campoAves = $("f-aves");
    var leido = leerNumero(campoAves ? campoAves.value : "", {
      min: 1,
      max: 100000,
      entero: true,
      enteroMsg: "Escribe un número entero de aves."
    });
    avisoCampo(campoAves, leido.ok ? "" : leido.error);
    var out = $("f-out");
    if (!leido.ok) {
      if (out) out.innerHTML = "<p class=\"racion-aviso\">" + esc(leido.error) + "</p>";
      return;
    }
    var aves = leido.value;
    var r = racion(item, etapa, aves);
    if (!r.aplica) {
      out.innerHTML = "<p class=\"racion-aviso\">" + esc(r.aviso) + "</p>" + bloqueCalcio("no", r);
      return;
    }
    var html = "<div class=\"racion-head\">";
    html += "<p class=\"racion-g\"><strong>" + esc(textoRango(r.g, "g")) + "</strong> por ave y día</p>";
    html += "<p class=\"tomas\"><strong>Reparte en 2 tomas:</strong> " + esc(textoRango(r.toma, "g")) + " por la mañana y " + esc(textoRango(r.toma, "g")) + " por la tarde.";
    html += " En el lote, por toma: <strong>" + esc(textoRango(r.kgToma, "kg")) + "</strong> (" + esc(textoRango(r.kgDia, "kg")) + " al día, " + esc(textoRango(r.kgSem, "kg")) + " a la semana).</p>";
    html += "</div>";
    html += bloqueCalcio(r.calcio, r);
    html += "<ul class=\"racion-meta\">";
    html += "<li>Tipo de pienso: " + esc(r.pienso) + ".</li>";
    html += "<li>Proteína orientativa: " + esc(r.prot) + ".</li>";
    html += "<li>" + esc(fmtR(r.aves)) + " aves · tamaño " + esc(r.clase.toLowerCase()) + ".</li>";
    html += "</ul>";
    if (r.nota) html += "<p class=\"hint\">" + esc(r.nota) + "</p>";
    if (r.adLib) html += "<p class=\"hint\">A libre disposición: repón a menudo. Aun así, no llenes el comedero más de la mitad para que no lo tiren.</p>";
    else html += "<p class=\"hint\">Llena los comederos solo hasta la mitad para no desperdiciar.</p>";
    html += "<p class=\"hint\">Todo es orientativo; ajusta según la etiqueta de tu pienso.</p>";
    out.innerHTML = html;
  }

  function bloqueCalcio(flag, r) {
    if (flag === "si") {
      return "<div class=\"calcio\"><p><strong>El pienso de postura ya lleva el calcio.</strong> Deja además concha o grit a libre disposición: cada gallina toma lo que le falta (suele ser poco).</p>" +
        "<p>Por el día: calcio fino (carbonato en polvo o grano fino). Por la tarde-noche: calcio grueso (concha de ostra o grano grueso), que se queda más tiempo en la molleja mientras se forma la cáscara y se desperdicia menos.</p>" +
        "<p class=\"hint\">Orientativo. Esos 3–5 g que a veces se citan son la necesidad total del día, no un suplemento encima del pienso. Si compras concha aparte, súmala en otros costes.</p></div>";
    }
    if (flag === "muda") {
      return "<div class=\"calcio calcio-no\"><p><strong>Calcio:</strong> en muda la puesta se para o baja mucho. No añadas calcio como si estuvieran en puesta. Si alguna sigue poniendo, deja un poco a libre disposición. Orientativo.</p></div>";
    }
    return "<div class=\"calcio calcio-no\"><p><strong>No añadir calcio extra.</strong> En pollitas, crecimiento y engorde puede dañar los riñones. El calcio de más es para la postura, a partir del primer huevo.</p></div>";
  }

  function pintarTabla() {
    var body = $("tabla-razas");
    if (!body) return;
    body.innerHTML = RAZAS.map(function (item) {
      return "<tr><th scope=\"row\">" + esc(item.nombre) + "</th><td>" + esc(item.origen) + "</td><td>" + esc(item.huevosTexto) + "</td><td>" + esc(item.caracter) + "</td><td>" + esc(principioTxt(item.principio)) + "</td><td>" + esc(CLASE[item.clase]) + "</td><td>" + esc(textoPuestaTabla(item)) + "</td></tr>";
    }).join("");
  }

  function guardar() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      try {
        var data = { v: 1 };
        document.querySelectorAll("[data-save]").forEach(function (el) {
          if (el.type === "radio") {
            if (el.checked) data[el.name] = el.value;
          } else data[el.id] = el.value;
        });
        localStorage.setItem(STORE, JSON.stringify(data));
      } catch (e) {}
    }, 200);
  }

  function cargar() {
    try {
      var raw = localStorage.getItem(STORE);
      if (!raw) return false;
      var data = JSON.parse(raw);
      if (!data || data.v !== 1) return false;
      silent = true;
      Object.keys(data).forEach(function (k) {
        if (k === "v") return;
        var el = document.getElementById(k);
        if (el && el.type !== "radio") el.value = data[k];
        if (data[k] && document.querySelector("input[name='" + k + "']")) {
          var radioEl = document.querySelector("input[name='" + k + "'][value='" + data[k] + "']");
          if (radioEl) radioEl.checked = true;
        }
      });
      silent = false;
      hintsDe(porId($("c-raza").value));
      return true;
    } catch (e) {
      silent = false;
      return false;
    }
  }

  function ejemplo() {
    silent = true;
    $("c-raza").value = "isa-brown";
    document.querySelector("input[name='objetivo'][value='huevo']").checked = true;
    document.querySelector("input[name='inicio'][value='pollita']").checked = true;
    $("c-aves").value = "100";
    $("c-mortalidad").value = "5";
    $("c-meses").value = "12";
    $("c-precio-ave").value = "7";
    $("c-precio-pienso").value = "0,52";
    ["c-p-arranque", "c-p-recria", "c-p-puesta", "c-p-einicio", "c-p-efinal", "c-horas", "c-precio-hora", "c-precio-venta", "c-peso"].forEach(function (id) {
      if ($(id)) $(id).value = "";
    });
    $("c-instalacion").value = "1500";
    $("c-mano-mes").value = "150";
    $("c-otros").value = "95";
    if ($("c-vacio")) $("c-vacio").value = "14";
    $("c-anios").value = "5";
    document.querySelector("input[name='mano'][value='mes']").checked = true;
    document.querySelector("input[name='huevo-modo'][value='docena']").checked = true;
    $("c-precio-huevo").value = "3";
    $("c-vendibles").value = "95";
    document.querySelector("input[name='venta-modo'][value='unidad']").checked = true;
    $("c-moneda").value = "EUR";
    $("c-moneda").removeAttribute("data-auto");
    mesesTouched = true;
    silent = false;
    aplicarRaza(porId("isa-brown"));
    $("c-huevos").value = "280";
    $("c-g-puesta").value = "117,5";
    if (!feederRazaTouched) {
      $("f-raza").value = "isa-brown";
      $("f-etapa").value = "puesta";
    }
    if (!feederAvesTouched) $("f-aves").value = "100";
    var notaEj = document.getElementById("nota-ejemplo");
    if (notaEj) notaEj.hidden = false;
    refrescar();
    var destino = $("rent-out");
    if (destino && destino.scrollIntoView) destino.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function avisoCampo(el, texto) {
    if (!el) return;
    var id = el.id || el.getAttribute("name") || "";
    var msg = el.parentNode && el.parentNode.querySelector(".field-error[data-for='" + id + "']");
    if (!texto) {
      el.classList.remove("is-invalid");
      el.removeAttribute("aria-invalid");
      if (msg) msg.remove();
      return;
    }
    el.classList.add("is-invalid");
    el.setAttribute("aria-invalid", "true");
    if (!msg) {
      msg = document.createElement("p");
      msg.className = "field-error";
      msg.setAttribute("data-for", id);
      msg.setAttribute("role", "alert");
      el.insertAdjacentElement("afterend", msg);
    }
    msg.textContent = texto;
  }
  function pistaCampo(el, texto) {
    if (!el) return;
    var id = el.id || el.getAttribute("name") || "";
    var msg = el.parentNode && el.parentNode.querySelector(".field-hint[data-for='" + id + "']");
    if (!texto) {
      if (msg) msg.remove();
      return;
    }
    if (!msg) {
      msg = document.createElement("p");
      msg.className = "field-hint";
      msg.setAttribute("data-for", id);
      el.insertAdjacentElement("afterend", msg);
    }
    msg.textContent = texto;
  }
  function pintarAvisos(errores, avisos) {
    errores = errores || {};
    avisos = avisos || {};
    document.querySelectorAll("#calc-form input").forEach(function (el) {
      if (!el.id) return;
      avisoCampo(el, errores[el.id] || "");
      pistaCampo(el, errores[el.id] ? "" : (avisos[el.id] || ""));
    });
  }
  function refrescar() {
    var st = estado();
    syncCampos(st);
    var res = calcular(st);
    pintarAvisos(res.errores, res.avisos);
    pintar(res);
    pintarComedero();
    guardar();
  }

  function boot() {
    var form = $("calc-form");
    if (!form) return;
    fillSelect($("c-raza"), "isa-brown");
    fillSelect($("f-raza"), "isa-brown");
    pintarTabla();
    var tenia = cargar();
    function monedaDePais(code) {
      var porPais = { MX: "MXN", CO: "COP", PE: "PEN", AR: "ARS", ES: "EUR", US: "USD" };
      return porPais[String(code || "").toUpperCase()] || "MXN";
    }
    if ($("c-moneda")) {
      var legado = { "€": "EUR", "$": "MXN", otra: "OTRA" };
      if (legado[$("c-moneda").value]) $("c-moneda").value = legado[$("c-moneda").value];
      if (!tenia) {
        var paisCalc = (document.documentElement && document.documentElement.dataset.pais) || "MX";
        $("c-moneda").value = monedaDePais(paisCalc);
        $("c-moneda").dataset.auto = "1";
      }
      $("c-moneda").addEventListener("change", function () {
        $("c-moneda").removeAttribute("data-auto");
      });
    }
    window.addEventListener("gr-pais", function (ev) {
      var selMon = $("c-moneda");
      if (!selMon || selMon.dataset.auto !== "1") return;
      selMon.value = monedaDePais(ev.detail);
      refrescar();
    });
    if (!tenia) aplicarRaza(porId("isa-brown"));
    form.addEventListener("submit", function (e) { e.preventDefault(); refrescar(); });
    document.querySelectorAll("#calc-form input, #calc-form select, #calc-form textarea").forEach(function (el) {
      el.addEventListener("input", function () {
        if (el.id === "c-meses") mesesTouched = true;
        if (el.id === "c-raza") return;
        refrescar();
      });
      el.addEventListener("change", function () {
        if (el.id === "c-raza" && !silent) aplicarRaza(porId(el.value));
        if (el.name === "objetivo" && !silent) {
          var elegida = porId($("c-raza").value);
          if (elegida.clase === "engorde") setCampo("meses", 1.6);
          if (elegida.clase === "campero" && el.value === "carne") setCampo("meses", 2.8);
        }
        refrescar();
      });
    });
    $("f-raza").addEventListener("change", function () {
      feederRazaTouched = true;
      var item = porId($("f-raza").value);
      if (item.clase === "engorde") $("f-etapa").value = "engorde-inicio";
      pintarComedero();
    });
    $("f-etapa").addEventListener("change", pintarComedero);
    $("f-aves").addEventListener("input", function () { feederAvesTouched = true; pintarComedero(); });
    $("c-aves").addEventListener("input", function () {
      if (!feederAvesTouched) $("f-aves").value = $("c-aves").value;
      pintarComedero();
    });
    $("btn-ejemplo").addEventListener("click", ejemplo);
    var guardarCuenta = $("btn-guardar-cuenta");
    if (guardarCuenta) guardarCuenta.addEventListener("click", function () {
      var nota = $("calc-cuenta-nota");
      if (!window.GRAuth || !GRAuth.usuario()) {
        if (window.GRAuth) GRAuth.abrir("entrar");
        if (nota) nota.textContent = "Entra para guardarla en la cuenta. En este navegador sigue igual.";
        return;
      }
      var data = { v: 1 };
      document.querySelectorAll("[data-save]").forEach(function (el) {
        if (el.type === "radio") { if (el.checked) data[el.name] = el.value; }
        else data[el.id] = el.value;
      });
      var raza = $("c-raza");
      var nombre = (raza && raza.selectedOptions && raza.selectedOptions[0] ? raza.selectedOptions[0].textContent : "Cálculo");
      var hecho = GRAuth.guardarCalculo(nombre, data);
      Promise.resolve(hecho).then(function (res) {
        if (!nota) return;
        if (res && res.ok) nota.textContent = "Guardado en la cuenta de " + GRAuth.usuario().nombre + ". También sigue en este navegador.";
        else nota.textContent = (res && res.error) || "No se pudo guardar. Inténtalo más tarde.";
      });
    });
    $("btn-reset").addEventListener("click", function () {
      try { localStorage.removeItem(STORE); } catch (e) {}
      mesesTouched = false;
      feederRazaTouched = false;
      feederAvesTouched = false;
      form.reset();
      $("c-raza").value = "isa-brown";
      $("f-raza").value = "isa-brown";
      $("f-etapa").value = "puesta";
      $("f-aves").value = "10";
      aplicarRaza(porId("isa-brown"));
      refrescar();
    });
    $("btn-print").addEventListener("click", function () { window.print(); });
    window.addEventListener("resize", function () {
      var st = estado();
      var res = calcular(st);
      if (res.ok) draw($("calc-chart"), res.costes, res.ingresos);
    });
    refrescar();
    if (/[?&]ejemplo=1(?:&|$)/.test(location.search)) ejemplo();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
