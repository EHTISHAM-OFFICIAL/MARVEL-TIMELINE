import { html, useEffect, useMemo, useState } from "htm/react";
import { rankSuggestions, surprisePick } from "../utils/recommend.js";
import { getUniverse, statusOf, formatRuntime, isSeries, episodeProgress } from "../utils/helpers.js";

const TAG_ICON = { continue: "▶️", order: "🧭", loved: "💖", quick: "⚡", list: "📌", wild: "🎲" };

export function WatchNext({ visible, userData, timeline, onOpen }) {
  const picks = useMemo(() => rankSuggestions(visible, userData, { timeline, limit: 6 }), [visible, userData, timeline]);
  const [idx, setIdx] = useState(0);
  const [wild, setWild] = useState(null);
  // Progress changed (or the list shrank): start again from the best suggestion.
  useEffect(() => { setIdx(0); setWild(null); }, [picks.length, picks[0]?.project.id]);

  if (!picks.length) {
    return html`<section className="wn card wn-empty"><div className="wn-body"><span className="eyebrow">WHAT SHOULD I WATCH NEXT?</span><h2>You have seen everything visible. Legendary. 🎉</h2><p>Try widening your exploration mode in Settings to uncover more of the archive.</p></div></section>`;
  }
  const current = wild || picks[Math.min(idx, picks.length - 1)];
  const p = current.project;
  const u = getUniverse(p.universe);
  const ep = isSeries(p) ? episodeProgress(p, userData) : null;
  const facts = [p.releaseYear, p.type.replace(/-/g, " ").replace(/^tv /, "TV "), u.name, p.runtimeMinutes ? formatRuntime(p.runtimeMinutes) : ep && ep.total ? ep.total + " episodes" : null].filter(Boolean);
  const status = statusOf(p.id, userData);

  return html`
    <section className="wn card" style=${{ "--accent": u.color }} aria-labelledby="wn-title">
      <div className="wn-body" aria-live="polite">
        <span className="eyebrow" id="wn-title">WHAT SHOULD I WATCH NEXT?</span>
        <h2>${p.title}</h2>
        <p className="wn-facts">${facts.join(" · ")}</p>
        <p className="wn-reason"><span aria-hidden="true">${TAG_ICON[current.tag] || "✨"}</span> ${current.reason}</p>
        ${p.shortDescription ? html`<p className="wn-desc">${p.shortDescription}</p>` : null}
        <div className="wn-actions">
          <button type="button" className="btn btn-primary" onClick=${() => onOpen(p.id)}>${status === "watching" ? "Continue" : "Open"} →</button>
          <button type="button" className="btn" onClick=${() => { setWild(null); setIdx((i) => (wild ? 0 : (i + 1) % picks.length)); }} disabled=${picks.length < 2 && !wild}>↻ ${wild ? "Back to picks" : "Show another"}${!wild && picks.length > 1 ? " (" + (Math.min(idx, picks.length - 1) + 1) + "/" + picks.length + ")" : ""}</button>
          <button type="button" className="btn" onClick=${() => setWild(surprisePick(visible, userData))}>🎲 Surprise me</button>
        </div>
      </div>
    </section>`;
}
