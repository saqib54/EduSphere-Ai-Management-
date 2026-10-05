import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/diary?class_id=&teacher_id=&date=
r.get("/", async (req, res) => {
  try {
    const { class_id, teacher_id, date } = req.query;
    let sql = `
      SELECT d.*, s.name as subject_name, t.name as teacher_name, c.name as class_name, c.section
      FROM diary d
      LEFT JOIN subjects s ON s.id=d.subject_id
      LEFT JOIN teachers t ON t.id=d.teacher_id
      LEFT JOIN classes  c ON c.id=d.class_id
      WHERE 1=1
    `;
    const params = []; let i = 1;
    if (class_id)   { sql += ` AND d.class_id=$${i++}`;   params.push(class_id); }
    if (teacher_id) { sql += ` AND d.teacher_id=$${i++}`; params.push(teacher_id); }
    if (date)       { sql += ` AND d.date=$${i++}`;        params.push(date); }
    sql += " ORDER BY d.date DESC, d.created_at DESC";
    res.json(await rows(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/diary
r.post("/", async (req, res) => {
  try {
    const { class_id, teacher_id, subject_id, date, title, content, homework_due } = req.body;
    const r2 = await row(
      "INSERT INTO diary(class_id,teacher_id,subject_id,date,title,content,homework_due) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [class_id, teacher_id, subject_id||null, date, title, content||null, homework_due||null]
    );
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/diary/:id
r.patch("/:id", async (req, res) => {
  try {
    const { title, content, homework_due, subject_id } = req.body;
    await query("UPDATE diary SET title=$1,content=$2,homework_due=$3,subject_id=$4 WHERE id=$5",
      [title, content, homework_due||null, subject_id||null, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/diary/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM diary WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
