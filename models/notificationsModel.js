const mongoose = require('mongoose');

// Define the schema for Notifications
const notificationSchema = new mongoose.Schema({
    notificationId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    message: {
        type: String,
        required: true,
        trim: true,
    },
    sensorId: { // Reference to the Air Quality Device
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AirQualityDevice',
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Create the model
const Notification = mongoose.model('Notification', notificationSchema);

// Export the model
module.exports = Notification;
