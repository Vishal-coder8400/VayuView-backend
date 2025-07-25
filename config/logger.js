const winston = require("winston");
const { combine, timestamp, printf } = winston.format;

// Configure Winston logger
const logFormat = printf(({ timestamp, level, message }) => {
  return `${timestamp} ${level.toUpperCase()}: ${message}`;
});

const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp(), logFormat),
  transports: [new winston.transports.File({ filename: "app.log" })],
});

module.exports.logger = logger;
