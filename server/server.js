// Enhanced server.js with script status tracking

const express = require("express");
const cors = require("cors");
const { access } = require("fs/promises");
const { spawn } = require("child_process");
const usedPortsRoute = require("./routes/used-ports")
const WebSocket = require("ws");

const app = express();
const router = express.Router();

// Track running processes with status information
var runningProcesses = {};

// Allowed origins for CORS
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

// Additional CORS headers for preflight etc
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

const wss = new WebSocket.Server({ port: 3002 });
console.log("WebSocket server listening on ws://localhost:3002");

// Handle WebSocket connections
wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      console.log("WebSocket message received:", data);

      if (data.type === "register" && data.scriptId) {
        ws.scriptId = data.scriptId;

        // Send initial status information when a client registers
        const scriptStatus = {
          type: "status",
          scriptId: data.scriptId,
          running: !!runningProcesses[data.scriptId],
          pid: runningProcesses[data.scriptId]?.process?.pid
        };

        ws.send(JSON.stringify(scriptStatus));
      }

      // Handle client requests for script status
      if (data.type === "requestStatus" && data.scriptId) {
        const scriptStatus = {
          type: "status",
          scriptId: data.scriptId,
          running: !!runningProcesses[data.scriptId],
          pid: runningProcesses[data.scriptId]?.process?.pid
        };

        ws.send(JSON.stringify(scriptStatus));
      }
    } catch (error) {
      console.error("Error processing WebSocket message:", error);
    }
  });

  // Send list of all running scripts when client connects
  const allRunningScripts = Object.keys(runningProcesses).map(id => ({
    scriptId: id,
    pid: runningProcesses[id].process.pid
  }));

  ws.send(JSON.stringify({
    type: "allRunningScripts",
    scripts: allRunningScripts
  }));
});

// Broadcast message to all clients subscribed to a specific script
function broadcastToScript(scriptId, message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.scriptId === scriptId) {
      client.send(JSON.stringify(message));
    }
  });
}

// Broadcast script status changes to all connected clients
function broadcastScriptStatus(scriptId, isRunning, pid = null) {
  const statusUpdate = {
    type: "status",
    scriptId,
    running: isRunning,
    pid
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      // Send to all clients - they can filter relevant scripts
      client.send(JSON.stringify(statusUpdate));
    }
  });
}

router.post("/run-script", async (req, res) => {
  const { id: scriptId, script, absolutePath } = req.body;

  if (!scriptId || !script || !absolutePath) {
    return res.status(400).json({ error: "scriptId, script, and absolutePath are required" });
  }

  try {
    await access(absolutePath);
  } catch (e) {
    return res.status(400).json({ error: "Invalid path" });
  }

  // Kill existing process if it exists
  if (runningProcesses[scriptId]) {
    try {
      runningProcesses[scriptId].process.kill();
    } catch (e) {
      console.error("Failed to kill existing process:", e);
    }
  }

  const proc = spawn(script, {
    cwd: absolutePath,
    shell: true,
    env: { ...process.env },
  });

  runningProcesses[scriptId] = {
    process: proc,
    startTime: new Date(),
    command: script
  };

  // Broadcast script started status
  broadcastScriptStatus(scriptId, true, proc.pid);

  proc.stdout.on("data", (data) => {
    console.log(`[${scriptId}] stdout:`, data.toString());
    broadcastToScript(scriptId, {
      type: "stdout",
      data: data.toString(),
    });
  });

  proc.stderr.on("data", (data) => {
    console.log(`[${scriptId}] stderr:`, data.toString());
    broadcastToScript(scriptId, {
      type: "stderr",
      data: data.toString(),
    });
  });

  proc.on("exit", (code) => {
    console.log(`[${scriptId}] Process exited with code ${code}`);
    broadcastToScript(scriptId, {
      type: "exit",
      code,
    });

    // Broadcast script stopped status
    broadcastScriptStatus(scriptId, false);

    // Remove from running processes
    delete runningProcesses[scriptId];
  });

  // Respond immediately with PID and scriptId
  res.json({ success: true, scriptId, pid: proc.pid });
});

// Add endpoint to kill a running script
router.post("/stop-script", (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ error: "scriptId is required" });
  }

  if (!runningProcesses[id]) {
    return res.status(404).json({ error: "No running process found with that ID" });
  }

  try {
    runningProcesses[id].process.kill();
    res.json({ success: true, message: "Process kill signal sent" });
  } catch (e) {
    res.status(500).json({ error: "Failed to kill process", details: e.message });
  }
});

// Add endpoint to get status of all running scripts
router.get("/running-scripts", (req, res) => {
  const scriptStatuses = {};

  Object.keys(runningProcesses).forEach(scriptId => {
    const proc = runningProcesses[scriptId];
    scriptStatuses[scriptId] = {
      running: true,
      pid: proc.process.pid,
      startTime: proc.startTime,
      command: proc.command
    };
  });

  res.json(scriptStatuses);
});

// Mount the router
app.use("/api", router);
app.use("/api", usedPortsRoute)

const PORT = 5554;
app.listen(PORT, () => {
  console.log(`HTTP server listening on http://localhost:${PORT}`);
});

module.exports = app;