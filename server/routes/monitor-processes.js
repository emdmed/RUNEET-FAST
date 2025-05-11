const express = require("express");
const net = require("net");
const { exec } = require("child_process");
const path = require("path");

const router = express.Router();

// Function to check if a port is available
const isPortAvailable = async (port) => {
    return new Promise((resolve) => {
        const server = net.createServer();
        
        server.once("error", (err) => {
            if (err.code === "EADDRINUSE") {
                resolve(false); // Port is in use
            } else {
                console.error(`Error checking port ${port}:`, err.message);
                resolve(false); // Assume port is unavailable on error
            }
        });
        
        server.once("listening", () => {
            server.close(() => resolve(true)); // Port is available
        });
        
        server.listen(port);
    });
};

// Function to find which process is using a specific port
const getProcessForPort = async (port) => {
    return new Promise((resolve) => {
        let cmd;
        
        try {
            if (process.platform === 'win32') {
                // Windows command to find process on port
                cmd = `netstat -ano | findstr :${port}`;
            } else {
                // Linux/Mac command to find process on port (more detailed output)
                cmd = `lsof -i :${port} -P -n`;
            }
            
            exec(cmd, (error, stdout, stderr) => {
                if (error || !stdout.trim()) {
                    resolve({ found: false });
                    return;
                }
                
                let pid = null;
                
                try {
                    // Parse the output based on platform
                    if (process.platform === 'win32') {
                        // Windows: Extract PID from the last column of netstat output
                        const lines = stdout.trim().split('\n');
                        for (const line of lines) {
                            if (line.includes(`:${port}`)) {
                                const parts = line.trim().split(/\s+/);
                                pid = parts[parts.length - 1];
                                break;
                            }
                        }
                    } else {
                        // Linux/Mac: Extract PID from the second column of lsof output
                        // Skip the header line
                        const lines = stdout.trim().split('\n');
                        if (lines.length > 1) {
                            // Skip header if present
                            const dataLine = lines[lines[0].startsWith('COMMAND') ? 1 : 0]; 
                            if (dataLine) {
                                const parts = dataLine.trim().split(/\s+/);
                                if (parts.length >= 2) {
                                    pid = parts[1];
                                    
                                    // If we can extract command from lsof output directly
                                    const command = parts[0];
                                    if (command) {
                                        resolve({ 
                                            found: true,
                                            pid, 
                                            command 
                                        });
                                        return;
                                    }
                                }
                            }
                        }
                    }
                    
                    // If we couldn't extract or there was no PID found
                    if (!pid) {
                        resolve({ found: false });
                        return;
                    }
                    
                    // Get more details about the process using its PID
                    const cmdForProcess = process.platform === 'win32'
                        ? `tasklist /fi "PID eq ${pid}" /fo list`
                        : `ps -p ${pid} -o command=`;
                    
                    exec(cmdForProcess, (err, output, stderr) => {
                        if (err || !output.trim()) {
                            resolve({ found: true, pid, command: null });
                            return;
                        }
                        
                        let command = output.trim();
                        
                        // For Windows, extract the command name from the output
                        if (process.platform === 'win32') {
                            const match = output.match(/Image Name:\s+(.+)/i);
                            if (match && match[1]) {
                                command = match[1].trim();
                            }
                        }
                        
                        resolve({ found: true, pid, command });
                    });
                } catch (e) {
                    console.error('Error parsing process output:', e);
                    resolve({ found: false });
                }
            });
        } catch (e) {
            console.error('Exception in getProcessForPort:', e);
            resolve({ found: false });
        }
    });
};

// Function to check if a specific process is running
const isSpecificProcessRunning = async (scriptName, projectPath) => {
    if (!scriptName) return { running: false };
    
    return new Promise((resolve) => {
        try {
            // We need a more specific check than just the process name
            // For npm processes, we need to check if it's running in the specific project directory
            
            let cmd;
            if (process.platform === 'win32') {
                // Windows command - more specific with additional filters
                cmd = `wmic process where "commandline like '%${scriptName}%' and commandline like '%${projectPath.replace(/\\/g, '\\\\')}%'" get processid`;
            } else {
                // Linux/Mac command - use ps with specific grep patterns
                // Look for processes that include both the script name and project path
                cmd = `ps aux | grep "${scriptName}" | grep "${projectPath}" | grep -v grep`;
            }
            
            exec(cmd, (error, stdout, stderr) => {
                if (error || !stdout.trim()) {
                    resolve({ running: false });
                    return;
                }
                
                // Process found running with both the script name and in the correct directory
                resolve({ 
                    running: true, 
                    details: stdout.trim() 
                });
            });
        } catch (e) {
            console.error('Error checking specific process:', e);
            resolve({ running: false });
        }
    });
};

// Check-status route to determine if scripts are running
router.post("/check-status", async (req, res) => {
    try {
        // Store original request to preserve structure
        const originalRequest = req.body;
        
        // Handle both single project and multiple projects
        const projects = Array.isArray(originalRequest) ? originalRequest : [originalRequest];
        
        if (!projects.length) {
            return res.status(400).json({ error: "No projects provided" });
        }
        
        // Create a deep clone of the projects to avoid modifying the original
        const clonedProjects = JSON.parse(JSON.stringify(projects));
        
        // Process each project
        for (const project of clonedProjects) {
            const { scripts, projectName, id } = project;
            
            if (!scripts || !scripts.length) {
                console.log(`Project ${projectName} has no scripts`);
                continue;
            }
            
            // Process each script in the project
            for (const scriptObj of scripts) {
                const { 
                    script, 
                    absolutePath, 
                    port, 
                    name, 
                    id: scriptId, 
                    type 
                } = scriptObj;
                
                try {
                    // Initialize status tracking
                    let isPortInUse = false;
                    let portProcess = null;
                    let isScriptRunning = false;
                    let scriptProcess = null;
                    
                    // Check if the script and absolutePath are provided
                    if (!script || !absolutePath) {
                        console.log(`Missing script or absolutePath for ${name}`);
                        scriptObj.isRunning = false;
                        continue;
                    }
                    
                    // 1. Check if the specific script is running in the project directory
                    // Extract meaningful pieces from the script command
                    const scriptParts = script.split(' ');
                    const baseCommand = scriptParts[0]; // e.g., "npm"
                    const scriptCommand = scriptParts.length > 2 ? scriptParts[2] : ''; // e.g., "dev"
                    
                    // Normalize the path for the current OS
                    const normalizedPath = path.normalize(absolutePath);
                    
                    // For npm scripts, we check for both npm and the script name (like "dev")
                    // in the project directory
                    if (baseCommand === 'npm' && scriptCommand) {
                        const processCheck = await isSpecificProcessRunning(scriptCommand, normalizedPath);
                        isScriptRunning = processCheck.running;
                        scriptProcess = processCheck.details;
                    } else {
                        // For other scripts, check the base command in the project directory
                        const processCheck = await isSpecificProcessRunning(baseCommand, normalizedPath);
                        isScriptRunning = processCheck.running;
                        scriptProcess = processCheck.details;
                    }
                    
                    // 2. Check if the port is in use (this is supplementary info)
                    if (port) {
                        isPortInUse = !(await isPortAvailable(port));
                        
                        // If port is in use, get details about the process using it
                        if (isPortInUse) {
                            portProcess = await getProcessForPort(port);
                        }
                    }
                    
                    // Determine the running status:
                    // A script is only considered running if the script process is found
                    // running in the specific project directory
                    scriptObj.isRunning = isScriptRunning;
                    
                    // Add port status debugging information to the console
/*                     console.log(`Project: ${projectName}, Script: ${name} (${type})`);
                    console.log(`  Script running in correct path: ${isScriptRunning ? 'YES' : 'NO'}`);
                    console.log(`  Port ${port}: ${isPortInUse ? 'in use' : 'free'}${portProcess?.pid ? ` (PID: ${portProcess.pid})` : ''}`);
                    console.log(`  Status: ${scriptObj.isRunning ? 'RUNNING' : 'NOT RUNNING'}`); */
                    
                } catch (checkError) {
                    console.error(`Failed to check status for project ${projectName}, script ${name}:`, checkError);
                    // On error, set isRunning to false but don't modify other properties
                    scriptObj.isRunning = false;
                }
            }
        }

        // Return the projects with updated isRunning flags, matching the original input format
        return res.json(Array.isArray(originalRequest) ? clonedProjects : clonedProjects[0]);
        
    } catch (error) {
        console.error("Unexpected error in check-status:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

module.exports = router;