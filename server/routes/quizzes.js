import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/quizzes?class_id=&teacher_id=&student_id=
r.get("/", async (req, res) => {
  try {
    const { class_id, teacher_id, student_id } = req.query;
    let sql = `
      SELECT q.*, s.name as subject_name, c.name as class_name, c.section, t.name as teacher_name,
        (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id=q.id) as question_count,
        (SELECT COUNT(*) FROM quiz_attempts WHERE quiz_id=q.id) as attempt_count
      FROM quizzes q
      LEFT JOIN subjects  s ON s.id=q.subject_id
      LEFT JOIN classes   c ON c.id=q.class_id
      LEFT JOIN teachers  t ON t.id=q.teacher_id
      WHERE 1=1
    `;
    const params = [];
    let i = 1;
    if (class_id)   { sql += ` AND q.class_id=$${i++}`;   params.push(class_id); }
    if (teacher_id) { sql += ` AND q.teacher_id=$${i++}`; params.push(teacher_id); }
    sql += " ORDER BY q.created_at DESC";
    const quizzes = await rows(sql, params);

    if (student_id) {
      const attempted = await rows("SELECT quiz_id, score, total FROM quiz_attempts WHERE student_id=$1",[student_id]);
      const aMap = Object.fromEntries(attempted.map(a => [a.quiz_id, a]));
      return res.json(quizzes.map(q => ({ ...q, attempt: aMap[q.id] || null })));
    }
    res.json(quizzes);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/quizzes
r.post("/", async (req, res) => {
  try {
    const { title, class_id, subject_id, teacher_id, duration_minutes, instructions, status } = req.body;
    const r2 = await row(
      "INSERT INTO quizzes(title,class_id,subject_id,teacher_id,duration_minutes,instructions,status) VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING id",
      [title, class_id, subject_id||null, teacher_id, duration_minutes||20, instructions||null, status||"Draft"]
    );
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/quizzes/:id/status
r.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await query("UPDATE quizzes SET status=$1 WHERE id=$2",[status, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/quizzes/:id
r.delete("/:id", async (req, res) => {
  try {
    await query("DELETE FROM quizzes WHERE id=$1",[req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/quizzes/:id/questions
r.get("/:id/questions", async (req, res) => {
  try {
    res.json(await rows("SELECT * FROM quiz_questions WHERE quiz_id=$1 ORDER BY id",[req.params.id]));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/quizzes/:id/questions
r.post("/:id/questions", async (req, res) => {
  try {
    const { question_text, option_a, option_b, option_c, option_d, correct_answer, marks } = req.body;
    const r2 = await row(
      "INSERT INTO quiz_questions(quiz_id,question_text,option_a,option_b,option_c,option_d,correct_answer,marks) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id",
      [req.params.id, question_text, option_a, option_b, option_c, option_d, correct_answer, marks||1]
    );
    const total = await row("SELECT SUM(marks) as t FROM quiz_questions WHERE quiz_id=$1",[req.params.id]);
    await query("UPDATE quizzes SET total_marks=$1 WHERE id=$2",[total?.t||0, req.params.id]);
    res.json({ id: r2.id });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/quizzes/:id/questions/:qid
r.delete("/:id/questions/:qid", async (req, res) => {
  try {
    await query("DELETE FROM quiz_questions WHERE id=$1 AND quiz_id=$2",[req.params.qid, req.params.id]);
    const total = await row("SELECT SUM(marks) as t FROM quiz_questions WHERE quiz_id=$1",[req.params.id]);
    await query("UPDATE quizzes SET total_marks=$1 WHERE id=$2",[total?.t||0, req.params.id]);
    res.json({ ok: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/quizzes/:id/attempt
r.post("/:id/attempt", async (req, res) => {
  try {
    const { student_id, answers, tab_switch_count, violation_reason } = req.body;
    const quizId = req.params.id;
    const existing = await row("SELECT id FROM quiz_attempts WHERE quiz_id=$1 AND student_id=$2",[quizId, student_id]);
    if (existing) return res.status(409).json({ error: "Already attempted" });

    const questions = await rows("SELECT * FROM quiz_questions WHERE quiz_id=$1",[quizId]);
    const qMap = Object.fromEntries(questions.map(q => [q.id, q]));
    const totalMarks = questions.reduce((a,q) => a + Number(q.marks), 0);

    const attemptR = await row(
      "INSERT INTO quiz_attempts(quiz_id,student_id,score,total,is_graded,tab_switch_count,violation_reason) VALUES($1,$2,0,$3,1,$4,$5) RETURNING id",
      [quizId, student_id, totalMarks, tab_switch_count||0, violation_reason||null]
    );
    const attemptId = attemptR.id;
    let score = 0;
    for (const { question_id, selected } of (answers || [])) {
      const q = qMap[question_id];
      if (!q) continue;
      const isCorrect = selected === q.correct_answer ? 1 : 0;
      if (isCorrect) score += Number(q.marks);
      await query("INSERT INTO quiz_answers(attempt_id,question_id,selected_answer,is_correct) VALUES($1,$2,$3,$4)",
        [attemptId, question_id, selected||null, isCorrect]);
    }
    await query("UPDATE quiz_attempts SET score=$1 WHERE id=$2",[score, attemptId]);
    res.json({ id: attemptId, score, total: totalMarks });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// GET /api/quizzes/:id/results
r.get("/:id/results", async (req, res) => {
  try {
    const quiz = await row(`
      SELECT q.*, s.name as subject_name, c.name as class_name, c.section
      FROM quizzes q LEFT JOIN subjects s ON s.id=q.subject_id LEFT JOIN classes c ON c.id=q.class_id
      WHERE q.id=$1
    `,[req.params.id]);
    const attempts = await rows(`
      SELECT qa.*, st.name as student_name, st.roll_no, st.student_id as stu_code
      FROM quiz_attempts qa JOIN students st ON st.id=qa.student_id
      WHERE qa.quiz_id=$1 ORDER BY qa.score DESC
    `,[req.params.id]);
    const questions = await rows("SELECT * FROM quiz_questions WHERE quiz_id=$1 ORDER BY id",[req.params.id]);
    res.json({ quiz, attempts, questions });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/quizzes/:id/attempt/:student_id
// FIX: returns null instead of 404 when no attempt
r.get("/:id/attempt/:student_id", async (req, res) => {
  try {
    const attempt = await row("SELECT * FROM quiz_attempts WHERE quiz_id=$1 AND student_id=$2",
      [req.params.id, req.params.student_id]);
    if (!attempt) return res.json(null);  // Fixed: was returning 404
    const answers = await rows(`
      SELECT qa.*, qq.question_text, qq.option_a, qq.option_b, qq.option_c, qq.option_d, qq.correct_answer, qq.marks
      FROM quiz_answers qa JOIN quiz_questions qq ON qq.id=qa.question_id WHERE qa.attempt_id=$1
    `,[attempt.id]);
    res.json({ attempt, answers });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/quizzes/:id/generate-ai
r.post("/:id/generate-ai", async (req, res) => {
  try {
    const { topic } = req.body;
    const quizId = req.params.id;
    const topicText = topic || "General Science & Mathematics";

    const AI_QUESTIONS_BANK = {
      algebra: [
        ["What is the value of x in: 3x - 5 = 10?", "x = 3", "x = 4", "x = 5", "x = 6", "C", 2],
        ["If f(x) = 2x + 3, what is f(4)?", "7", "9", "11", "13", "C", 2],
        ["Simplify: (x + 2)(x - 2)", "x² - 4", "x² + 4", "x² - 2x", "x² + 4x + 4", "A", 2],
        ["What is the slope of y = 5x + 7?", "7", "5", "-5", "1/5", "B", 2],
        ["Solve for x: x/2 + 4 = 10", "x = 8", "x = 10", "x = 12", "x = 14", "C", 2]
      ],
      physics: [
        ["What is the SI unit of Force?", "Joule", "Watt", "Newton", "Pascal", "C", 2],
        ["Which law states that F = ma?", "First Law", "Second Law", "Third Law", "Law of Gravity", "B", 2],
        ["What is the speed of light in vacuum?", "3 x 10^8 m/s", "3 x 10^6 m/s", "1.5 x 10^8 m/s", "300,000 m/s", "A", 2],
        ["Acceleration due to gravity on Earth is approximately:", "9.8 m/s²", "8.9 m/s²", "10.8 m/s²", "9.8 km/s²", "A", 2],
        ["Kinetic energy is given by which formula?", "mgh", "1/2 mv²", "F x d", "P x t", "B", 2]
      ],
      default: [
        [`In ${topicText}, what is the primary foundational concept?`, "Linear Structure", "Core Theory", "Experimental Method", "Logical Proof", "B", 2],
        [`Which method is standard when evaluating ${topicText}?`, "Statistical Analysis", "Observation", "Hypothesis Testing", "Systematic Review", "C", 2],
        [`What is a key property of ${topicText}?`, "High Efficiency", "Constancy", "Adaptability", "All of the above", "D", 2],
        [`In practical applications of ${topicText}, what is optimized?`, "Resource Cost", "Performance & Accuracy", "Processing Time", "Storage Capacity", "B", 2],
        [`What is the main objective when studying ${topicText}?`, "Memorization", "Deep Conceptual Understanding", "Rote Learning", "Speed Only", "B", 2]
      ]
    };

    const key = Object.keys(AI_QUESTIONS_BANK).find(k => topicText.toLowerCase().includes(k)) || "default";
    const questions = AI_QUESTIONS_BANK[key];

    for (const [qt, a, b, c, d, ans, marks] of questions) {
      await query(
        "INSERT INTO quiz_questions(quiz_id,question_text,option_a,option_b,option_c,option_d,correct_answer,marks) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
        [quizId, qt, a, b, c, d, ans, marks]
      );
    }
    const total = await row("SELECT SUM(marks) as t FROM quiz_questions WHERE quiz_id=$1", [quizId]);
    await query("UPDATE quizzes SET total_marks=$1 WHERE id=$2", [total?.t || 0, quizId]);
    res.json({ success: true, count: questions.length, total_marks: total?.t || 0 });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

export default r;
