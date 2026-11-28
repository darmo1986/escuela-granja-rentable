/* Compara fichas editadas; no estima rendimientos ni envía datos. */
(function () {
  "use strict";
  const panel = document.querySelector("[data-comparar-razas]");
  if (!panel) return;
  const form = panel.querySelector("form");
  const first = panel.querySelector("#comparar-primera");
  const second = panel.querySelector("#comparar-segunda");
  const output = panel.querySelector("[data-comparar-resultados]");
  const status = panel.querySelector("[data-comparar-estado]");
  let data;
  try { data = JSON.parse(panel.querySelector("[data-comparar-datos]").textContent); }
  catch (error) { return; }
  function buildCard(slug) {
    const [name, origin, use, color, laying] = data[slug];
    const card = document.createElement("article");
    const heading = document.createElement("h3");
    const link = document.createElement("a");
    link.textContent = name;
    link.href = "razas/" + slug + ".html";
    heading.append(link);
    const list = document.createElement("dl");
    [[ "Origen", origin ], [ "Aptitud", use ], [ "Color del huevo", color ], [ color ? "Puesta" : "Puesta y huevo", laying ]].forEach(([label, value]) => {
      if (!value) return;
      const term = document.createElement("dt");
      term.textContent = label;
      const details = document.createElement("dd");
      details.textContent = value;
      list.append(term, details);
    });
    card.append(heading, list);
    return card;
  }
  function reset() {
    output.replaceChildren();
    status.textContent = "";
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    reset();
    const a = first.value, b = second.value;
    if (a === b || !Object.hasOwn(data, a) || !Object.hasOwn(data, b)) {
      status.textContent = "Elige dos razas distintas para compararlas.";
      if (a === b) second.focus();
      return;
    }
    output.replaceChildren(buildCard(a), buildCard(b));
    status.textContent = "Comparando " + data[a][0] + " y " + data[b][0] + ".";
  });
  first.addEventListener("change", reset);
  second.addEventListener("change", reset);
  panel.hidden = false;
})();
