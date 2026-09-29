import { useCallback, useEffect, useState } from "htm/react";
import { UNIVERSES } from "../data/universes.js";

const STORAGE_KEY = "marvel-timeline-user-data-v1";

const DEFAULT_DATA = {
  version: 1,
  projects: {},
  preferences: {
    explorationMode: "simple-mcu",
    defaultTimeline: "release",
    showAllSpoilers: false,
    hiddenUniverses: [],
    theme: "midnight",
  },
};

function cloneDefault() {
  return {
    version: DEFAULT_DATA.version,
    projects: {},
    preferences: {
      ...DEFAULT_DATA.preferences,
      hiddenUniverses: [],
      theme: "midnight",
    },
  };
}

function normalizeProject(value) {
  if (!value || typeof value !== "object") return {};
  const allowedStatuses = [
    "not-started",
    "watching",
    "completed",
    "skipped",
    "rewatching",
  ];
  return {
    status: allowedStatuses.includes(value.status)
      ? value.status
      : "not-started",
    favorite: Boolean(value.favorite),
    rating:
      Number.isFinite(Number(value.rating)) && Number(value.rating) >= 1
        ? Math.min(10, Number(value.rating))
        : 0,
    notes: typeof value.notes === "string" ? value.notes : "",
    watchedDate:
      typeof value.watchedDate === "string" ? value.watchedDate : "",
    spoilersRevealed: Boolean(value.spoilersRevealed),
    episodes: value.episodes && typeof value.episodes === "object"
      ? Object.fromEntries(Object.entries(value.episodes).filter(([, v]) => v === true))
      : {},
  };
}

function normalizeData(value) {
  const base = cloneDefault();
  if (!value || typeof value !== "object") return base;

  const projects = {};
  if (value.projects && typeof value.projects === "object") {
    Object.entries(value.projects).forEach(([id, project]) => {
      projects[id] = normalizeProject(project);
    });
  }

  const preferences = value.preferences || {};
  const hidden = Array.isArray(preferences.hiddenUniverses)
    ? preferences.hiddenUniverses.filter((id) =>
        UNIVERSES.some((u) => u.id === id),
      )
    : [];

  const allowedThemes = ["midnight","stark","cosmic","wakanda","mystic","retro"];
  return {
    version: 1,
    projects,
    preferences: {
      explorationMode:
        typeof preferences.explorationMode === "string"
          ? preferences.explorationMode
          : base.preferences.explorationMode,
      defaultTimeline:
        typeof preferences.defaultTimeline === "string"
          ? preferences.defaultTimeline
          : base.preferences.defaultTimeline,
      showAllSpoilers: Boolean(preferences.showAllSpoilers),
      hiddenUniverses: hidden,
      theme: allowedThemes.includes(preferences.theme) ? preferences.theme : base.preferences.theme,
    },
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeData(JSON.parse(raw)) : cloneDefault();
  } catch (error) {
    console.warn("Could not load Marvel tracking data:", error);
    return cloneDefault();
  }
}

export function useUserData() {
  const [data, setData] = useState(loadData);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.warn("Could not save Marvel tracking data:", error);
    }
  }, [data]);

  const updateProject = useCallback((projectId, patch) => {
    setData((current) => ({
      ...current,
      projects: {
        ...current.projects,
        [projectId]: {
          ...normalizeProject(current.projects[projectId]),
          ...patch,
        },
      },
    }));
  }, []);

  const toggleEpisode = useCallback((projectId, episodeNumber) => {
    setData((current) => {
      const project = normalizeProject(current.projects[projectId]);
      const episodes = { ...(project.episodes || {}) };
      const key = String(episodeNumber);
      if (episodes[key]) delete episodes[key];
      else episodes[key] = true;
      return {
        ...current,
        projects: {
          ...current.projects,
          [projectId]: { ...project, episodes },
        },
      };
    });
  }, []);

  const markAllEpisodes = useCallback((projectId, total, watched) => {
    setData((current) => {
      const project = normalizeProject(current.projects[projectId]);
      const episodes = {};
      if (watched) for (let i = 1; i <= total; i++) episodes[String(i)] = true;
      return {
        ...current,
        projects: {
          ...current.projects,
          [projectId]: { ...project, episodes },
        },
      };
    });
  }, []);

  const setStatus = useCallback(
    (projectId, status) => {
      updateProject(projectId, { status });
    },
    [updateProject],
  );

  const setRating = useCallback(
    (projectId, rating) => {
      updateProject(projectId, { rating: Number(rating) || 0 });
    },
    [updateProject],
  );

  const setNotes = useCallback(
    (projectId, notes) => {
      updateProject(projectId, { notes: String(notes ?? "") });
    },
    [updateProject],
  );

  const toggleFavorite = useCallback(
    (projectId) => {
      setData((current) => ({
        ...current,
        projects: {
          ...current.projects,
          [projectId]: {
            ...normalizeProject(current.projects[projectId]),
            favorite: !Boolean(current.projects[projectId]?.favorite),
          },
        },
      }));
    },
    [],
  );

  const setWatchedDate = useCallback(
    (projectId, watchedDate) => {
      updateProject(projectId, { watchedDate: String(watchedDate || "") });
    },
    [updateProject],
  );

  const revealSpoilers = useCallback(
    (projectId) => {
      updateProject(projectId, { spoilersRevealed: true });
    },
    [updateProject],
  );

  const setPreference = useCallback((key, value) => {
    setData((current) => ({
      ...current,
      preferences: {
        ...current.preferences,
        [key]: value,
      },
    }));
  }, []);

  const toggleUniverseHidden = useCallback((universeId) => {
    setData((current) => {
      const hidden = current.preferences.hiddenUniverses || [];
      const next = hidden.includes(universeId)
        ? hidden.filter((id) => id !== universeId)
        : [...hidden, universeId];

      return {
        ...current,
        preferences: {
          ...current.preferences,
          hiddenUniverses: next,
        },
      };
    });
  }, []);

  const importData = useCallback((incoming) => {
    setData(normalizeData(incoming));
  }, []);

  const reset = useCallback(() => {
    setData(cloneDefault());
  }, []);

  return {
    data,
    setStatus,
    setRating,
    setNotes,
    toggleFavorite,
    toggleEpisode,
    markAllEpisodes,
    setWatchedDate,
    revealSpoilers,
    setPreference,
    toggleUniverseHidden,
    importData,
    reset,
  };
}
