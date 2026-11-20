(() => {
  const $ = (s) => document.querySelector(s);
  const KEY = 'sms.v1', SUBJ = ['Maths', 'Programming', 'English'];
  const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toISOString().slice(0, 10);
  const dayAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };

  // ---- Demo data (sample students only) ----
  function demo() {
    const rows = [['D001','Demo Student A','B.Tech CSE (AI)',[82,90,76]],['D002','Demo Student B','B.Tech CSE (AI)',[64,70,58]],['D003','Demo Student C','BCA',[91,88,94]],
                  ['D004','Demo Student D','BCA',[45,52,40]],['D005','Demo Student E','B.Tech CSE',[73,66,81]],['D006','Demo Student F','B.Tech CSE',[30,38,44]]];
    return rows.map((r, i) => ({
      id: 's' + (i + 1), roll: r[0], name: r[1], course: r[2], email: 'demo' + (i + 1) + '@example.com',
      marks: { Maths: r[3][0], Programming: r[3][1], English: r[3][2] },
      att: Object.fromEntries([1, 2, 3, 4, 5].map((n) => [dayAgo(n), (n + i) % 4 !== 0]))
    }));
  }
  let db;
  try { const d = JSON.parse(localStorage.getItem(KEY)); db = Array.isArray(d) ? d : demo(); } catch (e) { db = demo(); }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} };
  const say = (m) => { $('#status').textContent = m; };

  // ---- Calculations ----
  const nums = (s) => SUBJ.map((k) => s.marks[k]).filter((v) => typeof v === 'number');
  const avg = (s) => { const n = nums(s); return n.length ? n.reduce((a, b) => a + b, 0) / n.length : null; };
  const attPct = (s) => { const v = Object.values(s.att || {}); return v.length ? (v.filter(Boolean).length / v.length) * 100 : null; };
  const grade = (a) => (a === null ? '-' : a >= 80 ? 'A' : a >= 65 ? 'B' : a >= 50 ? 'C' : a >= 35 ? 'D' : 'F');
  const f1 = (n) => (n === null ? '-' : n.toFixed(1));
  const gcell = (a) => { const g = grade(a); return `<span class="g g${g}">${g}</span>`; };

  // ---- Navigation ----
  function show(v) {
    document.querySelectorAll('.view').forEach((x) => (x.hidden = x.id !== 'v-' + v));
    document.querySelectorAll('#nav button').forEach((b) => b.toggleAttribute('aria-current', b.dataset.view === v));
    document.querySelectorAll('#nav button').forEach((b) => { if (b.dataset.view === v) b.setAttribute('aria-current', 'page'); });
    if (v === 'att') renderAtt(); if (v === 'marks') renderMarks();
  }
  $('#nav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) show(b.dataset.view); });

  // ---- Dashboard ----
  function renderDash() {
    const a = db.map(avg).filter((x) => x !== null), p = db.map(attPct).filter((x) => x !== null);
    const top = db.filter((s) => avg(s) !== null).sort((x, y) => avg(y) - avg(x))[0];
    const card = (l, v) => `<div class="stat"><span>${l}</span><strong>${esc(v)}</strong></div>`;
    $('#stats').innerHTML = card('Total students', db.length) + card('Average marks', a.length ? f1(a.reduce((x, y) => x + y, 0) / a.length) : '-') +
      card('Average attendance', p.length ? f1(p.reduce((x, y) => x + y, 0) / p.length) + '%' : '-') + card('Top performer', top ? top.name : '-');
    $('#bars').innerHTML = SUBJ.map((k) => {
      const v = db.map((s) => s.marks[k]).filter((x) => typeof x === 'number'), m = v.length ? v.reduce((x, y) => x + y, 0) / v.length : 0;
      return `<div class="bar"><span>${k}: ${f1(v.length ? m : null)}</span><div><i style="width:${m}%"></i></div></div>`;
    }).join('');
    const c = { A: 0, B: 0, C: 0, D: 0, F: 0 }; db.forEach((s) => { const g = grade(avg(s)); if (g in c) c[g]++; });
    $('#grades').innerHTML = Object.entries(c).map(([g, n]) => `<span class="chip">Grade ${g}: <strong>${n}</strong></span>`).join('');
  }

  // ---- Students table ----
  function renderFilter() {
    const sel = $('#courseFilter'), cur = sel.value || 'All';
    const cs = ['All', ...new Set(db.map((s) => s.course).filter(Boolean))];
    sel.innerHTML = cs.map((c) => `<option${c === cur ? ' selected' : ''}>${esc(c)}</option>`).join('');
  }
  function renderStudents() {
    const q = $('#q').value.trim().toLowerCase(), c = $('#courseFilter').value || 'All';
    const list = db.filter((s) => (c === 'All' || s.course === c) && (!q || [s.name, s.roll, s.email].some((x) => (x || '').toLowerCase().includes(q))));
    $('#stuBody').innerHTML = list.length ? list.map((s) => `<tr><td>${esc(s.roll)}</td><td>${esc(s.name)}</td><td>${esc(s.course)}</td><td>${esc(s.email)}</td>
      <td>${f1(avg(s))}</td><td>${attPct(s) === null ? '-' : f1(attPct(s)) + '%'}</td><td>${gcell(avg(s))}</td>
      <td><button class="btn ghost sm" data-edit="${s.id}">Edit</button> <button class="btn danger sm" data-del="${s.id}">Delete</button></td></tr>`).join('')
      : '<tr><td colspan="8" class="empty">No students found.</td></tr>';
  }
  $('#q').addEventListener('input', renderStudents);
  $('#courseFilter').addEventListener('change', renderStudents);
  $('#stuBody').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
    if (ed) openForm(db.find((s) => s.id === ed.dataset.edit));
    if (dl) { const s = db.find((x) => x.id === dl.dataset.del); if (s && confirm('Delete ' + s.name + '?')) { db = db.filter((x) => x !== s); save(); renderAll(); say(s.name + ' deleted'); } }
  });

  // ---- Add / edit form ----
  const dlg = $('#dlg'), form = $('#form'); let editing = null;
  function openForm(s) {
    editing = s || null; $('#dlgT').textContent = s ? 'Edit student' : 'Add student'; $('#formErr').textContent = '';
    form.roll.value = s ? s.roll : ''; form.name.value = s ? s.name : ''; form.course.value = s ? s.course : ''; form.email.value = s ? s.email : '';
    dlg.showModal(); form.roll.focus();
  }
  $('#addBtn').onclick = () => openForm(null);
  $('#cancel').onclick = () => dlg.close();
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const roll = form.roll.value.trim(), name = form.name.value.trim(), email = form.email.value.trim();
    if (!roll || !name) return ($('#formErr').textContent = 'Roll number and name are required.');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return ($('#formErr').textContent = 'Enter a valid email or leave it empty.');
    if (db.some((s) => s.roll.toLowerCase() === roll.toLowerCase() && s !== editing)) return ($('#formErr').textContent = 'That roll number already exists.');
    const data = { roll, name, course: form.course.value.trim(), email };
    if (editing) Object.assign(editing, data); else db.push({ id: 's' + Date.now(), ...data, marks: {}, att: {} });
    save(); dlg.close(); renderAll(); say('Saved ' + name);
  });

  // ---- Attendance ----
  $('#attDate').value = today(); $('#attDate').max = today();
  function renderAtt() {
    const d = $('#attDate').value || today();
    $('#attBody').innerHTML = db.map((s) => { const v = s.att[d];
      return `<tr><td>${esc(s.roll)}</td><td>${esc(s.name)}</td><td><div class="tog" role="group" aria-label="Attendance for ${esc(s.name)}">
        <button class="p" data-att="${s.id}" data-v="1" aria-pressed="${v === true}">Present</button><button class="a" data-att="${s.id}" data-v="0" aria-pressed="${v === false}">Absent</button></div></td>
        <td>${attPct(s) === null ? '-' : f1(attPct(s)) + '%'}</td></tr>`; }).join('') || '<tr><td colspan="4" class="empty">No students yet.</td></tr>';
  }
  $('#attDate').addEventListener('change', renderAtt);
  $('#attBody').addEventListener('click', (e) => {
    const b = e.target.closest('[data-att]'); if (!b) return;
    db.find((s) => s.id === b.dataset.att).att[$('#attDate').value || today()] = b.dataset.v === '1';
    save(); renderAtt(); renderDash(); renderStudents();
  });
  $('#allPresent').onclick = () => { const d = $('#attDate').value || today(); db.forEach((s) => (s.att[d] = true)); save(); renderAtt(); renderDash(); renderStudents(); say('All marked present for ' + d); };

  // ---- Marks ----
  function renderMarks() {
    $('#markBody').innerHTML = db.map((s) => `<tr data-row="${s.id}"><td>${esc(s.roll)}</td><td>${esc(s.name)}</td>` +
      SUBJ.map((k) => `<td><input type="number" min="0" max="100" step="1" value="${typeof s.marks[k] === 'number' ? s.marks[k] : ''}" data-m="${s.id}" data-k="${k}" aria-label="${k} marks for ${esc(s.name)}"></td>`).join('') +
      `<td class="avg">${f1(avg(s))}</td><td class="gr">${gcell(avg(s))}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">No students yet.</td></tr>';
  }
  $('#markBody').addEventListener('change', (e) => {
    const i = e.target.closest('[data-m]'); if (!i) return;
    const s = db.find((x) => x.id === i.dataset.m), v = i.value === '' ? null : Math.min(100, Math.max(0, Number(i.value)));
    if (v === null || Number.isNaN(v)) { delete s.marks[i.dataset.k]; i.value = ''; } else { s.marks[i.dataset.k] = v; i.value = v; }
    save(); const row = i.closest('tr'); row.querySelector('.avg').textContent = f1(avg(s)); row.querySelector('.gr').innerHTML = gcell(avg(s)); renderDash(); renderStudents();
  });

  // ---- CSV export ----
  const cell = (v) => { let t = String(v ?? ''); if (/^[=+\-@]/.test(t)) t = "'" + t; return '"' + t.replace(/"/g, '""') + '"'; };
  $('#exportCsv').onclick = () => {
    const head = ['Roll', 'Name', 'Course', 'Email', ...SUBJ, 'Average', 'Attendance %', 'Grade'];
    const rows = db.map((s) => [s.roll, s.name, s.course, s.email, ...SUBJ.map((k) => s.marks[k] ?? ''), f1(avg(s)), f1(attPct(s)), grade(avg(s))]);
    const csv = [head, ...rows].map((r) => r.map(cell).join(',')).join('\r\n');
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
    a.download = 'students-' + today() + '.csv'; a.click(); URL.revokeObjectURL(a.href); say('CSV exported');
  };
  $('#reset').onclick = () => { if (confirm('Replace all records with the original demo data?')) { db = demo(); save(); renderAll(); say('Demo data restored'); } };

  function renderAll() { renderDash(); renderFilter(); renderStudents(); renderAtt(); renderMarks(); }
  window.__sms = { avg, attPct, grade };
  renderAll();
})();
