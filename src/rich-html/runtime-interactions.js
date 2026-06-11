export function runtimeInteractionsScript() {
  return `
  function initAgenda(root) {
    forEach(root, '.ag-ol li', function (li, index) {
      addTimer(root, setTimeout(function () { li.classList.add('vis'); }, 150 + index * 120));
    });
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

  function initStagger(root) {
    forEach(root, '.fc', function (item) { item.classList.add('vis'); });
  }

  function initComparison(root) {
    forEach(root, '.cmp-row', function (row, index) {
      addTimer(root, setTimeout(function () { row.classList.add('vis'); }, 100 + index * 120));
    });
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
`
}
