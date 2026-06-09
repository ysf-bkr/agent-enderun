import fs from "fs";
import path from "path";
import { safePath, resolveFrameworkDir } from "../../utils/security.js";
import { writeTextFileAtomic, appendFileSafe } from "../../utils/fs.js";
import { Metrics } from "../../utils/metrics.js";
import { WriteFileArgs, ToolResult } from "../types.js";

import { verifyCorporateCompliance } from "../../utils/compliance.js";

export function handleWriteFile(projectRoot: string, args: WriteFileArgs): ToolResult {
    if (!args.path || args.content === undefined) {
        const err = "Missing 'path' or 'content' argument.";
        Metrics.logError(projectRoot, "@mcp", "write_file", err);
        return { isError: true, content: [{ type: "text", text: `❌ ${err}` }] };
    }

    try {
        const filePath = safePath(projectRoot, args.path);
        const content = args.content;
        
        // ENFORCE CORPORATE COMPLIANCE
        verifyCorporateCompliance(content, args.path);

        writeTextFileAtomic(filePath, content);
        
        // AUTO-LOGGING & METRICS
        const tokens = Metrics.estimateTokens(content);
        Metrics.logUsage(projectRoot, "@mcp", `write_file: ${args.path}`, tokens);

        try {
            const frameworkDir = resolveFrameworkDir(projectRoot);
            const memoryPath = path.join(projectRoot, frameworkDir, "memory/PROJECT_MEMORY.md");
            if (fs.existsSync(memoryPath)) {
                const entry = `\n### ${new Date().toISOString().split("T")[0]} — Auto-Update\n- **Action:** wrote file \`${args.path}\` (${tokens} tokens estimated).\n`;
                appendFileSafe(memoryPath, entry);
            }
        } catch { /* ignore memory logging errors */ }

        return { content: [{ type: "text", text: `✅ File written: ${args.path}` }] };
    } catch (e) {
        const err = `Failed to write file: ${String(e)}`;
        Metrics.logError(projectRoot, "@mcp", `write_file:${args.path}`, err);
        return { isError: true, content: [{ type: "text", text: `❌ ${err}` }] };
    }
}
