import { getRuntimeConfig } from "../store/siteConfig.js";

export function getTMDBToken() {
  return "";
}

export function setTMDBToken() {
  return "";
}

export function clearTMDBToken() {}

export function hasTMDBToken() {
  return Boolean(Object.keys(getRuntimeConfig().posters || {}).length);
}

export async function getTMDBPoster(project) {
  const posters = getRuntimeConfig().posters || {};
  const aliases = { 912649: "venom-the-last-dance-2024", 340102: "the-new-mutants-2020" };
  const alias = project.tmdbId ? aliases[String(project.tmdbId)] : "";
  return posters?.[project.id] || posters?.[project.baseProjectId || project.id] || (alias ? posters?.[alias] : "") || "";
}
