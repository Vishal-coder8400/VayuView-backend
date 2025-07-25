const { sendErrorResponse } = require("../utils/responseUtils");

const checkPermission = (requiredPermissions) => {
  return (req, res, next) => {
    const userPermissions = req.user.role.permissions;
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      return sendErrorResponse(res, "Permission denied", (status_code = 403));
    }

    next();
  };
};

module.exports = {
  checkPermission,
};
