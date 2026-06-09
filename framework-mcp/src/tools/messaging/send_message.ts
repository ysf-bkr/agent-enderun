import fs from "fs";
import path from "path";
import { resolveFrameworkDir } from "../../utils/security.js";
import { SendAgentMessageArgs, ToolResult } from "../types.js";
import { Metrics } from "../../utils/metrics.js";

export async function handleSendAgentMessage(projectRoot: string, args: SendAgentMessageArgs): Promise<ToolResult> {
    const { to, category, content, traceId } = args;
    const from = args.from || "@mcp";

    if (!to || !category || !content || !traceId) {
        const err = "Missing required messaging arguments (to, category, content, or traceId).";
        Metrics.logError(projectRoot, from, "send_agent_message", err);
        return { isError: true, content: [{ type: "text", text: `❌ ${err}` }] };
    }

    const frameworkDir = resolveFrameworkDir(projectRoot);
    const messagesDir = path.join(projectRoot, frameworkDir, "messages");
    const agentName = to.replace("@", "");
    const messagePath = path.join(messagesDir, `${agentName}.json`);
    const lockPath = path.join(messagesDir, `${agentName}.lock`);

    // Hermes Lock Protocol: Retry 3 times with 500ms delay
    let retries = 3;
    let acquired = false;
    while (retries > 0) {
        try {
            if (fs.existsSync(lockPath)) {
                try {
                    const stats = fs.statSync(lockPath);
                    if (Date.now() - stats.mtimeMs > 5000) {
                        fs.unlinkSync(lockPath);
                    }
                } catch {
                    // ignore if concurrently unlinked
                }
            }
            fs.mkdirSync(messagesDir, { recursive: true });
            fs.writeFileSync(lockPath, `Locked by ${from} at ${new Date().toISOString()}`, { flag: "wx" });
            acquired = true;
            break;
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            if (error.code === "EEXIST") {
                retries--;
                if (retries > 0) {
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            } else {
                return { content: [{ type: "text", text: `❌ Unexpected lock acquisition error: ${error.message || String(err)}` }], isError: true };
            }
        }
    }

    if (!acquired) {
        const err = `Could not send message to ${to}: Hermes lock is busy.`;
        Metrics.logError(projectRoot, from, "send_agent_message", err);
        return { content: [{ type: "text", text: `❌ ${err}` }], isError: true };
    }

    try {
        const defaultPriority = (category === "ALERT" || category === "ACTION") ? "HIGH" : "NORMAL";
        const message = {
            timestamp: new Date().toISOString(),
            from,
            to,
            category,
            traceId,
            content,
            priority: args.priority || defaultPriority,
            status: "PENDING"
        };

        fs.appendFileSync(messagePath, JSON.stringify(message) + "\n");
        return { content: [{ type: "text", text: `✅ Message sent to ${to} (from: ${from})` }] };
    } catch (e) {
        const err = `Failed to write message: ${String(e)}`;
        Metrics.logError(projectRoot, from, "send_agent_message", err);
        return { isError: true, content: [{ type: "text", text: `❌ ${err}` }] };
    } finally {
        if (acquired && fs.existsSync(lockPath)) {
            try {
                fs.unlinkSync(lockPath);
            } catch {
                // ignore
            }
        }
    }
}
