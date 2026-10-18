/** Estado de acceso a partir de una suscripción de Stripe. Sin red y sin claves. */

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

/**
 * active y trialing dan acceso hasta el fin del periodo (o de la prueba).
 * past_due, unpaid, canceled e incomplete no dan acceso: el periodo pagado ya terminó
 * cuando Stripe deja la suscripción en esos estados.
 * Un active con la fecha ya vencida tampoco da acceso.
 */
export function decidirAcceso(sub, ahoraMs) {
  var status = String((sub && sub.status) || "");
  var fin = finPeriodo(sub);
  var ahora = Number.isFinite(ahoraMs) ? ahoraMs : Date.now();
  var hasta = fin ? new Date(fin * 1000).toISOString() : null;
  var vivo = status === "active" || status === "trialing";
  var sigue = fin == null || fin * 1000 + 120000 >= ahora;
  return {
    premium: vivo && sigue,
    premium_hasta: hasta,
    estado: status || "incomplete",
    plan: planDe(sub),
    moneda: monedaDe(sub)
  };
}

export function esUuid(s) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(s || ""));
}
