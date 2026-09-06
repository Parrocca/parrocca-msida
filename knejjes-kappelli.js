(function () {
  const list = document.getElementById('knejjes-kappelli-list');
  if (!list) return;

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  const knownKeys = new Set(['TIP','ISEM','RITRATT','DESKRIZZJONI','JISTGHU_JSIRU','FACILITAJIET','ADORAZZJONI','RETTUR','KUNTATT']);

  function parse(text) {
    return text.split(/\n\s*---\s*(?:\n|$)/).map(block => {
      const item = {};
      const lines = block.replace(/\r/g, '').split('\n');
      let currentKey = null;
      let buffer = [];

      function saveCurrent() {
        if (!currentKey) return;
        let value = buffer.join('\n').trim();
        if (value) item[currentKey] = value;
        currentKey = null;
        buffer = [];
      }

      for (const line of lines) {
        const m = line.match(/^\s*([^:]+):\s*(.*)$/);
        const key = m ? m[1].trim().toUpperCase() : '';
        if (m && knownKeys.has(key)) {
          saveCurrent();
          currentKey = key;
          buffer = [m[2]];
        } else if (currentKey) {
          buffer.push(line);
        }
      }
      saveCurrent();
      return item;
    }).filter(x => x.ISEM);
  }

  function phoneHref(phone) { return String(phone || '').replace(/[^+\d]/g, ''); }
  function detail(label, value, isPhone) {
    if (!value) return '';
    const v = isPhone ? `<a href="tel:${esc(phoneHref(value))}">${esc(value)}</a>` : esc(value);
    return `<p><strong>${esc(label)}</strong><br>${v}</p>`;
  }
  function photo(x) {
    if ((x.RITRATT || '').toUpperCase() === 'DIJAGRAMMA' || !x.RITRATT) {
      return `<div class="church-photo church-diagram" aria-label="Dijagramma simbolika ta’ kappella"><div class="chapel-icon" aria-hidden="true"><span class="chapel-cross"></span><span class="chapel-roof"></span><span class="chapel-building"></span><span class="chapel-window"></span><span class="chapel-door"></span></div></div>`;
    }
    return `<div class="church-photo"><img src="${esc(x.RITRATT)}" alt="${esc(x.ISEM)}" loading="lazy"></div>`;
  }
  function descriptionHtml(value) {
    if (!value) return '';
    return value.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean)
      .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
  }
  function card(x, i) {
    const desc = descriptionHtml(x.DESKRIZZJONI);
    const details = [
      detail('F’din il-kappella jistgħu jsiru', x.JISTGHU_JSIRU),
      detail('Faċilitajiet', x.FACILITAJIET),
      detail('Ħinijiet tal-Adorazzjoni', x.ADORAZZJONI),
      detail('Rettur', x.RETTUR),
      detail('Kuntatt', x.KUNTATT, true)
    ].filter(Boolean).join('');
    return `<section class="church-entry${i % 2 ? ' reverse' : ''}">${photo(x)}<div class="church-copy"><span class="church-label">${esc(x.TIP || 'Knisja')}</span><h2>${esc(x.ISEM)}</h2>${desc}${details ? `<div class="church-details">${details}</div>` : ''}</div></section>`;
  }

  fetch('knejjes-kappelli.txt?v=' + Date.now(), {cache:'no-store'})
    .then(r => { if (!r.ok) throw new Error(); return r.text(); })
    .then(text => {
      const items = parse(text);
      list.innerHTML = items.length ? items.map(card).join('') : '<p>Għad m’hemmx knejjes jew kappelli mdaħħla.</p>';
    })
    .catch(() => { list.innerHTML = '<p>Ma stajniex nuru t-tagħrif bħalissa.</p>'; });
})();
