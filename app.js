const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { connectToDatabase } = require("./config/db");
const { logger } = require("./config/logger");
const dotenv = require("dotenv");
const ExcelJS = require("exceljs");
const {
  sendSuccessResponse,
  sendErrorResponse,
} = require("./utils/responseUtils");
const cronJob = require("./utils/bg_runner");

const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const uploadFolder = path.join(__dirname, "uploads");
const defaultFolder = path.join(__dirname, "default_images");
const thumbnailFolder = path.join(__dirname, "thumbnails");

// Ensure folders exist
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);
if (!fs.existsSync(thumbnailFolder)) fs.mkdirSync(thumbnailFolder);

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadFolder),
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/\s+/g, "-");
    cb(null, `${timestamp}-${originalName}`);
  },
});

const upload = multer({ storage });

dotenv.config();
const app = express();

const port = process.env.PORT || 4000;

// Middleware
app.use(bodyParser.json({ limit: "150mb" }));
app.use(cors());
app.use(express.static("public"));

// Routes
const crudRoutes = require("./routes/crudRoutes");
const Customer = require("./models/customerModel");
const { default: mongoose } = require("mongoose");
const Subscription = require("./models/subscriptionModel");
const Dashboard = require("./models/dashboardModel");
const AirQualityDevice = require("./models/airQualityModel");

const authRoutes = require("./routes/authRoute");
app.use("/api", authRoutes); // Final routes: /api/auth/login and /api/auth/signup


// Use your routes
app.use("/api", crudRoutes);
app.use(bodyParser.urlencoded({ extended: true }));

connectToDatabase()
  .then((db) => {
    // default route
    app.get("/", (req, res) => {
      sendSuccessResponse(res, "VG-backend running!");
    });


    
   // Function to calculate averages
function calculateAverages(data, key) {
  // Check if the key exists in the data
  if (!data || !Array.isArray(data)) {
    throw new Error("Invalid data provided.");
  }


  const sums = {};
  const counts = {};

  // Iterate through the data
  data.forEach((record) => {
    if (record[key] && Array.isArray(record[key])) {
      record[key].forEach(({ param, value }) => {
        if (typeof value === "number") { // Ensure value is a number
          if (!sums[param]) {
            sums[param] = 0; // Initialize sum
            counts[param] = 0; // Initialize count
          }
          sums[param] += value;
          counts[param] += 1;
        }
      });
    }
  });

  // Calculate averages
  const averages = {};
  for (const param in sums) {
    averages[param] = counts[param] > 0 ? sums[param] / counts[param] : null; // Avoid division by zero
  }

  return averages;
}


    const distinctMinutes = (logs) => {
      const seenMinutes = new Set();
      const result = [];

      logs.forEach((log) => {
        // Extract the minute portion of the timestamp
        const timestamp = new Date(log.timestamp);
        const minuteKey = `${timestamp.getUTCFullYear()}-${
          timestamp.getUTCMonth() + 1
        }-${timestamp.getUTCDate()}T${timestamp.getUTCHours()}:${timestamp.getUTCMinutes()}`;

        // Add the log only if this minute hasn't been seen
        if (!seenMinutes.has(minuteKey)) {
          seenMinutes.add(minuteKey);
          result.push(log);
        }
      });

      return result;
    };


    async function getLogs(filter = {}) {
      try {
        const collection =
          mongoose.connection.db.collection("air_quality_data");

        // Query to get the last 100 logs sorted by timestamp in descending order
        const logs = await collection
          .find(filter) // Apply filter if provided
          .sort({ timestamp: -1 }) // Sort by timestamp descending
          .limit(100) // Limit to 100 logs
          .toArray();

        return logs;
      } catch (error) {
        console.error("Error fetching logs:", error);
        throw error;
      }
    }

    async function getLogsFiltered(machine_id, start_date, end_date) {
      try {
        let machineId = machine_id;
        let startDate = start_date;
        let endDate = end_date;
        console.log(machineId, startDate, endDate, "params");
        const collection =
          mongoose.connection.db.collection("air_quality_data");

        // Build the query object based on provided filters
        const query = {};

        if (machineId) {
          query.mid = machineId;
        }

        if (startDate || endDate) {
          query.timestamp = {};
          if (startDate) query.timestamp.$gte = new Date(startDate); // Greater than or equal to startDate
          if (endDate) query.timestamp.$lte = new Date(endDate); // Less than or equal to endDate
        }

        console.log(query);

        // Query to get the last 100 logs based on filters and sorted by timestamp
        const logs = await collection
          .find(query)
          .sort({ timestamp: -1 }) // Sort by timestamp descending
          .limit(500)
          .toArray();

        return logs;
      } catch (error) {
        console.error("Error fetching logs:", error);
        throw error;
      }
    }

    

    async function getLogsFilteredAll(start_date, end_date) {
      try {
        let startDate = start_date;
        let endDate = end_date;
        const collection =
          mongoose.connection.db.collection("air_quality_data");

        // Build the query object based on provided filters
        const query = {};
        if (startDate || endDate) {
          query.timestamp = {};
          if (startDate) query.timestamp.$gte = new Date(startDate); // Greater than or equal to startDate
          if (endDate) query.timestamp.$lte = new Date(endDate); // Less than or equal to endDate
        }
        console.log(query, "query");
        // Query to get the last 100 logs based on filters and sorted by timestamp
        const logs = await collection
          .find(query)
          .sort({ timestamp: -1 }) // Sort by timestamp descending
          .toArray();

        let distinctLogs = distinctMinutes(logs);
        return distinctLogs;
      } catch (error) {
        console.error("Error fetching logs:", error);
        throw error;
      }
    }

    async function getLastLog() {
      let client;
      try {
        const collection =
          mongoose.connection.db.collection("air_quality_data");

        // Query to get the last 100 logs sorted by timestamp -1 (descending)
        const logs = await collection
          .find()
          .sort({ timestamp: -1 }) // Sort by timestamp descending
          .limit(1) // Limit to 100 logs
          .toArray();

        return logs;
      } catch (error) {
        console.error("Error fetching logs:", error);
        throw error;
      } finally {
        if (client) {
          await client.close();
        }
      }
    }

    // Define the GET API to return logs
    app.get("/aqi-logs", async (req, res) => {
      try {
        const logs = await getLogs();
        return sendSuccessResponse(res, `Logs fetched successfully`, {
          data: logs,
          columns: {
            mid: "Device ID",
            timestamp: "Timestamp",
            indoor_pm1: "Indoor PM 1 (μg/m3)",
            indoor_pm25: "Indoor PM 2.5 (μg/m3)",
            indoor_pm10: "Indoor PM 10 (μg/m3)",
            indoor_temp: "Indoor Temp (°C)",
            indoor_humidity: "Indoor Humidity (%)",
            indoor_tvoc: "Indoor TVOC (ppb)",
            indoor_co2: "Indoor CO2 (ppm)",
            indoor_hcho: "Indoor HCHO (mg/m3)",
            indoor_lux: "Indoor Light (Lux)",
            indoor_db: "Indoor Noise (db)",
            indoor_so2: "Indoor SO2 (mg/m3)",
            indoor_no: "Indoor NO (mg/m3)",
            indoor_no2: "Indoor NO2 (mg/m3)",
            indoor_o2: "Indoor O2 (mg/m3)",
            indoor_o3: "Indoor O3 (mg/m3)",
            indoor_nh3: "Indoor NH3 (mg/m3)",
            indoor_ch4: "Indoor CH4 (mg/m3)",
            indoor_co: "Indoor CO (ppm)",
            outdoor_pm1: "Outdoor PM 1 (μg/m3)",
            outdoor_pm25: "Outdoor PM 2.5 (μg/m3)",
            outdoor_pm10: "Outdoor PM 10 (μg/m3)",
            outdoor_temp: "Outdoor Temp (°C)",
            outdoor_humidity: "Outdoor Humidity (%)",
            outdoor_tvoc: "Outdoor TVOC (ppb)",
            outdoor_co2: "Outdoor CO2 (ppm)",
            outdoor_hcho: "Outdoor HCHO (mg/m3)",
            outdoor_lux: "Outdoor Light (Lux)",
            outdoor_db: "Outdoor Noise (db)",
            outdoor_so2: "Outdoor SO2 (mg/m3)",
            outdoor_no: "Outdoor NO (mg/m3)",
            outdoor_no2: "Outdoor NO2 (mg/m3)",
            outdoor_o2: "Outdoor O2 (mg/m3)",
            outdoor_o3: "Outdoor O3 (mg/m3)",
            outdoor_nh3: "Outdoor NH3 (mg/m3)",
            outdoor_ch4: "Outdoor CH4 (mg/m3)",
            outdoor_co: "Outdoor CO (ppm)",
          },
        });
        res.json(logs); // Return the logs as JSON
      } catch (error) {
        res.status(500).send("Error retrieving logs");
      }
    });

    app.get("/aqi-logs-filtered/:user_id", async (req, res) => {
      try {
        const { user_id } = req.params; // Get user_id from query params

        let logs;

        if (user_id === "admin") {
          logs = await getLogs(); // Fetch all logs for admin
        } else {
          const customer_ = await Customer.find({ _id: user_id });
          const cmp = customer_[0].company;
          const role = customer_[0].user_role;
          console.log(user_id, cmp, role)
          if (role === "useradmin") {
            // Fetch devices assigned to the user from another collection
            const assignedDevices = await AirQualityDevice.find({
              customerId: cmp,
            }).select("deviceId");
            const deviceIds = assignedDevices.map((device) => device.deviceId);
            console.log(deviceIds)

            // Fetch logs only for assigned devices
            logs = await getLogs({ mid: { $in: deviceIds } });
          } else {
            // Fetch devices assigned to the user from another collection
            const assignedDevices = await AirQualityDevice.find({
              assignedUserId: user_id,
            }).select("deviceId");
            const deviceIds = assignedDevices.map((device) => device.deviceId);

            // Fetch logs only for assigned devices
            logs = await getLogs({ mid: { $in: deviceIds } });
          }
        }

        return sendSuccessResponse(res, `Logs fetched successfully`, {
          data: logs,
          columns: {
            mid: "Device ID",
            timestamp: "Timestamp",
            indoor_pm1: "Indoor PM 1 (μg/m3)",
            indoor_pm25: "Indoor PM 2.5 (μg/m3)",
            indoor_pm10: "Indoor PM 10 (μg/m3)",
            indoor_temp: "Indoor Temp (°C)",
            indoor_humidity: "Indoor Humidity (%)",
            indoor_tvoc: "Indoor TVOC (ppb)",
            indoor_co2: "Indoor CO2 (ppm)",
            indoor_hcho: "Indoor HCHO (mg/m3)",
            indoor_lux: "Indoor Light (Lux)",
            indoor_db: "Indoor Noise (db)",
            indoor_so2: "Indoor SO2 (mg/m3)",
            indoor_no: "Indoor NO (mg/m3)",
            indoor_no2: "Indoor NO2 (mg/m3)",
            indoor_o2: "Indoor O2 (mg/m3)",
            indoor_o3: "Indoor O3 (mg/m3)",
            indoor_nh3: "Indoor NH3 (mg/m3)",
            indoor_ch4: "Indoor CH4 (mg/m3)",
            indoor_co: "Indoor CO (ppm)",
            outdoor_pm1: "Outdoor PM 1 (μg/m3)",
            outdoor_pm25: "Outdoor PM 2.5 (μg/m3)",
            outdoor_pm10: "Outdoor PM 10 (μg/m3)",
            outdoor_temp: "Outdoor Temp (°C)",
            outdoor_humidity: "Outdoor Humidity (%)",
            outdoor_tvoc: "Outdoor TVOC (ppb)",
            outdoor_co2: "Outdoor CO2 (ppm)",
            outdoor_hcho: "Outdoor HCHO (mg/m3)",
            outdoor_lux: "Outdoor Light (Lux)",
            outdoor_db: "Outdoor Noise (db)",
            outdoor_so2: "Outdoor SO2 (mg/m3)",
            outdoor_no: "Outdoor NO (mg/m3)",
            outdoor_no2: "Outdoor NO2 (mg/m3)",
            outdoor_o2: "Outdoor O2 (mg/m3)",
            outdoor_o3: "Outdoor O3 (mg/m3)",
            outdoor_nh3: "Outdoor NH3 (mg/m3)",
            outdoor_ch4: "Outdoor CH4 (mg/m3)",
            outdoor_co: "Outdoor CO (ppm)",
          },
        });
      } catch (error) {
        console.error(error);
        res.status(500).send("Error retrieving logs");
      }
    });

    // Define the GET API to return logs
    app.get("/aqi-logs-all/:start_date/:end_date", async (req, res) => {
      try {
        const { start_date, end_date } = req.params;
        const logs = await getLogsFilteredAll(start_date, end_date);
        const indoor_avg = calculateAverages(logs, "indoor_air_quality");
        const outdoor_avg = calculateAverages(logs, "oudoor_air_quality");
        return sendSuccessResponse(res, `Logs fetched successfully`, {
          data: logs,
          indoor_avg,
          outdoor_avg,
          columns: {
            mid: "Device ID",
            timestamp: "Timestamp",
            indoor_pm1: "Indoor PM 1 (μg/m3)",
            indoor_pm25: "Indoor PM 2.5 (μg/m3)",
            indoor_pm10: "Indoor PM 10 (μg/m3)",
            indoor_temp: "Indoor Temp (°C)",
            indoor_humidity: "Indoor Humidity (%)",
            indoor_tvoc: "Indoor TVOC (ppb)",
            indoor_co2: "Indoor CO2 (ppm)",
            indoor_hcho: "Indoor HCHO (mg/m3)",
            indoor_lux: "Indoor Light (Lux)",
            indoor_db: "Indoor Noise (db)",
            indoor_so2: "Indoor SO2 (mg/m3)",
            indoor_no: "Indoor NO (mg/m3)",
            indoor_no2: "Indoor NO2 (mg/m3)",
            indoor_o2: "Indoor O2 (mg/m3)",
            indoor_o3: "Indoor O3 (mg/m3)",
            indoor_nh3: "Indoor NH3 (mg/m3)",
            indoor_ch4: "Indoor CH4 (mg/m3)",
            indoor_co: "Indoor CO (ppm)",
            outdoor_pm1: "Outdoor PM 1 (μg/m3)",
            outdoor_pm25: "Outdoor PM 2.5 (μg/m3)",
            outdoor_pm10: "Outdoor PM 10 (μg/m3)",
            outdoor_temp: "Outdoor Temp (°C)",
            outdoor_humidity: "Outdoor Humidity (%)",
            outdoor_tvoc: "Outdoor TVOC (ppb)",
            outdoor_co2: "Outdoor CO2 (ppm)",
            outdoor_hcho: "Outdoor HCHO (mg/m3)",
            outdoor_lux: "Outdoor Light (Lux)",
            outdoor_db: "Outdoor Noise (db)",
            outdoor_so2: "Outdoor SO2 (mg/m3)",
            outdoor_no: "Outdoor NO (mg/m3)",
            outdoor_no2: "Outdoor NO2 (mg/m3)",
            outdoor_o2: "Outdoor O2 (mg/m3)",
            outdoor_o3: "Outdoor O3 (mg/m3)",
            outdoor_nh3: "Outdoor NH3 (mg/m3)",
            outdoor_ch4: "Outdoor CH4 (mg/m3)",
            outdoor_co: "Outdoor CO (ppm)",
          },
        });
        res.json(logs); // Return the logs as JSON
      } catch (error) {
        console.log(error);
        res.status(500).send("Error retrieving logs");
      }
    });

    // Define the GET API to return logs
    app.get(
      "/aqi-logs-all-id/:start_date/:end_date/:machine_id",
      async (req, res) => {
        try {
          const { start_date, end_date, machine_id } = req.params;
          const logs = await getLogsFiltered(machine_id, start_date, end_date);
          const indoor_avg = calculateAverages(logs, "indoor_air_quality");
          const outdoor_avg = calculateAverages(logs, "oudoor_air_quality");
          return sendSuccessResponse(res, `Logs fetched successfully`, {
            data: logs,
            indoor_avg,
            outdoor_avg,
            columns: {
              mid: "Device ID",
              timestamp: "Timestamp",
              indoor_pm1: "Indoor PM 1 (μg/m3)",
              indoor_pm25: "Indoor PM 2.5 (μg/m3)",
              indoor_pm10: "Indoor PM 10 (μg/m3)",
              indoor_temp: "Indoor Temp (°C)",
              indoor_humidity: "Indoor Humidity (%)",
              indoor_tvoc: "Indoor TVOC (ppb)",
              indoor_co2: "Indoor CO2 (ppm)",
              indoor_hcho: "Indoor HCHO (mg/m3)",
              indoor_lux: "Indoor Light (Lux)",
              indoor_db: "Indoor Noise (db)",
              indoor_so2: "Indoor SO2 (mg/m3)",
              indoor_no: "Indoor NO (mg/m3)",
              indoor_no2: "Indoor NO2 (mg/m3)",
              indoor_o2: "Indoor O2 (mg/m3)",
              indoor_o3: "Indoor O3 (mg/m3)",
              indoor_nh3: "Indoor NH3 (mg/m3)",
              indoor_ch4: "Indoor CH4 (mg/m3)",
              indoor_co: "Indoor CO (ppm)",
              outdoor_pm1: "Outdoor PM 1 (μg/m3)",
              outdoor_pm25: "Outdoor PM 2.5 (μg/m3)",
              outdoor_pm10: "Outdoor PM 10 (μg/m3)",
              outdoor_temp: "Outdoor Temp (°C)",
              outdoor_humidity: "Outdoor Humidity (%)",
              outdoor_tvoc: "Outdoor TVOC (ppb)",
              outdoor_co2: "Outdoor CO2 (ppm)",
              outdoor_hcho: "Outdoor HCHO (mg/m3)",
              outdoor_lux: "Outdoor Light (Lux)",
              outdoor_db: "Outdoor Noise (db)",
              outdoor_so2: "Outdoor SO2 (mg/m3)",
              outdoor_no: "Outdoor NO (mg/m3)",
              outdoor_no2: "Outdoor NO2 (mg/m3)",
              outdoor_o2: "Outdoor O2 (mg/m3)",
              outdoor_o3: "Outdoor O3 (mg/m3)",
              outdoor_nh3: "Outdoor NH3 (mg/m3)",
              outdoor_ch4: "Outdoor CH4 (mg/m3)",
              outdoor_co: "Outdoor CO (ppm)",
            },
          });
          res.json(logs); // Return the logs as JSON
        } catch (error) {
          console.log(error);
          res.status(500).send("Error retrieving logs");
        }
      }
    );

    // Define the GET API to return logs
    app.get("/aqi-logs/:machine_id", async (req, res) => {
    
      try {
        const { machine_id } = req.params;
        const logs = await getLogsFiltered(machine_id);
        return sendSuccessResponse(res, `Logs fetched successfully`, {

          data: logs,
          columns: {
            mid: "Device ID",
            timestamp: "Timestamp",
            indoor_pm1: "Indoor PM 1 (μg/m3)",
            indoor_pm25: "Indoor PM 2.5 (μg/m3)",
            indoor_pm10: "Indoor PM 10 (μg/m3)",
            indoor_temp: "Indoor Temp (°C)",
            indoor_humidity: "Indoor Humidity (%)",
            indoor_tvoc: "Indoor TVOC (ppb)",
            indoor_co2: "Indoor CO2 (ppm)",
            indoor_hcho: "Indoor HCHO (mg/m3)",
            indoor_lux: "Indoor Light (Lux)",
            indoor_db: "Indoor Noise (db)",
            indoor_so2: "Indoor SO2 (mg/m3)",
            indoor_no: "Indoor NO (mg/m3)",
            indoor_no2: "Indoor NO2 (mg/m3)",
            indoor_o2: "Indoor O2 (mg/m3)",
            indoor_o3: "Indoor O3 (mg/m3)",
            indoor_nh3: "Indoor NH3 (mg/m3)",
            indoor_ch4: "Indoor CH4 (mg/m3)",
            indoor_co: "Indoor CO (ppm)",
            outdoor_pm1: "Outdoor PM 1 (μg/m3)",
            outdoor_pm25: "Outdoor PM 2.5 (μg/m3)",
            outdoor_pm10: "Outdoor PM 10 (μg/m3)",
            outdoor_temp: "Outdoor Temp (°C)",
            outdoor_humidity: "Outdoor Humidity (%)",
            outdoor_tvoc: "Outdoor TVOC (ppb)",
            outdoor_co2: "Outdoor CO2 (ppm)",
            outdoor_hcho: "Outdoor HCHO (mg/m3)",
            outdoor_lux: "Outdoor Light (Lux)",
            outdoor_db: "Outdoor Noise (db)",
            outdoor_so2: "Outdoor SO2 (mg/m3)",
            outdoor_no: "Outdoor NO (mg/m3)",
            outdoor_no2: "Outdoor NO2 (mg/m3)",
            outdoor_o2: "Outdoor O2 (mg/m3)",
            outdoor_o3: "Outdoor O3 (mg/m3)",
            outdoor_nh3: "Outdoor NH3 (mg/m3)",
            outdoor_ch4: "Outdoor CH4 (mg/m3)",
            outdoor_co: "Outdoor CO (ppm)",
          },
        });

      
        res.json(logs); // Return the logs as JSON
      } catch (error) {
        res.status(500).send("Error retrieving logs");
      }
    });

    
    const getLogsForDateRange = async (mid, startDate, endDate) => {
      const collection = mongoose.connection.db.collection("air_quality_data");
      console.log(startDate, endDate)
      // Query to get logs within the date range sorted by timestamp descending
      const logs = await collection
        .find({mid: mid, timestamp: { $gte: startDate, $lte: endDate } }) // Filter logs within range
        .sort({ timestamp: -1 }) // Sort by timestamp descending
        .toArray();
    
      return logs;
    };

    
    //DEVICE_001
    app.get("/aqi-last-log", async (req, res) => {
      try {
        const logs = await getLastLog();
        return sendSuccessResponse(res, `Logs fetched successfully`, {
          data: logs,
          columns: {
            mid: "Device ID",
            timestamp: "Timestamp",
            indoor_pm1: "Indoor PM 1 (μg/m3)",
            indoor_pm25: "Indoor PM 2.5 (μg/m3)",
            indoor_pm10: "Indoor PM 10 (μg/m3)",
            indoor_temp: "Indoor Temp (°C)",
            indoor_humidity: "Indoor Humidity (%)",
            indoor_tvoc: "Indoor TVOC (ppb)",
            indoor_co2: "Indoor CO2 (ppm)",
            indoor_hcho: "Indoor HCHO (mg/m3)",
            indoor_lux: "Indoor Light (Lux)",
            indoor_db: "Indoor Noise (db)",
            indoor_so2: "Indoor SO2 (mg/m3)",
            indoor_no: "Indoor NO (mg/m3)",
            indoor_no2: "Indoor NO2 (mg/m3)",
            indoor_o2: "Indoor O2 (mg/m3)",
            indoor_o3: "Indoor O3 (mg/m3)",
            indoor_nh3: "Indoor NH3 (mg/m3)",
            indoor_ch4: "Indoor CH4 (mg/m3)",
            indoor_co: "Indoor CO (ppm)",
            outdoor_pm1: "Outdoor PM 1 (μg/m3)",
            outdoor_pm25: "Outdoor PM 2.5 (μg/m3)",
            outdoor_pm10: "Outdoor PM 10 (μg/m3)",
            outdoor_temp: "Outdoor Temp (°C)",
            outdoor_humidity: "Outdoor Humidity (%)",
            outdoor_tvoc: "Outdoor TVOC (ppb)",
            outdoor_co2: "Outdoor CO2 (ppm)",
            outdoor_hcho: "Outdoor HCHO (mg/m3)",
            outdoor_lux: "Outdoor Light (Lux)",
            outdoor_db: "Outdoor Noise (db)",
            outdoor_so2: "Outdoor SO2 (mg/m3)",
            outdoor_no: "Outdoor NO (mg/m3)",
            outdoor_no2: "Outdoor NO2 (mg/m3)",
            outdoor_o2: "Outdoor O2 (mg/m3)",
            outdoor_o3: "Outdoor O3 (mg/m3)",
            outdoor_nh3: "Outdoor NH3 (mg/m3)",
            outdoor_ch4: "Outdoor CH4 (mg/m3)",
            outdoor_co: "Outdoor CO (ppm)",
          },
        });
        res.json(logs); // Return the logs as JSON
      } catch (error) {
        res.status(500).send("Error retrieving logs");
      }
    });

    const getLogsForLastThreeYears = async (fromDate) => {
      const collection = mongoose.connection.db.collection("air_quality_data");

      // Query to get the last 100 logs sorted by timestamp -1 (descending)
      const logs = await collection
        .find({ timestamp: { $gte: fromDate } }) // Sort by timestamp descending
        .toArray();

      return logs;
    };

    app.get("/aqi-logs-excel/get/excel", async (req, res) => {
      try {
        const { mid, start, end } = req.query;
    
        if (!mid || !start || !end) {
          return res.status(400).json({ error: "Start and End date are required" });
        }
    
        const startDate = new Date(start);
        const endDate = new Date(end);
    
        if (isNaN(startDate) || isNaN(endDate)) {
          return res.status(400).json({ error: "Invalid date format" });
        }
        console.log(mid, 'mid')
    
        const logs = await getLogsForDateRange(mid, startDate, endDate);
    
        if (!logs.length) {
          return res.status(404).json({ message: "No data found for the selected range" });
        }
    
        // Create a new Excel Workbook
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("AQI Logs");
    
        // Define headers
        worksheet.columns = [
          { header: "Monitor ID", key: "mid", width: 15 },
          { header: "Timestamp", key: "timestamp", width: 20 },
          { header: "Indoor Humidity (%)", key: "indoor_humidity", width: 20 },
          { header: "Outdoor Humidity (%)", key: "outdoor_humidity", width: 20 },
          { header: "Indoor Temp (°C)", key: "indoor_temp", width: 20 },
          { header: "Outdoor Temp (°C)", key: "outdoor_temp", width: 20 },
          { header: "Indoor PM 2.5 (μg/m3)", key: "indoor_pm25", width: 20 },
          { header: "Outdoor PM 2.5 (μg/m3)", key: "outdoor_pm25", width: 20 },
          { header: "Indoor CO2 (ppm)", key: "indoor_co2", width: 20 },
          { header: "Outdoor CO2 (ppm)", key: "outdoor_co2", width: 20 },
          { header: "Indoor TVOC (ppb)", key: "indoor_tvoc", width: 20 },
          { header: "Outdoor TVOC (ppb)", key: "outdoor_tvoc", width: 20 },
          { header: "Indoor HCHO (mg/m3)", key: "indoor_hcho", width: 20 },
          { header: "Outdoor HCHO (mg/m3)", key: "outdoor_hcho", width: 20 },
        ];
    
        // Add data to worksheet
        logs.forEach((log) => {
          worksheet.addRow(log);
        });
    
        // Set response headers
        res.setHeader(
          "Content-Type",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=aqi_logs_${start}_${end}.xlsx`
        );
    
        // Send workbook as response
        await workbook.xlsx.write(res);
        res.end();
      } catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(500).json({ error: "Internal Server Error" });
      }
    });
    
    // Define the GET API to return logs for subscription
    app.get(
      "/aqi-logs-subscription/:email/:api_key/:machine_id/:start_date/:end_date",
      async (req, res) => {
        try {
          const { email, api_key, machine_id, start_date, end_date } =
            req.params;
          const subscription = await Subscription.findOne({
            subscriberEmail: email,
          });
          if (!subscription) {
            return sendErrorResponse(
              res,
              "There is no email id registered for API Subscription",
              null,
              400
            );
          }
          if (subscription.apiKey !== api_key) {
            return sendErrorResponse(res, "Invalid API Key", null, 400);
          }

          const logs = await getLogsFilteredAll(start_date, end_date);
          const indoor_avg = calculateAverages(logs, "indoor_air_quality");
          const outdoor_avg = calculateAverages(logs, "oudoor_air_quality");
          return sendSuccessResponse(res, `Logs fetched successfully`, {
            data: logs,
            indoor_avg,
            outdoor_avg,
            columns: {
              mid: "Device ID",
              timestamp: "Timestamp",
              indoor_pm25: "Indoor PM 2.5 (μg/m3)",
              indoor_pm10: "Indoor PM 10 (μg/m3)",
              indoor_tvoc: "Indoor TVOC (ppb)",
              indoor_co: "Indoor CO (ppm)",
              indoor_co2: "Indoor CO2 (ppm)",
              indoor_humidity: "Indoor Humidity (%)",
              indoor_temp: "Indoor Temp (°C)",
              indoor_hcho: "Indoor HCHO (mg/m3)",
              indoor_so2: "Indoor SO2 (mg/m3)",
              indoor_no: "Indoor NO (mg/m3)",
              indoor_no2: "Indoor NO2 (mg/m3)",
              indoor_o2: "Indoor O2 (mg/m3)",
              indoor_o3: "Indoor O3 (mg/m3)",
              indoor_nh3: "Indoor NH3 (mg/m3)",
              indoor_ch4: "Indoor CH4 (mg/m3)",
              outdoor_pm25: "Outdoor PM 2.5 (μg/m3)",
              outdoor_pm10: "Outdoor PM 10 (μg/m3)",
              outdoor_tvoc: "Outdoor TVOC (ppb)",
              outdoor_co: "Outdoor CO (ppm)",
              outdoor_co2: "Outdoor CO2 (ppm)",
              outdoor_humidity: "Outdoor Humidity (%)",
              outdoor_temp: "Outdoor Temp (°C)",
              outdoor_hcho: "Outdoor HCHO (mg/m3)",
              outdoor_so2: "Outdoor SO2 (mg/m3)",
              outdoor_no: "Outdoor NO (mg/m3)",
              outdoor_no2: "Outdoor NO2 (mg/m3)",
              outdoor_o2: "Outdoor O2 (mg/m3)",
              outdoor_o3: "Outdoor O3 (mg/m3)",
              outdoor_nh3: "Outdoor NH3 (mg/m3)",
              outdoor_ch4: "Outdoor CH4 (mg/m3)",
            },
          });
          res.json(logs); // Return the logs as JSON
        } catch (error) {
          console.log(error);
          res.status(500).send("Error retrieving logs");
        }
      }
    );

    // Unified API Endpoint
    app.get("/dashboard-data", async (req, res) => {
      try {
        // Devices onboarded monthly
        const devicesOnboarded = await AirQualityDevice.aggregate([
          {
            $group: {
              _id: { $month: "$createdAt" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        // Devices by customers
        const devicesByCustomers = await AirQualityDevice.aggregate([
          {
            $group: {
              _id: "$customerId",
              count: { $sum: 1 },
            },
          },
          {
            $lookup: {
              from: "customers", // MongoDB collection name
              localField: "_id",
              foreignField: "customerId",
              as: "customerDetails",
            },
          },
          {
            $project: {
              customerId: "$_id",
              count: 1,
              customerName: { $arrayElemAt: ["$customerDetails.name", 0] },
            },
          },
        ]);

        // Devices by location
        const devicesByLocations = await AirQualityDevice.aggregate([
          {
            $group: {
              _id: "$locationName",
              count: { $sum: 1 },
            },
          },
          { $sort: { count: -1 } },
        ]);

        // Customers onboarded monthly
        const customersOnboarded = await Customer.aggregate([
          {
            $group: {
              _id: { $month: "$createdAt" },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]);

        // All activities
        const devices = await AirQualityDevice.find().sort({ createdAt: -1 });
        const customers = await Customer.find().sort({ createdAt: -1 });
        const subscriptions = await Subscription.find().sort({ createdAt: -1 });
        const dashboards = await Dashboard.find().sort({ createdAt: -1 });

        // Send consolidated data
        res.json({
          devicesOnboarded,
          devicesByCustomers,
          devicesByLocations,
          customersOnboarded,
          activities: {
            devices,
            customers,
            subscriptions,
            dashboards,
          },
        });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error fetching dashboard data." });
      }
    });

    app.post("/upload", upload.array("files"), async (req, res) => {
      try {
        const filePromises = req.files.map((file) => {
          const thumbnailPath = path.join(
            thumbnailFolder,
            `thumb-${path.basename(file.filename)}`
          );

          return sharp(file.path)
            .resize(200) // Generate thumbnail with a width of 200px
            .toFile(thumbnailPath);
        });

        await Promise.all(filePromises);
        res
          .status(200)
          .send({ message: "Files uploaded and thumbnails created!" });
      } catch (error) {
        console.error("Error processing files", error);
        res.status(500).send({ message: "Error processing files" });
      }
    });

    // API to get list of files and thumbnails
    app.get("/files", (req, res) => {
      const files = fs.readdirSync(uploadFolder).map((file) => ({
        fileName: file,
        thumbnail: `/thumbnails/thumb-${file}`,
      }));
      res.status(200).send(files);
    });

    // Serve thumbnails and files statically
    app.use("/uploads", express.static(uploadFolder));
    app.use("/default", express.static(defaultFolder));
    app.use("/thumbnails", express.static(thumbnailFolder));

    // API to download a file
    app.get("/download/:fileName", (req, res) => {
      const filePath = path.join(uploadFolder, req.params.fileName);
      if (fs.existsSync(filePath)) {
        res.download(filePath);
      } else {
        res.status(404).send({ message: "File not found" });
      }
    });
    
    app.post("/login", async (req, res) => {
      const { email, password } = req.body;
      const modelName = "Customer"; // You can adjust this based on your model/entity name

      try {
        // Check if the request has both email and password
        if (!email || !password) {
          return sendErrorResponse(
            res,
            "Email and password are required",
            null,
            400
          );
        }

        // Check if the email and password match with admin credentials
        if (
          email === process.env.ADMIN_EMAIL &&
          password === process.env.ADMIN_PASSWORD
        ) {
          return sendSuccessResponse(res, "Login successful (Super Admin)", {
            role: "admin",
          });
        }

        // Check if email exists in the customers collection
        const customer = await Customer.findOne({ email });
        if (!customer) {
          return sendErrorResponse(
            res,
            "No Email registered like that",
            null,
            401
          );
        }

        // Compare the entered password with the stored (hashed) customer password
        const isMatch = password === customer.password; // Use a password hashing method like bcrypt here
        if (!isMatch) {
          return sendErrorResponse(res, "Invalid password", null, 401);
        }

        // If passwords match, return success response
        return sendSuccessResponse(res, "Login successful", {
          user: customer,
          role: "customer",
        });
      } catch (error) {
        console.error("Login error:", error);
        return sendErrorResponse(
          res,
          `Failed to login ${modelName}`,
          error,
          500
        );
      }
    });

    app.use((req, res, next) => {
      sendErrorResponse(
        res,
        "Route not found!",
        (error = {}),
        (status_code = 404)
      );
    });



    // Error handling middleware
    app.use((err, req, res, next) => {
      logger.error(err.stack);
      sendErrorResponse(res, "Some error occurred!");
    });

    // Start the server

    console.log("Connected DB", port);
    app.listen(port, () => {
      logger.info(`Server is running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });
