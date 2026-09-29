import { html } from "htm/react";
import { useMemo } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { StatusDot } from "../components/StatusBadge.js";
import { statusOf, passesMode } from "../utils/helpers.js";

export function Progress({ userData, onOpen }) {
  const prefs = userData.preferences;
  const visible = useMemo(
    () =>
      PROJECTS.filter(
        (p) =>
          passesMode(p, prefs.explorationMode) &&
          !prefs.hiddenUniverses.includes(p.universe),
      ),
    [prefs],
  );

  const order = useMemo(
    () =>
      visible.slice().sort((a, b) => a.releaseOrderIndex - b.releaseOrderIndex),
    [visible],
  );

  const completed = order.filter(
    (p) => statusOf(p.id, userData) === "completed",
  );
  const watching = order.filter((p) => statusOf(p.id, userData) === "watching");
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

  const achievements = [
    {
      id: "phase-1",
      icon: "🏆",
      name: "Phase 1 Complete",
      desc: "Complete all Phase 1 MCU films",
      unlocked: byPhase[1] && byPhase[1].done === byPhase[1].total,
    },
    {
      id: "phase-2",
      icon: "🏆",
      name: "Phase 2 Complete",
      desc: "Complete all Phase 2 MCU films",
      unlocked: byPhase[2] && byPhase[2].done === byPhase[2].total,
    },
    {
      id: "phase-3",
      icon: "🏆",
      name: "Phase 3 Complete",
      desc: "Complete all Phase 3 MCU films",
      unlocked: byPhase[3] && byPhase[3].done === byPhase[3].total,
    },
    {
      id: "phase-4",
      icon: "🏆",
      name: "Phase 4 Complete",
      desc: "Complete all Phase 4 MCU projects",
      unlocked: byPhase[4] && byPhase[4].done === byPhase[4].total,
    },
    {
      id: "spider-man",
      icon: "🕷️",
      name: "Spider-Man Complete",
      desc: "Complete all Spider-Man projects",
      unlocked: allCompleted("spider-man"),
    },
    {
      id: "x-men",
      icon: "⚡",
      name: "X-Men Complete",
      desc: "Complete all X-Men-related projects",
      unlocked: allCompleted("x-men"),
    },
    {
      id: "fifty",
      icon: "⭐",
      name: "50 Projects Watched",
      desc: "Complete 50 projects",
      unlocked: completed.length >= 50,
    },
    {
      id: "hundred",
      icon: "🌟",
      name: "100 Projects Watched",
      desc: "Complete 100 projects",
      unlocked: completed.length >= 100,
    },
  ];

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
      </div>

      <div className="section-header"><h2>Achievements</h2></div>
      <div className="ach-grid">
        ${achievements.map(
          (a) => html`
            <div
              key=${a.id}
              className=${"ach " + (a.unlocked ? "unlocked" : "locked")}
            >
              <div className="ach-ico">${a.unlocked ? a.icon : "🔒"}</div>
              <div>
                <div className="ach-name">${a.name}</div>
                <div className="ach-desc">${a.desc}</div>
              </div>
            </div>
          `,
        )}
      </div>

      <div className="section-header"><h2>Release-Order Journey</h2></div>
      <div className="row-list">
        ${order.map((p) => {
          const status = statusOf(p.id, userData);
          const isNext = next && next.id === p.id;
          return html`
            <div
              key=${p.id}
              className="row"
              onClick=${() => onOpen(p.id)}
              style=${isNext
                ? {
                    borderColor: "var(--red)",
                    background: "rgba(230,36,41,0.06)",
                  }
                : {}}
            >
              <${StatusDot} status=${status} />
              <div className="r-title">${p.title}</div>
              <div className="r-meta">${p.releaseYear}</div>
              ${isNext
                ? html`<span className="badge core">Next up</span>`
                : null}
            </div>
          `;
        })}
      </div>
    </div>
  `;
}
