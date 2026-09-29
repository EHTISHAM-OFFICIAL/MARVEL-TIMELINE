import { html } from "htm/react";
import { useMemo } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { UNIVERSES } from "../data/universes.js";
import { ProjectCard } from "../components/ProjectCard.js";
import { ProgressBar } from "../components/ProgressBar.js";
import { getUniverse, statusOf, passesMode } from "../utils/helpers.js";

export function Home({ userData, onOpen, onNavigate }) {
  const prefs = userData.preferences;
  const visible = useMemo(
    () =>
      PROJECTS.filter(
        (p) =>
          passesMode(p, prefs.explorationMode) &&
          !prefs.hiddenUniverses.includes(p.universe),
      ),
    [prefs.explorationMode, prefs.hiddenUniverses],
  );

  const movies = visible.filter((p) =>
    ["movie", "animated-movie", "special"].includes(p.type),
  );
  const series = visible.filter((p) => p.type.includes("series"));

  const moviesDone = movies.filter(
    (p) => statusOf(p.id, userData) === "completed",
  ).length;
  const seriesDone = series.filter(
    (p) => statusOf(p.id, userData) === "completed",
  ).length;
  const total = visible.length;
  const done = visible.filter(
    (p) => statusOf(p.id, userData) === "completed",
  ).length;

  const continueWatching = visible.filter(
    (p) => statusOf(p.id, userData) === "watching",
  );
  const favorites = visible.filter(
    (p) => (userData.projects[p.id] || {}).favorite,
  );

  const recentlyCompleted = useMemo(() => {
    return visible
      .filter(
        (p) =>
          statusOf(p.id, userData) === "completed" &&
          (userData.projects[p.id] || {}).watchedDate,
      )
      .sort((a, b) => {
        const da = (userData.projects[a.id] || {}).watchedDate || "";
        const db = (userData.projects[b.id] || {}).watchedDate || "";
        return db.localeCompare(da);
      })
      .slice(0, 6);
  }, [visible, userData]);

  const nextUp = useMemo(() => {
    const order =
      prefs.defaultTimeline === "chronological"
        ? visible
            .filter((p) => p.chronologicalOrderIndex != null)
            .sort(
              (a, b) => a.chronologicalOrderIndex - b.chronologicalOrderIndex,
            )
        : visible
            .slice()
            .sort((a, b) => a.releaseOrderIndex - b.releaseOrderIndex);
    return order.find((p) => statusOf(p.id, userData) === "not-started");
  }, [visible, userData, prefs.defaultTimeline]);

  const byUniverse = useMemo(() => {
    const map = {};
    visible.forEach((p) => {
      if (!map[p.universe]) map[p.universe] = { total: 0, done: 0 };
      map[p.universe].total++;
      if (statusOf(p.id, userData) === "completed") map[p.universe].done++;
    });
    return map;
  }, [visible, userData]);

  const byPhase = useMemo(() => {
    const map = {};
    visible.forEach((p) => {
      if (!p.phase) return;
      if (!map[p.phase]) map[p.phase] = { total: 0, done: 0 };
      map[p.phase].total++;
      if (statusOf(p.id, userData) === "completed") map[p.phase].done++;
    });
    return map;
  }, [visible, userData]);

  return html`
    <div>
      <h1>MARVEL JOURNEY</h1>
      <p className="subtitle">Your personal tracking dashboard</p>

      <div className="stat-grid">
        <div className="stat">
          <div className="num">${done}<small> / ${total}</small></div>
          <div className="label">Overall Completion</div>
          <${ProgressBar} value=${done} max=${total} />
        </div>
        <div className="stat">
          <div className="num">
            ${moviesDone}<small> / ${movies.length}</small>
          </div>
          <div className="label">Movies & Specials</div>
          <${ProgressBar}
            value=${moviesDone}
            max=${movies.length}
            className="blue"
          />
        </div>
        <div className="stat">
          <div className="num">
            ${seriesDone}<small> / ${series.length}</small>
          </div>
          <div className="label">Series</div>
          <${ProgressBar}
            value=${seriesDone}
            max=${series.length}
            className="purple"
          />
        </div>
        <div className="stat">
          <div className="num">${favorites.length}</div>
          <div className="label">Favorites</div>
        </div>
      </div>

      ${nextUp
        ? html`
            <div className="section-header"><h2>Next Up</h2></div>
            <div
              className="card"
              style=${{
                "--accent": getUniverse(nextUp.universe).color,
                cursor: "pointer",
              }}
              onClick=${() => onOpen(nextUp.id)}
            >
              <div className="type-badge">
                ${prefs.defaultTimeline === "chronological"
                  ? "Story order"
                  : "Release order"}
              </div>
              <div className="title" style=${{ fontSize: "17px" }}>
                ${nextUp.title}
              </div>
              <div className="desc">${nextUp.shortDescription}</div>
              <div className="meta"><span>${nextUp.releaseYear}</span></div>
            </div>
          `
        : null}
      ${continueWatching.length > 0
        ? html`
            <div className="section-header"><h2>Continue Watching</h2></div>
            <div className="grid">
              ${continueWatching.map(
                (p) =>
                  html`<${ProjectCard}
                    key=${p.id}
                    project=${p}
                    userData=${userData}
                    onOpen=${onOpen}
                  />`,
              )}
            </div>
          `
        : null}
      ${recentlyCompleted.length > 0
        ? html`
            <div className="section-header"><h2>Recently Completed</h2></div>
            <div className="grid">
              ${recentlyCompleted.map(
                (p) =>
                  html`<${ProjectCard}
                    key=${p.id}
                    project=${p}
                    userData=${userData}
                    onOpen=${onOpen}
                  />`,
              )}
            </div>
          `
        : null}
      ${favorites.length > 0
        ? html`
            <div className="section-header"><h2>Favorites</h2></div>
            <div className="grid">
              ${favorites.map(
                (p) =>
                  html`<${ProjectCard}
                    key=${p.id}
                    project=${p}
                    userData=${userData}
                    onOpen=${onOpen}
                  />`,
              )}
            </div>
          `
        : null}

      <div className="section-header"><h2>Progress by Universe</h2></div>
      <div className="grid wide">
        ${Object.entries(byUniverse)
          .sort((a, b) => b[1].total - a[1].total)
          .map(([uid, stats]) => {
            const u = getUniverse(uid);
            return html`
              <div
                key=${uid}
                className="universe-card"
                onClick=${() => onNavigate("universes")}
              >
                <div className="earth" style=${{ color: u.color }}>
                  ${u.earth !== "—" ? u.earth : "—"}
                </div>
                <div className="u-name">${u.name}</div>
                <div className="u-desc">
                  ${stats.done} / ${stats.total} completed
                </div>
                <${ProgressBar} value=${stats.done} max=${stats.total} />
              </div>
            `;
          })}
      </div>

      <div className="section-header"><h2>Progress by MCU Phase</h2></div>
      <div className="grid wide">
        ${[1, 2, 3, 4, 5, 6].map((phase) => {
          const s = byPhase[phase];
          if (!s) return null;
          return html`
            <div
              key=${phase}
              className="universe-card"
              onClick=${() => onNavigate("timeline")}
            >
              <div className="earth">PHASE ${phase}</div>
              <div className="u-name">${s.done} / ${s.total} completed</div>
              <${ProgressBar} value=${s.done} max=${s.total} className="blue" />
            </div>
          `;
        })}
      </div>
    </div>
  `;
}
