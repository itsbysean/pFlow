/* Viewer initialization, navigation, and one ID-based node/edge selection. */
globalThis.pFlow = globalThis.pFlow || {};
(function () {
  const byId = id => document.getElementById(id);
  const setText = (id, text) => { byId(id).textContent = text; };
  let currentSample, navigation, selection;
  const documentation = globalThis.pFlow.createDocumentationPanel({
    showTab: name => showTab(byId(`tab-${name}`)),
    onSelectSection: (sample, association) => activateDocumentSection(sample, association),
    onOpenDetail: (sample, association) => { showAssociation(sample, association); navigate(() => navigation.openDetail(association.entity.id)); },
  });
  const inspector = globalThis.pFlow.createInspector({
    onSource: id => documentation.openSource(id),
    onDocumentation: ref => documentation.openDocument(ref),
    onOpenDetail: nodeId => navigate(() => navigation.openDetail(nodeId)),
  });
  const controls = ['zoom-in', 'zoom-out', 'zoom-fit', 'zoom-reset'];
  const diagram = globalThis.pFlow.createDiagram(byId('diagram-container'), {
    onSelect: next => selectEntity(next),
    onOpenDetail: nodeId => navigate(() => navigation.openDetail(nodeId)),
    onZoom: scale => setText('zoom-level', `${Math.round(scale * 100)}%`),
    onStatus: (state, message) => {
      const ready = state === 'ready';
      byId('workspace-state').hidden = ready;
      byId('diagram-container').setAttribute('aria-busy', 'false');
      controls.forEach(id => { byId(id).disabled = !ready; });
      if (!ready) {
        setText('workspace-state-title', state === 'error' ? 'Cannot render this flow' : 'No process flows documented');
        setText('workspace-state-message', message || 'A diagram will appear when the artifact supplies a process flow.');
        setText('workspace-state-caption', state === 'error' ? 'Check the diagram data' : 'No process diagram available');
        setText('zoom-level', '—');
      }
    },
  });
  byId('zoom-in').addEventListener('click', () => diagram.zoom(1.25));
  byId('zoom-out').addEventListener('click', () => diagram.zoom(.8));
  byId('zoom-fit').addEventListener('click', () => diagram.fit());
  byId('zoom-reset').addEventListener('click', () => diagram.reset());
  function selectEntity(next, { locateDocumentation = true } = {}) {
    const state = navigation?.getState();
    const flow = currentSample.architecture.flows.find(item => item.id === state?.flowId);
    const selected = globalThis.pFlow.resolveSelection(currentSample.architecture, flow?.id, next);
    selection = selected ? next : undefined;
    diagram.setSelection(selection);
    byId('clear-selection').hidden = !selected;
    inspector.render(currentSample.architecture, flow, selected, state?.path.map(frame => frame.flowId) || []);
    documentation.setContext(currentSample, flow, selected, false, locateDocumentation);
    if (locateDocumentation) { globalThis.pFlow.layout.reveal('right'); showTab(byId('tab-documentation')); }
  }
  byId('clear-selection').addEventListener('click', () => {
    selectEntity(undefined); byId('diagram-container').querySelector('.diagram-svg')?.focus({ preventScroll: true });
  });
  function renderNavigation(focus = false) {
    const state = navigation?.getState() || { path: [], canBack: false, canForward: false };
    const architecture = currentSample.architecture;
    byId('flow-picker').disabled = !navigation || architecture.flows.length === 0;
    const flow = architecture.flows.find(item => item.id === state.flowId);
    const entry = architecture.entryPoints.find(item => item.id === state.entryId);
    byId('navigation-back').disabled = !state.canBack;
    byId('navigation-forward').disabled = !state.canForward;
    byId('navigation-root').disabled = state.path.length <= 1;
    byId('breadcrumb-list').replaceChildren(...state.path.map((frame, index) => {
      const target = architecture.flows.find(item => item.id === frame.flowId);
      const parent = architecture.flows.find(item => item.id === state.path[index - 1]?.flowId);
      const via = parent?.nodes.find(item => item.id === frame.viaNodeId);
      const item = document.createElement('li');
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = index === 0 && entry ? entry.label : target.label;
      button.title = via ? `${target.label} · via ${via.label}` : target.label;
      if (index === state.path.length - 1) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => navigate(() => navigation.breadcrumb(index)));
      item.append(button); return item;
    }));
    const breadcrumbPanel = byId('breadcrumb-list').parentElement;
    breadcrumbPanel.scrollLeft = breadcrumbPanel.scrollWidth;
    for (const button of document.querySelectorAll('.entry-button')) {
      button.disabled = !navigation;
      button.setAttribute('aria-pressed', String(button.dataset.bundleKey === (currentSample.key || '') && button.dataset.entryId === state.entryId));
    }
    if (flow) byId('flow-picker').value = flow.id;
    setText('workspace-title', flow?.label || 'Process overview');
    byId('workspace-title').title = byId('workspace-title').textContent;
    setText('flow-level', state.path.length > 1 ? 'Detail' : entry ? 'Start flow' : 'Direct flow');
    const parent = architecture.flows.find(item => item.id === state.path.at(-2)?.flowId);
    const via = parent?.nodes.find(item => item.id === state.path.at(-1)?.viaNodeId);
    const context = entry ? `Start: ${entry.label}` : flow ? 'Direct flow' : '';
    setText('workspace-description', [currentSample.title, context, via ? `via ${via.label}` : ''].filter(Boolean).join(' · '));
    byId('workspace-description').title = byId('workspace-description').textContent;
    const result = diagram.render(architecture, state.flowId, { pathFlowIds: state.path.map(frame => frame.flowId) });
    selection = undefined; byId('clear-selection').hidden = true;
    inspector.render(architecture, flow, undefined);
    documentation.setContext(currentSample, flow, undefined, true);
    if (focus && result.ok) byId('diagram-container').querySelector('.diagram-svg')?.focus({ preventScroll: true });
    return result;
  }
  function navigate(action) {
    try { action(); setText('navigation-notice', ''); renderNavigation(true); }
    catch (error) { setText('navigation-notice', error.message); }
  }
  byId('flow-picker').addEventListener('change', () => navigate(() => navigation.selectFlow(byId('flow-picker').value)));
  byId('navigation-back').addEventListener('click', () => navigate(() => navigation.back()));
  byId('navigation-forward').addEventListener('click', () => navigate(() => navigation.forward()));
  byId('navigation-root').addEventListener('click', () => navigate(() => navigation.root()));
  function showTab(tab, focus = false) {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    for (const item of tabs) {
      const selected = item === tab;
      item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1;
      byId(item.getAttribute('aria-controls')).hidden = !selected;
    }
    if (focus) tab.focus();
    if (tab.id === 'tab-documentation') documentation.reveal();
  }
  function setWorkspaceState(state, model) {
    const loading = state === 'loading'; const empty = !model || model.entryCount === 0;
    byId('diagram-container').setAttribute('aria-busy', String(loading));
    byId('workspace-state').hidden = false;
    if (loading) {
      selection = undefined; diagram.clear(); controls.forEach(id => { byId(id).disabled = true; });
      byId('clear-selection').hidden = true;
      if (currentSample) { inspector.render(currentSample.architecture, undefined, undefined); documentation.setContext(currentSample, undefined, undefined); }
    }
    setText('workspace-state-title', loading ? 'Preparing the workspace' : empty ? 'No process starts documented' : 'Process diagram');
    setText('workspace-state-message', loading ? 'Process information is being prepared.' : empty ? 'Recorded process starts will appear here. Use the flow chooser when no start is recorded.' : 'Diagram rendering will appear here. Explore the sample context in the panels below.');
    setText('workspace-state-caption', loading ? 'Loading process documentation' : empty ? 'No process diagram available' : `${model.flowCount} flows · ${model.nodeCount} recorded nodes`);
  }
  function filterExplorer() {
    const query = byId('process-filter').value.trim().toLocaleLowerCase();
    const trigger = byId('category-filter').value;
    let visible = 0;
    for (const group of byId('entry-groups').querySelectorAll('.entry-group')) {
      let count = 0;
      for (const item of group.querySelectorAll('li')) {
        const match = (!trigger || group.dataset.trigger === trigger) && (!query || item.dataset.search.includes(query));
        item.hidden = !match; if (match) count++;
      }
      group.hidden = count === 0; visible += count;
    }
    byId('filter-empty').hidden = visible > 0;
  }
  byId('process-filter').addEventListener('input', filterExplorer);
  byId('category-filter').addEventListener('change', filterExplorer);
  function renderExplorer(activeSample) {
    const available = samples.some(item => item.key === activeSample.key) ? samples.map(item => item.key === activeSample.key ? activeSample : item) : [activeSample];
    const allTriggers = [...new Set(available.flatMap(item => globalThis.pFlow.adaptSample(item).groups.map(group => group.label)))];
    const previous = byId('category-filter').value;
    byId('category-filter').replaceChildren(...['', ...allTriggers].map(trigger => {
      const option = document.createElement('option'); option.value = trigger; option.textContent = trigger || 'All starts'; return option;
    }));
    if (allTriggers.includes(previous)) byId('category-filter').value = previous;
    setText('entry-count', available.reduce((sum, item) => sum + item.architecture.entryPoints.length, 0));
    byId('entry-groups').replaceChildren();
    for (const sample of available) {
      const model = globalThis.pFlow.adaptSample(sample);
      const groups = model.groups.length ? model.groups : [{ label: 'Documented flows (no recorded start)', entries: sample.architecture.flows.map(flow => ({id:flow.id,label:flow.label})), direct: true }];
      for (const group of groups) {
        const section = document.createElement('section'); section.className = 'entry-group'; section.dataset.bundleKey = sample.key || ''; section.dataset.trigger = group.label;
        if (available.length > 1) { const title = document.createElement('p'); title.className = 'bundle-heading'; title.textContent = sample.title; section.append(title); }
        const heading = document.createElement('h3'); heading.className = 'group-heading';
        const symbol = document.createElement('span'); symbol.className = 'group-symbol'; symbol.textContent = '◉'; symbol.setAttribute('aria-hidden', 'true');
        const label = document.createElement('span'); label.textContent = group.label;
        const count = document.createElement('span'); count.className = 'count'; count.textContent = group.entries.length;
        heading.append(symbol, label, count);
        const entries = document.createElement('ul'); entries.className = 'entry-list';
        for (const entry of group.entries) {
          const item = document.createElement('li'); item.dataset.search = `${sample.title} ${group.label} ${entry.label}`.toLocaleLowerCase();
          const button = document.createElement('button'); button.type = 'button'; button.className = group.direct ? 'entry-button flow-button' : 'entry-button'; button.textContent = entry.label; button.setAttribute('aria-label', entry.label);
          button.dataset.bundleKey = sample.key || ''; button.dataset.entryId = entry.id; button.setAttribute('aria-pressed', 'false');
          button.addEventListener('click', () => {
            if (currentSample !== sample) initializeSample(sample);
            navigate(() => group.direct ? navigation.selectFlow(entry.id) : navigation.selectEntry(entry.id));
          });
          item.append(button); entries.append(item);
        }
        section.append(heading, entries); byId('entry-groups').append(section);
      }
    }
    filterExplorer();
  }
  byId('open-docs').addEventListener('click', () => {
    const flow = currentSample?.architecture.flows.find(item => item.id === navigation?.getState().flowId);
    const reference = flow?.docs?.find(ref => ref.anchor === flow.id) || flow?.docs?.[0];
    const selected = globalThis.pFlow.resolveSelection(currentSample.architecture, flow?.id, selection);
    documentation.setContext(currentSample, flow, selected, false, false);
    globalThis.pFlow.layout.reveal('right');
    if (reference) documentation.openDocument(reference);
    else if (Object.hasOwn(globalThis.pFlowDocuments?.[currentSample?.key] || {}, 'index.md')) documentation.openDocument({ path: 'index.md' });
    else { showTab(byId('tab-documentation')); setText('document-status', 'No documentation is available for this process.'); }
    byId('document-article').tabIndex = -1; byId('document-article').focus({ preventScroll: true });
  });
  function initializeSample(sample) {
    currentSample = sample;
    const model = globalThis.pFlow.adaptSample(sample);
    document.title = `pFlow — ${model.title}`;
    byId('app-layout').dataset.bundleId = sample.key || '';
    setText('workspace-title', model.flowTitle);
    setText('workspace-description', model.title);
    setText('flow-count', `${model.flowCount} documented flows`);
    renderExplorer(sample);
    setWorkspaceState('ready', model);
    const flows = sample.architecture.flows;
    byId('flow-picker').replaceChildren(...flows.map(flow => {
      const option = document.createElement('option'); option.value = flow.id; option.textContent = flow.label; return option;
    }));
    byId('flow-picker').disabled = flows.length === 0;
    setText('navigation-notice', '');
    navigation = undefined;
    try {
      navigation = globalThis.pFlow.createFlowNavigation(sample.architecture);
      const entry = sample.architecture.entryPoints[0];
      if (entry) navigation.selectEntry(entry.id);
      else if (flows[0]) navigation.selectFlow(flows[0].id);
    } catch (error) { setText('navigation-notice', error.message); }
    renderNavigation();
    showTab(byId('tab-documentation'));
    return model;
  }
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => showTab(tab));
    tab.addEventListener('keydown', event => {
      const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : undefined;
      if (next !== undefined) { event.preventDefault(); showTab(tabs[next], true); }
    });
  });
  function showAssociation(sample, association) {
    const plan = globalThis.pFlow.planSearchFlow(sample.architecture, association.flowId, currentSample === sample ? navigation?.getState() : {}, association.type === 'entry' ? association.entity.id : undefined);
    if (currentSample !== sample) initializeSample(sample);
    if (!navigation) throw new Error('Diagram navigation is unavailable for this artifact.');
    let notice = '';
    if (!plan.keep) {
      if (plan.direct) { navigation.selectFlow(plan.flowId); notice = 'No entry-point expansion path reaches this Flow. Opened directly.'; }
      else { navigation.selectEntry(plan.entryId); for (const nodeId of plan.via) navigation.openDetail(nodeId); }
      renderNavigation();
    }
    return notice;
  }
  function activateDocumentSection(sample, association) {
    try {
      const sameFlow = currentSample === sample && navigation?.getState().flowId === association.flowId;
      const notice = showAssociation(sample, association);
      selectEntity({ type: association.type, id: association.entity.id }, { locateDocumentation: !sameFlow });
      const expected = selection;
      diagram.centerSelection();
      requestAnimationFrame(() => { if (selection === expected) diagram.centerSelection(); });
      setText('navigation-notice', notice);
    } catch (error) { setText('navigation-notice', error.message); }
  }
  function activateSearchResult(result, query) {
    const api = globalThis.pFlow;
    try {
      if (!result || typeof result.bundleId !== 'string' || typeof result.path !== 'string' || (result.sectionId !== null && (typeof result.sectionId !== 'string' || !/^(entry|flow|node|edge)_[A-Za-z0-9_-]+$/.test(result.sectionId))) || typeof query !== 'string') throw new Error('Invalid search result identifier.');
      const sample = currentSample.key === result.bundleId ? currentSample : samples.find(item => item.key === result.bundleId);
      if (!sample) throw new Error(`Documentation bundle is unavailable: ${result.bundleId}.`);
      const prepared = documentation.prepareSearch(sample, { path: result.path, ...(result.sectionId ? { anchor: result.sectionId } : {}) });
      const reference = prepared.target;
      const { association, notice: unresolved = '' } = api.resolveDocumentAssociation(sample.architecture, reference, prepared.rendered);
      let notice = unresolved;
      if (association) {
        notice = showAssociation(sample, association);
        selectEntity(['node', 'edge'].includes(association.type) ? { type: association.type, id: association.entity.id } : undefined, { locateDocumentation: false });
        diagram.revealSelection();
      } else selectEntity(undefined, { locateDocumentation: false });
      documentation.openSearch(sample, reference, query, prepared);
      setText('navigation-notice', notice);
      return { ok: true };
    } catch (error) {
      setText('navigation-notice', error.message);
      byId('navigation-notice').tabIndex = -1; byId('navigation-notice').focus({ preventScroll: true });
      byId('navigation-notice').scrollIntoView({ block: 'center' });
      return { ok: false, error: error.message };
    }
  }
  globalThis.pFlow.activateSearchResult = activateSearchResult;
  globalThis.pFlow.initializeSample = initializeSample;
  globalThis.pFlow.setWorkspaceState = setWorkspaceState;
  const samples = globalThis.pFlowSamples || [];
  if (samples.length) initializeSample(samples[0]);
  else initializeSample({ title: 'Architecture', architecture: { modelVersion: '1.0.0', entryPoints: [], flows: [], sources: [] } });
}());
