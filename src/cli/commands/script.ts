import fs from "fs";
import path from "path";
import cp from "child_process";

const targetDir = process.cwd(); // Assuming targetDir is process.cwd() in the CLI context

export async function runScriptCommand(script: string, projectPath: string) {
    const fullPath = path.join(targetDir, projectPath);
    if (!fs.existsSync(fullPath)) {
        console.warn(`❌ Project path not found: ${projectPath}`);
        return;
    }
    console.warn(`🚀 Running 'npm run ${script}' in ${projectPath}...`);
    try {
        cp.spawnSync("npm", ["run", script], { cwd: fullPath, stdio: "inherit", shell: true });
    } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Unknown error";
        console.warn(`❌ Failed to run script: ${message}`);
    }
}
