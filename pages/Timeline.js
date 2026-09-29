import { html } from "htm/react";
import { useState, useMemo } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { getUniverse, statusOf, passesMode } from "../utils/helpers.js";
import { StatusDot } from "../components/StatusBadge.js";

export function Timeline({ userData, onOpen }) {
  const prefs = userData.preferences;
  const [view, setView] = useState(prefs.defaultTimeline === "chronological" ? "chronological" : "release");
  const visible = useMemo(() => PROJECTS.filter((p) => passesMode(p, prefs.explorationMode) && !prefs.hiddenUniverses.includes(p.universe)), [prefs.explorationMode, prefs.hiddenUniverses]);

  const sorted = useMemo(() => {
    const list = visible.slice();
    if (view === "chronological") return list.sort((a,b) => (a.chronologicalOrderIndex ?? Number.MAX_SAFE_INTEGER) - (b.chronologicalOrderIndex ?? Number.MAX_SAFE_INTEGER) || a.releaseOrderIndex - b.releaseOrderIndex);
    if (view === "phase") return list.sort((a,b) => (a.phase ?? Number.MAX_SAFE_INTEGER) - (b.phase ?? Number.MAX_SAFE_INTEGER) || a.releaseOrderIndex - b.releaseOrderIndex);
    if (view === "universe") return list.sort((a,b) => getUniverse(a.universe).name.localeCompare(getUniverse(b.universe).name) || a.releaseOrderIndex - b.releaseOrderIndex);
    return list.sort((a,b) => a.releaseOrderIndex - b.releaseOrderIndex);
  }, [visible, view]);

  const grouped = useMemo(() => {
    const groups = [];
    const byKey = new Map();
    sorted.forEach((p) => {
      let key;
      if (view === "phase") key = p.phase ? "Phase " + p.phase : (["mcu-earth-616","mcu-multiverse"].includes(p.universe) ? "MCU — no phase" : getUniverse(p.universe).name);
      else if (view === "universe") key = getUniverse(p.universe).name;
      else key = view === "chronological" ? "Story Chronology" : String(p.releaseYear);
      if (!byKey.has(key)) { const group = { key, items: [] }; byKey.set(key, group); groups.push(group); }
      byKey.get(key).items.push(p);
    });
    return groups;
  }, [sorted, view]);

  const views = [["release","Release Order"],["chronological","Story Chronology"],["phase","By Phase"],["universe","By Universe"]];

  return html`
    <div className="timeline-page">
      <div className="page-heading-row"><div><h1>Timeline</h1><p className="subtitle">${sorted.length} projects · ${view === "release" ? "release order" : view === "chronological" ? "story chronology" : view === "phase" ? "phase order" : "universe order"}</p></div></div>
      <div className="timeline-viewbar">
        <div className="tabs">${views.map(([k,l]) => html`<button key=${k} className=${"tab " + (view === k ? "active" : "")} onClick=${() => setView(k)}><span>${l}</span></button>`)}</div>
        <div className="timeline-viewhint">${view === "release" ? "Original release sequence across the tracker." : view === "chronological" ? "Story placement where the dataset has a documented order." : view === "phase" ? "Grouped and sorted by MCU phase, then release order." : "Grouped and sorted by continuity, then release order."}</div>
      </div>
      ${view === "chronological" ? html`<div className="spoiler timeline-notice">ⓘ Story chronology is an approximation. Projects without a documented chronological position are placed at the end.</div>` : null}
      ${grouped.map((group) => html`
        <section key=${group.key} className="timeline-group">
          <div className="timeline-label">${group.key} <small>${group.items.length}</small></div>
          <div className="timeline-items">
            ${group.items.map((p) => {
              const status = statusOf(p.id, userData), u = getUniverse(p.universe);
              return html`<div key=${p.id} className="timeline-item" onClick=${() => onOpen(p.id)} style=${{borderLeftColor:u.color}}>
                <div className="year">${p.releaseYear}</div><div className="t-title">${p.title} ${p.phase ? html`<span className="badge phase">P${p.phase}</span>` : null}</div><div className="t-meta">${u.name}</div><${StatusDot} status=${status} />
              </div>`;
            })}
          </div>
        </section>
      `)}
      ${sorted.length === 0 ? html`<div className="empty"><div className="empty-ico">○</div><div className="empty-title">No projects match your filters</div></div>` : null}
    </div>
  `;
}
