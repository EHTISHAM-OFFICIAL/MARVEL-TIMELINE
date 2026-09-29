import { html } from "htm/react";
import { useMemo } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { ProjectCard } from "../components/ProjectCard.js";
import { passesMode } from "../utils/helpers.js";

export function TV({ userData, onOpen }) {
  const prefs = userData.preferences;
  const shows = useMemo(
    () =>
      PROJECTS.filter(
        (p) =>
          p.type.includes("series") &&
          passesMode(p, prefs.explorationMode) &&
          !prefs.hiddenUniverses.includes(p.universe),
      ).sort((a, b) => a.releaseOrderIndex - b.releaseOrderIndex),
    [prefs],
  );

  return html`
    <div>
      <h1>TV & Streaming</h1>
      <p className="subtitle">
        ${shows.length} television projects tracked. TV is treated as
        first-class content.
      </p>
      <div className="grid">
        ${shows.map(
          (p) =>
            html`<${ProjectCard}
              key=${p.id}
              project=${p}
              userData=${userData}
              onOpen=${onOpen}
            />`,
        )}
      </div>
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
