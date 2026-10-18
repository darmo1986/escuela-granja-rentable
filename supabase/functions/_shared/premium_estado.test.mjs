import test from "node:test";
import assert from "node:assert/strict";
import { decidirAcceso, esUuid, finPeriodo } from "./premium_estado.mjs";
import { firmaValida } from "./firma_stripe.mjs";

const AHORA = Date.parse("2026-10-18T12:00:00Z");
const FUTURO = Math.floor(AHORA / 1000) + 86400;
const PASADO = Math.floor(AHORA / 1000) - 86400;

function sub(status, fin, interval, currency) {
  return {
    status: status,
    current_period_end: fin,
    items: {
      data: [{
        current_period_end: fin,
        price: { currency: currency || "usd", recurring: { interval: interval || "month" } }
      }]
    }
  };
}

test("la prueba y el periodo pagado dan acceso", function () {
  var alta = decidirAcceso(sub("active", FUTURO, "year", "eur"), AHORA);
  assert.equal(alta.premium, true);
  assert.equal(alta.plan, "anual");
  assert.equal(alta.moneda, "eur");
  assert.equal(decidirAcceso(sub("trialing", FUTURO), AHORA).premium, true);
});

test("un fallo, una cancelación o un periodo vencido quitan el acceso", function () {
  assert.equal(decidirAcceso(sub("past_due", FUTURO), AHORA).premium, false);
  assert.equal(decidirAcceso(sub("unpaid", FUTURO), AHORA).premium, false);
  assert.equal(decidirAcceso(sub("canceled", FUTURO), AHORA).premium, false);
  assert.equal(decidirAcceso(sub("incomplete", FUTURO), AHORA).premium, false);
  assert.equal(decidirAcceso(sub("active", PASADO), AHORA).premium, false);
});

test("si el fin del periodo viene en la partida, también vale", function () {
  var s = {
    status: "active",
    items: { data: [{ current_period_end: FUTURO, price: { currency: "usd", recurring: { interval: "month" } } }] }
  };
  assert.equal(finPeriodo(s), FUTURO);
  assert.equal(decidirAcceso(s, AHORA).plan, "mensual");
});

test("solo acepta un uuid", function () {
  assert.equal(esUuid("11111111-1111-4111-8111-111111111111"), true);
  assert.equal(esUuid("no-es"), false);
  assert.equal(esUuid(""), false);
});

test("la firma de Stripe exige el cuerpo crudo y caduca a los cinco minutos", async function () {
  var secreto = "whsec_prueba_no_real";
  var cuerpo = "{\"id\":\"evt_1\"}";
  var t = "1700000000";
  var key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secreto),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  var mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(t + "." + cuerpo));
  var hex = Array.from(new Uint8Array(mac)).map(function (b) {
    return b.toString(16).padStart(2, "0");
  }).join("");
  var cabecera = "t=" + t + ",v1=" + hex;
  assert.equal(await firmaValida(cuerpo, cabecera, secreto, Number(t)), true);
  assert.equal(await firmaValida(cuerpo + " ", cabecera, secreto, Number(t)), false);
  assert.equal(await firmaValida(cuerpo, "t=" + t + ",v1=" + "0".repeat(hex.length), secreto, Number(t)), false);
  assert.equal(await firmaValida(cuerpo, cabecera, secreto, Number(t) + 301), false);
  assert.equal(await firmaValida(cuerpo, cabecera, "otro", Number(t)), false);
});
