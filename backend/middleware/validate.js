/**
 * Zod Request Validation Middleware
 */

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err.errors) {
      return res.status(400).json({
        message: "Validation failed",
        errors: err.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        })),
      });
    }
    return res.status(400).json({ message: "Invalid request payload" });
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (err) {
    return res.status(400).json({
      message: "Query validation failed",
      errors: err.errors || err.message,
    });
  }
};

export const validateParams = (schema) => (req, res, next) => {
  try {
    req.params = schema.parse(req.params);
    next();
  } catch (err) {
    return res.status(400).json({
      message: "Path parameter validation failed",
      errors: err.errors || err.message,
    });
  }
};
