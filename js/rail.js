/* Section rail: one tick per section at the left edge; the current one is longer.
   Hover or focus a tick to see the section name; click to jump there. */
(function () {
  function label(sec, i) {
    if (i === 0 && sec.tagName === 'HEADER') return PAGE;
    var l = sec.querySelector('.label');
    var h = sec.querySelector('h1,h2');
    var t = (l && l.textContent.trim()) || (h && h.textContent.trim()) || ('Section ' + (i + 1));
    return t.length > 28 ? t.slice(0, 27) + '…' : t;
  }
  var PAGE = {'/': 'Home', '/work/': 'Work', '/about/': 'About', '/resume/': 'Resume'}[location.pathname] || 'Intro';
  function collect() {
    var root = document.querySelector('main') || document.getElementById('dc-root');
    if (!root) return [];
    return [].slice.call(root.querySelectorAll('header, section'))
      .filter(function (s) {
        if (s.parentElement.closest('section, header')) return false;
        if (/Next case study/.test(s.getAttribute('aria-label') || '') || s.querySelector('a.next')) return false;
        return s.offsetHeight > 40;
      });
  }
  function init() {
    var secs = collect();
    if (secs.length < 3) return;
    var css = document.createElement('style');
    css.textContent =
      '.rail{position:fixed;left:24px;top:50%;transform:translateY(-50%);z-index:20;display:flex;flex-direction:column;gap:0;margin:0;padding:0;list-style:none}' +
      '.rail a{position:relative;display:flex;align-items:center;height:20px;width:44px;text-decoration:none}' +
      '.rail i{display:block;width:16px;height:1.5px;border-radius:1px;background:#d4d4d4;transition:width .2s ease,background .2s ease}' +
      '.rail a:hover i,.rail a:focus-visible i{background:#5c5c5c}' +
      '.rail a[aria-current] i{width:28px;background:#0a0a0a}' +
      '.rail span{position:absolute;left:40px;white-space:nowrap;padding:3px 8px;border-radius:6px;background:#fff;border:1px solid #e5e5e5;font:400 13px/1.3 "DM Sans",sans-serif;color:#0a0a0a;opacity:0;transform:translateX(-4px);transition:opacity .15s ease,transform .15s ease;pointer-events:none}' +
      '.rail a:hover span,.rail a:focus-visible span{opacity:1;transform:none}' +
      '.rail a:focus-visible{outline:2px solid #3e6dec;outline-offset:2px;border-radius:2px}' +
      '@media (max-width:1199px){.rail{display:none}}' +
      '@media (prefers-reduced-motion:reduce){.rail i,.rail span{transition:none}}' +
      '@media print{.rail{display:none}}';
    document.head.appendChild(css);
    var lock = -1, lockT = 0;
    var nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Sections on this page');
    var ul = document.createElement('ul'); ul.className = 'rail';
    var links = secs.map(function (s, i) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = s.id ? '#' + s.id : '#';
      a.innerHTML = '<i aria-hidden="true"></i><span>' + label(s, i).replace(/</g, '&lt;') + '</span>';
      a.setAttribute('aria-label', label(s, i));
      a.addEventListener('click', function (e) { var cur = collect()[i] || s; e.preventDefault(); lock = i; clearTimeout(lockT); lockT = setTimeout(function () { lock = -1; }, 1200); setCur(i); cur.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); a.blur(); });
      li.appendChild(a); ul.appendChild(li);
      return a;
    });
    nav.appendChild(ul); document.body.appendChild(nav);
    function setCur(k) { links.forEach(function (a, j) { if (j === k) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
    function update() {
      if (lock > -1) { setCur(lock); return; }
      var mid = window.innerHeight * 0.35, cur = 0;
      secs = collect().length === links.length ? collect() : secs;
      secs.forEach(function (s, i) { if (s.getBoundingClientRect().top <= mid) cur = i; });
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = secs.length - 1;
      links.forEach(function (a, i) { if (i === cur) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }
    var raf = 0;
    window.addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(function () { raf = 0; update(); }); }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
