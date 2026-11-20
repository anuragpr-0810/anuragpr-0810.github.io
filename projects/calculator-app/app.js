(() => {
  const expression = document.querySelector('#expression');
  const result = document.querySelector('#result');
  const status = document.querySelector('#status');
  const historyList = document.querySelector('#history');
  const STORAGE = 'prism-calculator-history-v1';
  let input = '';
  let history = JSON.parse(localStorage.getItem(STORAGE) || '[]');
  const render = () => { expression.textContent = input || '0'; };
  const cleanNumber = value => { if (!Number.isFinite(value)) throw new Error('Undefined result'); return String(Number(value.toPrecision(12))); };
  function calculate(source) {
    const tokens = source.match(/(?:\d+\.?\d*|\.\d+)|sin|cos|tan|sqrt|[()+\-*/%^]/gi) || [];
    if (tokens.join('') !== source.replace(/\s/g, '')) throw new Error('Unsupported character');
    let i = 0;
    const peek = () => tokens[i];
    const take = () => tokens[i++];
    const primary = () => {
      let token = take();
      if (token === '+') return unary();
      if (token === '-') return -unary();
      if (token === '(') { const value = sum(); if (take() !== ')') throw new Error('Missing )'); return value; }
      if (/^(sin|cos|tan|sqrt)$/i.test(token || '')) {
        const name = token.toLowerCase();
        let value;
        if (peek() === '(') { take(); value = sum(); if (take() !== ')') throw new Error('Missing )'); }
        else value = unary();
        if (name === 'sqrt') { if (value < 0) throw new Error('Invalid square root'); return Math.sqrt(value); }
        const radians = value * Math.PI / 180;
        return name === 'sin' ? Math.sin(radians) : name === 'cos' ? Math.cos(radians) : Math.tan(radians);
      }
      if (!token || !/^\d*\.?\d+$/.test(token)) throw new Error('Check your expression');
      return Number(token);
    };
    const postfix = () => { let value = primary(); while (peek() === '%') { take(); value /= 100; } return value; };
    const power = () => { let left = postfix(); if (peek() === '^') { take(); left = left ** unary(); } return left; };
    const unary = () => { if (peek() === '+') { take(); return unary(); } if (peek() === '-') { take(); return -unary(); } return power(); };
    const product = () => { let value = unary(); while (peek() === '*' || peek() === '/') { const op = take(), right = unary(); value = op === '*' ? value * right : value / right; } return value; };
    const sum = () => { let value = product(); while (peek() === '+' || peek() === '-') { const op = take(), right = product(); value = op === '+' ? value + right : value - right; } return value; };
    if (!tokens.length) throw new Error('Enter a calculation');
    const value = sum(); if (i !== tokens.length) throw new Error('Check your expression');
    return cleanNumber(value);
  }
  function drawHistory() {
    historyList.replaceChildren();
    if (!history.length) { const empty = document.createElement('li'); empty.className = 'history-empty'; empty.textContent = 'Your calculations will appear here.'; historyList.append(empty); return; }
    history.slice(0, 12).forEach(item => { const li = document.createElement('li'), a = document.createElement('span'), b = document.createElement('span'); a.textContent = item.expression; b.textContent = `= ${item.result}`; li.append(a, b); li.title = 'Click to reuse this calculation'; li.tabIndex = 0; li.addEventListener('click', () => { input = item.expression; render(); status.textContent = 'History recalled'; }); historyList.append(li); });
  }
  function act(action) {
    if (action === 'clear') { input = ''; result.textContent = '0'; status.textContent = 'Cleared'; }
    if (action === 'delete') { input = input.slice(0, -1); status.textContent = 'Ready'; }
    if (action === 'sign') { input = input ? `-(${input})` : '-'; }
    if (action === 'equals') { try { const answer = calculate(input); result.textContent = answer; status.textContent = 'Calculated'; history.unshift({ expression: input, result: answer }); history = history.slice(0, 12); localStorage.setItem(STORAGE, JSON.stringify(history)); drawHistory(); } catch (error) { status.textContent = error.message; } }
    render();
  }
  document.querySelector('.keypad').addEventListener('click', event => { const key = event.target.closest('button'); if (!key) return; if (key.dataset.action) act(key.dataset.action); else { input += key.dataset.value; status.textContent = 'Ready'; render(); } });
  document.addEventListener('keydown', event => { if (/^[0-9.+\-*/%^()]$/.test(event.key)) { input += event.key; render(); status.textContent = 'Ready'; } else if (event.key === 'Enter' || event.key === '=') { event.preventDefault(); act('equals'); } else if (event.key === 'Backspace') act('delete'); else if (event.key === 'Escape') act('clear'); });
  document.querySelector('#clear-history').addEventListener('click', () => { history = []; localStorage.removeItem(STORAGE); drawHistory(); status.textContent = 'History cleared'; });
  document.querySelector('#theme-toggle').addEventListener('click', event => { document.body.classList.toggle('light'); const on = document.body.classList.contains('light'); localStorage.setItem('prism-theme', on ? 'light' : 'dark'); event.currentTarget.setAttribute('aria-label', on ? 'Toggle dark theme' : 'Toggle light theme'); });
  if (localStorage.getItem('prism-theme') === 'light') document.body.classList.add('light');
  drawHistory();
})();
