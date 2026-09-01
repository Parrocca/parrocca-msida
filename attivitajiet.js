fetch('attivitajiet.txt?ts='+Date.now()).then(r=>r.text()).then(text=>{
const box=document.getElementById('activities-list');
const items=text.split(/\n---\s*\n?/).map(x=>x.trim()).filter(Boolean);
if(!items.length){box.innerHTML='<article class="activity-card"><h2>Għad m’hemmx attivitajiet imħabbra.</h2></article>';return;}
box.innerHTML=items.map(item=>{
const lines=item.split(/\r?\n/);
const get=k=>{const l=lines.find(x=>x.toUpperCase().startsWith(k.toUpperCase()+':'));return l?l.slice(l.indexOf(':')+1).trim():''};
const d=get('DATA'),h=get('ĦIN'),t=get('TITLU'),x=get('DESKRIZZJONI');
return `<article class="activity-card"><div class="activity-date">${d}${h?' · '+h:''}</div><h2>${t||'Attività'}</h2>${x?`<p>${x}</p>`:''}</article>`;
}).join('');
}).catch(()=>document.getElementById('activities-list').innerHTML='<p>Ma stajniex nuru l-attivitajiet bħalissa.</p>');