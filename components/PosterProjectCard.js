import { html, useEffect, useState } from "htm/react";
import { StatusDot } from "./StatusBadge.js";
import { getUniverse, statusOf, episodeProgress, isSeries, getProjectState } from "../utils/helpers.js";
import { getTMDBPoster } from "../utils/tmdb.js";

const posterCache = new Map();
const TYPE_ICON = { movie: "🎬", "animated-movie": "🎨", "tv-series": "📺", "limited-series": "📺", "animated-series": "🎨", special: "✨" };

export function PosterImage({ project }) {
  const poster = getTMDBPoster(project);
  const [src, setSrc] = useState(poster || "");
  const [loaded, setLoaded] = useState(false);
  const [missing, setMissing] = useState(!poster);

  useEffect(() => {
    const next = getTMDBPoster(project);
    setSrc(next || "");
    setLoaded(false);
    setMissing(!next);
  }, [project.id, project.title, project.releaseYear, project.tmdbId, project.baseProjectId]);

  return html`
    <div className=${"poster-media " + (loaded ? "has-image" : "")}>
      ${src ? html`<img
        src=${src}
        alt=${project.title + " poster"}
        loading="eager"
        decoding="async"
        onLoad=${() => { setLoaded(true); setMissing(false); }}
        onError=${() => { setLoaded(false); setMissing(true); }}
        className=${loaded ? "loaded" : ""}
      />` : null}
      <div className="poster-fallback"><span className="poster-fallback-mark">MARVEL</span><span className="poster-fallback-icon" aria-hidden="true">${TYPE_ICON[project.type] || "🎞️"}</span><strong>${project.title}</strong><small>${[project.releaseYear, project.type.replace(/-/g, " ")].filter(Boolean).join(" · ")}${missing ? "" : " · loading…"}</small></div>
      <div className="poster-shade"></div>
    </div>
  `;
}
export function PosterProjectCard({ project, userData, onOpen }) {
  const u = getUniverse(project.universe);
  const status = statusOf(project.id, userData);
  const userP = getProjectState(project, userData);
  const ep = episodeProgress(project, userData);

  return html`
    <article className="poster-card" style=${{ "--accent": u.color }} onClick=${() => onOpen(project.id)} role="button" tabindex=${0}
      onKeyDown=${(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(project.id);
        }
      }}>
      <${PosterImage} project=${project} />
      <div className="poster-card-body">
        <div className="poster-topline">
          <span className="poster-type">${project.type.replace(/-/g, " ")}</span>
          ${userP.favorite ? html`<span className="poster-fav">★</span>` : null}
        </div>
        <h3>${project.title}</h3>
        <div className="poster-meta"><span>${project.releaseYear}</span><span className="poster-universe" style=${{ color: "color-mix(in srgb, " + u.color + " 62%, var(--text))" }}>${u.name}</span></div>
        ${project.phase ? html`<span className="badge phase">PHASE ${project.phase}</span>` : null}
        ${isSeries(project) && ep.total ? html`
          <div className="poster-episodes">
            <div><span>Episodes</span><b>${ep.watched}/${ep.total}</b></div>
            <div className="progress"><div style=${{ width: ep.percent + "%" }}></div></div>
          </div>` : null}
        <div className="poster-status"><${StatusDot} status=${status} /><span>${status.replace(/-/g, " ")}</span></div>
      </div>
    </article>
  `;
}
