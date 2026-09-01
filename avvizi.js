(function () {
  const latestEl = document.getElementById('latest-notice');
  const archiveEl = document.getElementById('notice-archive');

  function escapeHtml(value) {
    return value.replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  }

  function parseNotices(text) {
    return text.split(/^---\s*$/m).map(block => block.trim()).filter(Boolean).map(block => {
      const lines = block.split(/\r?\n/);
      const notice = { data: '', titlu: 'Avviżi Parrokkjali', sottotitlu: '', body: [] };
      let bodyStarted = false;
      for (const raw of lines) {
        const line = raw.trim();
        if (!bodyStarted && /^DATA:/i.test(line)) notice.data = line.replace(/^DATA:/i, '').trim();
        else if (!bodyStarted && /^TITLU:/i.test(line)) notice.titlu = line.replace(/^TITLU:/i, '').trim();
        else if (!bodyStarted && /^SOTTOTITLU:/i.test(line)) notice.sottotitlu = line.replace(/^SOTTOTITLU:/i, '').trim();
        else {
          bodyStarted = true;
          notice.body.push(raw);
        }
      }
      notice.body = notice.body.join('\n').trim();
      return notice;
    });
  }

  function paragraphs(body) {
    return body.split(/\n\s*\n/).filter(Boolean).map(p => `<p>${escapeHtml(p.trim()).replace(/\n/g, '<br>')}</p>`).join('');
  }

  function noticeHtml(n, featured) {
    return `<article class="notice ${featured ? 'featured latest-dynamic' : 'archive-card'}">
      ${n.data ? `<span class="pill">${escapeHtml(n.data)}</span>` : ''}
      <h3>${escapeHtml(n.titlu || 'Avviżi Parrokkjali')}</h3>
      ${n.sottotitlu ? `<p><strong>${escapeHtml(n.sottotitlu)}</strong></p>` : ''}
      ${paragraphs(n.body)}
    </article>`;
  }

  fetch('avvizi.txt', { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('Ma setax jinqara avvizi.txt'); return r.text(); })
    .then(text => {
      const notices = parseNotices(text);
      if (!notices.length) throw new Error('M’hemmx avviżi fil-fajl');
      latestEl.className = '';
      latestEl.innerHTML = noticeHtml(notices[0], true);

      const old = notices.slice(1);
      if (!old.length) {
        archiveEl.innerHTML = '<p class="archive-empty">Bħalissa m’hemmx avviżi eqdem fl-arkivju. Meta żżid avviż ġdid, dan tal-lum jibqa’ hawn awtomatikament.</p>';
        return;
      }
      archiveEl.innerHTML = old.map((n, i) => `
        <details class="archive-item" ${i === 0 ? '' : ''}>
          <summary><span>${escapeHtml(n.data || 'Avviż preċedenti')}</span><strong>${escapeHtml(n.sottotitlu || n.titlu)}</strong></summary>
          <div class="archive-content">${noticeHtml(n, false)}</div>
        </details>`).join('');
    })
    .catch(err => {
      latestEl.innerHTML = '<div class="notice error-notice"><h3>Ma rnexxilniex nuru l-avviżi</h3><p>Erġa’ pprova ftit ieħor jew ikkuntattja l-Uffiċċju Parrokkjali.</p></div>';
      console.error(err);
    });
})();
