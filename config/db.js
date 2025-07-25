const mongoose = require("mongoose");
const { logger } = require("./logger");
require("dotenv").config(); // Ensure this is here to load .env

const mongoURI = process.env.MONGODB_URI;

// Debug log to verify if URI is loaded correctly
console.log("📡 MongoDB URI:", mongoURI);

const connectToDatabase = async () => {
  if (!mongoURI) {
    console.error("❌ MONGODB_URI not found in .env file");
    process.exit(1);
  }

  try {
    const db_conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const db = mongoose.connection;

    db.on("connected", () => {
      logger.info("✅ Connected to MongoDB!");
      console.log("✅ Connected to Database");
    });

    db.on("error", (err) => {
      logger.error(`❌ MongoDB connection error: ${err}`);
    });

    db.on("disconnected", () => {
      logger.info("⚠️ Disconnected from MongoDB");
    });

    process.on("SIGINT", () => {
      db.close(() => {
        logger.warn("🔌 MongoDB connection closed due to app termination");
        process.exit(0);
      });
    });

    return db_conn;
  } catch (error) {
    logger.error(`❌ Error connecting to MongoDB: ${error}`);
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = { connectToDatabase };
