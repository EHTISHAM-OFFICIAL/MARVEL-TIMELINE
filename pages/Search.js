import { html, useState, useMemo } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { UNIVERSES } from "../data/universes.js";
import { ProjectCard } from "../components/ProjectCard.js";
import { PosterProjectCard } from "../components/PosterProjectCard.js";
import { getUniverse, getFranchise, statusOf, STATUS_META } from "../utils/helpers.js";

export function Search({ userData, onOpen }) {
  const prefs = userData.preferences;
  const [query, setQuery] = useState("");
  const [filterUniverse, setFilterUniverse] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [layout, setLayout] = useState("grid");

  const types = useMemo(() => [...new Set(PROJECTS.map((p) => p.type))], []);
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PROJECTS.filter((p) => {
      if (prefs.hiddenUniverses.includes(p.universe)) return false;
      if (filterUniverse !== "all" && p.universe !== filterUniverse) return false;
      if (filterType !== "all" && p.type !== filterType) return false;
      const s = statusOf(p.id, userData);
      if (filterStatus !== "all" && s !== filterStatus) return false;
      if (!q) return true;
      const haystack = [p.title, p.shortDescription, p.whyItMatters, ...(p.characters || []), ...(p.franchises || []).map(getFranchise).filter(Boolean).map((f) => f.name), getUniverse(p.universe).name, p.phase ? "phase " + p.phase : "", String(p.releaseYear), p.type.replace(/-/g, " ")].join(" ").toLowerCase();
      return haystack.includes(q);
    }).sort((a, b) => a.releaseOrderIndex - b.releaseOrderIndex);
  }, [query, filterUniverse, filterType, filterStatus, userData, prefs.hiddenUniverses]);

  return html`
    <div>
      <div className="page-heading-row"><div><h1>Search</h1><p className="subtitle">Search by title, character, universe, franchise, phase, year, or type.</p></div></div>
      <div className="search-wrap"><span className="ico">🔍</span><input type="search" value=${query} onInput=${(e) => setQuery(e.target.value)} placeholder="Spider-Man, Wolverine, Phase 3, X-Men..." autofocus /></div>
      <div style=${{ marginBottom: "20px" }}><label>Filters</label><div className="filters">
        <select value=${filterUniverse} onChange=${(e) => setFilterUniverse(e.target.value)} style=${{ width: "auto" }}><option value="all">All Universes</option>${UNIVERSES.map((u) => html`<option key=${u.id} value=${u.id}>${u.name}</option>`)}</select>
        <select value=${filterType} onChange=${(e) => setFilterType(e.target.value)} style=${{ width: "auto" }}><option value="all">All Types</option>${types.map((t) => html`<option key=${t} value=${t}>${t.replace(/-/g, " ")}</option>`)}</select>
        <select value=${filterStatus} onChange=${(e) => setFilterStatus(e.target.value)} style=${{ width: "auto" }}><option value="all">All Statuses</option>${Object.entries(STATUS_META).map(([k, m]) => html`<option key=${k} value=${k}>${m.label}</option>`)}</select>
      </div></div>
      <div className="section-header"><h2>${results.length} result${results.length !== 1 ? "s" : ""}</h2><div className="view-toggle" aria-label="Search result layout"><button className=${layout === "grid" ? "active" : ""} onClick=${() => setLayout("grid")}>▦ Grid</button><button className=${layout === "list" ? "active" : ""} onClick=${() => setLayout("list")}>☰ List</button></div></div>
      ${layout === "grid" ? html`<div className="poster-grid">${results.map((p) => html`<${PosterProjectCard} key=${p.id} project=${p} userData=${userData} onOpen=${onOpen} />`)}</div>` : html`<div className="grid">${results.map((p) => html`<${ProjectCard} key=${p.id} project=${p} userData=${userData} onOpen=${onOpen} />`)}</div>`}
      ${results.length === 0 ? html`<div className="empty"><div className="empty-ico">🔍</div><div className="empty-title">No matches</div><div className="empty-desc">Try a different search or clear filters.</div></div>` : null}
    </div>
  `;
}