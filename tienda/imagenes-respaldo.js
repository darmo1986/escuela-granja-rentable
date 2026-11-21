/* Mostrar un respaldo claro cuando falta la imagen de un producto, sin inventar fotografías. */
(function () {
  "use strict";
  var tarjetas = document.querySelectorAll(".t-card");
  if (!tarjetas.length) return;

  function mostrarAviso(figure, img) {
    if (!figure || figure.querySelector(".t-foto-error")) return;
    if (img) img.hidden = true;
    var aviso = document.createElement("div");
    aviso.className = "t-foto-error";
    aviso.setAttribute("role", "status");
    aviso.textContent = "Imagen no disponible aquí. Consulta el modelo y su fotografía actual en Amazon.";
    figure.insertBefore(aviso, figure.firstChild);
  }

  tarjetas.forEach(function (card) {
    var foto = card.querySelector(".t-foto");
    if (!foto) {
      foto = document.createElement("figure");
      foto.className = "t-foto t-foto-vacia";
      mostrarAviso(foto, null);
      var marca = card.querySelector(".t-marca");
      if (marca) marca.insertAdjacentElement("afterend", foto);
      else card.insertBefore(foto, card.firstChild);
      return;
    }
    var img = foto.querySelector("img");
    if (!img) { mostrarAviso(foto, null); return; }
    img.decoding = "async";
    img.addEventListener("error", function () { mostrarAviso(foto, img); }, { once: true });
    if (img.complete && img.naturalWidth === 0) mostrarAviso(foto, img);
  });
})();