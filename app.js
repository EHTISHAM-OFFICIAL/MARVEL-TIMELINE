import { html, render } from "htm/react";
import { useState, useEffect, useCallback } from "htm/react";
import { useAuth, logout, deleteAccount, authErrorMessage } from "./auth.js";
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
  const getRoute = () => window.location.pathname.replace(/\/+$/, "") === "/admin" ? "admin" : "home";
  const [page, setPage] = useState(getRoute);
  const [openProjectId, setOpenProjectId] = useState(null);
  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  useEffect(() => {
    const onPopState = () => setPage(getRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => {
    if (!adminAccess.loading && !adminAccess.isAdmin && window.location.pathname === "/admin") {
      window.history.replaceState({}, "", "/");
      setPage("home");
    }
  }, [adminAccess.loading, adminAccess.isAdmin]);
  const navigate = useCallback((id) => {
    if (id === "admin") {
      window.history.pushState({}, "", "/admin");
      setPage("admin");
      return;
    }
    if (window.location.pathname === "/admin") window.history.pushState({}, "", "/");
    setPage(id);
  }, []);
  const openProject = useCallback((id) => setOpenProjectId(id), []);
  const closeProject = useCallback(() => setOpenProjectId(null), []);
  const handleDeleteAccount = useCallback(async () => {
    if (!authState.user) return;
    const confirmed = confirm(
      "Delete your account permanently? Your Marvel tracking data, favorites, ratings, notes, episode progress, preferences, and account access will be deleted. This cannot be undone."
    );
    if (!confirmed) return;

    const password = prompt("For security, enter your account password to confirm deletion.");
    if (password === null) return;
    if (!password) {
      alert("A password is required to delete the account.");
      return;
    }

    try {
      await deleteAccount(password);
      alert("Your account has been permanently deleted.");
    } catch (error) {
      alert(authErrorMessage(error));
    }
  }, [authState.user]);
  const actions = {
    setStatus: store.setStatus, setRating: store.setRating, setNotes: store.setNotes,
    toggleFavorite: store.toggleFavorite, toggleEpisode: store.toggleEpisode, markAllEpisodes: store.markAllEpisodes,
    setWatchedDate: store.setWatchedDate, revealSpoilers: store.revealSpoilers, setPreference: store.setPreference,
    toggleUniverseHidden: store.toggleUniverseHidden, importData: store.importData, reset: store.reset,
  };
  useEffect(() => { applyThemePackage(store.data?.preferences?.theme || siteConfig.activeTheme); document.title = (siteConfig.site?.brand || "MARVEL TIMELINE") + " — " + (siteConfig.site?.tagline || "Marvel Tracker"); }, [store.data?.preferences?.theme, siteConfig.activeTheme, siteConfig.themes, siteConfig.site]);
  if (authState.loading) return html`<main className="auth-loading"><div><div className="auth-spinner"></div><p>Loading your Marvel archive…</p></div></main>`;
  if (!authState.user) return html`<${AuthScreen} adminMode=${window.location.pathname.replace(/\/+$/, "") === "/admin"} />`;
  if (!store.ready) return html`<main className="auth-loading"><div><div className="auth-spinner"></div><p>Syncing your Marvel archive…</p></div></main>`;
  if (siteConfig.site?.maintenance && !adminAccess.loading && !adminAccess.isAdmin) return html`<main className="auth-loading"><div><div className="auth-spinner">✦</div><h2>We are tuning the archive</h2><p>${siteConfig.site?.welcomeText || "The site is temporarily unavailable."}</p></div></main>`;
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
    <${Sidebar} page=${page} onNavigate=${navigate} user=${authState.user} onSignOut=${logout} onDeleteAccount=${handleDeleteAccount} isAdmin=${adminAccess.isAdmin} siteConfig=${siteConfig} />
    <main className="main">
      ${store.syncError ? html`<div className="sync-warning">⚠ ${store.syncError} <button onClick=${() => location.reload()}>Retry</button></div>` : null}
      ${pageEl}
    </main>
    <${MobileNav} page=${page} onNavigate=${navigate} isAdmin=${adminAccess.isAdmin} />
    ${openProjectId ? html`<${ProjectDetail} projectId=${openProjectId} userData=${userData} actions=${actions} onClose=${closeProject} />` : null}
  </div>`;

}

render(html`<${App} />`, document.getElementById("root"));