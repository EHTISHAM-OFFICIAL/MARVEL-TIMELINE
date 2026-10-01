import { PROJECTS } from "../data/projects.js";
import { UNIVERSES } from "../data/universes.js";
import { FRANCHISES } from "../data/franchises.js";

const SEASON_RELEASE_DATES = {
  "loki-2021": ["2021-06-09", "2023-10-05"],
  "what-if-2021": ["2021-08-11", "2023-12-22", "2024-12-22"],
  "daredevil-born-again-2025": ["2025-03-04", "2026-03-24"],
  "agents-of-shield-2013": ["2013-09-24", "2014-09-23", "2015-03-03", "2016-09-20", "2017-12-01", "2019-05-10", "2020-05-27"],
  "agent-carter-2015": ["2015-01-06", "2016-01-19"],
  "daredevil-2015": ["2015-04-10", "2016-03-18", "2018-10-19"],
  "jessica-jones-2015": ["2015-11-20", "2018-03-08", "2019-06-14"],
  "luke-cage-2016": ["2016-09-30", "2018-06-22"],
  "iron-fist-2017": ["2017-03-17", "2018-09-07"],
  "punisher-2017": ["2017-11-17", "2019-01-18"],
  "runaways-2017": ["2017-11-21", "2018-12-21", "2019-12-13"],
  "cloak-dagger-2018": ["2018-06-07", "2019-04-04"],
  "x-men-97-2024": ["2024-03-20", "2026-07-01"],
};

const seasonReleaseDate = (project, seasonNumber) =>
  SEASON_RELEASE_DATES[project.id]?.[seasonNumber - 1] ||
  project.releaseDate ||
  String(project.releaseYear || "9999") + "-12-31";

const makeSeasonProject = (base, seasonNumber) => {
  const count = Array.isArray(base?.episodesBySeason)
    ? base.episodesBySeason[seasonNumber - 1]
    : 0;
  if (!base || !count) return undefined;
  const releaseDate = seasonReleaseDate(base, seasonNumber);
  return {
    ...base,
    id: base.id + "::season:" + seasonNumber,
    baseProjectId: base.id,
    seasonNumber,
    title: base.title + " — Season " + seasonNumber,
    seasons: 1,
    episodes: count,
    episodesBySeason: [count],
    releaseDate,
    releaseYear: Number(String(releaseDate).slice(0, 4)) || base.releaseYear,
    seasonReleaseDate: releaseDate,
    // A season-specific view must not inherit the parent series' relationship
    // IDs unchanged; Connection Map builds links from these normalized IDs.
    previous: seasonNumber > 1
      ? [base.id + "::season:" + (seasonNumber - 1)]
      : (base.previous || []).map((id) => id),
    following: seasonNumber < (base.episodesBySeason?.length || 1)
      ? [base.id + "::season:" + (seasonNumber + 1)]
      : (base.following || []).map((id) => id),
  };
};

export const expandProjectSeasons = (project) => {
  if (!Array.isArray(project?.episodesBySeason) || project.episodesBySeason.length <= 1)
    return [project];
  return project.episodesBySeason.map((_, index) => makeSeasonProject(project, index + 1)).filter(Boolean);
};

export const expandProjectsBySeasons = (projects = PROJECTS) =>
  projects.flatMap((project) => expandProjectSeasons(project));

const DISPLAY_RELEASE_ORDER = new Map(
  expandProjectsBySeasons(PROJECTS)
    .slice()
    .sort((a, b) =>
      String(a.releaseDate || "").localeCompare(String(b.releaseDate || "")) ||
      (a.releaseOrderIndex || 0) - (b.releaseOrderIndex || 0),
    )
    .map((project, index) => [project.id, index + 1]),
);

export const displayReleaseOrder = (project) =>
  DISPLAY_RELEASE_ORDER.get(project.id) || project.releaseOrderIndex || Number.MAX_SAFE_INTEGER;

export const getProject = (id) => {
  const direct = PROJECTS.find((p) => p.id === id);
  if (direct) return direct;
  const match = String(id || "").match(/^(.+)::season:(\d+)$/);
  if (!match) return undefined;
  const base = PROJECTS.find((p) => p.id === match[1]);
  return base ? makeSeasonProject(base, Number(match[2])) : undefined;
};
export const getUniverse = (id) =>
  UNIVERSES.find((u) => u.id === id) || { id, name: "Unknown", color: "#666" };
export const getFranchise = (id) => FRANCHISES.find((f) => f.id === id);
export const getProjectState = (project, data) => {
  const baseId = project?.baseProjectId || project?.id;
  const baseState = data?.projects?.[baseId] || {};
  if (project?.seasonNumber) {
    return baseState.seasonStates?.[String(project.seasonNumber)] || {};
  }
  return baseState;
};

export const statusOf = (id, data) => {
  const project = getProject(id);
  return getProjectState(project || { id }, data).status || "not-started";
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
  const total = Number(project.episodes) || 0;
  const base = PROJECTS.find((p) => p.id === baseId);
  const offset = project.seasonNumber && Array.isArray(base?.episodesBySeason)
    ? base.episodesBySeason.slice(0, project.seasonNumber - 1).reduce((a, b) => a + b, 0)
    : 0;
  const watched = Object.keys(episodes).filter((key) => episodes[key] === true);
  const seasonWatched = project.seasonNumber
    ? watched.filter((key) => Number(key) > offset && Number(key) <= offset + total).length
    : watched.length;
  return { watched: seasonWatched, total, percent: total ? Math.round((seasonWatched / total) * 100) : 0 };
}
