/* Rotación local de ofertas. No añade seguimiento ni dependencias. */
(function () {
  'use strict';
  document.querySelectorAll('[data-promo-carousel]').forEach(function (panel) {
    var ofertas;
    try { ofertas = JSON.parse(panel.dataset.ofertas); } catch (_) { return; }
    if (!Array.isArray(ofertas) || ofertas.length < 2) return;
    var items = panel.querySelector('[data-promo-items]');
    var controls = panel.querySelector('[data-promo-controls]');
    var slides = ofertas.map(function (oferta) {
      var card = document.createElement('aside');
      card.className = 'promo-card';
      card.dataset.banner = oferta.id;
      var link = document.createElement('a');
      link.href = oferta.href;
      if (oferta.tipo === 'ebook') {
        var url = new URL(oferta.href, location.href);
        url.searchParams.set('utm_source', 'granjarentable');
        url.searchParams.set('utm_medium', 'banner');
        url.searchParams.set('utm_campaign', oferta.id);
        link.href = url.href;
      }
      if (oferta.tipo === 'amazon') {
        link.rel = 'sponsored nofollow noopener noreferrer';
        link.target = '_blank';
        // site.js normaliza los enlaces estáticos antes de que este carrusel exista.
        // Aplicar aquí el mismo idioma a los ASIN creados dinámicamente,
        // sin cambiar Amazon.com, el ASIN ni el tag de afiliado.
        try {
          var amazonUrl = new URL(oferta.href, location.href);
          if (/^(?:www\.)?amazon\.com$/i.test(amazonUrl.hostname) &&
              /^\/dp\/[A-Z0-9]{10}\/?$/i.test(amazonUrl.pathname) &&
              amazonUrl.searchParams.get('tag')) {
            amazonUrl.searchParams.set('language', 'es_US');
            link.href = amazonUrl.href;
            link.title = 'Amazon.com (Estados Unidos). Consulta el envío a tu país y el precio actual.';
          }
        } catch (_) {}
      }
      var visual = document.createElement('span');
      visual.className = 'promo-visual';
      var image = document.createElement('img');
      image.alt = oferta.alt || '';
      image.width = oferta.width || 600; image.height = oferta.height || 469; image.decoding = 'async';
      image.loading = 'lazy';
      var fallback = document.createElement('span');
      fallback.className = 'promo-image-fallback';
      fallback.hidden = true;
      fallback.textContent = oferta.tipo === 'amazon'
        ? 'Imagen no disponible. Comprueba la fotografía en Amazon.'
        : 'Portada no disponible. Consulta la ficha del ebook.';
      image.addEventListener('error', function () {
        image.hidden = true;
        fallback.hidden = false;
      }, { once: true });
      if (oferta.srcset) { image.srcset = oferta.srcset; image.sizes = oferta.sizes || '(max-width: 600px) 40vw, 280px'; }
      visual.append(image, fallback);
      image.src = oferta.imagen;
      var copy = document.createElement('div'); copy.className = 'promo-copy';
      var label = document.createElement('small');
      label.textContent = oferta.tipo === 'amazon' ? 'Amazon.com · Enlace de afiliado' : 'Granja Rentable · Ebook PDF';
      var title = document.createElement('p'); title.className = 'promo-title'; title.textContent = oferta.titulo;
      var desc = document.createElement('p'); desc.textContent = oferta.descripcion;
      var price = document.createElement('strong'); price.textContent = oferta.precio;
      var cta = document.createElement('span'); cta.className = 'promo-cta';
      cta.textContent = oferta.tipo === 'amazon' ? 'Consultar en Amazon.com →' : 'Ver la guía →';
      copy.append(label, title, desc, price, cta);
      if (oferta.tipo === 'amazon') {
        var notice = document.createElement('small');
        notice.textContent = 'Podemos recibir una comisión por compras que cumplan los requisitos.';
        copy.append(notice);
      }
      link.append(visual, copy); card.append(link); return card;
    });
    items.replaceChildren.apply(items, slides);
    panel.classList.add('promo-ready'); controls.hidden = false;
    var index = 0, timer, manual = null, onScreen = true;
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var pause = panel.querySelector('[data-promo-pause]');
    function paused() { return manual === null ? motion.matches : manual; }
    function schedule() {
      clearTimeout(timer);
      if (!paused() && onScreen && !document.hidden && !panel.matches(':hover, :focus-within')) {
        timer = setTimeout(function () { show(index + 1); }, 5000);
      }
    }
    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (card, i) {
        card.style.visibility = i === index ? 'visible' : 'hidden';
        card.setAttribute('aria-hidden', String(i !== index));
        card.inert = i !== index;
      });
      panel.querySelector('[data-promo-status]').textContent = (index + 1) + ' / ' + slides.length;
      pause.textContent = paused() ? 'Reanudar' : 'Pausar';
      pause.setAttribute('aria-pressed', String(paused()));
      document.dispatchEvent(new Event('gr-promo-change'));
      schedule();
    }
    panel.querySelector('[data-promo-prev]').onclick = function () { show(index - 1); };
    panel.querySelector('[data-promo-next]').onclick = function () { show(index + 1); };
    pause.onclick = function () { manual = !paused(); show(index); };
    ['mouseenter', 'mouseleave', 'focusin'].forEach(function (event) { panel.addEventListener(event, schedule); });
    panel.addEventListener('focusout', function () { setTimeout(schedule, 0); });
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', function () { show(index); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; schedule(); }).observe(panel);
    }
    show(0);
  });
})();
