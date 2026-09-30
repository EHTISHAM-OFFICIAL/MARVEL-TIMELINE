import { getRuntimeConfig } from "../store/siteConfig.js";
const TOKEN_KEY = "marvel-timeline-tmdb-token";
const cache = new Map();
const pending = new Map();
export function getTMDBToken() { try { return localStorage.getItem(TOKEN_KEY) || ""; } catch { return ""; } }
export function setTMDBToken(token) { const value = String(token || "").trim(); try { if (value) localStorage.setItem(TOKEN_KEY, value); else localStorage.removeItem(TOKEN_KEY); } catch {} return value; }
export function clearTMDBToken() { try { localStorage.removeItem(TOKEN_KEY); } catch {} }
export function hasTMDBToken() { return Boolean(getTMDBToken() || Object.keys(getRuntimeConfig().posters || {}).length); }
function queryTitle(project) { return project.title.replace(/\s+Season\s+\d+$/i, "").replace(/\s+Series$/i, "").trim(); }
function expectedType(project) { return project.type === "movie" || project.type === "animated-movie" || project.type === "special" ? "movie" : "tv"; }
function scoreResult(result, project) {
  const title = String(result.title || result.name || "").toLowerCase(), wanted = queryTitle(project).toLowerCase();
  let score = title === wanted ? 100 : (title.includes(wanted) || wanted.includes(title) ? 55 : 0);
  const year = Number(String(result.release_date || result.first_air_date || "").slice(0, 4));
  if (year === project.releaseYear) score += 35; else if (Math.abs(year - project.releaseYear) === 1) score += 15;
  if (result.poster_path) score += 20; if (result.media_type === expectedType(project)) score += 25; return score;
}
async function searchTMDB(project, signal) {
  const token = getTMDBToken(); if (!token) return "";
  const key = project.id + "|" + project.title + "|" + project.releaseYear;
  if (cache.has(key)) return cache.get(key); if (pending.has(key)) return pending.get(key);
  const promise = (async () => {
    const params = new URLSearchParams({ query: queryTitle(project), include_adult: "false", language: "en-US", page: "1" });
    const response = await fetch("https://api.themoviedb.org/3/search/multi?" + params.toString(), { signal, headers: { Authorization: "Bearer " + token, accept: "application/json" } });
    if (!response.ok) throw new Error("TMDB request failed: " + response.status);
    const data = await response.json(), wantedType = expectedType(project);
    const candidates = (data.results || []).filter((item) => item.media_type === wantedType && item.poster_path);
    const best = candidates.sort((a,b) => scoreResult(b, project) - scoreResult(a, project))[0];
    const path = best?.poster_path || ""; cache.set(key, path); return path;
  })().catch(() => "");
  pending.set(key, promise); try { return await promise; } finally { pending.delete(key); }
}
export async function getTMDBPoster(project, signal) {
  const publicPoster = getRuntimeConfig().posters?.[project.id];
  if (publicPoster) return publicPoster;
  const path = await searchTMDB(project, signal);
  return path ? "https://image.tmdb.org/t/p/w500" + path : "";
}
export { TOKEN_KEY };