import { html } from "htm/react";
import { useState } from "htm/react";

export const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "🏠" }, { id: "timeline", label: "Timeline", icon: "🗓️" },
  { id: "universes", label: "Universes", icon: "🌌" }, { id: "franchises", label: "Franchises", icon: "🦸" },
  { id: "tv", label: "TV & Streaming", icon: "📺" }, { id: "animation", label: "Animation", icon: "🎨" },
  { id: "map", label: "Connection Map", icon: "🕸️" }, { id: "search", label: "Search", icon: "🔍" },
  { id: "progress", label: "My Progress", icon: "🏆" }, { id: "favorites", label: "Favorites", icon: "⭐" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export const MOBILE_NAV = [
  { id: "home", label: "Home", icon: "🏠" }, { id: "timeline", label: "Timeline", icon: "🗓️" },
  { id: "universes", label: "Universes", icon: "🌌" }, { id: "search", label: "Search", icon: "🔍" },
  { id: "progress", label: "Progress", icon: "🏆" }, { id: "settings", label: "Settings", icon: "⚙️" },
];

const ADMIN_NAV = [
  { id: "admin", label: "Admin Console", icon: "◆" },
  { id: "home", label: "View Public Site", icon: "↗" },
];

const ADMIN_MOBILE_NAV = [
  { id: "admin", label: "Admin", icon: "◆" },
  { id: "home", label: "Public Site", icon: "↗" },
];

export function Sidebar({ page, onNavigate, user, onSignOut, onDeleteAccount, isAdmin=false, siteConfig }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const items = isAdmin && page === "admin" ? ADMIN_NAV : NAV_ITEMS;

  const handleDelete = async () => {
    setProfileOpen(false);
    await onDeleteAccount?.();
  };

  return html`
    <aside className=${"sidebar " + (isAdmin && page === "admin" ? "admin-sidebar" : "")}>
      <div className="logo">
        ${isAdmin && page === "admin" ? "MARVEL ADMIN" : (siteConfig?.site?.brand || "MARVEL")}
        <span>${isAdmin && page === "admin" ? "Control Center" : (siteConfig?.site?.tagline || "Timeline Tracker")}</span>
      </div>
      <nav>${items.map((item) => html`
        <button key=${item.id} className=${"nav-item " + (page === item.id ? "active" : "")} onClick=${() => onNavigate(item.id)}>
          <span className="ico">${item.icon}</span> ${item.label}
        </button>` )}</nav>
      <div className="sidebar-account-wrap" style=${{ position: "relative" }}>
        ${profileOpen ? html`
          <div className="profile-menu" style=${{ position: "absolute", bottom: "62px", left: "0", right: "0", padding: "8px", background: "var(--bg-2)", border: "1px solid var(--border-bright)", borderRadius: "12px", boxShadow: "0 18px 45px color-mix(in srgb, var(--shadow-ink) 45%, transparent)", zIndex: 20 }}>
            <div className="profile-menu-head" style=${{ padding: "7px 9px 10px", borderBottom: "1px solid var(--border)", marginBottom: "6px" }}>
              <strong style=${{ display: "block", fontSize: "12px" }}>Account</strong>
              <span style=${{ display: "block", fontSize: "10px", color: "var(--text-faint)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis" }}>${user?.email || ""}</span>
            </div>
            <button className="profile-menu-item" style=${{ display: "flex", alignItems: "center", gap: "9px", width: "100%", padding: "9px", border: "0", borderRadius: "8px", background: "transparent", color: "var(--text)", textAlign: "left", cursor: "pointer", font: "inherit", fontSize: "12px" }} onClick=${() => { setProfileOpen(false); onNavigate("settings"); }}>
              <span>⚙️</span> Account Settings
            </button>
            <button className="profile-menu-item danger" style=${{ display: "flex", alignItems: "center", gap: "9px", width: "100%", padding: "9px", marginTop: "2px", border: "0", borderRadius: "8px", background: "transparent", color: "var(--red-bright)", textAlign: "left", cursor: "pointer", font: "inherit", fontSize: "12px" }} onClick=${handleDelete}>
              <span>⌫</span> Delete Account
            </button>
          </div>
        ` : null}
        <button className="sidebar-account" type="button" onClick=${() => setProfileOpen((value) => !value)}>
          <div className="sidebar-avatar">${(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}</div>
          <div className="sidebar-account-copy"><strong>${user?.displayName || "Marvel Fan"}</strong><span>${user?.email || ""}</span></div>
          <span className="sidebar-profile-chevron" style=${{ color: "var(--text-faint)", fontSize: "12px", marginLeft: "auto" }}>${profileOpen ? "⌃" : "⌄"}</span>
        </button>
        <button className="sidebar-logout" title="Sign out" onClick=${(e) => { e.stopPropagation(); onSignOut(); }}>↪</button>
      </div>
    </aside>
  `;
}

export function MobileNav({ page, onNavigate, isAdmin=false }) {
  const items = isAdmin && page === "admin" ? ADMIN_MOBILE_NAV : MOBILE_NAV;
  return html`<nav className=${"mobile-nav " + (isAdmin && page === "admin" ? "admin-mobile-nav" : "")}>${items.map((item) => html`
    <button key=${item.id} className=${"nav-item " + (page === item.id ? "active" : "")} onClick=${() => onNavigate(item.id)}>
      <span className="ico">${item.icon}</span> ${item.label}
    </button>` )}</nav>`;
}