import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const token = req.cookies.auth_token;

  if (!token) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    console.log("Authorization check for user:", req.user);
    if (!req.user || !req.user.role) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Forbidden: insufficient permissions",
      });
    }

    next();
  };
}
