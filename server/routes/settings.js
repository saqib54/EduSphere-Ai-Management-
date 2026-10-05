import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/settings
r.get("/", async (_req, res) => {
  try {
    const s = await rows("SELECT key,value FROM settings");
    res.json(Object.fromEntries(s.map(r => [r.key, r.value])));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/settings  body: { key: value, ... }
r.put("/", async (req, res) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await query("INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value",[key, value]);
    }
    res.json({ ok: true, saved: entries.length });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/settings/users
r.get("/users", async (_req, res) => {
  try {
    const users = await rows("SELECT id,username,role,name,status,must_change_password,email,created_at FROM users ORDER BY id DESC");
    res.json(users);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/settings/users
r.post("/users", async (req, res) => {
  try {
    const { username, password, role, name, email } = req.body;
    if (!username||!password||!role||!name) return res.status(400).json({ error: "Required fields missing" });
    const bcrypt = await import("bcryptjs");
    const hash = await bcrypt.default.hash(password, 12);
    const r2 = await row(
      "INSERT INTO users(username,password,role,name,email,must_change_password) VALUES($1,$2,$3,$4,$5,1) RETURNING id",
      [username.trim().toLowerCase(), hash, role, name, email||null]
    );
    res.json({ id: r2.id, username, role, name });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/settings/users/:id
r.delete("/users/:id", async (req, res) => {
  try {
    await query("DELETE FROM users WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
