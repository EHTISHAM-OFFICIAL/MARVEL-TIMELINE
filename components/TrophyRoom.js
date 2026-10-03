import { html, useMemo, useState } from "htm/react";
import { CATEGORIES, TIERS } from "../utils/achievements.js";

export const TIER_ICONS = { bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💠", legendary: "🌟" };

const FILTERS = [
  { id: "all", label: "All" },
  { id: "unlocked", label: "Unlocked" },
  { id: "progress", label: "In progress" },
  { id: "locked", label: "Locked" },
];

const stateOf = (a) => (a.unlocked ? "unlocked" : !a.available ? "unavailable" : a.secret ? "secret" : a.percent > 0 ? "started" : "locked");

function Medal({ a }) {
  const st = stateOf(a);
  const glyph = st === "unlocked" ? a.icon : st === "secret" ? "❓" : st === "unavailable" ? "🚫" : "🔒";
  return html`<span className=${"tr-medal tier-" + a.tier + " " + st} aria-hidden="true"><span>${glyph}</span></span>`;
}

function TierTag({ a }) {
  return html`<span className=${"tr-tag tier-" + a.tier}>${TIER_ICONS[a.tier]} ${TIERS[a.tier].label} · ${a.points} pts</span>`;
}

function Meter({ a }) {
  return html`<span className=${"tr-meter tier-" + a.tier} aria-hidden="true"><i style=${{ width: a.percent + "%" }}></i></span>`;
}

function TrophyCard({ a, selected, onPick }) {
  const st = stateOf(a);
  const hiddenSecret = a.secret && !a.unlocked;
  const name = hiddenSecret ? "???" : a.name;
  const desc = hiddenSecret ? "Secret trophy. Keep exploring to find it." : !a.available ? "Not available in your current exploration mode." : a.detail;
  const label = name + ", " + TIERS[a.tier].label + " trophy, " + (a.unlocked ? "unlocked" : a.available ? "locked, " + a.progress : "not available in this mode");
  return html`
    <li>
      <button type="button" className=${"tr-card tier-" + a.tier + " " + st + (selected ? " selected" : "")} onClick=${onPick} aria-label=${label} aria-pressed=${selected}>
        <${Medal} a=${a} />
        <span className="tr-card-copy">
          <span className="tr-name">${name}</span>
          <span className="tr-desc">${desc}</span>
          ${a.unlocked
            ? html`<span className="tr-done">✓ Unlocked</span>`
            : a.available && !hiddenSecret
              ? html`<span className="tr-progress-row"><${Meter} a=${a} /><em>${a.progress}</em></span>`
              : null}
        </span>
        <${TierTag} a=${a} />
      </button>
    </li>
  `;
}

function Detail({ a, onClose }) {
  const hiddenSecret = a.secret && !a.unlocked;
  const st = stateOf(a);
  const cat = CATEGORIES.find((c) => c.id === a.cat);
  return html`
    <aside className=${"tr-detail tier-" + a.tier + " " + st} aria-live="polite">
      <${Medal} a=${a} />
      <div className="tr-detail-copy">
        <span className="eyebrow">${a.unlocked ? "TROPHY UNLOCKED" : st === "unavailable" ? "NOT IN THIS MODE" : "TROPHY LOCKED"} · ${cat ? cat.label.toUpperCase() : ""}</span>
        <h3>${hiddenSecret ? "???" : a.name}</h3>
        <p>${hiddenSecret ? "A secret trophy. " + (a.hint ? "Hint: " + a.hint : "Keep exploring to find it.") : a.detail}</p>
        <div className="tr-detail-meta">
          <${TierTag} a=${a} />
          ${a.available && !hiddenSecret
            ? html`<span className="tr-progress-row tr-wide"><${Meter} a=${a} /><em>${a.unlocked ? "Complete" : a.progress}</em></span>`
            : null}
        </div>
      </div>
      <button type="button" className="btn ghost sm" onClick=${onClose}>Close</button>
    </aside>
  `;
}

export function TrophyRoom({ result }) {
  const [cat, setCat] = useState("all");
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const { list, rank, next, percent, toNext, points, unlockedCount, availableCount, tierCounts } = result;

  const nextUp = useMemo(() => {
    const open = list.filter((a) => a.available && !a.unlocked && !a.secret);
    const started = open.filter((a) => a.percent > 0).sort((a, b) => b.percent - a.percent || a.points - b.points);
    const pool = started.length >= 3 ? started : [...started, ...open.filter((a) => a.percent === 0 && a.tier === "bronze")];
    return pool.slice(0, 3);
  }, [list]);

  const visible = list.filter((a) => {
    if (cat !== "all" && a.cat !== cat) return false;
    if (filter === "unlocked") return a.unlocked;
    if (filter === "locked") return !a.unlocked;
    if (filter === "progress") return !a.unlocked && a.available && a.percent > 0;
    return true;
  });
  const selected = selectedId ? list.find((a) => a.id === selectedId) : null;
  const groups = CATEGORIES.map((c) => ({ ...c, items: visible.filter((a) => a.cat === c.id) })).filter((g) => g.items.length);
  const pick = (a) => setSelectedId(selectedId === a.id ? null : a.id);
  const catCount = (id) => {
    const items = list.filter((a) => a.cat === id && a.available);
    return items.filter((a) => a.unlocked).length + "/" + items.length;
  };

  return html`
    <section className="tr" aria-labelledby="tr-title">
      <header className="tr-hero">
        <div className="tr-rank">
          <div className="tr-rank-icon" aria-hidden="true">${rank.icon}</div>
          <div className="tr-rank-copy">
            <span className="eyebrow">TROPHY ROOM · YOUR RANK</span>
            <h2 id="tr-title">${rank.name}</h2>
            <p>${points.toLocaleString()} points${next ? " · " + toNext.toLocaleString() + " to " + next.name + " " + next.icon : " · maximum rank reached 🎉"}</p>
            <div className="tr-rankbar" role="img" aria-label=${percent + " percent of the way to the next rank"}><i style=${{ width: percent + "%" }}></i></div>
          </div>
        </div>
        <div className="tr-summary">
          <div className="tr-count"><b>${unlockedCount}</b><span>/ ${availableCount}</span><small>trophies unlocked</small></div>
          <ul className="tr-tiers" aria-label="Trophies unlocked by tier">
            ${Object.keys(TIERS).map((t) => html`<li key=${t} className=${"tier-" + t} title=${TIERS[t].label}><span aria-hidden="true">${TIER_ICONS[t]}</span><b>${tierCounts[t]}</b><span className="visually-hidden">${TIERS[t].label}</span></li>`)}
          </ul>
        </div>
      </header>

      ${nextUp.length
        ? html`<div className="tr-next">
            <h3>${nextUp.some((a) => a.percent > 0) ? "Closest to unlocking" : "Start here"}</h3>
            <ul>
              ${nextUp.map((a) => html`<li key=${a.id}>
                <button type="button" className=${"tr-next-card tier-" + a.tier} onClick=${() => { setCat("all"); setFilter("all"); setSelectedId(a.id); }}>
                  <${Medal} a=${a} />
                  <span className="tr-next-copy"><strong>${a.name}</strong><span className="tr-progress-row"><${Meter} a=${a} /><em>${a.progress}</em></span></span>
                </button>
              </li>`)}
            </ul>
          </div>`
        : null}

      <div className="tr-tools">
        <div className="tr-cats" role="tablist" aria-label="Trophy categories">
          <button type="button" role="tab" aria-selected=${cat === "all"} className=${"tr-cat" + (cat === "all" ? " active" : "")} onClick=${() => setCat("all")}>All<span>${unlockedCount}/${availableCount}</span></button>
          ${CATEGORIES.map((c) => html`<button key=${c.id} type="button" role="tab" aria-selected=${cat === c.id} className=${"tr-cat" + (cat === c.id ? " active" : "")} onClick=${() => setCat(c.id)}><span aria-hidden="true">${c.icon}</span> ${c.label}<span>${catCount(c.id)}</span></button>`)}
        </div>
        <div className="tr-filter" role="radiogroup" aria-label="Filter trophies">
          ${FILTERS.map((f) => html`<button key=${f.id} type="button" role="radio" aria-checked=${filter === f.id} className=${"tr-chip" + (filter === f.id ? " active" : "")} onClick=${() => setFilter(f.id)}>${f.label}</button>`)}
        </div>
      </div>

      ${selected ? html`<${Detail} a=${selected} onClose=${() => setSelectedId(null)} />` : null}

      ${groups.length
        ? groups.map((g) => html`
            <div key=${g.id} className="tr-group">
              ${cat === "all" ? html`<h3 className="tr-group-title"><span aria-hidden="true">${g.icon}</span> ${g.label}<em>${catCount(g.id)}</em></h3>` : null}
              <ul className="tr-grid">
                ${g.items.map((a) => html`<${TrophyCard} key=${a.id} a=${a} selected=${selectedId === a.id} onPick=${() => pick(a)} />`)}
              </ul>
            </div>`)
        : html`<div className="tr-empty"><strong>No trophies here</strong><p>Try a different category or filter.</p></div>`}
    </section>
  `;
}
