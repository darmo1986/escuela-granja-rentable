/* Publicidad. Sitio aprobado en Adsterra: darmo1986.github.io (id 6120999).
   Una sola pieza de cada tamaño. Sin tema ni palabras clave. */
window.ADSENSE_CLIENT = "";
window.ADSTERRA = {
  banner: {
    key: "c7e91c7d03eae0ab61a26d112e2d59b5",
    w: 728,
    h: 90,
    movil: { key: "b82a679c2962b10cf24c6c9f4a1d93ab", w: 320, h: 50 }
  },
  rect: {
    key: "53a2e67f012f44fbe334cef3592e2fea",
    w: 300,
    h: 250
  }
};

/* Sitio unificado. La tienda propia va primero. Recomendados solo usa Mercado Libre y eBay.
   Pega aquí los identificadores cuando los tengas. Vacío = el enlace abre la búsqueda, sin tracking. */
window.GR = {
  siteUrl: "https://granjarentable.net",
  /* Única URL de la tienda de pago. Hoy sigue en Netlify.
     Para pasar a la tienda nueva, cambia solo esta línea a
     "https://tienda.granjarentable.net/". Los botones Comprar la leen de aquí. */
  tiendaBase: "https://granjarentable-incubadora.netlify.app/",
  youtubeUrl: "https://www.youtube.com/@GranjaRentable",
  /* Confirma la URL exacta de la página de Facebook. */
  facebookUrl: "https://www.facebook.com/GranjaRentable",
  whatsapp: "https://wa.me/34656267726?text=Hola%2C%20escribo%20desde%20el%20sitio%20de%20Granja%20Rentable",
  /* URL /exec de la aplicación web de Google Apps Script (gratis). Vacío = no se envía nada.
     Un solo valor para registro, prueba de la app y afiliados. Ver apps-script/Codigo.gs */
  formEndpoint: "https://script.google.com/macros/s/AKfycbzeq5Oi2e6quRnPmmoEdccLCxgAtZ59OoX3zvHMMIREWggrqMmQnZA6jHYw8p6tONcF/exec",
  /* Enlace de Google Play cuando exista. Vacío = el botón queda en «próximamente». */
  appUrl: "",
  refDays: 30,
  /* Tipo de cambio de referencia (14 oct 2026) solo para mostrar dólares. El cargo real es el de la tienda. */
  fx: { fecha: "14 de octubre de 2026", MXN: 18.361368, PEN: 3.440436, EUR: 0.893421 },
  redes: {
    mercadolibre: {
      /* Parámetro que añade el programa de afiliados. Cámbialo si tu panel indica otro. */
      param: "matt_tool",
      ids: {
        mx: "", co: "", pe: "", ar: "", ve: "", ec: "", do: "", cl: "",
        py: "", uy: "", bo: "", gt: "", hn: "", sv: "", ni: "", cr: "", pa: ""
      }
    },
    ebay: {
      /* eBay Partner Network. Pega campid y mkrid del generador de enlaces. */
      es: { campid: "", mkrid: "" },
      com: { campid: "", mkrid: "" }
    }
  }
};

/* Precios reales de la tienda (envío incluido), copiados el 14 oct 2026.
   envio:false = la incubadora todavía no llega; Recomendados sí puede mostrarse. */
window.GR_PAISES = {
  MX: { nombre: "México", envio: true, moneda: "MXN", precio: 2799, texto: "$2,799 MXN", voltaje: "110V", entrega: "3–6 semanas", ml: "mx",
    impuesto: "En México la paquetería llega del extranjero y la aduana puede cobrar una tasa global al recibir (hasta 33,5 % del valor declarado). Ese pago no está en nuestro precio.",
    garantia: "14 días para devolver. Si llega con un defecto, reparación o cambio." },
  US: { nombre: "Estados Unidos", envio: true, moneda: "USD", precio: 119, texto: "US$ 119", voltaje: "110V", entrega: "3–8 días", ml: "",
    impuesto: "Sale de un almacén en Estados Unidos: sin trámite de aduana. El cargo es en dólares.",
    garantia: "14 días para devolver. Si llega con un defecto, reparación o cambio." },
  CO: { nombre: "Colombia", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "co",
    impuesto: "", garantia: "" },
  PE: { nombre: "Perú", envio: true, moneda: "PEN", precio: 499, texto: "S/ 499", voltaje: "220V", entrega: "3–6 semanas", ml: "pe",
    impuesto: "En Perú, las compras de hasta US$ 200 por envío suelen estar exentas de impuestos de importación (envíos de entrega rápida, SUNAT).",
    garantia: "14 días para devolver. Si llega con un defecto, reparación o cambio." },
  ES: { nombre: "España", envio: true, moneda: "EUR", precio: 129, texto: "129 €", voltaje: "220V", entrega: "2–4 días laborables", ml: "",
    impuesto: "Precio final con impuestos incluidos. Enviamos a Península y Baleares. Todavía no enviamos a Canarias, Ceuta ni Melilla.",
    garantia: "14 días para devolver y 3 años de garantía legal." },
  AR: { nombre: "Argentina", envio: true, moneda: "USD", precio: 169, texto: "US$ 169", voltaje: "220V", entrega: "3–6 semanas", ml: "ar",
    impuesto: "El cobro es en dólares. Puede corresponder IVA (21 %) y tasas del courier al recibir. Hasta US$ 400 no se pagan derechos de importación. Tu banco puede sumar su propia comisión.",
    garantia: "14 días para devolver sin costo para ti. Garantía legal de 6 meses." },
  VE: { nombre: "Venezuela", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "ve", impuesto: "", garantia: "" },
  EC: { nombre: "Ecuador", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "ec", impuesto: "", garantia: "" },
  DO: { nombre: "República Dominicana", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "do", impuesto: "", garantia: "" },
  CL: { nombre: "Chile", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "cl", impuesto: "", garantia: "" },
  PY: { nombre: "Paraguay", envio: true, moneda: "USD", precio: 145, texto: "US$ 145", voltaje: "220V", entrega: "3–6 semanas", ml: "py",
    impuesto: "El cobro es en dólares. Puede haber tasas de aduana o del courier al recibir, y las paga quien recibe.",
    garantia: "14 días para devolver. Si llega con un defecto, reparación o cambio." },
  UY: { nombre: "Uruguay", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "uy", impuesto: "", garantia: "" },
  BO: { nombre: "Bolivia", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "bo", impuesto: "", garantia: "" },
  GT: { nombre: "Guatemala", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "gt", impuesto: "", garantia: "" },
  HN: { nombre: "Honduras", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "hn", impuesto: "", garantia: "" },
  SV: { nombre: "El Salvador", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "sv", impuesto: "", garantia: "" },
  NI: { nombre: "Nicaragua", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "ni", impuesto: "", garantia: "" },
  CR: { nombre: "Costa Rica", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "cr", impuesto: "", garantia: "" },
  PA: { nombre: "Panamá", envio: false, moneda: "USD", precio: 0, texto: "", voltaje: "", entrega: "", ml: "pa", impuesto: "", garantia: "" }
};
