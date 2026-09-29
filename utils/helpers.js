import { PROJECTS } from "../data/projects.js";
import { UNIVERSES } from "../data/universes.js";
import { FRANCHISES } from "../data/franchises.js";

export const getProject = (id) => PROJECTS.find((p) => p.id === id);
export const getUniverse = (id) =>
  UNIVERSES.find((u) => u.id === id) || { id, name: "Unknown", color: "#666" };
export const getFranchise = (id) => FRANCHISES.find((f) => f.id === id);
export const statusOf = (id, data) =>
  data.projects[id]?.status || "not-started";

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
