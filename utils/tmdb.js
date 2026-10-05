import { getRuntimeConfig } from "../store/siteConfig.js";

const FALLBACK_POSTERS = {
  "thunderbolts-2025": "https://image.tmdb.org/t/p/w500/hqcexYHbiTBfDIdDWxrxPtVndBX.jpg",
  "spider-man-brand-new-day-2026": "https://image.tmdb.org/t/p/w500/9JCQtDCSpPR2ld55yNlEg1VwcQo.jpg",
  "captain-america-brave-new-world-2025": "https://image.tmdb.org/t/p/w500/pzIddUEMWhWzfvLI3TwxUG2wGoi.jpg",
  "madame-web-2024": "https://image.tmdb.org/t/p/w500/rULWuutDcN5NvtiZi4FRPzRYWSh.jpg",
  "venom-last-dance-2024": "https://image.tmdb.org/t/p/w500/aosm8NMQ3UyoBVpSxyimorCQykC.jpg",
  "kraven-the-hunter-2024": "https://image.tmdb.org/t/p/w500/nrlfJoxP1EkBVE9pU62L287Jl4D.jpg",
  "new-mutants-2020": "https://image.tmdb.org/t/p/w500/xiDGcXJTvu1lazFRYip6g1eLt9c.jpg",
};

const TMDB_ID_FALLBACKS = {
  986056: "thunderbolts-2025",
  969681: "spider-man-brand-new-day-2026",
  822119: "captain-america-brave-new-world-2025",
  634492: "madame-web-2024",
  912649: "venom-last-dance-2024",
  539972: "kraven-the-hunter-2024",
  340102: "new-mutants-2020",
};

export function getTMDBToken() {
  return "";
}

export function setTMDBToken() {
  return "";
}

export function clearTMDBToken() {}

export function hasTMDBToken() {
  return Object.keys(getRuntimeConfig().posters || {}).length > 0;
}

export async function getTMDBPoster(project) {
  const runtimePosters = getRuntimeConfig().posters || {};
  const idAlias = project?.tmdbId ? TMDB_ID_FALLBACKS[Number(project.tmdbId)] : "";
  return (
    runtimePosters[project?.id] ||
    runtimePosters[project?.baseProjectId] ||
    (idAlias ? runtimePosters[idAlias] : "") ||
    FALLBACK_POSTERS[project?.id] ||
    (idAlias ? FALLBACK_POSTERS[idAlias] : "") ||
    ""
  );
}
