import { html } from "htm/react";
import { useMemo } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { ProjectCard } from "../components/ProjectCard.js";
import { passesMode } from "../utils/helpers.js";

export function Animation({ userData, onOpen }) {
  const prefs = userData.preferences;
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
      <h1>Animation</h1>
      <p className="subtitle">
        MCU-adjacent and separate-universe animated projects.
      </p>
      <div className="grid">
        ${animation.map(
          (p) =>
            html`<${ProjectCard}
              key=${p.id}
              project=${p}
              userData=${userData}
              onOpen=${onOpen}
            />`,
        )}
      </div>
      ${animation.length === 0
        ? html`
            <div className="empty">
              <div className="empty-ico">○</div>
              <div className="empty-title">
                No animated projects match your filters
              </div>
            </div>
          `
        : null}
    </div>
  `;
}
