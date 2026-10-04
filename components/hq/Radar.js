import { html, useMemo } from "htm/react";
import { releaseRadar } from "../../utils/hq.js";
import { getUniverse } from "../../utils/helpers.js";
import { SectionHead, Empty, shortUniverse } from "./shared.js";

const fmtDate = (s) => { try { return new Date(s + "T00:00:00").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); } catch (e) { return s; } };
const ago = (days) => { const d = Math.abs(days); return d === 0 ? "Released today" : d === 1 ? "Released yesterday" : d < 45 ? "Released " + d + " days ago" : "Released " + Math.round(d / 30) + " months ago"; };

export function Radar({ visible, userData, onOpen }) {
  const radar = useMemo(() => releaseRadar(visible, userData, new Date()), [visible, userData]);
  const card = (project, extra) => html`<li key=${project.id}><button type="button" className="hq-radar-card" style=${{ "--accent": getUniverse(project.universe).color }} onClick=${() => onOpen(project.id)}>${extra}
    <span className="hq-radar-copy"><strong>${project.title}</strong><small>${shortUniverse(getUniverse(project.universe).name)} · ${project.type.replace(/-/g, " ").replace(/^tv /, "TV ")}</small></span></button></li>`;
  return html`
    <section aria-labelledby="hq-rd">
      <${SectionHead} title="Release Radar" blurb="Countdowns for what is still to come, plus recent releases and queue picks you have not reached yet." />
      <div className="hq-radar-block">
        <h3>On the horizon</h3>
        ${radar.upcoming.length
          ? html`<ul className="hq-radar-grid">${radar.upcoming.map(({ project, days }) => card(project, html`<span className="hq-countdown"><b>${days}</b><small>${days === 1 ? "day" : "days"}</small></span>`))}</ul>`
          : html`<${Empty} icon="📡" title="Nothing scheduled ahead">Every title in the catalog is already out. New releases appear here with a countdown as soon as they are added.<//>`}
      </div>
      <div className="hq-radar-block">
        <h3>Fresh releases you have not started</h3>
        ${radar.fresh.length
          ? html`<ul className="hq-radar-grid">${radar.fresh.map(({ project, days }) => card(project, html`<span className="hq-countdown past"><b>${Math.abs(days) < 45 ? Math.abs(days) : Math.round(Math.abs(days) / 30)}</b><small>${Math.abs(days) < 45 ? "days ago" : "months ago"}</small></span>`))}</ul>`
          : html`<${Empty} icon="✅" title="You are caught up">No recent release (last 12 months) is waiting for you.<//>`}
      </div>
      <div className="hq-radar-block">
        <h3>Your queue</h3>
        ${radar.queue.length
          ? html`<ul className="hq-radar-grid">${radar.queue.map((p, i) => card(p, html`<span className="hq-countdown queue"><b>${i + 1}</b><small>${p.releaseYear}</small></span>`))}</ul>`
          : html`<${Empty} icon="🎉" title="Queue cleared">You have started or completed everything in your current mode.<//>`}
      </div>
    </section>`;
}
