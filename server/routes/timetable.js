import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/timetable?class_id=&teacher_id=&day=
// FIX: proper $N parameterised filter, correct ORDER BY for days
r.get("/", async (req, res) => {
  try {
    const { class_id, teacher_id, day } = req.query;
    let sql = `
      SELECT tt.*, s.name as subject_name, t.name as teacher_name, c.name as class_name, c.section
      FROM timetable tt
      JOIN subjects  s ON s.id=tt.subject_id
      JOIN teachers  t ON t.id=tt.teacher_id
      JOIN classes   c ON c.id=tt.class_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (class_id)   { sql += ` AND tt.class_id=$${i++}`;   params.push(class_id); }
    if (teacher_id) { sql += ` AND tt.teacher_id=$${i++}`; params.push(teacher_id); }
    if (day)        { sql += ` AND tt.day=$${i++}`;         params.push(day); }
    sql += `
      ORDER BY CASE tt.day
        WHEN 'Monday'    THEN 1 WHEN 'Tuesday'  THEN 2 WHEN 'Wednesday' THEN 3
        WHEN 'Thursday'  THEN 4 WHEN 'Friday'   THEN 5 WHEN 'Saturday'  THEN 6 ELSE 7
      END, tt.start_time
    `;
    res.json(await rows(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/timetable — conflict check then insert
r.post("/", async (req, res) => {
  try {
    const { class_id, subject_id, teacher_id, day, start_time, end_time, room } = req.body;
    // Check for time slot conflict for the class
    const conflict = await row(
      "SELECT id FROM timetable WHERE class_id=$1 AND day=$2 AND start_time=$3",
      [class_id, day, start_time]
    );
    if (conflict) return res.status(409).json({ error: "Time slot already taken for this class on this day" });
    const r2 = await row(
      "INSERT INTO timetable(class_id,subject_id,teacher_id,day,start_time,end_time,room) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [class_id, subject_id, teacher_id, day, start_time, end_time, room||null]
    );
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/timetable/:id
r.put("/:id", async (req, res) => {
  try {
    const { class_id, subject_id, teacher_id, day, start_time, end_time, room } = req.body;
    await query("UPDATE timetable SET class_id=$1,subject_id=$2,teacher_id=$3,day=$4,start_time=$5,end_time=$6,room=$7 WHERE id=$8",
      [class_id, subject_id, teacher_id, day, start_time, end_time, room, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/timetable/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM timetable WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
