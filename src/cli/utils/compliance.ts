import fs from "fs";
import path from "path";
import ts from "typescript";

interface ComplianceIssue {
    file: string;
    line: number;
    rule: string;
}

/**
 * Enterprise Compliance Scanner (AST-Based)
 * Scans the project source code for governance and discipline violations.
 */
export function scanProjectCompliance(targetDir: string = "src"): ComplianceIssue[] {
    const issues: ComplianceIssue[] = [];
    if (!fs.existsSync(targetDir)) return [];
    
    const files = getAllFiles(targetDir);

    for (const file of files) {
        // Absolute skip for critical framework and utility files to avoid self-flagging
        if (file.includes("compliance") ||
            file.includes("definitions") ||
            file.includes("agents/registry") ||
            file.includes("scaffold-ops.ts") ||
            file.includes("logger") ||
            file.includes("errors") ||
            file.includes("shared/fs")) continue;

        const content = fs.readFileSync(file, "utf8");
        
        // --- 1. AST-Based Analysis (For Language Rules) ---
        const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

        const visit = (node: ts.Node) => {
            // Rule: No console.log allowed (excluding UI and warn/error helpers)
            if (ts.isPropertyAccessExpression(node)) {
                const expression = node.expression;
                const name = node.name.text;
                if (ts.isIdentifier(expression) && expression.text === "console" && name === "log") {
                    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    issues.push({ file, line: line + 1, rule: "No console.log allowed (Use logger instead)" });
                }
            }

            // Rule: No 'any' type usage
            if (ts.isTypeReferenceNode(node)) {
                if (ts.isIdentifier(node.typeName) && node.typeName.text === "any") {
                    const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                    issues.push({ file, line: line + 1, rule: "Usage of 'any' type is forbidden" });
                }
            }
            if (node.kind === ts.SyntaxKind.AnyKeyword) {
                const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                issues.push({ file, line: line + 1, rule: "Usage of 'any' keyword is forbidden" });
            }

            // Rule: Zero UI Library Policy
            if (ts.isImportDeclaration(node)) {
                const moduleSpecifier = node.moduleSpecifier;
                if (ts.isStringLiteral(moduleSpecifier)) {
                    const forbiddenLibs = ["@chakra-ui", "mui", "@shadcn", "antd", "bootstrap"];
                    const lib = forbiddenLibs.find(l => moduleSpecifier.text.includes(l));
                    if (lib) {
                        const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                        issues.push({ file, line: line + 1, rule: `Forbidden UI library '${lib}' usage detected` });
                    }
                }
            }

            // Rule: Raw fs mutation check (Use atomic utilities)
            if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
                const prop = node.expression;
                if (ts.isIdentifier(prop.expression) && prop.expression.text === "fs") {
                    if (["writeFileSync", "appendFileSync"].includes(prop.name.text)) {
                        // Skip if it's explicitly allowed (e.g. lock files)
                        const args = node.arguments;
                        let isLockFile = false;
                        
                        if (args.length > 0) {
                            const firstArgText = args[0].getText(sourceFile).toLowerCase();
                            if (firstArgText.includes("lock")) {
                                isLockFile = true;
                            }
                        }
                        
                        if (!isLockFile) {
                            const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
                            issues.push({ file, line: line + 1, rule: "Use atomic utilities (writeTextFile) instead of raw fs mutations" });
                        }
                    }
                }
            }

            ts.forEachChild(node, visit);
        };

        visit(sourceFile);

        // --- 2. Pattern-Based Analysis (For Secrets & PII & Debt) ---
        const lines = content.split("\n");
        const piiKeywords = [
            { regex: /API_KEY\s*[:=]\s*['"][^'"]+['"]/i, msg: "Hardcoded API Key" },
            { regex: /SECRET\s*[:=]\s*['"][^'"]+['"]/i, msg: "Hardcoded Secret" },
            { regex: /PASSWORD\s*[:=]\s*['"][^'"]+['"]/i, msg: "Hardcoded Password" },
            { regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, msg: "PII Detected: Email Address" },
            { regex: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/, msg: "PII Detected: Credit Card Pattern" }
        ];

        lines.forEach((line, index) => {
            const lineNum = index + 1;
            const trimmedLine = line.trim();

            if (trimmedLine.startsWith("//") || trimmedLine.startsWith("*")) return;

            // PII & Secret Guard
            for (const { regex, msg } of piiKeywords) {
                if (regex.test(line)) {
                    // Allow emails in specific files
                    if (msg.includes("Email") && (file.endsWith("README.md") || file.endsWith("package.json") || file.includes("CONTRIBUTING"))) {
                        continue;
                    }
                    issues.push({ file, line: lineNum, rule: `Corporate Compliance Breach: ${msg}` });
                }
            }

            // Technical Debt (TODO/FIXME)
            if (/\b(TODO|FIXME)\b/i.test(line)) {
                issues.push({ file, line: lineNum, rule: "Unresolved Technical Debt (TODO/FIXME) found" });
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
