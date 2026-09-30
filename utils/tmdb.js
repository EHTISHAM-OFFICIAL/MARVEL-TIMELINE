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
  return getRuntimeConfig().posters?.[project.id] || "";
}
