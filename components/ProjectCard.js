import { html } from "htm/react";
import { StatusDot } from "./StatusBadge.js";
import { getUniverse, formatRuntime, statusOf, isSeries, episodeProgress, getProjectState } from "../utils/helpers.js";

export function ProjectCard({ project, userData, onOpen }) {
  const u = getUniverse(project.universe);
  const status = statusOf(project.id, userData);
  const userP = getProjectState(project, userData);
  const runtime = formatRuntime(project.runtimeMinutes);
  const ep = episodeProgress(project, userData);
  const length = ["movie", "special", "animated-movie"].includes(project.type)
    ? runtime
    : project.seasons
      ? project.seasons + " season" + (project.seasons > 1 ? "s" : "")
      : null;

  return html`
    <div
      className="card"
      style=${{ "--accent": u.color }}
      onClick=${() => onOpen(project.id)}
      role="button"
      tabindex=${0}
      onKeyDown=${(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(project.id);
        }
      }}
    >
      <div
        className="flex-between"
        style=${{ alignItems: "flex-start", gap: "6px" }}
      >
        <div className="type-badge">${project.type.replace(/-/g, " ")}</div>
        ${userP.favorite
          ? html`<span style=${{ color: "var(--gold)", fontSize: "13px" }}
              >★</span
            >`
          : null}
      </div>
      <div className="title">${project.title}</div>
      <div className="desc">${project.shortDescription}</div>
      ${isSeries(project) && ep.total
        ? html`
            <div className="card-episode-progress">
              <div className="flex-between"><span>Episodes</span><strong>${ep.watched}/${ep.total}</strong></div>
              <div className="progress"><div style=${{ width: ep.percent + "%" }}></div></div>
            </div>
          `
        : null}
      <div className="meta">
        <${StatusDot} status=${status} />
        <span>${project.releaseYear}</span>
        ${length ? html`<span>· ${length}</span>` : null}
        ${project.phase
          ? html`<span className="badge phase">P${project.phase}</span>`
          : null}
      </div>
    </div>
  `;
}
