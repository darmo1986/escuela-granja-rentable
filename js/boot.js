/* País antes del primer pintado.
   Orden: ?pais= → elección guardada → zona horaria → idioma (solo si el
   código de país está en la lista) → México. Un inglés genérico no
   se convierte en Estados Unidos.
   El aviso de anuncios mira la zona horaria, sin llamar a nadie:
   UE, EEE, Reino Unido, Suiza, Brasil, zona desconocida o GPC piden Aceptar.
   data-ads="cmp" solo en el EEE, el Reino Unido y Suiza, y nunca si hay GPC:
   ahí puede hablar el CMP de Google. En Brasil, con GPC o si no se sabe
   la zona, data-ads="ue": hace falta el aviso propio. */
(function () {
  function zonaEstricta(tz) {
    if (!tz || tz === "UTC" || tz.indexOf("Etc/") === 0) return true;
    if (tz.indexOf("Europe/") === 0) return true;
    var extra = {
      "Atlantic/Azores": 1, "Atlantic/Madeira": 1, "Atlantic/Canary": 1,
      "Atlantic/Reykjavik": 1, "Atlantic/Faroe": 1, "Atlantic/Faeroe": 1,
      "Atlantic/Jan_Mayen": 1, "Arctic/Longyearbyen": 1,
      "Africa/Ceuta": 1, "Asia/Nicosia": 1, "Asia/Famagusta": 1,
      "Indian/Reunion": 1, "Indian/Mayotte": 1,
      "America/Cayenne": 1, "America/Guadeloupe": 1, "America/Martinique": 1,
      "America/Marigot": 1, "America/St_Barthelemy": 1,
      "America/Noronha": 1, "America/Belem": 1, "America/Fortaleza": 1,
      "America/Recife": 1, "America/Araguaina": 1, "America/Maceio": 1,
      "America/Bahia": 1, "America/Sao_Paulo": 1, "America/Campo_Grande": 1,
      "America/Cuiaba": 1, "America/Santarem": 1, "America/Porto_Velho": 1,
      "America/Boa_Vista": 1, "America/Manaus": 1,       "America/Eirunepe": 1,
      "America/Rio_Branco": 1, "America/Porto_Acre": 1
    };
    if (extra[tz]) return true;
    if (!/^(Africa|America|Asia|Atlantic|Australia|Indian|Pacific)\//.test(tz)) return true;
    return false;
  }
  /* EEE, Reino Unido y Suiza. No incluye Brasil ni el resto de Europa. */
  function zonaCmp(tz) {
    var europe = {
      "Europe/Amsterdam": 1, "Europe/Athens": 1, "Europe/Berlin": 1,
      "Europe/Bratislava": 1, "Europe/Brussels": 1, "Europe/Bucharest": 1,
      "Europe/Budapest": 1, "Europe/Busingen": 1, "Europe/Copenhagen": 1,
      "Europe/Dublin": 1, "Europe/Gibraltar": 1, "Europe/Guernsey": 1,
      "Europe/Helsinki": 1, "Europe/Isle_of_Man": 1, "Europe/Jersey": 1,
      "Europe/Lisbon": 1, "Europe/Ljubljana": 1, "Europe/London": 1,
      "Europe/Luxembourg": 1, "Europe/Madrid": 1, "Europe/Malta": 1,
      "Europe/Mariehamn": 1, "Europe/Oslo": 1, "Europe/Paris": 1,
      "Europe/Prague": 1, "Europe/Riga": 1, "Europe/Rome": 1,
      "Europe/Sofia": 1, "Europe/Stockholm": 1, "Europe/Tallinn": 1,
      "Europe/Vaduz": 1, "Europe/Vienna": 1, "Europe/Vilnius": 1,
      "Europe/Warsaw": 1, "Europe/Zagreb": 1, "Europe/Zurich": 1
    };
    if (europe[tz]) return true;
    var extra = {
      "Atlantic/Azores": 1, "Atlantic/Madeira": 1, "Atlantic/Canary": 1,
      "Atlantic/Reykjavik": 1, "Atlantic/Faroe": 1, "Atlantic/Faeroe": 1,
      "Atlantic/Jan_Mayen": 1, "Arctic/Longyearbyen": 1,
      "Africa/Ceuta": 1, "Asia/Nicosia": 1, "Asia/Famagusta": 1,
      "Indian/Reunion": 1, "Indian/Mayotte": 1,
      "America/Cayenne": 1, "America/Guadeloupe": 1, "America/Martinique": 1,
      "America/Marigot": 1, "America/St_Barthelemy": 1
    };
    return !!extra[tz];
  }
  /* Premium caduca. Sin fecha futura, gr_premium = "1" no vale. */
  function premiumVigente() {
    try {
      var marca = localStorage.getItem("gr_premium");
      var hasta = localStorage.getItem("gr_premium_hasta");
      var fin = hasta ? Date.parse(hasta) : NaN;
      if (marca === "1" && fin > Date.now()) return true;
      if (marca || hasta) {
        localStorage.removeItem("gr_premium");
        localStorage.removeItem("gr_premium_hasta");
      }
    } catch (eP) {}
    return false;
  }
  window.GR_esPremium = premiumVigente;
  var tz = "";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ""; } catch (eTz) {}
  var gpc = false;
  try { if (navigator.globalPrivacyControl === true) gpc = true; } catch (eG) {}
  var estricto = zonaEstricta(tz) || gpc;
  /* El CMP certificado de Google solo cubre EEE, Reino Unido y Suiza.
     GPC, Brasil y una zona desconocida siguen pidiendo el aviso propio. */
  var cmp = zonaCmp(tz) && !gpc;
  document.documentElement.dataset.ads = cmp ? "cmp" : (estricto ? "ue" : "libre");
  var pedir = false;
  try { pedir = sessionStorage.getItem("gr_pedir_cookies") === "1"; } catch (ePedir) {}
  try {
    var consent = localStorage.getItem("gr_consent");
    var adsActivos = !!(window.ads && window.ads.activo === true);
    if (adsActivos && !pedir && !premiumVigente() && (consent === "si" || (!estricto && consent !== "no"))) document.documentElement.classList.add("ad-ok");
    if (premiumVigente()) document.documentElement.classList.add("ad-off");
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
    if (!p) p = localStorage.getItem("gr_pais_ip") || "";
    if (!p) p = map[tz] || "";
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
