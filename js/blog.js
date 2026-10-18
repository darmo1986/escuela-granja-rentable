/* Artículos: el video carga al pulsar.
   Premium es la comprobación de boot.js / app.js (GR_esPremium, esPremiumLocal).
   No enciende anuncios y no quita el hueco: si no tocan, el alto reservado evita el salto. */
(function () {
  function premium() {
    if (typeof window.esPremiumLocal === "function") return window.esPremiumLocal();
    if (typeof window.GR_esPremium === "function") return window.GR_esPremium();
    return false;
  }
  function anunciosApagados() {
    return premium() || !!(window.GR && window.GR.anunciosActivos === false);
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
