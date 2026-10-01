import { html, useMemo, useState } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { StatusDot } from "../components/StatusBadge.js";
import { PosterProjectCard } from "../components/PosterProjectCard.js";
import { statusOf, passesMode, isSeries, episodeProgress, expandProjectsBySeasons, displayReleaseOrder, getProjectState } from "../utils/helpers.js";

export function Progress({ userData, onOpen }) {
  const prefs = userData.preferences;
  const [journeyLayout, setJourneyLayout] = useState("grid");
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const visible = useMemo(
    () =>
      expandProjectsBySeasons(PROJECTS).filter(
        (p) =>
          passesMode(p, prefs.explorationMode) &&
          !prefs.hiddenUniverses.includes(p.universe),
      ),
    [prefs],
  );

  const order = useMemo(
    () =>
      visible.slice().sort((a, b) => displayReleaseOrder(a) - displayReleaseOrder(b)),
    [visible],
  );

  const completed = order.filter(
    (p) => statusOf(p.id, userData) === "completed",
  );
  const watching = order.filter((p) => statusOf(p.id, userData) === "watching");
  const episodeStats = order.reduce((acc, p) => {
    if (!isSeries(p)) return acc;
    const ep = episodeProgress(p, userData);
    acc.watched += ep.watched;
    acc.total += ep.total;
    return acc;
  }, { watched: 0, total: 0 });
  const next = order.find((p) => statusOf(p.id, userData) === "not-started");

  const byPhase = {};
  order.forEach((p) => {
    if (!p.phase) return;
    if (!byPhase[p.phase]) byPhase[p.phase] = { total: 0, done: 0 };
    byPhase[p.phase].total++;
    if (statusOf(p.id, userData) === "completed") byPhase[p.phase].done++;
  });

  const allCompleted = (fid) => {
    const list = order.filter((p) => (p.franchises || []).includes(fid));
    return (
      list.length > 0 &&
      list.every((p) => statusOf(p.id, userData) === "completed")
    );
  };

  const totalCompleted = completed.length;
  const totalFavorites = order.filter((p) => getProjectState(p,userData).favorite).length;
  const rated = order.filter((p) => Number(getProjectState(p,userData).rating) > 0).length;
  const fullyTracked = order.filter((p) => { if (!isSeries(p)) return statusOf(p.id,userData) === "completed"; const e=episodeProgress(p,userData); return e.total > 0 && e.watched === e.total; }).length;
  const completionPercent = order.length ? Math.round((totalCompleted / order.length) * 100) : 0;
  const spiderList = order.filter((p) => (p.franchises || []).includes("spider-man"));
  const xmenList = order.filter((p) => (p.franchises || []).includes("x-men"));
  const spiderDone = spiderList.filter((p) => statusOf(p.id, userData) === "completed").length;
  const xmenDone = xmenList.filter((p) => statusOf(p.id, userData) === "completed").length;
  const spiderTotal = spiderList.length;
  const xmenTotal = xmenList.length;
  const multiverseTracked = order.filter((p) => (p.connectionLevel === "multiverse-relevant" || p.universe === "mcu-multiverse") && statusOf(p.id, userData) === "completed").length;

  const achievements = [
    { id:"first-step", icon:"🎬", name:"First Scene", detail:"Complete your first project. Every Marvel archive starts somewhere.", unlocked:totalCompleted>=1, progress:totalCompleted+" / 1" },
    { id:"origin-story", icon:"🛡️", name:"Origin Story", detail:"Complete 3 projects and establish the beginning of your personal Marvel journey.", unlocked:totalCompleted>=3, progress:Math.min(totalCompleted,3)+" / 3" },
    { id:"five", icon:"🥉", name:"Getting Started", detail:"Complete 5 projects. You are officially building a catalog.", unlocked:totalCompleted>=5, progress:Math.min(totalCompleted,5)+" / 5" },
    { id:"ten", icon:"⭐", name:"Ten Down", detail:"Complete 10 projects and reach your first double-digit milestone.", unlocked:totalCompleted>=10, progress:Math.min(totalCompleted,10)+" / 10" },
    { id:"twenty-five", icon:"🏅", name:"Quarter Century", detail:"Complete 25 projects. A quarter of the way to the 100-project milestone.", unlocked:totalCompleted>=25, progress:Math.min(totalCompleted,25)+" / 25" },
    { id:"fifty", icon:"🏆", name:"Half-Century", detail:"Complete 50 projects. A major archive milestone.", unlocked:totalCompleted>=50, progress:Math.min(totalCompleted,50)+" / 50" },
    { id:"hundred", icon:"👑", name:"Century Club", detail:"Complete 100 projects and reach the tracker's 100-project milestone.", unlocked:totalCompleted>=100, progress:Math.min(totalCompleted,100)+" / 100" },
    { id:"favorite-five", icon:"💎", name:"Collector", detail:"Save 5 projects as favorites. Your personal shortlist is taking shape.", unlocked:totalFavorites>=5, progress:Math.min(totalFavorites,5)+" / 5" },
    { id:"favorite-ten", icon:"🗃️", name:"Curator", detail:"Save 10 projects as favorites and build a larger personal collection.", unlocked:totalFavorites>=10, progress:Math.min(totalFavorites,10)+" / 10" },
    { id:"rated-ten", icon:"📝", name:"Critic", detail:"Rate 10 projects from their detail pages.", unlocked:rated>=10, progress:Math.min(rated,10)+" / 10" },
    { id:"rated-twenty-five", icon:"🎞️", name:"Director's Cut", detail:"Rate 25 projects and leave your own record of the archive.", unlocked:rated>=25, progress:Math.min(rated,25)+" / 25" },
    { id:"episode-25", icon:"📺", name:"Binge Begins", detail:"Watch 25 tracked episodes across your series.", unlocked:episodeStats.watched>=25, progress:Math.min(episodeStats.watched,25)+" / 25" },
    { id:"episode-50", icon:"⚡", name:"Binge Watcher", detail:"Watch 50 tracked episodes.", unlocked:episodeStats.watched>=50, progress:Math.min(episodeStats.watched,50)+" / 50" },
    { id:"episode-100", icon:"🔥", name:"Episode Hunter", detail:"Watch 100 tracked episodes. TV is now a serious part of your archive.", unlocked:episodeStats.watched>=100, progress:Math.min(episodeStats.watched,100)+" / 100" },
    { id:"episode-250", icon:"🌟", name:"Episode Legend", detail:"Watch 250 tracked episodes across the Marvel television catalog.", unlocked:episodeStats.watched>=250, progress:Math.min(episodeStats.watched,250)+" / 250" },
    { id:"series-master", icon:"📚", name:"Season Finale", detail:"Fully track 5 series by marking every episode watched.", unlocked:fullyTracked>=5, progress:Math.min(fullyTracked,5)+" / 5" },
    { id:"series-archivist", icon:"🗂️", name:"Series Archivist", detail:"Fully track 10 complete series, episode by episode.", unlocked:fullyTracked>=10, progress:Math.min(fullyTracked,10)+" / 10" },
    { id:"phase-1", icon:"1️⃣", name:"Phase One", detail:"Complete every currently visible project assigned to MCU Phase 1.", unlocked:Boolean(byPhase[1]&&byPhase[1].done===byPhase[1].total), progress:byPhase[1]?byPhase[1].done+" / "+byPhase[1].total:"0 / 0" },
    { id:"phase-2", icon:"2️⃣", name:"Phase Two", detail:"Complete every currently visible project assigned to MCU Phase 2.", unlocked:Boolean(byPhase[2]&&byPhase[2].done===byPhase[2].total), progress:byPhase[2]?byPhase[2].done+" / "+byPhase[2].total:"0 / 0" },
    { id:"phase-3", icon:"3️⃣", name:"Phase Three", detail:"Complete every currently visible project assigned to MCU Phase 3.", unlocked:Boolean(byPhase[3]&&byPhase[3].done===byPhase[3].total), progress:byPhase[3]?byPhase[3].done+" / "+byPhase[3].total:"0 / 0" },
    { id:"phase-4", icon:"4️⃣", name:"Phase Four", detail:"Complete every currently visible project assigned to MCU Phase 4.", unlocked:Boolean(byPhase[4]&&byPhase[4].done===byPhase[4].total), progress:byPhase[4]?byPhase[4].done+" / "+byPhase[4].total:"0 / 0" },
    { id:"spider-man", icon:"🕷️", name:"Spider-Man Complete", detail:"Complete every visible project tagged with the Spider-Man franchise.", unlocked:spiderDone===spiderTotal, progress:spiderDone+" / "+spiderTotal },
    { id:"x-men", icon:"⚡", name:"X-Men Complete", detail:"Complete every visible project tagged with the X-Men franchise.", unlocked:xmenDone===xmenTotal&&xmenTotal>0, progress:xmenDone+" / "+xmenTotal },
    { id:"multiverse-five", icon:"🌌", name:"Multiverse Explorer", detail:"Complete 5 projects marked as multiverse-relevant or part of the MCU multiverse continuity.", unlocked:multiverseTracked>=5, progress:Math.min(multiverseTracked,5)+" / 5" },
    { id:"three-quarters", icon:"🚀", name:"Archive Vanguard", detail:"Reach 75% overall completion in your current exploration mode.", unlocked:completionPercent>=75, progress:Math.min(completionPercent,75)+"% / 75%" },
  ];
  const selected = selectedAchievement ? achievements.find((a) => a.id === selectedAchievement) : null;

  return html`
    <div>
      <h1>MY MARVEL JOURNEY</h1>
      <p className="subtitle">
        Your visual progress through the Marvel catalog
      </p>

      <div className="stat-grid" style=${{ marginBottom: "24px" }}>
        <div className="stat">
          <div className="num">${completed.length}</div>
          <div className="label">Completed</div>
        </div>
        <div className="stat">
          <div className="num">${watching.length}</div>
          <div className="label">Watching</div>
        </div>
        <div className="stat">
          <div className="num">
            ${order.length - completed.length - watching.length}
          </div>
          <div className="label">Remaining</div>
        </div>
        <div className="stat">
          <div className="num">${episodeStats.watched}<small>/${episodeStats.total}</small></div>
          <div className="label">Episodes Watched</div>
        </div>
      </div>

      <div className="section-header">
        <div>
          <h2>Achievements</h2>
          <p className="text-faint achievement-hint">Hover a trophy for a quick description, or click it for full details.</p>
        </div>
        <span className="badge core">${achievements.filter((a) => a.unlocked).length}/${achievements.length} unlocked</span>
      </div>
      <div className="ach-grid">
        ${achievements.map((a) => html`
          <button type="button" key=${a.id} className=${"ach " + (a.unlocked ? "unlocked" : "locked") + (selectedAchievement === a.id ? " selected" : "")} data-tooltip=${a.detail} aria-label=${a.name + ": " + a.detail} onClick=${() => setSelectedAchievement(selectedAchievement === a.id ? null : a.id)}>
            <div className="ach-ico">${a.unlocked ? a.icon : "🔒"}</div>
            <div className="ach-copy"><div className="ach-name">${a.name}</div><div className="ach-desc">${a.progress}</div></div>
            <span className="ach-arrow">›</span>
          </button>
        `)}
      </div>
      ${selected ? html`
        <div className=${"achievement-detail " + (selected.unlocked ? "unlocked" : "locked")}>
          <div className="achievement-detail-icon">${selected.unlocked ? selected.icon : "🔒"}</div>
          <div>
            <div className="eyebrow">${selected.unlocked ? "ACHIEVEMENT UNLOCKED" : "ACHIEVEMENT LOCKED"}</div>
            <h3>${selected.name}</h3>
            <p>${selected.detail}</p>
            <span className="achievement-progress">${selected.progress}</span>
          </div>
          <button className="btn ghost sm" onClick=${() => setSelectedAchievement(null)}>Close</button>
        </div>
      ` : null}

      <div className="section-header">
        <div>
          <h2>Release-Order Journey</h2>
          <p className="text-faint">Browse the tracked catalog as posters or compact rows.</p>
        </div>
        <div className="view-toggle" aria-label="Journey layout">
          <button className=${journeyLayout === "grid" ? "active" : ""} onClick=${() => setJourneyLayout("grid")}>▦ Grid</button>
          <button className=${journeyLayout === "list" ? "active" : ""} onClick=${() => setJourneyLayout("list")}>☰ List</button>
        </div>
      </div>
      ${journeyLayout === "grid"
        ? html`<div className="poster-grid">${order.map((p) => html`<${PosterProjectCard} key=${p.id} project=${p} userData=${userData} onOpen=${onOpen} />`)}</div>`
        : html`<div className="row-list">${order.map((p) => {
            const status = statusOf(p.id, userData);
            const isNext = next && next.id === p.id;
            return html`<div key=${p.id} className="row" onClick=${() => onOpen(p.id)} style=${isNext ? { borderColor: "var(--red)", background: "rgba(230,36,41,0.06)" } : {}}>
              <${StatusDot} status=${status} />
              <div className="r-title">${p.title}</div>
              <div className="r-meta">${p.releaseYear}</div>
              ${isNext ? html`<span className="badge core">Next up</span>` : null}
            </div>`;
          })}</div>`}
    </div>
  `;
}
