/* ===== Configuración del taller (edite estos datos) ===== */
const TALLER = { nombre: 'Servicio Mecánica Integral', datos: 'Chapa y pintura · Dirección · Teléfono' };
const N_TRAB = 20, N_REP = 15, KEY = 'taller_presupuestos';

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const fmt = n => new Intl.NumberFormat('es-PY').format(Math.round(+n || 0));
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const today = () => new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const fd = d => d ? d.split('-').reverse().join('/') : '';
const pad = n => String(n).padStart(4, '0');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

let data = [], cur = null, filtro = 'todos';
try { data = JSON.parse(localStorage.getItem(KEY) || '[]'); } catch (e) { data = []; }
const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { alert('No se pudo guardar en el navegador. Libere espacio o revise los permisos.'); } };
const nextNum = () => Math.max(0, ...data.map(p => p.numero)) + 1;

/* Montos: solo los repuestos aprobados suman al total */
const calc = p => {
  const all = p.repuestos.reduce((t, r) => t + (+r.monto || 0), 0);
  const rep = p.repuestos.filter(r => r.ok).reduce((t, r) => t + (+r.monto || 0), 0);
  const mo = +p.manoObra || 0;
  return { mo, rep, repNo: all - rep, total: mo + rep };
};

/* ---------- Navegación ---------- */
function showView(v) {
  $$('.view').forEach(e => e.classList.toggle('hidden', e.id !== 'v-' + v));
  $$('.tab').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  if (v === 'hist') renderHist();
  if (v === 'rep') renderRep();
}
$$('.tab').forEach(b => b.onclick = () => showView(b.dataset.view));

/* ---------- Formulario ---------- */
const HF = [['cliente', 'Cliente'], ['celular', 'Celular'], ['marca', 'Marca'], ['modelo', 'Modelo'], ['color', 'Color'], ['chapa', 'Chapa'], ['aseguradora', 'Aseguradora'], ['fecha', 'Fecha de ingreso', 'date']];
$('#hdr').innerHTML = HF.map(([k, l, t]) => `<label class="block text-xs font-medium text-slate-600">${l}<input data-f="${k}" type="${t || 'text'}" class="inp"></label>`).join('');

const rowT = (i, v) => `<div class="line flex items-center gap-2"><span class="w-6 text-xs text-slate-400">${i + 1}</span><input class="inp !mt-0 t-in" value="${esc(v)}"></div>`;
const rowR = (i, r) => `<div class="line rrow flex items-center gap-2 ${r.ok ? 'ap' : ''}"><span class="w-6 text-xs text-slate-400">${i + 1}</span><input class="inp !mt-0 r-desc" placeholder="Repuesto" value="${esc(r.desc)}"><input type="number" min="0" class="inp !mt-0 r-amt w-28 text-right" placeholder="Gs" value="${r.monto || ''}"><label class="flex items-center gap-1 text-xs whitespace-nowrap w-28"><input type="checkbox" class="r-ok" ${r.ok ? 'checked' : ''}><span>${r.ok ? 'Aprobado' : 'No aprobado'}</span></label></div>`;

function loadForm(p) {
  cur = p.id || null;
  HF.forEach(([k]) => $(`[data-f="${k}"]`).value = p[k] || '');
  $('[data-f="manoObra"]').value = p.manoObra || '';
  const t = p.trabajos || [], r = p.repuestos || [];
  $('#trab').innerHTML = Array.from({ length: Math.max(N_TRAB, t.length) }, (_, i) => rowT(i, t[i] || '')).join('');
  $('#rep').innerHTML = Array.from({ length: Math.max(N_REP, r.length) }, (_, i) => rowR(i, r[i] || {})).join('');
  $('#fNum').textContent = pad(p.numero || nextNum());
  calcTotals();
}
function readForm() {
  const f = {};
  HF.forEach(([k]) => f[k] = $(`[data-f="${k}"]`).value.trim());
  f.chapa = f.chapa.toUpperCase();
  f.manoObra = +$('[data-f="manoObra"]').value || 0;
  f.trabajos = $$('.t-in').map(i => i.value.trim());
  f.repuestos = $$('#rep .rrow').map(l => ({ desc: l.querySelector('.r-desc').value.trim(), monto: +l.querySelector('.r-amt').value || 0, ok: l.querySelector('.r-ok').checked }));
  return f;
}
function calcTotals() {
  const f = readForm(), c = calc(f);
  $$('#rep .rrow').forEach(l => {
    const ok = l.querySelector('.r-ok').checked;
    l.classList.toggle('ap', ok);
    l.querySelector('label span').textContent = ok ? 'Aprobado' : 'No aprobado';
  });
  $('#t_rep').textContent = fmt(c.rep); $('#t_no').textContent = fmt(c.repNo); $('#t_tot').textContent = fmt(c.total);
  $('#pHead').innerHTML = `<div class="text-lg font-bold">Presupuesto Nº ${$('#fNum').textContent}</div><div class="text-xs">Fecha de ingreso: ${fd(f.fecha)}</div>`;
}
$('#v-form').addEventListener('input', e => { if (e.target.dataset.f === 'chapa') e.target.value = e.target.value.toUpperCase(); calcTotals(); });
$('#v-form').addEventListener('change', calcTotals);
$('#addT').onclick = () => $('#trab').insertAdjacentHTML('beforeend', rowT($$('.t-in').length, ''));
$('#addR').onclick = () => $('#rep').insertAdjacentHTML('beforeend', rowR($$('#rep .rrow').length, {}));
$('#bNew').onclick = () => loadForm({ fecha: today() });

function saveForm() {
  const f = readForm();
  if (!f.cliente && !f.chapa) return alert('Ingrese al menos el cliente o la chapa.');
  if (cur) { const i = data.findIndex(p => p.id === cur); data[i] = { ...data[i], ...f }; }
  else { const p = { id: uid(), numero: nextNum(), aprobacion: 'PENDIENTE', pago: 'PENDIENTE', fechaPago: '', ...f }; data.push(p); cur = p.id; $('#fNum').textContent = pad(p.numero); }
  persist(); calcTotals();
  $('#bSave').textContent = 'Guardado ✓'; setTimeout(() => $('#bSave').textContent = 'Guardar presupuesto', 1500);
}
$('#bSave').onclick = saveForm;

/* ---------- Impresión ---------- */
addEventListener('beforeprint', () => $$('#v-form .line').forEach(l => {
  if (![...l.querySelectorAll('input:not([type=checkbox])')].some(i => i.value)) l.classList.add('empty');
}));
addEventListener('afterprint', () => $$('.line.empty').forEach(l => l.classList.remove('empty')));
$('#bPrint').onclick = () => window.print();
$('#rPrint').onclick = () => window.print();

/* ---------- Historial ---------- */
const FILTROS = [['todos', 'Todos'], ['apr', 'Aprobados'], ['papr', 'Pendientes de aprobación'], ['pag', 'Pagados'], ['ppag', 'Pendientes de pago']];
const PASA = { todos: () => true, apr: p => p.aprobacion === 'APROBADO', papr: p => p.aprobacion !== 'APROBADO', pag: p => p.pago === 'PAGADO', ppag: p => p.pago !== 'PAGADO' };
const sel = (id, k, opts, v, cls) => `<select data-id="${id}" data-k="${k}" class="sel ${cls}">${opts.map(([a, b]) => `<option value="${a}" ${a === v ? 'selected' : ''}>${b}</option>`).join('')}</select>`;

function renderHist() {
  $('#chips').innerHTML = FILTROS.map(([k, l]) => `<button data-fl="${k}" class="chip ${filtro === k ? 'on' : ''}">${l} (${data.filter(PASA[k]).length})</button>`).join('');
  const rows = data.filter(PASA[filtro]).sort((a, b) => (b.fecha || '').localeCompare(a.fecha || '') || b.numero - a.numero);
  $('#hBody').innerHTML = rows.map(p => `<tr>
    <td class="p-2 font-semibold">${pad(p.numero)}</td><td class="p-2 whitespace-nowrap">${fd(p.fecha)}</td>
    <td class="p-2"><div>${esc(p.cliente)}</div><div class="text-xs text-slate-500">${esc(p.celular)}</div></td>
    <td class="p-2 whitespace-nowrap">${esc(p.marca)} ${esc(p.modelo)}<div class="text-xs font-mono text-slate-500">${esc(p.chapa)}</div></td>
    <td class="p-2">${esc(p.aseguradora)}</td><td class="p-2 text-right">${fmt(calc(p).total)}</td>
    <td class="p-2">${sel(p.id, 'aprobacion', [['PENDIENTE', 'Pendiente'], ['APROBADO', 'Aprobado']], p.aprobacion, p.aprobacion === 'APROBADO' ? 'g' : 'y')}</td>
    <td class="p-2">${sel(p.id, 'pago', [['PENDIENTE', 'Pendiente de pago'], ['PAGADO', 'Pagado']], p.pago, p.pago === 'PAGADO' ? 'g' : 'r')}</td>
    <td class="p-2"><input type="date" data-id="${p.id}" data-k="fechaPago" class="sel" value="${p.fechaPago || ''}" ${p.pago === 'PAGADO' ? '' : 'disabled'}></td>
    <td class="p-2 whitespace-nowrap text-xs"><button data-act="edit" data-id="${p.id}" class="text-teal-700 mr-2">Editar</button><button data-act="print" data-id="${p.id}" class="text-slate-600 mr-2">Imprimir</button><button data-act="del" data-id="${p.id}" class="text-rose-600">Borrar</button></td>
  </tr>`).join('') || '<tr><td colspan="10" class="p-8 text-center text-slate-400">No hay presupuestos con este filtro.</td></tr>';
}
$('#chips').onclick = e => { const b = e.target.closest('[data-fl]'); if (b) { filtro = b.dataset.fl; renderHist(); } };
$('#hBody').addEventListener('change', e => {
  const { id, k } = e.target.dataset; if (!id) return;
  const p = data.find(x => x.id === id); p[k] = e.target.value;
  if (k === 'pago') p.fechaPago = p.pago === 'PAGADO' ? (p.fechaPago || today()) : '';
  persist(); renderHist();
});
$('#hBody').addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const p = data.find(x => x.id === b.dataset.id);
  if (b.dataset.act === 'del') { if (confirm(`¿Borrar el presupuesto Nº ${pad(p.numero)}?`)) { data = data.filter(x => x !== p); persist(); renderHist(); } return; }
  loadForm(p); showView('form');
  if (b.dataset.act === 'print') setTimeout(() => window.print(), 250);
});

/* ---------- Reportes ---------- */
const iso = (y, m, d) => new Date(Date.UTC(y, m, d)).toISOString().slice(0, 10);
function range() {
  const [y, m, d] = ($('#rDate').value || today()).split('-').map(Number);
  if ($('#rTipo').value === 'mes') return [iso(y, m - 1, 1), iso(y, m, 0)];
  const dow = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // semana de lunes a domingo
  return [iso(y, m - 1, d - dow), iso(y, m - 1, d - dow + 6)];
}
const sumar = l => l.reduce((t, p) => { const c = calc(p); return { n: t.n + 1, mo: t.mo + c.mo, rep: t.rep + c.rep, no: t.no + c.repNo, total: t.total + c.total }; }, { n: 0, mo: 0, rep: 0, no: 0, total: 0 });

function renderRep() {
  const [a, b] = range();
  $('#rRange').textContent = `del ${fd(a)} al ${fd(b)}`;
  const prod = data.filter(p => p.aprobacion === 'APROBADO' && p.fecha >= a && p.fecha <= b);
  const fact = data.filter(p => p.pago === 'PAGADO' && p.fechaPago >= a && p.fechaPago <= b);
  const block = (t, sub, l) => {
    const s = sumar(l), pr = s.total ? Math.round(s.rep * 100 / s.total) : 0;
    const r = (x, y, c = '') => `<tr class="${c}"><td class="py-1">${x}</td><td class="py-1 text-right">${y}</td></tr>`;
    return `<div class="card"><h3 class="font-bold">${t}</h3><p class="text-xs text-slate-500 mb-2">${sub}</p>
      <table class="w-full text-sm">${r('Presupuestos', s.n)}${r('Mano de obra', 'Gs ' + fmt(s.mo))}${r('Repuestos aprobados', 'Gs ' + fmt(s.rep))}${r('Total', 'Gs ' + fmt(s.total), 'border-t font-bold')}${r('Repuestos no aprobados (no incluidos)', 'Gs ' + fmt(s.no), 'text-slate-400')}</table>
      <div class="mt-3 text-xs text-slate-500">Repuestos aprobados: ${pr}% · Mano de obra: ${s.total ? 100 - pr : 0}%</div>
      <div class="h-2 rounded bg-teal-700/20 mt-1 overflow-hidden"><div class="h-full bg-teal-700" style="width:${pr}%"></div></div></div>`;
  };
  const det = fact.sort((x, y) => x.fechaPago.localeCompare(y.fechaPago)).map(p => { const c = calc(p); return `<tr class="border-t"><td class="p-2">${pad(p.numero)}</td><td class="p-2">${esc(p.cliente)} <span class="text-xs text-slate-500">${esc(p.chapa)}</span></td><td class="p-2">${fd(p.fechaPago)}</td><td class="p-2 text-right">${fmt(c.mo)}</td><td class="p-2 text-right">${fmt(c.rep)}</td><td class="p-2 text-right font-semibold">${fmt(c.total)}</td></tr>`; }).join('');
  $('#rBody').innerHTML = `<div class="grid md:grid-cols-2 print:grid-cols-2 gap-4">
    ${block('Producción', 'Presupuestos aprobados con ingreso en el período', prod)}
    ${block('Facturación', 'Presupuestos pagados con fecha de liquidación en el período', fact)}</div>
    <div class="card !p-0 overflow-x-auto"><table class="w-full text-sm"><thead class="bg-slate-50 text-left text-xs text-slate-500"><tr><th class="p-2">Nº</th><th class="p-2">Cliente</th><th class="p-2">Liquidación</th><th class="p-2 text-right">Mano de obra</th><th class="p-2 text-right">Repuestos aprobados</th><th class="p-2 text-right">Total</th></tr></thead><tbody>${det || '<tr><td colspan="6" class="p-6 text-center text-slate-400">No hay facturación en este período.</td></tr>'}</tbody></table></div>`;
}
$('#rTipo').onchange = $('#rDate').onchange = renderRep;

/* ---------- Inicio ---------- */
$('#tNombre').textContent = TALLER.nombre; $('#tDatos').textContent = TALLER.datos;
$('#rDate').value = today();
loadForm({ fecha: today() });
showView('form');
