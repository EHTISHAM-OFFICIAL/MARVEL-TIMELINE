import { html } from "htm/react";
import { useState, useEffect } from "htm/react";
import {
  getProject,
  getUniverse,
  formatRuntime,
  STATUS_META,
  CONNECTION_LABELS,
} from "../utils/helpers.js";
import { SpoilerSection } from "./SpoilerSection.js";

export function ProjectDetail({ projectId, userData, actions, onClose }) {
  const project = getProject(projectId);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!project) return null;
  const userP = userData.projects[project.id] || {};
  const status = userP.status || "not-started";
  const u = getUniverse(project.universe);
  const spoilersShown =
    userData.preferences.showAllSpoilers || userP.spoilersRevealed;
  const runtime = formatRuntime(project.runtimeMinutes);

  const related = (project.relatedProjects || [])
    .map(getProject)
    .filter(Boolean);
  const previous = (project.previous || []).map(getProject).filter(Boolean);
  const following = (project.following || []).map(getProject).filter(Boolean);

  return html`
    <div className="modal-backdrop" onClick=${onClose}>
      <div
        className="modal"
        style=${{ "--accent": u.color }}
        onClick=${(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <button className="close" onClick=${onClose} aria-label="Close">
            ×
          </button>
          <div
            style=${{
              fontSize: "10px",
              color: "var(--text-faint)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
            ${project.type.replace(/-/g, " ")}
          </div>
          <h2>${project.title}</h2>
        </div>
        <div className="modal-body">
          <div className="meta-row">
            <span className="badge">${project.releaseYear}</span>
            ${runtime ? html`<span className="badge">${runtime}</span>` : null}
            ${project.seasons
              ? html`<span className="badge"
                  >${project.seasons}
                  season${project.seasons > 1 ? "s" : ""}</span
                >`
              : null}
            ${project.episodes
              ? html`<span className="badge"
                  >${project.episodes} episodes</span
                >`
              : null}
            ${project.phase
              ? html`<span className="badge phase"
                  >Phase ${project.phase}</span
                >`
              : null}
            <span
              className="badge"
              style=${{ borderColor: u.color, color: u.color }}
              >${u.name}</span
            >
            ${u.earth && u.earth !== "—"
              ? html`<span className="badge">${u.earth}</span>`
              : null}
            <span className="badge legacy"
              >${CONNECTION_LABELS[project.connectionLevel] ||
              project.connectionLevel}</span
            >
          </div>

          <div className="detail-section">
            <h3>About</h3>
            <p>${project.shortDescription}</p>
          </div>

          <div className="detail-section">
            <h3>Why It Matters</h3>
            <p>${project.whyItMatters}</p>
          </div>

          ${project.chronologicalNote
            ? html`
                <div className="detail-section">
                  <h3>Timeline Note</h3>
                  <p className="text-dim" style=${{ fontSize: "13px" }}>
                    ${project.chronologicalNote}
                  </p>
                </div>
              `
            : null}
          ${project.spoilerConnections
            ? html`
                <div className="detail-section">
                  <h3>Connections</h3>
                  <${SpoilerSection}
                    text=${project.spoilerConnections}
                    revealed=${spoilersShown}
                    onReveal=${() => actions.revealSpoilers(project.id)}
                  />
                </div>
              `
            : null}
          ${project.characters && project.characters.length
            ? html`
                <div className="detail-section">
                  <h3>Key Characters</h3>
                  <div className="flex gap-8" style=${{ flexWrap: "wrap" }}>
                    ${project.characters.map(
                      (c) => html`<span key=${c} className="badge">${c}</span>`,
                    )}
                  </div>
                </div>
              `
            : null}
          ${previous.length > 0 || following.length > 0
            ? html`
                <div className="detail-section">
                  <h3>Timeline Neighbors</h3>
                  <div
                    style=${{
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      fontSize: "13px",
                    }}
                  >
                    ${previous.length > 0
                      ? html`<div>
                          <span className="text-faint">Previous:</span>
                          ${previous.map((p) => p.title).join(", ")}
                        </div>`
                      : null}
                    ${following.length > 0
                      ? html`<div>
                          <span className="text-faint">Following:</span>
                          ${following.map((p) => p.title).join(", ")}
                        </div>`
                      : null}
                  </div>
                </div>
              `
            : null}
          ${related.length > 0
            ? html`
                <div className="detail-section">
                  <h3>Related Projects</h3>
                  <div className="flex gap-8" style=${{ flexWrap: "wrap" }}>
                    ${related.map(
                      (p) =>
                        html`<span key=${p.id} className="badge"
                          >${p.title}</span
                        >`,
                    )}
                  </div>
                </div>
              `
            : null}

          <div
            className="detail-section"
            style=${{
              borderTop: "1px solid var(--border)",
              paddingTop: "20px",
              marginTop: "24px",
            }}
          >
            <div className="flex-between mb-16">
              <h3 style=${{ margin: 0 }}>My Tracking</h3>
              <button
                className=${"favorite-btn " + (userP.favorite ? "on" : "")}
                onClick=${() => actions.toggleFavorite(project.id)}
                aria-label="Toggle favorite"
              >
                ${userP.favorite ? "★" : "☆"}
              </button>
            </div>

            <div style=${{ marginBottom: "16px" }}>
              <label>Status</label>
              <div className="status-selector">
                ${Object.entries(STATUS_META).map(
                  ([key, meta]) => html`
                    <button
                      key=${key}
                      className=${"status-btn " +
                      (status === key ? "active" : "")}
                      onClick=${() => actions.setStatus(project.id, key)}
                    >
                      <span>${meta.dot}</span> ${meta.label}
                    </button>
                  `,
                )}
              </div>
            </div>

            <div style=${{ marginBottom: "16px" }}>
              <label
                >My Rating
                ${userP.rating ? "— " + userP.rating + "/10" : ""}</label
              >
              <div className="rating">
                ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(
                  (n) => html`
                    <button
                      key=${n}
                      className=${"rating-star " +
                      (userP.rating >= n ? "on" : "")}
                      onClick=${() =>
                        actions.setRating(
                          project.id,
                          userP.rating === n ? 0 : n,
                        )}
                      aria-label=${"Rate " + n + "/10"}
                    >
                      ★
                    </button>
                  `,
                )}
                ${userP.rating > 0
                  ? html`
                      <button
                        className="btn ghost sm"
                        style=${{ marginLeft: "8px" }}
                        onClick=${() => actions.setRating(project.id, 0)}
                      >
                        Clear
                      </button>
                    `
                  : null}
              </div>
            </div>

            <div style=${{ marginBottom: "16px" }}>
              <label>Watched Date</label>
              <input
                type="date"
                value=${userP.watchedDate || ""}
                onChange=${(e) =>
                  actions.setWatchedDate(project.id, e.target.value)}
              />
            </div>

            <div>
              <label>My Notes</label>
              <textarea
                value=${userP.notes || ""}
                onChange=${(e) => actions.setNotes(project.id, e.target.value)}
                placeholder="Personal thoughts, context, where it fits..."
              ></textarea>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
