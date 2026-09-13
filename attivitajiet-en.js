(function () {
  const listEl = document.getElementById('activities-list');
  const archiveEl = document.getElementById('activities-archive');
  const GITHUB_API = 'https://api.github.com/repos/Parrocca/parrocca-msida/contents';
  const PDF_FILE = /^attivita-(\d{4})-(\d{2})-(\d{2})\.pdf$/i;

  const months = {"january":0,"february":1,"march":2,"april":3,"may":4,"june":5,"july":6,"august":7,"september":8,"october":9,"november":10,"december":11};

  function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
  function getTextDate(s){const m=String(s||'').toLowerCase().match(/(\d{1,2})\s+([a-z]+)\s+(\d{4})/i);return m&&months[m[2]]!==undefined?new Date(+m[3],months[m[2]],+m[1]):null;}
  function pdfDate(name){const m=name.match(PDF_FILE);return m?new Date(+m[1],+m[2]-1,+m[3]):null;}
  function dateLabel(d){const m=['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];return `${d.getDate()} ${m[d.getMonth()]} ${d.getFullYear()}`;}

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
    return `<div class="activity-pdf-pages" data-pdf-src="${esc(url)}"><div class="activity-pdf-loading">Loading poster…</div></div>`;
  }

  let pdfJsPromise;
  function getPdfJs(){
    if(!pdfJsPromise){
      pdfJsPromise=new Promise((resolve,reject)=>{
        if(window.pdfjsLib){
          window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          resolve(window.pdfjsLib);
          return;
        }
        const script=document.createElement('script');
        script.src='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js';
        script.onload=()=>{
          window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
          resolve(window.pdfjsLib);
        };
        script.onerror=reject;
        document.head.appendChild(script);
      });
    }
    return pdfJsPromise;
  }

  async function renderPdfPosters(){
    const holders=[...document.querySelectorAll('.activity-pdf-pages[data-pdf-src]')];
    if(!holders.length)return;
    try{
      const pdfjsLib=await getPdfJs();
      for(const holder of holders){
        try{
          const pdf=await pdfjsLib.getDocument(holder.dataset.pdfSrc).promise;
          holder.innerHTML='';
          for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
            const page=await pdf.getPage(pageNo);
            const viewport=page.getViewport({scale:1.7});
            const canvas=document.createElement('canvas');
            const context=canvas.getContext('2d',{alpha:false});
            canvas.width=Math.floor(viewport.width);
            canvas.height=Math.floor(viewport.height);
            canvas.className='activity-pdf-canvas';
            canvas.setAttribute('aria-label',`Page ${pageNo} of the poster`);
            holder.appendChild(canvas);
            await page.render({canvasContext:context,viewport}).promise;
          }
        }catch(err){
          console.error('Poster PDF error:',err);
          holder.innerHTML='<p class="activity-pdf-error">The poster could not be displayed.</p>';
        }
      }
    }catch(err){
      console.error('PDF.js error:',err);
      holders.forEach(h=>h.innerHTML='<p class="activity-pdf-error">The poster could not be displayed.</p>');
    }
  }

  function pdfCard(x){
    const t=x.text;
    const data=t&&t.data?t.data:dateLabel(x.d);
    const hin=t&&t.hin?' · '+esc(t.hin):'';
    const titlu=t&&t.titlu?t.titlu:'Activity Poster';
    const desc=t&&t.desc?`<p class="activity-poster-desc">${esc(t.desc)}</p>`:'';
    return `<article class="activity-card activity-pdf-card"><div class="activity-date">${esc(data)}${hin}</div><h2>${esc(titlu)}</h2>${desc}${pdfEmbed(x.name)}</article>`;
  }

  async function load(){
    try{
      const [txtRes,apiRes]=await Promise.all([
        fetch('attivitajiet-en.txt?ts='+Date.now(),{cache:'no-store'}),
        fetch(GITHUB_API+'?ts='+Date.now(),{headers:{Accept:'application/vnd.github+json'},cache:'no-store'})
      ]);
      const textItems=txtRes.ok?parseText(await txtRes.text()):[];
      const rawFiles=apiRes.ok?(await apiRes.json()).filter(x=>x.type==='file'&&PDF_FILE.test(x.name)).map(x=>({kind:'pdf',name:x.name,d:pdfDate(x.name)})):[];
      // Jekk PDF u TXT għandhom l-istess data, għaqqadhom: it-test jidher mal-poster.
      const dateKey=d=>d?`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`:'';
      const textByDate=new Map(textItems.filter(x=>x.d).map(x=>[dateKey(x.d),x]));
      const files=rawFiles.map(x=>({...x,text:textByDate.get(dateKey(x.d))||null}));
      const pdfDates=new Set(files.filter(x=>x.d).map(x=>dateKey(x.d)));
      const textOnly=textItems.filter(x=>!x.d || !pdfDates.has(dateKey(x.d)));

      const today=new Date();
      today.setHours(0,0,0,0);
      const all=[...textOnly,...files];
      const future=all.filter(x=>!x.d||x.d>=today).sort((a,b)=>(a.d||new Date(8640000000000000))-(b.d||new Date(8640000000000000)));
      const past=all.filter(x=>x.d&&x.d<today).sort((a,b)=>b.d-a.d);

      if(!future.length){
        listEl.innerHTML='<article class="activity-card"><h2>There are no announced activities yet.</h2></article>';
      }else{
        listEl.innerHTML=future.map(x=>x.kind==='pdf'?pdfCard(x):textCard(x)).join('');
      }

      archiveEl.innerHTML=past.length?past.map(x=>x.kind==='pdf'
        ?`<details class="activity-archive-item"><summary>${esc(dateLabel(x.d))} — Activity Poster</summary>${pdfEmbed(x.name)}</details>`
        :`<details class="activity-archive-item"><summary>${esc(x.data)} — ${esc(x.titlu)}</summary><div>${x.hin?`<p><strong>Time:</strong> ${esc(x.hin)}</p>`:''}${x.desc?`<p>${esc(x.desc)}</p>`:''}</div></details>`).join('')
        :"<p>There are no archived activities yet.</p>";
      await renderPdfPosters();
    }catch(e){
      console.error(e);
      listEl.innerHTML='<article class="activity-card"><h2>We could not display the activities.</h2><p>Please try again later.</p></article>';
    }
  }

  document.addEventListener('DOMContentLoaded',load);
})();
