const mongoose = require('mongoose');

// Define the schema for Air Quality Device
const airQualityDeviceSchema = new mongoose.Schema({
    deviceId: {
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
    locationName: { // Changed from geolocation to location
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'maintenance'],
        default: 'active',
    },
    outdoorAPI: {
        type: String,
        default: null
    },
    outdoorAPIState: {
        type: String,
        default: null
    },
    subscriptionType: {
        type: String,
        enum: ['Basic', 'Premium', 'Elite'],
        default: 'Basic',
    },
    subsciptionExpiryDate: {
        type: Date,
        default: () => {
            let date = new Date();
            date.setFullYear(date.getFullYear() + 1); // Add 12 months to the current date
            date.setDate(date.getDate() + 1); // Add 12 months to the current date
            return date;
        },
    },
    assignedUserId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Customer"
    }, 
    customerId: { // Reference to Customer
        type: String,
        required: true,
        trim: true,
    },
    editableByCustomer: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});

// Create the model
const AirQualityDevice = mongoose.model('AirQualityDevice', airQualityDeviceSchema);

// Export the model
module.exports = AirQualityDevice;
