import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/teachers
r.get("/", async (_req, res) => {
  try {
    const teachers = await rows(`
      SELECT t.*,
        (SELECT json_agg(json_build_object('id',ts.id,'subject_id',ts.subject_id,'class_id',ts.class_id,'subject_name',s.name,'class_name',c.name,'section',c.section))
         FROM teacher_subjects ts JOIN subjects s ON s.id=ts.subject_id JOIN classes c ON c.id=ts.class_id
         WHERE ts.teacher_id=t.id) as assignments
      FROM teachers t ORDER BY t.name
    `);
    res.json(teachers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/teachers/:id
r.get("/:id", async (req, res) => {
  try {
    const teacher = await row("SELECT * FROM teachers WHERE id=$1",[req.params.id]);
    if (!teacher) return res.status(404).json({ error: "Teacher not found" });
    res.json(teacher);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/teachers
r.post("/", async (req, res) => {
  try {
    const { emp_id, name, cnic, phone, email, qualification, join_date, salary, status } = req.body;
    const r2 = await row(
      "INSERT INTO teachers(emp_id,name,cnic,phone,email,qualification,join_date,salary,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id",
      [emp_id,name,cnic||null,phone||null,email||null,qualification||null,join_date||null,salary||0,status||"Active"]
    );
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/teachers/:id
r.put("/:id", async (req, res) => {
  try {
    const { emp_id, name, cnic, phone, email, qualification, join_date, salary, status } = req.body;
    await query("UPDATE teachers SET emp_id=$1,name=$2,cnic=$3,phone=$4,email=$5,qualification=$6,join_date=$7,salary=$8,status=$9 WHERE id=$10",
      [emp_id,name,cnic,phone,email,qualification,join_date,salary,status,req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/teachers/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM teachers WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/teachers/:id/assign
r.post("/:id/assign", async (req, res) => {
  try {
    const { subject_id, class_id } = req.body;
    const r2 = await row(
      "INSERT INTO teacher_subjects(teacher_id,subject_id,class_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id",
      [req.params.id, subject_id, class_id]
    );
    res.json({ id: r2?.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/teachers/:id/assign/:tsId
r.delete("/:id/assign/:tsId", async (req, res) => {
  try {
    await query("DELETE FROM teacher_subjects WHERE id=$1 AND teacher_id=$2",[req.params.tsId, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
