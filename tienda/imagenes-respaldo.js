/* Recuperación accesible de imágenes del catálogo: sin sustituir por fotos de otros productos. */
(function () {
  "use strict";
  var fotos = document.querySelectorAll(".t-card .t-foto img");
  if (!fotos.length) return;
  fotos.forEach(function (img) {
    img.decoding = "async";
    img.addEventListener("error", function () {
      var figure = img.closest(".t-foto");
      if (!figure || figure.querySelector(".t-foto-error")) return;
      img.hidden = true;
      var aviso = document.createElement("div");
      aviso.className = "t-foto-error";
      aviso.setAttribute("role", "status");
      aviso.textContent = "Imagen no disponible. Consulta los detalles y la fotografía actual en Amazon.";
      figure.insertBefore(aviso, figure.firstChild);
    });
    if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event("error"));
  });
})();
