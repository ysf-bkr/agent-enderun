import { exec } from "child_process";
import { ToolArgs, ToolResult } from "../types.js";
import { Metrics } from "../../utils/metrics.js";

const LINT_COMMAND = "npm run lint";
const TIMEOUT = 60000; // 60 seconds

/**
 * Handles running the project's linter.
 */
export function handleCheckLint(projectRoot: string, _args: ToolArgs): Promise<ToolResult> {
    return new Promise((resolve) => {
        exec(LINT_COMMAND, { cwd: projectRoot, timeout: TIMEOUT }, (error, stdout, stderr) => {
            const output = stdout + stderr;
            const tokens = Metrics.estimateTokens(output);
            
            if (error) {
                const err = `Linting failed: ${error.message}`;
                Metrics.logError(projectRoot, "@mcp", "check_lint", err);
                resolve({
                    isError: true,
                    content: [{ type: "text", text: `❌ Lint Errors Found:\n\n${output}` }]
                });
                return;
            }

            Metrics.logUsage(projectRoot, "@mcp", "check_lint", tokens);
            resolve({
                content: [{ type: "text", text: `✅ Lint check passed successfully:\n\n${output}` }]
            });
        });
    });
}
