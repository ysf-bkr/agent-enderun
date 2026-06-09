import { execSync } from "child_process";
import { RunTestsArgs, ToolResult } from "../types.js";

/**
 * Executes project tests and returns results for agent analysis.
 */
export function handleRunTests(projectRoot: string, args: RunTestsArgs): ToolResult {
    const testCommand = args.command || "npm test";
    
    try {
        const output = execSync(testCommand, { cwd: projectRoot, encoding: "utf8", stdio: "pipe" });
        return {
            content: [{ type: "text", text: `✅ Tests passed successfully!\n\n${output}` }]
        };
    } catch (error: unknown) {
        const err = error as { stderr?: Buffer; stdout?: Buffer };
        const stderr = err.stderr?.toString() || "";
        const stdout = err.stdout?.toString() || "";
        
        return {
            isError: true,
            content: [{ 
                type: "text", 
                text: `❌ Tests FAILED!\n\n--- STDOUT ---\n${stdout}\n\n--- STDERR ---\n${stderr}` 
            }]
        };
    }
}
