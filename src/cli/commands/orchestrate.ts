import fs from "fs";
import path from "path";
import { getFrameworkDir, updateDocumentStore, readStatus } from "../utils/memory.js";
import { UI } from "../utils/ui.js";
import { writeTextFile, appendFile } from "../utils/fs.js";
import { z } from "zod";
import { logger } from "../../shared/logger.js";
import { TaskRequestSchema } from "../../contracts/tasks.js";
import { sleep } from "../utils/time.js";

export const HermesMessageSchema = z.object({
    timestamp: z.string(),
    from: z.string(),
    to: z.string(),
    category: z.enum(["ACTION", "DELEGATION", "SUBTASK", "REPLY", "ALERT"]),
    content: z.string(), // This is the payload to be validated
    traceId: z.string(),
    parentId: z.string().optional(),
    status: z.enum(["PENDING", "PROCESSED", "WAITING", "APPROVED"]),
    priority: z.enum(["HIGH", "NORMAL", "LOW"]).optional(),
    action: z.string().optional(),
    requiresApproval: z.boolean().optional(),
});

export type HermesMessage = z.infer<typeof HermesMessageSchema>;

// Global status cache for in-memory optimization
let agentStatusCache: Record<string, { state: string; task: string; lastUpdated?: string }> = {};
let isLooping = false;

export async function orchestrateCommand() {
    UI.intent("Hermes Message Broker", "Starting the live agent orchestration loop...");

    const frameworkDir = getFrameworkDir();
    const messagesDir = path.join(frameworkDir, "messages");

    // Graceful Shutdown Handling
    const shutdown = async () => {
        if (!isLooping) return;
        isLooping = false;
        UI.warning("\n🛑 Shutdown signal received. Cleaning up Hermes loop...");
        // Additional cleanup like releasing global locks could go here
        process.exit(0);
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    isLooping = true;

    while (isLooping) {
        try {
            // Initial load from disk to sync the cache
            if (Object.keys(agentStatusCache).length === 0) {
                const diskStatus = readStatus();
                agentStatusCache = diskStatus || {};
            }

            // Check for agent timeouts (e.g. 30 minutes in EXECUTING state)
            const agentStatuses = readStatus();
            let updatedStatus = false;
            for (const [agentName, info] of Object.entries(agentStatuses)) {
                const { state, lastUpdated } = info as { state: string; task: string; lastUpdated?: string };
                if (state === "EXECUTING" && lastUpdated) {
                    const lastUpdatedTime = Date.parse(lastUpdated);
                    if (!isNaN(lastUpdatedTime) && Date.now() - lastUpdatedTime > 30 * 60 * 1000) {
                        UI.error(`⚠️  Agent ${agentName} has TIMED OUT (in EXECUTING state for >30m). Transitioning to BLOCKED.`);
                        agentStatuses[agentName] = { state: "BLOCKED", task: "Timeout occurred", lastUpdated: new Date().toISOString() };
                        updatedStatus = true;
                    }
                }
            }
            if (updatedStatus) {
                updateDocumentStore("status", agentStatuses);
                agentStatusCache = { ...agentStatuses }; // Sync cache
            }

            if (fs.existsSync(messagesDir)) {
                const messageFiles = fs.readdirSync(messagesDir).filter((f) => f.endsWith(".json"));
                const pendingMessages: HermesMessage[] = [];
                const fileMessagesMap: Record<string, HermesMessage[]> = {};

                for (const file of messageFiles) {
                    const filePath = path.join(messagesDir, file);
                    try {
                        const content = fs.readFileSync(filePath, "utf8").trim();
                        if (!content) continue;
                        const lines = content.split("\n");
                        const allMsgs: HermesMessage[] = [];
                        lines.forEach((line) => {
                            if (!line.trim()) return;
                            try {
                                const parsed = JSON.parse(line);
                                const msg = HermesMessageSchema.parse(parsed);

                                // Contract Validation
                                if (msg.category === "ACTION" || msg.category === "DELEGATION") {
                                    try {
                                        const payload = JSON.parse(msg.content);
                                        TaskRequestSchema.parse(payload);
                                    } catch (e) {
                                        UI.error(`Invalid task contract payload: ${(e as Error).message}`);
                                        return; // Skip invalid message
                                    }
                                }

                                // A message is actionable if it's pending, or if it's been approved.
                                if (msg.status === "PENDING" || msg.status === "APPROVED") {
                                    pendingMessages.push(msg);
                                }
                                allMsgs.push(msg);
                            } catch (e) {
                                UI.error(`Skipping invalid Hermes message format: ${(e as Error).message}`);
                            }
                        });
                        fileMessagesMap[file] = allMsgs;
                    } catch (err) {
                        UI.error(`Error occurred while reading ${file}.`);
                        logger.debug(`Failed to read message file ${file}`, err);
                    }
                }

                if (pendingMessages.length > 0) {
                    // Sort by priority: HIGH -> NORMAL -> LOW
                    const priorityOrder = { HIGH: 1, NORMAL: 2, LOW: 3 };
                    pendingMessages.sort((a, b) => {
                        const pA = priorityOrder[a.priority || "NORMAL"] || 2;
                        const pB = priorityOrder[b.priority || "NORMAL"] || 2;
                        if (pA !== pB) return pA - pB;
                        return Date.parse(a.timestamp) - Date.parse(b.timestamp);
                    });

                    UI.intent("Multi-Agent Orchestration", `${pendingMessages.length} pending tasks and collaboration messages found.`);

                    const statusChanges: Record<string, { state: string; task: string }> = {};

                    for (const msg of pendingMessages) {
                        const { from, to, content, traceId, category, status, requiresApproval } = msg;

                        // Approval Gate for high-risk actions.
                        // If it requires approval but isn't approved yet, skip it for now.
                        if ((category === "ACTION" || category === "ALERT") && requiresApproval && status !== "APPROVED") {
                            logger.debug(`Action for @${to} (Trace: ${traceId}) is pending manager approval.`);
                            continue;
                        }
                        
                        // Gate for regular messages.
                        // If it's a non-approval-required message, it should only be processed when PENDING.
                        // This prevents re-processing of SUBTASK/REPLY messages that might get set to APPROVED.
                        if (!(category === "ACTION" || category === "ALERT") && status !== "PENDING") {
                            continue;
                        }


                        const isSubtask = category === "SUBTASK" || !!msg.parentId;
                        const agentLabel = isSubtask ? `${to} (Sub-Agent)` : to;

                        UI.agentBox(agentLabel, content, `Trace: ${traceId} | From: ${from} | Category: ${category}`);

                        let targetState = "EXECUTING";
                        if (category === "DELEGATION" || category === "SUBTASK") targetState = "BRIEFED";

                        let taskDescription = content;
                        if (category === "DELEGATION" || category === "ACTION") {
                            try {
                                const payload = JSON.parse(content);
                                taskDescription = payload.task || content;
                            } catch {
                                // Ignore
                            }
                        }

                        statusChanges[to] = { state: targetState, task: taskDescription };

                        if (targetState === "BRIEFED") {
                            UI.success(`${to} informed and took over the task.`);
                            statusChanges[to] = { state: "EXECUTING", task: taskDescription };
                        }

                        if (isSubtask) {
                            UI.success(`Sub-task connection established (Parent: ${msg.parentId || "Unknown"}).`);
                        }

                        UI.success(`Collaboration initiated: ${from} -> ${to}`);

                        msg.status = "PROCESSED";
                    }

                    applyBatchStatusUpdates(statusChanges);

                    const archiveDir = path.join(messagesDir, "archive");
                    
                    for (const file of Object.keys(fileMessagesMap)) {
                        const filePath = path.join(messagesDir, file);
                        const msgs = fileMessagesMap[file];
                        
                        const activeMsgs = msgs.filter(m => m.status !== "PROCESSED");
                        const processedMsgs = msgs.filter(m => m.status === "PROCESSED");
                        
                        try {
                            if (activeMsgs.length > 0) {
                                const updatedContent = activeMsgs.map(m => JSON.stringify(m)).join("\n") + "\n";
                                writeTextFile(filePath, updatedContent);
                            } else if (fs.existsSync(filePath)) {
                                writeTextFile(filePath, "");
                            }

                            if (processedMsgs.length > 0) {
                                if (!fs.existsSync(archiveDir)) {
                                    fs.mkdirSync(archiveDir, { recursive: true });
                                }
                                const agentName = file.replace(".json", "");
                                const archivePath = path.join(archiveDir, `${agentName}_archive.json`);
                                const archiveContent = processedMsgs.map(m => JSON.stringify(m)).join("\n") + "\n";
                                appendFile(archivePath, archiveContent);
                                UI.success(`Archived ${processedMsgs.length} messages for @${agentName}`);
                            }
                        } catch (err) {
                            UI.error(`Error occurred while updating and archiving the message file ${file}.`);
                            logger.debug(`Failed to update and archive message file ${file}`, err);
                        }
                    }
                }
            }
        } catch (globalLoopErr) {
            UI.error(`⚠️  Critical error in Hermes orchestration loop: ${(globalLoopErr as Error).message}`);
            logger.debug("Hermes global loop failure", globalLoopErr);
        }

        // Prevent 100% CPU and provide breathing room for I/O
        await sleep(2000);
    }
}

/**
 * Standard tool for agents to delegate tasks to other agents.
 */
export async function sendMessage(args: { 
    from: string; 
    to: string; 
    category: "ACTION" | "DELEGATION" | "SUBTASK" | "REPLY" | "ALERT"; 
    content: string; 
    traceId: string;
    parentId?: string;
    priority?: "HIGH" | "NORMAL" | "LOW";
    requiresApproval?: boolean;
}) {
    const frameworkDir = getFrameworkDir();
    const messagesDir = path.join(frameworkDir, "messages");
    const agentName = args.to.replace("@", "");
    const messagePath = path.join(messagesDir, `${agentName}.json`);
    const lockPath = path.join(messagesDir, `${agentName}.lock`);

    let retries = 20; // Increased retries from 3 to 20
    let acquired = false;
    while (retries > 0) {
        try {
            if (fs.existsSync(lockPath)) {
                try {
                    const stats = fs.statSync(lockPath);
                    // Increased stale lock timeout from 5s to 10s for heavy ops
                    if (Date.now() - stats.mtimeMs > 10000) {
                        fs.unlinkSync(lockPath);
                    }
                } catch (err) {
                    logger.debug(`Failed to unlink stale Hermes lock for ${agentName} concurrently`, err);
                }
            }
            if (!fs.existsSync(messagesDir)) {
                fs.mkdirSync(messagesDir, { recursive: true });
            }
            fs.writeFileSync(lockPath, `Locked by ${args.from} at ${new Date().toISOString()}`, { flag: "wx" });
            acquired = true;
            break;
        } catch (err: unknown) {
            const error = err as { code?: string; message?: string };
            if (error.code === "EEXIST") {
                retries--;
                if (retries > 0) {
                    // Exponential backoff or jitter could be added here, 
                    // but fixed 500ms is usually fine for local file locks.
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }
            } else {
                UI.error(`Unexpected error occurred while acquiring the lock: ${error.message || String(err)}`);
                break;
            }
        }
    }

    if (!acquired) {
        UI.error(`Message could not be delivered: Hermes lock is busy. (${args.from} -> ${args.to})`);
        return;
    }

    try {
        const defaultPriority = (args.category === "ALERT" || args.category === "ACTION") ? "HIGH" : "NORMAL";
        const requiresApproval = args.requiresApproval !== undefined ? args.requiresApproval : (args.category === "ALERT" || args.category === "ACTION");

        const message: HermesMessage = {
            timestamp: new Date().toISOString(),
            priority: args.priority || defaultPriority,
            ...args,
            status: "PENDING",
            requiresApproval: requiresApproval,
        };
        
        appendFile(messagePath, JSON.stringify(message) + "\n");
        
        return message;
    } catch (err) {
        UI.error(`Message could not be delivered: ${args.from} -> ${args.to}`);
        logger.debug(`Hermes sendMessage failed (${args.from} -> ${args.to})`, err);
    } finally {
        if (acquired && fs.existsSync(lockPath)) {
            try {
                fs.unlinkSync(lockPath);
            } catch {
                // Ignore delete errors if concurrently unlinked
            }
        }
    }
}


function applyBatchStatusUpdates(changes: Record<string, { state: string; task: string }>) {
    let hasChanges = false;
    const now = new Date().toISOString();

    for (const [agent, data] of Object.entries(changes)) {
        const current = agentStatusCache[agent];
        if (!current || current.state !== data.state || current.task !== data.task) {
            agentStatusCache[agent] = { ...data, lastUpdated: now };
            hasChanges = true;
        }
    }

    if (hasChanges) {
        updateDocumentStore("status", agentStatusCache);
        logger.debug("In-memory status cache synced to disk.");
    }
}
