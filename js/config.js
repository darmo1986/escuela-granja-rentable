/* Publicidad. Sitio aprobado en Adsterra: granjarentable.com (id 6132524).
   El cartelito usa redes.adsterra.bannerKey (320×50). Solo banners en iframe. */
window.ADSENSE_CLIENT = "ca-pub-5311145772953700";
window.ADSTERRA = {
  /* Dominio de invoke.js. Los códigos de granjarentable.com lo traen así.
     www.highperformanceformat.com también sirve el mismo script: se usa este
     host aquí y como respaldo en app.js para que los dos no diverjan. */
  host: "https://www.highrevenueformat.com",
  banner: {
    key: "054847add79800fd21407ef878aef225",
    w: 728,
    h: 90,
    movil: { key: "96014a59041982a1a0b8be24828db835", w: 320, h: 50 }
  },
  rect: {
    key: "4c10efc097372233b52ed4f05e0a6ab8",
    w: 300,
    h: 250
  }
};

/* Interruptor de publicidad. false = no se inyecta ningún script ni iframe de anuncios. */
window.ads = { activo: false };

/* Sitio unificado. La tienda propia y el curso van primero. */
window.GR = {
  siteUrl: "https://granjarentable.com",
  /* Única URL de la tienda. Desde el 21-oct-2026 es la tienda nueva en
     granjarentable.com/tienda/ (la de Netlify quedó cerrada).
     Los botones Comprar la leen de aquí. */
  tiendaBase: "https://granjarentable.com/tienda/",
  youtubeUrl: "https://www.youtube.com/@GranjaRentable",
  /* Confirma la URL exacta de la página de Facebook. */
  facebookUrl: "https://www.facebook.com/GranjaRentable",
  instagramUrl: "https://www.instagram.com/granjarentable",
  xUrl: "https://x.com/juanpab10242455",
  whatsapp: "https://wa.me/34656267726?text=Hola%2C%20escribo%20desde%20el%20sitio%20de%20Granja%20Rentable",
  /* URL /exec de la aplicación web de Google Apps Script (gratis). Vacío = no se envía nada.
     Un solo valor para registro, prueba de la app y afiliados. Ver apps-script/Codigo.gs */
  formEndpoint: "https://script.google.com/macros/s/AKfycbzeq5Oi2e6quRnPmmoEdccLCxgAtZ59OoX3zvHMMIREWggrqMmQnZA6jHYw8p6tONcF/exec",
  /* APK de descarga directa (Registro de pollos 1.0.10).
     Vacío = el botón queda en «próximamente».
     Cuando la ficha de Google Play esté publicada, cambia esta URL. */
  appUrl: "/descargas/registro-pollos-1.0.10.apk",
  refDays: 30,
  /* Tipo de cambio de referencia (14 oct 2026) solo para mostrar dólares. El cargo real es el de la tienda. */
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
  },
  redes: {
    adsterra: {
      /* Clave del banner pequeño (320×50).
         Vacío = la página muestra «Publicidad no disponible.» y no llama a Adsterra. */
      bannerKey: "96014a59041982a1a0b8be24828db835",
      w: 320,
      h: 50
    }
  }
};

/* Precios reales de la tienda (envío incluido), copiados el 14 oct 2026.
   envio:false = la incubadora todavía no llega a ese país. */
window.GR_PAISES = {
  MX: { nombre: "México", envio: true, moneda: "MXN", precio: 2799, texto: "$2,799 MXN", voltaje: "110V", entrega: "3–6 semanas",
    impuesto: "En México la paquetería llega del extranjero y la aduana puede cobrar una tasa global al recibir (hasta 33,5 % del valor declarado). Ese pago no está en nuestro precio.",
    garantia: "14 días para devolver. Si llega con un defecto, reparación o cambio." },
  US: { nombre: "Estados Unidos", envio: true, moneda: "USD", precio: 119, texto: "US$ 119", voltaje: "110V", entrega: "3–8 días",
    impuesto: "Sale de un almacén en Estados Unidos: sin trámite de aduana. El cargo es en dólares.",
    garantia: "14 días para devolver. Si llega con un defecto, reparación o cambio." },
  CO: { nombre: "Colombia", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "",
    impuesto: "", garantia: "" },
  PE: { nombre: "Perú", envio: true, moneda: "PEN", precio: 499, texto: "S/ 499", voltaje: "220V", entrega: "3–6 semanas",
    impuesto: "En Perú, las compras de hasta US$ 200 por envío suelen estar exentas de impuestos de importación (envíos de entrega rápida, SUNAT).",
    garantia: "14 días para devolver. Si llega con un defecto, reparación o cambio." },
  ES: { nombre: "España", envio: true, moneda: "EUR", precio: 129, texto: "129 €", voltaje: "220V", entrega: "2–4 días laborables",
    impuesto: "Precio final con impuestos incluidos. Enviamos a Península y Baleares. Todavía no enviamos a Canarias, Ceuta ni Melilla.",
    garantia: "14 días para devolver y 3 años de garantía legal." },
  AR: { nombre: "Argentina", envio: true, moneda: "USD", precio: 169, texto: "US$ 169", voltaje: "220V", entrega: "3–6 semanas",
    impuesto: "El cobro es en dólares. Puede corresponder IVA (21 %) y tasas del courier al recibir. Hasta US$ 400 no se pagan derechos de importación. Tu banco puede sumar su propia comisión.",
    garantia: "14 días para devolver sin costo para ti. Garantía legal de 6 meses." },
  VE: { nombre: "Venezuela", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  EC: { nombre: "Ecuador", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  DO: { nombre: "República Dominicana", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  CL: { nombre: "Chile", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  PY: { nombre: "Paraguay", envio: true, moneda: "USD", precio: 145, texto: "US$ 145", voltaje: "220V", entrega: "3–6 semanas",
    impuesto: "El cobro es en dólares. Puede haber tasas de aduana o del courier al recibir, y las paga quien recibe.",
    garantia: "14 días para devolver. Si llega con un defecto, reparación o cambio." },
  UY: { nombre: "Uruguay", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  BO: { nombre: "Bolivia", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  GT: { nombre: "Guatemala", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  HN: { nombre: "Honduras", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  SV: { nombre: "El Salvador", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  NI: { nombre: "Nicaragua", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  CR: { nombre: "Costa Rica", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" },
  PA: { nombre: "Panamá", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", impuesto: "", garantia: "" }
};
