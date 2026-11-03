/* Native SVG presentation. Detail callbacks navigate without changing graph ownership. */
globalThis.pFlow = globalThis.pFlow || {};
(function () {
  const ns = 'http://www.w3.org/2000/svg';
  let sequence = 0;
  function element(name, attributes = {}, text) {
    const item = document.createElementNS(ns, name);
    for (const [key, value] of Object.entries(attributes)) item.setAttribute(key, String(value));
    if (text !== undefined) item.textContent = text;
    return item;
  }
  function sourceLabel(source, short = false) {
    if (!source) return 'No evidence location';
    const line = source.startLine ? `:${source.startLine}${source.endLine === source.startLine ? '' : `–${source.endLine}`}` : '';
    const label = (short ? source.path.split('/').at(-1) : source.path) + line;
    return label;
  }
  function createDiagram(container, { onZoom = () => {}, onStatus = () => {}, onOpenDetail, onSelect = () => {} } = {}) {
    let svg, scene, layout, view, drag, suppressClick = false;
    const prefix = `pflow-diagram-${++sequence}`;
    const dimensions = () => ({ width: Math.max(1, container.clientWidth), height: Math.max(1, container.clientHeight) });
    function apply() {
      if (!scene || !view) return;
      scene.setAttribute('transform', `translate(${view.x} ${view.y}) scale(${view.scale})`);
      onZoom(view.scale);
    }
    function fit() {
      if (!layout?.nodes.length) return;
      const { width, height } = dimensions();
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      view = globalThis.pFlow.fitDiagram(layout.bounds, width, height); apply();
    }
    function zoom(factor) {
      if (!view) return;
      const { width, height } = dimensions();
      const fitted = globalThis.pFlow.fitDiagram(layout.bounds, width, height);
      view = globalThis.pFlow.zoomDiagram(view, factor, { x: width / 2, y: height / 2 }, Math.min(.05, fitted.scale)); apply();
    }
    function reset() {
      if (!view) return;
      const { width, height } = dimensions(), bounds = layout.bounds;
      view = { scale: 1, x: (width - bounds.width) / 2 - bounds.x, y: Math.max(24, (height - bounds.height) / 2) - bounds.y }; apply();
    }
    function clear() { drag = undefined; svg?.remove(); svg = undefined; scene = undefined; layout = undefined; view = undefined; suppressClick = false; }
    function action(control, callback) {
      control.addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation();
        if (!suppressClick || event.detail === 0) callback();
      });
      control.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault(); event.stopPropagation();
        if (!event.repeat) callback();
      });
    }
    function setSelection(selected) {
      if (!svg) return;
      for (const node of svg.querySelectorAll('.diagram-node')) {
        const active = selected?.type === 'node' && selected.id === node.dataset.nodeId;
        node.classList.toggle('is-selected', active); node.querySelector('.diagram-node-select').setAttribute('aria-pressed', String(active));
      }
      for (const edge of svg.querySelectorAll('.diagram-edge, .diagram-edge-label')) {
        const active = selected?.type === 'edge' && selected.id === (edge.dataset.edgeId || edge.dataset.edgeLabel);
        edge.classList.toggle('is-selected', active);
        if (edge.classList.contains('diagram-edge')) edge.setAttribute('aria-pressed', String(active));
      }
    }
    function revealSelection() {
      if (!svg || !view) return;
      const target = svg.querySelector('.diagram-node.is-selected, .diagram-edge.is-selected');
      if (!target) return;
      const box = container.getBoundingClientRect(); let item = target.getBoundingClientRect();
      if (item.width > box.width - 32 || item.height > box.height - 32) { fit(); item = target.getBoundingClientRect(); }
      const dx = item.left < box.left + 16 ? box.left + 16 - item.left : item.right > box.right - 16 ? box.right - 16 - item.right : 0;
      const dy = item.top < box.top + 16 ? box.top + 16 - item.top : item.bottom > box.bottom - 16 ? box.bottom - 16 - item.bottom : 0;
      if (dx || dy) { view = { ...view, x: view.x + dx, y: view.y + dy }; apply(); }
    }
    function centerSelection() {
      if (!svg || !view) return;
      const target = svg.querySelector('.diagram-node.is-selected, .diagram-edge.is-selected');
      if (!target) return;
      const box = container.getBoundingClientRect(); let item = target.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(1, box.width - 32) / Math.max(1, item.width), Math.max(1, box.height - 32) / Math.max(1, item.height));
      if (ratio < 1) { view = { ...view, scale: view.scale * ratio }; apply(); item = target.getBoundingClientRect(); }
      view = { ...view, x: view.x + box.left + box.width / 2 - item.left - item.width / 2, y: view.y + box.top + box.height / 2 - item.top - item.height / 2 }; apply();
    }
    function render(architecture, flowId, { pathFlowIds = [] } = {}) {
      clear();
      try {
        const graph = globalThis.pFlow.prepareDiagram(architecture, flowId);
        layout = globalThis.pFlow.layoutDiagram(graph);
        if (!layout.nodes.length) { onStatus('empty'); return { ok: true, empty: true }; }
        svg = element('svg', { class: 'diagram-svg', 'text-rendering': 'geometricPrecision', role: 'group', tabindex: 0, 'aria-labelledby': `${prefix}-title`, 'aria-describedby': `${prefix}-description diagram-help` });
        svg.append(element('title', { id: `${prefix}-title` }, `${graph.label} process flow`), element('desc', { id: `${prefix}-description` }, `${layout.nodes.length} visible nodes and ${layout.edges.length} directed relationships. Use zoom and fit, drag to pan, or focus the diagram and use arrow keys. Tab to nodes or relationships and press Enter or Space to select. Detail navigation has a separate button. Cross-flow targets are boundary stubs.`));
        const defs = element('defs');
        for (const kind of ['next', 'call', 'branch', 'return', 'exception', 'send', 'receive', 'async']) {
          const marker = element('marker', { id: `${prefix}-arrow-${kind}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto', markerUnits: 'userSpaceOnUse' });
          marker.append(element('path', { d: 'M 0 0 L 10 5 L 0 10 Z', class: `diagram-arrow arrow-${kind}` })); defs.append(marker);
        }
        scene = element('g', { class: 'diagram-scene' }); svg.append(defs, scene);
        const textLimits = [];
        // Draw paths first, then label plates, then nodes; arrow tips terminate at real shape borders.
        const paths = element('g'), labels = element('g'); scene.append(paths, labels);
        const names = new Map(layout.nodes.map(item => [item.id, item.node.label]));
        for (const route of layout.edges) {
          const edge = route.edge;
          const color = edge.kind === 'exception' ? 'exception' : edge.mode === 'async' ? 'async' : edge.kind;
          const description = `${edge.kind} (${edge.mode}): ${names.get(edge.from)} → ${names.get(edge.to)}${edge.label ? `. ${edge.label}` : ''}. Evidence: ${edge.sourceIds.join(', ')}`;
          const group = element('g', { class: `diagram-edge edge-${edge.kind} mode-${edge.mode}`, role: 'button', tabindex: 0, 'aria-pressed': false, 'aria-label': `Select relationship ${description}`, 'data-edge-id': edge.id, 'data-from': edge.from, 'data-to': edge.to });
          group.append(element('title', {}, description));
          const d = route.points.map(([x, y], i) => `${i ? 'L' : 'M'} ${x} ${y}`).join(' ');
          group.append(element('path', { d, class: 'diagram-edge-hit' }), element('path', { d, 'marker-end': `url(#${prefix}-arrow-${color})`, class: 'diagram-edge-path' })); paths.append(group);
          action(group, () => onSelect({ type: 'edge', id: edge.id }));
          const label = element('g', { class: `diagram-edge-label edge-${edge.kind} mode-${edge.mode}`, 'data-edge-label': edge.id, 'aria-hidden': true });
          label.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); if (!suppressClick || event.detail === 0) onSelect({ type: 'edge', id: edge.id }); });
          const caption = element('text', { x: route.labelX, y: route.labelY + 4, 'text-anchor': 'middle' }, route.label);
          textLimits.push([caption, route.labelWidth - 12]);
          label.append(element('title', {}, route.fullLabel), element('rect', { x: route.labelX - route.labelWidth / 2, y: route.labelY - 10, width: route.labelWidth, height: 20, rx: 4 }), caption); labels.append(label);
        }
        for (const item of layout.nodes) {
          const { node, x, y, width, height } = item;
          const detail = !item.remoteFlow && node.expandFlowId !== undefined && onOpenDetail
            ? architecture.flows.find(flow => flow.id === node.expandFlowId) : undefined;
          const recursive = detail && pathFlowIds.includes(detail.id);
          const type = item.remoteFlow ? `Cross-flow · ${node.kind}` : node.kind === 'external' ? `External ${node.external?.kind || 'boundary'}` : node.kind;
          const full = `${node.label}. ${type}.${item.remoteFlow ? ` Target Flow: ${item.remoteFlow.label}.` : ''} Evidence: ${item.sources.map(source => sourceLabel(source)).join('; ')}.`;
          const group = element('g', { class: `diagram-node node-${item.category}${item.remoteFlow ? ' node-remote' : ''}${detail ? ' node-expandable' : ''}${recursive ? ' node-recursive' : ''}`, transform: `translate(${x} ${y})`, role: detail ? 'button' : 'group', 'aria-label': full, 'data-node-id': node.id, 'data-kind': node.kind, 'data-category': item.category, 'data-boundary': Boolean(item.remoteFlow) });
          group.setAttribute('role', 'group');
          const select = element('g', { class: 'diagram-node-select', role: 'button', tabindex: 0, 'aria-pressed': false, 'aria-label': `Select node ${full}` });
          action(select, () => onSelect({ type: 'node', id: node.id }));
          group.append(element('title', {}, full));
          let shape;
          if (node.kind === 'decision') shape = element('polygon', { points: `${width / 2},0 ${width},${height / 2} ${width / 2},${height} 0,${height / 2}` });
          else if (item.category === 'system') shape = element('path', { d: `M 14 0 H ${width} V ${height - 14} L ${width - 14} ${height} H 0 V 14 Z` });
          else shape = element('rect', { width, height, rx: node.kind === 'terminal' ? height / 2 : item.category === 'library' ? 14 : 6 });
          shape.setAttribute('class', 'diagram-node-shape');
          const focus = shape.cloneNode(false); focus.setAttribute('class', 'diagram-node-focus'); focus.setAttribute('aria-hidden', 'true');
          select.append(focus, shape);
          const decision = node.kind === 'decision';
          const lines = globalThis.pFlow.wrapLabel(node.label, decision ? 14 : 27, 2);
          const label = element('text', { class: 'diagram-node-name', x: decision ? width / 2 : 14, y: decision ? 26 : lines.length === 1 ? 26 : 21, 'text-anchor': decision ? 'middle' : 'start' });
          lines.forEach((line, i) => {
            const span = element('tspan', { x: decision ? width / 2 : 14, dy: i ? 16 : 0 }, line);
            textLimits.push([span, decision ? (i ? (detail ? 156 : 176) : 92) : width - (detail ? 48 : 28), decision ? { width, height } : undefined]); label.append(span);
          });
          const kind = element('text', { class: 'diagram-node-type', x: decision ? width / 2 : 14, y: 54, 'text-anchor': decision ? 'middle' : 'start' }, globalThis.pFlow.wrapLabel(type, decision ? 18 : 32, 1)[0]);
          let short = sourceLabel(item.sources[0], true);
          const limit = decision ? 13 : 32;
          if (Array.from(short).length > limit) short = '…' + Array.from(short).slice(-(limit - 1)).join('');
          const source = element('text', { class: 'diagram-node-source', x: decision ? width / 2 : node.kind === 'terminal' ? 22 : 14, y: decision ? 65 : 69, 'text-anchor': decision ? 'middle' : 'start' }, short);
          const diamond = decision ? { width, height } : undefined;
          textLimits.push([kind, decision ? 128 : width - 28, diamond], [source, decision ? 68 : width - 44, diamond]);
          select.append(label, kind, source); group.append(select);
          if (detail) {
            const x = width - 28, y = decision ? height / 2 - 12 : 4;
            const expand = element('g', { class: 'diagram-expand-control', role: 'button', tabindex: 0, 'aria-label': `Open detail for ${node.label}: ${detail.label}.${recursive ? ' Already in this path; activate for a navigation notice.' : ''}` });
            expand.append(element('title', {}, recursive ? 'Detail already in this path' : `Open ${detail.label}`), element('rect', { x, y, width: 24, height: 24, rx: 4 }), element('text', { class: 'diagram-expand-hint', x: x + 12, y: y + 16, 'text-anchor': 'middle', 'aria-hidden': 'true' }, recursive ? '↻' : '↗'));
            action(expand, () => onOpenDetail(node.id)); group.append(expand);
          }
          scene.append(group);
        }
        svg.addEventListener('pointerdown', event => {
          if (event.button !== 0 || !event.isPrimary) return;
          suppressClick = false;
          drag = { id: event.pointerId, x: event.clientX, y: event.clientY, view: { ...view }, moved: false };
        });
        svg.addEventListener('pointermove', event => {
          if (drag?.id !== event.pointerId) return;
          if (!event.buttons) { drag = undefined; svg.classList.remove('is-panning'); return; }
          if (!drag.moved && Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5) return;
          if (!drag.moved) { drag.moved = true; svg.setPointerCapture(event.pointerId); svg.classList.add('is-panning'); }
          view = { ...drag.view, x: drag.view.x + event.clientX - drag.x, y: drag.view.y + event.clientY - drag.y }; apply();
        });
        const release = event => {
          if (drag?.id !== event.pointerId) return;
          suppressClick = drag.moved || Math.hypot(event.clientX - drag.x, event.clientY - drag.y) >= 5;
          drag = undefined; svg.classList.remove('is-panning');
          if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
        };
        svg.addEventListener('pointerup', release); svg.addEventListener('pointercancel', release); svg.addEventListener('lostpointercapture', release);
        svg.addEventListener('keydown', event => {
          if (event.target !== svg) return;
          const deltas = { ArrowLeft: [32, 0], ArrowRight: [-32, 0], ArrowUp: [0, 32], ArrowDown: [0, -32] };
          const delta = deltas[event.key]; if (!delta) return;
          event.preventDefault(); view = { ...view, x: view.x + delta[0], y: view.y + delta[1] }; apply();
        });
        container.append(svg);
        // Native measurement also bounds wide Unicode glyphs and platform-specific system fonts.
        for (const [text, maximum, diamond] of textLimits) {
          let limit = maximum;
          if (diamond) {
            // A line's real font ascent/descent matters at sloping borders.
            // Measure each tspan, not the empty corners of a multiline text box.
            const box = text.getBBox(), half = diamond.height / 2;
            const extent = Math.max(Math.abs(box.y - half), Math.abs(box.y + box.height - half));
            limit = Math.min(limit, Math.max(0, diamond.width * (1 - extent / half) - 8));
          }
          if (text.getComputedTextLength() <= limit) continue;
          const characters = Array.from(text.textContent.replace(/…$/, ''));
          do { characters.pop(); text.textContent = characters.join('') + '…'; }
          while (characters.length && text.getComputedTextLength() > limit);
        }
        fit(); onStatus('ready'); return { ok: true, empty: false };
      } catch (error) { clear(); onStatus('error', error.message); return { ok: false, error: error.message }; }
    }
    const resize = new ResizeObserver(() => { if (svg) fit(); }); resize.observe(container);
    return { render, setSelection, revealSelection, centerSelection, zoom, fit, reset, clear, destroy() { clear(); resize.disconnect(); }, getView: () => view ? { ...view } : undefined };
  }
  globalThis.pFlow.createDiagram = createDiagram;
}());
