(function () {
  "use strict";
  var caja = document.querySelector("[data-t-buscar]");
  var cards = document.querySelectorAll("[data-t-card]");
  if (!caja || !cards.length) return;
  var chips = document.querySelectorAll("[data-t-filtro]");
  var categoria = document.querySelector("[data-t-categoria]");
  var vacio = document.querySelector("[data-t-vacio]");
  var cuenta = document.querySelector("[data-t-cuenta]");
  var limpiar = document.querySelector("[data-t-limpiar]");
  var ampliar = document.querySelector("[data-t-ampliar]");
  var formulario = document.querySelector("[data-t-form]");
  var filtro = "todas";
  var equivalencias = {
    ponedero: "nidal", ponederos: "nidal", nido: "nidal", nidos: "nidal", nidales: "nidal",
    bebederos: "bebedero", comederos: "comedero", gallinas: "gallina", gallos: "gallo",
    pollitos: "pollito", pollos: "pollo", huevos: "huevo", incubadoras: "incubadora",
    ovoscopios: "ovoscopio", lamparas: "lampara", placas: "placa", puertas: "puerta",
    automaticas: "automatico", automatica: "automatico", automaticos: "automatico",
    termometros: "termometro", higrometros: "higrometro", termohigrometros: "termohigrometro",
    criadoras: "criadora", bombillas: "bombilla", perchas: "percha",
    ratones: "raton", ratas: "rata", jaulas: "jaula", mallas: "malla", vallas: "valla"
  };
  var vacias = ["de", "del", "la", "el", "los", "las", "para", "con", "y", "en", "un", "una"];
  function palabras(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .split(/[^a-z0-9]+/).filter(function (p) { return p && vacias.indexOf(p) === -1; })
      .map(function (p) { return equivalencias[p] || p; });
  }
  var indice = Array.from(cards).map(function (card) {
    return { card: card, texto: palabras(card.getAttribute("data-q") || "").join(" "),
      categoria: card.getAttribute("data-cat") || "" };
  });
  function sincronizar() {
    chips.forEach(function (chip) {
      chip.setAttribute("aria-pressed", chip.getAttribute("data-t-filtro") === filtro ? "true" : "false");
    });
    if (categoria) categoria.value = filtro;
  }
  function guardar() {
    try {
      var url = new URL(window.location.href);
      var q = caja.value.trim().slice(0, 120);
      if (q) url.searchParams.set("q", q); else url.searchParams.delete("q");
      if (filtro !== "todas") url.searchParams.set("cat", filtro); else url.searchParams.delete("cat");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    } catch (e) { /* La búsqueda sigue funcionando si el navegador bloquea el historial. */ }
  }
  function aplicar(guardarEstado) {
    var consulta = palabras(caja.value.slice(0, 120));
    var n = 0;
    indice.forEach(function (item) {
      var ok = (filtro === "todas" || item.categoria === filtro) && consulta.every(function (p) {
        return item.texto.indexOf(p) !== -1;
      });
      item.card.hidden = !ok;
      if (ok) n += 1;
    });
    document.querySelectorAll("[data-t-bloque]").forEach(function (bloque) {
      bloque.hidden = !bloque.querySelector("[data-t-card]:not([hidden])");
    });
    if (vacio) vacio.hidden = n !== 0;
    if (ampliar) ampliar.hidden = filtro === "todas";
    if (cuenta) cuenta.textContent = n + " de " + cards.length + (cards.length === 1 ? " producto" : " productos");
    sincronizar();
    if (guardarEstado) guardar();
  }
  caja.addEventListener("input", function () { aplicar(true); });
  if (formulario) formulario.addEventListener("submit", function (ev) { ev.preventDefault(); aplicar(true); });
  if (categoria) categoria.addEventListener("change", function () { filtro = categoria.value; aplicar(true); });
  if (limpiar) limpiar.addEventListener("click", function () {
    caja.value = "";
    filtro = "todas";
    aplicar(true);
    caja.focus();
  });
  if (ampliar) ampliar.addEventListener("click", function () { filtro = "todas"; aplicar(true); caja.focus(); });
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () { filtro = chip.getAttribute("data-t-filtro") || "todas"; aplicar(true); });
  });
  try {
    var params = new URL(window.location.href).searchParams;
    caja.value = (params.get("q") || "").slice(0, 120);
    var solicitada = params.get("cat");
    if (categoria && Array.from(categoria.options).some(function (o) { return o.value === solicitada; })) filtro = solicitada;
  } catch (e) { /* Sin parámetros, se muestra el catálogo completo. */ }
  aplicar(false);
})();
