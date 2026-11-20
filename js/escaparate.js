/* Escaparate ligero y accesible: filtros, navegación, país y errores de imágenes.
   No consulta Amazon ni guarda datos personales. Sin JavaScript todos los enlaces siguen visibles. */
(function () {
  "use strict";
  var zona = document.getElementById("ofertas-granja");
  if (!zona) return;
  var carril = zona.querySelector("[data-ventas-carril]");
  var herramientas = zona.querySelector("[data-ventas-herramientas]");
  var notaPais = zona.querySelector("[data-ventas-pais]");
  if (!carril || !herramientas) return;
  var cards = Array.from(carril.querySelectorAll(".gr-venta-card[data-venta-grupo]"));
  var categorias = [
    { id: "todos", texto: "Todos", total: 7 },
    { id: "alimentacion", texto: "Comida y agua", total: 2 },
    { id: "incubacion", texto: "Incubación y control", total: 3 },
    { id: "seguridad", texto: "Seguridad", total: 2 }
  ];
  var actual = "todos";
  var filtros = document.createElement("div");
  filtros.className = "gr-ventas-filtros";
  filtros.setAttribute("role", "group");
  filtros.setAttribute("aria-label", "Tipos de producto");
  var botones = [];
  categorias.forEach(function (cat) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "gr-ventas-filtro";
    b.textContent = cat.texto + " (" + cat.total + ")";
    b.dataset.ventasGrupo = cat.id;
    b.setAttribute("aria-pressed", cat.id === actual ? "true" : "false");
    b.addEventListener("click", function () {
      actual = cat.id;
      cards.forEach(function (card) {
        card.hidden = actual !== "todos" && card.dataset.ventaGrupo !== actual;
      });
      botones.forEach(function (button) {
        button.setAttribute("aria-pressed", button.dataset.ventasGrupo === actual ? "true" : "false");
      });
      carril.scrollLeft = 0;
      actualizar();
    });
    botones.push(b);
    filtros.appendChild(b);
  });
  herramientas.appendChild(filtros);

  var nav = document.createElement("div");
  nav.className = "gr-ventas-navega";
  var anterior = document.createElement("button");
  var siguiente = document.createElement("button");
  anterior.type = siguiente.type = "button";
  anterior.className = "gr-ventas-flecha";
  siguiente.className = "gr-ventas-flecha";
  anterior.textContent = "‹";
  siguiente.textContent = "›";
  anterior.setAttribute("aria-label", "Ver productos anteriores");
  siguiente.setAttribute("aria-label", "Ver productos siguientes");
  var estado = document.createElement("span");
  estado.className = "gr-ventas-estado";
  estado.setAttribute("role", "status");
  estado.setAttribute("aria-live", "polite");
  nav.appendChild(anterior);
  nav.appendChild(estado);
  nav.appendChild(siguiente);
  herramientas.appendChild(nav);

  function actualizar() {
    var visibles = cards.filter(function (c) { return !c.hidden; });
    var ancho = Math.max(0, carril.scrollWidth - carril.clientWidth);
    nav.hidden = ancho <= 3;
    anterior.disabled = carril.scrollLeft < 3;
    siguiente.disabled = carril.scrollLeft >= ancho - 3;
    estado.textContent = visibles.length + " productos";
  }
  function mover(direccion) {
    var card = cards.find(function (c) { return !c.hidden; });
    if (!card) return;
    var medida = card.getBoundingClientRect().width + 13;
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    carril.scrollBy({ left: direccion * medida * (carril.clientWidth >= 800 ? 2 : 1), behavior: reduce ? "auto" : "smooth" });
  }
  anterior.addEventListener("click", function () { mover(-1); });
  siguiente.addEventListener("click", function () { mover(1); });
  carril.addEventListener("scroll", actualizar, { passive: true });
  window.addEventListener("resize", actualizar, { passive: true });

  function actualizarPais() {
    if (!notaPais) return;
    var codigo = document.documentElement.dataset.pais || "ES";
    var nombres = { ES: "España", MX: "México", CO: "Colombia", PE: "Perú", AR: "Argentina", US: "Estados Unidos", CL: "Chile", VE: "Venezuela", EC: "Ecuador", DO: "República Dominicana" };
    if (codigo === "US") {
      notaPais.textContent = "Estás en Estados Unidos: estos enlaces abren Amazon.com y solicitan la interfaz en español. Comprueba precios y disponibilidad.";
    } else {
      notaPais.textContent = "País seleccionado: " + (nombres[codigo] || "otro país") + ". Los productos de esta selección abren Amazon.com (Estados Unidos), no la tienda local. Consulta el envío internacional y el precio final antes de comprar.";
    }
  }
  window.addEventListener("gr-pais", actualizarPais);
  actualizarPais();

  zona.querySelectorAll(".gr-venta-foto img").forEach(function (img) {
    function error() {
      var marco = img.closest(".gr-venta-foto");
      if (!marco || marco.querySelector(".gr-venta-sin-foto")) return;
      img.hidden = true;
      var aviso = document.createElement("span");
      aviso.className = "gr-venta-sin-foto";
      aviso.textContent = "Imagen ilustrativa no disponible";
      marco.appendChild(aviso);
    }
    img.addEventListener("error", error, { once: true });
    if (img.complete && img.naturalWidth === 0) error();
  });
  actualizar();
})();