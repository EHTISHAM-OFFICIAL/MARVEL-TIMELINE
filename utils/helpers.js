import { PROJECTS } from "../data/projects.js";
import { UNIVERSES, getUniverse } from "../data/universes.js";
import { FRANCHISES } from "../data/franchises.js";

export { getUniverse };

export const STATUS_META = {
  "not-started": { label: "Not Started", dot: "○" },
  watching: { label: "Currently Watching", dot: "●" },
  completed: { label: "Completed", dot: "✓" },
  skipped: { label: "Skipped", dot: "—" },
  rewatching: { label: "Rewatching", dot: "↻" },
};

export const CONNECTION_LABELS = {
  "core-mcu": "Core MCU",
  "multiverse-relevant": "Multiverse Relevant",
  optional: "Optional",
  "legacy-context": "Legacy Context",
  "adjacent-related": "Adjacent / Related",
};

export function getProject(id) {
  return PROJECTS.find((p) => p.id === id) || null;
}

export function getFranchise(id) {
  return FRANCHISES.find((f) => f.id === id) || null;
}

export function formatRuntime(minutes) {
  if (!minutes || Number.isNaN(Number(minutes))) return null;
  const total = Number(minutes);
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return hours ? `${hours}h ${mins ? mins + "m" : ""}`.trim() : `${mins}m`;
}

export function statusOf(projectId, userData) {
  return userData?.projects?.[projectId]?.status || "not-started";
}

export function passesMode(project, mode = "simple-mcu") {
  if (!project) return false;

  switch (mode) {
    case "marvel-complete":
      return true;

    case "spider-man":
      return (project.franchises || []).includes("spider-man");

    case "x-men":
      return (project.franchises || []).some((id) =>
        ["x-men", "wolverine", "deadpool"].includes(id),
      );

    case "multiverse":
      return (
        project.connectionLevel === "multiverse-relevant" ||
        project.universe === "mcu-multiverse" ||
        project.universe === "mcu-earth-616" ||
        project.id === "spider-man-no-way-home-2021" ||
        (project.franchises || []).some((id) =>
          ["spider-man", "doctor-strange", "loki"].includes(id),
        )
      );

    case "simple-mcu":
    default:
      return project.canonStatus === "main-mcu";
  }
}

export function universeStats(userData, universeId) {
  const projects = PROJECTS.filter((p) => p.universe === universeId);
  const completed = projects.filter(
    (p) => statusOf(p.id, userData) === "completed",
  ).length;
  return { total: projects.length, completed };
}

export function visibleProjects(userData) {
  const prefs = userData?.preferences || {};
  const mode = prefs.explorationMode || "simple-mcu";
  const hidden = prefs.hiddenUniverses || [];

  return PROJECTS.filter(
    (p) => passesMode(p, mode) && !hidden.includes(p.universe),
  );
}

export { PROJECTS, UNIVERSES, FRANCHISES };
