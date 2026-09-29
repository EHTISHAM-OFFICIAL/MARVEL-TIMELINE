import { html } from "htm/react";
import { useState } from "htm/react";
import { FRANCHISES } from "../data/franchises.js";
import { PROJECTS } from "../data/projects.js";
import { getUniverse, getFranchise, passesMode } from "../utils/helpers.js";
import { ProjectCard } from "../components/ProjectCard.js";

export function Franchises({ userData, onOpen }) {
  const prefs = userData.preferences;
  const [activeFranchise, setActiveFranchise] = useState(null);
  const franchise = activeFranchise ? getFranchise(activeFranchise) : null;

  if (franchise) {
    const projects = PROJECTS.filter(
      (p) =>
        (p.franchises || []).includes(franchise.id) &&
        passesMode(p, prefs.explorationMode) &&
        !prefs.hiddenUniverses.includes(p.universe),
    );

    const byUniverse = {};
    projects.forEach((p) => {
      if (!byUniverse[p.universe]) byUniverse[p.universe] = [];
      byUniverse[p.universe].push(p);
    });

    return html`
      <div>
        <button
          className="btn ghost sm"
          onClick=${() => setActiveFranchise(null)}
          style=${{ marginBottom: "16px" }}
        >
          ← All Franchises
        </button>
        <h1>${franchise.name}</h1>
        <p className="subtitle">
          ${projects.length} projects across ${Object.keys(byUniverse).length}
          universe${Object.keys(byUniverse).length > 1 ? "s" : ""}
        </p>

        ${Object.entries(byUniverse).map(([uid, list]) => {
          const u = getUniverse(uid);
          return html`
            <div key=${uid} style=${{ marginBottom: "32px" }}>
              <div className="section-header">
                <h2 style=${{ color: u.color }}>${u.name}</h2>
                <span className="text-faint" style=${{ fontSize: "12px" }}
                  >${u.earth !== "—" ? u.earth : ""}</span
                >
              </div>
              <div className="grid">
                ${list
                  .sort((a, b) => a.releaseOrderIndex - b.releaseOrderIndex)
                  .map(
                    (p) => html`
                      <${ProjectCard}
                        key=${p.id}
                        project=${p}
                        userData=${userData}
                        onOpen=${onOpen}
                      />
                    `,
                  )}
              </div>
            </div>
          `;
        })}
        ${projects.length === 0
          ? html`
              <div className="empty">
                <div className="empty-ico">○</div>
                <div className="empty-title">No projects in view</div>
                <div className="empty-desc">Adjust filters in Settings.</div>
              </div>
            `
          : null}
      </div>
    `;
  }

  return html`
    <div>
      <h1>Franchises</h1>
      <p className="subtitle">
        Group projects by the characters and teams they follow.
      </p>
      <div className="grid wide">
        ${FRANCHISES.map((f) => {
          const projects = PROJECTS.filter(
            (p) =>
              (p.franchises || []).includes(f.id) &&
              passesMode(p, prefs.explorationMode),
          );
          return html`
            <div
              key=${f.id}
              className="universe-card"
              onClick=${() => setActiveFranchise(f.id)}
            >
              <div className="u-name">${f.name}</div>
              <div className="u-desc">
                ${projects.length} project${projects.length !== 1 ? "s" : ""}
              </div>
            </div>
          `;
        })}
      </div>
    </div>
  `;
}
