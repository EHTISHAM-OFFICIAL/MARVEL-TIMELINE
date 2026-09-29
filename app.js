import { html, render } from "htm/react";
import { useState, useEffect, useCallback } from "htm/react";

import { useUserData } from "./store/userData.js";
import { Sidebar, MobileNav } from "./components/Navigation.js";
import { ProjectDetail } from "./components/ProjectDetail.js";

import { Home } from "./pages/Home.js";
import { Timeline } from "./pages/Timeline.js";
import { Universes } from "./pages/Universes.js";
import { Franchises } from "./pages/Franchises.js";
import { TV } from "./pages/TV.js";
import { Animation } from "./pages/Animation.js";
import { ConnectionMap } from "./pages/ConnectionMap.js";
import { Search } from "./pages/Search.js";
import { Progress } from "./pages/Progress.js";
import { Favorites } from "./pages/Favorites.js";
import { Settings } from "./pages/Settings.js";

function App() {
  const store = useUserData();
  const [page, setPage] = useState("home");
  const [openProjectId, setOpenProjectId] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const navigate = useCallback((id) => setPage(id), []);
  const openProject = useCallback((id) => setOpenProjectId(id), []);
  const closeProject = useCallback(() => setOpenProjectId(null), []);

  const actions = {
    setStatus: store.setStatus,
    setRating: store.setRating,
    setNotes: store.setNotes,
    toggleFavorite: store.toggleFavorite,
    toggleEpisode: store.toggleEpisode,
    markAllEpisodes: store.markAllEpisodes,
    setWatchedDate: store.setWatchedDate,
    revealSpoilers: store.revealSpoilers,
    setPreference: store.setPreference,
    toggleUniverseHidden: store.toggleUniverseHidden,
    importData: store.importData,
    reset: store.reset,
  };

  const userData = store.data;
  useEffect(() => { document.documentElement.dataset.theme = userData.preferences.theme || "midnight"; }, [userData.preferences.theme]);

  let pageEl;
  switch (page) {
    case "home":
      pageEl = html`<${Home}
        userData=${userData}
        onOpen=${openProject}
        onNavigate=${navigate}
      />`;
      break;
    case "timeline":
      pageEl = html`<${Timeline} userData=${userData} onOpen=${openProject} />`;
      break;
    case "universes":
      pageEl = html`<${Universes}
        userData=${userData}
        onOpen=${openProject}
        onNavigate=${navigate}
        actions=${actions}
      />`;
      break;
    case "franchises":
      pageEl = html`<${Franchises}
        userData=${userData}
        onOpen=${openProject}
      />`;
      break;
    case "tv":
      pageEl = html`<${TV} userData=${userData} onOpen=${openProject} />`;
      break;
    case "animation":
      pageEl = html`<${Animation}
        userData=${userData}
        onOpen=${openProject}
      />`;
      break;
    case "map":
      pageEl = html`<${ConnectionMap}
        userData=${userData}
        onOpen=${openProject}
      />`;
      break;
    case "search":
      pageEl = html`<${Search} userData=${userData} onOpen=${openProject} />`;
      break;
    case "progress":
      pageEl = html`<${Progress} userData=${userData} onOpen=${openProject} />`;
      break;
    case "favorites":
      pageEl = html`<${Favorites}
        userData=${userData}
        onOpen=${openProject}
      />`;
      break;
    case "settings":
      pageEl = html`<${Settings} userData=${userData} actions=${actions} />`;
      break;
    default:
      pageEl = html`<${Home}
        userData=${userData}
        onOpen=${openProject}
        onNavigate=${navigate}
      />`;
  }

  return html`
    <div className="app">
      <${Sidebar} page=${page} onNavigate=${setPage} />
      <main className="main">${pageEl}</main>
      <${MobileNav} page=${page} onNavigate=${setPage} />
      ${openProjectId
        ? html`
            <${ProjectDetail}
              projectId=${openProjectId}
              userData=${userData}
              actions=${actions}
              onClose=${closeProject}
            />
          `
        : null}
    </div>
  `;
}

render(html`<${App} />`, document.getElementById("root"));
