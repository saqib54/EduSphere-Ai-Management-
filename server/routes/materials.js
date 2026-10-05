import { Router } from "express";
import multer from "multer";
import { join, extname } from "path";
import { mkdirSync } from "fs";
import { rows, row, query, UPLOADS_PATH } from "../db.js";

const r = Router();
const materialsDir = join(UPLOADS_PATH, "materials");
mkdirSync(materialsDir, { recursive: true });

const ALLOWED = /pdf|doc|docx|ppt|pptx|mp4|mkv|zip|jpg|jpeg|png|txt/;
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, materialsDir),
  filename: (_req, file, cb) => cb(null, `mat-${Date.now()}${extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase().replace(".","");
    cb(null, ALLOWED.test(ext));
  },
});

// GET /api/materials?class_id=&subject_id=&teacher_id=
r.get("/", async (req, res) => {
  try {
    const { class_id, subject_id, teacher_id } = req.query;
    let sql = `
      SELECT m.*, s.name as subject_name, c.name as class_name, c.section, t.name as teacher_name
      FROM materials m
      LEFT JOIN subjects s ON s.id=m.subject_id
      LEFT JOIN classes  c ON c.id=m.class_id
      LEFT JOIN teachers t ON t.id=m.teacher_id
      WHERE 1=1
    `;
    const params = []; let i = 1;
    if (class_id)   { sql += ` AND m.class_id=$${i++}`;   params.push(class_id); }
    if (subject_id) { sql += ` AND m.subject_id=$${i++}`; params.push(subject_id); }
    if (teacher_id) { sql += ` AND m.teacher_id=$${i++}`; params.push(teacher_id); }
    sql += " ORDER BY m.uploaded_at DESC";
    res.json(await rows(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/materials (multipart)
r.post("/", upload.single("file"), async (req, res) => {
  try {
    const { title, subject_id, class_id, teacher_id, external_link } = req.body;
    const file_path = req.file ? req.file.filename : "external";
    const file_type = req.file ? extname(req.file.originalname).replace(".","") : "link";
    const file_size = req.file ? `${(req.file.size / 1024).toFixed(1)} KB` : null;
    const r2 = await row(
      "INSERT INTO materials(title,subject_id,class_id,teacher_id,file_path,file_type,file_size,external_link) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
      [title, subject_id||null, class_id||null, teacher_id||null, file_path, file_type, file_size, external_link||null]
    );
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/materials/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM materials WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
