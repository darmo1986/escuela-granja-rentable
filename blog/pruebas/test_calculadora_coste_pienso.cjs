const test = require("node:test");
const assert = require("node:assert/strict");
const { calcular } = require("../../js/calculadora.js");

const lote = {
  clase: "ponedora", objetivo: "huevo", huevosAplica: true, inicio: "pollita",
  aves: 10, meses: 12, mortalidad: 0, precioAve: 7, precioPienso: "0",
  gramos: { puesta: 110 }, huevosAnio: 280, manoMes: 10, huevoModo: "docena",
  precioHuevo: 3, vendibles: 100, porcentajeVenta: 0
};
const approx = (a, b) => assert.ok(Math.abs(a - b) < 1e-8, `${a} ≉ ${b}`);
const calc = (cambios) => calcular({ ...lote, ...cambios });

test("sin precio general, el coste y el beneficio no son definitivos", () => {
  for (const precioPienso of ["", "0"]) {
    const r = calc({ precioPienso });
    approx(r.kg, 401.5);
    assert.equal(r.beneficio, 510);
    assert.equal(r.luz, "faltan");
    assert.equal(r.piensoPendiente, true);
  }
});

test("confirmar coste cero permite estimar el margen", () => {
  const r = calc({ confirmarPiensoGratis: true });
  assert.equal(r.costePienso, 0);
  assert.equal(r.piensoPendiente, false);
  assert.equal(r.luz, "verde");
  assert.equal(calc({ confirmarPiensoGratis: true, manoMes: 0 }).luz, "faltan");
});

test("la etapa vacía hereda el precio general y una etapa a cero requiere confirmación", () => {
  const r = calc({ precioPienso: "1,250", precioEtapa: { puesta: "" } });
  approx(r.costePienso, 501.875);
  assert.ok(Math.abs(r.beneficio - 8.125) < 1e-8);
  assert.equal(r.luz, "ambar");
  assert.equal(calc({ precioPienso: "1,250", precioEtapa: { puesta: "0" } }).luz, "faltan");
  assert.equal(calc({ precioEtapa: { puesta: "1,250" } }).luz, "ambar");
});

test("se mantiene la interpretación de los separadores en importes guardados", () => {
  for (const precioPienso of ["1.250", "1 250", "1.250,00"]) {
    approx(calc({ precioPienso }).costePienso, 501875);
  }
  assert.equal(calc({ precioPienso: "sin precio" }).ok, false);
});

test("una etapa sin consumo no requiere un precio", () => {
  assert.equal(calc({ gramos: { puesta: 0 } }).piensoPendiente, false);
});
