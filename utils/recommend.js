// "What should I watch next?" - a small, pure ranking helper. It only reads data; it never writes progress.
import { statusOf, episodeProgress, isSeries, displayReleaseOrder, getProjectState } from "./helpers.js";

const orderOf = (p, timeline) => (timeline === "chronological" ? (p.chronologicalOrderIndex ?? 99999) : displayReleaseOrder(p));

export function rankSuggestions(visible, userData, { timeline = "release", limit = 6 } = {}) {
  const order = visible.slice().sort((a, b) => orderOf(a, timeline) - orderOf(b, timeline));
  const loved = order.filter((p) => {
    const s = getProjectState(p, userData);
    return statusOf(p.id, userData) === "completed" && (s.favorite || Number(s.rating) >= 8);
  });
  const firstOpen = order.find((p) => statusOf(p.id, userData) === "not-started");
  const firstOpenIdx = firstOpen ? order.indexOf(firstOpen) : -1;
  const out = [];

  order.forEach((p, idx) => {
    const status = statusOf(p.id, userData);
    if (status === "completed" || status === "skipped") return;
    let score = 10;
    let reason = "Still waiting on your list";
    let tag = "list";

    if (status === "watching" || status === "rewatching") {
      const ep = isSeries(p) ? episodeProgress(p, userData) : null;
      if (ep && ep.total && ep.watched >= ep.total) return; // nothing left to watch
      score = 100 + (ep ? ep.percent / 10 : 0);
      reason = ep && ep.total ? "Pick up where you left off: " + ep.watched + " of " + ep.total + " episodes watched" : "You already started this one";
      tag = "continue";
    } else {
      if (idx === firstOpenIdx) { score += 60; reason = "Next stop in " + (timeline === "chronological" ? "story" : "release") + " order"; tag = "order"; }
      else if (firstOpenIdx >= 0 && idx > firstOpenIdx && idx <= firstOpenIdx + 3) { score += 22 - (idx - firstOpenIdx) * 4; reason = "Coming up soon in your order"; tag = "order"; }

      let best = null;
      for (const l of loved) {
        const shared = (p.franchises || []).filter((f) => (l.franchises || []).includes(f));
        if (!shared.length) continue;
        const specific = shared.some((f) => f !== "avengers");
        const bonus = specific ? 30 : 8;
        if (!best || bonus > best.bonus) best = { bonus, from: l };
      }
      if (best) { score += best.bonus; if (tag !== "order" || best.bonus >= 30) { reason = "Because you loved " + best.from.title.replace(/ - Season \d+$/, ""); tag = "loved"; } }

      if (tag === "list" && p.runtimeMinutes && p.runtimeMinutes <= 100) { score += 5; reason = "A quick watch (" + p.runtimeMinutes + " min)"; tag = "quick"; }
    }
    out.push({ project: p, score, reason, tag, idx });
  });

  return out.sort((a, b) => b.score - a.score || a.idx - b.idx).slice(0, limit);
}

export function surprisePick(visible, userData, rand = Math.random) {
  const pool = visible.filter((p) => statusOf(p.id, userData) === "not-started");
  if (!pool.length) return null;
  const project = pool[Math.floor(rand() * pool.length)];
  return { project, score: 0, reason: "Wildcard pick, because why not?", tag: "wild" };
}
