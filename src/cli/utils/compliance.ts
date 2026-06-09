import fs from "fs";
import path from "path";

interface ComplianceIssue {
    file: string;
    line: number;
    rule: string;
}

export function scanProjectCompliance(): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    if (!fs.existsSync("src")) return [];
    const files = getAllFiles("src");

    for (const file of files) {
        // Absolute skip for the scanner itself to avoid recursion/self-flagging
        if (file.includes("compliance") ||
            file.includes("definitions") ||
            file.includes("agents/registry") || // Skip agent definitions
            file.includes("scaffold-ops.ts") || // Template generator
            file.includes("logger") ||
            file.includes("errors") ||
            file.includes("shared/fs")) continue;

        const content = fs.readFileSync(file, "utf8");
        const lines = content.split("\n");

        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmedLine = line.trim();

            // Skip comments and common doc string patterns
            if (trimmedLine.startsWith("//") ||
                trimmedLine.startsWith("*") ||
                trimmedLine.startsWith("-") ||
                trimmedLine.includes("\": \"") || // Ignore JSON-like values
                trimmedLine.includes("default: ") || // Ignore default template values
                trimmedLine.startsWith("`")) return; // Ignore template literals

            // Only check if it's NOT inside a UI/console message
            const isUIMessage = line.includes("console.warn") || line.includes("console.error") || line.includes("UI.");
            const isTypeDefinition = line.includes("interface ") || line.includes("type ");

            // 1. Console.log check - only if it's actual code
            if (line.includes("console.log") && !isUIMessage) {
                issues.push({ file, line: lineNum, rule: "No console.log allowed" });
            }

            // 2. Secret check (Regex for simple API keys/assignments) - skip UI messages and templates
            if (/(API_KEY|SECRET|PASSWORD)\s*[:=]/i.test(line) &&
                !file.includes(".env") &&
                !isUIMessage &&
                !trimmedLine.includes(".env.example") && // Skip template lines
                !trimmedLine.includes("your_secret_key_here") && // Skip common placeholders
                !trimmedLine.includes("pattern:")) {
                issues.push({ file, line: lineNum, rule: "Potential hardcoded secret assignment detected" });
            }

            // 3. 'Any' type check
            if (/\bany\b/.test(line) && !isTypeDefinition && !trimmedLine.includes("\":")) {
                issues.push({ file, line: lineNum, rule: "Usage of 'any' type is forbidden" });
            }

            // 4. Technical Debt Detection (TODO/FIXME)
            if (/\b(TODO|FIXME)\b/i.test(line)) {
                issues.push({ file, line: lineNum, rule: "Unresolved Technical Debt (TODO/FIXME) found" });
            }

            // 5. Raw fs write check (Atomic safety enforcement)
            if ((line.includes("fs.writeFileSync") || line.includes("fs.appendFileSync")) &&
                !file.includes("src/shared/fs.ts") && // Ignore the utility itself
                !line.includes(".lock") && // Allow lock files
                !line.includes("lockPath") && // Allow lock path variables
                !file.includes("bin/")) { // Ignore standalone binary scripts
                issues.push({ file, line: lineNum, rule: "Use internal atomic utilities (writeTextFile) instead of raw fs" });
            }
        });

    }
    return issues;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
    const files = fs.readdirSync(dirPath);

    files.forEach((file) => {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else if (fullPath.endsWith(".ts")) {
            arrayOfFiles.push(fullPath);
        }
    });

    return arrayOfFiles;
}
