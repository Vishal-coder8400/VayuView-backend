const { sendErrorResponse } = require("./responseUtils");

const checkRequiredFields = (body, requiredFields) => {
  const missingFields = requiredFields.filter((field) => !body[field] && body[field]!==false);
  return missingFields;
};

const handleValidationAndError = (error, res, errorMessage) => {
  if (error.name === "ValidationError") {
    const errors = {};
    for (let field in error.errors) {
      errors[field] = error.errors[field].message;
    }
    sendErrorResponse(res, "Validation failed", errors, 400);
  } else {
    sendErrorResponse(res, errorMessage, error, 500);
  }
};

// Middleware function to check for missing variables
const checkRequiredVariables = (requiredVariables) => {
  return (req, res, next) => {
    const missingVariables = [];

    // Check if each required variable is present in the request body
    requiredVariables.forEach((variable) => {
      if (!(variable in req.body)) {
        missingVariables.push(variable);
      }
    });

    // If there are missing variables, return an error response
    if (missingVariables.length > 0) {
      const errorMessage = `Missing required variables: ${missingVariables.join(
        ", "
      )}`;
      return sendErrorResponse(res, errorMessage, null, 400);
    }

    // If all required variables are present, proceed to the next middleware or route handler
    next();
  };
};

module.exports = {
  checkRequiredFields,
  handleValidationAndError,
  checkRequiredVariables,
};
