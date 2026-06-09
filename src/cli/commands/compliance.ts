import fs from "fs";
import path from "path";

import { collectFiles } from "../utils/fs.js";

const targetDir = process.cwd(); // Assuming targetDir is process.cwd() in the CLI context

export async function complianceCheckCommand(targetPath: string) {
    console.warn(`📜 Checking Constitution Compliance: ${targetPath}...`);
    const violations: string[] = [];
    const forbidden = ["@shadcn", "mui", "@chakra-ui", "tailwindcss"];

    // 1. package.json scan (Blind Spot 5)
    const pkgJsonPath = path.join(targetDir, "package.json");
    if (fs.existsSync(pkgJsonPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf8"));
            const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
            forbidden.forEach(lib => {
                if (allDeps[lib] || Object.keys(allDeps).some(d => d.toLowerCase().includes(lib.toLowerCase()))) {
                    violations.push(`package.json: Forbidden library dependency '${lib}' found in package.json.`);
                }
            });
        } catch {
            // ignore
        }
    }

    // 2. Source files scan
    const files = collectFiles(path.join(targetDir, targetPath), [".ts", ".tsx", ".js", ".jsx", ".md"]);
    files.forEach(f => {
        const isTypesFile = f.includes("brands.ts") || f.includes("brands.js") || f.includes("brands.tsx") || f.includes("src/types/brands");

        const content = fs.readFileSync(f, "utf8");
        forbidden.forEach(lib => {
            if (content.includes(lib)) violations.push(`${path.relative(targetDir, f)}: Forbidden library '${lib}' found.`);
        });

        // Robust Branded Types validation (Blind Spot 4)
        if ((f.endsWith(".ts") || f.endsWith(".tsx")) && !isTypesFile && content.includes("interface")) {
            const plainIdMatches = content.match(/\b\w*(?:id|Id|ID)\??\s*:\s*(?:string|number)\b/g);
            if (plainIdMatches) {
                plainIdMatches.forEach(match => {
                    violations.push(`${path.relative(targetDir, f)}: Potential Branded Types violation (plain identifier '${match.trim()}' found inside interface).`);
                });
            }
        }
    });

    if (violations.length === 0) {
        console.warn("✅ All systems compliant with ENDERUN.md.");
    } else {
        violations.forEach(v => console.warn(`❌ ${v}`));
    }
}
