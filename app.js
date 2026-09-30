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
import { Admin } from "./pages/admin-panel.js?v=20260930-admin-module1";
import { useAdminAccess } from "./store/admin.js";
import { useSiteConfig, applyThemePackage } from "./store/siteConfig.js";

function App() {
  const authState = useAuth();
  const adminAccess = useAdminAccess(authState.user);
  const isAdminRoute = () => window.location.pathname.replace(/\/+$/, "") === "/admin";
  // On /admin, never start the normal user-data path while administrator verification has failed.
  // That used to produce a misleading second "Missing or insufficient permissions" error.
  const accountMode = adminAccess.loading || (isAdminRoute() && adminAccess.error)
    ? null
    : adminAccess.isAdmin;
  const store = useUserData(authState.user, accountMode);
  const siteConfig = useSiteConfig();
  const getRoute = () => isAdminRoute() ? "admin" : "home";
  const [page, setPage] = useState(getRoute);
  const [openProjectId, setOpenProjectId] = useState(null);
  const [showAdminAuthorizedPrompt, setShowAdminAuthorizedPrompt] = useState(() => {
    try {
      return isAdminRoute() && sessionStorage.getItem("marvel-admin-authorized-prompt") === "1";
    } catch {
      return false;
    }
  });
  useEffect(() => { window.scrollTo(0, 0); }, [page]);
  useEffect(() => {
    const onPopState = () => setPage(getRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  useEffect(() => {
    if (adminAccess.loading || !authState.user) return;
    if (isAdminRoute() && !adminAccess.isAdmin && !adminAccess.error) {
      // Only redirect a verified non-admin account. If authorization failed
      // because Firestore could not be read, keep the page visible so the user
      // receives the actual plain-English error instead of being silently logged out.
      logout();
      return;
    }
    if (!isAdminRoute() && adminAccess.isAdmin) {
      // After successful admin sign-in, let the administrator deliberately
      // choose whether to open the public site or the admin console.
      let publicView = false;
      try { publicView = sessionStorage.getItem("marvel-admin-public-view") === "1"; } catch {}
      if (!publicView) {
        window.history.replaceState({}, "", "/admin");
        setPage("admin");
      }
    }
  }, [adminAccess.loading, adminAccess.isAdmin, authState.user]);
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
  if (!authState.user) return html`<${AuthScreen} adminMode=${isAdminRoute()} />`;
  if (isAdminRoute() && adminAccess.loading) return html`<main className="auth-loading"><div><div className="auth-spinner"></div><p>Verifying administrator access…</p></div></main>`;
  if (showAdminAuthorizedPrompt && authState.user && adminAccess.isAdmin) return html\`<main className="admin-authorized-overlay">
    <section className="admin-authorized-card" role="dialog" aria-modal="true" aria-labelledby="admin-authorized-title">
      <div className="admin-authorized-badge">✓</div>
      <span className="admin-authorized-kicker">SECURITY CHECK PASSED</span>
      <h1 id="admin-authorized-title">AUTHORIZED</h1>
      <p>Administrator credentials verified. You can now choose where you want to go.</p>
      <div className="admin-authorized-account">Signed in as <strong>${authState.user.displayName || authState.user.email || "Administrator"}</strong></div>
      <div className="admin-authorized-actions">
        <button className="btn admin-authorized-secondary" onClick=${() => {
          try {
            sessionStorage.removeItem("marvel-admin-authorized-prompt");
            sessionStorage.setItem("marvel-admin-public-view", "1");
          } catch {}
          window.history.replaceState({}, "", "/");
          setShowAdminAuthorizedPrompt(false);
          setPage("home");
        }}>View Public Site</button>
        <button className="btn admin-authorized-primary" onClick=${() => {
          try { sessionStorage.removeItem("marvel-admin-authorized-prompt"); } catch {}
          window.history.replaceState({}, "", "/admin");
          setShowAdminAuthorizedPrompt(false);
          setPage("admin");
        }}>Continue to Admin Console</button>
      </div>
    </section>
  </main>`;
  if (isAdminRoute() && !adminAccess.isAdmin) return html`<main className="auth-loading"><div className="admin-access-denied">
    <div className="admin-denied-mark">!</div>
    <h2>Administrator access unavailable</h2>
    <p>${adminAccess.error || "This signed-in account is not authorized to access the administrator panel."}</p>
    <p className="admin-denied-account">Signed in as <strong>${authState.user?.displayName || authState.user?.email || "current account"}</strong></p>
    <div className="admin-denied-actions">
      <button className="btn" onClick=${logout}>Sign out</button>
      <button className="btn" onClick=${() => { window.history.replaceState({}, "", "/admin"); location.reload(); }}>Try again</button>
    </div>
  </div></main>`;
  if (!store.ready) {
    if (store.syncError) return html`<main className="auth-loading"><div className="cloud-error-card"><div className="cloud-error-icon">!</div><h2>Cloud sync unavailable</h2><p>${store.syncError}</p><div className="cloud-error-actions"><button className="btn" onClick=${() => location.reload()}>Retry</button><button className="btn" onClick=${logout}>Sign out</button></div></div></main>`;
    return html`<main className="auth-loading"><div><div className="auth-spinner"></div><p>Syncing your Marvel archive…</p></div></main>`;
  }
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