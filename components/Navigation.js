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

export function Sidebar({ page, onNavigate, user, onSignOut, isAdmin=false }) {
  const items = isAdmin ? [...NAV_ITEMS, { id: "admin", label: "Admin Console", icon: "⌘" }] : NAV_ITEMS;
  return html`
    <aside className="sidebar">
      <div className="logo">MARVEL<span>Timeline Tracker</span></div>
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

export function MobileNav({ page, onNavigate }) {
  return html`<nav className="mobile-nav">${MOBILE_NAV.map((item) => html`
    <button key=${item.id} className=${"nav-item " + (page === item.id ? "active" : "")} onClick=${() => onNavigate(item.id)}>
      <span className="ico">${item.icon}</span> ${item.label}
    </button>` )}</nav>`;
}