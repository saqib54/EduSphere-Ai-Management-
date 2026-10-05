import { Router } from "express";
import { rows, row, query } from "../db.js";
import pool from "../db.js";

const r = Router();

// GET /api/exams
r.get("/", async (req, res) => {
  try {
    const { class_id, term_id } = req.query;
    let sql = `
      SELECT e.*, c.name as class_name, c.section, t.name as term_name,
        (SELECT COUNT(*) FROM exam_subjects es WHERE es.exam_id=e.id) as subject_count,
        (SELECT COUNT(DISTINCT m.subject_id) FROM marks m WHERE m.exam_id=e.id) as marked
      FROM exams e
      LEFT JOIN classes c ON c.id=e.class_id
      LEFT JOIN terms   t ON t.id=e.term_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (class_id) { sql += ` AND e.class_id=$${i++}`; params.push(class_id); }
    if (term_id)  { sql += ` AND e.term_id=$${i++}`;  params.push(term_id); }
    sql += " ORDER BY e.start_date DESC";
    res.json(await rows(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/exams/my-results?student_id=
r.get("/my-results", async (req, res) => {
  try {
    const { student_id } = req.query;
    if (!student_id) return res.status(400).json({ error: "student_id required" });
    const student = await row("SELECT * FROM students WHERE id=$1",[student_id]);
    if (!student) return res.status(404).json({ error: "Student not found" });
    const exams = await rows(`
      SELECT e.*, c.name as class_name, c.section FROM exams e
      JOIN classes c ON c.id=e.class_id WHERE e.class_id=$1 ORDER BY e.start_date DESC
    `,[student.class_id]);
    const results = await Promise.all(exams.map(async (exam) => {
      const marksRows = await rows(`
        SELECT m.*, s.name as subject_name, es.max_marks
        FROM marks m
        JOIN subjects s ON s.id=m.subject_id
        JOIN exam_subjects es ON es.exam_id=m.exam_id AND es.subject_id=m.subject_id
        WHERE m.exam_id=$1 AND m.student_id=$2
      `,[exam.id, student_id]);
      const obtained = marksRows.reduce((a,m) => a + (m.is_absent ? 0 : Number(m.obtained_marks)), 0);
      const maxM     = marksRows.reduce((a,m) => a + Number(m.max_marks), 0);
      const pct      = maxM > 0 ? Math.round((obtained / maxM) * 100) : 0;
      const grade = marksRows.length === 0 ? "—" : pct>=90?"A+":pct>=80?"A":pct>=70?"B+":pct>=60?"B":pct>=50?"C":pct>=40?"D":"F";
      return { ...exam, marks: marksRows, obtained, maxM, pct, grade };
    }));
    res.json(results);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/exams/:id
r.get("/:id", async (req, res) => {
  try {
    const exam = await row(`
      SELECT e.*, c.name as class_name, c.section FROM exams e
      LEFT JOIN classes c ON c.id=e.class_id WHERE e.id=$1
    `,[req.params.id]);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    const subjects = await rows(`
      SELECT es.*, s.name as subject_name FROM exam_subjects es
      JOIN subjects s ON s.id=es.subject_id WHERE es.exam_id=$1
    `,[req.params.id]);
    res.json({ ...exam, subjects });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/exams
r.post("/", async (req, res) => {
  try {
    const { name, class_id, term_id, type, start_date, end_date, total_marks, passing_marks } = req.body;
    const cid = class_id ? parseInt(class_id) : null;
    const tid = term_id ? parseInt(term_id) : null;
    const r2 = await row(
      "INSERT INTO exams(name,class_id,term_id,type,start_date,end_date,total_marks,passing_marks) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
      [name, cid, tid, type||"Monthly Test", start_date||null, end_date||null, total_marks||100, passing_marks||33]
    );

    // Auto-populate exam_subjects if class_id is provided
    if (cid) {
      const classSubs = await rows(
        "SELECT subject_id FROM class_subjects WHERE class_id=$1", [cid]
      );
      const subIds = classSubs.length > 0
        ? classSubs.map(cs => cs.subject_id)
        : (await rows("SELECT id FROM subjects LIMIT 8")).map(s => s.id);

      for (const sid of subIds) {
        await query(
          "INSERT INTO exam_subjects(exam_id,subject_id,max_marks) VALUES($1,$2,100) ON CONFLICT DO NOTHING",
          [r2.id, sid]
        );
      }
    }
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/exams/:id
r.put("/:id", async (req, res) => {
  try {
    const { name, class_id, term_id, type, start_date, end_date, total_marks, passing_marks, status } = req.body;
    const cid = class_id ? parseInt(class_id) : null;
    const tid = term_id ? parseInt(term_id) : null;
    await query("UPDATE exams SET name=$1,class_id=$2,term_id=$3,type=$4,start_date=$5,end_date=$6,total_marks=$7,passing_marks=$8,status=$9 WHERE id=$10",
      [name,cid,tid,type,start_date,end_date,total_marks,passing_marks,status||"Scheduled",req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/exams/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM exams WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/exams/:id/subjects
r.post("/:id/subjects", async (req, res) => {
  try {
    const { subject_id, date, max_marks } = req.body;
    const r2 = await row("INSERT INTO exam_subjects(exam_id,subject_id,date,max_marks) VALUES($1,$2,$3,$4) RETURNING id",
      [req.params.id, subject_id, date||null, max_marks||100]);
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/exams/:id/marks
r.get("/:id/marks", async (req, res) => {
  try {
    const exam = await row("SELECT * FROM exams WHERE id=$1",[req.params.id]);
    if (!exam) return res.status(404).json({ error: "Exam not found" });
    const students = await rows("SELECT * FROM students WHERE class_id=$1 AND status='Active' ORDER BY roll_no",[exam.class_id]);
    let subjects = await rows(`
      SELECT es.*, s.name as subject_name FROM exam_subjects es JOIN subjects s ON s.id=es.subject_id WHERE es.exam_id=$1
    `,[req.params.id]);

    // Fallback: If no exam_subjects defined yet, populate them automatically
    if (subjects.length === 0 && exam.class_id) {
      const classSubs = await rows("SELECT subject_id FROM class_subjects WHERE class_id=$1", [exam.class_id]);
      const subIds = classSubs.length > 0
        ? classSubs.map(cs => cs.subject_id)
        : (await rows("SELECT id FROM subjects LIMIT 8")).map(s => s.id);

      for (const sid of subIds) {
        await query("INSERT INTO exam_subjects(exam_id,subject_id,max_marks) VALUES($1,$2,100) ON CONFLICT DO NOTHING", [exam.id, sid]);
      }
      subjects = await rows(`
        SELECT es.*, s.name as subject_name FROM exam_subjects es JOIN subjects s ON s.id=es.subject_id WHERE es.exam_id=$1
      `,[req.params.id]);
    }

    const marksRows = await rows("SELECT * FROM marks WHERE exam_id=$1",[req.params.id]);
    const marksMap = {};
    for (const m of marksRows) {
      if (!marksMap[m.student_id]) marksMap[m.student_id] = {};
      marksMap[m.student_id][m.subject_id] = m;
    }
    res.json({ students, subjects, marks: marksMap });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/exams/:id/marks
r.post("/:id/marks", async (req, res) => {
  try {
    const { entries } = req.body;
    if (!entries?.length) return res.json({ ok: true });
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const e of entries) {
        await client.query(
          `INSERT INTO marks(exam_id,student_id,subject_id,obtained_marks,is_absent)
           VALUES($1,$2,$3,$4,$5)
           ON CONFLICT(exam_id,student_id,subject_id) DO UPDATE SET obtained_marks=EXCLUDED.obtained_marks, is_absent=EXCLUDED.is_absent`,
          [req.params.id, e.student_id, e.subject_id, e.obtained_marks||0, e.is_absent?1:0]
        );
      }
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
    res.json({ ok: true, saved: entries.length });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/exams/:id/result/:studentId
r.get("/:id/result/:studentId", async (req, res) => {
  try {
    const exam = await row(`
      SELECT e.*, c.name as class_name, c.section FROM exams e
      JOIN classes c ON c.id=e.class_id WHERE e.id=$1
    `,[req.params.id]);
    const student = await row("SELECT * FROM students WHERE id=$1",[req.params.studentId]);
    const marksRows = await rows(`
      SELECT m.*, s.name as subject_name, es.max_marks
      FROM marks m JOIN subjects s ON s.id=m.subject_id JOIN exam_subjects es ON es.exam_id=m.exam_id AND es.subject_id=m.subject_id
      WHERE m.exam_id=$1 AND m.student_id=$2
    `,[req.params.id, req.params.studentId]);
    const total_obtained = marksRows.reduce((a,m) => a + (m.is_absent ? 0 : Number(m.obtained_marks)), 0);
    const total_max      = marksRows.reduce((a,m) => a + Number(m.max_marks), 0);
    const pct   = total_max > 0 ? Math.round((total_obtained / total_max) * 100) : 0;
    const grade = pct>=90?"A+":pct>=80?"A":pct>=70?"B+":pct>=60?"B":pct>=50?"C":pct>=40?"D":"F";
    res.json({ exam, student, marks: marksRows, total_obtained, total_max, pct, grade });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default r;
