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


/* —— Tema y plantillas (ampliación v. tema) —— */
var TEMAS_OK = { pienso: true, ponedoras: true, empezar: true };
function normalizarTema(v) {
  v = String(v || "").toLowerCase().trim();
  if (TEMAS_OK[v]) return v;
  if (/pienso|alimento|saco|coste-docena|coste_docena|comedero/.test(v)) return "pienso";
  if (/ponedoras|puesta|yema|alimenta-ponedoras/.test(v)) return "ponedoras";
  if (/empezar|inicio|incub|lista/.test(v)) return "empezar";
  return "";
}
function temaDesdeUbicacion(path, hash, interes) {
  var t = ((path || "") + " " + (hash || "") + " " + (interes || "")).toLowerCase();
  if (/#coste-docena|#alimento|#sacos|pienso-hacer|pienso-elegir|pienso-iniciador|l04a|l04b/.test(t)) return "pienso";
  if (/alimenta-ponedoras|ponedoras|puesta|l05/.test(t)) return "ponedoras";
  if (/guia-empezar|empezar-con-10|lista\.html|l01|l02|l03/.test(t)) return "empezar";
  return "empezar";
}
function inferirTema(p) {
  var n = normalizarTema(p && p.tema);
  if (n) return n;
  var origen = String((p && p.origen) || "");
  var path = origen, hash = "";
  var i = origen.indexOf("#");
  if (i >= 0) { path = origen.slice(0, i); hash = origen.slice(i); }
  try {
    if (origen && origen.indexOf("http") === 0) {
      var corte = origen.split("?")[0];
      var proto = corte.indexOf("://");
      if (proto >= 0) {
        var slash = corte.indexOf("/", proto + 3);
        corte = slash >= 0 ? corte.slice(slash) : "/";
      }
      i = corte.indexOf("#");
      if (i >= 0) { path = corte.slice(0, i); hash = corte.slice(i); }
      else { path = corte; hash = ""; }
    }
  } catch (e) {}
  return temaDesdeUbicacion(path, hash, (p && (p.interes || p.motivo)) || "");
}

assert(normalizarTema("PIENSO") === "pienso", "normaliza pienso");
assert(normalizarTema("Gallinas ponedoras") === "ponedoras", "normaliza ponedoras por texto");
assert(normalizarTema("xyz") === "", "tema desconocido vacío");
assert(temaDesdeUbicacion("/calculadoras.html", "#coste-docena", "") === "pienso", "hash coste-docena → pienso");
assert(temaDesdeUbicacion("/calculadoras.html", "#sacos", "") === "pienso", "hash sacos → pienso");
assert(temaDesdeUbicacion("/lecciones/l04a.html", "", "") === "pienso", "L04A → pienso");
assert(temaDesdeUbicacion("/lecciones/l01.html", "", "") === "empezar", "L01 → empezar");
assert(temaDesdeUbicacion("/lecciones/l03.html", "", "") === "empezar", "L03 → empezar");
assert(temaDesdeUbicacion("/ebooks/", "#alimenta-ponedoras", "") === "ponedoras", "ancla alimenta-ponedoras");
assert(temaDesdeUbicacion("/curso.html", "", "") === "empezar", "curso → empezar (por defecto)");
assert(temaDesdeUbicacion("/videos.html", "", "") === "empezar", "videos sin selector → empezar");
assert(inferirTema({ tema: "ponedoras", origen: "/calculadoras.html#coste-docena" }) === "ponedoras", "selector gana a la URL");
assert(inferirTema({ origen: "https://granjarentable.com/calculadoras.html#coste-docena" }) === "pienso", "URL absoluta con ancla");
assert(inferirTema({ origen: "https://granjarentable.com/hoja-registro-puesta.html" }) === "ponedoras", "hoja de puesta → ponedoras");
assert(inferirTema({}) === "empezar", "sin datos → empezar");

var fs = require("fs");
var path = require("path");
var dir = path.join(__dirname, "..", "correos");
if (!fs.existsSync(path.join(dir, "dia-0-pienso.txt"))) {
  dir = path.join(__dirname, "..", "..", "correos"); // paquete en /correos
}
if (!fs.existsSync(path.join(dir, "dia-0-pienso.txt"))) {
  dir = path.join(__dirname, "correos");
}
var temas = ["pienso", "ponedoras", "empezar"];
var dias = [0, 3];
temas.forEach(function (tema) {
  dias.forEach(function (dia) {
    var f = path.join(dir, "dia-" + dia + "-" + tema + ".txt");
    assert(fs.existsSync(f), "existe " + path.basename(f));
    var body = fs.readFileSync(f, "utf8");
    assert(body.indexOf("https://granjarentable.com/descargas/") >= 0, tema + " d" + dia + " enlace descargas");
    assert(body.indexOf("2,99 €") >= 0, tema + " d" + dia + " membresía 2,99 €");
    assert(body.indexOf("https://www.youtube.com/@GranjaRentable/join") >= 0, tema + " d" + dia + " /join");
    assert(body.indexOf("https://www.facebook.com/GranjaRentable") >= 0, tema + " d" + dia + " Facebook");
    assert(body.indexOf("{URL_BAJA}") >= 0, tema + " d" + dia + " baja");
    assert(body.indexOf("3,00 USD") >= 0, tema + " d" + dia + " precio ebook");
    assert(!/te enviamos el ebook/i.test(body), "no promete enviar el PDF del ebook");
    assert(!/descuento|% off|testimonio/i.test(body), "sin descuentos ni testimonios");
    if (tema === "pienso") {
      assert(body.indexOf("/ebooks/#pienso-hacer") >= 0 && body.indexOf("/ebooks/#pienso-elegir") >= 0, "ebooks de pienso");
    }
    if (tema === "ponedoras") {
      assert(body.indexOf("/ebooks/#alimenta-ponedoras") >= 0, "ebook ponedoras");
    }
    if (tema === "empezar") {
      assert(body.indexOf("/ebooks/#guia-empezar") >= 0, "ebook empezar");
    }
  });
});

/* El asunto del día 0 de Calidad se mantiene. */
var d0 = fs.readFileSync(path.join(dir, "dia-0-empezar.txt"), "utf8");
assert(d0.indexOf("Gracias por dejar tu correo en Granja Rentable") >= 0, "asunto día 0 de Calidad");

/* Si ENVIO sigue apagado, decidir no marca enviar aunque haya tema. */
r = decidir([{
  fecha: new Date(2026, 10, 24, 9, 0, 0), tipo: "calculadora",
  email: "ana@example.com", token_baja: "t1", baja: "", dia0_enviado: "", dia3_enviado: "",
  tema: "pienso"
}], ahora, false, true);
assert(r.length === 1 && r[0].enviar === false, "con tema, DRY_RUN sigue sin enviar");

console.log("OK: 9 bloques base + tema/plantillas en seco. Ningún correo enviado.");
