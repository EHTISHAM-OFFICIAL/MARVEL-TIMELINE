import { html } from "htm/react";
import { useState } from "htm/react";
import { UNIVERSES } from "../data/universes.js";
import { PROJECTS } from "../data/projects.js";
import { statusOf, episodeProgress, isSeries } from "../utils/helpers.js";
import { ProgressBar } from "../components/ProgressBar.js";

export function Universes({ userData, onOpen, actions }) {
  const [selected, setSelected] = useState(null);
  const prefs = userData.preferences;
  const selectedUniverse = selected ? UNIVERSES.find((u) => u.id === selected) : null;
  return html`
    <div>
      <h1>Universes & Continuities</h1>
      <p className="subtitle">Explore every continuity independently. Click a universe to open its full catalog and tracking progress.</p>
      <div className="universe-toolbar"><span>${UNIVERSES.length} continuities · ${PROJECTS.length} projects</span><span className="text-faint">Hidden universes remain hidden from other filtered views.</span></div>
      <div className="grid wide">
        ${UNIVERSES.map((u) => {
          const projects = PROJECTS.filter((p) => p.universe === u.id);
          const done = projects.filter((p) => statusOf(p.id, userData) === "completed").length;
          const watchedEpisodes = projects.reduce((sum, p) => sum + (isSeries(p) ? episodeProgress(p, userData).watched : 0), 0);
          const totalEpisodes = projects.reduce((sum, p) => sum + (isSeries(p) ? episodeProgress(p, userData).total : 0), 0);
          const hidden = prefs.hiddenUniverses.includes(u.id);
          return html`
            <article key=${u.id} className=${"universe-card " + (selected === u.id ? "selected" : "")} style=${{ "--universe-accent": u.color, opacity: hidden ? 0.62 : 1 }} onClick=${() => setSelected(u.id)}>
              <div className="universe-accent"></div>
              <div className="earth" style=${{ color: u.color }}>${u.earth !== "—" ? u.earth : u.id.toUpperCase()}</div>
              <div className="u-name">${u.name}</div>
              <div className="u-desc">${u.description}</div>
              <div className="universe-stats"><span>${done}/${projects.length} projects</span>${totalEpisodes ? html`<span>${watchedEpisodes}/${totalEpisodes} episodes</span>` : null}</div>
              <${ProgressBar} value=${done} max=${projects.length} />
              <div className="universe-footer"><span className="text-faint">${hidden ? "Hidden from filters" : "Visible in tracker"}</span><button className="btn ghost sm" onClick=${(e) => { e.stopPropagation(); actions.toggleUniverseHidden(u.id); }}>${hidden ? "Show" : "Hide"}</button></div>
            </article>
          `;
        })}
      </div>
      ${selectedUniverse ? (() => {
        const projects = PROJECTS.filter((p) => p.universe === selectedUniverse.id).sort((a,b) => a.releaseOrderIndex-b.releaseOrderIndex);
        const done = projects.filter((p) => statusOf(p.id, userData) === "completed").length;
        return html`
          <div className="universe-detail-panel">
            <div className="universe-detail-head"><div><div className="modal-kicker" style=${{ color: selectedUniverse.color }}>CONTINUITY</div><h2>${selectedUniverse.name}</h2><p className="text-dim">${selectedUniverse.description}</p></div><button className="btn" onClick=${() => setSelected(null)}>Close</button></div>
            <div className="universe-detail-meta"><span>${projects.length} projects</span><span>${done} completed</span><span>${projects.length ? Math.round((done/projects.length)*100) : 0}% complete</span></div>
            <div className="grid">
              ${projects.map((p) => html`
                <div key=${p.id} className="universe-project-row" onClick=${() => onOpen(p.id)}>
                  <div className="universe-project-main"><span className=${"status-dot status-" + statusOf(p.id, userData)}></span><div><strong>${p.title}</strong><small>${p.releaseYear} · ${p.type.replace(/-/g," ")}</small></div></div>
                  ${isSeries(p) ? html`<span className="badge">${episodeProgress(p,userData).watched}/${p.episodes} eps</span>` : html`<span className="badge">${statusOf(p.id,userData)}</span>`}
                </div>
              `)}
            </div>
          </div>
        `;
      })() : null}
    </div>
  `;
}
