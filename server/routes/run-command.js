const express = require("express");
const { spawn } = require("child_process");
const { access } = require("fs/promises");
const { exec } = require("child_process");
const { promisify } = require("util");
const net = require("net");
const os = require("os");

const router = express.Router();
const execAsync = promisify(exec);

const findIsPortAvailable = async (port) => {
    return new Promise((resolve) => {
        const server = net.createServer();

        server.once("error", (err) => {
            if (err.code === "EADDRINUSE") {
                resolve(false);
            } else {
                resolve(false);
            }
        });

        server.once("listening", () => {
            server.close(() => resolve(true));
        });

        server.listen(port);
    });
};

// Function to determine the best terminal emulator available
const findAvailableTerminal = async () => {
    const possibleTerminals = ["gnome-terminal", "konsole", "xfce4-terminal", "xterm"];
    let terminal = "x-terminal-emulator"; // Default fallback
    
    for (const term of possibleTerminals) {
        try {
            await execAsync(`which ${term}`);
            terminal = term;
            break;
        } catch (err) {
            console.log(`Terminal ${term} not found, checking next...`);
        }
    }
    
    return terminal;
};

router.post("/run-commands", async (req, res) => {
    try {
        const { projectName, id, scriptCount, scripts } = req.body;
        
        if (!scripts || !Array.isArray(scripts) || scripts.length === 0) {
            return res.status(400).json({ error: "Valid scripts array is required" });
        }
        
        // Validate and prepare each script
        const results = [];
        const terminal = await findAvailableTerminal();
        
        for (const script of scripts) {
            const { name, absolutePath, script: command, id: scriptId } = script;
            
            // Validate path
            try {
                await access(absolutePath);
            } catch (err) {
                results.push({
                    id: scriptId,
                    name,
                    success: false,
                    error: "Invalid or inaccessible path",
                });
                continue;
            }
            
            // Execute the command in a new terminal
            try {
                // For Ubuntu Linux
                const execCommand = `${terminal} -- bash -c "cd '${absolutePath}' && ${command}; exec bash"`;
                
                console.log(`Executing [${name}]:`, execCommand);
                
                const childProcess = spawn(execCommand, {
                    shell: true,
                    stdio: "inherit",
                    env: { ...process.env, DISPLAY: ":0" },
                    detached: true // Allow the process to run independently
                });
                
                results.push({
                    id: scriptId,
                    name,
                    success: true,
                    processId: childProcess.pid,
                    executedCommand: command,
                    executedPath: absolutePath,
                });
                
                // Unref to let the parent process exit independently
                childProcess.unref();
                
            } catch (err) {
                console.error(`Error executing script [${name}]:`, err);
                results.push({
                    id: scriptId,
                    name,
                    success: false,
                    error: err.message,
                });
            }
        }
        
        return res.json({
            message: `Executed ${results.filter(r => r.success).length} out of ${scripts.length} scripts successfully`,
            projectName,
            projectId: id,
            results
        });
    } catch (error) {
        console.error("Unexpected error:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

// Updated to use the same request body format as run-commands
router.post("/run-command", async (req, res) => {
    try {
        const { projectName, id, scripts } = req.body;
        
        // Handle both old and new request body formats
        if (scripts && Array.isArray(scripts) && scripts.length > 0) {
            // Use only the first script in the array
            const script = scripts[0];
            const { name, absolutePath: path, script: command, id: scriptId } = script;
            
            if (!path) {
                return res.status(400).json({ error: "Path is required" });
            }
            
            try {
                await access(path);
            } catch (err) {
                console.log("Path error", err);
                return res.status(400).json({ 
                    error: "Invalid or inaccessible path",
                    id: scriptId,
                    name,
                    success: false
                });
            }
            
            const terminal = await findAvailableTerminal();
            const execCommand = `${terminal} -- bash -c "cd '${path}' && ${command}; exec bash"`;
            
            console.log(`Executing [${name}]:`, execCommand);
            
            const childProcess = spawn(execCommand, {
                shell: true,
                stdio: "inherit",
                env: { ...process.env, DISPLAY: ":0" },
                detached: true
            });

            console.log("childProcess", childProcess)
            
            childProcess.unref();
            
            return res.json({
                message: "Command executed successfully",
                name,
                id: scriptId,
                success: true,
                executedCommand: command,
                executedPath: path,
                processId: childProcess.pid,
                projectName,
                projectId: id
            });
        } else {
            // Support old format
            const { command = "npm run dev", path, port } = req.body;
            
            if (!path) {
                return res.status(400).json({ error: "Path is required" });
            }
            
            try {
                await access(path);
            } catch (err) {
                console.log("Path error", err);
                return res.status(400).json({ error: "Invalid or inaccessible path" });
            }
            
            if (port) {
                try {
                    const isPortAvailable = await findIsPortAvailable(port);
                    if (!isPortAvailable) {
                        return res.status(404).json({ error: "Port is in use", isPortUnavailable: true });
                    }
                } catch (err) {
                    console.log("Port check error", err);
                    return res.status(500).json({ error: "Error while checking port" });
                }
            }
            
            const terminal = await findAvailableTerminal();
            const execCommand = `${terminal} -- bash -c "cd '${path}' && ${command}; exec bash"`;
            
            console.log("Executing:", execCommand);
            
            const childProcess = spawn(execCommand, {
                shell: true,
                stdio: "inherit",
                env: { ...process.env, DISPLAY: ":0" },
                detached: true
            });
            
            childProcess.unref();
            
            return res.json({
                message: "Command executed successfully",
                executedCommand: command,
                executedPath: path,
                processId: childProcess.pid,
            });
        }
    } catch (error) {
        console.error("Unexpected error:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;