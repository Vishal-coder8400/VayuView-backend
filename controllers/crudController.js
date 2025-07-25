const Customer = require("../models/customerModel");
const AirQualityDevice = require("../models/airQualityModel");
const Dashboard = require("../models/dashboardModel");
const Notification = require("../models/notificationsModel");
const Subscription = require("../models/subscriptionModel");
const {
  sendErrorResponse,
  sendSuccessResponse,
} = require("../utils/responseUtils");
const { sendMail } = require("../utils/mailer");
const { zhCNLocale } = require("adminjs");

// Define a mapping of models for easier access
const models = {
  Customer,
  AirQualityDevice,
  Dashboard,
  Notification,
  Subscription,
};

// Generic function to create a new document
exports.createDocument = async (req, res) => {
  const { modelName } = req.params; // Get the model name from the request parameters
  const Model = models[modelName]; // Get the corresponding model

  if (!Model) {
    return sendErrorResponse(res, "Invalid model name", null, 400);
  }

  try {
    const document = new Model(req.body);
    await document.save();
    return sendSuccessResponse(
      res,
      `${modelName} created successfully`,
      document
    );
  } catch (error) {
    return sendErrorResponse(res, error.message, error, 500);
  }
};


// Generic function to get all documents with dynamic key mappings and filtering
exports.getAllDocuments = async (req, res) => {
  const { modelName } = req.params; // Dynamic model name from request params
  const Model = models[modelName]; // Lookup model based on the model name
  const filters = req.query; // Filters from query parameters

  // Custom column mappings for different models
  const columnMappings = {
    Customer: {
      customerId: "Customer ID",
      company: "Company Name",
      name: "Name",
      email: "Email",
      phone: "Phone",
      user_role: "User Role"
    },
    AirQualityDevice: {
      deviceId: "Device ID",
      name: "Name",
      locationName: "Location",
      status: "Status",
      customerId: "Customer",
      assignedUserId: "User",
      subscriptionType: "Subscription Type",
      subsciptionExpiryDate: "Subscription Last Date",
      editableByCustomer: "Editable by customer",
    },
    Dashboard: {
      dashboardId: "Dashboard ID",
      title: "Title",
      description: "Description",
      deviceId: "Device ID",
      company: "Company",
      createdBy: "Created By",
      template: "Template",
      share: "Share",
    },
    Subscription: {
      subscriptionId: "Subscription ID",
      subscriberName: "Subscriber Name",
      subscriberEmail: "Subscriber Email",
      deviceId: "Device Id",
      apiKey: "API KEY",
      active: "Active",
    },
  };

  if (!Model) {
    return sendErrorResponse(res, "Invalid model name", null, 400);
  }

  try {
    let query;
    
    // Apply 'or' filter logic
    if (filters.or) {
      const orConditions = Object.entries(filters.or).map(([field, value]) => ({
        [field]: value,
      }));
      query = Model.find({ $or: orConditions });
    } else {
      query = Model.find(filters); // Apply filters directly if no 'or' filter is specified
    }

    // Populate any related fields dynamically based on the model
    if (modelName === "AirQualityDevice") {
      query = query.populate("customerId").populate("assignedUserId");
    } else if (modelName === "Dashboard") {
      query = query.populate("deviceId").populate('sharedWith').populate('createdBy').select('-template');
    } else if (modelName === "Subscription") {
      query = query.populate("deviceId");
    }

    const documents = await query;

    // Check if custom column mappings exist for the current model
    const columns = columnMappings[modelName] || {};

    return sendSuccessResponse(res, `${modelName}s fetched successfully`, {
      data: documents,
      columns,
    });
  } catch (error) {
    console.log(error, "error");
    return sendErrorResponse(res, `Failed to fetch ${modelName}s`, error, 500);
  }
};
  
// Generic function to get a document by ID
exports.getDocumentById = async (req, res) => {
  const { modelName, id } = req.params;
  const Model = models[modelName];

  if (!Model) {
    return sendErrorResponse(res, "Invalid model name", null, 400);
  }

  try {
    const document = await Model.findById(id);
    if (!document) {
      return sendErrorResponse(res, `${modelName} not found`, null, 404);
    }
    return sendSuccessResponse(
      res,
      `${modelName} fetched successfully`,
      document
    );
  } catch (error) {
    return sendErrorResponse(res, `Failed to fetch ${modelName}`, error, 500);
  }
};

// Generic function to update a document by ID
exports.updateDocument = async (req, res) => {
  const { modelName, id } = req.params;
  const Model = models[modelName];

  if (!Model) {
    return sendErrorResponse(res, "Invalid model name", null, 400);
  }

  try {
    const document = await Model.findByIdAndUpdate(id, req.body, { new: true });
    if (!document) {
      return sendErrorResponse(res, `${modelName} not found`, null, 404);
    }
    return sendSuccessResponse(
      res,
      `${modelName} updated successfully`,
      document
    );
  } catch (error) {
    console.log(error, 'error')
    return sendErrorResponse(res, `Failed to update ${modelName}`, error, 500);
  }
};

// Generic function to delete a document by ID
exports.deleteDocument = async (req, res) => {
  const { modelName, id } = req.params;
  const Model = models[modelName];

  if (!Model) {
    return sendErrorResponse(res, "Invalid model name", null, 400);
  }

  try {
    const document = await Model.findByIdAndDelete(id);
    if (!document) {
      return sendErrorResponse(res, `${modelName} not found`, null, 404);
    }
    return sendSuccessResponse(res, `${modelName} deleted successfully`, null);
  } catch (error) {
    return sendErrorResponse(res, `Failed to delete ${modelName}`, error, 500);
  }
};

// Custom function example: createNotification
exports.createNotification = async (req, res) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    return sendSuccessResponse(
      res,
      "Notification created successfully",
      notification
    );
  } catch (error) {
    return sendErrorResponse(res, "Failed to create notification", error, 500);
  }
};

// Generic function to create a new customer
exports.createCustomer = async (req, res) => {
   try {
     const { email, password, name, phone, company, user_role, customerId } = req.body;
 
     // Validation
     if (!email || !password || !name || !customerId || !phone || !company) {
       return sendErrorResponse(res, "All fields are required", null, 400);
     }
 
     // Check if email already exists
     const existing = await Customer.findOne({ email });
     if (existing) {
       return sendErrorResponse(res, "Email already exists", null, 400);
     }
 
     const customer = new Customer({
       email,
       password, // Will be hashed by model middleware
       name,
       phone,
       company,
       user_role,
       customerId,
     });
 
     await customer.save();
 
     // Send welcome email (do NOT include password)
     const emailSubject = "Welcome to Vayuguard AQI Platform";
     const emailText = `
       Dear ${name},<br/>
       Your account has been successfully created.<br/>
       Username: ${email}<br/>
       You can now login at our portal using your credentials.<br/>
       <b>Best regards,<br/>VG Team</b>
     `;
 
     await sendMail(email, emailSubject, emailText);
 
     return sendSuccessResponse(res, "Customer created successfully", customer);
   } catch (error) {
     return sendErrorResponse(res, error.message, error, 500);
   }
 };