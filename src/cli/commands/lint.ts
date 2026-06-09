import { execSync } from "child_process";

import { getPackageVersion } from "../utils/pkg.js";

/**
 * Run ESLint for the project (same as npm run lint).
 */
export async function lintCommand(): Promise<void> {
    console.warn(`🔍 Running ESLint (v${getPackageVersion()})...`);
    const projectRoot = process.cwd();
    try {
        execSync("npm run lint", {
            cwd: projectRoot,
            stdio: "inherit",
            env: process.env,
        });
        console.warn("\n✅ ESLint passed with no errors.");
    } catch {
        console.warn("\n❌ ESLint reported errors. Fix violations before committing.");
        console.warn("   Tip: npm run lint -- --fix");
        process.exit(1);
    }
}
