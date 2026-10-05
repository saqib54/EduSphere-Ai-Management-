export const initialStudents = [
  { id: "STU-2026-001", name: "Areeba Hassan", className: "Class 9-A", roll: "09-A-12", attendance: 96, grade: "A", fee: "Paid", guardian: "Hassan Raza", phone: "0301 2345678" },
  { id: "STU-2026-002", name: "Muhammad Hamza", className: "Class 10-B", roll: "10-B-07", attendance: 92, grade: "A", fee: "Pending", guardian: "Imran Ahmed", phone: "0302 4567890" },
  { id: "STU-2026-003", name: "Sana Zahid", className: "Class 8-A", roll: "08-A-21", attendance: 89, grade: "B+", fee: "Paid", guardian: "Zahid Mehmood", phone: "0303 5678901" },
  { id: "STU-2026-004", name: "Fahad Ali", className: "Class 11-A", roll: "11-A-05", attendance: 94, grade: "A", fee: "Paid", guardian: "Ali Akbar", phone: "0304 6789012" },
  { id: "STU-2026-005", name: "Noor Fatima", className: "Class 7-B", roll: "07-B-16", attendance: 87, grade: "B", fee: "Overdue", guardian: "Usman Tariq", phone: "0305 7890123" },
  { id: "STU-2026-006", name: "Bilal Hussain", className: "Class 12-A", roll: "12-A-03", attendance: 91, grade: "A-", fee: "Pending", guardian: "Hussain Shah", phone: "0306 8901234" },
];

export const initialTeachers = [
  { id: "TCH-001", name: "Ahmed Raza", subject: "English", classes: "9-A, 10-B", phone: "0301 1234567", email: "ahmed@edusphere.edu.pk", status: "Active" },
  { id: "TCH-002", name: "Fatima Noor", subject: "Mathematics", classes: "8-A, 9-A", phone: "0300 1234567", email: "fatima@edusphere.edu.pk", status: "Active" },
  { id: "TCH-003", name: "Sana Malik", subject: "Science", classes: "7-B, 8-A", phone: "0302 3456789", email: "sana@edusphere.edu.pk", status: "Active" },
  { id: "TCH-004", name: "Nadia Hussain", subject: "Physics", classes: "11-A, 12-A", phone: "0304 6781122", email: "nadia@edusphere.edu.pk", status: "On Leave" },
];

export const attendanceTrend = [
  { day: "Mon", date: "31 Aug", value: 88 }, { day: "Tue", date: "1 Sep", value: 90 },
  { day: "Wed", date: "2 Sep", value: 91 }, { day: "Thu", date: "3 Sep", value: 93 },
  { day: "Fri", date: "4 Sep", value: 92 }, { day: "Sat", date: "5 Sep", value: 90 },
  { day: "Sun", date: "6 Sep", value: 92 },
];

export const schedule = [
  { time: "08:00 – 08:40", className: "Class 9-A", subject: "Mathematics", teacher: "Fatima Noor", room: "R-101" },
  { time: "08:40 – 09:20", className: "Class 10-B", subject: "English", teacher: "Ahmed Raza", room: "R-203" },
  { time: "09:20 – 10:00", className: "Class 8-A", subject: "Science", teacher: "Sana Malik", room: "Lab-1" },
  { time: "10:20 – 11:00", className: "Class 11-A", subject: "Physics", teacher: "Nadia Hussain", room: "R-301" },
  { time: "11:00 – 11:40", className: "Class 12-A", subject: "Computer Science", teacher: "Fahad Sheikh", room: "Lab-2" },
];

export const initialAssignments = [
  { id: 1, title: "Quadratic Equations Worksheet", subject: "Mathematics", className: "Class 9-A", due: "Sep 8, 2026", submitted: 27, total: 32, status: "Active" },
  { id: 2, title: "Cell Division Lab Report", subject: "Biology", className: "Class 11-A", due: "Sep 9, 2026", submitted: 20, total: 25, status: "Active" },
  { id: 3, title: "Urdu Composition", subject: "Urdu", className: "Class 7-B", due: "Sep 7, 2026", submitted: 29, total: 30, status: "Due soon" },
  { id: 4, title: "Python Lists Practice", subject: "Computer Science", className: "Class 12-A", due: "Sep 12, 2026", submitted: 18, total: 24, status: "Active" },
];

export const exams = [
  { name: "September Monthly Test", className: "Class 9-A", type: "Monthly Test", dates: "Sep 14 – Sep 18", subjects: 7, marked: 3, average: "78.4%" },
  { name: "Mid Term Examination", className: "Class 10-B", type: "Term", dates: "Oct 5 – Oct 16", subjects: 8, marked: 0, average: "—" },
  { name: "Physics Practical", className: "Class 11-A", type: "Practical", dates: "Sep 21", subjects: 1, marked: 1, average: "82.1%" },
];

export const initialFees = [
  { id: "CH-26091", student: "Areeba Hassan", className: "Class 9-A", amount: 12500, due: "Sep 10, 2026", status: "Paid", proof: "Verified" },
  { id: "CH-26092", student: "Muhammad Hamza", className: "Class 10-B", amount: 14000, due: "Sep 10, 2026", status: "Pending", proof: "Uploaded" },
  { id: "CH-26093", student: "Sana Zahid", className: "Class 8-A", amount: 11000, due: "Sep 10, 2026", status: "Paid", proof: "Verified" },
  { id: "CH-26094", student: "Noor Fatima", className: "Class 7-B", amount: 10500, due: "Sep 2, 2026", status: "Overdue", proof: "Not uploaded" },
  { id: "CH-26095", student: "Bilal Hussain", className: "Class 12-A", amount: 15000, due: "Sep 10, 2026", status: "Pending", proof: "Uploaded" },
];

export const materials = [
  { title: "Chapter 4 — Algebra Guide", subject: "Mathematics", className: "Class 9-A", type: "PDF", size: "2.4 MB", uploaded: "Sep 5, 2026" },
  { title: "Cell Biology Slides", subject: "Biology", className: "Class 11-A", type: "PPTX", size: "5.1 MB", uploaded: "Sep 4, 2026" },
  { title: "Python Practice Files", subject: "Computer Science", className: "Class 12-A", type: "ZIP", size: "1.8 MB", uploaded: "Sep 3, 2026" },
  { title: "English Grammar Revision", subject: "English", className: "Class 10-B", type: "PDF", size: "1.2 MB", uploaded: "Sep 2, 2026" },
];
