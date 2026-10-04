import { html, useCallback, useEffect, useMemo, useRef, useState } from "htm/react";
import { CATEGORIES } from "../../utils/achievements.js";
import { TIER_ICONS } from "../TrophyRoom.js";
import { Meter, SectionHead, Empty } from "./shared.js";

const seenKey = (uid) => "mt-cards-seen:" + uid;
const readSeen = (uid) => { try { const v = JSON.parse(localStorage.getItem(seenKey(uid)) || "null"); return Array.isArray(v) ? new Set(v) : null; } catch (e) { return null; } };
const writeSeen = (uid, ids) => { try { localStorage.setItem(seenKey(uid), JSON.stringify([...ids])); } catch (e) { /* storage unavailable */ } };
const reduced = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const catOf = (id) => CATEGORIES.find((c) => c.id === id);

// Pointer-driven holographic tilt. Pure CSS variables, disabled for touch and reduced motion.
function useTilt() {
  const ref = useRef(null);
  const onMove = useCallback((e) => {
    const el = ref.current;
    if (!el || e.pointerType === "touch" || reduced()) return;
    const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
    el.style.setProperty("--rx", ((x - 0.5) * 14).toFixed(2) + "deg"); el.style.setProperty("--ry", ((0.5 - y) * 14).toFixed(2) + "deg");
  }, []);
  const onLeave = useCallback(() => { const el = ref.current; if (!el) return; ["--rx", "--ry"].forEach((k) => el.style.setProperty(k, "0deg")); el.style.setProperty("--mx", "50%"); el.style.setProperty("--my", "50%"); }, []);
  return { ref, onPointerMove: onMove, onPointerLeave: onLeave };
}

export function CardFace({ card, isNew = false, size = "md" }) {
  const cat = catOf(card.cat);
  if (!card.collected) {
    const hidden = card.secret;
    return html`<div className=${"mcard back tier-" + card.tier + " " + size}>
      <div className="mcard-frame"><div className="mcard-back">
        <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden="true"><path d="M15 48V18l17 19 17-19v30" fill="none" stroke="currentColor" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="32" cy="37" r="4.6" fill="currentColor"/></svg>
        <span className="mcard-no">No. ${String(card.no).padStart(3, "0")}</span>
        <strong>${hidden ? "Secret card" : !card.available ? "Not in this mode" : "Locked"}</strong>
        ${card.available && !hidden ? html`<small>${card.progress}</small>` : null}
      </div></div>
    </div>`;
  }
  return html`<div className=${"mcard front tier-" + card.tier + " cat-" + card.cat + " " + size}>
    <div className="mcard-frame"><div className="mcard-inner">
      <header className="mcard-top"><span className="mcard-no">No. ${String(card.no).padStart(3, "0")}</span><span className="mcard-rarity">${TIER_ICONS[card.tier]} ${card.rarity}</span></header>
      <div className="mcard-art" aria-hidden="true"><i className="mcard-burst"></i><i className="mcard-dots"></i><span className="mcard-icon">${card.icon}</span></div>
      <div className="mcard-title"><strong>${card.name}</strong></div>
      <p className="mcard-text">${card.detail}</p>
      <footer className="mcard-foot"><span>${cat ? cat.icon + " " + cat.label : ""}</span><b>${card.points} pts</b></footer>
    </div><i className="mcard-foil" aria-hidden="true"></i></div>
    ${isNew ? html`<span className="mcard-new">NEW</span>` : null}
  </div>`;
}

function TiltCard({ card, isNew, onClick, size }) {
  const tilt = useTilt();
  return html`<button type="button" className="mcard-btn" ref=${tilt.ref} onPointerMove=${tilt.onPointerMove} onPointerLeave=${tilt.onPointerLeave} onClick=${onClick} aria-label=${(card.collected ? card.name + ", " + card.rarity + " card" : "Locked card number " + card.no) + (isNew ? ", new" : "")}>
    <${CardFace} card=${card} isNew=${isNew} size=${size} />
  </button>`;
}

function Reveal({ cards, onDone }) {
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const closeRef = useRef(null);
  const card = cards[i];
  useEffect(() => { closeRef.current?.focus(); const onKey = (e) => { if (e.key === "Escape") onDone(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  const advance = () => { if (!flipped) return setFlipped(true); if (i + 1 >= cards.length) return onDone(); setI(i + 1); setFlipped(false); };
  const tilt = useTilt();
  return html`<div className="hq-overlay" role="dialog" aria-modal="true" aria-label="Reveal new cards">
    <div className="hq-reveal">
      <div className="hq-reveal-head"><strong>New cards · ${i + 1} of ${cards.length}</strong><div><button type="button" className="btn ghost sm" onClick=${onDone} ref=${closeRef}>Skip to collection</button></div></div>
      <button type="button" className=${"hq-flip" + (flipped ? " flipped" : "")} ref=${tilt.ref} onPointerMove=${tilt.onPointerMove} onPointerLeave=${tilt.onPointerLeave} onClick=${advance} aria-label=${flipped ? (i + 1 >= cards.length ? "Finish" : "Next card") : "Reveal card"}>
        <span className="hq-flip-inner">
          <span className="hq-flip-face back"><${CardFace} card=${{ ...card, collected: false, available: true, secret: false, progress: "Tap to reveal" }} size="lg" /></span>
          <span className="hq-flip-face front"><${CardFace} card=${card} size="lg" /></span>
        </span>
      </button>
      <p className="hq-reveal-hint">${flipped ? (i + 1 >= cards.length ? "Tap to finish" : "Tap for the next card") : "Tap the card to reveal it"}</p>
    </div>
  </div>`;
}

export function Cards({ collection, uid }) {
  const { cards, owned, total } = collection;
  const [setFilter, setSetFilter] = useState("all");
  const [view, setView] = useState("all");
  const [open, setOpen] = useState(null);
  const [revealing, setRevealing] = useState(false);
  const [seen, setSeen] = useState(() => readSeen(uid));
  const collectedIds = useMemo(() => cards.filter((c) => c.collected).map((c) => c.id), [cards]);
  const fresh = useMemo(() => collectedIds.filter((id) => !seen || !seen.has(id)), [collectedIds, seen]);
  const freshCards = cards.filter((c) => fresh.includes(c.id));
  const markSeen = () => { const next = new Set([...(seen || []), ...collectedIds]); writeSeen(uid, next); setSeen(next); };

  const visible = cards.filter((c) => (c.available || c.collected) && (setFilter === "all" || c.cat === setFilter) && (view === "all" || (view === "owned" ? c.collected : !c.collected && c.available)));
  const sets = CATEGORIES.map((c) => { const items = cards.filter((x) => x.cat === c.id && x.available); const have = items.filter((x) => x.collected).length; return { ...c, have, total: items.length }; }).filter((s) => s.total);
  const openCard = cards.find((c) => c.id === open);
  useEffect(() => { if (!open) return; const onKey = (e) => { if (e.key === "Escape") setOpen(null); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [open]);

  return html`
    <section aria-labelledby="hq-cd">
      <${SectionHead} title="Collectible Cards" blurb="Every trophy you unlock adds a card to your collection. Finish a set to complete a category." />
      ${freshCards.length ? html`<div className="hq-banner"><span aria-hidden="true">🃏</span><div><strong>${freshCards.length} new card${freshCards.length > 1 ? "s" : ""} waiting</strong><p>Reveal them one at a time, or skip straight to the collection.</p></div><button type="button" className="btn btn-primary" onClick=${() => setRevealing(true)}>Reveal ${freshCards.length > 1 ? "cards" : "card"}</button></div>` : null}
      <div className="hq-cardstats">
        <div className="hq-cardstat main"><b>${owned}</b><span>of ${total} collected</span><${Meter} percent=${total ? (owned / total) * 100 : 0} /></div>
        <ul className="hq-sets" aria-label="Sets">
          ${sets.map((s) => html`<li key=${s.id}><button type="button" aria-pressed=${setFilter === s.id} className=${setFilter === s.id ? "active" : ""} onClick=${() => setSetFilter(setFilter === s.id ? "all" : s.id)}><span>${s.icon} ${s.label}</span><b>${s.have}/${s.total}</b>${s.have === s.total ? html`<i title="Set complete">✓</i>` : null}</button></li>`)}
        </ul>
      </div>
      <div className="hq-chips" role="radiogroup" aria-label="Show">
        ${[["all", "All cards"], ["owned", "Collected"], ["missing", "Still to find"]].map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${view === id} className=${view === id ? "active" : ""} onClick=${() => setView(id)}>${label}</button>`)}
      </div>
      ${visible.length ? html`<ul className="hq-cardgrid">${visible.map((c) => html`<li key=${c.id}><${TiltCard} card=${c} isNew=${fresh.includes(c.id)} onClick=${() => setOpen(c.id)} /></li>`)}</ul>` : html`<${Empty} icon="🃏" title="No cards here yet">${view === "owned" ? "Unlock a trophy to collect your first card." : "Nothing matches this filter."}<//>`}

      ${openCard ? html`<div className="hq-overlay" role="dialog" aria-modal="true" aria-label=${openCard.collected ? openCard.name : "Locked card"} onClick=${(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
        <div className="hq-cardview">
          <${TiltCard} card=${openCard} isNew=${false} size="lg" onClick=${() => {}} />
          <div className="hq-cardview-info">
            <span className="hq-eyebrow">${openCard.collected ? openCard.rarity + " card" : openCard.secret ? "Secret card" : "Locked card"} · No. ${String(openCard.no).padStart(3, "0")}</span>
            <h3>${openCard.collected || !openCard.secret ? openCard.name : "???"}</h3>
            <p>${openCard.collected ? openCard.detail : openCard.secret ? (openCard.hint ? "Hint: " + openCard.hint : "Keep exploring to find it.") : openCard.available ? "Unlock this trophy to collect the card. " + openCard.detail : "Not available in your current exploration mode."}</p>
            ${openCard.available && !openCard.collected && !openCard.secret ? html`<p className="hq-muted">Progress: ${openCard.progress}</p>` : null}
            <button type="button" className="btn" onClick=${() => setOpen(null)}>Close</button>
          </div>
        </div>
      </div>` : null}
      ${revealing ? html`<${Reveal} cards=${freshCards} onDone=${() => { setRevealing(false); markSeen(); }} />` : null}
    </section>`;
}
