/* Viewport math in CSS pixels. Shared by buttons, panning, and deterministic tests. */
globalThis.pFlow = globalThis.pFlow || {};
(function () {
  function fitDiagram(bounds, width, height, padding = 24) {
    if (![bounds.x, bounds.y, bounds.width, bounds.height, width, height, padding].every(Number.isFinite)
        || width <= 0 || height <= 0 || bounds.width < 0 || bounds.height < 0 || padding < 0) throw new Error('Invalid viewport dimensions.');
    const scale = Math.min(1, Math.max(1, width - padding * 2) / Math.max(1, bounds.width), Math.max(1, height - padding * 2) / Math.max(1, bounds.height));
    return { scale, x: (width - bounds.width * scale) / 2 - bounds.x * scale, y: (height - bounds.height * scale) / 2 - bounds.y * scale };
  }
  function zoomDiagram(view, factor, anchor, minimum = .05, maximum = 3) {
    if (![view.scale, view.x, view.y, factor, anchor.x, anchor.y, minimum, maximum].every(Number.isFinite)
        || view.scale <= 0 || factor <= 0 || minimum <= 0 || maximum < minimum) throw new Error('Invalid zoom values.');
    const scale = Math.min(maximum, Math.max(minimum, view.scale * factor));
    const ratio = scale / view.scale;
    return { scale, x: anchor.x - (anchor.x - view.x) * ratio, y: anchor.y - (anchor.y - view.y) * ratio };
  }
  Object.assign(globalThis.pFlow, { fitDiagram, zoomDiagram });
}());
