import { exec } from "child_process";
import { RunCommandArgs, ToolResult } from "../types.js";
import { Metrics } from "../../utils/metrics.js";

const COMMAND_ALLOW_LIST = [
    "npm test",
    "npm run lint",
    "git status",
    "git diff",
    "npx vitest run", // From the audit, this is the test command
    "npm run build", // From the audit
];

const TIMEOUT = 30000; // 30 seconds

export function handleRunCommand(projectRoot: string, args: RunCommandArgs): Promise<ToolResult> {
    const command = args.command;

    const isAllowed = COMMAND_ALLOW_LIST.some(allowedCmd => command.startsWith(allowedCmd));

    if (!isAllowed) {
        const errorMsg = `Command not allowed: "${command}". Only commands starting with the following are allowed: ${COMMAND_ALLOW_LIST.join(", ")}`;
        Metrics.logError(projectRoot, "@mcp", `run_shell_command: ${command} (denied)`, errorMsg);
        return Promise.resolve({
            content: [{ type: "text", text: `ERROR: ${errorMsg}` }],
            isError: true,
        });
    }

    return new Promise((resolve) => {
        exec(command, { cwd: projectRoot, timeout: TIMEOUT }, (error, stdout, stderr) => {
            const output = stdout + stderr;
            const tokens = Metrics.estimateTokens(output);
            Metrics.logUsage(projectRoot, "@mcp", `run_shell_command: ${command}`, tokens);
            
            if (error) {
                const errorMsg = `Command failed with exit code ${error.code}: ${error.message}.`;
                Metrics.logError(projectRoot, "@mcp", `run_shell_command: ${command}`, errorMsg);
                resolve({
                    content: [{ type: "text", text: `ERROR: ${errorMsg}. Output: ${output}` }],
                    isError: true,
                });
                return;
            }

            // Truncate long outputs
            const MAX_OUTPUT_LENGTH = 5000;
            let truncatedOutput = output;
            if (output.length > MAX_OUTPUT_LENGTH) {
                truncatedOutput = output.substring(0, MAX_OUTPUT_LENGTH) + "... [TRUNCATED] ..."; // Simplified
            }
            
            resolve({ content: [{ type: "text", text: truncatedOutput }] });
        });
    });
}
