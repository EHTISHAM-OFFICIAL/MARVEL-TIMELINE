import { html } from "htm/react";
import { statusOf } from "../../utils/helpers.js";

export const STATUS_LABEL = { "not-started": "Not started", watching: "Watching", completed: "Completed", skipped: "Skipped", rewatching: "Rewatching" };
export const shortUniverse = (name) => String(name || "").split(" — ")[0];
export const abbrevUniverse = (name) => shortUniverse(name).replace("Marvel Cinematic Universe", "MCU");

export function Ring({ percent, size = 76, stroke = 7, color = "var(--red)", children }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return html`<span className="hq-ring" style=${{ width: size + "px", height: size + "px" }}>
    <svg width=${size} height=${size} viewBox=${"0 0 " + size + " " + size} aria-hidden="true">
      <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke="var(--border)" strokeWidth=${stroke} />
      <circle cx=${size / 2} cy=${size / 2} r=${r} fill="none" stroke=${color} strokeWidth=${stroke} strokeLinecap="round" strokeDasharray=${c} strokeDashoffset=${c * (1 - Math.min(100, Math.max(0, percent)) / 100)} transform=${"rotate(-90 " + size / 2 + " " + size / 2 + ")"} />
    </svg>
    <span className="hq-ring-label">${children}</span>
  </span>`;
}

export function Meter({ percent, color }) {
  return html`<span className="hq-meter" aria-hidden="true"><i style=${{ width: Math.min(100, Math.max(0, percent)) + "%", background: color || undefined }}></i></span>`;
}

export function SectionHead({ title, blurb, children }) {
  return html`<header className="hq-sec-head"><div><h2>${title}</h2>${blurb ? html`<p>${blurb}</p>` : null}</div>${children ? html`<div className="hq-sec-tools">${children}</div>` : null}</header>`;
}

export function Empty({ icon = "✨", title, children, action }) {
  return html`<div className="hq-empty"><span aria-hidden="true">${icon}</span><strong>${title}</strong>${children ? html`<p>${children}</p>` : null}${action || null}</div>`;
}

export function StatusPill({ project, userData }) {
  const s = statusOf(project.id, userData);
  return html`<span className=${"hq-pill st-" + s}>${STATUS_LABEL[s] || s}</span>`;
}
