import { html } from "htm/react";
import { Ring, SectionHead, Meter, shortUniverse } from "./shared.js";

export function Multiverse({ stats, onOpen, onNavigate }) {
  const explored = stats.filter((s) => s.explored).length;
  return html`
    <section aria-labelledby="hq-mv">
      <${SectionHead} title="Your Multiverse" blurb=${"You have explored " + explored + " of " + stats.length + " universes. Each ring shows how much of that continuity you have completed."}>
        <button type="button" className="btn" onClick=${() => onNavigate("universes")}>Open Universes →</button>
      <//>
      <div className="hq-explored" role="img" aria-label=${explored + " of " + stats.length + " universes explored"}>
        ${stats.map((s) => html`<i key=${s.universe.id} className=${s.explored ? "on" : ""} style=${{ "--c": s.universe.color }}></i>`)}
      </div>
      <ul className="hq-orbs">
        ${stats.map((s) => {
          const u = s.universe;
          return html`<li key=${u.id}>
            <article className=${"hq-orb" + (s.explored ? " explored" : " unexplored") + (s.hidden ? " is-hidden" : "")} style=${{ "--accent": u.color }}>
              <${Ring} percent=${s.percent} size=${88} stroke=${8} color=${u.color}><b>${s.percent}%</b><//>
              <div className="hq-orb-copy">
                <span className="hq-eyebrow">${u.earth !== "—" ? "Earth-" + u.earth : "Continuity"}</span>
                <h3>${shortUniverse(u.name)}</h3>
                <p className="hq-orb-count"><strong>${s.completed}</strong> of ${s.total} completed</p>
                <div className="hq-tags">
                  ${s.watching ? html`<span className="hq-tag now">${s.watching} watching</span>` : null}
                  ${s.favorites ? html`<span className="hq-tag fav">★ ${s.favorites}</span>` : null}
                  ${!s.explored ? html`<span className="hq-tag">Unexplored</span>` : null}
                  ${s.hidden ? html`<span className="hq-tag">Hidden in settings</span>` : null}
                </div>
              </div>
              ${s.next ? html`<button type="button" className="hq-orb-next" onClick=${() => onOpen(s.next.id)}><span>${s.explored ? "Next up" : "Start with"}</span><strong>${s.next.title}</strong></button>` : html`<span className="hq-orb-done">✓ Fully completed</span>`}
              <${Meter} percent=${s.percent} color=${u.color} />
            </article>
          </li>`;
        })}
      </ul>
    </section>`;
}
