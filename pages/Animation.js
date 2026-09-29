import { html, useMemo, useState } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { ProjectCard } from "../components/ProjectCard.js";
import { PosterProjectCard } from "../components/PosterProjectCard.js";
import { passesMode } from "../utils/helpers.js";

export function Animation({ userData, onOpen }) {
  const prefs = userData.preferences;
  const [layout, setLayout] = useState("grid");
  const animation = useMemo(
    () =>
      PROJECTS.filter(
        (p) =>
          (p.type === "animated-series" || p.type === "animated-movie") &&
          passesMode(p, prefs.explorationMode) &&
          !prefs.hiddenUniverses.includes(p.universe),
      ).sort((a, b) => a.releaseOrderIndex - b.releaseOrderIndex),
    [prefs],
  );

  return html`
    <div>
      <div className="page-heading-row">
        <div>
          <h1>Animation</h1>
          <p className="subtitle">
            MCU-adjacent and separate-universe animated projects.
          </p>
        </div>
        <div className="view-toggle">
          <button className=${layout === "grid" ? "active" : ""} onClick=${() => setLayout("grid")}>▦ Grid</button>
          <button className=${layout === "list" ? "active" : ""} onClick=${() => setLayout("list")}>☰ List</button>
        </div>
      </div>
      ${layout === "grid"
        ? html`<div className="poster-grid">
            ${animation.map(
              (p) => html`<${PosterProjectCard}
                key=${p.id}
                project=${p}
                userData=${userData}
                onOpen=${onOpen}
              />`,
            )}
          </div>`
        : html`<div className="grid">
            ${animation.map(
              (p) => html`<${ProjectCard}
                key=${p.id}
                project=${p}
                userData=${userData}
                onOpen=${onOpen}
              />`,
            )}
          </div>`}
      ${animation.length === 0
        ? html`<div className="empty">
            <div className="empty-ico">○</div>
            <div className="empty-title">
              No animated projects match your filters
            </div>
          </div>`
        : null}
    </div>
  `;
}