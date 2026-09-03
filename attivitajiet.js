(function () {
  const listEl = document.getElementById('activities-list');
  const archiveEl = document.getElementById('activities-archive');
  const GITHUB_API = 'https://api.github.com/repos/Parrocca/parrocca-msida/contents';
  const PDF_FILE = /^attivita-(\d{4})-(\d{2})-(\d{2})\.pdf$/i;

  const months={"jannar":0,"frar":1,"marzu":2,"april":3,"mejju":4,"ġunju":5,"gunju":5,"lulju":6,"awwissu":7,"settembru":8,"ottubru":9,"novembru":10,"diċembru":11,"dicembru":11};
  function getTextDate(s){let m=String(s||'').toLowerCase().match(/(\d{1,2})\s+(?:ta'|t')?\s*([a-zà-ż]+)\s+(\d{4})/i);return m&&months[m[2]]!==undefined?new Date(+m[3],months[m[2]],+m[1],23,59,59):null}
  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function pdfDate(name){const m=name.match(PDF_FILE);return m?new Date(+m[1],+m[2]-1,+m[3],23,59,59):null}
  function dateLabel(d){return new Intl.DateTimeFormat('mt-MT',{day:'numeric',month:'long',year:'numeric'}).format(d)}

  function parseText(text){return text.split(/\n---\s*\n?/).map(b=>b.trim()).filter(Boolean).map(b=>{let L=b.split(/\r?\n/),g=k=>{let x=L.find(v=>v.toUpperCase().startsWith(k.toUpperCase()+':'));return x?x.slice(x.indexOf(':')+1).trim():''};let data=g('DATA');return {kind:'text',data,hin:g('ĦIN')||g('HIN'),titlu:g('TITLU'),desc:g('DESKRIZZJONI'),d:getTextDate(data)}})}
  function textCard(x){return `<article class="activity-card"><div class="activity-date">${esc(x.data)}${x.hin?' · '+esc(x.hin):''}</div><h2>${esc(x.titlu)}</h2>${x.desc?`<p>${esc(x.desc)}</p>`:''}</article>`}
  function pdfCard(x, preview){const url='./'+encodeURIComponent(x.name);return `<article class="activity-card activity-pdf-card"><div class="activity-date">${esc(dateLabel(x.d))}</div><h2>Attività tal-Parroċċa</h2>${preview?`<p>Id-dettalji tal-attività jidhru hawn taħt.</p><div class="activity-pdf-pages" data-pdf-src="${url}"><div class="activity-pdf-loading">Qed tinfetaħ l-attività…</div></div>`:''}<p><a class="btn btn-primary" href="${url}" target="_blank" rel="noopener">Iftaħ il-PDF f’paġna ġdida</a></p></article>`}

  let pdfJsPromise;
  function getPdfJs(){if(!pdfJsPromise){pdfJsPromise=import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs').then(lib=>{lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';return lib})}return pdfJsPromise}
  async function renderPdf(){const holder=listEl.querySelector('.activity-pdf-pages[data-pdf-src]');if(!holder)return;try{const lib=await getPdfJs();const pdf=await lib.getDocument(holder.dataset.pdfSrc).promise;holder.innerHTML='';for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n),viewport=page.getViewport({scale:1.7}),canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{alpha:false});canvas.width=Math.floor(viewport.width);canvas.height=Math.floor(viewport.height);canvas.className='activity-pdf-canvas';holder.appendChild(canvas);await page.render({canvasContext:ctx,viewport}).promise}}catch(e){console.error(e);holder.innerHTML='<p class="activity-pdf-error">Ma stajniex nuru l-PDF direttament. Uża l-buttuna hawn taħt.</p>'}}

  async function load(){try{
    const [txtRes,apiRes]=await Promise.all([fetch('attivitajiet.txt?ts='+Date.now(),{cache:'no-store'}),fetch(GITHUB_API+'?ts='+Date.now(),{headers:{Accept:'application/vnd.github+json'},cache:'no-store'})]);
    const textItems=txtRes.ok?parseText(await txtRes.text()):[];
    const files=apiRes.ok?(await apiRes.json()).filter(x=>x.type==='file'&&PDF_FILE.test(x.name)).map(x=>({kind:'pdf',name:x.name,d:pdfDate(x.name)})):[];
    let today=new Date();today.setHours(0,0,0,0);
    const all=[...textItems,...files];
    const future=all.filter(x=>!x.d||x.d>=today).sort((a,b)=>(a.d||new Date(8640000000000000))-(b.d||new Date(8640000000000000)));
    const past=all.filter(x=>x.d&&x.d<today).sort((a,b)=>b.d-a.d);
    if(!future.length) listEl.innerHTML='<article class="activity-card"><h2>Għad m’hemmx attivitajiet imħabbra.</h2></article>';
    else listEl.innerHTML=future.map((x,i)=>x.kind==='pdf'?pdfCard(x,i===0):textCard(x)).join('');
    if(future[0]?.kind==='pdf') await renderPdf();
    archiveEl.innerHTML=past.length?past.map(x=>x.kind==='pdf'?`<details class="activity-archive-item"><summary>${esc(dateLabel(x.d))} — Attività tal-Parroċċa (PDF)</summary><div>${pdfCard(x,false)}</div></details>`:`<details class="activity-archive-item"><summary>${esc(x.data)} — ${esc(x.titlu)}</summary><div>${x.hin?`<p><strong>Ħin:</strong> ${esc(x.hin)}</p>`:''}${x.desc?`<p>${esc(x.desc)}</p>`:''}</div></details>`).join(''):"<p>Għad m'hemmx attivitajiet fl-arkivju.</p>";
  }catch(e){console.error(e);listEl.innerHTML='<article class="activity-card"><h2>Ma rnexxilniex nuru l-attivitajiet.</h2><p>Erġa’ pprova ftit ieħor.</p></article>'}}
  document.addEventListener('DOMContentLoaded',load);
})();
