import { execFileSync } from "child_process";

/**
 * Executes a CLI command safely using execFileSync (no shell injection risk).
 * Captures stderr gracefully to prevent stream crashes.
 */
export function safeExec(command: string, args: string[], cwd: string, timeout?: number): string {
    try {
        return execFileSync(command, args, {
            cwd,
            encoding: "utf8",
            timeout: timeout || 30000,
            maxBuffer: 1024 * 1024,
            stdio: ["pipe", "pipe", "pipe"],
        });
    } catch (error: unknown) {
        const err = error as { stderr?: string; message?: string };
        throw new Error(err.stderr || err.message || "Command execution failed", { cause: error });
    }
}
