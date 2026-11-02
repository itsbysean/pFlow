/* Presentation state only. Graph, document and search state stay in their components. */
globalThis.pFlow = globalThis.pFlow || {};
(function () {
  const byId = id => document.getElementById(id), shell = byId('app-layout');
  const rail = 38, divider = 8;
  const sides = {
    left: { panel: byId('process-explorer'), content: byId('explorer-content'), button: byId('toggle-left'), handle: byId('resize-left'), min: 180, max: 420, width: 280, closed: false, name: 'process explorer' },
    right: { panel: byId('process-documentation'), content: byId('documentation-content'), button: byId('toggle-right'), handle: byId('resize-right'), min: 280, max: 640, width: 420, closed: false, name: 'process documentation' },
  };
  const span = side => side.closed ? rail : side.width;
  const minimum = side => Math.min(side.min, Math.max(140, shell.clientWidth * .42));
  const centerMinimum = () => Math.min(320, Math.max(100, shell.clientWidth - rail - divider * 2 - minimum(sides.right)));
  const available = () => shell.clientWidth - centerMinimum() - divider * 2;
  function apply() {
    for (const [key, side] of Object.entries(sides)) {
      const other = sides[key === 'left' ? 'right' : 'left'];
      const active = side.content.contains(document.activeElement) || side.handle === document.activeElement;
      side.content.hidden = side.closed;
      side.panel.classList.toggle('panel-collapsed', side.closed);
      side.button.setAttribute('aria-expanded', String(!side.closed));
      side.button.setAttribute('aria-label', `${side.closed ? 'Restore' : 'Collapse'} ${side.name}`);
      side.button.title = side.button.getAttribute('aria-label');
      side.button.textContent = (key === 'left') !== side.closed ? '«' : '»';
      side.handle.setAttribute('aria-disabled', String(side.closed));
      side.handle.tabIndex = side.closed ? -1 : 0;
      side.handle.setAttribute('aria-valuemin', String(Math.round(minimum(side))));
      side.handle.setAttribute('aria-valuemax', String(Math.round(Math.max(minimum(side), Math.min(side.max, available() - span(other))))));
      side.handle.setAttribute('aria-valuenow', String(Math.round(side.width)));
      shell.style.setProperty(`--${key}-width`, `${span(side)}px`);
      if (active && side.closed) side.button.focus({ preventScroll: true });
    }
  }
  function fit(preferred) {
    for (const side of Object.values(sides)) side.width = Math.max(minimum(side), Math.min(side.max, side.width));
    // Reduce expanded panels before collapsing. Never hide the restore buttons.
    for (const key of ['right', 'left']) {
      const side = sides[key];
      if (!side.closed) side.width = Math.max(minimum(side), side.width - Math.max(0, span(sides.left) + span(sides.right) - available()));
    }
    for (const key of preferred === 'left' ? ['right', 'left'] : ['left', 'right']) {
      if (span(sides.left) + span(sides.right) <= available()) break;
      sides[key].closed = true;
    }
    apply();
  }
  function reveal(key) { sides[key].closed = false; fit(key); }
  for (const [key, side] of Object.entries(sides)) {
    side.button.addEventListener('click', () => { side.closed = !side.closed; fit(key); });
    function resize(width) {
      const other = sides[key === 'left' ? 'right' : 'left'];
      side.width = Math.max(minimum(side), Math.min(side.max, available() - span(other), width)); apply();
    }
    let drag;
    side.handle.addEventListener('pointerdown', event => {
      if (side.closed || event.button !== 0) return;
      event.preventDefault(); side.handle.focus();
      drag = { id: event.pointerId, x: event.clientX, width: side.width };
      side.handle.setPointerCapture(event.pointerId); shell.classList.add('is-resizing');
    });
    side.handle.addEventListener('pointermove', event => {
      if (drag?.id !== event.pointerId) return;
      resize(drag.width + (event.clientX - drag.x) * (key === 'left' ? 1 : -1));
    });
    function stop(event) {
      if (drag?.id !== event.pointerId) return;
      if (event.type === 'pointercancel') resize(drag.width);
      drag = undefined; shell.classList.remove('is-resizing');
      if (side.handle.hasPointerCapture(event.pointerId)) side.handle.releasePointerCapture(event.pointerId);
    }
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) side.handle.addEventListener(event, stop);
    side.handle.addEventListener('keydown', event => {
      if (side.closed || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      resize(event.key === 'Home' ? minimum(side) : event.key === 'End' ? side.max : side.width + (event.key === 'ArrowRight' ? 20 : -20) * (key === 'left' ? 1 : -1));
    });
  }
  byId('theme-toggle').addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme !== 'dark';
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    byId('theme-toggle').setAttribute('aria-pressed', String(dark));
    byId('theme-toggle').setAttribute('aria-label', `Use ${dark ? 'light' : 'dark'} theme`);
    byId('theme-toggle').firstElementChild.textContent = dark ? '☀' : '☾';
  });
  new ResizeObserver(() => fit()).observe(shell);
  fit();
  globalThis.pFlow.layout = { reveal };
}());
