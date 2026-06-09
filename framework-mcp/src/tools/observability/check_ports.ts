import { execSync } from "child_process";
import { CheckActivePortsArgs, ToolResult } from "../types.js";

/**
 * Checks for active network ports and their status.
 */
export function handleCheckPorts(projectRoot: string, args: CheckActivePortsArgs): ToolResult {
    const filter = args.filter || ""; // Optional filter (e.g., ":3000")

    try {
        // Using 'lsof -i -P -n' to list open files and network connections
        // Note: may require permissions or behave differently on non-Unix systems
        const command = process.platform === "win32"
            ? `netstat -ano | findstr LISTENING ${filter ? `| findstr ${filter}` : ""}`
            : `lsof -i -P -n | grep LISTEN ${filter ? `| grep ${filter}` : ""}`;

        const output = execSync(command, { encoding: "utf8" });

        return {
            content: [{
                type: "text",
                text: `📡 **Active Listening Ports:**\n\n${output || "No active listening ports found matching filter."}`
            }]
        };
    } catch (_e) {
        return {
            content: [{ type: "text", text: "ℹ️ No active ports found or command failed (this is normal if nothing is listening)." }]
        };
    }
}
