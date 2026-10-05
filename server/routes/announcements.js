import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/announcements?role=
r.get("/", async (req, res) => {
  try {
    const { role } = req.query;
    let sql = `
      SELECT a.*, u.name as author_name FROM announcements a
      LEFT JOIN users u ON u.id=a.author_id WHERE 1=1
    `;
    const params = [];
    if (role) { sql += " AND (a.target='All' OR a.target=$1)"; params.push(role); }
    sql += " ORDER BY a.created_at DESC";
    res.json(await rows(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/announcements
r.post("/", async (req, res) => {
  try {
    const { title, body, target, priority, author_id } = req.body;
    const r2 = await row(
      "INSERT INTO announcements(title,body,target,priority,author_id) VALUES($1,$2,$3,$4,$5) RETURNING id",
      [title, body, target||"All", priority||"Normal", author_id||null]
    );
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/announcements/:id
r.put("/:id", async (req, res) => {
  try {
    const { title, body, target, priority } = req.body;
    await query("UPDATE announcements SET title=$1,body=$2,target=$3,priority=$4 WHERE id=$5",[title,body,target,priority,req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/announcements/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM announcements WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
