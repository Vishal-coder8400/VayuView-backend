require("dotenv").config(); // Always load env first
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Customer = require("../models/customerModel");

// Optional: define here if not imported
const sendSuccessResponse = (res, message, data = {}, status = 200) => {
  return res.status(status).json({ message, status, data });
};

const sendErrorResponse = (res, message, error = null, status = 500) => {
  return res.status(status).json({ message, status, error });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("🔐 Logging in:", email);

    if (!email || !password) {
      return sendErrorResponse(res, "Email and password required", null, 400);
    }

    // ✅ Admin Login Check
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { id: "admin", role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
      );

      console.log("✅ Admin login successful");

      return sendSuccessResponse(res, "Login successful (Admin)", {
        token,
        user: {
          email: process.env.ADMIN_EMAIL,
          role: "admin",
        },
        role: "admin",
      });
    }

    // ✅ Customer Login
    const customer = await Customer.findOne({ email }).select("+password");
    if (!customer) {
      return sendErrorResponse(res, "No account found", null, 401);
    }

    const isMatch = await bcrypt.compare(password, customer.password);
    if (!isMatch) {
      return sendErrorResponse(res, "Invalid password", null, 401);
    }

    const token = jwt.sign(
      { id: customer._id, role: customer.user_role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "1d" }
    );

    console.log("✅ Customer token issued:", email);

    return sendSuccessResponse(res, "Login successful", {
      token,
      user: {
        _id: customer._id,
        email: customer.email,
        name: customer.name,
        phone: customer.phone,
        company: customer.company,
        user_role: customer.user_role,
        customerId: customer.customerId,
      },
      role: customer.user_role,
    });
  } catch (error) {
    console.error("❌ Login route error:", error);
    return sendErrorResponse(res, "Internal server error", error.message, 500);
  }
};
