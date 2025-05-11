/* eslint-disable @typescript-eslint/no-require-imports */
const express = require("express");
const { exec } = require("child_process");
const { promisify } = require("util");
const os = require("os");
const path = require("path");

const router = express.Router();
const execAsync = promisify(exec);

async function getTerminalsAndCommands() {
    try {
        if (os.platform() === "win32") {
            const { stdout } = await execAsync(
                `powershell -Command "Get-WmiObject Win32_Process | Select-Object ProcessId,CommandLine,ExecutablePath,ParentProcessId | ConvertTo-Json"`
            );

            const processes = JSON.parse(stdout);
            const processList = Array.isArray(processes) ? processes : [processes];

            return processList
                .filter(proc => proc.ExecutablePath && proc.CommandLine)
                .map(proc => ({
                    pid: proc.ProcessId,
                    ppid: proc.ParentProcessId, // Parent process ID
                    command: proc.CommandLine || "Unknown",
                    path: proc.ExecutablePath,
                    cwd: "Unknown (Windows does not expose cwd easily)",
                }));
        } else {
            // For Unix-like systems, get all processes with their full command lines and parent PIDs
            const { stdout } = await execAsync(`ps -eo pid,ppid,args`);
            
            if (!stdout.trim()) {
                console.log("No active processes found.");
                return [];
            }

            const lines = stdout.split("\n").slice(1); // Skip header line
            const processInfo = await Promise.all(
                lines.map(async (line) => {
                    const trimmed = line.trim();
                    if (!trimmed) return null;
                    
                    // First column is PID, second is PPID, rest is command with args
                    const parts = trimmed.split(/\s+/);
                    const pid = parts[0];
                    const ppid = parts[1];
                    const command = parts.slice(2).join(" ");
                    
                    try {
                        // Try to get the working directory 
                        const { stdout: cwd } = await execAsync(`readlink /proc/${pid}/cwd`);
                        return { 
                            pid, 
                            ppid,
                            command, 
                            cwd: cwd.trim(), 
                            path: cwd.trim() 
                        };
                    } catch (error) {
                        // Process might have ended or no permission
                        return { 
                            pid, 
                            ppid,
                            command, 
                            cwd: null, 
                            path: null 
                        };
                    }
                })
            );

            return processInfo.filter(Boolean);
        }
    } catch (error) {
        console.error("Error fetching process details:", error.message);
        return [];
    }
}

// Find and kill processes by matching both absolute path and script command
// Also terminates the parent terminal process
async function killProcessByPathAndCommand(absolutePath, scriptCommand) {
    const allProcesses = await getTerminalsAndCommands();
    
    // Normalize the paths and commands for comparison
    const normalizedPath = path.normalize(absolutePath);
    const normalizedScriptCmd = scriptCommand.trim();
    
    // Find matching processes by path AND command pattern
    const matchingProcesses = allProcesses.filter(process => {
        // Match by working directory path
        const pathMatches = process.cwd && path.normalize(process.cwd) === normalizedPath;
        
        // Match by command (check if the command contains the script)
        const commandMatches = process.command && 
                              (process.command.includes(normalizedScriptCmd) || 
                               normalizedScriptCmd.includes(process.command));
        
        return pathMatches && commandMatches;
    });

    if (!matchingProcesses.length) {
        throw new Error(`No active process found for ${normalizedScriptCmd} in ${normalizedPath}`);
    }

    // Collect parent terminal processes to kill
    const parentPIDs = new Set();
    const killedPids = [];
    
    // First identify the main processes and their parent terminals
    for (const proc of matchingProcesses) {
        killedPids.push(proc.pid);
        
        // Find the terminal process (parent or grandparent)
        if (proc.ppid) {
            parentPIDs.add(proc.ppid);
            
            // Find potential terminal emulator grandparents
            const grandparent = allProcesses.find(p => p.pid === proc.ppid);
            if (grandparent && grandparent.ppid && isLikelyTerminal(grandparent.command)) {
                parentPIDs.add(grandparent.ppid);
            }
        }
    }
    
    // Kill script processes first
    for (const pid of killedPids) {
        const killCommand = os.platform() === "win32"
            ? `taskkill /PID ${pid} /F`
            : `kill -9 ${pid} || true`;

        try {
            await execAsync(killCommand);
            console.log(`Killed process ${pid}`);
        } catch (error) {
            console.error(`Failed to kill process ${pid}: ${error.message}`);
        }
    }
    
    // Then kill parent terminal processes
    for (const ppid of parentPIDs) {
        // Check if this is actually a terminal-like process
        const parentProcess = allProcesses.find(p => p.pid === ppid);
        if (parentProcess && isLikelyTerminal(parentProcess.command)) {
            const killCommand = os.platform() === "win32"
                ? `taskkill /PID ${ppid} /F`
                : `kill -9 ${ppid} || true`;
                
            try {
                await execAsync(killCommand);
                console.log(`Killed parent terminal process ${ppid}`);
                killedPids.push(ppid);
            } catch (error) {
                console.error(`Failed to kill parent process ${ppid}: ${error.message}`);
            }
        }
    }
    
    return {
        scriptPids: killedPids,
        terminalPids: Array.from(parentPIDs)
    };
}

// Helper function to determine if a process is likely a terminal
function isLikelyTerminal(command) {
    const terminalKeywords = [
        'bash', 'zsh', 'sh', 'terminal', 'konsole', 'gnome-terminal', 
        'xterm', 'iTerm', 'cmd.exe', 'powershell', 'Command Prompt',
        'terminal.app', 'rxvt', 'terminator', 'alacritty', 'kitty',
        'conhost.exe', 'WindowsTerminal'
    ];
    
    return terminalKeywords.some(keyword => 
        command.toLowerCase().includes(keyword.toLowerCase()));
}

// Handle the new payload format supporting scripts array with additional metadata
router.post("/stop-scripts", async (req, res) => {
    try {
        const { projectName, id, scripts, scriptCount } = req.body;

        if (!id || !Array.isArray(scripts)) {
            return res.status(400).json({ error: "Invalid payload. Requires id and scripts array." });
        }

        // Process each script in the project for stopping only
        const results = [];
        for (const script of scripts) {
            try {
                // Only attempt to stop if path and script command are provided
                if (script.absolutePath && script.script) {
                    try {
                        // Check if script is marked as running in the payload
                        if (script.isRunning) {
                            const killResult = await killProcessByPathAndCommand(script.absolutePath, script.script);
                            results.push({
                                scriptId: script.id,
                                name: script.name,
                                type: script.type,
                                port: script.port,
                                script: script.script,
                                status: killResult.scriptPids.length > 0 ? "stopped" : "not_found",
                                killedPids: killResult.scriptPids,
                                killedTerminals: killResult.terminalPids
                            });
                        } else {
                            // Script is marked as not running in the payload
                            results.push({
                                scriptId: script.id,
                                name: script.name,
                                type: script.type,
                                port: script.port,
                                script: script.script,
                                status: "not_running"
                            });
                        }
                    } catch (error) {
                        if (error.message.includes("No active process found")) {
                            // Not an error, just not running
                            results.push({
                                scriptId: script.id,
                                name: script.name,
                                type: script.type,
                                port: script.port,
                                script: script.script,
                                status: "not_running"
                            });
                        } else {
                            throw error;
                        }
                    }
                } else {
                    results.push({
                        scriptId: script.id,
                        name: script.name,
                        type: script.type,
                        port: script.port,
                        script: script.script,
                        status: "skip_missing_info"
                    });
                }
            } catch (error) {
                results.push({
                    scriptId: script.id,
                    name: script.name,
                    type: script.type,
                    port: script.port,
                    script: script.script,
                    status: "error",
                    error: error.message
                });
            }
        }

        return res.json({
            projectId: id,
            projectName: projectName || "Unknown",
            scriptCount: scriptCount || scripts.length,
            results
        });
    } catch (error) {
        console.error("Error stopping project scripts:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

// Keep backward compatibility with the original endpoint
router.post("/kill-command", async (req, res) => {
    try {
        console.log("check body", req.body);
        const { absolutePath, script } = req.body;

        if (!absolutePath) {
            return res.status(400).json({ error: "Path is required" });
        }

        // If script is provided, use the new method
        if (script) {
            try {
                const killResult = await killProcessByPathAndCommand(absolutePath, script);
                return res.json({
                    message: `Terminated ${killResult.scriptPids.length} processes and ${killResult.terminalPids.length} terminal processes successfully`,
                    scriptPids: killResult.scriptPids,
                    terminalPids: killResult.terminalPids
                });
            } catch (err) {
                console.log(err);
                return res.status(404).json({ error: `No matching processes found: ${err.message}` });
            }
        } else {
            // Fall back to original method if no script is provided
            try {
                const pid = await killTerminalByPath(absolutePath);
                return res.json({
                    message: "Terminated successfully",
                    pid
                });
            } catch (err) {
                console.log(err);
                return res.status(500).json({ error: `Failed to close terminal: ${err.message}` });
            }
        }
    } catch (error) {
        console.error("Unexpected error:", error.message);
        return res.status(500).json({ error: error.message });
    }
});

// Keep the old function for backward compatibility
async function killTerminalByPath(path) {
    const activeTerminals = await getTerminalsAndCommands();
    const terminalToKill = activeTerminals.find(terminal => terminal.cwd === path);

    if (!terminalToKill) {
        throw new Error("No active terminal found for the given path");
    }

    const killCommand = os.platform() === "win32"
        ? `taskkill /PID ${terminalToKill.pid} /F`
        : `kill -9 ${terminalToKill.pid} || true`;

    await execAsync(killCommand);
    return terminalToKill.pid;
}

module.exports = router;