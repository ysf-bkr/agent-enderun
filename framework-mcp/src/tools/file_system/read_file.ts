import fs from "fs";
import { safePath } from "../../utils/security.js";
import { ReadFileArgs, ToolResult } from "../types.js";
import { Metrics } from "../../utils/metrics.js";

export function handleReadFile(projectRoot: string, args: ReadFileArgs): ToolResult {
    if (!args.path) {
        const err = "Missing 'path' argument.";
        Metrics.logError(projectRoot, "@mcp", "read_file", err);
        return { isError: true, content: [{ type: "text", text: `❌ ${err}` }] };
    }

    try {
        const filePath = safePath(projectRoot, args.path);
        if (!fs.existsSync(filePath)) {
            const err = `File not found: ${args.path}`;
            Metrics.logError(projectRoot, "@mcp", "read_file", err);
            return { isError: true, content: [{ type: "text", text: `❌ ${err}` }] };
        }

        const startLine = args.startLine;
        const endLine = args.endLine;

        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split(/\r?\n/);
        
        if (startLine !== undefined || endLine !== undefined) {
            const start = startLine !== undefined ? Math.max(1, startLine) - 1 : 0;
            const end = endLine !== undefined ? Math.min(lines.length, endLine) : lines.length;
            const sliced = lines.slice(start, end).join("\n");
            const tokens = Metrics.estimateTokens(sliced);
            Metrics.logUsage(projectRoot, "@mcp", `read_file: ${args.path}`, tokens);
            return { content: [{ type: "text", text: sliced }] };
        }

        // Default protection limit: 1000 lines
        const DEFAULT_MAX_LINES = 1000;
        if (lines.length > DEFAULT_MAX_LINES) {
            const sliced = lines.slice(0, DEFAULT_MAX_LINES).join("\n");
            const tokens = Metrics.estimateTokens(sliced);
            Metrics.logUsage(projectRoot, "@mcp", `read_file: ${args.path} (truncated)`, tokens);
            return {
                content: [{
                    type: "text",
                    text: `${sliced}\n\n... [TRUNCATED - File is too long (${lines.length} lines). Only the first ${DEFAULT_MAX_LINES} lines are shown. Use startLine and endLine parameters to read other parts of the file.]`
                }]
            };
        }

        const tokens = Metrics.estimateTokens(content);
        Metrics.logUsage(projectRoot, "@mcp", `read_file: ${args.path}`, tokens);
        return { content: [{ type: "text", text: content }] };
    } catch (e) {
        const err = `Failed to read file: ${String(e)}`;
        Metrics.logError(projectRoot, "@mcp", `read_file:${args.path}`, err);
        return { isError: true, content: [{ type: "text", text: `❌ ${err}` }] };
    }
}
