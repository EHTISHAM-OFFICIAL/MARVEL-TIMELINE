import { html } from "htm/react";
import { useEffect } from "htm/react";
import {
  getProject, getUniverse, formatRuntime, STATUS_META, CONNECTION_LABELS,
  isSeries, episodeProgress,
} from "../utils/helpers.js";
import { SpoilerSection } from "./SpoilerSection.js";

export function ProjectDetail({ projectId, userData, actions, onClose }) {
  const project = getProject(projectId);
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  if (!project) return null;

  const baseProjectId = project.baseProjectId || project.id;
  const userP = userData.projects[baseProjectId] || {};
  const seasonOffset = project.seasonNumber && Array.isArray(getProject(baseProjectId)?.episodesBySeason)
    ? getProject(baseProjectId).episodesBySeason
        .slice(0, project.seasonNumber - 1)
        .reduce((a, b) => a + b, 0)
    : 0;
  const status = userP.status || "not-started";
  const u = getUniverse(project.universe);
  const spoilersShown = userData.preferences.showAllSpoilers || userP.spoilersRevealed;
  const runtime = formatRuntime(project.runtimeMinutes);
  const series = isSeries(project);
  const ep = episodeProgress(project, userData);
  const watchedEpisodes = userP.episodes || {};
  const related = (project.relatedProjects || []).map(getProject).filter(Boolean);
  const previous = (project.previous || []).map(getProject).filter(Boolean);
  const following = (project.following || []).map(getProject).filter(Boolean);

  return html`
    <div className="modal-backdrop" onClick=${onClose}>
      <div className="modal" style=${{ "--accent": u.color }} onClick=${(e) => e.stopPropagation()}>
        <div className="modal-header">
          <button className="close" onClick=${onClose} aria-label="Close">×</button>
          <div className="modal-kicker">${project.type.replace(/-/g, " ")}</div>
          <h2>${project.title}</h2>
        </div>
        <div className="modal-body">
          <div className="meta-row">
            <span className="badge">${project.releaseYear}</span>
            ${runtime ? html`<span className="badge">${runtime}</span>` : null}
            ${project.seasons ? html`<span className="badge">${project.seasons} season${project.seasons > 1 ? "s" : ""}</span>` : null}
            ${project.episodes ? html`<span className="badge">${project.episodes} episodes</span>` : null}
            ${project.phase ? html`<span className="badge phase">Phase ${project.phase}</span>` : null}
            <span className="badge" style=${{ borderColor: u.color, color: u.color }}>${u.name}</span>
            ${u.earth && u.earth !== "—" ? html`<span className="badge">${u.earth}</span>` : null}
            <span className="badge legacy">${CONNECTION_LABELS[project.connectionLevel] || project.connectionLevel}</span>
          </div>

          <div className="detail-section"><h3>About</h3><p>${project.shortDescription}</p></div>
          <div className="detail-section"><h3>Why It Matters</h3><p>${project.whyItMatters}</p></div>
          ${project.chronologicalNote ? html`
            <div className="detail-section"><h3>Timeline Note</h3><p className="text-dim">${project.chronologicalNote}</p></div>
          ` : null}
          ${project.spoilerConnections ? html`
            <div className="detail-section">
              <h3>Connections</h3>
              <${SpoilerSection} text=${project.spoilerConnections} revealed=${spoilersShown} onReveal=${() => actions.revealSpoilers(baseProjectId)} />
            </div>
          ` : null}
          ${project.characters?.length ? html`
            <div className="detail-section"><h3>Key Characters</h3><div className="flex gap-8" style=${{ flexWrap: "wrap" }}>
              ${project.characters.map((c) => html`<span key=${c} className="badge">${c}</span>`)}
            </div></div>
          ` : null}
          ${previous.length || following.length ? html`
            <div className="detail-section"><h3>Timeline Neighbors</h3><div className="relationship-list">
              ${previous.length ? html`<div><span className="text-faint">Previous:</span> ${previous.map((p) => p.title).join(", ")}</div>` : null}
              ${following.length ? html`<div><span className="text-faint">Following:</span> ${following.map((p) => p.title).join(", ")}</div>` : null}
            </div></div>
          ` : null}
          ${related.length ? html`
            <div className="detail-section"><h3>Related Projects</h3><div className="flex gap-8" style=${{ flexWrap: "wrap" }}>
              ${related.map((p) => html`<span key=${p.id} className="badge">${p.title}</span>`)}
            </div></div>
          ` : null}

          ${series && ep.total ? html`
            <div className="detail-section episode-tracker">
              <div className="episode-heading">
                <div><h3>Episode Tracker</h3><p className="text-dim">Track every episode individually. Episode names are not invented when the dataset does not include them.</p></div>
                <strong>${ep.watched}/${ep.total}</strong>
              </div>
              <div className="episode-summary">
                <div className="progress"><div style=${{ width: ep.percent + "%" }}></div></div>
                <span>${ep.percent}% complete</span>
                <div className="episode-actions">
                  <button className="btn ghost sm" onClick=${() => actions.markAllEpisodes(baseProjectId, ep.total, true, seasonOffset)}>Mark all watched</button>
                  ${ep.watched ? html`<button className="btn ghost sm" onClick=${() => actions.markAllEpisodes(baseProjectId, ep.total, false, seasonOffset)}>Clear episodes</button>` : null}
                </div>
              </div>
              <div className="episode-grid">
                ${Array.from({ length: ep.total }, (_, episodeIndex) => {
                  const globalNumber = seasonOffset + episodeIndex + 1;
                  const watched = Boolean(watchedEpisodes[String(globalNumber)]);
                  const seasonLabel = project.seasonNumber
                    ? "S" + project.seasonNumber + " · E" + (episodeIndex + 1)
                    : "E" + (episodeIndex + 1);
                  return html`
                    <button key=${"s" + (project.seasonNumber || 1) + "e" + (episodeIndex + 1)} className=${"episode-row " + (watched ? "watched" : "")} onClick=${() => actions.toggleEpisode(baseProjectId, globalNumber)}>
                      <span className="episode-check">${watched ? "✓" : "○"}</span>
                      <span>${seasonLabel}</span>
                      <span className="episode-state">${watched ? "Watched" : "Not watched"}</span>
                    </button>
                  `;
                })}
              </div>
            </div>
          ` : null}

          <div className="detail-section tracking-section">
            <div className="flex-between mb-16">
              <div><h3 style=${{ margin: 0 }}>My Tracking</h3><span className="text-faint">Saved locally in this browser.</span></div>
              <button className=${"favorite-btn " + (userP.favorite ? "on" : "")} onClick=${() => actions.toggleFavorite(baseProjectId)} aria-label="Toggle favorite">${userP.favorite ? "★" : "☆"}</button>
            </div>
            <div style=${{ marginBottom: "16px" }}><label>Status</label><div className="status-selector">
              ${Object.entries(STATUS_META).map(([key, meta]) => html`
                <button key=${key} className=${"status-btn " + (status === key ? "active" : "")} onClick=${() => actions.setStatus(baseProjectId, key)}>
                  <span>${meta.dot}</span> ${meta.label}
                </button>`)}
            </div></div>
            <div style=${{ marginBottom: "16px" }}><label>My Rating ${userP.rating ? "— " + userP.rating + "/10" : ""}</label><div className="rating">
              ${[1,2,3,4,5,6,7,8,9,10].map((n) => html`
                <button key=${n} className=${"rating-star " + (userP.rating >= n ? "on" : "")} onClick=${() => actions.setRating(baseProjectId, userP.rating === n ? 0 : n)} aria-label=${"Rate " + n + "/10"}>★</button>`)}
            </div></div>
            <div style=${{ marginBottom: "16px" }}><label>Watched Date</label><input type="date" value=${userP.watchedDate || ""} onChange=${(e) => actions.setWatchedDate(baseProjectId, e.target.value)} /></div>
            <div><label>My Notes</label><textarea value=${userP.notes || ""} onChange=${(e) => actions.setNotes(baseProjectId, e.target.value)} placeholder="Personal thoughts, context, where it fits..."></textarea></div>
          </div>
        </div>
      </div>
    </div>
  `;
}
