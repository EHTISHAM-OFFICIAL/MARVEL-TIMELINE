import { html, useCallback, useEffect, useRef, useState } from "htm/react";
import { computeAchievements, RANKS, TIERS } from "../utils/achievements.js";
import { TIER_ICONS } from "./TrophyRoom.js";

const storeKey = (uid) => "mt-trophies:" + uid;
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// Changing these settings re-defines what "everything visible" means, so they must never fake a content trophy.
const prefSignature = (prefs) => [prefs.explorationMode, (prefs.hiddenUniverses || []).slice().sort().join(",")].join("|");
const TIER_COLORS = { bronze: "#cd7f32", silver: "#b9c4d0", gold: "#ffc53d", platinum: "#5ce1e6", legendary: "#d58bff" };
const MAX_TOASTS = 3;
const TOAST_MS = 7500;

function confetti(tier) {
  if (prefersReducedMotion() || typeof document === "undefined") return;
  const layer = document.createElement("div");
  layer.className = "tr-confetti";
  layer.setAttribute("aria-hidden", "true");
  const palette = [TIER_COLORS[tier] || TIER_COLORS.gold, "#ff5a5f", "#ffc53d", "#5ce1e6", "#d58bff", "#ffffff"];
  for (let i = 0; i < 38; i++) {
    const bit = document.createElement("i");
    const angle = (-100 + Math.random() * 80) * (Math.PI / 180); // fan out up and to the left of the corner toast
    const power = 120 + Math.random() * 230;
    bit.style.setProperty("--dx", Math.cos(angle) * power + "px");
    bit.style.setProperty("--dy", Math.sin(angle) * power + "px");
    bit.style.setProperty("--rot", Math.round(Math.random() * 720 - 360) + "deg");
    bit.style.setProperty("--delay", Math.round(Math.random() * 120) + "ms");
    bit.style.background = palette[i % palette.length];
    if (i % 3 === 0) bit.style.borderRadius = "50%";
    layer.appendChild(bit);
  }
  document.body.appendChild(layer);
  setTimeout(() => layer.remove(), 2000);
}

export function TrophyToaster({ userData, uid, ready, isLightTheme, onOpenTrophies }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});

  const dismiss = useCallback((key) => {
    clearTimeout(timers.current[key]);
    delete timers.current[key];
    setToasts((list) => list.filter((t) => t.key !== key));
  }, []);

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  useEffect(() => {
    if (!ready || !uid || !userData) return;
    const result = computeAchievements(userData, { isLightTheme });
    const unlocked = result.list.filter((a) => a.available && a.unlocked);
    const ids = unlocked.map((a) => a.id);
    const sig = prefSignature(userData.preferences || {});
    let stored = null;
    try { stored = JSON.parse(localStorage.getItem(storeKey(uid)) || "null"); } catch (e) { stored = null; }
    const save = () => { try { localStorage.setItem(storeKey(uid), JSON.stringify({ ids, sig, rank: result.rank.id })); } catch (e) { /* storage unavailable */ } };
    if (!stored || !Array.isArray(stored.ids)) { save(); return; } // first run on this device: record a silent baseline

    const seen = new Set(stored.ids);
    let fresh = unlocked.filter((a) => !seen.has(a.id));
    if (stored.sig !== sig) fresh = fresh.filter((a) => a.cat === "style"); // settings changed: only style trophies are "earned"
    const oldRank = RANKS.findIndex((r) => r.id === stored.rank);
    const newRank = RANKS.findIndex((r) => r.id === result.rank.id);
    save();
    if (!fresh.length) return;

    const rankUp = newRank > oldRank && oldRank >= 0 ? result.rank : null;
    const key = "t" + Date.now() + Math.random().toString(36).slice(2, 6);
    const best = fresh.slice().sort((a, b) => b.points - a.points)[0];
    const toast = fresh.length > MAX_TOASTS
      ? { key, many: true, items: fresh, points: fresh.reduce((s, a) => s + a.points, 0), tier: best.tier, rankUp }
      : null;
    setToasts((list) => {
      const additions = toast ? [toast] : fresh.map((a, i) => ({ key: key + i, trophy: a, tier: a.tier, rankUp: i === fresh.length - 1 ? rankUp : null }));
      additions.forEach((t) => { timers.current[t.key] = setTimeout(() => dismiss(t.key), TOAST_MS); });
      return [...list, ...additions].slice(-MAX_TOASTS);
    });
    confetti(best.tier);
  }, [ready, uid, userData]);

  if (!toasts.length) return null;
  return html`
    <div className="tr-toasts" role="region" aria-label="Trophy notifications" aria-live="polite">
      ${toasts.map((t) => html`
        <div key=${t.key} className=${"tr-toast tier-" + t.tier}>
          <span className=${"tr-medal tier-" + t.tier + " unlocked pop"} aria-hidden="true"><span>${t.many ? "🏆" : t.trophy.icon}</span></span>
          <div className="tr-toast-copy">
            <span className="eyebrow">${t.many ? "NEW TROPHIES UNLOCKED" : "TROPHY UNLOCKED"}</span>
            ${t.many
              ? html`<strong>${t.items.length} new trophies!</strong>
                  <span className="tr-toast-desc">${t.items.slice(0, 3).map((a) => a.name).join(", ")} and ${t.items.length - 3} more</span>
                  <em>+${t.points} pts</em>`
              : html`<strong>${t.trophy.name}</strong>
                  <span className="tr-toast-desc">${t.trophy.detail}</span>
                  <em>${TIER_ICONS[t.trophy.tier]} ${TIERS[t.trophy.tier].label} · +${t.trophy.points} pts</em>`}
            ${t.rankUp ? html`<span className="tr-rankup">${t.rankUp.icon} New rank: ${t.rankUp.name}</span>` : null}
          </div>
          <div className="tr-toast-actions">
            <button type="button" className="tr-toast-view" onClick=${() => { dismiss(t.key); onOpenTrophies(); }}>View</button>
            <button type="button" className="tr-toast-close" aria-label="Dismiss" onClick=${() => dismiss(t.key)}>✕</button>
          </div>
        </div>`)}
    </div>
  `;
}
