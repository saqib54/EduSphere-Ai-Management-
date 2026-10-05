import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";
config({ path: ".env.development" });

import { authenticate } from "./middleware/authenticate.js";
import { apiLimiter } from "./middleware/rateLimiter.js";

import authRouter        from "./routes/auth.js";
import academicsRouter   from "./routes/academics.js";
import classesRouter     from "./routes/classes.js";
import teachersRouter    from "./routes/teachers.js";
import studentsRouter    from "./routes/students.js";
import attendanceRouter  from "./routes/attendance.js";
import assignmentsRouter from "./routes/assignments.js";
import examsRouter       from "./routes/exams.js";
import feesRouter        from "./routes/fees.js";
import financialsRouter  from "./routes/financials.js";
import timetableRouter   from "./routes/timetable.js";
import materialsRouter   from "./routes/materials.js";
import reportsRouter     from "./routes/reports.js";
import announcementsRouter from "./routes/announcements.js";
import settingsRouter    from "./routes/settings.js";
import diaryRouter       from "./routes/diary.js";
import quizzesRouter     from "./routes/quizzes.js";
import operationsRouter  from "./routes/operations.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:5173";

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

// ── CORS — restrict to the Vite dev server ────────────────────────────────────
app.use(cors({
  origin: [CLIENT_ORIGIN, "http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:4173"],
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ── Serve uploaded files ──────────────────────────────────────────────────────
app.use("/uploads", express.static(join(__dirname, "uploads")));

// ── Health check (public) ─────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ── Auth routes (public — login only) ────────────────────────────────────────
app.use("/api/auth", authRouter);

// ── All other API routes require a valid JWT ──────────────────────────────────
app.use("/api", authenticate, apiLimiter);

app.use("/api/academics",     academicsRouter);
app.use("/api/classes",       classesRouter);
app.use("/api/teachers",      teachersRouter);
app.use("/api/students",      studentsRouter);
app.use("/api/attendance",    attendanceRouter);
app.use("/api/assignments",   assignmentsRouter);
app.use("/api/exams",         examsRouter);
app.use("/api/fees",          feesRouter);
app.use("/api/financials",    financialsRouter);
app.use("/api/timetable",     timetableRouter);
app.use("/api/materials",     materialsRouter);
app.use("/api/reports",       reportsRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/settings",      settingsRouter);
app.use("/api/diary",         diaryRouter);
app.use("/api/quizzes",       quizzesRouter);
app.use("/api/operations",    operationsRouter);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error("Server error:", err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`\n✅  EduSphere API  →  http://localhost:${PORT}`);
  console.log(`   JWT auth enabled · CORS restricted to ${CLIENT_ORIGIN}\n`);
});
