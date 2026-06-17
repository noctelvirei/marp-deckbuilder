// Thin hover runtime for SSR-SVG charts. Returns a self-contained IIFE string
// that is injected into the page (the same way the chart.js enhancer is). It is
// generic and data-driven: any element carrying `data-deck-tip` inside an
// `svg[data-deck-svgchart]` gets a floating tooltip. No JS = the server-rendered
// value labels are still visible, so the chart never goes blank.
export function svgChartHoverScript() {
  return `(() => {
  if (window.__deckSvgHover) return; window.__deckSvgHover = true;
  let tip;
  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.className = 'dsvg-tip';
    document.body.appendChild(tip);
    return tip;
  }
  function show(el, evt) {
    const text = el.getAttribute('data-deck-tip');
    if (!text) return;
    const t = ensureTip();
    t.textContent = text;
    t.style.left = evt.clientX + 'px';
    t.style.top = evt.clientY + 'px';
    t.classList.add('is-on');
  }
  function move(evt) {
    if (!tip || !tip.classList.contains('is-on')) return;
    tip.style.left = evt.clientX + 'px';
    tip.style.top = evt.clientY + 'px';
  }
  function hide() { if (tip) tip.classList.remove('is-on'); }
  document.addEventListener('pointerover', (e) => {
    const el = e.target.closest && e.target.closest('[data-deck-tip]');
    if (el && el.closest('svg[data-deck-svgchart]')) show(el, e);
  });
  document.addEventListener('pointermove', move);
  document.addEventListener('pointerout', (e) => {
    const el = e.target.closest && e.target.closest('[data-deck-tip]');
    if (el) hide();
  });
})();`
}
