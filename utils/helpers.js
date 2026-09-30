import { PROJECTS } from "../data/projects.js";
import { UNIVERSES } from "../data/universes.js";
import { FRANCHISES } from "../data/franchises.js";

export const getProject = (id) => {
  const direct = PROJECTS.find((p) => p.id === id);
  if (direct) return direct;
  const match = String(id || "").match(/^(.+)::season:(\d+)$/);
  if (!match) return undefined;
  const base = PROJECTS.find((p) => p.id === match[1]);
  const seasonNumber = Number(match[2]);
  const count = Array.isArray(base?.episodesBySeason)
    ? base.episodesBySeason[seasonNumber - 1]
    : 0;
  if (!base || !count) return undefined;
  return {
    ...base,
    id,
    baseProjectId: base.id,
    seasonNumber,
    title: base.title + " — Season " + seasonNumber,
    seasons: 1,
    episodes: count,
    episodesBySeason: [count],
    releaseYear: base.releaseYear,
  };
};
export const getUniverse = (id) =>
  UNIVERSES.find((u) => u.id === id) || { id, name: "Unknown", color: "#666" };
export const getFranchise = (id) => FRANCHISES.find((f) => f.id === id);
export const statusOf = (id, data) => {
  const project = getProject(id);
  const baseId = project?.baseProjectId || id;
  return data.projects[baseId]?.status || "not-started";
};

export function formatRuntime(min) {
  if (!min) return null;
  const h = Math.floor(min / 60),
    m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function passesMode(p, mode) {
  if (mode === "marvel-complete") return true;
  if (mode === "simple-mcu")
    return p.universe === "mcu-earth-616" || p.universe === "mcu-multiverse";
  if (mode === "spider-man") return (p.franchises || []).includes("spider-man");
  if (mode === "x-men")
    return ["x-men", "wolverine", "deadpool"].some((f) =>
      (p.franchises || []).includes(f),
    );
  if (mode === "multiverse")
    return (
      p.connectionLevel === "multiverse-relevant" ||
      p.universe === "mcu-multiverse"
    );
  return true;
}

export const STATUS_META = {
  "not-started": { label: "Not Started", dot: "⚪" },
  watching: { label: "Watching", dot: "🟡" },
  completed: { label: "Completed", dot: "🟢" },
  skipped: { label: "Skipped", dot: "🔴" },
  rewatching: { label: "Rewatching", dot: "🔵" },
};

export const CONNECTION_LABELS = {
  "core-mcu": "Core MCU",
  "mcu-connection": "MCU Connection",
  "multiverse-relevant": "Multiverse Relevant",
  "legacy-context": "Legacy Context",
  optional: "Optional",
};


export function isSeries(project) {
  return ["tv-series", "limited-series", "animated-series"].includes(project?.type);
}

export function episodeProgress(project, data) {
  if (!isSeries(project) || !project.episodes) return { watched: 0, total: 0, percent: 0 };
  const baseId = project.baseProjectId || project.id;
  const episodes = data.projects[baseId]?.episodes || {};
  const watched = Object.keys(episodes).filter((key) => episodes[key] === true).length;
  const total = Number(project.episodes) || 0;
  const offset = project.seasonNumber && Array.isArray(PROJECTS.find((p) => p.id === project.baseProjectId)?.episodesBySeason)
    ? PROJECTS.find((p) => p.id === project.baseProjectId).episodesBySeason.slice(0, project.seasonNumber - 1).reduce((a, b) => a + b, 0)
    : 0;
  const seasonWatched = project.seasonNumber
    ? Object.keys(episodes).filter((key) => episodes[key] === true && Number(key) > offset && Number(key) <= offset + total).length
    : watched;
  return { watched: seasonWatched, total, percent: total ? Math.round((seasonWatched / total) * 100) : 0 };
}
