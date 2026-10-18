"use strict";
var assert = require("assert");
var rent = require("../js/calculadora.js");
var calcs = require("../js/calculadoras.js");

function ejemplo(extra) {
  var state = {
    clase: "media",
    huevosAplica: true,
    huevosOpcional: false,
    objetivo: "huevo",
    inicio: "pollita",
    aves: "100",
    mortalidad: "5",
    meses: "12",
    vacio: "14",
    precioAve: "7",
    precioPienso: "0,52",
    precioEtapa: { arranque: "", recria: "", puesta: "", engordeInicio: "", engordeFinal: "" },
    gramos: { puesta: "117,5" },
    huevosAnio: "280",
    instalacion: "1500",
    anios: "5",
    manoModo: "mes",
    horasDia: "",
    precioHora: "",
    manoMes: "150",
    otrosMes: "95",
    huevoModo: "docena",
    precioHuevo: "3",
    vendibles: "95",
    ventaModo: "unidad",
    precioVenta: "",
    pesoKg: ""
  };
  if (extra) Object.keys(extra).forEach(function (k) { state[k] = extra[k]; });
  return state;
}

function cerca(n, esperado, msg) {
  assert.ok(Math.abs(n - esperado) < 0.02, (msg || "") + " esperado " + esperado + " y salió " + n);
}

var base = rent.calcular(ejemplo());
assert.strictEqual(base.ok, true, JSON.stringify(base.errores || base.error));
cerca(base.beneficio, 369.35, "beneficio Isa Brown");
cerca(base.costes, 6114.40, "costes");
cerca(base.ingresoHuevos, 6483.75, "ingresos huevos");
assert.ok(Math.abs(base.margen - 5.7) < 0.05, "margen " + base.margen);
assert.strictEqual(rent.fmt(base.beneficio, 2), "369,35");

var punto = rent.calcular(ejemplo({ precioPienso: "0.520" }));
assert.strictEqual(punto.ok, true, JSON.stringify(punto.errores));
cerca(punto.beneficio, base.beneficio, "0.520 debe ser 0,52");
cerca(punto.costes, base.costes, "costes con 0.520");
assert.ok(punto.costes < 10000, "0.520 no puede leerse como 520");

assert.strictEqual(rent.leerNumero("0.520").value, 0.52);
assert.strictEqual(rent.leerNumero("2.5").value, 2.5);
assert.strictEqual(rent.leerNumero("2,5").value, 2.5);
assert.strictEqual(rent.leerNumero("1,234.5").value, 1234.5);
assert.strictEqual(rent.leerNumero("1.234,5").value, 1234.5);
assert.strictEqual(rent.leerNumero("2.5", { entero: true, enteroMsg: "Escribe un número entero de aves." }).ok, false);
assert.strictEqual(rent.leerNumero("2,5", { entero: true }).ok, false);
assert.strictEqual(rent.leerNumero("-5").ok, false);
assert.ok(/positivo/.test(rent.leerNumero("-5").error));
assert.strictEqual(rent.leerNumero("").ok, false);
assert.strictEqual(rent.leerNumero("abc").ok, false);
assert.strictEqual(rent.leerNumero("12abc").ok, false);
assert.strictEqual(rent.leerNumero("1e21").ok, false);
assert.strictEqual(rent.leerNumero("1E300").ok, false);
assert.strictEqual(rent.leerNumero("1000000", { max: 100000 }).ok, false);

var negativo = rent.calcular(ejemplo({ precioPienso: "-5" }));
assert.strictEqual(negativo.ok, false);
assert.strictEqual(negativo.luz, "");
assert.ok(negativo.errores["c-precio-pienso"]);

var letras = rent.calcular(ejemplo({ precioPienso: "12abc" }));
assert.strictEqual(letras.ok, false);
assert.ok(/letras/.test(letras.errores["c-precio-pienso"]));

var vacio = rent.calcular(ejemplo({ precioPienso: "" }));
assert.strictEqual(vacio.ok, false);
assert.ok(vacio.errores["c-precio-pienso"]);

var aves = rent.calcular(ejemplo({ aves: "2.5" }));
assert.strictEqual(aves.ok, false);
assert.ok(/entero/.test(aves.errores["c-aves"]));
var avesComa = rent.calcular(ejemplo({ aves: "2,5" }));
assert.strictEqual(avesComa.ok, false);

var enorme = rent.calcular(ejemplo({ precioHuevo: "1e21" }));
assert.strictEqual(enorme.ok, false);
assert.ok(/científica/.test(enorme.errores["c-precio-huevo"]));

var tope = rent.calcular(ejemplo({ aves: "1000001" }));
assert.strictEqual(tope.ok, false);
assert.ok(tope.errores["c-aves"]);

var alimento = calcs.alimento(0.52, 2.5, 300, 0);
assert.ok(/Por huevo: 0,0043\./.test(alimento.text), alimento.text);
assert.ok(!/Por huevo: 0,00\./.test(alimento.text), alimento.text);
assert.strictEqual(calcs.moneyFino(0.004333), "0,0043");
assert.strictEqual(calcs.moneyFino(1.3), "1,30");
assert.strictEqual(calcs.leerNumero("2,5").value, 2.5);
assert.strictEqual(calcs.leerNumero("2.5").value, 2.5);
assert.strictEqual(calcs.leerNumero("0.520").value, 0.52);
assert.strictEqual(calcs.leerNumero("2,5", { entero: true, enteroMsg: "Escribe un número entero de aves." }).ok, false);
assert.strictEqual(calcs.leerNumero("-5").ok, false);
assert.strictEqual(calcs.leerNumero("12abc").ok, false);
assert.strictEqual(calcs.leerNumero("").ok, false);
assert.strictEqual(calcs.leerNumero("1e21").ok, false);

/* La pantalla rechaza aves no enteras antes de redondear. 2,5 no es 3 ni 25. */
var avesPantalla = calcs.leerNumero("2,5", { min: 1, max: 100000, entero: true, enteroMsg: "Escribe un número entero de aves." });
assert.strictEqual(avesPantalla.ok, false);
assert.ok(/entero/.test(avesPantalla.error));
var espacio = calcs.espacio("ponedora_patio", 100, 0);
assert.ok(/^100 ponedoras/.test(espacio.text), espacio.text);

console.log("ok", rent.fmt(base.beneficio, 2), "€");
