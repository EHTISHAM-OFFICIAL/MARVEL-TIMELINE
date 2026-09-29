import { html } from "htm/react";

export function SpoilerSection({ text, revealed, onReveal }) {
  if (revealed) return html`<div className="spoiler-revealed">${text}</div>`;
  return html`
    <div className="spoiler">
      <div style=${{ marginBottom: "10px" }}>
        🔒 Spoiler-heavy connections hidden
      </div>
      <button className="btn sm primary" onClick=${onReveal}>
        Reveal Connections
      </button>
    </div>
  `;
}
