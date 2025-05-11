const express = require("express");
const { spawn } = require("child_process");
const { access, writeFile } = require("fs/promises");
const { exec } = require("child_process");
const { promisify } = require("util");
const net = require("net");
const os = require("os");
const fs = require("fs");
const path = require("path");

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

router.post("/run-command", async (req, res) => {
    try {
        // Extract data from the new payload structure
        const { scripts, projectName, id } = req.body;
        
        if (!scripts || !scripts.length) {
            return res.status(400).json({ error: "No scripts provided" });
        }
        
        // Results to track all executed processes
        const executionResults = [];
        
        // Process each script in the array
        for (const scriptObj of scripts) {
            const { script, absolutePath, port, name, id: scriptId } = scriptObj;
            
            if (!absolutePath) {
                return res.status(400).json({ 
                    error: `Path is required for script: ${name || scriptId}` 
                });
            }

            try {
                await access(absolutePath);
            } catch (err) {
                console.log(`Path error for script ${name}:`, err);
                return res.status(400).json({ 
                    error: `Invalid or inaccessible path for script: ${name || scriptId}` 
                });
            }

            if (port) {
                try {
                    const isPortAvailable = await findIsPortAvailable(port);
                    if (!isPortAvailable) {
                        return res.status(404).json({ 
                            error: `Port ${port} is in use for script: ${name || scriptId}`, 
                            isPortUnavailable: true 
                        });
                    }
                } catch (err) {
                    console.log(`Port check error for script ${name}:`, err);
                    return res.status(500).json({ 
                        error: `Error while checking port for script: ${name || scriptId}` 
                    });
                }
            }

            try {
                // Determine default shell
                let shell = "bash";
                try {
                    await execAsync(`which zsh`);
                    shell = "zsh";
                    console.log("Using zsh shell");
                } catch (shellErr) {
                    console.log("Zsh not found, using bash");
                }

                // Create a direct execution script that doesn't use dbus-launch
                const tempScriptPath = path.join(os.tmpdir(), `run_script_${Date.now()}.sh`);
                const scriptContent = `#!/bin/${shell}
# Disable Ubuntu's appmenu integration which can slow down terminal launch
export UBUNTU_MENUPROXY=0

# Run gnome-terminal directly, avoiding dbus-launch
# The & at the end ensures the script doesn't wait for gnome-terminal to exit
gnome-terminal --disable-factory -- ${shell} -c "cd \\"${absolutePath}\\" && ${script}; exec ${shell}" &

# Exit immediately so the HTTP response returns quickly
exit 0
`;
                
                await writeFile(tempScriptPath, scriptContent, { mode: 0o755 });
                console.log(`Created script at ${tempScriptPath}`);

                // Execute the script directly
                console.log(`Launching terminal directly with script: ${tempScriptPath}`);
                
                const { stdout, stderr } = await execAsync(`${tempScriptPath}`, {
                    env: { 
                        ...process.env, 
                        UBUNTU_MENUPROXY: "0",
                        LIBGL_ALWAYS_SOFTWARE: "1" 
                    }
                });
                
                if (stdout) console.log(`Script output: ${stdout}`);
                if (stderr) console.error(`Script error: ${stderr}`);
                
                // Add this execution to results
                executionResults.push({
                    scriptId: scriptId,
                    scriptName: name,
                    executedCommand: script,
                    executedPath: absolutePath,
                    terminalUsed: "gnome-terminal (direct launch)"
                });
                
                console.log(`Successfully launched script ${name} with direct terminal launch`);
                
            } catch (scriptError) {
                console.error(`Failed to execute script ${name}:`, scriptError);
                return res.status(500).json({
                    error: `Failed to execute script ${name}: ${scriptError.message}`
                });
            }
        }

        // Return results for all scripts
        return res.json({
            message: `Successfully executed ${executionResults.length} script(s)`,
            projectName,
            projectId: id,
            executedScripts: executionResults
        });
    } catch (error) {
        console.error("Unexpected error:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;