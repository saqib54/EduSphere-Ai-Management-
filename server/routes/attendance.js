import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/attendance?class_id=&date=
r.get("/", async (req, res) => {
  try {
    const { class_id, date } = req.query;
    if (!class_id || !date) return res.status(400).json({ error: "class_id and date required" });
    const records = await rows(`
      SELECT a.*, s.name as student_name, s.roll_no, s.student_id as stu_code
      FROM attendance a JOIN students s ON s.id=a.student_id
      WHERE a.class_id=$1 AND a.date=$2
      ORDER BY s.roll_no
    `,[class_id, date]);
    // Also get all students in class (for ones not yet recorded)
    const students = await rows(
      "SELECT id,name,roll_no,student_id FROM students WHERE class_id=$1 AND status='Active' ORDER BY roll_no",
      [class_id]
    );
    res.json({ records, students });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/attendance  body: { class_id, date, entries: [{student_id, status}], teacher_id }
r.post("/", async (req, res) => {
  try {
    const { class_id, date, entries, teacher_id } = req.body;
    if (!entries?.length) return res.status(400).json({ error: "No entries provided" });
    for (const e of entries) {
      await query(
        `INSERT INTO attendance(student_id,class_id,date,status,noted_by)
         VALUES($1,$2,$3,$4,$5)
         ON CONFLICT(student_id,date) DO UPDATE SET status=EXCLUDED.status, noted_by=EXCLUDED.noted_by`,
        [e.student_id, class_id, date, e.status, teacher_id||null]
      );
    }
    res.json({ ok: true, saved: entries.length });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/attendance/summary?class_id=&month=&year=
r.get("/summary", async (req, res) => {
  try {
    const { class_id, month, year } = req.query;
    const m = String(month).padStart(2,"0");
    const result = await rows(`
      SELECT s.name as student_name, s.roll_no, s.student_id as stu_code,
        COUNT(*) as total_days,
        SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status='Absent'  THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status='Leave'   THEN 1 ELSE 0 END) as leave,
        ROUND(100.0 * SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0)) as pct
      FROM attendance a JOIN students s ON s.id=a.student_id
      WHERE a.class_id=$1 AND TO_CHAR(a.date,'YYYY-MM')=$2
      GROUP BY s.id ORDER BY pct ASC
    `,[class_id, `${year}-${m}`]);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/attendance/my?student_id=&month=&year=
r.get("/my", async (req, res) => {
  try {
    const { student_id, month, year } = req.query;
    if (!student_id) return res.status(400).json({ error: "student_id required" });
    const m = String(month).padStart(2,"0");
    const records = await rows(
      `SELECT date, status FROM attendance WHERE student_id=$1 AND TO_CHAR(date,'YYYY-MM')=$2 ORDER BY date`,
      [student_id, `${year}-${m}`]
    );
    const present = records.filter(r => r.status === "Present").length;
    const absent  = records.filter(r => r.status === "Absent").length;
    const leave   = records.filter(r => r.status === "Leave").length;
    const pct = records.length > 0 ? Math.round((present / records.length) * 100) : 0;
    res.json({ records, present, absent, leave, total: records.length, pct });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default r;
