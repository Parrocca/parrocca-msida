(function () {
  const groupsEl = document.getElementById('ghaqdiet-list');
  const operatorsEl = document.getElementById('operaturi-list');
  if (!groupsEl || !operatorsEl) return;

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

  function phoneHref(phone) {
    return String(phone || '').replace(/[^+\d]/g, '');
  }

  function groupCard(x) {
    const desc = x.DESKRIZZJONI ? `<p>${esc(x.DESKRIZZJONI)}</p>` : '';
    const contact = x.KUNTATT ? `<p class="pastoral-contact"><strong>Kuntatt:</strong> <a href="tel:${esc(phoneHref(x.KUNTATT))}">${esc(x.KUNTATT)}</a></p>` : '';
    return `<article class="pastoral-card"><div class="pastoral-symbol" aria-hidden="true">♡</div><div><h3>${esc(x.ISEM)}</h3>${desc}${contact}</div></article>`;
  }

  function operatorCard(x) {
    const desc = x.DESKRIZZJONI ? `<p>${esc(x.DESKRIZZJONI)}</p>` : '';
    const contact = x.KUNTATT ? `<p class="pastoral-contact"><strong>Kuntatt:</strong> <a href="tel:${esc(phoneHref(x.KUNTATT))}">${esc(x.KUNTATT)}</a></p>` : '';
    return `<article class="pastoral-card compact"><div class="pastoral-symbol" aria-hidden="true">✦</div><div><h3>${esc(x.ISEM)}</h3>${desc}${contact}</div></article>`;
  }

  fetch('ghaqdiet.txt?v=' + Date.now(), {cache:'no-store'})
    .then(r => { if (!r.ok) throw new Error('Ma setax jinqara l-file'); return r.text(); })
    .then(text => {
      const items = parse(text);
      const groups = items.filter(x => (x.TIP || 'GĦAQDA').toUpperCase().includes('GĦAQ'));
      const operators = items.filter(x => !groups.includes(x));
      groupsEl.innerHTML = groups.length ? groups.map(groupCard).join('') : '<p class="pastoral-note">Għad m’hemmx għaqdiet imdaħħla.</p>';
      operatorsEl.innerHTML = operators.length ? operators.map(operatorCard).join('') : '<p class="pastoral-note">Għad m’hemmx operaturi pastorali mdaħħla.</p>';
    })
    .catch(() => {
      groupsEl.innerHTML = '<p class="pastoral-note">Ma stajniex nuru l-lista bħalissa.</p>';
      operatorsEl.innerHTML = '';
    });
})();
