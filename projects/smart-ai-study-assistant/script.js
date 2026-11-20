(() => {
  const $ = (s) => document.querySelector(s);
  const TASKS = {
    ask:       ['Ask',        'Ask any study question…'],
    explain:   ['Explain',    'Type a concept to explain simply, e.g. "recursion"'],
    notes:     ['Make notes', 'Paste text to turn into study notes'],
    quiz:      ['Quiz',       'Paste text to make quiz questions from'],
    summarize: ['Summarize',  'Paste text to summarize']
  };
  // On GitHub Pages / file:// the page is not served by the backend, so talk to the local server.
  const LOCAL = location.protocol === 'file:' || location.hostname.endsWith('github.io');
  const API = LOCAL ? 'http://127.0.0.1:8000' : '';
  let task = 'ask', mode = 'offline', busy = false, hist = [];
  try { hist = JSON.parse(localStorage.getItem('sa.hist')) || []; } catch (e) {}
  const save = () => { try { localStorage.setItem('sa.hist', JSON.stringify(hist.slice(-50))); } catch (e) {} };

  $('#tasks').innerHTML = Object.entries(TASKS).map(([k, v]) => `<button data-t="${k}" aria-pressed="${k === task}">${v[0]}</button>`).join('');
  function setTask(k) {
    task = k; $('#title').textContent = TASKS[k][0]; $('#input').placeholder = TASKS[k][1];
    document.querySelectorAll('#tasks button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === k));
  }
  $('#tasks').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setTask(b.dataset.t); });

  function render() {
    const log = $('#log'); log.innerHTML = '';
    if (!hist.length) { log.innerHTML = '<div class="empty"><p>Pick a tool on the left, type or paste text, and press Send.</p></div>'; return; }
    hist.forEach((m) => {
      const d = document.createElement('div'); d.className = 'msg ' + m.role;
      if (m.tag) { const t = document.createElement('span'); t.className = 'tag ' + m.tagType; t.textContent = m.tag; d.append(t, document.createElement('br')); }
      d.append(document.createTextNode(m.text)); log.append(d);
    });
    log.scrollTop = log.scrollHeight;
  }

  async function ping() {
    const pill = $('#pill'), n = $('#notice');
    try {
      const c = new AbortController(); const t = setTimeout(() => c.abort(), 3000);
      const r = await fetch(API + '/health', { signal: c.signal }); clearTimeout(t);
      const j = await r.json(); mode = j.mode;
      pill.className = 'pill ' + (mode === 'live' ? 'live' : 'demo');
      pill.querySelector('span').textContent = mode === 'live' ? 'AI live · ' + j.model : 'Demo mode · no AI';
      n.hidden = mode === 'live';
      n.innerHTML = 'Demo mode: summaries, notes and quizzes use simple text rules, and questions are <strong>not</strong> answered by AI. Add an <code>ANTHROPIC_API_KEY</code> on the server for real AI.';
    } catch (e) {
      mode = 'offline'; pill.className = 'pill off'; pill.querySelector('span').textContent = 'Backend offline';
      n.hidden = false;
      n.innerHTML = 'The Python backend is not running or not reachable, so nothing works yet. It runs <strong>locally</strong> and is not deployed online. See the README: <code>cd backend</code> then <code>uvicorn main:app</code>.';
    }
  }

  $('#form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = $('#input').value.trim(); if (!text || busy) return;
    hist.push({ role: 'user', text: TASKS[task][0] + ': ' + text }); $('#input').value = ''; render();
    if (mode === 'offline') await ping();
    if (mode === 'offline') { hist.push({ role: 'system', text: 'Cannot reach the backend. Start it locally (see README) and try again.' }); save(); return render(); }
    busy = true; $('#send').disabled = true;
    const past = hist.filter((m) => m.api).slice(-6).map((m) => ({ role: m.role, content: m.api }));
    hist[hist.length - 1].api = text;
    try {
      const r = await fetch(API + '/api/assist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task, text, history: past }) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.detail || 'Server error ' + r.status); }
      const j = await r.json();
      hist.push({ role: 'assistant', text: j.output, api: j.output, tag: j.source === 'ai' ? 'AI · ' + j.model : 'DEMO · rule-based, not AI', tagType: j.source === 'ai' ? 'ai' : 'demo' });
    } catch (err) { hist.push({ role: 'system', text: 'Error: ' + (typeof err.message === 'string' ? err.message : 'request failed') }); }
    busy = false; $('#send').disabled = false; save(); render();
  });
  $('#input').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) $('#form').requestSubmit(); });
  $('#clear').onclick = () => { hist = []; save(); render(); };
  setTask('ask'); render(); ping();
})();
