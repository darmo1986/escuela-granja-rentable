/* Calculadoras con las cifras ya citadas en las lecciones. */
(function () {
  function num(form, name) {
    var el = form.querySelector("[name=" + name + "]");
    var n = el ? parseFloat(String(el.value).replace(",", ".")) : NaN;
    return isFinite(n) ? n : NaN;
  }
  function money(n) {
    if (!isFinite(n)) return "—";
    var pais = (document.documentElement.getAttribute("data-pais") || "MX").toUpperCase();
    var loc = pais === "ES" ? "es-ES" : "es-MX";
    return n.toLocaleString(loc, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  }
  function espacio(tipo, aves, kg) {
    if (!aves || aves < 1) return { error: "Escribe cuántas aves son." };
    var n = Math.round(aves);
    if (tipo === "ponedora_patio") {
      return { text: n + " ponedoras en patio: dentro, entre " + money(n * 0.28) + " y " + money(n * 0.37) + " m². Fuera, unos " + money(n * 0.93) + " m². También hace falta 1 ponedero cada 4 o 5 gallinas." };
    }
    if (tipo === "ponedora_suelo") {
      return { text: n + " ponedoras en suelo, al tope de 9 por m²: al menos " + money(n / 9) + " m² utilizables. La lección también cita 1 nido cada 7 y 15 cm de aseladero por ave." };
    }
    if (tipo === "engorde") {
      var peso = kg > 0 ? kg : 2.5;
      var porM = 30 / peso;
      return { text: n + " pollos de unos " + money(peso) + " kg, a 30 kg/m²: unos " + money(n / porM) + " m² (" + money(porM) + " pollos por m²)." };
    }
    if (tipo === "campero") {
      return { text: n + " pollos camperos: al menos " + money(n) + " m² de parque. La lección pide además 56 días o más." };
    }
    return { error: "Elige un tipo." };
  }
  function alimento(precio, kg, huevos, carne) {
    if (!(precio >= 0) || !(kg >= 0)) return { error: "Escribe el precio por kilo y los kilos de alimento." };
    var total = precio * kg;
    var lines = ["Alimento usado: " + money(total) + " en la moneda de tu precio."];
    if (huevos > 0) {
      lines.push("Por huevo: " + money(total / huevos) + ".");
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
    if (!(precioA >= 0) || !(kgA > 0) || !(precioB >= 0) || !(kgB > 0)) {
      return { error: "Escribe el precio y los kilos de cada saco. Los kilos tienen que ser mayores que cero." };
    }
    var porA = precioA / kgA;
    var porB = precioB / kgB;
    var cual = porA === porB ? "Salen igual por kilo." : (porA < porB ? "El saco A sale más barato por kilo." : "El saco B sale más barato por kilo.");
    var lines = [
      "Saco A: " + money(porA) + " por kilo.",
      "Saco B: " + money(porB) + " por kilo.",
      cual
    ];
    if (usados > 0) {
      lines.push("Si gastas " + kilosTexto(usados) + " kg, el saco A costaría " + money(porA * usados) + " y el saco B " + money(porB * usados) + ".");
    }
    lines.push("Es solo el pienso, con los precios que escribiste. No es una oferta ni un precio de un país.");
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
  }
  var esp = document.getElementById("calc-espacio");
  if (esp) {
    var kgField = esp.querySelector("[data-kg]");
    var tipo = esp.querySelector("[name=tipo]");
    var sync = function () { if (kgField) kgField.hidden = !tipo || tipo.value !== "engorde"; };
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
  if (eco) eco.addEventListener("submit", function (e) {
    e.preventDefault();
    paint("calc-eclosion-out", eclosion(eco.querySelector("[name=fecha]").value, eco.querySelector("[name=especie]").value));
  });
})();
