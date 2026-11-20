(() => {
  const $ = (s) => document.querySelector(s);
  const root = document.documentElement;
  let s = '', fresh = false, err = false, deg = true, last = '0', hist = [];
  try {
    hist = JSON.parse(localStorage.getItem('calc.hist')) || [];
    root.dataset.theme = localStorage.getItem('calc.theme') || 'dark';
  } catch (e) {}

  // ---- Safe expression evaluator (recursive descent, no eval) ----
  function calc(src) {
    const clean = src.toLowerCase();
    if (clean.replace(/\d+\.?\d*|\.\d+|[a-z]+|[-+*/^%!()\s]/g, '')) throw new Error('bad input');
    const t = clean.match(/\d+\.?\d*|\.\d+|[a-z]+|[-+*/^%!()]/g) || [];
    let p = 0;
    const peek = () => t[p], next = () => t[p++];
    const ang = (x) => (deg ? (x * Math.PI) / 180 : x);
    const F = { sin: (x) => Math.sin(ang(x)), cos: (x) => Math.cos(ang(x)), tan: (x) => Math.tan(ang(x)),
                log: Math.log10, ln: Math.log, sqrt: Math.sqrt };
    const fact = (n) => { if (n < 0 || n > 170 || n !== Math.floor(n)) return NaN; let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
    // x + y% means "x plus y percent of x"
    function expr() {
      let l = term();
      while (peek() === '+' || peek() === '-') {
        const op = next(), r = term(), rv = r.pct ? l.v * r.v : r.v;
        l = { v: op === '+' ? l.v + rv : l.v - rv };
      }
      return l.v;
    }
    function term() {
      let l = unary();
      while (peek() === '*' || peek() === '/') { const op = next(), r = unary(); l = { v: op === '*' ? l.v * r.v : l.v / r.v }; }
      return l;
    }
    function unary() {
      if (peek() === '-') { next(); const u = unary(); return { v: -u.v, pct: u.pct }; }
      if (peek() === '+') { next(); return unary(); }
      return power();
    }
    function power() {
      const b = post();
      if (peek() === '^') { next(); return { v: Math.pow(b.v, unary().v) }; }
      return b;
    }
    function post() {
      let x = atom();
      while (peek() === '!' || peek() === '%') x = next() === '!' ? { v: fact(x.v) } : { v: x.v / 100, pct: true };
      return x;
    }
    function atom() {
      const k = next();
      if (k === undefined) throw new Error('unexpected end');
      if (k === '(') { const v = expr(); if (next() !== ')') throw new Error('missing )'); return { v }; }
      if (/^[\d.]/.test(k)) return { v: parseFloat(k) };
      if (k === 'pi') return { v: Math.PI };
      if (k === 'e') return { v: Math.E };
      if (F[k]) { if (next() !== '(') throw new Error('missing ('); const v = expr(); if (next() !== ')') throw new Error('missing )'); return { v: F[k](v) }; }
      throw new Error('unknown ' + k);
    }
    const v = expr();
    if (p < t.length) throw new Error('extra input');
    return v;
  }
  const fmt = (v) => {
    if (!Number.isFinite(v)) throw new Error('not finite');
    const r = Number(v.toPrecision(12));
    return Math.abs(r) < 1e-12 ? '0' : String(r);
  };
  window.__calc = { calc, setDeg: (d) => (deg = d), fmt }; // exposed for testing

  // ---- Keys ----
  const BASIC = [['AC','ac','fn'],['⌫','del','fn'],['(','(','fn'],[')',')','fn'],['7'],['8'],['9'],['÷','/','op'],['4'],['5'],['6'],['×','*','op'],['1'],['2'],['3'],['−','-','op'],['0'],['.'],['%','%','op'],['+','+','op'],['=','=','eq']];
  const SCI = [['sin','sin('],['cos','cos('],['tan','tan('],['√','sqrt('],['log','log('],['ln','ln('],['x²','^2'],['xʸ','^'],['π','pi'],['e','e'],['x!','!'],['1/x','1/(']];
  const LABEL = { '⌫': 'Delete', '÷': 'Divide', '×': 'Multiply', '−': 'Subtract', '=': 'Equals', 'AC': 'All clear' };
  const mk = (a, extra) => `<button class="k ${a[2] || ''} ${extra}" data-v="${a[1] || a[0]}"${LABEL[a[0]] ? ` aria-label="${LABEL[a[0]]}"` : ''}>${a[0]}</button>`;
  $('#keys').innerHTML = BASIC.map((a) => mk(a, '')).join('');
  $('#sciKeys').innerHTML = SCI.map((a) => mk(a, 'sci')).join('');

  // ---- State handling ----
  const disp = (x) => x.replace(/\*/g, '×').replace(/\//g, '÷').replace(/-/g, '−').replace(/pi/g, 'π').replace(/sqrt/g, '√');
  function draw() {
    if (!s) last = '0'; else { try { last = fmt(calc(s)); } catch (e) {} }
    $('#expr').textContent = disp(s);
    $('#res').textContent = err ? 'Error' : last;
  }
  function press(v) {
    err = false;
    if (v === 'ac') { s = ''; fresh = false; return draw(); }
    if (v === 'del') { s = fresh ? '' : s.replace(/(sin\(|cos\(|tan\(|sqrt\(|log\(|ln\(|pi|.)$/, ''); fresh = false; return draw(); }
    if (v === '=') return equals();
    const isOp = /^(\^2|[-+*/^%!])$/.test(v);
    if (fresh && !isOp) s = '';
    fresh = false; s += v; draw();
  }
  function equals() {
    if (!s) return;
    try {
      const r = fmt(calc(s));
      hist.unshift({ e: s, r }); hist = hist.slice(0, 30); saveHist(); renderHist();
      s = /e/i.test(r) ? '' : r; last = r; fresh = true;
    } catch (e) { err = true; }
    draw();
  }
  const saveHist = () => { try { localStorage.setItem('calc.hist', JSON.stringify(hist)); } catch (e) {} };
  function renderHist() {
    const ul = $('#list'); ul.innerHTML = '';
    if (!hist.length) { ul.innerHTML = '<li class="empty">No calculations yet</li>'; return; }
    hist.forEach((h) => {
      const li = document.createElement('li'), b = document.createElement('button'), sm = document.createElement('small');
      sm.textContent = disp(h.e); b.append(sm, document.createTextNode('= ' + h.r));
      b.title = 'Use this result'; b.onclick = () => { if (!/e/i.test(h.r)) { s = h.r; fresh = true; err = false; draw(); } };
      li.append(b); ul.append(li);
    });
  }

  // ---- Events ----
  document.addEventListener('click', (e) => { const k = e.target.closest('.k'); if (k) press(k.dataset.v); });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const k = e.key;
    if (/^[0-9.+\-*/^()%!]$/.test(k)) { press(k); e.preventDefault(); }
    else if (k === 'Enter' || k === '=') { press('='); e.preventDefault(); }
    else if (k === 'Backspace') { press('del'); e.preventDefault(); }
    else if (k === 'Escape') press('ac');
  });
  $('#sci').onclick = (e) => { const on = e.currentTarget.getAttribute('aria-pressed') !== 'true'; e.currentTarget.setAttribute('aria-pressed', on); $('#sciKeys').hidden = !on; };
  $('#deg').onclick = (e) => { deg = !deg; e.currentTarget.textContent = deg ? 'DEG' : 'RAD'; e.currentTarget.setAttribute('aria-label', 'Angle unit: ' + (deg ? 'degrees' : 'radians')); draw(); };
  $('#theme').onclick = () => { const n = root.dataset.theme === 'dark' ? 'light' : 'dark'; root.dataset.theme = n; try { localStorage.setItem('calc.theme', n); } catch (e) {} };
  $('#clearHist').onclick = () => { hist = []; saveHist(); renderHist(); };
  renderHist(); draw();
})();
