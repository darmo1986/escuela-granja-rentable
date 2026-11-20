/* Controles accesibles para ofertas horizontales. */
(function () {
  "use strict";
  /* No mostrar una foto rota: mantener el enlace de producto y ofrecer texto claro. */
  document.querySelectorAll(".gr-venta-foto img").forEach(function (img) {
    function respaldo() {
      var marco = img.closest(".gr-venta-foto");
      if (!marco || marco.querySelector(".gr-venta-sin-foto")) return;
      img.hidden = true;
      var nota = document.createElement("span");
      nota.className = "gr-venta-sin-foto";
      nota.textContent = img.closest(".gr-venta-ebook")
        ? "Portada no disponible. Consulta la ficha del ebook."
        : "Imagen no disponible. Consulta la fotografía del producto en Amazon.";
      marco.appendChild(nota);
    }
    img.addEventListener("error", respaldo, { once: true });
    if (img.complete && img.naturalWidth === 0) respaldo();
  });
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".gr-ventas-carril").forEach(function (carril) {
    var controls = document.createElement("div");
    controls.className = "gr-ventas-controls";
    controls.setAttribute("aria-label", "Navegar ofertas");
    var count = document.createElement("span");count.className = "gr-ventas-contador";
    var prev = document.createElement("button"), next = document.createElement("button");
    prev.type = next.type = "button";
    prev.textContent = "‹"; next.textContent = "›";
    prev.setAttribute("aria-label", "Ver productos anteriores");
    next.setAttribute("aria-label", "Ver productos siguientes");
    controls.append(count, prev, next);
    carril.parentNode.insertBefore(controls, carril);
    function update() {
      var max = Math.max(0, carril.scrollWidth - carril.clientWidth);
      var total = carril.children.length;
      if (!total || max <= 4) {controls.hidden = true;return;}
      controls.hidden = false;
      prev.disabled = carril.scrollLeft <= 4;
      next.disabled = carril.scrollLeft >= max - 4;
      var width = carril.firstElementChild ? carril.firstElementChild.getBoundingClientRect().width : carril.clientWidth;
      var gap = parseFloat(getComputedStyle(carril).columnGap) || 0;
      var pos = Math.max(1,Math.min(total,1 + Math.round(carril.scrollLeft / Math.max(1,width + gap))));
      count.textContent = pos + " de " + total + " · Desliza para explorar";
    }
    function move(dir) {
      carril.scrollBy({left:dir * Math.max(180,carril.clientWidth * .82),behavior:reduce?"auto":"smooth"});
    }
    prev.addEventListener("click",function(){move(-1);});
    next.addEventListener("click",function(){move(1);});
    carril.addEventListener("scroll",update,{passive:true});
    window.addEventListener("resize",update,{passive:true});
    if ("ResizeObserver" in window) new ResizeObserver(update).observe(carril);
    update();
  });
})();
