const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
function fixture(reduced = false) {
  const timers = new Map(), events = {}, observers = [];
  let sequence = 0;
  function node() {
    const classes = new Set(), attrs = {};
    return {attrs, inert:false, classList:{contains:k=>classes.has(k),add:k=>classes.add(k),toggle(k,on){on?classes.add(k):classes.delete(k);}},
      setAttribute(k,v){attrs[k]=v;},contains(el){return el===this;},focus(){document.activeElement=this;}};
  }
  const slides = Array.from({length:4},node), dots = Array.from({length:4},node);
  slides[0].classList.add('is-active');
  const pause = node(), previous = node(), next = node(), hero = node();
  const document = {hidden:false,activeElement:null,querySelector:()=>hero,addEventListener:(key,fn)=>{events[key]=fn;}};
  hero.querySelectorAll = key => key==='[data-slide]' ? slides : dots;
  hero.querySelector = key => ({'[data-hero-pause]':pause,'[data-hero-prev]':previous,'[data-hero-next]':next})[key];
  hero.matches = () => false;
  hero.addEventListener = (key,fn) => {events[key]=fn;};
  const motion = {matches:reduced,addEventListener(key,fn){this.change=fn;}};
  function IntersectionObserver(callback){this.callback=callback;this.observe=()=>{};observers.push(this);}
  const window = {matchMedia:()=>motion,IntersectionObserver,addEventListener:(key,fn)=>{events[key]=fn;}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../js/hero.js'),'utf8'),{
    window,document,IntersectionObserver,setTimeout(fn){timers.set(++sequence,fn);return sequence;},clearTimeout:id=>timers.delete(id)
  });
  return {slides,dots,pause,next,previous,timers,events,observers,document,motion};
}
let f = fixture();
assert.equal(f.slides[0].inert,false);
assert(f.slides.slice(1).every(s=>s.inert));
assert.equal(f.timers.size,1);
f.observers[0].callback([{isIntersecting:false}]);
assert.equal(f.timers.size,0,'Offscreen carousel must not rotate');
f.observers[0].callback([{isIntersecting:true}]);
assert.equal(f.timers.size,1);
f.document.hidden=true;f.events.visibilitychange();assert.equal(f.timers.size,0);
f.document.hidden=false;f.events.visibilitychange();assert.equal(f.timers.size,1);
f.document.activeElement=f.slides[0];
let prevented=false;
f.events.keydown({key:'ArrowLeft',preventDefault(){prevented=true;}});
assert(prevented);
assert.equal(f.slides[3].inert,false);
assert.equal(f.document.activeElement,f.dots[3],'Focus must leave a slide before it becomes inert');
assert.equal(f.pause.textContent,'Reanudar');
assert.equal(f.timers.size,0,'Keyboard interaction pauses autoplay');
f.pause.onclick();assert.equal(f.timers.size,1);
f.events.keydown({key:'ArrowRight',ctrlKey:true,preventDefault(){throw Error('Modified keys must pass through');}});
assert.equal(f.slides[3].inert,false);
f = fixture(true);assert.equal(f.timers.size,0);assert.equal(f.pause.textContent,'Reanudar');
f.pause.onclick();assert.equal(f.timers.size,1);
f.events['gr-pais']();assert.equal(f.slides[0].inert,false);
console.log('PASS: first slide, inert slides, offscreen pause/resume, hidden tab, keyboard wrap and focus, manual pause, reduced motion and country reset.');
