/* Search previews delegate activation to the existing Viewer navigation API. */
(function () {
  const api = globalThis.pFlow;
  const control = document.getElementById('search-control');
  const input = document.getElementById('global-search');
  const popup = document.getElementById('search-popup');
  const list = document.getElementById('search-results');
  const status = document.getElementById('search-status');
  const empty = document.getElementById('search-empty');
  const clear = document.getElementById('search-clear');
  const bundleTitles = new Map((globalThis.pFlowSamples || []).map(item => [item.key, item.title]));
  let searcher, timer, previous, active = -1, invoker, results = [];
  function highlighted(tag, text, ranges, className) {
    const node = document.createElement(tag); if (className) node.className = className;
    let offset = 0;
    for (const range of ranges) {
      node.append(document.createTextNode(text.slice(offset, range.start)));
      const mark = document.createElement('mark'); mark.textContent = text.slice(range.start, range.end); node.append(mark); offset = range.end;
    }
    node.append(document.createTextNode(text.slice(offset))); return node;
  }
  function activate(index) {
    active = index;
    [...list.children].forEach((node, i) => node.setAttribute('aria-selected', String(i === active)));
    const node = list.children[active];
    if (!node) { input.removeAttribute('aria-activedescendant'); return; }
    input.setAttribute('aria-activedescendant', node.id);
    const row = node.getBoundingClientRect(), box = list.getBoundingClientRect();
    if (row.bottom > box.bottom) list.scrollTop += row.bottom - box.bottom;
    else if (row.top < box.top) list.scrollTop -= box.top - row.top;
  }
  function update() {
    clearTimeout(timer); clear.hidden = !input.value;
    if (previous === input.value) return;
    previous = input.value;
    const found = searcher.search(input.value); results = found.results;
    const fragment = document.createDocumentFragment();
    found.results.forEach((result, i) => {
      const row = document.createElement('div'); row.className = 'search-result'; row.id = `search-result-${i}`; row.setAttribute('role', 'option'); row.setAttribute('aria-selected', 'false');
      row.append(highlighted('h3', result.title, result.highlights.title));
      if (result.heading && result.heading !== result.title) row.append(highlighted('p', result.heading, result.highlights.heading, 'search-result-heading'));
      row.append(highlighted('p', result.preview || 'No paragraph text in this section.', result.highlights.preview, 'search-result-preview'));
      const location = document.createElement('p'); location.className = 'search-result-location'; location.textContent = `${bundleTitles.get(result.bundleId) || result.bundleId} · ${result.path}${result.sectionId ? ` #${result.sectionId}` : ' · Document'}`; row.append(location);
      row.addEventListener('mousedown', event => event.preventDefault());
      row.addEventListener('click', () => openResult(i));
      fragment.append(row);
    });
    list.replaceChildren(fragment); activate(-1);
    status.textContent = found.total ? `${found.total} matching sections in ${found.documents} documents${found.total > found.results.length ? ` · Showing ${found.results.length}` : ''}` : 'Search documentation';
    empty.hidden = !!found.total;
    empty.textContent = !searcher.documentCount ? 'No Markdown documents are available.' : input.value.trim() ? 'No matching sections.' : 'Search titles, headings, and documentation text across all samples.';
  }
  function openResult(index, keyboard = false) {
    // Flush a pending query before activation; never open an obsolete result row.
    const changed = previous !== input.value; update();
    if (changed && !keyboard) return;
    const result = results[changed ? 0 : index];
    if (!result) return;
    close();
    api.activateSearchResult(result, input.value);
  }
  function open() { popup.hidden = false; input.setAttribute('aria-expanded', 'true'); update(); }
  function close(restore = false) {
    clearTimeout(timer); popup.hidden = true; input.setAttribute('aria-expanded', 'false'); activate(-1);
    if (restore && invoker?.isConnected) invoker.focus({ preventScroll: true });
    invoker = undefined;
  }
  input.addEventListener('focus', open);
  input.addEventListener('input', () => { popup.hidden = false; input.setAttribute('aria-expanded', 'true'); clearTimeout(timer); timer = setTimeout(update, 120); clear.hidden = !input.value; });
  input.addEventListener('keydown', event => {
    if (event.isComposing) return;
    if (event.key === 'Escape') { event.preventDefault(); close(true); }
    else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault(); open();
      if (list.children.length) activate(active < 0 ? (event.key === 'ArrowDown' ? 0 : list.children.length - 1) : (active + (event.key === 'ArrowDown' ? 1 : -1) + list.children.length) % list.children.length);
    } else if (event.key === 'Enter' && !popup.hidden) {
      event.preventDefault(); openResult(active < 0 ? 0 : active, true);
    }
  });
  clear.addEventListener('click', () => { input.value = ''; open(); input.focus({ preventScroll: true }); });
  control.addEventListener('keydown', event => { if (event.key === 'Escape' && !event.defaultPrevented && !event.isComposing) { event.preventDefault(); close(true); } });
  control.addEventListener('focusout', event => { if (!control.contains(event.relatedTarget)) close(); });
  document.addEventListener('pointerdown', event => { if (!control.contains(event.target)) close(); });
  document.addEventListener('keydown', event => {
    if (!event.isComposing && !event.defaultPrevented && !event.altKey && !event.shiftKey && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault(); if (!control.contains(document.activeElement)) invoker = document.activeElement;
      input.focus({ preventScroll: true }); open();
    }
  });
  function setIndex(index) { const next = api.createMarkdownSearcher(index); searcher = next; previous = undefined; update(); }
  const payload = Object.entries(globalThis.pFlowDocuments || {}).flatMap(([bundleId, documents]) => Object.entries(documents || {}).map(([path, markdown]) => ({ bundleId, path, markdown })));
  setIndex(globalThis.pFlowSearchIndex || api.buildMarkdownSearchIndex(payload));
  api.search = { setIndex };
}());
