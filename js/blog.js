/* Artículos: el video carga al pulsar.
   El piloto de publicidad lo controla app.js después del consentimiento. */
(function () {
  if (!(window.ads && window.ads.activo === true)) {
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
  var actions = document.querySelector('[data-post-acciones]');
  if (actions) {
    var status = actions.querySelector('[data-post-estado]');
    var field;
    actions.hidden = false;
    actions.querySelector('[data-post-imprimir]').addEventListener('click', function () { window.print(); });
    actions.querySelector('[data-post-copiar]').addEventListener('click', async function () {
      var canonical = document.querySelector('link[rel="canonical"]');
      var url = (canonical ? canonical.href : location.origin + location.pathname) + location.hash;
      try {
        if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('clipboard unavailable');
        await navigator.clipboard.writeText(url);
        status.textContent = 'Enlace copiado. Ya puedes compartir el artículo.';
        if (field) field.hidden = true;
      } catch (error) {
        if (!field) {
          field = document.createElement('input');
          field.type = 'text';
          field.readOnly = true;
          field.setAttribute('aria-label', 'Enlace del artículo para copiar');
          field.className = 'post-enlace';
          actions.appendChild(field);
        }
        field.value = url;
        field.hidden = false;
        field.focus();
        field.select();
        status.textContent = 'El navegador no ha permitido copiar. Copia el enlace seleccionado.';
      }
    });
  }
})();


