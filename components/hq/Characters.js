import { html, useMemo, useState } from "htm/react";
import { characterIndex, characterJourney } from "../../utils/hq.js";
import { getUniverse, statusOf } from "../../utils/helpers.js";
import { Ring, SectionHead, Empty, STATUS_LABEL, shortUniverse } from "./shared.js";

export function Characters({ visible, userData, onOpen }) {
  const index = useMemo(() => characterIndex(visible), [visible]);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(null);
  const [order, setOrder] = useState("release");
  const q = query.trim().toLowerCase();
  const list = useMemo(() => {
    const pool = q ? index.filter((c) => c.name.toLowerCase().includes(q) || c.aliases.some((a) => a.toLowerCase().includes(q))) : index.filter((c) => c.items.length >= 2);
    return pool.slice(0, 60);
  }, [index, q]);
  const current = index.find((c) => c.name === picked) || list[0] || null;
  const journey = useMemo(() => (current ? characterJourney(current, userData, order) : null), [current, userData, order]);

  if (!index.length) return html`<${Empty} icon="🦸" title="No characters to show">Nothing in your current exploration mode lists a cast yet.<//>`;
  return html`
    <section aria-labelledby="hq-ch">
      <${SectionHead} title="Character Journeys" blurb="Pick a character to follow every appearance in your catalog, in release or story order." />
      <div className="hq-split">
        <div className="hq-picker">
          <label className="hq-search"><span className="visually-hidden">Search characters</span>
            <input type="search" placeholder="Search characters…" value=${query} onChange=${(e) => setQuery(e.target.value)} />
          </label>
          <ul className="hq-charlist" aria-label="Characters">
            ${list.map((c) => html`<li key=${c.name}><button type="button" className=${"hq-char" + (current && c.name === current.name ? " active" : "")} aria-pressed=${Boolean(current && c.name === current.name)} onClick=${() => setPicked(c.name)}>
              <span className="hq-avatar" aria-hidden="true">${c.name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("")}</span>
              <span className="hq-char-name">${c.name}</span>
              <span className="hq-char-count">${c.items.length}</span>
            </button></li>`)}
            ${!list.length ? html`<li className="hq-muted">No characters match “${query}”.</li>` : null}
          </ul>
        </div>
        ${current && journey ? html`<article className="hq-journey">
          <header className="hq-journey-head">
            <${Ring} percent=${journey.percent} size=${92} stroke=${8}><b>${journey.percent}%</b><//>
            <div>
              <span className="hq-eyebrow">Character journey</span>
              <h3>${current.name}</h3>
              <p>${journey.completed} of ${journey.total} appearances completed${current.aliases.length ? " · also credited as " + current.aliases.join(", ") : ""}</p>
            </div>
            <div className="hq-seg" role="radiogroup" aria-label="Order">
              ${[["release", "Release order"], ["story", "Story order"]].map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${order === id} className=${order === id ? "active" : ""} onClick=${() => setOrder(id)}>${label}</button>`)}
            </div>
          </header>
          ${journey.next ? html`<button type="button" className="hq-cta" onClick=${() => onOpen(journey.next.project.id)}><span>${journey.next.status === "not-started" ? "Next appearance" : "Continue"}</span><strong>${journey.next.project.title}</strong><em>→</em></button>` : html`<p className="hq-done-note">✓ You have completed every appearance of ${current.name}.</p>`}
          <ol className="hq-timeline">
            ${journey.stops.map(({ project, status }) => html`<li key=${project.id} className=${"st-" + status}>
              <button type="button" onClick=${() => onOpen(project.id)}>
                <i className="hq-node" aria-hidden="true"></i>
                <span className="hq-stop">
                  <strong>${project.title}</strong>
                  <small>${project.releaseYear} · ${project.type.replace(/-/g, " ").replace(/^tv /, "TV ")} · ${shortUniverse(getUniverse(project.universe).name)}</small>
                </span>
                <span className=${"hq-pill st-" + status}>${STATUS_LABEL[status]}</span>
              </button>
            </li>`)}
          </ol>
        </article>` : null}
      </div>
    </section>`;
}
