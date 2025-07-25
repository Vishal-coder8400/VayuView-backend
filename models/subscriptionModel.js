const mongoose = require("mongoose");

// Define the schema for Subscription Manager
const subscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    subscriberName: {
      type: String,
      required: true,
      trim: true,
    },
    apiKey: {
      type: String,
    },
    subscriberEmail: {
      type: String,
      required: true,
      trim: true,
    },
    deviceId: {
      // Reference to the Air Quality Device
      type: mongoose.Schema.Types.ObjectId,
      ref: "AirQualityDevice",
      required: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

function generateApiKey() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// Pre-save middleware to set the apiKey
subscriptionSchema.pre("save", function (next) {
  if (!this.apiKey) {
    this.apiKey = generateApiKey();
  }
  next();
});

// Create the model
const Subscription = mongoose.model("Subscription", subscriptionSchema);

// Export the model
module.exports = Subscription;
