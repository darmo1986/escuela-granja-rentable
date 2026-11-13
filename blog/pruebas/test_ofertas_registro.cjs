const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
class Element {
  constructor() {
    this.dataset = {};
    this.attrs = {};
    this.style = {};
    this.children = [];
    this.events = {};
    this.classList = {add() {}};
  }
  append(...children) {for (const child of children) {child.parent = this;this.children.push(child);}}
  replaceChildren(...children) {this.children = [];this.append(...children);}
  setAttribute(name, value) {this.attrs[name] = value;}
  getAttribute(name) {return name === 'data-banner' ? this.dataset.banner : this.attrs[name] || null;}
  addEventListener(name, handler) {this.events[name] = handler;}
  matches() {return false;}
  querySelector(selector) {
    if (selector === 'a[href]') return this.children.find(child => child.href);
    return this.controls?.[selector] || null;
  }
  closest(selector) {
    if (selector === '[aria-hidden="true"], [inert]') {
      return this.attrs['aria-hidden'] === 'true' || this.inert ? this : this.parent?.closest(selector) || null;
    }
    if (selector === 'a[href]') return this.href ? this : this.parent?.closest(selector) || null;
    if (selector === '[data-banner]') return this.dataset.banner ? this : this.parent?.closest(selector) || null;
  }
}
function fixture(reducedMotion) {
  const panel = new Element(), items = new Element();
  panel.dataset.ofertas = JSON.stringify(['uno','dos','tres'].map(id => ({id,tipo:'ebook',href:'ebooks/#'+id,imagen:'foto.jpg',alt:'Foto',titulo:id,descripcion:'Guía',precio:'3 USD'})));
  const controls = Object.fromEntries(['[data-promo-items]','[data-promo-controls]','[data-promo-pause]','[data-promo-prev]','[data-promo-next]','[data-promo-status]'].map(key => [key,key === '[data-promo-items]' ? items : new Element()]));
  panel.controls = controls;
  const events = {}, observers = [], sent = [], timers = new Set();
  const motion = {matches: reducedMotion, addEventListener(name, handler) {this.change = handler;}};
  const document = {
    hidden:false,referrer:'https://www.youtube.com/watch?v=example',
    querySelectorAll(selector) {return selector === '[data-promo-carousel]' ? [panel] : items.children;},
    createElement() {return new Element();},
    addEventListener(name, handler) {(events[name] ||= []).push(handler);},
    dispatchEvent(event) {for (const handler of events[event.type] || []) handler(event);}
  };
  function IntersectionObserver(callback) {
    this.callback = callback;
    this.observe = () => {};
    this.unobserve = () => {};
    observers.push(this);
  }
  const context = {
    document,window:{GR:{formEndpoint:'https://script.google.com/macros/s/test/exec'},matchMedia:()=>motion,IntersectionObserver},
    location:{href:'https://granjarentable.com/',pathname:'/'},
    Event,URL,URLSearchParams,Blob,Set,Date,IntersectionObserver,
    navigator:{sendBeacon(url,body) {sent.push({url,body});return true;}},
    fetch() {throw Error('No external requests expected');},
    setTimeout(handler) {timers.add(handler);return handler;},
    clearTimeout(handler) {timers.delete(handler);}
  };
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/ofertas.js'),'utf8'),context);
  vm.runInNewContext(fs.readFileSync(path.join(root,'js/registro-banners.js'),'utf8'),context);
  return {panel,items,controls,document,observers,sent,timers,motion};
}
(async () => {
  const f = fixture(true), pause = f.controls['[data-promo-pause]'];
  assert.equal(pause.textContent,'Reanudar');
  assert.equal(pause.attrs['aria-pressed'],'true');
  assert.equal(f.timers.size,0);
  pause.onclick();
  assert.equal(pause.textContent,'Pausar');
  assert.equal(f.timers.size,1);
  pause.onclick();
  assert.equal(f.timers.size,0);
  const cards = f.items.children;
  const observed = (card,ratio=1) => ({target:card,isIntersecting:ratio>0,intersectionRatio:ratio});
  f.observers[1].callback(cards.map(card=>observed(card)));
  assert.equal(f.sent.length,1,'Only the displayed card counts');
  f.controls['[data-promo-next]'].onclick();
  assert.equal(f.sent.length,2,'Rotation counts the newly displayed card');
  f.controls['[data-promo-prev]'].onclick();
  assert.equal(f.sent.length,2,'An already counted card is not counted again');
  f.observers[1].callback([observed(cards[2],0.2)]);
  f.controls['[data-promo-next]'].onclick();
  f.controls['[data-promo-next]'].onclick();
  assert.equal(f.sent.length,2,'A card below the visibility threshold does not count');
  f.observers[1].callback([observed(cards[2],0.7)]);
  assert.equal(f.sent.length,3);
  const bodies = await Promise.all(f.sent.map(async entry => new URLSearchParams(await entry.body.text())));
  assert.deepEqual(bodies.map(body=>body.get('banner')),['uno','dos','tres']);
  assert(bodies.every(body=>body.get('evento') === 'impresion'));
  const auto = fixture(false);
  assert.equal(auto.controls['[data-promo-pause]'].textContent,'Pausar');
  auto.motion.matches = true;auto.motion.change();
  assert.equal(auto.controls['[data-promo-pause]'].textContent,'Reanudar');
  assert.equal(auto.timers.size,0);
  console.log('OK: reduced motion, pause/resume, hidden cards, rotation, half visibility and no repeated impressions.');
})().catch(error=>{console.error(error);process.exitCode=1;});
