import fs from "fs";
import path from "path";
import { ToolResult, AcquireLockArgs, ReleaseLockArgs } from "../types.js";
import { resolveFrameworkDir } from "../../utils/security.js";

/**
 * Handles acquiring a stateful lock on a resource.
 */
export async function handleAcquireLock(projectRoot: string, args: AcquireLockArgs): Promise<ToolResult> {
    const { resource, agent, ttl = 60 } = args;
    const frameworkDir = resolveFrameworkDir(projectRoot);
    const lockDir = path.join(projectRoot, frameworkDir, "locks");
    const lockPath = path.join(lockDir, `${resource}.lock`);

    try {
        if (!fs.existsSync(lockDir)) fs.mkdirSync(lockDir, { recursive: true });

        if (fs.existsSync(lockPath)) {
            const stat = fs.statSync(lockPath);
            const now = new Date().getTime();
            const age = (now - stat.mtimeMs) / 1000;

            if (age < ttl) {
                return {
                    isError: true,
                    content: [{ type: "text", text: `Resource '${resource}' is currently locked by another agent.` }]
                };
            }
            // Lock expired, safe to override
            fs.unlinkSync(lockPath);
        }

        fs.writeFileSync(lockPath, JSON.stringify({ agent, timestamp: new Date().toISOString() }));
        return {
            content: [{ type: "text", text: `✅ Lock acquired for resource '${resource}' by ${agent}.` }]
        };
    } catch (e) {
        return {
            isError: true,
            content: [{ type: "text", text: `Failed to acquire lock: ${String(e)}` }]
        };
    }
}

/**
 * Handles releasing a lock.
 */
export async function handleReleaseLock(projectRoot: string, args: ReleaseLockArgs): Promise<ToolResult> {
    const { resource, agent } = args;
    const frameworkDir = resolveFrameworkDir(projectRoot);
    const lockPath = path.join(projectRoot, frameworkDir, "locks", `${resource}.lock`);

    try {
        if (!fs.existsSync(lockPath)) {
            return { content: [{ type: "text", text: `ℹ️ No lock found for resource '${resource}'.` }] };
        }

        const lockData = JSON.parse(fs.readFileSync(lockPath, "utf8"));
        if (lockData.agent !== agent) {
            return {
                isError: true,
                content: [{ type: "text", text: `❌ Denied: You do not own the lock for '${resource}'. Owned by ${lockData.agent}.` }]
            };
        }

        fs.unlinkSync(lockPath);
        return { content: [{ type: "text", text: `✅ Lock released for resource '${resource}' by ${agent}.` }] };
    } catch (e) {
        return { isError: true, content: [{ type: "text", text: `Failed to release lock: ${String(e)}` }] };
    }
}
