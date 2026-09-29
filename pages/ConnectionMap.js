import { html } from "htm/react";
import { useState, useMemo, useRef, useEffect } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { UNIVERSES } from "../data/universes.js";
import { getUniverse, statusOf } from "../utils/helpers.js";

export function ConnectionMap({ userData, onOpen }) {
  const prefs = userData.preferences;
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [transform, setTransform] = useState({ x: 20, y: 20, scale: 0.85 });
  const [filter, setFilter] = useState("all");

  const visible = useMemo(() => PROJECTS.filter((p) =>
    (filter === "all" || p.universe === filter) &&
    !prefs.hiddenUniverses.includes(p.universe)
  ), [filter, prefs.hiddenUniverses]);

  const nodes = useMemo(() => {
    const universeIds = filter === "all" ? UNIVERSES.map((u) => u.id) : [filter];
    return universeIds.flatMap((uid, ui) => {
      const list = visible.filter((p) => p.universe === uid).sort((a,b) => a.releaseOrderIndex-b.releaseOrderIndex);
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

  const nodeMap = useMemo(() => Object.fromEntries(nodes.map((n) => [n.id, n])), [nodes]);

  const onMouseDown = (e) => { dragRef.current = { x:e.clientX, y:e.clientY, ox:transform.x, oy:transform.y }; };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    setTransform((t) => ({ ...t, x: dragRef.current.ox + e.clientX - dragRef.current.x, y: dragRef.current.oy + e.clientY - dragRef.current.y }));
  };
  const onMouseUp = () => { dragRef.current = null; };

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const wheel = (e) => {
      e.preventDefault();
      setTransform((t) => ({ ...t, scale: Math.max(0.25, Math.min(2.5, t.scale - e.deltaY * 0.001)) }));
    };
    el.addEventListener("wheel", wheel, { passive:false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);

  return html`
    <div>
      <h1>Connection Map</h1>
      <p className="subtitle">Every visible universe gets its own lane. Filter the map or explore the complete Marvel catalog.</p>

      <div className="map-filters">
        <button className=${"chip " + (filter === "all" ? "active" : "")} onClick=${() => setFilter("all")}>All Universes</button>
        ${UNIVERSES.map((u) => html`
          <button key=${u.id} className=${"chip " + (filter === u.id ? "active" : "")} style=${{ borderColor: filter === u.id ? u.color : undefined }} onClick=${() => { setFilter(u.id); setTransform({x:20,y:20,scale:0.9}); }}>
            ${u.name}
          </button>
        `)}
      </div>

      <div className="graph-wrap">
        <div className="graph-controls">
          <button onClick=${() => setTransform((t) => ({...t, scale:Math.min(2.5,t.scale+0.15)}))}>+</button>
          <button onClick=${() => setTransform((t) => ({...t, scale:Math.max(0.25,t.scale-0.15)}))}>−</button>
          <button onClick=${() => setTransform({x:20,y:20,scale:0.85})}>⌂</button>
        </div>
        <svg ref=${svgRef} className="graph-svg" onMouseDown=${onMouseDown} onMouseMove=${onMouseMove} onMouseUp=${onMouseUp} onMouseLeave=${onMouseUp}>
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
                <g key=${n.id} transform=${"translate("+n.x+","+n.y+")"} style=${{cursor:"pointer"}} onClick=${() => onOpen(n.id)}>
                  <rect width="190" height="42" rx="8" fill="var(--card)" stroke=${n.color} strokeWidth="1.5" />
                  <circle cx="11" cy="21" r="4.5" fill=${status==="completed"?"var(--green)":status==="watching"?"var(--gold)":"#5a5a72"} />
                  <text x="22" y="18" fontSize="10.5" fontWeight="600" fill="var(--text)">${title}</text>
                  <text x="22" y="32" fontSize="8.5" fill="var(--text-faint)">${n.project.releaseYear} · ${n.project.type.replace(/-/g," ")}</text>
                </g>
              `;
            })}
          </g>
        </svg>
      </div>
      <p className="text-faint" style=${{fontSize:"12px",marginTop:"12px"}}>${nodes.length} nodes · ${edges.length} direct sequence links. Drag to pan and scroll to zoom.</p>
    </div>
  `;
}
