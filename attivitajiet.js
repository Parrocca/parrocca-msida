
const months={"jannar":0,"frar":1,"marzu":2,"april":3,"mejju":4,"ġunju":5,"gunju":5,"lulju":6,"awwissu":7,"settembru":8,"ottubru":9,"novembru":10,"diċembru":11,"dicembru":11};
function getDate(s){let m=s.toLowerCase().match(/(\d{1,2})\s+(?:ta'|t')?\s*([a-zà-ż]+)\s+(\d{4})/i);return m&&months[m[2]]!==undefined?new Date(+m[3],months[m[2]],+m[1],23,59,59):null}
function esc(s){return (s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
fetch('attivitajiet.txt?ts='+Date.now()).then(r=>r.text()).then(text=>{
 const items=text.split(/\n---\s*\n?/).map(b=>b.trim()).filter(Boolean).map(b=>{
  let L=b.split(/\r?\n/),g=k=>{let x=L.find(v=>v.toUpperCase().startsWith(k.toUpperCase()+':'));return x?x.slice(x.indexOf(':')+1).trim():''};
  let data=g('DATA'); return {data,hin:g('ĦIN')||g('HIN'),titlu:g('TITLU'),desc:g('DESKRIZZJONI'),d:getDate(data)}
 });
 let today=new Date();today.setHours(0,0,0,0);
 let future=items.filter(x=>!x.d||x.d>=today).sort((a,b)=>(a.d||Infinity)-(b.d||Infinity));
 let past=items.filter(x=>x.d&&x.d<today).sort((a,b)=>b.d-a.d);
 let card=x=>`<article class="activity-card"><div class="activity-date">${esc(x.data)}${x.hin?' · '+esc(x.hin):''}</div><h2>${esc(x.titlu)}</h2>${x.desc?`<p>${esc(x.desc)}</p>`:''}</article>`;
 document.getElementById('activities-list').innerHTML=future.length?future.map(card).join(''):'<article class="activity-card"><h2>Għad m’hemmx attivitajiet imħabbra.</h2></article>';
 document.getElementById('activities-archive').innerHTML=past.length?past.map(x=>`<details class="activity-archive-item"><summary>${esc(x.data)} — ${esc(x.titlu)}</summary><div>${x.hin?`<p><strong>Ħin:</strong> ${esc(x.hin)}</p>`:''}${x.desc?`<p>${esc(x.desc)}</p>`:''}</div></details>`).join(''):"<p>Għad m'hemmx attivitajiet fl-arkivju.</p>";
});
