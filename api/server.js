import express from "express";
import cors from "cors";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ✅ ping (avec /api)
app.get("/api/ping", async (req, res) => {
  try {
    const r = await pool.query("SELECT 1 as ok");
    res.json({ ok: true, db: r.rows[0].ok });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// ✅ submit (avec /api)
app.post("/api/submit", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || typeof payload !== "object") {
      return res.status(400).json({ ok: false, error: "Invalid payload" });
    }

    // ⚠️ Il faut que la table "submissions" existe (id, payload, created_at)
    const q = "INSERT INTO submissions(payload) VALUES($1) RETURNING id, created_at";
    const r = await pool.query(q, [payload]);

    res.json({
      ok: true,
      participantNumber: r.rows[0].id,
      createdAt: r.rows[0].created_at,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});