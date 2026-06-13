import fs from "fs";
import path from "path";
import { resolveFrameworkDir } from "../../utils/security.js";
import { ToolArgs, ToolResult } from "../types.js";

/**
 * Extracts key insights from the project memory to minimize token usage.
 * Returns only the active phase, trace, and the last 5 decisions/tasks.
 */
export function handleGetMemoryInsights(projectRoot: string, _args: ToolArgs): ToolResult {
    try {
        const frameworkDir = resolveFrameworkDir(projectRoot);
        const memoryPath = path.join(projectRoot, frameworkDir, "memory/PROJECT_MEMORY.md");

        if (!fs.existsSync(memoryPath)) {
            return { content: [{ type: "text", text: "New project: No history available." }] };
        }

        const content = fs.readFileSync(memoryPath, "utf8");
        const lines = content.split("\n");
        
        const activePhase = lines.find(l => l.includes("**Phase:**"))?.split("**Phase:**")[1]?.trim() || "Unknown";
        const activeTrace = lines.find(l => l.includes("**Trace ID:**"))?.split("**Trace ID:**")[1]?.trim() || "None";
        
        // Find the last 5 history items (heuristic)
        const historyStartIndex = lines.findIndex(l => l.toUpperCase().includes("HISTORY"));
        let recentHistory = "No history found.";
        if (historyStartIndex !== -1) {
            recentHistory = lines.slice(historyStartIndex + 1)
                .filter(l => l.trim().startsWith("-"))
                .slice(-5)
                .join("\n");
        }

        const insights = `🧠 **Memory Insights**\n- **Phase:** ${activePhase}\n- **Trace:** ${activeTrace}\n\n**Recent Actions:**\n${recentHistory}`;
        
        return { content: [{ type: "text", text: insights }] };
    } catch (e) {
        return { isError: true, content: [{ type: "text", text: `Failed to extract insights: ${String(e)}` }] };
    }
}
