import { html } from "htm/react";
import { SectionHead, Empty, Meter } from "./shared.js";

export function Identity({ identity, onNavigate }) {
  if (!identity.ready) {
    return html`<section aria-labelledby="hq-id"><${SectionHead} title="Marvel Identity" blurb="A profile built from how you actually watch." /><${Empty} icon="🪪" title="Your identity is still forming" action=${html`<button type="button" className="btn btn-primary" onClick=${() => onNavigate("timeline")}>Find something to watch</button>`}>Complete ${identity.needed} more title${identity.needed > 1 ? "s" : ""} and HQ will describe your viewing style.<//></section>`;
  }
  const main = identity.archetype || identity.fallback;
  return html`
    <section aria-labelledby="hq-id">
      <${SectionHead} title="Marvel Identity" blurb="Worked out from your completions, ratings and viewing rhythm. It updates as you watch." />
      <article className="hq-identity">
        <div className="hq-identity-badge" aria-hidden="true">${main.icon}</div>
        <div className="hq-identity-copy">
          <span className="hq-eyebrow">You are a</span>
          <h3>${main.name}</h3>
          <p>${main.tagline}</p>
        </div>
      </article>
      <dl className="hq-signals">
        ${identity.signals.map((s) => html`<div key=${s.label}><dt>${s.label}</dt><dd>${s.value}</dd><small>${s.detail}</small></div>`)}
      </dl>
      <div className="hq-match">
        <h3>How you match each identity</h3>
        <ul>
          ${identity.matches.slice().sort((a, b) => b.fit - a.fit).map((m) => html`<li key=${m.id} className=${identity.archetype && identity.archetype.id === m.id ? "current" : ""}>
            <span aria-hidden="true">${m.icon}</span><div><strong>${m.name}</strong><small>${m.tagline}</small></div><b>${m.fit}%</b><${Meter} percent=${m.fit} />
          </li>`)}
        </ul>
        <p className="hq-muted">An identity unlocks once your match reaches 100%.</p>
      </div>
    </section>`;
}
