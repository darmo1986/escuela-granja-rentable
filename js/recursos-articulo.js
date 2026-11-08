// Un solo espacio por artículo. Sin JavaScript todos los enlaces siguen disponibles.
document.querySelectorAll('[data-recursos-granja]').forEach(function (panel) {
  const fichas = Array.from(panel.querySelectorAll('[data-ficha]'));
  const controles = panel.querySelector('[data-controles]');
  if (fichas.length < 2 || !controles) return;
  const pausa = controles.querySelector('[data-pausa]');
  const movimiento = window.matchMedia('(prefers-reduced-motion: reduce)');
  let indice = 0;
  let detenido = movimiento.matches;
  let visible = false;
  let temporizador;
  function mostrar() {
    fichas.forEach(function (ficha, i) {
      ficha.style.gridArea = '1 / 1';
      ficha.style.visibility = i === indice ? 'visible' : 'hidden';
    });
    pausa.textContent = detenido ? 'Reanudar' : 'Pausar';
    clearInterval(temporizador);
    if (visible && !detenido && !document.hidden && !panel.matches(':hover, :focus-within')) {
      temporizador = setInterval(function () {
        indice = (indice + 1) % fichas.length;
        mostrar();
      }, 12000);
    }
  }
  panel.querySelector('[data-fichas]').style.display = 'grid';
  controles.hidden = false;
  controles.querySelector('[data-otra]').onclick = function () {
    indice = (indice + 1) % fichas.length;
    mostrar();
  };
  pausa.onclick = function () { detenido = !detenido; mostrar(); };
  panel.addEventListener('pointerenter', mostrar);
  panel.addEventListener('pointerleave', mostrar);
  panel.addEventListener('focusin', mostrar);
  panel.addEventListener('focusout', function () { setTimeout(mostrar, 0); });
  document.addEventListener('visibilitychange', mostrar);
  movimiento.addEventListener('change', function () { detenido = movimiento.matches; mostrar(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entradas) {
      visible = entradas[0].isIntersecting;
      mostrar();
    }).observe(panel);
  }
  mostrar();
});