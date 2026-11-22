(() => {
  'use strict';

  const shop = 'https://granjarentable-shop.fourthwall.com';
  const namespace = 'http://base.google.com/ns/1.0';
  const cards = document.querySelectorAll('.merch-grid .merch-card');
  const colors = { Black: 'Negro', White: 'Blanco', Sand: 'Arena', Natural: 'Natural', Clear: 'Transparente' };
  const number = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  function readVariant(item) {
    const field = (name) => item.getElementsByTagNameNS(namespace, name)[0]?.textContent.trim() || '';
    const id = field('id');
    const price = /^(\d+(?:\.\d{1,2})?) ([A-Z]{3})$/.exec(field('price'));
    if (!price || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(id)) return null;
    return {
      id, link: field('link'), color: field('color'), size: field('size'), image: field('image_link'),
      amount: Number(price[1]), currency: price[2], available: field('availability') === 'in stock'
    };
  }

  function showPrice(element, variants) {
    const amounts = variants.map((v) => v.amount);
    const low = Math.min(...amounts);
    const from = low < Math.max(...amounts) ? 'Desde ' : '';
    element.textContent = from + number.format(low) + ' ' + variants[0].currency;
  }

  function selectField(form, name) {
    const label = document.createElement('label');
    const select = document.createElement('select');
    label.append(name, select);
    form.append(label);
    return select;
  }

  function labelSize(value, kind) {
    if (kind === 'Capacidad') {
      const ounces = /^(\d+(?:\.\d+)?)\s*oz$/i.exec(value);
      if (ounces) return ounces[1] + ' oz (≈' + Math.round(Number(ounces[1]) * 29.57353) + ' ml)';
    }
    if (kind === 'Medidas') {
      const sides = /^(\d+(?:\.\d+)?)"\s*x\s*(\d+(?:\.\d+)?)"$/i.exec(value);
      if (sides) return sides[1].replace('.', ',') + ' × ' + sides[2].replace('.', ',') + ' pulgadas';
    }
    return value;
  }

  function showImage(card, variant) {
    const src = variant.image;
    if (!src.startsWith('https://imgproxy.fourthwall.dev/')) return;
    const img = card.querySelector('img');
    if (img.src === src) return;
    const fallback = img.dataset.original || img.getAttribute('src');
    img.dataset.original = fallback;
    img.onerror = () => { img.onerror = null; img.src = fallback; };
    img.src = src;
  }

  function purchase(card, variants) {
    const info = card.querySelector('.merch-info');
    const details = info.querySelector('a');
    const price = info.querySelector('p');
    const available = variants.filter((v) => v.available);
    if (!available.length) {
      price.textContent = 'Agotado';
      details.textContent = 'Ver disponibilidad';
      details.removeAttribute('aria-label');
      return;
    }
    const form = document.createElement('form');
    form.className = 'merch-compra';
    form.method = 'get';
    form.action = shop + '/cart/checkout';
    form.setAttribute('aria-label', 'Comprar ' + info.querySelector('h3').textContent);
    price.setAttribute('aria-live', 'polite');
    showPrice(price, available);
    if (variants.length === 1) {
      const item = document.createElement('input');
      item.type = 'hidden';
      item.name = 'products';
      item.value = available[0].id;
      form.append(item);
    } else {
      const kind = card.closest('section').dataset.opcion || 'Talla';
      const prompts = { Talla: 'Elige tu talla', Capacidad: 'Elige la capacidad', Medidas: 'Elige las medidas' };
      const availableColors = [...new Set(available.map((v) => v.color))];
      const color = availableColors.length > 1 ? selectField(form, 'Color') : null;
      if (color) {
        for (const value of availableColors) color.add(new Option(colors[value] || value, value));
      }
      const size = selectField(form, kind);
      size.name = 'products';
      size.required = true;
      function updateSizes() {
        const group = variants.filter((v) => v.color === (color?.value ?? availableColors[0]));
        const inStock = group.filter((v) => v.available);
        showPrice(price, inStock);
        const placeholder = new Option(prompts[kind], '', true, true);
        placeholder.disabled = true;
        size.replaceChildren(placeholder);
        for (const variant of group) {
          const option = new Option(labelSize(variant.size, kind) + (variant.available ? '' : ' · Agotada'), variant.id);
          option.disabled = !variant.available;
          size.add(option);
        }
        return inStock[0];
      }
      updateSizes();
      color?.addEventListener('change', () => showImage(card, updateSizes()));
      size.addEventListener('change', () => {
        const variant = available.find((v) => v.id === size.value);
        if (variant) {
          showPrice(price, [variant]);
          showImage(card, variant);
        }
      });
    }
    const buy = document.createElement('button');
    buy.type = 'submit';
    buy.className = 'btn';
    buy.textContent = 'Comprar ahora';
    form.append(buy);
    details.before(form);
    details.className = 'merch-detalles';
    details.textContent = 'Ver fotos y detalles';
    details.setAttribute('aria-label', 'Ver fotos y detalles de ' + info.querySelector('h3').textContent);
  }

  async function loadStock() {
    const response = await fetch(shop + '/.well-known/merchant-center/rss.xml', { credentials: 'omit' });
    if (!response.ok) return;
    const feed = new DOMParser().parseFromString(await response.text(), 'application/xml');
    const byProduct = new Map();
    for (const item of feed.querySelectorAll('item')) {
      const variant = readVariant(item);
      if (!variant) continue;
      if (!byProduct.has(variant.link)) byProduct.set(variant.link, []);
      byProduct.get(variant.link).push(variant);
    }
    for (const card of cards) {
      const variants = byProduct.get(card.querySelector('.merch-info a').href);
      if (variants?.length) purchase(card, variants);
    }
  }

  // Si el inventario no responde, cada ficha conserva su enlace de compra de Fourthwall.
  if (cards.length) loadStock().catch(() => {});
})();
