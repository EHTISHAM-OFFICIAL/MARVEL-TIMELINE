import { html, useMemo, useState } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { StatusDot } from "../components/StatusBadge.js";
import { PosterProjectCard } from "../components/PosterProjectCard.js";
import { statusOf, passesMode, isSeries, episodeProgress, expandProjectsBySeasons, displayReleaseOrder } from "../utils/helpers.js";
import { TrophyRoom } from "../components/TrophyRoom.js";
import { ShareCard } from "../components/ShareCard.js";
import { computeAchievements } from "../utils/achievements.js";
import { useSiteConfig, themeMode } from "../store/siteConfig.js";

export function Progress({ userData, onOpen, displayName = "" }) {
  const prefs = userData.preferences;
  const [journeyLayout, setJourneyLayout] = useState("grid");
  const visible = useMemo(
    () =>
      expandProjectsBySeasons(PROJECTS).filter(
        (p) =>
          passesMode(p, prefs.explorationMode) &&
          !prefs.hiddenUniverses.includes(p.universe),
      ),
    [prefs],
  );

  const order = useMemo(
    () =>
      visible.slice().sort((a, b) => displayReleaseOrder(a) - displayReleaseOrder(b)),
    [visible],
  );

  const completed = order.filter(
    (p) => statusOf(p.id, userData) === "completed",
  );
  const watching = order.filter((p) => statusOf(p.id, userData) === "watching");
  const episodeStats = order.reduce((acc, p) => {
    if (!isSeries(p)) return acc;
    const ep = episodeProgress(p, userData);
    acc.watched += ep.watched;
    acc.total += ep.total;
    return acc;
  }, { watched: 0, total: 0 });
  const next = order.find((p) => statusOf(p.id, userData) === "not-started");

  const completedMovies = completed.filter((p) => !isSeries(p)).length;
  const completedShows = completed.filter((p) => isSeries(p)).length;

  // Trophies come from the shared engine (utils/achievements.js) so this page and the unlock toasts always agree.
  const siteConfig = useSiteConfig();
  const trophies = useMemo(
    () => computeAchievements(userData, { isLightTheme: (id) => themeMode(siteConfig.themes?.[id]?.vars) === "light" }),
    [userData, siteConfig.themes],
  );

  return html`
    <div>
      <div className="page-heading-row">
        <div>
          <h1>MY MARVEL JOURNEY</h1>
          <p className="subtitle">
            Your visual progress through the Marvel catalog
          </p>
        </div>
        <${ShareCard}
          name=${displayName}
          brand=${siteConfig.site?.brand}
          trophies=${trophies}
          stats=${{ percent: order.length ? Math.round((completed.length / order.length) * 100) : 0, movies: completedMovies, shows: completedShows, episodes: episodeStats.watched }}
        />
      </div>

      <div className="stat-grid" style=${{ marginBottom: "24px" }}>
        <div className="stat">
          <div className="num">${completedMovies}</div>
          <div className="label">Movies completed</div>
        </div>
        <div className="stat">
          <div className="num">${completedShows}</div>
          <div className="label">Series / TV shows completed</div>
        </div>
        <div className="stat">
          <div className="num">${watching.length}</div>
          <div className="label">Currently watching</div>
        </div>
        <div className="stat">
          <div className="num">
            ${order.length - completed.length - watching.length}
          </div>
          <div className="label">Remaining</div>
        </div>
        <div className="stat">
          <div className="num">${episodeStats.watched}<small>/${episodeStats.total}</small></div>
          <div className="label">Episodes Watched</div>
        </div>
      </div>

      <${TrophyRoom} result=${trophies} />

      <div className="section-header">
        <div>
          <h2>Release-Order Journey</h2>
          <p className="text-faint">Browse the tracked catalog as posters or compact rows.</p>
        </div>
        <div className="view-toggle" aria-label="Journey layout">
          <button className=${journeyLayout === "grid" ? "active" : ""} onClick=${() => setJourneyLayout("grid")}>▦ Grid</button>
          <button className=${journeyLayout === "list" ? "active" : ""} onClick=${() => setJourneyLayout("list")}>☰ List</button>
        </div>
      </div>
      ${journeyLayout === "grid"
        ? html`<div className="poster-grid">${order.map((p) => html`<${PosterProjectCard} key=${p.id} project=${p} userData=${userData} onOpen=${onOpen} />`)}</div>`
        : html`<div className="row-list">${order.map((p) => {
            const status = statusOf(p.id, userData);
            const isNext = next && next.id === p.id;
            return html`<div key=${p.id} className="row" onClick=${() => onOpen(p.id)} style=${isNext ? { borderColor: "var(--red)", background: "color-mix(in srgb, var(--red) 7%, transparent)" } : {}}>
              <${StatusDot} status=${status} />
              <div className="r-title">${p.title}</div>
              <div className="r-meta">${p.releaseYear}</div>
              ${isNext ? html`<span className="badge core">Next up</span>` : null}
            </div>`;
          })}</div>`}
    </div>
  `;
}
