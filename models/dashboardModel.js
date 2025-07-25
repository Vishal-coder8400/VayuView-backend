const mongoose = require("mongoose");

// Define the schema for Dashboard
const dashboardSchema = new mongoose.Schema(
  {
    dashboardId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: false,
      trim: true,
    },
    deviceId: {
      // Reference to the Air Quality Device
      type: mongoose.Schema.Types.ObjectId,
      ref: "AirQualityDevice",
      required: true,
    }, 
    colorStandard: {
      type: String,
      enum: ["WHO", "USEPA", "CPCB", "ISHRAE/ASHRAE"],
      default: "WHO",
      required: false,
      trim: true,
    },
    template: {
      // Template
      type: Object,
    },
    company: {
      type: String,
      required: true,
      default: ''
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      default: null
    },
    sharedWith: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Customer",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// Create the model
const Dashboard = mongoose.model("Dashboard", dashboardSchema);

// Export the model
module.exports = Dashboard;
