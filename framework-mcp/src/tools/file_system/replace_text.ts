import fs from "fs";
import { safePath } from "../../utils/security.js";
import { writeTextFileAtomic } from "../../utils/fs.js";
import { ReplaceTextArgs, ToolResult } from "../types.js";
import { Metrics } from "../../utils/metrics.js";

import { verifyCorporateCompliance } from "../../utils/compliance.js";

export function handleReplaceText(projectRoot: string, args: ReplaceTextArgs): ToolResult {
    const filePath = safePath(projectRoot, args.path);
    const content = fs.readFileSync(filePath, "utf8");
    const oldText = args.oldText;
    const newText = args.newText;
    const allowMultiple = args.allowMultiple || false; // Default to false

    if (!content.includes(oldText)) {
        const err = `Text not found in file: ${oldText.slice(0, 100)}...`;
        Metrics.logError(projectRoot, "@mcp", `replace_text:${args.path}`, err);
        throw new Error(err);
    }

    // Surgical precision guard: reject ambiguous replacements unless allowMultiple is true.
    if (!allowMultiple) {
        const firstIndex = content.indexOf(oldText);
        const lastIndex = content.lastIndexOf(oldText);
        if (firstIndex !== lastIndex) {
            const count = (content.match(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) || []).length;
            const err = `Ambiguous replacement: "${oldText.slice(0, 80)}..." found ${count} times in ${args.path}. ` +
                        "Provide a longer, unique context string or set 'allow_multiple' to true.";
            Metrics.logError(projectRoot, "@mcp", `replace_text:${args.path}`, err);
            throw new Error(err);
        }
    }

    // Perform replacement(s)
    let newContent: string;
    if (allowMultiple) {
        newContent = content.replace(new RegExp(oldText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), newText);
    } else {
        newContent = content.replace(oldText, newText);
    }

    // ENFORCE CORPORATE COMPLIANCE
    verifyCorporateCompliance(newContent, args.path as string);
    
    writeTextFileAtomic(filePath, newContent);

    const tokens = Metrics.estimateTokens(newText);
    Metrics.logUsage(projectRoot, "@mcp", `replace_text: ${args.path}`, tokens);

    return { content: [{ type: "text", text: `✅ Surgical edit successful in ${args.path}` }] };
}
