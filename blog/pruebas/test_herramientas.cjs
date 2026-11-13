const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'../..');
const src=name=>fs.readFileSync(path.join(root,'js',name),'utf8');
const w={};
vm.runInNewContext(src('lista.js'),{window:w,Date,Number,TextEncoder});
const dates=w.GR_lista;
assert.equal(dates.addDays('2024-02-28',1),'2024-02-29');
assert.equal(dates.addDays('2024-02-29',1),'2024-03-01');
assert.equal(dates.addDays('2026-12-20',21),'2027-01-10');
assert.equal(dates.addDays('2026-03-28',2),'2026-03-30');
for(const bad of ['2026-02-30','2025-02-29','2026-13-01','2026-00-10','2026-11-00','2026-11-31','26-11-13','2026-11-13\n','',null,{}]){
 assert.equal(dates.addDays(bad,21),'');assert.equal(dates.fechaLarga(bad),'');assert.equal(dates.ics(bad),'');
}
assert.equal(dates.addDays('2026-11-13',NaN),'');assert.equal(dates.addDays('2026-11-13',1.5),'');
assert.equal(dates.addDays('9999-12-31',1),'');
assert.equal(dates.ics('2026-11-13','desconocida'),'');
const ids=new Set();
for(const [species,finish] of Object.entries({gallina:'20261204',codorniz:'20261130',pato:'20261211',pavo:'20261211'})){
 const ics=dates.ics('2026-11-13',species),lines=ics.split('\r\n');
 assert.equal(lines.filter(x=>x==='BEGIN:VEVENT').length,2);
 assert.equal(lines.filter(x=>/^DTSTAMP:\d{8}T\d{6}Z$/.test(x)).length,2);
 assert(ics.includes('DTSTART;VALUE=DATE:'+finish));
 assert(ics.includes('DTEND;VALUE=DATE:20261114'));
 assert(ics.endsWith('END:VCALENDAR\r\n'));
 for(const line of lines)assert(Buffer.byteLength(line,'utf8')<=75);
 const unfolded=ics.replace(/\r\n /g,'');assert(unfolded.includes('No es una garantía de nacimiento.'));
 for(const id of unfolded.match(/^UID:.+$/gm)){assert(!ids.has(id));ids.add(id);}
}
const cwindow={GR_lista:dates};
vm.runInNewContext(src('calculadoras.js'),{window:cwindow,document:{getElementById:()=>null},Number,isFinite,URL,Blob});
const c=cwindow.GR_calc;
assert(c.espacio('ponedora_patio',2.5).error);assert(c.espacio('engorde',10,NaN).error);
assert(c.espacio('engorde',Infinity,2).error);assert(c.espacio('engorde',10,2.5).text.includes('0,83'));
assert(c.alimento(1,12,24,0).text.includes('6,00'));
assert(c.alimento(1,12,NaN,4).text.includes('3,00'));
for(const args of [[-1,12,24,0],[Infinity,12,24,0],[1,12,1.5,0],[1,12,0,0],[1,12,2,-1],[1e308,1e308,2,0]])assert(c.alimento(...args).error);
assert(c.sacos(10,20,19.99,40,25).text.includes('0,49975'));
assert(c.sacos(10,20,19.99,40,25).text.includes('saco B sale más barato'));
assert(c.sacos(0.3,3,0.1,1,0).text.includes('Salen igual'));
assert(c.sacos(10,0,20,40,25).error);assert(c.sacos(10,20,18,40,-1).error);
assert(c.eclosion('2025-02-29','gallina').error);assert(c.eclosion('2026-11-13','codorniz').text.includes('30 de noviembre de 2026'));
console.log('OK: fechas reales, bisiestos, cambio de año, calendario de cuatro especies con DTSTAMP y UTF-8, números inválidos, precio unitario y empate decimal.');
