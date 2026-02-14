// /Users/deomunduku/xrec-user-study/web/src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/* =========================================================
   I18N
   ========================================================= */

const STORAGE_KEY_LANG = "study_lang_v1";
const LANGS = ["fr", "en"];

const I18N = {
  fr: {
    // welcome
    anonymousStudy: "ÉTUDE ANONYME",
    title: "Étude : évaluation d’explications de recommandations de restaurants",
    scenario: "Scénario",
    scenarioP1: "Imaginez que vous êtes dans une ville ou un pays étranger et que vous souhaitez aller dans un restaurant.",
    scenarioP2:
      "Pour vous aider, notre système vous demande d’indiquer vos préférences, puis il recommande un restaurant et l’explique.",
    role: "Votre rôle",
    roleP1: "Vous allez lire deux explications (séparées), puis répondre à quelques questions après chacune.",
    importantPoint: "Point important :",
    noPersonal: "Il n’y a pas de bonne ou mauvaise réponse. Aucune donnée personnelle (nom/e-mail) n’est demandée.",
    start: "Commencer",
    langLabel: "Langue",
    frLabel: "Français",
    enLabel: "English",
    conditionNoLimit: "Deux explications, sans limite de temps.",
    conditionTimed: (s) => `Deux explications, chacune affichée pendant ${s} secondes.`,

    // preparing reco
    preparingTitle: "Préparation…",
    preparingText: "Nous préparons la recommandation. Merci de patienter.",

    // preferences
    prefsTitle: "Vos préférences",
    prefsDesc: (min) =>
      `Sélectionnez au moins ${min} préférences. Pour chaque préférence sélectionnée, indiquez la préférence et l’importance.`,
    tablePref: "Préférence",
    tableChoice: "Choix",
    tableImportance: "Importance",
    warningContinue: (min) =>
      `Pour continuer : sélectionnez au moins ${min} préférences, puis choisissez une préférence et une importance pour chacune.`,
    back: "Retour",
    continue: "Continuer",

    choose: "Choisir…",
    chooseImportance: "Choisir l’importance…",

    // importance
    imp5: "5 — Très important",
    imp4: "4 — Important",
    imp3: "3 — Peu importe",
    imp2: "2 — Peu important",
    imp1: "1 — Pas important",

    // reading
    recommendationH2: "Recommandation",
    // ✅ FIX 1: ajoute "le restaurant"
    basedOnSingle: "En nous basant sur votre priorité actuelle, nous vous recommandons le restaurant",
    basedOnPlural: "En nous basant sur vos priorités actuelles, nous vous recommandons le restaurant",
    explanation: "Explication",
    expWillShow: "L’explication va s’afficher dans quelques instants…",
    exp2WillShow: "La deuxième explication va s’afficher dans quelques instants…",
    youMustRead: (s) => `Vous devrez la lire pendant ${s} secondes et répondre à quelques questions.`,
    youCanRead: "Vous pourrez lire l’explication, puis répondre à quelques questions.",
    showingIn: (sec) => `Affichage dans ~${sec}s`,
    questionsTitle: (idx) => `Questions — Explication ${idx}`,
    answerEvenIfPartial: "Même si vous n’avez pas tout lu, répondez d’après ce que vous avez compris.",

    q1: "1) Après avoir lu cette explication, iriez-vous dans ce restaurant ?",
    q2: "2) À quel point êtes-vous sûr(e) de votre décision ?",
    q3: "3) L’explication mettait en avant, dès le début, ce qui est le plus important pour moi.",
    q4: "4) L’explication est facile à comprendre.",
    q5: "5) Quels sont les 2 points principaux que vous retenez de cette explication ? (choisissez 2)",
    q5help: "Choisissez 2 éléments, ou bien sélectionnez “Je ne sais pas”.",
    q6: "6) Quelle partie de l’explication avez-vous lue ?",
    q7: "7) Cette explication m’aide à prendre ma décision.",

    yes: "Oui",
    no: "Non",
    unsure: "Incertain",

    lowSure: "Peu sûr(e)",
    midSure: "Moyen",
    highSure: "Très sûr(e)",

    clarityYes: "Oui",
    clarityMid: "Pas vraiment",
    clarityNo: "Non",

    coverageChoose: "Choisir…",
    cov100: "Presque tout (≈ 100%)",
    cov70: "Une grande partie (≈ 70%)",
    cov50: "Environ la moitié (≈ 50%)",
    cov30: "Moins d’un tiers (< 30%)",

    btnNextExplanation: "Continuer (explication suivante)",
    btnFinish: "Terminer",
    btnContinue: "Continuer",

    dontKnow: "Je ne sais pas",

    // submit overlay
    sending: "Envoi en cours… merci de patienter.",
    dontClose: "Ne fermez pas la page.",

    // thank you
    thanksTitle: "Merci pour votre participation !",
    saved: "Vos réponses ont été enregistrées.",
    conditionLabel: "Condition :",
    idLabel: "Identifiant :",
    participantNumberLabel: "Vous étiez le participant numéro",
  },

  en: {
    // welcome
    anonymousStudy: "ANONYMOUS STUDY",
    title: "Study: evaluating explanations of restaurant recommendations",
    scenario: "Scenario",
    scenarioP1: "Imagine you are in a foreign city or country and you want to go to a restaurant.",
    scenarioP2: "To help you, our system asks you to indicate your preferences, then recommends a restaurant and explains why.",
    role: "Your role",
    roleP1: "You will read two explanations (separately), then answer a few questions after each one.",
    importantPoint: "Important:",
    noPersonal: "There is no right or wrong answer. No personal data (name/email) is collected.",
    start: "Start",
    langLabel: "Language",
    frLabel: "Français",
    enLabel: "English",
    conditionNoLimit: "Two explanations, no time limit.",
    conditionTimed: (s) => `Two explanations, each displayed for ${s} seconds.`,

    // preparing reco
    preparingTitle: "Preparing…",
    preparingText: "We are preparing the recommendation. Please wait.",

    // preferences
    prefsTitle: "Your preferences",
    prefsDesc: (min) => `Select at least ${min} preferences. For each selected preference, choose the option and importance.`,
    tablePref: "Preference",
    tableChoice: "Choice",
    tableImportance: "Importance",
    warningContinue: (min) =>
      `To continue: select at least ${min} preferences, then choose a preference option and importance for each.`,
    back: "Back",
    continue: "Continue",

    choose: "Choose…",
    chooseImportance: "Choose importance…",

    // importance
    imp5: "5 — Very important",
    imp4: "4 — Important",
    imp3: "3 — Doesn’t matter",
    imp2: "2 — Not important",
    imp1: "1 — Not important at all",

    // reading
    recommendationH2: "Recommendation",
    // ✅ FIX 1: ajoute "the restaurant"
    basedOnSingle: "Based on your current priority, we recommend the restaurant",
    basedOnPlural: "Based on your current priorities, we recommend the restaurant",
    explanation: "Explanation",
    expWillShow: "The explanation will appear in a few seconds…",
    exp2WillShow: "The second explanation will appear in a few seconds…",
    youMustRead: (s) => `You must read it for ${s} seconds, then answer a few questions.`,
    youCanRead: "You can read the explanation, then answer a few questions.",
    showingIn: (sec) => `Showing in ~${sec}s`,
    questionsTitle: (idx) => `Questions — Explanation ${idx}`,
    answerEvenIfPartial: "Even if you didn’t read everything, answer based on what you understood.",

    q1: "1) After reading this explanation, would you go to this restaurant?",
    q2: "2) How confident are you in your decision?",
    q3: "3) The explanation highlighted, right at the start, what matters most to me.",
    q4: "4) The explanation is easy to understand.",
    q5: "5) What are the 2 main points you remember from this explanation? (choose 2)",
    q5help: 'Choose 2 items, or select “I don’t know”.',
    q6: "6) How much of the explanation did you read?",
    q7: "7) This explanation helps me make my decision.",

    yes: "Yes",
    no: "No",
    unsure: "Not sure",

    lowSure: "Low",
    midSure: "Medium",
    highSure: "High",

    clarityYes: "Yes",
    clarityMid: "Not really",
    clarityNo: "No",

    coverageChoose: "Choose…",
    cov100: "Almost all (≈ 100%)",
    cov70: "A large part (≈ 70%)",
    cov50: "About half (≈ 50%)",
    cov30: "Less than one third (< 30%)",

    btnNextExplanation: "Continue (next explanation)",
    btnFinish: "Finish",
    btnContinue: "Continue",

    dontKnow: "I don’t know",

    // submit overlay
    sending: "Sending… please wait.",
    dontClose: "Do not close the page.",

    // thank you
    thanksTitle: "Thank you for participating!",
    saved: "Your answers have been saved.",
    conditionLabel: "Condition:",
    idLabel: "ID:",
    participantNumberLabel: "You were participant number",
  },
};

/* =========================================================
   CONSTANTS / CUES
   ========================================================= */

const CUE_LABELS = {
  price: { fr: "Prix", en: "Price" },
  food_quality: { fr: "Qualité alimentaire", en: "Food quality" },
  service: { fr: "Service", en: "Service" },
  ambiance: { fr: "Ambiance", en: "Ambiance" },
  wait_time: { fr: "Temps d'attente", en: "Waiting time" },
  cleanliness: { fr: "Propreté", en: "Cleanliness" },
  location: { fr: "Localisation", en: "Location" },
  portion: { fr: "Portion", en: "Portion size" },
};

const CUE_IDS = Object.keys(CUE_LABELS);

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
   API : reco api (POST /recommend_from_prefs)
   ========================================================= */

async function fetchRecoFromPrefs(participantId, selectedCues) {
  const base = import.meta.env.VITE_RECO_API_URL;
  if (!base) throw new Error("VITE_RECO_API_URL manquant");

  const r = await fetch(`${base}/recommend_from_prefs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ participantId, selectedCues }),
  });

  if (!r.ok) {
    const txt = await r.text().catch(() => "");
    throw new Error(`reco_from_prefs error ${r.status}: ${txt}`);
  }
  return await r.json(); // { user_id, k, items:[{item_id,rank,score}...], mode, selectedCues }
}

/* =========================================================
   DATA : 30 restaurants + evidence (bilingue)
   ========================================================= */

const tx = (fr, en) => ({ fr, en });

function makeEvidence(overrides = {}) {
  // base bilingual
  const base = {
    price: { score: 3.8, text: tx("Prix corrects, bon rapport qualité/prix.", "Reasonable prices, good value for money.") },
    food_quality: { score: 4.1, text: tx("Qualité globale bonne, ingrédients frais.", "Good overall food quality, fresh ingredients.") },
    service: { score: 4.0, text: tx("Service correct, personnel aimable.", "Good service, friendly staff.") },
    ambiance: { score: 4.0, text: tx("Ambiance agréable, décor soigné.", "Pleasant ambiance, nicely decorated.") },
    wait_time: { score: 3.7, text: tx("Attente raisonnable aux heures de pointe.", "Reasonable wait time during peak hours.") },
    cleanliness: { score: 4.2, text: tx("Salle propre, entretien régulier.", "Clean place, regular maintenance.") },
    location: { score: 4.1, text: tx("Emplacement pratique, accès simple.", "Convenient location, easy to reach.") },
    portion: { score: 3.9, text: tx("Portions correctes et équilibrées.", "Portions are fair and balanced.") },
  };

  // merge overrides (expects same shape)
  return { ...base, ...overrides };
}

const RESTAURANTS = {
  r01: {
    name: "Bistro Central",
    evidence: makeEvidence({
      ambiance: { score: 4.4, text: tx("Ambiance cosy, musique discrète, tables confortables.", "Cozy vibe, soft music, comfortable seating.") },
      location: { score: 4.5, text: tx("Quartier central, accès simple en transport.", "Central area, easy access by public transport.") },
    }),
  },
  r02: {
    name: "Budget Express",
    evidence: makeEvidence({
      price: { score: 4.8, text: tx("Très bon marché, formules à petit prix.", "Very affordable, great budget-friendly deals.") },
      wait_time: { score: 4.7, text: tx("Attente courte, rotation rapide.", "Short waits, fast turnover.") },
      ambiance: { score: 3.2, text: tx("Ambiance simple, décor minimal.", "Simple atmosphere, minimal decor.") },
    }),
  },
  r03: {
    name: "Fine Dining Atelier",
    evidence: makeEvidence({
      price: { score: 2.3, text: tx("Prix élevés, expérience premium.", "High prices, premium experience.") },
      food_quality: {
        score: 4.9,
        text: tx("Cuisine raffinée, dressage soigné, produits haut de gamme.", "Refined cuisine, beautiful plating, high-end ingredients."),
      },
      service: { score: 4.8, text: tx("Service très attentionné, rythme maîtrisé.", "Very attentive service, well-paced experience.") },
      wait_time: { score: 3.1, text: tx("Service plus long (menu dégustation).", "Longer service (tasting menu).") },
      cleanliness: { score: 4.9, text: tx("Propreté impeccable, standards élevés.", "Impeccable cleanliness, high standards.") },
    }),
  },
  r04: {
    name: "Family Grill House",
    evidence: makeEvidence({
      portion: { score: 4.8, text: tx("Portions très généreuses.", "Very generous portions.") },
      food_quality: { score: 4.2, text: tx("Grillades savoureuses, cuisson maîtrisée.", "Tasty grilled dishes, well-cooked.") },
    }),
  },
  r05: {
    name: "Zen Sushi Bar",
    evidence: makeEvidence({
      food_quality: { score: 4.6, text: tx("Poisson frais, riz bien assaisonné.", "Fresh fish, well-seasoned rice.") },
      ambiance: { score: 4.6, text: tx("Ambiance zen, décor sobre.", "Zen ambiance, minimalist decor.") },
      cleanliness: { score: 4.7, text: tx("Très propre, comptoir bien tenu.", "Very clean, well-kept counter.") },
    }),
  },
  r06: {
    name: "Cozy Café",
    evidence: makeEvidence({
      price: { score: 4.2, text: tx("Prix doux, bons brunchs.", "Affordable prices, great brunch options.") },
      ambiance: { score: 4.8, text: tx("Très cosy, idéal pour discuter.", "Very cozy, perfect to chat.") },
    }),
  },
  r07: {
    name: "Quick Noodles",
    evidence: makeEvidence({
      price: { score: 4.6, text: tx("Très abordable, menus rapides.", "Very affordable, quick meals.") },
      wait_time: { score: 4.8, text: tx("Très peu d’attente.", "Very short wait time.") },
      ambiance: { score: 3.3, text: tx("Ambiance dynamique, un peu bruyante.", "Lively vibe, a bit noisy.") },
      portion: { score: 4.4, text: tx("Grand bol, portions généreuses.", "Big bowls, generous servings.") },
    }),
  },
  r08: {
    name: "Scenic Terrace",
    evidence: makeEvidence({
      ambiance: { score: 4.9, text: tx("Terrasse superbe, cadre très agréable.", "Beautiful terrace, great setting.") },
      price: { score: 3.0, text: tx("Prix un peu élevés, surtout boissons.", "Slightly expensive, especially drinks.") },
      wait_time: { score: 3.1, text: tx("Attente plus longue en soirée.", "Longer waits in the evening.") },
    }),
  },
  r09: {
    name: "Clean & Fresh Bowls",
    evidence: makeEvidence({
      cleanliness: { score: 4.9, text: tx("Très propre, hygiène visible.", "Very clean, hygiene is clearly visible.") },
      food_quality: { score: 4.2, text: tx("Produits frais, bowls équilibrés.", "Fresh ingredients, balanced bowls.") },
    }),
  },
  r10: {
    name: "Warm Service House",
    evidence: makeEvidence({
      service: { score: 4.9, text: tx("Service très chaleureux, attention aux détails.", "Very warm service, great attention to detail.") },
      ambiance: { score: 4.2, text: tx("Ambiance conviviale, calme.", "Friendly atmosphere, calm.") },
    }),
  },
  r11: {
    name: "Fast & Tasty",
    evidence: makeEvidence({
      service: { score: 4.7, text: tx("Service très rapide.", "Very fast service.") },
      wait_time: { score: 4.9, text: tx("Attente très courte.", "Very short wait.") },
    }),
  },
  r12: {
    name: "Romantic Corner",
    evidence: makeEvidence({
      ambiance: { score: 4.8, text: tx("Ambiance intimiste, éclairage doux.", "Intimate ambiance, soft lighting.") },
      food_quality: { score: 4.5, text: tx("Plats travaillés, très bonne qualité.", "Well-crafted dishes, very good quality.") },
    }),
  },
  r13: {
    name: "Neighborhood Gem",
    evidence: makeEvidence({
      price: { score: 4.1, text: tx("Prix justes, bonne valeur.", "Fair prices, good value.") },
      ambiance: { score: 4.3, text: tx("Ambiance de quartier, chaleureuse.", "Warm neighborhood vibe.") },
    }),
  },
  r14: {
    name: "Scenic View",
    evidence: makeEvidence({
      ambiance: { score: 4.9, text: tx("Très belle vue, ambiance agréable.", "Great view, pleasant ambiance.") },
      location: { score: 4.7, text: tx("Emplacement top, facile d’accès.", "Top location, easy to reach.") },
      price: { score: 3.0, text: tx("Prix un peu élevés (vue).", "Slightly expensive (you pay for the view).") },
    }),
  },
  r15: {
    name: "Super Clean Spot",
    evidence: makeEvidence({
      cleanliness: { score: 5.0, text: tx("Impeccable, hygiène irréprochable.", "Impeccable, spotless hygiene.") },
    }),
  },
  r16: {
    name: "Generous Plates",
    evidence: makeEvidence({
      portion: { score: 5.0, text: tx("Portions énormes, très généreux.", "Huge portions, very generous.") },
      price: { score: 4.0, text: tx("Bon rapport quantité/prix.", "Great quantity for the price.") },
    }),
  },
  r17: {
    name: "Quiet Place",
    evidence: makeEvidence({
      ambiance: { score: 4.8, text: tx("Très calme, idéal pour discuter.", "Very quiet, perfect to talk.") },
      cleanliness: { score: 4.5, text: tx("Très propre.", "Very clean.") },
    }),
  },
  r18: {
    name: "Lively Night",
    evidence: makeEvidence({
      ambiance: { score: 5.0, text: tx("Ambiance très animée, musique.", "Very lively vibe, music.") },
      wait_time: { score: 3.1, text: tx("Attente possible en soirée.", "Possible wait in the evening.") },
    }),
  },
  r19: {
    name: "Super Location",
    evidence: makeEvidence({
      location: { score: 5.0, text: tx("Emplacement excellent, très pratique.", "Excellent location, very convenient.") },
    }),
  },
  r20: {
    name: "Short Wait",
    evidence: makeEvidence({
      wait_time: { score: 5.0, text: tx("Attente quasi nulle, très rapide.", "Almost no waiting, very fast.") },
      service: { score: 4.4, text: tx("Service rapide.", "Fast service.") },
    }),
  },
  r21: {
    name: "High Quality",
    evidence: makeEvidence({
      food_quality: { score: 5.0, text: tx("Excellente qualité, saveurs très maîtrisées.", "Excellent quality, flavors are well mastered.") },
      price: { score: 3.1, text: tx("Prix moyens+.", "Mid to slightly high prices.") },
    }),
  },
  r22: {
    name: "Best Value",
    evidence: makeEvidence({
      price: { score: 4.9, text: tx("Excellent prix, très bon rapport.", "Excellent pricing, great value.") },
      portion: { score: 4.5, text: tx("Portions généreuses.", "Generous portions.") },
    }),
  },
  r23: {
    name: "Cozy & Calm",
    evidence: makeEvidence({
      ambiance: { score: 4.9, text: tx("Très cosy et calme.", "Very cozy and calm.") },
    }),
  },
  r24: {
    name: "Premium Service",
    evidence: makeEvidence({
      service: { score: 5.0, text: tx("Service exceptionnel, très attentionné.", "Exceptional service, very attentive.") },
    }),
  },
  r25: {
    name: "Big Portions",
    evidence: makeEvidence({
      portion: { score: 5.0, text: tx("Portions énormes, très généreuses.", "Huge portions, very generous.") },
    }),
  },
  r26: {
    name: "Great Location",
    evidence: makeEvidence({
      location: { score: 5.0, text: tx("Emplacement parfait, très facile d’accès.", "Perfect location, very easy to reach.") },
    }),
  },
  r27: {
    name: "Super Clean & Quiet",
    evidence: makeEvidence({
      cleanliness: { score: 4.9, text: tx("Très propre, hygiène excellente.", "Very clean, excellent hygiene.") },
      ambiance: { score: 4.7, text: tx("Calme, agréable.", "Calm and pleasant.") },
    }),
  },
  r28: {
    name: "Fast Service",
    evidence: makeEvidence({
      service: { score: 4.9, text: tx("Service très rapide et fluide.", "Very fast and smooth service.") },
      wait_time: { score: 4.8, text: tx("Attente très courte.", "Very short wait.") },
    }),
  },
  r29: {
    name: "Balanced Choice",
    evidence: makeEvidence({
      food_quality: { score: 4.2, text: tx("Bonne qualité, choix équilibré.", "Good quality, balanced choice.") },
    }),
  },
  r30: {
    name: "Late Night Spot",
    evidence: makeEvidence({
      ambiance: { score: 4.6, text: tx("Ambiance animée le soir.", "Lively in the evening.") },
      location: { score: 4.5, text: tx("Zone vivante, pratique.", "Vibrant area, convenient.") },
    }),
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

function cueLabel(cueId, lang) {
  return (CUE_LABELS[cueId] && CUE_LABELS[cueId][lang]) || cueId;
}

/**
 * Trie les cues sélectionnés par importance (desc), puis cueId (stable, indépendant de la langue)
 */
function sortSelectedCuesByImportance(prefMap) {
  return Object.values(prefMap)
    .filter((c) => c.selected)
    .sort((a, b) => {
      const sa = importanceScore(a.importance);
      const sb = importanceScore(b.importance);
      if (sb !== sa) return sb - sa;
      return String(a.id).localeCompare(String(b.id));
    });
}

/**
 * cueSet = uniquement cues sélectionnés, cap à K (Top-K)
 */
function makeCueSetSelectedOnly(prefMap, K) {
  const chosen = sortSelectedCuesByImportance(prefMap).map((c) => c.id);
  return chosen.slice(0, K);
}

/**
 * Aligned order = cues sélectionnés triés par importance (déjà Top-K)
 */
function orderAligned(prefMap, cueSet) {
  const chosen = sortSelectedCuesByImportance(prefMap).map((c) => c.id);
  const inChosen = chosen.filter((x) => cueSet.includes(x));
  return inChosen.slice(0, cueSet.length);
}

/**
 * Baseline = inverse exact de l'aligned
 */
function orderBaselineFromAligned(alignedOrderArr) {
  return [...alignedOrderArr].reverse();
}

/* =========================================================
   ✅ FIX 3: 16s => au moins 2× la longueur (mots) de la version 8s
   (8s inchangé)
   ========================================================= */

function wordTokens(s) {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function standardPaddingText(lang) {
  if (lang === "en") {
    return (
      "Additional note: this explanation summarizes common patterns from available reviews. " +
      "It provides a general overview, but details may vary depending on time, day, and crowd. " +
      "If something is important to you, you may want to double-check it on site or consult more reviews."
    );
  }
  return (
    "Note complémentaire : cette explication résume des tendances générales issues des avis disponibles. " +
    "Elle donne un aperçu global, mais certains détails peuvent varier selon l’heure, le jour et l’affluence. " +
    "Si un point est important pour vous, vous pouvez le vérifier sur place ou consulter d’autres avis."
  );
}

/**
 * Si texte < minWords, on ajoute du texte standard neutre pour atteindre exactement minWords.
 * Si texte >= minWords, on ne touche pas (important pour éviter de modifier le 8s).
 */
function ensureMinWords(text, lang, minWords) {
  const base = wordTokens(text);
  if (base.length >= minWords) return text;

  const pad = wordTokens(standardPaddingText(lang));
  let fill = [];

  while (base.length + fill.length < minWords) {
    fill = fill.concat(pad);
  }

  const need = minWords - base.length;
  const slice = fill.slice(0, need);

  const out = base.concat(slice).join(" ") + (fill.length > need ? "…" : "");
  return out.replace(/\s+/g, " ").trim();
}

/* =========================================================
   Deterministic helpers (gist distractors)
   ========================================================= */

function hashStringToInt(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickDeterministicN(arr, n, seedStr) {
  const a = [...arr];
  const rng = mulberry32(hashStringToInt(seedStr));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, Math.min(n, a.length));
}

function shuffleDeterministic(arr, seedStr) {
  const a = [...arr];
  const rng = mulberry32(hashStringToInt(seedStr));
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* =========================================================
   NATURAL EXPLANATION BUILDER (bilingue)
   ========================================================= */

function sharedRemainder(lang) {
  if (lang === "en") {
    return (
      "We recommend this restaurant because it matches your priorities overall. " +
      "Available information gives a useful overview, although some details may vary depending on time and crowd."
    );
  }
  return (
    "Nous vous recommandons ce restaurant parce qu’il correspond globalement à vos priorités. " +
    "Les informations disponibles donnent un aperçu utile, même si certains détails peuvent varier selon l’heure et l’affluence."
  );
}

function clipWords(text, maxWords) {
  const w = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (w.length <= maxWords) return w.join(" ");
  return w.slice(0, maxWords).join(" ") + "…";
}

function stripTrailingDot(s) {
  return String(s || "").trim().replace(/\.*\s*$/, "");
}

function cleanEvidence(raw) {
  let t = stripTrailingDot(raw);
  t = t.replace(/^[—:\-]\s*/, "");
  t = t.replace(/\s+/g, " ").trim();
  return t || "des informations limitées";
}

function getEvidenceText(restaurant, cueId, lang) {
  const ev = restaurant?.evidence?.[cueId];
  const txt = ev?.text;
  if (!txt) return "";
  if (typeof txt === "string") return txt;
  return txt[lang] || txt.fr || txt.en || "";
}

function cueSentence(cueId, prefId, evidenceText, idx, lang) {
  const ev = cleanEvidence(clipWords(evidenceText || "", 14));

  const CONNECT_FR = ["D’abord,", "Ensuite,", "De plus,", "Par ailleurs,", "Enfin,"];
  const CONNECT_EN = ["First,", "Then,", "Also,", "Moreover,", "Finally,"];
  const c = (lang === "en" ? CONNECT_EN : CONNECT_FR)[idx % 5];

  if (lang === "en") {
    if (cueId === "food_quality") {
      if (prefId === "excellent") return `${c} food quality stands out as a strong point (${ev}).`;
      if (prefId === "very_good") return `${c} food quality looks very solid (${ev}).`;
      if (prefId === "good") return `${c} food quality seems satisfactory (${ev}).`;
      return `${c} food quality is described as ${ev}.`;
    }

    if (cueId === "service") {
      if (prefId === "fast") return `${c} service seems fast, making the experience easier (${ev}).`;
      if (prefId === "warm") return `${c} service appears warm and pleasant (${ev}).`;
      if (prefId === "attentive") return `${c} service seems attentive (${ev}).`;
      return `${c} service is described as ${ev}.`;
    }

    if (cueId === "price") {
      if (prefId === "tight") return `${c} pricing seems suitable for a tight budget (${ev}).`;
      if (prefId === "medium") return `${c} pricing seems consistent for a medium budget (${ev}).`;
      if (prefId === "flexible") return `${c} even with a flexible budget, pricing remains reasonable (${ev}).`;
      return `${c} pricing is described as ${ev}.`;
    }

    if (cueId === "ambiance") {
      if (prefId === "calm") return `${c} the ambiance feels calm and pleasant (${ev}).`;
      if (prefId === "lively") return `${c} the ambiance seems lively (${ev}).`;
      if (prefId === "cozy") return `${c} the ambiance feels cozy (${ev}).`;
      return `${c} the ambiance is described as ${ev}.`;
    }

    if (cueId === "wait_time") {
      if (prefId === "short") return `${c} wait time seems short (${ev}).`;
      if (prefId === "ok") return `${c} wait time seems reasonable (${ev}).`;
      return `${c} wait time is described as ${ev}.`;
    }

    if (cueId === "cleanliness") {
      if (prefId === "spotless") return `${c} the place seems spotless (${ev}).`;
      if (prefId === "very_clean") return `${c} the place seems very clean (${ev}).`;
      if (prefId === "ok") return `${c} the place seems clean (${ev}).`;
      return `${c} cleanliness is described as ${ev}.`;
    }

    if (cueId === "location") {
      if (prefId === "close") return `${c} the location seems convenient (${ev}).`;
      if (prefId === "nice_area") return `${c} the area seems pleasant (${ev}).`;
      return `${c} the location is described as ${ev}.`;
    }

    if (cueId === "portion") {
      if (prefId === "generous") return `${c} portions seem generous (${ev}).`;
      if (prefId === "normal") return `${c} portions seem adequate (${ev}).`;
      if (prefId === "light") return `${c} portions seem rather light (${ev}).`;
      return `${c} portions are described as ${ev}.`;
    }

    return `${c} available information indicates ${ev}.`;
  }

  // FR
  if (cueId === "food_quality") {
    if (prefId === "excellent") return `${c} la qualité des plats ressort comme un point fort (${ev}).`;
    if (prefId === "very_good") return `${c} la qualité des plats paraît très solide (${ev}).`;
    if (prefId === "good") return `${c} la qualité des plats semble satisfaisante (${ev}).`;
    return `${c} la qualité des plats est décrite comme ${ev}.`;
  }

  if (cueId === "service") {
    if (prefId === "fast") return `${c} le service semble rapide, ce qui rend l’expérience plus simple (${ev}).`;
    if (prefId === "warm") return `${c} le service paraît chaleureux et agréable (${ev}).`;
    if (prefId === "attentive") return `${c} le service paraît attentionné (${ev}).`;
    return `${c} le service est décrit comme ${ev}.`;
  }

  if (cueId === "price") {
    if (prefId === "tight") return `${c} le prix paraît adapté à un budget serré (${ev}).`;
    if (prefId === "medium") return `${c} le prix semble cohérent pour un budget moyen (${ev}).`;
    if (prefId === "flexible") return `${c} même avec un budget flexible, le prix reste raisonnable (${ev}).`;
    return `${c} le prix est décrit comme ${ev}.`;
  }

  if (cueId === "ambiance") {
    if (prefId === "calm") return `${c} l’ambiance paraît plutôt calme et agréable (${ev}).`;
    if (prefId === "lively") return `${c} l’ambiance semble animée (${ev}).`;
    if (prefId === "cozy") return `${c} l’ambiance paraît conviviale (${ev}).`;
    return `${c} l’ambiance est décrite comme ${ev}.`;
  }

  if (cueId === "wait_time") {
    if (prefId === "short") return `${c} l’attente semble courte (${ev}).`;
    if (prefId === "ok") return `${c} l’attente semble raisonnable (${ev}).`;
    return `${c} l’attente est décrite comme ${ev}.`;
  }

  if (cueId === "cleanliness") {
    if (prefId === "spotless") return `${c} le lieu paraît impeccable (${ev}).`;
    if (prefId === "very_clean") return `${c} le lieu paraît très propre (${ev}).`;
    if (prefId === "ok") return `${c} le lieu semble propre (${ev}).`;
    return `${c} la propreté est décrite comme ${ev}.`;
  }

  if (cueId === "location") {
    if (prefId === "close") return `${c} l’emplacement paraît pratique (${ev}).`;
    if (prefId === "nice_area") return `${c} le quartier semble agréable (${ev}).`;
    return `${c} la localisation est décrite comme ${ev}.`;
  }

  if (cueId === "portion") {
    if (prefId === "generous") return `${c} les portions semblent généreuses (${ev}).`;
    if (prefId === "normal") return `${c} les portions semblent correctes (${ev}).`;
    if (prefId === "light") return `${c} les portions semblent plutôt légères (${ev}).`;
    return `${c} les portions sont décrites comme ${ev}.`;
  }

  return `${c} les informations disponibles indiquent ${ev}.`;
}

function buildExplanationOneParagraph({ restaurant, cueOrder, cueSet, prefMap, mode, lang }) {
  const cuesInOrder = cueOrder.filter((id) => cueSet.includes(id));

  const cueSentences = cuesInOrder.map((cueId, idx) => {
    const prefId = prefMap?.[cueId]?.preference || "any";
    const evText = getEvidenceText(restaurant, cueId, lang);
    return cueSentence(cueId, prefId, evText, idx, lang);
  });

  const remainder = sharedRemainder(lang);
  const parts = mode === "remainder_first" ? [remainder, ...cueSentences] : [...cueSentences, remainder];

  return parts.join(" ").replace(/\s+/g, " ").trim();
}

/* =========================================================
   OPTIONS (preferences) bilingue
   ========================================================= */

function getImportanceOptions(t) {
  return [
    { id: "", label: t.chooseImportance },
    { id: "5", label: t.imp5 },
    { id: "4", label: t.imp4 },
    { id: "3", label: t.imp3 },
    { id: "2", label: t.imp2 },
    { id: "1", label: t.imp1 },
  ];
}

function getPreferenceOptions(cueId, lang, t) {
  const fr = {
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

  const en = {
    price: [
      { id: "", label: t.choose },
      { id: "tight", label: "Tight budget (low price)" },
      { id: "medium", label: "Medium budget" },
      { id: "flexible", label: "Flexible budget (high price OK)" },
      { id: "any", label: "Doesn’t matter" },
    ],
    food_quality: [
      { id: "", label: t.choose },
      { id: "good", label: "Good quality" },
      { id: "very_good", label: "Very good quality" },
      { id: "excellent", label: "Excellent quality" },
      { id: "any", label: "Doesn’t matter" },
    ],
    service: [
      { id: "", label: t.choose },
      { id: "fast", label: "Fast service" },
      { id: "warm", label: "Warm service" },
      { id: "attentive", label: "Very attentive service" },
      { id: "any", label: "Doesn’t matter" },
    ],
    ambiance: [
      { id: "", label: t.choose },
      { id: "calm", label: "Calm ambiance" },
      { id: "lively", label: "Lively ambiance" },
      { id: "cozy", label: "Cozy ambiance" },
      { id: "any", label: "Doesn’t matter" },
    ],
    wait_time: [
      { id: "", label: t.choose },
      { id: "short", label: "Short wait" },
      { id: "ok", label: "Acceptable wait" },
      { id: "any", label: "Doesn’t matter" },
    ],
    cleanliness: [
      { id: "", label: t.choose },
      { id: "ok", label: "Clean enough" },
      { id: "very_clean", label: "Very clean" },
      { id: "spotless", label: "Spotless" },
      { id: "any", label: "Doesn’t matter" },
    ],
    location: [
      { id: "", label: t.choose },
      { id: "close", label: "Close / convenient" },
      { id: "nice_area", label: "Nice area" },
      { id: "any", label: "Doesn’t matter" },
    ],
    portion: [
      { id: "", label: t.choose },
      { id: "light", label: "Light portions" },
      { id: "normal", label: "Normal portions" },
      { id: "generous", label: "Generous portions" },
      { id: "any", label: "Doesn’t matter" },
    ],
  };

  const src = lang === "en" ? en : fr;
  return src[cueId] || [{ id: "", label: t.choose }, { id: "any", label: lang === "en" ? "Doesn’t matter" : "Peu importe" }];
}

/* =========================================================
   PAGE 1 : WELCOME
   ========================================================= */

function WelcomeScreen({ onNext, conditionText, lang, setLang }) {
  const t = I18N[lang];

  return (
    <div className="screen welcome-screen">
      <div className="card welcome-card">
        <div className="welcome-badge">{t.anonymousStudy}</div>

        <h1 className="welcome-title">{t.title}</h1>

        <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 10 }}>
          <div style={{ fontWeight: 800 }}>{t.langLabel}:</div>
          <select
            className="pref-select"
            value={lang}
            onChange={(e) => {
              const v = e.target.value;
              setLang(v);
              localStorage.setItem(STORAGE_KEY_LANG, v);
            }}
            style={{ maxWidth: 180 }}
          >
            <option value="fr">{t.frLabel}</option>
            <option value="en">{t.enLabel}</option>
          </select>
        </div>

        <div className="scenario-box">
          <h3>{t.scenario}</h3>
          <p>{t.scenarioP1}</p>
          <p>{t.scenarioP2}</p>

          <h3 style={{ marginTop: 14 }}>{t.role}</h3>
          <p>{t.roleP1}</p>

          <div className="warning-box" style={{ marginTop: 12, borderColor: "#ef4444", color: "#b91c1c", fontWeight: 900 }}>
            {t.importantPoint} {conditionText}
          </div>

          <p className="scenario-note" style={{ marginTop: 10 }}>
            {t.noPersonal}
          </p>
        </div>

        <button className="btn btn-primary" onClick={onNext}>
          {t.start}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE 2 : PREFERENCES
   ========================================================= */

function PreferencesScreen({ prefMap, setPrefMap, onNext, onBack, lang }) {
  const t = I18N[lang];
  const importanceOptions = useMemo(() => getImportanceOptions(t), [t]);

  const selectedPrefs = useMemo(() => Object.values(prefMap).filter((c) => c.selected), [prefMap]);

  const allSelectedAreComplete = useMemo(() => {
    if (selectedPrefs.length === 0) return false;
    return selectedPrefs.every((c) => c.preference && c.importance);
  }, [selectedPrefs]);

  const canContinue = useMemo(
    () => selectedPrefs.length >= MIN_PREFS_ALL && allSelectedAreComplete,
    [selectedPrefs.length, allSelectedAreComplete]
  );

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
        <h2>{t.prefsTitle}</h2>

        <p className="screen-description">{t.prefsDesc(MIN_PREFS_ALL)}</p>

        <div className="pref-table">
          <div className="pref-head">
            <div>{t.tablePref}</div>
            <div>{t.tableChoice}</div>
            <div style={{ textAlign: "right" }}>{t.tableImportance}</div>
          </div>

          {CUE_IDS.map((cueId) => {
            const cue = prefMap[cueId];
            const rowDisabled = !cue.selected;
            const options = getPreferenceOptions(cueId, lang, t);

            return (
              <div key={cueId} className={`pref-row${rowDisabled ? " disabled" : ""}`}>
                <div className="pref-crit">
                  <input type="checkbox" checked={cue.selected} onChange={() => toggleSelected(cueId)} />
                  <span>{cueLabel(cueId, lang)}</span>
                </div>

                <div>
                  <select
                    className="pref-select"
                    value={cue.preference || ""}
                    onChange={(e) => setPreference(cueId, e.target.value)}
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
                    onChange={(e) => setImportance(cueId, e.target.value)}
                    disabled={!cue.selected}
                  >
                    {importanceOptions.map((opt) => (
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
            {t.warningContinue(MIN_PREFS_ALL)}
          </div>
        )}

        <div className="nav-buttons">
          <button className="btn btn-secondary" onClick={onBack}>
            {t.back}
          </button>
          <button className="btn btn-primary" onClick={onNext} disabled={!canContinue}>
            {t.continue}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   PAGE 3 : READING + QUESTIONS
   ========================================================= */

function ReadingScreen({
  participantId,
  restaurant,
  expTexts,
  orderAB,
  readSeconds,
  cueSet,
  selectedCount,
  metaToLog,
  cueOrderByWhich,
  onBack,
  onFinish,
  lang,
}) {
  const t = I18N[lang];

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
    A: {
      decision: "",
      confidence: "", // low/mid/high
      startsImportant: "", // yes/no/unsure
      clarity: "", // yes/not_really/no
      helpful: "", // yes/no/unsure
      gist: [],
      coverage: "",
      fullReadingTimeSec: null,
    },
    B: {
      decision: "",
      confidence: "",
      startsImportant: "",
      clarity: "",
      helpful: "",
      gist: [],
      coverage: "",
      fullReadingTimeSec: null,
    },
  });

  const cur = answers[which];

  const setCur = (patch) => {
    setAnswers((prev) => ({ ...prev, [which]: { ...prev[which], ...patch } }));
  };

  // Q5: 4 indices = 2 vrais (dans cette explication) + 2 faux (hors cueSet) + "Je ne sais pas"
  const gistOptions = useMemo(() => {
    const orderForThis = (cueOrderByWhich?.[which] || []).filter((id) => cueSet.includes(id));
    const trueTwo = orderForThis.slice(0, 2);

    const allCueIds = CUE_IDS;
    const distractorPool = allCueIds.filter((id) => !cueSet.includes(id));
    const falseTwo = pickDeterministicN(distractorPool, 2, `${participantId}_${which}_distractors`);

    const four = [...trueTwo, ...falseTwo];
    const shuffled = shuffleDeterministic(four, `${participantId}_${which}_gist_shuffle`);

    return [
      ...shuffled.map((id) => ({ id, label: cueLabel(id, lang) })),
      { id: "dont_know", label: t.dontKnow },
    ];
  }, [participantId, which, cueOrderByWhich, cueSet, lang, t.dontKnow]);

  const toggleGist = (id) => {
    setAnswers((prev) => {
      const curArr = prev[which].gist || [];

      if (id === "dont_know") {
        return { ...prev, [which]: { ...prev[which], gist: ["dont_know"] } };
      }

      const base = curArr.filter((x) => x !== "dont_know");
      const next = base.includes(id) ? base.filter((x) => x !== id) : [...base, id];

      return { ...prev, [which]: { ...prev[which], gist: next.slice(0, 2) } };
    });
  };

  const gistOk = (cur.gist?.length || 0) === 2 || ((cur.gist?.length || 0) === 1 && cur.gist?.[0] === "dont_know");

  const curComplete = Boolean(cur.decision && cur.confidence && cur.startsImportant && cur.clarity && cur.helpful && gistOk && cur.coverage);

  const recommendationPrefix = selectedCount <= 1 ? t.basedOnSingle : t.basedOnPlural;

  const goNext = () => {
    if (which === orderAB[0]) {
      setWhich(orderAB[1]);
      setPhase("prepare");
      setProgress(0);
      setPrepareLeft(PREPARE_SECONDS);
    } else {
      onFinish({ ...metaToLog, restaurantName: restaurant?.name, cueSet, answers });
    }
  };

  const onFullContinue = () => {
    const sec = Math.max(0, Math.round((Date.now() - readingStartRef.current) / 1000));
    setCur({ fullReadingTimeSec: sec });
    setPhase("questions");
  };

  const stepIndex = which === orderAB[0] ? 1 : 2;
  const prepareTitle = stepIndex === 2 ? t.exp2WillShow : t.expWillShow;

  return (
    <div className="screen evaluation-screen">
      <div className="card card-wide">
        <h2>{t.recommendationH2}</h2>
        <p className="screen-description" style={{ marginBottom: 0 }}>
          {recommendationPrefix}{" "}
          <span style={{ color: "#2563eb", fontWeight: 900 }}>{restaurant?.name || "—"}</span>
        </p>
      </div>

      <div className="card card-wide" style={{ marginTop: 14 }}>
        <h3 style={{ margin: 0 }}>
          {t.explanation} {stepIndex}
        </h3>

        {phase === "prepare" && (
          <div style={{ marginTop: 12 }}>
            <div className="blink-red">{prepareTitle}</div>

            {readSeconds != null ? (
              // ✅ FIX 4: mettre cette phrase en rouge (8s ou 16s)
              <div style={{ marginTop: 10, fontWeight: 900, color: "#b91c1c" }}>{t.youMustRead(readSeconds)}</div>
            ) : (
              <div style={{ marginTop: 10, fontWeight: 900 }}>{t.youCanRead}</div>
            )}

            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.55 }}>{t.showingIn(prepareLeft)}</div>
          </div>
        )}

        {phase === "reading" && (
          <>
            <div className="text-content" style={{ minHeight: 220, marginTop: 12 }}>
              <p>{String(expTexts[which] || "")}</p>
            </div>

            {readSeconds != null ? (
              <div className="progress-bar-wrap" aria-label="progress">
                <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
              </div>
            ) : (
              <div className="nav-buttons" style={{ marginTop: 14, justifyContent: "flex-end" }}>
                <button className="btn btn-primary" onClick={onFullContinue}>
                  {t.btnContinue}
                </button>
              </div>
            )}
          </>
        )}

        {phase === "questions" && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>{t.questionsTitle(stepIndex)}</div>

            <div className="warning-box" style={{ marginBottom: 12 }}>
              {t.answerEvenIfPartial}
            </div>

            <div style={{ display: "grid", gap: 12 }}>
              {/* Q1 */}
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.q1}</div>
                <div className="comparison-options" style={{ justifyContent: "flex-start" }}>
                  {[{ id: "yes", label: t.yes }, { id: "no", label: t.no }, { id: "unsure", label: t.unsure }].map((opt) => (
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

              {/* Q2 */}
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.q2}</div>
                <div className="comparison-options" style={{ justifyContent: "flex-start" }}>
                  {[
                    { id: "low", label: t.lowSure },
                    { id: "mid", label: t.midSure },
                    { id: "high", label: t.highSure },
                  ].map((opt) => (
                    <label key={opt.id} className={`radio-option${cur.confidence === opt.id ? " active" : ""}`}>
                      <input
                        type="radio"
                        name={`confidence_${which}`}
                        value={opt.id}
                        checked={cur.confidence === opt.id}
                        onChange={(e) => setCur({ confidence: e.target.value })}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.q3}</div>
                <div className="comparison-options" style={{ justifyContent: "flex-start" }}>
                  {[{ id: "yes", label: t.yes }, { id: "no", label: t.no }, { id: "unsure", label: t.unsure }].map((opt) => (
                    <label key={opt.id} className={`radio-option${cur.startsImportant === opt.id ? " active" : ""}`}>
                      <input
                        type="radio"
                        name={`startsImportant_${which}`}
                        value={opt.id}
                        checked={cur.startsImportant === opt.id}
                        onChange={(e) => setCur({ startsImportant: e.target.value })}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q4 */}
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.q4}</div>
                <div className="comparison-options" style={{ justifyContent: "flex-start" }}>
                  {[
                    { id: "yes", label: t.clarityYes },
                    { id: "not_really", label: t.clarityMid },
                    { id: "no", label: t.clarityNo },
                  ].map((opt) => (
                    <label key={opt.id} className={`radio-option${cur.clarity === opt.id ? " active" : ""}`}>
                      <input
                        type="radio"
                        name={`clarity_${which}`}
                        value={opt.id}
                        checked={cur.clarity === opt.id}
                        onChange={(e) => setCur({ clarity: e.target.value })}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Q5 */}
              <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", paddingTop: 10 }}>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.q5}</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {gistOptions.map((o) => {
                    const checked = cur.gist?.includes(o.id);

                    const dontKnowSelected = (cur.gist?.length || 0) === 1 && cur.gist?.[0] === "dont_know";
                    const disabledByDontKnow = dontKnowSelected && o.id !== "dont_know";

                    const alreadyTwo = (cur.gist?.filter((x) => x !== "dont_know")?.length || 0) >= 2;
                    const disableMore = alreadyTwo && !checked && o.id !== "dont_know";

                    const disableDontKnow = o.id === "dont_know" && (cur.gist?.filter((x) => x !== "dont_know")?.length || 0) >= 1;

                    const disabled = disabledByDontKnow || disableMore || disableDontKnow;

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
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: disabled ? 0.55 : 1,
                          background: checked ? "rgba(34,197,94,0.12)" : "white",
                          fontWeight: 650,
                        }}
                      >
                        <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggleGist(o.id)} />
                        <span>{o.label}</span>
                      </label>
                    );
                  })}
                </div>

                <div style={{ marginTop: 8, fontSize: 12, opacity: 0.65 }}>{t.q5help}</div>
              </div>

              {/* Q6 */}
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.q6}</div>
                <select className="pref-select" value={cur.coverage} onChange={(e) => setCur({ coverage: e.target.value })}>
                  <option value="">{t.coverageChoose}</option>
                  <option value="100">{t.cov100}</option>
                  <option value="70">{t.cov70}</option>
                  <option value="50">{t.cov50}</option>
                  <option value="30">{t.cov30}</option>
                </select>
              </div>

              {/* Q7 */}
              <div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{t.q7}</div>
                <div className="comparison-options" style={{ justifyContent: "flex-start" }}>
                  {[{ id: "yes", label: t.yes }, { id: "no", label: t.no }, { id: "unsure", label: t.unsure }].map((opt) => (
                    <label key={opt.id} className={`radio-option${cur.helpful === opt.id ? " active" : ""}`}>
                      <input
                        type="radio"
                        name={`helpful_${which}`}
                        value={opt.id}
                        checked={cur.helpful === opt.id}
                        onChange={(e) => setCur({ helpful: e.target.value })}
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="nav-buttons" style={{ marginTop: 14, justifyContent: "space-between" }}>
              <button className="btn btn-secondary" onClick={onBack}>
                {t.back}
              </button>
              <button className="btn btn-primary" disabled={!curComplete} onClick={goNext}>
                {which === orderAB[1] ? t.btnFinish : t.btnNextExplanation}
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

function ThankYouScreen({ data, lang }) {
  const t = I18N[lang];
  const n = data?.submitResponse?.participantNumber;

  return (
    <div className="screen thankyou-screen">
      <div className="card welcome-card">
        <h2>{t.thanksTitle}</h2>
        <p>{t.saved}</p>

        {Number.isFinite(Number(n)) && (
          <p style={{ marginTop: 10, fontWeight: 900 }}>
            {t.participantNumberLabel} {n}
          </p>
        )}

        <p style={{ opacity: 0.75 }}>
          {t.conditionLabel} {data?.timeCondition}
        </p>
        <p style={{ opacity: 0.75 }}>
          {t.idLabel} {data?.participantId}
        </p>
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

  // language (FR default)
  const [lang, setLang] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LANG);
    if (saved && LANGS.includes(saved)) return saved;
    localStorage.setItem(STORAGE_KEY_LANG, "fr");
    return "fr";
  });
  const t = I18N[lang];

  // time condition (persist)
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
    if (readSeconds == null) return t.conditionNoLimit;
    return t.conditionTimed(readSeconds);
  }, [readSeconds, t]);

  // prefs state
  const [prefMap, setPrefMap] = useState(() => {
    const obj = {};
    CUE_IDS.forEach((id) => (obj[id] = { id, selected: false, preference: "", importance: "" }));
    return obj;
  });

  const selectedCount = useMemo(() => Object.values(prefMap).filter((c) => c.selected).length, [prefMap]);

  const selectedCues = useMemo(() => Object.values(prefMap).filter((c) => c.selected).map((c) => c.id), [prefMap]);

  const selectedCuesKey = useMemo(() => [...selectedCues].sort().join("|"), [selectedCues]);

  // ✅ FIXE : A = aligned, B = baseline, et ordre A puis B (explication 1 puis 2)
  const [config] = useState(() => ({ alignedIsA: true, orderAB: ["A", "B"] }));

  /* =========================================================
     Restaurant LOCK (pour garantir même resto pour exp1 & exp2)
     ========================================================= */

  const [lockedRestaurantKey, setLockedRestaurantKey] = useState(null);
  const [isRecoLoading, setIsRecoLoading] = useState(false);

  // Fetch recommendation ONLY when entering screen 2, then LOCK the restaurant.
  useEffect(() => {
    if (screen !== 2) return;
    if (lockedRestaurantKey) return;
    if (!selectedCues || selectedCues.length < MIN_PREFS_ALL) return;

    (async () => {
      setIsRecoLoading(true);
      try {
        const cues = [...selectedCues].sort();

        console.log("[RECO] URL =", import.meta.env.VITE_RECO_API_URL);
        console.log("[RECO] participantId =", participantId);
        console.log("[RECO] selectedCues =", cues);

        const reco = await fetchRecoFromPrefs(participantId, cues);
        console.log("[RECO] response =", reco);

        const top = reco?.items?.[0]?.item_id;

        if (top && RESTAURANTS[top]) {
          console.log("[RECO] LOCK restaurant =", top);
          setLockedRestaurantKey(top);
        } else {
          console.warn("[RECO] invalid top, LOCK fallback r01. top=", top);
          setLockedRestaurantKey("r01");
        }
      } catch (e) {
        console.error("[RECO] failed, LOCK fallback r01:", e);
        setLockedRestaurantKey("r01");
      } finally {
        setIsRecoLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, participantId, selectedCuesKey, lockedRestaurantKey]);

  const restaurantKey = lockedRestaurantKey || "r01";
  const restaurant = RESTAURANTS[restaurantKey] || RESTAURANTS.r01;

  // cueset and orders (condition courante)
  const cueSet = useMemo(() => makeCueSetSelectedOnly(prefMap, K), [prefMap, K]);
  const alignedOrderArr = useMemo(() => orderAligned(prefMap, cueSet), [prefMap, cueSet]);
  const baselineOrderArr = useMemo(() => orderBaselineFromAligned(alignedOrderArr), [alignedOrderArr]);

  // ✅ FIX 3: référence 8s (uniquement pour calculer la longueur cible en 16s)
  const cueSet8 = useMemo(() => makeCueSetSelectedOnly(prefMap, getK("8s")), [prefMap]);
  const alignedOrder8 = useMemo(() => orderAligned(prefMap, cueSet8), [prefMap, cueSet8]);
  const baselineOrder8 = useMemo(() => orderBaselineFromAligned(alignedOrder8), [alignedOrder8]);

  // explanation texts (bilingue) + FIXE A/B
  const expTexts = useMemo(() => {
    // base (condition courante) — ✅ 8s inchangé
    const alignedBase = buildExplanationOneParagraph({
      restaurant,
      cueOrder: alignedOrderArr,
      cueSet,
      prefMap,
      mode: "cues_first",
      lang,
    });

    const baselineBase = buildExplanationOneParagraph({
      restaurant,
      cueOrder: baselineOrderArr,
      cueSet,
      prefMap,
      mode: "remainder_first",
      lang,
    });

    // référence 8s (mêmes modes) — pour fixer une cible "2×"
    const alignedRef8 = buildExplanationOneParagraph({
      restaurant,
      cueOrder: alignedOrder8,
      cueSet: cueSet8,
      prefMap,
      mode: "cues_first",
      lang,
    });

    const baselineRef8 = buildExplanationOneParagraph({
      restaurant,
      cueOrder: baselineOrder8,
      cueSet: cueSet8,
      prefMap,
      mode: "remainder_first",
      lang,
    });

    // ✅ correction 16s: si trop court, on complète avec texte standard neutre
    if (timeCondition === "16s") {
      const targetA = wordTokens(alignedRef8).length * 2;
      const targetB = wordTokens(baselineRef8).length * 2;

      const alignedText16 = ensureMinWords(alignedBase, lang, targetA);
      const baselineText16 = ensureMinWords(baselineBase, lang, targetB);

      return { A: alignedText16, B: baselineText16 };
    }

    // FIXE : A = aligned, B = baseline
    return { A: alignedBase, B: baselineBase };
  }, [
    restaurant,
    alignedOrderArr,
    baselineOrderArr,
    cueSet,
    prefMap,
    lang,
    timeCondition,
    alignedOrder8,
    baselineOrder8,
    cueSet8,
  ]);

  const cueOrderByWhich = useMemo(() => {
    return { A: alignedOrderArr, B: baselineOrderArr };
  }, [alignedOrderArr, baselineOrderArr]);

  const [studyData, setStudyData] = useState(null);

  const goto = (s) => {
    // when going to screen 2, reset lock so we fetch and then lock again
    if (s === 2) {
      setLockedRestaurantKey(null);
      setIsRecoLoading(false);
    }
    setScreen(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const metaToLog = useMemo(
    () => ({
      participantId,
      lang,
      timeCondition,
      readSeconds: readSeconds ?? "full",
      K,
      restaurantKey,
      restaurantName: restaurant?.name,
      alignedIsA: config.alignedIsA,
      orderAB: config.orderAB,
      cueSet,
      alignedOrder: alignedOrderArr,
      baselineOrder: baselineOrderArr,
      selectedCues: [...selectedCues].sort(), // utile pour analyse, reste léger
    }),
    [
      participantId,
      lang,
      timeCondition,
      readSeconds,
      K,
      restaurantKey,
      restaurant?.name,
      config.alignedIsA,
      config.orderAB,
      cueSet,
      alignedOrderArr,
      baselineOrderArr,
      selectedCuesKey,
    ]
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // if screen 2 but restaurant not locked yet, show preparing screen
  const showPreparing = screen === 2 && (isRecoLoading || !lockedRestaurantKey);

  return (
    <div className="app-container">
      {screen === 0 && <WelcomeScreen conditionText={conditionText} onNext={() => goto(1)} lang={lang} setLang={setLang} />}

      {screen === 1 && (
        <PreferencesScreen
          prefMap={prefMap}
          setPrefMap={setPrefMap}
          onBack={() => goto(0)}
          onNext={() => goto(2)}
          lang={lang}
        />
      )}

      {showPreparing && (
        <div className="screen welcome-screen">
          <div className="card welcome-card">
            <h2 style={{ marginTop: 0 }}>{t.preparingTitle}</h2>
            <p style={{ opacity: 0.85 }}>{t.preparingText}</p>
          </div>
        </div>
      )}

      {screen === 2 && !showPreparing && (
        <ReadingScreen
          participantId={participantId}
          restaurant={restaurant} // ✅ same restaurant for exp 1 & 2 because locked
          expTexts={expTexts}
          orderAB={config.orderAB} // ✅ ["A","B"] fixed
          readSeconds={readSeconds}
          cueSet={cueSet}
          selectedCount={selectedCount}
          metaToLog={metaToLog}
          cueOrderByWhich={cueOrderByWhich}
          onBack={() => goto(1)}
          lang={lang}
          onFinish={async (payloadFull) => {
            const payload = {
              ...metaToLog,
              answers: payloadFull?.answers,
            };

            if (isSubmitting) return;
            setIsSubmitting(true);

            try {
              const resp = await submitStudy(payload);
              setStudyData({ ...payload, submitResponse: resp });
              goto(3);
            } catch (e) {
              console.error(e);
              alert(lang === "en" ? "Error: your answers were NOT sent. Please retry." : "Erreur: vos réponses n'ont PAS été envoyées. Réessayez.");
              const key = `study_backup_${payload.participantId}_${Date.now()}`;
              localStorage.setItem(key, JSON.stringify(payload));
            } finally {
              setIsSubmitting(false);
            }
          }}
        />
      )}

      {screen === 2 && isSubmitting && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 16,
          }}
        >
          <div
            style={{
              background: "white",
              borderRadius: 16,
              padding: "18px 16px",
              width: "min(420px, 95vw)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
              fontWeight: 800,
            }}
          >
            {t.sending}
            <div style={{ marginTop: 8, fontWeight: 600, opacity: 0.7, fontSize: 13 }}>{t.dontClose}</div>
          </div>
        </div>
      )}

      {screen === 3 && studyData && <ThankYouScreen data={studyData} lang={lang} />}
    </div>
  );
}
