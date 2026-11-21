const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=p=>fs.readFileSync(path.join(root,p),'utf8');

test('panel de cuidados incluye indicadores y reposición directa',()=>{
 const html=source('simulador-granja.html'),ui=source('js/granja-ui.js');
 assert.match(html,/id="care-alert"/);
 assert.match(html,/data-action="restockEssentials"/);
 assert.match(ui,/neededYoung=/);
 assert.match(ui,/M\.equipmentAccess\(state\)/);
 assert.match(ui,/care-alert-low/);
});

test('el comedero activa la reposición del motor desde el corral',()=>{
 const scene=source('js/granja-escena.js');
 const motor=source('js/granja-motor.js');
 assert.match(scene,/station\('feeder-0','scene-feeder','Reponer comida y agua','restockEssentials'/);
 assert.match(motor,/if\(type==='restockEssentials'\)/);
 assert.match(scene,/options\.onAction\(action,value\)/);
});

test('UI de defensa y niveles no redeclara owner ni permite pulsar sin amenaza',()=>{
 const ui=source('js/granja-ui.js');
 const scene=source('js/granja-escena.js');
 assert.equal((ui.match(/const owner=state\.owner\|\|/g)||[]).length,1);
 assert.match(ui,/owner-attack'\)\.disabled=bankrupt\|\|!state\.pending/);
 assert.match(scene,/activeDefense\.disabled=!state\.pending/);
});

test('las compras indisponibles se desactivan y conservan el precio real del motor',()=>{
 const ui=source('js/granja-ui.js');
 assert.match(ui,/data-action="install"/);
 assert.match(ui,/state\.facilities\[kind\]>=8/);
 assert.match(ui,/M\.prices\[kind\]/);
 assert.match(ui,/replenishCost/);
});

test('existe aviso de escasez accesible y estilo reducido en móvil',()=>{
 const html=source('simulador-granja.html'),css=source('css/simulador.css');
 assert.match(html,/id="care-alert"[^>]*role="status"/);
 assert.match(css,/\.care-alert-low/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
