/* Artículos: video al pulsar, y anuncios fuera si la cuenta es Premium.
   El PR #17 guarda la suscripción en localStorage gr_premium y en
   GRAuth.usuarioActual.premium, y define GR_quitarAnuncios en app.js.
   Esta página usa esas mismas señales. Sin el #17, gr_premium no existe
   y los anuncios siguen la regla de cookies del resto de la web. */
(function () {
  function premium() {
    try { if (localStorage.getItem("gr_premium") === "1") return true; } catch (e) {}
    var u = window.GRAuth && window.GRAuth.usuarioActual;
    return !!(u && u.premium);
  }
  if (premium()) {
    if (typeof window.GR_quitarAnuncios === "function") window.GR_quitarAnuncios();
    document.documentElement.classList.add("ad-off");
    document.documentElement.classList.remove("ad-ok");
    document.querySelectorAll(".ad-inline").forEach(function (n) { n.remove(); });
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
