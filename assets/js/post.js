(function(){
  const content = document.querySelector('.post-content');
  if (!content) return;

  // Reading time
  const text = content.textContent || '';
  const words = (text.match(/\S+/g) || []).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const rt = document.getElementById('reading-time');
  if (rt) rt.textContent = `${minutes} min read`;

  // TOC
  const headings = Array.from(content.querySelectorAll('h2, h3'));
  if (headings.length){
    const toc = document.getElementById('post-toc');
    if (toc){
      const list = document.createElement('ol');
      let currentUl = null;
      headings.forEach(h => {
        if (!h.id){
          const slug = h.textContent.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
          h.id = slug || 'section';
        }
        const li = document.createElement('li');
        const a = document.createElement('a'); a.href = `#${h.id}`; a.textContent = h.textContent;
        li.appendChild(a);
        if (h.tagName === 'H2'){
          list.appendChild(li);
          currentUl = null;
        } else {
          if (!currentUl){ currentUl = document.createElement('ul'); list.lastElementChild?.appendChild(currentUl); }
          currentUl.appendChild(li);
        }
      });
      toc.appendChild(list);
    }
  }
  // Copy link button
  const copyBtn = document.getElementById('copy-link-btn');
  if (copyBtn && navigator.clipboard){
    copyBtn.addEventListener('click', async () => {
      try {
        const url = copyBtn.getAttribute('data-url') || location.href;
        await navigator.clipboard.writeText(url);
        const prev = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = prev || 'Copy link'; }, 1500);
      } catch (e) { console.warn('Copy failed', e); }
    });
  }

})();

