/* Safe native-DOM rendering for the small M1-03 Markdown profile. No HTML evaluation. */
globalThis.pFlow = globalThis.pFlow || {};
(function () {
  function resolveDocumentTarget(currentPath, target) {
    if (typeof target !== 'string' || /[\\\s?%]/.test(target) || /^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('/')) throw new Error('Unsupported documentation target.');
    const parts = target.split('#');
    if (parts.length > 2 || (parts.length === 2 && !/^(entry|flow|node|edge)_[A-Za-z0-9_-]+$/.test(parts[1]))) throw new Error('Invalid documentation section identifier.');
    const file = parts[0];
    const path = file ? currentPath.split('/').slice(0, -1) : [];
    if (!file) path.push(...currentPath.split('/'));
    else for (const segment of file.split('/')) {
      if (segment === '..') { if (!path.length) throw new Error('Documentation target escapes its bundle.'); path.pop(); }
      else if (segment && segment !== '.') path.push(segment);
    }
    const normalized = path.join('/');
    if (!normalized.endsWith('.md')) throw new Error('Documentation must reference a Markdown file.');
    return { path: normalized, ...(parts.length === 2 ? { anchor: parts[1] } : {}) };
  }
  function renderContractMarkdown(markdown, { path, sources, onDocument = () => {}, onSource = () => {}, document = globalThis.document }) {
    const root = document.createElement('div'); root.className = 'markdown-body';
    const sections = new Map(), headings = [], stack = [], definitions = new Set();
    const sourceMap = new Map(sources.map(source => [source.id, source]));
    const parent = () => stack.at(-1)?.element || root;
    const button = (label, action, className) => {
      const item = document.createElement('button'); item.type = 'button'; item.className = className; item.textContent = label; item.addEventListener('click', action); return item;
    };
    function citation(id) {
      const source = sourceMap.get(id);
      if (!source) { const missing = document.createElement('span'); missing.textContent = `[${id}: reference unavailable]`; return missing; }
      const item = button(id, () => onSource(id), 'markdown-link source-link'); item.setAttribute('data-source-id', id); item.title = globalThis.pFlow.sourceLocation(source); item.setAttribute('aria-label', `Inspect evidence ${item.title}`); return item;
    }
    function inline(container, text) {
      const pattern = /`([^`]+)`|\[([^\]\n]+)\]\(([^)\s]+)\)|\[(src_[A-Za-z0-9_-]+)\]|\*\*([^*]+)\*\*|(?<![\p{L}\p{N}_])__([^_]+)__(?![\p{L}\p{N}_])|\*([^*]+)\*|(?<![\p{L}\p{N}_])_([^_]+)_(?![\p{L}\p{N}_])/gu;
      let cursor = 0;
      for (const match of text.matchAll(pattern)) {
        container.append(document.createTextNode(text.slice(cursor, match.index)));
        if (match[1] !== undefined) { const code = document.createElement('code'); code.textContent = match[1]; container.append(code); }
        else if (match[2] !== undefined) {
          try { const target = resolveDocumentTarget(path, match[3]); const link = button(match[2], () => onDocument(target), 'markdown-link'); link.setAttribute('data-document-path', target.path); if (target.anchor) link.setAttribute('data-document-section', target.anchor); container.append(link); }
          catch { const blocked = document.createElement('span'); blocked.textContent = match[2]; blocked.title = 'Unsupported documentation link'; container.append(blocked); }
        } else if (match[4]) container.append(citation(match[4]));
        else { const emphasis = document.createElement(match[5] || match[6] ? 'strong' : 'em'); emphasis.textContent = match[5] || match[6] || match[7] || match[8]; container.append(emphasis); }
        cursor = match.index + match[0].length;
      }
      container.append(document.createTextNode(text.slice(cursor)));
    }
    const lines = markdown.split(/\r?\n/);
    let pending, fence, code = [], paragraph = [], list;
    const flush = () => { if (paragraph.length) { const p = document.createElement('p'); inline(p, paragraph.join(' ')); parent().append(p); paragraph = []; } list = undefined; };
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i], trim = line.trim();
      const fenced = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
      if (fence) {
        if (fenced && fenced[1][0] === fence[0] && fenced[1].length >= fence.length && !fenced[2].trim()) {
          const pre = document.createElement('pre'), content = document.createElement('code'); content.textContent = code.join('\n'); pre.append(content); parent().append(pre); code = []; fence = undefined;
        } else code.push(line);
        continue;
      }
      if (fenced) { flush(); fence = fenced[1]; continue; }
      const anchor = line.match(/^<a id="((?:entry|flow|node|edge)_[A-Za-z0-9_-]+)"><\/a>$/);
      if (anchor) { flush(); if (pending) throw new Error('Section anchor has no heading.'); pending = anchor[1]; continue; }
      if (!trim) { flush(); continue; }
      const heading = line.match(/^(#{1,6})\s+(.+)$/);
      if (pending && !heading) throw new Error('Section anchor has no heading.');
      if (heading) {
        flush(); const level = heading[1].length;
        while (stack.length && stack.at(-1).level >= level) stack.pop();
        if (pending) {
          if (sections.has(pending)) throw new Error(`Ambiguous duplicate Markdown section: ${pending}.`);
          const section = document.createElement('section'); section.id = pending; section.className = 'markdown-section'; section.tabIndex = -1;
          parent().append(section); sections.set(pending, section); stack.push({ level, element: section });
        }
        const h = document.createElement(`h${level}`); inline(h, heading[2]); parent().append(h);
        if (pending) headings.push({ id: pending, label: h.textContent });
        pending = undefined; continue;
      }
      const definition = line.match(/^\[(src_[A-Za-z0-9_-]+)\]:\s+\S+\s*$/);
      if (definition) {
        flush(); const key = definition[1].toLowerCase();
        if (definitions.has(key)) throw new Error(`Ambiguous source definition: ${definition[1]}.`);
        definitions.add(key);
        const item = document.createElement('p'); item.className = 'markdown-source-reference'; item.append(citation(definition[1]));
        const source = sourceMap.get(definition[1]); if (source) item.append(document.createTextNode(` — ${globalThis.pFlow.sourceLocation(source)}`)); parent().append(item); continue;
      }
      if (/^\|.+\|$/.test(trim) && /^\|[\s:|-]+\|$/.test(lines[i + 1]?.trim() || '')) {
        flush(); const table = document.createElement('table');
        const addRow = (text, tag) => { const row = document.createElement('tr'); for (const cell of text.trim().slice(1, -1).split('|')) { const item = document.createElement(tag); inline(item, cell.trim()); row.append(item); } table.append(row); };
        addRow(line, 'th'); i++;
        while (/^\|.+\|$/.test(lines[i + 1]?.trim() || '')) addRow(lines[++i], 'td');
        parent().append(table); continue;
      }
      const bullet = line.match(/^\s*(?:[-*+]|\d+[.)])\s+(.+)$/);
      if (bullet) {
        if (paragraph.length) flush();
        if (!list) { list = document.createElement(/^\s*\d/.test(line) ? 'ol' : 'ul'); parent().append(list); }
        const item = document.createElement('li'); inline(item, bullet[1]); list.append(item); continue;
      }
      list = undefined; paragraph.push(trim);
    }
    flush(); if (pending) throw new Error('Section anchor has no heading.'); if (fence) throw new Error('Unclosed fenced Markdown block.');
    return { root, sections, headings };
  }
  function hydrateContractMarkdown(html, { sources, onDocument, onSource }) {
    const tags = new Set(['DIV', 'SECTION', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P', 'UL', 'OL', 'LI', 'PRE', 'CODE', 'STRONG', 'EM', 'TABLE', 'TR', 'TH', 'TD', 'BUTTON', 'SPAN']);
    // Builder text escapes '<'. Reject unsupported tag tokens before browser parsing.
    for (const match of html.matchAll(/<\/?([A-Za-z][A-Za-z0-9:-]*)\b/g)) if (!tags.has(match[1].toUpperCase())) throw new Error('Unsafe embedded Markdown element.');
    const inert = document.implementation.createHTMLDocument('');
    const template = inert.createElement('template'); template.innerHTML = html;
    const root = template.content.firstElementChild;
    if (template.content.childElementCount !== 1 || root?.tagName !== 'DIV' || root.className !== 'markdown-body') throw new Error('Invalid embedded Markdown fragment.');
    const attributes = new Set(['class', 'id', 'tabindex', 'type', 'title', 'aria-label', 'data-document-path', 'data-document-section', 'data-source-id']);
    const sections = new Map(), headings = [], sourceIds = new Set(sources.map(source => source.id));
    for (const node of [root, ...root.querySelectorAll('*')]) {
      if (!tags.has(node.tagName) || [...node.attributes].some(attr => !attributes.has(attr.name))) throw new Error('Unsafe embedded Markdown element or attribute.');
      if (node.hasAttribute('id')) {
        if (node.tagName !== 'SECTION' || !/^(entry|flow|node|edge)_[A-Za-z0-9_-]+$/.test(node.id) || sections.has(node.id)) throw new Error('Invalid or duplicate embedded Markdown section.');
        sections.set(node.id, node); headings.push({ id: node.id, label: node.firstElementChild?.textContent || node.id });
      }
      if (node.tagName === 'BUTTON') {
        node.type = 'button';
        if (node.hasAttribute('data-document-path') && !node.hasAttribute('data-source-id')) {
          const target = resolveDocumentTarget('', node.dataset.documentPath + (node.dataset.documentSection ? `#${node.dataset.documentSection}` : ''));
          node.addEventListener('click', () => onDocument(target));
        } else if (sourceIds.has(node.dataset.sourceId) && !node.hasAttribute('data-document-path')) node.addEventListener('click', () => onSource(node.dataset.sourceId));
        else throw new Error('Invalid embedded Markdown control.');
      }
    }
    document.adoptNode(root);
    return { root, sections, headings };
  }
  Object.assign(globalThis.pFlow, { resolveDocumentTarget, renderContractMarkdown, hydrateContractMarkdown });
}());
