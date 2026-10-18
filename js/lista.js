/* Lista y calendario que se arman en el navegador. No llama a la red. */
(function (root) {
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function fechaLarga(iso) {
    var p = String(iso || "").split("-");
    if (p.length !== 3) return "";
    var d = +p[2], m = +p[1];
    if (!d || m < 1 || m > 12) return "";
    return d + " de " + MESES[m - 1] + " de " + p[0];
  }
  function addDays(iso, days) {
    var p = String(iso || "").split("-");
    if (p.length !== 3) return "";
    var d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
    if (isNaN(d.getTime())) return "";
    d.setUTCDate(d.getUTCDate() + days);
    return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
  }
  function texto(iso) {
    var lines = [
      "Lista de Granja Rentable",
      "Sale de las lecciones publicadas. No es un consejo veterinario.",
      "",
      "Cada día",
      "- Agua limpia y alimento a mano. En el arranque, L04A los pone a 2 m o menos.",
      "- Mira el lote al menos dos veces al día (L04A).",
      "- Cuenta las aves (L04B).",
      "",
      "Antes de que lleguen pollitos",
      "- Limpieza, cama nueva y precalentado (L04A).",
      "- Cama al recibir: 28–32 °C (L01).",
      "",
      "Incubación",
      "- Gallina: 21 días (L01 y L03).",
      "- Codorniz: 17 días. Pato: 28. Pavo: 28 (L03, MSU)."
    ];
    if (iso && addDays(iso, 21)) {
      lines.push("", "Huevos de gallina puestos el " + fechaLarga(iso) + ".", "Fecha orientativa de nacimiento: " + fechaLarga(addDays(iso, 21)) + ".");
    }
    return lines.join("\n") + "\n";
  }
  function ics(iso) {
    var fin = addDays(iso, 21);
    var nextStart = addDays(iso, 1);
    var nextFin = addDays(fin, 1);
    if (!iso || !fin || !nextStart || !nextFin) return "";
    function stamp(day) { return day.replace(/-/g, ""); }
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Granja Rentable//Incubacion//ES",
      "BEGIN:VEVENT",
      "UID:incubacion-" + stamp(iso) + "@granjarentable.com",
      "DTSTART;VALUE=DATE:" + stamp(iso),
      "DTEND;VALUE=DATE:" + stamp(nextStart),
      "SUMMARY:Inicio de incubación (gallina, 21 días)",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:nacimiento-" + stamp(fin) + "@granjarentable.com",
      "DTSTART;VALUE=DATE:" + stamp(fin),
      "DTEND;VALUE=DATE:" + stamp(nextFin),
      "SUMMARY:Fecha orientativa de nacimiento (gallina)",
      "DESCRIPTION:21 días según las lecciones L01 y L03. No es una garantía.",
      "END:VEVENT",
      "END:VCALENDAR",
      ""
    ].join("\r\n");
  }
  root.GR_lista = { addDays: addDays, fechaLarga: fechaLarga, texto: texto, ics: ics };
})(typeof window !== "undefined" ? window : globalThis);
