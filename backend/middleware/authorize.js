/**
 * Central Authorization Middleware (Layer 4)
 * - requireRole: enforces specific role (default: "admin")
 * - requireOwnership: prevents IDOR / BOLA by ensuring the resource belongs to req.user.id
 */

/**
 * Enforce minimum role (e.g. "admin")
 */
export const requireRole = (role = "admin") => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (req.user.role !== role) {
      return res.status(403).json({ message: "Access forbidden: insufficient privileges" });
    }
    next();
  };
};

/**
 * Prevent IDOR / BOLA:
 * If user is not admin, verifies that the model document by req.params[idParam] has document[userField] === req.user.id
 */
export const requireOwnership = (Model, idParam = "id", userField = "userId") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      // Admins can access any record
      if (req.user.role === "admin") {
        return next();
      }

      const docId = req.params[idParam];
      if (!docId) {
        return res.status(400).json({ message: "Resource ID missing in request" });
      }

      const doc = await Model.findById(docId);
      if (!doc) {
        return res.status(404).json({ message: "Resource not found" });
      }

      const ownerId = doc[userField] ? doc[userField].toString() : null;
      if (ownerId !== req.user.id.toString()) {
        return res.status(403).json({ message: "Access forbidden: resource does not belong to you" });
      }

      req.resource = doc;
      next();
    } catch (err) {
      return res.status(500).json({ message: "Authorization verification error" });
    }
  };
};
