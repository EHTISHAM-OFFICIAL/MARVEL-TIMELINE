import { html, useCallback, useEffect, useRef, useState } from "htm/react";
import { TIER_ICONS } from "./TrophyRoom.js";

const W = 1200, H = 630;

// Resolve a CSS variable to a concrete rgb() string the canvas understands (themes may use color-mix, hex, etc.).
function cssColor(name, fallback) {
  try {
    const probe = document.createElement("span");
    probe.style.color = "var(" + name + ")";
    probe.style.display = "none";
    document.body.appendChild(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value && value !== "" ? value : fallback;
  } catch (e) { return fallback; }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

export function drawProfileCard(canvas, d) {
  const ctx = canvas.getContext("2d");
  canvas.width = W; canvas.height = H;
  const c = {
    bg: cssColor("--bg", "#0b0c10"), bg2: cssColor("--bg-2", "#14161d"), card: cssColor("--card", "#171a22"),
    text: cssColor("--text", "#f3f4f8"), dim: cssColor("--text-dim", "#a5aab8"), faint: cssColor("--text-faint", "#7d8294"),
    red: cssColor("--red", "#e62429"), border: cssColor("--border", "#2a2e3b"), gold: cssColor("--gold", "#ffc53d"), onRed: cssColor("--on-red", "#ffffff"),
  };
  const font = (w, s) => w + " " + s + "px Inter, 'Segoe UI', system-ui, sans-serif";
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, c.bg); g.addColorStop(1, c.bg2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.82, H * 0.2, 10, W * 0.82, H * 0.2, 520);
  glow.addColorStop(0, c.red); glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = 0.22; ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
  ctx.strokeStyle = c.border; ctx.lineWidth = 2; roundRect(ctx, 14, 14, W - 28, H - 28, 28); ctx.stroke();
  ctx.fillStyle = c.red; ctx.fillRect(14 + 28, 14, W - 84, 5);

  // left: identity + rank
  ctx.textBaseline = "alphabetic"; ctx.textAlign = "left";
  ctx.fillStyle = c.red; ctx.font = font("800", 22); ctx.letterSpacing = "6px"; ctx.fillText((d.brand || "MARVEL TIMELINE").toUpperCase(), 64, 82); ctx.letterSpacing = "0px";
  ctx.fillStyle = c.text; ctx.font = font("800", 58);
  let name = d.name; while (ctx.measureText(name).width > 600 && name.length > 4) name = name.slice(0, -2);
  if (name !== d.name) name += "…";
  ctx.fillText(name, 64, 168);
  ctx.fillStyle = c.dim; ctx.font = font("500", 26); ctx.fillText("Marvel journey profile", 64, 208);

  ctx.fillStyle = c.card; roundRect(ctx, 64, 244, 600, 150, 24); ctx.fill(); ctx.strokeStyle = c.border; ctx.lineWidth = 2; ctx.stroke();
  ctx.font = "84px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"; ctx.fillStyle = c.text; ctx.fillText(d.rank.icon, 92, 346);
  ctx.fillStyle = c.faint; ctx.font = font("800", 18); ctx.letterSpacing = "4px"; ctx.fillText("CURRENT RANK", 210, 292); ctx.letterSpacing = "0px";
  ctx.fillStyle = c.text; ctx.font = font("800", 40);
  let rname = d.rank.name; while (ctx.measureText(rname).width > 440 && rname.length > 4) rname = rname.slice(0, -2);
  ctx.fillText(rname, 210, 336);
  ctx.fillStyle = c.dim; ctx.font = font("600", 22); ctx.fillText(d.points.toLocaleString() + " points", 210, 372);

  // tier counts
  const tiers = ["bronze", "silver", "gold", "platinum", "legendary"];
  tiers.forEach((t, i) => {
    const x = 64 + i * 122;
    ctx.fillStyle = c.card; roundRect(ctx, x, 420, 110, 64, 18); ctx.fill(); ctx.strokeStyle = c.border; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = "30px 'Apple Color Emoji','Segoe UI Emoji','Noto Color Emoji',sans-serif"; ctx.fillStyle = c.text; ctx.fillText(TIER_ICONS[t], x + 14, 462);
    ctx.font = font("800", 30); ctx.fillText(String(d.tierCounts[t] || 0), x + 58, 462);
  });
  ctx.fillStyle = c.faint; ctx.font = font("600", 20); ctx.fillText("Trophies by tier", 64, 520);

  // right: completion ring + numbers
  const cx = 900, cy = 250, r = 118;
  ctx.lineWidth = 26; ctx.lineCap = "round";
  ctx.strokeStyle = c.border; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
  if (d.percent > 0) { ctx.strokeStyle = c.red; ctx.beginPath(); ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.min(1, d.percent / 100)); ctx.stroke(); }
  ctx.textAlign = "center"; ctx.fillStyle = c.text; ctx.font = font("800", 76); ctx.fillText(d.percent + "%", cx, cy + 20);
  ctx.fillStyle = c.faint; ctx.font = font("800", 18); ctx.letterSpacing = "4px"; ctx.fillText("COMPLETE", cx, cy + 56); ctx.letterSpacing = "0px";

  const stats = [[d.movies, "Movies"], [d.shows, "Series"], [d.trophies + "/" + d.trophyMax, "Trophies"]];
  stats.forEach(([v, l], i) => {
    const x = 730 + i * 130;
    ctx.fillStyle = c.card; roundRect(ctx, x - 58, 410, 118, 96, 18); ctx.fill(); ctx.strokeStyle = c.border; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = c.text; ctx.font = font("800", String(v).length > 5 ? 26 : 36); ctx.fillText(String(v), x + 1, 458);
    ctx.fillStyle = c.faint; ctx.font = font("700", 16); ctx.fillText(l.toUpperCase(), x + 1, 488);
  });
  ctx.textAlign = "left"; ctx.fillStyle = c.faint; ctx.font = font("500", 20);
  ctx.fillText(d.episodes + " episodes watched", 672, 548);
  ctx.textAlign = "right"; ctx.fillText(d.site, W - 64, 580);
  ctx.textAlign = "left";
}

export function ShareCard({ name, trophies, stats, brand }) {
  const [open, setOpen] = useState(false);
  const [showName, setShowName] = useState(true);
  const [note, setNote] = useState("");
  const canvasRef = useRef(null);
  const closeRef = useRef(null);
  const displayName = showName && name ? name : "A Marvel Fan";

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try { await document.fonts?.ready; } catch (e) { /* fonts API unavailable */ }
    drawProfileCard(canvas, {
      brand, name: displayName, rank: trophies.rank, points: trophies.points, tierCounts: trophies.tierCounts,
      percent: stats.percent, movies: stats.movies, shows: stats.shows, episodes: stats.episodes,
      trophies: trophies.unlockedCount, trophyMax: trophies.availableCount, site: location.host || "marvel-timeline",
    });
  }, [displayName, trophies, stats, brand]);

  useEffect(() => { if (open) render(); }, [open, render]);
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toBlob = () => new Promise((resolve) => canvasRef.current.toBlob(resolve, "image/png"));
  const flash = (msg) => { setNote(msg); setTimeout(() => setNote(""), 3500); };
  const download = async () => {
    const blob = await toBlob(); if (!blob) return flash("Could not create the image.");
    const url = URL.createObjectURL(blob), a = document.createElement("a");
    a.href = url; a.download = "my-marvel-profile.png"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000); flash("Saved as my-marvel-profile.png");
  };
  const share = async () => {
    const blob = await toBlob(); if (!blob) return flash("Could not create the image.");
    const file = new File([blob], "my-marvel-profile.png", { type: "image/png" });
    try {
      if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "My Marvel journey" }); return; }
      if (navigator.clipboard && window.ClipboardItem) { await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); return flash("Image copied. Paste it anywhere."); }
    } catch (e) { if (e && e.name === "AbortError") return; }
    download();
  };

  return html`
    <button type="button" className="btn share-open" onClick=${() => setOpen(true)}>📤 Share my profile</button>
    ${open ? html`
      <div className="share-overlay" role="dialog" aria-modal="true" aria-label="Share your profile card" onClick=${(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
        <div className="share-dialog">
          <div className="share-head"><h2>Your profile card</h2><button type="button" ref=${closeRef} className="btn ghost sm" onClick=${() => setOpen(false)} aria-label="Close">✕</button></div>
          <canvas ref=${canvasRef} className="share-canvas" role="img" aria-label=${displayName + ", rank " + trophies.rank.name + ", " + stats.percent + " percent complete"}></canvas>
          <label className="share-toggle"><input type="checkbox" checked=${showName} onChange=${(e) => setShowName(e.target.checked)} /> Show my name <small>(your email is never included)</small></label>
          <div className="share-actions">
            <button type="button" className="btn btn-primary" onClick=${download}>⬇ Download PNG</button>
            <button type="button" className="btn" onClick=${share}>🔗 Share / copy image</button>
          </div>
          <p className="share-note" aria-live="polite">${note}</p>
        </div>
      </div>` : null}
  `;
}
