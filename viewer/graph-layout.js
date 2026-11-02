/* Read-only Flow projection and deterministic geometry. No DOM or graph navigation. */
globalThis.pFlow = globalThis.pFlow || {};
(function () {
  const nodeKinds = new Set(['operation', 'decision', 'external', 'terminal', 'unresolved']);
  const edgeKinds = new Set(['next', 'call', 'branch', 'return', 'exception', 'send', 'receive']);
  const modes = new Set(['sync', 'async', 'unknown']);
  const compare = (a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  const require = (condition, message) => { if (!condition) throw new Error(message); };
  const text = value => typeof value === 'string' && value.trim().length > 0;

  function prepareDiagram(architecture, flowId) {
    require(architecture?.modelVersion === '1.0.0', 'Unsupported architecture model version.');
    for (const key of ['entryPoints', 'flows', 'sources']) require(Array.isArray(architecture[key]), `Missing ${key} collection.`);
    const ids = new Set(), flows = new Map(), nodes = new Map(), sources = new Map(), owners = new Map();
    const register = item => {
      require(item && text(item.id) && !ids.has(item.id), `Missing or duplicate ID: ${item?.id ?? '(absent)'}.`);
      ids.add(item.id);
    };
    for (const source of architecture.sources) {
      register(source); require(text(source.path), `Missing source path: ${source.id}.`);
      require((source.startLine === undefined && source.endLine === undefined)
        || (Number.isInteger(source.startLine) && source.startLine > 0 && Number.isInteger(source.endLine) && source.endLine >= source.startLine), `Invalid source range: ${source.id}.`);
      sources.set(source.id, source);
    }
    const evidence = item => require(Array.isArray(item.sourceIds) && item.sourceIds.length > 0
      && item.sourceIds.every(id => sources.has(id)), `Invalid source references: ${item.id}.`);
    for (const flow of architecture.flows) {
      register(flow); require(text(flow.label) && Array.isArray(flow.nodes) && flow.nodes.length > 0 && Array.isArray(flow.edges), `Invalid Flow: ${flow.id}.`);
      flows.set(flow.id, flow);
      for (const node of flow.nodes) {
        register(node); require(text(node.label) && nodeKinds.has(node.kind), `Invalid node: ${node.id}.`); evidence(node);
        if (node.external !== undefined) require(node.kind === 'external' && ['http', 'database', 'messaging', 'library', 'other'].includes(node.external?.kind), `Invalid external metadata: ${node.id}.`);
        nodes.set(node.id, node); owners.set(node.id, flow.id);
      }
      for (const edge of flow.edges) { register(edge); evidence(edge); }
    }
    for (const entry of architecture.entryPoints) {
      register(entry); evidence(entry); require(flows.has(entry.flowId), `Unknown entry Flow: ${entry.flowId}.`);
    }
    for (const flow of architecture.flows) {
      require(owners.get(flow.startNodeId) === flow.id, `Invalid start node: ${flow.startNodeId}.`);
      for (const node of flow.nodes) if (node.expandFlowId !== undefined) require(flows.has(node.expandFlowId), `Unknown detail Flow: ${node.expandFlowId}.`);
      const outcomes = new Map();
      for (const edge of flow.edges) {
        require(edgeKinds.has(edge.kind) && modes.has(edge.mode), `Invalid edge kind or mode: ${edge.id}.`);
        require(nodes.has(edge.from) && nodes.has(edge.to), `Unknown edge endpoint: ${edge.id}.`);
        require(owners.get(edge.from) === flow.id, `Edge is not owned by its source Flow: ${edge.id}.`);
        require(nodes.get(edge.from).kind !== 'terminal', `Terminal has an outgoing edge: ${edge.id}.`);
        const nonlocal = owners.get(edge.to) !== flow.id;
        require(!(nonlocal && edge.kind === 'next'), `Nonlocal continuation: ${edge.id}.`);
        require(!(nonlocal && edge.kind === 'receive' && edge.mode !== 'async'), `Cross-flow receive is not async: ${edge.id}.`);
        if (edge.kind === 'branch') {
          require(nodes.get(edge.from).kind === 'decision' && text(edge.label), `Invalid branch: ${edge.id}.`);
          const labels = outcomes.get(edge.from) || new Set();
          require(!labels.has(edge.label), `Duplicate branch outcome: ${edge.id}.`);
          labels.add(edge.label); outcomes.set(edge.from, labels);
        }
      }
    }
    if (!architecture.flows.length && flowId === undefined) return { nodes: [], edges: [], startNodeId: undefined, label: 'Empty architecture' };
    const flow = flows.get(flowId ?? architecture.flows[0].id);
    require(flow, `Unknown displayed Flow: ${flowId}.`);
    const visible = new Map(flow.nodes.map(node => [node.id, { node, remoteFlow: undefined }]));
    for (const edge of flow.edges) if (!visible.has(edge.to)) visible.set(edge.to, { node: nodes.get(edge.to), remoteFlow: flows.get(owners.get(edge.to)) });
    return {
      label: flow.label, startNodeId: flow.startNodeId,
      nodes: [...visible.values()].map(item => ({ ...item, sources: item.node.sourceIds.map(id => sources.get(id)) })),
      edges: flow.edges,
    };
  }

  function nodeCategory(node, edges) {
    if (node.kind === 'decision') return 'condition';
    if (node.kind === 'unresolved') return 'unresolved';
    if (node.kind === 'external') return node.external?.kind === 'library' ? 'library' : 'system';
    if (node.kind === 'terminal') {
      const incoming = edges.filter(edge => edge.to === node.id);
      return incoming.length && incoming.every(edge => edge.kind === 'exception') ? 'failure' : 'terminal';
    }
    return 'internal';
  }

  function wrapLabel(label, limit = 27, maxLines = 2) {
    const chars = Array.from(label.replace(/\s+/g, ' ').trim());
    const lines = [];
    while (chars.length && lines.length < maxLines) {
      if (chars.length <= limit) { lines.push(chars.splice(0).join('')); break; }
      let count = limit;
      const space = chars.slice(0, limit + 1).lastIndexOf(' ');
      if (space >= Math.floor(limit / 2)) count = space;
      lines.push(chars.splice(0, count).join('').trim());
      while (chars[0] === ' ') chars.shift();
    }
    if (chars.length) lines[lines.length - 1] = Array.from(lines.at(-1)).slice(0, limit - 1).join('') + '…';
    return lines;
  }

  function layoutDiagram(graph, { nodeSizes = new Map() } = {}) {
    if (!graph.nodes.length) return { nodes: [], edges: [], bounds: { x: 0, y: 0, width: 0, height: 0 } };
    const columnGap = 100, rowGap = 48, trackStep = 28, clearance = 20;
    const ordered = [...graph.nodes].sort((a, b) => compare(a.node, b.node));
    const edges = [...graph.edges].sort(compare);
    const outgoing = new Map(ordered.map(item => [item.node.id, []]));
    const incoming = new Map(ordered.map(item => [item.node.id, []]));
    for (const edge of edges) { outgoing.get(edge.from).push(edge); incoming.get(edge.to).push(edge); }
    // Iterative DFS marks backward edges; removing only these yields an acyclic ranking graph.
    const state = new Map(), backward = new Set();
    const starts = [graph.startNodeId, ...ordered.map(item => item.node.id)].filter(Boolean);
    for (const start of starts) {
      if (state.has(start)) continue;
      state.set(start, 1);
      const stack = [{ id: start, cursor: 0 }];
      while (stack.length) {
        const frame = stack.at(-1), list = outgoing.get(frame.id);
        if (frame.cursor === list.length) { state.set(frame.id, 2); stack.pop(); continue; }
        const edge = list[frame.cursor++];
        if (state.get(edge.to) === 1) backward.add(edge.id);
        else if (!state.has(edge.to)) { state.set(edge.to, 1); stack.push({ id: edge.to, cursor: 0 }); }
      }
    }
    const indegree = new Map(ordered.map(item => [item.node.id, incoming.get(item.node.id).filter(edge => !backward.has(edge.id)).length]));
    const ranks = new Map(ordered.map(item => [item.node.id, 0]));
    const queue = ordered.map(item => item.node.id).filter(id => indegree.get(id) === 0);
    for (let cursor = 0; cursor < queue.length; cursor++) {
      const id = queue[cursor];
      for (const edge of outgoing.get(id)) if (!backward.has(edge.id)) {
        ranks.set(edge.to, Math.max(ranks.get(edge.to), ranks.get(id) + 1));
        indegree.set(edge.to, indegree.get(edge.to) - 1);
        if (!indegree.get(edge.to)) queue.push(edge.to);
      }
    }
    const rows = [];
    for (const item of ordered) { const rank = ranks.get(item.node.id); (rows[rank] ||= []).push(item); }
    const indexes = new Map();
    for (const row of rows) {
      const center = item => {
        const parents = incoming.get(item.node.id).filter(edge => !backward.has(edge.id));
        return parents.length ? parents.reduce((sum, edge) => sum + (indexes.get(edge.from) || 0), 0) / parents.length : 0;
      };
      row.sort((a, b) => center(a) - center(b) || compare(a.node, b.node));
      row.forEach((item, i) => indexes.set(item.node.id, i - (row.length - 1) / 2));
    }
    // Private presentation extents, never fields in the architecture contract.
    // The current renderer uses bounded 224x80 frames; callers that measure a
    // larger frame can supply it without changing rank or routing assumptions.
    const size = item => {
      const value = nodeSizes.get(item.node.id) || { width: 224, height: 80 };
      require(Number.isFinite(value.width) && value.width >= 160 && Number.isFinite(value.height) && value.height >= 80, `Invalid presentation dimensions: ${item.node.id}.`);
      return value;
    };
    const rowWidths = rows.map(row => row.reduce((sum, item) => sum + size(item).width, 0) + (row.length - 1) * columnGap);
    const graphWidth = Math.max(...rowWidths), positions = new Map();
    rows.forEach((row, rank) => {
      let x = (graphWidth - rowWidths[rank]) / 2;
      for (const item of row) {
        const dimensions = size(item);
        positions.set(item.node.id, { ...item, id: item.node.id, rank, ...dimensions, x, y: 0, category: nodeCategory(item.node, edges) });
        x += dimensions.width + columnGap;
      }
    });
    const ports = { incoming: new Map(), outgoing: new Map() };
    const portX = (node, list, edge, outgoing) => {
      const cache = outgoing ? ports.outgoing : ports.incoming;
      if (cache.has(edge.id)) return cache.get(edge.id);
      const sorted = [...list].sort((a, b) => {
        const other = e => positions.get(outgoing ? e.to : e.from);
        return (other(a).x + other(a).width / 2) - (other(b).x + other(b).width / 2) || compare(a, b);
      });
      const inset = node.node.kind === 'terminal' ? Math.min(node.width / 2, Math.max(node.width * .2, node.height / 2 + 4)) : node.width * .2;
      sorted.forEach((item, i) => cache.set(item.id, node.x + inset + (node.width - 2 * inset) * (i + 1) / (sorted.length + 1)));
      return cache.get(edge.id);
    };
    const specifications = edges.map(edge => {
      const from = positions.get(edge.from), to = positions.get(edge.to);
      const sx = portX(from, outgoing.get(edge.from), edge, true), tx = portX(to, incoming.get(edge.to), edge, false);
      const fullLabel = edge.label ? `${edge.label}${edge.mode === 'sync' ? '' : ` · ${edge.mode}`}` : `${edge.kind}${edge.mode === 'sync' ? '' : ` · ${edge.mode}`}`;
      const label = wrapLabel(fullLabel, 32, 1)[0], labelWidth = Math.max(42, Array.from(label).length * 6 + 14);
      return { edge, from, to, sx, tx, label, fullLabel, labelWidth, labelX: (sx + tx) / 2, backward: backward.has(edge.id) };
    });
    const outside = new Set(); let routed;
    for (let pass = 0; pass <= edges.length; pass++) {
      const gaps = Array.from({ length: rows.length + 1 }, () => []);
      function reserve(gap, left, right) {
        // Intervals include the label and the horizontal path. Disjoint paths can
        // share a track; labels are not placed with repeating modulo offsets.
        const tracks = gaps[gap];
        let index = tracks.findIndex(intervals => intervals.every(([a, b]) => right + 12 <= a || left >= b + 12));
        if (index < 0) { index = tracks.length; tracks.push([]); }
        tracks[index].push([left, right]); return index;
      }
      const routes = specifications.map(route => ({ ...route }));
      const local = routes.filter(route => route.to.rank === route.from.rank + 1 && !outside.has(route.edge.id));
      let leftEdge = Math.min(0, ...local.map(route => route.labelX - route.labelWidth / 2)) - clearance;
      let rightEdge = Math.max(graphWidth, ...local.map(route => route.labelX + route.labelWidth / 2)) + clearance;
      for (const route of routes) {
        const { from, to, sx, tx, labelWidth } = route;
        if (to.rank === from.rank + 1 && !outside.has(route.edge.id)) {
          route.labelX = (sx + tx) / 2;
          route.track = reserve(from.rank + 1, Math.min(sx, tx, route.labelX - labelWidth / 2), Math.max(sx, tx, route.labelX + labelWidth / 2));
        } else {
          // The complete plate stays beyond the widest row, including its outline.
          const left = to.rank > from.rank;
          route.lane = left ? leftEdge - labelWidth / 2 : rightEdge + labelWidth / 2;
          if (left) leftEdge = route.lane - labelWidth / 2 - 24;
          else rightEdge = route.lane + labelWidth / 2 + 24;
          route.exitTrack = reserve(from.rank + 1, Math.min(sx, route.lane), Math.max(sx, route.lane));
          route.entryTrack = reserve(to.rank, Math.min(tx, route.lane), Math.max(tx, route.lane));
        }
      }
      const gapHeights = gaps.map((tracks, i) => tracks.length ? Math.max(rowGap, clearance * 2 + (tracks.length - 1) * trackStep) : i === 0 || i === rows.length ? 0 : rowGap);
      const gapTops = [0]; let y = gapHeights[0];
      rows.forEach((row, rank) => {
        const height = Math.max(...row.map(item => positions.get(item.node.id).height));
        for (const item of row) positions.get(item.node.id).y = y;
        gapTops[rank + 1] = y + height; y += height + gapHeights[rank + 1];
      });
      const trackY = (gap, track) => gapTops[gap] + clearance + track * trackStep;
      const borderY = (node, x, bottom) => {
        const inset = node.node.kind === 'decision' ? Math.abs(x - node.x - node.width / 2) * node.height / node.width : 0;
        return node.y + (bottom ? node.height - inset : inset);
      };
      routed = routes.map(route => {
        const { from, to, sx, tx, lane, ...result } = route;
        const sy = borderY(from, sx, true), ty = borderY(to, tx, false);
        let points, labelX, labelY;
        if (lane === undefined) {
          labelY = trackY(from.rank + 1, route.track); labelX = route.labelX;
          points = [[sx, sy], [sx, labelY], [tx, labelY], [tx, ty]];
        } else {
          const exit = trackY(from.rank + 1, route.exitTrack), entry = trackY(to.rank, route.entryTrack);
          points = [[sx, sy], [sx, exit], [lane, exit], [lane, entry], [tx, entry], [tx, ty]];
          labelX = lane; labelY = exit + Math.sign(entry - exit) * trackStep / 2;
        }
        // Remove zero-length legs. Arrowheads retain the last real approach.
        points = points.filter((p, i) => !i || p[0] !== points[i - 1][0] || p[1] !== points[i - 1][1]);
        return { edge: result.edge, label: result.label, fullLabel: result.fullLabel, labelWidth: result.labelWidth, backward: result.backward, points, labelX, labelY };
      });
      // When a horizontal leg has spare room, place its plate away from other
      // vertical stems. This preserves reserved intervals and does not add bends.
      const verticals = routed.flatMap(route => route.points.slice(1).flatMap((b, i) => {
        const a = route.points[i];
        return a[0] === b[0] ? [{ id: route.edge.id, x: a[0], top: Math.min(a[1], b[1]), bottom: Math.max(a[1], b[1]) }] : [];
      }));
      for (let i = 0; i < routed.length; i++) {
        if (routes[i].lane !== undefined) continue;
        const route = routed[i], half = route.labelWidth / 2 + 4;
        const low = Math.min(routes[i].sx, routes[i].tx) + half, high = Math.max(routes[i].sx, routes[i].tx) - half;
        if (low > high) continue;
        const blocked = verticals.filter(v => v.id !== route.edge.id && v.top < route.labelY + 12 && v.bottom > route.labelY - 12).map(v => v.x).sort((a, b) => a - b);
        const free = []; let cursor = low;
        for (const x of blocked) {
          if (x - half > cursor) free.push([cursor, Math.min(high, x - half)]);
          cursor = Math.max(cursor, x + half);
          if (cursor > high) break;
        }
        if (cursor <= high) free.push([cursor, high]);
        const choices = free.filter(([a, b]) => a <= b).map(([a, b]) => Math.max(a, Math.min(b, route.labelX)));
        choices.sort((a, b) => Math.abs(a - route.labelX) - Math.abs(b - route.labelX) || a - b);
        if (choices.length) route.labelX = choices[0];
      }
      // A short horizontal leg may have no plate-sized opening between stems.
      // Give only that label a dedicated outer lane, then repeat reservations.
      // At most one promotion per edge is possible, so cycles cannot loop here.
      const blocked = new Set();
      const routeBounds = new Map(routed.map(route => [route, {
        left: Math.min(...route.points.map(p => p[0])), right: Math.max(...route.points.map(p => p[0])),
        top: Math.min(...route.points.map(p => p[1])), bottom: Math.max(...route.points.map(p => p[1])),
      }]));
      for (const plate of routed) {
        const left = plate.labelX - plate.labelWidth / 2, right = plate.labelX + plate.labelWidth / 2;
        const top = plate.labelY - 10, bottom = plate.labelY + 10;
        for (const route of routed) {
          if (plate === route) continue;
          const box = routeBounds.get(route);
          if (box.right <= left || box.left >= right || box.bottom <= top || box.top >= bottom) continue;
          for (let i = 1; i < route.points.length; i++) {
            const a = route.points[i - 1], b = route.points[i];
            if (a[0] === b[0] ? a[0] > left && a[0] < right && Math.max(a[1], b[1]) > top && Math.min(a[1], b[1]) < bottom
              : a[1] > top && a[1] < bottom && Math.max(a[0], b[0]) > left && Math.min(a[0], b[0]) < right) blocked.add(plate.edge.id);
          }
        }
      }
      if (!blocked.size) break;
      const before = outside.size;
      for (const id of blocked) outside.add(id);
      require(outside.size > before, 'Cannot place relationship labels without hiding a route.');
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const node of positions.values()) {
      minX = Math.min(minX, node.x - 6); minY = Math.min(minY, node.y - 6);
      maxX = Math.max(maxX, node.x + node.width + 6); maxY = Math.max(maxY, node.y + node.height + 6);
    }
    for (const edge of routed) {
      for (const [x, y] of edge.points) { minX = Math.min(minX, x - 4); minY = Math.min(minY, y - 4); maxX = Math.max(maxX, x + 4); maxY = Math.max(maxY, y + 4); }
      minX = Math.min(minX, edge.labelX - edge.labelWidth / 2 - 2); maxX = Math.max(maxX, edge.labelX + edge.labelWidth / 2 + 2);
      minY = Math.min(minY, edge.labelY - 12); maxY = Math.max(maxY, edge.labelY + 12);
    }
    return { nodes: [...positions.values()], edges: routed, bounds: { x: minX, y: minY, width: maxX - minX, height: maxY - minY } };
  }
  Object.assign(globalThis.pFlow, { prepareDiagram, layoutDiagram, wrapLabel });
}());
