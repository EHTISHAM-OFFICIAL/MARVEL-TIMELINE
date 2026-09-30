import { html } from "htm/react";
import { useRef } from "htm/react";
import { UNIVERSES } from "../data/universes.js";
import { useSiteConfig } from "../store/siteConfig.js";

export function Settings({ userData, actions, user, onSignOut }) {
  const siteConfig = useSiteConfig();
  const prefs = userData.preferences;
  const fileRef = useRef(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marvel-timeline-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.projects && parsed.preferences) {
          actions.importData(parsed);
          alert("Your backup was imported successfully.");
        } else {
          alert("This file is not a valid Marvel Timeline backup.");
        }
      } catch (err) {
        alert("Could not read the backup file: " + err.message);
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  const themes = Object.values(siteConfig.themes || {});
  const currentTheme = themes.find((theme) => theme.id === prefs.theme) || themes[0];

  return html`
    <div className="settings-page">
      <div className="settings-intro">
        <h1>Settings</h1>
        <p>Manage your account, appearance, viewing preferences, and saved data.</p>
      </div>

      <section className="settings-card settings-account-card">
        <div className="settings-section-heading">
          <div>
            <h2>Account</h2>
            <p>Signed-in account details and access controls.</p>
          </div>
        </div>
        <div className="settings-account-row">
          <div className="settings-avatar">${(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}</div>
          <div className="settings-account-copy">
            <strong>${user?.displayName || "Marvel Fan"}</strong>
            <span>${user?.email || "No email available"}</span>
          </div>
          <button className="btn settings-secondary-btn" onClick=${onSignOut}>Sign Out</button>
        </div>
        <p className="settings-help">
          Your progress, favorites, ratings, notes, episode tracking, hidden universes, and preferences are synced to your account.
        </p>
      </section>

      <section className="settings-card">
        <div className="settings-section-heading">
          <div>
            <h2>Appearance</h2>
            <p>Choose a complete visual package. Themes control backgrounds, surfaces, borders, text, accents, and effects across the tracker.</p>
          </div>
          ${currentTheme ? html`<span className="settings-current-theme">${currentTheme.name}</span>` : null}
        </div>
        <div className="settings-theme-grid">
          ${themes.map((theme) => html`
            <button type="button"
              className=${"settings-theme-option " + (prefs.theme === theme.id ? "active" : "")}
              onClick=${() => actions.setPreference("theme", theme.id)}
              aria-pressed=${prefs.theme === theme.id}>
              <span className="settings-theme-preview" style=${{
                background: "linear-gradient(135deg, " + (theme.vars?.bg || "var(--bg)") + ", " + (theme.vars?.card || "var(--card)") + ")",
                borderColor: theme.vars?.border || "var(--border)"
              }}>
                <i style=${{ background: theme.vars?.red || "var(--red)" }}></i>
                <i style=${{ background: theme.vars?.text || "var(--text)" }}></i>
                <i style=${{ background: theme.vars?.gold || "var(--gold)" }}></i>
              </span>
              <span className="settings-theme-copy">
                <strong>${theme.name}</strong>
                <small>${theme.description || "Custom visual package"}</small>
              </span>
              ${prefs.theme === theme.id ? html`<b className="settings-theme-check">✓</b>` : null}
            </button>
          `)}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-section-heading">
          <div>
            <h2>Viewing Preferences</h2>
            <p>Set the default way the catalog should be organized and explored.</p>
          </div>
        </div>

        <div className="settings-control-grid">
          <div className="settings-control">
            <label for="exploration-mode">Exploration Mode</label>
            <p>Controls how broadly Marvel titles are included throughout the tracker.</p>
            <select id="exploration-mode" value=${prefs.explorationMode}
              onChange=${(e) => actions.setPreference("explorationMode", e.target.value)}>
              <option value="simple-mcu">Simple MCU — main MCU films and shows</option>
              <option value="marvel-complete">Marvel Complete — all relevant titles</option>
              <option value="spider-man">Spider-Man Mode</option>
              <option value="x-men">X-Men Mode</option>
              <option value="multiverse">Multiverse Mode</option>
            </select>
          </div>

          <div className="settings-control">
            <label for="default-timeline">Default Timeline</label>
            <p>Choose the timeline view you want to see first.</p>
            <select id="default-timeline" value=${prefs.defaultTimeline}
              onChange=${(e) => actions.setPreference("defaultTimeline", e.target.value)}>
              <option value="release">Release Order</option>
              <option value="chronological">Story Chronology</option>
              <option value="phase">By MCU Phase</option>
              <option value="universe">By Universe</option>
            </select>
          </div>
        </div>

        <div className="settings-toggle-row">
          <div>
            <strong>Spoilers</strong>
            <p>Automatically reveal spoiler content in project details.</p>
          </div>
          <label className="settings-switch">
            <input type="checkbox" checked=${prefs.showAllSpoilers}
              onChange=${(e) => actions.setPreference("showAllSpoilers", e.target.checked)} />
            <span></span>
          </label>
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-section-heading">
          <div>
            <h2>Hidden Universes</h2>
            <p>Choose which universes remain visible throughout the catalog. Click a universe to hide or restore it.</p>
          </div>
        </div>
        <div className="settings-universe-list">
          ${UNIVERSES.map((u) => html`
            <button type="button"
              className=${"settings-universe-chip " + (prefs.hiddenUniverses.includes(u.id) ? "" : "active")}
              onClick=${() => actions.toggleUniverseHidden(u.id)}
              aria-pressed=${!prefs.hiddenUniverses.includes(u.id)}>
              <span>${u.name}</span>
              <b>${prefs.hiddenUniverses.includes(u.id) ? "Hidden" : "Visible"}</b>
            </button>
          `)}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-section-heading">
          <div>
            <h2>Backup & Restore</h2>
            <p>Keep a local JSON copy of your tracker data or restore one you previously exported.</p>
          </div>
        </div>
        <div className="settings-actions">
          <button className="btn settings-primary-btn" onClick=${exportData}>Export Data</button>
          <button className="btn settings-secondary-btn" onClick=${() => fileRef.current?.click()}>Import Data</button>
          <input ref=${fileRef} className="settings-file-input" type="file" accept=".json,application/json" onChange=${handleImport} />
        </div>
      </section>

      <section className="settings-card settings-danger-card">
        <div className="settings-section-heading">
          <div>
            <h2>Danger Zone</h2>
            <p>Use this only if you want to permanently clear your tracking data.</p>
          </div>
        </div>
        <button className="btn settings-danger-btn"
          onClick=${() => { if (confirm("Reset ALL tracking data? This cannot be undone.")) actions.reset(); }}>
          Reset All Tracking Data
        </button>
      </section>
    </div>
  `;
}
