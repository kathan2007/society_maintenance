import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT token and attach user info to req.user
 * Usage: add `verifyToken` to protected routes
 */

const verifyToken = (req, res, next) => {
  try {
    // Get token from Authorization header (Bearer <token>)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "Token missing" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    // Verify token
    const decoded = jwt.verify(token, "secretkey"); // Use same secret as login
    req.user = decoded; // { id: user._id, role: user.role }

    next(); // Continue to the route
  } catch (err) {
    console.error("JWT verification error:", err);
    return res.status(401).json({ message: "Invalid token" });
  }
};

export default verifyToken;