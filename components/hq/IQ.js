import { html, useEffect, useMemo, useRef, useState } from "htm/react";
import { buildQuiz, hashSeed } from "../../utils/hq.js";
import { SectionHead, Ring } from "./shared.js";

const key = (uid) => "mt-iq:" + uid;
export const loadIQ = (uid) => { try { const v = JSON.parse(localStorage.getItem(key(uid)) || "null"); if (v && typeof v === "object") return { games: 0, answered: 0, correct: 0, best: 0, daily: null, ...v }; } catch (e) { /* storage unavailable */ } return { games: 0, answered: 0, correct: 0, best: 0, daily: null }; };
const saveIQ = (uid, v) => { try { localStorage.setItem(key(uid), JSON.stringify(v)); } catch (e) { /* storage unavailable */ } };
export const iqScore = (s) => (s.answered ? Math.round((s.correct / s.answered) * 100) : null);
const todayKey = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
const LETTERS = ["A", "B", "C", "D"];

export function IQ({ uid, stats, onStats }) {
  const [round, setRound] = useState(null); // { mode, questions, idx, picks }
  const [result, setResult] = useState(null);
  const nextRef = useRef(null);
  const today = todayKey();
  const dailyDone = stats.daily && stats.daily.date === today ? stats.daily : null;

  const start = (mode) => {
    const seed = mode === "daily" ? hashSeed("marvel-iq-" + today) : (Math.random() * 4294967295) >>> 0;
    const questions = buildQuiz({ seed, count: 10 });
    setResult(null);
    setRound(questions.length ? { mode, questions, idx: 0, picks: [] } : null);
  };
  const q = round ? round.questions[round.idx] : null;
  const picked = round ? round.picks[round.idx] : undefined;

  const choose = (optId) => {
    if (!round || picked !== undefined) return;
    const picks = round.picks.slice(); picks[round.idx] = optId;
    setRound({ ...round, picks });
  };
  useEffect(() => { if (picked !== undefined) nextRef.current?.focus(); }, [picked]);
  useEffect(() => {
    if (!q || picked !== undefined) return;
    const onKey = (e) => { const n = Number(e.key); if (n >= 1 && n <= q.options.length) choose(q.options[n - 1].id); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const next = () => {
    if (round.idx + 1 < round.questions.length) return setRound({ ...round, idx: round.idx + 1 });
    const correct = round.questions.filter((x, i) => round.picks[i] === x.correct).length;
    const updated = { ...stats, games: stats.games + 1, answered: stats.answered + round.questions.length, correct: stats.correct + correct, best: Math.max(stats.best, correct), daily: round.mode === "daily" && !dailyDone ? { date: today, score: correct } : stats.daily };
    saveIQ(uid, updated); onStats(updated);
    setResult({ mode: round.mode, correct, questions: round.questions, picks: round.picks });
    setRound(null);
  };

  const iq = iqScore(stats);
  return html`
    <section aria-labelledby="hq-iq">
      <${SectionHead} title="Marvel IQ" blurb="Ten questions built only from the verified facts in this catalog: release years, phases, cast, runtimes and more." />
      ${!round ? html`<div className="hq-iq-home">
        <div className="hq-iq-score">
          <${Ring} percent=${iq || 0} size=${118} stroke=${10}><b>${iq === null ? "–" : iq}</b><//>
          <div>
            <span className="hq-eyebrow">Your Marvel IQ</span>
            <p className="hq-muted">${iq === null ? "Play a round to set your score. It is your overall accuracy across every question you answer." : "Overall accuracy across " + stats.answered + " answers in " + stats.games + " round" + (stats.games > 1 ? "s" : "") + ". Best round: " + stats.best + "/10."}</p>
          </div>
        </div>
        ${result ? html`<div className="hq-iq-result" role="status">
          <h3>${result.correct}/${result.questions.length} correct ${result.mode === "daily" ? "· Daily challenge" : ""}</h3>
          <p>${result.correct === 10 ? "Flawless. Nothing in the archive gets past you." : result.correct >= 7 ? "Sharp work. You know this universe well." : result.correct >= 4 ? "Solid effort. A few facts slipped by." : "A rough round, but every answer below is worth a second look."}</p>
          <ol className="hq-iq-review">
            ${result.questions.map((x, i) => { const ok = result.picks[i] === x.correct; return html`<li key=${x.id} className=${ok ? "ok" : "miss"}><span aria-hidden="true">${ok ? "✓" : "✗"}</span><div><strong>${x.prompt}</strong><small>${x.explanation}</small></div></li>`; })}
          </ol>
        </div>` : null}
        <div className="hq-iq-modes">
          <article><h3>Daily challenge</h3><p>${dailyDone ? "Today's score: " + dailyDone.score + "/10. Replaying will not change it." : "The same ten questions for everyone today. Your first score counts."}</p><button type="button" className="btn btn-primary" onClick=${() => start("daily")}>${dailyDone ? "Replay today's set" : "Play daily challenge"}</button></article>
          <article><h3>Practice round</h3><p>A fresh random set every time. Great for warming up.</p><button type="button" className="btn" onClick=${() => start("practice")}>${result ? "Play again" : "Start practice"}</button></article>
        </div>
      </div>` : html`<div className="hq-quiz">
        <div className="hq-quiz-top"><span>Question ${round.idx + 1} of ${round.questions.length}</span><span className="hq-meter"><i style=${{ width: ((round.idx + (picked !== undefined ? 1 : 0)) / round.questions.length) * 100 + "%" }}></i></span><button type="button" className="btn ghost sm" onClick=${() => setRound(null)}>Quit</button></div>
        <h3 className="hq-quiz-q">${q.prompt}</h3>
        <ul className="hq-quiz-opts" role="radiogroup" aria-label="Answers">
          ${q.options.map((o, i) => { const state = picked === undefined ? "" : o.id === q.correct ? " right" : o.id === picked ? " wrong" : " dim"; return html`<li key=${o.id}><button type="button" role="radio" aria-checked=${picked === o.id} disabled=${picked !== undefined} className=${"hq-opt" + state} onClick=${() => choose(o.id)}><kbd>${LETTERS[i]}</kbd><span>${o.text}</span>${picked !== undefined && o.id === q.correct ? html`<i aria-hidden="true">✓</i>` : picked === o.id ? html`<i aria-hidden="true">✗</i>` : null}</button></li>`; })}
        </ul>
        ${picked !== undefined ? html`<div className=${"hq-quiz-fb " + (picked === q.correct ? "ok" : "miss")} role="status"><strong>${picked === q.correct ? "Correct" : "Not quite"}</strong><p>${q.explanation}</p><button type="button" className="btn btn-primary" ref=${nextRef} onClick=${next}>${round.idx + 1 < round.questions.length ? "Next question →" : "See results"}</button></div>` : html`<p className="hq-muted">Tip: press 1 to ${q.options.length} to answer.</p>`}
      </div>`}
    </section>`;
}
