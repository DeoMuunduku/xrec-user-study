import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/* =========================================================
   CONSTANTS
   ========================================================= */

const CUES = [
  { id: "price", label: "Prix" },
  { id: "food_quality", label: "Qualité alimentaire" },
  { id: "service", label: "Service" },
  { id: "ambiance", label: "Ambiance" },
  { id: "wait_time", label: "Temps d'attente" },
  { id: "cleanliness", label: "Propreté" },
  { id: "location", label: "Localisation" },
  { id: "portion", label: "Portion" },
];

const GENERIC_ORDER = ["food_quality", "price", "service", "ambiance", "wait_time", "cleanliness", "location", "portion"];

const TIME_CONDITIONS = ["8s", "16s", "full"];
const STORAGE_KEY_TIME = "study_time_condition_v11";

/** Tu veux garder 20s */
const PREPARE_SECONDS = 20;

function getReadSeconds(cond) {
  if (cond === "8s") return 8;
  if (cond === "16s") return 16;
  return null; // full = self-paced
}

function getK(cond) {
  if (cond === "8s") return 3;
  if (cond === "16s") return 6;
  return 8;
}

const MIN_PREFS_ALL = 2;

/* =========================================================
   API : submit payload
   ========================================================= */

async function submitStudy(payload) {
  const base = import.meta.env.VITE_API_URL;
  if (!base) throw new Error("VITE_API_URL manquant");

  const res = await fetch(`${base}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`submit failed (${res.status}): ${txt}`);
  }
  return res.json().catch(() => ({}));
}

/* =========================================================
   DATA (placeholder)
   ========================================================= */

const RESTAURANTS = {
  ulele: {
    name: "Ulele",
    evidence: {
      price: { score: 3.2, text: "Plats principaux entre 25$ et 45$. Cocktails artisanaux à partir de 12$." },
      food_quality: { score: 4.5, text: "Cuisine avec ingrédients locaux. Spécialité de grillades au feu de bois." },
      service: { score: 4.7, text: "Personnel attentif. Les serveurs font des recommandations pertinentes." },
      ambiance: { score: 4.3, text: "Bâtiment historique rénové. Terrasse spacieuse et éclairage chaleureux." },
      wait_time: { score: 3.0, text: "Temps d'attente moyen d’environ 20 minutes aux heures de pointe." },
      cleanliness: { score: 4.6, text: "Cuisine ouverte visible. Normes d'hygiène strictes respectées." },
      location: { score: 4.4, text: "Accessible facilement. Parking sur place disponible." },
      portion: { score: 3.8, text: "Portions généreuses pour les plats principaux." },
    },
  },
  duchess: {
    name: "Duchess Bakery",
    evidence: {
      price: { score: 4.1, text: "Sandwichs et salades entre 10$ et 16$. Pâtisseries entre 4$ et 8$." },
      food_quality: { score: 4.6, text: "Viennoiseries faites maison. Menu renouvelé régulièrement." },
      service: { score: 4.2, text: "Service au comptoir rapide. Personnel accueillant." },
      ambiance: { score: 4.0, text: "Décor moderne. Espace lumineux avec grandes baies vitrées." },
      wait_time: { score: 4.3, text: "Temps d'attente moyen de 5–8 minutes." },
      cleanliness: { score: 4.7, text: "Espace de préparation impeccable. Vitrines propres et organisées." },
      location: { score: 3.9, text: "Quartier calme. Parking limité dans la rue." },
      portion: { score: 3.5, text: "Portions adaptées pour un déjeuner léger ou un goûter." },
    },
  },
};

/* =========================================================
   UTILITIES
   ========================================================= */

function generateParticipantId() {
  return "P-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function pickTimeCondition() {
  const r = Math.random();
  if (r < 1 / 3) return "8s";
  if (r < 2 / 3) return "16s";
  return "full";
}

function importanceScore(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function weightFromImportance(imp) {
  const x = importanceScore(imp);
  return 0.35 + 0.3 * x;
}

function cueLabel(cueId) {
  const c = CUES.find((x) => x.id === cueId);
  return c ? c.label : cueId;
}

function firstSentence(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  const cut = s.split(".")[0].trim();
  return cut || s;
}

function sortSelectedCuesByImportance(prefMap) {
  return Object.values(prefMap)
    .filter((c) => c.selected)
    .sort((a, b) => {
      const sa = importanceScore(a.importance);
      const sb = importanceScore(b.importance);
      if (sb !== sa) return sb - sa;
      return a.label.localeCompare(b.label, "fr");
    });
}

function makeCueSet(prefMap, K) {
  const chosen = sortSelectedCuesByImportance(prefMap).map((c) => c.id);
  const set = new Set(chosen);
  for (const x of GENERIC_ORDER) {
    if (set.size >= K) break;
    if (!set.has(x)) set.add(x);
  }
  return Array.from(set).slice(0, K);
}

function orderAligned(prefMap, cueSet) {
  const chosen = sortSelectedCuesByImportance(prefMap).map((c) => c.id);
  const chosenSet = new Set(chosen);
  const inChosen = chosen.filter((x) => cueSet.includes(x));
  const rest = cueSet.filter((x) => !chosenSet.has(x));
  return [...inChosen, ...rest].slice(0, cueSet.length);
}

function orderBaseline(cueSet) {
  const set = new Set(cueSet);
  return GENERIC_ORDER.filter((x) => set.has(x));
}

function buildExplanation(restaurant, cueOrder, cueSet) {
  const ev = restaurant.evidence;

  const blocks = {};
  for (const cueId of cueSet) {
    const e = ev[cueId];
    const bit = e ? firstSentence(e.text) : "Information non disponible";
    blocks[cueId] = `${cueLabel(cueId)} : ${bit}.`;
  }

  const lines = [];
  lines.push(`Recommandation : ${restaurant.name}`);
  lines.push("Explication :");
  lines.push("");
  cueOrder.forEach((cueId) => {
    const b = blocks[cueId];
    if (b) lines.push(`- ${b}`);
  });
  return lines.join("\n");
}

function computeRestaurantScore(restaurant, prefMap) {
  const ev = restaurant.evidence;
  const selected = Object.values(prefMap).filter((c) => c.selected);

  let score = 0;
  if (selected.length === 0) {
    score = (ev.food_quality?.score ?? 0) + (ev.price?.score ?? 0) + (ev.service?.score ?? 0);
  } else {
    for (const c of selected) {
      const e = ev[c.id];
      if (!e) continue;
      score += (Number(e.score ?? 0) || 0) * weightFromImportance(c.importance);
    }
  }
  return score;
}

function chooseBestRestaurant(prefMap) {
  const keys = Object.keys(RESTAURANTS);
  let bestKey = keys[0];
  let bestScore = -Infinity;
  for (const k of keys) {
    const s = computeRestaurantScore(RESTAURANTS[k], prefMap);
    if (s > bestScore) {
      bestScore = s;
      bestKey = k;
    }
  }
  return { key: bestKey, score: bestScore };
}

/* =========================================================
   PAGE 1 : WELCOME
   ========================================================= */

function WelcomeScreen({ onNext, conditionText }) {
  return (
    <div className="screen welcome-screen">
      <div className="card welcome-card">
        <div className="welcome-badge">ÉTUDE ANONYME</div>

        <h1 className="welcome-title">Étude : évaluation d’explications de recommandations de restaurants</h1>

        <div className="scenario-box">
          <h3>Scénario</h3>
          <p>
            Imaginez que vous êtes dans une <strong>ville ou un pays étranger</strong> et que vous souhaitez aller dans un
            restaurant.
          </p>
          <p>
            Pour vous aider, notre système vous demande d’indiquer vos <strong>préférences</strong>, puis il recommande un
            restaurant <strong>et l’explique</strong>.
          </p>

          <h3 style={{ marginTop: 14 }}>Votre rôle</h3>
          <p>
            Vous allez lire <strong>deux explications</strong> (séparées), puis répondre à quelques questions après chacune.
          </p>

          <div className="warning-box" style={{ marginTop: 12, borderColor: "#ef4444", color: "#b91c1c", fontWeight: 900 }}>
            Point important : {conditionText}
          </div>

          <p className="scenario-note" style={{ marginTop: 10 }}>
            Il n’y a pas de bonne ou mauvaise réponse. Aucune donnée personnelle (nom/e-mail) n’est demandée.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onNext}>
          Commencer
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE 2 : PREFERENCES
   ========================================================= */

const IMPORTANCE_OPTIONS = [
  { id: "", label: "Choisir l’importance..." },
  { id: "5", label: "5 — Très important" },
  { id: "4", label: "4 — Important" },
  { id: "3", label: "3 — Peu importe" },
  { id: "2", label: "2 — Peu important" },
  { id: "1", label: "1 — Pas important" },
];

const PREFERENCE_OPTIONS = {
  price: [
    { id: "", label: "Choisir..." },
    { id: "tight", label: "Budget serré (prix bas)" },
    { id: "medium", label: "Budget moyen" },
    { id: "flexible", label: "Budget flexible (prix élevé OK)" },
    { id: "any", label: "Peu importe" },
  ],
  food_quality: [
    { id: "", label: "Choisir..." },
    { id: "good", label: "Bonne qualité" },
    { id: "very_good", label: "Très bonne qualité" },
    { id: "excellent", label: "Excellente qualité" },
    { id: "any", label: "Peu importe" },
  ],
  service: [
    { id: "", label: "Choisir..." },
    { id: "fast", label: "Service rapide" },
    { id: "warm", label: "Service chaleureux" },
    { id: "attentive", label: "Service très attentionné" },
    { id: "any", label: "Peu importe" },
  ],
  ambiance: [
    { id: "", label: "Choisir..." },
    { id: "calm", label: "Ambiance calme" },
    { id: "lively", label: "Ambiance animée" },
    { id: "cozy", label: "Ambiance conviviale" },
    { id: "any", label: "Peu importe" },
  ],
  wait_time: [
    { id: "", label: "Choisir..." },
    { id: "short", label: "Attente courte" },
    { id: "ok", label: "Attente acceptable" },
    { id: "any", label: "Peu importe" },
  ],
  cleanliness: [
    { id: "", label: "Choisir..." },
    { id: "ok", label: "Propreté correcte" },
    { id: "very_clean", label: "Très propre" },
    { id: "spotless", label: "Impeccable" },
    { id: "any", label: "Peu importe" },
  ],
  location: [
    { id: "", label: "Choisir..." },
    { id: "close", label: "Proche / pratique" },
    { id: "nice_area", label: "Quartier agréable" },
    { id: "any", label: "Peu importe" },
  ],
  portion: [
    { id: "", label: "Choisir..." },
    { id: "light", label: "Portions légères" },
    { id: "normal", label: "Portions normales" },
    { id: "generous", label: "Portions généreuses" },
    { id: "any", label: "Peu importe" },
  ],
};

function PreferencesScreen({ prefMap, setPrefMap, onNext, onBack }) {
  const selectedPrefs = useMemo(() => Object.values(prefMap).filter((c) => c.selected), [prefMap]);

  const allSelectedAreComplete = useMemo(() => {
    if (selectedPrefs.length === 0) return false;
    return selectedPrefs.every((c) => c.preference && c.importance);
  }, [selectedPrefs]);

  const canContinue = useMemo(() => selectedPrefs.length >= MIN_PREFS_ALL && allSelectedAreComplete, [
    selectedPrefs.length,
    allSelectedAreComplete,
  ]);

  const toggleSelected = (cueId) => {
    setPrefMap((prev) => {
      const next = { ...prev };
      const cur = next[cueId];
      const selected = !cur.selected;
      next[cueId] = {
        ...cur,
        selected,
        preference: selected ? cur.preference : "",
        importance: selected ? cur.importance : "",
      };
      return next;
    });
  };

  const setPreference = (cueId, prefId) => {
    setPrefMap((prev) => {
      const next = { ...prev };
      const cur = next[cueId];
      next[cueId] = { ...cur, selected: true, preference: prefId };
      return next;
    });
  };

  const setImportance = (cueId, value) => {
    setPrefMap((prev) => {
      const next = { ...prev };
      const cur = next[cueId];
      next[cueId] = { ...cur, selected: true, importance: value };
      return next;
    });
  };

  return (
    <div className="screen priority-screen">
      <div className="card card-wide">
        <h2>Vos préférences</h2>

        <p className="screen-description">
          Sélectionnez au moins <strong>{MIN_PREFS_ALL}</strong> préférences. Pour chaque préférence sélectionnée, indiquez
          la préférence et l’importance.
        </p>

        <div className="pref-table">
          <div className="pref-head">
            <div>Préférence</div>
            <div>Choix</div>
            <div style={{ textAlign: "right" }}>Importance</div>
          </div>

          {Object.values(prefMap).map((cue) => {
            const options = PREFERENCE_OPTIONS[cue.id] || [
              { id: "", label: "Choisir..." },
              { id: "any", label: "Peu importe" },
            ];
            const rowDisabled = !cue.selected;

            return (
              <div key={cue.id} className={`pref-row${rowDisabled ? " disabled" : ""}`}>
                <div className="pref-crit">
                  <input type="checkbox" checked={cue.selected} onChange={() => toggleSelected(cue.id)} />
                  <span>{cue.label}</span>
                </div>

                <div>
                  <select
                    className="pref-select"
                    value={cue.preference || ""}
                    onChange={(e) => setPreference(cue.id, e.target.value)}
                    disabled={!cue.selected}
                  >
                    {options.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <select
                    className="pref-select"
                    value={cue.importance || ""}
                    onChange={(e) => setImportance(cue.id, e.target.value)}
                    disabled={!cue.selected}
                  >
                    {IMPORTANCE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {!canContinue && (
          <div className="warning-box" style={{ marginTop: 14 }}>
            Pour continuer : sélectionnez au moins <strong>{MIN_PREFS_ALL}</strong> préférences, puis choisissez une{" "}
            <strong>préférence</strong> et une <strong>importance</strong> pour chacune.
          </div>
        )}

        <div className="nav-buttons">
          <button className="btn btn-secondary" onClick={onBack}>
            Retour
          </button>
          <button className="btn btn-primary" onClick={onNext} disabled={!canContinue}>
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE 3 : READING + QUESTIONS
   ========================================================= */

function ReadingScreen({ restaurant, expTexts, orderAB, readSeconds, cueSet, selectedCount, metaToLog, onBack, onFinish }) {
  const [which, setWhich] = useState(orderAB[0]);
  const [phase, setPhase] = useState("prepare"); // prepare -> reading -> questions
  const [prepareLeft, setPrepareLeft] = useState(PREPARE_SECONDS);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef(null);
  const t0Ref = useRef(0);
  const readingStartRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startPrepare = () => {
    clearTimer();
    t0Ref.current = Date.now();
    setPrepareLeft(PREPARE_SECONDS);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0Ref.current) / 1000;
      const left = Math.max(0, Math.ceil(PREPARE_SECONDS - elapsed));
      setPrepareLeft(left);
      if (left <= 0) {
        clearTimer();
        setPhase("reading");
      }
    }, 120);
  };

  const startReadingTimer = () => {
    if (readSeconds == null) return;
    clearTimer();
    t0Ref.current = Date.now();
    readingStartRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0Ref.current) / 1000;
      const p = Math.min(1, elapsed / readSeconds);
      setProgress(Math.round(p * 100));
      if (elapsed >= readSeconds) {
        clearTimer();
        setPhase("questions");
      }
    }, 60);
  };

  useEffect(() => {
    if (phase !== "prepare") return;
    startPrepare();
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, which]);

  useEffect(() => {
    if (phase !== "reading") return;
    readingStartRef.current = Date.now();
    startReadingTimer();
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const [answers, setAnswers] = useState({
    A: { decision: "", confidence: "", startsImportant: "", gist: [], coverage: "", fullReadingTimeSec: null },
    B: { decision: "", confidence: "", startsImportant: "", gist: [], coverage: "", fullReadingTimeSec: null },
  });

  const cur = answers[which];

  const setCur = (patch) => {
    setAnswers((prev) => ({ ...prev, [which]: { ...prev[which], ...patch } }));
  };

  const gistOptions = useMemo(() => {
    const opts = cueSet.map((id) => ({ id, label: cueLabel(id) }));
    return [...opts, { id: "other", label: "Autre / je ne sais pas" }];
  }, [cueSet]);

  const toggleGist = (id) => {
    setAnswers((prev) => {
      const curArr = prev[which].gist || [];

      if (id === "other") {
        return { ...prev, [which]: { ...prev[which], gist: ["other"] } };
      }

      let base = curArr.filter((x) => x !== "other");
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      const clipped = next.slice(0, 2);
      return { ...prev, [which]: { ...prev[which], gist: clipped } };
    });
  };

  const gistOk = (cur.gist?.length || 0) === 2 || ((cur.gist?.length || 0) === 1 && cur.gist?.[0] === "other");
  const curComplete = Boolean(cur.decision && cur.confidence && cur.startsImportant && gistOk && cur.coverage);

  const recommendationPrefix =
    selectedCount <= 1
      ? "En nous basant sur votre priorité actuelle, nous vous recommandons :"
      : "En nous basant sur vos priorités actuelles, nous vous recommandons :";

  const goNext = () => {
    if (which === orderAB[0]) {
      setWhich(orderAB[1]);
      setPhase("prepare");
      setProgress(0);
      setPrepareLeft(PREPARE_SECONDS);
    } else {
      onFinish({ ...metaToLog, restaurantName: restaurant.name, cueSet, answers });
    }
  };

  const onFullContinue = () => {
    const sec = Math.max(0, Math.round((Date.now() - readingStartRef.current) / 1000));
    setCur({ fullReadingTimeSec: sec });
    setPhase("questions");
  };

  const stepIndex = which === orderAB[0] ? 1 : 2;

  return (
    <div className="screen evaluation-screen">
      <div className="card card-wide">
        <h2>Recommandation</h2>
        <p className="screen-description" style={{ marginBottom: 0 }}>
          {recommendationPrefix} <span style={{ color: "#2563eb", fontWeight: 900 }}>{restaurant?.name || "—"}</span>
        </p>
      </div>

      <div className="card card-wide" style={{ marginTop: 14 }}>
        <h3 style={{ margin: 0 }}>Explication {stepIndex}</h3>

        {phase === "prepare" && (
          <div style={{ marginTop: 12 }}>
            <div className="blink-red">L’explication va s’afficher dans quelques instants…</div>

            {readSeconds != null ? (
              <div style={{ marginTop: 10, fontWeight: 900 }}>
                Vous devrez la lire pendant <strong>{readSeconds}</strong> secondes et répondre à quelques questions.
              </div>
            ) : (
              <div style={{ marginTop: 10, fontWeight: 900 }}>Vous pourrez lire l’explication, puis répondre à quelques questions.</div>
            )}

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.55 }}>Affichage dans ~{prepareLeft}s</div>
          </div>
        )}

        {phase === "reading" && (
          <>
            <div className="text-content" style={{ minHeight: 220, marginTop: 12 }}>
              {expTexts[which].split("\n").map((line, i) => (
                <p key={i}>{line || "\u00A0"}</p>
              ))}
            </div>

            {readSeconds != null ? (
              <div className="progress-bar-wrap" aria-label="progress">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            ) : (
              <div className="nav-buttons" style={{ marginTop: 14, justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={onFullContinue}>
                  Continuer
                </button>
              </div>
            )}
          </>
        )}

        {phase === "questions" && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Questions — Explication {stepIndex}</div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>1) Avec cette explication, iriez-vous dans ce restaurant ?</div>
                <div className="comparison-options" style={{ justifyContent: "flex-start" }}>
                  {[{ id: "yes", label: "Oui" }, { id: "no", label: "Non" }, { id: "unsure", label: "Incertain" }].map((opt) => (
                    <label key={opt.id} className={`radio-option${cur.decision === opt.id ? " active" : ""}`}>
                      <input
                        type="radio"
                        name={`decision_${which}`}
                        value={opt.id}
                        checked={cur.decision === opt.id}
                        onChange={(e) => setCur({ decision: e.target.value })}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>2) À quel point êtes-vous sûr(e) de votre décision ?</div>
                <div className="likert-scale">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      className={`likert-btn${Number(cur.confidence) === val ? " active" : ""}`}
                      onClick={() => setCur({ confidence: String(val) })}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="likert-labels">
                  <span>Pas sûr du tout</span>
                  <span>Très sûr</span>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>3) L’explication commençait par ce qui est le plus important pour moi.</div>
                <div className="likert-scale">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      className={`likert-btn${Number(cur.startsImportant) === val ? " active" : ""}`}
                      onClick={() => setCur({ startsImportant: String(val) })}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="likert-labels">
                  <span>Pas du tout d’accord</span>
                  <span>Tout à fait d’accord</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>4) Quels sont les 2 points principaux que vous retenez ? (choisissez 2)</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {gistOptions.map((o) => {
                    const checked = cur.gist?.includes(o.id);
                    const otherSelected = (cur.gist?.length || 0) === 1 && cur.gist?.[0] === "other";
                    const disabled = otherSelected ? o.id !== "other" : false;

                    const alreadyTwo = (cur.gist?.filter((x) => x !== "other")?.length || 0) >= 2;
                    const disableMore = alreadyTwo && !checked && o.id !== "other";

                    return (
                      <label
                        key={o.id}
                        className="radio-option"
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 12,
                          padding: "10px 12px",
                          cursor: disabled || disableMore ? "not-allowed" : "pointer",
                          opacity: disabled || disableMore ? 0.55 : 1,
                          background: checked ? "rgba(34,197,94,0.12)" : "white",
                          fontWeight: 650,
                        }}
                      >
                        <input type="checkbox" checked={checked} disabled={disabled || disableMore} onChange={() => toggleGist(o.id)} />
                        <span>{o.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>5) J’ai pu lire :</div>
                <select className="pref-select" value={cur.coverage} onChange={(e) => setCur({ coverage: e.target.value })}>
                  <option value="">Choisir...</option>
                  <option value="100">Presque tout (≈ 100%)</option>
                  <option value="70">Une grande partie (≈ 70%)</option>
                  <option value="50">Environ la moitié (≈ 50%)</option>
                  <option value="30">Moins d’un tiers (&lt; 30%)</option>
                </select>
              </div>
            </div>

            <div className="nav-buttons" style={{ marginTop: 14, justifyContent: "space-between" }}>
              <button className="btn btn-secondary" onClick={onBack}>
                Retour
              </button>
              <button className="btn btn-primary" disabled={!curComplete} onClick={goNext}>
                {which === orderAB[1] ? "Terminer" : "Continuer (explication suivante)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   THANK YOU
   ========================================================= */

function ThankYouScreen({ data }) {
  return (
    <div className="screen thankyou-screen">
      <div className="card welcome-card">
        <h2>Merci pour votre participation !</h2>
        <p>Vos réponses ont été enregistrées.</p>
        <p style={{ opacity: 0.75 }}>Condition : {data?.timeCondition}</p>
        <p style={{ opacity: 0.75 }}>Identifiant : {data?.participantId}</p>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */

export default function App() {
  const [screen, setScreen] = useState(0);
  const [participantId] = useState(generateParticipantId);

  const [timeCondition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TIME);
    if (saved && TIME_CONDITIONS.includes(saved)) return saved;
    const chosen = pickTimeCondition();
    localStorage.setItem(STORAGE_KEY_TIME, chosen);
    return chosen;
  });

  const readSeconds = useMemo(() => getReadSeconds(timeCondition), [timeCondition]);
  const K = useMemo(() => getK(timeCondition), [timeCondition]);

  const conditionText = useMemo(() => {
    if (readSeconds == null) return "Deux explications, sans limite de temps.";
    return `Deux explications, chacune affichée pendant ${readSeconds} secondes.`;
  }, [readSeconds]);

  const [prefMap, setPrefMap] = useState(() => {
    const obj = {};
    CUES.forEach((c) => (obj[c.id] = { ...c, selected: false, preference: "", importance: "" }));
    return obj;
  });

  const selectedCount = useMemo(() => Object.values(prefMap).filter((c) => c.selected).length, [prefMap]);

  const [config] = useState(() => {
    const alignedIsA = Math.random() < 0.5;
    const orderAB = Math.random() < 0.5 ? ["A", "B"] : ["B", "A"];
    return { alignedIsA, orderAB };
  });

  const chosen = useMemo(() => chooseBestRestaurant(prefMap), [prefMap]);
  const restaurant = RESTAURANTS[chosen.key];

  const cueSet = useMemo(() => makeCueSet(prefMap, K), [prefMap, K]);
  const alignedOrderArr = useMemo(() => orderAligned(prefMap, cueSet), [prefMap, cueSet]);
  const baselineOrderArr = useMemo(() => orderBaseline(cueSet), [cueSet]);

  const expTexts = useMemo(() => {
    const alignedText = buildExplanation(restaurant, alignedOrderArr, cueSet);
    const baselineText = buildExplanation(restaurant, baselineOrderArr, cueSet);
    return { A: config.alignedIsA ? alignedText : baselineText, B: config.alignedIsA ? baselineText : alignedText };
  }, [restaurant, alignedOrderArr, baselineOrderArr, cueSet, config.alignedIsA]);

  const [studyData, setStudyData] = useState(null);

  const goto = (s) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const metaToLog = useMemo(
    () => ({
      participantId,
      timeCondition,
      readSeconds: readSeconds ?? "full",
      K,
      restaurantKey: chosen.key,
      alignedIsA: config.alignedIsA,
      orderAB: config.orderAB,
      baselineOrder: baselineOrderArr,
      alignedOrder: alignedOrderArr,
      selectedCount,
    }),
    [participantId, timeCondition, readSeconds, K, chosen.key, config.alignedIsA, config.orderAB, baselineOrderArr, alignedOrderArr, selectedCount]
  );

  return (
    <div className="app-container">
      {screen === 0 && <WelcomeScreen conditionText={conditionText} onNext={() => goto(1)} />}

      {screen === 1 && <PreferencesScreen prefMap={prefMap} setPrefMap={setPrefMap} onBack={() => goto(0)} onNext={() => goto(2)} />}

      {screen === 2 && (
        <ReadingScreen
          restaurant={restaurant}
          expTexts={expTexts}
          orderAB={config.orderAB}
          readSeconds={readSeconds}
          cueSet={cueSet}
          selectedCount={selectedCount}
          metaToLog={metaToLog}
          onBack={() => goto(1)}
          onFinish={async (payload) => {
            try {
              await submitStudy(payload); // 1) envoie d'abord
              setStudyData(payload); // 2) puis affiche merci
              goto(3);
            } catch (e) {
              console.error(e);
              alert("Erreur: vos réponses n'ont PAS été envoyées. Réessayez ou contactez l'organisateur.");
              const key = `study_backup_${payload.participantId}_${Date.now()}`;
              localStorage.setItem(key, JSON.stringify(payload));
            }
          }}
        />
      )}

      {screen === 3 && studyData && <ThankYouScreen data={studyData} />}
    </div>
  );
}
EOFcd /Users/deomunduku/xrec-user-study/web

cat > src/App.jsx <<'EOF'
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/* =========================================================
   CONSTANTS
   ========================================================= */

const CUES = [
  { id: "price", label: "Prix" },
  { id: "food_quality", label: "Qualité alimentaire" },
  { id: "service", label: "Service" },
  { id: "ambiance", label: "Ambiance" },
  { id: "wait_time", label: "Temps d'attente" },
  { id: "cleanliness", label: "Propreté" },
  { id: "location", label: "Localisation" },
  { id: "portion", label: "Portion" },
];

const GENERIC_ORDER = ["food_quality", "price", "service", "ambiance", "wait_time", "cleanliness", "location", "portion"];

const TIME_CONDITIONS = ["8s", "16s", "full"];
const STORAGE_KEY_TIME = "study_time_condition_v11";

/** Tu veux garder 20s */
const PREPARE_SECONDS = 20;

function getReadSeconds(cond) {
  if (cond === "8s") return 8;
  if (cond === "16s") return 16;
  return null; // full = self-paced
}

function getK(cond) {
  if (cond === "8s") return 3;
  if (cond === "16s") return 6;
  return 8;
}

const MIN_PREFS_ALL = 2;

/* =========================================================
   API : submit payload
   ========================================================= */

async function submitStudy(payload) {
  const base = import.meta.env.VITE_API_URL;
  if (!base) throw new Error("VITE_API_URL manquant");

  const res = await fetch(`${base}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`submit failed (${res.status}): ${txt}`);
  }
  return res.json().catch(() => ({}));
}

/* =========================================================
   DATA (placeholder)
   ========================================================= */

const RESTAURANTS = {
  ulele: {
    name: "Ulele",
    evidence: {
      price: { score: 3.2, text: "Plats principaux entre 25$ et 45$. Cocktails artisanaux à partir de 12$." },
      food_quality: { score: 4.5, text: "Cuisine avec ingrédients locaux. Spécialité de grillades au feu de bois." },
      service: { score: 4.7, text: "Personnel attentif. Les serveurs font des recommandations pertinentes." },
      ambiance: { score: 4.3, text: "Bâtiment historique rénové. Terrasse spacieuse et éclairage chaleureux." },
      wait_time: { score: 3.0, text: "Temps d'attente moyen d’environ 20 minutes aux heures de pointe." },
      cleanliness: { score: 4.6, text: "Cuisine ouverte visible. Normes d'hygiène strictes respectées." },
      location: { score: 4.4, text: "Accessible facilement. Parking sur place disponible." },
      portion: { score: 3.8, text: "Portions généreuses pour les plats principaux." },
    },
  },
  duchess: {
    name: "Duchess Bakery",
    evidence: {
      price: { score: 4.1, text: "Sandwichs et salades entre 10$ et 16$. Pâtisseries entre 4$ et 8$." },
      food_quality: { score: 4.6, text: "Viennoiseries faites maison. Menu renouvelé régulièrement." },
      service: { score: 4.2, text: "Service au comptoir rapide. Personnel accueillant." },
      ambiance: { score: 4.0, text: "Décor moderne. Espace lumineux avec grandes baies vitrées." },
      wait_time: { score: 4.3, text: "Temps d'attente moyen de 5–8 minutes." },
      cleanliness: { score: 4.7, text: "Espace de préparation impeccable. Vitrines propres et organisées." },
      location: { score: 3.9, text: "Quartier calme. Parking limité dans la rue." },
      portion: { score: 3.5, text: "Portions adaptées pour un déjeuner léger ou un goûter." },
    },
  },
};

/* =========================================================
   UTILITIES
   ========================================================= */

function generateParticipantId() {
  return "P-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
}

function pickTimeCondition() {
  const r = Math.random();
  if (r < 1 / 3) return "8s";
  if (r < 2 / 3) return "16s";
  return "full";
}

function importanceScore(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function weightFromImportance(imp) {
  const x = importanceScore(imp);
  return 0.35 + 0.3 * x;
}

function cueLabel(cueId) {
  const c = CUES.find((x) => x.id === cueId);
  return c ? c.label : cueId;
}

function firstSentence(text) {
  const s = String(text || "").trim();
  if (!s) return "";
  const cut = s.split(".")[0].trim();
  return cut || s;
}

function sortSelectedCuesByImportance(prefMap) {
  return Object.values(prefMap)
    .filter((c) => c.selected)
    .sort((a, b) => {
      const sa = importanceScore(a.importance);
      const sb = importanceScore(b.importance);
      if (sb !== sa) return sb - sa;
      return a.label.localeCompare(b.label, "fr");
    });
}

function makeCueSet(prefMap, K) {
  const chosen = sortSelectedCuesByImportance(prefMap).map((c) => c.id);
  const set = new Set(chosen);
  for (const x of GENERIC_ORDER) {
    if (set.size >= K) break;
    if (!set.has(x)) set.add(x);
  }
  return Array.from(set).slice(0, K);
}

function orderAligned(prefMap, cueSet) {
  const chosen = sortSelectedCuesByImportance(prefMap).map((c) => c.id);
  const chosenSet = new Set(chosen);
  const inChosen = chosen.filter((x) => cueSet.includes(x));
  const rest = cueSet.filter((x) => !chosenSet.has(x));
  return [...inChosen, ...rest].slice(0, cueSet.length);
}

function orderBaseline(cueSet) {
  const set = new Set(cueSet);
  return GENERIC_ORDER.filter((x) => set.has(x));
}

function buildExplanation(restaurant, cueOrder, cueSet) {
  const ev = restaurant.evidence;

  const blocks = {};
  for (const cueId of cueSet) {
    const e = ev[cueId];
    const bit = e ? firstSentence(e.text) : "Information non disponible";
    blocks[cueId] = `${cueLabel(cueId)} : ${bit}.`;
  }

  const lines = [];
  lines.push(`Recommandation : ${restaurant.name}`);
  lines.push("Explication :");
  lines.push("");
  cueOrder.forEach((cueId) => {
    const b = blocks[cueId];
    if (b) lines.push(`- ${b}`);
  });
  return lines.join("\n");
}

function computeRestaurantScore(restaurant, prefMap) {
  const ev = restaurant.evidence;
  const selected = Object.values(prefMap).filter((c) => c.selected);

  let score = 0;
  if (selected.length === 0) {
    score = (ev.food_quality?.score ?? 0) + (ev.price?.score ?? 0) + (ev.service?.score ?? 0);
  } else {
    for (const c of selected) {
      const e = ev[c.id];
      if (!e) continue;
      score += (Number(e.score ?? 0) || 0) * weightFromImportance(c.importance);
    }
  }
  return score;
}

function chooseBestRestaurant(prefMap) {
  const keys = Object.keys(RESTAURANTS);
  let bestKey = keys[0];
  let bestScore = -Infinity;
  for (const k of keys) {
    const s = computeRestaurantScore(RESTAURANTS[k], prefMap);
    if (s > bestScore) {
      bestScore = s;
      bestKey = k;
    }
  }
  return { key: bestKey, score: bestScore };
}

/* =========================================================
   PAGE 1 : WELCOME
   ========================================================= */

function WelcomeScreen({ onNext, conditionText }) {
  return (
    <div className="screen welcome-screen">
      <div className="card welcome-card">
        <div className="welcome-badge">ÉTUDE ANONYME</div>

        <h1 className="welcome-title">Étude : évaluation d’explications de recommandations de restaurants</h1>

        <div className="scenario-box">
          <h3>Scénario</h3>
          <p>
            Imaginez que vous êtes dans une <strong>ville ou un pays étranger</strong> et que vous souhaitez aller dans un
            restaurant.
          </p>
          <p>
            Pour vous aider, notre système vous demande d’indiquer vos <strong>préférences</strong>, puis il recommande un
            restaurant <strong>et l’explique</strong>.
          </p>

          <h3 style={{ marginTop: 14 }}>Votre rôle</h3>
          <p>
            Vous allez lire <strong>deux explications</strong> (séparées), puis répondre à quelques questions après chacune.
          </p>

          <div className="warning-box" style={{ marginTop: 12, borderColor: "#ef4444", color: "#b91c1c", fontWeight: 900 }}>
            Point important : {conditionText}
          </div>

          <p className="scenario-note" style={{ marginTop: 10 }}>
            Il n’y a pas de bonne ou mauvaise réponse. Aucune donnée personnelle (nom/e-mail) n’est demandée.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onNext}>
          Commencer
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE 2 : PREFERENCES
   ========================================================= */

const IMPORTANCE_OPTIONS = [
  { id: "", label: "Choisir l’importance..." },
  { id: "5", label: "5 — Très important" },
  { id: "4", label: "4 — Important" },
  { id: "3", label: "3 — Peu importe" },
  { id: "2", label: "2 — Peu important" },
  { id: "1", label: "1 — Pas important" },
];

const PREFERENCE_OPTIONS = {
  price: [
    { id: "", label: "Choisir..." },
    { id: "tight", label: "Budget serré (prix bas)" },
    { id: "medium", label: "Budget moyen" },
    { id: "flexible", label: "Budget flexible (prix élevé OK)" },
    { id: "any", label: "Peu importe" },
  ],
  food_quality: [
    { id: "", label: "Choisir..." },
    { id: "good", label: "Bonne qualité" },
    { id: "very_good", label: "Très bonne qualité" },
    { id: "excellent", label: "Excellente qualité" },
    { id: "any", label: "Peu importe" },
  ],
  service: [
    { id: "", label: "Choisir..." },
    { id: "fast", label: "Service rapide" },
    { id: "warm", label: "Service chaleureux" },
    { id: "attentive", label: "Service très attentionné" },
    { id: "any", label: "Peu importe" },
  ],
  ambiance: [
    { id: "", label: "Choisir..." },
    { id: "calm", label: "Ambiance calme" },
    { id: "lively", label: "Ambiance animée" },
    { id: "cozy", label: "Ambiance conviviale" },
    { id: "any", label: "Peu importe" },
  ],
  wait_time: [
    { id: "", label: "Choisir..." },
    { id: "short", label: "Attente courte" },
    { id: "ok", label: "Attente acceptable" },
    { id: "any", label: "Peu importe" },
  ],
  cleanliness: [
    { id: "", label: "Choisir..." },
    { id: "ok", label: "Propreté correcte" },
    { id: "very_clean", label: "Très propre" },
    { id: "spotless", label: "Impeccable" },
    { id: "any", label: "Peu importe" },
  ],
  location: [
    { id: "", label: "Choisir..." },
    { id: "close", label: "Proche / pratique" },
    { id: "nice_area", label: "Quartier agréable" },
    { id: "any", label: "Peu importe" },
  ],
  portion: [
    { id: "", label: "Choisir..." },
    { id: "light", label: "Portions légères" },
    { id: "normal", label: "Portions normales" },
    { id: "generous", label: "Portions généreuses" },
    { id: "any", label: "Peu importe" },
  ],
};

function PreferencesScreen({ prefMap, setPrefMap, onNext, onBack }) {
  const selectedPrefs = useMemo(() => Object.values(prefMap).filter((c) => c.selected), [prefMap]);

  const allSelectedAreComplete = useMemo(() => {
    if (selectedPrefs.length === 0) return false;
    return selectedPrefs.every((c) => c.preference && c.importance);
  }, [selectedPrefs]);

  const canContinue = useMemo(() => selectedPrefs.length >= MIN_PREFS_ALL && allSelectedAreComplete, [
    selectedPrefs.length,
    allSelectedAreComplete,
  ]);

  const toggleSelected = (cueId) => {
    setPrefMap((prev) => {
      const next = { ...prev };
      const cur = next[cueId];
      const selected = !cur.selected;
      next[cueId] = {
        ...cur,
        selected,
        preference: selected ? cur.preference : "",
        importance: selected ? cur.importance : "",
      };
      return next;
    });
  };

  const setPreference = (cueId, prefId) => {
    setPrefMap((prev) => {
      const next = { ...prev };
      const cur = next[cueId];
      next[cueId] = { ...cur, selected: true, preference: prefId };
      return next;
    });
  };

  const setImportance = (cueId, value) => {
    setPrefMap((prev) => {
      const next = { ...prev };
      const cur = next[cueId];
      next[cueId] = { ...cur, selected: true, importance: value };
      return next;
    });
  };

  return (
    <div className="screen priority-screen">
      <div className="card card-wide">
        <h2>Vos préférences</h2>

        <p className="screen-description">
          Sélectionnez au moins <strong>{MIN_PREFS_ALL}</strong> préférences. Pour chaque préférence sélectionnée, indiquez
          la préférence et l’importance.
        </p>

        <div className="pref-table">
          <div className="pref-head">
            <div>Préférence</div>
            <div>Choix</div>
            <div style={{ textAlign: "right" }}>Importance</div>
          </div>

          {Object.values(prefMap).map((cue) => {
            const options = PREFERENCE_OPTIONS[cue.id] || [
              { id: "", label: "Choisir..." },
              { id: "any", label: "Peu importe" },
            ];
            const rowDisabled = !cue.selected;

            return (
              <div key={cue.id} className={`pref-row${rowDisabled ? " disabled" : ""}`}>
                <div className="pref-crit">
                  <input type="checkbox" checked={cue.selected} onChange={() => toggleSelected(cue.id)} />
                  <span>{cue.label}</span>
                </div>

                <div>
                  <select
                    className="pref-select"
                    value={cue.preference || ""}
                    onChange={(e) => setPreference(cue.id, e.target.value)}
                    disabled={!cue.selected}
                  >
                    {options.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <select
                    className="pref-select"
                    value={cue.importance || ""}
                    onChange={(e) => setImportance(cue.id, e.target.value)}
                    disabled={!cue.selected}
                  >
                    {IMPORTANCE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>

        {!canContinue && (
          <div className="warning-box" style={{ marginTop: 14 }}>
            Pour continuer : sélectionnez au moins <strong>{MIN_PREFS_ALL}</strong> préférences, puis choisissez une{" "}
            <strong>préférence</strong> et une <strong>importance</strong> pour chacune.
          </div>
        )}

        <div className="nav-buttons">
          <button className="btn btn-secondary" onClick={onBack}>
            Retour
          </button>
          <button className="btn btn-primary" onClick={onNext} disabled={!canContinue}>
            Continuer
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE 3 : READING + QUESTIONS
   ========================================================= */

function ReadingScreen({ restaurant, expTexts, orderAB, readSeconds, cueSet, selectedCount, metaToLog, onBack, onFinish }) {
  const [which, setWhich] = useState(orderAB[0]);
  const [phase, setPhase] = useState("prepare"); // prepare -> reading -> questions
  const [prepareLeft, setPrepareLeft] = useState(PREPARE_SECONDS);
  const [progress, setProgress] = useState(0);

  const timerRef = useRef(null);
  const t0Ref = useRef(0);
  const readingStartRef = useRef(0);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const startPrepare = () => {
    clearTimer();
    t0Ref.current = Date.now();
    setPrepareLeft(PREPARE_SECONDS);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0Ref.current) / 1000;
      const left = Math.max(0, Math.ceil(PREPARE_SECONDS - elapsed));
      setPrepareLeft(left);
      if (left <= 0) {
        clearTimer();
        setPhase("reading");
      }
    }, 120);
  };

  const startReadingTimer = () => {
    if (readSeconds == null) return;
    clearTimer();
    t0Ref.current = Date.now();
    readingStartRef.current = Date.now();
    setProgress(0);

    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - t0Ref.current) / 1000;
      const p = Math.min(1, elapsed / readSeconds);
      setProgress(Math.round(p * 100));
      if (elapsed >= readSeconds) {
        clearTimer();
        setPhase("questions");
      }
    }, 60);
  };

  useEffect(() => {
    if (phase !== "prepare") return;
    startPrepare();
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, which]);

  useEffect(() => {
    if (phase !== "reading") return;
    readingStartRef.current = Date.now();
    startReadingTimer();
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const [answers, setAnswers] = useState({
    A: { decision: "", confidence: "", startsImportant: "", gist: [], coverage: "", fullReadingTimeSec: null },
    B: { decision: "", confidence: "", startsImportant: "", gist: [], coverage: "", fullReadingTimeSec: null },
  });

  const cur = answers[which];

  const setCur = (patch) => {
    setAnswers((prev) => ({ ...prev, [which]: { ...prev[which], ...patch } }));
  };

  const gistOptions = useMemo(() => {
    const opts = cueSet.map((id) => ({ id, label: cueLabel(id) }));
    return [...opts, { id: "other", label: "Autre / je ne sais pas" }];
  }, [cueSet]);

  const toggleGist = (id) => {
    setAnswers((prev) => {
      const curArr = prev[which].gist || [];

      if (id === "other") {
        return { ...prev, [which]: { ...prev[which], gist: ["other"] } };
      }

      let base = curArr.filter((x) => x !== "other");
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];
      const clipped = next.slice(0, 2);
      return { ...prev, [which]: { ...prev[which], gist: clipped } };
    });
  };

  const gistOk = (cur.gist?.length || 0) === 2 || ((cur.gist?.length || 0) === 1 && cur.gist?.[0] === "other");
  const curComplete = Boolean(cur.decision && cur.confidence && cur.startsImportant && gistOk && cur.coverage);

  const recommendationPrefix =
    selectedCount <= 1
      ? "En nous basant sur votre priorité actuelle, nous vous recommandons :"
      : "En nous basant sur vos priorités actuelles, nous vous recommandons :";

  const goNext = () => {
    if (which === orderAB[0]) {
      setWhich(orderAB[1]);
      setPhase("prepare");
      setProgress(0);
      setPrepareLeft(PREPARE_SECONDS);
    } else {
      onFinish({ ...metaToLog, restaurantName: restaurant.name, cueSet, answers });
    }
  };

  const onFullContinue = () => {
    const sec = Math.max(0, Math.round((Date.now() - readingStartRef.current) / 1000));
    setCur({ fullReadingTimeSec: sec });
    setPhase("questions");
  };

  const stepIndex = which === orderAB[0] ? 1 : 2;

  return (
    <div className="screen evaluation-screen">
      <div className="card card-wide">
        <h2>Recommandation</h2>
        <p className="screen-description" style={{ marginBottom: 0 }}>
          {recommendationPrefix} <span style={{ color: "#2563eb", fontWeight: 900 }}>{restaurant?.name || "—"}</span>
        </p>
      </div>

      <div className="card card-wide" style={{ marginTop: 14 }}>
        <h3 style={{ margin: 0 }}>Explication {stepIndex}</h3>

        {phase === "prepare" && (
          <div style={{ marginTop: 12 }}>
            <div className="blink-red">L’explication va s’afficher dans quelques instants…</div>

            {readSeconds != null ? (
              <div style={{ marginTop: 10, fontWeight: 900 }}>
                Vous devrez la lire pendant <strong>{readSeconds}</strong> secondes et répondre à quelques questions.
              </div>
            ) : (
              <div style={{ marginTop: 10, fontWeight: 900 }}>Vous pourrez lire l’explication, puis répondre à quelques questions.</div>
            )}

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.55 }}>Affichage dans ~{prepareLeft}s</div>
          </div>
        )}

        {phase === "reading" && (
          <>
            <div className="text-content" style={{ minHeight: 220, marginTop: 12 }}>
              {expTexts[which].split("\n").map((line, i) => (
                <p key={i}>{line || "\u00A0"}</p>
              ))}
            </div>

            {readSeconds != null ? (
              <div className="progress-bar-wrap" aria-label="progress">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            ) : (
              <div className="nav-buttons" style={{ marginTop: 14, justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={onFullContinue}>
                  Continuer
                </button>
              </div>
            )}
          </>
        )}

        {phase === "questions" && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>Questions — Explication {stepIndex}</div>

            <div style={{ display: "grid", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>1) Avec cette explication, iriez-vous dans ce restaurant ?</div>
                <div className="comparison-options" style={{ justifyContent: "flex-start" }}>
                  {[{ id: "yes", label: "Oui" }, { id: "no", label: "Non" }, { id: "unsure", label: "Incertain" }].map((opt) => (
                    <label key={opt.id} className={`radio-option${cur.decision === opt.id ? " active" : ""}`}>
                      <input
                        type="radio"
                        name={`decision_${which}`}
                        value={opt.id}
                        checked={cur.decision === opt.id}
                        onChange={(e) => setCur({ decision: e.target.value })}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>2) À quel point êtes-vous sûr(e) de votre décision ?</div>
                <div className="likert-scale">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      className={`likert-btn${Number(cur.confidence) === val ? " active" : ""}`}
                      onClick={() => setCur({ confidence: String(val) })}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="likert-labels">
                  <span>Pas sûr du tout</span>
                  <span>Très sûr</span>
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>3) L’explication commençait par ce qui est le plus important pour moi.</div>
                <div className="likert-scale">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      className={`likert-btn${Number(cur.startsImportant) === val ? " active" : ""}`}
                      onClick={() => setCur({ startsImportant: String(val) })}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="likert-labels">
                  <span>Pas du tout d’accord</span>
                  <span>Tout à fait d’accord</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>4) Quels sont les 2 points principaux que vous retenez ? (choisissez 2)</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {gistOptions.map((o) => {
                    const checked = cur.gist?.includes(o.id);
                    const otherSelected = (cur.gist?.length || 0) === 1 && cur.gist?.[0] === "other";
                    const disabled = otherSelected ? o.id !== "other" : false;

                    const alreadyTwo = (cur.gist?.filter((x) => x !== "other")?.length || 0) >= 2;
                    const disableMore = alreadyTwo && !checked && o.id !== "other";

                    return (
                      <label
                        key={o.id}
                        className="radio-option"
                        style={{
                          display: "flex",
                          gap: 10,
                          alignItems: "center",
                          border: "1px solid rgba(0,0,0,0.08)",
                          borderRadius: 12,
                          padding: "10px 12px",
                          cursor: disabled || disableMore ? "not-allowed" : "pointer",
                          opacity: disabled || disableMore ? 0.55 : 1,
                          background: checked ? "rgba(34,197,94,0.12)" : "white",
                          fontWeight: 650,
                        }}
                      >
                        <input type="checkbox" checked={checked} disabled={disabled || disableMore} onChange={() => toggleGist(o.id)} />
                        <span>{o.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>5) J’ai pu lire :</div>
                <select className="pref-select" value={cur.coverage} onChange={(e) => setCur({ coverage: e.target.value })}>
                  <option value="">Choisir...</option>
                  <option value="100">Presque tout (≈ 100%)</option>
                  <option value="70">Une grande partie (≈ 70%)</option>
                  <option value="50">Environ la moitié (≈ 50%)</option>
                  <option value="30">Moins d’un tiers (&lt; 30%)</option>
                </select>
              </div>
            </div>

            <div className="nav-buttons" style={{ marginTop: 14, justifyContent: "space-between" }}>
              <button className="btn btn-secondary" onClick={onBack}>
                Retour
              </button>
              <button className="btn btn-primary" disabled={!curComplete} onClick={goNext}>
                {which === orderAB[1] ? "Terminer" : "Continuer (explication suivante)"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* =========================================================
   THANK YOU
   ========================================================= */

function ThankYouScreen({ data }) {
  return (
    <div className="screen thankyou-screen">
      <div className="card welcome-card">
        <h2>Merci pour votre participation !</h2>
        <p>Vos réponses ont été enregistrées.</p>
        <p style={{ opacity: 0.75 }}>Condition : {data?.timeCondition}</p>
        <p style={{ opacity: 0.75 }}>Identifiant : {data?.participantId}</p>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN APP
   ========================================================= */

export default function App() {
  const [screen, setScreen] = useState(0);
  const [participantId] = useState(generateParticipantId);

  const [timeCondition] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TIME);
    if (saved && TIME_CONDITIONS.includes(saved)) return saved;
    const chosen = pickTimeCondition();
    localStorage.setItem(STORAGE_KEY_TIME, chosen);
    return chosen;
  });

  const readSeconds = useMemo(() => getReadSeconds(timeCondition), [timeCondition]);
  const K = useMemo(() => getK(timeCondition), [timeCondition]);

  const conditionText = useMemo(() => {
    if (readSeconds == null) return "Deux explications, sans limite de temps.";
    return `Deux explications, chacune affichée pendant ${readSeconds} secondes.`;
  }, [readSeconds]);

  const [prefMap, setPrefMap] = useState(() => {
    const obj = {};
    CUES.forEach((c) => (obj[c.id] = { ...c, selected: false, preference: "", importance: "" }));
    return obj;
  });

  const selectedCount = useMemo(() => Object.values(prefMap).filter((c) => c.selected).length, [prefMap]);

  const [config] = useState(() => {
    const alignedIsA = Math.random() < 0.5;
    const orderAB = Math.random() < 0.5 ? ["A", "B"] : ["B", "A"];
    return { alignedIsA, orderAB };
  });

  const chosen = useMemo(() => chooseBestRestaurant(prefMap), [prefMap]);
  const restaurant = RESTAURANTS[chosen.key];

  const cueSet = useMemo(() => makeCueSet(prefMap, K), [prefMap, K]);
  const alignedOrderArr = useMemo(() => orderAligned(prefMap, cueSet), [prefMap, cueSet]);
  const baselineOrderArr = useMemo(() => orderBaseline(cueSet), [cueSet]);

  const expTexts = useMemo(() => {
    const alignedText = buildExplanation(restaurant, alignedOrderArr, cueSet);
    const baselineText = buildExplanation(restaurant, baselineOrderArr, cueSet);
    return { A: config.alignedIsA ? alignedText : baselineText, B: config.alignedIsA ? baselineText : alignedText };
  }, [restaurant, alignedOrderArr, baselineOrderArr, cueSet, config.alignedIsA]);

  const [studyData, setStudyData] = useState(null);

  const goto = (s) => {
    setScreen(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const metaToLog = useMemo(
    () => ({
      participantId,
      timeCondition,
      readSeconds: readSeconds ?? "full",
      K,
      restaurantKey: chosen.key,
      alignedIsA: config.alignedIsA,
      orderAB: config.orderAB,
      baselineOrder: baselineOrderArr,
      alignedOrder: alignedOrderArr,
      selectedCount,
    }),
    [participantId, timeCondition, readSeconds, K, chosen.key, config.alignedIsA, config.orderAB, baselineOrderArr, alignedOrderArr, selectedCount]
  );

  return (
    <div className="app-container">
      {screen === 0 && <WelcomeScreen conditionText={conditionText} onNext={() => goto(1)} />}

      {screen === 1 && <PreferencesScreen prefMap={prefMap} setPrefMap={setPrefMap} onBack={() => goto(0)} onNext={() => goto(2)} />}

      {screen === 2 && (
        <ReadingScreen
          restaurant={restaurant}
          expTexts={expTexts}
          orderAB={config.orderAB}
          readSeconds={readSeconds}
          cueSet={cueSet}
          selectedCount={selectedCount}
          metaToLog={metaToLog}
          onBack={() => goto(1)}
          onFinish={async (payload) => {
            try {
              await submitStudy(payload); // 1) envoie d'abord
              setStudyData(payload); // 2) puis affiche merci
              goto(3);
            } catch (e) {
              console.error(e);
              alert("Erreur: vos réponses n'ont PAS été envoyées. Réessayez ou contactez l'organisateur.");
              const key = `study_backup_${payload.participantId}_${Date.now()}`;
              localStorage.setItem(key, JSON.stringify(payload));
            }
          }}
        />
      )}

      {screen === 3 && studyData && <ThankYouScreen data={studyData} />}
    </div>
  );
}
