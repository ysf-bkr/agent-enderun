import fs from "fs";
import path from "path";
import { GrepSearchArgs, ToolResult } from "../types.js";
import { Metrics } from "../../utils/metrics.js";

/**
 * Searches for a regex pattern within files in the project.
 */
export function handleGrepSearch(projectRoot: string, args: GrepSearchArgs): ToolResult {
    const pattern = args.pattern as string;
    const includePattern = args.includePattern as string || ""; // e.g., ".ts"
    const excludePattern = args.excludePattern as string || "node_modules";

    if (!pattern) {
        const err = "Search pattern is required.";
        Metrics.logError(projectRoot, "@mcp", "grep_search", err);
        return { isError: true, content: [{ type: "text", text: `❌ ${err}` }] };
    }

    const results: string[] = [];
    try {
        new RegExp(pattern);
    } catch (e) {
        const err = `Invalid regex pattern: ${String(e)}`;
        Metrics.logError(projectRoot, "@mcp", "grep_search", err);
        return { isError: true, content: [{ type: "text", text: `❌ ${err}` }] };
    }

    const walk = (dir: string) => {
        if (results.length > 100) return;
        try {
            const files = fs.readdirSync(dir);
            for (const file of files) {
                if (results.length > 100) return;
                const filePath = path.join(dir, file);
                if (excludePattern && filePath.includes(excludePattern)) {
                    continue;
                }
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    walk(filePath);
                } else if (stat.isFile()) {
                    if (includePattern && !filePath.endsWith(includePattern)) {
                        continue;
                    }
                    const content = fs.readFileSync(filePath, "utf8");
                    // Create a new regex object for each line to avoid state issues with /g
                    if (new RegExp(pattern).test(content)) {
                        if (results.length < 100) {
                            results.push(filePath);
                        }
                    }
                }
            }
        } catch {
            // Ignore directories that cannot be read
        }
    };
    try {
        walk(projectRoot);
    } catch (e) {
        const err = `Search failed: ${String(e)}`;
        Metrics.logError(projectRoot, "@mcp", "grep_search", err);
        return { isError: true, content: [{ type: "text", text: `❌ ${err}` }] };
    }

    return {
        content: [{
            type: "text",
            text: results.length > 0
                ? `Found ${results.length} matches:\n\n${results.join("\n")}`
                : "No matches found."
        }]
    };
}
