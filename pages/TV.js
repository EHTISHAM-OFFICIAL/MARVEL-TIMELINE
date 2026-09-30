import { html } from "htm/react";
import { useMemo, useState } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { ProjectCard } from "../components/ProjectCard.js";
import { PosterProjectCard } from "../components/PosterProjectCard.js";
import { passesMode } from "../utils/helpers.js";

export function TV({ userData, onOpen }) {
  const prefs = userData.preferences;
  const [layout, setLayout] = useState("grid");
  const shows = useMemo(
    () =>
      PROJECTS.filter(
        (p) =>
          p.type.includes("series") &&
          passesMode(p, prefs.explorationMode) &&
          !prefs.hiddenUniverses.includes(p.universe),
      ).sort((a, b) => a.releaseOrderIndex - b.releaseOrderIndex),
    [prefs.explorationMode, prefs.hiddenUniverses],
  );

  return html`
    <div>
      <div className="page-heading-row">
        <div>
          <h1>TV & Streaming</h1>
          <p className="subtitle">
            ${shows.length} seasons tracked. Multi-season shows are separated into
            individual season entries with their own episode counts.
          </p>
        </div>
        <div className="view-toggle" aria-label="TV layout">
          <button className=${layout === "grid" ? "active" : ""} onClick=${() => setLayout("grid")}>▦ Grid</button>
          <button className=${layout === "list" ? "active" : ""} onClick=${() => setLayout("list")}>☰ List</button>
        </div>
      </div>

      ${layout === "grid"
        ? html`<div className="poster-grid">
            ${shows.map(
              (p) =>
                html`<${PosterProjectCard}
                  key=${p.id}
                  project=${p}
                  userData=${userData}
                  onOpen=${onOpen}
                />`,
            )}
          </div>`
        : html`<div className="grid">
            ${shows.map(
              (p) =>
                html`<${ProjectCard}
                  key=${p.id}
                  project=${p}
                  userData=${userData}
                  onOpen=${onOpen}
                />`,
            )}
          </div>`}

      ${shows.length === 0
        ? html`
            <div className="empty">
              <div className="empty-ico">○</div>
              <div className="empty-title">No series match your filters</div>
            </div>
          `
        : null}
    </div>
  `;
}
