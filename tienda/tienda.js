(function () {
  var caja = document.querySelector("[data-t-buscar]");
  var cards = document.querySelectorAll("[data-t-card]");
  if (!caja || !cards.length) return;
  var chips = document.querySelectorAll("[data-t-filtro]");
  var vacio = document.querySelector("[data-t-vacio]");
  var cuenta = document.querySelector("[data-t-cuenta]");
  var limpiar = document.querySelector("[data-t-limpiar]");
  var filtro = "todas";

  function aplicar() {
    var palabras = caja.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().split(/\s+/).filter(Boolean);
    var n = 0;
    cards.forEach(function (card) {
      var blob = card.getAttribute("data-q") || "";
      var cat = card.getAttribute("data-cat") || "";
      var ok = (filtro === "todas" || cat === filtro) && palabras.every(function (p) { return blob.indexOf(p) !== -1; });
      card.hidden = !ok;
      if (ok) n += 1;
    });
    document.querySelectorAll("[data-t-bloque]").forEach(function (bloque) {
      bloque.hidden = !bloque.querySelector("[data-t-card]:not([hidden])");
    });
    if (vacio) vacio.hidden = n !== 0;
    if (cuenta) cuenta.textContent = n + (n === 1 ? " producto" : " productos");
  }

  caja.addEventListener("input", aplicar);
  if (limpiar) limpiar.addEventListener("click", function () {
    caja.value = "";
    aplicar();
    caja.focus();
  });
  chips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      filtro = chip.getAttribute("data-t-filtro") || "todas";
      chips.forEach(function (otro) {
        otro.setAttribute("aria-pressed", otro === chip ? "true" : "false");
      });
      aplicar();
    });
  });
})();
