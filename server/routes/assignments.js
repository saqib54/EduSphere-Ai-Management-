import { Router } from "express";
import multer from "multer";
import { join, extname } from "path";
import { mkdirSync } from "fs";
import { rows, row, query, UPLOADS_PATH } from "../db.js";

const r = Router();

const submissionsDir = join(UPLOADS_PATH, "submissions");
mkdirSync(submissionsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, submissionsDir),
  filename: (_req, file, cb) => cb(null, `sub-${Date.now()}${extname(file.originalname)}`),
});
const ALLOWED_TYPES = /pdf|doc|docx|ppt|pptx|xls|xlsx|zip|jpg|jpeg|png/;
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase().replace(".","");
    cb(null, ALLOWED_TYPES.test(ext));
  },
});

// GET /api/assignments?class_id=&teacher_id=&subject_id=&status=
r.get("/", async (req, res) => {
  try {
    const { class_id, teacher_id, subject_id, status } = req.query;
    let sql = `
      SELECT a.*, s.name as subject_name, c.name as class_name, c.section, t.name as teacher_name,
        (SELECT COUNT(*) FROM submissions sub WHERE sub.assignment_id=a.id) as submission_count,
        (SELECT COUNT(*) FROM submissions sub WHERE sub.assignment_id=a.id AND sub.marks IS NULL) as ungraded
      FROM assignments a
      LEFT JOIN subjects s ON s.id=a.subject_id
      LEFT JOIN classes  c ON c.id=a.class_id
      LEFT JOIN teachers t ON t.id=a.teacher_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (class_id)   { sql += ` AND a.class_id=$${i++}`;   params.push(class_id); }
    if (teacher_id) { sql += ` AND a.teacher_id=$${i++}`; params.push(teacher_id); }
    if (subject_id) { sql += ` AND a.subject_id=$${i++}`; params.push(subject_id); }
    if (status)     { sql += ` AND a.status=$${i++}`;     params.push(status); }
    sql += " ORDER BY a.due_date DESC";
    res.json(await rows(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/assignments
r.post("/", async (req, res) => {
  try {
    const { title, subject_id, class_id, teacher_id, due_date, total_marks, instructions, external_link } = req.body;
    const r2 = await row(
      "INSERT INTO assignments(title,subject_id,class_id,teacher_id,due_date,total_marks,instructions,external_link) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
      [title,subject_id||null,class_id||null,teacher_id||null,due_date,total_marks||20,instructions||null,external_link||null]
    );
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/assignments/:id
r.put("/:id", async (req, res) => {
  try {
    const { title, subject_id, class_id, teacher_id, due_date, total_marks, instructions, status, external_link } = req.body;
    await query("UPDATE assignments SET title=$1,subject_id=$2,class_id=$3,teacher_id=$4,due_date=$5,total_marks=$6,instructions=$7,status=$8,external_link=$9 WHERE id=$10",
      [title,subject_id,class_id,teacher_id,due_date,total_marks,instructions,status||"Active",external_link,req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/assignments/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM assignments WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/assignments/:id/submissions
r.get("/:id/submissions", async (req, res) => {
  try {
    const subs = await rows(`
      SELECT sub.*, s.name as student_name, s.roll_no, s.student_id as stu_code
      FROM submissions sub JOIN students s ON s.id=sub.student_id
      WHERE sub.assignment_id=$1 ORDER BY sub.submitted_at DESC
    `,[req.params.id]);
    res.json(subs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/assignments/:id/submissions  (multipart)
r.post("/:id/submissions", upload.single("file"), async (req, res) => {
  try {
    const { student_id, note, external_link } = req.body;
    const file_path = req.file ? req.file.filename : null;
    if (!file_path && !external_link) return res.status(400).json({ error: "File or link required" });
    await query(
      `INSERT INTO submissions(assignment_id,student_id,file_path,external_link,note)
       VALUES($1,$2,$3,$4,$5)
       ON CONFLICT(assignment_id,student_id) DO UPDATE SET file_path=EXCLUDED.file_path,external_link=EXCLUDED.external_link,note=EXCLUDED.note,submitted_at=NOW()`,
      [req.params.id, student_id, file_path, external_link||null, note||null]
    );
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/assignments/:id/submissions/:subId/grade
r.put("/:id/submissions/:subId/grade", async (req, res) => {
  try {
    const { marks, comment } = req.body;
    await query("UPDATE submissions SET marks=$1,comment=$2 WHERE id=$3",[marks, comment||null, req.params.subId]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
