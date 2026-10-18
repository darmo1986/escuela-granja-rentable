/** Estado de acceso a partir de una suscripción de Stripe. Sin red y sin claves. */

var UE = {
  AT: 1, BE: 1, BG: 1, HR: 1, CY: 1, CZ: 1, DK: 1, EE: 1, FI: 1, FR: 1,
  DE: 1, GR: 1, HU: 1, IE: 1, IT: 1, LV: 1, LT: 1, LU: 1, MT: 1, NL: 1,
  PL: 1, PT: 1, RO: 1, SK: 1, SI: 1, ES: 1, SE: 1
};

export function finPeriodo(sub) {
  if (!sub || typeof sub !== "object") return null;
  if (Number.isFinite(sub.current_period_end)) return sub.current_period_end;
  var item = sub.items && sub.items.data && sub.items.data[0];
  if (item && Number.isFinite(item.current_period_end)) return item.current_period_end;
  if (Number.isFinite(sub.trial_end)) return sub.trial_end;
  return null;
}

export function planDe(sub) {
  var item = sub && sub.items && sub.items.data && sub.items.data[0];
  var price = item && item.price;
  var interval = price && price.recurring && price.recurring.interval;
  if (interval === "year") return "anual";
  if (interval === "month") return "mensual";
  return null;
}

export function monedaDe(sub) {
  var item = sub && sub.items && sub.items.data && sub.items.data[0];
  var c = item && item.price && item.price.currency;
  if (c === "usd" || c === "eur") return c;
  return null;
}

export function idStripe(valor) {
  if (typeof valor === "string" && valor) return valor;
  if (valor && typeof valor === "object" && typeof valor.id === "string" && valor.id) return valor.id;
  return "";
}

/** Factura de la API actual: la suscripción ya no está en la raíz. */
export function suscripcionDeFactura(factura) {
  if (!factura || typeof factura !== "object") return "";
  var directa = idStripe(factura.subscription);
  if (directa) return directa;
  var padre = factura.parent;
  if (padre && padre.subscription_details) {
    var anidada = idStripe(padre.subscription_details.subscription);
    if (anidada) return anidada;
  }
  var lineas = factura.lines && factura.lines.data;
  if (Array.isArray(lineas)) {
    for (var i = 0; i < lineas.length; i++) {
      var linea = lineas[i] && lineas[i].parent;
      if (linea && linea.subscription_item_details) {
        var deLinea = idStripe(linea.subscription_item_details.subscription);
        if (deLinea) return deLinea;
      }
    }
  }
  return "";
}

/**
 * active y trialing dan acceso solo si hay fecha de fin y esa fecha no pasó.
 * Sin fecha no hay Premium: premium_hasta no puede quedar vacío.
 * past_due, unpaid, canceled e incomplete no dan acceso.
 */
export function decidirAcceso(sub, ahoraMs) {
  var status = String((sub && sub.status) || "");
  var fin = finPeriodo(sub);
  var ahora = Number.isFinite(ahoraMs) ? ahoraMs : Date.now();
  var hasta = fin ? new Date(fin * 1000).toISOString() : null;
  var vivo = status === "active" || status === "trialing";
  var sigue = fin != null && fin * 1000 + 120000 >= ahora;
  return {
    premium: vivo && sigue,
    premium_hasta: hasta,
    estado: status || "incomplete",
    plan: planDe(sub),
    moneda: monedaDe(sub)
  };
}

/** Varias suscripciones de la misma persona. Premium si alguna sigue viva, hasta la que acabe más tarde. */
export function resumirPremium(filas, ahoraMs) {
  var ahora = Number.isFinite(ahoraMs) ? ahoraMs : Date.now();
  var mejor = "";
  (filas || []).forEach(function (fila) {
    var estado = String((fila && fila.estado) || "");
    var vivo = estado === "active" || estado === "trialing";
    var t = fila && fila.vence ? Date.parse(fila.vence) : NaN;
    if (!vivo || !Number.isFinite(t) || t <= ahora) return;
    if (!mejor || t > Date.parse(mejor)) mejor = fila.vence;
  });
  if (!mejor) return { premium: false, premium_hasta: null };
  return { premium: true, premium_hasta: mejor };
}

/** Solo el user_id que puso el servidor. El client_reference_id del navegador no cuenta. */
export function usuarioAutorizado(meta) {
  if (!meta || typeof meta !== "object") return "";
  return esUuid(meta.user_id) ? String(meta.user_id) : "";
}

export function usuariosCompatibles(a, b) {
  if (a && b && a !== b) return false;
  return true;
}

/** La inserción devolvió fila: el evento no se había visto. Un array vacío es un duplicado. */
export function eventoNuevo(filas) {
  return Array.isArray(filas) && filas.length > 0;
}

export function esUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ""));
}

/**
 * Precio que se enseña. La Unión Europea, en euros.
 * Si la geolocalización falla, o el país es solo el de México por defecto, euros con IVA.
 * Una elección explícita de otro país cambia el anuncio, no el impuesto del cobro.
 */
export function monedaAnunciada(pais, origen, geo) {
  var code = String(pais || "").toUpperCase();
  if (UE[code]) return "eur";
  if (origen === "elegido") return "usd";
  if (geo === "ok" && (origen === "inferido" || origen === "geo")) return "usd";
  return "eur";
}

/** Con sesión abierta no se piden anuncios hasta saber si esa cuenta es Premium. */
export function anuncioPermitido(estado) {
  if (!estado || estado.premium || estado.premiumOk) return false;
  if (estado.sesion && !estado.conocido) return false;
  return true;
}
