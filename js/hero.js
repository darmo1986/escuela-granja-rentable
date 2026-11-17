/* Destacados de portada: razas, curso, ebooks y artículos, cada cinco segundos. */
(function () {
  'use strict';
  var hero = document.querySelector('[data-hero]');
  if (!hero) return;
  var slides = Array.from(hero.querySelectorAll('[data-slide]'));
  var dots = Array.from(hero.querySelectorAll('[data-hero-dot]'));
  if (slides.length < 2) return;
  var current = slides.findIndex(function (slide) { return slide.classList.contains('is-active'); });
  if (current < 0) current = 0;
  var initial = current;
  var timer, manual = null, visible = true;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pause = hero.querySelector('[data-hero-pause]');
  function paused() { return manual === null ? motion.matches : manual; }
  hero.classList.add('js-hero');
  function schedule() {
    clearTimeout(timer);
    if (visible && !paused() && !document.hidden && !hero.matches(':hover, :focus-within')) {
      timer = setTimeout(function () { show(current + 1); }, 5000);
    }
  }
  function show(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === current);
      slide.setAttribute('aria-hidden', String(i !== current));
      slide.inert = i !== current;
    });
    dots.forEach(function (dot, i) { dot.setAttribute('aria-current', String(i === current)); });
    var status = hero.querySelector('[data-slide-count]');
    var tituloCorto = (slides[current].dataset && slides[current].dataset.shortTitle) || '';
    if (status) status.textContent = (current + 1) + ' de ' + slides.length + (tituloCorto ? ' · ' + tituloCorto : '');
    pause.textContent = paused() ? 'Reanudar' : 'Pausar';
    pause.setAttribute('aria-pressed', String(paused()));
    schedule();
  }
  hero.querySelector('[data-hero-prev]').onclick = function () { show(current - 1); };
  hero.querySelector('[data-hero-next]').onclick = function () { show(current + 1); };
  pause.onclick = function () { manual = !paused(); show(current); };
  dots.forEach(function (dot, i) { dot.onclick = function () { show(i); }; });
  ['mouseenter', 'mouseleave', 'focusin'].forEach(function (event) { hero.addEventListener(event, schedule); });
  hero.addEventListener('focusout', function () { setTimeout(schedule, 0); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', function () { show(current); });
  var start;
  hero.addEventListener('touchstart', function (event) {
    start = event.touches.length === 1 ? event.touches[0] : null;
  }, {passive:true});
  hero.addEventListener('touchcancel', function () { start = null; });
  hero.addEventListener('touchend', function (event) {
    if (!start) return;
    var end = event.changedTouches[0], dx = end.clientX - start.clientX, dy = end.clientY - start.clientY;
    start = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) show(current + (dx < 0 ? 1 : -1));
  }, {passive:true});
  hero.addEventListener('keydown', function (event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    manual = true;
    // Mantener el foco en un control visible si la diapositiva actual se oculta.
    if (slides.some(function (slide) { return slide.contains(document.activeElement); })) {
      var next = (current + (event.key === 'ArrowRight' ? 1 : -1) + slides.length) % slides.length;
      dots[next].focus();
    }
    show(current + (event.key === 'ArrowRight' ? 1 : -1));
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (document.body) document.body.classList.toggle('gr-hero-visible', visible);
      schedule();
    }).observe(hero);
  }
  window.addEventListener('gr-pais', function () { show(initial); });
  show(initial);
})();

