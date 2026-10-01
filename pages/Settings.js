import { html, useRef, useState } from "htm/react";
import { UNIVERSES } from "../data/universes.js";
import { useSiteConfig, themeMode, DEFAULT_VARS } from "../store/siteConfig.js";

const EXPLORATION_MODES = [
  { id: "simple-mcu", title: "Simple MCU", desc: "Main MCU films and shows only." },
  { id: "marvel-complete", title: "Marvel Complete", desc: "Everything relevant, across every universe." },
  { id: "spider-man", title: "Spider-Man", desc: "Spider-Man titles from every universe." },
  { id: "x-men", title: "X-Men", desc: "X-Men, Wolverine and Deadpool titles." },
  { id: "multiverse", title: "Multiverse", desc: "Multiverse-relevant stories and the MCU Multiverse." },
];

// `earth` is a number for real Earth designations ("616") and a label otherwise ("TV", "MULTIVERSE").
function earthLabel(earth) {
  const e = String(earth || "");
  if (/^\d+$/.test(e)) return "Earth-" + e;
  return e.length <= 3 ? e : e.charAt(0) + e.slice(1).toLowerCase();
}

const TIMELINES = [
  { id: "release", label: "Release order" },
  { id: "chronological", label: "Story chronology" },
  { id: "phase", label: "MCU phase" },
  { id: "universe", label: "Universe" },
];

function CheckIcon() {
  return html`<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg>`;
}

function Card({ id, title, desc, danger, children }) {
  return html`
    <section className=${"settings-card" + (danger ? " settings-card-danger" : "")} aria-labelledby=${id}>
      <header className="settings-card-head">
        <h2 id=${id}>${title}</h2>
        ${desc ? html`<p className="settings-card-desc">${desc}</p>` : null}
      </header>
      ${children}
    </section>
  `;
}

function Group({ title, hint, children }) {
  return html`
    <div className="settings-group">
      <div className="settings-group-head">
        <h3 className="settings-group-title">${title}</h3>
        ${hint ? html`<span className="settings-group-hint">${hint}</span>` : null}
      </div>
      ${children}
    </div>
  `;
}

function Switch({ id, checked, onChange, title, desc }) {
  return html`
    <div className="set-row">
      <div className="set-row-copy">
        <label htmlFor=${id} className="set-row-title">${title}</label>
        <p className="set-row-desc">${desc}</p>
      </div>
      <button type="button" id=${id} role="switch" aria-checked=${checked} className=${"switch" + (checked ? " on" : "")} onClick=${() => onChange(!checked)}>
        <span className="switch-knob"></span>
      </button>
    </div>
  `;
}

function ThemeCard({ theme, active, onPick }) {
  const v = { ...DEFAULT_VARS, ...(theme.vars || {}) };
  return html`
    <button type="button" role="radio" aria-checked=${active} className=${"theme-card" + (active ? " active" : "")} onClick=${onPick}>
      <span className="theme-mini" aria-hidden="true" style=${{ background: v.bg, borderColor: v.borderBright }}>
        <span className="tm-side" style=${{ background: v.bg2, borderColor: v.border }}></span>
        <span className="tm-main">
          <span className="tm-card" style=${{ background: v.card, borderColor: v.border }}>
            <i style=${{ background: v.red }}></i>
            <i style=${{ background: v.text, opacity: 0.85 }}></i>
            <i style=${{ background: v.textDim, width: "60%" }}></i>
          </span>
        </span>
      </span>
      <span className="theme-card-copy">
        <strong>${theme.name}</strong>
        <small>${theme.description || "Custom visual package"}</small>
      </span>
      ${active ? html`<span className="theme-card-check"><${CheckIcon} /></span>` : null}
    </button>
  `;
}

export function Settings({ userData, actions, user, onSignOut }) {
  const siteConfig = useSiteConfig();
  const prefs = userData.preferences;
  const fileRef = useRef(null);
  const [notice, setNotice] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const displayName = user?.displayName || "Marvel Fan";
  const initial = (user?.displayName || user?.email || "U").charAt(0).toUpperCase();

  const themes = Object.values(siteConfig.themes || {});
  const darkThemes = themes.filter((t) => themeMode(t.vars) === "dark");
  const lightThemes = themes.filter((t) => themeMode(t.vars) === "light");
  const hidden = prefs.hiddenUniverses || [];
  const visibleCount = UNIVERSES.filter((u) => !hidden.includes(u.id)).length;

  const exportData = () => {
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "marvel-timeline-backup-" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
    setNotice({ type: "success", text: "Backup downloaded." });
  };

  const handleImport = (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (parsed.projects && parsed.preferences) {
          actions.importData(parsed);
          setNotice({ type: "success", text: "Backup imported. Your progress and preferences have been restored." });
        } else {
          setNotice({ type: "error", text: "That file isn’t a valid Marvel Timeline backup." });
        }
      } catch (err) {
        setNotice({ type: "error", text: "Couldn’t read that file: " + err.message });
      }
    };
    reader.onerror = () => setNotice({ type: "error", text: "Couldn’t read that file." });
    reader.readAsText(file);
    input.value = ""; // allow choosing the same file again
  };

  const themeGroup = (title, list) => list.length === 0 ? null : html`
    <${Group} title=${title}>
      <div className="theme-grid" role="radiogroup" aria-label=${title}>
        ${list.map((theme) => html`<${ThemeCard} key=${theme.id} theme=${theme} active=${prefs.theme === theme.id} onPick=${() => actions.setPreference("theme", theme.id)} />`)}
      </div>
    <//>
  `;

  return html`
    <div className="settings-page">
      <header className="settings-head">
        <h1>Settings</h1>
        <p className="subtitle">Personalize how you explore the Marvel catalog. Changes save automatically to your account.</p>
      </header>

      ${notice ? html`
        <div className=${"settings-notice " + notice.type} role=${notice.type === "error" ? "alert" : "status"}>
          <span>${notice.text}</span>
          <button type="button" className="settings-notice-close" aria-label="Dismiss message" onClick=${() => setNotice(null)}>✕</button>
        </div>` : null}

      <${Card} id="set-account" title="Account">
        <div className="set-account">
          <div className="set-avatar" aria-hidden="true">${initial}</div>
          <div className="set-account-copy">
            <strong>${displayName}</strong>
            <span>${user?.email || ""}</span>
          </div>
          <button type="button" className="btn" onClick=${onSignOut}>Sign out</button>
        </div>
        <p className="settings-foot">Your progress, favorites, ratings, notes, episode tracking, hidden universes and preferences are synced to your account.</p>
      <//>

      <${Card} id="set-appearance" title="Appearance" desc="Choose the look of your entire tracker. Light and dark themes both apply everywhere.">
        ${themeGroup("Dark themes", darkThemes)}
        ${themeGroup("Light themes", lightThemes)}
      <//>

      <${Card} id="set-explore" title="Exploration" desc="Decide what you see and in what order.">
        <${Group} title="Exploration mode" hint="Filters the catalog to the stories you care about.">
          <div className="choice-list" role="radiogroup" aria-label="Exploration mode">
            ${EXPLORATION_MODES.map((m) => {
              const on = prefs.explorationMode === m.id;
              return html`
                <button key=${m.id} type="button" role="radio" aria-checked=${on} className=${"choice" + (on ? " active" : "")} onClick=${() => actions.setPreference("explorationMode", m.id)}>
                  <span className="choice-dot" aria-hidden="true"></span>
                  <span className="choice-copy"><strong>${m.title}</strong><small>${m.desc}</small></span>
                </button>`;
            })}
          </div>
        <//>

        <${Group} title="Default timeline" hint="The view the Timeline page opens with.">
          <div className="segmented" role="radiogroup" aria-label="Default timeline">
            ${TIMELINES.map((t) => html`
              <button key=${t.id} type="button" role="radio" aria-checked=${prefs.defaultTimeline === t.id} className=${"segment" + (prefs.defaultTimeline === t.id ? " active" : "")} onClick=${() => actions.setPreference("defaultTimeline", t.id)}>${t.label}</button>`)}
          </div>
        <//>

        <${Group} title="Spoilers">
          <${Switch} id="set-spoilers" checked=${!!prefs.showAllSpoilers} onChange=${(v) => actions.setPreference("showAllSpoilers", v)} title="Show all spoilers automatically" desc="Reveal spoiler sections without having to click them first." />
        <//>

        <${Group} title="Universes" hint=${visibleCount + " of " + UNIVERSES.length + " visible"}>
          <div className="uni-list">
            ${UNIVERSES.map((u) => {
              const visible = !hidden.includes(u.id);
              return html`
                <button key=${u.id} type="button" aria-pressed=${visible} className=${"uni-toggle" + (visible ? " on" : "")} onClick=${() => actions.toggleUniverseHidden(u.id)}>
                  <span className="uni-dot" style=${{ background: u.color }} aria-hidden="true"></span>
                  <span className="uni-copy"><strong>${u.name}</strong><small>${earthLabel(u.earth)}</small></span>
                  <span className="uni-state">${visible ? "Visible" : "Hidden"}</span>
                </button>`;
            })}
          </div>
        <//>
      <//>

      <${Card} id="set-data" title="Backup" desc="Download a copy of your data, or restore one from a previous backup.">
        <div className="settings-actions">
          <button type="button" className="btn" onClick=${exportData}>Export data (JSON)</button>
          <button type="button" className="btn" onClick=${() => fileRef.current && fileRef.current.click()}>Import data (JSON)</button>
          <input ref=${fileRef} type="file" accept=".json,application/json" className="visually-hidden" tabIndex="-1" aria-label="Choose a backup file to import" onChange=${handleImport} />
        </div>
      <//>

      <${Card} id="set-danger" title="Danger zone" desc="Permanent actions. Export a backup first if you might want your data back." danger=${true}>
        ${confirmReset ? html`
          <div className="confirm-box" role="alertdialog" aria-labelledby="reset-title" aria-describedby="reset-desc">
            <strong id="reset-title">Reset everything?</strong>
            <p id="reset-desc">This permanently clears your watch progress, favorites, ratings and notes, and puts your preferences (including your theme) back to their defaults. It cannot be undone.</p>
            <div className="settings-actions">
              <button type="button" className="btn" onClick=${() => setConfirmReset(false)}>Cancel</button>
              <button type="button" className="btn danger-solid" onClick=${() => { actions.reset(); setConfirmReset(false); setNotice({ type: "success", text: "All tracking data has been reset." }); }}>Yes, reset everything</button>
            </div>
          </div>` : html`
          <button type="button" className="btn danger" onClick=${() => setConfirmReset(true)}>Reset all tracking data</button>`}
      <//>
    </div>
  `;
}
