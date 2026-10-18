/* Artículos: el video carga al pulsar.
   Los anuncios los decide app.js, después de window.ads.activo y de Premium
   (GR_esPremium / esPremiumLocal). Con activo en false no se pide ningún anuncio.
   Si el hueco existe, no se borra aquí: el alto reservado evita el salto. */
(function () {
  function premium() {
    if (typeof window.esPremiumLocal === "function") return window.esPremiumLocal();
    if (typeof window.GR_esPremium === "function") return window.GR_esPremium();
    return false;
  }
  function anunciosApagados() {
    return premium() || !!(window.ads && window.ads.activo === false);
  }
  if (anunciosApagados()) {
    if (typeof window.GR_quitarAnuncios === "function") window.GR_quitarAnuncios();
    else {
      document.documentElement.classList.add("ad-off");
      document.documentElement.classList.remove("ad-ok");
    }
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
