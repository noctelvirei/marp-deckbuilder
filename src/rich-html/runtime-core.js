export function runtimeCoreScript() {
  return `
  var initialized = new WeakSet();
  var rafs = new WeakMap();
  var timers = new WeakMap();
  var observers = [];

  function roots() {
    return Array.prototype.slice.call(document.querySelectorAll('[data-deck-rich]'));
  }

  function forEach(root, selector, fn) {
    Array.prototype.slice.call(root.querySelectorAll(selector)).forEach(fn);
  }

  function addTimer(root, timer) {
    var list = timers.get(root) || [];
    list.push(timer);
    timers.set(root, list);
  }

  function clearTimers(root) {
    (timers.get(root) || []).forEach(function (timer) { clearTimeout(timer); });
    timers.set(root, []);
  }

  function setRaf(root, frame) {
    rafs.set(root, frame);
  }

  function cancelRaf(root) {
    var frame = rafs.get(root);
    if (frame) cancelAnimationFrame(frame);
    rafs.delete(root);
  }

  function easeOutExpo(t) {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  }

  function countUp(el, target, duration, decimals) {
    if (!el) return;
    var start = performance.now();
    var precision = Number(decimals || 0);
    var rawTarget = String(target || 0);
    var numericTarget = Number(rawTarget.replace(/,/g, ''));
    if (!Number.isFinite(numericTarget)) numericTarget = 0;
    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var value = easeOutExpo(t) * numericTarget;
      el.textContent = precision ? value.toFixed(precision) : String(Math.round(value));
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = precision ? numericTarget.toFixed(precision) : rawTarget;
    }
    requestAnimationFrame(tick);
  }

  function initRoot(root) {
    if (!root || initialized.has(root)) return;
    initialized.add(root);
    if (root.hasAttribute('data-deck-rich-cover')) initCanvasNetwork(root, { count: 80, link: 120, fade: false });
    if (root.hasAttribute('data-deck-rich-agenda')) initAgenda(root);
    if (root.hasAttribute('data-deck-rich-stats')) initRings(root);
    if (root.hasAttribute('data-deck-rich-bars')) initBars(root);
    if (root.hasAttribute('data-deck-rich-line')) initLine(root);
    if (root.hasAttribute('data-deck-rich-donut')) initDonut(root);
    if (root.hasAttribute('data-deck-rich-book')) initBook(root);
    if (root.hasAttribute('data-deck-rich-timeline')) initTimeline(root);
    if (root.hasAttribute('data-deck-rich-tilt-cards')) initTilt(root);
    if (root.hasAttribute('data-deck-rich-typewriter')) initTypewriter(root);
    if (root.hasAttribute('data-deck-rich-particles')) initCanvasNetwork(root, { count: 120, link: 100, fade: true });
    if (root.hasAttribute('data-deck-rich-radar')) initRadar(root);
    if (root.hasAttribute('data-deck-rich-stagger-grid')) initStagger(root);
    if (root.hasAttribute('data-deck-rich-comparison')) initComparison(root);
    if (root.hasAttribute('data-deck-rich-gauge')) initGauge(root);
    if (root.hasAttribute('data-deck-rich-reveal')) initReveal(root);
    if (root.hasAttribute('data-deck-rich-close')) initClose(root);
  }

  function initVisibleRoots() {
    roots().forEach(function (root) {
      var section = root.closest('section');
      if (
        !section ||
        section.classList.contains('bespoke-active') ||
        section.classList.contains('bespoke-marp-active') ||
        section.classList.contains('report-rich-block')
      ) initRoot(root);
    });
  }

  function observeSlides() {
    var sections = Array.prototype.slice.call(document.querySelectorAll('section'));
    sections.forEach(function (section) {
      var observer = new MutationObserver(function () {
        if (section.classList.contains('bespoke-active') || section.classList.contains('bespoke-marp-active')) {
          forEach(section, '[data-deck-rich]', initRoot);
        }
      });
      observer.observe(section, { attributes: true, attributeFilter: ['class'] });
      observers.push(observer);
    });

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) initRoot(entry.target);
        });
      }, { threshold: 0.45 });
      roots().forEach(function (root) { io.observe(root); });
      observers.push({ disconnect: function () { io.disconnect(); } });
    }
  }

  function svgEl(name) {
    return document.createElementNS('http://www.w3.org/2000/svg', name);
  }

  function readJson(value, fallback) {
    try { return JSON.parse(value || ''); } catch (error) { return fallback; }
  }

  function boot() {
    observeSlides();
    initVisibleRoots();
    setTimeout(initVisibleRoots, 300);
  }

  window.deckRichHtml = {
    initAll: function () { roots().forEach(initRoot); },
    enterPrintMode: enterPrintMode,
    exitPrintMode: exitPrintMode,
    snapAll: function () { roots().forEach(snapRoot); }
  };

  window.addEventListener('beforeprint', enterPrintMode);
  window.addEventListener('afterprint', exitPrintMode);

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
`
}
