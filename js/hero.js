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
  var timer, manual = false;
  var motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var pause = hero.querySelector('[data-hero-pause]');
  hero.classList.add('js-hero');
  function schedule() {
    clearTimeout(timer);
    if (!manual && !motion.matches && !document.hidden && !hero.matches(':hover, :focus-within')) {
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
    pause.textContent = manual ? 'Reanudar' : 'Pausar';
    pause.setAttribute('aria-pressed', String(manual));
    schedule();
  }
  hero.querySelector('[data-hero-prev]').onclick = function () { show(current - 1); };
  hero.querySelector('[data-hero-next]').onclick = function () { show(current + 1); };
  pause.onclick = function () { manual = !manual; show(current); };
  dots.forEach(function (dot, i) { dot.onclick = function () { show(i); }; });
  ['mouseenter', 'mouseleave', 'focusin'].forEach(function (event) { hero.addEventListener(event, schedule); });
  hero.addEventListener('focusout', function () { setTimeout(schedule, 0); });
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
  window.addEventListener('gr-pais', function () { show(initial); });
  show(initial);
})();
