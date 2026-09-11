(function () {
  const grid = document.getElementById('usefulLinksGrid');
  if (!grid) return;

  const lang = (document.documentElement.lang || 'mt').toLowerCase().startsWith('en') ? 'en' : 'mt';
  const labels = lang === 'en'
    ? { loading: 'Loading links…', empty: 'No links are available at the moment.', error: 'The links could not be loaded.', visit: 'Visit' }
    : { loading: 'Qed jittellgħu l-links…', empty: 'Bħalissa m’hemmx links disponibbli.', error: 'Ma rnexxiex nitgħabbew il-links.', visit: 'Żur' };

  const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  function parseLinks(text) {
    const normalized = String(text || '').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    return normalized
      .split(/^\s*---\s*$/m)
      .map(block => block.trim())
      .filter(Boolean)
      .map(block => {
        const item = {};
        block.split('\n').forEach(line => {
          const match = line.match(/^\s*([A-Z_]+)\s*:\s*(.*?)\s*$/);
          if (match) item[match[1]] = match[2];
        });
        return item;
      })
      .filter(item => item.URL && (item.ISEM_MT || item.ISEM_EN));
  }

  function render(items) {
    if (!items.length) {
      grid.innerHTML = `<p class="links-note">${labels.empty}</p>`;
      return;
    }

    grid.innerHTML = items.map(item => {
      const name = lang === 'en' ? (item.ISEM_EN || item.ISEM_MT) : (item.ISEM_MT || item.ISEM_EN);
      const description = lang === 'en'
        ? (item.DESKRIZZJONI_EN || item.DESKRIZZJONI_MT || '')
        : (item.DESKRIZZJONI_MT || item.DESKRIZZJONI_EN || '');
      const url = item.URL;
      return `
        <article class="useful-link-card">
          <div class="useful-link-symbol" aria-hidden="true">✦</div>
          <div>
            <h2>${escapeHtml(name)}</h2>
            ${description ? `<p>${escapeHtml(description)}</p>` : ''}
            <a class="btn btn-primary" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${labels.visit} ${escapeHtml(name)} ↗</a>
          </div>
        </article>`;
    }).join('');
  }

  async function loadLinks() {
    const stamp = Date.now();
    const sources = [
      `https://raw.githubusercontent.com/Parrocca/parrocca-msida/main/links.txt?ts=${stamp}`,
      `links.txt?ts=${stamp}`
    ];

    for (const src of sources) {
      try {
        const response = await fetch(src, { cache: 'no-store' });
        if (!response.ok) continue;
        const text = await response.text();
        const items = parseLinks(text);
        if (items.length) {
          render(items);
          return;
        }
      } catch (e) {}
    }
    grid.innerHTML = `<p class="links-note">${labels.error}</p>`;
  }

  grid.innerHTML = `<p class="links-note">${labels.loading}</p>`;
  loadLinks();
})();
