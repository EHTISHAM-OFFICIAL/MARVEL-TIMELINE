import { html } from "htm/react";
import { UNIVERSES } from "../data/universes.js";
import { PROJECTS } from "../data/projects.js";
import { statusOf } from "../utils/helpers.js";
import { ProgressBar } from "../components/ProgressBar.js";

export function Universes({ userData, onOpen, onNavigate, actions }) {
  const prefs = userData.preferences;
  return html`
    <div>
      <h1>Universes & Continuities</h1>
      <p className="subtitle">
        Marvel projects span multiple continuities. Each is tracked separately.
      </p>

      <div className="grid wide">
        ${UNIVERSES.map((u) => {
          const projects = PROJECTS.filter((p) => p.universe === u.id);
          const done = projects.filter(
            (p) => statusOf(p.id, userData) === "completed",
          ).length;
          const hidden = prefs.hiddenUniverses.includes(u.id);
          return html`
            <div
              key=${u.id}
              className="universe-card"
              style=${{ opacity: hidden ? 0.5 : 1 }}
            >
              <div className="earth" style=${{ color: u.color }}>
                ${u.earth !== "—" ? u.earth : u.id.toUpperCase()}
              </div>
              <div className="u-name">${u.name}</div>
              <div className="u-desc" style=${{ marginBottom: "10px" }}>
                ${u.description}
              </div>
              <div className="flex-between">
                <span className="text-faint" style=${{ fontSize: "11.5px" }}
                  >${done} / ${projects.length} completed</span
                >
                <button
                  className="btn ghost sm"
                  onClick=${() => actions.toggleUniverseHidden(u.id)}
                >
                  ${hidden ? "Show" : "Hide"}
                </button>
              </div>
              <${ProgressBar} value=${done} max=${projects.length} />
              ${projects.length > 0
                ? html`
                    <div
                      className="flex gap-8"
                      style=${{ marginTop: "10px", flexWrap: "wrap" }}
                    >
                      ${projects
                        .slice(0, 4)
                        .map(
                          (p) => html`
                            <span
                              key=${p.id}
                              className="badge"
                              style=${{ cursor: "pointer" }}
                              onClick=${() => onOpen(p.id)}
                              >${p.title}</span
                            >
                          `,
                        )}
                      ${projects.length > 4
                        ? html`<span className="badge"
                            >+${projects.length - 4} more</span
                          >`
                        : null}
                    </div>
                  `
                : null}
            </div>
          `;
        })}
      </div>
    </div>
  `;
}
