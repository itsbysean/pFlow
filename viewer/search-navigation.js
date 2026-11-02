/* Resolve canonical M1-03 associations; plan paths using expansion links only. */
globalThis.pFlow = globalThis.pFlow || {};
(function () {
  function resolveSearchAssociation(architecture, reference) {
    if (!reference.anchor) return {};
    const matches = [];
    for (const flow of architecture.flows) {
      if (flow.id === reference.anchor) matches.push({ type: 'flow', entity: flow, flowId: flow.id });
      for (const type of ['node', 'edge']) for (const entity of flow[type === 'node' ? 'nodes' : 'edges']) {
        if (entity.id === reference.anchor) matches.push({ type, entity, flowId: flow.id });
      }
    }
    for (const entry of architecture.entryPoints) if (entry.id === reference.anchor) matches.push({ type: 'entry', entity: entry, flowId: entry.flowId });
    if (matches.length !== 1) return { notice: `Section ${reference.anchor} has no unique current diagram entity. Showing documentation only.` };
    const found = matches[0];
    const linked = (found.entity.docs || []).some(ref => {
      try { const target = globalThis.pFlow.resolveDocumentTarget('', ref.path + (ref.anchor ? `#${ref.anchor}` : '')); return target.path === reference.path && target.anchor === reference.anchor; }
      catch { return false; }
    });
    if (!linked) return { notice: `Section ${reference.anchor} has no matching canonical documentation backlink. Showing documentation only.` };
    if (!architecture.flows.some(flow => flow.id === found.flowId)) return { notice: 'The associated Flow is no longer available. Showing documentation only.' };
    return { association: found };
  }
  function planSearchFlow(architecture, flowId, state = {}, entryId) {
    const flows = new Map(architecture.flows.map(flow => [flow.id, flow]));
    if (!flows.has(flowId)) throw new Error(`Search Flow is unavailable: ${flowId}.`);
    if (!entryId && state.flowId === flowId) return { keep: true };
    const entries = entryId ? architecture.entryPoints.filter(entry => entry.id === entryId) : [...architecture.entryPoints].sort((a, b) => Number(b.id === state.entryId) - Number(a.id === state.entryId));
    for (const entry of entries) {
      const queue = [{ flowId: entry.flowId, via: [] }], seen = new Set([entry.flowId]);
      for (let i = 0; i < queue.length; i++) {
        const frame = queue[i], flow = flows.get(frame.flowId);
        if (!flow) continue;
        if (flow.id === flowId) return { entryId: entry.id, via: frame.via };
        for (const node of flow.nodes) if (flows.has(node.expandFlowId) && !seen.has(node.expandFlowId)) {
          seen.add(node.expandFlowId); queue.push({ flowId: node.expandFlowId, via: [...frame.via, node.id] });
        }
      }
    }
    return { direct: true, flowId };
  }
  function resolveDocumentAssociation(architecture, reference, rendered) {
    const resolved = resolveSearchAssociation(architecture, reference);
    const found = resolved.association;
    if (found && ['node', 'edge'].includes(found.type)) {
      const section = rendered.sections.get(reference.anchor), owner = rendered.sections.get(found.flowId);
      const parent = resolveSearchAssociation(architecture, { path: reference.path, anchor: found.flowId }).association;
      if (!owner || parent?.type !== 'flow' || section?.closest('.markdown-section[id^="flow_"]') !== owner) return { notice: 'The section is not nested in its owning Flow. Showing documentation only.' };
    }
    return resolved;
  }
  Object.assign(globalThis.pFlow, { resolveSearchAssociation, resolveDocumentAssociation, planSearchFlow });
}());
