
const jwt = require("jsonwebtoken");

const protect = (req, res, next) => {
  try {
    // Get admin authentication token
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login first.",
      });
    }

    // Check JWT secret configuration
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ensure only admins can access admin routes
    if (decoded.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access only.",
      });
    }

    // Validate admin ID
    if (!decoded.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin session.",
      });
    }

    // Attach authenticated admin information
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Admin Authentication Error:", error.message);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired session. Please login again.",
    });
  }
};

module.exports = protect;
