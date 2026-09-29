import { html } from "htm/react";
import { useRef } from "htm/react";
import { UNIVERSES } from "../data/universes.js";

export function Settings({ userData, actions }) {
  const prefs = userData.preferences;
  const fileRef = useRef(null);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(userData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      "marvel-timeline-backup-" +
      new Date().toISOString().slice(0, 10) +
      ".json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.projects && parsed.preferences) {
          actions.importData(parsed);
          alert("Import successful.");
        } else {
          alert("Invalid backup file.");
        }
      } catch (err) {
        alert("Failed to parse file: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return html`
    <div style=${{ maxWidth: "640px" }}>
      <h1>Settings</h1>
      <p className="subtitle">Customize how you explore the Marvel catalog</p>

      <div className="detail-section theme-section">
        <label>Visual Theme</label>
        <p className="text-faint theme-help">Choose the atmosphere for your entire tracker. Your choice is saved locally.</p>
        <div className="theme-grid">
          ${[
            ["midnight","Midnight","Cinematic black · crimson"],
            ["stark","Stark","Clean steel · red"],
            ["cosmic","Cosmic","Deep space · violet"],
            ["wakanda","Wakanda","Obsidian · royal purple"],
            ["mystic","Mystic","Arcane night · cyan"],
            ["retro","Retro Marvel","Classic dark · golden"],
          ].map(([id,name,desc]) => html`
            <button type="button" className=${"theme-option " + (prefs.theme === id ? "active" : "")} onClick=${() => actions.setPreference("theme", id)}>
              <span className=${"theme-swatch theme-" + id}></span><span><strong>${name}</strong><small>${desc}</small></span>${prefs.theme === id ? html`<b>✓</b>` : null}
            </button>`)}
        </div>
      </div>

      <div className="detail-section">
        <label>Exploration Mode</label>
        <select
          value=${prefs.explorationMode}
          onChange=${(e) =>
            actions.setPreference("explorationMode", e.target.value)}
        >
          <option value="simple-mcu">
            Simple MCU Mode — main MCU films & shows only
          </option>
          <option value="marvel-complete">
            Marvel Complete — everything relevant
          </option>
          <option value="spider-man">Spider-Man Mode</option>
          <option value="x-men">X-Men Mode</option>
          <option value="multiverse">Multiverse Mode</option>
        </select>
      </div>

      <div className="detail-section">
        <label>Default Timeline</label>
        <select
          value=${prefs.defaultTimeline}
          onChange=${(e) =>
            actions.setPreference("defaultTimeline", e.target.value)}
        >
          <option value="release">Release Order</option>
          <option value="chronological">Story Chronology</option>
          <option value="phase">By MCU Phase</option>
          <option value="universe">By Universe</option>
        </select>
      </div>

      <div className="detail-section">
        <label>Spoilers</label>
        <div className="flex gap-8" style=${{ alignItems: "center" }}>
          <input
            type="checkbox"
            id="spoilers"
            checked=${prefs.showAllSpoilers}
            onChange=${(e) =>
              actions.setPreference("showAllSpoilers", e.target.checked)}
            style=${{ width: "auto" }}
          />
          <label
            htmlFor="spoilers"
            style=${{
              textTransform: "none",
              letterSpacing: 0,
              fontWeight: 400,
              marginBottom: 0,
              fontSize: "13.5px",
            }}
          >
            Show all spoilers automatically
          </label>
        </div>
      </div>

      <div className="detail-section">
        <label>Hidden Universes</label>
        <div className="flex gap-8" style=${{ flexWrap: "wrap" }}>
          ${UNIVERSES.map(
            (u) => html`
              <span
                key=${u.id}
                className=${"chip " +
                (prefs.hiddenUniverses.includes(u.id) ? "" : "active")}
                onClick=${() => actions.toggleUniverseHidden(u.id)}
              >
                ${u.name}
              </span>
            `,
          )}
        </div>
        <p
          className="text-faint"
          style=${{ fontSize: "12px", marginTop: "8px" }}
        >
          Active (highlighted) universes are visible. Click to toggle.
        </p>
      </div>

      <div
        className="detail-section"
        style=${{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}
      >
        <label>Backup</label>
        <div className="flex gap-8" style=${{ flexWrap: "wrap" }}>
          <button className="btn" onClick=${exportData}>
            Export Data (JSON)
          </button>
          <button className="btn" onClick=${() => fileRef.current.click()}>
            Import Data (JSON)
          </button>
          <input
            ref=${fileRef}
            type="file"
            accept=".json"
            style=${{ display: "none" }}
            onChange=${handleImport}
          />
        </div>
      </div>

      <div className="detail-section">
        <label>Poster Data — TMDB</label>
        <p className="text-faint" style=${{ fontSize: "12px", marginTop: "0" }}>Add your TMDB API Read Access Token to load official movie and TV posters. The token is stored only in this browser.</p>
        <input type="password" value=${localStorage.getItem("marvel-timeline-tmdb-token") || ""} placeholder="TMDB API Read Access Token"
          onChange=${(e) => { const value = e.target.value.trim(); if (value) localStorage.setItem("marvel-timeline-tmdb-token", value); else localStorage.removeItem("marvel-timeline-tmdb-token"); }} style=${{ width: "100%" }} />
        <div className="flex gap-8" style=${{ marginTop: "10px", flexWrap: "wrap" }}>
          <button className="btn" onClick=${() => location.reload()}>Apply Poster API</button>
          <button className="btn" onClick=${() => { localStorage.removeItem("marvel-timeline-tmdb-token"); location.reload(); }}>Clear Token</button>
        </div>
        <p className="text-faint" style=${{ fontSize: "11px", marginTop: "8px" }}>TMDB attribution is required. This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </div>

      <div
        className="detail-section"
        style=${{ borderTop: "1px solid var(--border)", paddingTop: "20px" }}
      >
        <label>Danger Zone</label>
        <button
          className="btn"
          style=${{ borderColor: "var(--red)", color: "var(--red-bright)" }}
          onClick=${() => {
            if (confirm("Reset ALL tracking data? This cannot be undone."))
              actions.reset();
          }}
        >
          Reset All Tracking Data
        </button>
      </div>

      <p
        className="text-faint"
        style=${{ fontSize: "12px", marginTop: "32px" }}
      >
        All data is stored locally in your browser (localStorage). No account,
        no backend, no tracking.
      </p>
    </div>
  `;
}
