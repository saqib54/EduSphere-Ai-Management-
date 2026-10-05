import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/classes
r.get("/", async (_req, res) => {
  try {
    const classes = await rows(`
      SELECT c.*, ay.label as year_label,
        (SELECT COUNT(*) FROM students s WHERE s.class_id=c.id AND s.status='Active') as student_count
      FROM classes c LEFT JOIN academic_years ay ON ay.id=c.academic_year_id
      ORDER BY c.grade, c.section
    `);
    res.json(classes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/classes
r.post("/", async (req, res) => {
  try {
    const { name, section, grade, room, capacity, academic_year_id } = req.body;
    const r2 = await row("INSERT INTO classes(name,section,grade,room,capacity,academic_year_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",[name,section,grade,room||null,capacity||40,academic_year_id||null]);
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/classes/:id
r.put("/:id", async (req, res) => {
  try {
    const { name, section, grade, room, capacity } = req.body;
    await query("UPDATE classes SET name=$1,section=$2,grade=$3,room=$4,capacity=$5 WHERE id=$6",[name,section,grade,room,capacity,req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/classes/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM classes WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/classes/subjects
r.get("/subjects", async (_req, res) => {
  try {
    const subjects = await rows("SELECT * FROM subjects ORDER BY name");
    res.json(subjects);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/classes/subjects
r.post("/subjects", async (req, res) => {
  try {
    const { name, code, category } = req.body;
    const r2 = await row("INSERT INTO subjects(name,code,category) VALUES($1,$2,$3) RETURNING id",[name,code,category||"Core"]);
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/classes/subjects/:id
r.put("/subjects/:id", async (req, res) => {
  try {
    const { name, code, category } = req.body;
    await query("UPDATE subjects SET name=$1,code=$2,category=$3 WHERE id=$4",[name,code,category,req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/classes/subjects/:id
r.delete("/subjects/:id", async (req, res) => {
  try {
    await query("DELETE FROM subjects WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
