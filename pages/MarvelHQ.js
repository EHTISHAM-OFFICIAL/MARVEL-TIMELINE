import { html, useEffect, useMemo, useState } from "htm/react";
import { computeAchievements, visibleProjects } from "../utils/achievements.js";
import { universeStats, cardsFromTrophies, buildIdentity } from "../utils/hq.js";
import { useSiteConfig, themeMode } from "../store/siteConfig.js";
import { CatScroller } from "../components/TrophyRoom.js";
import { Multiverse } from "../components/hq/Multiverse.js";
import { Characters } from "../components/hq/Characters.js";
import { Sagas } from "../components/hq/Sagas.js";
import { Radar } from "../components/hq/Radar.js";
import { Vault } from "../components/hq/Vault.js";
import { Cards } from "../components/hq/Cards.js";
import { IQ, loadIQ, iqScore } from "../components/hq/IQ.js";
import { Identity } from "../components/hq/Identity.js";

const TABS = [
  { id: "multiverse", icon: "🌌", label: "Multiverse" },
  { id: "characters", icon: "🦸", label: "Characters" },
  { id: "sagas", icon: "📜", label: "Sagas" },
  { id: "radar", icon: "📡", label: "Radar" },
  { id: "vault", icon: "🗄️", label: "Vault" },
  { id: "cards", icon: "🃏", label: "Cards" },
  { id: "iq", icon: "🧠", label: "Marvel IQ" },
  { id: "identity", icon: "🪪", label: "Identity" },
];
const readTab = () => { try { const t = sessionStorage.getItem("mt-hq-tab"); return TABS.some((x) => x.id === t) ? t : "multiverse"; } catch (e) { return "multiverse"; } };

export function MarvelHQ({ userData, user, onOpen, onNavigate }) {
  const uid = user?.uid || "local";
  const siteConfig = useSiteConfig();
  const [tab, setTab] = useState(readTab);
  const [iqStats, setIqStats] = useState(() => loadIQ(uid));
  useEffect(() => { try { sessionStorage.setItem("mt-hq-tab", tab); } catch (e) { /* storage unavailable */ } }, [tab]);

  const visible = useMemo(() => visibleProjects(userData), [userData]);
  const trophies = useMemo(() => computeAchievements(userData, { isLightTheme: (id) => themeMode(siteConfig.themes?.[id]?.vars) === "light" }), [userData, siteConfig.themes]);
  const collection = useMemo(() => cardsFromTrophies(trophies), [trophies]);
  const universes = useMemo(() => universeStats(userData), [userData]);
  const identity = useMemo(() => buildIdentity(userData, visible, trophies), [userData, visible, trophies]);
  const explored = universes.filter((u) => u.explored).length;
  const iq = iqScore(iqStats);
  const idName = identity.ready ? (identity.archetype || identity.fallback).name : "Still forming";
  const idIcon = identity.ready ? (identity.archetype || identity.fallback).icon : "🪪";

  const tiles = [
    { tab: "identity", icon: idIcon, label: "Identity", value: idName, sub: identity.ready ? identity.completed + " titles shape it" : "Complete 3 titles" },
    { tab: "multiverse", icon: "🌌", label: "Universes explored", value: explored + " / " + universes.length, sub: universes.length ? Math.round(universes.reduce((a, u) => a + u.completed, 0) / Math.max(1, universes.reduce((a, u) => a + u.total, 0)) * 100) + "% of the catalog done" : "" },
    { tab: "cards", icon: "🃏", label: "Cards collected", value: collection.owned + " / " + collection.total, sub: trophies.rank.name },
    { tab: "iq", icon: "🧠", label: "Marvel IQ", value: iq === null ? "Not played" : String(iq), sub: iq === null ? "Take the daily challenge" : "Best round " + iqStats.best + "/10" },
  ];

  let body;
  switch (tab) {
    case "characters": body = html`<${Characters} visible=${visible} userData=${userData} onOpen=${onOpen} />`; break;
    case "sagas": body = html`<${Sagas} visible=${visible} userData=${userData} onOpen=${onOpen} />`; break;
    case "radar": body = html`<${Radar} visible=${visible} userData=${userData} onOpen=${onOpen} />`; break;
    case "vault": body = html`<${Vault} visible=${visible} userData=${userData} onOpen=${onOpen} onNavigate=${onNavigate} />`; break;
    case "cards": body = html`<${Cards} collection=${collection} uid=${uid} />`; break;
    case "iq": body = html`<${IQ} uid=${uid} stats=${iqStats} onStats=${setIqStats} />`; break;
    case "identity": body = html`<${Identity} identity=${identity} onNavigate=${onNavigate} />`; break;
    default: body = html`<${Multiverse} stats=${universes} onOpen=${onOpen} onNavigate=${onNavigate} />`;
  }

  return html`
    <div className="hq-page">
      <header className="hq-hero">
        <div className="hq-hero-copy">
          <span className="hq-eyebrow">Command post</span>
          <h1>Marvel HQ</h1>
          <p>Your universes, heroes, stories and collection in one place. Everything here is built from the titles you track.</p>
        </div>
        <ul className="hq-tiles">
          ${tiles.map((t) => html`<li key=${t.label}><button type="button" className="hq-tile" onClick=${() => setTab(t.tab)}>
            <span className="hq-tile-icon" aria-hidden="true">${t.icon}</span>
            <span className="hq-tile-copy"><small>${t.label}</small><strong>${t.value}</strong><em>${t.sub}</em></span>
          </button></li>`)}
        </ul>
      </header>
      <nav className="hq-tabs" aria-label="Marvel HQ sections">
        <${CatScroller}>
          ${TABS.map((t) => html`<button key=${t.id} type="button" role="tab" aria-selected=${tab === t.id} className=${"tr-cat" + (tab === t.id ? " active" : "")} onClick=${(e) => { setTab(t.id); e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" }); }}><span aria-hidden="true">${t.icon}</span> ${t.label}</button>`)}
        <//>
      </nav>
      <div className="hq-body" role="tabpanel">${body}</div>
    </div>`;
}
