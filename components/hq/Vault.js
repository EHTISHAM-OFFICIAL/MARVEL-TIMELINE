import { html, useMemo, useState } from "htm/react";
import { vaultItems } from "../../utils/hq.js";
import { isSeries, getUniverse } from "../../utils/helpers.js";
import { PosterImage } from "../PosterProjectCard.js";
import { SectionHead, Empty, abbrevUniverse } from "./shared.js";

const FILTERS = [["all", "All"], ["fav", "Favorites"], ["movie", "Movies"], ["series", "Series"], ["top", "Rated 9+"]];
const fmt = (s) => { try { return s ? new Date(s).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : ""; } catch (e) { return ""; } };

export function Vault({ visible, userData, onOpen, onNavigate }) {
  const all = useMemo(() => vaultItems(visible, userData), [visible, userData]);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const list = useMemo(() => {
    const f = all.filter((x) => filter === "all" || (filter === "fav" && x.favorite) || (filter === "movie" && !isSeries(x.project)) || (filter === "series" && isSeries(x.project)) || (filter === "top" && x.rating >= 9));
    const s = f.slice();
    if (sort === "rating") s.sort((a, b) => b.rating - a.rating || (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
    else if (sort === "release") s.sort((a, b) => String(a.project.releaseDate).localeCompare(String(b.project.releaseDate)));
    else s.sort((a, b) => String(b.watchedDate).localeCompare(String(a.watchedDate)) || String(b.project.releaseDate).localeCompare(String(a.project.releaseDate)));
    return s;
  }, [all, filter, sort]);
  const rated = all.filter((x) => x.rating > 0);
  const avg = rated.length ? (rated.reduce((a, x) => a + x.rating, 0) / rated.length).toFixed(1) : "–";

  if (!all.length) return html`<section><${SectionHead} title="Collection Vault" blurb="Every title you complete is kept here as a collectible slab." /><${Empty} icon="🗄️" title="Your vault is empty" action=${html`<button type="button" className="btn btn-primary" onClick=${() => onNavigate("timeline")}>Browse the timeline</button>`}>Mark a title as Completed and its slab appears here, with your rating and watch date.<//></section>`;
  return html`
    <section aria-labelledby="hq-vt">
      <${SectionHead} title="Collection Vault" blurb="Every completed title, kept as a collectible slab. Favorites get a gold edge and perfect 10s glow.">
        <label className="hq-select"><span>Sort</span><select value=${sort} onChange=${(e) => setSort(e.target.value)}><option value="recent">Recently watched</option><option value="release">Release order</option><option value="rating">Highest rated</option></select></label>
      <//>
      <dl className="hq-facts">
        <div><dt>Collected</dt><dd>${all.length}</dd></div>
        <div><dt>Favorites</dt><dd>${all.filter((x) => x.favorite).length}</dd></div>
        <div><dt>Average rating</dt><dd>${avg}</dd></div>
        <div><dt>Perfect 10s</dt><dd>${all.filter((x) => x.rating === 10).length}</dd></div>
      </dl>
      <div className="hq-chips" role="radiogroup" aria-label="Filter vault">
        ${FILTERS.map(([id, label]) => html`<button key=${id} type="button" role="radio" aria-checked=${filter === id} className=${filter === id ? "active" : ""} onClick=${() => setFilter(id)}>${label}</button>`)}
      </div>
      ${list.length ? html`<ul className="hq-vault">
        ${list.map(({ project, favorite, rating, watchedDate }) => html`<li key=${project.id}>
          <button type="button" className=${"hq-slab" + (favorite ? " fav" : "") + (rating === 10 ? " perfect" : "")} style=${{ "--accent": getUniverse(project.universe).color }} onClick=${() => onOpen(project.id)} aria-label=${project.title + ", " + (rating ? rating + " out of 10" : "unrated") + (favorite ? ", favorite" : "")}>
            <span className="hq-slab-label"><span>${abbrevUniverse(getUniverse(project.universe).name)}</span><span>${project.releaseYear}</span></span>
            <span className="hq-slab-art"><${PosterImage} project=${project} />${favorite ? html`<i className="hq-slab-fav" aria-hidden="true">★</i>` : null}</span>
            <span className="hq-slab-info"><strong>${project.title}</strong><small>${rating ? "★ " + rating + "/10" : "Unrated"}${watchedDate ? " · " + fmt(watchedDate) : ""}</small></span>
          </button>
        </li>`)}
      </ul>` : html`<${Empty} icon="🔎" title="No slabs match this filter">Try a different filter.<//>`}
    </section>`;
}
