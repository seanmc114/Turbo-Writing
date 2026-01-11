:root{
  --bg1:#0b1020;
  --bg2:#111a35;
  --card: rgba(255,255,255,.08);
  --card2: rgba(255,255,255,.06);
  --text:#f4f7ff;
  --muted: rgba(244,247,255,.72);
  --line: rgba(255,255,255,.14);
  --accent: #7dd3fc;
  --accent2:#a78bfa;
  --good:#34d399;
  --warn:#fbbf24;
  --bad:#fb7185;
  --shadow: 0 18px 60px rgba(0,0,0,.35);
  --radius: 18px;

  --crest: none; /* set via JS from settings, e.g. url('crest.png') */
}

*{ box-sizing:border-box; }
html,body{ height:100%; }
body{
  margin:0;
  color:var(--text);
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
  background: radial-gradient(1200px 700px at 15% 10%, rgba(167,139,250,.35), transparent 60%),
              radial-gradient(900px 600px at 85% 20%, rgba(125,211,252,.25), transparent 55%),
              linear-gradient(180deg, var(--bg1), var(--bg2));
  overflow-x:hidden;
}

.bg{
  position:fixed; inset:0;
  background-image: var(--crest);
  background-repeat:no-repeat;
  background-position:center;
  background-size: 90vmin;
  opacity:.10;
  pointer-events:none;
  filter: grayscale(1) contrast(1.1);
}

.topbar{
  position:sticky; top:0; z-index:5;
  padding: 14px 18px;
  background: rgba(10,15,30,.62);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--line);
  display:flex; align-items:center; justify-content:space-between;
  gap:12px;
}

.brand{
  display:flex; align-items:center; gap:12px;
}
.logo{
  width:44px; height:44px;
  display:grid; place-items:center;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(125,211,252,.22), rgba(167,139,250,.18));
  border: 1px solid var(--line);
  box-shadow: var(--shadow);
  font-size: 22px;
}
h1{ margin:0; font-size: 18px; letter-spacing:.2px; }
.sub{ margin:2px 0 0; color:var(--muted); font-size: 13px; }

.wrap{
  max-width: 1200px;
  margin: 18px auto 80px;
  padding: 0 18px;
  display:grid;
  grid-template-columns: 1.2fr .8fr;
  gap: 16px;
}

@media (max-width: 960px){
  .wrap{ grid-template-columns: 1fr; }
  .top-actions{ display:flex; flex-wrap:wrap; }
}

.screen{ display:none; }
.screen.active{ display:contents; }

.panel{
  background: linear-gradient(180deg, var(--card), var(--card2));
  border: 1px solid var(--line);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  overflow:hidden;
}
.panel.slim{ padding: 14px 16px; }

.panel-head{
  padding: 16px 18px;
  border-bottom: 1px solid var(--line);
}
.panel-head h2{ margin:0; font-size:18px; }
.muted{ color:var(--muted); margin:6px 0 0; font-size: 13px; }

.panel-foot{
  padding: 14px 18px;
  border-top: 1px solid var(--line);
}

.note{
  padding: 12px 12px;
  border-radius: 14px;
  background: rgba(0,0,0,.22);
  border: 1px dashed rgba(255,255,255,.18);
  color: rgba(244,247,255,.85);
  font-size: 13px;
}

.grid{
  padding: 16px 18px 18px;
  display:grid;
  grid-template-columns: repeat(2, minmax(0,1fr));
  gap: 12px;
}
@media (max-width: 700px){
  .grid{ grid-template-columns: 1fr; }
}

.tile{
  padding: 14px 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,.16);
  background: linear-gradient(135deg, rgba(125,211,252,.14), rgba(167,139,250,.12));
  cursor:pointer;
  transition: transform .12s ease, border-color .12s ease, background .12s ease;
  position:relative;
  overflow:hidden;
}
.tile:hover{
  transform: translateY(-2px);
  border-color: rgba(255,255,255,.26);
  background: linear-gradient(135deg, rgba(125,211,252,.18), rgba(167,139,250,.15));
}
.tile .tag{
  display:inline-flex; align-items:center; gap:6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(0,0,0,.25);
  border: 1px solid rgba(255,255,255,.16);
  font-size: 12px;
  color: rgba(244,247,255,.85);
}
.tile h3{ margin:10px 0 6px; font-size: 16px; }
.tile p{ margin:0; color: var(--muted); font-size: 13px; line-height:1.35; }
.tile .meta{
  margin-top:10px;
  display:flex; gap:8px; flex-wrap:wrap;
  color: rgba(244,247,255,.82);
  font-size: 12px;
}

.btn{
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.12);
  color: var(--text);
  padding: 10px 12px;
  border-radius: 14px;
  cursor:pointer;
  transition: transform .08s ease, background .12s ease, border-color .12s ease;
}
.btn:hover{ transform: translateY(-1px); border-color: rgba(255,255,255,.28); }
.btn:active{ transform: translateY(0); }
.btn.ghost{ background: rgba(0,0,0,.22); }
.btn.warn{ background: rgba(251,191,36,.20); border-color: rgba(251,191,36,.35); }
.btn.danger{ background: rgba(251,113,133,.16); border-color: rgba(251,113,133,.35); }

.top-actions{ display:flex; gap:10px; align-items:center; }

.play-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 12px;
}
.hud{
  display:flex;
  gap:10px;
  flex-wrap:wrap;
  justify-content:flex-end;
}
.hud-item{
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(0,0,0,.22);
  border: 1px solid rgba(255,255,255,.14);
  min-width: 120px;
}
.hud-label{
  display:block;
  font-size: 11px;
  color: rgba(244,247,255,.70);
}
.hud-value{
  font-weight: 700;
  font-size: 16px;
}

.input{
  width: 100%;
  padding: 10px 10px;
  border-radius: 12px;
  border: 1px solid rgba(255,255,255,.16);
  background: rgba(0,0,0,.25);
  color: var(--text);
  outline:none;
}
.input.small{ padding: 6px 8px; font-size: 13px; margin-top: 6px; }

.prompt{
  padding: 14px 18px 0;
}
.prompt-top{
  display:flex;
  justify-content:space-between;
  gap:10px;
  align-items:center;
}
.prompt-body{
  margin-top:10px;
  padding: 12px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(0,0,0,.20);
  line-height: 1.45;
  color: rgba(244,247,255,.92);
  font-size: 14px;
  white-space: pre-wrap;
}
.prompt-body ul{ margin: 10px 0 0 18px; }
.prompt-body li{ margin: 4px 0; }

.inputs{
  padding: 14px 18px 6px;
  display:grid;
  gap: 10px;
}
.textarea{
  width: 100%;
  min-height: 220px;
  resize: vertical;
  padding: 12px 12px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,.16);
  background: rgba(0,0,0,.25);
  color: var(--text);
  outline:none;
  line-height: 1.45;
  font-size: 14px;
}
.textarea:focus{ border-color: rgba(125,211,252,.55); }

.controls{
  padding: 12px 18px 16px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  border-top: 1px solid var(--line);
  gap: 12px;
}
.controls .right{ display:flex; gap:10px; flex-wrap:wrap; }
.controls .left{ display:flex; gap:10px; flex-wrap:wrap; }

.checklist{
  display:grid;
  gap: 8px;
  margin-top: 12px;
}
.check{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 10px;
  padding: 10px 10px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(0,0,0,.20);
  font-size: 13px;
  color: rgba(244,247,255,.9);
}
.check .pill{
  padding: 3px 8px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(255,255,255,.08);
  font-size: 12px;
}
.pill.good{ border-color: rgba(52,211,153,.35); background: rgba(52,211,153,.12); }
.pill.warn{ border-color: rgba(251,191,36,.35); background: rgba(251,191,36,.12); }
.pill.bad{ border-color: rgba(251,113,133,.35); background: rgba(251,113,133,.12); }

.checklist.big .check{ font-size: 14px; padding: 12px; }

.results-grid{
  padding: 16px 18px 18px;
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
@media (max-width: 960px){
  .results-grid{ grid-template-columns: 1fr; }
}
.result-card{
  padding: 14px 14px;
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,.14);
  background: rgba(0,0,0,.18);
}
.result-card h3{ margin: 0 0 8px; font-size: 15px; }
.divider{ height: 1px; background: rgba(255,255,255,.12); margin: 12px 0; }
.tiny{ font-size: 12px; }

.table-wrap{ overflow:auto; }
.table{
  width: 100%;
  border-collapse: collapse;
}
.table th, .table td{
  padding: 10px 10px;
  border-bottom: 1px solid rgba(255,255,255,.10);
  text-align:left;
  font-size: 13px;
  white-space:nowrap;
}
.table th{ color: rgba(244,247,255,.82); font-weight: 700; }
.table td{ color: rgba(244,247,255,.92); }

.steps{ margin: 10px 0 0 18px; color: rgba(244,247,255,.9); }
.steps li{ margin: 6px 0; }

.modal{
  width: min(900px, calc(100% - 24px));
  border-radius: 18px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(10,14,28,.92);
  color: var(--text);
  box-shadow: var(--shadow);
}
.modal::backdrop{ background: rgba(0,0,0,.55); }
.modal-inner{ padding: 16px; }
.modal-actions{
  display:flex; justify-content:flex-end; gap:10px; margin-top:12px;
}
.field{ display:block; margin: 12px 0; }
.label{ display:block; margin-bottom:6px; color: rgba(244,247,255,.84); font-size: 13px; }
.details summary{ cursor:pointer; margin-top:10px; color: rgba(244,247,255,.9); }
.code{
  padding: 10px;
  border-radius: 14px;
  border: 1px solid rgba(255,255,255,.12);
  background: rgba(0,0,0,.24);
  overflow:auto;
}

.history-head{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 12px;
}
