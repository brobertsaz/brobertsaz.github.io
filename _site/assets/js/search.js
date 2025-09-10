(function(){
  const $ = s => document.querySelector(s);
  const resultsEl = document.getElementById('search-results');
  const inputEl = document.getElementById('search-input');
  if (!resultsEl || !inputEl) return;

  let index = [];
  fetch('/search.json')
    .then(r => r.json())
    .then(d => { index = d || []; render(index.slice(0, 10)); })
    .catch(() => {});

  function tokenize(q){
    return (q || '').toLowerCase().split(/\s+/).filter(Boolean);
  }

  function score(item, terms){
    const hay = (item.title + ' ' + item.excerpt + ' ' + item.content).toLowerCase();
    let s = 0;
    for (const t of terms){ if (hay.includes(t)) s += 1; }
    return s;
  }

  function highlight(text, terms){
    let out = text;
    for (const t of terms){
      const re = new RegExp('(' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig');
      out = out.replace(re, '<mark>$1</mark>');
    }
    return out;
  }

  function render(items){
    if (!items.length){ resultsEl.innerHTML = '<li>No results</li>'; return; }
    const html = items.map(p => {
      const date = new Date(p.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      return `<li class="search-result">
        <a href="${p.url}">${p.title}</a>
        <div class="meta">${date}</div>
        <p>${p.excerpt}</p>
      </li>`;}).join('');
    resultsEl.innerHTML = html;
  }

  inputEl.addEventListener('input', () => {
    const q = inputEl.value.trim();
    const terms = tokenize(q);
    if (!q){ render(index.slice(0, 10)); return; }
    const matches = index
      .map(p => ({ p, s: score(p, terms) }))
      .filter(x => x.s > 0)
      .sort((a,b) => b.s - a.s)
      .slice(0, 20)
      .map(x => ({ ...x.p, excerpt: highlight(x.p.excerpt, terms) }));
    render(matches);
  });
})();

