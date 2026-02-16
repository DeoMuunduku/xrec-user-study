import "dotenv/config";
// api/server.js
import express from "express";
import cors from "cors";

const app = express();

/* =========================
   CONFIG
   ========================= */

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "HEAD", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "64kb" }));

const SHEETS_URL = process.env.SHEETS_URL; // ex: https://script.google.com/macros/s/.../exec

/* =========================
   HELPERS
   ========================= */

function safeJson(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return JSON.stringify({ error: "JSON stringify failed" });
  }
}

// POST JSON vers Apps Script en gérant le redirect 302/303 (Google fait souvent ça)
async function postJsonFollowRedirect(url, payload) {
  if (!url) throw new Error("Missing SHEETS_URL env var");

  const body = safeJson(payload);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    redirect: "manual", // IMPORTANT: on capte les 302/303 nous-mêmes
  });

  if ([301, 302, 303, 307, 308].includes(res.status)) {
    const loc = res.headers.get("location");
    if (!loc) throw new Error(`Redirect ${res.status} without Location header`);

    const res2 = await fetch(loc, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    const txt2 = await res2.text();
    if (!res2.ok) throw new Error(`Sheets POST failed (${res2.status}): ${txt2}`);
    return txt2;
  }

  const txt = await res.text();
  if (!res.ok) throw new Error(`Sheets POST failed (${res.status}): ${txt}`);
  return txt;
}

/* =========================
   ROUTES
   ========================= */

// Health : utile pour UptimeRobot/Render
app.all("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// Ping Sheets via GET sur ton Apps Script (doGet)
app.get("/api/sheets_ping", async (req, res) => {
  try {
    if (!SHEETS_URL) return res.status(500).json({ ok: false, error: "SHEETS_URL missing" });
    const u = `${SHEETS_URL}?ping=1`;
    const r = await fetch(u);
    const t = await r.text();
    res.status(200).type("application/json").send(t);
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || String(e) });
  }
});

// Submit -> écrit dans Google Sheets
app.post("/api/submit", async (req, res) => {
  const payload = req.body || {};

  // On répond vite au front
  res.status(200).json({ ok: true });

  // On envoie au Sheet en background
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

  try {
    await postJsonFollowRedirect(SHEETS_URL, minimized);
  } catch (e) {
    console.error("[SHEETS] write failed:", e?.message || e);
  }
});

/* =========================
   START
   ========================= */

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`[API] listening on port ${PORT}`);
  console.log(`[API] SHEETS_URL = ${SHEETS_URL ? "set" : "missing"}`);
});
