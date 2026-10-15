(function () {
  var quiz = [
    {
      q: "¿Cuántos días tarda en nacer un huevo de gallina, según la lección?",
      opts: ["17 días", "21 días", "28 días"],
      ok: 1,
      exp: "L03 cita 21 días para la gallina. 17 es la codorniz y 28 el pato o el pavo. Es una orientación, no una garantía."
    },
    {
      q: "¿Qué parte del costo de insumos suele ser el alimento?",
      opts: ["Casi nada", "Alrededor del 60–80 %", "Siempre la mitad exacta"],
      ok: 1,
      exp: "L01 cita a la FAO: el alimento suele ser el 60–80 % del costo de insumos. No es la cuenta de tu granja."
    },
    {
      q: "Para empezar, ¿qué recomienda L01?",
      opts: ["Mezclar carne, huevos y genética el primer día", "Elegir un solo camino y sostenerlo", "Comprar aves antes de tener espacio"],
      ok: 1,
      exp: "L01 pide elegir carne, huevos o genética y hacerlo bien antes de combinar."
    },
    {
      q: "¿Ross 308 y Cobb 500 para qué se nombran?",
      opts: ["Para huevos de mesa", "Para carne (engorde)", "Para poner en el nido"],
      ok: 1,
      exp: "En L01 son líneas de carne. ISA Brown, Lohmann Brown y Hy-Line Brown se nombran para huevos."
    },
    {
      q: "¿El curso de esta web tiene costo?",
      opts: ["Sí, se paga por lección", "No: el curso es gratis", "Solo L01 es gratis"],
      ok: 1,
      exp: "El curso publicado es gratis. La tienda es otra cosa: ahí el precio depende del país."
    }
  ];
  var box = document.getElementById("quiz-box");
  if (box) {
    quiz.forEach(function (item, i) {
      var block = document.createElement("div");
      block.className = "q";
      var p = document.createElement("p");
      p.textContent = (i + 1) + ". " + item.q;
      block.appendChild(p);
      item.opts.forEach(function (opt, j) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "btn sec opt";
        b.textContent = opt;
        b.addEventListener("click", function () {
          if (block.dataset.done) return;
          block.dataset.done = "1";
          b.classList.add(j === item.ok ? "gold" : "sec");
          var exp = document.createElement("p");
          exp.className = "exp";
          exp.textContent = (j === item.ok ? "Correcto. " : "Casi. ") + item.exp;
          block.appendChild(exp);
          if (j !== item.ok) {
            var right = block.querySelectorAll("button")[item.ok];
            if (right) right.classList.add("gold");
          }
        });
        block.appendChild(b);
      });
      box.appendChild(block);
    });
    var more = document.createElement("p");
    more.innerHTML = '¿Quieres el tema completo? <a href="curso.html">Entra al curso</a> o mira la <a href="producto/incubadora-24egg-dual.html">incubadora</a>.';
    box.appendChild(more);
  }

  var faces = [
    { id: "gallina", label: "Gallina" },
    { id: "huevo", label: "Huevo" },
    { id: "pollito", label: "Pollito" },
    { id: "calor", label: "Calor" }
  ];
  var deck = faces.concat(faces).map(function (f, i) { return { id: f.id, label: f.label, key: i }; });
  var grid = document.getElementById("mem-grid");
  var status = document.getElementById("mem-status");
  var open = [];
  var found = 0;
  var lock = false;

  function shuffle(a) {
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function paintStatus() {
    if (status) status.textContent = found + " parejas de 4.";
  }

  function deal() {
    if (!grid) return;
    grid.innerHTML = "";
    open = [];
    found = 0;
    lock = false;
    paintStatus();
    shuffle(deck).forEach(function (card) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "mem-card";
      b.textContent = "?";
      b.setAttribute("aria-label", "Carta boca abajo");
      b.addEventListener("click", function () { flip(b, card); });
      grid.appendChild(b);
    });
  }

  function flip(btn, card) {
    if (lock || btn.classList.contains("is-done") || btn.classList.contains("is-open")) return;
    btn.classList.add("is-open");
    btn.textContent = card.label;
    btn.setAttribute("aria-label", card.label);
    open.push({ btn: btn, card: card });
    if (open.length < 2) return;
    lock = true;
    var a = open[0], b = open[1];
    open = [];
    if (a.card.id === b.card.id) {
      a.btn.classList.add("is-done");
      b.btn.classList.add("is-done");
      found++;
      paintStatus();
      lock = false;
      if (found === 4 && status) status.textContent = "Listo: 4 parejas. Si quieres seguir, entra al curso.";
    } else {
      setTimeout(function () {
        a.btn.classList.remove("is-open");
        b.btn.classList.remove("is-open");
        a.btn.textContent = "?";
        b.btn.textContent = "?";
        a.btn.setAttribute("aria-label", "Carta boca abajo");
        b.btn.setAttribute("aria-label", "Carta boca abajo");
        lock = false;
      }, 700);
    }
  }

  var reset = document.getElementById("mem-reset");
  if (reset) reset.addEventListener("click", deal);
  deal();
})();
