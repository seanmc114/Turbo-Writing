/* Escritura Tower — Student Writing Trainer (Self-correcting)
   - Levels (easy -> hard)
   - Each level has 10 short writing items (sentence/line)
   - Instant marking with accepted answers
   - Per-student best scores + history in localStorage
   - Bright crest watermark controlled via Settings

   NOTE: Prompts are original "JC/LC-style", not verbatim SEC questions.
*/

const LS_ATTEMPTS = "etower_attempts_v1";
const LS_BEST = "etower_best_v1";
const LS_SETTINGS = "etower_settings_v1";

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);

const screens = {
  home: $("screenHome"),
  levels: $("screenLevels"),
  play: $("screenPlay"),
  results: $("screenResults"),
  progress: $("screenProgress"),
};

const modeTilesEl = $("modeTiles");
const levelGridEl = $("levelGrid");
const levelsTitleEl = $("levelsTitle");
const levelsDescEl = $("levelsDesc");
const btnLevelsBack = $("btnLevelsBack");

const studentNameEl = $("studentName");

const playTitleEl = $("playTitle");
const playSubEl = $("playSub");
const timerEl = $("timer");
const liveScoreEl = $("liveScore");
const itemIdxEl = $("itemIdx");
const promptTitleEl = $("promptTitle");
const promptBodyEl = $("promptBody");
const answerBoxEl = $("answerBox");
const feedbackEl = $("feedback");
const btnSubmit = $("btnSubmit");
const btnNext = $("btnNext");
const btnQuit = $("btnQuit");
const btnHint = $("btnHint");
const btnGiveUp = $("btnGiveUp");

const statCorrectEl = $("statCorrect");
const statWrongEl = $("statWrong");
const statStreakEl = $("statStreak");
const miniChecklistEl = $("miniChecklist");

const resultsSummaryEl = $("resultsSummary");
const finalScoreEl = $("finalScore");
const bestScoreLineEl = $("bestScoreLine");
const correctionsEl = $("corrections");
const btnResultsHome = $("btnResultsHome");
const btnRetry = $("btnRetry");

const btnProgress = $("btnProgress");
const btnProgressBack = $("btnProgressBack");
const btnExport = $("btnExport");
const btnClear = $("btnClear");
const progressTable = $("progressTable").querySelector("tbody");

const settingsDialog = $("settingsDialog");
const btnSettings = $("btnSettings");
const crestPathEl = $("crestPath");
const crestOpacityEl = $("crestOpacity");
const unlockPctEl = $("unlockPct");
const defaultMinutesEl = $("defaultMinutes");
const btnSaveSettings = $("btnSaveSettings");

// ---------- Utilities ----------
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function fmtTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"
  }[c]));
}

function downloadText(filename, content) {
  const blob = new Blob([content], { type:"text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------- Settings ----------
function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_SETTINGS);
    if (!raw) return { crestPath:"crest.png", crestOpacity:0.22, unlockPct:70, defaultMinutes:10 };
    return JSON.parse(raw);
  } catch {
    return { crestPath:"crest.png", crestOpacity:0.22, unlockPct:70, defaultMinutes:10 };
  }
}
function saveSettings(s) {
  localStorage.setItem(LS_SETTINGS, JSON.stringify(s));
}
function applySettingsToCSS(s) {
  document.documentElement.style.setProperty("--crest", `url('${s.crestPath || "crest.png"}')`);
  document.documentElement.style.setProperty("--crestOpacity", String(s.crestOpacity ?? 0.22));
  document.documentElement.style.setProperty("--unlockPct", String(s.unlockPct ?? 70));
}

let SETTINGS = loadSettings();
applySettingsToCSS(SETTINGS);

// ---------- Normalisation / marking ----------
// Requirements:
// - capitals ignored
// - spaces ignored (extra)
// - punctuation differences tolerated
// - accents matter
// - ñ counts as n for marking
//
// Implementation: normalize text for compare:
// - lower
// - trim
// - collapse whitespace
// - remove common punctuation
// - replace ñ -> n (but keep accents intact)
function normalizeForCompare(input) {
  let s = (input || "").toLowerCase().trim();
  s = s.replace(/\s+/g, " ");
  // remove punctuation (keep accented letters)
  s = s.replace(/[.,;:!¿?()"“”'’\-—]/g, "");
  // ñ treated as n for marking
  s = s.replace(/ñ/g, "n");
  return s;
}

function isCorrect(studentAnswer, acceptedAnswers) {
  const a = normalizeForCompare(studentAnswer);
  if (!a) return { ok:false, matched:null };

  for (const ans of acceptedAnswers) {
    if (a === normalizeForCompare(ans)) return { ok:true, matched:ans };
  }
  return { ok:false, matched:null };
}

// ---------- Checklists (motivational, not punitive) ----------
const CHECKS = [
  { id:"connectors", label:"Connector (y/pero/además/porque/sin embargo/por eso)", re:/\b(y|pero|además|porque|sin embargo|por eso|aunque|también)\b/i },
  { id:"opinion", label:"Opinion (creo que / en mi opinión / me parece)", re:/\b(creo que|en mi opinión|me parece|pienso que)\b/i },
  { id:"time", label:"Time phrase (ayer/hoy/mañana/la semana pasada/el año que viene)", re:/\b(ayer|hoy|mañana|la semana pasada|el año que viene|últimamente|normalmente)\b/i },
  { id:"accent", label:"Accents used (áéíóú)", re:/[áéíóú]/i },
];

function renderMiniChecklist(text) {
  miniChecklistEl.innerHTML = "";
  for (const c of CHECKS) {
    const ok = c.re.test(text || "");
    const pill = ok ? "good" : "warn";
    const mark = ok ? "✓" : "—";
    const div = document.createElement("div");
    div.className = "check";
    div.innerHTML = `<span>${escapeHtml(c.label)}</span><span class="pill ${pill}">${mark}</span>`;
    miniChecklistEl.appendChild(div);
  }
}

// ---------- Data model: Modes & levels ----------
/*
  Structure:
  MODES: { id, tag, title, desc, levels:[ { id, label, minutes, unlockScorePct, items:[{prompt, accepted[], hint?}] } ] }
  Each level has 10 items.
*/
const MODES = [
  {
    id: "JC_FOUNDATION",
    tag: "JC Common",
    title: "JC Writing Foundations",
    desc: "Short sentences that build exam-ready habits (verbs, connectors, accuracy).",
    levels: [
      {
        id: "JC_F_1",
        label: "Level 1 — Super safe sentences",
        minutes: 8,
        unlockPct: 70,
        items: [
          { prompt: "I like Spanish.", accepted: ["Me gusta el español."], hint:"gustar + el/la" },
          { prompt: "My school is big.", accepted: ["Mi colegio es grande.", "Mi instituto es grande."], hint:"ser + adjective" },
          { prompt: "I have two brothers.", accepted: ["Tengo dos hermanos."], hint:"tener" },
          { prompt: "Today I am tired.", accepted: ["Hoy estoy cansado.", "Hoy estoy cansada."], hint:"estar + feeling" },
          { prompt: "I study every day.", accepted: ["Estudio todos los días."], hint:"present tense" },
          { prompt: "At the weekend I relax.", accepted: ["El fin de semana me relajo.", "Los fines de semana me relajo."], hint:"reflexive me" },
          { prompt: "I want to improve my Spanish.", accepted: ["Quiero mejorar mi español."], hint:"quiero + infinitive" },
          { prompt: "In my town there is a park.", accepted: ["En mi ciudad hay un parque.", "En mi pueblo hay un parque."], hint:"hay" },
          { prompt: "I don’t like homework.", accepted: ["No me gustan los deberes."], hint:"gustar plural" },
          { prompt: "Spanish is useful.", accepted: ["El español es útil."], hint:"útil has accent" },
        ],
      },
      {
        id: "JC_F_2",
        label: "Level 2 — Opinions + reasons",
        minutes: 9,
        unlockPct: 70,
        items: [
          { prompt: "I like my school because it is friendly.", accepted: ["Me gusta mi colegio porque es amable.", "Me gusta mi colegio porque es simpático."], hint:"porque + reason" },
          { prompt: "I prefer winter because I love Christmas.", accepted: ["Prefiero el invierno porque me encanta la Navidad."], hint:"me encanta" },
          { prompt: "I think Spanish is interesting.", accepted: ["Creo que el español es interesante."], hint:"creo que" },
          { prompt: "In my opinion, reading is important.", accepted: ["En mi opinión, leer es importante.", "En mi opinión leer es importante."], hint:"en mi opinión" },
          { prompt: "I study a lot but I am still nervous.", accepted: ["Estudio mucho pero todavía estoy nervioso.", "Estudio mucho pero todavía estoy nerviosa."], hint:"pero / todavía" },
          { prompt: "My parents are strict but fair.", accepted: ["Mis padres son estrictos pero justos."], hint:"plural adjective" },
          { prompt: "I’m happy because I did well.", accepted: ["Estoy contento porque me fue bien.", "Estoy contenta porque me fue bien."], hint:"me fue bien" },
          { prompt: "Spanish helps me in the future.", accepted: ["El español me ayuda en el futuro."], hint:"helps = ayuda" },
          { prompt: "I don’t like maths because it is difficult.", accepted: ["No me gustan las matemáticas porque son difíciles."], hint:"matemáticas / difíciles" },
          { prompt: "I also play sport.", accepted: ["También hago deporte."], hint:"también" },
        ],
      },
      {
        id: "JC_F_3",
        label: "Level 3 — Past & future triggers (JC)",
        minutes: 10,
        unlockPct: 70,
        items: [
          { prompt: "Yesterday I went to the cinema.", accepted: ["Ayer fui al cine."], hint:"ayer + fui" },
          { prompt: "Last weekend I played football.", accepted: ["El fin de semana pasado jugué al fútbol."], hint:"jugué has accent" },
          { prompt: "Last year I visited Spain.", accepted: ["El año pasado visité España."], hint:"visité has accent" },
          { prompt: "Next year I’m going to study more.", accepted: ["El año que viene voy a estudiar más."], hint:"voy a + infinitive" },
          { prompt: "Tomorrow I’m going to do my homework.", accepted: ["Mañana voy a hacer mis deberes."], hint:"mañana" },
          { prompt: "When I was younger I was shy.", accepted: ["Cuando era más joven, era tímido.", "Cuando era más joven era tímido.", "Cuando era más joven, era tímida.", "Cuando era más joven era tímida."], hint:"era (imperfect)" },
          { prompt: "On Saturday we ate in a restaurant.", accepted: ["El sábado comimos en un restaurante."], hint:"comimos" },
          { prompt: "We had a great time.", accepted: ["Lo pasamos muy bien."], hint:"lo pasamos" },
          { prompt: "It was fun.", accepted: ["Fue divertido.", "Fue divertida."], hint:"fue + adjective" },
          { prompt: "In the future I want to travel.", accepted: ["En el futuro quiero viajar."], hint:"quiero + viajar" },
        ],
      },
    ],
  },

  {
    id: "JC_5POINTS",
    tag: "JC Common",
    title: "JC 5-Point Writing (Sentence Builder)",
    desc: "Practice the 5-point task by writing one strong sentence per point (auto-marked).",
    levels: [
      {
        id: "JC_5P_1",
        label: "Level 4 — School (5 points x2)",
        minutes: 10,
        unlockPct: 70,
        items: [
          { prompt: "Point: Describe your school (1 sentence).", accepted: ["Mi colegio es grande y moderno.", "Mi instituto es grande y moderno."], hint:"adjectives" },
          { prompt: "Point: Say your favourite subject and why.", accepted: ["Mi asignatura favorita es español porque es útil."], hint:"asignatura favorita" },
          { prompt: "Point: Say one difficulty in school.", accepted: ["Me cuesta matemáticas porque son difíciles.", "Me cuestan las matemáticas porque son difíciles."], hint:"me cuesta(n)" },
          { prompt: "Point: Mention an extracurricular activity.", accepted: ["Hago fútbol después de clase.", "Juego al fútbol después de clase."], hint:"after school" },
          { prompt: "Point: Say how you will improve.", accepted: ["Voy a estudiar más y voy a hacer los deberes."], hint:"voy a" },

          { prompt: "Point: Describe your town (1 sentence).", accepted: ["En mi ciudad hay tiendas y un parque.", "En mi pueblo hay tiendas y un parque."], hint:"hay" },
          { prompt: "Point: What do you do at the weekend?", accepted: ["Los fines de semana salgo con mis amigos."], hint:"salgo" },
          { prompt: "Point: Say what you did last weekend.", accepted: ["El fin de semana pasado vi una película.", "El fin de semana pasado vimos una película."], hint:"vi/vimos" },
          { prompt: "Point: Say what you will do next weekend.", accepted: ["El próximo fin de semana voy a descansar."], hint:"próximo" },
          { prompt: "Point: Opinion about your town.", accepted: ["Me gusta mi ciudad porque es tranquila.", "Me gusta mi pueblo porque es tranquilo."], hint:"porque" },
        ],
      },
    ],
  },

  {
    id: "LC_EMAIL_BUILDER",
    tag: "LC HL/OL",
    title: "LC Email/Letter Builder (Points → Sentences)",
    desc: "LC-style points: write one solid sentence per point. Auto-marked line by line.",
    levels: [
      {
        id: "LC_OL_1",
        label: "Level 5 — LC OL Email (safe + clear)",
        minutes: 12,
        unlockPct: 70,
        items: [
          { prompt: "Email opener: Say hello and ask how they are.", accepted: ["Hola, ¿qué tal?", "Hola, ¿cómo estás?"], hint:"¿qué tal?" },
          { prompt: "Point: Describe your daily routine (1 sentence).", accepted: ["Normalmente me levanto temprano y voy al colegio."], hint:"normalmente" },
          { prompt: "Point: Mention one subject you like and why.", accepted: ["Me gusta español porque es interesante."], hint:"porque" },
          { prompt: "Point: Say what you do to relax.", accepted: ["Para relajarme veo series y escucho música."], hint:"para + infinitive" },
          { prompt: "Point: Say a plan for next weekend.", accepted: ["El próximo fin de semana voy a salir con mis amigos."], hint:"voy a" },
          { prompt: "Point: Mention something difficult this year.", accepted: ["Este año me cuesta escribir en español."], hint:"me cuesta" },
          { prompt: "Point: Say how you will improve.", accepted: ["Voy a practicar más y voy a estudiar vocabulario."], hint:"practicar" },
          { prompt: "Ask a question about their life.", accepted: ["¿Qué haces tú en tu tiempo libre?", "¿Qué haces en tu tiempo libre?"], hint:"¿Qué haces...?" },
          { prompt: "Closing: Say write back soon.", accepted: ["Escríbeme pronto.", "Contesta pronto."], hint:"escríbeme" },
          { prompt: "Sign off: Bye + your name placeholder.", accepted: ["Un saludo.", "Hasta pronto."], hint:"Un saludo" },
        ],
      },
      {
        id: "LC_HL_1",
        label: "Level 6 — LC HL Email (more range)",
        minutes: 14,
        unlockPct: 70,
        items: [
          { prompt: "Email opener (friendly + reference to last message).", accepted: ["Hola, gracias por tu email.", "Hola, muchas gracias por tu email."], hint:"gracias por" },
          { prompt: "Point: Compare this year to last year.", accepted: ["Este año estudio más que el año pasado."], hint:"más que" },
          { prompt: "Point: Give an opinion with contrast.", accepted: ["Me gusta el colegio, pero a veces es estresante."], hint:"pero" },
          { prompt: "Point: Mention a past event (last weekend).", accepted: ["El fin de semana pasado fui al cine con mis amigos."], hint:"fui" },
          { prompt: "Point: Add a detail about feelings.", accepted: ["Me sentí muy contento.", "Me sentí muy contenta."], hint:"me sentí" },
          { prompt: "Point: Future plan (next month).", accepted: ["El mes que viene voy a hacer un examen importante."], hint:"mes que viene" },
          { prompt: "Point: Use a connector (sin embargo / por eso).", accepted: ["Sin embargo, voy a seguir practicando.", "Por eso voy a seguir practicando."], hint:"sin embargo/por eso" },
          { prompt: "Point: Ask a more complex question.", accepted: ["¿Qué opinas de las redes sociales?", "¿Qué opinas de las redes sociales en tu vida?"], hint:"¿Qué opinas...?" },
          { prompt: "Closing line (polite).", accepted: ["Espero tu respuesta.", "Espero tu respuesta pronto."], hint:"Espero..." },
          { prompt: "Sign off (HL style).", accepted: ["Un saludo cordial.", "Saludos cordiales."], hint:"cordial" },
        ],
      },
    ],
  },

  {
    id: "LC_DIALOGUE",
    tag: "LC HL/OL",
    title: "LC Dialogue Builder",
    desc: "Dialogues as 10 lines. Practice turns, questions, and natural Spanish.",
    levels: [
      {
        id: "LC_D_1",
        label: "Level 7 — OL Dialogue (station/restaurant style)",
        minutes: 12,
        unlockPct: 70,
        items: [
          { prompt: "Greeting: Good afternoon.", accepted: ["Buenas tardes."], hint:"Buenas tardes" },
          { prompt: "Say you want a ticket to Madrid.", accepted: ["Quiero un billete a Madrid."], hint:"billete" },
          { prompt: "Ask what time it leaves.", accepted: ["¿A qué hora sale?", "¿A qué hora sale el tren?"], hint:"¿A qué hora...?" },
          { prompt: "Ask how much it costs.", accepted: ["¿Cuánto cuesta?", "¿Cuánto cuesta el billete?"], hint:"¿Cuánto cuesta...?" },
          { prompt: "Say you prefer return ticket.", accepted: ["Prefiero ida y vuelta."], hint:"ida y vuelta" },
          { prompt: "Say thank you.", accepted: ["Gracias."], hint:"Gracias" },
          { prompt: "Restaurant: I am hungry.", accepted: ["Tengo hambre."], hint:"hambre" },
          { prompt: "Order a drink.", accepted: ["Quiero una coca cola.", "Quiero una Coca-Cola.", "Quiero una bebida."], hint:"Quiero..." },
          { prompt: "Ask for the bill.", accepted: ["La cuenta, por favor."], hint:"La cuenta" },
          { prompt: "Say goodbye.", accepted: ["Adiós.", "Hasta luego."], hint:"Hasta luego" },
        ],
      },
      {
        id: "LC_D_2",
        label: "Level 8 — HL Dialogue (more natural + detail)",
        minutes: 14,
        unlockPct: 70,
        items: [
          { prompt: "Greet + say you arrived yesterday and you're tired.", accepted: ["Hola, llegué ayer y estoy cansado.", "Hola, llegué ayer y estoy cansada."], hint:"llegué (accent)" },
          { prompt: "Ask about the school timetable.", accepted: ["¿Cuál es el horario del instituto?", "¿Cuál es el horario del colegio?"], hint:"¿Cuál es...?" },
          { prompt: "Say you want to practise Spanish more.", accepted: ["Quiero practicar más el español."], hint:"practicar" },
          { prompt: "Ask for advice.", accepted: ["¿Tienes algún consejo?", "¿Tienes consejos?"], hint:"consejo" },
          { prompt: "Say you like the neighbourhood.", accepted: ["Me gusta el barrio porque es animado."], hint:"barrio" },
          { prompt: "But you're worried about something.", accepted: ["Pero me preocupa el examen.", "Pero me preocupa la prueba."], hint:"me preocupa" },
          { prompt: "Suggest a plan for the weekend.", accepted: ["¿Vamos al cine este fin de semana?", "Podemos ir al cine este fin de semana."], hint:"¿Vamos...?" },
          { prompt: "Fix a time.", accepted: ["Quedamos a las seis.", "Quedamos a las seis de la tarde."], hint:"a las seis" },
          { prompt: "Say you're excited.", accepted: ["¡Qué ilusión!", "Estoy muy ilusionado.", "Estoy muy ilusionada."], hint:"ilusión" },
          { prompt: "Say see you soon.", accepted: ["Nos vemos pronto.", "Hasta pronto."], hint:"Nos vemos" },
        ],
      },
    ],
  },
];

// ---------- Storage (per student) ----------
function getStudent() {
  const name = (studentNameEl.value || "").trim();
  return name || "Anonymous";
}

function loadAttempts() {
  try {
    const raw = localStorage.getItem(LS_ATTEMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveAttempts(arr) {
  localStorage.setItem(LS_ATTEMPTS, JSON.stringify(arr.slice(-800)));
}

function bestKey(student, modeId, levelId) {
  return `${student}::${modeId}::${levelId}`;
}
function loadBest() {
  try {
    const raw = localStorage.getItem(LS_BEST);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveBest(obj) {
  localStorage.setItem(LS_BEST, JSON.stringify(obj));
}

// ---------- Unlock logic ----------
function getUnlockThreshold(level) {
  return level.unlockPct ?? SETTINGS.unlockPct ?? 70;
}
function isLevelUnlocked(student, mode, levelIndex) {
  if (levelIndex === 0) return true;
  const best = loadBest();
  const prevLevel = mode.levels[levelIndex - 1];
  const key = bestKey(student, mode.id, prevLevel.id);
  const prevBest = best[key] ?? 0;
  return prevBest >= getUnlockThreshold(prevLevel);
}

// ---------- UI: home tiles & level grid ----------
let currentMode = null;
let currentLevel = null;

function buildModeTiles() {
  modeTilesEl.innerHTML = "";
  for (const m of MODES) {
    const div = document.createElement("div");
    div.className = "tile";
    div.innerHTML = `
      <div class="tag">${escapeHtml(m.tag)}</div>
      <h3>${escapeHtml(m.title)}</h3>
      <p>${escapeHtml(m.desc)}</p>
      <div class="meta">
        <span>🎯 Levels: ${m.levels.length}</span>
        <span>✍️ 10 items/level</span>
      </div>
    `;
    div.addEventListener("click", () => openMode(m.id));
    modeTilesEl.appendChild(div);
  }
}

function openMode(modeId) {
  const m = MODES.find(x => x.id === modeId);
  if (!m) return;
  currentMode = m;
  levelsTitleEl.textContent = m.title;
  levelsDescEl.textContent = m.desc;

  buildLevelGrid();
  showScreen("levels");
}

function buildLevelGrid() {
  const student = getStudent();
  levelGridEl.innerHTML = "";

  const best = loadBest();

  currentMode.levels.forEach((lvl, idx) => {
    const unlocked = isLevelUnlocked(student, currentMode, idx);
    const key = bestKey(student, currentMode.id, lvl.id);
    const bestScore = best[key] ?? 0;

    const div = document.createElement("div");
    div.className = "level-card" + (unlocked ? "" : " locked");
    div.innerHTML = `
      <h3>${escapeHtml(lvl.label)}</h3>
      <div class="tiny">⏱ ${lvl.minutes ?? SETTINGS.defaultMinutes} min · Unlock: ${getUnlockThreshold(lvl)}% · Best: ${bestScore}%</div>
      <div class="tiny muted" style="margin-top:8px;">
        ${unlocked ? "Tap to play" : `Locked — score ${getUnlockThreshold(currentMode.levels[idx-1])}%+ in previous level`}
      </div>
    `;

    if (unlocked) div.addEventListener("click", () => startLevel(lvl.id));
    levelGridEl.appendChild(div);
  });
}

// ---------- Gameplay state ----------
let game = {
  idx: 0,
  score: 0,
  correct: 0,
  wrong: 0,
  streak: 0,
  timerLeft: 0,
  timerTotal: 0,
  interval: null,
  items: [],
  results: [], // {prompt, student, ok, expected}
};

function setTimer(seconds) {
  stopTimer();
  game.timerLeft = seconds;
  game.timerTotal = seconds;
  timerEl.textContent = fmtTime(game.timerLeft);
}
function startTimer() {
  stopTimer();
  game.interval = setInterval(() => {
    game.timerLeft -= 1;
    if (game.timerLeft < 0) game.timerLeft = 0;
    timerEl.textContent = fmtTime(game.timerLeft);
    if (game.timerLeft === 0) finishLevel();
  }, 1000);
}
function stopTimer() {
  if (game.interval) clearInterval(game.interval);
  game.interval = null;
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startLevel(levelId) {
  const lvl = currentMode.levels.find(l => l.id === levelId);
  if (!lvl) return;

  currentLevel = lvl;

  game.idx = 0;
  game.score = 0;
  game.correct = 0;
  game.wrong = 0;
  game.streak = 0;
  game.results = [];
  game.items = shuffle(lvl.items).slice(0, 10);

  const minutes = lvl.minutes ?? SETTINGS.defaultMinutes ?? 10;
  setTimer(minutes * 60);
  startTimer();

  playTitleEl.textContent = `${currentMode.title} — ${lvl.label}`;
  playSubEl.textContent = "Write the Spanish. Submit for instant correction. Aim to beat your best score.";
  liveScoreEl.textContent = `0/10`;
  itemIdxEl.textContent = `1/10`;

  statCorrectEl.textContent = "0";
  statWrongEl.textContent = "0";
  statStreakEl.textContent = "0";

  feedbackEl.className = "feedback";
  feedbackEl.textContent = "Type your answer and press Submit.";

  answerBoxEl.value = "";
  btnNext.disabled = true;

  loadCurrentItem();

  showScreen("play");
  answerBoxEl.focus();
}

function loadCurrentItem() {
  const item = game.items[game.idx];
  promptTitleEl.textContent = `Item ${game.idx + 1}`;
  promptBodyEl.innerHTML = `<strong>Write in Spanish:</strong>\n\n${escapeHtml(item.prompt)}`;
  answerBoxEl.value = "";
  btnNext.disabled = true;
  btnSubmit.disabled = false;
  feedbackEl.className = "feedback";
  feedbackEl.textContent = "Type your answer and press Submit.";
  itemIdxEl.textContent = `${game.idx + 1}/10`;
  renderMiniChecklist("");
}

function updateStatsUI() {
  liveScoreEl.textContent = `${game.score}/10`;
  statCorrectEl.textContent = String(game.correct);
  statWrongEl.textContent = String(game.wrong);
  statStreakEl.textContent = String(game.streak);
}

function submitAnswer() {
  const item = game.items[game.idx];
  const studentText = answerBoxEl.value.trim();

  // live checklist from their text
  renderMiniChecklist(studentText);

  const check = isCorrect(studentText, item.accepted);
  if (check.ok) {
    game.score += 1;
    game.correct += 1;
    game.streak += 1;
    feedbackEl.className = "feedback good";
    feedbackEl.innerHTML = `<strong>✅ Correct!</strong> Nice.`;
  } else {
    game.wrong += 1;
    game.streak = 0;
    feedbackEl.className = "feedback bad";
    const showOne = item.accepted[0];
    feedbackEl.innerHTML = `<strong>❌ Not quite.</strong> Example answer: <span style="font-weight:800">${escapeHtml(showOne)}</span>`;
  }

  game.results.push({
    prompt: item.prompt,
    student: studentText,
    ok: check.ok,
    expected: item.accepted[0]
  });

  updateStatsUI();
  btnNext.disabled = false;
  btnSubmit.disabled = true;
}

function nextItem() {
  if (game.idx >= 9) {
    finishLevel();
    return;
  }
  game.idx += 1;
  loadCurrentItem();
  btnSubmit.disabled = false;
  btnNext.disabled = true;
  answerBoxEl.focus();
}

function finishLevel() {
  stopTimer();

  const student = getStudent();
  const pct = Math.round((game.score / 10) * 100);

  // save attempt
  const attempts = loadAttempts();
  attempts.push({
    ts: new Date().toISOString(),
    student,
    modeId: currentMode.id,
    modeTitle: currentMode.title,
    levelId: currentLevel.id,
    levelLabel: currentLevel.label,
    score: game.score,
    outOf: 10,
    pct,
    secondsSpent: game.timerTotal - game.timerLeft,
  });
  saveAttempts(attempts);

  // update best
  const best = loadBest();
  const key = bestKey(student, currentMode.id, currentLevel.id);
  const prev = best[key] ?? 0;
  const improved = pct > prev;
  if (improved) {
    best[key] = pct;
    saveBest(best);
  }

  // results UI
  finalScoreEl.textContent = `${game.score}/10`;
  resultsSummaryEl.textContent = `${student} scored ${pct}% in ${currentLevel.label}.`;

  bestScoreLineEl.textContent = improved
    ? `New best! 🎉 Best: ${pct}%`
    : `Best: ${prev}%`;

  // corrections
  correctionsEl.innerHTML = "";
  game.results.forEach((r, i) => {
    const div = document.createElement("div");
    div.className = "corr";
    div.innerHTML = `
      <div class="q"><strong>${i + 1}.</strong> ${escapeHtml(r.prompt)}</div>
      <div class="a">
        <div class="${r.ok ? "right" : "wrong"}"><strong>Your answer:</strong> ${escapeHtml(r.student || "—")}</div>
        <div><strong>Example:</strong> ${escapeHtml(r.expected)}</div>
      </div>
    `;
    correctionsEl.appendChild(div);
  });

  showScreen("results");
}

// ---------- Progress screen ----------
function renderProgress() {
  const attempts = loadAttempts().slice().reverse().slice(0, 300);
  progressTable.innerHTML = "";
  for (const a of attempts) {
    const tr = document.createElement("tr");
    const d = new Date(a.ts);
    tr.innerHTML = `
      <td>${escapeHtml(d.toLocaleString())}</td>
      <td>${escapeHtml(a.student)}</td>
      <td>${escapeHtml(a.modeTitle)}</td>
      <td>${escapeHtml(a.levelLabel)}</td>
      <td>${escapeHtml(`${a.score}/10 (${a.pct}%)`)}</td>
      <td>${escapeHtml(fmtTime(a.secondsSpent || 0))}</td>
    `;
    progressTable.appendChild(tr);
  }
}

function exportCSV() {
  const attempts = loadAttempts();
  const cols = ["ts","student","modeTitle","levelLabel","score","outOf","pct","secondsSpent"];
  const lines = [cols.join(",")];
  for (const a of attempts) {
    const row = cols.map(k => `"${String(a[k] ?? "").replace(/"/g,'""')}"`);
    lines.push(row.join(","));
  }
  downloadText(`escritura_tower_progress_${new Date().toISOString().slice(0,10)}.csv`, lines.join("\n"));
}

// ---------- Hints & Give up ----------
function showHint() {
  const item = game.items[game.idx];
  const hint = item.hint ? `Hint: ${item.hint}` : "Hint: Look for verbs + connector + correct article/adjective.";
  feedbackEl.className = "feedback";
  feedbackEl.textContent = hint;
}
function showAnswer() {
  const item = game.items[game.idx];
  feedbackEl.className = "feedback";
  feedbackEl.innerHTML = `<strong>Answer:</strong> ${escapeHtml(item.accepted[0])}`;
}

// ---------- Settings UI ----------
btnSettings.addEventListener("click", () => {
  crestPathEl.value = SETTINGS.crestPath ?? "crest.png";
  crestOpacityEl.value = String(SETTINGS.crestOpacity ?? 0.22);
  unlockPctEl.value = String(SETTINGS.unlockPct ?? 70);
  defaultMinutesEl.value = String(SETTINGS.defaultMinutes ?? 10);
  settingsDialog.showModal();
});

btnSaveSettings.addEventListener("click", (e) => {
  e.preventDefault();
  const crestPath = (crestPathEl.value || "crest.png").trim();
  const crestOpacity = Math.max(0.05, Math.min(0.40, Number(crestOpacityEl.value || 0.22)));
  const unlockPct = Math.max(50, Math.min(100, Number(unlockPctEl.value || 70)));
  const defaultMinutes = Math.max(5, Math.min(30, Number(defaultMinutesEl.value || 10)));
  SETTINGS = { crestPath, crestOpacity, unlockPct, defaultMinutes };
  saveSettings(SETTINGS);
  applySettingsToCSS(SETTINGS);
  settingsDialog.close();
});

// ---------- Buttons ----------
btnLevelsBack.addEventListener("click", () => showScreen("home"));

btnSubmit.addEventListener("click", submitAnswer);
btnNext.addEventListener("click", nextItem);
btnQuit.addEventListener("click", () => { stopTimer(); showScreen("levels"); buildLevelGrid(); });

btnHint.addEventListener("click", showHint);
btnGiveUp.addEventListener("click", showAnswer);

btnResultsHome.addEventListener("click", () => { showScreen("home"); });
btnRetry.addEventListener("click", () => startLevel(currentLevel.id));

btnProgress.addEventListener("click", () => { renderProgress(); showScreen("progress"); });
btnProgressBack.addEventListener("click", () => showScreen("home"));
btnExport.addEventListener("click", exportCSV);
btnClear.addEventListener("click", () => {
  if (confirm("Clear ALL attempts and best scores on this device?")) {
    localStorage.removeItem(LS_ATTEMPTS);
    localStorage.removeItem(LS_BEST);
    renderProgress();
  }
});

// Update unlock grid if student name changes
studentNameEl.addEventListener("change", () => {
  if (screens.levels.classList.contains("active")) buildLevelGrid();
});

// Mini checklist updates as they type
answerBoxEl.addEventListener("input", () => renderMiniChecklist(answerBoxEl.value));

// ---------- Init ----------
(function init(){
  buildModeTiles();
  showScreen("home");
})();
