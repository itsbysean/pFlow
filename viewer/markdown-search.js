/* Pure, serializable search over raw M1-03 Markdown. No graph or DOM dependency. */
globalThis.pFlow = globalThis.pFlow || {};
(function () {
  const compare = (a, b) => a < b ? -1 : a > b ? 1 : 0;
  const fold = text => Array.from(text.normalize('NFKC'), char => char.toUpperCase().toLowerCase()).join('');
  const tokens = text => [...new Set(fold(text).match(/[\p{L}\p{M}\p{N}_]+/gu) || [])];
  const phrase = text => fold(text).trim().replace(/\s+/g, ' ');
  const segments = text => typeof Intl.Segmenter === 'function'
    ? [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)].map(item => ({ text: item.segment, start: item.index, end: item.index + item.segment.length }))
    : Array.from(text).reduce((items, char) => { const start = items.at(-1)?.end || 0; items.push({ text: char, start, end: start + char.length }); return items; }, []);

  function plainInline(text) {
    return text.split(/(`[^`]+`)/g).map(part => {
      if (part.startsWith('`') && part.endsWith('`')) return part.slice(1, -1);
      return part.replace(/<\/?[A-Za-z][^>]*>/g, ' ')
        .replace(/!?\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/\[(src_[A-Za-z0-9_-]+)\]/g, '')
        .replace(/\[([^\]]+)\]\[[^\]]*\]/g, '$1')
        .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, (_, strong, underscore) => strong || underscore)
        .replace(/(^|\s)[*_]([^*_]+)[*_](?=\s|[.,;:!?]|$)/g, '$1$2')
        .replace(/\\([\\`*_[\]{}()#+.!>|~-])/g, '$1');
    }).join('').replace(/\s+/g, ' ').trim();
  }

  function extract(markdown) {
    // M1-03 excludes embedded HTML other than literal anchors. Never index executable blocks.
    const lines = markdown.replace(/<!--[\s\S]*?-->/g, '').replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '').split(/\r?\n/);
    const records = new Map(), stack = [];
    let title = '', pending, fence, current;
    const record = id => {
      if (!records.has(id)) records.set(id, { sectionId: id, headings: [], parts: [], ordinal: records.size });
      return records.get(id);
    };
    current = record(null);
    for (const line of lines) {
      const fenced = line.match(/^\s{0,3}(`{3,}|~{3,})(.*)$/);
      if (fence) { if (fenced && fenced[1][0] === fence[0] && fenced[1].length >= fence.length && !fenced[2].trim()) fence = undefined; continue; }
      if (fenced) { fence = fenced[1]; continue; }
      const anchor = line.match(/^<a id="((?:entry|flow|node|edge)_[A-Za-z0-9_-]+)"><\/a>$/);
      if (anchor) { pending = anchor[1]; continue; }
      if (/^\s*\[[^\]]+\]:/.test(line) || /^\s*\|?[\s:|-]+\|?\s*$/.test(line) || !line.trim()) continue;
      const heading = line.match(/^(#{1,6})\s+(.+?)(?:\s+#+)?\s*$/);
      if (heading) {
        const level = heading[1].length, label = plainInline(heading[2]);
        while (stack.length && stack.at(-1).level >= level) stack.pop();
        if (pending) { stack.push({ level, id: pending }); pending = undefined; }
        current = record(stack.at(-1)?.id || null);
        if (label && !current.headings.includes(label)) current.headings.push(label);
        if (level === 1 && !title) title = label;
        continue;
      }
      pending = undefined;
      const prose = plainInline(line.replace(/^\s*(?:[-*+]|\d+[.)])\s+/, '').replace(/^\s*>\s?/, '').replace(/^\s*\||\|\s*$/g, '').replace(/\|/g, ' '));
      if (prose) current.parts.push(prose);
    }
    return { title, records: [...records.values()].map(item => ({ sectionId: item.sectionId, headings: item.headings, text: [...new Set(item.parts)].join(' '), ordinal: item.ordinal })).filter(item => item.text || item.headings.length) };
  }

  function buildMarkdownSearchIndex(payload) {
    const documents = [], sections = [], postings = Object.create(null), unique = new Map();
    for (const item of payload || []) {
      if (!item || typeof item.bundleId !== 'string' || typeof item.path !== 'string' || !item.path.endsWith('.md') || typeof item.markdown !== 'string' || !item.markdown.trim()) continue;
      const key = JSON.stringify([item.bundleId, item.path]);
      if (unique.has(key) && unique.get(key).markdown !== item.markdown) throw new Error(`Conflicting Markdown content: ${item.bundleId}/${item.path}.`);
      unique.set(key, item);
    }
    const ordered = [...unique.values()].sort((a, b) => compare(a.bundleId, b.bundleId) || compare(a.path, b.path));
    function post(text, field, id) {
      for (const token of tokens(text)) {
        if (!Object.hasOwn(postings, token)) postings[token] = { title: [], heading: [], body: [] };
        postings[token][field].push(id);
      }
    }
    for (const item of ordered) {
      const parsed = extract(item.markdown);
      if (!parsed.records.length) continue;
      const document = documents.length;
      documents.push({ bundleId: item.bundleId, path: item.path, title: parsed.title });
      post(parsed.title, 'title', document);
      for (const record of parsed.records) {
        const id = sections.length; sections.push({ document, ...record });
        post(record.headings.join(' '), 'heading', id); post(record.text, 'body', id);
      }
    }
    return { version: 1, documents, sections, postings };
  }

  function searchHighlightRanges(text, terms) {
    const units = segments(text), starts = [], ends = [];
    let normalized = '';
    for (const unit of units) {
      const part = fold(unit.text); normalized += part;
      for (let i = 0; i < part.length; i++) { starts.push(unit.start); ends.push(unit.end); }
    }
    const ranges = [];
    for (const term of terms) {
      if (!term) continue;
      let at = normalized.indexOf(term);
      while (at !== -1) { ranges.push({ start: starts[at], end: ends[at + term.length - 1] }); at = normalized.indexOf(term, at + 1); }
    }
    ranges.sort((a, b) => a.start - b.start || a.end - b.end);
    const merged = [];
    for (const range of ranges) {
      if (merged.length && range.start <= merged.at(-1).end) merged.at(-1).end = Math.max(merged.at(-1).end, range.end);
      else merged.push({ ...range });
    }
    return merged;
  }
  function preview(text, terms) {
    if (text.length <= 180) return text;
    const first = searchHighlightRanges(text, terms)[0]?.start || 0;
    let start = Math.max(0, first - 45), end = Math.min(text.length, start + 180);
    if (start) { const space = text.lastIndexOf(' ', start); if (space >= start - 20) start = space + 1; }
    const units = segments(text);
    start = units.findLast(unit => unit.start <= start)?.start || 0;
    end = units.find(unit => unit.end >= end)?.end || text.length;
    return `${start ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
  }

  function createMarkdownSearcher(index) {
    if (index?.version !== 1 || !Array.isArray(index.documents) || !Array.isArray(index.sections) || !index.postings || typeof index.postings !== 'object') throw new Error('Unsupported or invalid search index.');
    if (!index.documents.every(doc => doc && typeof doc.bundleId === 'string' && typeof doc.path === 'string' && typeof doc.title === 'string')
      || !index.sections.every(section => section && Number.isInteger(section.document) && index.documents[section.document] && (section.sectionId === null || typeof section.sectionId === 'string') && Array.isArray(section.headings) && section.headings.every(item => typeof item === 'string') && typeof section.text === 'string' && Number.isInteger(section.ordinal))) throw new Error('Invalid search document or section metadata.');
    const vocabulary = Object.keys(index.postings).sort(compare), byDocument = index.documents.map(() => []);
    for (const token of vocabulary) for (const field of ['title', 'heading', 'body']) {
      const values = index.postings[token]?.[field], maximum = field === 'title' ? index.documents.length : index.sections.length;
      if (!Array.isArray(values) || !values.every(id => Number.isInteger(id) && id >= 0 && id < maximum)) throw new Error('Invalid search postings.');
    }
    index.sections.forEach((section, id) => byDocument[section.document].push(id));
    const normalizedTitles = index.documents.map(doc => phrase(doc.title));
    return {
      documentCount: index.documents.length,
      search(query, limit = 20) {
        const terms = tokens(String(query)), normalizedQuery = phrase(String(query));
        if (!terms.length) return { total: 0, documents: 0, results: [] };
        let candidates;
        for (const term of terms) {
          const matches = new Map();
          const hit = (id, mask) => matches.set(id, (matches.get(id) || 0) | mask);
          for (const token of vocabulary) if (token.includes(term)) {
            const entry = index.postings[token];
            for (const doc of entry.title) for (const section of byDocument[doc]) hit(section, 1);
            for (const section of entry.heading) hit(section, 2);
            for (const section of entry.body) hit(section, 4);
          }
          if (!candidates) candidates = new Map([...matches].map(([id, mask]) => [id, [mask]]));
          else for (const [id, masks] of candidates) { if (!matches.has(id)) candidates.delete(id); else masks.push(matches.get(id)); }
          if (!candidates.size) break;
        }
        const ranked = [];
        for (const [id, masks] of candidates || []) {
          const section = index.sections[id], doc = index.documents[section.document];
          const own = masks.some(mask => mask & 6);
          const titleRecord = byDocument[section.document][0];
          if (!own && id !== titleRecord) continue;
          const headingHits = masks.filter(mask => mask & 2).length, bodyHits = masks.filter(mask => mask & 4).length;
          const exactTitle = id === titleRecord && normalizedTitles[section.document] === normalizedQuery;
          const headings = section.headings.map((text, ordinal) => ({ text, ordinal, count: terms.filter(term => fold(text).includes(term)).length, exact: phrase(text) === normalizedQuery }));
          headings.sort((a, b) => Number(b.exact) - Number(a.exact) || b.count - a.count || a.ordinal - b.ordinal);
          ranked.push({ id, doc, section, heading: headings[0]?.text || '', category: exactTitle ? 0 : headingHits ? 1 : 2, exactHeading: Number(headings[0]?.exact || false), headingHits, bodyHits });
        }
        ranked.sort((a, b) => a.category - b.category || b.exactHeading - a.exactHeading || b.headingHits - a.headingHits || b.bodyHits - a.bodyHits || compare(a.doc.bundleId, b.doc.bundleId) || compare(a.doc.path, b.doc.path) || a.section.ordinal - b.section.ordinal);
        const results = ranked.slice(0, Math.max(0, limit)).map(item => {
          const excerpt = preview(item.section.text, terms);
          const title = item.doc.title || item.doc.path;
          return { bundleId: item.doc.bundleId, path: item.doc.path, sectionId: item.section.sectionId, title, heading: item.heading, preview: excerpt, category: ['title', 'heading', 'body'][item.category], highlights: { title: searchHighlightRanges(title, terms), heading: searchHighlightRanges(item.heading, terms), preview: searchHighlightRanges(excerpt, terms) } };
        });
        return { total: ranked.length, documents: new Set(ranked.map(item => item.section.document)).size, results };
      },
    };
  }
  Object.assign(globalThis.pFlow, { buildMarkdownSearchIndex, createMarkdownSearcher, searchHighlightRanges, searchTerms: tokens });
}());
