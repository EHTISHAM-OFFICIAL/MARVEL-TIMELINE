import { PROJECTS } from "../data/projects.js";
import {
  statusOf,
  passesMode,
  isSeries,
  episodeProgress,
  expandProjectsBySeasons,
  displayReleaseOrder,
  getProjectState,
} from "./helpers.js";

// ---------------------------------------------------------------------------------------------
// Trophy engine. One pure function turns the user's data into the full trophy list, so the Trophy
// Room (Progress page) and the unlock toasts (any page) always agree.
// ---------------------------------------------------------------------------------------------

export const TIERS = {
  bronze: { id: "bronze", label: "Bronze", points: 10 },
  silver: { id: "silver", label: "Silver", points: 25 },
  gold: { id: "gold", label: "Gold", points: 50 },
  platinum: { id: "platinum", label: "Platinum", points: 100 },
  legendary: { id: "legendary", label: "Legendary", points: 250 },
};

export const CATEGORIES = [
  { id: "milestones", label: "Milestones", icon: "🎬" },
  { id: "binge", label: "Binge & Episodes", icon: "📺" },
  { id: "collector", label: "Collector & Critic", icon: "💎" },
  { id: "sagas", label: "Sagas & Phases", icon: "🪐" },
  { id: "franchises", label: "Franchises", icon: "⚔️" },
  { id: "universes", label: "Universes", icon: "🌌" },
  { id: "habits", label: "Habits & Streaks", icon: "🔥" },
  { id: "style", label: "Style & Setup", icon: "🎨" },
  { id: "secret", label: "Secrets", icon: "🕵️" },
];

export const RANKS = [
  { id: "civilian", name: "Civilian", icon: "🧍", points: 0 },
  { id: "recruit", name: "Recruit", icon: "🪖", points: 60 },
  { id: "rookie", name: "Rookie Hero", icon: "🦸", points: 200 },
  { id: "agent", name: "Agent of S.H.I.E.L.D.", icon: "🕶️", points: 450 },
  { id: "avenger", name: "Avenger", icon: "🛡️", points: 800 },
  { id: "guardian", name: "Cosmic Guardian", icon: "🌠", points: 1300 },
  { id: "sorcerer", name: "Sorcerer Supreme", icon: "🔮", points: 2000 },
  { id: "sovereign", name: "Multiverse Sovereign", icon: "👑", points: 2900 },
];

const tierBySize = (n) => (n <= 2 ? "bronze" : n <= 4 ? "silver" : n <= 10 ? "gold" : n <= 25 ? "platinum" : "legendary");

const FRANCHISE_TROPHIES = {
  avengers: { icon: "🌍", name: "Earth’s Mightiest", detail: "Complete every visible Avengers-tagged title. The whole roster, the whole saga." },
  "iron-man": { icon: "🦾", name: "I Am Iron Man", detail: "Complete every visible Iron Man title. Genius, billionaire, finished the franchise." },
  "captain-america": { icon: "⭐", name: "Super-Soldier Serum", detail: "Complete every visible Captain America title. Stand up, soldier." },
  thor: { icon: "🔨", name: "Worthy", detail: "Complete every visible Thor title. Mjölnir recognises your dedication." },
  guardians: { icon: "🦝", name: "Guardians of the Backlog", detail: "Complete every visible Guardians of the Galaxy title. Dance-off optional." },
  "spider-man": { icon: "🕷️", name: "Spider-Man Complete", detail: "Complete every visible project tagged with the Spider-Man franchise." },
  "x-men": { icon: "⚡", name: "X-Men Complete", detail: "Complete every visible project tagged with the X-Men franchise." },
  deadpool: { icon: "💥", name: "Maximum Effort", detail: "Complete every visible Deadpool title. Fourth wall: also completed." },
  wolverine: { icon: "🐺", name: "Snikt!", detail: "Complete every visible Wolverine title. Claws out, backlog down." },
  "fantastic-four": { icon: "🔥", name: "Flame On", detail: "Complete every visible Fantastic Four title. Marvel’s first family, fully watched." },
  "black-panther": { icon: "🐾", name: "Wakanda Forever", detail: "Complete every visible Black Panther title." },
  "doctor-strange": { icon: "🔮", name: "Sorcerer in Training", detail: "Complete every visible Doctor Strange title. The mystic arts approve." },
  "ant-man": { icon: "🐜", name: "Size Matters", detail: "Complete every visible Ant-Man title. Small hero, big achievement." },
  "captain-marvel": { icon: "🌟", name: "Higher, Further, Faster", detail: "Complete every visible Captain Marvel title." },
  hulk: { icon: "💚", name: "Hulk Smash Backlog", detail: "Complete every visible Hulk title. Do not make him wait." },
  loki: { icon: "🐍", name: "Glorious Purpose", detail: "Complete every visible Loki title. All of time, all of it watched." },
};

const UNIVERSE_TROPHIES = {
  "mcu-earth-616": { icon: "⏳", name: "Sacred Timeline", detail: "Complete everything visible in the main MCU continuity (Earth-616). No branches pruned." },
  "mcu-multiverse": { icon: "🌀", name: "Variant Hunter", detail: "Complete everything visible in the MCU Multiverse. Every variant accounted for." },
  "raimi-spider-man": { icon: "🕸️", name: "Webbed Nostalgia", detail: "Complete everything visible in the Raimi Spider-Man universe." },
  "amazing-spider-man": { icon: "🧪", name: "Amazing Friend", detail: "Complete everything visible in the Amazing Spider-Man universe." },
  "sony-spider-man-universe": { icon: "🖤", name: "Symbiote Society", detail: "Complete everything visible in Sony’s Spider-Man Universe." },
  "fox-x-men": { icon: "🧬", name: "Mutant & Proud", detail: "Complete everything visible in the Fox X-Men universe." },
  "wolverine-deadpool": { icon: "🤝", name: "Odd Couple", detail: "Complete everything visible in the Wolverine & Deadpool universe." },
  "fantastic-four-legacy": { icon: "👨‍👩‍👧‍👦", name: "First Family", detail: "Complete everything visible in the Legacy Fantastic Four universe." },
  "marvel-television": { icon: "📡", name: "Small Screen, Big Heroes", detail: "Complete everything visible in Marvel Television." },
  "marvel-animation": { icon: "🎨", name: "Cartoon Canon", detail: "Complete everything visible in Marvel Animation." },
};

const PHASE_NAMES = { 1: "Phase One", 2: "Phase Two", 3: "Phase Three", 4: "Phase Four", 5: "Phase Five", 6: "Phase Six" };
const PHASE_ICONS = { 1: "1️⃣", 2: "2️⃣", 3: "3️⃣", 4: "4️⃣", 5: "5️⃣", 6: "6️⃣" };

// -- date helpers (watch dates are stored as YYYY-MM-DD strings) --------------------------------
const dayNumber = (iso) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  const back = new Date(t); // reject impossible dates such as 2025-02-30, which Date.UTC would silently roll over
  if (Number.isNaN(t) || back.getUTCFullYear() !== +m[1] || back.getUTCMonth() !== +m[2] - 1 || back.getUTCDate() !== +m[3]) return null;
  return Math.round(t / 86400000);
};
const longestStreak = (days) => {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  let best = 0, run = 0, prev = null;
  sorted.forEach((d) => { run = prev !== null && d === prev + 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
  return best;
};
// 1970-01-01 was a Thursday; (day + 4) % 7 → 0 = Sunday … 6 = Saturday
const weekday = (day) => (day + 4) % 7;

export function visibleProjects(userData) {
  const prefs = userData.preferences || {};
  return expandProjectsBySeasons(PROJECTS)
    .filter((p) => passesMode(p, prefs.explorationMode) && !(prefs.hiddenUniverses || []).includes(p.universe))
    .sort((a, b) => displayReleaseOrder(a) - displayReleaseOrder(b));
}

export function rankFor(points) {
  let idx = 0;
  RANKS.forEach((r, i) => { if (points >= r.points) idx = i; });
  const rank = RANKS[idx], next = RANKS[idx + 1] || null;
  const span = next ? next.points - rank.points : 1;
  return { rank, next, percent: next ? Math.min(100, Math.round(((points - rank.points) / span) * 100)) : 100, toNext: next ? next.points - points : 0 };
}

/**
 * @param userData  the user's stored data
 * @param opts.isLightTheme  (themeId) => boolean, so custom admin themes can count for "Daywalker"
 */
export function computeAchievements(userData, opts = {}) {
  const prefs = userData.preferences || {};
  const order = visibleProjects(userData);
  const state = (p) => getProjectState(p, userData);
  const status = (p) => statusOf(p.id, userData);

  const completed = order.filter((p) => status(p) === "completed");
  const series = order.filter((p) => isSeries(p));
  const totalCompleted = completed.length;
  const percent = order.length ? Math.round((totalCompleted / order.length) * 100) : 0;
  const epWatched = series.reduce((a, p) => a + episodeProgress(p, userData).watched, 0);
  const fullySeries = series.filter((p) => { const e = episodeProgress(p, userData); return e.total > 0 && e.watched === e.total; }).length;
  const halfway = series.some((p) => { const e = episodeProgress(p, userData); return e.total > 0 && e.watched / e.total >= 0.5; });

  const states = order.map(state);
  const favorites = states.filter((s) => s.favorite).length;
  const ratings = states.map((s) => Number(s.rating) || 0).filter((r) => r > 0);
  const notes = states.filter((s) => String(s.notes || "").trim()).length;
  const tens = ratings.filter((r) => r === 10).length;
  const hasLow = ratings.some((r) => r <= 4), hasMid = ratings.some((r) => r >= 5 && r <= 7), hasHigh = ratings.some((r) => r >= 8);
  const loveAtFirstBinge = states.some((s) => s.favorite && Number(s.rating) >= 9);
  const anySkipped = order.some((p) => status(p) === "skipped");
  const anyRewatch = order.some((p) => status(p) === "rewatching");

  // dated completions
  const dated = completed.map((p) => state(p).watchedDate).filter((d) => dayNumber(d) !== null);
  const perDay = {};
  dated.forEach((d) => { perDay[d] = (perDay[d] || 0) + 1; });
  const bestDay = Math.max(0, ...Object.values(perDay));
  const days = dated.map(dayNumber);
  const streak = longestStreak(days);
  const daySet = new Set(days);
  const weekendWarrior = [...daySet].some((d) => weekday(d) === 6 && daySet.has(d + 1));
  const seasonOf = (iso) => { const m = +iso.slice(5, 7); return m === 12 || m <= 2 ? 0 : m <= 5 ? 1 : m <= 8 ? 2 : 3; };
  const seasonsCovered = new Set(dated.map(seasonOf)).size;
  const hasDate = (mmdd) => dated.some((d) => d.slice(5) === mmdd);

  const byPhase = {};
  order.forEach((p) => {
    if (!p.phase) return;
    const b = (byPhase[p.phase] = byPhase[p.phase] || { total: 0, done: 0 });
    b.total++;
    if (status(p) === "completed") b.done++;
  });
  const completedUniverses = new Set(completed.map((p) => p.universe)).size;
  const multiverseTracked = completed.filter((p) => p.connectionLevel === "multiverse-relevant" || p.universe === "mcu-multiverse").length;

  const list = [];
  const add = (t) => list.push({ available: true, secret: false, ...t });
  // "reach N" trophies
  const count = (id, cat, tier, icon, name, detail, value, target, extra = {}) =>
    add({ id, cat, tier, icon, name, detail, current: Math.min(value, target), target, unlocked: value >= target, progress: Math.min(value, target) + " / " + target, ...extra });
  // yes/no trophies
  const flag = (id, cat, tier, icon, name, detail, done, extra = {}) =>
    add({ id, cat, tier, icon, name, detail, current: done ? 1 : 0, target: 1, unlocked: Boolean(done), progress: done ? "Done" : "Not yet", ...extra });
  // "finish every one of these" trophies (a franchise, a universe)
  const finishAll = (id, cat, tier, icon, name, detail, items, extra = {}) => {
    const done = items.filter((p) => status(p) === "completed").length;
    add({ id, cat, tier, icon, name, detail, current: done, target: items.length, unlocked: items.length > 0 && done === items.length,
      progress: items.length ? done + " / " + items.length : "Not in this mode", available: items.length > 0, ...extra });
  };
  const withIds = (id, cat, tier, icon, name, detail, ids) => {
    const items = ids.map((x) => order.find((p) => p.id === x)).filter(Boolean);
    const done = items.filter((p) => status(p) === "completed").length;
    add({ id, cat, tier, icon, name, detail, current: done, target: ids.length, unlocked: items.length === ids.length && done === ids.length,
      progress: items.length === ids.length ? done + " / " + ids.length : "Not in this mode", available: items.length === ids.length });
  };

  // ---- Milestones -------------------------------------------------------------------------
  const M = "milestones";
  count("first-step", M, "bronze", "🎬", "First Scene", "Complete your first movie or series / TV show. Every Marvel archive starts somewhere.", totalCompleted, 1);
  count("origin-story", M, "bronze", "🛡️", "Origin Story", "Complete 3 movies or series / TV shows and establish the beginning of your personal Marvel journey.", totalCompleted, 3);
  count("five", M, "bronze", "🥉", "Getting Started", "Complete 5 movies or series / TV shows. You are officially building a Marvel archive.", totalCompleted, 5);
  count("ten", M, "silver", "⭐", "Ten Down", "Complete 10 movies or series / TV shows and reach your first double-digit milestone.", totalCompleted, 10);
  count("fifteen", M, "silver", "🦸", "Rising Hero", "Complete 15 titles. You’re no longer a bystander. People are starting to notice.", totalCompleted, 15);
  count("twenty-five", M, "silver", "🏅", "Quarter Century", "Complete 25 movies or series / TV shows. A quarter of the way to the 100-title milestone.", totalCompleted, 25);
  count("thirty-five", M, "silver", "🥊", "Hero for Hire", "Complete 35 titles. At this point you could do this professionally.", totalCompleted, 35);
  count("fifty", M, "gold", "🏆", "Half-Century", "Complete 50 movies or series / TV shows. A major archive milestone.", totalCompleted, 50);
  count("seventy-five", M, "gold", "🧙", "Master of the Archive", "Complete 75 titles. Scholars will cite your watchlist.", totalCompleted, 75);
  count("hundred", M, "platinum", "👑", "Century Club", "Complete 100 movies or series / TV shows and reach the tracker's 100-title milestone.", totalCompleted, 100);
  add({ id: "perfectly-balanced", cat: M, tier: "gold", icon: "⚖️", name: "Perfectly Balanced", detail: "Reach 50% overall completion in your current exploration mode. As all things should be.", current: Math.min(percent, 50), target: 50, unlocked: percent >= 50 && order.length > 0, progress: Math.min(percent, 50) + "% / 50%" });
  add({ id: "three-quarters", cat: M, tier: "gold", icon: "🚀", name: "Archive Vanguard", detail: "Reach 75% overall completion in your current exploration mode.", current: Math.min(percent, 75), target: 75, unlocked: percent >= 75 && order.length > 0, progress: Math.min(percent, 75) + "% / 75%" });
  add({ id: "almost-omnipotent", cat: M, tier: "platinum", icon: "🌠", name: "Almost Omnipotent", detail: "Reach 90% overall completion. The last stretch is the hardest, and you’re in it.", current: Math.min(percent, 90), target: 90, unlocked: percent >= 90 && order.length > 0, progress: Math.min(percent, 90) + "% / 90%" });
  add({ id: "one-above-all", cat: M, tier: "legendary", icon: "✨", name: "The One Above All", detail: "Complete 100% of everything in your current exploration mode. Nothing left to watch. Truly cosmic.", current: percent, target: 100, unlocked: percent >= 100 && order.length > 0, progress: percent + "% / 100%" });

  // ---- Binge & Episodes -------------------------------------------------------------------
  const B = "binge";
  count("pilot-light", B, "bronze", "🕯️", "Pilot Light", "Watch 10 tracked episodes. The pilot episode of your TV journey.", epWatched, 10);
  count("episode-25", B, "bronze", "📺", "Binge Begins", "Watch 25 tracked episodes across your series.", epWatched, 25);
  count("episode-50", B, "silver", "⚡", "Binge Watcher", "Watch 50 tracked episodes.", epWatched, 50);
  count("episode-100", B, "gold", "🔥", "Episode Hunter", "Watch 100 tracked episodes. TV is now a serious part of your archive.", epWatched, 100);
  count("episode-250", B, "platinum", "🌟", "Episode Legend", "Watch 250 tracked episodes across the Marvel television archive.", epWatched, 250);
  flag("mid-season", B, "bronze", "🛋️", "Mid-Season Break", "Get at least halfway through any season. The mid-season finale cliffhanger awaits.", halfway);
  count("roll-credits", B, "bronze", "🍿", "Roll Credits", "Fully track your first series by marking every episode watched.", fullySeries, 1);
  count("series-master", B, "silver", "📚", "Season Finale", "Fully track 5 series by marking every episode watched.", fullySeries, 5);
  count("series-archivist", B, "gold", "🗂️", "Series Archivist", "Fully track 10 complete series, episode by episode.", fullySeries, 10);

  // ---- Collector & Critic -----------------------------------------------------------------
  const C = "collector";
  count("fan-favorite", C, "bronze", "❤️", "Fan Favorite", "Mark your first favorite. Every hero has a soft spot.", favorites, 1);
  count("favorite-five", C, "silver", "💎", "Collector", "Save 5 projects as favorites. Your personal shortlist is taking shape.", favorites, 5);
  count("favorite-ten", C, "silver", "🗃️", "Curator", "Save 10 projects as favorites and build a larger personal collection.", favorites, 10);
  count("favorite-twenty-five", C, "gold", "🏛️", "Museum Wing", "Save 25 favorites. They’re naming a wing after you.", favorites, 25);
  count("first-review", C, "bronze", "✍️", "First Review", "Rate your first title from its detail page.", ratings.length, 1);
  count("rated-ten", C, "silver", "📝", "Critic", "Rate 10 projects from their detail pages.", ratings.length, 10);
  count("rated-twenty-five", C, "gold", "🎞️", "Director's Cut", "Rate 25 projects and leave your own record of the archive.", ratings.length, 25);
  count("rated-fifty", C, "platinum", "🎙️", "Talk of the Town", "Rate 50 titles. You should honestly start a podcast.", ratings.length, 50);
  count("perfect-ten", C, "silver", "💯", "Perfect Ten", "Give any title a perfect 10/10.", tens, 1);
  count("super-fan", C, "gold", "🤩", "Super Fan", "Give five different titles a perfect 10/10. You really do love this stuff.", tens, 5);
  flag("tough-crowd", C, "silver", "😤", "Tough Crowd", "Give a title 4/10 or lower. Honesty is a superpower.", hasLow);
  flag("balanced-critic", C, "gold", "🧐", "Balanced Critic", "Rate at least one title low (1–4), one middling (5–7) and one high (8–10). Fair and balanced.", hasLow && hasMid && hasHigh,
    { current: [hasLow, hasMid, hasHigh].filter(Boolean).length, target: 3, progress: [hasLow, hasMid, hasHigh].filter(Boolean).length + " / 3" });
  count("note-to-self", C, "bronze", "🗒️", "Note to Self", "Write your first note on a title.", notes, 1);
  count("field-notes", C, "silver", "📓", "Field Notes", "Write notes on 5 titles.", notes, 5);
  count("writers-room", C, "gold", "🖋️", "Writers’ Room", "Write notes on 15 titles. Your commentary could be its own series.", notes, 15);

  // ---- Sagas & Phases ---------------------------------------------------------------------
  const S = "sagas";
  [1, 2, 3, 4, 5, 6].forEach((n) => {
    const b = byPhase[n];
    add({ id: "phase-" + n, cat: S, tier: n <= 2 ? "silver" : "gold", icon: PHASE_ICONS[n], name: PHASE_NAMES[n],
      detail: "Complete every currently visible project assigned to MCU Phase " + n + ".", current: b ? b.done : 0, target: b ? b.total : 0,
      unlocked: Boolean(b && b.done === b.total), progress: b ? b.done + " / " + b.total : "Not in this mode", available: Boolean(b) });
  });
  const sagaTrophy = (id, icon, name, detail, phases) => {
    const have = phases.filter((n) => byPhase[n]);
    const done = have.reduce((a, n) => a + byPhase[n].done, 0), total = have.reduce((a, n) => a + byPhase[n].total, 0);
    add({ id, cat: S, tier: "platinum", icon, name, detail, current: done, target: total, unlocked: have.length > 0 && done === total,
      progress: total ? done + " / " + total : "Not in this mode", available: have.length > 0 });
  };
  sagaTrophy("infinity-saga", "💠", "Infinity Saga Survivor", "Complete every visible title from Phases 1–3. You made it through the entire Infinity Saga.", [1, 2, 3]);
  sagaTrophy("multiverse-saga", "🌀", "Multiverse Saga Survivor", "Complete every visible title from Phases 4–6. Variants, branches and all.", [4, 5, 6]);
  withIds("avengers-assemble", S, "gold", "💥", "Avengers… Assemble!", "Complete all four Avengers team-up films.", ["avengers-2012", "avengers-age-ultron-2015", "avengers-infinity-war-2018", "avengers-endgame-2019"]);
  withIds("snap-survivor", S, "silver", "🧤", "Snap Survivor", "Complete both Infinity War and Endgame. You were there for the whole thing.", ["avengers-infinity-war-2018", "avengers-endgame-2019"]);
  withIds("where-it-began", S, "bronze", "🌱", "Where It All Began", "Complete both 2008 films: Iron Man and The Incredible Hulk. Day one of the MCU.", ["iron-man-2008", "incredible-hulk-2008"]);

  // ---- Franchises -------------------------------------------------------------------------
  Object.entries(FRANCHISE_TROPHIES).forEach(([fid, t]) => {
    const items = order.filter((p) => (p.franchises || []).includes(fid));
    finishAll(fid === "spider-man" || fid === "x-men" ? fid : "franchise-" + fid, "franchises", tierBySize(items.length), t.icon, t.name, t.detail, items);
  });

  // ---- Universes --------------------------------------------------------------------------
  count("universe-hopper", "universes", "silver", "🚪", "Universe Hopper", "Complete at least one title in 3 different universes.", completedUniverses, 3);
  count("multiverse-tourist", "universes", "gold", "🧳", "Multiverse Tourist", "Complete at least one title in 5 different universes. Pack light.", completedUniverses, 5);
  count("cross-dimensional", "universes", "platinum", "🛸", "Cross-Dimensional Traveler", "Complete at least one title in 8 different universes. Your passport has no empty pages.", completedUniverses, 8);
  count("multiverse-five", "universes", "silver", "🌌", "Multiverse Explorer", "Complete 5 movies or series / TV shows marked as multiverse-relevant or part of the MCU multiverse continuity.", multiverseTracked, 5);
  Object.entries(UNIVERSE_TROPHIES).forEach(([uid, t]) => {
    const items = order.filter((p) => p.universe === uid);
    finishAll("universe-" + uid, "universes", tierBySize(items.length), t.icon, t.name, t.detail, items);
  });

  // ---- Habits & Streaks (use the “watched on” date on each title) -------------------------
  const H = "habits";
  const dateNote = " Set the “watched on” date on a title to track this.";
  count("date-keeper", H, "bronze", "📅", "Date Keeper", "Record a watch date on 5 completed titles." + dateNote, dated.length, 5);
  count("chronicler", H, "silver", "📜", "The Chronicler", "Record a watch date on 25 completed titles. A true historian.", dated.length, 25);
  count("double-feature", H, "bronze", "🎟️", "Double Feature", "Complete 2 titles on the same day." + dateNote, bestDay, 2);
  count("triple-threat", H, "silver", "🎯", "Triple Threat", "Complete 3 titles on the same day.", bestDay, 3);
  count("infinity-stones", H, "gold", "🟣", "Infinity Stones", "Complete 6 titles on the same day. One for each stone. Snacks recommended.", bestDay, 6);
  count("hat-trick", H, "bronze", "🎩", "Hat Trick", "Watch something 3 days in a row." + dateNote, streak, 3);
  count("week-of-heroes", H, "silver", "🗓️", "Week of Heroes", "Keep a 7-day watching streak.", streak, 7);
  count("fortnight-of-fury", H, "gold", "🌪️", "Fortnight of Fury", "Keep a 14-day watching streak.", streak, 14);
  count("month-of-marvels", H, "platinum", "🌙", "Month of Marvels", "Keep a 30-day watching streak. Do you even sleep?", streak, 30);
  flag("weekend-warrior", H, "bronze", "⚔️", "Weekend Warrior", "Complete something on a Saturday and the Sunday right after it.", weekendWarrior);
  count("four-seasons", H, "silver", "🍂", "Four Seasons", "Complete titles in winter, spring, summer and autumn. Marvel is a year-round hobby.", seasonsCovered, 4);

  // ---- Style & Setup ----------------------------------------------------------------------
  const Y = "style";
  const isLight = opts.isLightTheme || (() => false);
  flag("fashion-forward", Y, "bronze", "🎨", "Fashion Forward", "Pick a different visual theme in Settings.", Boolean(prefs.theme) && prefs.theme !== "midnight");
  flag("daywalker", Y, "bronze", "☀️", "Daywalker", "Switch to a light theme. Don’t worry, the vampires won’t mind.", Boolean(prefs.theme) && isLight(prefs.theme));
  flag("curated-experience", Y, "bronze", "🎛️", "Curated Experience", "Hide at least one universe in Settings. Your archive, your rules.", (prefs.hiddenUniverses || []).length > 0);
  flag("off-the-beaten-path", Y, "bronze", "🧭", "Off the Beaten Path", "Switch to a different exploration mode than Simple MCU.", Boolean(prefs.explorationMode) && prefs.explorationMode !== "simple-mcu");
  flag("living-dangerously", Y, "bronze", "😎", "Living Dangerously", "Turn on “show all spoilers automatically”. Brave, or reckless? Yes.", Boolean(prefs.showAllSpoilers));

  // ---- Secrets ----------------------------------------------------------------------------
  const X = "secret";
  const secret = (id, tier, icon, name, detail, hint, done) => flag(id, X, tier, icon, name, detail, done, { secret: true, hint });
  secret("new-year", "silver", "🎆", "New Year, New Marvel", "Finish a title on January 1st. Resolution: more heroes.", "Some people start the year with a resolution. Others start it with a hero.", hasDate("01-01"));
  secret("spooky-season", "silver", "🎃", "Spooky Season", "Finish a title on October 31st. Costumes optional.", "One night a year, everyone puts on a costume.", hasDate("10-31"));
  secret("skip-intro", "bronze", "⏭️", "Skip Intro", "Mark a title as skipped. Some stories just aren’t for everyone.", "Not every story needs to be watched.", anySkipped);
  secret("again-again", "bronze", "🔁", "Again, Again!", "Start a rewatch. Once is never enough.", "Once is never enough.", anyRewatch);
  secret("love-first-binge", "silver", "💘", "Love at First Binge", "Favorite a title and rate it 9 or higher.", "Some titles just hit different.", loveAtFirstBinge);

  // ---- totals ----------------------------------------------------------------------------
  list.forEach((a) => { a.points = TIERS[a.tier].points; a.percent = a.target ? Math.min(100, Math.round((a.current / a.target) * 100)) : 0; });
  const usable = list.filter((a) => a.available);
  const points = usable.filter((a) => a.unlocked).reduce((s, a) => s + a.points, 0);
  const maxPoints = usable.reduce((s, a) => s + a.points, 0);
  const tierCounts = {};
  Object.keys(TIERS).forEach((t) => { tierCounts[t] = usable.filter((a) => a.tier === t && a.unlocked).length; });
  return {
    list,
    unlockedCount: usable.filter((a) => a.unlocked).length,
    availableCount: usable.length,
    points,
    maxPoints,
    tierCounts,
    ...rankFor(points),
    stats: { totalCompleted, percent, epWatched, streak, bestDay, favorites, rated: ratings.length, notes },
  };
}
