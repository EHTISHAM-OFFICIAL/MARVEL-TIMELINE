import { html } from "htm/react";
import { useMemo } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { ProjectCard } from "../components/ProjectCard.js";
import { PosterProjectCard } from "../components/PosterProjectCard.js";
import { getUniverse, statusOf, passesMode, isSeries, episodeProgress } from "../utils/helpers.js";

export function Home({ userData, onOpen, onNavigate }) {
  const prefs=userData.preferences;
  const visible=useMemo(()=>PROJECTS.filter(p=>passesMode(p,prefs.explorationMode)&&!prefs.hiddenUniverses.includes(p.universe)),[prefs.explorationMode,prefs.hiddenUniverses]);
  const done=visible.filter(p=>statusOf(p.id,userData)==="completed").length;
  const watching=visible.filter(p=>statusOf(p.id,userData)==="watching");
  const favorites=visible.filter(p=>(userData.projects[p.id]||{}).favorite);
  const episodeStats=visible.reduce((a,p)=>{if(isSeries(p)){const e=episodeProgress(p,userData);a.watched+=e.watched;a.total+=e.total;}return a;},{watched:0,total:0});
  const nextUp=useMemo(()=>{const order=visible.slice().sort((a,b)=>prefs.defaultTimeline==="chronological"?(a.chronologicalOrderIndex??99999)-(b.chronologicalOrderIndex??99999):a.releaseOrderIndex-b.releaseOrderIndex);return order.find(p=>statusOf(p.id,userData)==="not-started");},[visible,userData,prefs.defaultTimeline]);
  const recent=useMemo(()=>visible.filter(p=>statusOf(p.id,userData)==="completed"&&(userData.projects[p.id]||{}).watchedDate).sort((a,b)=>((userData.projects[b.id]||{}).watchedDate||"").localeCompare((userData.projects[a.id]||{}).watchedDate||"")).slice(0,6),[visible,userData]);
  const featured=visible.slice().sort((a,b)=>a.releaseOrderIndex-b.releaseOrderIndex).slice(0,8);
  const percent=visible.length?Math.round(done/visible.length*100):0;
  return html`
    <div className="home-page">
      <section className="home-hero"><div className="hero-grid"></div><div className="hero-content"><div className="hero-kicker">THE MARVEL ARCHIVE</div><h1>YOUR MARVEL<br/><span>JOURNEY.</span></h1><p>One cinematic command center for everything you are watching, completing, rating and discovering.</p><div className="hero-actions">${nextUp?html`<button className="btn btn-primary" onClick=${()=>onOpen(nextUp.id)}>▶ Continue to ${nextUp.title}</button>`:null}<button className="btn" onClick=${()=>onNavigate("timeline")}>Explore Timeline →</button></div></div><div className="hero-orbit"><div className="hero-orbit-ring"></div><div className="hero-orbit-core">M</div></div></section>
      <section className="home-command"><div><span className="eyebrow">COMMAND CENTER</span><h2>Your journey at a glance</h2></div><div className="home-progress-ring" style=${{"--progress":percent*3.6+"deg"}}><strong>${percent}%</strong><small>complete</small></div><div className="home-stat"><b>${done}</b><span>Projects completed</span></div><div className="home-stat"><b>${watching.length}</b><span>Currently watching</span></div><div className="home-stat"><b>${episodeStats.watched}</b><span>Episodes watched</span></div><div className="home-stat"><b>${favorites.length}</b><span>Favorites</span></div></section>
      ${nextUp?html`<section className="home-next card" style=${{"--accent":getUniverse(nextUp.universe).color}} onClick=${()=>onOpen(nextUp.id)}><div><span className="eyebrow">NEXT DESTINATION · ${prefs.defaultTimeline==="chronological"?"STORY ORDER":"RELEASE ORDER"}</span><h2>${nextUp.title}</h2><p>${nextUp.shortDescription}</p></div><div className="next-arrow">→</div></section>`:null}
      ${watching.length?html`<section><div className="section-header"><h2>Continue Watching</h2><button className="text-btn" onClick=${()=>onNavigate("progress")}>View progress →</button></div><div className="poster-grid home-poster-grid">${watching.slice(0,6).map(p=>html`<${PosterProjectCard} key=${p.id} project=${p} userData=${userData} onOpen=${onOpen}/>` )}</div></section>`:null}
      <section><div className="section-header"><h2>Featured Archive</h2><button className="text-btn" onClick=${()=>onNavigate("timeline")}>Open full timeline →</button></div><div className="poster-grid home-poster-grid">${featured.map(p=>html`<${PosterProjectCard} key=${p.id} project=${p} userData=${userData} onOpen=${onOpen}/>` )}</div></section>
      ${recent.length?html`<section><div className="section-header"><h2>Recently Completed</h2></div><div className="grid">${recent.map(p=>html`<${ProjectCard} key=${p.id} project=${p} userData=${userData} onOpen=${onOpen}/>` )}</div></section>`:null}
      <section className="home-explore"><div><span className="eyebrow">EXPLORE THE ARCHIVE</span><h2>Choose your path</h2><p>Jump between timelines, universes, franchises and connections without losing your personal progress.</p></div><div className="explore-actions"><button onClick=${()=>onNavigate("universes")}>🌌 Universes</button><button onClick=${()=>onNavigate("franchises")}>✦ Franchises</button><button onClick=${()=>onNavigate("map")}>⌘ Connection Map</button><button onClick=${()=>onNavigate("progress")}>🏆 Achievements</button></div></section>
    </div>`;
}