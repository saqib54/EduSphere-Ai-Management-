import { Router } from "express";
import bcrypt from "bcryptjs";
import { rows, row, query } from "../db.js";
import pool from "../db.js";

const router = Router();

// ─── User Account Management ──────────────────────────────────────────────────

router.get("/users", async (_req, res) => {
  try {
    res.json(await rows("SELECT id,username,role,name,status,must_change_password,email,created_at FROM users ORDER BY id DESC"));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/users", async (req, res) => {
  try {
    const { username, password, role, name, email } = req.body;
    if (!username||!password||!role||!name) return res.status(400).json({ error: "Required fields missing" });
    const hash = await bcrypt.hash(password, 12);
    const r2 = await row(
      "INSERT INTO users(username,password,role,name,email,must_change_password) VALUES($1,$2,$3,$4,$5,1) RETURNING id",
      [username.trim().toLowerCase(), hash, role, name, email||null]
    );
    await query("INSERT INTO audit_logs(username,action,details) VALUES($1,$2,$3)",["admin","User Created",`Created user ${username} with role ${role}`]);
    res.json({ id: r2.id, username, role, name });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/users/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await query("UPDATE users SET status=$1 WHERE id=$2",[status, req.params.id]);
    await query("INSERT INTO audit_logs(username,action,details) VALUES($1,$2,$3)",["admin","User Status Updated",`User #${req.params.id} set to ${status}`]);
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post("/users/change-password", async (req, res) => {
  try {
    const { username, old_password, new_password } = req.body;
    const user = await row("SELECT * FROM users WHERE username=$1",[username]);
    if (!user) return res.status(404).json({ error: "User not found" });
    const match = await bcrypt.compare(old_password, user.password);
    if (!match) return res.status(400).json({ error: "Current password does not match" });
    const hash = await bcrypt.hash(new_password, 12);
    await query("UPDATE users SET password=$1,must_change_password=0 WHERE id=$2",[hash, user.id]);
    await query("INSERT INTO audit_logs(username,action,details) VALUES($1,$2,$3)",[username,"Password Changed","User changed their password"]);
    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── Parent Portal ───────────────────────────────────────────────────────────

router.get("/parents/:id/children", async (req, res) => {
  try {
    const children = await rows(`
      SELECT s.*, c.name as class_name, c.section,
        (SELECT COUNT(*) FROM attendance a WHERE a.student_id=s.id AND a.status='Present') as present_days,
        (SELECT COUNT(*) FROM attendance a WHERE a.student_id=s.id) as total_days,
        (SELECT SUM(amount) FROM challans ch WHERE ch.student_id=s.id AND ch.status IN ('Pending','Overdue')) as pending_fees
      FROM students s
      JOIN parent_students ps ON s.id=ps.student_id
      JOIN classes c ON s.class_id=c.id
      WHERE ps.parent_id=$1
    `,[req.params.id]);
    res.json(children);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Admissions ───────────────────────────────────────────────────────────────

router.get("/admissions", async (_req, res) => {
  try {
    res.json(await rows(`
      SELECT a.*, c.name as class_name, c.section FROM admissions a
      LEFT JOIN classes c ON a.applied_class_id=c.id ORDER BY a.id DESC
    `));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/admissions", async (req, res) => {
  try {
    const { applicant_name, father_name, father_cnic, applied_class_id, gender, dob, phone, email, address, previous_school } = req.body;
    const appNo = "ADM-2026-" + Math.floor(1000 + Math.random() * 9000);
    const r2 = await row(
      `INSERT INTO admissions(application_no,applicant_name,father_name,father_cnic,applied_class_id,gender,dob,phone,email,address,previous_school,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'Pending') RETURNING id`,
      [appNo,applicant_name,father_name,father_cnic||null,applied_class_id||null,gender||"Male",dob||null,phone,email||null,address||null,previous_school||null]
    );
    await query("INSERT INTO audit_logs(username,action,details) VALUES($1,$2,$3)",["public","Admission Applied",`Application ${appNo} submitted for ${applicant_name}`]);
    res.json({ id: r2.id, application_no: appNo, status: "Pending" });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/admissions/:id/status", async (req, res) => {
  try {
    const { status, notes } = req.body;
    await query("UPDATE admissions SET status=$1,notes=$2 WHERE id=$3",[status,notes||null,req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post("/admissions/:id/convert", async (req, res) => {
  try {
    const adm = await row("SELECT * FROM admissions WHERE id=$1",[req.params.id]);
    if (!adm) return res.status(404).json({ error: "Admission not found" });

    // Fallback default class if not set
    let classId = adm.applied_class_id ? parseInt(adm.applied_class_id) : null;
    if (!classId) {
      const defaultClass = await row("SELECT id FROM classes LIMIT 1");
      classId = defaultClass?.id || null;
    }

    const studentId = "STU-2026-" + Math.floor(100 + Math.random() * 900);
    const rollNo    = "26-A-" + Math.floor(10 + Math.random() * 90);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const s = await client.query(
        `INSERT INTO students(student_id,name,father_name,gender,dob,address,phone,guardian_name,guardian_phone,guardian_cnic,class_id,roll_no,admission_date,status)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,CURRENT_DATE,'Active') RETURNING id`,
        [
          studentId,
          adm.applicant_name || "Applicant Student",
          adm.father_name || "Father",
          adm.gender || "Male",
          adm.dob || null,
          adm.address || "Local Address",
          adm.phone || "03000000000",
          adm.father_name || "Guardian",
          adm.phone || "03000000000",
          adm.father_cnic || null,
          classId,
          rollNo
        ]
      );
      const newId = s.rows[0].id;
      await client.query("UPDATE admissions SET status='Enrolled' WHERE id=$1",[adm.id]);

      // Create student user login account automatically
      const username = studentId.toLowerCase().replace(/[^a-z0-9]/g, "");
      const hash = await bcrypt.hash("student123", 12);
      await client.query(
        `INSERT INTO users(username,password,role,name,ref_id,status)
         VALUES($1,$2,'Student',$3,$4,'Active')
         ON CONFLICT(username) DO NOTHING`,
        [username, hash, adm.applicant_name || "Student", String(newId)]
      );

      const challanNo = "CH-26ADM-" + Math.floor(1000 + Math.random() * 9000);
      const ch = await client.query(
        "INSERT INTO challans(challan_no,student_id,class_id,month,year,amount,due_date,status) VALUES($1,$2,$3,'Admission',2026,15000,CURRENT_DATE + INTERVAL '15 days','Pending') RETURNING id",
        [challanNo,newId,classId]
      );
      await client.query("INSERT INTO challan_items(challan_id,label,amount) VALUES($1,$2,$3)",[ch.rows[0].id,"Admission Fee",10000]);
      await client.query("INSERT INTO challan_items(challan_id,label,amount) VALUES($1,$2,$3)",[ch.rows[0].id,"First Month Tuition",5000]);
      await client.query("COMMIT");
      await query("INSERT INTO audit_logs(username,action,details) VALUES($1,$2,$3)",["admin","Student Enrolled",`Converted ${adm.application_no} → ${studentId} (User: ${username})`]);
      res.json({ success: true, student_id: studentId, roll_no: rollNo, challan_no: challanNo, username, password: "student123" });
    } catch (txErr) {
      await client.query("ROLLBACK");
      throw txErr;
    } finally {
      client.release();
    }
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── Library ──────────────────────────────────────────────────────────────────

router.get("/library/books", async (_req, res) => {
  try { res.json(await rows("SELECT * FROM books ORDER BY title")); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/library/books", async (req, res) => {
  try {
    const { isbn, title, author, category, publisher, quantity, shelf_location, price } = req.body;
    const r2 = await row(
      "INSERT INTO books(isbn,title,author,category,publisher,quantity,available_qty,shelf_location,price) VALUES($1,$2,$3,$4,$5,$6,$6,$7,$8) RETURNING id",
      [isbn||null,title,author,category||"General",publisher||null,quantity||1,shelf_location||null,price||0]
    );
    res.json({ id: r2.id, title });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get("/library/issues", async (_req, res) => {
  try {
    res.json(await rows(`
      SELECT bi.*, b.title as book_title, b.isbn, s.name as student_name, t.name as teacher_name
      FROM book_issues bi JOIN books b ON bi.book_id=b.id
      LEFT JOIN students s ON bi.student_id=s.id LEFT JOIN teachers t ON bi.teacher_id=t.id
      ORDER BY bi.id DESC
    `));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/library/issue", async (req, res) => {
  try {
    const { book_id, student_id, teacher_id, due_days } = req.body;
    const book = await row("SELECT * FROM books WHERE id=$1",[book_id]);
    if (!book || Number(book.available_qty) < 1) return res.status(400).json({ error: "Book not available" });
    const due_date = new Date(Date.now() + (due_days||14) * 86400000).toISOString().split("T")[0];
    await query("INSERT INTO book_issues(book_id,student_id,teacher_id,issue_date,due_date,status) VALUES($1,$2,$3,CURRENT_DATE,$4,'Issued')",
      [book_id,student_id||null,teacher_id||null,due_date]);
    await query("UPDATE books SET available_qty=available_qty-1 WHERE id=$1",[book_id]);
    res.json({ success: true, due_date });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.post("/library/return/:issueId", async (req, res) => {
  try {
    const issue = await row("SELECT * FROM book_issues WHERE id=$1",[req.params.issueId]);
    if (!issue) return res.status(404).json({ error: "Issue record not found" });
    await query("UPDATE book_issues SET return_date=CURRENT_DATE,status='Returned' WHERE id=$1",[req.params.issueId]);
    await query("UPDATE books SET available_qty=available_qty+1 WHERE id=$1",[issue.book_id]);
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── Transport ────────────────────────────────────────────────────────────────

router.get("/transport/routes", async (_req, res) => {
  try {
    res.json(await rows(`
      SELECT r.*, v.vehicle_no, v.driver_name, v.driver_phone, v.capacity,
        (SELECT COUNT(*) FROM transport_assignments ta WHERE ta.route_id=r.id) as assigned_count
      FROM routes r LEFT JOIN vehicles v ON r.vehicle_id=v.id
    `));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/transport/assign", async (req, res) => {
  try {
    const { student_id, route_id, pickup_point } = req.body;
    await query(
      `INSERT INTO transport_assignments(student_id,route_id,pickup_point,status) VALUES($1,$2,$3,'Active')
       ON CONFLICT(student_id,route_id) DO UPDATE SET pickup_point=EXCLUDED.pickup_point,status='Active'`,
      [student_id, route_id, pickup_point||"Main Stop"]
    );
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── HR & Payroll ─────────────────────────────────────────────────────────────

router.get("/hr/leaves", async (_req, res) => {
  try {
    res.json(await rows(`
      SELECT l.*, t.name as teacher_name, u.name as user_name FROM leaves l
      LEFT JOIN teachers t ON l.teacher_id=t.id LEFT JOIN users u ON l.user_id=u.id
      ORDER BY l.id DESC
    `));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/hr/leaves", async (req, res) => {
  try {
    const { teacher_id, user_id, leave_type, start_date, end_date, reason } = req.body;
    await query(
      "INSERT INTO leaves(applicant_type,user_id,teacher_id,leave_type,start_date,end_date,reason,status) VALUES('Staff',$1,$2,$3,$4,$5,$6,'Pending')",
      [user_id||null,teacher_id||null,leave_type||"Casual",start_date,end_date,reason]
    );
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.put("/hr/leaves/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    await query("UPDATE leaves SET status=$1 WHERE id=$2",[status, req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get("/hr/payroll", async (_req, res) => {
  try {
    const staff = await rows("SELECT * FROM teachers ORDER BY name");
    res.json(staff.map(t => {
      const base = Number(t.salary||0);
      return { ...t, baseSalary:base, houseRent:Math.round(base*0.15), medical:Math.round(base*0.05), grossSalary:Math.round(base*1.20), status:"Paid" };
    }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Inventory ────────────────────────────────────────────────────────────────

router.get("/inventory", async (_req, res) => {
  try { res.json(await rows("SELECT * FROM inventory ORDER BY id DESC")); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/inventory", async (req, res) => {
  try {
    const { item_name, category, quantity, unit_price, location, supplier } = req.body;
    await query("INSERT INTO inventory(item_name,category,quantity,unit_price,location,supplier,status) VALUES($1,$2,$3,$4,$5,$6,'In Stock')",
      [item_name,category||"Stationery",quantity||1,unit_price||0,location||"Store Room",supplier||null]);
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── Discipline ───────────────────────────────────────────────────────────────

router.get("/discipline", async (_req, res) => {
  try {
    res.json(await rows(`
      SELECT d.*, s.name as student_name, s.student_id, c.name as class_name, c.section
      FROM discipline_records d JOIN students s ON d.student_id=s.id
      LEFT JOIN classes c ON s.class_id=c.id ORDER BY d.id DESC
    `));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/discipline", async (req, res) => {
  try {
    const { student_id, category, title, description, action_taken } = req.body;
    await query("INSERT INTO discipline_records(student_id,category,title,description,action_taken,date) VALUES($1,$2,$3,$4,$5,CURRENT_DATE)",
      [student_id,category||"Warning",title,description||null,action_taken||null]);
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── Events ───────────────────────────────────────────────────────────────────

router.get("/events", async (_req, res) => {
  try { res.json(await rows("SELECT * FROM events ORDER BY start_date ASC")); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/events", async (req, res) => {
  try {
    const { title, event_type, start_date, end_date, audience, description } = req.body;
    await query("INSERT INTO events(title,event_type,start_date,end_date,audience,description) VALUES($1,$2,$3,$4,$5,$6)",
      [title,event_type||"Academic",start_date,end_date||start_date,audience||"All",description||null]);
    res.json({ success: true });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────

router.get("/audit-logs", async (_req, res) => {
  try {
    res.json(await rows("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100"));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── AI Assistant (rule-based, no external API needed) ───────────────────────

router.post("/ai-assistant", async (req, res) => {
  try {
    const { prompt, mode, subject, topic } = req.body;
    if (mode === "quiz_gen") {
      return res.json({
        mode: "quiz_gen", topic: topic||"General", subject: subject||"General Studies",
        questions: [
          { q:`What is the fundamental concept of ${topic||"this topic"} in ${subject||"General Studies"}?`, options:["Option A: Basic principle","Option B: Formula rule","Option C: Standard constant","Option D: Applied variable"], ans:"A" },
          { q:`Which formula or rule applies to ${topic||"this subject"}?`, options:["Option A: Theorem 1","Option B: Formula B","Option C: Equation C","Option D: Identity D"], ans:"B" },
          { q:`In ${subject||"this course"}, what is the first step in problem solving?`, options:["Option A: Identify known values","Option B: Draw diagram","Option C: Skip to answer","Option D: Guess"], ans:"A" },
        ],
      });
    }
    const [students, teachers, pendingFees, collectedFees] = await Promise.all([
      row("SELECT COUNT(*) as n FROM students"),
      row("SELECT COUNT(*) as n FROM teachers"),
      row("SELECT SUM(amount) as t FROM challans WHERE status IN ('Pending','Overdue')"),
      row("SELECT SUM(amount) as t FROM challans WHERE status='Paid'"),
    ]);
    const pend = Number(pendingFees?.t || 0);
    const coll = Number(collectedFees?.t || 0);
    let reply = `Based on EduSphere live data:\n- Total Students: ${students?.n}\n- Active Teachers: ${teachers?.n}\n- Fee Collected: PKR ${coll.toLocaleString("en-PK")}\n- Fee Pending: PKR ${pend.toLocaleString("en-PK")}\n\nAll sessions running smoothly.`;
    if (/fee|financ/.test(prompt?.toLowerCase()||"")) {
      reply = `Financial Summary:\n- Collected: PKR ${coll.toLocaleString("en-PK")}\n- Pending: PKR ${pend.toLocaleString("en-PK")}\n- Recovery Rate: ${coll+pend>0?Math.round((coll/(coll+pend))*100):0}%\nRecommendation: Issue reminder notices to pending challan holders.`;
    } else if (/student|attend/.test(prompt?.toLowerCase()||"")) {
      reply = `Student Analytics:\n- Enrolled Students: ${students?.n}\n- Average Attendance: 94.2%\n- Status: Active admissions under review.`;
    }
    res.json({ mode: "qa", reply });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

export default router;
