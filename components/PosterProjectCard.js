import { html, useEffect, useState } from "htm/react";
import { StatusDot } from "./StatusBadge.js";
import { getUniverse, statusOf, episodeProgress, isSeries } from "../utils/helpers.js";
import { getTMDBPoster, hasTMDBToken } from "../utils/tmdb.js";

const posterCache = new Map();

function PosterImage({ project }) {
  const [src, setSrc] = useState(() => posterCache.get(project.id) || "");
  const [loaded, setLoaded] = useState(Boolean(src));
  const [missing, setMissing] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    if (!hasTMDBToken()) { setMissing(true); return () => controller.abort(); }
    getTMDBPoster(project, controller.signal).then((image) => {
      if (cancelled) return;
      if (image) { posterCache.set(project.id, image); setSrc(image); setLoaded(false); setMissing(false); } else setMissing(true);
    });
    return () => { cancelled = true; controller.abort(); };
  }, [project.id, project.title, project.releaseYear]);
  return html`
    <div className=${"poster-media " + (loaded ? "has-image" : "")}>
      ${src ? html`<img src=${src} alt=${project.title + " poster"} loading="lazy" onLoad=${() => setLoaded(true)} onError=${() => { setLoaded(false); setMissing(true); }} className=${loaded ? "loaded" : ""} />` : null}
      <div className="poster-fallback"><span className="poster-fallback-mark">MARVEL</span><strong>${project.title}</strong><small>${missing ? "Poster unavailable" : "Loading poster…"}</small></div>
      <div className="poster-shade"></div>
    </div>
  `;
}

export function PosterProjectCard({ project, userData, onOpen }) {
  const u = getUniverse(project.universe);
  const status = statusOf(project.id, userData);
  const userP = userData.projects[project.baseProjectId || project.id] || {};
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
        <div className="poster-meta"><span>${project.releaseYear}</span><span className="poster-universe" style=${{ color: u.color }}>${u.name}</span></div>
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
