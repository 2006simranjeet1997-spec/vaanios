
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Customer = require("../models/Customer");
const protectCustomer = require("../middleware/customerAuthMiddleware");

const router = express.Router();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

const createCustomerToken = (customer) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign(
    {
      id: customer._id.toString(),
      email: customer.email,
      role: "customer",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );
};

const customerResponse = (customer) => ({
  id: customer._id,
  name: customer.name,
  email: customer.email,
  phone: customer.phone,
});

// ==========================================
// CUSTOMER REGISTRATION
// ==========================================

router.post("/register", async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = phone.trim();

    if (normalizedName.length > 80) {
      return res.status(400).json({
        success: false,
        message: "Name must be 80 characters or fewer.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address.",
      });
    }

    const phoneRegex = /^\+?[0-9\s-]{10,15}$/;

    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number.",
      });
    }

    if (typeof password !== "string" || password.length < 8 || password.length > 128) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 8 and 128 characters.",
      });
    }

    const existingCustomer = await Customer.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    if (existingCustomer) {
      return res.status(409).json({
        success: false,
        message: "An account with this email or phone number already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const customer = await Customer.create({
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
    });

    const token = createCustomerToken(customer);

    res.cookie("customerToken", token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: "Customer account created successfully!",
      customer: customerResponse(customer),
    });
  } catch (error) {
    console.error("Customer Registration Error:", error.message);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email or phone number is already registered.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Could not create your account.",
    });
  }
});

// ==========================================
// CUSTOMER LOGIN
// ==========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your email and password.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const customer = await Customer.findOne({
      email: normalizedEmail,
    }).select("+passwordHash");

    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      customer.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = createCustomerToken(customer);

    res.cookie("customerToken", token, cookieOptions);

    return res.json({
      success: true,
      message: "Login successful!",
      customer: customerResponse(customer),
    });
  } catch (error) {
    console.error("Customer Login Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not log in. Please try again.",
    });
  }
});

// ==========================================
// GET LOGGED-IN CUSTOMER
// ==========================================

router.get("/me", protectCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer account not found.",
      });
    }

    return res.json({
      success: true,
      customer: customerResponse(customer),
    });
  } catch (error) {
    console.error("Customer Session Error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not verify customer session.",
    });
  }
});

// ==========================================
// CUSTOMER LOGOUT
// ==========================================

router.post("/logout", (req, res) => {
  res.clearCookie("customerToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });

  return res.json({
    success: true,
    message: "Logged out successfully.",
  });
});

module.exports = router;
