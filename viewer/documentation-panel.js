/* Offline document and source-reference presentation; never reads source files. */
globalThis.pFlow = globalThis.pFlow || {};
globalThis.pFlow.createDocumentationPanel = function createDocumentationPanel({ showTab, onSelectSection = () => {}, onOpenDetail = () => {} }) {
  const byId = id => document.getElementById(id);
  let sample, flow, selected, references = [], sourceIds = [], currentTarget, currentView, markedSection, flashTimer;
  const sources = () => sample?.architecture.sources || [];
  const documents = () => globalThis.pFlowDocuments?.[sample?.key] || {};
  const location = source => globalThis.pFlow.sourceLocation(source);
  function reveal() {
    if (!currentTarget?.isConnected || byId('view-documentation').hidden) return;
    const article = byId('document-article');
    article.scrollTop += currentTarget.getBoundingClientRect().top - article.getBoundingClientRect().top - 10;
    const outline = byId('document-outline'), active = outline.querySelector('[aria-current]');
    if (active) {
      const item = active.getBoundingClientRect(), panel = outline.getBoundingClientRect();
      if (item.bottom > panel.bottom) outline.scrollTop += item.bottom - panel.bottom;
      else if (item.top < panel.top) outline.scrollTop -= panel.top - item.top;
    }
  }
  function renderSource() {
    const source = sources().find(item => item.id === byId('source-picker').value);
    const pairs = source ? [['Path', source.path], ...(source.startLine ? [['Lines', source.startLine === source.endLine ? String(source.startLine) : `${source.startLine}–${source.endLine}`]] : []), ...(source.symbol ? [['Symbol', source.symbol]] : [])] : [];
    byId('source-fields').replaceChildren(...pairs.flatMap(([key, value]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = value; return [dt, dd]; }));
    const content = globalThis.pFlowContent?.[sample?.key];
    const snippet = source && content?.snippets?.find(item => item.sourceIds.includes(source.id));
    const list = byId('source-snippet'); list.replaceChildren(); list.hidden = !snippet;
    if (snippet) for (const line of snippet.lines) {
      const row = document.createElement('li'); row.value = line.number;
      const code = document.createElement('code'); code.textContent = line.text; row.append(code); list.append(row);
    }
    if (snippet?.lines.length) list.start = snippet.lines[0].number;
    byId('source-unavailable').hidden = Boolean(snippet);
    byId('source-unavailable').textContent = content?.diagnostics?.find(issue => issue.path === source?.id)?.message || (source ? 'Evidence text is not embedded in this artifact. Only the recorded location is available.' : 'No evidence reference is available for this context.');
  }
  function populateSources(selectedId) {
    byId('source-picker').replaceChildren(...sourceIds.map(id => sources().find(source => source.id === id)).filter(Boolean).map(source => { const option = document.createElement('option'); option.value = source.id; option.textContent = location(source); return option; }));
    byId('source-picker').disabled = !byId('source-picker').options.length;
    if (selectedId) byId('source-picker').value = selectedId;
    renderSource();
  }
  function openSource(id) {
    globalThis.pFlow.layout.reveal('right');
    if (!sources().some(source => source.id === id)) return;
    if (!sourceIds.includes(id)) sourceIds.push(id);
    populateSources(id); showTab('source');
    byId('source-picker').focus({ preventScroll: true });
    byId('view-source').scrollTop = 0;
    byId('view-source').scrollIntoView({ block: 'nearest' });
  }
  function prepareSearch(nextSample, reference) {
    const target = globalThis.pFlow.resolveDocumentTarget('', reference.path + (reference.anchor ? `#${reference.anchor}` : ''));
    const bundle = globalThis.pFlowDocuments?.[nextSample.key] || {};
    if (!Object.hasOwn(bundle, target.path) || typeof bundle[target.path] !== 'string') throw new Error(`Markdown document is not embedded: ${target.path}.`);
    const processed = globalThis.pFlowContent?.[nextSample.key]?.documents[target.path];
    const reusable = currentView?.sample === nextSample && currentView.path === target.path && currentView.markdown === bundle[target.path] && currentView.html === processed?.html;
    const options = { path: target.path, sources: nextSample.architecture.sources, onDocument: openDocument, onSource: openSource };
    const rendered = reusable ? currentView.rendered : processed
      ? globalThis.pFlow.hydrateContractMarkdown(processed.html, options)
      : globalThis.pFlow.renderContractMarkdown(bundle[target.path], options);
    if (target.anchor && !rendered.sections.has(target.anchor)) throw new Error(`Markdown section ${target.anchor} was not found in ${target.path}.`);
    return { target, rendered, markdown: bundle[target.path], html: processed?.html };
  }
  function clearSearchHighlights() {
    for (const mark of byId('document-body').querySelectorAll('mark.search-match')) mark.replaceWith(document.createTextNode(mark.textContent));
    byId('document-body').normalize();
  }
  function highlightSearch(rendered, reference, query) {
    const scope = reference.anchor ? rendered.sections.get(reference.anchor) : rendered.root;
    const terms = globalThis.pFlow.searchTerms(query);
    let firstBody, firstHeading;
    // Match across inline formatting, while excluding child canonical sections and source UI.
    for (const block of scope.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,th,td')) {
      const section = block.closest('.markdown-section');
      if (reference.anchor ? section !== scope : section !== null) continue;
      if (block.closest('pre,.markdown-source-reference')) continue;
      const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, {
        acceptNode: node => node.parentElement.closest('.source-link,.markdown-source-reference,pre') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      const nodes = []; let text = '', node;
      while ((node = walker.nextNode())) { nodes.push({ node, start: text.length }); text += node.textContent; }
      const ranges = globalThis.pFlow.searchHighlightRanges(text, terms);
      for (const { node, start } of nodes) {
        const value = node.textContent, fragment = document.createDocumentFragment(); let offset = 0;
        for (const range of ranges) {
          const left = Math.max(0, range.start - start), right = Math.min(value.length, range.end - start);
          if (left >= right) continue;
          fragment.append(document.createTextNode(value.slice(offset, left)));
          const mark = document.createElement('mark'); mark.className = 'search-match'; mark.textContent = value.slice(left, right); fragment.append(mark);
          if (/^H[1-6]$/.test(block.tagName)) firstHeading ||= mark; else firstBody ||= mark;
          offset = right;
        }
        if (offset) { fragment.append(document.createTextNode(value.slice(offset))); node.replaceWith(fragment); }
      }
    }
    currentTarget = firstBody || firstHeading || scope;
    currentTarget.tabIndex = -1;
  }
  function openSearch(nextSample, reference, query, prepared) {
    if (sample?.key !== nextSample.key) setContext(nextSample, undefined, undefined);
    openDocument(reference, prepared);
    byId('document-context').textContent = `Search result: ${nextSample.title} · ${reference.path}`;
    byId('document-context').title = byId('document-context').textContent;
    highlightSearch(prepared.rendered, reference, query);
    currentTarget.focus({ preventScroll: true });
    // Reveal the document panel when it stacks below the diagram, then scroll only its article.
    byId('document-article').scrollIntoView({ block: 'nearest' });
    reveal(); requestAnimationFrame(reveal);
  }
  function markSection(id, { move = true, flash = false } = {}) {
    clearTimeout(flashTimer); markedSection?.classList.remove('doc-flash');
    const rendered = currentView?.rendered;
    if (!rendered) return;
    for (const section of rendered.sections.values()) section.classList.toggle('doc-target', section.id === id);
    currentTarget = rendered.sections.get(id); markedSection = currentTarget;
    for (const button of byId('document-outline').querySelectorAll('button')) {
      if (button.dataset.sectionId === id) button.setAttribute('aria-current', 'location'); else button.removeAttribute('aria-current');
    }
    if (flash && currentTarget) { currentTarget.classList.add('doc-flash'); flashTimer = setTimeout(() => markedSection?.classList.remove('doc-flash'), 1600); }
    if (move) reveal();
  }
  function activateSection(id, expand = false) {
    if (!currentView?.associations.has(id)) return false;
    const { association, notice } = globalThis.pFlow.resolveDocumentAssociation(sample.architecture, {path:currentView.path,anchor:id}, currentView.rendered);
    if (!association || !['node','edge'].includes(association.type)) { byId('document-status').textContent = notice || 'This section no longer maps to a diagram element.'; return false; }
    const hadFocus = currentView.rendered.sections.get(id).contains(document.activeElement);
    clearSearchHighlights(); byId('document-status').textContent = '';
    markSection(id, { move: false, flash: true });
    if (expand) onOpenDetail(sample, association); else onSelectSection(sample, association);
    if (hadFocus && !byId('document-article').contains(document.activeElement)) {
      (currentView?.rendered.sections.get(id)?.querySelector('.section-locate') || byId('document-article')).focus({ preventScroll: true });
    }
    return true;
  }
  function decorateSections() {
    const view = currentView;
    for (const actions of view.actions || []) actions.remove();
    view.actions = []; view.associations = new Map();
    for (const [id, section] of view.rendered.sections) {
      const { association } = globalThis.pFlow.resolveDocumentAssociation(sample.architecture, { path: view.path, anchor: id }, view.rendered);
      if (!association || !['node', 'edge'].includes(association.type)) continue;
      view.associations.set(id, association);
      const actions = document.createElement('div'); actions.className = 'section-actions';
      const locate = document.createElement('button'); locate.type = 'button'; locate.className = 'section-locate'; locate.dataset.sectionAction = 'locate'; locate.dataset.sectionId = id;
      locate.textContent = 'Locate in diagram'; locate.setAttribute('aria-label', `Locate ${association.type} ${association.entity.label || association.entity.kind} in diagram (${id})`); actions.append(locate);
      if (association.type === 'node' && sample.architecture.flows.some(item => item.id === association.entity.expandFlowId)) {
        const expand = document.createElement('button'); expand.type = 'button'; expand.className = 'section-expand'; expand.dataset.sectionAction = 'expand'; expand.dataset.sectionId = id;
        expand.textContent = 'Open detail'; expand.setAttribute('aria-label', `Open detail for ${association.entity.label}`); actions.append(expand);
      }
      section.firstElementChild.after(actions);
      view.actions.push(actions);
    }
  }
  byId('document-body').addEventListener('click', event => {
    const action = event.target.closest('button[data-section-action]');
    if (action) { activateSection(action.dataset.sectionId, action.dataset.sectionAction === 'expand'); return; }
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.target.closest('button,a,input,select,textarea,pre') || document.getSelection()?.toString()) return;
    const section = event.target.closest('.markdown-section');
    if (section) activateSection(section.id);
  });
  function renderDocument(reference, prepared) {
    const body = byId('document-body'), outline = byId('document-outline');
    clearTimeout(flashTimer); markedSection?.classList.remove('doc-flash');
    currentTarget = undefined; byId('document-status').textContent = ''; byId('document-reference').textContent = '';
    if (!reference) { body.replaceChildren(); outline.replaceChildren(); currentView = undefined; byId('document-status').textContent = 'No Markdown documentation is associated with this context.'; return; }
    try {
      const next = prepared || prepareSearch(sample, reference), { target, rendered } = next;
      byId('document-reference').textContent = target.path + (target.anchor ? `#${target.anchor}` : '');
      if (currentView?.rendered !== rendered) {
        body.replaceChildren(rendered.root); outline.replaceChildren();
        currentView = { sample, path: target.path, markdown: next.markdown, html: next.html, rendered };
        for (const heading of rendered.headings) {
          const button = document.createElement('button'); button.type = 'button'; button.textContent = heading.label; button.dataset.sectionId = heading.id;
          button.addEventListener('click', () => {
            clearSearchHighlights(); byId('document-status').textContent = '';
            markSection(heading.id); activateSection(heading.id);
          }); outline.append(button);
        }
      }
      decorateSections();
      clearSearchHighlights();
      if (target.anchor) markSection(target.anchor, { move: false });
      else { for (const section of rendered.sections.values()) section.classList.remove('doc-target'); byId('document-article').scrollTop = 0; }
      requestAnimationFrame(reveal);
    } catch (error) { body.replaceChildren(); outline.replaceChildren(); currentView = undefined; byId('document-status').textContent = error.message; byId('document-article').scrollTop = 0; }
  }
  function locateSelection() {
    const entity = selected?.entity;
    clearSearchHighlights();
    if (!entity) {
      const reference = flow?.docs?.find(ref => ref.anchor === flow.id) || flow?.docs?.[0];
      byId('document-reference').textContent = reference ? reference.path + (reference.anchor ? '#' + reference.anchor : '') : '';
      markSection(flow?.id, { move: false }); return;
    }
    const canonical = entity.docs?.find(ref => ref.anchor === entity.id);
    let notice = 'No element documentation link. Showing Flow documentation';
    if (canonical && selected.ownerFlow?.id === flow?.id) {
      try {
        const reference = globalThis.pFlow.resolveDocumentTarget('', canonical.path + '#' + canonical.anchor);
        if (reference.path !== currentView?.path) notice = 'The element section is outside the current Flow document. Showing Flow documentation';
        else if (!currentView.rendered.sections.has(reference.anchor)) notice = `Markdown section ${entity.id} was not found in ${reference.path}. Showing Flow documentation`;
        else {
          const { association, notice: invalid } = globalThis.pFlow.resolveDocumentAssociation(sample.architecture, reference, currentView.rendered);
          if (association?.entity === entity && association.flowId === flow?.id) {
            byId('document-status').textContent = '';
            byId('document-reference').textContent = reference.path + '#' + entity.id;
            markSection(entity.id, { flash: true }); return;
          }
          notice = invalid || notice;
        }
      } catch (error) { notice = error.message; }
    } else if (selected.remote) notice = 'The selected target belongs to another Flow. Showing current Flow documentation';
    byId('document-status').textContent = notice + '.';
    byId('document-reference').textContent = currentView?.path ? currentView.path + (flow?.id ? '#' + flow.id : '') : '';
    markSection(flow?.id, { move: false });
  }
  function openDocument(reference, prepared) {
    globalThis.pFlow.layout.reveal('right');
    let index = references.findIndex(item => item.path === reference.path && item.anchor === reference.anchor);
    if (index < 0) { references.push(reference); index = references.length - 1; populateDocuments(); }
    byId('document-picker').value = String(index);
    byId('document-context').textContent = 'Linked documentation; the diagram context is unchanged.';
    byId('document-context').title = byId('document-context').textContent;
    showTab('documentation'); renderDocument(reference, prepared);
  }
  function populateDocuments() {
    byId('document-picker').replaceChildren(...references.map((ref, index) => { const option = document.createElement('option'); option.value = String(index); option.textContent = ref.path + (ref.anchor ? `#${ref.anchor}` : ''); return option; }));
    byId('document-picker').disabled = references.length === 0;
  }
  function setContext(nextSample, nextFlow, nextSelection, refresh = false, locate = true) {
    sample = nextSample; flow = nextFlow; selected = nextSelection;
    const entity = selected?.entity || flow;
    const sameProcess = currentView?.sample === sample && currentView.path === (flow?.docs?.find(ref => ref.anchor === flow.id) || flow?.docs?.[0])?.path && currentView.markdown === documents()[currentView.path] && currentView.html === globalThis.pFlowContent?.[sample?.key]?.documents[currentView.path]?.html;
    references = [...(flow?.docs || [])];
    const canonical = references.findIndex(ref => ref.anchor === flow?.id);
    if (canonical > 0) references.unshift(references.splice(canonical, 1)[0]);
    byId('document-context').textContent = selected ? `${entity.label || entity.kind} · ${flow?.label || 'Process'}` : flow ? `Flow documentation: ${flow.label}.` : 'Architecture documentation';
    byId('document-context').title = byId('document-context').textContent;
    populateDocuments();
    if (!sameProcess || refresh) renderDocument(references[0]);
    if (locate && currentView) locateSelection();
    if (selected && byId('document-status').textContent) byId('document-context').textContent = byId('document-status').textContent;
    const previousSource = byId('source-picker').value;
    const evidence = selected ? globalThis.pFlow.evidenceIds(entity) : flow ? [...(flow.nodes || []), ...(flow.edges || [])].flatMap(globalThis.pFlow.evidenceIds) : [];
    sourceIds = [...new Set(evidence)]; populateSources(sourceIds.includes(previousSource) ? previousSource : undefined);
    byId('summary-title').textContent = flow?.label || 'No process flow';
    const pairs = flow ? [['Nodes', flow.nodes.length], ['Relationships', flow.edges.length], ['Branches', flow.edges.filter(edge => edge.kind === 'branch').length]] : [];
    byId('flow-summary').replaceChildren(...pairs.flatMap(([key, value]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = String(value); return [dt, dd]; }));
    byId('summary-exits').replaceChildren(...(flow?.nodes.filter(node => node.kind === 'terminal') || []).map(node => { const li = document.createElement('li'); li.textContent = node.label; return li; }));
    byId('summary-exits').previousElementSibling.hidden = !byId('summary-exits').children.length;
    const facts = [['Model', sample.architecture.modelVersion], ...(flow ? [['Flow', flow.label]] : []), ...(selected ? [['Selected ID', selected.entity.id]] : [])];
    byId('artifact-facts').replaceChildren(...facts.flatMap(([key, value]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = value; return [dt, dd]; }));
    if (locate && selected) reveal();
  }
  byId('source-picker').addEventListener('change', renderSource);
  byId('document-picker').addEventListener('change', () => renderDocument(references[Number(byId('document-picker').value)]));
  return { setContext, openSource, openDocument, reveal, prepareSearch, openSearch };
};
