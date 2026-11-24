#!/usr/bin/env node
/* Prueba en seco de la lógica día 0 / día 3. No envía correo. No llama a Google. */
"use strict";

function diasEntre(fecha, ahora) {
  if (!(fecha instanceof Date) || isNaN(fecha.getTime())) return -1;
  var a = Date.UTC(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
  var b = Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  return Math.floor((b - a) / 86400000);
}

var TIPOS = { contacto: true, calculadora: true, curso: true, video: true, lead: true };
var LIMITE = 40;

function decidir(filas, ahora, envioActivo, dryRun) {
  var porEmail = {};
  filas.forEach(function (rec, i) {
    rec = Object.assign({ _fila: i + 2 }, rec);
    if (!rec.email || rec.email.indexOf("@") < 1) return;
    if (!TIPOS[rec.tipo]) return;
    var clave = rec.email.toLowerCase();
    if (!porEmail[clave]) porEmail[clave] = { baja: false, dia0: false, dia3: false, pendientes: [] };
    var g = porEmail[clave];
    if (rec.baja) g.baja = true;
    if (rec.dia0_enviado) g.dia0 = true;
    if (rec.dia3_enviado) g.dia3 = true;
    if (rec.token_baja) g.pendientes.push(rec);
  });
  var salidas = [];
  Object.keys(porEmail).forEach(function (clave) {
    var grupo = porEmail[clave];
    if (grupo.baja || !grupo.pendientes.length) return;
    grupo.pendientes.sort(function (a, b) { return a.fecha - b.fecha; });
    var base = grupo.pendientes[0];
    var dias = diasEntre(base.fecha, ahora);
    var cuales = [];
    if (!grupo.dia0 && dias >= 0) cuales.push(0);
    if (!grupo.dia3 && dias >= 3) cuales.push(3);
    cuales.forEach(function (dia) {
      if (salidas.length >= LIMITE) return;
      salidas.push({
        email: base.email,
        dia: dia,
        enviar: envioActivo === true && dryRun === false,
        marca: (dryRun || !envioActivo) ? ("DRY_RUN " + ahora.toISOString()) : "ENVIADO"
      });
    });
  });
  return salidas;
}

function assert(cond, msg) {
  if (!cond) throw new Error("FALLO: " + msg);
}

var ahora = new Date(2026, 10, 24, 12, 0, 0); // 24 nov 2026

// 1) Día 0 el mismo día, no día 3
var r = decidir([{
  fecha: new Date(2026, 10, 24, 9, 0, 0), tipo: "calculadora",
  email: "ana@example.com", token_baja: "t1", baja: "", dia0_enviado: "", dia3_enviado: ""
}], ahora, false, true);
assert(r.length === 1 && r[0].dia === 0, "día 0 el mismo día");
assert(r[0].enviar === false, "DRY_RUN no envía");
assert(/^DRY_RUN /.test(r[0].marca), "marca DRY_RUN");

// 2) A los 3 días: día 0 (si no se mandó) y día 3
r = decidir([{
  fecha: new Date(2026, 10, 21, 9, 0, 0), tipo: "curso",
  email: "ana@example.com", token_baja: "t1", baja: "", dia0_enviado: "", dia3_enviado: ""
}], ahora, false, true);
assert(r.length === 2, "pendiente día 0 y 3 a los 3 días");
assert(r[0].dia === 0 && r[1].dia === 3, "orden 0 luego 3");

// 3) Si día 0 ya está marcado, solo día 3
r = decidir([{
  fecha: new Date(2026, 10, 21, 9, 0, 0), tipo: "video",
  email: "ana@example.com", token_baja: "t1", baja: "", dia0_enviado: "DRY_RUN x", dia3_enviado: ""
}], ahora, false, true);
assert(r.length === 1 && r[0].dia === 3, "solo día 3 si día 0 ya marcado");

// 4) Baja: no se envía nada, ni a otras filas del mismo correo
r = decidir([
  { fecha: new Date(2026, 10, 21), tipo: "curso", email: "Ana@example.com", token_baja: "t1", baja: "", dia0_enviado: "", dia3_enviado: "" },
  { fecha: new Date(2026, 10, 22), tipo: "video", email: "ana@example.com", token_baja: "t2", baja: "2026-11-23", dia0_enviado: "", dia3_enviado: "" }
], ahora, true, false);
assert(r.length === 0, "baja en cualquier fila del mismo correo bloquea");

// 5) Sin token (filas antiguas) no entran
r = decidir([{
  fecha: new Date(2026, 9, 1), tipo: "lead", email: "viejo@example.com",
  token_baja: "", baja: "", dia0_enviado: "", dia3_enviado: ""
}], ahora, true, false);
assert(r.length === 0, "sin token_baja no hay seguimiento retrospectivo");

// 6) pedido / afiliado / compra no entran
["pedido", "afiliado", "compra", "registro", "beta"].forEach(function (tipo) {
  var x = decidir([{
    fecha: new Date(2026, 10, 20), tipo: tipo, email: "x@example.com",
    token_baja: "t", baja: "", dia0_enviado: "", dia3_enviado: ""
  }], ahora, true, false);
  assert(x.length === 0, tipo + " no recibe seguimiento de leads");
});

// 7) Dos formularios del mismo correo: un solo juego de correos
r = decidir([
  { fecha: new Date(2026, 10, 20, 8), tipo: "calculadora", email: "ana@example.com", token_baja: "a", baja: "", dia0_enviado: "", dia3_enviado: "" },
  { fecha: new Date(2026, 10, 21, 8), tipo: "curso", email: "ana@example.com", token_baja: "b", baja: "", dia0_enviado: "", dia3_enviado: "" }
], ahora, false, true);
assert(r.length === 2, "un solo día 0 y un solo día 3 por correo");
assert(r[0].email === "ana@example.com" && r[1].email === "ana@example.com", "mismo correo");

// 8) Con ENVIO_ACTIVO y DRY_RUN=false, la marca sería ENVIADO (no se llama a MailApp aquí)
r = decidir([{
  fecha: new Date(2026, 10, 24), tipo: "lead", email: "ana@example.com",
  token_baja: "t1", baja: "", dia0_enviado: "", dia3_enviado: ""
}], ahora, true, false);
assert(r.length === 1 && r[0].enviar === true && r[0].marca === "ENVIADO", "solo entonces se enviaría");

// 9) Honeypot / email inválido no llega a decidir (simula doPost)
function aceptaLead(p) {
  if (p._gotcha) return { ok: true, guardado: false };
  if (p.consentimiento !== "si") return { ok: false, error: "sin_consentimiento" };
  var email = String(p.email || p.correo || "").trim();
  if (!email || email.indexOf("@") < 1) return { ok: false, error: "sin_correo" };
  return { ok: true, guardado: true, tipo: p.tipo, email: email };
}
assert(aceptaLead({ _gotcha: "bot", email: "a@b.c", consentimiento: "si", tipo: "curso" }).guardado === false, "honeypot no guarda");
assert(aceptaLead({ email: "mal", consentimiento: "si", tipo: "curso" }).error === "sin_correo", "correo inválido");
assert(aceptaLead({ email: "ana@example.com", consentimiento: "", tipo: "curso" }).error === "sin_consentimiento", "sin casilla");
assert(aceptaLead({ correo: "ana@example.com", consentimiento: "si", tipo: "contacto" }).guardado === true, "acepta correo o email");

console.log("OK: 9 bloques de pruebas en seco (día 0/3, baja, token, tipos, deduplicado, flags, validación). Ningún correo enviado.");
