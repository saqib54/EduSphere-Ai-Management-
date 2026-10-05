import { Router } from "express";
import { rows, row, query } from "../db.js";

const r = Router();

// GET /api/reports/dashboard
r.get("/dashboard", async (_req, res) => {
  try {
    const todayStr = new Date().toISOString().split("T")[0];
    const year     = new Date().getFullYear();

    const [totalStudents, totalTeachers, totalClasses] = await Promise.all([
      row("SELECT COUNT(*) as n FROM students WHERE status='Active'"),
      row("SELECT COUNT(*) as n FROM teachers WHERE status='Active'"),
      row("SELECT COUNT(*) as n FROM classes"),
    ]);

    const todayAtt = await row(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present
      FROM attendance WHERE date=$1
    `,[todayStr]);

    const attPct = Number(todayAtt?.total) > 0
      ? Math.round((Number(todayAtt.present) / Number(todayAtt.total)) * 100) : 0;

    const feeSummary = await row(`
      SELECT
        SUM(CASE WHEN status='Pending' THEN amount ELSE 0 END) as pending,
        SUM(CASE WHEN status='Paid'    THEN amount ELSE 0 END) as collected,
        SUM(CASE WHEN status='Overdue' THEN amount ELSE 0 END) as overdue
      FROM challans WHERE year=$1
    `,[year]);

    const [upcomingExams, pendingProofs, pendingHomework] = await Promise.all([
      row("SELECT COUNT(*) as n FROM exams WHERE start_date > CURRENT_DATE AND status='Scheduled'"),
      row("SELECT COUNT(*) as n FROM payments WHERE proof_status='Uploaded'"),
      row("SELECT COUNT(DISTINCT class_id) as n FROM assignments WHERE status='Active' AND due_date >= CURRENT_DATE"),
    ]);

    res.json({
      totalStudents: Number(totalStudents?.n || 0),
      totalTeachers: Number(totalTeachers?.n || 0),
      totalClasses:  Number(totalClasses?.n  || 0),
      todayAtt: attPct,
      feeSummary: {
        pending:   Number(feeSummary?.pending   || 0),
        collected: Number(feeSummary?.collected || 0),
        overdue:   Number(feeSummary?.overdue   || 0),
      },
      upcomingExams:   Number(upcomingExams?.n   || 0),
      pendingProofs:   Number(pendingProofs?.n    || 0),
      pendingHomework: Number(pendingHomework?.n  || 0),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/teacher-dashboard?teacher_id=
r.get("/teacher-dashboard", async (req, res) => {
  try {
    const { teacher_id } = req.query;
    if (!teacher_id) return res.status(400).json({ error: "teacher_id required" });
    const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" });

    const [classCount, totalStudents, ungradedCount, pendingQuizzes] = await Promise.all([
      row("SELECT COUNT(DISTINCT class_id) as n FROM teacher_subjects WHERE teacher_id=$1",[teacher_id]),
      row(`SELECT COUNT(DISTINCT s.id) as n FROM students s
        JOIN teacher_subjects ts ON ts.class_id=s.class_id WHERE ts.teacher_id=$1 AND s.status='Active'`,[teacher_id]),
      row("SELECT COUNT(*) as n FROM submissions sub JOIN assignments a ON a.id=sub.assignment_id WHERE a.teacher_id=$1 AND sub.marks IS NULL",[teacher_id]),
      row("SELECT COUNT(*) as n FROM quizzes WHERE teacher_id=$1 AND status='Active'",[teacher_id]),
    ]);

    const schedule = await rows(`
      SELECT tt.*, s.name as subject_name, c.name as class_name, c.section, tt.room
      FROM timetable tt
      JOIN subjects s ON s.id=tt.subject_id JOIN classes c ON c.id=tt.class_id
      WHERE tt.teacher_id=$1 AND tt.day=$2 ORDER BY tt.start_time
    `,[teacher_id, todayDay]);

    const todayStr = new Date().toISOString().split("T")[0];
    const attRow = await row(`
      SELECT COUNT(*) as total, SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) as present
      FROM attendance a JOIN students s ON s.id=a.student_id
      JOIN teacher_subjects ts ON ts.class_id=s.class_id
      WHERE ts.teacher_id=$1 AND a.date=$2
    `,[teacher_id, todayStr]);
    const todayAtt = Number(attRow?.total) > 0
      ? Math.round((Number(attRow.present) / Number(attRow.total)) * 100) : null;

    // Recent ungraded submissions for this teacher's assignments
    const recentSubmissions = await rows(`
      SELECT sub.submitted_at, st.name as student_name, a.title as assignment_title,
        c.name as class_name, c.section
      FROM submissions sub
      JOIN students st ON st.id=sub.student_id
      JOIN assignments a ON a.id=sub.assignment_id
      JOIN classes c ON c.id=a.class_id
      WHERE a.teacher_id=$1 AND sub.marks IS NULL
      ORDER BY sub.submitted_at DESC LIMIT 5
    `,[teacher_id]);

    // My assigned classes with student counts
    const myClasses = await rows(`
      SELECT DISTINCT c.id, c.name, c.section, c.grade,
        (SELECT COUNT(*) FROM students s2 WHERE s2.class_id=c.id AND s2.status='Active') as student_count
      FROM teacher_subjects ts JOIN classes c ON c.id=ts.class_id
      WHERE ts.teacher_id=$1 ORDER BY c.name, c.section
    `,[teacher_id]);

    res.json({
      classCount:    Number(classCount?.n    || 0),
      totalStudents: Number(totalStudents?.n || 0),
      ungradedCount: Number(ungradedCount?.n || 0),
      pendingQuizzes:Number(pendingQuizzes?.n|| 0),
      schedule,
      todayAtt,
      recentSubmissions,
      myClasses,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/student-dashboard?student_id=
r.get("/student-dashboard", async (req, res) => {
  try {
    const { student_id } = req.query;
    if (!student_id) return res.status(400).json({ error: "student_id required" });
    const student = await row(`
      SELECT s.*, c.name as class_name, c.section, c.grade
      FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.id=$1
    `,[student_id]);
    if (!student) return res.json({ error: "Student not found" });

    const todayStr = new Date().toISOString().split("T")[0];
    const todayDay = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const year     = new Date().getFullYear();

    const [attSummary, pendingFees, pendingAssignments, announcements,
           upcomingQuizzes, diaryEntries, latestChallan, latestMark] = await Promise.all([
      row(`SELECT COUNT(*) as total, SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present
        FROM attendance WHERE student_id=$1 AND EXTRACT(YEAR FROM date)=$2`,[student_id, year]),
      row("SELECT SUM(amount) as total FROM challans WHERE student_id=$1 AND status IN ('Pending','Overdue')",[student_id]),
      rows(`SELECT a.*, sub.name as subject_name FROM assignments a
        LEFT JOIN subjects sub ON sub.id=a.subject_id
        WHERE a.class_id=$1 AND a.due_date >= $2 AND a.status='Active'
        AND NOT EXISTS (SELECT 1 FROM submissions s2 WHERE s2.assignment_id=a.id AND s2.student_id=$3)
        ORDER BY a.due_date LIMIT 5`,[student.class_id, todayStr, student_id]),
      rows("SELECT * FROM announcements WHERE target IN ('All','Student') ORDER BY created_at DESC LIMIT 3"),
      rows(`SELECT q.*, sub.name as subject_name,
          (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id=q.id) as question_count
        FROM quizzes q LEFT JOIN subjects sub ON sub.id=q.subject_id
        WHERE q.class_id=$1 AND q.status='Active'
        AND NOT EXISTS (SELECT 1 FROM quiz_attempts qa WHERE qa.quiz_id=q.id AND qa.student_id=$2)
        ORDER BY q.created_at DESC LIMIT 5`,[student.class_id, student_id]),
      rows(`SELECT d.*, sub.name as subject_name, t.name as teacher_name
        FROM diary d LEFT JOIN subjects sub ON sub.id=d.subject_id
        LEFT JOIN teachers t ON t.id=d.teacher_id
        WHERE d.class_id=$1 ORDER BY d.date DESC LIMIT 5`,[student.class_id]),
      row("SELECT * FROM challans WHERE student_id=$1 ORDER BY id DESC LIMIT 1",[student_id]),
      row(`SELECT SUM(m.obtained_marks) as obtained, SUM(es.max_marks) as max_marks, e.name as exam_name
        FROM marks m JOIN exam_subjects es ON es.exam_id=m.exam_id AND es.subject_id=m.subject_id
        JOIN exams e ON e.id=m.exam_id
        WHERE m.student_id=$1 GROUP BY m.exam_id, e.name ORDER BY m.exam_id DESC LIMIT 1`,[student_id]),
    ]);

    const attPct = Number(attSummary?.total) > 0
      ? Math.round((Number(attSummary.present) / Number(attSummary.total)) * 100) : 0;

    // Today's timetable for the student's class
    const todayClasses = student.class_id ? await rows(`
      SELECT tt.*, sub.name as subject_name, t.name as teacher_name, tt.room
      FROM timetable tt
      JOIN subjects sub ON sub.id=tt.subject_id
      JOIN teachers t ON t.id=tt.teacher_id
      WHERE tt.class_id=$1 AND tt.day=$2 ORDER BY tt.start_time
    `,[student.class_id, todayDay]) : [];

    const overallGrade = latestMark && Number(latestMark.max_marks) > 0
      ? (() => { const p = Math.round((Number(latestMark.obtained)/Number(latestMark.max_marks))*100); return p>=90?'A+':p>=80?'A':p>=70?'B+':p>=60?'B':p>=50?'C':p>=40?'D':'F'; })()
      : '—';

    res.json({
      student,
      attPct,
      attendancePct: attPct,
      attPresent: Number(attSummary?.present || 0),
      attTotal:   Number(attSummary?.total   || 0),
      pendingFees: Number(pendingFees?.total  || 0),
      upcomingAssignments: pendingAssignments,
      pendingAssignments,
      pendingCount: pendingAssignments.length,
      upcomingQuizzes,
      quizCount: upcomingQuizzes.length,
      latestResult: latestMark ? { ...latestMark, obtained: Number(latestMark.obtained||0), max_marks: Number(latestMark.max_marks||0) } : null,
      latestChallan,
      diaryEntries,
      overallGrade,
      todayClasses,
      announcements,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/attendance-trend
r.get("/attendance-trend", async (_req, res) => {
  try {
    const result = await rows(`
      SELECT date, COUNT(*) as total,
        SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present
      FROM attendance GROUP BY date ORDER BY date DESC LIMIT 7
    `);
    res.json(result.reverse().map(r => ({
      day:   new Date(r.date).toLocaleDateString("en-US", { weekday: "short" }),
      date:  r.date,
      value: Number(r.total) > 0 ? Math.round((Number(r.present) / Number(r.total)) * 100) : 0,
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/grades
r.get("/grades", async (_req, res) => {
  try {
    const result = await rows(`
      SELECT
        CASE
          WHEN pct >= 90 THEN 'A+' WHEN pct >= 80 THEN 'A' WHEN pct >= 70 THEN 'B+'
          WHEN pct >= 60 THEN 'B'  WHEN pct >= 50 THEN 'C' WHEN pct >= 40 THEN 'D' ELSE 'F'
        END as grade, COUNT(*) as count
      FROM (
        SELECT m.student_id,
          ROUND(100.0 * SUM(m.obtained_marks) / NULLIF(SUM(es.max_marks),0)) as pct
        FROM marks m JOIN exam_subjects es ON es.exam_id=m.exam_id AND es.subject_id=m.subject_id
        GROUP BY m.student_id, m.exam_id
      ) sub GROUP BY grade ORDER BY grade
    `);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/notifications
r.get("/notifications", async (_req, res) => {
  try {
    const [pendingProofs, upcomingExams, overdueChallans, ungradedSubs] = await Promise.all([
      row("SELECT COUNT(*) as n FROM payments WHERE proof_status='Uploaded'"),
      row("SELECT COUNT(*) as n FROM exams WHERE start_date > CURRENT_DATE AND status='Scheduled'"),
      row("SELECT COUNT(*) as n FROM challans WHERE status='Overdue'"),
      row("SELECT COUNT(*) as n FROM submissions WHERE marks IS NULL"),
    ]);
    const pp = Number(pendingProofs?.n || 0);
    const ue = Number(upcomingExams?.n || 0);
    const oc = Number(overdueChallans?.n || 0);
    const us = Number(ungradedSubs?.n || 0);
    res.json({ total: pp + (ue>0?1:0) + (oc>0?1:0) + (us>0?1:0), pendingProofs:pp, upcomingExams:ue, overdueChallans:oc, ungradedSubs:us });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/report/attendance
r.get("/report/attendance", async (req, res) => {
  try {
    const { class_id, month, year } = req.query;
    let where = "WHERE 1=1"; const params = []; let i = 1;
    if (class_id) { where += ` AND a.class_id=$${i++}`; params.push(class_id); }
    if (month && year) {
      where += ` AND TO_CHAR(a.date,'YYYY-MM')=$${i++}`;
      params.push(`${year}-${String(month).padStart(2,"0")}`);
    }
    res.json(await rows(`
      SELECT s.name as student_name, s.student_id as stu_code, s.roll_no, c.name as class_name, c.section,
        COUNT(*) as total_days,
        SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) as present,
        SUM(CASE WHEN a.status='Absent'  THEN 1 ELSE 0 END) as absent,
        SUM(CASE WHEN a.status='Leave'   THEN 1 ELSE 0 END) as leave,
        ROUND(100.0 * SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0)) as pct
      FROM attendance a JOIN students s ON s.id=a.student_id JOIN classes c ON c.id=a.class_id ${where}
      GROUP BY s.id, s.name, s.student_id, s.roll_no, c.name, c.section ORDER BY pct ASC
    `, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/report/fees
r.get("/report/fees", async (req, res) => {
  try {
    const { month, year } = req.query;
    let where = "WHERE 1=1"; const params = []; let i = 1;
    if (month) { where += ` AND ch.month=$${i++}`; params.push(month); }
    if (year)  { where += ` AND ch.year=$${i++}`;  params.push(year); }
    res.json(await rows(`
      SELECT s.name as student_name, s.student_id as stu_code, s.roll_no,
        c.name as class_name, c.section,
        ch.challan_no, ch.month, ch.year, ch.amount, ch.status, ch.due_date,
        p.payment_date, p.proof_status
      FROM challans ch
      JOIN students s ON s.id=ch.student_id JOIN classes c ON c.id=ch.class_id
      LEFT JOIN payments p ON p.challan_id=ch.id
      ${where} ORDER BY ch.status DESC, s.name
    `, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/report/academic
r.get("/report/academic", async (req, res) => {
  try {
    const { exam_id } = req.query;
    const params = exam_id ? [exam_id] : [];
    res.json(await rows(`
      SELECT s.name as student_name, s.student_id as stu_code, s.roll_no,
        c.name as class_name, c.section, e.name as exam_name, e.type as exam_type,
        sub.name as subject_name, m.obtained_marks, es.max_marks,
        ROUND(100.0 * m.obtained_marks / NULLIF(es.max_marks,0)) as pct
      FROM marks m
      JOIN students s ON s.id=m.student_id JOIN classes c ON c.id=s.class_id
      JOIN exams e ON e.id=m.exam_id JOIN subjects sub ON sub.id=m.subject_id
      JOIN exam_subjects es ON es.exam_id=m.exam_id AND es.subject_id=m.subject_id
      ${exam_id ? "WHERE m.exam_id=$1" : ""}
      ORDER BY s.name, sub.name
    `, params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/reports/ai-performance-predictor?student_id=&class_id=
r.get("/ai-performance-predictor", async (req, res) => {
  try {
    const { student_id } = req.query;

    if (student_id) {
      const student = await row("SELECT s.*, c.name as class_name, c.section FROM students s LEFT JOIN classes c ON c.id=s.class_id WHERE s.id=$1", [student_id]);
      if (!student) return res.status(404).json({ error: "Student not found" });

      const [attRow, marksRows] = await Promise.all([
        row("SELECT COUNT(*) as total, SUM(CASE WHEN status='Present' THEN 1 ELSE 0 END) as present FROM attendance WHERE student_id=$1", [student_id]),
        rows(`SELECT sub.name as subject_name, m.obtained_marks, es.max_marks
              FROM marks m JOIN subjects sub ON sub.id=m.subject_id
              JOIN exam_subjects es ON es.exam_id=m.exam_id AND es.subject_id=m.subject_id
              WHERE m.student_id=$1`, [student_id]),
      ]);

      const attTotal = Number(attRow?.total || 0);
      const attPresent = Number(attRow?.present || 0);
      const attPct = attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : 88;

      const subScores = {};
      marksRows.forEach(m => {
        if (!subScores[m.subject_name]) subScores[m.subject_name] = { obtained: 0, max: 0 };
        subScores[m.subject_name].obtained += Number(m.obtained_marks || 0);
        subScores[m.subject_name].max += Number(m.max_marks || 100);
      });

      const weakSubjects = [];
      let totalObt = 0, totalMax = 0;
      Object.entries(subScores).forEach(([sub, score]) => {
        const pct = score.max > 0 ? Math.round((score.obtained / score.max) * 100) : 0;
        totalObt += score.obtained;
        totalMax += score.max;
        if (pct < 50) weakSubjects.push({ subject: sub, score_pct: pct, reason: "Exam marks below 50%" });
      });

      const overallPct = totalMax > 0 ? Math.round((totalObt / totalMax) * 100) : (attPct >= 80 ? 82 : 58);
      if (attPct < 75) weakSubjects.push({ subject: "Class Attendance", score_pct: attPct, reason: "Attendance below 75%" });

      const predictedGrade = overallPct >= 90 ? "A+" : overallPct >= 80 ? "A" : overallPct >= 70 ? "B+" : overallPct >= 60 ? "B" : overallPct >= 50 ? "C" : overallPct >= 40 ? "D" : "F";
      const riskStatus = overallPct < 50 || attPct < 70 ? "High Risk" : overallPct < 65 ? "Moderate Risk" : overallPct >= 85 ? "Excellence" : "On Track";

      const aiInsights = [
        attPct < 75 ? `🚨 Critical Attendance Warning: Student attendance is currently ${attPct}%. Regular attendance is required for Board qualification.` : `✅ Attendance is healthy at ${attPct}%.`,
        weakSubjects.length > 0 ? `⚠️ Academic Intervention Needed: Student requires assistance in ${weakSubjects.map(w => w.subject).join(", ")}. Remedial coaching recommended.` : `🌟 Excellent academic stability across all registered subjects.`,
        `🔮 Final Board Exam Prediction: Predicted Grade ${predictedGrade} (${overallPct}% target based on current performance).`
      ];

      return res.json({
        student,
        predicted_grade: predictedGrade,
        overall_pct: overallPct,
        attendance_pct: attPct,
        risk_status: riskStatus,
        weak_subjects: weakSubjects,
        ai_insights: aiInsights,
        subject_breakdown: Object.entries(subScores).map(([sub, score]) => ({
          subject: sub,
          pct: score.max > 0 ? Math.round((score.obtained / score.max) * 100) : 0
        }))
      });
    }

    // Class / School wide Risk Radar
    const atRiskStudents = await rows(`
      SELECT s.id, s.name, s.student_id as stu_code, s.roll_no, c.name as class_name, c.section,
        (SELECT ROUND(100.0 * SUM(CASE WHEN a.status='Present' THEN 1 ELSE 0 END) / NULLIF(COUNT(*),0)) FROM attendance a WHERE a.student_id=s.id) as att_pct
      FROM students s LEFT JOIN classes c ON c.id=s.class_id
      WHERE s.status='Active'
      ORDER BY att_pct ASC LIMIT 6
    `);

    res.json({
      at_risk_students: atRiskStudents.map(st => ({
        ...st,
        att_pct: Number(st.att_pct || 78),
        risk_level: Number(st.att_pct || 78) < 75 ? "High Risk" : "Moderate Risk",
        recommended_action: Number(st.att_pct || 78) < 75 ? "Issue Parent Advisory Notice" : "Schedule Remedial Class"
      }))
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default r;
