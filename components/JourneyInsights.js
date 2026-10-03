import { html, useMemo } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { UNIVERSES } from "../data/universes.js";
import {
  displayReleaseOrder,
  episodeProgress,
  getProjectState,
  isSeries,
  statusOf,
} from "../utils/helpers.js";
import { computeAchievements } from "../utils/achievements.js";

const pct = (n, d) => (d ? Math.min(100, Math.round((n / d) * 100)) : 0);
const cleanName = (name) => String(name || "").replace(/\s+—\s+Season\s+\d+$/, "");

function buildInsights(visible, userData) {
  const state = (p) => getProjectState(p, userData);
  const completed = visible.filter((p) => statusOf(p.id, userData) === "completed");
  const completedMovies = completed.filter((p) => !isSeries(p));

  const seriesMap = new Map();
  visible.filter(isSeries).forEach((p) => {
    const id = p.baseProjectId || p.id;
    if (!seriesMap.has(id)) seriesMap.set(id, []);
    seriesMap.get(id).push(p);
  });

  const completedSeries = [...seriesMap.entries()].map(([id, seasons]) => {
    const done = seasons.filter((p) => statusOf(p.id, userData) === "completed").length;
    const ratings = seasons.map((p) => Number(state(p).rating || 0)).filter((r) => r > 0);
    const rating = ratings.length ? Math.round((ratings.reduce((a, r) => a + r, 0) / ratings.length) * 10) / 10 : 0;
    const dates = seasons.map((p) => state(p).watchedDate || "").filter(Boolean).sort();
    const base = PROJECTS.find((p) => p.id === id) || seasons[0];
    return {
      kind: "series",
      key: id,
      project: base,
      completed: done === seasons.length && seasons.length > 0,
      rating,
      date: dates[dates.length - 1] || "",
      order: displayReleaseOrder(seasons[0]),
    };
  }).filter((s) => s.completed);

  const movieEntries = completedMovies.map((p) => ({
    kind: "movie",
    key: p.id,
    project: p,
    rating: Number(state(p).rating || 0),
    date: state(p).watchedDate || "",
    order: displayReleaseOrder(p),
  }));

  const rated = [...movieEntries, ...completedSeries].filter((e) => e.rating > 0);
  const ratings = rated.map((e) => e.rating);
  const topRated = rated.slice().sort((a, b) => b.rating - a.rating || a.order - b.order).slice(0, 5);
  const avgRating = ratings.length ? Math.round((ratings.reduce((a, r) => a + r, 0) / ratings.length) * 10) / 10 : 0;
  const ratingCounts = {};
  ratings.forEach((r) => { ratingCounts[r] = (ratingCounts[r] || 0) + 1; });

  const seriesProjects = visible.filter(isSeries);
  const watchedEpisodes = seriesProjects.reduce((sum, p) => sum + episodeProgress(p, userData).watched, 0);
  const totalEpisodes = seriesProjects.reduce((sum, p) => sum + episodeProgress(p, userData).total, 0);
  const knownRuntime = completed.reduce((sum, p) => sum + (Number(p.runtimeMinutes) || 0), 0);
  const completedUniverses = new Set(completed.map((p) => p.universe).filter(Boolean));
  const completedFranchises = new Set(completed.flatMap((p) => p.franchises || []));

  const dated = completed.filter((p) => state(p).watchedDate).sort((a, b) =>
    String(state(a).watchedDate).localeCompare(String(state(b).watchedDate))
  );
  const firstCompleted = dated[0] || null;
  const latestCompleted = dated[dated.length - 1] || null;

  const phaseCounts = {};
  completed.forEach((p) => { if (p.phase) phaseCounts[p.phase] = (phaseCounts[p.phase] || 0) + 1; });
  const phaseEntry = Object.entries(phaseCounts).sort((a, b) => b[1] - a[1])[0];
  const era = phaseEntry ? "Phase " + phaseEntry[0] : completed.length ? "The beginning" : "Your Marvel era is about to begin";

  const next = visible.slice().sort((a, b) => displayReleaseOrder(a) - displayReleaseOrder(b))
    .find((p) => statusOf(p.id, userData) === "not-started");
  const latestOrder = completed.length ? Math.max(...completed.map(displayReleaseOrder)) : 0;
  const journeyPercent = pct(completed.length, visible.length);

  const universeProgress = UNIVERSES.map((u) => {
    const items = visible.filter((p) => p.universe === u.id);
    const done = items.filter((p) => statusOf(p.id, userData) === "completed").length;
    return { ...u, total: items.length, done, percent: pct(done, items.length) };
  }).filter((u) => u.total > 0).sort((a, b) => b.percent - a.percent || b.done - a.done).slice(0, 6);

  return {
    completed, completedMovies, completedSeries, topRated, ratings, ratingCounts, avgRating,
    watchedEpisodes, totalEpisodes, knownRuntime, completedUniverses: completedUniverses.size,
    completedFranchises: completedFranchises.size, firstCompleted, latestCompleted, era,
    latestOrder, next, journeyPercent, universeProgress,
  };
}

function Stat({ value, label, detail }) {
  return html`<div className="ji-stat"><strong>${value}</strong><span>${label}</span>${detail ? html`<small>${detail}</small>` : null}</div>`;
}

function TitleButton({ entry, onOpen }) {
  const p = entry.project;
  return html`<button type="button" className="ji-title" onClick=${() => onOpen(p.id)}>
    <span className="ji-title-main"><b>${cleanName(p.title)}</b><small>${entry.kind === "series" ? "Series / TV" : "Movie"}${p.releaseYear ? " · " + p.releaseYear : ""}</small></span>
    <span className="ji-title-rating">★ ${entry.rating}/10</span>
  </button>`;
}

export function JourneyInsights({ visible, userData, onOpen, onNavigate }) {
  const model = useMemo(() => buildInsights(visible, userData), [visible, userData]);
  const trophyResult = useMemo(() => computeAchievements(userData), [userData]);
  const showcase = trophyResult.list.filter((a) => a.unlocked)
    .sort((a, b) => b.points - a.points || a.name.localeCompare(b.name)).slice(0, 3);
  const runtimeHours = Math.floor(model.knownRuntime / 60);
  const runtimeMinutes = model.knownRuntime % 60;
  const runtimeLabel = model.knownRuntime ? (runtimeHours ? runtimeHours + "h " : "") + runtimeMinutes + "m" : "—";
  const maxRatingCount = Math.max(1, ...Object.values(model.ratingCounts));
  const identity = model.completed.length >= 50
    ? ["The Archivist", "You are deep into the archive and tracking it like a historian."]
    : model.completed.length >= 25
      ? ["Multiverse Explorer", "You have crossed enough worlds to earn the explorer title."]
      : model.completedUniverses >= 3
        ? ["Universe Hopper", "You do not stay in one universe for long."]
        : model.ratings.length >= 5
          ? ["Marvel Critic", "You are building a clear personal taste profile."]
          : model.completed.length >= 10
            ? ["Dedicated Fan", "The backlog is no longer intimidating you."]
            : ["New Recruit", "Every Marvel journey needs a first chapter."];

  return html`
    <section className="ji" aria-labelledby="ji-title">
      <div className="ji-heading">
        <div><span className="eyebrow">YOUR MARVEL PROFILE</span><h2 id="ji-title">Built from your actual watch history.</h2><p>Personal insights live here without replacing the Command Center, Watch Next, recent activity, or Trophy Room.</p></div>
        <div className="ji-era"><span>Your Marvel Era</span><strong>${model.era}</strong></div>
      </div>

      <div className="ji-stats">
        <${Stat} value=${model.completedMovies.length} label="Movies completed" />
        <${Stat} value=${model.completedSeries.length} label="Series completed" />
        <${Stat} value=${model.watchedEpisodes} label="Episodes watched" detail=${model.totalEpisodes ? "of " + model.totalEpisodes : ""} />
        <${Stat} value=${model.avgRating ? model.avgRating + "/10" : "—"} label="Average rating" detail=${model.ratings.length ? model.ratings.length + " rated titles" : "Rate a title to build this"} />
        <${Stat} value=${runtimeLabel} label="Known watch time" detail="from completed films/specials" />
        <${Stat} value=${model.completedUniverses} label="Universes explored" />
        <${Stat} value=${model.completedFranchises} label="Franchises touched" />
      </div>

      <div className="ji-grid">
        <section className="ji-panel">
          <div className="ji-panel-head"><div><span className="eyebrow">TOP RATED</span><h3>Your personal favorites by score</h3></div><button className="text-btn" onClick=${() => onNavigate("progress")}>Open journey →</button></div>
          ${model.topRated.length ? html`<div className="ji-title-list">${model.topRated.map((entry) => html`<${TitleButton} key=${entry.key} entry=${entry} onOpen=${onOpen} />`)}</div>` : html`<div className="ji-empty">Rate movies or completed series to build your personal Top Rated list.</div>`}
        </section>

        <section className="ji-panel">
          <div className="ji-panel-head"><div><span className="eyebrow">RATING BREAKDOWN</span><h3>How you score Marvel</h3></div></div>
          <div className="ji-bars">
            ${[10,9,8,7,6,5,4,3,2,1].map((score) => {
              const exact = model.ratingCounts[score] || 0;
              return html`<div key=${score} className="ji-rating-row"><span>${score}</span><i><b style=${{ width: Math.round((exact / maxRatingCount) * 100) + "%" }}></b></i><em>${exact}</em></div>`;
            })}
          </div>
        </section>

        <section className="ji-panel ji-panel-wide">
          <div className="ji-panel-head"><div><span className="eyebrow">UNIVERSE PROGRESS</span><h3>Where your journey has taken you</h3></div><button className="text-btn" onClick=${() => onNavigate("universes")}>Explore universes →</button></div>
          <div className="ji-universes">${model.universeProgress.map((u) => html`
            <button key=${u.id} type="button" className="ji-universe" onClick=${() => onNavigate("universes")} title=${u.name}>
              <span className="ji-universe-top"><b>${u.name}</b><em>${u.done}/${u.total}</em></span>
              <span className="ji-progress"><i style=${{ width: u.percent + "%", background: u.color }}></i></span>
              <small>${u.percent}% explored</small>
            </button>`)}
          </div>
        </section>

        <section className="ji-panel">
          <div className="ji-panel-head"><div><span className="eyebrow">MARVEL IDENTITY</span><h3>Your current archetype</h3></div></div>
          <div className="ji-identity"><strong>${identity[0]}</strong><p>${identity[1]}</p></div>
        </section>

        <section className="ji-panel">
          <div className="ji-panel-head"><div><span className="eyebrow">TIMELINE POSITION</span><h3>Where you stand</h3></div><button className="text-btn" onClick=${() => onNavigate("timeline")}>Open timeline →</button></div>
          <div className="ji-timeline"><div className="ji-track"><i style=${{ width: model.journeyPercent + "%" }}></i></div><div className="ji-track-labels"><span>Start</span><strong>${model.journeyPercent}%</strong><span>Archive</span></div><p>${model.completed.length ? "Through release-order entry " + Math.round(model.latestOrder) + "." : "Your first entry is waiting."} ${model.next ? "Next release-order stop: " + cleanName(model.next.title) + "." : "You have reached the end of the visible archive."}</p></div>
        </section>

        <section className="ji-panel ji-panel-wide">
          <div className="ji-panel-head"><div><span className="eyebrow">YOUR MARVEL JOURNEY</span><h3>Milestones across the archive</h3></div><span className="ji-meta">${model.latestCompleted ? "Latest: " + cleanName(model.latestCompleted.title) : "No completed titles yet"}</span></div>
          <div className="ji-milestones">
            ${[
              ["First title", Boolean(model.firstCompleted), model.firstCompleted ? cleanName(model.firstCompleted.title) : "Not started"],
              ["25% archive", model.journeyPercent >= 25, model.journeyPercent + "% complete"],
              ["50% archive", model.journeyPercent >= 50, model.journeyPercent + "% complete"],
              ["75% archive", model.journeyPercent >= 75, model.journeyPercent + "% complete"],
              ["100% archive", model.journeyPercent >= 100, model.journeyPercent + "% complete"],
            ].map(([label, done, value]) => html`<div key=${label} className=${"ji-milestone" + (done ? " done" : "")}><span>${done ? "✓" : "○"}</span><b>${label}</b><small>${value}</small></div>`)}
          </div>
          <div className="ji-first-last"><span><small>FIRST COMPLETED</small><b>${model.firstCompleted ? cleanName(model.firstCompleted.title) : "—"}</b></span><span><small>MOST RECENTLY COMPLETED</small><b>${model.latestCompleted ? cleanName(model.latestCompleted.title) : "—"}</b></span></div>
        </section>

        <section className="ji-panel ji-panel-wide">
          <div className="ji-panel-head"><div><span className="eyebrow">ACHIEVEMENT SHOWCASE</span><h3>Your biggest unlocked trophies</h3></div><button className="text-btn" onClick=${() => onNavigate("progress")}>View all trophies →</button></div>
          ${showcase.length ? html`<div className="ji-trophies">${showcase.map((a) => html`<button key=${a.id} type="button" className="ji-trophy" onClick=${() => onNavigate("progress")}><span>${a.icon}</span><strong>${a.name}</strong><small>${a.points} pts · ${a.detail}</small></button>`)}</div>` : html`<div className="ji-empty">Your first trophy is waiting in the Progress page.</div>`}
        </section>
      </div>
    </section>
  `;
}
