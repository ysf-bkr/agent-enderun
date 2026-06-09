import fs from "fs";
import path from "path";

import { collectFiles } from "../utils/fs.js";

const targetDir = process.cwd();

export async function securityAuditCommand(targetPath: string) {
    console.warn(`🔍 Running Advanced Security Audit on: ${targetPath}...`);
    const scanRules = [
        { pattern: /sql`/, message: "Potential Raw SQL usage detected", severity: "HIGH" },
        {
            pattern: /(password|secret|api_?key)\s*[:=]\s*['"][^'"]+['"]/i,
            message: "Potential hardcoded secret detected",
            severity: "CRITICAL",
        },
        { pattern: /:\s*any(?!\w)/, message: "Usage of 'any' type detected", severity: "MEDIUM" },
        { pattern: /\.innerHTML\s*=/, message: "Unsafe innerHTML assignment detected", severity: "MEDIUM" },
    ];
    const issues: string[] = [];
    const files = collectFiles(path.join(targetDir, targetPath), [".ts", ".tsx", ".js", ".jsx"]);
    files.forEach((f) => {
        const content = fs.readFileSync(f, "utf8");
        const lines = content.split("\n");
        lines.forEach((line, i) => {
            scanRules.forEach((rule) => {
                if (rule.pattern.test(line)) {
                    issues.push(`[${rule.severity}] ${rule.message} in ${path.relative(targetDir, f)}:${i + 1}`);
                }
            });
        });
    });
    if (issues.length === 0) {
        console.warn("✅ No security issues detected.");
    } else {
        issues.forEach((issue) => console.warn(`⚠️  ${issue}`));
    }
}
