import { html, useMemo, useState } from "htm/react";
import { sagaProgress } from "../../utils/hq.js";
import { CONNECTION_LABELS, getUniverse, statusOf } from "../../utils/helpers.js";
import { Ring, Meter, SectionHead, Empty, StatusPill } from "./shared.js";

export function Sagas({ visible, userData, onOpen }) {
  const sagas = useMemo(() => sagaProgress(visible, userData), [visible, userData]);
  const firstAvailable = sagas.find((s) => s.available);
  const [pickedId, setPickedId] = useState(null);
  const [lens, setLens] = useState("all");
  const saga = sagas.find((s) => s.def.id === pickedId && s.available) || firstAvailable;
  if (!saga) return html`<${Empty} icon="📜" title="No sagas in this mode">Switch your exploration mode in Settings to see story arcs.<//>`;
  const levels = [...new Set(saga.items.map((p) => p.connectionLevel).filter(Boolean))];
  const activeLens = levels.includes(lens) ? lens : "all";
  const keep = (p) => activeLens === "all" || p.connectionLevel === activeLens;
  const color = getUniverse(saga.items[0]?.universe).color;
  return html`
    <section aria-labelledby="hq-sg">
      <${SectionHead} title="Saga Explorer" blurb="Story arcs grouped from each title's universe and phase, with your progress through every chapter." />
      <ul className="hq-sagapicker">
        ${sagas.map((s) => html`<li key=${s.def.id}><button type="button" disabled=${!s.available} aria-pressed=${s.def.id === saga.def.id} className=${"hq-sagabtn" + (s.def.id === saga.def.id ? " active" : "")} onClick=${() => { setPickedId(s.def.id); setLens("all"); }}>
          <span className="hq-eyebrow">${s.def.group === "main" ? "Main saga" : "Beyond the MCU"}</span>
          <strong>${s.def.name}</strong>
          <small>${s.available ? s.completed + " / " + s.total + " completed" : "Not in your current mode"}</small>
          ${s.available ? html`<${Meter} percent=${s.percent} />` : null}
        </button></li>`)}
      </ul>

      <article className="hq-saga" style=${{ "--accent": color }}>
        <header className="hq-saga-head">
          <${Ring} percent=${saga.percent} size=${104} stroke=${9} color=${color}><b>${saga.percent}%</b><//>
          <div>
            <span className="hq-eyebrow">${saga.def.group === "main" ? "Main saga" : "Beyond the MCU"}</span>
            <h3>${saga.def.name}</h3>
            <p>${saga.def.blurb}</p>
          </div>
          ${saga.next ? html`<button type="button" className="hq-cta" onClick=${() => onOpen(saga.next.id)}><span>Next in this saga</span><strong>${saga.next.title}</strong><em>→</em></button>` : html`<p className="hq-done-note">✓ Saga complete</p>`}
        </header>
        ${levels.length > 1 ? html`<div className="hq-chips" role="radiogroup" aria-label="Connection level">
          <button type="button" role="radio" aria-checked=${activeLens === "all"} className=${activeLens === "all" ? "active" : ""} onClick=${() => setLens("all")}>All titles</button>
          ${levels.map((l) => html`<button key=${l} type="button" role="radio" aria-checked=${activeLens === l} className=${activeLens === l ? "active" : ""} onClick=${() => setLens(l)}>${CONNECTION_LABELS[l] || l}</button>`)}
        </div>` : null}
        <div className="hq-chapters">
          ${saga.chapters.map((ch) => {
            const items = ch.items.filter(keep);
            if (!items.length) return null;
            const done = items.filter((p) => statusOf(p.id, userData) === "completed").length;
            return html`<section key=${ch.label} className="hq-chapter">
              <header><h4>${ch.label}</h4><span>${done} / ${items.length}</span></header>
              <${Meter} percent=${items.length ? (done / items.length) * 100 : 0} color=${color} />
              <ul>
                ${items.map((p) => html`<li key=${p.id}><button type="button" onClick=${() => onOpen(p.id)}>
                  <span className="hq-chip-title">${p.title}</span>
                  <small>${p.releaseYear}</small>
                  <${StatusPill} project=${p} userData=${userData} />
                </button></li>`)}
              </ul>
            </section>`;
          })}
        </div>
      </article>
    </section>`;
}
