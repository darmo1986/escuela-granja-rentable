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
        link.rel = 'sponsored nofollow noopener';
        link.target = '_blank';
      }
      var image = document.createElement('img');
      image.src = oferta.imagen; image.alt = oferta.alt;
      image.width = 600; image.height = 469; image.loading = 'lazy';
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
      link.append(image, copy); card.append(link); return card;
    });
    items.replaceChildren.apply(items, slides);
    panel.classList.add('promo-ready'); controls.hidden = false;
    var index = 0, timer, manual = false, onScreen = true;
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    var pause = panel.querySelector('[data-promo-pause]');
    function schedule() {
      clearTimeout(timer);
      if (!manual && !motion.matches && onScreen && !document.hidden && !panel.matches(':hover, :focus-within')) {
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
      pause.textContent = manual ? 'Reanudar' : 'Pausar';
      pause.setAttribute('aria-pressed', String(manual));
      schedule();
    }
    panel.querySelector('[data-promo-prev]').onclick = function () { show(index - 1); };
    panel.querySelector('[data-promo-next]').onclick = function () { show(index + 1); };
    pause.onclick = function () { manual = !manual; show(index); };
    ['mouseenter', 'mouseleave', 'focusin'].forEach(function (event) { panel.addEventListener(event, schedule); });
    panel.addEventListener('focusout', function () { setTimeout(schedule, 0); });
    document.addEventListener('visibilitychange', schedule);
    motion.addEventListener('change', schedule);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) { onScreen = entries[0].isIntersecting; schedule(); }).observe(panel);
    }
    show(0);
  });
})();
