// const mongoose = require('mongoose');

// // Function to generate a random password
// function generateRandomPassword() {
//     const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//     let password = '';
//     for (let i = 0; i < 6; i++) {
//         const randomIndex = Math.floor(Math.random() * chars.length);
//         password += chars[randomIndex];
//     }
//     return password;
// }

// // Define the schema for Customer
// const customerSchema = new mongoose.Schema({
//     customerId: {
//         type: String,
//         required: true,
//         unique: true,
//         trim: true,
//     },
//     name: {
//         type: String,
//         required: true,
//         trim: true,
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         trim: true,
//     },
//     password: {
//         type: String, // Password (hashed or plain)
//         minlength: [6, "Password must be at least 6 characters long"],
//         default: generateRandomPassword, // Use the default password generator
//     },
//     phone: {
//         type: String,
//         required: true,
//         trim: true,
//     },
    
//     company: {
//         type: String,
//         required: true,
//         trim: true
//     },
//     user_role: {
//         type: String,
//         enum: ['useradmin', 'executive'],
//         default: 'executive'
//     }
// }, {
//     timestamps: true, // Automatically adds createdAt and updatedAt fields
// });

// // Middleware to generate a default password if not provided
// customerSchema.pre('save', function (next) {
//     if (!this.password) {
//         this.password = generateRandomPassword();
//     }
//     next();
// });

// // Create the model
// const Customer = mongoose.model('Customer', customerSchema);

// // Export the model and the password generator
// module.exports = Customer;
// module.exports.generateRandomPassword = generateRandomPassword;


const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Define the schema for Customer
const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: [6, "Password must be at least 6 characters long"],
      select: false, // Hide password from queries
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    company: {
      type: String,
      required: true,
      trim: true,
    },
    user_role: {
      type: String,
      enum: ["useradmin", "executive"],
      default: "executive",
    },
  },
  {
    timestamps: true,
  }
);

// 🔐 Hash password before saving (only if it's new or modified)
customerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (err) {
    return next(err);
  }
});

// Create and export the model
module.exports = mongoose.model("Customer", customerSchema);

