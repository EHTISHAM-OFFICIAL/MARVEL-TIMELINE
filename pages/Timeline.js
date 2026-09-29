import { html } from "htm/react";
import { useState, useMemo } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { getUniverse, statusOf, passesMode } from "../utils/helpers.js";
import { StatusDot } from "../components/StatusBadge.js";

export function Timeline({ userData, onOpen }) {
  const prefs = userData.preferences;
  const [view, setView] = useState(
    prefs.defaultTimeline === "chronological" ? "chronological" : "release",
  );

  const visible = useMemo(
    () =>
      PROJECTS.filter(
        (p) =>
          passesMode(p, prefs.explorationMode) &&
          !prefs.hiddenUniverses.includes(p.universe),
      ),
    [prefs.explorationMode, prefs.hiddenUniverses],
  );

  const sorted = useMemo(() => {
    if (view === "chronological") {
      return visible
        .filter((p) => p.chronologicalOrderIndex != null)
        .sort((a, b) => a.chronologicalOrderIndex - b.chronologicalOrderIndex);
    }
    return visible
      .slice()
      .sort((a, b) => a.releaseOrderIndex - b.releaseOrderIndex);
  }, [visible, view]);

  const grouped = useMemo(() => {
    const groups = [];
    let current = null;
    sorted.forEach((p) => {
      let key;
      if (view === "phase") {
        key = p.phase
          ? "Phase " + p.phase
          : ["mcu-earth-616", "mcu-multiverse"].includes(p.universe)
            ? "MCU — no phase"
            : getUniverse(p.universe).name;
      } else if (view === "universe") {
        key = getUniverse(p.universe).name;
      } else {
        key = String(p.releaseYear);
      }
      if (!current || current.key !== key) {
        current = { key, items: [] };
        groups.push(current);
      }
      current.items.push(p);
    });
    return groups;
  }, [sorted, view]);

  const views = [
    ["release", "Release Order"],
    ["chronological", "Story Chronology"],
    ["phase", "By Phase"],
    ["universe", "By Universe"],
  ];

  return html`
    <div>
      <h1>Timeline</h1>
      <p className="subtitle">${sorted.length} projects in view</p>

      <div className="tabs">
        ${views.map(
          ([k, l]) => html`
            <button
              key=${k}
              className=${"tab " + (view === k ? "active" : "")}
              onClick=${() => setView(k)}
            >
              ${l}
            </button>
          `,
        )}
      </div>

      ${view === "chronological"
        ? html`
            <div
              className="spoiler"
              style=${{
                marginBottom: "20px",
                textAlign: "left",
                fontSize: "12.5px",
                color: "var(--text-dim)",
              }}
            >
              ⓘ Story chronology is an approximation. Projects with uncertain
              placement are indicated per-entry. Entries without a documented
              chronological position are hidden in this view.
            </div>
          `
        : null}
      ${grouped.map(
        (group) => html`
          <div key=${group.key} className="timeline-group">
            <div className="timeline-label">
              ${group.key} <small>${group.items.length}</small>
            </div>
            <div className="timeline-items">
              ${group.items.map((p) => {
                const status = statusOf(p.id, userData);
                const u = getUniverse(p.universe);
                return html`
                  <div
                    key=${p.id}
                    className="timeline-item"
                    onClick=${() => onOpen(p.id)}
                    style=${{ borderLeftColor: u.color }}
                  >
                    <div className="year">${p.releaseYear}</div>
                    <div className="t-title">
                      ${p.title}
                      ${p.phase
                        ? html`<span
                            className="badge phase"
                            style=${{ marginLeft: "8px" }}
                            >P${p.phase}</span
                          >`
                        : null}
                    </div>
                    <div className="t-meta">
                      ${u.name.split(" ").slice(0, 2).join(" ")}
                    </div>
                    <${StatusDot} status=${status} />
                  </div>
                `;
              })}
            </div>
          </div>
        `,
      )}
      ${sorted.length === 0
        ? html`
            <div className="empty">
              <div className="empty-ico">○</div>
              <div className="empty-title">No projects match your filters</div>
            </div>
          `
        : null}
    </div>
  `;
}
