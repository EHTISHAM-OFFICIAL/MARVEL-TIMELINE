import { html, useEffect, useState } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { expandProjectsBySeasons, getProjectState } from "../utils/helpers.js";
import { DEFAULT_SITE_CONFIG, applyThemePackage } from "../store/siteConfig.js";
import {
  loadAdminConfig,
  loadAdminUsers,
  removeAdminUser,
  saveAdminThemeConfig,
  savePrivateConfig,
  setAdminUser,
} from "../store/admin.js";

const fields = [
  ["bg", "Background"],
  ["bg2", "Surface 2"],
  ["bg3", "Surface 3"],
  ["card", "Card"],
  ["cardHover", "Card hover"],
  ["border", "Border"],
  ["borderBright", "Bright border"],
  ["text", "Text"],
  ["textDim", "Secondary text"],
  ["textFaint", "Muted text"],
  ["red", "Accent"],
  ["redBright", "Accent bright"],
  ["gold", "Gold"],
  ["green", "Success"],
  ["blue", "Info"],
  ["purple", "Purple"],
  ["radius", "Radius"],
  ["radiusSm", "Small radius"],
  ["glow1", "Top glow"],
  ["glow2", "Bottom glow"],
];
const localDateTimeValue = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate())+"T"+pad(d.getHours())+":"+pad(d.getMinutes());
};

const metrics = (d) => {
  const p = Object.values(d.projects || {});
  const completed = p.filter((x) => x.status === "completed");
  const completedMovies = completed.filter((x) => {
    const project = PROJECTS.find((item) => item.id === x.id);
    return project?.type === "movie" || project?.type === "animated-movie";
  }).length;
  const completedShows = completed.filter((x) => {
    const project = PROJECTS.find((item) => item.id === x.id);
    return ["limited-series", "tv-series", "animated-series"].includes(project?.type);
  }).length;
  return {
    completed: completed.length,
    completedMovies,
    completedShows,
    active: p.filter(
      (x) => x.status === "watching" || x.status === "rewatching",
    ).length,
    favorites: p.filter((x) => x.favorite).length,
    episodes: p.reduce(
      (n, x) =>
        n +
        Object.values(x.episodes || {}).filter((value) => Boolean(value)).length,
      0,
    ),
  };
};

const watchCategory = (project) => {
  if (project.type === "movie" || project.type === "animated-movie") return "Movie";
  if (
    project.type === "limited-series" ||
    project.type === "tv-series" ||
    project.type === "animated-series"
  )
    return "Series / TV";
  return "Other";
};

const formatEpisodeKey = (key) => {
  const raw = String(key || "");
  const match = raw.match(/^(?:s)?(\d+)[\s._-]*(?:e)?(\d+)$/i);
  return match ? "S" + match[1] + " · E" + match[2] : raw;
};

const getWatchHistory = (d) =>
  expandProjectsBySeasons(PROJECTS).map((project) => {
    const baseId = project.baseProjectId || project.id;
    const baseState = d?.projects?.[baseId];
    const state = getProjectState(project, d || { projects: {} });
    if (!baseState || (!state && !baseState)) return null;
    const allWatchedEpisodes = Object.entries(baseState.episodes || {}).filter(
      ([, value]) => Boolean(value),
    );
    const base = PROJECTS.find((p) => p.id === baseId);
    const offset = project.seasonNumber && Array.isArray(base?.episodesBySeason)
      ? base.episodesBySeason
          .slice(0, project.seasonNumber - 1)
          .reduce((a, b) => a + b, 0)
      : 0;
    const total = Number(project.episodes || 0);
    const watchedEpisodes = project.seasonNumber
      ? allWatchedEpisodes
          .filter(([key]) => Number(key) > offset && Number(key) <= offset + total)
          .map(([key]) => [
            "S" + project.seasonNumber + " · E" + (Number(key) - offset),
            true,
          ])
      : allWatchedEpisodes.map(([key, value]) => [formatEpisodeKey(key), value]);
    const watched =
      state.status === "completed" ||
      state.status === "watching" ||
      state.status === "rewatching" ||
      state.status === "skipped" ||
      Boolean(state.watchedDate) ||
      Boolean(state.favorite) ||
      Boolean(state.rating) ||
      Boolean(state.notes) ||
      watchedEpisodes.length > 0;
    if (!watched) return null;
    return { project, state, watchedEpisodes, category: watchCategory(project) };
  }).filter(Boolean);

export function Admin({ user, onSignOut }) {
  const [tab, setTab] = useState("overview"),
    [users, setUsers] = useState([]),
    [config, setConfig] = useState(DEFAULT_SITE_CONFIG),
    [privateConfig, setPrivateConfig] = useState({}),
    [selected, setSelected] = useState(null),
    [themeId, setThemeId] = useState("midnight"),
    [uid, setUid] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const refresh = async () => {
    setBusy(true);
    try {
      const [u, c] = await Promise.all([loadAdminUsers(), loadAdminConfig()]);
      setUsers(u);
      setConfig({ ...DEFAULT_SITE_CONFIG, ...c.public });
      setPrivateConfig(c.private || {});
      setThemeId(c.public?.activeTheme || "midnight");
    } catch (e) {
      setNotice(e.message || "Could not load admin data.");
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await refresh();
      // Keep the public poster catalog self-healing: whenever the administrator
      // opens the console, newly added catalog entries are resolved from TMDB
      // using the protected credential. The token is never published to clients.
      if (cancelled) return;
      const token = privateConfig.tmdb?.readAccessToken || "";
      if (token) await syncPosters({ silent: true });
    })();
    return () => { cancelled = true; };
  }, []);
  const totals = users.reduce(
    (a, u) => {
      const m = metrics(u);
      a.completed += m.completed;
      a.completedMovies += m.completedMovies;
      a.completedShows += m.completedShows;
      a.episodes += m.episodes;
      return a;
    },
    { completed: 0, completedMovies: 0, completedShows: 0, episodes: 0 },
  );
  const theme = config.themes?.[themeId] || DEFAULT_SITE_CONFIG.themes.midnight;
  const editTheme = (k, v) =>
    setConfig((c) => ({
      ...c,
      themes: {
        ...c.themes,
        [themeId]: {
          ...c.themes[themeId],
          vars: { ...c.themes[themeId].vars, [k]: v },
        },
      },
    }));
  const newTheme = () => {
    const id = "custom-" + Date.now();
    setConfig((c) => ({
      ...c,
      themes: {
        ...c.themes,
        [id]: {
          ...theme,
          id,
          name: "New Theme",
          description: "Custom theme",
          vars: { ...theme.vars },
        },
      },
    }));
    setThemeId(id);
  };
  const publish = async () => {
    setBusy(true);
    try {
      await saveAdminThemeConfig(config);
      applyThemePackage(themeId);
      setNotice("Changes published.");
    } catch (e) {
      setNotice(e.message || "Publish failed.");
    } finally {
      setBusy(false);
    }
  };
  const saveTMDB = async () => {
    setBusy(true);
    try {
      await savePrivateConfig({
        tmdb: { readAccessToken: privateConfig.tmdb?.readAccessToken || "" },
      });
      setNotice("TMDB credential saved in protected admin configuration.");
    } catch (e) {
      setNotice(e.message || "TMDB save failed.");
    } finally {
      setBusy(false);
    }
  };
  const syncPosters = async ({ silent = false } = {}) => {
    const token = privateConfig.tmdb?.readAccessToken || "";
    if (!token) {
      if (!silent) setNotice("Save a TMDB token first.");
      return false;
    }
    if (!silent) {
      setBusy(true);
      setNotice("Syncing poster URLs from TMDB…");
    }
    try {
      const posters = { ...(config.posters || {}) };
      const normalize = (value) =>
        String(value || "")
          .toLowerCase()
          .replace(/&/g, "and")
          .replace(/[^a-z0-9]+/g, "")
          .trim();
      for (const p of PROJECTS) {
        const wanted =
          p.type === "movie" ||
          p.type === "animated-movie" ||
          p.type === "special"
            ? "movie"
            : "tv";
        let best = null;

        // Canonical TMDB IDs are preferred whenever the catalog entry has one.
        // This prevents similarly named titles from receiving the wrong poster.
        if (p.tmdbId) {
          const endpoint = wanted === "movie"
            ? "movie/" + encodeURIComponent(p.tmdbId)
            : "tv/" + encodeURIComponent(p.tmdbId);
          const res = await fetch(
            "https://api.themoviedb.org/3/" + endpoint + "?language=en-US",
            {
              headers: {
                Authorization: "Bearer " + token,
                accept: "application/json",
              },
            },
          );
          if (res.ok) {
            const item = await res.json();
            if (item.poster_path) best = item;
          }
        }

        // Fallback for future entries that do not have a TMDB ID yet.
        if (!best) {
          const q = p.title.replace(/\s+Season\s+\d+$/i, "").trim();
          const params = new URLSearchParams({
            query: q,
            include_adult: "false",
            language: "en-US",
            page: "1",
          });
          const res = await fetch(
            "https://api.themoviedb.org/3/search/" + wanted + "?" + params,
            {
              headers: {
                Authorization: "Bearer " + token,
                accept: "application/json",
              },
            },
          );
          if (!res.ok) continue;
          const data = await res.json();
          const target = normalize(q);
          const matches = (data.results || []).filter((x) => x.poster_path);
          best = matches
            .map((x) => {
              const title = x.title || x.name || "";
              const year = Number(String(x.release_date || x.first_air_date || "").slice(0, 4));
              const exact = normalize(title) === target;
              const yearMatch = year === Number(p.releaseYear);
              return { item: x, score: (exact ? 100 : 0) + (yearMatch ? 50 : 0) };
            })
            .sort((a, b) => b.score - a.score)[0]?.item || null;
        }

        if (best?.poster_path)
          posters[p.id] = "https://image.tmdb.org/t/p/w500" + best.poster_path;
      }
      const next = { ...config, posters };
      await saveAdminThemeConfig(next);
      setConfig(next);
      if (!silent) setNotice("Poster catalog synced and published.");
      return true;
    } catch (e) {
      if (!silent) setNotice(e.message || "Poster sync failed.");
      return false;
    } finally {
      if (!silent) setBusy(false);
    }
  };
  const nav = [
    ["overview", "Overview", "▦"],
    ["users", "Users", "♙"],
    ["themes", "Theme Studio", "◈"],
    ["site", "Site Control", "◆"],
    ["tmdb", "TMDB & Media", "▣"],
    ["security", "Security", "⌁"],
  ];
  return html` <div className="admin-page">
    <header className="admin-topbar">
      <div>
        <div className="admin-kicker">CONTROL CENTER</div>
        <h1>Admin Console</h1>
        <p>
          Manage the archive, members, appearance and protected integrations.
        </p>
      </div>
      <div className="admin-user">
        <div className="admin-avatar">
          ${(user?.displayName || user?.email || "A").charAt(0).toUpperCase()}
        </div>
        <div>
          <strong>${user?.displayName || "Administrator"}</strong
          ><span>${user?.email || ""}</span>
        </div>
        <button className="btn" onClick=${onSignOut}>Sign out</button>
      </div>
    </header>
    ${notice ? html`<div className="admin-notice">${notice}</div>` : null}
    <div className="admin-layout">
      <aside className="admin-nav">
        ${nav.map(
          ([id, name, icon]) =>
            html`<button
              className=${tab === id ? "active" : ""}
              onClick=${() => setTab(id)}
            >
              <span>${icon}</span>${name}
            </button>`,
        )}
      </aside>
      <main className="admin-content">
        ${tab === "overview"
          ? html`<div className="admin-heading">
                <span>Overview</span>
                <h2>The archive at a glance</h2>
                <p>Live information from your Firebase data.</p>
              </div>
              <div className="admin-stat-grid">
                <div className="admin-stat">
                  <span>Registered users</span><b>${users.length}</b>
                </div>
                <div className="admin-stat">
                  <span>Movies completed</span><b>${totals.completedMovies}</b>
                </div>
                <div className="admin-stat">
                  <span>Series / TV shows completed</span><b>${totals.completedShows}</b></div>
                <div className="admin-stat">
                  <span>Episodes tracked</span><b>${totals.episodes}</b>
                </div>
                <div className="admin-stat">
                  <span>Catalog entries</span><b>${PROJECTS.length}</b>
                </div>
              </div>
              <div className="admin-panel">
                <div className="admin-panel-head">
                  <div>
                    <h3>Quick actions</h3>
                    <p>Jump directly to the controls you use most.</p>
                  </div>
                  <button className="btn" onClick=${refresh}>↻ Refresh</button>
                </div>
                <div className="admin-quick">
                  <button onClick=${() => setTab("users")}>
                    View users <span>→</span></button
                  ><button onClick=${() => setTab("themes")}>
                    Theme Studio <span>→</span></button
                  ><button onClick=${() => setTab("tmdb")}>
                    Manage TMDB <span>→</span></button
                  ><button onClick=${() => setTab("security")}>
                    Security <span>→</span>
                  </button>
                </div>
              </div>`
          : null}
        ${tab === "users"
          ? html`<div className="admin-heading">
                <span>Members</span>
                <h2>User management</h2>
                <p>View every account and its personal tracking progress.</p>
              </div>
              <div className="admin-table">
                <div className="admin-row admin-row-head">
                  <span>User</span><span>Progress</span><span>Episodes</span
                  ><span>Last sync</span><span></span>
                </div>
                ${users.map((u) => {
                  const m = metrics(u),
                    pct = PROJECTS.length
                      ? Math.round((m.completed / PROJECTS.length) * 100)
                      : 0;
                  return html`<button
                    className="admin-row"
                    onClick=${() => setSelected(u)}
                  >
                    <span className="user-cell"
                      ><i
                        >${(u.displayName || u.email || "U")
                          .charAt(0)
                          .toUpperCase()}</i
                      ><span
                        ><strong>${u.displayName || "Unnamed user"}</strong
                        ><small>${u.email || "No email saved"}</small></span
                      ></span
                    ><span
                      ><strong>${m.completedMovies} movies · ${m.completedShows} shows</strong
                      ><small
                        >${pct}% complete · ${m.active} active</small
                      ></span
                    ><span
                      ><strong>${m.episodes}</strong
                      ><small>episodes watched</small></span
                    ><span
                      ><small
                        >${u.updatedAt?.toDate
                          ? u.updatedAt.toDate().toLocaleString()
                          : "—"}</small
                      ></span
                    ><b>›</b>
                  </button>`;
                })}
              </div>
              ${selected
                ? html`<div className="admin-drawer">
                    <div className="admin-drawer-card">
                      <button
                        className="admin-close"
                        onClick=${() => setSelected(null)}
                      >
                        ×
                      </button>
                      <div className="admin-profile">
                        <div className="admin-avatar large">
                          ${(selected.displayName || selected.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <div className="admin-kicker">MEMBER</div>
                          <h3>${selected.displayName || "Unnamed user"}</h3>
                          <p>${selected.email || ""}</p>
                          <small>UID: ${selected.uid}</small>
                        </div>
                      </div>
                      <div className="admin-stat-grid compact">
                        ${Object.entries(metrics(selected)).map(
                          ([k, v]) =>
                            html`<div className="admin-stat">
                              <span>${k}</span><b>${v}</b>
                            </div>`,
                        )}
                      </div>
                      <div className="admin-watch-history-head">
                        <div>
                          <h4>Complete watch history</h4>
                          <p>Every movie, series and TV title this user has tracked, including watched episodes.</p>
                        </div>
                        <span>${getWatchHistory(selected).length} titles</span>
                      </div>
                      <div className="admin-watch-history">
                        ${getWatchHistory(selected).length
                          ? getWatchHistory(selected).map(
                              ({ project, state, watchedEpisodes, category }) =>
                                html`<article className="admin-watch-item">
                                  <div className="admin-watch-item-main">
                                    <div className="admin-watch-type">${category}</div>
                                    <strong>${project.title}</strong>
                                    <small>${state.status || "Tracked"}${state.watchedDate ? " · " + state.watchedDate : ""}</small>
                                  </div>
                                  <div className="admin-watch-item-count">
                                    ${project.episodes
                                      ? html`<strong>${watchedEpisodes.length} / ${project.episodes}</strong><small>episodes</small>`
                                      : html`<strong>Watched</strong><small>${state.watchedDate || "No date"}</small>`}
                                  </div>
                                  ${watchedEpisodes.length
                                    ? html`<div className="admin-watch-episodes">
                                        ${watchedEpisodes.map(
                                          ([key]) =>
                                            html`<span className="admin-episode-chip">${formatEpisodeKey(key)}</span>`,
                                        )}
                                      </div>`
                                    : null}
                                </article>`,
                            )
                          : html`<div className="admin-history-empty">
                              <strong>No watched titles recorded</strong>
                              <span>This user's tracking data does not contain any watched or active titles yet.</span>
                            </div>`}
                      </div>
                    </div>
                  </div>`
                : null}`
          : null}
        ${tab === "themes"
          ? html`<div className="admin-heading">
                <span>Appearance</span>
                <h2>Theme Studio</h2>
                <p>
                  Create and publish complete theme packages without changing
                  source code.
                </p>
              </div>
              <div className="theme-admin-toolbar">
                <select
                  value=${themeId}
                  onChange=${(e) => setThemeId(e.target.value)}
                >
                  ${Object.values(config.themes || {}).map(
                    (t) => html`<option value=${t.id}>${t.name}</option>`,
                  )}</select
                ><button className="btn" onClick=${newTheme}>
                  ＋ New package</button
                ><button
                  className="btn primary"
                  disabled=${busy}
                  onClick=${publish}
                >
                  Publish package
                </button>
              </div>
              <div className="theme-studio">
                <div className="theme-editor">
                  <div className="theme-meta-field">
                    <label>Package name</label>
                    <input
                      value=${theme.name}
                      onInput=${(e) =>
                        setConfig((c) => ({
                          ...c,
                          themes: {
                            ...c.themes,
                            [themeId]: {
                              ...c.themes[themeId],
                              name: e.target.value,
                            },
                          },
                        }))}
                    />
                  </div>
                  <div className="theme-meta-field">
                    <label>Description</label>
                    <input
                      value=${theme.description || ""}
                      onInput=${(e) =>
                        setConfig((c) => ({
                          ...c,
                          themes: {
                            ...c.themes,
                            [themeId]: {
                              ...c.themes[themeId],
                              description: e.target.value,
                            },
                          },
                        }))}
                    />
                  </div>
                  <div className="theme-fields">
                    ${fields.map(([k, n]) => {
                      const value = theme.vars?.[k] || "";
                      const isColor = !["radius", "radiusSm"].includes(k);
                      return html`<div className=${isColor ? "theme-field theme-color-field" : "theme-field"}>
                        <div className="theme-field-label">
                          <label>${n}</label>
                          ${isColor ? html`<span className="theme-color-value">${value}</span>` : null}
                        </div>
                        ${isColor
                          ? html`<div className="theme-color-control">
                              <input className="theme-color-picker" type="color"
                                value=${/^#[0-9a-fA-F]{6}$/.test(value) ? value : "#000000"}
                                aria-label=${"Choose " + n + " color"}
                                onInput=${(e) => editTheme(k, e.target.value)} />
                              <input className="theme-color-text" value=${value}
                                onInput=${(e) => editTheme(k, e.target.value)}
                                aria-label=${n + " hex value"} />
                            </div>`
                          : html`<input value=${value} onInput=${(e) => editTheme(k, e.target.value)} />`}
                      </div>`;
                    })}
                  </div>
                </div>
                <div
                  className="theme-preview"
                  style=${Object.fromEntries(
                    Object.entries(theme.vars || {}).map(([k, v]) => [
                      "--" + k,
                      v,
                    ]),
                  )}
                >
                  <div className="preview-window">
                    <span>LIVE PREVIEW</span>
                    <h3>${theme.name}</h3>
                    <p>${theme.description}</p>
                    <div className="preview-card">
                      <b>Marvel Timeline</b
                      ><small>Your complete visual system.</small
                      ><button>Primary action</button>
                    </div>
                  </div>
                </div>
              </div>`
          : null}
        ${tab === "site"
          ? html`<div className="admin-heading">
                <span>Global settings</span>
                <h2>Site Control</h2>
                <p>
                  Change public identity and messaging without editing code.
                </p>
              </div>
              <div className="admin-panel form-panel">
                <label>Brand name</label
                ><input
                  value=${config.site?.brand || ""}
                  onInput=${(e) =>
                    setConfig((c) => ({
                      ...c,
                      site: { ...c.site, brand: e.target.value },
                    }))}
                /><label>Tagline</label
                ><input
                  value=${config.site?.tagline || ""}
                  onInput=${(e) =>
                    setConfig((c) => ({
                      ...c,
                      site: { ...c.site, tagline: e.target.value },
                    }))}
                /><label>Welcome heading</label
                ><input
                  value=${config.site?.welcomeTitle || ""}
                  onInput=${(e) =>
                    setConfig((c) => ({
                      ...c,
                      site: { ...c.site, welcomeTitle: e.target.value },
                    }))}
                /><label>Welcome message</label
                ><textarea
                  value=${config.site?.welcomeText || ""}
                  onInput=${(e) =>
                    setConfig((c) => ({
                      ...c,
                      site: { ...c.site, welcomeText: e.target.value },
                    }))}
                /><div className="maintenance-control">
                  <div className="maintenance-control-head">
                    <div><h3>Maintenance mode</h3><p>Temporarily block the public website while you work on it.</p></div>
                    <label className="switch-row maintenance-switch"><input type="checkbox" checked=${Boolean(config.site?.maintenance)} onChange=${(e) => setConfig((c) => ({ ...c, site: { ...c.site, maintenance: e.target.checked, maintenanceReopenAt: e.target.checked ? (c.site?.maintenanceReopenAt || null) : null } }))} /><span>${config.site?.maintenance ? "Enabled" : "Disabled"}</span></label>
                  </div>
                  <label>Maintenance heading</label><input value=${config.site?.maintenanceTitle || "We are tuning the archive"} onInput=${(e) => setConfig((c) => ({ ...c, site: { ...c.site, maintenanceTitle: e.target.value } }))} />
                  <label>Maintenance message</label><textarea value=${config.site?.maintenanceMessage || "The website is temporarily unavailable while maintenance is being performed."} onInput=${(e) => setConfig((c) => ({ ...c, site: { ...c.site, maintenanceMessage: e.target.value } }))} />
                  <div className="maintenance-schedule"><div><label>Optional automatic reopen</label><p>Choose the date and time when maintenance should automatically end.</p></div><input type="datetime-local" disabled=${!config.site?.maintenance} value=${localDateTimeValue(config.site?.maintenanceReopenAt)} onInput=${(e) => setConfig((c) => ({ ...c, site: { ...c.site, maintenanceReopenAt: e.target.value ? new Date(e.target.value).toISOString() : null } }))} /></div>
                  ${config.site?.maintenanceReopenAt ? html`<div className="maintenance-schedule-status">Scheduled to reopen: <strong>${new Date(config.site.maintenanceReopenAt).toLocaleString()}</strong></div>` : null}
                </div>
                ><button
                  className="btn primary"
                  disabled=${busy}
                  onClick=${publish}
                >
                  Publish site settings
                </button>
              </div>`
          : null}
        ${tab === "tmdb"
          ? html`<div className="admin-heading">
                <span>Media</span>
                <h2>TMDB & poster configuration</h2>
                <p>TMDB credentials are removed from normal user settings.</p>
              </div>
              <div className="admin-panel form-panel">
                <div className="security-callout">
                  <b>Admin-only configuration</b
                  ><span
                    >Normal users are denied access by Firestore rules.</span
                  >
                </div>
                <label>TMDB API Read Access Token</label
                ><input
                  type="password"
                  value=${privateConfig.tmdb?.readAccessToken || ""}
                  onInput=${(e) =>
                    setPrivateConfig((c) => ({
                      ...c,
                      tmdb: {
                        ...(c.tmdb || {}),
                        readAccessToken: e.target.value,
                      },
                    }))}
                  autocomplete="off"
                />
                <p className="admin-help">
                  Keep this credential private. Use it for admin-side poster
                  syncing and publish only image URLs to members.
                </p>
                <div className="flex gap-8" style=${{ flexWrap: "wrap" }}>
                  <button
                    className="btn primary"
                    disabled=${busy}
                    onClick=${saveTMDB}
                  >
                    Save TMDB credential</button
                  ><button
                    className="btn"
                    disabled=${busy}
                    onClick=${syncPosters}
                  >
                    Sync poster catalog
                  </button>
                </div>
              </div>`
          : null}
        ${tab === "security"
          ? html`<div className="admin-heading">
                <span>Access control</span>
                <h2>Security & administrators</h2>
                <p>
                  Admin access is checked against Firestore and enforced by
                  rules.
                </p>
              </div>
              <div className="admin-panel form-panel">
                <h3>Add administrator</h3>
                <p>Copy a Firebase UID from Users, then grant admin access.</p>
                <label>User UID</label
                ><input
                  value=${uid}
                  onInput=${(e) => setUid(e.target.value.trim())}
                  placeholder="Firebase user UID"
                /><button
                  className="btn primary"
                  onClick=${async () => {
                    try {
                      await setAdminUser(uid, true, "Administrator");
                      setNotice("Administrator access granted.");
                      setUid("");
                    } catch (e) {
                      setNotice(e.message || "Could not grant admin access.");
                    }
                  }}
                >
                  Grant admin access
                </button>
              </div>
              <div className="admin-panel">
                <h3>Current administrator</h3>
                <p>
                  <b>${user?.displayName || "Administrator"}</b> ·
                  ${user?.email || ""}
                </p>
                <p className="admin-help">
                  Enable Firebase MFA for stronger administrator protection.
                </p>
                <button
                  className="btn danger"
                  onClick=${async () => {
                    if (
                      confirm(
                        "Remove administrator access from your own account?",
                      )
                    ) {
                      await removeAdminUser(user.uid);
                      location.reload();
                    }
                  }}
                >
                  Remove my admin access
                </button>
              </div>`
          : null}
      </main>
    </div>
  </div>`;
}
