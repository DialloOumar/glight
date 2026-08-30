/* ===== Guinea Light — shared site behaviour ===== */
(function () {
  'use strict';
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

  /* reveal on scroll */
  var reveals = document.querySelectorAll('[data-reveal]');
  if (reveals.length) {
    if (reduce || !('IntersectionObserver' in window)) {
      reveals.forEach(function (el) { el.classList.add('in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
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
        el.hidden = !(key === 'all' || el.dataset.type === key);
      });
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
