(function () {
  'use strict';
  const get = id => document.getElementById(id);
  const table = document.querySelector('.hoja-semana table');
  const rows = Array.from(table.tBodies[0].rows);
  const columns = Array.from(table.tHead.rows[0].cells, cell => cell.textContent);
  const fields = columns.slice(1).map((label, i) => {
    const wrap = document.createElement('label');
    wrap.textContent = label;
    const field = document.createElement(i === 5 ? 'select' : 'input');
    if (i < 5) {
      field.type = 'number'; field.min = '0'; field.step = i < 3 ? '1' : 'any';
      field.inputMode = i < 3 ? 'numeric' : 'decimal';
    } else if (i === 5) {
      for (const value of ['', 'Sí', 'No']) field.add(new Option(value || 'Sin registrar', value));
    } else field.maxLength = 300;
    wrap.append(field); get('campos-dia').append(wrap);
    return field;
  });
  const today = new Date();
  const localISO = date => [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
  const dateField = get('fecha-semana'), dayField = get('dia-registro'), lot = get('nombre-lote');
  let monday, record;
  rows.forEach((row,i) => dayField.add(new Option(row.cells[0].textContent, i)));
  function load() {
    const selected = dateField.valueAsDate;
    if (!selected) {dateField.value=monday || localISO(new Date());return;}
    const day = (selected.getUTCDay()+6)%7;
    selected.setUTCDate(selected.getUTCDate()-day);
    monday = selected.toISOString().slice(0,10);
    dayField.value = String(day);
    const empty = () => ({lot:'',days:rows.map(() => fields.map(() => ''))});
    record = empty();
    let status = 'Los datos se guardan en este navegador.';
    try {
      const saved = JSON.parse(localStorage.getItem('gr-puesta-'+monday));
      if (saved && typeof saved.lot === 'string' && Array.isArray(saved.days) && saved.days.length===7 && saved.days.every(row=>Array.isArray(row)&&row.length===7&&row.every(v=>typeof v==='string'))) record=saved;
    } catch {status='Almacenamiento no disponible. Descarga el CSV para conservar la semana.';}
    lot.value=record.lot;get('estado-registro').textContent=status;showDay();render();
  }
  function showDay(){fields.forEach((field,i)=>{field.value=record.days[Number(dayField.value)][i];});}
  function render(){
    rows.forEach((row,d)=>record.days[d].forEach((v,i)=>{row.cells[i+1].textContent=v;}));
    const fmt = n=>n.toLocaleString('es',{maximumFractionDigits:3});
    const total = i=>record.days.reduce((sum,row)=>sum+Number(row[i]||0),0);
    const sunday=new Date(monday+'T00:00:00Z');sunday.setUTCDate(sunday.getUTCDate()+6);
    get('periodo-semana').textContent=(record.lot?record.lot+' · ':'')+'Semana del '+monday+' al '+sunday.toISOString().slice(0,10);
    get('resumen-semana').textContent='Registrado hasta ahora: '+fmt(total(1))+' huevos aprovechables · '+fmt(total(2))+' rotos o no aptos · '+fmt(total(3))+' kg de pienso añadido · '+fmt(total(1)/12)+' docenas aprovechables. Días con anotaciones: '+record.days.filter(row=>row.some(v=>v!=='')).length+' de 7. Agua revisada: '+record.days.filter(row=>row[5]==='Sí').length+' de 7 días.';
  }
  function persist(){
    try {localStorage.setItem('gr-puesta-'+monday,JSON.stringify(record));get('estado-registro').textContent='Semana guardada en este navegador.';}
    catch {get('estado-registro').textContent='No se ha podido guardar. Descarga el CSV antes de salir.';}
    render();
  }
  function moveWeek(offset){
    const date=dateField.valueAsDate;
    date.setUTCDate(date.getUTCDate()+offset);
    dateField.value=date.toISOString().slice(0,10);load();
  }
  get('semana-anterior').onclick=()=>moveWeek(-7);
  get('semana-siguiente').onclick=()=>moveWeek(7);
  get('semana-hoy').onclick=()=>{dateField.value=localISO(new Date());load();};
  fields.forEach((field,i)=>field.addEventListener('input',()=>{
    if(!field.validity.valid){field.reportValidity();return;}
    record.days[Number(dayField.value)][i]=field.value;persist();
  }));
  lot.addEventListener('input',()=>{record.lot=lot.value;persist();});
  dayField.addEventListener('change',showDay);dateField.addEventListener('change',load);
  get('exportar-semana').onclick=()=>{
    const escape=value=>'"'+(/^[\s]*[=+@-]/.test(value)?"'":'')+String(value).replace(/"/g,'""')+'"';
    const data=[['Inicio de semana','Lote',...columns],...record.days.map((values,i)=>[monday,record.lot,rows[i].cells[0].textContent,...values])];
    const csv='\uFEFF'+data.map(row=>row.map(escape).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='registro-puesta-'+monday+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
  };
  dateField.value=localISO(today);load();get('editor-semana').hidden=false;get('lote-blanco').hidden=true;
})();
