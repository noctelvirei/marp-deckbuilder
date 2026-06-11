export function runtimeChartsScript() {
  return `
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

  function initGauge(root) {
    var target = Number(root.getAttribute('data-value') || 87);
    addTimer(root, setTimeout(function () {
      snapGauge(root, target, false);
      countUp(root.querySelector('.g-val'), target, 2000, 0);
    }, 200));
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
`
}
