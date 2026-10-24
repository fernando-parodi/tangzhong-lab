import { calculateRecipe, formatGrams, formatNumber, getMethod } from './recipe.js';


const STORAGE_KEY = 'tangzhong-lab-v1';
const defaults = {
  mode: 'bread',
  bread: { count: 1, pieceWeight: 697 },
  pizza: { count: 3, pieceWeight: 260, profile: 'same-day', style: 'round' },
  completed: {},
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return structuredClone(defaults);
    const result = structuredClone(defaults);
    result.mode = saved.mode === 'pizza' ? 'pizza' : 'bread';
    for (const mode of ['bread', 'pizza']) {
      const input = saved[mode] || {};
      if (Number.isInteger(input.count) && input.count >= 1 && input.count <= 40) result[mode].count = input.count;
      if (Number.isFinite(input.pieceWeight) && input.pieceWeight >= 100 && input.pieceWeight <= 2000) result[mode].pieceWeight = input.pieceWeight;
    }
    result.pizza.profile = saved.pizza?.profile === 'overnight' ? 'overnight' : 'same-day';
    result.pizza.style = saved.pizza?.style === 'pan' ? 'pan' : 'round';
    result.completed = saved.completed && typeof saved.completed === 'object' ? saved.completed : {};
    return result;
  } catch { return structuredClone(defaults); }
}
let state = loadState();
const $ = id => document.getElementById(id);
let timer = { seconds: 1800, initialSeconds: 1800, deadline: 0, running: false, stage: 'First cold rest' };
let toastTimeout = null;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* app works without persistence */ }
}
function notify(message) {
  $('toast').textContent = message;
  $('toast').classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => $('toast').classList.remove('show'), 3000);
}
function currentProfile() { return state.mode === 'pizza' ? state.pizza.profile : 'same-day'; }
function progressKey() { return `${state.mode}:${currentProfile()}:${state.mode === 'pizza' ? state.pizza.style : 'batard'}`; }
function getModel() {
  const config = state[state.mode];
  return calculateRecipe({ mode: state.mode, profile: currentProfile(), count: config.count, pieceWeight: config.pieceWeight });
}
function applyActive(buttonId, active) {
  $(buttonId).classList.toggle('is-active', active);
  $(buttonId).setAttribute('aria-pressed', String(active));
}
function applySelected(buttonId, active) {
  $(buttonId).classList.toggle('is-selected', active);
  $(buttonId).setAttribute('aria-pressed', String(active));
}
function syncInputs() {
  const config = state[state.mode];
  $('count').value = config.count;
  $('piece-weight').value = config.pieceWeight;
  $('count-label').textContent = state.mode === 'pizza' ? 'NUMBER OF PIZZAS' : 'NUMBER OF LOAVES';
  $('weight-label').textContent = state.mode === 'pizza' ? 'DOUGH / PIZZA' : 'DOUGH / LOAF';
  $('pizza-settings').hidden = state.mode !== 'pizza';
  applyActive('mode-bread', state.mode === 'bread');
  applyActive('mode-pizza', state.mode === 'pizza');
  applySelected('route-same-day', state.pizza.profile === 'same-day');
  applySelected('route-overnight', state.pizza.profile === 'overnight');
  applySelected('style-round', state.pizza.style === 'round');
  applySelected('style-pan', state.pizza.style === 'pan');
  $('recipe-tip').innerHTML = state.mode === 'bread'
    ? '<span class="advice-icon">✳</span><p>The original 697 g loaf is reproduced exactly at <strong>1 loaf × 697 g</strong>.</p>'
    : state.pizza.profile === 'overnight'
      ? '<span class="advice-icon">✳</span><p><strong>Overnight adaptation:</strong> poolish yeast stays at 0.20% of total flour; final-dough yeast becomes 0%. Refrigerate promptly and monitor fermentation.</p>'
      : '<span class="advice-icon">✳</span><p><strong>Pizza adaptation:</strong> the same 1% total yeast as the bread formula. Let balls relax fully before stretching; in a warm kitchen, watch for fast proofing.</p>';
}
function writeRecipe(model) {
  const map = {
    'tz-flour': model.parts.tangzhong.flour,
    'tz-water': model.parts.tangzhong.water,
    'pool-flour': model.parts.poolish.flour,
    'pool-water': model.parts.poolish.water,
    'pool-yeast': model.parts.poolish.yeast,
    'final-flour': model.parts.final.flour,
    'final-water': model.parts.final.water,
    'final-yeast': model.parts.final.yeast,
    'final-salt': model.parts.final.salt,
    'total-weight': model.totalDough,
    'total-flour': model.flour,
    'total-water': model.water,
  };
  for (const [id, amount] of Object.entries(map)) $(id).textContent = formatGrams(amount);
  $('final-yeast-pct').textContent = `${model.profile === 'overnight' ? '0' : '0.80'}%`;
}
function getSteps() { return getMethod({ mode: state.mode, profile: currentProfile(), pizzaStyle: state.pizza.style }); }
function renderSteps() {
  const steps = getSteps();
  const completed = state.completed[progressKey()] || [];
  $('method-title').textContent = state.mode === 'bread' ? 'From flour to loaf.' : 'From flour to pizza.';
  $('method-intro').textContent = state.mode === 'bread'
    ? 'The original cold-bulk method, with checkpoints and a built-in timer.'
    : 'Adapted pizza instructions using the same tangzhong–poolish dough.';
  $('steps').innerHTML = steps.map((step, index) => `
    <article class="step ${completed.includes(step.id) ? 'is-done' : ''}" data-step="${step.id}">
      <button class="step-check" type="button" aria-label="${completed.includes(step.id) ? 'Mark incomplete' : 'Mark complete'}: ${step.title}" aria-pressed="${completed.includes(step.id)}" data-check="${step.id}">${completed.includes(step.id) ? '✓' : ''}</button>
      <div class="step-body"><div class="step-phase">${String(index + 1).padStart(2, '0')} · ${step.phase}</div><h3>${step.title}</h3><p>${step.body}</p></div>
      <div class="step-side"><span class="step-duration">${step.duration}</span><button class="step-timer" type="button" data-time="${step.id}" aria-label="Set timer for ${step.title}">SET TIMER ↗</button></div>
    </article>`).join('');
  $('steps').querySelectorAll('[data-check]').forEach(button => button.addEventListener('click', () => {
    const key = progressKey();
    const set = new Set(state.completed[key] || []);
    set.has(button.dataset.check) ? set.delete(button.dataset.check) : set.add(button.dataset.check);
    state.completed[key] = [...set];
    save(); renderSteps();
  }));
  $('steps').querySelectorAll('[data-time]').forEach(button => button.addEventListener('click', () => {
    const step = steps.find(item => item.id === button.dataset.time);
    setTimer(step.minutes, step.title);
    notify(`Timer set: ${step.duration}`);
  }));
  updateProgress();
}
function updateProgress() {
  const steps = getSteps();
  const set = new Set(state.completed[progressKey()] || []);
  const count = steps.filter(step => set.has(step.id)).length;
  const pct = Math.round((count / steps.length) * 100);
  $('progress-count').textContent = `${count} / ${steps.length}`;
  $('progress-fill').style.width = `${pct}%`;
  $('progress-bar').setAttribute('aria-valuenow', String(pct));
}
function renderAll({ rebuildSteps = true } = {}) {
  syncInputs();
  writeRecipe(getModel());
  if (rebuildSteps) renderSteps();
  save();
}
function setMode(mode) {
  if (state.mode === mode) return;
  state.mode = mode;
  setTimer(30, 'First cold rest');
  renderAll();
}
function updateAmount(field, rawValue, final = false) {
  let value = Number(rawValue);
  const [min, max] = field === 'count' ? [1, 40] : [100, 2000];
  if (!Number.isFinite(value) || rawValue === '') {
    if (final) renderAll({ rebuildSteps: false });
    return;
  }
  if (final) value = Math.min(max, Math.max(min, Math.round(value)));
  if (!Number.isInteger(value) || value < min || value > max) {
    if (final) renderAll({ rebuildSteps: false });
    return;
  }
  state[state.mode][field] = value;
  writeRecipe(getModel()); save();
  if (final) renderAll({ rebuildSteps: false });
}
function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;
  return hours ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
function renderTimer() {
  $('timer-display').textContent = formatTime(timer.seconds);
  $('timer-label').textContent = timer.stage;
  $('timer-start').innerHTML = timer.running ? 'PAUSE TIMER <span aria-hidden="true">Ⅱ</span>' : 'START TIMER <span aria-hidden="true">▶</span>';
}
function setTimer(minutes, label) {
  timer = { seconds: Math.max(1, Math.round(minutes * 60)), initialSeconds: Math.max(1, Math.round(minutes * 60)), deadline: 0, running: false, stage: label };
  $('timer-note').textContent = 'Use Start to count down. Times are guides; watch the dough.';
  renderTimer();
}
function tick() {
  if (!timer.running) return;
  timer.seconds = Math.max(0, Math.ceil((timer.deadline - Date.now()) / 1000));
  if (!timer.seconds) {
    timer.running = false;
    $('timer-note').textContent = 'Time is up. Check your dough before moving on.';
    notify('Timer finished — check your dough!');
  }
  renderTimer();
}
function pauseOrPlay() {
  if (timer.running) {
    timer.seconds = Math.max(0, Math.ceil((timer.deadline - Date.now()) / 1000));
    timer.running = false;
  } else {
    if (timer.seconds <= 0) timer.seconds = timer.initialSeconds;
    timer.deadline = Date.now() + timer.seconds * 1000;
    timer.running = true;
  }
  renderTimer();
}
function resetTimer() {
  timer.running = false;
  timer.seconds = timer.initialSeconds;
  $('timer-note').textContent = 'Timer reset. Select any recipe step for a new duration.';
  renderTimer();
}
function recipeText() {
  const recipe = getModel();
  const steps = getSteps();
  const rows = [
    `TANGZHONG LAB — ${state.mode === 'bread' ? 'ARTISAN BREAD' : 'PIZZA'} (${state.mode === 'pizza' ? currentProfile() : 'original'})`,
    `${recipe.count} × ${formatGrams(recipe.pieceWeight)} | total dough ${formatGrams(recipe.totalDough)} | hydration 71.5%`,
    '',
    'TANGZHONG',
    `Bread flour: ${formatGrams(recipe.parts.tangzhong.flour)}`,
    `Boiling water: ${formatGrams(recipe.parts.tangzhong.water)}`,
    '',
    'POOLISH',
    `Bread flour: ${formatGrams(recipe.parts.poolish.flour)}`,
    `Water: ${formatGrams(recipe.parts.poolish.water)}`,
    `Instant yeast: ${formatGrams(recipe.parts.poolish.yeast)}`,
    '',
    'FINAL DOUGH',
    `Bread flour: ${formatGrams(recipe.parts.final.flour)}`,
    `Ice-cold water: ${formatGrams(recipe.parts.final.water)}`,
    `Instant yeast: ${formatGrams(recipe.parts.final.yeast)}`,
    `Salt: ${formatGrams(recipe.parts.final.salt)}`,
    'All of the poolish and tangzhong',
    '',
    'METHOD',
    ...steps.map((s,i) => `${i+1}. ${s.title} (${s.duration})\n${s.body}`),
    '',
    'Formula from the 400 g flour Tangzhong–Poolish bread recipe. Pizza process is an adaptation.',
  ];
  return rows.join('\n');
}
async function copyText(text) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('No clipboard API');
    await navigator.clipboard.writeText(text);
  } catch {
    const area = document.createElement('textarea');
    area.value = text; area.style.position = 'fixed'; area.style.left = '-9999px';
    document.body.appendChild(area); area.select();
    const okay = document.execCommand('copy'); area.remove();
    if (!okay) throw new Error('Copy failed');
  }
}
function init() {
  $('mode-bread').addEventListener('click', () => setMode('bread'));
  $('mode-pizza').addEventListener('click', () => setMode('pizza'));
  $('count-minus').addEventListener('click', () => { state[state.mode].count = Math.max(1, state[state.mode].count - 1); renderAll({ rebuildSteps: false }); });
  $('count-plus').addEventListener('click', () => { state[state.mode].count = Math.min(40, state[state.mode].count + 1); renderAll({ rebuildSteps: false }); });
  for (const [id, field] of [['count', 'count'], ['piece-weight', 'pieceWeight']]) {
    $(id).addEventListener('input', e => updateAmount(field, e.target.value));
    $(id).addEventListener('change', e => updateAmount(field, e.target.value, true));
  }
  for (const [id, profile] of [['route-same-day','same-day'], ['route-overnight','overnight']]) $(id).addEventListener('click', () => {state.pizza.profile = profile;renderAll();});
  for (const [id, style] of [['style-round','round'], ['style-pan','pan']]) $(id).addEventListener('click', () => {state.pizza.style = style;renderAll();});
  $('reset-recipe').addEventListener('click', () => {state = structuredClone(defaults);setTimer(30, 'First cold rest');renderAll();notify('Original bread formula restored.');});
  $('timer-start').addEventListener('click', pauseOrPlay);
  $('timer-reset').addEventListener('click', resetTimer);
  $('clear-progress').addEventListener('click', () => {state.completed[progressKey()] = [];renderAll();notify('Checkmarks cleared.');});
  $('copy-recipe').addEventListener('click', async () => {
    try { await copyText(recipeText()); notify('Full ingredients and method copied.'); }
    catch { notify('Copy unavailable. Use Print Recipe instead.'); }
  });
  $('print-recipe').addEventListener('click', () => window.print());
  setInterval(tick, 500);
  document.addEventListener('visibilitychange', tick);
  renderAll();renderTimer();
}
init();