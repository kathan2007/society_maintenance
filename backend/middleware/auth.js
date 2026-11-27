import { verifyAccessToken } from "../utils/authUtils.js";
import User from "../models/User.js";

/**
 * Middleware to verify JWT access token
 * Supports Authorization header: Bearer <token> or access_token cookie
 */
export const verifyToken = async (req, res, next) => {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    } else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      return res.status(401).json({ message: "Authentication required: token missing" });
    }

    const decoded = verifyAccessToken(token);

    // Optional quick check to ensure user wasn't deactivated
    const user = await User.findById(decoded.id).select("role isActive");
    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User account deactivated or not found" });
    }

    req.user = {
      id: decoded.id,
      role: user.role,
      name: decoded.name,
      flatNo: decoded.flatNo,
    };

    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ message: "Invalid or forged token" });
  }
};

export default verifyToken;
