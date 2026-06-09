import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { StartDashboardArgs, ToolResult } from "../types.js";

/**
 * Starts the Enderun Web Dashboard server.
 */
export function handleStartDashboard(projectRoot: string, args: StartDashboardArgs): ToolResult {
    const port = args.port || 5858;
    const dashboardScript = path.join(projectRoot, "bin/enderun-dashboard.js");

    if (!fs.existsSync(dashboardScript)) {
        throw new Error("Dashboard server script not found in bin/enderun-dashboard.js");
    }

    try {
        // Start the dashboard as a background process
        exec(`node "${dashboardScript}"`, {
            cwd: projectRoot,
            env: { ...process.env, PORT: String(port) }
        });

        return {
            content: [{
                type: "text",
                text: `🖥️ **Enderun Web Dashboard started!**\n\nAccess it at: http://localhost:${port}\n\nThis interface will show real-time agent status, system health, and orchestration logs.`
            }]
        };
    } catch (e) {
        return { isError: true, content: [{ type: "text", text: `Failed to start dashboard: ${String(e)}` }] };
    }
}
