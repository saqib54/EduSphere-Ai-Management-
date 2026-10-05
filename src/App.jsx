import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bell, BookOpen, Buildings, CalendarBlank, CalendarDots, CaretDown, CaretLeft, CaretRight,
  ChalkboardTeacher, ChartBar, CheckCircle, Coins, DownloadSimple, Exam, FileText,
  FolderOpen, Gear, GraduationCap, House, ListChecks, MagnifyingGlass, Megaphone,
  Money, Notebook, NotePencil, Plus, Printer, Question, Receipt, SidebarSimple, Student,
  Timer, Trash, UploadSimple, UserPlus, UsersThree, Warning, X, XCircle, CurrencyDollar,
  ChartLine, ArrowClockwise, Eye, EyeSlash, PencilSimple, CheckSquare, ArrowRight, Star,
  Book, Bus, Robot, Globe, ShieldCheck, IdentificationCard, ShieldWarning, Sparkle
} from "@phosphor-icons/react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { api, auth } from "./api.js";

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const fmt = (n) => Number(n || 0).toLocaleString("en-PK");
const fmtPKR = (n) => `PKR ${fmt(n)}`;
const today = () => new Date().toISOString().split("T")[0];
const gradeColor = (g) => ({ "A+": "#12a866", "A": "#1da85d", "B+": "#2176f3", "B": "#5da4f9", "C": "#f59e0b", "D": "#fb923c", "F": "#ef4444" })[g] || "#2176f3";
const pctToGrade = (p) => p >= 90 ? "A+" : p >= 80 ? "A" : p >= 70 ? "B+" : p >= 60 ? "B" : p >= 50 ? "C" : p >= 40 ? "D" : "F";

const PRINT_SCHOOL_LOGO = `<svg width="44" height="44" viewBox="0 0 512 512" style="vertical-align:middle;flex-shrink:0"><rect width="512" height="512" rx="96" fill="#4f6ef7"/><path d="M 140 330 C 180 300 236 300 256 312 C 276 300 332 300 372 330 L 372 200 C 332 170 276 170 256 182 C 236 170 180 170 140 200 Z" fill="none" stroke="#ffffff" stroke-width="24" stroke-linecap="round" stroke-linejoin="round"/><path d="M 256 182 L 256 312" fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round"/><path d="M 256 110 L 360 160 L 256 210 L 152 160 Z" fill="#f97316" stroke="#ffffff" stroke-width="10" stroke-linejoin="round"/></svg>`;

function printResultCard(studentName, rollNo, className, examName, marksList, totalObtained, totalMax, overallPct, overallGrade) {
  const win = window.open("", "_blank", "width=800,height=600");
  win.document.write(`<html><head><title>Result Card - ${studentName}</title><style>
    body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1e293b;padding:32px;background:#fff}
    .card{border:2px solid #1e3a5f;border-radius:12px;padding:28px;max-width:700px;margin:0 auto}
    .header{text-align:center;border-bottom:2px solid #2176f3;padding-bottom:16px;margin-bottom:20px}
    .header h1{margin:0;font-size:22px;color:#1e3a5f;letter-spacing:1px}
    .header p{margin:4px 0 0;color:#64748b;font-size:12px}
    .meta{display:grid;grid-template-columns:1fr 1fr;gap:12px;background:#f8fafc;padding:12px 16px;border-radius:8px;margin-bottom:20px;font-size:13px}
    table{width:100%;border-collapse:collapse;margin:16px 0}
    th,td{border:1px solid #cbd5e1;padding:8px 12px;text-align:left}
    th{background:#f1f5f9;color:#334155;font-weight:700}
    .total-row{font-weight:700;background:#f8fafc}
    .grade-box{text-align:center;padding:16px;background:#eff6ff;border-radius:8px;margin-top:20px;display:flex;justify-content:space-around;align-items:center}
    .footer{margin-top:40px;display:flex;justify-content:space-between;padding-top:20px}
    .sig{border-top:1px solid #94a3b8;width:180px;text-align:center;font-size:12px;color:#64748b;padding-top:4px}
    @media print{.noprint{display:none}}
  </style></head><body>
    <div class="card">
      <div class="header">
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px">
          ${PRINT_SCHOOL_LOGO}
          <div>
            <h1 style="margin:0;font-size:22px;color:#1e3a5f;letter-spacing:1px">EDUSPHERE SCHOOL & COLLEGE</h1>
            <p style="margin:2px 0 0;color:#64748b;font-size:12px">Official Student Progress Report Card</p>
          </div>
        </div>
        <h3 style="margin-top:10px;color:#2176f3">${examName}</h3>
      </div>
      <div class="meta">
        <div><b>Student Name:</b> ${studentName}</div>
        <div><b>Roll No:</b> ${rollNo || "—"}</div>
        <div><b>Class / Section:</b> ${className}</div>
        <div><b>Issue Date:</b> ${new Date().toLocaleDateString("en-PK")}</div>
      </div>
      <table>
        <thead><tr><th>#</th><th>Subject</th><th>Max Marks</th><th>Obtained Marks</th><th>Status / Grade</th></tr></thead>
        <tbody>
          ${marksList.map((m, i) => {
            const pct = m.max_marks > 0 ? Math.round((m.obtained_marks / m.max_marks) * 100) : 0;
            return `<tr><td>${i+1}</td><td>${m.subject_name}</td><td>${m.max_marks}</td><td>${m.is_absent ? "Absent" : m.obtained_marks}</td><td>${pctToGrade(pct)} (${pct}%)</td></tr>`;
          }).join("")}
          <tr class="total-row">
            <td colspan="2"><b>TOTAL</b></td>
            <td><b>${totalMax}</b></td>
            <td><b>${totalObtained}</b></td>
            <td><b>${overallPct}% (${overallGrade})</b></td>
          </tr>
        </tbody>
      </table>
      <div class="grade-box">
        <div><small>Percentage</small><br/><b style="font-size:20px;color:#2176f3">${overallPct}%</b></div>
        <div><small>Final Grade</small><br/><b style="font-size:24px;color:#12a866">${overallGrade}</b></div>
      </div>
      <div class="footer">
        <div class="sig">Class Teacher</div>
        <div class="sig">Principal Signature</div>
      </div>
    </div>
    <div class="noprint" style="text-align:center;margin-top:20px">
      <button onclick="window.print()" style="padding:10px 24px;background:#2176f3;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold">🖨 Print Result Card</button>
    </div>
  </body></html>`);
  win.document.close();
}

function printPaySlip(teacher, month, year, settings = {}) {
  const win = window.open("", "_blank", "width=850,height=750");
  const currentMonth = month || new Date().toLocaleString("en-US", { month: "long" });
  const currentYear = year || new Date().getFullYear();
  const schoolName = settings.school_name || "EDUSPHERE SCHOOL & COLLEGE";
  const address = settings.address || "Main Academic Campus, Sector H-8, Islamabad";
  const phone = settings.phone || "+92 51 111 222 333";
  const schoolCode = settings.school_code || "EDU-PK-9902";

  const baseSalary = Number(teacher.salary || 0);
  const houseRent = Math.round(baseSalary * 0.15);
  const medical = Math.round(baseSalary * 0.05);
  const grossSalary = baseSalary + houseRent + medical;

  win.document.write(`<html><head><title>Pay Slip - ${teacher.name} (${currentMonth} ${currentYear})</title><style>
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 13px; color: #1e293b; padding: 32px; background: #fff; }
    .slip-box { border: 2px solid #1e3a5f; border-radius: 12px; padding: 28px; max-width: 750px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
    .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; position: relative; }
    .header h1 { margin: 0; font-size: 22px; color: #1e3a5f; letter-spacing: 0.5px; text-transform: uppercase; }
    .header p { margin: 4px 0 0; color: #64748b; font-size: 12px; }
    .badge-paid { position: absolute; top: 0; right: 0; background: #12a866; color: #fff; padding: 4px 12px; border-radius: 20px; font-weight: 800; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    .title-strip { background: #1e3a5f; color: #fff; text-align: center; padding: 8px 12px; font-weight: 700; font-size: 14px; border-radius: 6px; margin-bottom: 20px; letter-spacing: 0.5px; }
    .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px 20px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px; font-size: 13px; }
    .details-grid div { display: flex; justify-content: space-between; border-bottom: 1px dotted #cbd5e1; padding-bottom: 4px; }
    .details-grid div b { color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    th { background: #f1f5f9; color: #334155; font-weight: 700; }
    .total-row { font-weight: 800; background: #eff6ff; color: #1e3a5f; font-size: 14px; }
    .footer { margin-top: 45px; display: flex; justify-content: space-between; padding-top: 20px; }
    .sig { border-top: 1px solid #94a3b8; width: 200px; text-align: center; font-size: 12px; color: #64748b; padding-top: 6px; }
    @media print { .noprint { display: none; } }
  </style></head><body>
    <div class="slip-box">
      <div class="header">
        <span class="badge-paid">✓ PAID</span>
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:8px">
          ${PRINT_SCHOOL_LOGO}
          <div>
            <h1 style="margin:0;font-size:22px;color:#1e3a5f;letter-spacing:0.5px">${schoolName}</h1>
            <p style="margin:2px 0 0;color:#64748b;font-size:12px">${address} &middot; Ph: ${phone}</p>
          </div>
        </div>
      </div>
        <h1>${schoolName}</h1>
        <p>${address} Â· Tel: ${phone} Â· Code: ${schoolCode}</p>
      </div>
      <div class="title-strip">
        STAFF SALARY PAY SLIP â€” ${currentMonth.toUpperCase()} ${currentYear}
      </div>
      <div class="details-grid">
        <div><span>Employee ID:</span><b>${teacher.emp_id || "EMP-001"}</b></div>
        <div><span>Employee Name:</span><b>${teacher.name}</b></div>
        <div><span>Qualification:</span><b>${teacher.qualification || "M.A. / B.Ed"}</b></div>
        <div><span>Designation:</span><b>Senior Faculty / Teacher</b></div>
        <div><span>Contact Phone:</span><b>${teacher.phone || "N/A"}</b></div>
        <div><span>Email Address:</span><b>${teacher.email || "N/A"}</b></div>
        <div><span>Joining Date:</span><b>${teacher.join_date || "N/A"}</b></div>
        <div><span>Employment Status:</span><b>${teacher.status || "Active"}</b></div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Earnings / Allowance Description</th>
            <th style="text-align:right">Amount (PKR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Basic Monthly Salary</td>
            <td style="text-align:right">PKR ${baseSalary.toLocaleString("en-PK")}</td>
          </tr>
          <tr>
            <td>House Rent Allowance (15%)</td>
            <td style="text-align:right">PKR ${houseRent.toLocaleString("en-PK")}</td>
          </tr>
          <tr>
            <td>Medical & Transport Allowance (5%)</td>
            <td style="text-align:right">PKR ${medical.toLocaleString("en-PK")}</td>
          </tr>
          <tr class="total-row">
            <td>GROSS PAYABLE SALARY</td>
            <td style="text-align:right">PKR ${grossSalary.toLocaleString("en-PK")}</td>
          </tr>
        </tbody>
      </table>
      <div style="background: #f8fafc; padding: 10px 14px; border-radius: 6px; font-size: 11px; color: #64748b; border: 1px solid #e2e8f0; margin-top: 16px;">
        * Note: This pay slip is computer-generated by EduSphere School Management System. Salary paid via direct bank deposit or account payee cheque.
      </div>
      <div class="footer">
        <div class="sig">Accounts Officer / Accountant</div>
        <div class="sig">Principal / Administrator Signature</div>
      </div>
    </div>
    <div class="noprint" style="text-align:center;margin-top:20px">
      <button onclick="window.print()" style="padding:10px 24px;background:#2176f3;color:#fff;border:none;border-radius:6px;cursor:pointer;font-weight:bold;font-size:14px">ðŸ–¨ Print / Download Pay Slip</button>
    </div>
  </body></html>`);
  win.document.close();
}

// â”€â”€â”€ Navigation defs per role â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€â”€ Navigation defs per role (12 Roles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const ADMIN_NAV = [
  { id: "dashboard",     label: "Dashboard",          icon: House },
  { id: "admissions",    label: "Admissions Desk",    icon: UserPlus },
  { id: "academics",     label: "Academic Years",      icon: CalendarBlank },
  { id: "classes",       label: "Classes & Subjects",  icon: Buildings },
  { id: "teachers",      label: "Teachers & Staff",    icon: ChalkboardTeacher },
  { id: "students",      label: "Students",            icon: Student },
  { id: "attendance",    label: "Attendance",          icon: ListChecks },
  { id: "assignments",   label: "Assignments",         icon: Notebook },
  { id: "exams",         label: "Exams & Results",     icon: Exam },
  { id: "fees",          label: "Fees & Challans",     icon: Receipt },
  { id: "financials",    label: "Financial Mgmt",      icon: ChartLine },
  { id: "timetable",     label: "Timetable",           icon: CalendarDots },
  { id: "materials",     label: "Study Materials",     icon: FolderOpen },
  { id: "library",       label: "Library Mgmt",        icon: Book },
  { id: "transport",     label: "Transport Fleet",     icon: Bus },
  { id: "hr-payroll",    label: "HR & Payroll",        icon: Money },
  { id: "inventory",     label: "Inventory",           icon: Buildings },
  { id: "discipline",    label: "Discipline & Merit",  icon: ShieldCheck },
  { id: "certificates",  label: "Certificates & IDs",  icon: IdentificationCard },
  { id: "events",        label: "Events Calendar",     icon: CalendarDots },
  { id: "announcements", label: "Communication",       icon: Megaphone },
  { id: "reports",       label: "Reports",             icon: ChartBar },
  { id: "audit-logs",    label: "Audit Logs",          icon: ShieldWarning },
];

const PRINCIPAL_NAV = ADMIN_NAV;
const SUPERADMIN_NAV = ADMIN_NAV;
const SCHOOLADMIN_NAV = ADMIN_NAV;
const VICEPRINCIPAL_NAV = ADMIN_NAV;

const TEACHER_NAV = [
  { id: "dashboard",     label: "My Dashboard",        icon: House },
  { id: "my-classes",    label: "My Classes",          icon: Buildings },
  { id: "diary",         label: "Class Diary",         icon: NotePencil },
  { id: "quizzes",       label: "Quizzes",             icon: Question },
  { id: "assignments",   label: "Assignments",         icon: Notebook },
  { id: "attendance",    label: "Take Attendance",     icon: ListChecks },
  { id: "exams",         label: "Marks & Exams",       icon: Exam },
  { id: "materials",     label: "Study Materials",     icon: FolderOpen },
  { id: "library",       label: "Library Catalog",     icon: Book },
  { id: "announcements", label: "Announcements",       icon: Megaphone },
  { id: "timetable",     label: "My Timetable",        icon: CalendarDots },
  { id: "hr-payroll",    label: "My Pay Slip",         icon: Money },
];

const STUDENT_NAV = [
  { id: "dashboard",     label: "My Dashboard",        icon: House },
  { id: "diary",         label: "Class Diary",         icon: NotePencil },
  { id: "quizzes",       label: "Quizzes",             icon: Question },
  { id: "assignments",   label: "Assignments",         icon: Notebook },
  { id: "my-results",    label: "My Results",          icon: GraduationCap },
  { id: "my-attendance", label: "My Attendance",       icon: ListChecks },
  { id: "fees",          label: "Fee & Challan",       icon: Receipt },
  { id: "materials",     label: "Study Materials",     icon: FolderOpen },
  { id: "library",       label: "Library Catalog",     icon: Book },
  { id: "transport",     label: "My Transport",        icon: Bus },
  { id: "announcements", label: "Announcements",       icon: Megaphone },
  { id: "timetable",     label: "My Timetable",        icon: CalendarDots },
];

const PARENT_NAV = [
  { id: "dashboard",     label: "Parent Dashboard",    icon: House },
  { id: "diary",         label: "Class Diary",         icon: NotePencil },
  { id: "my-results",    label: "Children Results",    icon: GraduationCap },
  { id: "fees",          label: "Fee Challans",        icon: Receipt },
  { id: "timetable",     label: "Class Timetable",     icon: CalendarDots },
  { id: "library",       label: "Library Books",       icon: Book },
  { id: "transport",     label: "School Transport",    icon: Bus },
  { id: "announcements", label: "Announcements",       icon: Megaphone },
];

const ACCOUNTANT_NAV = [
  { id: "dashboard",     label: "Dashboard",          icon: House },
  { id: "fees",          label: "Fees & Challans",     icon: Receipt },
  { id: "financials",    label: "Financial Mgmt",      icon: ChartLine },
  { id: "hr-payroll",    label: "Staff Payroll",       icon: Money },
  { id: "reports",       label: "Financial Reports",   icon: ChartBar },
];

const LIBRARIAN_NAV = [
  { id: "dashboard",     label: "Dashboard",          icon: House },
  { id: "library",       label: "Book Catalog & Issues", icon: Book },
  { id: "announcements", label: "Announcements",       icon: Megaphone },
];

const RECEPTIONIST_NAV = [
  { id: "dashboard",     label: "Dashboard",          icon: House },
  { id: "admissions",    label: "Admissions Desk",    icon: UserPlus },
  { id: "students",      label: "Student Registry",    icon: Student },
  { id: "events",        label: "Events & Meetings",   icon: CalendarDots },
  { id: "announcements", label: "Announcements",       icon: Megaphone },
];

const HRMANAGER_NAV = [
  { id: "dashboard",     label: "Dashboard",          icon: House },
  { id: "teachers",      label: "Staff Directory",     icon: ChalkboardTeacher },
  { id: "hr-payroll",    label: "HR, Leaves & Payroll", icon: Money },
  { id: "reports",       label: "HR Reports",          icon: ChartBar },
];

const TRANSPORT_NAV = [
  { id: "dashboard",     label: "Dashboard",          icon: House },
  { id: "transport",     label: "Fleet & Routes",      icon: Bus },
  { id: "announcements", label: "Announcements",       icon: Megaphone },
];

// â”€â”€â”€ Shared UI atoms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function Avatar({ name = "" }) {
  return <span className="avatar">{name.split(" ").map(n => n[0]).slice(0, 2).join("")}</span>;
}
function Status({ children }) {
  const cls = String(children).toLowerCase().replaceAll(" ", "-").replaceAll("/", "");
  return <span className={`status status-${cls}`}>{children}</span>;
}
function Spin() { return <div className="spinner" />; }
function EmptyState({ icon: Icon = FileText, message = "No records found." }) {
  return <div className="empty-state"><Icon size={36} /><p>{message}</p></div>;
}
function IconBtn({ label, children, onClick, className = "", danger = false }) {
  return <button className={`icon-button ${className} ${danger ? "danger" : ""}`} aria-label={label} title={label} onClick={onClick}>{children}</button>;
}
function Btn({ children, onClick, className = "primary-button", type = "button", disabled = false }) {
  return <button type={type} className={className} onClick={onClick} disabled={disabled}>{children}</button>;
}
// Confirm dialog â€” prevents accidental deletes
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onCancel()}>
      <div className="modal confirm-dialog" role="alertdialog" aria-modal="true">
        <header><div><span className="modal-kicker">Confirm Action</span><h2>Are you sure?</h2></div></header>
        <div style={{ padding: "16px 24px 8px" }}><p style={{ color: "#4a5e74", fontSize: 14 }}>{message}</p></div>
        <footer className="modal-actions" style={{ padding: "12px 24px 20px" }}>
          <Btn className="secondary-button" onClick={onCancel}>Cancel</Btn>
          <Btn className="primary-button danger" onClick={onConfirm}>Yes, Delete</Btn>
        </footer>
      </div>
    </div>
  );
}
// Hook for easy confirm dialogs
function useConfirm() {
  const [state, setState] = useState(null);
  const confirm = (message) => new Promise(resolve => setState({ message, resolve }));
  const dialog = state ? (
    <ConfirmDialog
      message={state.message}
      onConfirm={() => { state.resolve(true);  setState(null); }}
      onCancel={() =>  { state.resolve(false); setState(null); }}
    />
  ) : null;
  return [confirm, dialog];
}
function StatCard({ label, value, note, icon: Icon, tone }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <div className="stat-top"><span>{label}</span><span className="stat-icon"><Icon size={24} weight="duotone" /></span></div>
      <strong>{value}</strong><small>{note}</small>
    </div>
  );
}
function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-header">
        <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
        {action}
      </header>
      {children}
    </section>
  );
}
function PageHeader({ title, subtitle, action, actionLabel, icon: Icon = Plus, sticker }) {
  return (
    <div className="page-header">
      <div>
        <span className="breadcrumb">EduSphere / {title}</span>
        <h1 style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {title}
          {sticker && <img src={sticker} className="sticker-img" style={{ width: 36, height: 36, objectFit: "contain" }} alt="Sticker" />}
        </h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <button className="primary-button" onClick={action}><Icon size={18} weight="bold" />{actionLabel}</button>}
    </div>
  );
}
function DataTable({ columns, rows, actions, emptyMsg }) {
  if (!rows?.length) return <EmptyState message={emptyMsg || "No records found."} />;
  return (
    <div className="table-wrap">
      <table>
        <thead><tr>{columns.map(c => <th key={c}>{c}</th>)}{actions && <th>Actions</th>}</tr></thead>
        <tbody>{rows.map((row, i) => (
          <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}{actions && <td>{actions(i)}</td>}</tr>
        ))}</tbody>
      </table>
    </div>
  );
}
function Modal({ title, onClose, children, wide = false }) {
  return (
    <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true">
        <header>
          <div><span className="modal-kicker">EduSphere</span><h2>{title}</h2></div>
          <IconBtn label="Close" onClick={onClose}><X size={20} /></IconBtn>
        </header>
        {children}
      </div>
    </div>
  );
}

// â”€â”€â”€ Login Screen â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function LoginScreen({ onLogin }) {
  const [tab, setTab] = useState("login");           // "login" | "signup"
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);

  // Auto-advance hero slide dots
  useEffect(() => {
    const t = setInterval(() => setSlide(s => (s + 1) % 3), 3500);
    return () => clearInterval(t);
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const res = await api.login(username, password);
      if (remember) localStorage.setItem("edusphere-remember", username);
      onLogin(res.user);
    } catch (ex) {
      setErr(ex.message || "Invalid username or password");
    } finally { setLoading(false); }
  }

  const features = [
    { icon: BookOpen, label: "Easy Learning", bg: "#6c63ff" },
    { icon: UsersThree, label: "Smart Attendance", bg: "#22c55e" },
    { icon: ChartBar, label: "Track Progress", bg: "#ef4444" },
    { icon: Megaphone, label: "Stay Connected", bg: "#f59e0b" },
  ];

  return (
    <div className="ls-root">
      {/* â”€â”€ LEFT HERO PANEL â”€â”€ */}
      <div className="ls-hero">
        {/* Nav bar */}
        <nav className="ls-nav">
          <div className="ls-logo">
            <span className="ls-logo-icon"><BookOpen size={22} weight="fill" /></span>
            <div><b>EduSphere</b><small>SCHOOL SYSTEM</small></div>
          </div>
          <div className="ls-nav-links">
            <span>Students</span><span>Teachers</span><span>Parents</span><span className="ls-nav-cta">A Brighter Tomorrow</span>
          </div>
        </nav>

        {/* Hero text */}
        <div className="ls-hero-content">
          <div className="ls-eyebrow">EDUCATION BEYOND BOUNDARIES</div>
          <h1 className="ls-headline">
            Empowering<br />Students for a<br />
            <span className="ls-headline-accent">Brighter Tomorrow</span>
          </h1>
          <p className="ls-hero-sub">A modern and integrated school system to connect<br />students, teachers, and parents â€” all in one place.</p>

          {/* Feature icons row */}
          <div className="ls-features">
            {features.map(({ icon: Icon, label, bg }) => (
              <div className="ls-feat" key={label}>
                <span style={{ background: bg }}><Icon size={20} weight="fill" /></span>
                <small>{label}</small>
              </div>
            ))}
          </div>

          {/* Quote */}
          <blockquote className="ls-quote">
            <em>"Education is not the filling of a pail, but the lighting of a fire."</em>
            <footer>â€” W.B. Yeats</footer>
          </blockquote>

          {/* Slide dots */}
          <div className="ls-dots">
            {[0,1,2].map(i => <button key={i} className={`ls-dot ${slide === i ? "active" : ""}`} onClick={() => setSlide(i)} />)}
          </div>
        </div>

        {/* Floating card â€” top right */}
        <div className="ls-float ls-float-tr">
          <div className="ls-float-content">
            <Star size={16} weight="fill" style={{ color: "#f59e0b" }} />
            <div><b>Great Students</b><small>Brighter Futures</small></div>
          </div>
        </div>

        {/* Floating card â€” bottom */}
        <div className="ls-float ls-float-br">
          <div className="ls-float-content">
            <img src="/mascot_sticker.png" style={{ width: 38, height: 38, objectFit: "contain" }} alt="Mascot" />
            <div><b>Better Education</b><small>Happier Futures</small></div>
          </div>
        </div>

        {/* Student photo */}
        <img src="/student_hero.png" alt="Student" className="ls-student-img" />

        {/* Background arcs */}
        <div className="ls-arc ls-arc1" />
        <div className="ls-arc ls-arc2" />
      </div>

      {/* â”€â”€ RIGHT AUTH PANEL â”€â”€ */}
      <div className="ls-auth">
        {/* Handwritten tagline */}
        <div className="ls-tagline">
          <span>Same<br />Learners<br /><b>Brighter<br />Tomorrows</b></span>
        </div>

        <div className="ls-form-wrap">
          {/* Form Header with Mascot Sticker */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <img src="/mascot_sticker.png" style={{ width: 48, height: 48, objectFit: "contain" }} className="sticker-img" alt="Mascot" />
            <div>
              <h2 className="ls-title" style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>Welcome Back</h2>
              <p className="ls-subtitle" style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Log in to your EduSphere School Portal</p>
            </div>
          </div>

          {/* Login / Sign Up tabs */}
          <div className="ls-tabs">
            <button className={tab === "login" ? "active" : ""} onClick={() => { setTab("login"); setErr(""); }}>Login</button>
            <button className={tab === "signup" ? "active" : ""} onClick={() => { setTab("signup"); setErr(""); alert("Student/Teacher Registration: Online registrations are managed by the Admissions Desk. Click '1-Click Demo Login' or submit an application on the Public Portal."); }}>Sign Up</button>
          </div>

          {/* Quick Demo 1-Click Login Chips */}
          <div style={{ margin: "14px 0", background: "#f8fafc", padding: "10px 12px", borderRadius: 12, border: "1px stroke #cbd5e1" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#4f6ef7", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 6 }}>
              <Sparkle size={14} weight="fill" /> 1-Click Demo Login
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button type="button" onClick={() => { setUsername("principal"); setPassword("admin123"); setErr(""); }} style={{ padding: "5px 10px", background: "#4f6ef7", color: "#fff", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none" }}>
                🏫 Principal
              </button>
              <button type="button" onClick={() => { setUsername("fatima"); setPassword("teacher123"); setErr(""); }} style={{ padding: "5px 10px", background: "#8b5cf6", color: "#fff", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none" }}>
                👩‍🏫 Teacher
              </button>
              <button type="button" onClick={() => { setUsername("areeba"); setPassword("student123"); setErr(""); }} style={{ padding: "5px 10px", background: "#22c55e", color: "#fff", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none" }}>
                🎓 Student
              </button>
              <button type="button" onClick={() => { setUsername("parent"); setPassword("parent123"); setErr(""); }} style={{ padding: "5px 10px", background: "#f97316", color: "#fff", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", border: "none" }}>
                👨‍👩‍👧 Parent
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="ls-form" autoComplete="on">
            {/* Username / Email */}
            <div className="ls-input-group">
              <span className="ls-input-icon"><MagnifyingGlass size={17} /></span>
              <input
                id="ls-username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Username or Email Address"
                required autoFocus
              />
            </div>

            {/* Password */}
            <div className="ls-input-group">
              <span className="ls-input-icon"><Eye size={17} /></span>
              <input
                id="ls-password"
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
              <button type="button" className="ls-eye-btn" onClick={() => setShowPass(v => !v)} aria-label="Toggle password">
                {showPass ? <EyeSlash size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Remember + Forgot */}
            <div className="ls-row-between">
              <label className="ls-remember">
                <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
                Remember me
              </label>
              <button type="button" className="ls-forgot" onClick={() => alert("Password Recovery:\nPlease contact the IT Admin at admin@edusphere.edu.pk or phone +92-52-1234567.")}>Forgot Password?</button>
            </div>

            {/* Error message */}
            {err && <div className="ls-error"><Warning size={16} />{err}</div>}

            {/* Submit */}
            <button type="submit" className="ls-submit" disabled={loading}>
              {loading ? "Signing inâ€¦" : <><span>Log In</span><ArrowRight size={18} weight="bold" /></>}
            </button>
          </form>

          {/* OR divider */}
          <div className="ls-divider"><span>OR</span></div>

          {/* Social buttons */}
          <button className="ls-social" type="button">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.6 2.2 30.1 0 24 0 14.7 0 6.7 5.6 3 13.7l7.8 6C12.7 13 17.9 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8C43.9 37.4 46.5 31.4 46.5 24.5z"/><path fill="#FBBC05" d="M10.8 28.3A14.5 14.5 0 0 1 9.5 24c0-1.5.3-2.9.7-4.3l-7.8-6A24 24 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.3-6.3z"/><path fill="#34A853" d="M24 48c6.1 0 11.2-2 14.9-5.4l-7.5-5.8c-2 1.4-4.6 2.2-7.4 2.2-6.1 0-11.3-3.5-13.2-8.7l-8.3 6.3C6.7 42.4 14.7 48 24 48z"/></svg>
            Continue with Google
          </button>
          <button className="ls-social" type="button">
            <svg width="18" height="18" viewBox="0 0 21 21"><rect width="10" height="10" fill="#F25022"/><rect x="11" width="10" height="10" fill="#7FBA00"/><rect y="11" width="10" height="10" fill="#00A4EF"/><rect x="11" y="11" width="10" height="10" fill="#FFB900"/></svg>
            Continue with Microsoft
          </button>

          {/* Sign up prompt */}
          <p className="ls-signup-prompt">Don't have an account? <button type="button" onClick={() => setTab("signup")} className="ls-link">Sign Up</button></p>

          {/* Security note */}
          <p className="ls-secure"><CheckCircle size={13} weight="fill" /> Your data is secure with us</p>

          {/* Demo credentials strip */}
          <div className="ls-demo">
            <b>Demo credentials:</b>
            <span>ðŸ« <code>principal</code> / <code>admin123</code></span>
            <span>ðŸ‘©â€ðŸ« <code>fatima</code> / <code>teacher123</code></span>
            <span>ðŸŽ“ <code>areeba</code> / <code>student123</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}


// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRINCIPAL DASHBOARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function PrincipalDashboard({ user, goTo }) {
  const [data, setData] = useState(null);
  const [trend, setTrend] = useState([]);
  const [grades, setGrades] = useState([]);

  useEffect(() => {
    Promise.all([api.dashboard(), api.attendanceTrend(), api.gradeDistribution()])
      .then(([d, t, g]) => { setData(d); setTrend(t); setGrades(g); })
      .catch(() => {});
  }, []);

  if (!data) return <div className="loading-page"><Spin /><p>Loading dashboardâ€¦</p></div>;

  const feePie = [
    { name: "Collected", value: data.feeSummary?.collected || 0 },
    { name: "Pending",   value: data.feeSummary?.pending   || 0 },
    { name: "Overdue",   value: data.feeSummary?.overdue   || 0 },
  ];
  const total = feePie.reduce((a, f) => a + f.value, 0);
  const collectedPct = total > 0 ? Math.round((feePie[0].value / total) * 100) : 0;

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="breadcrumb">Dashboard</span>
          <h1>Good morning, {user.name.split(" ")[0]} ðŸ‘‹</h1>
          <p>Here's what's happening across your institution today.</p>
        </div>
        <button className="primary-button" onClick={() => goTo("attendance")}><UserPlus size={19} weight="bold" />Take Attendance</button>
      </div>
      <div className="stats-grid">
        <StatCard label="Total Students" value={data.totalStudents} note="Enrolled this year" icon={UsersThree} tone="blue" />
        <StatCard label="Total Teachers" value={data.totalTeachers} note="Active faculty" icon={ChalkboardTeacher} tone="purple" />
        <StatCard label="Total Classes" value={data.totalClasses} note="Active sections" icon={Buildings} tone="green" />
        <StatCard label="Today's Attendance" value={`${data.todayAtt}%`} note="Present today" icon={CalendarDots} tone="teal" />
        <StatCard label="Pending Fees" value={fmtPKR(data.feeSummary?.pending)} note="Awaiting payment" icon={Coins} tone="orange" />
        <StatCard label="Upcoming Exams" value={data.upcomingExams} note="Scheduled" icon={Exam} tone="red" />
      </div>
      <div className="dashboard-panels">
        <Panel title="Attendance Trend" subtitle="Last 7 recorded days" className="attendance-panel" action={<strong className="panel-score">{trend.at(-1)?.value ?? 0}%</strong>}>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#e6edf7" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: "#61718b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fill: "#7b89a1", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip cursor={{ fill: "#eff5ff" }} contentStyle={{ borderRadius: 10, border: "1px solid #dbe5f2" }} />
                <Bar dataKey="value" fill="#2176f3" radius={[7, 7, 0, 0]} name="Attendance %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Fee Collection" subtitle="Academic year payment position" className="fee-panel">
          <div className="fee-chart-row">
            <div className="donut-wrap">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={feePie} dataKey="value" innerRadius={52} outerRadius={70} startAngle={90} endAngle={-270} stroke="none">
                  <Cell fill="#12a866" /><Cell fill="#f59e0b" /><Cell fill="#ef4444" />
                </Pie></PieChart>
              </ResponsiveContainer>
              <div className="donut-label"><strong>{collectedPct}%</strong><span>Collected</span></div>
            </div>
            <div className="legend-list">
              <span><i className="dot green" />Collected <strong>{fmtPKR(data.feeSummary?.collected)}</strong></span>
              <span><i className="dot orange" />Pending <strong>{fmtPKR(data.feeSummary?.pending)}</strong></span>
              <span><i className="dot red" />Overdue <strong>{fmtPKR(data.feeSummary?.overdue)}</strong></span>
            </div>
          </div>
          <button className="text-button" onClick={() => goTo("fees")}>View fee details â†’</button>
        </Panel>
        <Panel title="Grade Distribution" subtitle="Current student academic averages" className="grade-panel">
          <div className="grade-list">
            {grades.length ? grades.map(({ grade, count }) => (
              <div className="grade-row" key={grade}>
                <b>{grade}</b>
                <span><i style={{ width: `${Math.min(count * 8, 100)}%`, background: gradeColor(grade) }} /></span>
                <strong>{count}</strong>
              </div>
            )) : <p style={{ color: "#9aafc7", fontSize: 13 }}>No exam marks entered yet.</p>}
          </div>
          <button className="text-button" onClick={() => goTo("reports")}>Open academic report â†’</button>
        </Panel>
      </div>
      <div className="lower-grid">
        <Panel title="Needs Attention" subtitle="Items waiting for your review">
          <div className="action-list">
            {data.pendingProofs > 0 && <button onClick={() => goTo("fees")}><Receipt size={20} /><span><b>Verify fee proofs</b><small>{data.pendingProofs} submissions</small></span><Status>High</Status></button>}
            {data.pendingHomework > 0 && <button onClick={() => goTo("assignments")}><BookOpen size={20} /><span><b>Review assignments</b><small>{data.pendingHomework} classes</small></span><Status>Pending</Status></button>}
            {data.upcomingExams > 0 && <button onClick={() => goTo("exams")}><ChartBar size={20} /><span><b>Upcoming exams</b><small>{data.upcomingExams} scheduled</small></span><Status>Upcoming</Status></button>}
            {!data.pendingProofs && !data.pendingHomework && !data.upcomingExams && <p style={{ color: "#9aafc7", padding: "12px 4px", fontSize: 13 }}>Nothing pending â€” all clear! âœ“</p>}
          </div>
        </Panel>
        <Panel title="Quick Actions">
          <div className="quick-actions">
            {[["Add Student","students",UserPlus,"blue"],["Take Attendance","attendance",ListChecks,"green"],["Generate Challan","fees",Receipt,"orange"],["Enter Marks","exams",Exam,"purple"]].map(([label, page, Icon, tone]) => (
              <button key={label} className={`quick-btn tone-${tone}`} onClick={() => goTo(page)}>
                <Icon size={22} weight="duotone" /><span>{label}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TEACHER DASHBOARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function TeacherDashboard({ user, goTo }) {
  const [data, setData] = useState(null);
  const [teacherDetail, setTeacherDetail] = useState(null);
  const [settings, setSettings] = useState({});
  const teacherId = user.ref_id;

  useEffect(() => {
    if (!teacherId) return;
    Promise.all([
      api.teacherDashboard(teacherId),
      api.getTeacher(teacherId).catch(() => null),
      api.getSettings().catch(() => ({}))
    ]).then(([d, t, s]) => {
      setData(d);
      setTeacherDetail(t);
      if (s) setSettings(s);
    }).catch(() => {});
  }, [teacherId]);

  if (!teacherId) return (
    <div className="empty-state" style={{ minHeight: 300 }}>
      <ChalkboardTeacher size={48} />
      <p>Your account is not linked to a teacher profile yet.<br />Ask the principal to assign your teacher record.</p>
    </div>
  );
  if (!data) return <div className="loading-page"><Spin /><p>Loading your dashboardâ€¦</p></div>;

  const dayName = new Date().toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="breadcrumb">Teacher Dashboard</span>
          <h1>Assalam-o-Alaikum, {user.name.split(" ")[0]}! ðŸ‘©â€ðŸ«</h1>
          <p>{dayName} â€” Here's your schedule and pending actions.</p>
        </div>
        <button className="primary-button" onClick={() => goTo("diary")}><NotePencil size={19} weight="bold" />Post Diary Entry</button>
      </div>

      <div className="stats-grid compact">
        <StatCard label="My Classes" value={data.classCount} note="Assigned sections" icon={Buildings} tone="blue" />
        <StatCard label="My Students" value={data.totalStudents} note="Total enrolled" icon={UsersThree} tone="purple" />
        <StatCard label="Today's Att." value={data.todayAtt !== null ? `${data.todayAtt}%` : "â€”"} note="My classes today" icon={ListChecks} tone="teal" />
        <StatCard label="Ungraded" value={data.ungradedCount} note="Submissions to grade" icon={Notebook} tone="orange" />
      </div>

      <div className="teacher-dash-grid">
        {/* Today's Schedule */}
        <Panel title="ðŸ“… Today's Schedule" subtitle={`${data.schedule.length} periods`}>
          {data.schedule.length ? (
            <div className="schedule-list">
              {data.schedule.map((p, i) => (
                <div className="schedule-item" key={i}>
                  <div className="schedule-time">
                    <b>{p.start_time}</b>
                    <small>{p.end_time}</small>
                  </div>
                  <div className="schedule-body">
                    <b>{p.subject_name}</b>
                    <span>{p.class_name} {p.section} Â· {p.room}</span>
                  </div>
                  <button className="table-action" onClick={() => goTo("attendance")}>Attend</button>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={CalendarDots} message="No classes scheduled for today." />}
        </Panel>

        {/* Pending Actions */}
        <Panel title="âš¡ Pending Actions" subtitle="What needs your attention">
          <div className="action-list">
            {data.ungradedCount > 0 && <button onClick={() => goTo("assignments")}><Notebook size={20} /><span><b>Grade Assignments</b><small>{data.ungradedCount} ungraded submissions</small></span><Status>High</Status></button>}
            {data.pendingQuizzes > 0 && <button onClick={() => goTo("quizzes")}><Question size={20} /><span><b>Quiz Results Ready</b><small>{data.pendingQuizzes} to review</small></span><Status>Pending</Status></button>}
            {!data.ungradedCount && !data.pendingQuizzes && <p style={{ color: "#9aafc7", padding: "12px 4px", fontSize: 13 }}>All caught up! âœ“</p>}
          </div>
        </Panel>

        {/* Salary & Pay Slip */}
        <Panel title="ðŸ’µ Salary & Pay Slip" subtitle="Official monthly payment receipt">
          <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div>
                <small style={{ color: "#64748b" }}>Monthly Salary</small>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#1e3a5f" }}>{fmtPKR(teacherDetail?.salary || 45000)}</div>
              </div>
              <Status>Paid</Status>
            </div>
            <div style={{ fontSize: 12, color: "#475569", marginBottom: 12, display: "flex", flexDirection: "column", gap: 4 }}>
              <span><b>Employee ID:</b> {teacherDetail?.emp_id || "EMP-001"}</span>
              <span><b>Qualification:</b> {teacherDetail?.qualification || "M.A. / B.Ed"}</span>
              <span><b>Joined:</b> {teacherDetail?.join_date || "â€”"}</span>
            </div>
            <button className="primary-button" style={{ width: "100%", justifyContent: "center" }} onClick={() => printPaySlip(teacherDetail || { name: user.name, emp_id: "EMP-001", salary: 45000 }, null, null, settings)}>
              <Printer size={17} weight="bold" /> Download Pay Slip
            </button>
          </div>
        </Panel>

        {/* Recent Submissions */}
        <Panel title="ðŸ“¬ Recent Submissions" subtitle="Latest student homework submissions">
          {data.recentSubmissions.length ? (
            <div className="submissions-feed">
              {data.recentSubmissions.map((s, i) => (
                <div className="submission-item" key={i}>
                  <Avatar name={s.student_name} />
                  <div>
                    <b>{s.student_name}</b>
                    <small>{s.assignment_title} Â· {s.class_name} {s.section}</small>
                  </div>
                  <button className="table-action" onClick={() => goTo("assignments")}>Grade</button>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Notebook} message="No submissions yet." />}
        </Panel>

        {/* Quick Actions */}
        <Panel title="ðŸš€ Quick Actions">
          <div className="quick-actions">
            {[["Post Diary","diary",NotePencil,"blue"],["Create Quiz","quizzes",Question,"purple"],["Attendance","attendance",ListChecks,"green"],["Enter Marks","exams",Exam,"orange"]].map(([label, page, Icon, tone]) => (
              <button key={label} className={`quick-btn tone-${tone}`} onClick={() => goTo(page)}>
                <Icon size={22} weight="duotone" /><span>{label}</span>
              </button>
            ))}
          </div>
        </Panel>
      </div>

      {/* My Classes */}
      <Panel title="ðŸ“š My Assigned Classes" subtitle="Click to take attendance or post diary" style={{ marginTop: 16 }}>
        <div className="class-cards-grid">
          {data.myClasses.map(c => (
            <div className="class-card" key={c.id}>
              <div className="class-card-name">{c.name} <span>{c.section}</span></div>
              <div className="class-card-students"><UsersThree size={15} /> {c.student_count} students</div>
              <div className="class-card-actions">
                <button onClick={() => goTo("attendance")}>Attendance</button>
                <button onClick={() => goTo("diary")}>Diary</button>
              </div>
            </div>
          ))}
          {!data.myClasses.length && <EmptyState icon={Buildings} message="No classes assigned yet." />}
        </div>
      </Panel>
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STUDENT DASHBOARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function StudentDashboard({ user, goTo }) {
  const [data, setData] = useState(null);
  const [aiPredictor, setAiPredictor] = useState(null);
  const studentId = user.ref_id;

  useEffect(() => {
    if (!studentId) return;
    api.studentDashboard(studentId).then(setData).catch(() => {});
    api.getAiPerformancePredictor({ student_id: studentId }).then(setAiPredictor).catch(() => {});
  }, [studentId]);

  if (!studentId) return (
    <div className="empty-state" style={{ minHeight: 300 }}>
      <Student size={48} />
      <p>Your account is not linked to a student profile yet.<br />Please contact your school administration.</p>
    </div>
  );
  if (!data) return <div className="loading-page"><Spin /><p>Loading your dashboard…</p></div>;

  const { student, attendancePct, todayClasses, pendingAssignments, upcomingQuizzes,
          latestResult, latestChallan, announcements, diaryEntries, overallGrade } = data;

  return (
    <>
      <div className="student-dash-header">
        <div className="student-hero">
          <Avatar name={student.name} />
          <div>
            <h1>Assalam-o-Alaikum, {student.name.split(" ")[0]}! 🌟</h1>
            <p>Roll No: {student.roll_no} · Class: {student.class_name} {student.section}</p>
          </div>
        </div>
        <div className="student-quick-btns">
          <button className="primary-button" onClick={() => goTo("quizzes")}><Question size={18} />Attempt Quiz</button>
          <button className="secondary-button" onClick={() => goTo("assignments")}><Notebook size={18} />Submit Work</button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="stats-grid compact">
        <StatCard label="Attendance" value={`${attendancePct}%`} note="This month" icon={ListChecks} tone={attendancePct >= 75 ? "green" : "red"} />
        <StatCard label="Overall Grade" value={overallGrade} note="Last exam" icon={GraduationCap} tone="blue" />
        <StatCard label="Pending Work" value={data.pendingCount} note="Assignments due" icon={Notebook} tone="orange" />
        <StatCard label="Active Quizzes" value={data.quizCount} note="Waiting to attempt" icon={Question} tone="purple" />
      </div>

      {/* ✨ AI Student Performance Predictor & Early Warning Panel */}
      {aiPredictor && (
        <Panel title="✨ AI Student Performance Predictor & Early Warning Radar" style={{ marginBottom: 16, background: "linear-gradient(135deg, #ffffff 0%, #f4f5fc 100%)", border: "1.5px solid #c7d2fe" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20, alignItems: "center" }}>
            <div style={{ textAlign: "center", padding: "16px", background: "#ffffff", borderRadius: 14, border: "1px solid #e2e8f0", boxShadow: "0 4px 12px rgba(79,110,247,0.08)" }}>
              <small style={{ color: "#64748b", fontWeight: 700, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.05em" }}>Predicted Final Board Grade</small>
              <div style={{ fontSize: 36, fontWeight: 900, color: gradeColor(aiPredictor.predicted_grade), margin: "4px 0" }}>
                {aiPredictor.predicted_grade}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1e293b" }}>{aiPredictor.overall_pct}% Target Accuracy</div>
              <span className="grade-badge" style={{ marginTop: 8, display: "inline-block", background: aiPredictor.risk_status === "High Risk" ? "#ef4444" : aiPredictor.risk_status === "Moderate Risk" ? "#f59e0b" : "#22c55e" }}>
                {aiPredictor.risk_status}
              </span>
            </div>
            <div>
              <h4 style={{ margin: "0 0 8px", color: "#1e3a5f", fontSize: 14, fontWeight: 800 }}>AI Smart Advisory &amp; Learning Recommendations:</h4>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#334155", lineHeight: 1.6 }}>
                {aiPredictor.ai_insights.map((insight, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{insight}</li>
                ))}
              </ul>
              {aiPredictor.weak_subjects?.length > 0 && (
                <div style={{ marginTop: 10, background: "#fef2f2", border: "1px solid #fca5a5", padding: "8px 12px", borderRadius: 8, fontSize: 11, color: "#991b1b", fontWeight: 600 }}>
                  ⚠️ Flagged Weak Areas: {aiPredictor.weak_subjects.map(w => `${w.subject} (${w.reason})`).join(" · ")}
                </div>
              )}
            </div>
          </div>
        </Panel>
      )}

      <div className="student-dash-grid">
        {/* Today's Timetable */}
        <Panel title="ðŸ“… Today's Classes" subtitle={new Date().toLocaleDateString("en-PK", { weekday: "long", day: "numeric", month: "long" })}>
          {todayClasses.length ? (
            <div className="schedule-list">
              {todayClasses.map((p, i) => (
                <div className="schedule-item" key={i}>
                  <div className="schedule-time"><b>{p.start_time}</b><small>{p.end_time}</small></div>
                  <div className="schedule-body"><b>{p.subject_name}</b><span>{p.teacher_name}</span></div>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={CalendarDots} message="No classes scheduled today." />}
        </Panel>

        {/* Pending Assignments */}
        <Panel title="ðŸ“ Pending Homework" subtitle="Submit before due date" action={<button className="text-button" onClick={() => goTo("assignments")}>View all â†’</button>}>
          {pendingAssignments.length ? (
            <div className="pending-list">
              {pendingAssignments.slice(0, 4).map((a, i) => (
                <div className="pending-item" key={i}>
                  <span className="pend-subject">{a.subject_name}</span>
                  <div><b>{a.title}</b><small>Due: {a.due_date}</small></div>
                  <button className="table-action" onClick={() => goTo("assignments")}>Submit</button>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={CheckSquare} message="No pending homework! ðŸŽ‰" />}
        </Panel>

        {/* Active Quizzes */}
        <Panel title="âš¡ Active Quizzes" subtitle="Click to attempt now" action={<button className="text-button" onClick={() => goTo("quizzes")}>View all â†’</button>}>
          {upcomingQuizzes.length ? (
            <div className="pending-list">
              {upcomingQuizzes.map((q, i) => (
                <div className="pending-item" key={i}>
                  <span className="pend-subject quiz-badge"><Timer size={13} />{q.duration_minutes}m</span>
                  <div><b>{q.title}</b><small>{q.subject_name} Â· {q.question_count || 0} questions</small></div>
                  <button className="primary-button" style={{ minHeight: 32, padding: "0 12px", fontSize: 11 }} onClick={() => goTo("quizzes")}>Attempt</button>
                </div>
              ))}
            </div>
          ) : <EmptyState icon={Question} message="No active quizzes right now." />}
        </Panel>

        {/* Latest Result */}
        <Panel title="ðŸ† Latest Exam Result">
          {latestResult && latestResult.max_marks > 0 ? (
            <div className="result-mini">
              <div className="result-mini-header">
                <b>{latestResult.exam_name}</b>
                <span className="grade-badge" style={{ background: gradeColor(pctToGrade(Math.round((latestResult.obtained / latestResult.max_marks) * 100))) }}>
                  {pctToGrade(Math.round((latestResult.obtained / latestResult.max_marks) * 100))}
                </span>
              </div>
              <div className="result-mini-score">
                <strong>{latestResult.obtained}</strong> / {latestResult.max_marks}
                <small>{Math.round((latestResult.obtained / latestResult.max_marks) * 100)}%</small>
              </div>
              <button className="text-button" onClick={() => goTo("my-results")}>Full result card â†’</button>
            </div>
          ) : <EmptyState icon={Exam} message="No exam results yet." />}
        </Panel>

        {/* Fee Status */}
        <Panel title="ðŸ’³ Fee Status">
          {latestChallan ? (
            <div className="fee-mini">
              <div className="fee-mini-row"><span>Status</span><Status>{latestChallan.status}</Status></div>
              <div className="fee-mini-row"><span>Month</span><b>{latestChallan.month}</b></div>
              <div className="fee-mini-row"><span>Amount</span><b>{fmtPKR(latestChallan.amount)}</b></div>
              <button className="primary-button" style={{ marginTop: 12 }} onClick={() => goTo("fees")}><Printer size={16} />View Challan</button>
            </div>
          ) : <EmptyState icon={Receipt} message="No challan generated yet." />}
        </Panel>

        {/* Diary */}
        <Panel title="ðŸ“– Class Diary" subtitle="Latest notes from teachers" action={<button className="text-button" onClick={() => goTo("diary")}>View all â†’</button>}>
          {diaryEntries.length ? (
            <div className="diary-feed">
              {diaryEntries.slice(0, 3).map((d, i) => (
                <div className="diary-item" key={i}>
                  <div className="diary-date">{d.date}</div>
                  <b>{d.title}</b>
                  <small>{d.subject_name} Â· {d.teacher_name}</small>
                  {d.homework_due && <span className="hw-due">ðŸ“Œ Homework due: {d.homework_due}</span>}
                </div>
              ))}
            </div>
          ) : <EmptyState icon={NotePencil} message="No diary entries yet." />}
        </Panel>
      </div>

      {/* Announcements */}
      {announcements.length > 0 && (
        <Panel title="ðŸ“¢ School Announcements" style={{ marginTop: 16 }}>
          <div className="announcements-list">
            {announcements.map(a => (
              <article className="announcement-card" key={a.id}>
                <div className="ann-meta"><Status>{a.priority}</Status><span className="ann-target">For: {a.target}</span><small>{a.created_at?.split("T")[0]}</small></div>
                <h3>{a.title}</h3><p>{a.body}</p>
              </article>
            ))}
          </div>
        </Panel>
      )}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DIARY PAGE (Teacher posts, Student reads)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function DiaryPage({ user, showToast }) {
  const [entries, setEntries] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(false);      // false | 'add' | entry-obj
  const [form, setForm] = useState({ date: today() });
  const [filterDate, setFilterDate] = useState(today());
  const [filterClass, setFilterClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [confirm, confirmDialog] = useConfirm();

  const isTeacher = user.role === "Teacher";
  const teacherId = isTeacher ? user.ref_id : null;

  const load = useCallback(() => {
    const params = {};
    if (filterDate) params.date = filterDate;
    if (filterClass) params.class_id = filterClass;
    if (isTeacher && teacherId && !filterClass) params.teacher_id = teacherId;
    Promise.all([api.getDiary(params), api.getClasses(), api.getSubjects()])
      .then(([d, c, s]) => { setEntries(d); setClasses(c); setSubjects(s); }).finally(() => setLoading(false));
  }, [filterDate, filterClass, isTeacher, teacherId]);

  useEffect(() => { load(); }, [load]);

  const F = v => e => setForm({ ...form, [v]: e.target.value });

  async function save(e) {
    e.preventDefault();
    if (modal === "add") {
      await api.addDiary({ ...form, teacher_id: teacherId });
      showToast("Diary entry posted");
    } else {
      // editing an existing entry
      await api.editDiary(modal.id, form);
      showToast("Entry updated");
    }
    setModal(false); load();
  }

  async function handleDelete(id) {
    const ok = await confirm("Delete this diary entry? This cannot be undone.");
    if (!ok) return;
    await api.deleteDiary(id);
    showToast("Deleted"); load();
  }

  function openEdit(d) {
    setForm({ date: d.date, title: d.title, content: d.content || "", homework_due: d.homework_due || "", subject_id: d.subject_id || "", class_id: d.class_id });
    setModal(d);
  }

  return (
    <>
      {confirmDialog}
      <PageHeader title="Class Diary" subtitle={isTeacher ? "Post daily notes, topics covered and homework for your classes." : "View daily notes and homework from your teachers."}
        action={isTeacher ? () => { setModal("add"); setForm({ date: today() }); } : undefined}
        actionLabel="Post Entry" icon={NotePencil} />
      <div className="toolbar">
        <label>Date<input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ marginLeft: 8, height: 38, border: "1px solid #d9e3ef", borderRadius: 8, padding: "0 10px" }} /></label>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ height: 38, border: "1px solid #d9e3ef", borderRadius: 8, padding: "0 10px" }}>
          <option value="">All classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
        </select>
        <Btn className="secondary-button" onClick={load}><ArrowClockwise size={16} /></Btn>
      </div>
      {loading ? <Spin /> : (
        <div className="diary-page-list">
          {entries.map(d => (
            <article className="diary-card" key={d.id}>
              <div className="diary-card-meta">
                <span className="diary-date-badge">{d.date}</span>
                <span className="diary-class">{d.class_name} {d.section}</span>
                <span className="diary-subject">{d.subject_name || "General"}</span>
                <small>{d.teacher_name}</small>
                {isTeacher && <>
                  <IconBtn label="Edit" onClick={() => openEdit(d)}><PencilSimple size={15} /></IconBtn>
                  <IconBtn label="Delete" danger onClick={() => handleDelete(d.id)}><Trash size={15} /></IconBtn>
                </>}
              </div>
              <h3>{d.title}</h3>
              {d.content && <p>{d.content}</p>}
              {d.homework_due && <div className="homework-due"><CheckSquare size={16} weight="fill" />Homework due: <b>{d.homework_due}</b></div>}
            </article>
          ))}
          {!entries.length && <EmptyState icon={NotePencil} message="No diary entries for selected date." />}
        </div>
      )}

      {modal && <Modal title={modal === "add" ? "Post Diary Entry" : "Edit Diary Entry"} onClose={() => setModal(false)}>
        <form onSubmit={save} className="form-grid">
          {modal === "add" && <label>Class<select required value={form.class_id || ""} onChange={F("class_id")}>
            <option value="">Select class</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
          </select></label>}
          <label>Subject<select value={form.subject_id || ""} onChange={F("subject_id")}>
            <option value="">General</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></label>
          <label>Date<input type="date" value={form.date || today()} onChange={F("date")} /></label>
          <label>Homework Due<input type="date" value={form.homework_due || ""} onChange={F("homework_due")} /></label>
          <label className="span-2">Title / Topic Covered<input required value={form.title || ""} onChange={F("title")} placeholder="e.g. Chapter 3 â€“ Linear Equations" /></label>
          <label className="span-2">Notes & Instructions<textarea value={form.content || ""} onChange={F("content")} rows={4} placeholder="Details, exercises, referencesâ€¦" /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(false)}>Cancel</Btn><Btn type="submit">{modal === "add" ? "Post Entry" : "Save Changes"}</Btn></footer>
        </form>
      </Modal>}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// QUIZ PAGE â€” Teacher view (create, manage, view results)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function TeacherQuizPage({ user, showToast }) {
  const [quizzes, setQuizzes] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(null);
  const [qModal, setQModal] = useState(null); // quiz id for editing questions
  const [questions, setQuestions] = useState([]);
  const [resultsModal, setResultsModal] = useState(null);
  const [results, setResults] = useState(null);
  const [form, setForm] = useState({});
  const [qForm, setQForm] = useState({ correct_answer: "A", marks: 1 });
  const [loading, setLoading] = useState(true);
  const teacherId = user.ref_id;

  const load = useCallback(() => {
    Promise.all([api.getQuizzes({ teacher_id: teacherId }), api.getClasses(), api.getSubjects()])
      .then(([q, c, s]) => { setQuizzes(q); setClasses(c); setSubjects(s); }).finally(() => setLoading(false));
  }, [teacherId]);
  useEffect(() => { load(); }, [load]);

  const F = v => e => setForm({ ...form, [v]: e.target.value });
  const QF = v => e => setQForm({ ...qForm, [v]: e.target.value });

  async function createQuiz(e) {
    e.preventDefault();
    const res = await api.createQuiz({ ...form, teacher_id: teacherId });
    showToast("Quiz created"); setModal(null); load();
    // Open question editor immediately
    setQModal(res.id);
    api.getQuizQuestions(res.id).then(setQuestions);
  }

  async function openQModal(quizId) {
    setQModal(quizId); setQForm({ correct_answer: "A", marks: 1 });
    api.getQuizQuestions(quizId).then(setQuestions);
  }

  async function addQuestion(e) {
    e.preventDefault();
    await api.addQuestion(qModal, qForm);
    showToast("Question added");
    setQForm({ correct_answer: "A", marks: 1 });
    api.getQuizQuestions(qModal).then(setQuestions);
    // Refresh quiz list for total_marks
    load();
  }

  async function delQuestion(quizId, qid) {
    await api.deleteQuestion(quizId, qid);
    api.getQuizQuestions(quizId).then(setQuestions);
    load();
  }

  async function toggleStatus(quiz) {
    const newStatus = quiz.status === "Active" ? "Draft" : "Active";
    await api.updateQuizStatus(quiz.id, newStatus);
    showToast(`Quiz ${newStatus === "Active" ? "published" : "unpublished"}`);
    load();
  }

  async function viewResults(quizId) {
    const res = await api.getQuizResults(quizId);
    setResults(res); setResultsModal(true);
  }

  return (
    <>
      <PageHeader title="Quizzes" subtitle="Create MCQ quizzes, publish to students, view auto-graded results."
        sticker="/rocket_sticker.png"
        action={() => { setModal(true); setForm({ duration_minutes: 20, status: "Draft" }); }} actionLabel="Create Quiz" />
      {loading ? <Spin /> : (
        <div className="quiz-teacher-grid">
          {quizzes.map(q => (
            <div className="quiz-card" key={q.id}>
              <div className="quiz-card-top">
                <Status>{q.status}</Status>
                <span className="quiz-meta"><Timer size={13} />{q.duration_minutes}m Â· {q.question_count} Q Â· {q.total_marks} marks</span>
              </div>
              <h3>{q.title}</h3>
              <p>{q.subject_name} Â· {q.class_name} {q.section}</p>
              <div className="quiz-attempts-bar">
                <UsersThree size={13} /> <b>{q.attempt_count}</b> attempts
              </div>
              <div className="quiz-card-actions">
                <Btn className="secondary-button" onClick={() => openQModal(q.id)}><PencilSimple size={14} />Questions</Btn>
                <Btn className="secondary-button" onClick={() => viewResults(q.id)}><Eye size={14} />Results</Btn>
                <Btn className={`secondary-button ${q.status === "Active" ? "danger" : ""}`} onClick={() => toggleStatus(q)}>
                  {q.status === "Active" ? "Unpublish" : "Publish"}
                </Btn>
                <IconBtn label="Delete" danger onClick={async () => { await api.deleteQuiz(q.id); showToast("Deleted"); load(); }}><Trash size={15} /></IconBtn>
              </div>
            </div>
          ))}
          {!quizzes.length && <EmptyState icon={Question} message="No quizzes created yet." />}
        </div>
      )}

      {/* Create Quiz Modal */}
      {modal && <Modal title="Create New Quiz" onClose={() => setModal(null)}>
        <form onSubmit={createQuiz} className="form-grid">
          <label className="span-2">Quiz Title<input required onChange={F("title")} placeholder="e.g. Chapter 2 Quick Quiz – Algebra" /></label>
          <label>Class<select required onChange={F("class_id")}><option value="">Select</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}</select></label>
          <label>Subject<select onChange={F("subject_id")}><option value="">General</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>Duration (minutes)<input type="number" defaultValue={20} onChange={F("duration_minutes")} /></label>
          <label>Status<select onChange={F("status")} defaultValue="Draft"><option>Draft</option><option>Active</option></select></label>
          <label className="span-2">External Video Link / Study Resource (Optional)<input onChange={F("external_link")} placeholder="https://youtube.com/watch?v=... or Google Drive URL" /></label>
          <label className="span-2">Instructions<textarea onChange={F("instructions")} placeholder="Instructions for students…" /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn><Btn type="submit">Create & Add Questions →</Btn></footer>
        </form>
      </Modal>}

      {/* Question Builder Modal */}
      {qModal && <Modal title="Manage Questions" onClose={() => setQModal(null)} wide>
        <div className="question-builder">
          <div className="questions-list">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <h4 style={{ margin: 0 }}>{questions.length} Question{questions.length !== 1 ? "s" : ""} added</h4>
              <button type="button" className="secondary-button" style={{ background: "linear-gradient(135deg, #4f6ef7, #8b5cf6)", color: "#fff", border: "none", fontSize: 12, padding: "6px 14px", borderRadius: 8, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, fontWeight: 700 }}
                onClick={async () => {
                  const topic = prompt("Enter Quiz Topic for AI MCQ Generation (e.g. Algebra, Physics, Computer Science):", "General Science");
                  if (!topic) return;
                  showToast("Generating AI MCQs...", "info");
                  try {
                    const res = await api.generateAiQuiz(qModal, topic);
                    showToast(`✨ Generated ${res.count} AI MCQs successfully!`);
                    api.getQuizQuestions(qModal).then(setQuestions);
                    load();
                  } catch {
                    showToast("Failed to generate AI MCQs", "error");
                  }
                }}>
                <Sparkle size={15} weight="fill" /> Auto-Generate MCQs with AI
              </button>
            </div>
            {questions.map((q, i) => (
              <div className="question-item" key={q.id}>
                <div className="q-num">Q{i + 1}</div>
                <div className="q-body">
                  <b>{q.question_text}</b>
                  <div className="q-options">
                    {["A","B","C","D"].map(opt => (
                      <span key={opt} className={q.correct_answer === opt ? "correct-opt" : ""}>{opt}. {q[`option_${opt.toLowerCase()}`]}</span>
                    ))}
                  </div>
                  <small>{q.marks} mark{q.marks !== 1 ? "s" : ""}</small>
                </div>
                <IconBtn label="Delete" danger onClick={() => delQuestion(qModal, q.id)}><Trash size={15} /></IconBtn>
              </div>
            ))}
            {!questions.length && <p style={{ color: "#9aafc7", fontSize: 13 }}>No questions yet. Add your first question below.</p>}
          </div>
          <form onSubmit={addQuestion} className="add-question-form">
            <h4>Add Question</h4>
            <label className="span-2">Question Text<input required onChange={QF("question_text")} placeholder="Write your question hereâ€¦" /></label>
            <label>Option A<input required onChange={QF("option_a")} /></label>
            <label>Option B<input required onChange={QF("option_b")} /></label>
            <label>Option C<input onChange={QF("option_c")} /></label>
            <label>Option D<input onChange={QF("option_d")} /></label>
            <label>Correct Answer<select onChange={QF("correct_answer")} defaultValue="A"><option>A</option><option>B</option><option>C</option><option>D</option></select></label>
            <label>Marks<input type="number" defaultValue={1} min={1} onChange={QF("marks")} /></label>
            <footer className="modal-actions span-2"><Btn type="submit"><Plus size={15} />Add Question</Btn></footer>
          </form>
        </div>
      </Modal>}

      {/* Results Modal */}
      {resultsModal && results && <Modal title={`Results â€” ${results.quiz?.title}`} onClose={() => setResultsModal(null)} wide>
        <div className="quiz-results-view">
          <div className="results-summary">
            <StatCard label="Attempts" value={results.attempts.length} note="Students attempted" icon={UsersThree} tone="blue" />
            <StatCard label="Avg Score" value={results.attempts.length ? `${Math.round(results.attempts.reduce((a, x) => a + (x.score / Math.max(x.total, 1)) * 100, 0) / results.attempts.length)}%` : "â€”"} note="Class average" icon={ChartBar} tone="green" />
            <StatCard label="Total Marks" value={results.quiz?.total_marks} note="Per attempt" icon={Star} tone="purple" />
          </div>
          <DataTable
            columns={["#", "Student", "Roll", "Score", "Percentage", "Grade", "Proctoring Integrity"]}
            rows={results.attempts.map((a, i) => {
              const pct = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
              return [i + 1, a.student_name, a.roll_no, `${a.score}/${a.total}`,
                <span style={{ color: gradeColor(pctToGrade(pct)), fontWeight: 700 }}>{pct}%</span>,
                <span style={{ background: gradeColor(pctToGrade(pct)), color: "#fff", padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>{pctToGrade(pct)}</span>,
                a.violation_reason ? (
                  <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 11 }}>â›” Auto-Submitted ({a.violation_reason})</span>
                ) : a.tab_switch_count > 0 ? (
                  <span style={{ color: "#f59e0b", fontWeight: 600, fontSize: 12 }}>âš ï¸ {a.tab_switch_count} Tab Switches</span>
                ) : (
                  <span style={{ color: "#12a866", fontWeight: 600, fontSize: 12 }}>ðŸ›¡ï¸ Clean (0 Warnings)</span>
                )
              ];
            })}
            emptyMsg="No attempts yet." />
        </div>
      </Modal>}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// QUIZ PAGE â€” Student view (attempt quiz with Anti-Cheating & Proctoring)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function StudentQuizPage({ user, showToast }) {
  const [quizzes, setQuizzes] = useState([]);
  const [attemptModal, setAttemptModal] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [proctorWarning, setProctorWarning] = useState("");
  const timerRef = useRef(null);
  const studentId = user.ref_id;

  const load = useCallback(() => {
    if (!studentId) return;
    api.getQuizzes({ student_id: studentId }).then(q => {
      setQuizzes(q.filter(x => x.status === "Active" || x.attempt));
    }).finally(() => setLoading(false));
  }, [studentId]);
  useEffect(() => { load(); }, [load]);

  const submitRef = useRef(null);
  const tabSwitchesRef = useRef(tabSwitches);
  useEffect(() => { tabSwitchesRef.current = tabSwitches; }, [tabSwitches]);

  async function startAttempt(quiz) {
    const qs = await api.getQuizQuestions(quiz.id);
    setQuestions(qs);
    setAnswers({});
    setSubmitted(false);
    setResult(null);
    setTabSwitches(0);
    setProctorWarning("");
    setAttemptModal(quiz);
    setTimeLeft(quiz.duration_minutes * 60);

    // Request full-screen mode for anti-cheating
    try {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}

    // Start timer â€” auto-submit when it hits 0
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          if (submitRef.current) submitRef.current("Time Expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  async function submitAttempt(violationReason = null) {
    clearInterval(timerRef.current);

    // Exit fullscreen if active
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}

    const currentAnswers = answersRef.current;
    const answerPayload = Object.entries(currentAnswers).map(([question_id, selected]) => ({ question_id: parseInt(question_id), selected }));
    try {
      const res = await api.attemptQuiz(attemptModal.id, {
        student_id: parseInt(studentId),
        answers: answerPayload,
        tab_switch_count: tabSwitchesRef.current,
        violation_reason: violationReason
      });
      setResult(res);
      setSubmitted(true);
      if (violationReason) showToast(`Quiz Auto-Submitted due to Proctoring Violation!`, "error");
      else showToast(`Quiz submitted! Score: ${res.score}/${res.total}`);
      load();
    } catch (e) {
      showToast(e.message, "error");
    }
  }

  const answersRef = useRef(answers);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { submitRef.current = submitAttempt; });

  // â”€â”€â”€ Anti-Cheating & Proctoring Event Listeners â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!attemptModal || submitted) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const next = prev + 1;
          if (next >= 3) {
            if (submitRef.current) submitRef.current("Excessive Tab Switching / App Switching (3 Warnings)");
          } else {
            setProctorWarning(`âš ï¸ PROCTOR WARNING (${next}/3): Tab or app switching detected! 3 warnings will result in auto-submission.`);
          }
          return next;
        });
      }
    };

    const handleBlur = () => {
      handleVisibilityChange();
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && attemptModal && !submitted) {
        setTabSwitches(prev => {
          const next = prev + 1;
          if (next >= 3) {
            if (submitRef.current) submitRef.current("Exited Full-Screen Mode 3 Times");
          } else {
            setProctorWarning(`âš ï¸ PROCTOR WARNING (${next}/3): Full Screen mode was exited! Stay in full screen to complete the quiz.`);
          }
          return next;
        });
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [attemptModal, submitted]);

  const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <PageHeader title="Quizzes" subtitle="Attempt active quizzes assigned by your teachers." />
      {loading ? <Spin /> : (
        <div className="student-quiz-grid">
          {quizzes.map(q => (
            <div className={`quiz-card ${q.attempt ? "attempted" : ""}`} key={q.id}>
              <div className="quiz-card-top">
                {q.attempt ? <Status>Attempted</Status> : <Status>Active</Status>}
                <span className="quiz-meta"><Timer size={13} />{q.duration_minutes}m Â· {q.question_count} Qs</span>
              </div>
              <h3>{q.title}</h3>
              <p>{q.subject_name}</p>
              {q.attempt ? (
                <div className="attempt-score">
                  <span>Your score:</span>
                  <strong>{q.attempt.score}/{q.attempt.total}</strong>
                  <span className="grade-badge" style={{ background: gradeColor(pctToGrade(q.attempt.total > 0 ? Math.round((q.attempt.score / q.attempt.total) * 100) : 0)) }}>
                    {pctToGrade(q.attempt.total > 0 ? Math.round((q.attempt.score / q.attempt.total) * 100) : 0)}
                  </span>
                </div>
              ) : (
                <button className="primary-button" onClick={() => startAttempt(q)}><ArrowRight size={16} />Start Quiz (Anti-Cheating Mode)</button>
              )}
            </div>
          ))}
          {!quizzes.length && <EmptyState icon={Question} message="No active quizzes right now. Check back later!" />}
        </div>
      )}

      {attemptModal && <Modal title={attemptModal.title} onClose={() => { clearInterval(timerRef.current); setAttemptModal(null); }} wide>
        <div className="quiz-attempt"
          onContextMenu={e => e.preventDefault()}
          onCopy={e => { e.preventDefault(); showToast("Copying quiz content is disabled during active attempt.", "error"); }}
          onCut={e => e.preventDefault()}
          onPaste={e => e.preventDefault()}
          style={{ userSelect: "none", WebkitUserSelect: "none" }}>
          {!submitted ? (
            <>
              <div className="quiz-attempt-header">
                <span>{attemptModal.subject_name} Â· {questions.length} questions</span>
                <span style={{ background: tabSwitches === 0 ? "#f0fdf4" : "#fef2f2", color: tabSwitches === 0 ? "#166534" : "#991b1b", padding: "4px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  ðŸ›¡ï¸ Proctor Active Â· {3 - tabSwitches} Warnings Left
                </span>
                <span className={`quiz-timer ${timeLeft < 60 ? "urgent" : ""}`}><Timer size={16} />{fmtTime(timeLeft)}</span>
              </div>

              {proctorWarning && (
                <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 8, margin: "10px 0" }}>
                  <Warning size={18} weight="fill" />
                  <span>{proctorWarning}</span>
                </div>
              )}

              {attemptModal.instructions && <div className="quiz-instructions">{attemptModal.instructions}</div>}
              <div className="questions-scroll">
                {questions.map((q, i) => (
                  <div className="question-block" key={q.id}>
                    <div className="question-header"><span className="q-number">Q{i + 1}</span><b>{q.question_text}</b><small>{q.marks} mark{q.marks !== 1 ? "s" : ""}</small></div>
                    <div className="options-grid">
                      {["A","B","C","D"].filter(opt => q[`option_${opt.toLowerCase()}`]).map(opt => (
                        <button key={opt}
                          className={`option-btn ${answers[q.id] === opt ? "selected" : ""}`}
                          onClick={() => setAnswers({ ...answers, [q.id]: opt })}>
                          <span className="opt-label">{opt}</span> {q[`option_${opt.toLowerCase()}`]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="quiz-submit-bar">
                <span>{Object.keys(answers).length}/{questions.length} answered</span>
                <Btn onClick={() => submitAttempt()}>Submit Quiz</Btn>
              </div>
            </>
          ) : (
            <div className="quiz-result-screen" style={{ textAlign: "center", padding: "16px 0" }}>
              <div className="quiz-result-circle" style={{ borderColor: gradeColor(pctToGrade(result.total > 0 ? Math.round((result.score / result.total) * 100) : 0)), margin: "0 auto 16px" }}>
                <strong>{result.score}</strong>
                <span>out of {result.total}</span>
              </div>
              <h2 style={{ margin: "0 0 6px" }}>Quiz Completed!</h2>
              <p style={{ margin: "0 0 16px" }}>You scored <b>{result.total > 0 ? Math.round((result.score / result.total) * 100) : 0}%</b> &mdash; Grade: <b style={{ color: gradeColor(pctToGrade(result.total > 0 ? Math.round((result.score / result.total) * 100) : 0)) }}>{pctToGrade(result.total > 0 ? Math.round((result.score / result.total) * 100) : 0)}</b></p>

              {/* Proctoring summary badge */}
              <div style={{ margin: "0 auto 20px", maxWidth: 460, background: "#f8fafc", padding: "12px 16px", borderRadius: 12, border: "1px solid #e2e8f0", textAlign: "left", fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: "#1e3a5f", marginBottom: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <ShieldCheck size={16} /> Anti-Cheating Integrity Audit
                </div>
                {tabSwitches > 0 ? (
                  <div style={{ color: "#ef4444", fontWeight: 600 }}>⚠️ {tabSwitches} Warning(s) recorded during quiz attempt.</div>
                ) : (
                  <div style={{ color: "#166534", fontWeight: 600 }}>🛡️ Clean attempt. No tab switches or proctoring violations detected.</div>
                )}
              </div>

              {/* AI Explanation Box */}
              <div style={{ textAlign: "left", maxWidth: 640, margin: "0 auto 24px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "14px 18px", borderRadius: 12 }}>
                <div style={{ color: "#166534", fontWeight: 700, fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                  <Sparkle size={16} weight="fill" /> AI Learning Feedback &amp; Review
                </div>
                <p style={{ margin: 0, fontSize: 12, color: "#166534", lineHeight: 1.5 }}>
                  Review your answers above. Questions with incorrect selections have been flagged. Focus on conceptual clarity for upcoming term exams.
                </p>
              </div>

              <Btn onClick={() => setAttemptModal(null)}>Close &amp; Return to Quizzes</Btn>
            </div>
          )}
        </div>
      </Modal>}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TEACHER ASSIGNMENTS PAGE (with grading, PDF attachments & link submission)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function TeacherAssignmentsPage({ user, showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(null);
  const [gradeModal, setGradeModal] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [form, setForm] = useState({});
  const [assignFile, setAssignFile] = useState(null);
  const [gradeForm, setGradeForm] = useState({});
  const [loading, setLoading] = useState(true);
  const teacherId = user.ref_id;

  const load = useCallback(() => {
    Promise.all([api.getAssignments({ teacher_id: teacherId }), api.getClasses(), api.getSubjects()])
      .then(([a, c, s]) => { setAssignments(a); setClasses(c); setSubjects(s); }).finally(() => setLoading(false));
  }, [teacherId]);
  useEffect(() => { load(); }, [load]);

  const F = v => e => setForm({ ...form, [v]: e.target.value });

  async function save(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("teacher_id", teacherId);
    fd.append("title", form.title || "");
    fd.append("subject_id", form.subject_id || "");
    fd.append("class_id", form.class_id || "");
    fd.append("due_date", form.due_date || "");
    fd.append("total_marks", form.total_marks || 20);
    if (form.instructions) fd.append("instructions", form.instructions);
    if (form.external_link) fd.append("external_link", form.external_link);
    if (assignFile) fd.append("file", assignFile);

    await api.upload("/assignments", fd);
    showToast("Assignment created with materials"); setModal(null); setAssignFile(null); load();
  }

  async function openGradeModal(a) {
    const subs = await api.getSubmissions(a.id);
    setSubmissions(subs);
    setGradeModal(a);
    const init = {};
    subs.forEach(s => { init[s.id] = { marks: s.marks ?? "", comment: s.comment ?? "" }; });
    setGradeForm(init);
  }

  async function grade(subId) {
    const marks = gradeForm[subId]?.marks;
    const comment = gradeForm[subId]?.comment || "";
    if (marks === undefined || marks === "") return showToast("Enter marks first", "error");
    await api.gradeSubmission(gradeModal.id, subId, { marks: parseFloat(marks), comment });
    showToast("Submission graded âœ“");
    const subs = await api.getSubmissions(gradeModal.id);
    setSubmissions(subs);
    load();
  }

  return (
    <>
      <PageHeader title="Assignments & Grading" subtitle="Create assignments with reference PDFs/links, inspect student uploads, and manually grade work."
        action={() => { setModal(true); setForm({ total_marks: 20 }); setAssignFile(null); }} actionLabel="Create Assignment" />
      {loading ? <Spin /> : (
        <div className="assignment-grid">
          {assignments.map(a => (
            <article className="assignment-card" key={a.id}>
              <div><Status>{a.status}</Status><small>{a.subject_name} Â· {a.class_name} {a.section}</small></div>
              <h3>{a.title}</h3>
              <p>Due: <b>{a.due_date}</b> Â· {a.total_marks} marks</p>
              {a.file_path && <p style={{ fontSize: 12 }}><a href={`${api.UPLOADS}/submissions/${a.file_path}`} target="_blank" rel="noreferrer" style={{ color: "#2176f3" }}>ðŸ“„ Reference PDF attached</a></p>}
              {a.external_link && <p style={{ fontSize: 12 }}><a href={a.external_link} target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>ðŸ”— Resource Link</a></p>}
              <div className="submission-line">
                <span><i style={{ width: `${Math.round((a.submitted / Math.max(a.total_students || 1, 1)) * 100)}%` }} /></span>
                <b>{a.submitted || 0}/{a.total_students || 0} submitted</b>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <Btn className="secondary-button" onClick={() => openGradeModal(a)}><Eye size={14} />Grade Submissions ({a.submitted || 0})</Btn>
                <IconBtn label="Delete" danger onClick={async () => { await api.deleteAssignment(a.id); showToast("Deleted"); load(); }}><Trash size={16} /></IconBtn>
              </div>
            </article>
          ))}
          {!assignments.length && <EmptyState icon={Notebook} message="No assignments created yet." />}
        </div>
      )}

      {modal && <Modal title="Create New Assignment" onClose={() => setModal(null)}>
        <form onSubmit={save} className="form-grid">
          <label className="span-2">Title / Subjective Topic<input required onChange={F("title")} placeholder="e.g. Chapter 4 Essay & Problem Solving" /></label>
          <label>Subject<select required onChange={F("subject_id")}><option value="">Select Subject</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>Class<select required onChange={F("class_id")}><option value="">Select Class</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}</select></label>
          <label>Due Date<input type="date" required onChange={F("due_date")} /></label>
          <label>Total Marks<input type="number" defaultValue={20} onChange={F("total_marks")} /></label>
          <label className="span-2">External Resource Link (Optional)<input type="url" onChange={F("external_link")} placeholder="https://drive.google.com/..." /></label>
          <label className="span-2 upload-zone"><UploadSimple size={24}/><b>Attach Question PDF / File</b><small>Optional question paper or reference file</small><input type="file" onChange={e => setAssignFile(e.target.files[0])} /></label>
          <label className="span-2">Instructions for Students<textarea onChange={F("instructions")} rows={3} placeholder="Write instructions or guidelines for studentsâ€¦" /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn><Btn type="submit">Create Assignment</Btn></footer>
        </form>
      </Modal>}

      {gradeModal && <Modal title={`Grade: ${gradeModal.title}`} onClose={() => setGradeModal(null)} wide>
        <div className="grade-submissions">
          <p style={{ padding: "0 22px 10px", color: "#66758e", fontSize: 13 }}>{submissions.length} submissions Â· Total Marks: <b>{gradeModal.total_marks}</b></p>
          <div className="table-wrap" style={{ padding: "0 22px 22px" }}>
            <table>
              <thead><tr><th>Student</th><th>Submitted</th><th>Submitted Solution (PDF / Link)</th><th>Note</th><th>Marks (/{gradeModal.total_marks})</th><th>Teacher Feedback</th><th>Action</th></tr></thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub.id}>
                    <td><div className="person-cell"><Avatar name={sub.student_name} /><span><b>{sub.student_name}</b><small>{sub.stu_code}</small></span></div></td>
                    <td>{sub.submitted_at?.split("T")[0]}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        {sub.file_path && <a href={`${api.UPLOADS}/submissions/${sub.file_path}`} target="_blank" rel="noreferrer" style={{ color: "#2176f3", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><DownloadSimple size={15}/>PDF Solution</a>}
                        {sub.external_link && <a href={sub.external_link} target="_blank" rel="noreferrer" style={{ color: "#7c3aed", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}>ðŸ”— External Link</a>}
                        {!sub.file_path && !sub.external_link && <span style={{ color: "#9aafc7" }}>No attachment</span>}
                      </div>
                    </td>
                    <td>{sub.note || "â€”"}</td>
                    <td>
                      <input type="number" min={0} max={gradeModal.total_marks} className="marks-input" style={{ width: 64 }}
                        value={gradeForm[sub.id]?.marks ?? ""}
                        onChange={e => setGradeForm({ ...gradeForm, [sub.id]: { ...gradeForm[sub.id], marks: e.target.value } })} placeholder="0" />
                    </td>
                    <td>
                      <input placeholder="Add feedback comment..." className="marks-input" style={{ width: 150 }}
                        value={gradeForm[sub.id]?.comment ?? ""}
                        onChange={e => setGradeForm({ ...gradeForm, [sub.id]: { ...gradeForm[sub.id], comment: e.target.value } })} />
                    </td>
                    <td><Btn className="table-action" onClick={() => grade(sub.id)}>Save Grade</Btn></td>
                  </tr>
                ))}
                {!submissions.length && <tr><td colSpan={7} style={{ textAlign: "center", color: "#9aafc7", padding: 24 }}>No student submissions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STUDENT ASSIGNMENTS PAGE (submit work with PDF / Link paste)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function StudentAssignmentsPage({ user, showToast }) {
  const [assignments, setAssignments] = useState([]);
  const [submitModal, setSubmitModal] = useState(null);
  const [file, setFile] = useState(null);
  const [externalLink, setExternalLink] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const studentId = user.ref_id;

  const load = useCallback(() => {
    if (!studentId) return;
    api.getStudent(studentId).then(student => {
      return api.getAssignments({ class_id: student.class_id, student_id: studentId });
    }).then(setAssignments).finally(() => setLoading(false));
  }, [studentId]);
  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    const fd = new FormData();
    fd.append("student_id", studentId);
    if (note) fd.append("note", note);
    if (externalLink) fd.append("external_link", externalLink);
    if (file) fd.append("file", file);

    await api.submitAssignment(submitModal.id, fd);
    showToast("Assignment solution submitted âœ“"); setSubmitModal(null); load();
  }

  const pending   = assignments.filter(a => !a.my_submission && a.status === "Active");
  const submitted = assignments.filter(a => a.my_submission);
  const [activeTab, setActiveTab] = useState("pending");

  return (
    <>
      <PageHeader title="My Assignments" subtitle="Submit your homework by uploading PDF or pasting external link, and view teacher grading." />
      <div className="tabs">
        <button className={activeTab === "pending" ? "active" : ""} onClick={() => setActiveTab("pending")}>Pending Work ({pending.length})</button>
        <button className={activeTab === "submitted" ? "active" : ""} onClick={() => setActiveTab("submitted")}>Submitted & Graded ({submitted.length})</button>
      </div>
      {loading ? <Spin /> : (
        <>
          {activeTab === "pending" && (
            <div className="assignment-grid">
              {pending.map(a => (
                <article className="assignment-card" key={a.id}>
                  <div><Status>Pending</Status><small>{a.subject_name}</small></div>
                  <h3>{a.title}</h3>
                  <p>Due: <b style={{ color: a.due_date < today() ? "#ef4444" : "#2176f3" }}>{a.due_date}</b> Â· {a.total_marks} marks</p>
                  {a.instructions && <p style={{ fontSize: 12, color: "#475569" }}>{a.instructions}</p>}
                  {a.file_path && <p style={{ fontSize: 12 }}><a href={`${api.UPLOADS}/submissions/${a.file_path}`} target="_blank" rel="noreferrer" style={{ color: "#2176f3" }}>ðŸ“„ Download Question PDF</a></p>}
                  {a.external_link && <p style={{ fontSize: 12 }}><a href={a.external_link} target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>ðŸ”— Reference Link</a></p>}
                  <Btn onClick={() => { setSubmitModal(a); setFile(null); setExternalLink(""); setNote(""); }} style={{ marginTop: 10 }}><UploadSimple size={15} />Submit Solution</Btn>
                </article>
              ))}
              {!pending.length && <EmptyState icon={CheckSquare} message="No pending homework! All clear ðŸŽ‰" />}
            </div>
          )}
          {activeTab === "submitted" && (
            <div className="assignment-grid">
              {submitted.map(a => {
                const sub = a.my_submission;
                return (
                  <article className="assignment-card" key={a.id}>
                    <div><Status>Submitted</Status><small>{a.subject_name}</small></div>
                    <h3>{a.title}</h3>
                    <p style={{ fontSize: 12, color: "#64748b" }}>Submitted on: {sub.submitted_at?.split("T")[0]}</p>
                    {sub.file_path && <p style={{ fontSize: 12 }}><a href={`${api.UPLOADS}/submissions/${sub.file_path}`} target="_blank" rel="noreferrer" style={{ color: "#2176f3" }}>ðŸ“„ My Submitted PDF</a></p>}
                    {sub.external_link && <p style={{ fontSize: 12 }}><a href={sub.external_link} target="_blank" rel="noreferrer" style={{ color: "#7c3aed" }}>ðŸ”— My Submitted Link</a></p>}
                    {sub.marks !== null && sub.marks !== undefined ? (
                      <div className="grade-result" style={{ background: "#f0fdf4", padding: 12, borderRadius: 8, border: "1px solid #bbf7d0", marginTop: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span>Grade Score:</span>
                          <b style={{ color: "#16a34a", fontSize: 16 }}>{sub.marks} / {a.total_marks}</b>
                        </div>
                        {sub.comment && <p style={{ margin: "6px 0 0", fontSize: 12, color: "#166534" }}>ðŸ’¬ Teacher Feedback: <i>"{sub.comment}"</i></p>}
                      </div>
                    ) : <div style={{ marginTop: 8 }}><Status>Awaiting Teacher Grading</Status></div>}
                  </article>
                );
              })}
              {!submitted.length && <EmptyState icon={CheckSquare} message="No submitted assignments yet." />}
            </div>
          )}
        </>
      )}

      {submitModal && <Modal title={`Submit Solution: ${submitModal.title}`} onClose={() => setSubmitModal(null)}>
        <form onSubmit={submit} className="form-grid" style={{ padding: 22 }}>
          <div className="span-2 upload-context">
            <Notebook size={28} />
            <div><b>{submitModal.title}</b><small>Due: {submitModal.due_date} Â· Total Marks: {submitModal.total_marks}</small></div>
          </div>
          <label className="span-2 upload-zone">
            <UploadSimple size={28} /><b>Upload PDF / File Solution</b><small>PDF, DOCX, Images, ZIP</small>
            <input type="file" onChange={e => setFile(e.target.files[0])} />
          </label>
          <label className="span-2">Or Paste Solution / Drive Link<input type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://drive.google.com/file/d/..." /></label>
          <label className="span-2">Note or Solution Text<textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Paste text solution or comments for your teacherâ€¦" /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setSubmitModal(null)}>Cancel</Btn><Btn type="submit"><UploadSimple size={15} />Submit Solution</Btn></footer>
        </form>
      </Modal>}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STUDENT RESULTS PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function MyResultsPage({ user }) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const studentId = user.ref_id;

  useEffect(() => {
    if (!studentId) return;
    api.getMyResults(studentId).then(setResults).finally(() => setLoading(false));
  }, [studentId]);

  return (
    <>
      <PageHeader title="My Exam Results" subtitle="View your marks, grades and result cards." />
      {loading ? <Spin /> : (
        <div className="results-list">
          {results.map(exam => (
            <div className="result-card" key={exam.id}>
              <div className="result-card-header">
                <div>
                  <h3>{exam.name}</h3>
                  <small>{exam.type} Â· {exam.start_date} â†’ {exam.end_date}</small>
                </div>
                {exam.marks.length > 0 && (
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div className="result-grade-badge" style={{ background: gradeColor(exam.grade), color: "#fff" }}>
                      <b>{exam.grade}</b>
                      <small>{exam.pct}%</small>
                    </div>
                    <Btn className="secondary-button" onClick={() => printResultCard(user.name, user.username, "Class", exam.name, exam.marks, exam.obtained, exam.maxM, exam.pct, exam.grade)}>
                      <Printer size={15} />Print Card
                    </Btn>
                  </div>
                )}
              </div>
              {exam.marks.length > 0 ? (
                <>
                  <div className="result-marks-grid">
                    {exam.marks.map(m => (
                      <div className="result-subject-row" key={m.id}>
                        <span>{m.subject_name}</span>
                        {m.is_absent ? <b style={{ color: "#ef4444" }}>Absent</b> : <b>{m.obtained_marks} / {m.max_marks}</b>}
                        <div className="marks-bar"><i style={{ width: `${m.is_absent ? 0 : Math.round((m.obtained_marks / m.max_marks) * 100)}%`, background: gradeColor(pctToGrade(m.is_absent ? 0 : Math.round((m.obtained_marks / m.max_marks) * 100))) }} /></div>
                      </div>
                    ))}
                  </div>
                  <div className="result-total"><span>Total</span><strong>{exam.obtained} / {exam.maxM}</strong><strong>{exam.pct}%</strong></div>
                </>
              ) : <p style={{ color: "#9aafc7", fontSize: 13, padding: "8px 0" }}>Marks not yet entered by teacher.</p>}
            </div>
          ))}
          {!results.length && <EmptyState icon={Exam} message="No exams found for your class." />}
        </div>
      )}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// STUDENT ATTENDANCE CALENDAR
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function MyAttendancePage({ user }) {
  const [data, setData] = useState(null);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year] = useState(new Date().getFullYear());
  const studentId = user.ref_id;

  useEffect(() => {
    if (!studentId) return;
    api.getMyAttendance(studentId, month, year).then(setData);
  }, [studentId, month, year]);

  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  function buildCalendar() {
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }

  const recMap = {};
  data?.records?.forEach(r => { recMap[r.date] = r.status; });

  const cells = buildCalendar();
  const dayLabels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  return (
    <>
      <PageHeader title="My Attendance" subtitle="Monthly attendance calendar and summary." />
      <div className="att-controls">
        <label>Month:
          <select value={month} onChange={e => setMonth(Number(e.target.value))} style={{ marginLeft: 8, height: 38, border: "1px solid #d9e3ef", borderRadius: 8, padding: "0 10px" }}>
            {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
        </label>
        <b style={{ marginLeft: "auto", color: "#2176f3" }}>{months[month - 1]} {year}</b>
      </div>

      {data && (
        <div className="stats-grid compact" style={{ marginBottom: 20 }}>
          <StatCard label="Present" value={data.present} note={`out of ${data.total} days`} icon={CheckCircle} tone="green" />
          <StatCard label="Absent" value={data.absent} note="days missed" icon={XCircle} tone="red" />
          <StatCard label="Leave" value={data.leave} note="authorized leave" icon={CalendarBlank} tone="orange" />
          <StatCard label="Percentage" value={`${data.pct}%`} note={data.pct >= 75 ? "Good standing" : "Below 75% â€” Warning"} icon={ChartBar} tone={data.pct >= 75 ? "teal" : "red"} />
        </div>
      )}

      <Panel title="Attendance Calendar">
        <div className="att-calendar">
          {dayLabels.map(d => <div key={d} className="cal-header">{d}</div>)}
          {cells.map((d, i) => {
            if (!d) return <div key={i} className="cal-empty" />;
            const dateStr = `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
            const status = recMap[dateStr];
            return (
              <div key={i} className={`cal-day ${status ? `cal-${status.toLowerCase()}` : ""}`}>
                <span>{d}</span>
                {status && <small>{status[0]}</small>}
              </div>
            );
          })}
        </div>
        <div className="cal-legend">
          <span><i className="cal-present-dot" />Present</span>
          <span><i className="cal-absent-dot" />Absent</span>
          <span><i className="cal-leave-dot" />Leave</span>
          <span><i className="cal-empty-dot" />No school / Not marked</span>
        </div>
      </Panel>
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// SHARED PAGES (reused or role-adapted)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

function AcademicsPage({ showToast }) {
  const [data, setData] = useState({ years: [], terms: [] });
  const [showAddYear, setShowAddYear] = useState(false);
  const [showAddTerm, setShowAddTerm] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => api.getAcademics().then(setData).finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);
  async function addYear(e) { e.preventDefault(); await api.addYear(form); showToast("Year added"); setShowAddYear(false); load(); }
  async function addTerm(e) { e.preventDefault(); await api.addTerm({ ...form, academic_year_id: showAddTerm }); showToast("Term added"); setShowAddTerm(null); load(); }
  return (
    <>
      <PageHeader title="Academic Years" action={() => setShowAddYear(true)} actionLabel="Add Year" />
      {loading ? <Spin /> : data.years.map(year => (
        <Panel key={year.id} title={year.label} subtitle={`${year.start_date} â†’ ${year.end_date}`}
          action={<div className="panel-actions">
            {year.is_active ? <span className="badge-active">â— Active</span> : <Btn className="secondary-button" onClick={() => api.activateYear(year.id).then(() => { showToast("Activated"); load(); })}>Activate</Btn>}
            <Btn className="secondary-button" onClick={() => { setShowAddTerm(year.id); setForm({}); }}><Plus size={14} />Term</Btn>
          </div>}>
          <DataTable columns={["Term","Start","End","Status"]}
            rows={data.terms.filter(t => t.academic_year_id === year.id).map(t => [t.name, t.start_date, t.end_date, <Status key={t.id}>{t.status}</Status>])} />
        </Panel>
      ))}
      {showAddYear && <Modal title="Add Academic Year" onClose={() => setShowAddYear(false)}>
        <form onSubmit={addYear} className="form-grid">
          <label>Label<input required onChange={e => setForm({ ...form, label: e.target.value })} /></label>
          <label>Start<input type="date" required onChange={e => setForm({ ...form, start_date: e.target.value })} /></label>
          <label>End<input type="date" required onChange={e => setForm({ ...form, end_date: e.target.value })} /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setShowAddYear(false)}>Cancel</Btn><Btn type="submit">Save</Btn></footer>
        </form>
      </Modal>}
      {showAddTerm && <Modal title="Add Term" onClose={() => setShowAddTerm(null)}>
        <form onSubmit={addTerm} className="form-grid">
          <label>Term Name<input required placeholder="Term 1" onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>Status<select onChange={e => setForm({ ...form, status: e.target.value })} defaultValue="Upcoming"><option>Upcoming</option><option>Active</option><option>Completed</option></select></label>
          <label>Start<input type="date" required onChange={e => setForm({ ...form, start_date: e.target.value })} /></label>
          <label>End<input type="date" required onChange={e => setForm({ ...form, end_date: e.target.value })} /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setShowAddTerm(null)}>Cancel</Btn><Btn type="submit">Save</Btn></footer>
        </form>
      </Modal>}
    </>
  );
}

function ClassesPage({ showToast }) {
  const [tab, setTab] = useState("classes");
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => Promise.all([api.getClasses(), api.getSubjects()]).then(([c, s]) => { setClasses(c); setSubjects(s); }).finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);
  async function saveClass(e) { e.preventDefault(); if (modal.id) await api.updateClass(modal.id, form); else await api.addClass(form); showToast("Saved"); setModal(null); load(); }
  async function saveSubject(e) { e.preventDefault(); if (modal.id) await api.updateSubject(modal.id, form); else await api.addSubject(form); showToast("Saved"); setModal(null); load(); }
  return (
    <>
      <PageHeader title="Classes & Subjects" action={() => { setModal({ type: tab }); setForm({}); }} actionLabel={tab === "classes" ? "Add Class" : "Add Subject"} />
      <div className="tabs">
        <button className={tab === "classes" ? "active" : ""} onClick={() => setTab("classes")}>Classes ({classes.length})</button>
        <button className={tab === "subjects" ? "active" : ""} onClick={() => setTab("subjects")}>Subjects ({subjects.length})</button>
      </div>
      {loading ? <Spin /> : tab === "classes" ? (
        <Panel title="Classes"><DataTable columns={["Name","Section","Grade","Room","Capacity"]} rows={classes.map(c => [c.name, c.section, c.grade, c.room||"â€”", c.capacity])}
          actions={(i) => <div className="row-actions"><IconBtn label="Edit" onClick={() => { setModal({ type: "classes", id: classes[i].id }); setForm(classes[i]); }}><PencilSimple size={15}/></IconBtn><IconBtn label="Delete" danger onClick={async () => { await api.deleteClass(classes[i].id); load(); }}><Trash size={15}/></IconBtn></div>} /></Panel>
      ) : (
        <Panel title="Subjects"><DataTable columns={["Name","Code","Category"]} rows={subjects.map(s => [s.name, s.code, s.category])}
          actions={(i) => <div className="row-actions"><IconBtn label="Edit" onClick={() => { setModal({ type: "subjects", id: subjects[i].id }); setForm(subjects[i]); }}><PencilSimple size={15}/></IconBtn><IconBtn label="Delete" danger onClick={async () => { await api.deleteSubject(subjects[i].id); load(); }}><Trash size={15}/></IconBtn></div>} /></Panel>
      )}
      {modal?.type === "classes" && <Modal title={modal.id ? "Edit Class" : "Add Class"} onClose={() => setModal(null)}>
        <form onSubmit={saveClass} className="form-grid">
          <label>Class Name<input required defaultValue={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>Section<input required defaultValue={form.section} onChange={e => setForm({ ...form, section: e.target.value })} /></label>
          <label>Grade<input required defaultValue={form.grade} onChange={e => setForm({ ...form, grade: e.target.value })} /></label>
          <label>Room<input defaultValue={form.room} onChange={e => setForm({ ...form, room: e.target.value })} /></label>
          <label>Capacity<input type="number" defaultValue={form.capacity||40} onChange={e => setForm({ ...form, capacity: e.target.value })} /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn><Btn type="submit">Save</Btn></footer>
        </form>
      </Modal>}
      {modal?.type === "subjects" && <Modal title={modal.id ? "Edit Subject" : "Add Subject"} onClose={() => setModal(null)}>
        <form onSubmit={saveSubject} className="form-grid">
          <label>Name<input required defaultValue={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
          <label>Code<input required defaultValue={form.code} onChange={e => setForm({ ...form, code: e.target.value })} /></label>
          <label>Category<select defaultValue={form.category||"Core"} onChange={e => setForm({ ...form, category: e.target.value })}><option>Core</option><option>Elective</option><option>Lab</option></select></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn><Btn type="submit">Save</Btn></footer>
        </form>
      </Modal>}
    </>
  );
}

function TeachersPage({ showToast }) {
  const [teachers, setTeachers] = useState([]);
  const [settings, setSettings] = useState({});
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignTeacher, setAssignTeacher] = useState(null);
  const [assignForm, setAssignForm] = useState({ class_id: "", subject_id: "" });
  const [allClasses, setAllClasses] = useState([]);
  const [allSubjects, setAllSubjects] = useState([]);

  const load = useCallback(() => {
    Promise.all([api.getTeachers(), api.getSettings().catch(() => ({}))])
      .then(([t, s]) => { setTeachers(t); setSettings(s); })
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const F = v => e => setForm({ ...form, [v]: e.target.value });

  async function save(e) {
    e.preventDefault();
    if (modal.id) await api.updateTeacher(modal.id, form);
    else await api.addTeacher(form);
    showToast("Saved"); setModal(null); load();
  }

  async function openAssignModal(teacher) {
    const data = await api.getTeacher(teacher.id);
    const [c, s] = await Promise.all([api.getClasses(), api.getSubjects()]);
    setAllClasses(c);
    setAllSubjects(s);
    setAssignTeacher(data);
    setAssignForm({ class_id: c[0]?.id || "", subject_id: s[0]?.id || "" });
  }

  async function handleAddAssignment(e) {
    e.preventDefault();
    if (!assignForm.class_id || !assignForm.subject_id) return showToast("Select class and subject", "error");
    try {
      await api.assignTeacherSubject(assignTeacher.id, assignForm);
      showToast("Assignment added");
      const updated = await api.getTeacher(assignTeacher.id);
      setAssignTeacher(updated);
      load();
    } catch (ex) { showToast(ex.message, "error"); }
  }

  async function handleRemoveAssignment(tsId) {
    await api.removeTeacherAssignment(assignTeacher.id, tsId);
    showToast("Assignment removed");
    const updated = await api.getTeacher(assignTeacher.id);
    setAssignTeacher(updated);
    load();
  }

  const visible = teachers.filter(t => `${t.name} ${t.emp_id}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <PageHeader title="Teachers" action={() => { setModal({ type: "t" }); setForm({ status: "Active" }); }} actionLabel="Add Teacher" icon={UserPlus} />
      <div className="toolbar"><label className="search-box wide"><MagnifyingGlass size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, IDâ€¦" /></label></div>
      {loading ? <Spin /> : <div className="teacher-grid">{visible.map(t => (
        <article className="teacher-card" key={t.id}>
          <div className="teacher-card-top"><Avatar name={t.name} /><Status>{t.status}</Status></div>
          <h3>{t.name}</h3><small>{t.emp_id}</small>
          <div className="teacher-details">
            <span><small>Phone</small><b>{t.phone||"â€”"}</b></span>
            <span><small>Qualification</small><b>{t.qualification||"â€”"}</b></span>
            <span><small>Salary</small><b>{fmtPKR(t.salary)}</b></span>
            <span><small>Assignments</small><b style={{ color: "#2176f3" }}>{t.classes ? `${t.classes}` : "None"}</b></span>
          </div>
          <div className="row-actions" style={{marginTop:10}}>
            <Btn className="secondary-button" onClick={() => printPaySlip(t, null, null, settings)}><Printer size={14} />Pay Slip</Btn>
            <Btn className="secondary-button" onClick={() => openAssignModal(t)}><Buildings size={14} />Assign</Btn>
            <Btn className="secondary-button" onClick={() => { setModal({ type: "t", id: t.id }); setForm(t); }}>Edit</Btn>
            <Btn className="secondary-button danger" onClick={async () => { await api.deleteTeacher(t.id); showToast("Removed"); load(); }}>Remove</Btn>
          </div>
        </article>
      ))}{!visible.length && <EmptyState icon={ChalkboardTeacher} message="No teachers found." />}</div>}

      {modal && <Modal title={modal.id ? "Edit Teacher" : "Add Teacher"} onClose={() => setModal(null)}>
        <form onSubmit={save} className="form-grid">
          <label>Employee ID<input required defaultValue={form.emp_id} onChange={F("emp_id")} /></label>
          <label>Full Name<input required defaultValue={form.name} onChange={F("name")} /></label>
          <label>Phone<input defaultValue={form.phone} onChange={F("phone")} /></label>
          <label>Email<input type="email" defaultValue={form.email} onChange={F("email")} /></label>
          <label>Qualification<input defaultValue={form.qualification} onChange={F("qualification")} /></label>
          <label>Salary (PKR)<input type="number" defaultValue={form.salary} onChange={F("salary")} /></label>
          <label>Join Date<input type="date" defaultValue={form.join_date} onChange={F("join_date")} /></label>
          <label>Status<select defaultValue={form.status||"Active"} onChange={F("status")}><option>Active</option><option>On Leave</option><option>Resigned</option></select></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn><Btn type="submit">Save</Btn></footer>
        </form>
      </Modal>}

      {assignTeacher && <Modal title={`Assignments â€” ${assignTeacher.name}`} onClose={() => setAssignTeacher(null)} wide>
        <div style={{ padding: 22 }}>
          <h4>Assigned Classes & Subjects ({assignTeacher.assignments?.length || 0})</h4>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, margin: "12px 0 20px" }}>
            {assignTeacher.assignments?.map(a => (
              <span key={a.id} style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "6px 12px", borderRadius: 20, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 8 }}>
                <b>{a.class_name} {a.section}</b> â€” {a.subject_name}
                <button type="button" onClick={() => handleRemoveAssignment(a.id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }} title="Remove"><X size={14} /></button>
              </span>
            ))}
            {!assignTeacher.assignments?.length && <p style={{ color: "#9aafc7", fontSize: 13 }}>No classes or subjects assigned yet.</p>}
          </div>

          <form onSubmit={handleAddAssignment} className="form-grid" style={{ background: "#f8fafc", padding: 16, borderRadius: 10, border: "1px solid #e2e8f0" }}>
            <h4 className="span-2" style={{ margin: 0 }}>Assign Subject to Class</h4>
            <label>Class<select value={assignForm.class_id} onChange={e => setAssignForm({ ...assignForm, class_id: e.target.value })}>
              {allClasses.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
            </select></label>
            <label>Subject<select value={assignForm.subject_id} onChange={e => setAssignForm({ ...assignForm, subject_id: e.target.value })}>
              {allSubjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
            </select></label>
            <footer className="modal-actions span-2"><Btn type="submit"><Plus size={15} />Add Assignment</Btn></footer>
          </form>
        </div>
      </Modal>}
    </>
  );
}

function StudentsPage({ showToast }) {
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [modal, setModal] = useState(null);
  const [profileModal, setProfileModal] = useState(null);
  const [profileTab, setProfileTab] = useState("overview");
  const [form, setForm] = useState({});
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([api.getStudents({ search, class_id: filterClass }), api.getClasses()])
      .then(([s, c]) => { setStudents(s); setClasses(c); })
      .finally(() => setLoading(false));
  }, [search, filterClass]);

  useEffect(() => { load(); }, [load]);

  const F = v => e => setForm({ ...form, [v]: e.target.value });

  async function save(e) {
    e.preventDefault();
    if (modal.id) await api.updateStudent(modal.id, form);
    else await api.addStudent(form);
    showToast("Saved"); setModal(null); load();
  }

  async function openProfile(studentId) {
    const data = await api.getStudent(studentId);
    setProfileModal(data);
    setProfileTab("overview");
  }

  return (
    <>
      <PageHeader title="Student Directory" action={() => { setModal({ type: "s" }); setForm({ status: "Active", gender: "Male", student_id: `STU-${Date.now().toString().slice(-4)}` }); }} actionLabel="Admit Student" icon={UserPlus} />
      <div className="toolbar">
        <label className="search-box wide"><MagnifyingGlass size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, IDâ€¦" /></label>
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)}>
          <option value="">All classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
        </select>
      </div>
      {loading ? <Spin /> : <Panel title={`${students.length} students`}>
        <DataTable columns={["Student","ID","Class","Attendance","Fee Status"]}
          rows={students.map(s => [<div className="person-cell" key={s.id}><Avatar name={s.name}/><span><b>{s.name}</b><small>{s.roll_no}</small></span></div>, s.student_id, `${s.class_name||""} ${s.section||""}`, `${s.attendance}%`, <Status key={s.id}>{s.fee_status||"No challan"}</Status>])}
          actions={(i) => <div className="row-actions">
            <IconBtn label="View Profile" onClick={() => openProfile(students[i].id)}><Eye size={15}/></IconBtn>
            <IconBtn label="Edit" onClick={() => { setModal({ type: "s", id: students[i].id }); setForm(students[i]); }}><PencilSimple size={15}/></IconBtn>
            <IconBtn label="Delete" danger onClick={async () => { await api.deleteStudent(students[i].id); showToast("Removed"); load(); }}><Trash size={15}/></IconBtn>
          </div>} />
      </Panel>}

      {/* Edit / Admit Modal */}
      {modal && <Modal title={modal.id ? "Edit Student" : "Admit Student"} onClose={() => setModal(null)} wide>
        <form onSubmit={save} className="form-grid">
          <label>Student ID<input required defaultValue={form.student_id} onChange={F("student_id")} /></label>
          <label>Full Name<input required defaultValue={form.name} onChange={F("name")} /></label>
          <label>Father's Name<input defaultValue={form.father_name} onChange={F("father_name")} /></label>
          <label>Gender<select defaultValue={form.gender||"Male"} onChange={F("gender")}><option>Male</option><option>Female</option></select></label>
          <label>Date of Birth<input type="date" defaultValue={form.dob} onChange={F("dob")} /></label>
          <label>Phone<input defaultValue={form.phone} onChange={F("phone")} /></label>
          <label>Class<select required defaultValue={form.class_id} onChange={F("class_id")}><option value="">Select</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}</select></label>
          <label>Roll No<input defaultValue={form.roll_no} onChange={F("roll_no")} /></label>
          <label>Guardian Name<input required defaultValue={form.guardian_name} onChange={F("guardian_name")} /></label>
          <label>Guardian Phone<input required defaultValue={form.guardian_phone} onChange={F("guardian_phone")} /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn><Btn type="submit">Save</Btn></footer>
        </form>
      </Modal>}

      {/* Full Student Profile Modal */}
      {profileModal && <Modal title={`Student Profile â€” ${profileModal.name}`} onClose={() => setProfileModal(null)} wide>
        <div style={{ padding: 22 }}>
          {/* Header Strip */}
          <div style={{ display: "flex", gap: 16, alignItems: "center", background: "#f8fafc", padding: 16, borderRadius: 12, border: "1px solid #e2e8f0", marginBottom: 20 }}>
            <Avatar name={profileModal.name} />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0 }}>{profileModal.name} <Status>{profileModal.status || "Active"}</Status></h3>
              <p style={{ margin: "2px 0 0", color: "#64748b", fontSize: 13 }}>ID: <b>{profileModal.student_id}</b> Â· Roll: <b>{profileModal.roll_no || "â€”"}</b> Â· Class: <b>{profileModal.class_name} {profileModal.section}</b></p>
            </div>
          </div>

          {/* Profile Tabs */}
          <div className="tabs" style={{ marginBottom: 16 }}>
            <button className={profileTab === "overview" ? "active" : ""} onClick={() => setProfileTab("overview")}>Overview</button>
            <button className={profileTab === "attendance" ? "active" : ""} onClick={() => setProfileTab("attendance")}>Attendance ({profileModal.attendance?.length || 0})</button>
            <button className={profileTab === "fees" ? "active" : ""} onClick={() => setProfileTab("fees")}>Fees & Challans ({profileModal.challans?.length || 0})</button>
            <button className={profileTab === "results" ? "active" : ""} onClick={() => setProfileTab("results")}>Exam Results ({profileModal.results?.length || 0})</button>
          </div>

          {profileTab === "overview" && (
            <div className="form-grid" style={{ fontSize: 13 }}>
              <div><small style={{ color: "#64748b" }}>Father's Name</small><br/><b>{profileModal.father_name || "â€”"}</b></div>
              <div><small style={{ color: "#64748b" }}>Mother's Name</small><br/><b>{profileModal.mother_name || "â€”"}</b></div>
              <div><small style={{ color: "#64748b" }}>Gender</small><br/><b>{profileModal.gender || "â€”"}</b></div>
              <div><small style={{ color: "#64748b" }}>Date of Birth</small><br/><b>{profileModal.dob || "â€”"}</b></div>
              <div><small style={{ color: "#64748b" }}>CNIC / B-Form</small><br/><b>{profileModal.cnic || "â€”"}</b></div>
              <div><small style={{ color: "#64748b" }}>Phone</small><br/><b>{profileModal.phone || "â€”"}</b></div>
              <div><small style={{ color: "#64748b" }}>Guardian Name</small><br/><b>{profileModal.guardian_name || "â€”"}</b></div>
              <div><small style={{ color: "#64748b" }}>Guardian Phone</small><br/><b>{profileModal.guardian_phone || "â€”"}</b></div>
              <div className="span-2"><small style={{ color: "#64748b" }}>Address</small><br/><b>{profileModal.address || "â€”"}</b></div>
            </div>
          )}

          {profileTab === "attendance" && (
            <div className="table-wrap" style={{ maxHeight: 300, overflowY: "auto" }}>
              <table>
                <thead><tr><th>Date</th><th>Status</th></tr></thead>
                <tbody>
                  {profileModal.attendance?.map((a, i) => (
                    <tr key={i}><td>{a.date}</td><td><Status>{a.status}</Status></td></tr>
                  ))}
                  {!profileModal.attendance?.length && <tr><td colSpan={2} style={{ textAlign: "center", color: "#9aafc7" }}>No attendance recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {profileTab === "fees" && (
            <div className="table-wrap" style={{ maxHeight: 300, overflowY: "auto" }}>
              <table>
                <thead><tr><th>Challan #</th><th>Month</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Proof</th></tr></thead>
                <tbody>
                  {profileModal.challans?.map((c, i) => (
                    <tr key={i}>
                      <td>{c.challan_no}</td><td>{c.month} {c.year}</td><td>{fmtPKR(c.amount)}</td>
                      <td>{c.due_date}</td><td><Status>{c.status}</Status></td><td><Status>{c.proof_status || "—"}</Status></td>
                    </tr>
                  ))}
                  {!profileModal.challans?.length && <tr><td colSpan={6} style={{ textAlign: "center", color: "#9aafc7" }}>No challans generated yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {profileTab === "results" && (
            <div className="table-wrap" style={{ maxHeight: 300, overflowY: "auto" }}>
              <table>
                <thead><tr><th>Exam</th><th>Subject</th><th>Total</th><th>Obtained</th><th>Grade</th></tr></thead>
                <tbody>
                  {profileModal.results?.map((r, i) => (
                    <tr key={i}>
                      <td>{r.exam_name}</td><td>{r.subject_name}</td><td>{r.total_marks}</td>
                      <td>{r.marks_obtained}</td><td><Status>{r.grade}</Status></td>
                    </tr>
                  ))}
                  {!profileModal.results?.length && <tr><td colSpan={5} style={{ textAlign: "center", color: "#9aafc7" }}>No exam results recorded yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Modal>}
    </>
  );
}

function FeesPage({ user, showToast }) {
  const [tab, setTab] = useState("challans");
  const [challans, setChallans] = useState([]);
  const [structures, setStructures] = useState([]);
  const [classes, setClasses] = useState([]);
  const [summary, setSummary] = useState({});
  const [modal, setModal] = useState(null);
  const [challanDetail, setChallanDetail] = useState(null);
  const [proofViewModal, setProofViewModal] = useState(null);
  const [aiNoticeModal, setAiNoticeModal] = useState(null);
  const [form, setForm] = useState({});
  const [proofFile, setProofFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => {
    const params = user.role === "Student" ? { student_id: user.ref_id } : {};
    Promise.all([api.getChallans(params), api.getFeeStructures(), api.getClasses(), api.getFeeSummary({ year: new Date().getFullYear() })])
      .then(([ch, fs, cl, sm]) => { setChallans(ch); setStructures(fs); setClasses(cl); setSummary(sm); }).finally(() => setLoading(false));
  }, [user]);
  useEffect(() => { load(); }, [load]);
  const F = v => e => setForm({ ...form, [v]: e.target.value });
  async function generateChallan(e) { e.preventDefault(); await api.generateChallans(form); showToast("Challans generated"); setModal(null); load(); }
  async function uploadProof(e) { e.preventDefault(); const fd = new FormData(); fd.append("proof", proofFile); fd.append("note", form.note||""); await api.uploadProof(challanDetail.id, fd); showToast("Proof uploaded successfully"); setChallanDetail(null); load(); }
  async function addFeeStructure(e) { e.preventDefault(); await api.addFeeStructure(form); showToast("Added"); setModal(null); load(); }
  function printChallan(ch) {
    const win = window.open("","_blank","width=800,height=600");
    const s = ch.settings||{};
    win.document.write(`<html><head><title>Fee Challan ${ch.challan_no}</title><style>body{font-family:Arial,sans-serif;font-size:13px;color:#222;padding:24px}h1{font-size:18px;margin:0}.header{text-align:center;border-bottom:2px solid #1e3a5f;padding-bottom:12px;margin-bottom:16px}table{width:100%;border-collapse:collapse;margin:10px 0}td,th{border:1px solid #bbb;padding:6px 10px;text-align:left}th{background:#f0f4fa;font-weight:600}.total{font-size:15px;font-weight:800}.copy{border:2px dashed #bbb;padding:16px;margin-bottom:16px}.copy-title{text-align:center;color:#666;margin-bottom:8px;font-size:11px}.bank{background:#f9f9f9;padding:10px;border:1px solid #ddd;margin-top:12px;font-size:12px}@media print{.noprint{display:none}}</style></head><body>
    ${["BANK COPY","STUDENT COPY"].map(copy => `<div class="copy"><div class="copy-title">${copy}</div><div class="header"><div style="display:flex;align-items:center;justify-content:center;gap:10px;margin-bottom:6px">${PRINT_SCHOOL_LOGO}<div><h1 style="margin:0;font-size:18px;color:#1e3a5f">${s.school_name||"EduSphere School & College"}</h1><p style="margin:2px 0 0;color:#64748b;font-size:11px">${s.address||"Main Campus, Sialkot"}</p></div></div><h2 style="margin:6px 0 0;font-size:13px;color:#4f6ef7">FEE CHALLAN &mdash; ${ch.month} ${ch.year}</h2></div>
    <table><tr><td><b>Challan No:</b> ${ch.challan_no}</td><td><b>Issue Date:</b> ${ch.issued_date||""}</td></tr><tr><td><b>Student:</b> ${ch.student_name}</td><td><b>ID:</b> ${ch.stu_code}</td></tr><tr><td><b>Class:</b> ${ch.class_name} ${ch.section}</td><td><b>Due Date:</b> ${ch.due_date}</td></tr></table>
    <table><tr><th>Description</th><th>Amount (PKR)</th></tr>${(ch.items||[]).map(it => `<tr><td>${it.label}</td><td>${fmt(it.amount)}</td></tr>`).join("")}<tr class="total"><td><b>Total Payable</b></td><td><b>PKR ${fmt(ch.amount)}</b></td></tr></table>
    <div class="bank"><b>Bank:</b> ${s.bank_name||"Meezan Bank"} | <b>Account No:</b> ${s.account_number||""} | <b>IBAN:</b> ${s.iban||""}</div></div>`).join("")}
    <div class="noprint" style="text-align:center;margin-top:20px"><button onclick="window.print()" style="padding:10px 24px;background:#1e3a5f;color:#fff;border:none;border-radius:6px;cursor:pointer">🖨 Print Challan</button></div>
    </body></html>`);
    win.document.close();
  }
  return (
    <>
      <PageHeader title="Fees & Challans" action={user.role !== "Student" ? () => { setModal({ type: "generate" }); setForm({}); } : undefined} actionLabel="Generate Challan" icon={Receipt} />
      {user.role !== "Student" && <div className="stats-grid compact">
        <StatCard label="Total Due" value={fmtPKR(summary.total_due)} note="This year" icon={Money} tone="blue" />
        <StatCard label="Collected" value={fmtPKR(summary.collected)} note={`${summary.paid_count||0} paid`} icon={CheckCircle} tone="green" />
        <StatCard label="Pending" value={fmtPKR(summary.pending)} note={`${summary.pending_count||0} challans`} icon={Coins} tone="orange" />
        <StatCard label="Overdue" value={fmtPKR(summary.overdue)} note={`${summary.overdue_count||0} challans`} icon={XCircle} tone="red" />
      </div>}
      {user.role !== "Student" && <div className="tabs">
        <button className={tab==="challans"?"active":""} onClick={() => setTab("challans")}>Challans</button>
        <button className={tab==="structures"?"active":""} onClick={() => setTab("structures")}>Fee Structure</button>
      </div>}
      {loading ? <Spin /> : tab === "challans" || user.role === "Student" ? (
        <Panel title="Fee Challans">
          <DataTable columns={["Challan","Student","Amount","Month","Due","Status","Proof"]}
            rows={challans.map(f => [f.challan_no, f.student_name, fmtPKR(f.amount), `${f.month} ${f.year}`, f.due_date, <Status key={f.id}>{f.status}</Status>, <Status key={`p${f.id}`}>{f.proof_status}</Status>])}
            actions={(i) => {
              const f = challans[i];
              return <div className="row-actions">
                <IconBtn label="Print Challan" onClick={async () => { const d = await api.getChallan(f.id); printChallan(d); }}><Printer size={15}/></IconBtn>
                {f.status !== "Paid" && user.role !== "Student" && (
                  <Btn className="secondary-button" style={{ background: "linear-gradient(135deg, #25d366, #128c7e)", color: "#fff", border: "none" }}
                    onClick={async () => {
                      const notice = await api.draftAiFeeNotice(f.id);
                      setAiNoticeModal(notice);
                    }}>
                    <Sparkle size={14} weight="fill" /> AI WhatsApp Notice
                  </Btn>
                )}
                {f.proof_path && (
                  <Btn className="secondary-button" onClick={() => setProofViewModal(f)}><Eye size={14} /> Proof Screenshot</Btn>
                )}
                {f.proof_status === "Uploaded" && user.role !== "Student" && <>
                  <Btn className="table-action green-btn" onClick={() => api.verifyProof(f.id).then(() => { showToast("Verified"); load(); })}>Verify</Btn>
                  <Btn className="table-action danger-btn" onClick={() => api.rejectProof(f.id).then(() => { showToast("Rejected"); load(); })}>Reject</Btn>
                </>}
                {user.role === "Student" && f.status !== "Paid" && <Btn className="table-action" onClick={async () => { const d = await api.getChallan(f.id); setChallanDetail(d); }}>Upload Proof</Btn>}
              </div>;
            }} />
        </Panel>
      ) : (
        <Panel title="Fee Structure" action={<Btn className="secondary-button" onClick={() => { setModal({ type: "structure" }); setForm({}); }}><Plus size={14}/>Add Fee</Btn>}>
          <DataTable columns={["Class","Description","Amount","Category"]}
            rows={structures.map(fs => [`${fs.class_name} ${fs.section}`, fs.label, fmtPKR(fs.amount), fs.category])}
            actions={(i) => <IconBtn label="Delete" danger onClick={async () => { await api.deleteFeeStructure(structures[i].id); showToast("Deleted"); load(); }}><Trash size={15}/></IconBtn>} />
        </Panel>
      )}

      {aiNoticeModal && (
        <Modal title={`✨ AI Fee Recovery Notice — ${aiNoticeModal.student_name}`} onClose={() => setAiNoticeModal(null)}>
          <div style={{ padding: "8px 0" }}>
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: 14, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ color: "#166534", fontWeight: 700, fontSize: 13, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                💬 AI Formatted Bilingual Reminder (WhatsApp &amp; SMS)
              </div>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: 12, color: "#1e293b", margin: 0, background: "#ffffff", padding: 12, borderRadius: 8, border: "1px solid #cbd5e1", maxHeight: 280, overflowY: "auto" }}>
                {aiNoticeModal.formatted_message}
              </pre>
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button type="button" className="secondary-button" onClick={() => { navigator.clipboard.writeText(aiNoticeModal.formatted_message); showToast("Notice text copied to clipboard!"); }}>
                📋 Copy Message Text
              </button>
              <a href={aiNoticeModal.whatsapp_url} target="_blank" rel="noreferrer" className="primary-button" style={{ background: "#25d366", borderColor: "#25d366", display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none" }}>
                📲 Open in WhatsApp Web / App →
              </a>
            </div>
          </div>
        </Modal>
      )}
      {modal?.type === "generate" && <Modal title="Generate Fee Challans" onClose={() => setModal(null)}>
        <form onSubmit={generateChallan} className="form-grid">
          <label>Class<select onChange={F("class_id")}><option value="">All classes</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}</select></label>
          <label>Month<select required onChange={F("month")}>{["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => <option key={m}>{m}</option>)}</select></label>
          <label>Year<input type="number" required defaultValue={new Date().getFullYear()} onChange={F("year")} /></label>
          <label>Due Date<input type="date" required onChange={F("due_date")} /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn><Btn type="submit">Generate</Btn></footer>
        </form>
      </Modal>}
      {modal?.type === "structure" && <Modal title="Add Fee Structure" onClose={() => setModal(null)}>
        <form onSubmit={addFeeStructure} className="form-grid">
          <label>Class<select required onChange={F("class_id")}><option value="">Select</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}</select></label>
          <label>Category<select onChange={F("category")} defaultValue="Tuition"><option>Tuition</option><option>Exam</option><option>Lab</option><option>Transport</option><option>Other</option></select></label>
          <label className="span-2">Description<input required onChange={F("label")} /></label>
          <label>Amount (PKR)<input type="number" required onChange={F("amount")} /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn><Btn type="submit">Add</Btn></footer>
        </form>
      </Modal>}
      {challanDetail && <Modal title={`Challan ${challanDetail.challan_no}`} onClose={() => setChallanDetail(null)} wide>
        <div className="challan-preview">
          <div className="challan-info">
            <div className="challan-row"><span>Student</span><b>{challanDetail.student_name}</b></div>
            <div className="challan-row"><span>Class</span><b>{challanDetail.class_name} {challanDetail.section}</b></div>
            <div className="challan-row"><span>Month</span><b>{challanDetail.month} {challanDetail.year}</b></div>
            <div className="challan-row"><span>Status</span><Status>{challanDetail.status}</Status></div>
          </div>
          <table className="challan-items-table">
            <thead><tr><th>Description</th><th>Amount</th></tr></thead>
            <tbody>{challanDetail.items?.map((it, i) => <tr key={i}><td>{it.label}</td><td>{fmtPKR(it.amount)}</td></tr>)}</tbody>
            <tfoot><tr><td><b>Total</b></td><td><b>{fmtPKR(challanDetail.amount)}</b></td></tr></tfoot>
          </table>
          <div className="challan-actions">
            <Btn onClick={() => printChallan(challanDetail)}><Printer size={16}/>Print Challan</Btn>
            {challanDetail.status !== "Paid" && <form onSubmit={uploadProof} className="proof-upload">
              <h4>Upload Payment Proof Screenshot</h4>
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" required onChange={e => setProofFile(e.target.files[0])} />
              <Btn type="submit" disabled={!proofFile}><UploadSimple size={15}/>Submit Proof Screenshot</Btn>
            </form>}
          </div>
        </div>
      </Modal>}

      {proofViewModal && (
        <Modal title={`Payment Proof Screenshot â€” Challan ${proofViewModal.challan_no}`} onClose={() => setProofViewModal(null)} wide>
          <div style={{ padding: "16px 20px" }}>
            <div style={{ marginBottom: 14, background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>Student: <b>{proofViewModal.student_name}</b></div>
              <div>Class: <b>{proofViewModal.class_name} {proofViewModal.section}</b></div>
              <div>Amount: <b style={{ color: "#059669" }}>{fmtPKR(proofViewModal.amount)}</b></div>
              <div>Status: <Status>{proofViewModal.proof_status}</Status></div>
              {proofViewModal.payment_note && <div className="span-2">Note: <i>{proofViewModal.payment_note}</i></div>}
            </div>

            <div style={{ textAlign: "center", background: "#0f172a", padding: 16, borderRadius: 10, minHeight: 260, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {proofViewModal.proof_path ? (
                proofViewModal.proof_path.toLowerCase().endsWith(".pdf") ? (
                  <iframe src={`${api.UPLOADS}/proofs/${proofViewModal.proof_path}`} style={{ width: "100%", height: 380, border: "none", borderRadius: 6 }} title="PDF Proof" />
                ) : (
                  <img
                    src={`${api.UPLOADS}/proofs/${proofViewModal.proof_path}`}
                    alt="Payment Receipt Screenshot"
                    style={{ maxWidth: "100%", maxHeight: 380, objectFit: "contain", borderRadius: 6, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}
                  />
                )
              ) : (
                <span style={{ color: "#94a3b8" }}>No screenshot file attached.</span>
              )}
            </div>

            <footer className="modal-actions" style={{ marginTop: 20 }}>
              {proofViewModal.proof_path && (
                <a href={`${api.UPLOADS}/proofs/${proofViewModal.proof_path}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
                  <Btn className="secondary-button"><DownloadSimple size={15} /> Download Full Image</Btn>
                </a>
              )}
              {user.role !== "Student" && proofViewModal.proof_status === "Uploaded" && (
                <>
                  <Btn className="danger-btn" onClick={() => api.rejectProof(proofViewModal.id).then(() => { showToast("Payment Rejected"); setProofViewModal(null); load(); })}>Reject Proof</Btn>
                  <Btn className="green-btn" onClick={() => api.verifyProof(proofViewModal.id).then(() => { showToast("Payment Verified & Marked Paid!"); setProofViewModal(null); load(); })}>Verify & Mark Paid</Btn>
                </>
              )}
            </footer>
          </div>
        </Modal>
      )}
    </>
  );
}

function FinancialsPage({ showToast }) {
  const [data, setData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [salaries, setSalaries] = useState([]);
  const [settings, setSettings] = useState({});
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [tab, setTab] = useState("dashboard");
  const year = new Date().getFullYear();
  const load = useCallback(() => Promise.all([api.getFinancialDashboard(year), api.getExpenses(), api.getSalaries(), api.getSettings().catch(() => ({}))]).then(([d, e, s, st]) => { setData(d); setExpenses(e); setSalaries(s); setSettings(st); }), [year]);
  useEffect(() => { load(); }, [load]);
  const totalSalaries = salaries.reduce((a, t) => a + (t.salary||0), 0);
  const F = v => e => setForm({ ...form, [v]: e.target.value });
  return (
    <>
      <PageHeader title="Financial Management" subtitle="Income, expenses, salary and balance overview." />
      <div className="stats-grid compact">
        <StatCard label="Total Income" value={fmtPKR(data?.totalCollected)} note="Fee collected" icon={Money} tone="green" />
        <StatCard label="Total Expenses" value={fmtPKR(data?.totalExpenses)} note="Recorded" icon={CurrencyDollar} tone="red" />
        <StatCard label="Net Balance" value={fmtPKR(data?.net)} note="Income - Expenses" icon={ChartLine} tone="blue" />
        <StatCard label="Monthly Salaries" value={fmtPKR(totalSalaries)} note={`${salaries.length} teachers`} icon={UsersThree} tone="purple" />
      </div>
      <div className="tabs">
        <button className={tab==="dashboard"?"active":""} onClick={() => setTab("dashboard")}>Overview</button>
        <button className={tab==="expenses"?"active":""} onClick={() => setTab("expenses")}>Expenses</button>
        <button className={tab==="salaries"?"active":""} onClick={() => setTab("salaries")}>Salaries</button>
      </div>
      {tab === "dashboard" && data && <Panel title={`Monthly Income vs Expenses â€” ${year}`}>
        <div className="chart-wrap-tall">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.monthly} margin={{ top: 16, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#e6edf7" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: "#61718b", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#7b89a1", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #dbe5f2" }} formatter={v => fmtPKR(v)} />
              <Bar dataKey="income" fill="#12a866" radius={[5,5,0,0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[5,5,0,0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>}
      {tab === "expenses" && <Panel title="Expense Ledger" action={<Btn className="secondary-button" onClick={() => { setModal(true); setForm({ date: today() }); }}><Plus size={14}/>Add Expense</Btn>}>
        <DataTable columns={["Date","Category","Description","Amount"]} rows={expenses.map(e => [e.date, e.category, e.description||"â€”", fmtPKR(e.amount)])}
          actions={(i) => <IconBtn label="Delete" danger onClick={async () => { await api.deleteExpense(expenses[i].id); showToast("Deleted"); load(); }}><Trash size={15}/></IconBtn>} />
      </Panel>}
      {tab === "salaries" && <Panel title="Staff Salaries">
        <DataTable columns={["ID","Teacher","Qualification","Status","Salary"]}
          rows={salaries.map(t => [t.emp_id, t.name, t.qualification || "â€”", <Status key={t.id}>{t.status}</Status>, fmtPKR(t.salary)])}
          actions={(i) => <IconBtn label="Print Pay Slip" onClick={() => printPaySlip(salaries[i], null, null, settings)}><Printer size={15}/></IconBtn>} />
        <div className="summary-footer">Total Monthly Commitment: <strong>{fmtPKR(totalSalaries)}</strong></div>
      </Panel>}
      {modal && <Modal title="Record Expense" onClose={() => setModal(false)}>
        <form onSubmit={async e => { e.preventDefault(); await api.addExpense(form); showToast("Expense recorded"); setModal(false); load(); }} className="form-grid">
          <label>Category<select required onChange={F("category")} defaultValue=""><option value="" disabled>Select</option><option>Utilities</option><option>Salaries</option><option>Maintenance</option><option>Stationery</option><option>Events</option><option>Other</option></select></label>
          <label>Date<input type="date" required defaultValue={today()} onChange={F("date")} /></label>
          <label className="span-2">Description<input onChange={F("description")} /></label>
          <label>Amount<input type="number" required onChange={F("amount")} /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(false)}>Cancel</Btn><Btn type="submit">Save</Btn></footer>
        </form>
      </Modal>}
    </>
  );
}

function TimetablePage({ showToast }) {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selClass, setSelClass] = useState("");
  const [entries, setEntries] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  useEffect(() => { Promise.all([api.getClasses(), api.getSubjects(), api.getTeachers()]).then(([c, s, t]) => { setClasses(c); setSubjects(s); setTeachers(t); if (c.length) setSelClass(String(c[0].id)); }); }, []);
  useEffect(() => { if (!selClass) return; api.getTimetable(selClass).then(setEntries); }, [selClass]);
  const F = v => e => setForm({ ...form, [v]: e.target.value });
  async function add(e) { e.preventDefault(); try { await api.addTimetableEntry({ ...form, class_id: selClass }); showToast("Period added"); setModal(false); api.getTimetable(selClass).then(setEntries); } catch (ex) { showToast(ex.message, "error"); } }
  const grid = {}; for (const d of days) grid[d] = entries.filter(e => e.day === d).sort((a, b) => a.start_time.localeCompare(b.start_time));
  const times = [...new Set(entries.map(e => e.start_time))].sort();
  return (
    <>
      <PageHeader title="Timetable" action={() => { setModal(true); setForm({}); }} actionLabel="Add Period" />
      <div className="toolbar"><label>Class<select value={selClass} onChange={e => setSelClass(e.target.value)}>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}</select></label></div>
      <Panel title="Weekly Schedule">
        <div className="timetable-scroll">
          <div className="timetable-grid" style={{ gridTemplateColumns: `80px repeat(${days.length},1fr)` }}>
            <div className="tt-header"/>
            {days.map(d => <div key={d} className="tt-header">{d}</div>)}
            {times.map(time => <>
              <div key={`t${time}`} className="tt-time">{time}</div>
              {days.map(d => {
                const e = grid[d]?.find(x => x.start_time === time);
                return <div key={d} className={`tt-cell ${e ? "filled" : "empty"}`}>
                  {e ? <><b>{e.subject_name}</b><small>{e.teacher_name}</small><em>{e.room}</em>
                    <IconBtn label="Remove" danger onClick={async () => { await api.deleteTimetableEntry(e.id); api.getTimetable(selClass).then(setEntries); }}><X size={12}/></IconBtn>
                  </> : <span className="tt-blank">â€”</span>}
                </div>;
              })}
            </>)}
          </div>
        </div>
      </Panel>
      {modal && <Modal title="Add Period" onClose={() => setModal(false)}>
        <form onSubmit={add} className="form-grid">
          <label>Day<select required onChange={F("day")}><option value="">Select</option>{days.map(d => <option key={d}>{d}</option>)}</select></label>
          <label>Subject<select required onChange={F("subject_id")}><option value="">Select</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>Teacher<select required onChange={F("teacher_id")}><option value="">Select</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></label>
          <label>Room<input onChange={F("room")} /></label>
          <label>Start<input type="time" required onChange={F("start_time")} /></label>
          <label>End<input type="time" required onChange={F("end_time")} /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(false)}>Cancel</Btn><Btn type="submit">Add</Btn></footer>
        </form>
      </Modal>}
    </>
  );
}

function MaterialsPage({ user, showToast }) {
  const [materials, setMaterials] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [file, setFile] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(() => Promise.all([api.getMaterials(), api.getClasses(), api.getSubjects()]).then(([m, c, s]) => { setMaterials(m); setClasses(c); setSubjects(s); }).finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);
  const F = v => e => setForm({ ...form, [v]: e.target.value });
  async function upload(e) { e.preventDefault(); const fd = new FormData(); fd.append("file", file); fd.append("title", form.title); fd.append("subject_id", form.subject_id||""); fd.append("class_id", form.class_id||""); await api.uploadMaterial(fd); showToast("Uploaded"); setModal(false); load(); }
  const visible = materials.filter(m => `${m.title} ${m.subject_name} ${m.class_name}`.toLowerCase().includes(search.toLowerCase()));
  return (
    <>
      <PageHeader title="Study Materials" action={user.role !== "Student" ? () => { setModal(true); setForm({}); } : undefined} actionLabel="Upload" icon={UploadSimple} />
      <div className="toolbar"><label className="search-box wide"><MagnifyingGlass size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search materialsâ€¦" /></label></div>
      {loading ? <Spin /> : <Panel title={`${visible.length} resources`}>
        <DataTable columns={["Resource","Subject","Class","Type","Uploaded"]}
          rows={visible.map(m => [<div className="file-name" key={m.id}><FileText size={18}/><b>{m.title}</b></div>, m.subject_name||"â€”", `${m.class_name||""} ${m.section||""}`, m.file_type, m.uploaded_at?.split("T")[0]])}
          actions={(i) => <div className="row-actions">
            <a href={`${api.UPLOADS}/materials/${visible[i].file_path}`} target="_blank" rel="noreferrer"><IconBtn label="Download"><DownloadSimple size={15}/></IconBtn></a>
            {user.role !== "Student" && <IconBtn label="Delete" danger onClick={async () => { await api.deleteMaterial(visible[i].id); showToast("Deleted"); load(); }}><Trash size={15}/></IconBtn>}
          </div>} />
      </Panel>}
      {modal && <Modal title="Upload Material" onClose={() => setModal(false)}>
        <form onSubmit={upload} className="form-grid">
          <label className="span-2">Title<input required onChange={F("title")} /></label>
          <label>Subject<select onChange={F("subject_id")}><option value="">All</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
          <label>Class<select onChange={F("class_id")}><option value="">All</option>{classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}</select></label>
          <label className="span-2 upload-zone"><UploadSimple size={28}/><b>Choose file</b><small>PDF, DOCX, ZIP Â· Max 50MB</small><input type="file" required onChange={e => setFile(e.target.files[0])} /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(false)}>Cancel</Btn><Btn type="submit" disabled={!file}>Upload</Btn></footer>
        </form>
      </Modal>}
    </>
  );
}

function AnnouncementsPage({ user, showToast }) {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [confirm, confirmDialog] = useConfirm();
  // Pass role so backend filters to relevant announcements only
  const load = useCallback(() => api.getAnnouncements(user.role).then(setItems).finally(() => setLoading(false)), [user.role]);
  useEffect(() => { load(); }, [load]);
  const F = v => e => setForm({ ...form, [v]: e.target.value });
  return (
    <>
      {confirmDialog}
      <PageHeader title="Announcements" action={user.role !== "Student" ? () => { setModal(true); setForm({ target: "All", priority: "Normal" }); } : undefined} actionLabel="Post Announcement" icon={Megaphone} />
      {loading ? <Spin /> : <div className="announcements-list">
        {items.map(a => <article className="announcement-card" key={a.id}>
          <div className="ann-meta"><Status>{a.priority}</Status><span className="ann-target">For: {a.target}</span><small>{a.created_at?.split("T")[0]}</small></div>
          <h3>{a.title}</h3><p>{a.body}</p>
          {user.role !== "Student" && <IconBtn label="Delete" danger onClick={async () => {
            const ok = await confirm("Delete this announcement permanently?");
            if (!ok) return;
            await api.deleteAnnouncement(a.id); showToast("Deleted"); load();
          }} className="ann-delete"><Trash size={15}/></IconBtn>}
        </article>)}
        {!items.length && <EmptyState icon={Megaphone} message="No announcements posted." />}
      </div>}
      {modal && <Modal title="New Announcement" onClose={() => setModal(false)}>
        <form onSubmit={async e => { e.preventDefault(); await api.addAnnouncement(form); showToast("Posted"); setModal(false); load(); }} className="form-grid">
          <label className="span-2">Title<input required onChange={F("title")} /></label>
          <label>Target<select onChange={F("target")} defaultValue="All"><option>All</option><option>Students</option><option>Teachers</option></select></label>
          <label>Priority<select onChange={F("priority")} defaultValue="Normal"><option>Normal</option><option>High</option><option>Low</option></select></label>
          <label className="span-2">Message<textarea required onChange={F("body")} rows={4} /></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(false)}>Cancel</Btn><Btn type="submit">Post</Btn></footer>
        </form>
      </Modal>}
    </>
  );
}

function ReportsPage({ showToast }) {
  const [active, setActive] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [exams, setExams] = useState([]);
  const [filters, setFilters] = useState({ month: new Date().toLocaleString("en-US", { month: "long" }), year: new Date().getFullYear(), class_id: "", exam_id: "" });

  useEffect(() => {
    api.getClasses().then(setClasses).catch(() => {});
    api.getExams().then(setExams).catch(() => {});
  }, []);

  async function loadReport(type, params = {}) {
    setActive(type); setLoading(true); setData([]);
    try {
      let rows = [];
      if (type === "attendance")      rows = await api.getAttendanceReport(params);
      else if (type === "fees")       rows = await api.getFeeReport(params);
      else if (type === "academic")   rows = await api.getAcademicReport(params);
      else if (type === "workload")   rows = await api.getTeacherWorkloadReport();
      setData(rows);
    } catch { showToast("Failed to load report"); }
    finally { setLoading(false); }
  }

  function downloadCSV() {
    if (!data.length) return;
    const keys = Object.keys(data[0]);
    const csv = [keys.join(","), ...data.map(r => keys.map(k => `"${r[k] ?? ""}"`).join(","))].join("\n");
    const a = document.createElement("a"); a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `edusphere-${active}-report.csv`; a.click();
  }

  const REPORTS = [
    { id: "attendance", label: "Attendance Report", icon: ListChecks, color: "#2176f3", desc: "Student-wise attendance breakdown" },
    { id: "fees", label: "Fee Collection", icon: Receipt, color: "#12a866", desc: "Challan status and payment details" },
    { id: "academic", label: "Academic Performance", icon: GraduationCap, color: "#7c3aed", desc: "Marks and grades by exam" },
    { id: "workload", label: "Teacher Workload", icon: ChalkboardTeacher, color: "#f59e0b", desc: "Periods, classes and assignments" },
  ];

  return (
    <>
      <PageHeader title="Reports & Analytics" subtitle="Generate and download real-time institution reports." />

      {/* Report selector strip */}
      <div className="report-grid">
        {REPORTS.map(({ id, label, icon: I, color, desc }) => (
          <button key={id} className={`report-card ${active === id ? "active" : ""}`}
            onClick={() => loadReport(id, { month: filters.month, year: filters.year, class_id: filters.class_id, exam_id: filters.exam_id })}>
            <span style={{ background: color + "18", color }}><I size={24}/></span>
            <div><b>{label}</b><p>{desc}</p></div>
            <ArrowRight size={18} style={{ color: "#9aafc7" }}/>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      <div className="toolbar" style={{ marginTop: 16 }}>
        <label>Month
          <select value={filters.month} onChange={e => setFilters({ ...filters, month: e.target.value })}>
            {["January","February","March","April","May","June","July","August","September","October","November","December"].map(m => <option key={m}>{m}</option>)}
          </select>
        </label>
        <label>Year<input type="number" value={filters.year} min={2020} max={2030} style={{ width: 90 }} onChange={e => setFilters({ ...filters, year: e.target.value })} /></label>
        <label>Class
          <select value={filters.class_id} onChange={e => setFilters({ ...filters, class_id: e.target.value })}>
            <option value="">All Classes</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
          </select>
        </label>
        {active === "academic" && <label>Exam
          <select value={filters.exam_id} onChange={e => setFilters({ ...filters, exam_id: e.target.value })}>
            <option value="">All Exams</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </label>}
        {active && (
          <>
            <Btn onClick={() => loadReport(active, { month: filters.month, year: filters.year, class_id: filters.class_id, exam_id: filters.exam_id })}><ArrowClockwise size={15}/>Refresh</Btn>
            {data.length > 0 && <Btn className="secondary-button" onClick={downloadCSV}><DownloadSimple size={15}/>Export CSV</Btn>}
          </>
        )}
      </div>

      {/* Report Table */}
      {active && (
        <div style={{ marginTop: 16 }}>
          {loading ? <Spin /> : (
            data.length === 0
              ? <EmptyState icon={ChartBar} message="No data for selected filters." />
              : (() => {
                  if (active === "attendance") return (
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>#</th><th>Student</th><th>ID</th><th>Class</th><th>Total Days</th><th>Present</th><th>Absent</th><th>Leave</th><th>Attendance%</th></tr></thead>
                        <tbody>{data.map((r, i) => (
                          <tr key={i}>
                            <td>{i+1}</td><td>{r.student_name}</td><td>{r.stu_code}</td>
                            <td>{r.class_name} {r.section}</td><td>{r.total_days}</td>
                            <td style={{ color: "#12a866", fontWeight: 700 }}>{r.present}</td>
                            <td style={{ color: "#ef4444", fontWeight: 700 }}>{r.absent}</td>
                            <td style={{ color: "#f59e0b" }}>{r.leave}</td>
                            <td><span style={{ color: r.pct < 75 ? "#ef4444" : "#12a866", fontWeight: 700 }}>{r.pct}%</span></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  );
                  if (active === "fees") return (
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>#</th><th>Student</th><th>Class</th><th>Challan</th><th>Month</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Proof</th></tr></thead>
                        <tbody>{data.map((r, i) => (
                          <tr key={i}>
                            <td>{i+1}</td><td>{r.student_name}</td><td>{r.class_name} {r.section}</td>
                            <td>{r.challan_no}</td><td>{r.month} {r.year}</td>
                            <td>{fmtPKR(r.amount)}</td><td>{r.due_date}</td>
                            <td><Status>{r.status}</Status></td>
                            <td><Status>{r.proof_status || "â€”"}</Status></td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  );
                  if (active === "academic") return (
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>#</th><th>Student</th><th>Class</th><th>Exam</th><th>Subject</th><th>Marks</th><th>Max</th><th>%</th><th>Grade</th></tr></thead>
                        <tbody>{data.map((r, i) => {
                          const pct = r.pct || 0;
                          return (<tr key={i}>
                            <td>{i+1}</td><td>{r.student_name}</td><td>{r.class_name} {r.section}</td>
                            <td>{r.exam_name}</td><td>{r.subject_name}</td>
                            <td>{r.obtained_marks}</td><td>{r.max_marks}</td>
                            <td style={{ color: pct < 40 ? "#ef4444" : "#12a866", fontWeight: 700 }}>{pct}%</td>
                            <td><span style={{ background: gradeColor(pctToGrade(pct)), color: "#fff", padding: "2px 9px", borderRadius: 999, fontSize: 11, fontWeight: 800 }}>{pctToGrade(pct)}</span></td>
                          </tr>);
                        })}</tbody>
                      </table>
                    </div>
                  );
                  if (active === "workload") return (
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>#</th><th>Teacher</th><th>Emp ID</th><th>Classes</th><th>Total Periods/Wk</th><th>Subjects</th><th>Assignments Created</th></tr></thead>
                        <tbody>{data.map((r, i) => (
                          <tr key={i}>
                            <td>{i+1}</td><td>{r.teacher_name}</td><td>{r.emp_id}</td>
                            <td>{r.classes_count}</td><td>{r.total_periods}</td>
                            <td>{r.subjects_count}</td><td>{r.assignments_created}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </div>
                  );
                  return null;
                })()
          )}
        </div>
      )}
    </>
  );
}

function MyClassesPage({ user, goTo }) {
  const [data, setData] = useState(null);
  const teacherId = user.ref_id;
  useEffect(() => { if (teacherId) api.teacherDashboard(teacherId).then(setData).catch(() => {}); }, [teacherId]);
  if (!data) return <div className="loading-page"><Spin /></div>;
  return (
    <>
      <PageHeader title="My Classes" subtitle="All classes and students assigned to you." />
      <div className="class-cards-grid-full">
        {data.myClasses.map(c => (
          <div className="class-card-full" key={c.id}>
            <div className="class-card-header">
              <div><h3>{c.name} â€“ Section {c.section}</h3><small>Grade {c.grade}</small></div>
              <span className="class-count"><UsersThree size={16}/> {c.student_count} students</span>
            </div>
            <div className="class-card-full-actions">
              <button onClick={() => goTo("attendance")}><ListChecks size={16}/>Take Attendance</button>
              <button onClick={() => goTo("diary")}><NotePencil size={16}/>Post Diary</button>
              <button onClick={() => goTo("quizzes")}><Question size={16}/>Create Quiz</button>
              <button onClick={() => goTo("assignments")}><Notebook size={16}/>Create Assignment</button>
            </div>
          </div>
        ))}
        {!data.myClasses.length && <EmptyState icon={Buildings} message="No classes assigned to you yet." />}
      </div>
    </>
  );
}

// ================================================================================
// SPLASH SCREEN
// ================================================================================
function SplashScreen() {
  return (
    <div className="splash-overlay">
      <div className="splash-card">
        <img src="/mascot_sticker.png" className="sticker-img sticker-splash" alt="EduSphere Mascot" />
        <div className="splash-name">Edu<span>Sphere</span></div>
        <div className="splash-tagline">School &amp; College Management System</div>
        <div className="splash-dots">
          <span /><span /><span />
        </div>
      </div>
    </div>
  );
}

// ================================================================================
// PUBLIC PORTAL
// ================================================================================
function PublicPortal({ onOpenLogin, onOpenAdmission }) {
  return (
    <div className="pub-root">

      <header className="pub-header">
        <div className="pub-brand" onClick={onOpenLogin}>
          <span className="pub-brand-icon"><BookOpen size={22} weight="fill" /></span>
          <span className="pub-brand-name"><b>EduSphere</b><small>School &amp; College</small></span>
        </div>
        <nav className="pub-nav">
          <span onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</span>
          <span onClick={() => document.getElementById("pub-academics")?.scrollIntoView({ behavior: "smooth" })}>Academics</span>
          <span onClick={() => document.getElementById("pub-facilities")?.scrollIntoView({ behavior: "smooth" })}>Facilities</span>
          <span className="pub-nav-admission" onClick={onOpenAdmission}>Online Admission</span>
          <Btn onClick={onOpenLogin}><House size={16} weight="fill" /> Portal Login</Btn>
        </nav>
      </header>

      <section className="pub-hero">
        <img src="/rocket_sticker.png" className="sticker-img sticker-hero-badge" alt="Learning Rocket" />
        <div className="pub-hero-content">
          <span className="pub-hero-eyebrow"><Star size={12} weight="fill" /> ESTABLISHED 2012 &middot; ISLAMABAD / SIALKOT CAMPUS</span>
          <h1>Excellence in Education,<br /><span className="accent">Character &amp; Innovation</span></h1>
          <p>Empowering the next generation with modern academics, comprehensive digital portals, science labs, and state-of-the-art co-curricular activities across Pakistan.</p>
          <div className="pub-hero-cta">
            <button className="primary-button" onClick={onOpenAdmission}><UserPlus size={19} weight="bold" /> Apply for Admission 2026-27</button>
            <button className="secondary-button" onClick={onOpenLogin}><House size={19} weight="bold" /> Student / Staff Portal Login</button>
          </div>
          <div className="pub-hero-stats">
            <div className="pub-hero-stat"><strong>3,200+</strong><span>Enrolled Students</span></div>
            <div className="pub-hero-stat"><strong>120+</strong><span>Qualified Teachers</span></div>
            <div className="pub-hero-stat"><strong>95%</strong><span>Board Pass Rate</span></div>
            <div className="pub-hero-stat"><strong>12</strong><span>Years of Excellence</span></div>
          </div>
        </div>
      </section>

      <section className="pub-section" style={{ paddingTop: 40, paddingBottom: 24 }}>
        <div className="pub-stats-row">
          <div className="pub-stat-card tone-blue"><strong>3,200+</strong><span>Total Students</span></div>
          <div className="pub-stat-card tone-purple"><strong>120+</strong><span>Teaching Staff</span></div>
          <div className="pub-stat-card tone-green"><strong>95%</strong><span>Annual Pass Rate</span></div>
          <div className="pub-stat-card tone-orange"><strong>12 Yrs</strong><span>Established Excellence</span></div>
        </div>
      </section>

      <section className="pub-section pub-section-alt" id="pub-academics">
        <div className="pub-section-title">
          <span className="pub-pill">ACADEMICS</span>
          <h2>Our Academic Programs</h2>
          <p>Structured curriculum conforming to FBISE &amp; Punjab Board Standards.</p>
        </div>
        <div className="pub-grid-3">
          <div className="pub-card">
            <div className="pub-card-icon"><BookOpen size={26} /></div>
            <h3>Junior School (Grades 1-5)</h3>
            <p>Activity-based conceptual learning, English fluency, Mathematics foundations, and Islamic studies in a nurturing environment.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><Buildings size={26} /></div>
            <h3>Middle School (Grades 6-8)</h3>
            <p>Comprehensive Science, Computer Studies, Urdu &amp; English languages, and advanced analytical skill development.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><GraduationCap size={26} /></div>
            <h3>Secondary &amp; HSSC (9-12)</h3>
            <p>Pre-Medical, Pre-Engineering, Computer Science, and Humanities with expert board exam preparation and top results.</p>
          </div>
        </div>
      </section>

      <section className="pub-section" id="pub-facilities">
        <div className="pub-section-title">
          <span className="pub-pill">FACILITIES</span>
          <h2>State-of-the-Art Facilities</h2>
          <p>Everything your child needs for academic excellence, physical development, and a safe campus experience.</p>
        </div>
        <div className="pub-grid-3">
          <div className="pub-card">
            <div className="pub-card-icon"><Book size={26} /></div>
            <h3>Digital Library</h3>
            <p>Over 5,000 reference books, journals, e-books, and quiet research study bays with high-speed internet.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><Globe size={26} /></div>
            <h3>Modern Computer Labs</h3>
            <p>Latest hardware, broadband connectivity, and certified IT instructors delivering Microsoft &amp; programming courses.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><Bus size={26} /></div>
            <h3>Air-Conditioned Fleet</h3>
            <p>GPS-monitored campus transport covering all major urban routes with dedicated female attendants on every bus.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><ShieldCheck size={26} /></div>
            <h3>Safe &amp; Secure Campus</h3>
            <p>24/7 CCTV surveillance, biometric access control, guarded entry points, and dedicated female security personnel.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><ChartBar size={26} /></div>
            <h3>Smart Classrooms</h3>
            <p>Digital projectors, interactive whiteboards, and a modern LMS-integrated teaching environment in every class.</p>
          </div>
          <div className="pub-card">
            <div className="pub-card-icon"><Star size={26} /></div>
            <h3>Sports &amp; Co-Curricular</h3>
            <p>Cricket, basketball, athletics, science olympiad, debate competitions, and annual sports gala for all students.</p>
          </div>
        </div>
      </section>

      <div className="pub-cta-banner">
        <h2>Ready to Join EduSphere?</h2>
        <p>Applications for the 2026-27 academic session are now open. Secure your child's future today.</p>
        <button className="primary-button" onClick={onOpenAdmission}><UserPlus size={20} weight="bold" /> Apply for Online Admission</button>
      </div>

      <footer className="pub-footer">
        <div className="pub-footer-brand">
          <span style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#4f6ef7,#8b5cf6)', display: 'grid', placeItems: 'center', color: 'white', flexShrink: 0 }}>
            <BookOpen size={18} weight="fill" />
          </span>
          <b>EduSphere</b>
        </div>
        <div className="pub-footer-links">
          <span onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</span>
          <span onClick={() => document.getElementById("pub-academics")?.scrollIntoView({ behavior: "smooth" })}>Academics</span>
          <span onClick={onOpenAdmission}>Admissions</span>
          <span onClick={onOpenLogin}>Staff Login</span>
        </div>
        <span>© 2026 EduSphere School &amp; College. All rights reserved.</span>
      </footer>
    </div>
  );
}
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PARENT DASHBOARD & MULTI-CHILD SWITCHER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function ParentDashboard({ user, goTo }) {
  const [children, setChildren] = useState([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const parentId = user.ref_id || 1;

  useEffect(() => {
    api.getParentChildren(parentId)
      .then(res => { setChildren(res); setLoading(false); })
      .catch(() => setLoading(false));
  }, [parentId]);

  if (loading) return <div className="loading-page"><Spin /><p>Loading parent portalâ€¦</p></div>;
  if (!children.length) return (
    <div className="empty-state">
      <UsersThree size={48} />
      <p>No children are linked to your parent account.<br />Please contact school administration to link your student record.</p>
    </div>
  );

  const activeChild = children[selectedIdx] || children[0];

  return (
    <>
      <div className="dashboard-heading">
        <div>
          <span className="breadcrumb">Parent Portal</span>
          <h1>Assalam-o-Alaikum, {user.name.split(" ")[0]}! ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦</h1>
          <p>Monitor your child's academic progress, attendance, and fees in real time.</p>
        </div>
        {children.length > 1 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", padding: "6px 14px", borderRadius: 10, border: "1px solid #d9e3ef" }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>Selected Child:</span>
            <select value={selectedIdx} onChange={e => setSelectedIdx(Number(e.target.value))} style={{ border: 0, fontWeight: 800, fontSize: 14, color: "#1e3a5f" }}>
              {children.map((c, i) => <option value={i} key={c.id}>{c.name} ({c.class_name} {c.section})</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="stats-grid compact">
        <StatCard label="Student Name" value={activeChild.name} note={`Roll No: ${activeChild.roll_no || "â€”"}`} icon={Student} tone="blue" />
        <StatCard label="Class / Section" value={`${activeChild.class_name} ${activeChild.section}`} note="Academic Session 2026â€“27" icon={Buildings} tone="purple" />
        <StatCard label="Attendance" value={`${activeChild.total_days > 0 ? Math.round((activeChild.present_days / activeChild.total_days)*100) : 100}%`} note={`${activeChild.present_days || 0} of ${activeChild.total_days || 0} days present`} icon={ListChecks} tone="teal" />
        <StatCard label="Pending Dues" value={fmtPKR(activeChild.pending_fees || 0)} note="Fee challan position" icon={Receipt} tone="orange" />
      </div>

      <div className="dashboard-panels">
        <Panel title="ðŸ“š Class Diary & Homework" subtitle={`Recent notes for ${activeChild.name}`} className="attendance-panel">
          <button className="primary-button" onClick={() => goTo("diary")} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
            <NotePencil size={18} /> Open Daily Class Diary
          </button>
        </Panel>
        <Panel title="ðŸŽ“ Exam Results" subtitle="Report Card summary" className="fee-panel">
          <button className="secondary-button" onClick={() => goTo("my-results")} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
            <GraduationCap size={18} /> View Student Report Card
          </button>
        </Panel>
        <Panel title="ðŸ’µ Fee Challan Position" subtitle="Pay or upload payment proof" className="grade-panel">
          <button className="primary-button" onClick={() => goTo("fees")} style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
            <Receipt size={18} /> Pay / Upload Fee Proof
          </button>
        </Panel>
      </div>
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ADMISSIONS DESK
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function AdmissionsPage({ showToast }) {
  const [apps, setApps] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const load = () => {
    setLoading(true);
    Promise.all([api.getAdmissions(), api.getClasses()])
      .then(([res, cls]) => { setApps(res); setClasses(cls); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const visible = filter === "All" ? apps : apps.filter(a => a.status === filter);

  return (
    <>
      <PageHeader title="Online Admissions Desk" subtitle="Review incoming student applications & 1-click enroll." action={() => { setModal("new"); setForm({ gender: "Male", applied_class_id: classes[0]?.id || 1 }); }} actionLabel="New Application" icon={UserPlus} />
      <div className="tabs">
        {["All", "Pending", "Approved", "Under Review", "Enrolled", "Rejected"].map(t => (
          <button key={t} className={filter === t ? "active" : ""} onClick={() => setFilter(t)}>{t}</button>
        ))}
      </div>

      {loading ? <Spin /> : (
        <DataTable
          columns={["App No", "Applicant Name", "Father Name", "Applied Class", "Gender", "Phone", "Date", "Status"]}
          rows={visible.map(a => [
            <b>{a.application_no}</b>,
            a.applicant_name,
            a.father_name,
            `${a.class_name || "Class 9"} ${a.section || "A"}`,
            a.gender,
            a.phone,
            a.applied_date,
            <Status>{a.status}</Status>
          ])}
          actions={i => {
            const item = visible[i];
            return (
              <div className="row-actions">
                {item.status !== "Enrolled" && (
                  <Btn className="table-action green-btn" onClick={async () => {
                    const res = await api.convertAdmission(item.id);
                    showToast(`Enrolled! Student ID: ${res.student_id}, Roll: ${res.roll_no}, Fee Challan: ${res.challan_no}`);
                    load();
                  }}>Enroll & Issue Challan</Btn>
                )}
                {item.status === "Pending" && (
                  <Btn className="table-action" onClick={async () => {
                    await api.updateAdmissionStatus(item.id, "Approved");
                    showToast("Approved application");
                    load();
                  }}>Approve</Btn>
                )}
              </div>
            );
          }}
        />
      )}

      {modal === "new" && (
        <Modal title="Submit Online Admission Application" onClose={() => setModal(null)}>
          <form onSubmit={async e => {
            e.preventDefault();
            await api.submitAdmission(form);
            showToast("Admission application submitted successfully!");
            setModal(null);
            load();
          }} className="form-grid">
            <label>Applicant Full Name<input required onChange={e => setForm({ ...form, applicant_name: e.target.value })} /></label>
            <label>Father / Guardian Name<input required onChange={e => setForm({ ...form, father_name: e.target.value })} /></label>
            <label>Father CNIC<input placeholder="35202-1234567-1" onChange={e => setForm({ ...form, father_cnic: e.target.value })} /></label>
            <label>Contact Phone<input required placeholder="0300-1234567" onChange={e => setForm({ ...form, phone: e.target.value })} /></label>
            <label>Gender<select onChange={e => setForm({ ...form, gender: e.target.value })}><option>Male</option><option>Female</option></select></label>
            <label>Applying for Class<select onChange={e => setForm({ ...form, applied_class_id: Number(e.target.value) })}>
              {classes.map(c => <option value={c.id} key={c.id}>{c.name} {c.section}</option>)}
            </select></label>
            <label className="span-2">Address<textarea onChange={e => setForm({ ...form, address: e.target.value })} /></label>
            <footer className="modal-actions span-2">
              <Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit">Submit Application</Btn>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// LIBRARY MANAGEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function LibraryPage({ user, showToast }) {
  const [books, setBooks] = useState([]);
  const [issues, setIssues] = useState([]);
  const [tab, setTab] = useState("books");
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({});

  const isStaff = user.role !== "Student";

  const load = () => {
    setLoading(true);
    Promise.all([api.getBooks(), api.getBookIssues()])
      .then(([b, i]) => { setBooks(b); setIssues(i); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHeader title="Library Catalog & Issue Desk" subtitle="Catalogue, book lending, and overdue fine management." action={isStaff ? () => { setModal("addBook"); setForm({}); } : undefined} actionLabel="Add Book" icon={Plus} />
      <div className="tabs">
        <button className={tab === "books" ? "active" : ""} onClick={() => setTab("books")}>Book Catalogue ({books.length})</button>
        <button className={tab === "issues" ? "active" : ""} onClick={() => setTab("issues")}>Issued Books ({issues.length})</button>
      </div>

      {loading ? <Spin /> : tab === "books" ? (
        <DataTable
          columns={["ISBN", "Title", "Author", "Category", "Shelf", "Available / Total", "Price (PKR)"]}
          rows={books.map(b => [
            b.isbn || "â€”",
            <b>{b.title}</b>,
            b.author,
            b.category,
            b.shelf_location || "Main Shelf",
            <Status>{`${b.available_qty} / ${b.quantity}`}</Status>,
            fmtPKR(b.price)
          ])}
          actions={isStaff ? i => (
            <Btn className="table-action" onClick={() => { setModal("issue"); setForm({ book_id: books[i].id }); }}>Issue Book</Btn>
          ) : undefined}
        />
      ) : (
        <DataTable
          columns={["Book Title", "Borrower", "Issue Date", "Due Date", "Status"]}
          rows={issues.map(s => [
            <b>{s.book_title}</b>,
            s.student_name || s.teacher_name || "User",
            s.issue_date,
            s.due_date,
            <Status>{s.status}</Status>
          ])}
          actions={isStaff ? i => (
            issues[i].status === "Issued" && (
              <Btn className="table-action green-btn" onClick={async () => {
                await api.returnBook(issues[i].id);
                showToast("Book returned!");
                load();
              }}>Mark Returned</Btn>
            )
          ) : undefined}
        />
      )}

      {modal === "addBook" && (
        <Modal title="Add Book to Catalogue" onClose={() => setModal(null)}>
          <form onSubmit={async e => {
            e.preventDefault();
            await api.addBook(form);
            showToast("Book added");
            setModal(null);
            load();
          }} className="form-grid">
            <label>Book Title<input required onChange={e => setForm({ ...form, title: e.target.value })} /></label>
            <label>Author<input required onChange={e => setForm({ ...form, author: e.target.value })} /></label>
            <label>ISBN<input onChange={e => setForm({ ...form, isbn: e.target.value })} /></label>
            <label>Category<select onChange={e => setForm({ ...form, category: e.target.value })}><option>General</option><option>Computer Science</option><option>Mathematics</option><option>Physics</option><option>Social Studies</option></select></label>
            <label>Quantity<input type="number" defaultValue={1} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} /></label>
            <label>Shelf Location<input placeholder="Shelf CS-01" onChange={e => setForm({ ...form, shelf_location: e.target.value })} /></label>
            <footer className="modal-actions span-2">
              <Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit">Add Book</Btn>
            </footer>
          </form>
        </Modal>
      )}

      {modal === "issue" && (
        <Modal title="Issue Book" onClose={() => setModal(null)}>
          <form onSubmit={async e => {
            e.preventDefault();
            await api.issueBook(form);
            showToast("Book issued successfully");
            setModal(null);
            load();
          }} className="form-grid">
            <label>Student ID<input type="number" placeholder="Enter Student Database ID" required onChange={e => setForm({ ...form, student_id: Number(e.target.value) })} /></label>
            <label>Due Period (Days)<input type="number" defaultValue={14} onChange={e => setForm({ ...form, due_days: Number(e.target.value) })} /></label>
            <footer className="modal-actions span-2">
              <Btn className="secondary-button" onClick={() => setModal(null)}>Cancel</Btn>
              <Btn type="submit">Confirm Issue</Btn>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TRANSPORT FLEET MANAGEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function TransportPage({ showToast }) {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTransportRoutes().then(res => { setRoutes(res); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="School Transport & Fleet" subtitle="Routes, vehicles, driver info, and student transport passes." />
      {loading ? <Spin /> : (
        <DataTable
          columns={["Route Name", "Vehicle No", "Driver", "Driver Phone", "Monthly Fare", "Capacity", "Assigned Students"]}
          rows={routes.map(r => [
            <b>{r.title}</b>,
            r.vehicle_no || "ICT-LES-9901",
            r.driver_name || "Tariq Mehmood",
            r.driver_phone || "0300-5551122",
            fmtPKR(r.monthly_fare),
            `${r.assigned_count || 1} / ${r.capacity || 35}`,
            <Status>Active Route</Status>
          ])}
        />
      )}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HR & PAYROLL MANAGEMENT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function HRPayrollPage({ showToast }) {
  const [payroll, setPayroll] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [tab, setTab] = useState("payroll");
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([api.getPayroll(), api.getLeaves()])
      .then(([p, l]) => { setPayroll(p); setLeaves(l); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHeader title="HR, Staff Leaves & Monthly Payroll" subtitle="Staff employment, salary calculation, leave approval workflow." />
      <div className="tabs">
        <button className={tab === "payroll" ? "active" : ""} onClick={() => setTab("payroll")}>Monthly Salary Payroll</button>
        <button className={tab === "leaves" ? "active" : ""} onClick={() => setTab("leaves")}>Staff Leave Requests ({leaves.length})</button>
      </div>

      {loading ? <Spin /> : tab === "payroll" ? (
        <DataTable
          columns={["Emp ID", "Staff Name", "Qualification", "Basic Salary", "House Rent (15%)", "Medical (5%)", "Net Payable", "Status"]}
          rows={payroll.map(p => [
            p.emp_id,
            <b>{p.name}</b>,
            p.qualification || "M.A.",
            fmtPKR(p.baseSalary),
            fmtPKR(p.houseRent),
            fmtPKR(p.medical),
            <b>{fmtPKR(p.grossSalary)}</b>,
            <Status>{p.status}</Status>
          ])}
          actions={i => (
            <Btn className="table-action" onClick={() => printPaySlip(payroll[i])}>Print Slip</Btn>
          )}
        />
      ) : (
        <DataTable
          columns={["Staff Name", "Leave Type", "Start Date", "End Date", "Reason", "Status"]}
          rows={leaves.map(l => [
            <b>{l.teacher_name || l.user_name || "Staff Member"}</b>,
            l.leave_type,
            l.start_date,
            l.end_date,
            l.reason,
            <Status>{l.status}</Status>
          ])}
          actions={i => (
            leaves[i].status === "Pending" && (
              <div className="row-actions">
                <Btn className="table-action green-btn" onClick={async () => {
                  await api.updateLeaveStatus(leaves[i].id, "Approved");
                  showToast("Leave approved");
                  load();
                }}>Approve</Btn>
              </div>
            )
          )}
        />
      )}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// INVENTORY & SCHOOL STORE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function InventoryPage({ showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});

  const load = () => {
    setLoading(true);
    api.getInventory().then(res => { setItems(res); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <PageHeader title="School Inventory & Assets" subtitle="Lab equipment, computers, furniture, stationery stock." action={() => setModal(true)} actionLabel="Add Inventory Item" icon={Plus} />
      {loading ? <Spin /> : (
        <DataTable
          columns={["Item Description", "Category", "Quantity", "Unit Cost", "Total Asset Value", "Location", "Supplier", "Status"]}
          rows={items.map(i => [
            <b>{i.item_name}</b>,
            i.category,
            i.quantity,
            fmtPKR(i.unit_price),
            <b>{fmtPKR(i.quantity * i.unit_price)}</b>,
            i.location || "Store",
            i.supplier || "Vendor",
            <Status>{i.status}</Status>
          ])}
        />
      )}

      {modal && (
        <Modal title="Add Inventory Item" onClose={() => setModal(false)}>
          <form onSubmit={async e => {
            e.preventDefault();
            await api.addInventoryItem(form);
            showToast("Inventory item added");
            setModal(false);
            load();
          }} className="form-grid">
            <label>Item Name<input required onChange={e => setForm({ ...form, item_name: e.target.value })} /></label>
            <label>Category<select onChange={e => setForm({ ...form, category: e.target.value })}><option>Stationery</option><option>Computer</option><option>Furniture</option><option>Lab Equipment</option></select></label>
            <label>Quantity<input type="number" defaultValue={1} onChange={e => setForm({ ...form, quantity: Number(e.target.value) })} /></label>
            <label>Unit Cost (PKR)<input type="number" defaultValue={100} onChange={e => setForm({ ...form, unit_price: Number(e.target.value) })} /></label>
            <label>Location<input placeholder="Computer Lab 1" onChange={e => setForm({ ...form, location: e.target.value })} /></label>
            <label>Supplier<input placeholder="Vendor Pak" onChange={e => setForm({ ...form, supplier: e.target.value })} /></label>
            <footer className="modal-actions span-2">
              <Btn className="secondary-button" onClick={() => setModal(false)}>Cancel</Btn>
              <Btn type="submit">Add Item</Btn>
            </footer>
          </form>
        </Modal>
      )}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DISCIPLINE & MERIT AWARDS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function DisciplinePage({ showToast }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDiscipline().then(res => { setRecords(res); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Discipline & Merit Awards Timeline" subtitle="Student conduct logging, merit certificates, and discipline records." />
      {loading ? <Spin /> : (
        <DataTable
          columns={["Student Name", "Class", "Category", "Incident / Award Title", "Description", "Date"]}
          rows={records.map(r => [
            <b>{r.student_name}</b>,
            `${r.class_name || "Class"} ${r.section || ""}`,
            <Status>{r.category}</Status>,
            <b>{r.title}</b>,
            r.description || "â€”",
            r.date
          ])}
        />
      )}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CERTIFICATES & STUDENT ID CARD GENERATOR
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function CertificatesPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [certType, setCertType] = useState("idcard");

  useEffect(() => {
    api.getStudents().then(res => {
      const list = res.students || res;
      setStudents(list);
      if (list.length) setSelectedStudentId(String(list[0].id));
    }).catch(() => {});
  }, []);

  const student = students.find(s => String(s.id) === String(selectedStudentId)) || students[0] || {};

  function printCertificate() {
    const win = window.open("", "_blank", "width=850,height=750");
    win.document.write(`<html><head><title>${certType.toUpperCase()} - ${student.name}</title><style>
      body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #fff; color: #0f172a; }
      .cert-border { border: 8px double #1e3a5f; padding: 40px; text-align: center; border-radius: 12px; }
      h1 { color: #1e3a5f; font-size: 28px; text-transform: uppercase; margin: 0; }
      h2 { color: #2176f3; font-size: 20px; margin: 10px 0 30px; text-transform: uppercase; letter-spacing: 2px; }
      p { font-size: 16px; line-height: 2; margin: 20px 0; color: #334155; }
      .sig-row { display: flex; justify-content: space-between; margin-top: 80px; padding: 0 40px; }
      .sig { border-top: 1px solid #64748b; width: 180px; text-align: center; font-size: 13px; color: #64748b; padding-top: 6px; }
    </style></head><body>
      <div class="cert-border">
        <div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:12px">
          ${PRINT_SCHOOL_LOGO}
          <h1 style="margin:0">EDUSPHERE SCHOOL & COLLEGE</h1>
        </div>
        <h2>${certType === "bonafide" ? "BONAFIDE CERTIFICATE" : certType === "character" ? "CHARACTER CERTIFICATE" : "SCHOOL LEAVING CERTIFICATE"}</h2>
        <p>This is to certify that <b>${student.name || "Student"}</b>, Son/Daughter of <b>${student.father_name || "Father"}</b>,<br/>
        Roll No. <b>${student.roll_no || "26-A-12"}</b>, is a bonafide student of this institution studying in <b>Class 9-A</b>.<br/>
        He/She bears a good moral character and has shown exemplary academic conduct.</p>
        <div class="sig-row">
          <div class="sig">Class Teacher</div>
          <div class="sig">Principal Signature</div>
        </div>
      </div>
    </body></html>`);
    win.document.close();
  }

  return (
    <>
      <PageHeader title="Certificates & Student ID Card Generator" subtitle="Instant printable Student ID Cards, Bonafide, Character, and Leaving Certificates." />
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24 }}>
        <Panel title="Certificate Controls">
          <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <label>Select Student
              <select value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)}>
                {students.map(s => <option value={s.id} key={s.id}>{s.name} ({s.roll_no || s.student_id})</option>)}
              </select>
            </label>
            <label>Document Type
              <select value={certType} onChange={e => setCertType(e.target.value)}>
                <option value="idcard">Student ID Card</option>
                <option value="bonafide">Bonafide Certificate</option>
                <option value="character">Character Certificate</option>
                <option value="leaving">School Leaving Certificate</option>
              </select>
            </label>
            <Btn onClick={printCertificate}><Printer size={18} /> Print Official Document</Btn>
          </div>
        </Panel>

        <Panel title="Live Preview">
          {certType === "idcard" ? (
            <div className="id-card-wrap">
              <div className="id-card-header">
                <b>EduSphere School & College</b>
                <small>Official Student Identity Card</small>
              </div>
              <div className="id-card-body">
                <div className="id-photo">{student.name ? student.name.split(" ").map(n=>n[0]).join("") : "STU"}</div>
                <div className="id-details">
                  <div>Name: <b>{student.name || "Areeba Hassan"}</b></div>
                  <div>ID No: <b>{student.student_id || "STU-2026-001"}</b></div>
                  <div>Roll: <b>{student.roll_no || "09-A-12"}</b></div>
                  <div>Father: <b>{student.father_name || "Hassan Raza"}</b></div>
                </div>
              </div>
              <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", textAlign: "center" }}>
                Valid Academic Year 2026â€“2027
              </div>
            </div>
          ) : (
            <div style={{ border: "4px double #1e3a5f", padding: 32, textAlign: "center", background: "#fff", borderRadius: 12 }}>
              <h2 style={{ color: "#1e3a5f", margin: 0 }}>EDUSPHERE SCHOOL & COLLEGE</h2>
              <h3 style={{ color: "#2176f3", marginTop: 8 }}>{certType.toUpperCase()} CERTIFICATE</h3>
              <p style={{ margin: "20px 0", lineHeight: 1.8, fontSize: 14 }}>
                This is to certify that <b>{student.name || "Student"}</b> is a bonafide student of Class 9-A.
              </p>
            </div>
          )}
        </Panel>
      </div>
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AUDIT LOGS PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAuditLogs().then(res => { setLogs(res); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader title="Security Audit Trail Logs" subtitle="Tracking critical system actions, password resets, marks edits, and fee updates." />
      {loading ? <Spin /> : (
        <DataTable
          columns={["Timestamp", "User", "Action", "Details"]}
          rows={logs.map(l => [
            l.timestamp,
            <b>{l.username}</b>,
            <Status>{l.action}</Status>,
            l.details || "â€”"
          ])}
        />
      )}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EVENTS CALENDAR PAGE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function EventsPage({ user, showToast }) {
  const [filter, setFilter] = useState("all");
  const [eventsList, setEventsList] = useState([
    { id: 1, title: "Mid-Term Examinations 2026", date: "2026-10-10", type: "Academic", location: "Main Examination Halls", desc: "Comprehensive mid-term evaluations for Grades 1 through 10 & College sections." },
    { id: 2, title: "Annual Sports Gala & Track Meets", date: "2026-10-25", type: "Sports", location: "School Sports Complex", desc: "Inter-house cricket, football, sprint races, and trophy presentation." },
    { id: 3, title: "Iqbal Day Special Assembly & Declamation", date: "2026-11-09", type: "Holiday/Cultural", location: "Auditorium", desc: "Urdu declamation competition and tribute presentations." },
    { id: 4, title: "Parent-Teacher Meeting (PTM - Q1 Results)", date: "2026-11-20", type: "Meeting", location: "Classrooms & Main Hall", desc: "Discussion of student academic progress, attendance records, and fee status." },
    { id: 5, title: "Science & AI Innovation Fair 2026", date: "2026-12-05", type: "Academic", location: "Science Labs", desc: "Student project displays featuring robotics, environmental science, and software demos." }
  ]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: "", date: "", type: "Academic", location: "", desc: "" });

  const filtered = eventsList.filter(e => filter === "all" || e.type.toLowerCase().includes(filter.toLowerCase()));

  function handleAddEvent(e) {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) return;
    const item = { ...newEvent, id: Date.now() };
    setEventsList([item, ...eventsList]);
    setShowAddModal(false);
    setNewEvent({ title: "", date: "", type: "Academic", location: "", desc: "" });
    if (showToast) showToast("Event scheduled successfully!");
  }

  return (
    <>
      <PageHeader
        title="Events & Academic Calendar"
        subtitle="Schedule and track school holidays, exams, sports galas, and parent meetings."
        actionLabel={user?.role === "Principal" || user?.role === "Admin" ? "+ Schedule Event" : undefined}
        onAction={user?.role === "Principal" || user?.role === "Admin" ? () => setShowAddModal(true) : undefined}
      />

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        {["all", "Academic", "Sports", "Holiday", "Meeting"].map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`btn ${filter === cat ? "btn-primary" : "btn-secondary"}`}
            style={{ textTransform: "capitalize", padding: "6px 14px", fontSize: 13 }}
          >
            {cat === "all" ? "All Events" : cat}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
        {filtered.map(ev => (
          <div key={ev.id} className="card" style={{ padding: 18, borderLeft: "4px solid #2563eb", display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <span className="badge badge-info" style={{ fontSize: 11 }}>{ev.type}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>ðŸ“… {ev.date}</span>
            </div>
            <h4 style={{ margin: 0, fontSize: 16, color: "#0f172a" }}>{ev.title}</h4>
            <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{ev.desc}</p>
            <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>ðŸ“ {ev.location}</div>
          </div>
        ))}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <h3 style={{ marginTop: 0 }}>Schedule New Event</h3>
            <form onSubmit={handleAddEvent} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Event Title
                <input type="text" required value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} className="input-field" style={{ width: "100%", marginTop: 4 }} placeholder="e.g. Annual Prize Distribution" />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>
                  Date
                  <input type="date" required value={newEvent.date} onChange={e => setNewEvent({ ...newEvent, date: e.target.value })} className="input-field" style={{ width: "100%", marginTop: 4 }} />
                </label>
                <label style={{ fontSize: 13, fontWeight: 600 }}>
                  Event Type
                  <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value })} className="input-field" style={{ width: "100%", marginTop: 4 }}>
                    <option value="Academic">Academic</option>
                    <option value="Sports">Sports</option>
                    <option value="Holiday/Cultural">Holiday/Cultural</option>
                    <option value="Meeting">Meeting</option>
                  </select>
                </label>
              </div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Location / Venue
                <input type="text" value={newEvent.location} onChange={e => setNewEvent({ ...newEvent, location: e.target.value })} className="input-field" style={{ width: "100%", marginTop: 4 }} placeholder="e.g. Main Auditorium" />
              </label>
              <label style={{ fontSize: 13, fontWeight: 600 }}>
                Description
                <textarea rows={3} value={newEvent.desc} onChange={e => setNewEvent({ ...newEvent, desc: e.target.value })} className="input-field" style={{ width: "100%", marginTop: 4 }} placeholder="Brief details about the event..." />
              </label>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Add Event</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AI ASSISTANT DRAWER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function AiAssistantDrawer({ isOpen, onClose }) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Assalam-o-Alaikum! I am EduSphere AI Assistant. Ask me about school fee recovery, student attendance stats, or generate MCQ quiz questions for your class!" }
  ]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  async function handleSend(e) {
    e.preventDefault();
    if (!prompt.trim()) return;
    const userText = prompt;
    setMessages(prev => [...prev, { sender: "user", text: userText }]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await api.askAiAssistant({ prompt: userText, mode: "qa" });
      setMessages(prev => [...prev, { sender: "bot", text: res.reply }]);
    } catch {
      setMessages(prev => [...prev, { sender: "bot", text: "Unable to process AI request. Please check database connectivity." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-drawer">
      <div className="ai-drawer-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/ai_sticker.png" style={{ width: 38, height: 38, objectFit: "contain" }} alt="AI Assistant" />
          <div>
            <h3>EduSphere AI Assistant</h3>
            <small style={{ color: "#93c5fd" }}>Powered by Smart School Analytics</small>
          </div>
        </div>
        <IconBtn label="Close AI Assistant" onClick={onClose}><X size={20} /></IconBtn>
      </div>
      <div className="ai-drawer-body">
        {messages.map((m, i) => (
          <div key={i} className={`ai-msg ${m.sender === "user" ? "ai-msg-user" : "ai-msg-bot"}`}>
            {m.text}
          </div>
        ))}
        {loading && <div className="ai-msg ai-msg-bot"><Spin /> Analyzing school recordsâ€¦</div>}
      </div>
      <form onSubmit={handleSend} className="ai-drawer-footer">
        <input
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ask AI: e.g. 'Fee recovery summary'..."
          style={{ flex: 1, height: 42, padding: "0 12px", borderRadius: 8, border: "1px solid #cbd5e1" }}
        />
      </form>
    </div>
  );
}

function SettingsPage({ showToast }) {
  const [settings, setSettings] = useState({});
  const [users, setUsers] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({});
  useEffect(() => { Promise.all([api.getSettings(), api.getUsers()]).then(([s, u]) => { setSettings(s); setUsers(u); }); }, []);
  const S = key => e => setSettings({ ...settings, [key]: e.target.value });
  const F = v => e => setForm({ ...form, [v]: e.target.value });
  return (
    <>
      <PageHeader title="Settings & Admin" />
      <div className="settings-grid">
        <Panel title="School Information" subtitle="Displayed on challans and reports.">
          <form onSubmit={async e => { e.preventDefault(); await api.saveSettings(settings); showToast("Settings saved"); }} className="form-grid">
            <label>School Name<input value={settings.school_name||""} onChange={S("school_name")} /></label>
            <label>Phone<input value={settings.phone||""} onChange={S("phone")} /></label>
            <label>Email<input type="email" value={settings.email||""} onChange={S("email")} /></label>
            <label>School Code<input value={settings.school_code||""} onChange={S("school_code")} /></label>
            <label className="span-2">Address<textarea value={settings.address||""} onChange={S("address")} /></label>
            <div className="span-2 form-section-label">Bank Account for Challans</div>
            <label>Bank Name<input value={settings.bank_name||""} onChange={S("bank_name")} /></label>
            <label>Account Title<input value={settings.account_title||""} onChange={S("account_title")} /></label>
            <label>Account Number<input value={settings.account_number||""} onChange={S("account_number")} /></label>
            <label>IBAN<input value={settings.iban||""} onChange={S("iban")} /></label>
            <label>Branch<input value={settings.branch||""} onChange={S("branch")} /></label>
            <footer className="span-2"><Btn type="submit">Save Settings</Btn></footer>
          </form>
        </Panel>
        <Panel title="User Accounts" action={<Btn className="secondary-button" onClick={() => { setModal(true); setForm({ role: "Teacher" }); }}><Plus size={14}/>Add User</Btn>}>
          <div className="users-list">{users.map(u => <div className="user-account" key={u.id}><Avatar name={u.name}/><span><b>{u.name}</b><small>{u.role} Â· {u.username}</small></span><IconBtn label="Delete" danger onClick={async () => { await api.deleteUser(u.id); api.getUsers().then(setUsers); showToast("Removed"); }}><Trash size={15}/></IconBtn></div>)}</div>
        </Panel>
      </div>
      {modal && <Modal title="Add User" onClose={() => setModal(false)}>
        <form onSubmit={async e => { e.preventDefault(); await api.addUser(form); showToast("User added"); setModal(false); api.getUsers().then(setUsers); }} className="form-grid">
          <label>Full Name<input required onChange={F("name")} /></label>
          <label>Username<input required onChange={F("username")} /></label>
          <label>Password<input type="password" required onChange={F("password")} /></label>
          <label>Role<select onChange={F("role")} defaultValue="Teacher"><option>Principal</option><option>Teacher</option><option>Student</option></select></label>
          <footer className="modal-actions span-2"><Btn className="secondary-button" onClick={() => setModal(false)}>Cancel</Btn><Btn type="submit">Create</Btn></footer>
        </form>
      </Modal>}
    </>
  );
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// APP SHELL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
export function App() {
  // Read user from JWT-backed localStorage on first render
  const [user, setUser] = useState(() => auth.getUser());
  const [viewMode, setViewMode] = useState("portal"); // "portal" | "login"
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [notifCount, setNotifCount] = useState(0);
  const [search, setSearch] = useState("");
  const [showPassModal, setShowPassModal] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  // Splash screen â€” shows for 2.5 s on first load
  const [showSplash, setShowSplash] = useState(true);
  useEffect(() => { const t = setTimeout(() => setShowSplash(false), 2800); return () => clearTimeout(t); }, []);

  // Load real notification count from API
  useEffect(() => {
    if (!user) return;
    api.getNotifications().then(n => setNotifCount(n.total)).catch(() => {});
    const interval = setInterval(() => {
      api.getNotifications().then(n => setNotifCount(n.total)).catch(() => {});
    }, 60000);
    return () => clearInterval(interval);
  }, [user]);

  function handleLogin(u) {
    // Token + user already saved by api.login() which calls auth.setSession()
    setUser(u);
    setPage("dashboard");
    if (u.must_change_password) setShowPassModal(true);
  }
  function handleLogout() {
    auth.clearSession(); // removes JWT token and user from localStorage
    setUser(null);
    setViewMode("portal");
  }

  const showToast = useCallback((msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast({ msg: "", type: "success" }), 3500); }, []);
  const goTo = useCallback((id) => { setPage(id); setSidebarOpen(false); setSearch(""); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);

  if (!user) {
    if (viewMode === "portal") {
      return (
        <>
          <PublicPortal onOpenLogin={() => setViewMode("login")} onOpenAdmission={() => setShowAdmissionModal(true)} />
          {showAdmissionModal && (
            <Modal title="Online Admission Application" onClose={() => setShowAdmissionModal(false)}>
              <form onSubmit={async e => {
                e.preventDefault();
                const form = {
                  applicant_name: e.target.applicant_name.value,
                  father_name: e.target.father_name.value,
                  phone: e.target.phone.value,
                  gender: e.target.gender.value,
                  applied_class_id: Number(e.target.applied_class_id.value)
                };
                const res = await api.submitAdmission(form);
                showToast(`Application ${res.application_no} submitted successfully!`);
                setShowAdmissionModal(false);
              }} className="form-grid">
                <label>Applicant Full Name<input name="applicant_name" required /></label>
                <label>Father / Guardian Name<input name="father_name" required /></label>
                <label>Contact Phone<input name="phone" required placeholder="0300-1234567" /></label>
                <label>Gender<select name="gender"><option>Male</option><option>Female</option></select></label>
                <label>Applying for Class<select name="applied_class_id"><option value={1}>Class 7</option><option value={3}>Class 8</option><option value={4}>Class 9</option><option value={5}>Class 10</option><option value={6}>Class 11</option></select></label>
                <footer className="modal-actions span-2">
                  <Btn className="secondary-button" onClick={() => setShowAdmissionModal(false)}>Cancel</Btn>
                  <Btn type="submit">Submit Application</Btn>
                </footer>
              </form>
            </Modal>
          )}
        </>
      );
    }
    return <LoginScreen onLogin={handleLogin} />;
  }

  const role = user.role;

  // â”€â”€â”€ Page routing per role â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const pageContent = (() => {
    // Dashboard (role-specific)
    if (page === "dashboard") {
      if (role === "Parent") return <ParentDashboard user={user} goTo={goTo} />;
      if (role === "Teacher") return <TeacherDashboard user={user} goTo={goTo} />;
      if (role === "Student") return <StudentDashboard user={user} goTo={goTo} />;
      return <PrincipalDashboard user={user} goTo={goTo} />;
    }
    // Operational Modules
    if (page === "admissions")   return <AdmissionsPage showToast={showToast} />;
    if (page === "library")      return <LibraryPage user={user} showToast={showToast} />;
    if (page === "transport")    return <TransportPage showToast={showToast} />;
    if (page === "hr-payroll")   return <HRPayrollPage showToast={showToast} />;
    if (page === "inventory")    return <InventoryPage showToast={showToast} />;
    if (page === "discipline")   return <DisciplinePage showToast={showToast} />;
    if (page === "certificates") return <CertificatesPage />;
    if (page === "audit-logs")   return <AuditLogsPage />;
    if (page === "events")       return <EventsPage user={user} showToast={showToast} />;

    // Existing academic modules
    if (page === "diary") return <DiaryPage user={user} showToast={showToast} />;
    if (page === "quizzes") {
      if (role === "Student") return <StudentQuizPage user={user} showToast={showToast} />;
      return <TeacherQuizPage user={user} showToast={showToast} />;
    }
    if (page === "assignments") {
      if (role === "Student") return <StudentAssignmentsPage user={user} showToast={showToast} />;
      return <TeacherAssignmentsPage user={user} showToast={showToast} />;
    }
    if (page === "my-results")   return <MyResultsPage user={user} />;
    if (page === "my-attendance") return <MyAttendancePage user={user} />;
    if (page === "my-classes") return <MyClassesPage user={user} goTo={goTo} />;
    if (page === "academics")     return <AcademicsPage showToast={showToast} />;
    if (page === "classes")       return <ClassesPage showToast={showToast} />;
    if (page === "teachers")      return <TeachersPage showToast={showToast} />;
    if (page === "students")      return <StudentsPage showToast={showToast} />;
    if (page === "attendance")    return <AttendancePage showToast={showToast} />;
    if (page === "exams")         return <ExamsPage showToast={showToast} />;
    if (page === "fees")          return <FeesPage user={user} showToast={showToast} />;
    if (page === "financials")    return <FinancialsPage showToast={showToast} />;
    if (page === "timetable")     return <TimetablePage showToast={showToast} />;
    if (page === "materials")     return <MaterialsPage user={user} showToast={showToast} />;
    if (page === "announcements") return <AnnouncementsPage user={user} showToast={showToast} />;
    if (page === "reports")       return <ReportsPage showToast={showToast} />;
    if (page === "settings")      return <SettingsPage showToast={showToast} />;
    return <PrincipalDashboard user={user} goTo={goTo} />;
  })();

  const navItems = (() => {
    switch (role) {
      case "Teacher": return TEACHER_NAV;
      case "Student": return STUDENT_NAV;
      case "Parent": return PARENT_NAV;
      case "Accountant": return ACCOUNTANT_NAV;
      case "Librarian": return LIBRARIAN_NAV;
      case "Receptionist": return RECEPTIONIST_NAV;
      case "HR Manager": return HRMANAGER_NAV;
      case "Transport Manager": return TRANSPORT_NAV;
      default: return ADMIN_NAV;
    }
  })();

  const roleBadge = {
    "Super Admin": "âš¡ Super Admin",
    "School Admin": "ðŸ« School Admin",
    Principal: "ðŸ« Principal",
    "Vice Principal": "ðŸ› Vice Principal",
    Teacher: "ðŸ‘©â€ðŸ« Teacher",
    Student: "ðŸŽ“ Student",
    Parent: "ðŸ‘¨â€ðŸ‘©â€ðŸ‘§â€ðŸ‘¦ Parent",
    Accountant: "ðŸ’µ Accountant",
    Librarian: "ðŸ“š Librarian",
    Receptionist: "ðŸ“ž Receptionist",
    "HR Manager": "ðŸ‘¥ HR Manager",
    "Transport Manager": "ðŸšŒ Transport"
  }[role] || `ðŸ‘¤ ${role}`;

  const showSettings = ["Super Admin", "School Admin", "Principal"].includes(role);

  return (
    <div className="app-shell">
      {showSplash && <SplashScreen />}
      {sidebarOpen && <button className="mobile-overlay" aria-label="Close" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <button className="brand" onClick={() => goTo("dashboard")}>
          <span className="brand-mark"><BookOpen size={28} weight="fill" /></span>
          <span><b>EduSphere</b><small>School System</small></span>
        </button>
        <div className="role-pill">{roleBadge}</div>
        <span className="nav-caption">Menu</span>
        <nav>{navItems.map(({ id, label, icon: Icon }) => (
          <button key={id} className={page === id ? "active" : ""} onClick={() => goTo(id)}>
            <Icon size={19} weight={page === id ? "fill" : "regular"} /><span>{label}</span>
          </button>
        ))}</nav>
        <span className="nav-caption admin-caption">System</span>
        <nav>
          {showSettings && <button className={page === "settings" ? "active" : ""} onClick={() => goTo("settings")}><Gear size={19} weight={page === "settings" ? "fill" : "regular"} /><span>Settings</span></button>}
          <button onClick={handleLogout}><X size={19} /><span>Sign Out</span></button>
        </nav>
        <div className="sidebar-user"><Avatar name={user.name} /><span><b>{user.name}</b><small>{user.role}</small></span></div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <IconBtn className="menu-button" label="Menu" onClick={() => setSidebarOpen(true)}><SidebarSimple size={22} /></IconBtn>
          <label className="search-box">
            <MagnifyingGlass size={18} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && search.trim()) {
                  if (role === "Student" || role === "Parent") goTo("diary");
                  else goTo("students");
                }
              }}
              placeholder={`Search ${role === "Student" ? "diary, quizzes, results" : "students, staff, records"}â€¦ (Enter)`}
            />
            {search && <button style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#9aafc7" }} onClick={() => setSearch("")}>Ã—</button>}
          </label>
          <div className="topbar-actions">
            <IconBtn label={`${notifCount} pending notifications`} onClick={() => goTo("dashboard")}>
              {notifCount > 0 && <span className="notification-dot">{notifCount}</span>}<Bell size={20} />
            </IconBtn>
            <div className="topbar-user">
              <Avatar name={user.name} />
              <span><b>{user.name}</b><small>{user.role}</small></span>
            </div>
          </div>
        </header>
        <main className="main-content">{pageContent}</main>
      </div>

      {/* Floating AI Assistant Trigger */}
      <button className="ai-trigger-btn" onClick={() => setAiOpen(true)}>
        <Sparkle size={20} weight="fill" /> Ask AI Assistant
      </button>

      {/* AI Assistant Drawer */}
      <AiAssistantDrawer isOpen={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Change Temporary Password Modal */}
      {showPassModal && (
        <Modal title="First-Login Password Update" onClose={() => setShowPassModal(false)}>
          <form onSubmit={async e => {
            e.preventDefault();
            const old_password = e.target.old_password.value;
            const new_password = e.target.new_password.value;
            try {
              await api.changePassword({ username: user.username, old_password, new_password });
              showToast("Password updated successfully!");
              setShowPassModal(false);
            } catch (ex) {
              showToast(ex.message || "Failed to update password", "error");
            }
          }} className="form-grid">
            <p className="span-2" style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>
              <b>Security Requirement:</b> You logged in with a temporary password. Please set a new password to secure your account.
            </p>
            <label>Current Password<input type="password" name="old_password" required /></label>
            <label>New Password<input type="password" name="new_password" required minLength={6} /></label>
            <footer className="modal-actions span-2">
              <Btn type="submit">Update Password</Btn>
            </footer>
          </form>
        </Modal>
      )}

      {toast.msg && <div className={`toast ${toast.type === "error" ? "toast-error" : ""}`}>
        {toast.type === "error" ? <XCircle size={20} weight="fill" /> : <CheckCircle size={20} weight="fill" />}
        {toast.msg}
      </div>}
    </div>
  );
}

