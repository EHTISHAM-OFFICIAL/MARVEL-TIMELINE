import { html, useEffect, useState } from "htm/react";
import { StatusDot } from "./StatusBadge.js";
import { getUniverse, statusOf, episodeProgress, isSeries } from "../utils/helpers.js";

const posterCache = new Map();

function PosterImage({ title, type }) {
  const [src, setSrc] = useState(() => posterCache.get(title) || "");
  const [loaded, setLoaded] = useState(Boolean(src));

  useEffect(() => {
    let cancelled = false;
    if (posterCache.has(title)) {
      setSrc(posterCache.get(title));
      setLoaded(true);
      return () => { cancelled = true; };
    }
    const controller = new AbortController();
    const url = "https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=thumbnail&pithumbsize=700&titles=" +
      encodeURIComponent(title) + "&origin=*";
    fetch(url, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        const pages = data?.query?.pages || {};
        const page = Object.values(pages)[0];
        const image = page?.thumbnail?.source;
        if (image && !cancelled) {
          posterCache.set(title, image);
          setSrc(image);
          setLoaded(true);
        }
      })
      .catch(() => {});
    return () => { cancelled = true; controller.abort(); };
  }, [title]);

  return html`
    <div className="poster-media">
      ${src ? html`<img src=${src} alt=${title + " poster"} loading="lazy" onLoad=${() => setLoaded(true)} className=${loaded ? "loaded" : ""} />` : null}
      <div className="poster-fallback">
        <span className="poster-fallback-mark">MARVEL</span>
        <strong>${title}</strong>
        <small>${type.replace(/-/g, " ")}</small>
      </div>
      <div className="poster-shade"></div>
    </div>
  `;
}

export function PosterProjectCard({ project, userData, onOpen }) {
  const u = getUniverse(project.universe);
  const status = statusOf(project.id, userData);
  const userP = userData.projects[project.id] || {};
  const ep = episodeProgress(project, userData);

  return html`
    <article className="poster-card" style=${{ "--accent": u.color }} onClick=${() => onOpen(project.id)} role="button" tabindex=${0}
      onKeyDown=${(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(project.id);
        }
      }}>
      <${PosterImage} title=${project.title} type=${project.type} />
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
