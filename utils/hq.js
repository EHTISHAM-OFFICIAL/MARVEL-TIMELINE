// Marvel HQ data layer. Pure functions over the catalog and the user's existing tracking data.
// Nothing here writes anything; it only reads PROJECTS / UNIVERSES / FRANCHISES and userData.
import { PROJECTS } from "../data/projects.js";
import { UNIVERSES } from "../data/universes.js";
import { FRANCHISES } from "../data/franchises.js";
import { expandProjectsBySeasons, displayReleaseOrder, passesMode, statusOf, getProjectState, isSeries } from "./helpers.js";

const isDone = (p, d) => statusOf(p.id, d) === "completed";
const isActive = (p, d) => { const s = statusOf(p.id, d); return s === "watching" || s === "rewatching"; };
const byRelease = (a, b) => displayReleaseOrder(a) - displayReleaseOrder(b);
const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const uniName = (id) => UNIVERSES.find((u) => u.id === id)?.name || id;
const franchiseName = (id) => FRANCHISES.find((f) => f.id === id)?.name || id;

/* ---------- Your Multiverse ---------- */
export function universeStats(userData) {
  const prefs = userData.preferences || {};
  const all = expandProjectsBySeasons(PROJECTS).filter((p) => passesMode(p, prefs.explorationMode));
  return UNIVERSES.map((universe) => {
    const items = all.filter((p) => p.universe === universe.id).sort(byRelease);
    const completed = items.filter((p) => isDone(p, userData)).length;
    const watching = items.filter((p) => isActive(p, userData)).length;
    const favorites = items.filter((p) => getProjectState(p, userData).favorite).length;
    return {
      universe, total: items.length, completed, watching, favorites,
      percent: pct(completed, items.length),
      explored: completed + watching > 0,
      hidden: (prefs.hiddenUniverses || []).includes(universe.id),
      next: items.find((p) => statusOf(p.id, userData) === "not-started") || null,
    };
  }).filter((s) => s.total > 0);
}

/* ---------- Character Journeys ---------- */
// Two catalog names that refer to the same person are merged for browsing only; the data itself is untouched.
const ALIAS = { Logan: "Wolverine", "Professor X": "Charles Xavier", "Doctor Strange": "Stephen Strange", "Thunderbolt Ross": "Thaddeus Ross" };
export const canonicalName = (n) => ALIAS[n] || n;

export function characterIndex(visible) {
  const map = new Map();
  visible.forEach((p) => {
    const seen = new Set();
    (p.characters || []).forEach((raw) => {
      const name = canonicalName(raw);
      if (seen.has(name)) return;
      seen.add(name);
      if (!map.has(name)) map.set(name, { name, aliases: new Set(), items: [] });
      const entry = map.get(name);
      if (raw !== name) entry.aliases.add(raw);
      entry.items.push(p);
    });
  });
  return [...map.values()].map((e) => ({ ...e, aliases: [...e.aliases] })).sort((a, b) => b.items.length - a.items.length || a.name.localeCompare(b.name));
}

export function characterJourney(entry, userData, order = "release") {
  const key = (p) => (order === "story" ? (p.chronologicalOrderIndex ?? 99999) : displayReleaseOrder(p));
  const items = entry.items.slice().sort((a, b) => key(a) - key(b) || byRelease(a, b));
  const stops = items.map((project) => ({ project, status: statusOf(project.id, userData) }));
  const completed = stops.filter((s) => s.status === "completed").length;
  return { stops, completed, total: stops.length, percent: pct(completed, stops.length), next: stops.find((s) => s.status === "watching" || s.status === "rewatching") || stops.find((s) => s.status === "not-started") || null };
}

/* ---------- Saga / Event Explorer ---------- */
// Sagas are classified purely from catalog fields (universe + phase). The Infinity/Multiverse split is the MCU's own phase grouping.
export const SAGA_DEFS = [
  { id: "infinity", group: "main", name: "The Infinity Saga", blurb: "MCU Phases 1 to 3, the first arc of the shared universe.", match: (p) => p.universe === "mcu-earth-616" && p.phase >= 1 && p.phase <= 3, chapter: (p) => "Phase " + p.phase },
  { id: "multiverse", group: "main", name: "The Multiverse Saga", blurb: "MCU Phase 4 onward, across Earth-616 and the wider multiverse.", match: (p) => (p.universe === "mcu-earth-616" || p.universe === "mcu-multiverse") && p.phase >= 4, chapter: (p) => "Phase " + p.phase },
  { id: "spider", group: "beyond", name: "Spider-Man Beyond the MCU", blurb: "The Raimi, Amazing and Sony Spider-Man continuities.", match: (p) => ["raimi-spider-man", "amazing-spider-man", "sony-spider-man-universe"].includes(p.universe), chapter: (p) => uniName(p.universe) },
  { id: "xmen", group: "beyond", name: "The Mutant Era", blurb: "The Fox X-Men films plus the Wolverine and Deadpool continuity.", match: (p) => ["fox-x-men", "wolverine-deadpool"].includes(p.universe), chapter: (p) => uniName(p.universe) },
  { id: "television", group: "beyond", name: "Marvel Television", blurb: "Netflix-era and network series outside the Disney+ MCU line.", match: (p) => p.universe === "marvel-television", chapter: (p) => String(p.releaseYear) },
  { id: "animation", group: "beyond", name: "Marvel Animation", blurb: "Animated projects across their own continuities.", match: (p) => p.universe === "marvel-animation", chapter: (p) => String(p.releaseYear) },
  { id: "legacy-ff", group: "beyond", name: "Legacy Fantastic Four", blurb: "Earlier live-action Fantastic Four film continuities.", match: (p) => p.universe === "fantastic-four-legacy", chapter: (p) => String(p.releaseYear) },
];

export function sagaProgress(visible, userData) {
  return SAGA_DEFS.map((def) => {
    const items = visible.filter(def.match).sort(byRelease);
    const chapters = [];
    items.forEach((p) => {
      const label = def.chapter(p);
      let ch = chapters.find((c) => c.label === label);
      if (!ch) { ch = { label, items: [] }; chapters.push(ch); }
      ch.items.push(p);
    });
    chapters.forEach((c) => { c.completed = c.items.filter((p) => isDone(p, userData)).length; c.total = c.items.length; c.percent = pct(c.completed, c.total); });
    const completed = items.filter((p) => isDone(p, userData)).length;
    return { def, items, chapters, completed, total: items.length, percent: pct(completed, items.length), available: items.length > 0, next: items.find((p) => statusOf(p.id, userData) === "not-started") || null };
  });
}

/* ---------- Release Radar ---------- */
const DAY = 86400000;
const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
export const daysUntil = (dateStr, now = new Date()) => {
  const t = new Date(String(dateStr) + "T00:00:00").getTime();
  return Number.isNaN(t) ? null : Math.round((t - dayStart(now)) / DAY);
};

export function releaseRadar(visible, userData, now = new Date()) {
  const dated = visible.filter((p) => p.releaseDate && daysUntil(p.releaseDate, now) !== null).map((project) => ({ project, days: daysUntil(project.releaseDate, now) }));
  const upcoming = dated.filter((x) => x.days > 0).sort((a, b) => a.days - b.days);
  const fresh = dated.filter((x) => x.days <= 0 && x.days >= -365 && statusOf(x.project.id, userData) === "not-started").sort((a, b) => b.days - a.days);
  const queue = visible.slice().sort(byRelease).filter((p) => statusOf(p.id, userData) === "not-started").slice(0, 4);
  return { upcoming, fresh, queue };
}

/* ---------- Collection Vault ---------- */
export function vaultItems(visible, userData) {
  return visible.filter((p) => isDone(p, userData)).map((project) => {
    const s = getProjectState(project, userData);
    return { project, favorite: Boolean(s.favorite), rating: Number(s.rating) || 0, watchedDate: s.watchedDate || "" };
  });
}

/* ---------- Collectible Cards (one card per trophy; collected when the trophy unlocks) ---------- */
export const RARITY = { bronze: "Common", silver: "Uncommon", gold: "Rare", platinum: "Epic", legendary: "Legendary" };
export function cardsFromTrophies(trophies) {
  const cards = trophies.list.map((t, i) => ({ ...t, no: i + 1, rarity: RARITY[t.tier], collected: Boolean(t.unlocked && t.available) }));
  return { cards, owned: cards.filter((c) => c.collected).length, total: cards.filter((c) => c.available).length };
}

/* ---------- Marvel IQ (verified catalog facts only) ---------- */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export const hashSeed = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

const verifiedPool = () => PROJECTS.filter((p) => p.verified === true);

export function buildQuiz({ seed = 1, count = 10 } = {}) {
  const rand = mulberry32(seed);
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pool = verifiedPool();
  const used = new Set();
  const fresh = (list) => { const l = list.filter((p) => !used.has(p.id)); return l.length ? pick(l) : null; };
  const mk = (kind, project, prompt, correct, wrong, explanation, min = 3) => {
    const c = String(correct);
    const w = [...new Set(wrong.map(String))].filter((t) => t !== c).slice(0, 3);
    if (w.length + 1 < min) return null;
    const options = shuffle([c, ...w]).map((text, i) => ({ id: "o" + i, text }));
    const answer = options.find((o) => o.text === c);
    return { id: kind + ":" + project.id, kind, projectId: project.id, prompt, options, correct: answer.id, explanation };
  };
  const verb = (p) => (isSeries(p) ? "premiere" : "release");
  const makers = {
    year(p) {
      const wrong = shuffle([-3, -2, -1, 1, 2, 3].map((d) => p.releaseYear + d)).slice(0, 3);
      return mk("year", p, `In which year did “${p.title}” ${verb(p)}?`, p.releaseYear, wrong, `“${p.title}” ${isSeries(p) ? "premiered" : "was released"} in ${p.releaseYear}.`);
    },
    phase(p) {
      if (p.universe !== "mcu-earth-616" && p.universe !== "mcu-multiverse") return null;
      const wrong = shuffle([1, 2, 3, 4, 5, 6].filter((n) => n !== p.phase)).slice(0, 3).map((n) => "Phase " + n);
      return mk("phase", p, `Which MCU phase is “${p.title}” part of?`, "Phase " + p.phase, wrong, `“${p.title}” belongs to Phase ${p.phase}.`);
    },
    universe(p) {
      const wrong = shuffle(UNIVERSES.filter((u) => u.id !== p.universe)).slice(0, 3).map((u) => u.name);
      return mk("universe", p, `Which continuity does “${p.title}” belong to?`, uniName(p.universe), wrong, `The catalog places “${p.title}” in ${uniName(p.universe)}.`);
    },
    episodes(p) {
      if (!isSeries(p) || !p.episodes || p.episodes < 3) return null;
      const wrong = shuffle([-4, -3, -2, -1, 1, 2, 3, 4].map((d) => p.episodes + d).filter((n) => n > 0)).slice(0, 3);
      return mk("episodes", p, `How many episodes does “${p.title}” have in total?`, p.episodes, wrong, `“${p.title}” has ${p.episodes} episodes across ${p.seasons || 1} season${(p.seasons || 1) > 1 ? "s" : ""}.`);
    },
    seasons(p) {
      if (!isSeries(p) || !p.seasons || p.seasons < 2) return null;
      const wrong = shuffle([1, 2, 3, 4, 5, 6, 7].filter((n) => n !== p.seasons)).slice(0, 3);
      return mk("seasons", p, `How many seasons does “${p.title}” have?`, p.seasons, wrong, `“${p.title}” has ${p.seasons} seasons.`);
    },
    character(p) {
      const own = new Set((p.characters || []).map(canonicalName));
      if (own.size < 1) return null;
      // Distractors must come from a different universe AND never share a franchise with this title, so they cannot be real (if unlisted) cast members.
      const safe = new Set();
      pool.forEach((q) => {
        if (q.universe === p.universe || (q.franchises || []).some((f) => (p.franchises || []).includes(f))) return;
        (q.characters || []).forEach((c) => safe.add(canonicalName(c)));
      });
      const tainted = new Set();
      pool.forEach((q) => { if (q.universe === p.universe || (q.franchises || []).some((f) => (p.franchises || []).includes(f))) (q.characters || []).forEach((c) => tainted.add(canonicalName(c))); });
      const wrongPool = [...safe].filter((c) => !own.has(c) && !tainted.has(c));
      if (wrongPool.length < 3) return null;
      const correct = pick([...own]);
      return mk("character", p, `Which of these characters appears in “${p.title}”?`, correct, shuffle(wrongPool).slice(0, 3), `${correct} is listed in the cast of “${p.title}”.`);
    },
    describe(p) {
      const desc = p.shortDescription;
      if (!desc || desc.length < 30) return null;
      const tokens = String(p.title).toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4);
      if (tokens.some((t) => desc.toLowerCase().includes(t))) return null;
      const wrong = shuffle(pool.filter((q) => q.id !== p.id && q.type === p.type)).slice(0, 3).map((q) => q.title);
      return mk("describe", p, `Which project matches this description? “${desc}”`, p.title, wrong, `That description belongs to “${p.title}”.`);
    },
    first(p) {
      const others = pool.filter((q) => q.id !== p.id && q.releaseDate && Math.abs(new Date(q.releaseDate) - new Date(p.releaseDate)) > 120 * DAY);
      if (!others.length) return null;
      const q = pick(others);
      const [a, b] = [p, q].sort((x, y) => String(x.releaseDate).localeCompare(String(y.releaseDate)));
      return mk("first", p, `Which came first: “${p.title}” or “${q.title}”?`, a.title, [b.title], `“${a.title}” (${a.releaseDate}) came before “${b.title}” (${b.releaseDate}).`, 2);
    },
    runtime(p) {
      if (p.type !== "movie" || !p.runtimeMinutes) return null;
      const others = pool.filter((q) => q.id !== p.id && q.type === "movie" && q.runtimeMinutes && Math.abs(q.runtimeMinutes - p.runtimeMinutes) >= 15);
      if (!others.length) return null;
      const q = pick(others);
      const [longer, shorter] = p.runtimeMinutes > q.runtimeMinutes ? [p, q] : [q, p];
      return mk("runtime", p, `Which film has the longer runtime: “${p.title}” or “${q.title}”?`, longer.title, [shorter.title], `“${longer.title}” runs ${longer.runtimeMinutes} min; “${shorter.title}” runs ${shorter.runtimeMinutes} min.`, 2);
    },
  };
  const kinds = shuffle(Object.keys(makers));
  const out = [];
  let guard = 0;
  while (out.length < count && guard++ < 400) {
    const kind = kinds[out.length % kinds.length] || pick(kinds);
    const p = fresh(pool);
    if (!p) break;
    let q = null;
    try { q = makers[kind](p); } catch (e) { q = null; }
    if (q && q.options && q.options.length >= 2 && q.correct) { used.add(p.id); out.push(q); }
  }
  return out;
}

/* ---------- Marvel Identity ---------- */
export const ARCHETYPES = [
  { id: "canon", icon: "🛡️", name: "Canon Keeper", tagline: "You follow the main line of the shared universe.", score: (m) => m.coreShare, need: 0.7 },
  { id: "wanderer", icon: "🌌", name: "Multiverse Wanderer", tagline: "You go where the story branches.", score: (m) => (m.universesTouched >= 3 ? 1 - m.coreShare : 0), need: 0.4 },
  { id: "web", icon: "🕸️", name: "Spider-Man Devotee", tagline: "Spider-Man keeps pulling you back, in every universe.", score: (m) => m.spiderShare, need: 0.25 },
  { id: "mutant", icon: "🧬", name: "Mutant Historian", tagline: "You know the X-Men saga across its many eras.", score: (m) => m.mutantShare, need: 0.25 },
  { id: "screen", icon: "📺", name: "Small-Screen Strategist", tagline: "Series are where you live.", score: (m) => m.seriesShare, need: 0.45 },
  { id: "marathon", icon: "🔥", name: "Marathon Runner", tagline: "You watch in bursts and streaks.", score: (m) => Math.max(m.bestDay / 3, m.streak / 5), need: 1 },
  { id: "complete", icon: "🏆", name: "Completionist", tagline: "If it is on the list, you finish it.", score: (m) => m.completion, need: 0.8 },
];

export function buildIdentity(userData, visible, trophies) {
  const done = visible.filter((p) => isDone(p, userData));
  const n = done.length;
  if (n < 3) return { ready: false, needed: 3 - n, completed: n };
  const share = (fn) => done.filter(fn).length / n;
  const has = (p, ids) => (p.franchises || []).some((f) => ids.includes(f));
  const universesTouched = new Set(done.map((p) => p.universe)).size;
  const stats = trophies?.stats || {};
  const m = {
    coreShare: share((p) => p.universe === "mcu-earth-616"),
    spiderShare: share((p) => has(p, ["spider-man"])),
    mutantShare: share((p) => has(p, ["x-men", "wolverine", "deadpool"])),
    seriesShare: share((p) => isSeries(p)),
    universesTouched,
    completion: visible.length ? done.length / visible.length : 0,
    bestDay: stats.bestDay || 0,
    streak: stats.streak || 0,
  };
  const scored = ARCHETYPES.map((a, i) => ({ a, i, fit: Math.min(1, a.score(m) / a.need) }));
  const top = scored.slice().sort((x, y) => y.fit - x.fit || x.i - y.i)[0];
  const archetype = top.fit >= 1 ? top.a : null;

  const countBy = (fn) => { const c = new Map(); done.forEach((p) => fn(p).forEach((k) => c.set(k, (c.get(k) || 0) + 1))); return [...c.entries()].sort((a, b) => b[1] - a[1]); };
  const [topFranchise] = countBy((p) => (p.franchises || []).filter((f) => f !== "avengers"));
  const [topCharacter] = countBy((p) => [...new Set((p.characters || []).map(canonicalName))]);
  const ratings = done.map((p) => Number(getProjectState(p, userData).rating)).filter((r) => r > 0);
  const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null;

  const signals = [];
  if (topFranchise) signals.push({ label: "Signature franchise", value: franchiseName(topFranchise[0]), detail: topFranchise[1] + " completed" });
  if (topCharacter && topCharacter[1] >= 2) signals.push({ label: "Most-seen character", value: topCharacter[0], detail: "in " + topCharacter[1] + " of your completions" });
  signals.push({ label: "Home turf", value: m.coreShare >= 0.5 ? "Core MCU" : "Beyond the MCU", detail: Math.round(m.coreShare * 100) + "% of completions are Earth-616" });
  if (avg !== null && ratings.length >= 5) signals.push({ label: "Rating style", value: avg >= 8 ? "Generous" : avg >= 6 ? "Balanced" : "Tough critic", detail: avg.toFixed(1) + " average over " + ratings.length + " ratings" });
  if (m.bestDay >= 2 || m.streak >= 2) signals.push({ label: "Watching rhythm", value: m.bestDay >= 3 ? "Binge sessions" : "Steady pace", detail: "best day " + m.bestDay + " · longest streak " + m.streak + " days" });

  return { ready: true, completed: n, archetype, fallback: { icon: "✨", name: "Balanced Viewer", tagline: "No single lane defines you yet. Your taste is wide open." }, matches: scored.map((s) => ({ ...s.a, fit: Math.round(s.fit * 100) })), signals, metrics: m };
}
