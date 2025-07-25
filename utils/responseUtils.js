// Function to send a success response
const sendSuccessResponse = (res, message, data = {}, status_code = 200) => {
  const response = {
    message,
    status: status_code,
    data,
  };
  res.status(status_code).json(response);
};

// Function to send an error response
const sendErrorResponse = (res, message, error = {}, status_code = 500) => {
  const response = {
    message,
    status: status_code,
    error,
  };
  res.status(status_code).json(response);
};

module.exports = {
  sendSuccessResponse,
  sendErrorResponse,
};
