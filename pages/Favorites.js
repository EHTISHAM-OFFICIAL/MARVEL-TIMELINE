import { html, useState } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { ProjectCard } from "../components/ProjectCard.js";
import { PosterProjectCard } from "../components/PosterProjectCard.js";
import { expandProjectsBySeasons, displayReleaseOrder } from "../utils/helpers.js";

export function Favorites({ userData, onOpen }) {
  const [layout, setLayout] = useState("grid");
  const favs = expandProjectsBySeasons(PROJECTS).filter((p) => (userData.projects[p.baseProjectId || p.id] || {}).favorite).sort((a, b) => displayReleaseOrder(a) - displayReleaseOrder(b));
  return html`
    <div>
      <div className="page-heading-row">
        <div>
          <h1>Favorites</h1>
          <p className="subtitle">${favs.length} favorite project${favs.length !== 1 ? "s" : ""}</p>
        </div>
        ${favs.length ? html`<div className="view-toggle" aria-label="Favorites layout">
          <button className=${layout === "grid" ? "active" : ""} onClick=${() => setLayout("grid")}>▦ Grid</button>
          <button className=${layout === "list" ? "active" : ""} onClick=${() => setLayout("list")}>☰ List</button>
        </div>` : null}
      </div>
      ${favs.length > 0
        ? layout === "grid"
          ? html`<div className="poster-grid">${favs.map((p) => html`<${PosterProjectCard} key=${p.id} project=${p} userData=${userData} onOpen=${onOpen} />`)}</div>`
          : html`<div className="grid">${favs.map((p) => html`<${ProjectCard} key=${p.id} project=${p} userData=${userData} onOpen=${onOpen} />`)}</div>`
        : html`<div className="empty">
            <div className="empty-ico">★</div>
            <div className="empty-title">No favorites yet</div>
            <div className="empty-desc">Star projects from their detail page.</div>
          </div>`}
    </div>
  `;
}