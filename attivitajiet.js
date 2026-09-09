(function () {
  const listEl = document.getElementById('activities-list');
  const archiveEl = document.getElementById('activities-archive');
  const GITHUB_API = 'https://api.github.com/repos/Parrocca/parrocca-msida/contents';
  const PDF_FILE = /^attivita-(\d{4})-(\d{2})-(\d{2})\.pdf$/i;

  const months = {"jannar":0,"frar":1,"marzu":2,"april":3,"mejju":4,"ġunju":5,"gunju":5,"lulju":6,"awwissu":7,"settembru":8,"ottubru":9,"novembru":10,"diċembru":11,"dicembru":11};

  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function getTextDate(s){const m=String(s||'').toLowerCase().match(/(\d{1,2})\s+(?:ta'|t')?\s*([a-zà-ż]+)\s+(\d{4})/i);return m&&months[m[2]]!==undefined?new Date(+m[3],months[m[2]],+m[1]):null;}
  function pdfDate(name){const m=name.match(PDF_FILE);return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
  function dateLabel(d){const m=['JANNAR','FRAR','MARZU','APRIL','MEJJU','ĠUNJU','LULJU','AWWISSU','SETTEMBRU','OTTUBRU','NOVEMBRU','DIĊEMBRU'];return `${d.getDate()} TA' ${m[d.getMonth()]} ${d.getFullYear()}`;}

  function parseText(text){
    return text.split(/\n---\s*\n?/).map(b=>b.trim()).filter(Boolean).map(b=>{
      const L=b.split(/\r?\n/);
      const g=k=>{const x=L.find(v=>v.toUpperCase().startsWith(k.toUpperCase()+':'));return x?x.slice(x.indexOf(':')+1).trim():'';};
      const data=g('DATA');
      return {kind:'text',data,hin:g('ĦIN')||g('HIN'),titlu:g('TITLU'),desc:g('DESKRIZZJONI'),d:getTextDate(data)};
    });
  }

  function textCard(x){
    return `<article class="activity-card"><div class="activity-date">${esc(x.data)}${x.hin?' · '+esc(x.hin):''}</div><h2>${esc(x.titlu)}</h2>${x.desc?`<p>${esc(x.desc)}</p>`:''}</article>`;
  }

  function pdfEmbed(name){
    const url='./'+encodeURIComponent(name);
    return `<div class="activity-pdf-embed"><object data="${esc(url)}#view=FitH" type="application/pdf"><iframe src="${esc(url)}#view=FitH" title="Poster tal-Attività" loading="lazy"></iframe><p>Il-browser ma setax juri l-PDF direttament.</p></object></div>`;
  }

  function pdfCard(x){
    return `<article class="activity-card activity-pdf-card"><div class="activity-date">${esc(dateLabel(x.d))}</div><h2>Poster tal-Attività</h2>${pdfEmbed(x.name)}</article>`;
  }

  async function load(){
    try{
      const [txtRes,apiRes]=await Promise.all([
        fetch('attivitajiet.txt?ts='+Date.now(),{cache:'no-store'}),
        fetch(GITHUB_API+'?ts='+Date.now(),{headers:{Accept:'application/vnd.github+json'},cache:'no-store'})
      ]);
      const textItems=txtRes.ok?parseText(await txtRes.text()):[];
      const rawFiles=apiRes.ok?(await apiRes.json()).filter(x=>x.type==='file'&&PDF_FILE.test(x.name)).map(x=>({kind:'pdf',name:x.name,d:pdfDate(x.name)})):[];
      const files=rawFiles;
      // Jekk hemm poster PDF għall-istess data, uri l-poster biss u evita karta doppja mit-TXT.
      const pdfDates=new Set(files.filter(x=>x.d).map(x=>`${x.d.getFullYear()}-${x.d.getMonth()}-${x.d.getDate()}`));
      const textOnly=textItems.filter(x=>!x.d || !pdfDates.has(`${x.d.getFullYear()}-${x.d.getMonth()}-${x.d.getDate()}`));

      const today=new Date();
      today.setHours(0,0,0,0);
      const all=[...textOnly,...files];
      const future=all.filter(x=>!x.d||x.d>=today).sort((a,b)=>(a.d||new Date(8640000000000000))-(b.d||new Date(8640000000000000)));
      const past=all.filter(x=>x.d&&x.d<today).sort((a,b)=>b.d-a.d);

      if(!future.length){
        listEl.innerHTML='<article class="activity-card"><h2>Għad m’hemmx attivitajiet imħabbra.</h2></article>';
      }else{
        listEl.innerHTML=future.map(x=>x.kind==='pdf'?pdfCard(x):textCard(x)).join('');
      }

      archiveEl.innerHTML=past.length?past.map(x=>x.kind==='pdf'
        ?`<details class="activity-archive-item"><summary>${esc(dateLabel(x.d))} — Poster tal-Attività</summary>${pdfEmbed(x.name)}</details>`
        :`<details class="activity-archive-item"><summary>${esc(x.data)} — ${esc(x.titlu)}</summary><div>${x.hin?`<p><strong>Ħin:</strong> ${esc(x.hin)}</p>`:''}${x.desc?`<p>${esc(x.desc)}</p>`:''}</div></details>`).join('')
        :"<p>Għad m'hemmx attivitajiet fl-arkivju.</p>";
    }catch(e){
      console.error(e);
      listEl.innerHTML='<article class="activity-card"><h2>Ma rnexxilniex nuru l-attivitajiet.</h2><p>Erġa’ pprova ftit ieħor.</p></article>';
    }
  }

  document.addEventListener('DOMContentLoaded',load);
})();
