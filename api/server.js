// /Users/deomunduku/xrec-user-study/api/server.js
import express from "express";
import cors from "cors";

/**
 * ✅ Google Apps Script Web App (ton lien /exec)
 * Important:
 * - doit avoir doGet + doPost dans Apps Script
 * - déployé en "Anyone" (ou au moins "Anyone with link")
 */
const SHEETS_WEBAPP_URL =
  process.env.SHEETS_WEBAPP_URL ||
  "https://script.google.com/macros/s/AKfycbwclUgddk4F9n65FKx5x2e5ZRVNq2eu5yRV1lkOj2b1hrmKmdQs68lkNFc4fzlL34zRsQ/exec";

const app = express();

/* =========================
   CORS + JSON
   ========================= */
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "HEAD", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "128kb" }));

/* =========================
   ROUTES
   ========================= */

// Health : utile pour UptimeRobot (GET/HEAD)
app.all("/health", (req, res) => res.status(200).json({ ok: true }));

// Petit ping vers Apps Script (test rapide)
app.get("/api/sheets_ping", async (req, res) => {
  try {
    const r = await fetch(`${SHEETS_WEBAPP_URL}?ping=1`, { method: "GET" });
    const txt = await r.text();
    res.status(200).send(txt);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// Submit : répond vite + envoie en background vers Google Sheets
app.post("/api/submit", (req, res) => {
  const payload = req.body || {};

  // ✅ réponse immédiate
  res.status(200).json({ ok: true });

  // ✅ envoi background (ne bloque pas)
  (async () => {
    try {
      const r = await fetch(SHEETS_WEBAPP_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // IMPORTANT: Apps Script reçoit bien du JSON si doPost lit e.postData.contents
        body: JSON.stringify(payload),
        redirect: "follow",
      });

      // (optionnel) debug si besoin
      const text = await r.text();
      if (!r.ok) {
        console.error("[SHEETS] POST failed:", r.status, text);
      } else {
        // console.log("[SHEETS] OK:", text);
      }
    } catch (e) {
      console.error("[SHEETS] POST error:", e?.message || e);
    }
  })();
});

/* =========================
   START
   ========================= */
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`[API] listening on port ${PORT}`);
  console.log(`[API] SHEETS_WEBAPP_URL = ${SHEETS_WEBAPP_URL}`);
});
