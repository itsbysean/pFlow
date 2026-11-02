/* Presentation adapter. It reads M1 artifacts; it does not infer execution mechanisms. */
globalThis.pFlow = globalThis.pFlow || {};
globalThis.pFlow.adaptSample = function adaptSample(sample) {
  const architecture = sample.architecture;
  const groups = new Map();
  for (const entry of architecture.entryPoints) {
    const trigger = entry.trigger?.trim() || 'Trigger not recorded';
    if (!groups.has(trigger)) groups.set(trigger, []);
    groups.get(trigger).push({ id: entry.id, label: entry.label });
  }
  const allNodes = architecture.flows.flatMap(flow => flow.nodes);
  return {
    title: sample.title,
    groups: [...groups].map(([label, entries]) => ({ label, entries })),
    entryCount: architecture.entryPoints.length,
    flowCount: architecture.flows.length,
    nodeCount: allNodes.length,
    version: architecture.modelVersion,
    flowTitle: architecture.flows.find(flow => flow.id === architecture.entryPoints[0]?.flowId)?.label || 'Architecture overview',
  };
};
