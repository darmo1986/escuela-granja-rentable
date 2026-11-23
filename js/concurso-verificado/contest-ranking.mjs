export async function loadVerifiedRanking(rpc){
  const {data,error}=await rpc('concurso_verificado_ranking');
  if (error || !data || !['open','closed'].includes(data.status) || !Array.isArray(data.rows)) throw Error('No se pudo cargar el ranking verificado.');
  if (data.status==='closed') return {status:'closed',rows:[]};
  if (typeof data.period!=='string'|| !/^\d{4}-\d{2}-01$/.test(data.period)||data.rows.length>10) throw Error('El ranking no devolvió un periodo válido.');
  const rows=data.rows.map(r=>{
    if(typeof r.alias!=='string'||!/^Jugador [0-9a-f]{12}$/.test(r.alias)||
      !Number.isInteger(r.score)||r.score<0||r.score>100||
      !Number.isInteger(r.rank)||r.rank<1||r.rank>10||
      !Number.isInteger(r.mean_ms)||r.mean_ms<0||r.mean_ms>30000) throw Error('El ranking devolvió una fila no válida.');
    return {alias:r.alias,score:r.score,rank:r.rank,meanMs:r.mean_ms};
  });
  return {status:'open',period:data.period,rows};
}

export function renderVerifiedRanking(root,ranking){
  const doc=root.ownerDocument;
  root.replaceChildren();
  const append=(p,tag,s)=>{const e=doc.createElement(tag);e.textContent=s;p.append(e);return e};
  if(!ranking){append(root,'p','No se pudo cargar el ranking verificado.');return}
  if(ranking.status==='closed'){append(root,'p','El concurso aún no está abierto.');return}
  if(!ranking.rows.length){append(root,'p','Aún no hay marcas verificadas este mes.');return}
  const table=append(root,'table','');table.className='ranking';
  append(table,'caption','Clasificación verificada · '+ranking.period.slice(0,7));
  const thead=append(table,'thead',''), header=append(thead,'tr','');
  for(const label of ['Puesto','Jugador','Aciertos','Tiempo medio'])append(header,'th',label).scope='col';
  const body=append(table,'tbody','');
  for(const r of ranking.rows){
    const row=append(body,'tr','');
    for(const s of [String(r.rank),r.alias,r.score+'/100',(r.meanMs/1000).toFixed(3).replace('.',',')+' s'])append(row,'td',s);
  }
}
