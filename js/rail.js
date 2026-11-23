/* Section rail: one tick per section at the left edge; the current one is longer.
   Hover or focus a tick to see the section name; click to jump there. */
(function () {
  function label(sec, i) {
    var l = sec.querySelector('.label');
    var h = sec.querySelector('h1,h2');
    var t = (l && l.textContent.trim()) || (h && h.textContent.trim()) || ('Section ' + (i + 1));
    return t.length > 28 ? t.slice(0, 27) + '…' : t;
  }
  function init() {
    var main = document.querySelector('main');
    if (!main) return;
    var secs = [].slice.call(main.querySelectorAll(':scope > header, :scope > section, :scope > div > section, #talk'))
      .filter(function (s) { return s.offsetHeight > 40 && !/Next case study/.test(s.getAttribute('aria-label') || ''); });
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
    var nav = document.createElement('nav');
    nav.setAttribute('aria-label', 'Sections on this page');
    var ul = document.createElement('ul'); ul.className = 'rail';
    var links = secs.map(function (s, i) {
      if (!s.id) s.id = 'sec-' + (i + 1);
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.href = '#' + s.id;
      a.innerHTML = '<i aria-hidden="true"></i><span>' + label(s, i).replace(/</g, '&lt;') + '</span>';
      a.setAttribute('aria-label', label(s, i));
      li.appendChild(a); ul.appendChild(li);
      return a;
    });
    nav.appendChild(ul); document.body.appendChild(nav);
    function update() {
      var mid = window.innerHeight * 0.35, cur = 0;
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
