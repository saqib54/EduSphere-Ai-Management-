import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/academics
r.get("/", async (_req, res) => {
  try {
    const years = await rows(`
      SELECT ay.*, 
        (SELECT json_agg(t ORDER BY t.start_date) FROM terms t WHERE t.academic_year_id=ay.id) as terms
      FROM academic_years ay ORDER BY ay.start_date DESC
    `);
    res.json(years);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/academics
r.post("/", async (req, res) => {
  try {
    const { label, start_date, end_date } = req.body;
    const r2 = await row("INSERT INTO academic_years(label,start_date,end_date,is_active) VALUES($1,$2,$3,0) RETURNING id",[label,start_date,end_date]);
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/academics/:id
r.put("/:id", async (req, res) => {
  try {
    const { label, start_date, end_date } = req.body;
    await query("UPDATE academic_years SET label=$1,start_date=$2,end_date=$3 WHERE id=$4",[label,start_date,end_date,req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/academics/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM academic_years WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/academics/:id/activate
r.put("/:id/activate", async (req, res) => {
  try {
    await query("UPDATE academic_years SET is_active=0");
    await query("UPDATE academic_years SET is_active=1 WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/academics/terms
r.post("/terms", async (req, res) => {
  try {
    const { academic_year_id, name, start_date, end_date, status } = req.body;
    const r2 = await row("INSERT INTO terms(academic_year_id,name,start_date,end_date,status) VALUES($1,$2,$3,$4,$5) RETURNING id",[academic_year_id,name,start_date,end_date,status||"Upcoming"]);
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/academics/terms/:id
r.put("/terms/:id", async (req, res) => {
  try {
    const { name, start_date, end_date, status } = req.body;
    await query("UPDATE terms SET name=$1,start_date=$2,end_date=$3,status=$4 WHERE id=$5",[name,start_date,end_date,status,req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/academics/terms/:id
r.delete("/terms/:id", async (req, res) => {
  try {
    await query("DELETE FROM terms WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
