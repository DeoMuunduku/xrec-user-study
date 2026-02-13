// /Users/deomunduku/xrec-user-study/api/server.js
import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";

const app = express();

/* =========================
   CONFIG
   ========================= */

// CORS : autorise ton Vite local + ton Render front (et tout le reste si besoin)
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "HEAD", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

// JSON : limite petite = plus rapide + évite payload énorme
app.use(express.json({ limit: "64kb" }));

// Emplacement de stockage (JSONL = 1 ligne JSON par soumission)
const DATA_DIR = process.env.DATA_DIR || "data";
const SUBMIT_FILE = process.env.SUBMIT_FILE || "submissions.jsonl";

// Optionnel : si tu as un disque persistant Render monté sur /var/data
// mets DATA_DIR=/var/data dans Render env vars.
const submitPath = path.join(DATA_DIR, SUBMIT_FILE);

/* =========================
   HELPERS
   ========================= */

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function safeJson(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return JSON.stringify({ error: "JSON stringify failed" });
  }
}

// Écriture ASYNC "fire-and-forget" : on ne bloque pas la réponse HTTP
async function appendSubmission(payload) {
  try {
    await ensureDir();
    const line = safeJson(payload) + "\n";
    await fs.appendFile(submitPath, line, "utf-8");
  } catch (e) {
    // On log seulement : on ne casse pas l’API côté utilisateur
    console.error("[SUBMIT] append failed:", e?.message || e);
  }
}

/* =========================
   ROUTES
   ========================= */

// Health : accepte GET + HEAD (utile pour UptimeRobot/Render)
app.all("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// Submit : réponse immédiate + sauvegarde en background
app.post("/api/submit", (req, res) => {
  const payload = req.body || {};

  // ✅ Option : réduire encore le payload stocké (évite textes longs)
  // Tu peux adapter selon tes besoins. Là je garde le minimum utile.
  const minimized = {
    ts: new Date().toISOString(),
    participantId: payload.participantId,
    timeCondition: payload.timeCondition,
    readSeconds: payload.readSeconds,
    K: payload.K,
    restaurantKey: payload.restaurantKey,
    restaurantName: payload.restaurantName,
    alignedIsA: payload.alignedIsA,
    orderAB: payload.orderAB,
    alignedOrder: payload.alignedOrder,
    baselineOrder: payload.baselineOrder,
    selectedCount: payload.selectedCount,
    selectedCues: payload.selectedCues,
    cueSet: payload.cueSet,
    answers: payload.answers,
  };

  // ✅ Répond tout de suite (le front stoppe l’attente)
  res.status(200).json({ ok: true });

  // ✅ Sauvegarde après (sans await)
  appendSubmission(minimized);
});

/* =========================
   START
   ========================= */

const PORT = process.env.PORT || 10000; // Render met PORT automatiquement
app.listen(PORT, () => {
  console.log(`[API] listening on port ${PORT}`);
  console.log(`[API] submitPath = ${submitPath}`);
});
