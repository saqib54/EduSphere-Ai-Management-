import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/students?class_id=&status=&search=
r.get("/", async (req, res) => {
  try {
    const { class_id, status, search } = req.query;
    let sql = `
      SELECT s.*, c.name as class_name, c.section, c.grade
      FROM students s LEFT JOIN classes c ON c.id=s.class_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (class_id) { sql += ` AND s.class_id=$${i++}`; params.push(class_id); }
    if (status)   { sql += ` AND s.status=$${i++}`;   params.push(status); }
    if (search)   {
      sql += ` AND (s.name ILIKE $${i} OR s.student_id ILIKE $${i} OR s.father_name ILIKE $${i})`;
      params.push(`%${search}%`); i++;
    }
    sql += " ORDER BY s.name";
    res.json(await rows(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/students/:id
r.get("/:id", async (req, res) => {
  try {
    const student = await row(`
      SELECT s.*, c.name as class_name, c.section, c.grade
      FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.id=$1
    `, [req.params.id]);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/students
r.post("/", async (req, res) => {
  try {
    const { student_id, name, father_name, mother_name, cnic, dob, gender, address, phone, guardian_name, guardian_phone, guardian_cnic, class_id, roll_no, admission_date } = req.body;
    const cid = class_id ? parseInt(class_id) : null;
    const r2 = await row(
      `INSERT INTO students(student_id,name,father_name,mother_name,cnic,dob,gender,address,phone,guardian_name,guardian_phone,guardian_cnic,class_id,roll_no,admission_date)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
      [student_id,name,father_name||null,mother_name||null,cnic||null,dob||null,gender||"Male",address||null,phone||null,guardian_name||null,guardian_phone||null,guardian_cnic||null,cid,roll_no||null,admission_date||null]
    );
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/students/:id
r.put("/:id", async (req, res) => {
  try {
    const { name, father_name, mother_name, cnic, dob, gender, address, phone, guardian_name, guardian_phone, guardian_cnic, class_id, roll_no, admission_date, status } = req.body;
    const cid = class_id ? parseInt(class_id) : null;
    await query(
      `UPDATE students SET name=$1,father_name=$2,mother_name=$3,cnic=$4,dob=$5,gender=$6,address=$7,phone=$8,guardian_name=$9,guardian_phone=$10,guardian_cnic=$11,class_id=$12,roll_no=$13,admission_date=$14,status=$15 WHERE id=$16`,
      [name,father_name||null,mother_name||null,cnic||null,dob||null,gender||"Male",address||null,phone||null,guardian_name||null,guardian_phone||null,guardian_cnic||null,cid,roll_no||null,admission_date||null,status||"Active",req.params.id]
    );
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/students/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM students WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
