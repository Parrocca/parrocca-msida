(function () {
  const latestEl = document.getElementById('latest-notice');
  const archiveEl = document.getElementById('notice-archive');
  const GITHUB_API = 'https://api.github.com/repos/Parrocca/parrocca-msida/contents';
  const NOTICE_FILE = /^avviz-(\d{4})-(\d{2})-(\d{2})\.(txt|jpe?g|png|webp|pdf)$/i;

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function dateFromName(name) {
    const m = name.match(NOTICE_FILE);
    if (!m) return '';
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return new Intl.DateTimeFormat('mt-MT', { day:'numeric', month:'long', year:'numeric' }).format(d);
  }

  function parseText(text, fallbackDate) {
    const lines = text.trim().split(/\r?\n/);
    const n = { data: fallbackDate, titlu: 'Avviżi Parrokkjali', sottotitlu: '', body: [] };
    let bodyStarted = false;
    for (const raw of lines) {
      const line = raw.trim();
      if (!bodyStarted && /^DATA:/i.test(line)) n.data = line.replace(/^DATA:/i, '').trim();
      else if (!bodyStarted && /^(TITLU|TITOLU):/i.test(line)) n.titlu = line.replace(/^(TITLU|TITOLU):/i, '').trim();
      else if (!bodyStarted && /^(SOTTOTITLU|SOTTOTITOLU):/i.test(line)) n.sottotitlu = line.replace(/^(SOTTOTITLU|SOTTOTITOLU):/i, '').trim();
      else if (!bodyStarted && /^TEST:\s*$/i.test(line)) bodyStarted = true;
      else { bodyStarted = true; n.body.push(raw); }
    }
    n.body = n.body.join('\n').trim();
    return n;
  }

  function paragraphs(body) {
    return String(body || '').split(/\n\s*\n/).filter(Boolean)
      .map(p => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
  }

  function textCard(n, featured) {
    return `<article class="notice ${featured ? 'featured latest-dynamic' : 'archive-card'}">
      ${n.data ? `<span class="pill">${escapeHtml(n.data)}</span>` : ''}
      <h3>${escapeHtml(n.titlu)}</h3>
      ${n.sottotitlu ? `<p><strong>${escapeHtml(n.sottotitlu)}</strong></p>` : ''}
      ${paragraphs(n.body)}
    </article>`;
  }

  function imageCard(item, featured) {
    const date = dateFromName(item.name);
    return `<article class="notice ${featured ? 'featured latest-dynamic' : 'archive-card'}">
      ${date ? `<span class="pill">${escapeHtml(date)}</span>` : ''}
      <h3>Avviż Parrokkjali</h3>
      <a href="${item.download_url}" target="_blank" rel="noopener">
        <img class="auto-notice-image" src="${item.download_url}" alt="Avviż Parrokkjali ${escapeHtml(date)}" loading="lazy">
      </a>
      <p><a class="notice-image-link${featured ? '' : ' dark-link'}" href="${item.download_url}" target="_blank" rel="noopener">Ara l-avviż ikbar →</a></p>
    </article>`;
  }

  function pdfCard(item, featured) {
    const date = dateFromName(item.name);
    const pdfUrl = './' + encodeURIComponent(item.name);

    if (!featured) {
      return `<article class="notice archive-card">
        ${date ? `<span class="pill">${escapeHtml(date)}</span>` : ''}
        <h3>Avviżi Parrokkjali</h3>
        <p><a class="btn btn-primary" href="${pdfUrl}" target="_blank" rel="noopener">Iftaħ l-Avviżi (PDF)</a></p>
      </article>`;
    }

    return `<article class="notice featured latest-dynamic pdf-featured">
      ${date ? `<span class="pill">${escapeHtml(date)}</span>` : ''}
      <h3>Avviżi Parrokkjali</h3>
      <p>L-avviżi ta’ din il-ġimgħa jidhru hawn taħt.</p>
      <div class="pdf-pages" data-pdf-src="${pdfUrl}">
        <div class="pdf-loading">Qed jinfetħu l-avviżi…</div>
      </div>
      <p class="pdf-open-row"><a class="notice-image-link" href="${pdfUrl}" target="_blank" rel="noopener">Iftaħ il-PDF f’paġna ġdida →</a></p>
    </article>`;
  }

  let pdfJsPromise;
  function getPdfJs() {
    if (!pdfJsPromise) {
      pdfJsPromise = import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs').then(pdfjsLib => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
        return pdfjsLib;
      });
    }
    return pdfJsPromise;
  }

  async function renderFeaturedPdf() {
    const holder = latestEl.querySelector('.pdf-pages[data-pdf-src]');
    if (!holder) return;

    try {
      const pdfjsLib = await getPdfJs();
      const pdf = await pdfjsLib.getDocument(holder.dataset.pdfSrc).promise;
      holder.innerHTML = '';

      for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
        const page = await pdf.getPage(pageNo);
        const viewport = page.getViewport({ scale: 1.7 });
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { alpha: false });
        canvas.width = Math.floor(viewport.width);
        canvas.height = Math.floor(viewport.height);
        canvas.className = 'pdf-page-canvas';
        canvas.setAttribute('aria-label', `Paġna ${pageNo} tal-avviżi`);
        holder.appendChild(canvas);
        await page.render({ canvasContext: context, viewport }).promise;
      }
    } catch (err) {
      console.error('PDF preview error:', err);
      holder.innerHTML = '<p class="pdf-preview-error">Ma stajniex nuru l-PDF direttament. Uża l-link hawn taħt biex tiftaħu.</p>';
    }
  }

  async function loadItem(item) {
    if (/\.txt$/i.test(item.name)) {
      const r = await fetch(item.download_url + '?ts=' + Date.now(), { cache:'no-store' });
      if (!r.ok) throw new Error('Ma setax jinqara ' + item.name);
      return { item, notice: parseText(await r.text(), dateFromName(item.name)), image:false };
    }
    if (/\.pdf$/i.test(item.name)) return { item, pdf:true, image:false };
    return { item, image:true, pdf:false };
  }

  function render(data, featured) {
    if (data.pdf) return pdfCard(data.item, featured);
    return data.image ? imageCard(data.item, featured) : textCard(data.notice, featured);
  }

  async function loadNotices() {
    try {
      const r = await fetch(GITHUB_API + '?ts=' + Date.now(), {
        headers:{'Accept':'application/vnd.github+json'}, cache:'no-store'
      });
      if (!r.ok) throw new Error('Ma setgħux jinqraw l-avviżi.');
      const files = (await r.json())
        .filter(x => x.type === 'file' && NOTICE_FILE.test(x.name))
        .sort((a,b) => b.name.localeCompare(a.name));
      if (!files.length) throw new Error('M’hemmx avviżi.');

      const data = await Promise.all(files.map(loadItem));
      latestEl.className = '';
      latestEl.innerHTML = render(data[0], true);
      if (data[0].pdf) await renderFeaturedPdf();

      if (data.length === 1) {
        archiveEl.innerHTML = '<p class="archive-empty">Bħalissa m’hemmx avviżi eqdem fl-arkivju.</p>';
        return;
      }
      archiveEl.innerHTML = data.slice(1).map(d => {
        const label = (d.image || d.pdf) ? dateFromName(d.item.name) : (d.notice.data || 'Avviż preċedenti');
        const title = d.pdf ? 'Avviżi Parrokkjali (PDF)' : (d.image ? 'Avviż Parrokkjali' : d.notice.titlu);
        return `<details class="archive-item"><summary><span>${escapeHtml(label)}</span><strong>${escapeHtml(title)}</strong></summary><div class="archive-content">${render(d,false)}</div></details>`;
      }).join('');
    } catch (err) {
      latestEl.innerHTML = '<div class="notice error-notice"><h3>Ma rnexxilniex nuru l-avviżi</h3><p>Erġa’ pprova ftit ieħor.</p></div>';
      console.error(err);
    }
  }

  document.addEventListener('DOMContentLoaded', loadNotices);
})();
