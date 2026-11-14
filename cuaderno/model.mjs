export const FORMAT = 'granja-rentable-cuaderno';
export const VERSION = 1;
export const uid = () => crypto.randomUUID();
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
export const empty = () => ({format:FORMAT, version:VERSION, revision:0, updatedAt:new Date().toISOString(), lots:[], records:[]});
function need(ok, message) { if (!ok) throw new Error(message); }
function text(v, name, max=2000) { need(typeof v==='string' && v.length<=max, `${name}: texto no válido.`); }
function num(v, name, integer=false) { need(typeof v==='number' && Number.isFinite(v) && v>=0 && v<=1e12 && (!integer || Number.isSafeInteger(v)), `${name}: usa un número ${integer?'entero ':''}entre cero y un billón.`); }
export function date(v) { need(typeof v==='string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) && new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v, 'Fecha no válida.'); return v; }
export function validate(input) {
  need(input && input.format===FORMAT && input.version===VERSION, 'Esta copia no tiene un formato o versión compatible.');
  need(Array.isArray(input.lots) && input.lots.length<=1000 && Array.isArray(input.records) && input.records.length<=50000, 'La copia supera los límites o está incompleta.');
  const s=empty(), ids=new Set(), daily=new Set();
  if(typeof input.updatedAt==='string' && Number.isFinite(Date.parse(input.updatedAt))) s.updatedAt=input.updatedAt;
  const id=v=>{text(v,'Identificador',100); need(/^[A-Za-z0-9_-]{1,100}$/.test(v) && !ids.has(v), 'Hay identificadores no válidos o repetidos.'); ids.add(v); return v;};
  s.revision=Number.isSafeInteger(input.revision) && input.revision>=0 ? input.revision : 0;
  let photoBytes=0;
  s.lots=input.lots.map(l=>{
    need(l && typeof l==='object','Lote no válido.');
    const n={id:id(l.id)};
    text(l.name,'Nombre',100); need(l.name.trim().length>0,'Escribe un nombre para el lote.'); n.name=l.name.trim();
    text(l.breed,'Línea o raza',100); n.breed=l.breed;
    n.birth=date(l.birth); n.start=date(l.start); need(n.birth<=n.start,'El nacimiento debe ser anterior o igual a la entrada.');
    need(n.start<=today(),'La entrada del lote no puede ser futura.');
    num(l.initial,'Aves iniciales',true); need(l.initial>0,'El lote debe empezar con al menos un ave.'); n.initial=l.initial;
    need(typeof l.currency==='string' && /^[A-Z]{3}$/.test(l.currency),'Moneda no válida.'); n.currency=l.currency;
    need(['active','archived'].includes(l.status),'Estado del lote no válido.'); n.status=l.status;
    return n;
  });
  const lotMap=new Map(s.lots.map(l=>[l.id,l]));
  s.records=input.records.map(r=>{
    need(r && typeof r==='object','Anotación no válida.');
    const n={id:id(r.id),lot:r.lot,type:r.type,date:date(r.date)};
    need(lotMap.has(n.lot),'Una anotación no tiene un lote válido.');
    need(n.date>=lotMap.get(n.lot).start,'La anotación no puede ser anterior a la entrada del lote.');
    if(!['task','health'].includes(n.type)) need(n.date<=today(),'La anotación no puede tener una fecha futura.');
    text(r.notes??'','Notas'); n.notes=r.notes??'';
    switch(n.type) {
      case 'daily': {
        const k=n.lot+'|'+n.date; need(!daily.has(k),'Ya existe una hoja diaria para esa fecha. Edita la existente.'); daily.add(k);
        for(const key of ['feed','water','temperature','humidity','ammonia']) {
          const v=r[key]; if(v===null) {n[key]=null; continue;}
          if(key==='temperature') need(typeof v==='number' && Number.isFinite(v) && v>=-60 && v<=70,'Temperatura fuera de rango.');
          else num(v,key); if(key==='humidity' && v!==null) need(v<=100,'Humedad: máximo 100 %.'); n[key]=v;
        } break;
      }
      case 'movement':
        need(['entry','death','discard','sale','other'].includes(r.kind),'Movimiento no válido.'); n.kind=r.kind; num(r.count,'Cantidad',true); need(r.count>0,'Indica al menos un ave.'); n.count=r.count; break;
      case 'weight':
        need(['individual','group'].includes(r.method),'Método de pesada no válido.'); n.method=r.method;
        if(n.method==='individual') {
          need(Array.isArray(r.weights) && r.weights.length>0 && r.weights.length<=5000,'Introduce entre 1 y 5000 pesos individuales.');
          n.weights=r.weights.map(v=>{num(v,'Peso');need(v>0,'El peso debe ser mayor que cero.');return v;});
        } else { num(r.count,'Aves pesadas',true); need(r.count>0,'Indica cuántas aves has pesado.'); num(r.total,'Peso bruto'); num(r.tare,'Tara'); need(r.total>r.tare,'El peso bruto debe superar la tara.'); n.count=r.count; n.total=r.total; n.tare=r.tare; } break;
      case 'health':
        text(r.product,'Producto',150); need(r.product.trim().length>0,'Indica el producto o vacuna.'); n.product=r.product;
        n.end=date(r.end); need(n.end>=n.date,'El final no puede ser anterior al inicio.');
        if(r.withdrawal===null) n.withdrawal=null; else {num(r.withdrawal,'Plazo de espera',true);need(r.withdrawal<=36500,'Plazo de espera fuera de rango.');n.withdrawal=r.withdrawal;}
        text(r.source??'','Procedencia del plazo',200); n.source=r.source??''; if(n.withdrawal!==null) need(n.source.trim().length>0,'Indica de dónde procede el plazo de espera.'); break;
      case 'task': text(r.title,'Tarea',150); need(r.title.trim().length>0,'Escribe la tarea.'); n.title=r.title; need(typeof r.done==='boolean','Estado de tarea no válido.'); n.done=r.done; break;
      case 'money': need(['income','expense'].includes(r.kind),'Tipo de movimiento económico no válido.'); n.kind=r.kind; text(r.concept,'Concepto',150); need(r.concept.trim().length>0,'Escribe un concepto.'); n.concept=r.concept; num(r.amount,'Importe'); n.amount=r.amount; break;
      case 'note':
        if(r.photo) {need(typeof r.photo==='string' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(r.photo) && r.photo.length<=1000000,'Foto no válida o demasiado grande.'); n.photo=r.photo; photoBytes+=r.photo.length;}
        need(n.notes.trim().length>0 || n.photo,'Añade una nota o una foto.'); break;
      default: throw new Error('Tipo de anotación no compatible.');
    }
    return n;
  });
  need(photoBytes<=20*1024*1024,'Las fotos superan el límite de 20 MB del cuaderno. Exporta y reduce las imágenes.');
  for(const l of s.lots) {
    let balance=l.initial;
    const moves=s.records.filter(r=>r.lot===l.id && r.type==='movement').sort((a,b)=>a.date.localeCompare(b.date) || (a.kind==='entry'?-1:0)-(b.kind==='entry'?-1:0));
    for(const r of moves) {balance+=r.kind==='entry'?r.count:-r.count;need(balance>=0,`Las salidas superan las aves disponibles en ${l.name}, el ${r.date}.`);}
  }
  need(new Blob([JSON.stringify(s)]).size<=32*1024*1024,'El cuaderno supera los 32 MB de una copia completa. Reduce las fotos o archiva datos fuera del cuaderno antes de seguir.');
  return s;
}
export function weightStats(r) {
  if(r.method==='group') return {mean:(r.total-r.tare)/r.count,count:r.count,cv:null};
  const mean=r.weights.reduce((a,b)=>a+b,0)/r.weights.length;
  return {mean,count:r.weights.length,cv:r.weights.length<2?null:100*Math.sqrt(r.weights.reduce((a,b)=>a+(b-mean)**2,0)/(r.weights.length-1))/mean};
}
export function summary(s,l) {
  const rs=s.records.filter(r=>r.lot===l.id), moves=rs.filter(r=>r.type==='movement');
  const deaths=moves.filter(r=>r.kind==='death').reduce((a,r)=>a+r.count,0);
  const birds=l.initial+moves.reduce((a,r)=>a+(r.kind==='entry'?r.count:-r.count),0);
  const total=k=>{const vals=rs.filter(r=>r.type==='daily' && r[k]!==null);return vals.length?vals.reduce((a,r)=>a+r[k],0):null;};
  const money=rs.filter(r=>r.type==='money');
  return {birds,deaths,mortality:moves.some(r=>r.kind==='entry')?null:deaths/l.initial*100,feed:total('feed'),water:total('water'),income:money.filter(r=>r.kind==='income').reduce((a,r)=>a+r.amount,0),expense:money.filter(r=>r.kind==='expense').reduce((a,r)=>a+r.amount,0)};
}
export function toCSV(rows) {
  const cell=v=> {let t=String(v??'');if(/^[\s]*[=+@-]/.test(t))t="'"+t;return '"'+t.replaceAll('"','""')+'"';};
  return '\ufeff'+rows.map(row=>row.map(cell).join(';')).join('\r\n');
}
