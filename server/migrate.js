/**
 * EduSphere PostgreSQL Migration Script
 * Run once: node server/migrate.js
 * Creates all tables and seeds demo data with bcrypt-hashed passwords.
 */

import pg from "pg";
import bcrypt from "bcryptjs";
import { config } from "dotenv";
config({ path: ".env.development" });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/edusphere",
});

async function q(sql, params = []) {
  const r = await pool.query(sql, params);
  return r;
}

async function migrate() {
  console.log("🔄  Creating schema…");

  await q(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id                   SERIAL PRIMARY KEY,
      username             TEXT UNIQUE NOT NULL,
      password             TEXT NOT NULL,
      role                 TEXT NOT NULL,
      name                 TEXT NOT NULL,
      ref_id               TEXT,
      must_change_password INTEGER DEFAULT 0,
      status               TEXT DEFAULT 'Active',
      email                TEXT,
      created_at           TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS parents (
      id           SERIAL PRIMARY KEY,
      name         TEXT NOT NULL,
      email        TEXT,
      phone        TEXT NOT NULL,
      cnic         TEXT,
      address      TEXT,
      occupation   TEXT,
      relationship TEXT DEFAULT 'Father',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS academic_years (
      id         SERIAL PRIMARY KEY,
      label      TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date   DATE NOT NULL,
      is_active  INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS terms (
      id               SERIAL PRIMARY KEY,
      academic_year_id INTEGER REFERENCES academic_years(id) ON DELETE CASCADE,
      name             TEXT NOT NULL,
      start_date       DATE NOT NULL,
      end_date         DATE NOT NULL,
      status           TEXT DEFAULT 'Upcoming'
    );

    CREATE TABLE IF NOT EXISTS classes (
      id               SERIAL PRIMARY KEY,
      name             TEXT NOT NULL,
      section          TEXT NOT NULL,
      grade            TEXT NOT NULL,
      room             TEXT,
      capacity         INTEGER DEFAULT 40,
      academic_year_id INTEGER REFERENCES academic_years(id)
    );

    CREATE TABLE IF NOT EXISTS subjects (
      id       SERIAL PRIMARY KEY,
      name     TEXT NOT NULL,
      code     TEXT UNIQUE NOT NULL,
      category TEXT DEFAULT 'Core'
    );

    CREATE TABLE IF NOT EXISTS class_subjects (
      id         SERIAL PRIMARY KEY,
      class_id   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      UNIQUE(class_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS teachers (
      id             SERIAL PRIMARY KEY,
      emp_id         TEXT UNIQUE NOT NULL,
      name           TEXT NOT NULL,
      cnic           TEXT,
      phone          TEXT,
      email          TEXT,
      qualification  TEXT,
      join_date      DATE,
      salary         NUMERIC DEFAULT 0,
      status         TEXT DEFAULT 'Active',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS teacher_subjects (
      id         SERIAL PRIMARY KEY,
      teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
      class_id   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      UNIQUE(teacher_id, subject_id, class_id)
    );

    CREATE TABLE IF NOT EXISTS students (
      id               SERIAL PRIMARY KEY,
      student_id       TEXT UNIQUE NOT NULL,
      name             TEXT NOT NULL,
      father_name      TEXT,
      mother_name      TEXT,
      cnic             TEXT,
      dob              DATE,
      gender           TEXT DEFAULT 'Male',
      address          TEXT,
      phone            TEXT,
      guardian_name    TEXT,
      guardian_phone   TEXT,
      guardian_cnic    TEXT,
      class_id         INTEGER REFERENCES classes(id),
      roll_no          TEXT,
      admission_date   DATE,
      status           TEXT DEFAULT 'Active',
      photo            TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS parent_students (
      id         SERIAL PRIMARY KEY,
      parent_id  INTEGER REFERENCES parents(id) ON DELETE CASCADE,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      UNIQUE(parent_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS admissions (
      id               SERIAL PRIMARY KEY,
      application_no   TEXT UNIQUE NOT NULL,
      applicant_name   TEXT NOT NULL,
      father_name      TEXT NOT NULL,
      father_cnic      TEXT,
      applied_class_id INTEGER REFERENCES classes(id),
      gender           TEXT DEFAULT 'Male',
      dob              DATE,
      phone            TEXT NOT NULL,
      email            TEXT,
      address          TEXT,
      previous_school  TEXT,
      documents_status TEXT DEFAULT 'Submitted',
      status           TEXT DEFAULT 'Pending',
      applied_date     DATE DEFAULT CURRENT_DATE,
      notes            TEXT
    );

    CREATE TABLE IF NOT EXISTS books (
      id             SERIAL PRIMARY KEY,
      isbn           TEXT UNIQUE,
      title          TEXT NOT NULL,
      author         TEXT NOT NULL,
      category       TEXT DEFAULT 'General',
      publisher      TEXT,
      quantity       INTEGER DEFAULT 1,
      available_qty  INTEGER DEFAULT 1,
      shelf_location TEXT,
      price          NUMERIC DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS book_issues (
      id          SERIAL PRIMARY KEY,
      book_id     INTEGER REFERENCES books(id) ON DELETE CASCADE,
      user_id     INTEGER REFERENCES users(id),
      student_id  INTEGER REFERENCES students(id),
      teacher_id  INTEGER REFERENCES teachers(id),
      issue_date  DATE DEFAULT CURRENT_DATE,
      due_date    DATE NOT NULL,
      return_date DATE,
      fine_amount NUMERIC DEFAULT 0,
      status      TEXT DEFAULT 'Issued'
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id           SERIAL PRIMARY KEY,
      vehicle_no   TEXT UNIQUE NOT NULL,
      capacity     INTEGER DEFAULT 30,
      driver_name  TEXT NOT NULL,
      driver_phone TEXT NOT NULL,
      route_name   TEXT NOT NULL,
      status       TEXT DEFAULT 'Active'
    );

    CREATE TABLE IF NOT EXISTS routes (
      id           SERIAL PRIMARY KEY,
      title        TEXT NOT NULL,
      start_point  TEXT NOT NULL,
      end_point    TEXT NOT NULL,
      monthly_fare NUMERIC NOT NULL,
      vehicle_id   INTEGER REFERENCES vehicles(id)
    );

    CREATE TABLE IF NOT EXISTS transport_assignments (
      id           SERIAL PRIMARY KEY,
      student_id   INTEGER REFERENCES students(id) ON DELETE CASCADE,
      route_id     INTEGER REFERENCES routes(id) ON DELETE CASCADE,
      pickup_point TEXT NOT NULL,
      status       TEXT DEFAULT 'Active',
      UNIQUE(student_id, route_id)
    );

    CREATE TABLE IF NOT EXISTS leaves (
      id             SERIAL PRIMARY KEY,
      applicant_type TEXT DEFAULT 'Staff',
      user_id        INTEGER REFERENCES users(id),
      teacher_id     INTEGER REFERENCES teachers(id),
      student_id     INTEGER REFERENCES students(id),
      leave_type     TEXT DEFAULT 'Casual',
      start_date     DATE NOT NULL,
      end_date       DATE NOT NULL,
      reason         TEXT NOT NULL,
      status         TEXT DEFAULT 'Pending',
      approved_by    INTEGER REFERENCES users(id),
      created_at     TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS payroll (
      id                SERIAL PRIMARY KEY,
      teacher_id        INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
      month             TEXT NOT NULL,
      year              INTEGER NOT NULL,
      basic_salary      NUMERIC NOT NULL,
      house_rent        NUMERIC DEFAULT 0,
      medical_allowance NUMERIC DEFAULT 0,
      bonus             NUMERIC DEFAULT 0,
      deductions        NUMERIC DEFAULT 0,
      net_salary        NUMERIC NOT NULL,
      payment_date      DATE DEFAULT CURRENT_DATE,
      status            TEXT DEFAULT 'Paid'
    );

    CREATE TABLE IF NOT EXISTS discipline_records (
      id           SERIAL PRIMARY KEY,
      student_id   INTEGER REFERENCES students(id) ON DELETE CASCADE,
      category     TEXT NOT NULL,
      title        TEXT NOT NULL,
      description  TEXT,
      date         DATE DEFAULT CURRENT_DATE,
      action_taken TEXT,
      reported_by  INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id          SERIAL PRIMARY KEY,
      item_name   TEXT NOT NULL,
      category    TEXT DEFAULT 'Stationery',
      quantity    INTEGER DEFAULT 0,
      unit_price  NUMERIC DEFAULT 0,
      location    TEXT,
      supplier    TEXT,
      status      TEXT DEFAULT 'In Stock'
    );

    CREATE TABLE IF NOT EXISTS events (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      event_type  TEXT DEFAULT 'Academic',
      start_date  DATE NOT NULL,
      end_date    DATE,
      audience    TEXT DEFAULT 'All',
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id          SERIAL PRIMARY KEY,
      sender_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
      receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      subject     TEXT,
      body        TEXT NOT NULL,
      sent_at     TIMESTAMPTZ DEFAULT NOW(),
      is_read     INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id        SERIAL PRIMARY KEY,
      user_id   INTEGER REFERENCES users(id),
      username  TEXT,
      action    TEXT NOT NULL,
      details   TEXT,
      timestamp TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS attendance (
      id         SERIAL PRIMARY KEY,
      student_id INTEGER REFERENCES students(id) ON DELETE CASCADE,
      class_id   INTEGER REFERENCES classes(id),
      date       DATE NOT NULL,
      status     TEXT NOT NULL CHECK(status IN ('Present','Absent','Leave')),
      noted_by   INTEGER REFERENCES teachers(id),
      UNIQUE(student_id, date)
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id            SERIAL PRIMARY KEY,
      title         TEXT NOT NULL,
      subject_id    INTEGER REFERENCES subjects(id),
      class_id      INTEGER REFERENCES classes(id),
      teacher_id    INTEGER REFERENCES teachers(id),
      due_date      DATE NOT NULL,
      total_marks   INTEGER DEFAULT 20,
      instructions  TEXT,
      file_path     TEXT,
      external_link TEXT,
      status        TEXT DEFAULT 'Active',
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS submissions (
      id            SERIAL PRIMARY KEY,
      assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
      student_id    INTEGER REFERENCES students(id) ON DELETE CASCADE,
      file_path     TEXT,
      external_link TEXT,
      note          TEXT,
      comment       TEXT,
      marks         NUMERIC,
      submitted_at  TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(assignment_id, student_id)
    );

    CREATE TABLE IF NOT EXISTS exams (
      id            SERIAL PRIMARY KEY,
      name          TEXT NOT NULL,
      class_id      INTEGER REFERENCES classes(id),
      term_id       INTEGER REFERENCES terms(id),
      type          TEXT DEFAULT 'Monthly Test',
      start_date    DATE,
      end_date      DATE,
      total_marks   INTEGER DEFAULT 100,
      passing_marks INTEGER DEFAULT 33,
      status        TEXT DEFAULT 'Scheduled',
      created_at    TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS exam_subjects (
      id         SERIAL PRIMARY KEY,
      exam_id    INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      subject_id INTEGER REFERENCES subjects(id),
      date       DATE,
      max_marks  INTEGER DEFAULT 100
    );

    CREATE TABLE IF NOT EXISTS marks (
      id             SERIAL PRIMARY KEY,
      exam_id        INTEGER REFERENCES exams(id) ON DELETE CASCADE,
      student_id     INTEGER REFERENCES students(id) ON DELETE CASCADE,
      subject_id     INTEGER REFERENCES subjects(id),
      obtained_marks NUMERIC DEFAULT 0,
      is_absent      INTEGER DEFAULT 0,
      UNIQUE(exam_id, student_id, subject_id)
    );

    CREATE TABLE IF NOT EXISTS fee_structures (
      id               SERIAL PRIMARY KEY,
      class_id         INTEGER REFERENCES classes(id),
      label            TEXT NOT NULL,
      amount           NUMERIC NOT NULL,
      category         TEXT DEFAULT 'Tuition',
      academic_year_id INTEGER REFERENCES academic_years(id)
    );

    CREATE TABLE IF NOT EXISTS challans (
      id           SERIAL PRIMARY KEY,
      challan_no   TEXT UNIQUE NOT NULL,
      student_id   INTEGER REFERENCES students(id),
      class_id     INTEGER REFERENCES classes(id),
      month        TEXT,
      year         INTEGER,
      amount       NUMERIC NOT NULL,
      due_date     DATE,
      issued_date  DATE DEFAULT CURRENT_DATE,
      status       TEXT DEFAULT 'Pending',
      notes        TEXT
    );

    CREATE TABLE IF NOT EXISTS challan_items (
      id         SERIAL PRIMARY KEY,
      challan_id INTEGER REFERENCES challans(id) ON DELETE CASCADE,
      label      TEXT NOT NULL,
      amount     NUMERIC NOT NULL
    );

    CREATE TABLE IF NOT EXISTS payments (
      id           SERIAL PRIMARY KEY,
      challan_id   INTEGER REFERENCES challans(id),
      student_id   INTEGER REFERENCES students(id),
      amount       NUMERIC NOT NULL,
      payment_date DATE,
      proof_path   TEXT,
      proof_status TEXT DEFAULT 'Not uploaded',
      note         TEXT,
      verified_by  INTEGER REFERENCES users(id),
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id          SERIAL PRIMARY KEY,
      category    TEXT NOT NULL,
      description TEXT,
      amount      NUMERIC NOT NULL,
      date        DATE NOT NULL,
      recorded_by INTEGER REFERENCES users(id),
      created_at  TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS timetable (
      id         SERIAL PRIMARY KEY,
      class_id   INTEGER REFERENCES classes(id),
      subject_id INTEGER REFERENCES subjects(id),
      teacher_id INTEGER REFERENCES teachers(id),
      day        TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time   TEXT NOT NULL,
      room       TEXT
    );

    CREATE TABLE IF NOT EXISTS materials (
      id            SERIAL PRIMARY KEY,
      title         TEXT NOT NULL,
      subject_id    INTEGER REFERENCES subjects(id),
      class_id      INTEGER REFERENCES classes(id),
      teacher_id    INTEGER REFERENCES teachers(id),
      file_path     TEXT NOT NULL,
      file_type     TEXT,
      file_size     TEXT,
      external_link TEXT,
      uploaded_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS announcements (
      id         SERIAL PRIMARY KEY,
      title      TEXT NOT NULL,
      body       TEXT NOT NULL,
      target     TEXT DEFAULT 'All',
      priority   TEXT DEFAULT 'Normal',
      author_id  INTEGER REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS diary (
      id           SERIAL PRIMARY KEY,
      class_id     INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      teacher_id   INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
      subject_id   INTEGER REFERENCES subjects(id),
      date         DATE NOT NULL,
      title        TEXT NOT NULL,
      content      TEXT,
      homework_due DATE,
      created_at   TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quizzes (
      id               SERIAL PRIMARY KEY,
      title            TEXT NOT NULL,
      class_id         INTEGER REFERENCES classes(id) ON DELETE CASCADE,
      subject_id       INTEGER REFERENCES subjects(id),
      teacher_id       INTEGER REFERENCES teachers(id) ON DELETE CASCADE,
      duration_minutes INTEGER DEFAULT 20,
      total_marks      INTEGER DEFAULT 10,
      instructions     TEXT,
      file_path        TEXT,
      external_link    TEXT,
      status           TEXT DEFAULT 'Draft',
      created_at       TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quiz_questions (
      id             SERIAL PRIMARY KEY,
      quiz_id        INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      question_text  TEXT NOT NULL,
      option_a       TEXT,
      option_b       TEXT,
      option_c       TEXT,
      option_d       TEXT,
      correct_answer TEXT NOT NULL,
      marks          INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS quiz_attempts (
      id                SERIAL PRIMARY KEY,
      quiz_id           INTEGER REFERENCES quizzes(id) ON DELETE CASCADE,
      student_id        INTEGER REFERENCES students(id) ON DELETE CASCADE,
      score             NUMERIC DEFAULT 0,
      total             NUMERIC DEFAULT 0,
      submitted_at      TIMESTAMPTZ DEFAULT NOW(),
      is_graded         INTEGER DEFAULT 1,
      tab_switch_count  INTEGER DEFAULT 0,
      violation_reason  TEXT
    );

    CREATE TABLE IF NOT EXISTS quiz_answers (
      id              SERIAL PRIMARY KEY,
      attempt_id      INTEGER REFERENCES quiz_attempts(id) ON DELETE CASCADE,
      question_id     INTEGER REFERENCES quiz_questions(id) ON DELETE CASCADE,
      selected_answer TEXT,
      is_correct      INTEGER DEFAULT 0
    );
  `);

  console.log("✅  Schema created.");
  console.log("🔑  Seeding users with bcrypt passwords…");

  const SALT = await bcrypt.genSalt(12);
  const adminHash    = await bcrypt.hash("admin123",   SALT);
  const teacherHash  = await bcrypt.hash("teacher123", SALT);
  const studentHash  = await bcrypt.hash("student123", SALT);
  const parentHash   = await bcrypt.hash("parent123",  SALT);

  const USERS = [
    ["superadmin",    adminHash,   "Super Admin",       "Super Admin"],
    ["admin",         adminHash,   "School Admin",      "School Admin"],
    ["principal",     adminHash,   "Principal",         "Saqib Azair"],
    ["viceprincipal", adminHash,   "Vice Principal",    "Dr. Tariq Mahmood"],
    ["fatima",        teacherHash, "Teacher",           "Fatima Noor"],
    ["accountant",    adminHash,   "Accountant",        "Kamran Akmal"],
    ["librarian",     adminHash,   "Librarian",         "Rashid Minhas"],
    ["receptionist",  adminHash,   "Receptionist",      "Sadia Khan"],
    ["hrmanager",     adminHash,   "HR Manager",        "Zubair Ahmed"],
    ["transport",     adminHash,   "Transport Manager", "Malik Jahangir"],
    ["areeba",        studentHash, "Student",           "Areeba Hassan"],
    ["parent",        parentHash,  "Parent",            "Hassan Raza"],
  ];

  for (const [username, password, role, name] of USERS) {
    await q(
      `INSERT INTO users(username,password,role,name) VALUES($1,$2,$3,$4)
       ON CONFLICT(username) DO NOTHING`,
      [username, password, role, name]
    );
  }

  console.log("⚙️   Seeding settings…");
  const SETTINGS = [
    ["school_name",    "EduSphere School & College"],
    ["school_code",    "ESC-SKT-01"],
    ["phone",          "052 1234567"],
    ["email",          "admin@edusphere.edu.pk"],
    ["address",        "Main Road, Sialkot, Punjab, Pakistan"],
    ["bank_name",      "Meezan Bank"],
    ["account_title",  "EduSphere School & College"],
    ["account_number", "02340107123456"],
    ["iban",           "PK36MEZN0002340107123456"],
    ["branch",         "Sialkot Main Branch"],
  ];
  for (const [key, value] of SETTINGS) {
    await q(`INSERT INTO settings(key,value) VALUES($1,$2) ON CONFLICT(key) DO NOTHING`, [key, value]);
  }

  console.log("📅  Seeding academic year…");
  let yearId;
  const yearRow = await pool.query("SELECT id FROM academic_years WHERE is_active=1 LIMIT 1");
  if (yearRow.rows.length === 0) {
    const yr = await pool.query(
      `INSERT INTO academic_years(label,start_date,end_date,is_active) VALUES($1,$2,$3,1) RETURNING id`,
      ["2026–27", "2026-08-10", "2027-06-30"]
    );
    yearId = yr.rows[0].id;
    await q(`INSERT INTO terms(academic_year_id,name,start_date,end_date,status) VALUES($1,$2,$3,$4,$5)`, [yearId,"Term 1","2026-08-10","2026-11-20","Active"]);
    await q(`INSERT INTO terms(academic_year_id,name,start_date,end_date,status) VALUES($1,$2,$3,$4,$5)`, [yearId,"Term 2","2026-12-01","2027-03-12","Upcoming"]);
    await q(`INSERT INTO terms(academic_year_id,name,start_date,end_date,status) VALUES($1,$2,$3,$4,$5)`, [yearId,"Final Term","2027-03-22","2027-06-04","Upcoming"]);
  } else {
    yearId = yearRow.rows[0].id;
  }

  console.log("📚  Seeding subjects…");
  const SUBJECTS = [
    ["Mathematics","MATH","Core"],["English","ENG","Core"],["Urdu","URD","Core"],
    ["Science / Physics","SCI","Core"],["Biology","BIO","Core"],["Chemistry","CHEM","Core"],
    ["Computer Science","CS","Core"],["Pakistan Studies","PKS","Core"],
    ["Islamiat","ISL","Core"],["General Science","GS","Core"],
  ];
  for (const [name,code,cat] of SUBJECTS) {
    await q(`INSERT INTO subjects(name,code,category) VALUES($1,$2,$3) ON CONFLICT(code) DO NOTHING`,[name,code,cat]);
  }
  const subId = async (code) => (await pool.query("SELECT id FROM subjects WHERE code=$1",[code])).rows[0]?.id;

  console.log("🏫  Seeding classes…");
  const CLASS_DEFS = [
    ["Class 7","A","7","R-101",35],["Class 7","B","7","R-102",35],
    ["Class 8","A","8","R-201",34],["Class 9","A","9","R-301",32],
    ["Class 10","B","10","R-401",31],["Class 11","A","11","R-501",25],
    ["Class 12","A","12","Lab-2",24],
  ];
  for (const [name,section,grade,room,cap] of CLASS_DEFS) {
    await q(
      `INSERT INTO classes(name,section,grade,room,capacity,academic_year_id) VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT DO NOTHING`,
      [name,section,grade,room,cap,yearId]
    );
  }
  const classId = async (name,section) => (await pool.query("SELECT id FROM classes WHERE name=$1 AND section=$2",[name,section])).rows[0]?.id;

  console.log("👩‍🏫  Seeding teachers…");
  const TEACHERS = [
    ["TCH-001","Ahmed Raza","0301-1234567","ahmed@edusphere.edu.pk","M.A English","2018-04-01",45000,"Active"],
    ["TCH-002","Fatima Noor","0300-1234567","fatima@edusphere.edu.pk","M.Sc Mathematics","2019-08-15",48000,"Active"],
    ["TCH-003","Sana Malik","0302-3456789","sana@edusphere.edu.pk","M.Sc Physics","2020-01-10",46000,"Active"],
    ["TCH-004","Nadia Hussain","0304-6781122","nadia@edusphere.edu.pk","M.Phil Physics","2017-06-01",52000,"On Leave"],
    ["TCH-005","Fahad Sheikh","0333-9876543","fahad@edusphere.edu.pk","BS Computer Science","2021-03-01",44000,"Active"],
  ];
  for (const [eid,name,phone,email,qual,join_date,salary,status] of TEACHERS) {
    await q(
      `INSERT INTO teachers(emp_id,name,phone,email,qualification,join_date,salary,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT(emp_id) DO NOTHING`,
      [eid,name,phone,email,qual,join_date,salary,status]
    );
  }
  const tchId = async (empId) => (await pool.query("SELECT id FROM teachers WHERE emp_id=$1",[empId])).rows[0]?.id;

  console.log("🎓  Seeding students…");
  const STUDENTS = [
    ["STU-2026-001","Areeba Hassan","Hassan Raza","2011-03-15","Female","Class 9","A","09-A-12","2024-08-10","0301-2345678","Hassan Raza","0301-9876543"],
    ["STU-2026-002","Muhammad Hamza","Imran Ahmed","2010-07-22","Male","Class 10","B","10-B-07","2023-08-12","0302-4567890","Imran Ahmed","0302-1234567"],
    ["STU-2026-003","Sana Zahid","Zahid Mehmood","2012-01-10","Female","Class 8","A","08-A-21","2025-08-08","0303-5678901","Zahid Mehmood","0303-9999999"],
    ["STU-2026-004","Fahad Ali","Ali Akbar","2009-11-05","Male","Class 11","A","11-A-05","2022-08-15","0304-6789012","Ali Akbar","0304-8888888"],
    ["STU-2026-005","Noor Fatima","Usman Tariq","2012-06-30","Female","Class 7","B","07-B-16","2025-08-08","0305-7890123","Usman Tariq","0305-7777777"],
    ["STU-2026-006","Bilal Hussain","Hussain Shah","2008-09-18","Male","Class 12","A","12-A-03","2021-08-10","0306-8901234","Hussain Shah","0306-6666666"],
    ["STU-2026-007","Mariam Rauf","Abdul Rauf","2011-12-01","Female","Class 9","A","09-A-17","2024-08-10","0311-1111111","Abdul Rauf","0311-2222222"],
    ["STU-2026-008","Zain Ul Abidin","Abidin Khan","2011-05-14","Male","Class 9","A","09-A-22","2024-08-10","0322-3333333","Abidin Khan","0322-4444444"],
  ];
  for (const [sid,name,father,dob,gender,cls,sec,roll,adm,phone,gname,gphone] of STUDENTS) {
    const cid = await classId(cls,sec);
    await q(
      `INSERT INTO students(student_id,name,father_name,dob,gender,class_id,roll_no,admission_date,phone,guardian_name,guardian_phone)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT(student_id) DO NOTHING`,
      [sid,name,father,dob,gender,cid,roll,adm,phone,gname,gphone]
    );
  }

  // Link users to ref_ids
  const fatimaId  = await tchId("TCH-002");
  const areeba    = (await pool.query("SELECT id FROM students WHERE student_id=$1",["STU-2026-001"])).rows[0]?.id;
  if (fatimaId)  await q("UPDATE users SET ref_id=$1 WHERE username='fatima'",  [String(fatimaId)]);
  if (areeba)    await q("UPDATE users SET ref_id=$1 WHERE username='areeba'",  [String(areeba)]);

  // Teacher subjects
  const cls9A   = await classId("Class 9","A");
  const mathId  = await subId("MATH");
  const engId   = await subId("ENG");
  const csId    = await subId("CS");
  const fahadId = await tchId("TCH-005");
  if (fatimaId&&cls9A&&mathId) {
    await q(`INSERT INTO teacher_subjects(teacher_id,subject_id,class_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[fatimaId,mathId,cls9A]);
    await q(`INSERT INTO teacher_subjects(teacher_id,subject_id,class_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[fatimaId,engId,cls9A]);
  }
  if (fahadId&&cls9A&&csId) {
    await q(`INSERT INTO teacher_subjects(teacher_id,subject_id,class_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING`,[fahadId,csId,cls9A]);
  }

  console.log("💰  Seeding fee structures & challans…");
  const feeStructures = [
    [await classId("Class 7","A"),"Tuition Fee",10000,"Tuition"],
    [await classId("Class 8","A"),"Tuition Fee",11000,"Tuition"],
    [await classId("Class 9","A"),"Tuition Fee",12500,"Tuition"],
    [await classId("Class 9","A"),"Lab Fee",500,"Lab"],
    [await classId("Class 10","B"),"Tuition Fee",14000,"Tuition"],
    [await classId("Class 10","B"),"Exam Fee",1000,"Exam"],
    [await classId("Class 11","A"),"Tuition Fee",16000,"Tuition"],
    [await classId("Class 12","A"),"Tuition Fee",15000,"Tuition"],
  ];
  for (const [cid,label,amount,cat] of feeStructures) {
    if (cid) await q(`INSERT INTO fee_structures(class_id,label,amount,category,academic_year_id) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,[cid,label,amount,cat,yearId]);
  }

  const CHALLANS = [
    ["CH-26091","STU-2026-001","Class 9","A","September",2026,13000,"2026-09-10","Paid"],
    ["CH-26092","STU-2026-002","Class 10","B","September",2026,15000,"2026-09-10","Pending"],
    ["CH-26093","STU-2026-003","Class 8","A","September",2026,11000,"2026-09-10","Paid"],
    ["CH-26094","STU-2026-005","Class 7","B","September",2026,10000,"2026-09-02","Overdue"],
    ["CH-26095","STU-2026-006","Class 12","A","September",2026,15000,"2026-09-10","Pending"],
  ];
  for (const [cno,sid,cls,sec,month,year,amt,due,status] of CHALLANS) {
    const stRow = (await pool.query("SELECT id FROM students WHERE student_id=$1",[sid])).rows[0];
    const clRow = await classId(cls,sec);
    if (!stRow||!clRow) continue;
    const ex = (await pool.query("SELECT id FROM challans WHERE challan_no=$1",[cno])).rows[0];
    if (!ex) {
      const ch = await pool.query(
        `INSERT INTO challans(challan_no,student_id,class_id,month,year,amount,due_date,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [cno,stRow.id,clRow,month,year,amt,due,status]
      );
      const challanId = ch.rows[0].id;
      await q("INSERT INTO challan_items(challan_id,label,amount) VALUES($1,$2,$3)",[challanId,"Tuition Fee",amt-500]);
      await q("INSERT INTO challan_items(challan_id,label,amount) VALUES($1,$2,$3)",[challanId,"Exam Fee",500]);
      const proofStatus = status==="Paid"?"Verified":status==="Pending"?"Uploaded":"Not uploaded";
      await q(`INSERT INTO payments(challan_id,student_id,amount,payment_date,proof_status) VALUES($1,$2,$3,$4,$5)`,
        [challanId,stRow.id,amt,status==="Paid"?"2026-09-08":null,proofStatus]);
    }
  }

  console.log("📋  Seeding timetable, diary, quiz…");
  const sciId = await subId("SCI");
  const islId = await subId("ISL");
  const urdId = await subId("URD");
  const ahmedId = await tchId("TCH-001");
  const sanaId  = await tchId("TCH-003");
  const termRow = (await pool.query("SELECT id FROM terms WHERE name='Term 1' LIMIT 1")).rows[0];
  const termId  = termRow?.id;

  const TT = [
    [cls9A,mathId,fatimaId,"Monday","08:00","08:40","R-301"],
    [cls9A,engId,ahmedId,"Monday","08:40","09:20","R-301"],
    [cls9A,urdId,ahmedId,"Monday","09:30","10:10","R-301"],
    [cls9A,sciId,sanaId,"Tuesday","08:00","08:40","Lab-1"],
    [cls9A,csId,fahadId,"Wednesday","10:20","11:00","Lab-2"],
    [cls9A,islId,ahmedId,"Thursday","08:00","08:40","R-301"],
  ];
  for (const [cid,sid,tid,day,s,e,room] of TT) {
    if (!cid||!sid||!tid) continue;
    const ex = (await pool.query("SELECT id FROM timetable WHERE class_id=$1 AND subject_id=$2 AND day=$3",[cid,sid,day])).rows[0];
    if (!ex) await q("INSERT INTO timetable(class_id,subject_id,teacher_id,day,start_time,end_time,room) VALUES($1,$2,$3,$4,$5,$6,$7)",[cid,sid,tid,day,s,e,room]);
  }

  // Announcements
  const principal = (await pool.query("SELECT id FROM users WHERE username='principal'")).rows[0]?.id;
  const ANNS = [
    ["Welcome Back to School!","The new academic year 2026–27 has begun. Wishing all students and staff a productive year.","All","High"],
    ["Fee Submission Deadline","All students must submit September 2026 fee challan by 10th September.","All","Normal"],
    ["September Monthly Test Schedule","Monthly tests for Classes 7–12 will be held Sep 14–18, 2026.","All","Normal"],
  ];
  for (const [title,body,target,priority] of ANNS) {
    const ex = (await pool.query("SELECT id FROM announcements WHERE title=$1",[title])).rows[0];
    if (!ex) await q("INSERT INTO announcements(title,body,target,priority,author_id) VALUES($1,$2,$3,$4,$5)",[title,body,target,priority,principal]);
  }

  // Exam seed
  if (cls9A&&termId) {
    const ex = (await pool.query("SELECT id FROM exams WHERE name='September Monthly Test' AND class_id=$1",[cls9A])).rows[0];
    if (!ex) await q(`INSERT INTO exams(name,class_id,term_id,type,start_date,end_date,total_marks,passing_marks,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      ["September Monthly Test",cls9A,termId,"Monthly Test","2026-09-14","2026-09-18",700,231,"Scheduled"]);
  }

  // Diary
  if (fatimaId&&cls9A&&mathId) {
    const ex = (await pool.query("SELECT id FROM diary WHERE class_id=$1 LIMIT 1",[cls9A])).rows[0];
    if (!ex) {
      await q("INSERT INTO diary(class_id,teacher_id,subject_id,date,title,content,homework_due) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [cls9A,fatimaId,mathId,"2026-09-14","Chapter 3 – Algebra","Today we covered linear equations with two variables. Practice Exercise 3.2 Q1–Q10 for homework.","2026-09-16"]);
      await q("INSERT INTO diary(class_id,teacher_id,subject_id,date,title,content,homework_due) VALUES($1,$2,$3,$4,$5,$6,$7)",
        [cls9A,fatimaId,engId,"2026-09-14","Essay Writing Techniques","Discussed outline structure for argumentative essays. Write a 300-word essay on 'Social Media Impact'.","2026-09-17"]);
    }
  }

  // Quiz seed
  if (fatimaId&&cls9A&&mathId) {
    const ex = (await pool.query("SELECT id FROM quizzes WHERE title=$1",["Chapter 2 Quick Quiz – Algebra"])).rows[0];
    if (!ex) {
      const qr = await pool.query(
        `INSERT INTO quizzes(title,class_id,subject_id,teacher_id,duration_minutes,total_marks,instructions,status) VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        ["Chapter 2 Quick Quiz – Algebra",cls9A,mathId,fatimaId,15,10,"Attempt all questions. Each correct answer = 2 marks. No negative marking.","Active"]
      );
      const qid = qr.rows[0].id;
      const QS = [
        ["What is the value of x in: 2x + 4 = 10?","x = 2","x = 3","x = 4","x = 5","B",2],
        ["Which of these is a linear equation?","x² + 2 = 0","2x + 3 = 7","x³ = 8","√x = 4","B",2],
        ["Solve: 3x - 6 = 9","x = 3","x = 4","x = 5","x = 6","C",2],
        ["If y = 2x + 1 and x = 3, then y =?","5","6","7","8","C",2],
        ["The slope of y = 4x - 2 is:","2","-2","4","-4","C",2],
      ];
      for (const [qt,a,b,c,d,ans,marks] of QS) {
        await q("INSERT INTO quiz_questions(quiz_id,question_text,option_a,option_b,option_c,option_d,correct_answer,marks) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
          [qid,qt,a,b,c,d,ans,marks]);
      }
    }
  }

  console.log("📝  Seeding online admissions applications…");
  const ADMISSIONS_SEED = [
    ["ADM-2026-101", "Muhammad Rayyan", "Usman Ghani", "35202-9876543-1", cls9A, "Male", "2011-04-12", "0300-1122334", "rayyan@gmail.com", "Model Town, Sialkot", "Army Public School", "Submitted", "Pending", "2026-09-01"],
    ["ADM-2026-102", "Syeda Anum Zahra", "Syed Kazim Raza", "35201-1234567-2", await classId("Class 11","A"), "Female", "2009-08-25", "0301-4455667", "anum.zahra@gmail.com", "Cantt Area, Sialkot", "Convent High School", "Verified", "Approved", "2026-09-02"],
    ["ADM-2026-103", "Omer Farooq", "Farooq Abdullah", "35202-5554433-1", await classId("Class 7","A"), "Male", "2013-01-15", "0302-9988776", "farooq.abd@gmail.com", "Kashmir Road, Sialkot", "Beaconhouse School System", "Submitted", "Under Review", "2026-09-03"],
    ["ADM-2026-104", "Zoya Bilal", "Bilal Siddiqui", "35202-7776655-2", await classId("Class 8","A"), "Female", "2012-06-18", "0303-3344556", "zoya.bilal@gmail.com", "Defense Housing, Sialkot", "City School Sialkot", "Verified", "Enrolled", "2026-08-28"],
    ["ADM-2026-105", "Hamza Tariq", "Tariq Mehmood", "35201-8889900-1", await classId("Class 10","B"), "Male", "2010-11-30", "0304-6677889", "hamza.tariq@gmail.com", "Green Town, Sialkot", "Govt High School No 1", "Submitted", "Pending", "2026-09-04"],
  ];
  for (const [appNo, name, fName, cnic, cid, gender, dob, phone, email, addr, prevSch, docSt, status, appDate] of ADMISSIONS_SEED) {
    if (cid) {
      await q(`INSERT INTO admissions(application_no,applicant_name,father_name,father_cnic,applied_class_id,gender,dob,phone,email,address,previous_school,documents_status,status,applied_date)
               VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) ON CONFLICT(application_no) DO NOTHING`,
        [appNo, name, fName, cnic, cid, gender, dob, phone, email, addr, prevSch, docSt, status, appDate]);
    }
  }

  console.log("\n✅  Migration complete! EduSphere database is ready.\n");
  console.log("   Demo credentials (all bcrypt-hashed):");
  console.log("   🏫  principal  / admin123");
  console.log("   👩‍🏫  fatima     / teacher123");
  console.log("   🎓  areeba     / student123");
  console.log("   👨‍👩‍👧  parent     / parent123");
  await pool.end();
}

migrate().catch((err) => {
  console.error("❌  Migration failed:", err.message);
  pool.end();
  process.exit(1);
});
