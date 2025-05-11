const express = require("express");
const cors = require("cors");
const findPackagesRoute = require("./routes/find-packages")
const killCommandRoute = require("./routes/kill-command")
const monitorProcessesRoute = require("./routes/monitor-processes")
const openEditorRoute = require("./routes/open-editor")
const runCommandRoute = require("./routes/run-command")
const switchBranchRoute = require("./routes/switch-branch")
const checkUpdates = require("./routes/check-updates")
const usedPorts = require("./routes/used-ports")

const app = express();

// Define the allowed origins
const allowedOrigins = [
  'http://localhost',
  'http://localhost:3000',
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
    // Allow requests with no origin
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Allow all origins for now - you can restrict this later
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Use the cors middleware
app.use(cors(corsOptions));

// JSON parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Additional CORS middleware
app.use((req, res, next) => {
    // Clear any existing CORS headers to avoid conflicts
    res.header('Access-Control-Allow-Origin', '');
    
    // Set the origin dynamically
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Max-Age', '86400');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    next();
});

// Routes
app.use("/api", findPackagesRoute)
app.use("/api", killCommandRoute)
app.use("/api", monitorProcessesRoute)
app.use("/api", openEditorRoute)
app.use("/api", runCommandRoute)
app.use("/api", switchBranchRoute)
app.use("/api", checkUpdates)
app.use("/api", usedPorts)

// Default route handler
app.use((req, res) => {
    const origin = req.headers.origin;
    if (origin) {
        res.header('Access-Control-Allow-Origin', origin);
    }
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    res.status(404).json({ message: "Not found" });
});

// Start the server
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
})