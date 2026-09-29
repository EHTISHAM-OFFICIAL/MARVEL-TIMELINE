import { html } from "htm/react";

export function ProgressBar({ value, max, className = "" }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return html`
    <div className=${"progress " + className}>
      <div style=${{ width: pct + "%" }}></div>
    </div>
  `;
}
