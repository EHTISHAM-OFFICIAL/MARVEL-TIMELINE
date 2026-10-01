import { html } from "htm/react";
import { useState } from "htm/react";
import { FRANCHISES } from "../data/franchises.js";
import { PROJECTS } from "../data/projects.js";
import { getUniverse, getFranchise, passesMode } from "../utils/helpers.js";
import { ProjectCard } from "../components/ProjectCard.js";
import { PosterProjectCard } from "../components/PosterProjectCard.js";

export function Franchises({ userData, onOpen }) {
  const prefs = userData.preferences;
  const [activeFranchise, setActiveFranchise] = useState(null);
  const [layout, setLayout] = useState("grid");
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
        <div className="page-heading-row">
          <div>
            <button className="btn ghost sm" onClick=${() => setActiveFranchise(null)} style=${{ marginBottom: "12px" }}>← All Franchises</button>
            <h1>${franchise.name}</h1>
            <p className="subtitle">
              ${projects.length} projects across ${Object.keys(byUniverse).length}
              universe${Object.keys(byUniverse).length > 1 ? "s" : ""}
            </p>
          </div>
          <div className="view-toggle" aria-label="Franchise layout">
            <button className=${layout === "grid" ? "active" : ""} onClick=${() => setLayout("grid")}>▦ Grid</button>
            <button className=${layout === "list" ? "active" : ""} onClick=${() => setLayout("list")}>☰ List</button>
          </div>
        </div>

        ${Object.entries(byUniverse).map(([uid, list]) => {
          const u = getUniverse(uid);
          const sorted = list.slice().sort((a, b) => a.releaseOrderIndex - b.releaseOrderIndex);
          return html`
            <div key=${uid} style=${{ marginBottom: "32px" }}>
              <div className="section-header">
                <h2 style=${{ color: "color-mix(in srgb, " + u.color + " 62%, var(--text))" }}>${u.name}</h2>
                <span className="text-faint" style=${{ fontSize: "12px" }}>
                  ${u.earth !== "—" ? u.earth : ""}
                </span>
              </div>
              ${layout === "grid"
                ? html`<div className="poster-grid">
                    ${sorted.map(
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
                    ${sorted.map(
                      (p) =>
                        html`<${ProjectCard}
                          key=${p.id}
                          project=${p}
                          userData=${userData}
                          onOpen=${onOpen}
                        />`,
                    )}
                  </div>`}
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
