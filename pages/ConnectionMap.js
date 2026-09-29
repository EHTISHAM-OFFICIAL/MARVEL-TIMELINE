import { html } from "htm/react";
import { useState, useMemo, useRef, useEffect } from "htm/react";
import { PROJECTS } from "../data/projects.js";
import { getUniverse, statusOf, passesMode } from "../utils/helpers.js";

export function ConnectionMap({ userData, onOpen }) {
  const prefs = userData.preferences;
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });

  const nodes = useMemo(() => {
    const byUniverse = {};
    const visible = PROJECTS.filter(
      (p) =>
        passesMode(p, prefs.explorationMode) &&
        !prefs.hiddenUniverses.includes(p.universe),
    );
    visible.forEach((p) => {
      if (!byUniverse[p.universe]) byUniverse[p.universe] = [];
      byUniverse[p.universe].push(p);
    });
    const result = [];
    Object.keys(byUniverse).forEach((uid, ui) => {
      const u = getUniverse(uid);
      const list = byUniverse[uid].sort(
        (a, b) => a.releaseOrderIndex - b.releaseOrderIndex,
      );
      list.forEach((p, i) => {
        result.push({
          id: p.id,
          project: p,
          x: 200 + ui * 340,
          y: 80 + i * 70,
          color: u.color,
        });
      });
    });
    return result;
  }, [prefs]);

  const edges = useMemo(() => {
    const map = {};
    nodes.forEach((n) => {
      map[n.id] = n;
    });
    const result = [];
    PROJECTS.forEach((p) => {
      if (!map[p.id]) return;
      (p.previous || []).forEach((prevId) => {
        if (map[prevId]) result.push({ from: prevId, to: p.id });
      });
    });
    return result;
  }, [nodes]);

  const onMouseDown = (e) => {
    dragRef.current = {
      x: e.clientX,
      y: e.clientY,
      ox: transform.x,
      oy: transform.y,
    };
  };
  const onMouseMove = (e) => {
    if (!dragRef.current) return;
    setTransform((t) => ({
      ...t,
      x: dragRef.current.ox + (e.clientX - dragRef.current.x),
      y: dragRef.current.oy + (e.clientY - dragRef.current.y),
    }));
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const wheel = (e) => {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setTransform((t) => ({
        ...t,
        scale: Math.max(0.3, Math.min(2.5, t.scale + delta)),
      }));
    };
    el.addEventListener("wheel", wheel, { passive: false });
    return () => el.removeEventListener("wheel", wheel);
  }, []);

  return html`
    <div>
      <h1>Connection Map</h1>
      <p className="subtitle">
        Projects grouped by universe. Lines show direct sequence relationships.
        Drag to pan, scroll to zoom.
      </p>

      <div className="graph-wrap">
        <div className="graph-controls">
          <button
            onClick=${() =>
              setTransform((t) => ({
                ...t,
                scale: Math.min(2.5, t.scale + 0.2),
              }))}
          >
            +
          </button>
          <button
            onClick=${() =>
              setTransform((t) => ({
                ...t,
                scale: Math.max(0.3, t.scale - 0.2),
              }))}
          >
            −
          </button>
          <button onClick=${() => setTransform({ x: 0, y: 0, scale: 1 })}>
            ⌂
          </button>
        </div>
        <div className="graph-legend">
          <div>
            <span
              className="legend-dot"
              style=${{ background: "var(--red)" }}
            ></span>
            Universe lane
          </div>
          <div>
            <span
              style=${{
                width: "16px",
                height: "1px",
                background: "var(--text-faint)",
                display: "inline-block",
              }}
            ></span>
            Sequence link
          </div>
        </div>
        <svg
          ref=${svgRef}
          className="graph-svg"
          onMouseDown=${onMouseDown}
          onMouseMove=${onMouseMove}
          onMouseUp=${onMouseUp}
          onMouseLeave=${onMouseUp}
        >
          <g
            transform=${"translate(" +
            transform.x +
            "," +
            transform.y +
            ") scale(" +
            transform.scale +
            ")"}
          >
            ${edges.map((e, i) => {
              const from = nodes.find((n) => n.id === e.from);
              const to = nodes.find((n) => n.id === e.to);
              if (!from || !to) return null;
              return html`<line
                key=${i}
                x1=${from.x + 60}
                y1=${from.y + 20}
                x2=${to.x + 60}
                y2=${to.y + 20}
                stroke="var(--text-faint)"
                strokeWidth="1"
                strokeDasharray="3,3"
                opacity="0.4"
              />`;
            })}
            ${nodes.map((n) => {
              const status = statusOf(n.id, userData);
              const title =
                n.project.title.length > 18
                  ? n.project.title.slice(0, 17) + "…"
                  : n.project.title;
              return html`
                <g
                  key=${n.id}
                  transform=${"translate(" + n.x + "," + n.y + ")"}
                  style=${{ cursor: "pointer" }}
                  onClick=${() => onOpen(n.id)}
                >
                  <rect
                    width="120"
                    height="40"
                    rx="6"
                    fill="var(--card)"
                    stroke=${n.color}
                    strokeWidth="1.5"
                  />
                  <circle
                    cx="10"
                    cy="20"
                    r="4"
                    fill=${status === "completed"
                      ? "var(--green)"
                      : status === "watching"
                        ? "var(--gold)"
                        : "#5a5a72"}
                  />
                  <text
                    x="20"
                    y="17"
                    fontSize="10"
                    fontWeight="600"
                    fill="var(--text)"
                    >${title}</text
                  >
                  <text x="20" y="30" fontSize="8.5" fill="var(--text-faint)">
                    ${n.project.releaseYear} ·
                    ${n.project.type.replace(/-/g, " ")}
                  </text>
                </g>
              `;
            })}
          </g>
        </svg>
      </div>

      <p
        className="text-faint"
        style=${{ fontSize: "12px", marginTop: "12px" }}
      >
        ${nodes.length} nodes · ${edges.length} links. Only direct sequence
        links (previous → following) are drawn.
      </p>
    </div>
  `;
}
