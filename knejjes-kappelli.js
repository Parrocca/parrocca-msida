(function () {
  const list = document.getElementById('knejjes-kappelli-list');
  if (!list) return;

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function parse(text) {
    return text.split(/\n\s*---\s*(?:\n|$)/).map(block => {
      const item = {};
      block.split(/\r?\n/).forEach(line => {
        const m = line.match(/^\s*([^:]+):\s*(.*)$/);
        if (m) item[m[1].trim().toUpperCase()] = m[2].trim();
      });
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
  function card(x, i) {
    let desc = '';
    for (let n = 1; n <= 6; n++) if (x['DESKRIZZJONI' + n]) desc += `<p>${esc(x['DESKRIZZJONI' + n])}</p>`;
    if (!desc && x.DESKRIZZJONI) desc = `<p>${esc(x.DESKRIZZJONI)}</p>`;
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
