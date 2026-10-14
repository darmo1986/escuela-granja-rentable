/* País antes del primer pintado.
   Orden: ?pais= → elección guardada → zona horaria → idioma (solo si el
   código de país está en la lista) → México. Un inglés genérico no
   se convierte en Estados Unidos. */
(function () {
  try {
    if (localStorage.getItem("gr_consent") === "si") document.documentElement.classList.add("ad-ok");
  } catch (e0) {}
  var map = {
    "America/Mexico_City": "MX",
    "America/Monterrey": "MX",
    "America/Merida": "MX",
    "America/Cancun": "MX",
    "America/Chihuahua": "MX",
    "America/Ciudad_Juarez": "MX",
    "America/Ojinaga": "MX",
    "America/Hermosillo": "MX",
    "America/Mazatlan": "MX",
    "America/Tijuana": "MX",
    "America/Matamoros": "MX",
    "America/Bahia_Banderas": "MX",
    "America/New_York": "US",
    "America/Detroit": "US",
    "America/Chicago": "US",
    "America/Indiana/Indianapolis": "US",
    "America/Kentucky/Louisville": "US",
    "America/Denver": "US",
    "America/Boise": "US",
    "America/Phoenix": "US",
    "America/Los_Angeles": "US",
    "America/Anchorage": "US",
    "America/Honolulu": "US",
    "America/Bogota": "CO",
    "America/Lima": "PE",
    "Europe/Madrid": "ES",
    "Atlantic/Canary": "ES",
    "America/Buenos_Aires": "AR",
    "America/Argentina/Buenos_Aires": "AR",
    "America/Argentina/Cordoba": "AR",
    "America/Cordoba": "AR",
    "America/Argentina/Mendoza": "AR",
    "America/Mendoza": "AR",
    "America/Argentina/Salta": "AR",
    "America/Argentina/Tucuman": "AR",
    "America/Caracas": "VE",
    "America/Guayaquil": "EC",
    "Pacific/Galapagos": "EC",
    "America/Santo_Domingo": "DO",
    "America/Santiago": "CL",
    "America/Punta_Arenas": "CL",
    "America/Asuncion": "PY",
    "America/Montevideo": "UY",
    "America/La_Paz": "BO",
    "America/Guatemala": "GT",
    "America/Tegucigalpa": "HN",
    "America/El_Salvador": "SV",
    "America/Managua": "NI",
    "America/Costa_Rica": "CR",
    "America/Panama": "PA"
  };
  var p = "";
  try {
    var q = new URLSearchParams(location.search).get("pais");
    if (q) {
      p = q.toUpperCase();
      localStorage.setItem("gr_pais", p);
    }
    if (!p) p = localStorage.getItem("gr_pais") || "";
    if (!p) {
      var tz = "";
      try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (e) {}
      p = map[tz] || "";
    }
    if (!p) {
      var known = { MX:1, US:1, CO:1, PE:1, ES:1, AR:1, VE:1, EC:1, DO:1, CL:1, PY:1, UY:1, BO:1, GT:1, HN:1, SV:1, NI:1, CR:1, PA:1 };
      var langs = navigator.languages || [navigator.language || ""];
      for (var i = 0; i < langs.length && !p; i++) {
        var m = String(langs[i]).toUpperCase().match(/-([A-Z]{2})$/);
        /* en-US en un navegador sin zona horaria no es una señal de país.
           Estados Unidos entra por la zona horaria, por ?pais= o por una elección guardada. */
        if (m && known[m[1]] && m[1] !== "US") p = m[1];
      }
    }
  } catch (e) {}
  document.documentElement.dataset.pais = p || "MX";
  try {
    if (new URLSearchParams(location.search).get("tema") === "claro") {
      document.documentElement.dataset.tema = "claro";
    }
  } catch (e2) {}
})();
