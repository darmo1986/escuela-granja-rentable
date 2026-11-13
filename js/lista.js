/* Lista y calendario que se arman en el navegador. No llama a la red. */
(function (root) {
  var MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function parseDate(iso) {
    if (typeof iso !== 'string' || iso.length !== 10 || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
    var p = iso.split("-").map(Number);
    if (p[0] < 1000 || p[0] > 9999) return null;
    var date = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
    return date.getUTCFullYear() === p[0] && date.getUTCMonth() === p[1] - 1 && date.getUTCDate() === p[2] ? date : null;
  }
  function fechaLarga(iso) {
    if (!parseDate(iso)) return "";
    var p = String(iso || "").split("-");
    if (p.length !== 3) return "";
    var d = +p[2], m = +p[1];
    if (!d || m < 1 || m > 12) return "";
    return d + " de " + MESES[m - 1] + " de " + p[0];
  }
  function addDays(iso, days) {
    var d = parseDate(iso);
    if (!d || !Number.isSafeInteger(days)) return "";
    d.setUTCDate(d.getUTCDate() + days);
    if (!isFinite(d.getTime()) || d.getUTCFullYear() < 1000 || d.getUTCFullYear() > 9999) return "";
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
  function fold(line) {
    var result = "", size = 0;
    var encoder = new TextEncoder();
    Array.from(line).forEach(function (ch) {
      var n = encoder.encode(ch).length;
      if (size + n > 75) { result += "\r\n "; size = 1; }
      result += ch; size += n;
    });
    return result;
  }
  function ics(iso, especie) {
    especie = especie || "gallina";
    var datos = {gallina:{dias:21,nombre:"gallina"},codorniz:{dias:17,nombre:"codorniz"},pato:{dias:28,nombre:"pato"},pavo:{dias:28,nombre:"pavo"}};
    var plan = Object.prototype.hasOwnProperty.call(datos, especie) && datos[especie];
    if (!plan) return "";
    var fin = addDays(iso, plan.dias);
    var nextStart = addDays(iso, 1);
    var nextFin = addDays(fin, 1);
    if (!iso || !fin || !nextStart || !nextFin) return "";
    function stamp(day) { return day.replace(/-/g, ""); }
    var ahora = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    var id = (especie === "gallina" ? "" : especie + "-");
    return [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Granja Rentable//Incubacion//ES",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      "UID:incubacion-" + id + stamp(iso) + "@granjarentable.com",
      "DTSTAMP:" + ahora,
      "DTSTART;VALUE=DATE:" + stamp(iso),
      "DTEND;VALUE=DATE:" + stamp(nextStart),
      "SUMMARY:Inicio de incubación (" + plan.nombre + "\\, " + plan.dias + " días)",
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
      "BEGIN:VEVENT",
      "UID:nacimiento-" + id + stamp(fin) + "@granjarentable.com",
      "DTSTAMP:" + ahora,
      "DTSTART;VALUE=DATE:" + stamp(fin),
      "DTEND;VALUE=DATE:" + stamp(nextFin),
      "SUMMARY:Fecha orientativa de nacimiento (" + plan.nombre + ")",
      "DESCRIPTION:" + plan.dias + " días como referencia de las lecciones. Sigue el protocolo de tu especie y equipo. No es una garantía de nacimiento.",
      "TRANSP:TRANSPARENT",
      "END:VEVENT",
      "END:VCALENDAR",
      ""
    ].map(fold).join("\r\n");
  }
  root.GR_lista = { addDays: addDays, fechaLarga: fechaLarga, texto: texto, ics: ics };
})(typeof window !== "undefined" ? window : globalThis);

