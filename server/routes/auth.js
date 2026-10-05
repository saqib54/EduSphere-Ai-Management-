import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { row } from "../db.js";
import { loginLimiter } from "../middleware/rateLimiter.js";

const r = Router();
const JWT_SECRET   = process.env.JWT_SECRET  || "edusphere-dev-jwt-secret-2026-change-in-production";
const JWT_EXPIRES  = process.env.JWT_EXPIRES_IN || "7d";

// POST /api/auth/login
r.post("/login", loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await row(
      "SELECT id,username,password,role,name,ref_id,status,must_change_password FROM users WHERE username=$1",
      [username.trim().toLowerCase()]
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }
    if (user.status === "Inactive") {
      return res.status(403).json({ error: "Your account has been deactivated. Contact admin." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const payload = { id: user.id, username: user.username, role: user.role, name: user.name, ref_id: user.ref_id };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
        ref_id: user.ref_id,
        must_change_password: user.must_change_password,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

// GET /api/auth/me  — reads from JWT, no DB query needed
r.get("/me", (req, res) => {
  // authenticate middleware runs before this on protected routes
  // But /auth/me is public — token is optional
  const auth = req.headers["authorization"];
  if (!auth || !auth.startsWith("Bearer ")) return res.json(null);
  try {
    const payload = jwt.verify(auth.slice(7), JWT_SECRET);
    res.json(payload);
  } catch {
    res.json(null);
  }
});

export default r;
