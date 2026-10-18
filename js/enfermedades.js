/* Menú de la zona y buscador de la portada. Las fichas ya están en el HTML. */
(function () {
  var sub = document.querySelector(".enf-sub");
  if (sub && window.matchMedia("(max-width: 899px)").matches) sub.open = false;

  var buscar = document.getElementById("enf-buscar");
  if (!buscar) return;
  var sintoma = "";
  var etiqueta = "";
  var caja = document.getElementById("enf-resultados");

  function normaliza(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  function marca(selector, attr, valor) {
    document.querySelectorAll(selector).forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute(attr) === valor && valor ? "true" : "false");
    });
  }

  function aplicar() {
    var texto = normaliza(buscar.value.trim());
    var activo = !!(texto || sintoma || etiqueta);
    var n = 0;
    var cats = {};
    caja.querySelectorAll("[data-enf]").forEach(function (card) {
      var ok = true;
      if (texto && normaliza(card.getAttribute("data-busca")).indexOf(texto) === -1) ok = false;
      if (ok && sintoma && (" " + card.getAttribute("data-sintomas") + " ").indexOf(" " + sintoma + " ") === -1) ok = false;
      if (ok && etiqueta && (" " + card.getAttribute("data-etiquetas") + " ").indexOf(" " + etiqueta + " ") === -1) ok = false;
      card.hidden = !ok;
      if (ok) {
        n++;
        cats[card.getAttribute("data-categoria")] = true;
      }
    });
    caja.hidden = !activo;
    document.querySelectorAll(".enf-cat").forEach(function (card) {
      card.classList.toggle("enf-cat-activa", !!(activo && cats[card.getAttribute("data-cat")]));
    });
    var oficial = document.getElementById("enf-oficial");
    if (oficial) {
      var btn = sintoma && document.querySelector('[data-sintoma="' + sintoma + '"]');
      oficial.hidden = !(btn && btn.getAttribute("data-oficial") === "1");
    }
    var cuenta = document.getElementById("enf-cuenta");
    if (cuenta) cuenta.textContent = activo ? (n === 1 ? "1 ficha" : n + " fichas") : "";
    marca("[data-sintoma]", "data-sintoma", sintoma);
    marca("[data-etiqueta]", "data-etiqueta", etiqueta);
  }

  function toggle(actual, valor) {
    return actual === valor ? "" : valor;
  }

  document.getElementById("enf-sintomas").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-sintoma]");
    if (!b) return;
    sintoma = toggle(sintoma, b.getAttribute("data-sintoma"));
    aplicar();
  });
  document.getElementById("enf-etiquetas").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-etiqueta]");
    if (!b) return;
    etiqueta = toggle(etiqueta, b.getAttribute("data-etiqueta"));
    aplicar();
  });
  document.getElementById("enf-limpiar").addEventListener("click", function () {
    sintoma = "";
    etiqueta = "";
    buscar.value = "";
    aplicar();
  });
  buscar.addEventListener("input", aplicar);
  aplicar();
})();
