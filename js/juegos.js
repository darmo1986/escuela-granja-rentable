(function () {
  document.querySelectorAll("#quiz-box .q").forEach(function (block) {
    var ok = Number(block.getAttribute("data-ok"));
    var expText = block.getAttribute("data-exp") || "";
    var href = block.getAttribute("data-href") || "";
    var label = block.getAttribute("data-label") || "";
    block.querySelectorAll("button").forEach(function (b, j) {
      b.addEventListener("click", function () {
        if (block.dataset.done) return;
        block.dataset.done = "1";
        b.classList.add(j === ok ? "gold" : "sec");
        var exp = document.createElement("p");
        exp.className = "exp";
        exp.textContent = (j === ok ? "Correcto. " : "Casi. ") + expText;
        if (href) {
          var go = document.createElement("a");
          go.href = href;
          go.textContent = label;
          exp.appendChild(document.createTextNode(" "));
          exp.appendChild(go);
        }
        block.appendChild(exp);
        if (j !== ok) {
          var right = block.querySelectorAll("button")[ok];
          if (right) right.classList.add("gold");
        }
      });
    });
  });

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
