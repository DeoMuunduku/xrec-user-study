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

    const q = "INSERT INTO submissions(payload) VALUES($1) RETURNING id, created_at";
    const r = await pool.query(q, [payload]);

    res.json({
      ok: true,
      participantNumber: String(r.rows[0].id),
      createdAt: r.rows[0].created_at,
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

// ✅ ADMIN: voir les soumissions (protégé par token) + filtre pid optionnel
app.get("/api/admin/submissions", async (req, res) => {
  try {
    const token = req.header("x-admin-token") || req.query.token;

    if (!process.env.ADMIN_TOKEN) {
      return res.status(500).json({ ok: false, error: "ADMIN_TOKEN manquant (Render env var)" });
    }
    if (token !== process.env.ADMIN_TOKEN) {
      return res.status(401).json({ ok: false, error: "Unauthorized" });
    }

    const limit = Math.min(Number(req.query.limit || 50), 500);
    const pid = (req.query.pid || "").trim();

    let sql = "SELECT id, created_at, payload FROM submissions";
    const params = [];

    if (pid) {
      params.push(pid);
      sql += ` WHERE payload->>'participantId' = $${params.length}`;
    }

    params.push(limit);
    sql += ` ORDER BY id DESC LIMIT $${params.length}`;

    const r = await pool.query(sql, params);
    res.json({ ok: true, count: r.rowCount, rows: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

const port = Number(process.env.PORT || 8000);
app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});