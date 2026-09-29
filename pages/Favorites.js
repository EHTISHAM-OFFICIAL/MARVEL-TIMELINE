import { html } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { ProjectCard } from "../components/ProjectCard.js";

export function Favorites({ userData, onOpen }) {
  const favs = PROJECTS.filter((p) => (userData.projects[p.id] || {}).favorite);
  return html`
    <div>
      <h1>Favorites</h1>
      <p className="subtitle">
        ${favs.length} favorite project${favs.length !== 1 ? "s" : ""}
      </p>
      ${favs.length > 0
        ? html`
            <div className="grid">
              ${favs.map(
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
        : html`
            <div className="empty">
              <div className="empty-ico">★</div>
              <div className="empty-title">No favorites yet</div>
              <div className="empty-desc">
                Star projects from their detail page.
              </div>
            </div>
          `}
    </div>
  `;
}
