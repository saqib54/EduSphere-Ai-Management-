import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/financials/dashboard?year=
r.get("/dashboard", async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const [income, expenses, byMonth] = await Promise.all([
      row("SELECT SUM(amount) as total FROM challans WHERE status='Paid' AND year=$1",[year]),
      row("SELECT SUM(amount) as total FROM expenses WHERE EXTRACT(YEAR FROM date)=$1",[year]),
      rows(`
        SELECT ch.month, SUM(ch.amount) as collected, SUM(e.exp) as expenses
        FROM challans ch
        LEFT JOIN (SELECT TO_CHAR(date,'Month') as month, SUM(amount) as exp FROM expenses WHERE EXTRACT(YEAR FROM date)=$1 GROUP BY month) e
          ON TRIM(e.month)=ch.month
        WHERE ch.status='Paid' AND ch.year=$1
        GROUP BY ch.month ORDER BY MIN(ch.id)
      `,[year]),
    ]);
    res.json({
      totalIncome:   Number(income?.total   || 0),
      totalExpenses: Number(expenses?.total || 0),
      netProfit:     Number(income?.total || 0) - Number(expenses?.total || 0),
      byMonth,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/financials/expenses
r.get("/expenses", async (_req, res) => {
  try {
    res.json(await rows("SELECT * FROM expenses ORDER BY date DESC"));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/financials/expenses
r.post("/expenses", async (req, res) => {
  try {
    const { category, description, amount, date, recorded_by } = req.body;
    const r2 = await row(
      "INSERT INTO expenses(category,description,amount,date,recorded_by) VALUES($1,$2,$3,$4,$5) RETURNING id",
      [category, description||null, amount, date, recorded_by||null]
    );
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/financials/expenses/:id
r.put("/expenses/:id", async (req, res) => {
  try {
    const { category, description, amount, date } = req.body;
    await query("UPDATE expenses SET category=$1,description=$2,amount=$3,date=$4 WHERE id=$5",[category,description,amount,date,req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/financials/expenses/:id
r.delete("/expenses/:id", async (req, res) => {
  try {
    await query("DELETE FROM expenses WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/financials/salaries
r.get("/salaries", async (_req, res) => {
  try {
    const staff = await rows("SELECT * FROM teachers ORDER BY name");
    const records = staff.map(t => {
      const baseSalary = Number(t.salary || 0);
      const houseRent  = Math.round(baseSalary * 0.15);
      const medical    = Math.round(baseSalary * 0.05);
      return { ...t, baseSalary, houseRent, medical, grossSalary: baseSalary + houseRent + medical, status: "Paid" };
    });
    res.json(records);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default r;
