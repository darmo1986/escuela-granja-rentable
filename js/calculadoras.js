/* Calculadoras con las cifras ya citadas en las lecciones. */
(function () {
  function num(form, name) {
    var el = form.querySelector("[name=" + name + "]");
    var value = el ? String(el.value).trim().replace(",", ".") : "";
    var n = value === "" ? NaN : Number(value);
    return isFinite(n) ? n : NaN;
  }
  function money(n, precision) {
    if (!isFinite(n)) return "—";
    return n.toLocaleString('es-ES', { maximumFractionDigits: precision || 2, minimumFractionDigits: 2 });
  }
  function espacio(tipo, aves, kg) {
    if (!Number.isSafeInteger(aves) || aves < 1) return { error: "Escribe un número entero de aves, mayor que cero." };
    var n = aves;
    if (tipo === "ponedora_patio") {
      return { text: n + " ponedoras en patio: dentro, entre " + money(n * 0.28) + " y " + money(n * 0.37) + " m². Fuera, unos " + money(n * 0.93) + " m². También hace falta 1 ponedero cada 4 o 5 gallinas." };
    }
    if (tipo === "ponedora_suelo") {
      return { text: n + " ponedoras en suelo, al tope de 9 por m²: al menos " + money(n / 9) + " m² utilizables. La lección también cita 1 nido cada 7 y 15 cm de aseladero por ave." };
    }
    if (tipo === "engorde") {
      if (!Number.isFinite(kg) || !(kg > 0)) return { error: "Escribe un peso por pollo mayor que cero." };
      var peso = kg;
      var porM = 30 / peso;
      if (!Number.isFinite(porM) || !(porM > 0) || !Number.isFinite(n / porM)) return { error: "Revisa el peso y las unidades del cálculo." };
      return { text: n + " pollos de unos " + money(peso) + " kg, a 30 kg/m²: unos " + money(n / porM) + " m² (" + money(porM) + " pollos por m²)." };
    }
    if (tipo === "campero") {
      return { text: n + " pollos camperos: al menos " + money(n) + " m² de parque. La lección pide además 56 días o más." };
    }
    return { error: "Elige un tipo." };
  }
  function alimento(precio, kg, huevos, carne) {
    if (!Number.isFinite(precio) || !Number.isFinite(kg) || !(precio >= 0) || !(kg >= 0)) return { error: "Escribe el precio por kilo y los kilos de alimento." };
    huevos = Number.isNaN(huevos) ? 0 : huevos;
    carne = Number.isNaN(carne) ? 0 : carne;
    if (!Number.isSafeInteger(huevos) || huevos < 0 || !Number.isFinite(carne) || carne < 0) return { error: "Los huevos deben ser enteros y la producción no puede ser negativa." };
    var total = precio * kg;
    if (!Number.isFinite(total) || !Number.isFinite(total / 0.6) || (carne > 0 && !Number.isFinite(total / carne))) return { error: "Las cifras son demasiado grandes para calcular. Revisa las unidades." };
    var lines = ["Alimento usado: " + money(total) + " en la moneda de tu precio."];
    if (huevos > 0) {
      if (!Number.isFinite(total / huevos * 12)) return { error: "Revisa las cifras y las unidades del cálculo." };
      lines.push("Por huevo: " + money(total / huevos, 6) + ".");
      lines.push("Por docena (12 huevos): " + money((total / huevos) * 12) + ". Es el coste del pienso que escribiste, no el beneficio ni el resto de gastos.");
    }
    if (carne > 0) lines.push("Por kilo producido: " + money(total / carne) + ".");
    if (!(huevos > 0) && !(carne > 0)) return { error: "Escribe huevos o kilos producidos." };
    lines.push("Si ese alimento es el 60 % del coste de insumos, el total de insumos ronda " + money(total / 0.6) + ". Si es el 80 %, ronda " + money(total / 0.8) + ". Es la cuenta de la cita de la FAO en L01, no un precio de tu granja.");
    return { text: lines.join(" ") };
  }
  function kilosTexto(n) {
    return String(Math.round(n * 1000) / 1000).replace(".", ",");
  }
  function sacos(precioA, kgA, precioB, kgB, usados) {
    if (![precioA,kgA,precioB,kgB].every(Number.isFinite) || !(precioA >= 0) || !(kgA > 0) || !(precioB >= 0) || !(kgB > 0)) {
      return { error: "Escribe el precio y los kilos de cada saco. Los kilos tienen que ser mayores que cero." };
    }
    var porA = precioA / kgA;
    var porB = precioB / kgB;
    usados = Number.isNaN(usados) ? 0 : usados;
    if (!Number.isFinite(usados) || usados < 0 || ![porA,porB,porA*usados,porB*usados].every(Number.isFinite)) return { error: "Revisa los kilos de consumo y las unidades de los sacos." };
    var iguales = Math.abs(porA-porB) <= Number.EPSILON * Math.max(Number.MIN_VALUE,Math.abs(porA),Math.abs(porB)) * 8;
    var cual = iguales ? "Salen igual por kilo." : (porA < porB ? "El saco A sale más barato por kilo." : "El saco B sale más barato por kilo.");
    var lines = [
      "Saco A: " + money(porA, 6) + " por kilo.",
      "Saco B: " + money(porB, 6) + " por kilo.",
      cual
    ];
    if (usados > 0) {
      lines.push("Si gastas " + kilosTexto(usados) + " kg, el saco A costaría " + money(porA * usados) + " y el saco B " + money(porB * usados) + ".");
    }
    lines.push("Es solo el pienso, con los precios que escribiste. No es una oferta ni un precio de un país.");
    lines.push("La comparación usa los valores sin redondear; los importes mostrados están redondeados.");
    return { text: lines.join(" ") };
  }
  function eclosion(iso, especie) {
    var dias = { gallina: 21, codorniz: 17, pato: 28, pavo: 28 };
    var d = dias[especie];
    if (!d) return { error: "Elige la especie." };
    if (!window.GR_lista) return { error: "No se pudo calcular la fecha." };
    var fin = window.GR_lista.addDays(iso, d);
    if (!fin) return { error: "Elige el día en que pones los huevos." };
    var nombres = { gallina: "Gallina", codorniz: "Codorniz", pato: "Pato", pavo: "Pavo" };
    var larga = window.GR_lista.fechaLarga || function (s) { return s; };
    return { text: nombres[especie] + ": " + d + " días. Si empiezas el " + larga(iso) + ", la fecha orientativa es " + larga(fin) + "." };
  }
  window.GR_calc = { espacio: espacio, alimento: alimento, eclosion: eclosion, sacos: sacos };

  function paint(id, result) {
    var out = document.getElementById(id);
    if (!out) return;
    out.textContent = result.error || result.text || "";
    out.classList.remove('is-stale');
  }
  ['espacio','alimento','sacos','eclosion'].forEach(function (name) {
    var form = document.getElementById('calc-' + name), out = document.getElementById('calc-' + name + '-out');
    if (!form || !out) return;
    function changed() {
      if (out.textContent) { out.textContent = 'Datos modificados. Vuelve a calcular.'; out.classList.add('is-stale'); }
      var calendar = document.getElementById('calc-eclosion-calendario');
      if (name === 'eclosion' && calendar) calendar.hidden = true;
    }
    form.addEventListener('input', changed);
    form.addEventListener('change', changed);
  });
  var esp = document.getElementById("calc-espacio");
  if (esp) {
    var kgField = esp.querySelector("[data-kg]");
    var tipo = esp.querySelector("[name=tipo]");
    var sync = function () { if (kgField) { kgField.hidden = !tipo || tipo.value !== "engorde"; kgField.querySelector('input').required = !kgField.hidden; } };
    if (tipo) tipo.addEventListener("change", sync);
    sync();
    esp.addEventListener("submit", function (e) {
      e.preventDefault();
      paint("calc-espacio-out", espacio(tipo.value, num(esp, "n"), num(esp, "kg")));
    });
  }
  var ali = document.getElementById("calc-alimento");
  if (ali) {
    ali.addEventListener("submit", function (e) {
      e.preventDefault();
      paint("calc-alimento-out", alimento(num(ali, "precio"), num(ali, "kg"), num(ali, "huevos"), num(ali, "carne")));
    });
    var pruebaAli = document.getElementById("calc-alimento-ejemplo");
    if (pruebaAli) pruebaAli.addEventListener("click", function () {
      ali.querySelector("[name=precio]").value = "1";
      ali.querySelector("[name=kg]").value = "12";
      ali.querySelector("[name=huevos]").value = "24";
      ali.querySelector("[name=carne]").value = "0";
      paint("calc-alimento-out", alimento(1, 12, 24, 0));
    });
  }
  var sac = document.getElementById("calc-sacos");
  if (sac) {
    sac.addEventListener("submit", function (e) {
      e.preventDefault();
      paint("calc-sacos-out", sacos(num(sac, "precioA"), num(sac, "kgA"), num(sac, "precioB"), num(sac, "kgB"), num(sac, "usados")));
    });
    var pruebaSac = document.getElementById("calc-sacos-ejemplo");
    if (pruebaSac) pruebaSac.addEventListener("click", function () {
      sac.querySelector("[name=precioA]").value = "10";
      sac.querySelector("[name=kgA]").value = "20";
      sac.querySelector("[name=precioB]").value = "18";
      sac.querySelector("[name=kgB]").value = "40";
      sac.querySelector("[name=usados]").value = "25";
      paint("calc-sacos-out", sacos(10, 20, 18, 40, 25));
    });
  }
  var eco = document.getElementById("calc-eclosion");
  var calendar = document.getElementById('calc-eclosion-calendario');
  if (calendar && eco) calendar.addEventListener('click', function () {
    var fecha = eco.querySelector('[name=fecha]').value, especie = eco.querySelector('[name=especie]').value;
    var content = window.GR_lista && window.GR_lista.ics(fecha, especie);
    if (!content) return;
    var url = URL.createObjectURL(new Blob([content], {type:'text/calendar;charset=utf-8'}));
    var link = document.createElement('a');
    link.href = url; link.download = 'granja-incubacion-' + especie + '-' + fecha + '.ics';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); },1000);
  });
  if (eco) eco.addEventListener("submit", function (e) {
    e.preventDefault();
    var result = eclosion(eco.querySelector("[name=fecha]").value, eco.querySelector("[name=especie]").value);
    paint("calc-eclosion-out", result);
    if (calendar) calendar.hidden = !!result.error;
  });
})();

