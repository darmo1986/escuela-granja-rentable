/* Calculadoras con las cifras ya citadas en las lecciones. */
(function () {
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
  function leerNumero(raw, opts) {
    opts = opts || {};
    var s = String(raw == null ? "" : raw).trim().replace(/[\s\u00a0]/g, "");
    if (!s) return { ok: false, error: "Escribe un número." };
    if (/[eE]/.test(s)) return { ok: false, error: "Escribe un número, sin notación científica." };
    if (/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(s)) return { ok: false, error: "Escribe un número, sin letras." };
    if (s.charAt(0) === "-") return { ok: false, error: "Escribe un número positivo." };
    if (s.charAt(0) === "+") s = s.slice(1);
    if (/[^0-9.,]/.test(s)) return { ok: false, error: "Escribe un número, sin letras." };
    var n = interpretarDecimal(s);
    if (n == null) return { ok: false, error: "Escribe un número." };
    if (opts.entero && Math.abs(n - Math.round(n)) > 1e-9) {
      return { ok: false, error: opts.enteroMsg || "Escribe un número entero." };
    }
    if (opts.entero) n = Math.round(n);
    if (opts.min != null && n < opts.min - 1e-9) return { ok: false, error: "El mínimo es " + textoTope(opts.min) + "." };
    if (opts.max != null && n > opts.max + 1e-9) return { ok: false, error: "El máximo es " + textoTope(opts.max) + "." };
    return { ok: true, value: n };
  }
  function money(n, dec) {
    if (!isFinite(n) || Math.abs(n) >= 1e15) return "—";
    var d = dec == null ? 2 : dec;
    var sign = n < 0 ? "−" : "";
    var s = Math.abs(n).toFixed(d);
    var p = s.split(".");
    p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return sign + p[0] + "," + p[1];
  }
  /* El coste por huevo puede ser de milésimas. Con 2 decimales salía «0,00». */
  function moneyFino(n) {
    if (!isFinite(n) || n === 0) return money(n, 2);
    if (Math.abs(Math.round(n * 100) / 100) === 0) return money(n, 4);
    return money(n, 2);
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
    if (huevos > 0) lines.push("Por huevo: " + moneyFino(total / huevos) + ".");
    if (carne > 0) lines.push("Por kilo producido: " + moneyFino(total / carne) + ".");
    if (!(huevos > 0) && !(carne > 0)) return { error: "Escribe huevos o kilos producidos." };
    lines.push("Si ese alimento es el 60 % del costo de insumos, el total de insumos ronda " + money(total / 0.6) + ". Si es el 80 %, ronda " + money(total / 0.8) + ". Es la cuenta de la cita de la FAO en L01, no un precio de tu granja.");
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
  var api = { espacio: espacio, alimento: alimento, eclosion: eclosion, leerNumero: leerNumero, money: money, moneyFino: moneyFino };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof window !== "undefined") window.GR_calc = api;
  if (typeof document === "undefined") return;

  function marcar(el, texto) {
    if (!el) return;
    var id = el.getAttribute("name") || "";
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
  function campo(form, name, opts) {
    var el = form.querySelector("[name=" + name + "]");
    var res = leerNumero(el ? el.value : "", opts || {});
    marcar(el, res.ok ? "" : res.error);
    return res;
  }
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
      var n = campo(esp, "n", { min: 1, max: 100000, entero: true, enteroMsg: "Escribe un número entero de aves." });
      var kg = { ok: true, value: 2.5 };
      if (tipo && tipo.value === "engorde") kg = campo(esp, "kg", { min: 0.1, max: 20 });
      else marcar(esp.querySelector("[name=kg]"), "");
      if (!n.ok || !kg.ok) {
        paint("calc-espacio-out", { error: "Revisa los campos marcados." });
        return;
      }
      paint("calc-espacio-out", espacio(tipo.value, n.value, kg.value));
    });
  }
  var ali = document.getElementById("calc-alimento");
  if (ali) ali.addEventListener("submit", function (e) {
    e.preventDefault();
    var precio = campo(ali, "precio", { min: 0, max: 1000000 });
    var kg = campo(ali, "kg", { min: 0, max: 1000000 });
    var huevos = campo(ali, "huevos", { min: 0, max: 10000000, entero: true, enteroMsg: "Escribe un número entero de huevos." });
    var carne = campo(ali, "carne", { min: 0, max: 1000000 });
    if (!precio.ok || !kg.ok || !huevos.ok || !carne.ok) {
      paint("calc-alimento-out", { error: "Revisa los campos marcados." });
      return;
    }
    paint("calc-alimento-out", alimento(precio.value, kg.value, huevos.value, carne.value));
  });
  var eco = document.getElementById("calc-eclosion");
  if (eco) eco.addEventListener("submit", function (e) {
    e.preventDefault();
    paint("calc-eclosion-out", eclosion(eco.querySelector("[name=fecha]").value, eco.querySelector("[name=especie]").value));
  });
})();
