// Catch-up Roadmap data layer. Pure functions over the catalog and the user's existing tracking data.
// It never writes anything and adds no new data: every step is justified by a field already in data/projects.js.
//
// How "what do I need first?" is answered (only these three signals are used, nothing is invented):
//   1. Declared lead-ins  - the catalog's own `previous` links, followed transitively (same links the Connection Map draws).
//   2. Story threads      - earlier core-MCU titles that share at least one character with the goal.
//   3. Core run-up        - (Full run-up only) every earlier core-MCU title, using the catalog's own `connectionLevel`.
// Everything else that merely overlaps is offered separately as "optional extras" and never counted as required.
import { PROJECTS } from "../data/projects.js";
import { expandProjectsBySeasons, displayReleaseOrder, statusOf, isSeries, episodeProgress } from "./helpers.js";
import { canonicalName, SAGA_DEFS } from "./hq.js";

const ALL = expandProjectsBySeasons(PROJECTS);
const BY_ID = new Map(ALL.map((p) => [p.id, p]));
const BY_BASE = new Map();
ALL.forEach((p) => { const b = p.baseProjectId || p.id; if (!BY_BASE.has(b)) BY_BASE.set(b, []); BY_BASE.get(b).push(p); });

const MCU_FAMILY = ["mcu-earth-616", "mcu-multiverse"];
const CORE = ALL.filter((p) => p.connectionLevel === "core-mcu");
const rel = displayReleaseOrder;
const story = (p) => p.chronologicalOrderIndex ?? 99999;
const charsOf = (p) => new Set((p.characters || []).map(canonicalName));

// Characters who appear in a large share of core titles (e.g. Nick Fury) say little about a specific link, so they are
// not used on their own to pull a title in.
const COMMON = (() => {
  const freq = new Map();
  CORE.forEach((p) => charsOf(p).forEach((c) => freq.set(c, (freq.get(c) || 0) + 1)));
  return new Set([...freq].filter(([, n]) => n > CORE.length * 0.3).map(([c]) => c));
})();

const resolve = (id) => (BY_ID.has(id) ? [BY_ID.get(id)] : BY_BASE.get(id) || []);
const sharedNames = (a, b) => { const bs = charsOf(b); return [...charsOf(a)].filter((c) => bs.has(c)); };
const specific = (names) => names.filter((c) => !COMMON.has(c));

/** All catalog titles that can be picked as a goal, newest first. */
export const goalCatalog = () => ALL.slice().sort((a, b) => rel(b) - rel(a));

/** Sagas usable as goals, over the whole catalog (independent of exploration mode). */
export const sagaGoals = () => SAGA_DEFS.map((def) => ({ def, items: ALL.filter(def.match).sort((a, b) => rel(a) - rel(b)) })).filter((s) => s.items.length);

/** Titles that must come first for one goal title, with the reason each one is included. */
export function prerequisitesFor(goal, depth = "quick") {
  const out = new Map();
  const queue = [];
  const add = (project, reason) => {
    if (!project || project.id === goal.id) return;
    let e = out.get(project.id);
    if (!e) { e = { project, reasons: [] }; out.set(project.id, e); queue.push(project); }
    if (!e.reasons.some((r) => r.kind === reason.kind)) e.reasons.push(reason);
  };
  const walk = (p) => (p.previous || []).forEach((id) => resolve(id).forEach((prev) => add(prev, { kind: "declared", via: p.title })));

  walk(goal);
  const goalOrder = rel(goal);
  const before = (p) => rel(p) < goalOrder;
  if (MCU_FAMILY.includes(goal.universe)) {
    CORE.filter(before).forEach((p) => {
      const shared = specific(sharedNames(p, goal));
      if (shared.length) add(p, { kind: "thread", names: shared });
      else if (depth === "full") add(p, { kind: "core" });
    });
  } else if (depth === "full") {
    ALL.filter((p) => p.universe === goal.universe && before(p)).forEach((p) => add(p, { kind: "universe" }));
  }
  while (queue.length) walk(queue.shift()); // lead-ins of anything already included are included too
  return out;
}

const extrasFor = (goal, taken) => {
  const goalOrder = rel(goal);
  return ALL.filter((p) => rel(p) < goalOrder && !taken.has(p.id) && p.id !== goal.id)
    .map((p) => ({ project: p, names: specific(sharedNames(p, goal)) }))
    .filter((x) => x.names.length)
    .sort((a, b) => b.names.length - a.names.length || rel(a.project) - rel(b.project))
    .slice(0, 10)
    .map((x) => ({ project: x.project, reasons: [{ kind: "extra", names: x.names }] }));
};

const MOVIE_LIKE = (p) => !isSeries(p);

/** Build the roadmap for a goal: { kind, goal|saga } with depth ("quick" | "full") and order ("release" | "story"). */
export function buildRoadmap({ kind = "title", id, depth = "quick", order = "release" }, userData) {
  const key = order === "story" ? story : rel;
  const sort = (a, b) => key(a.project) - key(b.project) || rel(a.project) - rel(b.project);
  let goal = null, saga = null, entries = [], goalEntry = null;

  if (kind === "saga") {
    saga = sagaGoals().find((s) => s.def.id === id);
    if (!saga) return null;
    const inSaga = new Set(saga.items.map((p) => p.id));
    const merged = new Map();
    saga.items.forEach((target) => prerequisitesFor(target, depth).forEach((e, pid) => {
      if (inSaga.has(pid)) return;
      const cur = merged.get(pid);
      if (!cur) merged.set(pid, { project: e.project, reasons: e.reasons.map((r) => ({ ...r, for: target.title })) });
    }));
    const lead = [...merged.values()].map((e) => ({ ...e, group: "lead" }));
    const inside = saga.items.map((project) => ({ project, reasons: [{ kind: "saga" }], group: "saga" }));
    entries = [...lead, ...inside];
  } else {
    goal = BY_ID.get(id);
    if (!goal) return null;
    entries = [...prerequisitesFor(goal, depth).values()].map((e) => ({ ...e, group: "lead" }));
    goalEntry = { project: goal, reasons: [{ kind: "goal" }], group: "goal" };
  }
  entries.sort(sort);

  const mark = (e) => {
    const status = statusOf(e.project.id, userData);
    const satisfied = status === "completed" || status === "skipped";
    const ep = isSeries(e.project) ? episodeProgress(e.project, userData) : null;
    return { ...e, status, satisfied, episodes: ep };
  };
  const steps = entries.map(mark);
  const goalStep = goalEntry ? mark(goalEntry) : null;
  const counted = steps; // the minimum path: the goal itself is the destination, not a prerequisite
  const remaining = counted.filter((s) => !s.satisfied);
  const filmMinutes = remaining.filter((s) => MOVIE_LIKE(s.project)).reduce((a, s) => a + (s.project.runtimeMinutes || 0), 0);
  const episodesLeft = remaining.filter((s) => isSeries(s.project)).reduce((a, s) => a + Math.max(0, (s.episodes?.total || s.project.episodes || 0) - (s.episodes?.watched || 0)), 0);
  const done = counted.length - remaining.length;
  const extras = goal ? extrasFor(goal, new Set(steps.map((s) => s.project.id))).map(mark) : [];

  return {
    kind, goal, saga, depth, order, steps, goalStep, extras,
    stats: { total: counted.length, done, remaining: remaining.length, percent: counted.length ? Math.round((done / counted.length) * 100) : 100, filmMinutes, episodesLeft },
    next: remaining[0] || null,
    ready: remaining.length === 0,
  };
}

/** Sensible first goal: the newest released core title the user has not finished, else the newest release. */
export function defaultGoal(userData, now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  const released = goalCatalog().filter((p) => p.releaseDate && p.releaseDate <= today && !p.seasonNumber);
  const open = released.find((p) => p.connectionLevel === "core-mcu" && statusOf(p.id, userData) !== "completed");
  return (open || released[0] || goalCatalog()[0])?.id || null;
}

export const REASON_LABEL = { declared: "Lead-in", thread: "Story thread", core: "Core run-up", universe: "Same continuity", saga: "In this saga", extra: "Optional", goal: "Your goal" };
export function reasonText(reason, goalTitle) {
  const names = (reason.names || []).slice(0, 3).join(", ") + ((reason.names || []).length > 3 ? " +" + (reason.names.length - 3) : "");
  switch (reason.kind) {
    case "declared": return "Listed as a lead-in to " + (reason.via || goalTitle);
    case "thread": return "Shares " + names + (goalTitle ? " with " + goalTitle : "");
    case "core": return "Part of the core MCU run-up";
    case "universe": return "Earlier title in the same continuity";
    case "saga": return "Part of this saga";
    case "extra": return "Also features " + names;
    default: return "";
  }
}
