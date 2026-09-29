import { html } from "htm/react";

export function StatusDot({ status }) {
  return html`<span className=${"status-dot status-" + status}></span>`;
}
