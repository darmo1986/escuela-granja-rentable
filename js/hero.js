/* Carrusel del hero de la home: rota solo cada 5 s, en bucle.
   Pausa con el ratón encima o con el foco dentro, cuando la pestaña
   no está visible y si el usuario pide movimiento reducido.
   Sin librerías: solo este archivo, cargado con defer en index.html. */
(function () {
  'use strict';
  var hero = document.querySelector('[data-hero]');
  if (!hero) return;
  var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-slide]'));
  var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
  var prevBtn = hero.querySelector('[data-hero-prev]');
  var nextBtn = hero.querySelector('[data-hero-next]');
  var total = slides.length;
  if (!total) return;
  var INTERVALO = 5000;
  var current = 0;
  var timer = null;
  var paused = false;
  var reduceMotion = false;
  try {
    reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  /* Solo con JS se ocultan las diapositivas inactivas: sin JS la
     home muestra las 9, una detrás de otra, con todos los enlaces. */
  hero.classList.add('js-hero');

  function show(index, restart) {
    current = ((index % total) + total) % total;
    slides.forEach(function (slide, i) {
      var active = i === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', active ? 'false' : 'true');
      if (active) {
        slide.removeAttribute('tabindex');
      } else {
        slide.setAttribute('tabindex', '-1');
      }
    });
    dots.forEach(function (dot, i) {
      if (i === current) {
        dot.setAttribute('aria-current', 'true');
      } else {
        dot.removeAttribute('aria-current');
      }
    });
    if (restart) start();
  }

  function start() {
    stop();
    if (reduceMotion || paused || document.hidden) return;
    timer = window.setInterval(function () {
      show(current + 1, false);
    }, INTERVALO);
  }

  function stop() {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () { show(current - 1, true); });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', function () { show(current + 1, true); });
  }
  dots.forEach(function (dot, i) {
    dot.addEventListener('click', function () { show(i, true); });
  });

  hero.addEventListener('mouseenter', function () { paused = true; stop(); });
  hero.addEventListener('mouseleave', function () { paused = false; start(); });
  hero.addEventListener('focusin', function () { paused = true; stop(); });
  hero.addEventListener('focusout', function () { paused = false; start(); });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  show(0, false);
  start();
})();
