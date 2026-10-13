/* ═══ CONFIGURACIÓN DE PUBLICIDAD ═══
   AdSense: pon tu ID de editor, p. ej. "ca-pub-1234567890123456".
   Adsterra: pega en cada hueco la key del banner (Panel Adsterra → Get code).
   Solo banners iframe (nunca popunder, social bar ni redirects).
   Si hay key de Adsterra y de AdSense, gana Adsterra.
   Sin keys: no se carga nada ni se muestran huecos. */
window.ADSENSE_CLIENT = "";

/* Campos: inicio / lecciones / final → desktop; movil → 320×50 o 300×250.
   w/h deben coincidir con el tamaño del banner creado en Adsterra. */
window.ADSTERRA = {
  inicio:    { key: "", w: 728, h: 90,  movil: { key: "", w: 320, h: 50 } },
  lecciones: { key: "", w: 728, h: 90,  movil: { key: "", w: 320, h: 50 } },
  final:     { key: "", w: 300, h: 250, movil: { key: "", w: 300, h: 250 } }
};
