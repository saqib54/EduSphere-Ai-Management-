export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${roles.join(" or ")}` });
    }
    next();
  };
}

// Convenience: admin-level roles
export const ADMIN_ROLES = ["Super Admin", "School Admin", "Principal", "Vice Principal"];
export const FINANCE_ROLES = [...ADMIN_ROLES, "Accountant"];
export const HR_ROLES = [...ADMIN_ROLES, "HR Manager"];
export const TEACHER_ROLES = [...ADMIN_ROLES, "Teacher"];
