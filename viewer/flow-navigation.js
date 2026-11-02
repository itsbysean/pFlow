/* Navigation-only trail. Frames contain IDs, never copies of Flow graph data. */
globalThis.pFlow = globalThis.pFlow || {};
globalThis.pFlow.createFlowNavigation = function createFlowNavigation(architecture) {
  const flows = new Map(architecture.flows.map(flow => [flow.id, flow]));
  const entries = new Map(architecture.entryPoints.map(entry => [entry.id, entry]));
  if (flows.size !== architecture.flows.length || entries.size !== architecture.entryPoints.length) throw new Error('Navigation requires unique Flow and entry point IDs.');
  let trail = [], cursor = -1, entryId;
  const requireFlow = id => {
    const flow = flows.get(id);
    if (!flow) throw new Error(`Unknown navigation Flow: ${id}.`);
    return flow;
  };
  const getState = () => ({
    entryId, flowId: trail[cursor]?.flowId,
    path: trail.slice(0, cursor + 1).map(frame => ({ ...frame })),
    canBack: cursor > 0, canForward: cursor >= 0 && cursor < trail.length - 1,
  });
  function start(flowId, selectedEntryId) {
    requireFlow(flowId);
    entryId = selectedEntryId; trail = [{ flowId }]; cursor = 0;
    return getState();
  }
  function selectEntry(id) {
    const entry = entries.get(id);
    if (!entry) throw new Error(`Unknown entry point: ${id}.`);
    return start(entry.flowId, entry.id);
  }
  function openDetail(nodeId) {
    const flow = requireFlow(trail[cursor]?.flowId);
    const node = flow.nodes.find(item => item.id === nodeId);
    if (!node) throw new Error('Detail navigation must start at a node owned by the displayed Flow.');
    if (node.expandFlowId === undefined) throw new Error(`No detail Flow is recorded for ${node.label}.`);
    const target = requireFlow(node.expandFlowId);
    if (trail.slice(0, cursor + 1).some(frame => frame.flowId === target.id)) {
      throw new Error(`Detail Flow “${target.label}” is already in this path. Use Back or a breadcrumb to return.`);
    }
    trail = trail.slice(0, cursor + 1);
    trail.push({ flowId: target.id, viaNodeId: node.id }); cursor++;
    return getState();
  }
  return {
    getState, selectEntry, openDetail,
    selectFlow: id => start(id, undefined),
    back() { if (cursor > 0) cursor--; return getState(); },
    forward() { if (cursor >= 0 && cursor < trail.length - 1) cursor++; return getState(); },
    root() { if (trail.length) cursor = 0; return getState(); },
    breadcrumb(index) {
      if (!Number.isInteger(index) || index < 0 || index > cursor) throw new Error('Unknown breadcrumb position.');
      cursor = index; return getState();
    },
  };
};
