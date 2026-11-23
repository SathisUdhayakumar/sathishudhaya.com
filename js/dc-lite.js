/* dc-lite: a tiny runtime for the portfolio pages.
   Renders a template with {{holes}}, <sc-for list as>, <sc-if value>, and onX="{{fn}}" handlers,
   from a React-style Component (state, setState, renderVals, componentDidMount).
   Updates are applied with morphdom, so scroll positions and focus are kept. */
(function () {
  var handlers = {}, hid = 0;
  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (o) {
    var n = typeof o === 'function' ? o(this.state) : o;
    for (var k in n) this.state[k] = n[k];
    if (this.__schedule) this.__schedule();
  };
  window.DCLogic = DCLogic;

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g, ONE = /^\{\{\s*([^}]+?)\s*\}\}$/;
  function look(scope, path) {
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  var BOOL = { disabled: 1, checked: 1, hidden: 1, selected: 1, readonly: 1, required: 1, open: 1 };

  function proc(node, scope) {
    if (node.nodeType === 3) {
      if (node.nodeValue.indexOf('{{') > -1) node.nodeValue = node.nodeValue.replace(HOLE, function (_, p) { var v = look(scope, p); return v == null ? '' : String(v); });
      return [node];
    }
    if (node.nodeType !== 1) return [node];
    var tag = node.tagName.toLowerCase();
    if (tag === 'sc-for') {
      var m = (node.getAttribute('list') || '').match(ONE), list = m ? look(scope, m[1]) : [], as = node.getAttribute('as') || 'item', out = [];
      (list || []).forEach(function (item, i) {
        var s = Object.create(scope); s[as] = item; s.$index = i;
        Array.prototype.slice.call(node.childNodes).forEach(function (c) { out = out.concat(proc(c.cloneNode(true), s)); });
      });
      return out;
    }
    if (tag === 'sc-if') {
      var mv = (node.getAttribute('value') || '').match(ONE), ok = mv ? look(scope, mv[1]) : node.getAttribute('value');
      if (!ok || ok === 'false') return [];
      var o2 = [];
      Array.prototype.slice.call(node.childNodes).forEach(function (c) { o2 = o2.concat(proc(c.cloneNode(true), scope)); });
      return o2;
    }
    Array.prototype.slice.call(node.attributes).forEach(function (a) {
      if (a.value.indexOf('{{') < 0) return;
      var name = a.name, one = a.value.match(ONE);
      if (/^on[a-z]+$/i.test(name)) {
        var fn = one ? look(scope, one[1]) : null; node.removeAttribute(name);
        if (typeof fn === 'function') { var id = 'h' + (++hid); handlers[id] = fn; node.setAttribute('data-dc-' + name.slice(2).toLowerCase(), id); }
        return;
      }
      if (one) {
        var v = look(scope, one[1]);
        if (BOOL[name.toLowerCase()]) { if (v && v !== 'false') node.setAttribute(name, ''); else node.removeAttribute(name); return; }
        if (v == null || v === false) { node.removeAttribute(name); return; }
        node.setAttribute(name, String(v)); return;
      }
      node.setAttribute(name, a.value.replace(HOLE, function (_, p) { var v = look(scope, p); return v == null ? '' : String(v); }));
    });
    var kids = Array.prototype.slice.call(node.childNodes);
    kids.forEach(function (c) {
      var r = proc(c, scope);
      if (r.length === 1 && r[0] === c) return;
      r.forEach(function (x) { node.insertBefore(x, c); });
      node.removeChild(c);
    });
    return [node];
  }

  window.dcMount = function (Comp, tplId, rootId) {
    var tpl = document.getElementById(tplId), root = document.getElementById(rootId);
    var comp = new Comp({}), queued = false;
    function render() {
      queued = false; handlers = {}; hid = 0;
      var vals = comp.renderVals ? comp.renderVals() : {};
      var frag = tpl.content.cloneNode(true), box = document.createElement('div');
      box.id = rootId;
      Array.prototype.slice.call(frag.childNodes).forEach(function (c) { proc(c, vals).forEach(function (x) { box.appendChild(x); }); });
      morphdom(root, box, {
        onBeforeElUpdated: function (from, to) {
          if (from.id === 'mk-slot') return false;
          if (from === document.activeElement && (from.tagName === 'INPUT' || from.tagName === 'TEXTAREA')) { to.value = from.value; }
          return true;
        }
      });
    }
    comp.__schedule = function () { if (!queued) { queued = true; requestAnimationFrame(render); } };
    ['click', 'input', 'change', 'keydown'].forEach(function (ev) {
      root.addEventListener(ev, function (e) {
        var el = e.target.closest ? e.target.closest('[data-dc-' + ev + ']') : null;
        if (!el || !root.contains(el)) return;
        var fn = handlers[el.getAttribute('data-dc-' + ev)];
        if (fn) fn(e);
      });
    });
    render();
    if (comp.componentDidMount) comp.componentDidMount();
    window.addEventListener('pagehide', function () { if (comp.componentWillUnmount) comp.componentWillUnmount(); });
    return comp;
  };
})();
