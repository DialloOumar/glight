/* ===== Guinea Light — shared site behaviour ===== */
(function () {
  'use strict';
  window.__glReady = true;      // tells the inline failsafe the reveal logic is live
  var WA = '224600000000'; // TODO: replace with the real WhatsApp number
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* header condense */
  var hdr = document.getElementById('hdr');
  if (hdr) {
    var syncHeader = function () { hdr.classList.toggle('scrolled', scrollY > 40); };
    addEventListener('scroll', syncHeader, { passive: true });
    syncHeader();
  }

  /* mobile drawer */
  var drawer = document.getElementById('drawer');
  var burger = document.getElementById('burger');
  if (drawer && burger) {
    var setDrawer = function (open) {
      drawer.classList.toggle('open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    };
    burger.onclick = function () { setDrawer(true); };
    var close = document.getElementById('drawer-close');
    if (close) close.onclick = function () { setDrawer(false); };
    drawer.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setDrawer(false); });
    });
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setDrawer(false);
    });
  }

  /* cascade grid children instead of landing them all at once */
  document.querySelectorAll('.stagger').forEach(function (c) {
    Array.prototype.forEach.call(c.children, function (el, i) {
      el.style.transitionDelay = Math.min(i, 9) * 70 + 'ms';
    });
  });

  /* count the stat numbers up when they scroll into view */
  var countUp = function (row) {
    if (reduce) return;
    row.querySelectorAll('b').forEach(function (b) {
      // only plain counts, optionally with a trailing "+"; anything else
      // (e.g. "7j/7") would animate into nonsense like "3j/7"
      var m = /^(\d+)(\+?)$/.exec(b.textContent.trim());
      if (!m) return;
      var target = +m[1], suffix = m[2], t0 = 0;
      var step = function (ts) {
        if (!t0) t0 = ts;
        var k = Math.min((ts - t0) / 1100, 1);
        k = 1 - Math.pow(1 - k, 3);         // ease-out
        b.textContent = Math.round(target * k) + suffix;
        if (k < 1) requestAnimationFrame(step);
      };
      b.textContent = '0' + suffix;
      requestAnimationFrame(step);
    });
  };

  /* reveal on scroll */
  // .stagger containers are observed too — a .gal sits inside a venue rather
  // than carrying data-reveal itself, and its children start at opacity:0
  var reveals = document.querySelectorAll('[data-reveal], .stagger');
  if (reveals.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          en.target.classList.add('in');
          if (en.target.classList.contains('stats__row')) countUp(en.target);
          io.unobserve(en.target);
        });
      }, { rootMargin: '0px 0px -12% 0px' });
      reveals.forEach(function (el) { io.observe(el); });
    }
  }

  /* hero cursor spotlight (home only, pointer devices only) */
  var spot = document.getElementById('spot');
  var hero = document.getElementById('top');
  if (spot && hero && matchMedia('(hover:hover)').matches && !reduce) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      var mx = ((e.clientX - r.left) / r.width * 100).toFixed(1);
      var my = ((e.clientY - r.top) / r.height * 100).toFixed(1);
      spot.style.background = 'radial-gradient(46vmax 46vmax at ' + mx + '% ' + my +
        '%, rgba(228,192,141,.16), rgba(228,192,141,.04) 34%, transparent 62%)';
    }, { passive: true });
  }

  /* filter chips — used by Réalisations and Catalogue */
  var chipRow = document.querySelector('[data-filter-for]');
  if (chipRow) {
    var items = document.querySelectorAll('#' + chipRow.dataset.filterFor + ' [data-type]');
    chipRow.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var key = chip.dataset.key;
      chipRow.querySelectorAll('.chip').forEach(function (c) {
        c.setAttribute('aria-pressed', String(c === chip));
      });
      items.forEach(function (el) {
        var show = (key === 'all' || el.dataset.type === key);
        el.hidden = !show;
        // an item revealed by filtering may never trigger the scroll observer,
        // so settle its reveal state here rather than leave it at opacity:0
        if (show) {
          el.classList.add('in');
          el.querySelectorAll('[data-reveal], .stagger').forEach(function (c) { c.classList.add('in'); });
        }
      });
    });
  }

  /* lightbox — walks whichever gallery the clicked photo belongs to */
  var lb = document.getElementById('lightbox');
  if (lb) {
    var lbImg = document.getElementById('lb-img');
    var lbCap = document.getElementById('lb-cap');
    var shots = [], at = 0;

    var show = function (i) {
      if (!shots.length) return;
      at = (i + shots.length) % shots.length;
      var b = shots[at];
      lbImg.src = b.dataset.full;
      lbImg.alt = b.dataset.alt || '';
      lbCap.textContent = (b.dataset.alt || '') + '  ·  ' + (at + 1) + '/' + shots.length;
    };
    var close = function () {
      lb.hidden = true;
      lbImg.src = '';
      document.body.style.overflow = '';
    };

    document.querySelectorAll('.gal').forEach(function (gal) {
      gal.addEventListener('click', function (e) {
        var btn = e.target.closest('.gal__i');
        if (!btn) return;
        shots = Array.prototype.slice.call(gal.querySelectorAll('.gal__i'));
        lb.hidden = false;
        document.body.style.overflow = 'hidden';
        show(shots.indexOf(btn));
      });
    });

    document.getElementById('lb-close').onclick = close;
    document.getElementById('lb-prev').onclick = function () { show(at - 1); };
    document.getElementById('lb-next').onclick = function () { show(at + 1); };
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    addEventListener('keydown', function (e) {
      if (lb.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(at - 1);
      else if (e.key === 'ArrowRight') show(at + 1);
    });
  }

  /* contact form -> WhatsApp */
  var send = document.getElementById('send');
  if (send) {
    send.addEventListener('click', function () {
      var val = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var lines = [
        'Bonjour Guinea Light,',
        '',
        'Nom : ' + (val('gl-nom') || '—'),
        'Type : ' + (val('gl-type') || '—'),
        'Date : ' + (val('gl-date') || 'à définir'),
        '',
        val('gl-msg') || 'Je souhaite un devis pour mon lieu.'
      ];
      open('https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n')), '_blank', 'noopener');
    });
  }

  /* footer year */
  var yr = document.getElementById('yr');
  if (yr) yr.textContent = new Date().getFullYear();
})();
