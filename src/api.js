const BASE         = import.meta.env.VITE_API_URL  || "http://localhost:3001/api";
const UPLOADS_BASE = import.meta.env.VITE_UPLOADS_URL || "http://localhost:3001/uploads";

const TOKEN_KEY = "edusphere-token";
const USER_KEY  = "edusphere-user";

// ─── Token helpers ────────────────────────────────────────────────────────────
export const auth = {
  getToken:  ()    => localStorage.getItem(TOKEN_KEY),
  getUser:   ()    => { try { return JSON.parse(localStorage.getItem(USER_KEY)||"null"); } catch { return null; } },
  setSession:(token, user) => { localStorage.setItem(TOKEN_KEY, token); localStorage.setItem(USER_KEY, JSON.stringify(user)); },
  clearSession: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY); },
  isLoggedIn: ()   => !!localStorage.getItem(TOKEN_KEY),
};

// ─── Core HTTP helper ─────────────────────────────────────────────────────────
async function req(method, path, body, isFormData = false) {
  const token = auth.getToken();
  const opts  = { method, headers: {} };

  if (token) {
    opts.headers["Authorization"] = `Bearer ${token}`;
  }
  if (body) {
    if (isFormData) {
      opts.body = body; // FormData — no Content-Type header (browser sets boundary)
    } else {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
  }

  const res = await fetch(`${BASE}${path}`, opts);

  // Auto-logout on 401 (expired / invalid token)
  if (res.status === 401) {
    auth.clearSession();
    window.location.reload();
    return;
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// ─── API surface ──────────────────────────────────────────────────────────────
export const api = {
  get:    (path)        => req("GET",    path),
  post:   (path, body)  => req("POST",   path, body),
  put:    (path, body)  => req("PUT",    path, body),
  patch:  (path, body)  => req("PATCH",  path, body),
  del:    (path)        => req("DELETE", path),
  upload: (path, fd)    => req("POST",   path, fd, true),

  // ─── Auth ──────────────────────────────────────────────────────────────────
  login: async (username, password) => {
    const data = await req("POST", "/auth/login", { username, password });
    if (data?.token && data?.user) {
      auth.setSession(data.token, data.user);
    }
    return data;
  },

  // ─── Dashboards ────────────────────────────────────────────────────────────
  dashboard:        ()  => req("GET", "/reports/dashboard"),
  teacherDashboard: (tid)  => req("GET", `/reports/teacher-dashboard?teacher_id=${tid}`),
  studentDashboard: (sid)  => req("GET", `/reports/student-dashboard?student_id=${sid}`),
  attendanceTrend:  ()  => req("GET", "/reports/attendance-trend"),
  gradeDistribution:()  => req("GET", "/reports/grades"),

  // ─── Academics ─────────────────────────────────────────────────────────────
  getAcademics:  ()       => req("GET", "/academics"),
  addYear:       (d)      => req("POST", "/academics", d),
  updateYear:    (id, d)  => req("PUT",  `/academics/${id}`, d),
  deleteYear:    (id)     => req("DELETE",`/academics/${id}`),
  activateYear:  (id)     => req("PUT",  `/academics/${id}/activate`),
  addTerm:       (d)      => req("POST", "/academics/terms", d),
  updateTerm:    (id, d)  => req("PUT",  `/academics/terms/${id}`, d),
  deleteTerm:    (id)     => req("DELETE",`/academics/terms/${id}`),

  // ─── Classes & Subjects ────────────────────────────────────────────────────
  getClasses:    ()       => req("GET", "/classes"),
  addClass:      (d)      => req("POST", "/classes", d),
  updateClass:   (id, d)  => req("PUT",  `/classes/${id}`, d),
  deleteClass:   (id)     => req("DELETE",`/classes/${id}`),
  getSubjects:   ()       => req("GET", "/classes/subjects"),
  addSubject:    (d)      => req("POST", "/classes/subjects", d),
  updateSubject: (id, d)  => req("PUT",  `/classes/subjects/${id}`, d),
  deleteSubject: (id)     => req("DELETE",`/classes/subjects/${id}`),

  // ─── Teachers ──────────────────────────────────────────────────────────────
  getTeachers:           ()         => req("GET", "/teachers"),
  getTeacher:            (id)       => req("GET", `/teachers/${id}`),
  addTeacher:            (d)        => req("POST", "/teachers", d),
  updateTeacher:         (id, d)    => req("PUT",  `/teachers/${id}`, d),
  deleteTeacher:         (id)       => req("DELETE",`/teachers/${id}`),
  assignTeacherSubject:  (tid, d)   => req("POST", `/teachers/${tid}/assign`, d),
  removeTeacherAssignment:(tid, sid)=> req("DELETE",`/teachers/${tid}/assign/${sid}`),

  // ─── Students ──────────────────────────────────────────────────────────────
  getStudents: (params = {}) => { const qs = new URLSearchParams(params).toString(); return req("GET", `/students${qs ? "?" + qs : ""}`); },
  getStudent:  (id)   => req("GET",    `/students/${id}`),
  addStudent:  (d)    => req("POST",   "/students", d),
  updateStudent:(id,d)=> req("PUT",    `/students/${id}`, d),
  deleteStudent:(id)  => req("DELETE", `/students/${id}`),

  // ─── Attendance ────────────────────────────────────────────────────────────
  getAttendance:       (cid, date)        => req("GET", `/attendance?class_id=${cid}&date=${date}`),
  saveAttendance:      (d)                => req("POST", "/attendance", d),
  getAttendanceSummary:(cid, month, year) => req("GET", `/attendance/summary?class_id=${cid}&month=${month}&year=${year}`),
  getMyAttendance:     (sid, month, year) => req("GET", `/attendance/my?student_id=${sid}&month=${month}&year=${year}`),

  // ─── Assignments ───────────────────────────────────────────────────────────
  getAssignments:   (p = {})     => { const qs = new URLSearchParams(p).toString(); return req("GET", `/assignments${qs ? "?" + qs : ""}`); },
  addAssignment:    (d)          => req("POST", "/assignments", d),
  updateAssignment: (id, d)      => req("PUT",  `/assignments/${id}`, d),
  deleteAssignment: (id)         => req("DELETE",`/assignments/${id}`),
  getSubmissions:   (id)         => req("GET",  `/assignments/${id}/submissions`),
  submitAssignment: (id, fd)     => req("POST", `/assignments/${id}/submissions`, fd, true),
  gradeSubmission:  (aid,sid,d)  => req("PUT",  `/assignments/${aid}/submissions/${sid}/grade`, d),

  // ─── Exams ─────────────────────────────────────────────────────────────────
  getExams:      (p = {})  => { const qs = new URLSearchParams(p).toString(); return req("GET", `/exams${qs ? "?" + qs : ""}`); },
  getExam:       (id)      => req("GET",    `/exams/${id}`),
  addExam:       (d)       => req("POST",   "/exams", d),
  updateExam:    (id, d)   => req("PUT",    `/exams/${id}`, d),
  deleteExam:    (id)      => req("DELETE", `/exams/${id}`),
  addExamSubject:(eid, d)  => req("POST",   `/exams/${eid}/subjects`, d),
  getMarksSheet: (eid)     => req("GET",    `/exams/${eid}/marks`),
  saveMarks:     (eid, es) => req("POST",   `/exams/${eid}/marks`, { entries: es }),
  getResultCard: (eid,sid) => req("GET",    `/exams/${eid}/result/${sid}`),
  getMyResults:  (sid)     => req("GET",    `/exams/my-results?student_id=${sid}`),

  // ─── Fees ──────────────────────────────────────────────────────────────────
  getFeeStructures:  (cid)    => req("GET", `/fees/structures${cid ? "?class_id=" + cid : ""}`),
  addFeeStructure:   (d)      => req("POST","/fees/structures", d),
  updateFeeStructure:(id, d)  => req("PUT", `/fees/structures/${id}`, d),
  deleteFeeStructure:(id)     => req("DELETE",`/fees/structures/${id}`),
  getChallans: (p = {})       => { const qs = new URLSearchParams(p).toString(); return req("GET", `/fees/challans${qs ? "?" + qs : ""}`); },
  getChallan:  (id)           => req("GET", `/fees/challans/${id}`),
  generateChallans:(d)        => req("POST","/fees/challans/generate", d),
  uploadProof: (id, fd)       => req("POST",`/fees/challans/${id}/proof`, fd, true),
  verifyProof: (id)           => req("POST",`/fees/challans/${id}/verify`),
  rejectProof: (id)           => req("POST",`/fees/challans/${id}/reject`),
  draftAiFeeNotice: (id)      => req("POST","/fees/ai-draft-notice", { challan_id: id }),
  getFeeSummary: (p = {})     => { const qs = new URLSearchParams(p).toString(); return req("GET", `/fees/summary${qs ? "?" + qs : ""}`); },

  // ─── Financials ────────────────────────────────────────────────────────────
  getFinancialDashboard: (yr) => req("GET", `/financials/dashboard?year=${yr}`),
  getExpenses:           ()   => req("GET", "/financials/expenses"),
  addExpense:            (d)  => req("POST","/financials/expenses", d),
  updateExpense:         (id,d)=>req("PUT", `/financials/expenses/${id}`, d),
  deleteExpense:         (id) => req("DELETE",`/financials/expenses/${id}`),
  getSalaries:           ()   => req("GET", "/financials/salaries"),

  // ─── Timetable ─────────────────────────────────────────────────────────────
  getTimetable:       (cid) => req("GET", `/timetable?class_id=${cid}`),
  getMyTimetable:     (tid) => req("GET", `/timetable?teacher_id=${tid}`),
  addTimetableEntry:  (d)   => req("POST","/timetable", d),
  updateTimetableEntry:(id,d)=>req("PUT", `/timetable/${id}`, d),
  deleteTimetableEntry:(id) => req("DELETE",`/timetable/${id}`),

  // ─── Materials ─────────────────────────────────────────────────────────────
  getMaterials:   (p = {}) => { const qs = new URLSearchParams(p).toString(); return req("GET", `/materials${qs ? "?" + qs : ""}`); },
  uploadMaterial: (fd)     => req("POST","/materials", fd, true),
  deleteMaterial: (id)     => req("DELETE",`/materials/${id}`),

  // ─── Announcements ─────────────────────────────────────────────────────────
  getAnnouncements:  (role) => req("GET", `/announcements${role ? "?role=" + role : ""}`),
  addAnnouncement:   (d)    => req("POST","/announcements", d),
  updateAnnouncement:(id,d) => req("PUT", `/announcements/${id}`, d),
  deleteAnnouncement:(id)   => req("DELETE",`/announcements/${id}`),

  // ─── Settings ──────────────────────────────────────────────────────────────
  getSettings:  ()     => req("GET", "/settings"),
  saveSettings: (d)    => req("PUT", "/settings", d),
  getUsers:     ()     => req("GET", "/settings/users"),
  addUser:      (d)    => req("POST","/settings/users", d),
  deleteUser:   (id)   => req("DELETE",`/settings/users/${id}`),

  // ─── Diary ─────────────────────────────────────────────────────────────────
  getDiary:    (p = {}) => { const qs = new URLSearchParams(p).toString(); return req("GET", `/diary${qs ? "?" + qs : ""}`); },
  addDiary:    (d)      => req("POST",  "/diary", d),
  editDiary:   (id, d)  => req("PATCH", `/diary/${id}`, d),
  deleteDiary: (id)     => req("DELETE",`/diary/${id}`),

  // ─── Quizzes ───────────────────────────────────────────────────────────────
  getQuizzes:      (p = {}) => { const qs = new URLSearchParams(p).toString(); return req("GET", `/quizzes${qs ? "?" + qs : ""}`); },
  createQuiz:      (d)      => req("POST",  "/quizzes", d),
  updateQuizStatus:(id,st)  => req("PATCH", `/quizzes/${id}/status`, { status: st }),
  deleteQuiz:      (id)     => req("DELETE",`/quizzes/${id}`),
  getQuizQuestions:(id)     => req("GET",   `/quizzes/${id}/questions`),
  addQuestion:     (qid, d) => req("POST",  `/quizzes/${qid}/questions`, d),
  deleteQuestion:  (qid,qnid)=>req("DELETE",`/quizzes/${qid}/questions/${qnid}`),
  attemptQuiz:     (id, d)  => req("POST",  `/quizzes/${id}/attempt`, d),
  generateAiQuiz:  (qid, topic) => req("POST", `/quizzes/${qid}/generate-ai`, { topic }),
  getQuizResults:  (id)     => req("GET",   `/quizzes/${id}/results`),
  getMyAttempt:    (qid,sid)=> req("GET",   `/quizzes/${qid}/attempt/${sid}`),

  // ─── Notifications ─────────────────────────────────────────────────────────
  getNotifications: () => req("GET", "/reports/notifications"),

  // ─── Report data ───────────────────────────────────────────────────────────
  getAttendanceReport: (p={}) => { const qs=new URLSearchParams(p).toString(); return req("GET",`/reports/report/attendance${qs?"?"+qs:""}`); },
  getFeeReport:        (p={}) => { const qs=new URLSearchParams(p).toString(); return req("GET",`/reports/report/fees${qs?"?"+qs:""}`); },
  getAcademicReport:   (p={}) => { const qs=new URLSearchParams(p).toString(); return req("GET",`/reports/report/academic${qs?"?"+qs:""}`); },
  getAiPerformancePredictor: (p={}) => { const qs=new URLSearchParams(p).toString(); return req("GET",`/reports/ai-performance-predictor${qs?"?"+qs:""}`); },

  // ─── Operations ────────────────────────────────────────────────────────────
  getParentChildren:     (pid)      => req("GET",  `/operations/parents/${pid}/children`),
  getAdmissions:         ()         => req("GET",  "/operations/admissions"),
  submitAdmission:       (d)        => req("POST", "/operations/admissions", d),
  updateAdmissionStatus: (id,st,n)  => req("PUT",  `/operations/admissions/${id}/status`, { status:st, notes:n }),
  convertAdmission:      (id)       => req("POST", `/operations/admissions/${id}/convert`),
  getBooks:              ()         => req("GET",  "/operations/library/books"),
  addBook:               (d)        => req("POST", "/operations/library/books", d),
  getBookIssues:         ()         => req("GET",  "/operations/library/issues"),
  issueBook:             (d)        => req("POST", "/operations/library/issue", d),
  returnBook:            (iid)      => req("POST", `/operations/library/return/${iid}`),
  getTransportRoutes:    ()         => req("GET",  "/operations/transport/routes"),
  assignTransport:       (d)        => req("POST", "/operations/transport/assign", d),
  getLeaves:             ()         => req("GET",  "/operations/hr/leaves"),
  applyLeave:            (d)        => req("POST", "/operations/hr/leaves", d),
  updateLeaveStatus:     (id,st)    => req("PUT",  `/operations/hr/leaves/${id}/status`, { status:st }),
  getPayroll:            ()         => req("GET",  "/operations/hr/payroll"),
  getInventory:          ()         => req("GET",  "/operations/inventory"),
  addInventoryItem:      (d)        => req("POST", "/operations/inventory", d),
  getDiscipline:         ()         => req("GET",  "/operations/discipline"),
  addDisciplineRecord:   (d)        => req("POST", "/operations/discipline", d),
  getEvents:             ()         => req("GET",  "/operations/events"),
  addEvent:              (d)        => req("POST", "/operations/events", d),
  getAuditLogs:          ()         => req("GET",  "/operations/audit-logs"),
  updateUserStatus:      (id,st)    => req("PUT",  `/operations/users/${id}/status`, { status:st }),
  changePassword:        (d)        => req("POST", "/operations/users/change-password", d),
  askAiAssistant:        (d)        => req("POST", "/operations/ai-assistant", d),

  UPLOADS: UPLOADS_BASE,
};
