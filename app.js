import { html, render } from "htm/react";
import { useState, useEffect, useCallback } from "htm/react";
import { useAuth, logout } from "./auth.js";
import { useUserData } from "./store/userData.js";
import { AuthScreen } from "./components/AuthScreen.js";
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
import { Admin } from "./pages/Admin.js";
import { useAdminAccess } from "./store/admin.js";
import { useSiteConfig, applyThemePackage } from "./store/siteConfig.js";

function App() {
  const authState = useAuth();
  const store = useUserData(authState.user);
  const adminAccess = useAdminAccess(authState.user);
  const siteConfig = useSiteConfig();
  const [page, setPage] = useState("home");
  const [openProjectId, setOpenProjectId] = useState(null);
  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  const navigate = useCallback((id) => setPage(id), []);
  const openProject = useCallback((id) => setOpenProjectId(id), []);
  const closeProject = useCallback(() => setOpenProjectId(null), []);
  const actions = {
    setStatus: store.setStatus, setRating: store.setRating, setNotes: store.setNotes,
    toggleFavorite: store.toggleFavorite, toggleEpisode: store.toggleEpisode, markAllEpisodes: store.markAllEpisodes,
    setWatchedDate: store.setWatchedDate, revealSpoilers: store.revealSpoilers, setPreference: store.setPreference,
    toggleUniverseHidden: store.toggleUniverseHidden, importData: store.importData, reset: store.reset,
  };
  useEffect(() => {
    if (store.data?.preferences?.theme) document.documentElement.dataset.theme = store.data.preferences.theme;
  }, [store.data?.preferences?.theme]);
  if (authState.loading) return html`<main className="auth-loading"><div><div className="auth-spinner"></div><p>Loading your Marvel archive…</p></div></main>`;
  if (!authState.user) return html`<${AuthScreen} />`;
  if (!store.ready) return html`<main className="auth-loading"><div><div className="auth-spinner"></div><p>Syncing your Marvel archive…</p></div></main>`;
  const userData = store.data;
  let pageEl;
  switch (page) {
    case "home": pageEl = html`<${Home} userData=${userData} user=${authState.user} siteConfig=${siteConfig} onOpen=${openProject} onNavigate=${navigate} />`; break;
    case "timeline": pageEl = html`<${Timeline} userData=${userData} onOpen=${openProject} />`; break;
    case "universes": pageEl = html`<${Universes} userData=${userData} onOpen=${openProject} onNavigate=${navigate} actions=${actions} />`; break;
    case "franchises": pageEl = html`<${Franchises} userData=${userData} onOpen=${openProject} />`; break;
    case "tv": pageEl = html`<${TV} userData=${userData} onOpen=${openProject} />`; break;
    case "animation": pageEl = html`<${Animation} userData=${userData} onOpen=${openProject} />`; break;
    case "map": pageEl = html`<${ConnectionMap} userData=${userData} onOpen=${openProject} />`; break;
    case "search": pageEl = html`<${Search} userData=${userData} onOpen=${openProject} />`; break;
    case "progress": pageEl = html`<${Progress} userData=${userData} onOpen=${openProject} />`; break;
    case "favorites": pageEl = html`<${Favorites} userData=${userData} onOpen=${openProject} />`; break;
    case "settings": pageEl = html`<${Settings} userData=${userData} actions=${actions} user=${authState.user} onSignOut=${logout} />`; break;
    case "admin": pageEl = adminAccess.isAdmin ? html`<${Admin} user=${authState.user} onSignOut=${logout} />` : html`<${Home} userData=${userData} user=${authState.user} siteConfig=${siteConfig} onOpen=${openProject} onNavigate=${navigate} />`; break;
    default: pageEl = html`<${Home} userData=${userData} user=${authState.user} siteConfig=${siteConfig} onOpen=${openProject} onNavigate=${navigate} />`;
  }
  return html`<div className="app">
    <${Sidebar} page=${page} onNavigate=${setPage} user=${authState.user} onSignOut=${logout} isAdmin=${adminAccess.isAdmin} />
    <main className="main">
      ${store.syncError ? html`<div className="sync-warning">⚠ ${store.syncError} <button onClick=${() => location.reload()}>Retry</button></div>` : null}
      ${pageEl}
    </main>
    <${MobileNav} page=${page} onNavigate=${setPage} />
    ${openProjectId ? html`<${ProjectDetail} projectId=${openProjectId} userData=${userData} actions=${actions} onClose=${closeProject} />` : null}
  </div>`;
}

render(html`<${App} />`, document.getElementById("root"));