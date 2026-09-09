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

  function pdfCard(x){
    return `<article class="activity-card activity-pdf-card"><div class="activity-date">${esc(dateLabel(x.d))}</div><h2>Poster tal-Attività</h2><div class="activity-pdf-pages" data-pdf="${esc(x.name)}"><div class="activity-pdf-loading">Qed jitgħabba l-poster…</div></div></article>`;
  }

  let pdfJsPromise;
  function getPdfJs(){
    if(!pdfJsPromise){
      pdfJsPromise=import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs').then(lib=>{
        lib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
        return lib;
      });
    }
    return pdfJsPromise;
  }

  function textItemsToLines(items){
    const rows=[];
    for(const it of items){
      const s=String(it.str||'');
      if(!s.trim()) continue;
      const y=it.transform&&it.transform.length>5?it.transform[5]:0;
      const x=it.transform&&it.transform.length>4?it.transform[4]:0;
      const width=Number(it.width||0);
      const height=Math.abs(Number(it.height||it.transform?.[3]||12));
      let row=rows.find(r=>Math.abs(r.y-y)<Math.max(2.5,height*0.20));
      if(!row){ row={y,parts:[]}; rows.push(row); }
      row.parts.push({x,width,height,s});
    }
    return rows.sort((a,b)=>b.y-a.y).map(r=>{
      const parts=r.parts.sort((a,b)=>a.x-b.x);
      let out='';
      let prev=null;
      for(const p of parts){
        const txt=p.s.trim();
        if(!txt) continue;
        if(prev){
          const prevEnd=prev.x+prev.width;
          const gap=p.x-prevEnd;
          const threshold=Math.max(1.2,Math.min(prev.height,p.height)*0.16);
          // PDF text is often split inside a word. Add a space only when
          // the visual gap is large enough to be a real word-space.
          if(gap>threshold && !/^[,.;:!?%)\]’']/.test(txt) && !/[(/\-–—]$/.test(out)) out+=' ';
        }
        out+=txt;
        prev=p;
      }
      return out.replace(/\s+([,.;:!?])/g,'$1')
                .replace(/\s*[-–—]\s*/g,'-')
                .replace(/\s+/g,' ').trim();
    }).filter(Boolean);
  }

  function cleanPdfTitle(line){
    if(!line) return '';
    let t=line.replace(/^\s*Nhar\s+/i,'').trim();
    // Neħħi l-parti "il-Ħadd 4 ta’ Ottubru 2026" u ħalli t-titlu tal-attività.
    t=t.replace(/^.*?\b\d{1,2}\s+ta[’'`]?(?:\s+)?[A-Za-zÀ-ÿ-]+\s+\d{4}\s*/i,'').trim();
    t=t.replace(/^[-–—:;,\.\s]+/,'').trim();
    return t;
  }

  async function renderPdfPosters(){
    const boxes=[...document.querySelectorAll('.activity-pdf-pages[data-pdf]')];
    if(!boxes.length) return;
    let lib;
    try{ lib=await getPdfJs(); }
    catch(e){ boxes.forEach(box=>box.innerHTML='<div class="activity-pdf-error">Ma rnexxiex nitgħabba l-poster.</div>'); return; }

    for(const box of boxes){
      const name=box.dataset.pdf;
      try{
        const pdf=await lib.getDocument('./'+encodeURIComponent(name)).promise;
        box.innerHTML='';
        for(let n=1;n<=pdf.numPages;n++){
          const page=await pdf.getPage(n);
          const viewport=page.getViewport({scale:1.6});
          const canvas=document.createElement('canvas');
          canvas.className='activity-pdf-canvas';
          canvas.width=Math.ceil(viewport.width);
          canvas.height=Math.ceil(viewport.height);
          box.appendChild(canvas);
          await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;
        }
      }catch(e){
        console.warn('Ma rnexxiex nuri l-poster:',name,e);
        box.innerHTML='<div class="activity-pdf-error">Ma rnexxiex nitgħabba l-poster.</div>';
      }
    }
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

      const today=new Date();
      today.setHours(0,0,0,0);
      const all=[...textItems,...files];
      const future=all.filter(x=>!x.d||x.d>=today).sort((a,b)=>(a.d||new Date(8640000000000000))-(b.d||new Date(8640000000000000)));
      const past=all.filter(x=>x.d&&x.d<today).sort((a,b)=>b.d-a.d);

      if(!future.length){
        listEl.innerHTML='<article class="activity-card"><h2>Għad m’hemmx attivitajiet imħabbra.</h2></article>';
      }else{
        listEl.innerHTML=future.map(x=>x.kind==='pdf'?pdfCard(x):textCard(x)).join('');
      }

      archiveEl.innerHTML=past.length?past.map(x=>x.kind==='pdf'
        ?`<details class="activity-archive-item"><summary>${esc(dateLabel(x.d))} — Poster tal-Attività</summary><div class="activity-pdf-pages" data-pdf="${esc(x.name)}"><div class="activity-pdf-loading">Qed jitgħabba l-poster…</div></div></details>`
        :`<details class="activity-archive-item"><summary>${esc(x.data)} — ${esc(x.titlu)}</summary><div>${x.hin?`<p><strong>Ħin:</strong> ${esc(x.hin)}</p>`:''}${x.desc?`<p>${esc(x.desc)}</p>`:''}</div></details>`).join('')
        :"<p>Għad m'hemmx attivitajiet fl-arkivju.</p>";
      await renderPdfPosters();
    }catch(e){
      console.error(e);
      listEl.innerHTML='<article class="activity-card"><h2>Ma rnexxilniex nuru l-attivitajiet.</h2><p>Erġa’ pprova ftit ieħor.</p></article>';
    }
  }

  document.addEventListener('DOMContentLoaded',load);
})();
