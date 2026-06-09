import fs from "fs";
import { safePath } from "../../utils/security.js";
import { PatchFileArgs, ToolResult } from "../types.js";
import { Metrics } from "../../utils/metrics.js";

export function handlePatchFile(projectRoot: string, args: PatchFileArgs): ToolResult {
    const filePath = safePath(projectRoot, args.path);
    const lines = fs.readFileSync(filePath, "utf8").split("\n");
    const start = args.startLine - 1;
    const end = args.endLine;
    const newContent = args.newContent.split("\n");

    if (start < 0 || start > lines.length) {
        const err = `Invalid start line: ${start + 1}. File has ${lines.length} lines.`;
        Metrics.logError(projectRoot, "@mcp", `patch_file:${args.path}`, err);
        throw new Error(err);
    }
    if (end < start + 1 || end > lines.length) {
        const err = `Invalid end line: ${end}. Must be between ${start + 1} and ${lines.length}.`;
        Metrics.logError(projectRoot, "@mcp", `patch_file:${args.path}`, err);
        throw new Error(err);
    }

    lines.splice(start, end - start, ...newContent);
    fs.writeFileSync(filePath, lines.join("\n"));

    const tokens = Metrics.estimateTokens(args.newContent as string);
    Metrics.logUsage(projectRoot, "@mcp", `patch_file: ${args.path}`, tokens);

    return { content: [{ type: "text", text: `✅ File patched successfully: ${args.path}` }] };
}


