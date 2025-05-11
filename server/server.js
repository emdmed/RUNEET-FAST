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

// Define the allowed origin
const allowedOrigin = 'http://localhost:5173';

// CORS configuration with specific origin
const corsOptions = {
  origin: allowedOrigin, // Only allow the specific UI origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

// Enable pre-flight requests for all routes
app.options('*', cors(corsOptions));

// Apply CORS middleware with our options
app.use(cors(corsOptions));

// JSON parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging and additional CORS headers
app.use((req, res, next) => {
    //console.log(`${req.method} ${req.url}`);
    
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    
    // Handle OPTIONS requests directly
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

// Default route handler for any unmatched routes
app.use((req, res) => {
    res.header('Access-Control-Allow-Origin', allowedOrigin);
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    res.status(404).json({ message: "Not found" });
});

// Start the server
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`CORS is enabled for origin: ${allowedOrigin}`);
})