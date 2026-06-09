import fs from "fs";
import path from "path";

import { getFrameworkDir } from "../utils/memory.js";
import { normalizeAgentName } from "../utils/string.js";

import { writeJsonFile } from "../utils/fs.js";

export async function logAgentActionCommand(data: { agent?: unknown; action?: string; requestId?: string; traceId?: string; status?: string; summary?: string; files?: string[]; details?: Record<string, unknown> }) {
    const frameworkDir = getFrameworkDir();
    const logsDir = path.join(frameworkDir, "logs");
    if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
    }

    const agent = normalizeAgentName(data.agent);
    const logPath = path.join(logsDir, `${agent}.json`);
    let logs: Record<string, unknown>[] = [];

    if (fs.existsSync(logPath)) {
        try {
            logs = JSON.parse(fs.readFileSync(logPath, "utf8"));
            if (!Array.isArray(logs)) logs = [];
        } catch {
            logs = [];
        }
    }

    const newEntry = {
        timestamp: new Date().toISOString(),
        ...data,
    };

    logs.push(newEntry);
    writeJsonFile(logPath, logs);
    console.warn(`✅ Logged action to ${frameworkDir}/logs/${agent}.json`);
}
