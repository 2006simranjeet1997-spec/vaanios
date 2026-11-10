
const jwt = require("jsonwebtoken");

const protectCustomer = (req, res, next) => {
  try {
    const token = req.cookies?.customerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login to access your customer account.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "customer") {
      return res.status(403).json({
        success: false,
        message: "Customer access only.",
      });
    }

    req.customer = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired customer session.",
    });
  }
};

module.exports = protectCustomer;
