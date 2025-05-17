const express = require("express");
const cors = require("cors");
const findPackagesRoute = require("./routes/find-packages");
const killCommandRoute = require("./routes/kill-command");
const monitorProcessesRoute = require("./routes/monitor-processes");
const openEditorRoute = require("./routes/open-editor");
const runCommandRoute = require("./routes/run-command");
const switchBranchRoute = require("./routes/switch-branch");
const checkUpdates = require("./routes/check-updates");
const usedPorts = require("./routes/used-ports");

const app = express();

// Remove the previous CORS middleware
// Instead, use a simplified approach that just accepts all origins
const allowedOrigins = [
  'http://localhost',
  'http://localhost:5173',
  'tauri://localhost',
  'tauri://localhost/',
  'tauri://generated',
  'tauri://__',
  'tauri://127.0.0.1',
  'http://tauri.localhost'
];

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g. curl, Postman)
    if (!origin) return callback(null, true);
    callback(null, allowedOrigins.includes(origin));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

//Routes
app.use("/api", findPackagesRoute);
app.use("/api", killCommandRoute);
app.use("/api", monitorProcessesRoute);
app.use("/api", openEditorRoute);
app.use("/api", runCommandRoute);
app.use("/api", switchBranchRoute);
app.use("/api", checkUpdates);
app.use("/api", usedPorts);

// Start the server
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 5554;
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});