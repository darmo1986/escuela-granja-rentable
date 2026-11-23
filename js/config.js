/* Adsterra retirada por decisión editorial (20/11/2026).
   No activar el piloto ni los espacios ampliados.
   amazonTag identifica enlaces de afiliado a Amazon y no carga anuncios de terceros. */
window.ads = { activo: false, adsterraPilot: false, amazonTag: "granjarentabl-20" };
window.ads.ampliacionDiscreta = false;

/* El curso y los ebooks van primero. */
window.GR = {
  siteUrl: "https://granjarentable.com",
  youtubeUrl: "https://www.youtube.com/@GranjaRentable",
  /* Confirma la URL exacta de la página de Facebook. */
  facebookUrl: "https://www.facebook.com/GranjaRentable",
  instagramUrl: "https://www.instagram.com/granjarentable",
  xUrl: "https://x.com/juanpab10242455",
  whatsapp: "https://wa.me/34656267726?text=Hola%2C%20escribo%20desde%20el%20sitio%20de%20Granja%20Rentable",
  /* URL /exec de la aplicación web de Google Apps Script (gratis). Vacío = no se envía nada.
     Un solo valor para registro, prueba de la app y afiliados. Ver apps-script/Codigo.gs */
  formEndpoint: "https://script.google.com/macros/s/AKfycbyeSZCE95DI1wdls0MiNoKdh92i8ve0GkkJHy4GAY3p4pWsBCRhs0hb3bmUMTV-Xw0Wzw/exec",
  /* Vacío = no se ofrece PayPal. El pago de los ebooks va por Stripe en /ebooks/. */
  paypalMe: "",
  /* APK de descarga directa (Registro de pollos 1.0.10).
     Vacío = el botón queda en «próximamente».
     Cuando la ficha de Google Play esté publicada, cambia esta URL. */
  appUrl: "/descargas/registro-pollos-1.0.10.apk",
  refDays: 30,
  /* Tipo de cambio de referencia (14 oct 2026) solo para mostrar dólares. El cargo de un ebook es el de su página de pago. */
  fx: { fecha: "14 de octubre de 2026", MXN: 18.361368, PEN: 3.440436, EUR: 0.893421 },
  /* Configuración compartida por la cuenta y el reto gratuito de /preguntas.
     La clave es publicable y va en el navegador. Nunca pongas la service_role. */
  comunidad: {
    supabaseUrl: "https://apdcgizpgguhmbgzsymx.supabase.co",
    supabaseAnonKey: "sb_publishable_rSecPFEhDRv8VgJ2m68z0A_QotK9AKu",
    concursoPublicado: false
  },
  /* Analítica propia y Cloudflare Web Analytics (sin cookies).
     cfToken vacío = Cloudflare Web Analytics apagado. Para encenderlo:
     panel de Cloudflare → Analytics → Web Analytics → añadir granjarentable.com
     y pegar aquí el token del sitio. La baliza la inyecta js/site.js.
     El registro propio de visitas va a Supabase (tabla public.visitas) y lo
     muestra /panel.html; necesita la migración 20261020193000_panel.sql. */
  analitica: {
    cfToken: ""
  }
};

/* País del lector. Solo el nombre, para el selector de la cabecera. */
window.GR_PAISES = {
  MX: { nombre: "México" },
  US: { nombre: "Estados Unidos" },
  CO: { nombre: "Colombia" },
  PE: { nombre: "Perú" },
  ES: { nombre: "España" },
  AR: { nombre: "Argentina" },
  VE: { nombre: "Venezuela" },
  EC: { nombre: "Ecuador" },
  DO: { nombre: "República Dominicana" },
  CL: { nombre: "Chile" },
  PY: { nombre: "Paraguay" },
  UY: { nombre: "Uruguay" },
  BO: { nombre: "Bolivia" },
  GT: { nombre: "Guatemala" },
  HN: { nombre: "Honduras" },
  SV: { nombre: "El Salvador" },
  NI: { nombre: "Nicaragua" },
  CR: { nombre: "Costa Rica" },
  PA: { nombre: "Panamá" }
};

