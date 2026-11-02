/* Resolve selection against canonical M1 objects. No stored graph or invented fields. */
globalThis.pFlow = globalThis.pFlow || {};
(function () {
  const sourceLocation = source => source.path + (source.startLine ? `:${source.startLine}${source.endLine !== source.startLine ? `–${source.endLine}` : ''}` : '') + (source.symbol ? ` · ${source.symbol}` : '');
  function evidenceIds(entity) { return entity?.nodes ? [...new Set([...entity.nodes, ...entity.edges].flatMap(item => item.sourceIds))] : entity?.sourceIds || []; }
  function resolveSelection(architecture, flowId, selection) {
    const flow = architecture.flows.find(item => item.id === flowId);
    if (!flow || !selection) return undefined;
    const nodes = new Map(architecture.flows.flatMap(owner => owner.nodes.map(node => [node.id, { node, owner }])));
    if (selection.type === 'node') {
      const found = nodes.get(selection.id);
      if (!found || (!flow.nodes.some(node => node.id === selection.id) && !flow.edges.some(edge => edge.to === selection.id))) return undefined;
      return { type: 'node', entity: found.node, ownerFlow: found.owner, related: architecture.flows.flatMap(owner => owner.edges).filter(edge => edge.from === selection.id || edge.to === selection.id), boundaries: found.node.external ? [found.node] : [], remote: found.owner.id !== flowId };
    }
    if (selection.type !== 'edge') return undefined;
    const edge = flow.edges.find(item => item.id === selection.id);
    if (!edge) return undefined;
    const from = nodes.get(edge.from)?.node, to = nodes.get(edge.to)?.node;
    if (!from || !to) return undefined;
    return { type: 'edge', entity: edge, ownerFlow: flow, from, to, related: [], boundaries: [...new Set([from, to].filter(node => node.external))], remote: false };
  }
  function createInspector({ onSource, onDocumentation, onOpenDetail }) {
    const byId = id => document.getElementById(id);
    const button = (text, action) => { const item = document.createElement('button'); item.type = 'button'; item.textContent = text; item.addEventListener('click', action); return item; };
    function list(id, values) {
      byId(id).replaceChildren(...values.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
      byId(id).closest('.inspector-section').hidden = values.length === 0;
    }
    function render(architecture, flow, selected, pathFlowIds = []) {
      byId('inspector-title').closest('.inspector').scrollTop = 0;
      byId('inspector-title').textContent = selected?.type === 'edge' ? 'Relationship details' : selected ? 'Node details' : 'Details inspector';
      byId('inspector-empty').hidden = Boolean(selected); byId('inspector-content').hidden = !selected;
      if (!selected) return;
      const { entity, type, ownerFlow, related, from, to } = selected;
      byId('node-name').textContent = type === 'node' ? entity.label : entity.label || `${from.label} → ${to.label}`;
      byId('node-kind').textContent = type === 'node' ? entity.kind : `${entity.kind} · ${entity.mode}`;
      byId('node-kind').dataset.category = entity.kind === 'external' ? (entity.external?.kind === 'library' ? 'library' : 'system') : entity.kind === 'decision' ? 'condition' : 'internal';
      const unknown = entity.kind === 'unresolved' ? 'This step or boundary is unresolved. Read its evidence and documentation for what is unknown.' : type === 'edge' && entity.mode === 'unknown' ? 'Waiting or transfer behavior is not recorded for this relationship.' : '';
      byId('node-description').textContent = unknown; byId('node-description').hidden = !unknown;
      const facts = [['Flow', ownerFlow.label], ...(selected.remote ? [['Context', 'Cross-flow target']] : []), ...(type === 'edge' ? [['From', from.label], ['To', to.label], ['Relationship', entity.kind], ['Mode', entity.mode], ...(entity.label ? [['Label', entity.label]] : [])] : [])];
      byId('selection-facts').replaceChildren(...facts.flatMap(([key, value]) => { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = value; return [dt, dd]; }));
      const sources = architecture.sources.filter(source => entity.sourceIds.includes(source.id));
      byId('source-references').replaceChildren(...sources.map(source => { const li = document.createElement('li'); li.append(button(sourceLocation(source), () => onSource(source.id))); return li; }));
      byId('source-references').closest('.inspector-section').hidden = sources.length === 0;
      const names = new Map(architecture.flows.flatMap(item => item.nodes).map(node => [node.id, node.label]));
      list('node-conditions', (type === 'edge' ? entity.kind === 'branch' ? [entity] : [] : related.filter(edge => edge.kind === 'branch')).map(edge => `${names.get(edge.from)} → ${edge.label}`));
      list('node-calls', related.filter(edge => edge.kind !== 'branch').map(edge => `${edge.kind} · ${edge.mode}: ${names.get(edge.from)} → ${names.get(edge.to)}${edge.label ? ` · ${edge.label}` : ''}`));
      const external = byId('external-metadata'); external.replaceChildren();
      for (const boundary of selected.boundaries) {
        const h = document.createElement('h4'); h.textContent = boundary.label; external.append(h);
        const dl = document.createElement('dl'); dl.className = 'metadata-grid';
        const pairs = [['Kind', boundary.external.kind], ...(boundary.external.name ? [['Name', boundary.external.name]] : []), ...Object.entries(boundary.external.attributes || {})];
        for (const [key, value] of pairs) { const dt = document.createElement('dt'), dd = document.createElement('dd'); dt.textContent = key; dd.textContent = Array.isArray(value) ? value.map(item => String(item)).join(', ') : String(value); dl.append(dt, dd); }
        external.append(dl);
      }
      external.closest('.inspector-section').hidden = !selected.boundaries.length;
      const target = type === 'node' ? architecture.flows.find(item => item.id === entity.expandFlowId) : undefined;
      const detail = byId('detail-flow'); detail.replaceChildren(); detail.closest('.inspector-section').hidden = !target;
      if (target) {
        if (selected.remote) detail.textContent = `${target.label} — detail belongs to the target Flow, not the current caller.`;
        else detail.append(button(pathFlowIds.includes(target.id) ? `Detail already in path: ${target.label}` : `Open detail: ${target.label}`, () => onOpenDetail(entity.id)));
      }
      const docs = byId('inspector-documentation'); docs.replaceChildren(); docs.closest('.inspector-section').hidden = !entity.docs?.length;
      for (const ref of entity.docs || []) docs.append(button(`${ref.path}${ref.anchor ? `#${ref.anchor}` : ''}`, () => onDocumentation(ref)));
    }
    return { render };
  }
  Object.assign(globalThis.pFlow, { sourceLocation, evidenceIds, resolveSelection, createInspector });
}());
