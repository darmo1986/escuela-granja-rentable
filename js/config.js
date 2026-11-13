/* Interruptor de publicidad. false = no se pintan huecos de anuncio.
   amazonTag = etiqueta de afiliado de Amazon. Con etiqueta, el generador pinta el hueco de Amazon detrás del banner del ebook (relleno). No depende de activo.
   Piloto de un banner 300×250, solo en artículos y tras aceptar. */
window.ads = { activo: true, adsterraPilot: true, amazonTag: "granjarentabl-20" };

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
  /* Un solo bloque comunidad. Lo comparten la cuenta, el reto y el concurso.
     No crees otro: en JavaScript la segunda clave comunidad pisa a la primera.
     supabaseAnonKey es la clave publicable y va en el navegador. Nunca pongas la service_role.
     concursoPublicado: true desde el 22-oct-2026. La página es /concurso.html
     (100 preguntas, 4 respuestas y 30 s; desempate por tiempo medio de
     respuesta) y el ranking vive en public.ranking_mensual, con la vista
     pública public.ranking_mensual_top (mejor marca de cada usuario).
     El premio es de 20 € al primer clasificado del mes. El mes se cuenta en
     hora de Madrid y el ranking vuelve a cero.
     El apodo de la cuenta es perfiles.nombre. Si hay sesión, el concurso
     rellena el campo con ese nombre. La regla compartida es public.apodo_ok
     y GRAuth.apodo.
     El reto de /preguntas no tiene premio. */
  comunidad: {
    supabaseUrl: "https://apdcgizpgguhmbgzsymx.supabase.co",
    supabaseAnonKey: "sb_publishable_rSecPFEhDRv8VgJ2m68z0A_QotK9AKu",
    concursoPublicado: true
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

