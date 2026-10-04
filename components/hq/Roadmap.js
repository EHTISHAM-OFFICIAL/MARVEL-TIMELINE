import { html, useEffect, useMemo, useRef, useState } from "htm/react";
import { buildRoadmap, defaultGoal, goalCatalog, sagaGoals, REASON_LABEL, reasonText } from "../../utils/roadmap.js";
import { formatRuntime, getUniverse, statusOf } from "../../utils/helpers.js";
import { PosterImage } from "../PosterProjectCard.js";
import { Ring, Meter, SectionHead, Empty, StatusPill, abbrevUniverse } from "./shared.js";

const KEY = "mt-hq-goal";
const TYPE_LABEL = { movie: "Film", "tv-series": "Series", "limited-series": "Limited series", "animated-series": "Animated series", special: "Special", "animated-movie": "Animated film" };

export const loadGoal = () => { try { const g = JSON.parse(localStorage.getItem(KEY) || "null"); return g && typeof g === "object" ? g : null; } catch (e) { return null; } };
/** Used by other screens (e.g. the title dialog) to open the Roadmap on a given goal. */
export const requestGoal = (id, kind = "title") => {
  try {
    const cur = loadGoal() || {};
    localStorage.setItem(KEY, JSON.stringify({ ...cur, kind, id }));
    sessionStorage.setItem("mt-hq-tab", "roadmap");
  } catch (e) { /* storage unavailable: the Roadmap just opens on its default goal */ }
};
const saveGoal = (g) => { try { localStorage.setItem(KEY, JSON.stringify(g)); } catch (e) { /* ignore */ } };

const today = () => new Date().toISOString().slice(0, 10);
const shortTitle = (t) => String(t).replace(/^(Marvel Studios'?\s+)/, "");

function GoalPicker({ goalId, onPick }) {
  const catalog = useMemo(() => goalCatalog(), []);
  const selected = catalog.find((p) => p.id === goalId);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const blurTimer = useRef(null);
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? catalog.filter((p) => p.title.toLowerCase().includes(s)) : catalog).slice(0, 8);
  }, [catalog, q]);
  useEffect(() => { setCursor(0); }, [q]);
  const pick = (p) => { onPick(p.id); setOpen(false); setQ(""); };
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setCursor((c) => Math.min(matches.length - 1, c + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); }
    else if (e.key === "Enter" && open && matches[cursor]) { e.preventDefault(); pick(matches[cursor]); }
    else if (e.key === "Escape") { setOpen(false); setQ(""); }
  };
  return html`<div className="hq-rm-picker">
    <label className="hq-search hq-rm-search"><span className="hq-eyebrow">Get ready for</span>
      <input type="text" role="combobox" aria-expanded=${open} aria-controls="hq-rm-list" aria-autocomplete="list" autoComplete="off"
        placeholder="Search any movie or series…" value=${open ? q : selected ? selected.title : ""}
        onFocus=${(e) => { clearTimeout(blurTimer.current); setOpen(true); setQ(""); e.target.select(); }}
        onBlur=${() => { blurTimer.current = setTimeout(() => { setOpen(false); setQ(""); }, 120); }}
        onChange=${(e) => { setQ(e.target.value); setOpen(true); }} onKeyDown=${onKey} />
    </label>
    ${open ? html`<ul id="hq-rm-list" role="listbox" className="hq-rm-options">
      ${matches.map((p, i) => html`<li key=${p.id} role="option" aria-selected=${i === cursor}>
        <button type="button" className=${i === cursor ? "active" : ""} onMouseDown=${(e) => e.preventDefault()} onClick=${() => pick(p)}>
          <strong>${p.title}</strong>
          <small>${TYPE_LABEL[p.type] || p.type} · ${p.releaseYear}${p.releaseDate > today() ? " · Upcoming" : ""}</small>
        </button></li>`)}
      ${!matches.length ? html`<li className="hq-muted">No title matches “${q}”.</li>` : null}
    </ul>` : null}
  </div>`;
}

function Step({ step, index, goalTitle, isNext, onOpen, userData, showReason = true, goalNode = false }) {
  const { project } = step;
  const lead = step.reasons[0];
  const fmt = project.type === "movie" || project.type === "animated-movie" || project.type === "special" ? formatRuntime(project.runtimeMinutes) : step.episodes?.total || project.episodes ? (step.episodes?.total || project.episodes) + " episodes" : null;
  return html`<li className=${"hq-rm-step st-" + step.status + (isNext ? " next" : "") + (goalNode ? " goal" : "")} aria-current=${isNext ? "step" : undefined}>
    <span className="hq-rm-node" aria-hidden="true">${goalNode ? "🎯" : step.satisfied ? "✓" : index + 1}</span>
    <button type="button" className="hq-rm-card" onClick=${() => onOpen(project.id)}>
      <span className="hq-rm-art"><${PosterImage} project=${project} /></span>
      <span className="hq-rm-body">
        <span className="hq-rm-top">
          ${isNext ? html`<span className="hq-rm-flag">Start here</span>` : null}
          ${showReason && lead && !goalNode ? html`<span className=${"hq-rm-kind k-" + lead.kind}>${REASON_LABEL[lead.kind]}</span>` : null}
          ${goalNode ? html`<span className="hq-rm-kind k-goal">Your goal</span>` : null}
        </span>
        <strong className="hq-rm-title">${project.title}</strong>
        <span className="hq-rm-meta">${TYPE_LABEL[project.type] || project.type} · ${project.releaseYear}${fmt ? " · " + fmt : ""} · ${abbrevUniverse(getUniverse(project.universe).name)}</span>
        ${showReason && !goalNode ? html`<span className="hq-rm-why">${step.reasons.map((r) => reasonText(r, goalTitle)).join(" · ")}</span>` : null}
        ${step.status === "skipped" ? html`<span className="hq-rm-note">You skipped this one, so it counts as covered.</span>` : null}
      </span>
      <${StatusPill} project=${project} userData=${userData} />
    </button>
  </li>`;
}

export function Roadmap({ userData, onOpen }) {
  const prefs = userData.preferences || {};
  const stored = useMemo(loadGoal, []);
  const [kind, setKind] = useState(stored?.kind === "saga" ? "saga" : "title");
  const [goalId, setGoalId] = useState(() => (stored?.kind !== "saga" && stored?.id) || defaultGoal(userData));
  const [sagaId, setSagaId] = useState(() => (stored?.kind === "saga" && stored?.id) || "multiverse");
  const [depth, setDepth] = useState(stored?.depth === "full" ? "full" : "quick");
  const [order, setOrder] = useState(stored?.order || (/chrono|story/i.test(prefs.defaultTimeline || "") ? "story" : "release"));
  const [showDone, setShowDone] = useState(false);
  const id = kind === "saga" ? sagaId : goalId;

  useEffect(() => { saveGoal({ kind, id, depth, order }); }, [kind, id, depth, order]);

  const road = useMemo(() => buildRoadmap({ kind, id, depth, order }, userData), [kind, id, depth, order, userData]);
  const sagas = useMemo(() => sagaGoals().map((s) => ({ ...s, done: s.items.filter((p) => statusOf(p.id, userData) === "completed").length })), [userData]);
  const suggestions = useMemo(() => goalCatalog().filter((p) => !p.seasonNumber && p.releaseDate <= today() && p.connectionLevel === "core-mcu").slice(0, 5), []);

  if (!road) return html`<${Empty} icon="🧭" title="That goal isn't in the catalog">Pick another title above.<//>`;

  const title = road.goal ? road.goal.title : road.saga.def.name;
  const { stats } = road;
  const lead = road.steps.filter((s) => s.group === "lead");
  const inside = road.steps.filter((s) => s.group === "saga");
  const leadVisible = lead.filter((s) => showDone || !s.satisfied);
  const insideVisible = inside.filter((s) => showDone || !s.satisfied);
  const hiddenDone = showDone ? 0 : road.steps.filter((s) => s.satisfied).length;
  const visibleSteps = (list) => list.filter((s) => showDone || !s.satisfied);
  const runtimeBits = [stats.filmMinutes ? "about " + formatRuntime(stats.filmMinutes) + " of film" : null, stats.episodesLeft ? stats.episodesLeft + " episodes" : null].filter(Boolean).join(" + ");
  let n = 0;
  const renderList = (list) => visibleSteps(list).map((s) => html`<${Step} key=${s.project.id} step=${s} index=${s.satisfied ? 0 : n++} goalTitle=${title} isNext=${road.next && road.next.project.id === s.project.id} onOpen=${onOpen} userData=${userData} />`);

  return html`
    <section aria-labelledby="hq-rm">
      <${SectionHead} title="Catch-up Roadmap" blurb="Choose what you want to be ready for and get the shortest watch list to get there, built from the links already in the catalog and what you've finished." />

      <div className="hq-rm-goalbar">
        <div className="hq-seg" role="radiogroup" aria-label="Goal type">
          <button type="button" role="radio" aria-checked=${kind === "title"} className=${kind === "title" ? "active" : ""} onClick=${() => setKind("title")}>A movie or series</button>
          <button type="button" role="radio" aria-checked=${kind === "saga"} className=${kind === "saga" ? "active" : ""} onClick=${() => setKind("saga")}>Finish a saga</button>
        </div>
        ${kind === "title" ? html`<${GoalPicker} goalId=${goalId} onPick=${setGoalId} />` : null}
      </div>

      ${kind === "title" ? html`<div className="hq-chips" aria-label="Suggested goals">
        ${suggestions.map((p) => html`<button key=${p.id} type="button" className=${p.id === goalId ? "active" : ""} onClick=${() => setGoalId(p.id)}>${shortTitle(p.title)}</button>`)}
      </div>` : html`<ul className="hq-sagapicker">
        ${sagas.map((s) => html`<li key=${s.def.id}><button type="button" aria-pressed=${s.def.id === sagaId} className=${"hq-sagabtn" + (s.def.id === sagaId ? " active" : "")} onClick=${() => setSagaId(s.def.id)}>
          <span className="hq-eyebrow">${s.def.group === "main" ? "Main saga" : "Beyond the MCU"}</span>
          <strong>${s.def.name}</strong>
          <small>${s.done} / ${s.items.length} completed</small>
          <${Meter} percent=${(s.done / s.items.length) * 100} />
        </button></li>`)}
      </ul>`}

      <article className=${"hq-rm-summary" + (road.ready ? " ready" : "")} aria-live="polite">
        <${Ring} percent=${stats.percent} size=${96} stroke=${8} color=${road.ready ? "var(--green)" : "var(--red)"}><b>${stats.percent}%</b><//>
        <div className="hq-rm-sum-text">
          <span className="hq-eyebrow">${road.kind === "saga" ? "Finish" : "Ready for"}</span>
          <h3>${title}</h3>
          ${road.ready
            ? html`<p>${road.kind === "saga" ? "Every title in this saga and its lead-ins is finished." : "You've covered everything on this path. Time to watch it."}</p>`
            : html`<p><b>${stats.remaining}</b> ${road.kind === "saga" ? "titles left" : stats.remaining === 1 ? "title to watch first" : "titles to watch first"}${runtimeBits ? " · " + runtimeBits : ""}</p>`}
          <p className="hq-rm-sum-sub">${stats.done} of ${stats.total} on this path already done${road.goal ? " · " + (road.depth === "full" ? "Full run-up" : "Quick catch-up") : ""}</p>
        </div>
        ${road.next ? html`<button type="button" className="hq-cta" onClick=${() => onOpen(road.next.project.id)}><span>Start with</span><strong>${road.next.project.title}</strong><em>→</em></button>`
          : road.goalStep ? html`<button type="button" className="hq-cta" onClick=${() => onOpen(road.goalStep.project.id)}><span>Watch it now</span><strong>${road.goalStep.project.title}</strong><em>→</em></button>` : html`<p className="hq-done-note">✓ Saga complete</p>`}
      </article>

      <div className="hq-rm-controls">
        ${road.kind === "title" ? html`<div className="hq-seg" role="radiogroup" aria-label="How thorough">
          <button type="button" role="radio" aria-checked=${depth === "quick"} className=${depth === "quick" ? "active" : ""} onClick=${() => setDepth("quick")}>Quick catch-up</button>
          <button type="button" role="radio" aria-checked=${depth === "full"} className=${depth === "full" ? "active" : ""} onClick=${() => setDepth("full")}>Full run-up</button>
        </div>` : html`<div className="hq-seg" role="radiogroup" aria-label="How thorough">
          <button type="button" role="radio" aria-checked=${depth === "quick"} className=${depth === "quick" ? "active" : ""} onClick=${() => setDepth("quick")}>Quick lead-ins</button>
          <button type="button" role="radio" aria-checked=${depth === "full"} className=${depth === "full" ? "active" : ""} onClick=${() => setDepth("full")}>Full lead-ins</button>
        </div>`}
        <div className="hq-seg" role="radiogroup" aria-label="Order">
          <button type="button" role="radio" aria-checked=${order === "release"} className=${order === "release" ? "active" : ""} onClick=${() => setOrder("release")}>Release order</button>
          <button type="button" role="radio" aria-checked=${order === "story"} className=${order === "story" ? "active" : ""} onClick=${() => setOrder("story")}>Story order</button>
        </div>
        <label className="hq-rm-check"><input type="checkbox" checked=${showDone} onChange=${(e) => setShowDone(e.target.checked)} /> Show finished titles</label>
      </div>

      ${road.steps.length === 0 && road.goalStep ? html`<${Empty} icon="🌱" title="Nothing needs to come first">This title has no lead-ins in the catalog, so you can start right here.<//>` : null}

      ${leadVisible.length ? html`<h3 className="hq-rm-group">${road.kind === "saga" ? "Lead-in titles" : "Watch first"}<small>${road.kind === "saga" ? "Needed before the saga's own titles" : stats.remaining + " left"}</small></h3>` : null}
      ${leadVisible.length || (road.goalStep && !inside.length) ? html`<ol className="hq-rm-path">${renderList(lead)}${road.goalStep ? html`<${Step} step=${road.goalStep} index=${0} goalTitle=${title} goalNode=${true} onOpen=${onOpen} userData=${userData} />` : null}</ol>` : null}
      ${insideVisible.length ? html`<h3 className="hq-rm-group">In the saga<small>${inside.filter((s) => !s.satisfied).length} left</small></h3><ol className="hq-rm-path">${renderList(inside)}</ol>` : null}
      ${hiddenDone ? html`<p className="hq-rm-hidden"><button type="button" className="btn ghost sm" onClick=${() => setShowDone(true)}>${hiddenDone} finished ${hiddenDone === 1 ? "title is" : "titles are"} hidden · show</button></p>` : null}

      ${road.extras.length ? html`<details className="hq-rm-extras"><summary>Optional extras <small>${road.extras.length} related titles, not needed for the path</small></summary>
        <ol className="hq-rm-path">${road.extras.map((s) => html`<${Step} key=${s.project.id} step=${s} index=${0} goalTitle=${title} onOpen=${onOpen} userData=${userData} />`)}</ol></details>` : null}

      <details className="hq-rm-how"><summary>How this path is built</summary>
        <p>Nothing here is guessed. The Roadmap only uses what the catalog already says: titles listed as lead-ins (<em>previous</em> links, the same ones the Connection Map draws), earlier core-MCU titles that share a character with your goal, and, for a full run-up, every earlier core-MCU title. A title you skipped counts as covered. Shared-character matches depend on the cast lists in the catalog, so treat Quick catch-up as the shortest sensible path and Full run-up as the safe one.</p>
      </details>
    </section>`;
}
