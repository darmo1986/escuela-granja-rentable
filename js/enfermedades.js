/* Filtro de la guía de enfermedades. Las fichas ya están en el HTML. */
(function () {
  var buscar = document.getElementById("enf-buscar");
  if (!buscar) return;
  var sintoma = "";
  var etiqueta = "";
  var categoria = "";

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
    var n = 0;
    document.querySelectorAll("[data-enf]").forEach(function (card) {
      var ok = true;
      if (texto && normaliza(card.getAttribute("data-busca")).indexOf(texto) === -1) ok = false;
      if (ok && sintoma && (" " + card.getAttribute("data-sintomas") + " ").indexOf(" " + sintoma + " ") === -1) ok = false;
      if (ok && etiqueta && (" " + card.getAttribute("data-etiquetas") + " ").indexOf(" " + etiqueta + " ") === -1) ok = false;
      if (ok && categoria && card.getAttribute("data-categoria") !== categoria) ok = false;
      card.hidden = !ok;
      if (ok) n++;
    });
    document.querySelectorAll("[data-cat-bloque]").forEach(function (bloque) {
      bloque.hidden = !bloque.querySelector("[data-enf]:not([hidden])");
    });
    var oficial = document.getElementById("enf-oficial");
    if (oficial) {
      var btn = sintoma && document.querySelector('[data-sintoma="' + sintoma + '"]');
      oficial.hidden = !(btn && btn.getAttribute("data-oficial") === "1");
    }
    var cuenta = document.getElementById("enf-cuenta");
    if (cuenta) cuenta.textContent = n === 1 ? "1 ficha" : n + " fichas";
    marca("[data-sintoma]", "data-sintoma", sintoma);
    marca("[data-etiqueta]", "data-etiqueta", etiqueta);
    marca("[data-categoria]", "data-categoria", categoria);
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
  document.getElementById("enf-categorias").addEventListener("click", function (ev) {
    var b = ev.target.closest("[data-categoria]");
    if (!b) return;
    categoria = toggle(categoria, b.getAttribute("data-categoria"));
    aplicar();
  });
  document.getElementById("enf-limpiar").addEventListener("click", function () {
    sintoma = "";
    etiqueta = "";
    categoria = "";
    buscar.value = "";
    aplicar();
  });
  buscar.addEventListener("input", aplicar);
  aplicar();
})();
