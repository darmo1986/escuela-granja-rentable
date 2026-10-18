import test from "node:test";
import assert from "node:assert/strict";
import {
  anuncioPermitido,
  decidirAcceso,
  dentroDePlazo,
  devolucionYaHecha,
  esUuid,
  eventoNuevo,
  facturaExigeDevolucion,
  finPeriodo,
  intencionesDePago,
  monedaAnunciada,
  primerCobroMs,
  resumirPremium,
  suscripcionDeFactura,
  usuarioAutorizado,
  usuariosCompatibles
} from "./premium_estado.mjs";
import { textoAcuse } from "./acuse.mjs";
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

test("sin fecha de fin no hay Premium", function () {
  var alta = decidirAcceso({ status: "active", items: { data: [] } }, AHORA);
  assert.equal(alta.premium, false);
  assert.equal(alta.premium_hasta, null);
  assert.equal(alta.premium && !alta.premium_hasta, false);
});

test("la factura basil trae la suscripción dentro de parent", function () {
  var factura = {
    parent: { subscription_details: { subscription: "sub_basil" } },
    lines: { data: [{ parent: { subscription_item_details: { subscription: "sub_linea" } } }] }
  };
  assert.equal(suscripcionDeFactura(factura), "sub_basil");
  assert.equal(suscripcionDeFactura({ subscription: "sub_antigua" }), "sub_antigua");
  assert.equal(suscripcionDeFactura({
    lines: { data: [{ parent: { subscription_item_details: { subscription: { id: "sub_obj" } } } }] }
  }), "sub_obj");
  assert.equal(suscripcionDeFactura({}), "");
});

test("el Premium sale de todas las suscripciones vivas y nunca sin fecha", function () {
  var futuro = new Date(AHORA + 86400000).toISOString();
  var lejos = new Date(AHORA + 20 * 86400000).toISOString();
  var uno = resumirPremium([
    { estado: "canceled", vence: futuro },
    { estado: "active", vence: futuro },
    { estado: "trialing", vence: lejos }
  ], AHORA);
  assert.equal(uno.premium, true);
  assert.equal(uno.premium_hasta, lejos);
  var ninguna = resumirPremium([
    { estado: "active", vence: null },
    { estado: "past_due", vence: futuro },
    { estado: "canceled", vence: lejos }
  ], AHORA);
  assert.deepEqual(ninguna, { premium: false, premium_hasta: null });
});

test("el id de la cuenta solo vale si lo puso el servidor", function () {
  var id = "11111111-1111-4111-8111-111111111111";
  var otro = "22222222-2222-4222-8222-222222222222";
  assert.equal(usuarioAutorizado({ user_id: id, client_reference_id: otro }), id);
  assert.equal(usuarioAutorizado({ client_reference_id: id }), "");
  assert.equal(usuariosCompatibles(id, otro), false);
  assert.equal(usuariosCompatibles(id, id), true);
  assert.equal(usuariosCompatibles(id, ""), true);
});

test("un aviso ya guardado no se vuelve a aplicar", function () {
  assert.equal(eventoNuevo([{ id: "evt_1" }]), true);
  assert.equal(eventoNuevo([]), false);
  assert.equal(eventoNuevo(null), false);
});

test("si falla el país, el precio anunciado es en euros", function () {
  assert.equal(monedaAnunciada("MX", "defecto", "fallo"), "eur");
  assert.equal(monedaAnunciada("MX", "inferido", "fallo"), "eur");
  assert.equal(monedaAnunciada("MX", "defecto", ""), "eur");
  assert.equal(monedaAnunciada("ES", "defecto", "fallo"), "eur");
  assert.equal(monedaAnunciada("DE", "elegido", "ok"), "eur");
  assert.equal(monedaAnunciada("MX", "elegido", "ok"), "usd");
  assert.equal(monedaAnunciada("MX", "geo", "ok"), "usd");
  assert.equal(monedaAnunciada("US", "inferido", "ok"), "usd");
  assert.equal(monedaAnunciada("MX", "inferido", "", "libre"), "usd");
  assert.equal(monedaAnunciada("CO", "inferido", "", "libre"), "usd");
  assert.equal(monedaAnunciada("MX", "inferido", "fallo", "libre"), "usd");
  assert.equal(monedaAnunciada("ES", "inferido", "", "libre"), "eur");
  assert.equal(monedaAnunciada("MX", "defecto", "", "libre"), "eur");
  assert.equal(monedaAnunciada("MX", "inferido", ""), "eur");
});

test("la factura basil devuelve el payment intent, no el campo antiguo", function () {
  var factura = {
    amount_paid: 499,
    status_transitions: { paid_at: 100 },
    payments: {
      data: [
        { status: "paid", payment: { type: "payment_intent", payment_intent: "pi_1" } },
        { status: "paid", payment: { type: "payment_intent", payment_intent: { id: "pi_2" } } },
        { status: "open", payment: { type: "payment_intent", payment_intent: "pi_no" } },
        { status: "paid", payment: { type: "charge", charge: "ch_1" } }
      ]
    }
  };
  assert.deepEqual(intencionesDePago(factura), ["pi_1", "pi_2"]);
  assert.equal(facturaExigeDevolucion(factura), true);
  assert.equal(facturaExigeDevolucion({ amount_paid: 0, payments: { data: [] } }), false);
  assert.equal(intencionesDePago({ amount_paid: 499 }).length, 0);
  assert.equal(devolucionYaHecha(400, { error: { message: "Charge has already been refunded" } }), true);
  assert.equal(devolucionYaHecha(400, { error: { code: "charge_already_refunded", message: "otra cosa" } }), true);
  assert.equal(devolucionYaHecha(400, { error: { message: "No such payment_intent" } }), false);
  assert.equal(devolucionYaHecha(402, { error: { message: "already been refunded" } }), false);
});

test("los 14 días cuentan desde el primer cobro y no se acortan", function () {
  var dia = 86400;
  var alta = 1700000000;
  var cobro = [{ amount_paid: 499, status_transitions: { paid_at: alta + 7 * dia } }];
  assert.equal(primerCobroMs(cobro), (alta + 7 * dia) * 1000);
  assert.equal(dentroDePlazo(alta, cobro, (alta + 17 * dia) * 1000), true);
  assert.equal(dentroDePlazo(alta, cobro, (alta + 21 * dia) * 1000), true);
  assert.equal(dentroDePlazo(alta, cobro, (alta + 22 * dia) * 1000), false);
  assert.equal(dentroDePlazo(alta, [], (alta + 10 * dia) * 1000), true);
  assert.equal(dentroDePlazo(alta, [], (alta + 16 * dia) * 1000), false);
  assert.equal(dentroDePlazo(alta, [{ amount_paid: 0, status_transitions: { paid_at: alta + dia } }], (alta + 16 * dia) * 1000), false);
});

test("el acuse lleva el contenido, la fecha y la hora", function () {
  var cuando = new Date("2026-10-18T12:00:00Z");
  var texto = textoAcuse({
    cuando: cuando,
    apodo: "Pablo",
    correo: "pablo@example.com",
    suscripciones: ["sub_1"]
  });
  assert.match(texto, /desistimiento del contrato de suscripción/);
  assert.match(texto, /sub_1/);
  assert.match(texto, /Pablo/);
  assert.match(texto, /pablo@example.com/);
  assert.match(texto, /2026-10-18T12:00:00.000Z/);
  assert.match(texto, /hora de recepción/);
});

test("con la sesión abierta no hay anuncios hasta saber si es Premium", function () {
  assert.equal(anuncioPermitido({ sesion: true, conocido: false, premium: false }), false);
  assert.equal(anuncioPermitido({ premium: true, conocido: true }), false);
  assert.equal(anuncioPermitido({ premiumOk: true }), false);
  assert.equal(anuncioPermitido({ sesion: true, conocido: true, premium: false }), true);
  assert.equal(anuncioPermitido({ sesion: false, conocido: false, premium: false }), true);
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
