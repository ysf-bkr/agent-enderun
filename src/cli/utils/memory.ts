import fs from "fs";
import os from "os";
import path from "path";
import { logger } from "../../shared/logger.js";
import { ensureDir, writeTextFile, writeJsonFile } from "../../shared/fs.js";
import { StateSchema, AgentStatusSchema, TaskSchema } from "./schemas.js";
import type { TraceID } from "../../shared/types.js";
import {
    FRAMEWORK,
    FRAMEWORK_DIR_CANDIDATES,
    MCP,
} from "../../shared/constants.js";

export { generateULID } from "./time.js";

const CWD = process.cwd();
const HOME = os.homedir();

function findFrameworkDir(basePath: string): string | null {
    try {
        const pkgPath = path.join(basePath, "package.json");
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            if (pkg.enderun && typeof pkg.enderun.frameworkDir === "string") {
                const customDir = path.join(basePath, pkg.enderun.frameworkDir);
                if (fs.existsSync(customDir)) return customDir;
            }
        }
    } catch (err) {
        logger.debug("Failed to read package.json in findFrameworkDir", err);
    }
    return null;
}

export function isFrameworkDevelopmentRepo(): boolean {
    try {
        const pkgPath = path.join(CWD, "package.json");
        if (fs.existsSync(pkgPath)) {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
            if (pkg.name === "agent-enderun") {
                return true;
            }
        }
    } catch (err) {
        logger.debug("Failed to read package.json in isFrameworkDevelopmentRepo", err);
    }
    return false;
}

export function getLocalFrameworkDir(): string {
    const localDir = findFrameworkDir(CWD);
    return localDir || path.join(CWD, FRAMEWORK.CORE_DIR);
}

export function getConfigDir(): string {
    const localDir = findFrameworkDir(CWD);
    if (localDir) return localDir;

    // Check for standard local directories if package.json doesn't specify
    const localCandidates = [...FRAMEWORK_DIR_CANDIDATES, ".agent"] as string[];
    for (const cand of localCandidates) {
        const p = path.join(CWD, cand);
        if (fs.existsSync(p)) return p;
    }

    // In dev repo, don't fall back to global dir. Point to local default.
    if (isFrameworkDevelopmentRepo()) {
        return path.join(CWD, FRAMEWORK.CORE_DIR);
    }

    return path.join(HOME, FRAMEWORK.CORE_DIR);
}

export function getFrameworkDir(): string {
    const testDir = process.env[MCP.TEST_DIR_ENV];
    if (testDir) return testDir;
    return getConfigDir();
}

export function getDocumentStorePath() {
    const frameworkDir = getFrameworkDir();
    return path.join(frameworkDir, "memory");
}

export function initDocumentStore(frameworkDir?: string) {
    const storePath = frameworkDir ? path.join(frameworkDir, "memory") : getDocumentStorePath();
    ensureDir(storePath);
    ensureDir(path.join(storePath, "tasks"));
    ensureDir(path.join(storePath, "history"));
    
    const stateFile = path.join(storePath, "state.json");
    if (!fs.existsSync(stateFile)) {
        writeJsonFile(stateFile, { phase: "PHASE_0", traceId: "T-000", managerState: "ACTIVE" });
    }
    const statusFile = path.join(storePath, "status.json");
    if (!fs.existsSync(statusFile)) {
        writeJsonFile(statusFile, {});
    }

    // Ensure the initial Markdown view is created
    syncMarkdownMemory(frameworkDir);
}

export function readState() {
    const statePath = path.join(getDocumentStorePath(), "state.json");
    if (!fs.existsSync(statePath)) return null;
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
}

export function readStatus() {
    const statusPath = path.join(getDocumentStorePath(), "status.json");
    if (!fs.existsSync(statusPath)) return {};
    return JSON.parse(fs.readFileSync(statusPath, "utf8"));
}

export function listTasks() {
    const tasksPath = path.join(getDocumentStorePath(), "tasks");
    if (!fs.existsSync(tasksPath)) return [];
    
    return fs.readdirSync(tasksPath)
        .filter(f => f.endsWith(".json"))
        .map(f => JSON.parse(fs.readFileSync(path.join(tasksPath, f), "utf8")));
}

export function getMemoryPath(): string {
    return path.join(getDocumentStorePath(), "state.json");
}

export function readActiveTraceId(memoryContent: string): string | null {
    try {
        const state = JSON.parse(memoryContent);
        return state.traceId || null;
    } catch (_e) { /* ignore */
        return null;
    }
}

export function updateProjectMemory(section: string, content: string) {
    if (section === "HISTORY") {
        updateDocumentStore("history", { content }, new Date().toISOString().replace(/[:.]/g, "-"));
    } else {
        const state = readState() || {};
        state[section] = content;
        updateDocumentStore("state", state);
    }
}

export function initializeMemory(memoryPathOrBase: string, targetBaseOrDryRun?: string | boolean): void {
    const targetBase = typeof targetBaseOrDryRun === "string" ? targetBaseOrDryRun : memoryPathOrBase;
    initDocumentStore(targetBase);
    logger.info("✅ Document store initialized.");
}

export function getConfiguredPaths(): { backend: string; frontend: string; mobile: string; docs: string; tests: string } {
    const defaultPaths = { backend: "apps/backend", frontend: "apps/web", mobile: "apps/mobile", docs: "docs", tests: "tests" };
    try {
        const frameworkDir = getConfigDir();
        const configPath = path.join(frameworkDir, "config.json");
        if (fs.existsSync(configPath)) {
            const rawConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
            return rawConfig.paths || defaultPaths;
        }
    } catch (err) {
        logger.debug("Critical config read failure", err);
    }
    return defaultPaths;
}

export function updateDocumentStore(type: "state" | "task" | "history" | "status", data: unknown, id?: string | TraceID, frameworkDir?: string) {
    const storePath = frameworkDir ? path.join(frameworkDir, "memory") : getDocumentStorePath();
    ensureDir(storePath);

    switch (type) {
        case "state":
            StateSchema.parse(data);
            writeJsonFile(path.join(storePath, "state.json"), data);
            break;
        case "status":
            AgentStatusSchema.parse(data);
            writeJsonFile(path.join(storePath, "status.json"), data);
            break;
        case "task":
            TaskSchema.parse(data);
            ensureDir(path.join(storePath, "tasks"));
            writeJsonFile(path.join(storePath, "tasks", `${id}.json`), data);
            break;
        case "history":
            ensureDir(path.join(storePath, "history"));
            writeJsonFile(path.join(storePath, "history", `${id}.json`), data);
            break;
    }

    // Auto-sync Markdown view after any change
    syncMarkdownMemory(frameworkDir);
}

/**
 * Single Source of Truth Bridge: JSON -> Markdown
 * Regenerates PROJECT_MEMORY.md from structured state.
 */
export function syncMarkdownMemory(fDir?: string) {
    const frameworkDir = fDir || getFrameworkDir();
    const storePath = path.join(frameworkDir, "memory");
    const mdPath = path.join(storePath, "PROJECT_MEMORY.md");

    try {
        const state = readState();
        const status = readStatus();
        const tasks = listTasks();

        if (!state) return;

        const lines = [
            "# 🧠 Agent Enderun — Project Memory",
            "",
            "## 📍 Current State",
            `- **Phase:** ${state.phase || "PHASE_0"}`,
            `- **Trace ID:** ${state.traceId || "N/A"}`,
            `- **@manager state:** ${state.managerState || "ACTIVE"}`,
            "",
            "## 📋 Active Tasks",
            "| Trace ID | Task | Agent | Priority | Status |",
            "| :--- | :--- | :--- | :--- | :--- |",
        ];

        tasks.forEach(t => {
            if (t.status !== "COMPLETED") {
                lines.push(`| ${t.traceId} | ${t.description} | ${t.agent} | ${t.priority} | ${t.status} |`);
            }
        });

        lines.push("", "## 🤖 Agent Statuses");
        lines.push("| Agent | State | Active Task | Last Updated |");
        lines.push("| :--- | :--- | :--- | :--- |");

        for (const [agent, info] of Object.entries(status)) {
            const data = info as { state: string; task: string; lastUpdated?: string };
            lines.push(`| @${agent} | ${data.state} | ${data.task} | ${data.lastUpdated || "-"} |`);
        }

        lines.push("", "## 📜 HISTORY");
        
        // Add last 5 history items
        const historyDir = path.join(storePath, "history");
        if (fs.existsSync(historyDir)) {
            const histFiles = fs.readdirSync(historyDir)
                .filter(f => f.endsWith(".json"))
                .sort()
                .reverse()
                .slice(0, 10);
            
            histFiles.forEach(f => {
                const hist = JSON.parse(fs.readFileSync(path.join(historyDir, f), "utf8"));
                lines.push(`### ${f.replace(".json", "")}`);
                lines.push(hist.content);
                lines.push("");
            });
        }

        writeTextFile(mdPath, lines.join("\n"));
        logger.debug("Markdown memory synchronized.");
    } catch (err) {
        logger.debug("Markdown memory sync failed", err);
    }
}


export function acquireMemoryLock(lockPath: string): boolean {
    try {
        fs.writeFileSync(lockPath, String(Date.now()), { flag: "wx" });
        return true;
    } catch (err: unknown) {
        const error = err as { code?: string };
        if (error.code === "EEXIST") {
            try {
                const stat = fs.statSync(lockPath);
                if (Date.now() - stat.mtimeMs > 10000) {
                    fs.unlinkSync(lockPath);
                    fs.writeFileSync(lockPath, String(Date.now()), { flag: "wx" });
                    return true;
                }
            } catch (_e) { /* ignore */
                // Ignore
            }
        }
        return false;
    }
}

export function releaseMemoryLock(lockPath: string): void {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
}
