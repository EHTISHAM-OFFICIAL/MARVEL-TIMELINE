import { html } from "htm/react";
import { useState, useMemo, useRef, useEffect } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { UNIVERSES } from "../data/universes.js";
import { getUniverse, statusOf, expandProjectsBySeasons, displayReleaseOrder, passesMode, formatRuntime } from "../utils/helpers.js";

const HOME_VIEW = { x: 20, y: 20, scale: 0.75 };
const NODE_W = 190, NODE_H = 42;

export function ConnectionMap({ userData, onOpen }) {
  const prefs = userData.preferences;
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [transform, setTransform] = useState(HOME_VIEW);
  const wrapRef = useRef(null);
  const movedRef = useRef(false);
  const [hover, setHover] = useState(null);
  const [focusId, setFocusId] = useState(null);
  const [filter, setFilter] = useState("all");

  const visible = useMemo(() => expandProjectsBySeasons(PROJECTS).filter((p) =>
    (filter === "all" || p.universe === filter) &&
    !prefs.hiddenUniverses.includes(p.universe)
  ), [filter, prefs.hiddenUniverses]);

  const nodes = useMemo(() => {
    const universeIds = filter === "all" ? UNIVERSES.map((u) => u.id) : [filter];
    return universeIds.flatMap((uid, ui) => {
      const list = visible.filter((p) => p.universe === uid).sort((a,b) => displayReleaseOrder(a)-displayReleaseOrder(b));
      return list.map((p, i) => ({
        id: p.id, project: p, x: 50 + ui * 230, y: 70 + i * 58, color: getUniverse(uid).color
      }));
    });
  }, [visible, filter]);

  const edges = useMemo(() => {
    const ids = new Set(nodes.map((n) => n.id));
    const result = [];
    nodes.forEach((n) => (n.project.previous || []).forEach((prev) => {
      if (ids.has(prev)) result.push({ from: prev, to: n.id });
    }));
    return result;
  }, [nodes]);

  // The first title (in release order) you have not started yet, inside what the map currently shows.
  const nextNode = useMemo(() => nodes
    .filter((n) => passesMode(n.project, prefs.explorationMode) && statusOf(n.id, userData) === "not-started")
    .sort((a, b) => displayReleaseOrder(a.project) - displayReleaseOrder(b.project))[0] || null, [nodes, userData, prefs.explorationMode]);

  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const canvasBounds = useMemo(() => ({ width: Math.max(230, (filter === "all" ? UNIVERSES.length : 1) * 230), height: Math.max(100, nodes.reduce((m,n) => Math.max(m,n.y + 70), 0)) }), [nodes, filter]);
  const clampTransform = (t) => {
    const el = svgRef.current;
    if (!el) return t;
    const vw = el.clientWidth || 900, vh = el.clientHeight || 600, pad = 30;
    const contentW = canvasBounds.width * t.scale, contentH = canvasBounds.height * t.scale;
    const minX = Math.min(pad, vw - contentW - pad), maxX = pad;
    const minY = Math.min(pad, vh - contentH - pad), maxY = pad;
    return { ...t, x: Math.max(minX, Math.min(maxX, t.x)), y: Math.max(minY, Math.min(maxY, t.y)) };
  };

  const jumpToNext = () => {
    if (!nextNode) return;
    const el = svgRef.current;
    const vw = el?.clientWidth || 900, vh = el?.clientHeight || 600, scale = 1;
    setTransform(clampTransform({ x: vw / 2 - (nextNode.x + NODE_W / 2) * scale, y: vh / 2 - (nextNode.y + NODE_H / 2) * scale, scale }));
    setFocusId(nextNode.id); setHover(null);
  };
  useEffect(() => { if (!focusId) return; const t = setTimeout(() => setFocusId(null), 6000); return () => clearTimeout(t); }, [focusId]);

  const showHover = (n, e) => {
    if (dragRef.current || (e.pointerType && e.pointerType !== "mouse")) return;
    const wrap = wrapRef.current?.getBoundingClientRect(), box = e.currentTarget.getBoundingClientRect();
    if (!wrap) return;
    const flip = box.right - wrap.left + 300 > wrap.width;
    setHover({ id: n.id, x: flip ? box.left - wrap.left - 292 : box.right - wrap.left + 10, y: Math.max(8, Math.min(box.top - wrap.top - 10, wrap.height - 190)) });
  };

  const onMouseDown = (e) => { if (e.pointerType === "mouse" && e.button !== 0) return; movedRef.current = false; dragRef.current = { x:e.clientX, y:e.clientY, ox:transform.x, oy:transform.y }; };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    if (Math.abs(e.clientX - dragRef.current.x) + Math.abs(e.clientY - dragRef.current.y) > 5) { movedRef.current = true; setHover(null); }
    setTransform(clampTransform({ ...transform, x: dragRef.current.ox + e.clientX - dragRef.current.x, y: dragRef.current.oy + e.clientY - dragRef.current.y }));
  };
  const onMouseUp = () => { dragRef.current = null; };

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const wheel = (e) => {
      e.preventDefault();
      setTransform((t) => clampTransform({ ...t, scale: Math.max(0.2, Math.min(1.5, t.scale - e.deltaY * 0.001)) }));
    };
    el.addEventListener("wheel", wheel, { passive:false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);

  return html`
    <div>
      <h1>Connection Map</h1>
      <p className="subtitle">Every visible universe gets its own lane. Filter the map or explore the complete Marvel catalog.</p>

      <div className="map-filters">
        <button className=${"chip " + (filter === "all" ? "active" : "")} onClick=${() => { setFilter("all"); setFocusId(null); setTransform(HOME_VIEW); }}>All Universes</button>
        ${UNIVERSES.map((u) => html`
          <button key=${u.id} className=${"chip " + (filter === u.id ? "active" : "")} style=${{ borderColor: filter === u.id ? u.color : undefined }} onClick=${() => { setFilter(u.id); setFocusId(null); setTransform(HOME_VIEW); }}>
            ${u.name}
          </button>
        `)}
      </div>

      <div className="map-toolbar">
        <button type="button" className="btn btn-primary sm" onClick=${jumpToNext} disabled=${!nextNode} title=${nextNode ? "Center the map on " + nextNode.project.title : "Nothing left unwatched on this map"}>🎯 Jump to my next unwatched</button>
        <span className="map-legend" aria-label="Legend"><i className="dot done"></i>Completed <i className="dot now"></i>Watching <i className="dot todo"></i>Not started</span>
      </div>

      <div className="graph-wrap" ref=${wrapRef}>
        <div className="graph-controls">
          <button onClick=${() => setTransform((t) => clampTransform({...t, scale:Math.min(1.5,t.scale+0.15)}))}>+</button>
          <button onClick=${() => setTransform((t) => clampTransform({...t, scale:Math.max(0.2,t.scale-0.15)}))}>−</button>
          <button onClick=${() => { setFocusId(null); setTransform(HOME_VIEW); }} aria-label="Reset view" title="Reset view">⌂</button>
        </div>
        <svg ref=${svgRef} className="graph-svg" onPointerDown=${onMouseDown} onPointerMove=${onMouseMove} onPointerUp=${onMouseUp} onPointerCancel=${onMouseUp} onPointerLeave=${onMouseUp}>
          <rect x="0" y="0" width="100%" height="100%" fill="var(--bg-2)" />
          <g transform=${"translate("+transform.x+","+transform.y+") scale("+transform.scale+")"}>
            ${filter === "all" ? UNIVERSES.map((u,ui) => {
              const laneNodes = nodes.filter((n) => n.project.universe === u.id);
              if (!laneNodes.length) return null;
              return html`
                <g key=${"lane-"+u.id}>
                  <rect x=${ui*230+15} y="15" width="200" height="32" rx="8" fill=${u.color} opacity="0.12" stroke=${u.color} />
                  <text x=${ui*230+25} y="35" fontSize="10" fontWeight="700" fill=${u.color}>${u.name.length > 25 ? u.name.slice(0,24)+"…" : u.name}</text>
                </g>
              `;
            }) : null}
            ${edges.map((e,i) => {
              const from=nodeMap[e.from], to=nodeMap[e.to];
              if (!from || !to) return null;
              return html`<line key=${i} x1=${from.x+95} y1=${from.y+20} x2=${to.x+95} y2=${to.y+20} stroke="var(--text-faint)" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.55" />`;
            })}
            ${nodes.map((n) => {
              const status=statusOf(n.id,userData);
              const title=n.project.title.length>22?n.project.title.slice(0,21)+"…":n.project.title;
              return html`
                <g key=${n.id} className="map-node" transform=${"translate("+n.x+","+n.y+")"} style=${{cursor:"pointer"}} tabIndex="0" role="button" aria-label=${n.project.title + ", " + status.replace(/-/g," ")}
                  onClick=${() => { if (movedRef.current) { movedRef.current = false; return; } onOpen(n.id); }}
                  onKeyDown=${(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(n.id); } }}
                  onPointerEnter=${(e) => showHover(n, e)} onPointerLeave=${() => setHover(null)} onFocus=${(e) => showHover(n, e)} onBlur=${() => setHover(null)}>
                  ${focusId === n.id ? html`<rect className="map-focus-ring" x="-5" y="-5" width=${NODE_W + 10} height=${NODE_H + 10} rx="12" />` : null}
                  <rect width="190" height="42" rx="8" fill="var(--card)" stroke=${n.color} strokeWidth="1.5" />
                  <circle cx="11" cy="21" r="4.5" fill=${status==="completed"?"var(--green)":status==="watching"?"var(--gold)":"var(--text-faint)"} />
                  <text x="22" y="18" fontSize="10.5" fontWeight="600" fill="var(--text)">${title}</text>
                  <text x="22" y="32" fontSize="8.5" fill="var(--text-faint)">${n.project.releaseYear} · ${n.project.type.replace(/-/g," ")}</text>
                </g>
              `;
            })}
          </g>
        </svg>
        ${hover && nodeMap[hover.id] ? (() => {
          const hp = nodeMap[hover.id].project, hs = statusOf(hp.id, userData), hu = getUniverse(hp.universe);
          return html`<div className="map-hover" style=${{ left: hover.x + "px", top: hover.y + "px", "--accent": hu.color }} role="tooltip">
            <strong>${hp.title}</strong>
            <span className="mh-meta">${[hp.releaseYear, hp.type.replace(/-/g, " "), hp.runtimeMinutes ? formatRuntime(hp.runtimeMinutes) : null].filter(Boolean).join(" · ")}</span>
            <span className="mh-uni">${hu.name}</span>
            <span className="mh-status"><i className=${"dot " + (hs === "completed" ? "done" : hs === "watching" ? "now" : "todo")}></i>${hs.replace(/-/g, " ")}</span>
            ${hp.shortDescription ? html`<span className="mh-desc">${hp.shortDescription}</span>` : null}
            <em>Click to open details</em>
          </div>`;
        })() : null}
      </div>
      <p className="text-faint" style=${{fontSize:"12px",marginTop:"12px"}}>${nodes.length} nodes · ${edges.length} direct sequence links. Drag (or swipe) to pan, scroll or use + / − to zoom, hover a title for details.</p>
    </div>
  `;
}
