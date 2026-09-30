import { html } from "htm/react";

export const NAV_ITEMS = [
  { id: "home", label: "Home", icon: "◉" }, { id: "timeline", label: "Timeline", icon: "▤" },
  { id: "universes", label: "Universes", icon: "◈" }, { id: "franchises", label: "Franchises", icon: "◆" },
  { id: "tv", label: "TV & Streaming", icon: "▣" }, { id: "animation", label: "Animation", icon: "◐" },
  { id: "map", label: "Connection Map", icon: "⬡" }, { id: "search", label: "Search", icon: "🔍" },
  { id: "progress", label: "My Progress", icon: "▲" }, { id: "favorites", label: "Favorites", icon: "★" },
  { id: "settings", label: "Settings", icon: "⚙" },
];

export const MOBILE_NAV = [
  { id: "home", label: "Home", icon: "◉" }, { id: "timeline", label: "Timeline", icon: "▤" },
  { id: "universes", label: "Universes", icon: "◈" }, { id: "search", label: "Search", icon: "🔍" },
  { id: "progress", label: "Progress", icon: "▲" },
];

const ADMIN_NAV = [
  { id: "admin", label: "Admin Console", icon: "◆" },
  { id: "home", label: "View Public Site", icon: "↗" },
];

const ADMIN_MOBILE_NAV = [
  { id: "admin", label: "Admin", icon: "◆" },
  { id: "home", label: "Public Site", icon: "↗" },
];

export function Sidebar({ page, onNavigate, user, onSignOut, isAdmin=false, siteConfig }) {
  const items = isAdmin && page === "admin" ? ADMIN_NAV : NAV_ITEMS;
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
      <div className="sidebar-account">
        <div className="sidebar-avatar">${(user?.displayName || user?.email || "U").charAt(0).toUpperCase()}</div>
        <div className="sidebar-account-copy"><strong>${user?.displayName || "Marvel Fan"}</strong><span>${user?.email || ""}</span></div>
        <button className="sidebar-logout" title="Sign out" onClick=${onSignOut}>↪</button>
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