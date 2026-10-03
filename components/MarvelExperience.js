import { html, useMemo, useState } from "htm/react";
import { displayReleaseOrder, getUniverse, statusOf } from "../utils/helpers.js";

const today = () => new Date().toISOString().slice(0, 10);
const episodeCount = (p) => Array.isArray(p.episodesBySeason) ? p.episodesBySeason.reduce((a, n) => a + Number(n || 0), 0) : Number(p.episodes || 0);

function buildTrivia(visible) {
  if (!visible.length) return [];
  const release = visible.slice().sort((a, b) => displayReleaseOrder(a) - displayReleaseOrder(b));
  const longest = visible.slice().sort((a, b) => Number(b.runtimeMinutes || 0) - Number(a.runtimeMinutes || 0))[0];
  const series = visible.filter((p) => episodeCount(p) > 0);
  const mostEpisodes = series.slice().sort((a, b) => episodeCount(b) - episodeCount(a))[0];
  const phases = [...visible.reduce((m, p) => { if (p.phase) m.set(p.phase, (m.get(p.phase) || 0) + 1); return m; }, new Map()).entries()].sort((a, b) => b[1] - a[1]);
  const target = visible[Math.min(7, visible.length - 1)];
  const universe = getUniverse(target.universe);
  const unique = (answer, list) => [answer, ...list.filter((x) => x && x !== answer)].slice(0, 4);
  return [
    { q: "Which tracked title comes first in release order?", options: unique(release[0]?.title, release.slice(1, 5).map((p) => p.title)), answer: 0, note: "Release order from the current archive." },
    { q: "Which tracked title has the longest runtime?", options: unique(longest?.title, visible.slice(0, 5).map((p) => p.title)), answer: 0, note: "Runtime from the catalog data." },
    { q: "Which series has the most tracked episodes?", options: unique(mostEpisodes?.title, series.slice(0, 5).map((p) => p.title)), answer: 0, note: "Episode totals from the archive." },
    { q: "Which universe contains this title?", title: target.title, options: unique(universe.name, [...new Set(visible.map((p) => getUniverse(p.universe).name))]), answer: 0, note: "Continuity data from the archive." },
    { q: "Which MCU phase has the most tracked projects?", options: unique(phases[0] ? "Phase " + phases[0][0] : "Phase 1", phases.slice(1, 5).map((p) => "Phase " + p[0])), answer: 0, note: "Counted from the visible catalog." },
  ].filter((q) => q.options.length >= 2);
}

function SagaProgress({ visible, userData, onOpen }) {
  const phases = useMemo(() => {
    const map = new Map();
    visible.forEach((p) => { const key = p.phase ? "Phase " + p.phase : "Legacy"; if (!map.has(key)) map.set(key, []); map.get(key).push(p); });
    return [...map.entries()].sort((a, b) => { if (a[0] === "Legacy") return 1; if (b[0] === "Legacy") return -1; return Number(a[0].slice(6)) - Number(b[0].slice(6)); });
  }, [visible]);
  return html`<div className="mx-saga-grid">${phases.map(([name, items]) => {
    const done = items.filter((p) => statusOf(p.id, userData) === "completed").length;
    const percent = items.length ? Math.round((done / items.length) * 100) : 0;
    const latest = items.slice().sort((a, b) => displayReleaseOrder(b) - displayReleaseOrder(a))[0];
    return html`<button key=${name} type="button" className="mx-saga-card" onClick=${() => latest && onOpen(latest.id)}>
      <span className="mx-saga-number">${name === "Legacy" ? "∞" : name.replace("Phase ", "P")}</span>
      <span className="mx-saga-copy"><strong>${name === "Legacy" ? "Legacy & connected" : "MCU " + name}</strong><small>${done}/${items.length} completed</small></span>
      <span className="mx-progress"><i style=${{ width: percent + "%" }}></i></span><em>${percent}%</em>
    </button>`;
  })}</div>`;
}

function CharacterTrails({ visible, userData, onOpen }) {
  const characters = useMemo(() => {
    const map = new Map();
    visible.forEach((p) => (p.characters || []).forEach((name) => { if (!map.has(name)) map.set(name, []); map.get(name).push(p); }));
    return [...map.entries()].map(([name, projects]) => ({ name, projects: projects.slice().sort((a, b) => displayReleaseOrder(a) - displayReleaseOrder(b)), completed: projects.filter((p) => statusOf(p.id, userData) === "completed").length }))
      .sort((a, b) => b.completed - a.completed || b.projects.length - a.projects.length || a.name.localeCompare(b.name)).slice(0, 8);
  }, [visible, userData]);
  const [selected, setSelected] = useState("");
  const active = characters.find((c) => c.name === selected) || characters[0];
  if (!active) return html`<div className="mx-empty">Character trails will appear as the archive gains character data.</div>`;
  return html`<div className="mx-character-layout">
    <div className="mx-character-list">${characters.map((c) => html`<button key=${c.name} type="button" className=${"mx-character-chip" + (c.name === active.name ? " active" : "")} onClick=${() => setSelected(c.name)}><span>${c.name.slice(0, 1)}</span><strong>${c.name}</strong><small>${c.completed}/${c.projects.length}</small></button>`)}</div>
    <div className="mx-character-trail"><div className="mx-panel-head"><div><span className="eyebrow">CHARACTER TRAIL</span><h3>${active.name}</h3></div><span>${active.completed}/${active.projects.length} completed</span></div>
      <div className="mx-trail">${active.projects.map((p, i) => { const done = statusOf(p.id, userData) === "completed"; return html`<button key=${p.id} type="button" className=${"mx-trail-item " + (done ? "done" : "")} onClick=${() => onOpen(p.id)}><span className="mx-trail-line">${i === active.projects.length - 1 ? "" : "│"}</span><span className="mx-trail-dot">${done ? "✓" : "○"}</span><span><strong>${p.title}</strong><small>${p.releaseYear}${p.phase ? " · Phase " + p.phase : ""}</small></span></button>`; })}</div>
    </div></div>`;
}

function ReleaseRadar({ visible, userData, onOpen }) {
  const upcoming = useMemo(() => visible.filter((p) => p.releaseDate && p.releaseDate >= today() && statusOf(p.id, userData) !== "completed").sort((a, b) => a.releaseDate.localeCompare(b.releaseDate)).slice(0, 6), [visible, userData]);
  return html`<div className="mx-radar"><div className="mx-radar-head"><div><span className="eyebrow">RELEASE RADAR</span><h3>What is entering your universe?</h3></div><span className="mx-live-dot">● ARCHIVE RADAR</span></div>
    ${upcoming.length ? html`<div className="mx-release-list">${upcoming.map((p) => { const d = new Date(p.releaseDate + "T00:00:00"); const days = Math.max(0, Math.ceil((d.getTime() - Date.now()) / 86400000)); return html`<button key=${p.id} type="button" className="mx-release" onClick=${() => onOpen(p.id)}><span className="mx-release-date"><b>${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</b><small>${d.getFullYear()}</small></span><span className="mx-release-copy"><strong>${p.title}</strong><small>${getUniverse(p.universe).name}${p.phase ? " · Phase " + p.phase : ""}</small></span><span className="mx-release-count">${days === 0 ? "TODAY" : days + "d"}</span></button>`; })}</div>` : html`<div className="mx-empty">No future-dated unreached releases are currently stored in the visible archive.</div>`}
  </div>`;
}

function CollectionVault({ visible, userData, onOpen }) {
  const unlocked = useMemo(() => visible.filter((p) => statusOf(p.id, userData) === "completed").sort((a, b) => displayReleaseOrder(a) - displayReleaseOrder(b)).slice(-8).reverse(), [visible, userData]);
  const total = visible.filter((p) => statusOf(p.id, userData) === "completed").length;
  return html`<div className="mx-vault"><div className="mx-panel-head"><div><span className="eyebrow">COLLECTION VAULT</span><h3>Your latest unlocked titles</h3></div><span>${total} unlocked</span></div>
    <div className="mx-vault-grid">${unlocked.length ? unlocked.map((p, i) => html`<button key=${p.id} type="button" className="mx-vault-card" onClick=${() => onOpen(p.id)}><span className="mx-vault-rarity">${i === 0 ? "NEW" : "UNLOCKED"}</span><span className="mx-vault-mark">${p.title.slice(0, 1)}</span><strong>${p.title}</strong><small>${getUniverse(p.universe).name}</small><span className="mx-vault-check">✓</span></button>`) : html`<div className="mx-empty">Complete your first title to begin building your collection vault.</div>`}</div>
  </div>`;
}

function Trivia({ visible }) {
  const questions = useMemo(() => buildTrivia(visible), [visible]);
  const [index, setIndex] = useState(0); const [picked, setPicked] = useState(null); const [score, setScore] = useState(0);
  const q = questions[index % Math.max(1, questions.length)];
  if (!q) return html`<div className="mx-empty">Trivia unlocks when the archive has enough catalog data.</div>`;
  const choose = (i) => { if (picked !== null) return; setPicked(i); if (i === q.answer) setScore((s) => s + 1); };
  const next = () => { setPicked(null); setIndex((n) => n + 1); };
  return html`<div className="mx-trivia"><div className="mx-trivia-score"><span>MARVEL IQ</span><strong>${score}</strong><small>/ ${Math.max(1, index + (picked !== null ? 1 : 0))}</small></div><div className="mx-trivia-body"><span className="eyebrow">ARCHIVE CHALLENGE ${index + 1}</span><h3>${q.q}</h3>${q.title ? html`<p className="mx-trivia-target">Target: <b>${q.title}</b></p>` : null}<div className="mx-trivia-options">${q.options.map((option, i) => html`<button key=${option} type="button" className=${"mx-trivia-option " + (picked !== null ? (i === q.answer ? "correct" : i === picked ? "wrong" : "") : "")} onClick=${() => choose(i)} disabled=${picked !== null}><span>${String.fromCharCode(65 + i)}</span>${option}</button>`)}</div>${picked !== null ? html`<div className=${"mx-trivia-result " + (picked === q.answer ? "good" : "bad")}><strong>${picked === q.answer ? "Correct." : "Not quite."}</strong><span>${q.note}</span><button type="button" className="text-btn" onClick=${next}>Next challenge →</button></div>` : null}</div></div>`;
}

export function MarvelExperience({ visible, userData, onOpen }) {
  const [tab, setTab] = useState("sagas");
  const tabs = [["sagas", "Sagas"], ["characters", "Character Trails"], ["radar", "Release Radar"], ["vault", "Collection Vault"], ["trivia", "Marvel IQ"]];
  return html`<section className="marvel-experience"><div className="mx-heading"><div><span className="eyebrow">MARVEL HQ</span><h2>Your archive, beyond the watchlist.</h2><p>Explore your personal saga, character trails, collection and Marvel knowledge.</p></div><div className="mx-badge">✦ ${visible.length} TITLES IN YOUR ARCHIVE</div></div>
    <div className="mx-tabs" role="tablist" aria-label="Marvel HQ features">${tabs.map(([id, label]) => html`<button key=${id} type="button" role="tab" aria-selected=${tab === id} className=${"mx-tab " + (tab === id ? "active" : "")} onClick=${() => setTab(id)}>${label}</button>`)}</div>
    <div className="mx-content">${tab === "sagas" ? html`<${SagaProgress} visible=${visible} userData=${userData} onOpen=${onOpen} />` : null}${tab === "characters" ? html`<${CharacterTrails} visible=${visible} userData=${userData} onOpen=${onOpen} />` : null}${tab === "radar" ? html`<${ReleaseRadar} visible=${visible} userData=${userData} onOpen=${onOpen} />` : null}${tab === "vault" ? html`<${CollectionVault} visible=${visible} userData=${userData} onOpen=${onOpen} />` : null}${tab === "trivia" ? html`<${Trivia} visible=${visible} />` : null}</div>
  </section>`;
}