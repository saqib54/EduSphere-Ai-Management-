import { Router } from "express";
import multer from "multer";
import { join, extname } from "path";
import { mkdirSync } from "fs";
import { rows, row, query, UPLOADS_PATH } from "../db.js";
import pool from "../db.js";

const r = Router();

const proofsDir = join(UPLOADS_PATH, "proofs");
mkdirSync(proofsDir, { recursive: true });

const ALLOWED = /jpg|jpeg|png|pdf/;
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, proofsDir),
  filename: (_req, file, cb) => cb(null, `proof-${Date.now()}${extname(file.originalname)}`),
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = extname(file.originalname).toLowerCase().replace(".","");
    cb(null, ALLOWED.test(ext));
  },
});

// ── Fee Structures ────────────────────────────────────────────────────────────

r.get("/structures", async (req, res) => {
  try {
    const { class_id } = req.query;
    let sql = "SELECT fs.*, c.name as class_name, c.section FROM fee_structures fs JOIN classes c ON c.id=fs.class_id";
    const params = [];
    if (class_id) { sql += " WHERE fs.class_id=$1"; params.push(class_id); }
    res.json(await rows(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

r.post("/structures", async (req, res) => {
  try {
    const { class_id, label, amount, category, academic_year_id } = req.body;
    const r2 = await row(
      "INSERT INTO fee_structures(class_id,label,amount,category,academic_year_id) VALUES($1,$2,$3,$4,$5) RETURNING id",
      [class_id, label, amount, category||"Tuition", academic_year_id||null]
    );
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

r.put("/structures/:id", async (req, res) => {
  try {
    const { label, amount, category } = req.body;
    await query("UPDATE fee_structures SET label=$1,amount=$2,category=$3 WHERE id=$4",[label,amount,category,req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

r.delete("/structures/:id", async (req, res) => {
  try {
    await query("DELETE FROM fee_structures WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ── Challans ──────────────────────────────────────────────────────────────────

r.get("/challans", async (req, res) => {
  try {
    const { student_id, status, month, year } = req.query;
    let sql = `
      SELECT ch.*, s.name as student_name, s.student_id as stu_code, s.roll_no,
        c.name as class_name, c.section, c.grade,
        p.proof_status, p.proof_path, p.payment_date
      FROM challans ch
      JOIN students s ON s.id=ch.student_id
      JOIN classes  c ON c.id=ch.class_id
      LEFT JOIN payments p ON p.challan_id=ch.id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (student_id) { sql += ` AND ch.student_id=$${i++}`; params.push(student_id); }
    if (status)     { sql += ` AND ch.status=$${i++}`;     params.push(status); }
    if (month)      { sql += ` AND ch.month=$${i++}`;      params.push(month); }
    if (year)       { sql += ` AND ch.year=$${i++}`;       params.push(year); }
    sql += " ORDER BY ch.id DESC";
    res.json(await rows(sql, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

r.get("/challans/:id", async (req, res) => {
  try {
    const ch = await row(`
      SELECT ch.*, s.name as student_name, s.student_id as stu_code, s.father_name, s.roll_no,
        c.name as class_name, c.section, c.grade,
        p.proof_status, p.proof_path, p.payment_date, p.note as payment_note
      FROM challans ch
      JOIN students s ON s.id=ch.student_id JOIN classes c ON c.id=ch.class_id
      LEFT JOIN payments p ON p.challan_id=ch.id
      WHERE ch.id=$1
    `,[req.params.id]);
    if (!ch) return res.status(404).json({ error: "Challan not found" });
    const items = await rows("SELECT * FROM challan_items WHERE challan_id=$1",[req.params.id]);
    const settingsRows = await rows("SELECT key,value FROM settings");
    const settings = Object.fromEntries(settingsRows.map(s => [s.key, s.value]));
    res.json({ ...ch, items, settings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Generate challans for a class or specific students
r.post("/challans/generate", async (req, res) => {
  try {
    const { student_ids, class_id, month, year, due_date, notes } = req.body;
    const yearNum = parseInt(year);
    const results = [];

    let targetStudents = student_ids?.length
      ? student_ids
      : (await rows("SELECT id FROM students WHERE class_id=$1 AND status='Active'",[class_id])).map(s => s.id);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      for (const studentId of targetStudents) {
        const student = (await client.query("SELECT * FROM students WHERE id=$1",[studentId])).rows[0];
        if (!student) continue;
        const cid = class_id || student.class_id;
        const structures = (await client.query("SELECT * FROM fee_structures WHERE class_id=$1",[cid])).rows;
        if (!structures.length) continue;

        const totalAmount = structures.reduce((a,f) => a + Number(f.amount), 0);
        const challanNo = `CH-${String(yearNum).slice(-2)}${String(new Date().getMonth()+1).padStart(2,"0")}${String(studentId).padStart(3,"0")}`;

        const existing = (await client.query("SELECT id FROM challans WHERE challan_no=$1",[challanNo])).rows[0];
        if (existing) { results.push({ id: existing.id, challan_no: challanNo, skipped: true }); continue; }

        const ch = await client.query(
          "INSERT INTO challans(challan_no,student_id,class_id,month,year,amount,due_date,notes) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
          [challanNo, studentId, cid, month, yearNum, totalAmount, due_date, notes||null]
        );
        const challanId = ch.rows[0].id;
        for (const fs of structures) {
          await client.query("INSERT INTO challan_items(challan_id,label,amount) VALUES($1,$2,$3)",[challanId, fs.label, fs.amount]);
        }
        results.push({ id: challanId, challan_no: challanNo });
      }
      await client.query("COMMIT");
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
    res.json({ generated: results.length, challans: results });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

r.put("/challans/:id", async (req, res) => {
  try {
    const { due_date, notes, status } = req.body;
    await query("UPDATE challans SET due_date=$1,notes=$2,status=$3 WHERE id=$4",[due_date,notes,status,req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Upload payment proof
r.post("/challans/:id/proof", upload.single("proof"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded. Allowed: jpg, png, pdf" });
    const { note } = req.body;
    const filePath = req.file.filename;
    const challanId = req.params.id;
    const payment = await row("SELECT * FROM payments WHERE challan_id=$1",[challanId]);
    if (payment) {
      await query("UPDATE payments SET proof_path=$1,proof_status='Uploaded',note=$2 WHERE challan_id=$3",[filePath,note||null,challanId]);
    } else {
      const ch = await row("SELECT * FROM challans WHERE id=$1",[challanId]);
      await query("INSERT INTO payments(challan_id,student_id,amount,proof_path,proof_status,note) VALUES($1,$2,$3,$4,'Uploaded',$5)",
        [challanId, ch.student_id, ch.amount, filePath, note||null]);
    }
    await query("UPDATE challans SET status='Pending' WHERE id=$1 AND status='Overdue'",[challanId]);
    res.json({ ok: true, file: filePath });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Verify proof (Admin/Principal)
r.post("/challans/:id/verify", async (req, res) => {
  try {
    await query("UPDATE payments SET proof_status='Verified',payment_date=CURRENT_DATE WHERE challan_id=$1",[req.params.id]);
    await query("UPDATE challans SET status='Paid' WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Reject proof
r.post("/challans/:id/reject", async (req, res) => {
  try {
    await query("UPDATE payments SET proof_status='Rejected' WHERE challan_id=$1",[req.params.id]);
    await query("UPDATE challans SET status='Pending' WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// Fee summary stats
r.get("/summary", async (req, res) => {
  try {
    const { month, year } = req.query;
    let where = "WHERE 1=1";
    const params = [];
    let i = 1;
    if (month) { where += ` AND ch.month=$${i++}`; params.push(month); }
    if (year)  { where += ` AND ch.year=$${i++}`;  params.push(year); }
    const stats = await row(`
      SELECT
        SUM(ch.amount) as total_due,
        SUM(CASE WHEN ch.status='Paid'    THEN ch.amount ELSE 0 END) as collected,
        SUM(CASE WHEN ch.status='Pending' THEN ch.amount ELSE 0 END) as pending,
        SUM(CASE WHEN ch.status='Overdue' THEN ch.amount ELSE 0 END) as overdue,
        COUNT(*) as total_challans,
        SUM(CASE WHEN ch.status='Paid'    THEN 1 ELSE 0 END) as paid_count,
        SUM(CASE WHEN ch.status='Pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN ch.status='Overdue' THEN 1 ELSE 0 END) as overdue_count
      FROM challans ch ${where}
    `, params);
    res.json(stats);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/fees/ai-draft-notice
r.post("/ai-draft-notice", async (req, res) => {
  try {
    const { challan_id } = req.body;
    const ch = await row(`
      SELECT ch.*, s.name as student_name, s.father_name, s.phone as student_phone, s.guardian_phone, s.roll_no, s.student_id as stu_code,
        c.name as class_name, c.section
      FROM challans ch JOIN students s ON s.id=ch.student_id JOIN classes c ON c.id=ch.class_id
      WHERE ch.id=$1
    `, [challan_id]);
    if (!ch) return res.status(404).json({ error: "Challan not found" });

    const phone = ch.guardian_phone || ch.student_phone || "03000000000";
    const cleanPhone = phone.replace(/[^0-9]/g, "").replace(/^0/, "92");

    const message = `🏫 *EDUSPHERE SCHOOL & COLLEGE — FEE REMINDER NOTICE* 🏫\n\nDear Parent/Guardian of *${ch.student_name}* (Class ${ch.class_name} ${ch.section}, Roll: ${ch.roll_no || ch.stu_code}),\n\nThis is a gentle reminder regarding the monthly tuition fee challan for *${ch.month} ${ch.year}*.\n\n📌 *Challan Details:*\n- *Challan No:* ${ch.challan_no}\n- *Total Amount:* PKR ${Number(ch.amount || 0).toLocaleString("en-PK")}\n- *Due Date:* ${ch.due_date}\n- *Current Status:* ${ch.status}\n\n💳 *Online Bank Payment Options:*\n- *Bank Name:* Meezan Bank\n- *Account Title:* EduSphere School & College\n- *Account No:* 02340107123456\n- *IBAN:* PK36MEZN0002340107123456\n\nPlease submit the payment receipt on the parent portal before the due date to avoid late payment surcharges.\n\nThank you for your cooperation.\n*EduSphere Finance Department*\nPh: 052 1234567 | Email: admin@edusphere.edu.pk`;

    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

    res.json({
      challan_id,
      student_name: ch.student_name,
      phone: phone,
      formatted_message: message,
      whatsapp_url: waUrl
    });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
