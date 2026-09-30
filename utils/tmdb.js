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
  return posters?.[project.id] || posters?.[project.baseProjectId || project.id] || "";
}
