export function richHtmlRuntimeScript() {
  return `
(function () {
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

  function initAgenda(root) {
    forEach(root, '.ag-ol li', function (li, index) {
      addTimer(root, setTimeout(function () { li.classList.add('vis'); }, 150 + index * 120));
    });
  }

  function initRings(root) {
    addTimer(root, setTimeout(function () {
      var circumference = 2 * Math.PI * 80;
      forEach(root, '.ring-f', function (ring) {
        var progress = Number(ring.getAttribute('data-progress') || 0);
        ring.style.strokeDashoffset = String(circumference - circumference * progress);
      });
      forEach(root, '.ring-val', function (value) {
        countUp(value, value.getAttribute('data-count-target'), 2000, value.getAttribute('data-decimals'));
      });
    }, 200));
  }

  function initBars(root) {
    addTimer(root, setTimeout(function () {
      forEach(root, '.bar', function (bar) { bar.classList.add('anim'); });
    }, 100));
  }

  function initLine(root) {
    addTimer(root, setTimeout(function () {
      forEach(root, '.lc-path,.lc-area', function (item) { item.classList.add('anim'); });
      addTimer(root, setTimeout(function () {
        forEach(root, '.lc-dot', function (dot) { dot.classList.add('vis'); });
      }, 2200));
    }, 150));
  }

  function initDonut(root) {
    addTimer(root, setTimeout(function () {
      var circumference = 2 * Math.PI * 110;
      var offset = 0;
      forEach(root, '.dn-seg', function (segment) {
        var pct = Number(segment.getAttribute('data-value') || 0) / 100;
        var length = circumference * pct;
        segment.style.strokeDasharray = length + ' ' + circumference;
        segment.style.strokeDashoffset = String(-offset);
        offset += length;
      });
      var total = root.querySelector('.dn-tot');
      if (total) countUp(total, total.getAttribute('data-count-target'), 2000, 0);
      forEach(root, '.dn-bf', function (bar) { bar.style.width = bar.getAttribute('data-w') || '0%'; });
    }, 100));
  }

  function initBook(root) {
    var book = root.querySelector('.book');
    var pages = Array.prototype.slice.call(root.querySelectorAll('.mag-page'));
    var hint = root.querySelector('.flip-hint');
    if (!book || pages.length === 0 || book.getAttribute('data-deck-rich-ready')) return;
    book.setAttribute('data-deck-rich-ready', 'true');
    var turned = 0;

    function settleZ() {
      pages.forEach(function (page, index) {
        page.style.zIndex = index < turned ? String(10 + index) : String(30 - index);
      });
    }

    function lift(page) {
      page.style.zIndex = '50';
      addTimer(root, setTimeout(settleZ, 800));
    }

    function refresh() {
      pages.forEach(function (page) { page.classList.remove('next-flip'); });
      if (turned < pages.length) {
        pages[turned].classList.add('next-flip');
        if (hint) hint.textContent = turned > 0 ? 'back or click right to continue' : 'click the right page to turn';
      } else if (hint) {
        hint.textContent = 'click left to turn back';
      }
    }

    function turnForward() {
      if (turned >= pages.length) return;
      var page = pages[turned];
      page.classList.add('flipped');
      lift(page);
      turned += 1;
      refresh();
    }

    function turnBack() {
      if (turned <= 0) return;
      turned -= 1;
      var page = pages[turned];
      page.classList.remove('flipped');
      lift(page);
      refresh();
    }

    book.addEventListener('click', function (event) {
      var rect = book.getBoundingClientRect();
      if ((event.clientX - rect.left) > rect.width / 2) turnForward();
      else turnBack();
    });

    pages.forEach(function (page) { page.classList.remove('flipped', 'next-flip'); });
    settleZ();
    refresh();
  }

  function initTimeline(root) {
    addTimer(root, setTimeout(function () {
      var progress = root.querySelector('.tl-prog');
      if (progress) progress.style.width = '100%';
      forEach(root, '.tl-n', function (node, index) {
        addTimer(root, setTimeout(function () { node.classList.add('vis'); }, index * 320));
      });
    }, 200));
  }

  function initTilt(root) {
    forEach(root, '.tc', function (card) {
      card.addEventListener('mousemove', function (event) {
        var rect = card.getBoundingClientRect();
        var mx = (event.clientX - rect.left) / rect.width;
        var my = (event.clientY - rect.top) / rect.height;
        var rx = (my - 0.5) * -16;
        var ry = (mx - 0.5) * 16;
        card.style.transform = 'perspective(600px) rotateX(' + rx + 'deg) rotateY(' + ry + 'deg) translateZ(8px)';
        card.style.setProperty('--mx', (mx * 100) + '%');
        card.style.setProperty('--my', (my * 100) + '%');
      });
      card.addEventListener('mouseleave', function () {
        card.style.transform = 'perspective(600px) rotateX(0) rotateY(0) translateZ(0)';
      });
    });
  }

  function initTypewriter(root) {
    var out = root.querySelector('.tw-txt');
    var phrases = Array.prototype.slice.call(root.querySelectorAll('.tw-pl')).map(function (item) { return item.textContent; });
    var dots = Array.prototype.slice.call(root.querySelectorAll('.tw-d'));
    if (!out || phrases.length === 0) return;
    var phrase = 0;
    var char = 0;
    var dir = 1;
    function tick() {
      if (dir === 1) {
        char += 1;
        out.textContent = phrases[phrase].slice(0, char);
        if (char >= phrases[phrase].length) {
          dir = -1;
          addTimer(root, setTimeout(tick, 1800));
          return;
        }
      } else {
        char -= 1;
        out.textContent = phrases[phrase].slice(0, char);
        if (char <= 0) {
          dir = 1;
          phrase = (phrase + 1) % phrases.length;
          dots.forEach(function (dot, index) { dot.classList.toggle('on', index === phrase); });
          addTimer(root, setTimeout(tick, 400));
          return;
        }
      }
      addTimer(root, setTimeout(tick, dir === 1 ? 42 : 22));
    }
    addTimer(root, setTimeout(tick, 300));
  }

  function initCanvasNetwork(root, options) {
    var canvas = root.querySelector('canvas');
    if (!canvas || document.body.classList.contains('deck-rich-printing')) return;
    canvas.width = 1280;
    canvas.height = 720;
    var ctx = canvas.getContext('2d');
    var count = options.count || 90;
    var pts = [];
    for (var i = 0; i < count; i += 1) {
      pts.push({
        x: Math.random() * 1280,
        y: Math.random() * 720,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: Math.random() * 2.5 + 0.5,
        hue: Math.random() > 0.5 ? '15,130,245' : '89,214,253'
      });
    }
    function frame() {
      if (options.fade) {
        ctx.fillStyle = 'rgba(6,13,24,.2)';
        ctx.fillRect(0, 0, 1280, 720);
      } else {
        ctx.clearRect(0, 0, 1280, 720);
      }
      pts.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > 1280) p.vx *= -1;
        if (p.y < 0 || p.y > 720) p.vy *= -1;
      });
      for (var a = 0; a < pts.length; a += 1) {
        for (var b = a + 1; b < pts.length; b += 1) {
          var dx = pts[a].x - pts[b].x;
          var dy = pts[a].y - pts[b].y;
          var d = Math.sqrt(dx * dx + dy * dy);
          if (d < options.link) {
            ctx.strokeStyle = 'rgba(15,130,245,' + (0.35 * (1 - d / options.link)) + ')';
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(pts[a].x, pts[a].y);
            ctx.lineTo(pts[b].x, pts[b].y);
            ctx.stroke();
          }
        }
      }
      pts.forEach(function (p) {
        ctx.fillStyle = 'rgba(' + p.hue + ',.8)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      setRaf(root, requestAnimationFrame(frame));
    }
    frame();
  }

  function initRadar(root) {
    buildRadar(root);
    addTimer(root, setTimeout(function () {
      forEach(root, '.r-p1,.r-p2', function (poly) { poly.classList.add('anim'); });
      forEach(root, '.radar-dots circle', function (dot, index) {
        addTimer(root, setTimeout(function () { dot.classList.add('vis'); }, 400 + index * 150));
      });
      forEach(root, '.rs-bf', function (bar, index) {
        addTimer(root, setTimeout(function () { bar.style.width = (bar.getAttribute('data-v') || 0) + '%'; }, 200 + index * 100));
      });
    }, 200));
  }

  function buildRadar(root) {
    if (root.getAttribute('data-radar-built')) return;
    root.setAttribute('data-radar-built', 'true');
    var svg = root.querySelector('.rad-svg');
    if (!svg) return;
    var labels = readJson(root.getAttribute('data-labels'), []);
    var values = readJson(root.getAttribute('data-values'), []);
    var baseline = readJson(root.getAttribute('data-baseline'), []);
    var cx = 190;
    var cy = 190;
    var maxR = 150;
    var axes = labels.length || 6;
    function angle(i) { return -Math.PI / 2 + (2 * Math.PI / axes) * i; }
    function pt(v, i) {
      var a = angle(i);
      var r = maxR * Math.max(0, Math.min(1, Number(v || 0) / 100));
      return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
    }
    function points(list) {
      return list.map(function (v, i) {
        var p = pt(v, i);
        return p.x + ',' + p.y;
      }).join(' ');
    }
    var grid = root.querySelector('.radar-grid');
    [20, 40, 60, 80, 100].forEach(function (level) {
      var poly = svgEl('polygon');
      poly.setAttribute('points', points(new Array(axes).fill(level)));
      poly.setAttribute('class', 'r-grid');
      grid.appendChild(poly);
    });
    var axesEl = root.querySelector('.radar-axes');
    for (var i = 0; i < axes; i += 1) {
      var p = pt(100, i);
      var line = svgEl('line');
      line.setAttribute('x1', cx);
      line.setAttribute('y1', cy);
      line.setAttribute('x2', p.x);
      line.setAttribute('y2', p.y);
      line.setAttribute('class', 'r-axis');
      axesEl.appendChild(line);
    }
    root.querySelector('.r-p1').setAttribute('points', points(values));
    root.querySelector('.r-p2').setAttribute('points', points(baseline));
    var dots = root.querySelector('.radar-dots');
    values.forEach(function (value, i) {
      var p = pt(value, i);
      var circle = svgEl('circle');
      circle.setAttribute('cx', p.x);
      circle.setAttribute('cy', p.y);
      circle.setAttribute('class', 'r-dot');
      dots.appendChild(circle);
    });
    var labelGroup = root.querySelector('.radar-labels');
    labels.forEach(function (label, i) {
      var p = pt(118, i);
      var text = svgEl('text');
      text.setAttribute('x', p.x);
      text.setAttribute('y', p.y);
      text.setAttribute('class', 'r-lbl');
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.textContent = label;
      labelGroup.appendChild(text);
    });
  }

  function initStagger(root) {
    forEach(root, '.fc', function (item) { item.classList.add('vis'); });
  }

  function initComparison(root) {
    forEach(root, '.cmp-row', function (row, index) {
      addTimer(root, setTimeout(function () { row.classList.add('vis'); }, 100 + index * 120));
    });
  }

  function initGauge(root) {
    var target = Number(root.getAttribute('data-value') || 87);
    addTimer(root, setTimeout(function () {
      snapGauge(root, target, false);
      countUp(root.querySelector('.g-val'), target, 2000, 0);
    }, 200));
  }

  function initReveal(root) {
    var items = Array.prototype.slice.call(root.querySelectorAll('.rt'));
    items.forEach(function (item, index) {
      addTimer(root, setTimeout(function () { item.classList.add('vis'); }, 100 + index * 300));
    });
    addTimer(root, setTimeout(function () {
      var hr = root.querySelector('.rev-hr');
      if (hr) hr.classList.add('vis');
    }, 600));
  }

  function initClose(root) {
    initCanvasNetwork(root, { count: 80, link: 120, fade: false });
    var button = root.querySelector('[data-deck-rich-restart]');
    if (button) {
      button.addEventListener('click', function () {
        window.location.hash = '1';
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
      });
    }
  }

  function snapGauge(root, target, disableTransition) {
    var arcLen = Math.PI * 120;
    var gfill = root.querySelector('.g-fill');
    if (gfill) {
      if (disableTransition) gfill.style.transition = 'none';
      gfill.style.strokeDasharray = String(arcLen);
      gfill.style.strokeDashoffset = String(arcLen - arcLen * target / 100);
    }
    var needle = root.querySelector('.g-needle');
    if (needle) {
      if (disableTransition) needle.style.transition = 'none';
      needle.style.transform = 'rotate(' + (-90 + 180 * target / 100) + 'deg)';
    }
    var value = root.querySelector('.g-val');
    if (value) value.textContent = String(Math.round(target));
    forEach(root, '.gm-f', function (bar) { bar.style.width = (bar.getAttribute('data-v') || 0) + '%'; });
  }

  function snapDonut(root) {
    var circumference = 2 * Math.PI * 110;
    var offset = 0;
    forEach(root, '.dn-seg', function (segment) {
      var pct = Number(segment.getAttribute('data-value') || 0) / 100;
      var length = circumference * pct;
      segment.style.transition = 'none';
      segment.style.strokeDasharray = length + ' ' + circumference;
      segment.style.strokeDashoffset = String(-offset);
      offset += length;
    });
    forEach(root, '.dn-bf', function (bar) {
      bar.style.transition = 'none';
      bar.style.width = bar.getAttribute('data-w') || '0%';
    });
    var total = root.querySelector('.dn-tot');
    if (total) total.textContent = total.getAttribute('data-count-target') || total.textContent;
  }

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
}());
`
}
