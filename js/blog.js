/* Artículos: el video carga al pulsar.
   No hay red de anuncios de terceros: se ocultan los huecos viejos. */
(function () {
  if (typeof window.GR_quitarAnuncios === "function") window.GR_quitarAnuncios();
  else {
    document.documentElement.classList.add("ad-off");
    document.documentElement.classList.remove("ad-ok");
  }
  document.querySelectorAll(".yt-facade[data-yt]").forEach(function (b) {
    b.addEventListener("click", function () {
      var id = b.getAttribute("data-yt") || "";
      if (!/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return;
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?rel=0";
      f.title = "Video del artículo";
      f.allow = "accelerometer; encrypted-media; picture-in-picture";
      f.allowFullscreen = true;
      f.loading = "lazy";
      b.replaceWith(f);
    });
  });
})();
