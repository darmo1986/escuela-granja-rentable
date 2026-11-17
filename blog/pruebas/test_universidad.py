#!/usr/bin/env python3
"""Universidad: suscripción en prueba, sin tocar el precio de los ebooks."""
import subprocess
import unittest
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]


class Universidad(unittest.TestCase):
    def setUp(self):
        self.gs = (RAIZ / "docs" / "apps-script-universidad-privada.gs").read_text(encoding="utf-8")
        self.pagina = (RAIZ / "universidad.html").read_text(encoding="utf-8")
        self.inicio = (RAIZ / "index.html").read_text(encoding="utf-8")
        self.config = (RAIZ / "js" / "config.js").read_text(encoding="utf-8")
        self.cliente = (RAIZ / "js" / "universidad.js").read_text(encoding="utf-8")

    def test_el_script_arranca_en_prueba_y_no_toca_la_clave_de_los_ebooks(self):
        self.assertIn('return String(valor || "").trim() === "live"', self.gs)
        self.assertIn('return modoLive ? "STRIPE_SECRET_LIVE" : "STRIPE_SECRET_TEST"', self.gs)
        self.assertIn('s.indexOf("sk_test_") === 0', self.gs)
        self.assertIn('s.indexOf("sk_live_") === 0', self.gs)
        self.assertIn('mode: "subscription"', self.gs)
        self.assertIn("recurring][interval]\": UNI_INTERVALO", self.gs)
        self.assertIn("var UNI_IMPORTE = 1200", self.gs)
        self.assertIn('var UNI_MONEDA = "eur"', self.gs)
        self.assertIn('var UNI_INTERVALO = "month"', self.gs)
        self.assertIn('var UNI_PRODUCTO = "universidad-privada-v1"', self.gs)
        self.assertIn("oauth2.googleapis.com/tokeninfo", self.gs)
        self.assertIn("billing_portal/sessions", self.gs)
        self.assertNotIn("sk_test_51", self.gs)
        self.assertNotIn("sk_live_51", self.gs)
        self.assertIn('if (String(p.tipo || "") !== "universidad") return null;', self.gs)

    def test_reglas_estrictas(self):
        bloque = self.gs.split("/* UNI_REGLAS_INICIO */", 1)[1].split("/* UNI_REGLAS_FIN */", 1)[0]
        script = bloque + r'''
const ahora = Date.parse("2026-11-17T00:00:00Z");
const fin = Math.floor(ahora / 1000) + 86400;
const precio = {unit_amount:1200,currency:"eur",recurring:{interval:"month",interval_count:1}};
const sub = {status:"active",metadata:{producto:"universidad-privada-v1"},current_period_end:fin,items:{data:[{price:precio}]}};
const sesion = {mode:"subscription",currency:"eur",amount_total:1200,payment_status:"paid",metadata:{producto:"universidad-privada-v1"},subscription:sub,customer_details:{email:"Ana@Ejemplo.com"},line_items:{data:[{price:precio}]}};
const fallos = [];
function espera(nombre, valor, querido) { if (valor !== querido) fallos.push(nombre + "=" + valor); }
espera("valida", uniSesionCobrable_(sesion, ahora), "");
espera("correo", uniCorreoSesion_(sesion), "ana@ejemplo.com");
sesion.amount_total = 2900;
espera("importe", uniSesionCobrable_(sesion, ahora), "importe");
sesion.amount_total = 1200;
sesion.currency = "usd";
espera("moneda", uniSesionCobrable_(sesion, ahora), "moneda");
sesion.currency = "eur";
sesion.mode = "payment";
espera("modo", uniSesionCobrable_(sesion, ahora), "modo");
sesion.mode = "subscription";
sesion.metadata.producto = "asesoramiento-premium-v1";
espera("metadata", uniSesionCobrable_(sesion, ahora), "metadata");
sesion.metadata.producto = "universidad-privada-v1";
delete sesion.customer_details;
espera("email", uniSesionCobrable_(sesion, ahora), "email");
sesion.customer_details = {email:"ana@ejemplo.com"};
sub.status = "canceled";
espera("cancelada", uniSuscripcionVigente_(sub, ahora), "estado");
sub.status = "past_due";
espera("impagada", uniSuscripcionVigente_(sub, ahora), "estado");
sub.status = "active";
sub.current_period_end = Math.floor(ahora / 1000) - 5;
espera("caducada", uniSuscripcionVigente_(sub, ahora), "periodo");
sub.current_period_end = fin;
precio.unit_amount = 300;
espera("precio", uniSuscripcionVigente_(sub, ahora), "importe");
precio.unit_amount = 1200;
espera("viva", uniSuscripcionVigente_(sub, ahora), "");
espera("defecto", uniModoEsLive_(""), false);
espera("defecto2", uniModoEsLive_(null), false);
espera("live", uniModoEsLive_("live"), true);
espera("LIVE", uniModoEsLive_("LIVE"), false);
espera("prueba-cerrada", uniPuedeCrear_(false, false, "si"), false);
espera("prueba-abierta", uniPuedeCrear_(false, true, "si"), true);
espera("live-sin-prueba", uniPuedeCrear_(true, false, ""), true);
espera("test-key", uniSecretoPermitido_(false, "sk_test_abc"), true);
espera("test-no-live", uniSecretoPermitido_(false, "sk_live_abc"), false);
espera("live-no-test", uniSecretoPermitido_(true, "sk_test_abc"), false);
espera("nombre-test", uniClaveSecreto_(false), "STRIPE_SECRET_TEST");
espera("consent", uniConsentimientoOk_("digital-inmediato-v1"), true);
espera("consent-no", uniConsentimientoOk_("otra"), false);
const gid = "1234567890-abc.apps.googleusercontent.com";
const info = {aud:gid,iss:"https://accounts.google.com",email_verified:"true",exp:Math.floor(ahora/1000)+60,email:"ana@ejemplo.com"};
espera("google", uniGoogleOk_(info, gid, ahora), "");
info.aud = "999-otro.apps.googleusercontent.com";
espera("aud", uniGoogleOk_(info, gid, ahora), "aud");
if (fallos.length) throw new Error(fallos.join(", "));
'''
        hecho = subprocess.run(["node", "-e", script], capture_output=True, text=True)
        self.assertEqual(hecho.returncode, 0, hecho.stderr or hecho.stdout)

    def test_la_pagina_no_ofrece_el_pago_hasta_activar(self):
        self.assertIn('id="uni-compra" hidden', self.pagina)
        self.assertIn("Esta suscripción todavía no está a la venta.", self.pagina)
        self.assertIn("Suscribirme por 12 €/mes", self.pagina)
        self.assertIn("12 €/mes", self.pagina)
        self.assertIn("12,00 EUR", self.pagina)
        self.assertIn("tipo general del IGIC (7 %)", self.pagina)
        self.assertIn("digital-inmediato-v1", self.pagina)
        self.assertIn('id="uni-check"', self.pagina)
        self.assertNotIn('id="uni-check" checked', self.pagina)
        self.assertIn("Próximamente.", self.pagina)
        self.assertIn("noindex,follow", self.pagina)
        self.assertNotIn("accounts.google.com/gsi/client", self.pagina)
        self.assertIn('googleClientId: ""', self.config)
        self.assertIn("estado.disponible === true || (pruebaEnUrl() && estado.prueba === true)", self.cliente)
        self.assertIn('datos.prueba = "si"', self.cliente)
        self.assertNotIn("sk_live_", self.pagina)
        self.assertNotIn("sk_test_", self.pagina)

    def test_las_diapositivas_anteriores_siguen_y_entran_dos_nuevas(self):
        viewport = self.inicio.split('<div class="gr-hero-ctrl"', 1)[0]
        slides = viewport.split('<div class="gr-slide')
        self.assertEqual(len(slides) - 1, 9)
        self.assertEqual(self.inicio.count("data-hero-dot"), 9)
        self.assertIn("Empieza tu granja", slides[1])
        self.assertIn("Encuentra criaderos en tu país", slides[2])
        self.assertIn("¿Cómo va tu lote?", slides[3])
        self.assertNotIn("Universidad", slides[1])
        self.assertNotIn("Universidad", slides[2])
        self.assertNotIn("Universidad", slides[3])
        uni = slides[8] + slides[9]
        self.assertEqual(uni.count("Universidad Granja Rentable"), 2)
        self.assertIn("Primer tema: Genética de ponedoras", uni)
        self.assertIn("Se desbloquea al registrarte con Google o con tu correo y activar la suscripción.", uni)
        self.assertEqual(uni.count("Se desbloquea al registrarte con Google o con tu correo y activar la suscripción."), 2)
        self.assertIn("12 €/mes", uni)
        self.assertIn(">Suscribirme</a>", uni)
        self.assertIn("próximamente", uni)
        self.assertIn('href="universidad.html#suscripcion"', uni)
        self.assertIn("gr-uni-photo", uni)
        self.assertIn("anilla en la pata", uni)
        self.assertTrue((RAIZ / "img" / "banners" / "universidad-granja.webp").is_file())
        self.assertTrue((RAIZ / "img" / "banners" / "universidad-granja.jpg").is_file())


if __name__ == "__main__":
    unittest.main()
