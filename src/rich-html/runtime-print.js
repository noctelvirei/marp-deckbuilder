export function runtimePrintScript() {
  return `
  function snapRoot(root) {
    cancelRaf(root);
    clearTimers(root);
    if (root.hasAttribute('data-deck-rich-radar')) buildRadar(root);
    forEach(root, '.ag-ol li,.tl-n,.fc,.cmp-row,.rt', function (item) {
      item.style.transition = 'none';
      item.classList.add('vis');
    });
    forEach(root, '.bar', function (item) { item.style.transition = 'none'; item.classList.add('anim'); });
    forEach(root, '.lc-path,.lc-area,.r-p1,.r-p2', function (item) { item.style.transition = 'none'; item.classList.add('anim'); });
    forEach(root, '.lc-dot,.r-dot', function (item) { item.style.transition = 'none'; item.classList.add('vis'); });
    var tlp = root.querySelector('.tl-prog');
    if (tlp) { tlp.style.transition = 'none'; tlp.style.width = '100%'; }
    var hr = root.querySelector('.rev-hr');
    if (hr) { hr.style.transition = 'none'; hr.classList.add('vis'); }
    if (root.hasAttribute('data-deck-rich-stats')) {
      var circumference = 2 * Math.PI * 80;
      forEach(root, '.ring-f', function (ring) {
        ring.style.transition = 'none';
        var progress = Number(ring.getAttribute('data-progress') || 0);
        ring.style.strokeDashoffset = String(circumference - circumference * progress);
      });
      forEach(root, '.ring-val', function (value) { value.textContent = value.getAttribute('data-count-target') || value.textContent; });
    }
    if (root.hasAttribute('data-deck-rich-donut')) {
      snapDonut(root);
    }
    if (root.hasAttribute('data-deck-rich-gauge')) snapGauge(root, Number(root.getAttribute('data-value') || 87), true);
  }

  function enterPrintMode() {
    document.body.classList.add('deck-rich-printing');
    roots().forEach(function (root) {
      initRoot(root);
      snapRoot(root);
    });
  }

  function exitPrintMode() {
    document.body.classList.remove('deck-rich-printing');
  }
`
}
