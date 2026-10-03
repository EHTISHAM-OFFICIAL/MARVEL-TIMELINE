import { html, useEffect, useMemo, useState } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { JourneyInsights } from "./JourneyInsights.js";
import {
  getUniverse,
  getProjectState,
  isSeries,
  episodeProgress,
  displayReleaseOrder,
  STATUS_META,
} from "../utils/helpers.js";

const TABS = [
  { id: "all", label: "All watched" },
  { id: "movies", label: "Movies" },
  { id: "series", label: "Series" },
  { id: "watching", label: "Watching" },
  { id: "favorites", label: "Favorites" },
];

const PAGE_SIZE = 8;

const SORT_OPTIONS = [
  { id: "release", label: "Release order" },
  { id: "date", label: "Watched date" },
  { id: "rating", label: "Rating" },
  { id: "phase", label: "Phase" },
];

const TYPE_LABELS = {
  movie: "Movie",
  "animated-movie": "Animated movie",
  special: "Special",
  "tv-series": "TV series",
  "limited-series": "Limited series",
  "animated-series": "Animated series",
};

const EMPTY = {
  all: ["Nothing watched yet", "Mark a title as completed from the timeline and it will show up here."],
  movies: ["No movies completed yet", "Completed movies appear here with the date you watched them."],
  series: ["No series started yet", "Start a series or tick off an episode and it will be tracked here."],
  watching: ["Nothing in progress", "Titles you mark as “Watching” are listed here."],
  favorites: ["No favorites yet", "Tap the ★ on any title to pin it here."],
};

const typeLabel = (p) => TYPE_LABELS[p.type] || String(p.type || "").replace(/-/g, " ");

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

// Same definitions the old block used: a title counts only when its status is exactly
// "completed" (or "watching"), so every number matches what you saw before.
function buildModel(visible, userData) {
  const state = (p) => getProjectState(p, userData);
  const status = (p) => state(p).status || "not-started";

  const movies = visible.filter((p) => !isSeries(p));
  const seasons = visible.filter((p) => isSeries(p));
  const doneMovies = movies.filter((p) => status(p) === "completed");
  const doneSeasons = seasons.filter((p) => status(p) === "completed");
  const watching = visible.filter((p) => status(p) === "watching");
  const favorites = visible.filter((p) => state(p).favorite);
  const episodes = seasons.reduce(
    (a, p) => {
      const e = episodeProgress(p, userData);
      a.watched += e.watched;
      a.total += e.total;
      return a;
    },
    { watched: 0, total: 0 },
  );
  const done = doneMovies.length + doneSeasons.length;
  const percent = visible.length ? Math.round((done / visible.length) * 100) : 0;

  const itemEntry = (p) => {
    const s = state(p);
    return {
      kind: "item",
      key: p.id,
      project: p,
      status: status(p),
      date: s.watchedDate || "",
      rating: s.rating || 0,
      favorite: Boolean(s.favorite),
      ep: isSeries(p) ? episodeProgress(p, userData) : null,
      order: displayReleaseOrder(p),
      phase: Number.isFinite(Number(p.phase)) ? Number(p.phase) : Number.MAX_SAFE_INTEGER,
      title: p.title,
    };
  };

  // Group seasons back into shows so a series reads as one row with season chips.
  const groups = new Map();
  seasons.forEach((p) => {
    const id = p.baseProjectId || p.id;
    if (!groups.has(id)) groups.set(id, []);
    groups.get(id).push(p);
  });
  const shows = [];
  groups.forEach((list, id) => {
    list.sort((a, b) => (a.seasonNumber || 1) - (b.seasonNumber || 1));
    const base = PROJECTS.find((p) => p.id === id) || list[0];
    const info = list.map((p) => ({ project: p, status: status(p), ep: episodeProgress(p, userData) }));
    const watchedEps = info.reduce((a, s) => a + s.ep.watched, 0);
    const totalEps = info.reduce((a, s) => a + s.ep.total, 0);
    const completed = info.filter((s) => s.status === "completed").length;
    const tracked =
      completed > 0 || watchedEps > 0 || info.some((s) => s.status === "watching" || s.status === "rewatching");
    if (!tracked) return;
    const anyWatching = info.some((s) => s.status === "watching" || s.status === "rewatching");
    const open =
      info.find((s) => s.status === "watching") ||
      info.find((s) => s.status !== "completed" && s.ep.watched > 0) ||
      info.slice().reverse().find((s) => s.status === "completed") ||
      info[0];
    const dates = list.map((p) => state(p).watchedDate || "").filter(Boolean).sort();
    const ratings = list.map((p) => Number(state(p).rating || 0)).filter((r) => r > 0);
    const rating = ratings.length ? Math.round((ratings.reduce((a, r) => a + r, 0) / ratings.length) * 10) / 10 : 0;
    shows.push({
      kind: "show",
      key: id,
      base,
      seasons: info,
      watchedEps,
      totalEps,
      completed,
      status: completed === info.length ? "completed" : anyWatching ? "watching" : "in-progress",
      date: dates.length ? dates[dates.length - 1] : "",
      favorite: list.some((p) => Boolean(state(p).favorite)),
      open: open.project,
      order: displayReleaseOrder(info[0].project),
      phase: Number.isFinite(Number(base.phase)) ? Number(base.phase) : Number.MAX_SAFE_INTEGER,
      rating,
      title: base.title,
    });
  });

  const movieEntries = doneMovies.map(itemEntry);
  const completedShows = shows.filter((show) => show.status === "completed");
  const lists = {
    all: [...movieEntries, ...completedShows],
    movies: movieEntries.slice(),
    series: shows.slice(),
    watching: watching.map(itemEntry),
    favorites: favorites.map(itemEntry),
  };

  return {
    total: visible.length,
    done,
    percent,
    movies: { done: doneMovies.length, total: movies.length },
    seasons: { done: doneSeasons.length, total: seasons.length },
    episodes,
    watchingCount: watching.length,
    favoriteCount: favorites.length,
    lists,
  };
}

function Stat({ tone, label, value, total, hint, active, onPick }) {
  const pct = total ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return html`
    <button type="button" className=${"cc-stat cc-tone-" + tone + (active ? " active" : "")} onClick=${onPick}
      aria-label=${label + ": " + value + (total ? " of " + total : "") + ". Show in the list below."}>
      <span className="cc-stat-label">${label}</span>
      <span className="cc-stat-value"><b>${value}</b>${total ? html`<small>/ ${total}</small>` : null}</span>
      ${total
        ? html`<span className="cc-bar" aria-hidden="true"><i style=${{ width: pct + "%" }}></i></span>`
        : html`<span className="cc-stat-hint">${hint}</span>`}
    </button>
  `;
}

function StatusChip({ status }) {
  const label = status === "in-progress" ? "In progress" : (STATUS_META[status] || {}).label || status;
  return html`<span className=${"cc-status cc-status-" + status}>${label}</span>`;
}

function ItemRow({ entry, onOpen }) {
  const p = entry.project;
  const u = getUniverse(p.universe);
  return html`
    <li className="cc-row" style=${{ "--uc": u.color }}>
      <button type="button" className="cc-row-main" onClick=${() => onOpen(p.id)}>
        <span className="cc-row-dot" aria-hidden="true"></span>
        <span className="cc-row-copy">
          <span className="cc-row-title">${p.title}${entry.favorite ? html`<span className="cc-fav" role="img" aria-label="Favorite">★</span>` : null}</span>
          <span className="cc-row-meta">${p.releaseYear} · ${typeLabel(p)}${p.phase ? " · Phase " + p.phase : ""}</span>
          ${entry.ep && entry.ep.total
            ? html`<span className="cc-row-eps"><span className="cc-bar" aria-hidden="true"><i style=${{ width: entry.ep.percent + "%" }}></i></span><em>${entry.ep.watched}/${entry.ep.total} episodes</em></span>`
            : null}
        </span>
        <span className="cc-row-side">
          <${StatusChip} status=${entry.status} />
          ${entry.date ? html`<time dateTime=${entry.date}>${formatDate(entry.date)}</time>` : null}
          ${entry.rating ? html`<span className="cc-rating">★ ${entry.rating}/10</span>` : null}
        </span>
      </button>
    </li>
  `;
}

function ShowRow({ entry, onOpen }) {
  const b = entry.base;
  const u = getUniverse(b.universe);
  const multi = entry.seasons.length > 1;
  const pct = entry.totalEps ? Math.round((entry.watchedEps / entry.totalEps) * 100) : 0;
  return html`
    <li className="cc-row cc-row-show" style=${{ "--uc": u.color }}>
      <button type="button" className="cc-row-main" onClick=${() => onOpen(entry.open.id)}>
        <span className="cc-row-dot" aria-hidden="true"></span>
        <span className="cc-row-copy">
          <span className="cc-row-title">${b.title}${entry.favorite ? html`<span className="cc-fav" role="img" aria-label="Favorite">★</span>` : null}</span>
          <span className="cc-row-meta">${b.releaseYear} · ${typeLabel(b)}${multi ? " · " + entry.seasons.length + " seasons" : ""}</span>
          ${entry.totalEps
            ? html`<span className="cc-row-eps"><span className="cc-bar" aria-hidden="true"><i style=${{ width: pct + "%" }}></i></span><em>${entry.watchedEps}/${entry.totalEps} episodes</em></span>`
            : null}
        </span>
        <span className="cc-row-side">
          <${StatusChip} status=${entry.status} />
          ${entry.date ? html`<time dateTime=${entry.date}>${formatDate(entry.date)}</time>` : null}
          ${entry.rating ? html`<span className="cc-rating">★ ${entry.rating}/10</span>` : null}
        </span>
      </button>
      ${multi
        ? html`<div className="cc-seasons" role="group" aria-label=${b.title + " seasons"}>
            ${entry.seasons.map((s) => {
              const n = s.project.seasonNumber;
              const detail = s.status === "completed" ? "Completed" : s.ep.total ? s.ep.watched + " of " + s.ep.total + " episodes" : "Not started";
              return html`<button type="button" key=${s.project.id} className=${"cc-season cc-season-" + (s.status === "completed" || s.status === "watching" ? s.status : "idle")}
                onClick=${() => onOpen(s.project.id)} title=${"Season " + n + " · " + detail} aria-label=${b.title + " season " + n + ": " + detail}>
                <span>S${n}</span><em>${s.status === "completed" ? "✓" : s.ep.total ? s.ep.watched + "/" + s.ep.total : "–"}</em>
              </button>`;
            })}
          </div>`
        : null}
    </li>
  `;
}

export function CommandCenter({ visible, userData, onOpen, onNavigate }) {
  const model = useMemo(() => buildModel(visible, userData), [visible, userData]);
  const [tab, setTab] = useState("all");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [sortBy, setSortBy] = useState("release");
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const toggleAdvancedStats = () => {
    const nextOpen = !advancedOpen;
    setAdvancedOpen(nextOpen);
    if (nextOpen) {
      window.requestAnimationFrame(() => {
        document.getElementById("cc-advanced-stats")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  };

  const counts = {
    all: model.lists.all.length,
    movies: model.lists.movies.length,
    series: model.lists.series.length,
    watching: model.lists.watching.length,
    favorites: model.lists.favorites.length,
  };
  const q = query.trim().toLowerCase();
  const filtered = model.lists[tab].filter((e) => !q || e.title.toLowerCase().includes(q));
  const sortEntries = (items) => items.slice().sort((a, b) => {
    if (sortBy === "date") {
      const ad = a.date || "0000-00-00", bd = b.date || "0000-00-00";
      return bd.localeCompare(ad) || a.order - b.order;
    }
    if (sortBy === "rating") {
      const ar = Number(a.rating || 0), br = Number(b.rating || 0);
      return (br - ar) || a.order - b.order;
    }
    if (sortBy === "phase") return (a.phase - b.phase) || a.order - b.order;
    return a.order - b.order;
  });
  const ordered = sortEntries(filtered);
  const shown = expanded ? ordered : ordered.slice(0, PAGE_SIZE);
  const pick = (id) => { setTab(id); setExpanded(false); };
  useEffect(() => {
    const el = document.getElementById("cc-tab-" + tab);
    const bar = el && el.parentElement;
    if (bar && bar.scrollWidth > bar.clientWidth) {
      const e = el.getBoundingClientRect(), r = bar.getBoundingClientRect();
      bar.scrollLeft += (e.left - r.left) - (bar.clientWidth - e.width) / 2;   // centre the active tab; the browser clamps at the ends
    }
  }, [tab]);

  const onTabKey = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === tab);
    const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    pick(next.id);
    const el = document.getElementById("cc-tab-" + next.id);
    if (el) el.focus();
  };

  const [emptyTitle, emptyText] = q ? ["No matches", "Nothing in this list matches “" + query.trim() + "”."] : EMPTY[tab];

  return html`
    <section className="cc" aria-labelledby="cc-title">
      <header className="cc-head">
        <div className="cc-head-copy">
          <span className="eyebrow">COMMAND CENTER</span>
          <h2 id="cc-title">Your journey at a glance</h2>
          <p className="cc-sub">
            <b>${model.done}</b> of <b>${model.total}</b> titles completed${model.episodes.total ? html` · <b>${model.episodes.watched}</b> of <b>${model.episodes.total}</b> episodes watched` : null}
          </p>
        </div>
        <div className="cc-head-actions">
          <button type="button" className=${"cc-advanced-toggle" + (advancedOpen ? " active" : "")} onClick=${toggleAdvancedStats} aria-expanded=${advancedOpen} aria-controls="cc-advanced-stats">
            <span>Advanced stats</span><small>${advancedOpen ? "Hide details" : "Personal insights"}</small><b>${advancedOpen ? "−" : "+"}</b>
          </button>
          <div className="cc-ring" role="img" aria-label=${model.percent + " percent complete"} style=${{ "--progress": model.percent * 3.6 + "deg" }}>
            <strong>${model.percent}<span>%</span></strong>
            <small>complete</small>
          </div>
        </div>
      </header>

      <div className="cc-stats">
        <${Stat} tone="red" label="Movies completed" value=${model.movies.done} total=${model.movies.total} active=${tab === "movies"} onPick=${() => pick("movies")} />
        <${Stat} tone="blue" label="Seasons completed" value=${model.seasons.done} total=${model.seasons.total} active=${tab === "series"} onPick=${() => pick("series")} />
        <${Stat} tone="green" label="Episodes watched" value=${model.episodes.watched} total=${model.episodes.total} active=${tab === "series"} onPick=${() => pick("series")} />
        <${Stat} tone="gold" label="Currently watching" value=${model.watchingCount} hint="in progress" active=${tab === "watching"} onPick=${() => pick("watching")} />
        <${Stat} tone="purple" label="Favorites" value=${model.favoriteCount} hint="starred titles" active=${tab === "favorites"} onPick=${() => pick("favorites")} />
      </div>

      <div className="cc-tracker">
        <div className="cc-tools">
          <div className="cc-tabs" role="tablist" aria-label="What you have watched" onKeyDown=${onTabKey}>
            ${TABS.map((t) => html`
              <button key=${t.id} type="button" role="tab" id=${"cc-tab-" + t.id} aria-selected=${tab === t.id} aria-controls="cc-panel"
                tabIndex=${tab === t.id ? 0 : -1} className=${"cc-tab" + (tab === t.id ? " active" : "")} onClick=${() => pick(t.id)}>
                ${t.label}<span className="cc-count">${counts[t.id]}</span>
              </button>`)}
          </div>
          <div className="cc-order">
            <label htmlFor="cc-order-select">Order by</label>
            <select id="cc-order-select" value=${sortBy} onChange=${(e) => { setSortBy(e.target.value); setExpanded(false); }} aria-label="Order watched titles by">
              ${SORT_OPTIONS.map((option) => html`<option key=${option.id} value=${option.id}>${option.label}</option>`)}
            </select>
          </div>
          <div className="cc-filter">
            <input type="search" value=${query} onInput=${(e) => { setQuery(e.target.value); setExpanded(false); }} placeholder="Filter titles…" aria-label="Filter titles in this list" />
          </div>
        </div>

        <div id="cc-panel" role="tabpanel" aria-labelledby=${"cc-tab-" + tab}>
          ${shown.length
            ? html`<ul className="cc-list">
                ${shown.map((e) => (e.kind === "show"
                  ? html`<${ShowRow} key=${e.key} entry=${e} onOpen=${onOpen} />`
                  : html`<${ItemRow} key=${e.key} entry=${e} onOpen=${onOpen} />`))}
              </ul>`
            : html`<div className="cc-empty">
                <strong>${emptyTitle}</strong>
                <p>${emptyText}</p>
                ${!q && (tab === "all" || tab === "movies" || tab === "series")
                  ? html`<button type="button" className="btn" onClick=${() => onNavigate("timeline")}>Open the timeline →</button>`
                  : null}
              </div>`}
          ${ordered.length > PAGE_SIZE
            ? html`<div className="cc-foot">
                <span>Showing ${shown.length} of ${ordered.length}</span>
                <button type="button" className="text-btn" onClick=${() => setExpanded(!expanded)} aria-expanded=${expanded}>${expanded ? "Show fewer" : "Show all " + ordered.length + " →"}</button>
              </div>`
            : null}
        </div>
      </div>

      ${advancedOpen
        ? html`<div id="cc-advanced-stats" className="cc-advanced-stats">
            <${JourneyInsights} visible=${visible} userData=${userData} onOpen=${onOpen} onNavigate=${onNavigate} />
          </div>`
        : null}
    </section>
  `;
}
