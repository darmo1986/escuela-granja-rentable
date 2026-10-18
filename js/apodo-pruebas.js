/* Pruebas de la regla del apodo. node js/apodo-pruebas.js */
const fs = require("fs");
const path = require("path");
const src = fs.readFileSync(path.join(__dirname, "auth.js"), "utf8");
const start = src.indexOf("var APODO_MALAS");
const end = src.indexOf("function textoApodo");
if (start < 0 || end < 0) {
  console.error("No encuentro apodoValido en auth.js");
  process.exit(1);
}
eval(src.slice(start, end));

const pasan = [
  "Putumayo", "Maricarmen", "Conchita", "Cabrera", "Diputado",
  "Gonçalo", "O'Brien", "Łukasz", "Ana Ruiz", "María", "Navarro", "Eva",
  "disputa", "computadora", "reputación",
  "Disputo", "Reputo", "Imputo", "Computa", "Putri", "Putra", "Putnam", "Puttanesca"
];
const noPasan = [
  "coño", "polla", "zorra", "pinche", "idiota", "fuck", "pvta",
  "pụta", "ıdiota", "pvto", "hijodeputa", "putamadre", "joder", "culo",
  "imbécil", "bitch", "f u c k", "Pụta", "HIJODEPUTA",
  "putita", "pvtita", "granjaputa", "Elputo", "subnormal", "perra", "shit", "carajo",
  "\u02CDmierda", "p.v.t.a", "Putin",
  "laputaza", "hijoeputaso", "superputaso", "\u028Dmierda"
];
let fallos = 0;
function mal(msg) { fallos += 1; console.error(msg); }
pasan.forEach(function (s) {
  const got = apodoValido(s);
  if (got !== s) mal("tenía que pasar: " + s + " → " + JSON.stringify(got));
});
noPasan.forEach(function (s) {
  const got = apodoValido(s);
  if (got) mal("tenía que caer: " + s + " → " + JSON.stringify(got));
});
if (apodoValido("  Ana   Ruiz ") !== "Ana Ruiz") mal("no recorta espacios");
if (fallos) {
  console.error(fallos + " fallos");
  process.exit(1);
}
console.log("apodo-pruebas: ok");
