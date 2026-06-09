import fs from "fs";
import path from "path";
import { getFrameworkDir } from "../../utils/memory.js";

export function parseProjectMemory() {
    const frameworkDir = getFrameworkDir();
    if (!frameworkDir) return { error: "No framework directory found. Run init." };

    const memPath = path.join(frameworkDir, "memory/PROJECT_MEMORY.md");
    if (!fs.existsSync(memPath)) return { error: "PROJECT_MEMORY.md not found" };

    try {
        const content = fs.readFileSync(memPath, "utf8");
        
        // Parse Phase & Trace ID
        const phaseMatch = content.match(/Phase:\s*([^\n\r]+)/i);
        const traceMatch = content.match(/Trace ID:\s*([^\n\r]+)/i);
        const managerMatch = content.match(/@manager state:\s*([^\n\r]+)/i);

        // Parse Active Tasks Table
        const tasks = [];
        const lines = content.split("\n");
        let inTaskTable = false;
        
        for (const line of lines) {
            if (line.includes("| Trace ID | Task |")) {
                inTaskTable = true;
                continue;
            }
            if (inTaskTable && line.trim() === "") {
                inTaskTable = false;
                continue;
            }
            if (inTaskTable && line.startsWith("|") && !line.includes(":---")) {
                const cols = line.split("|").map(c => c.trim()).filter(Boolean);
                if (cols.length >= 5) {
                    tasks.push({
                        traceId: cols[0],
                        task: cols[1],
                        agent: cols[2],
                        priority: cols[3],
                        status: cols[4]
                    });
                }
            }
        }

        // Parse History Section
        const history = [];
        const historyParts = content.split(/##\s+HISTORY/i);
        if (historyParts[1]) {
            const histLines = historyParts[1].split("\n");
            let currentItem: { title: string, body: string[] } | null = null;
            for (const line of histLines) {
                if (line.startsWith("###")) {
                    if (currentItem) history.push(currentItem);
                    currentItem = { title: line.replace("###", "").trim(), body: [] };
                } else if (currentItem && line.trim() !== "") {
                    currentItem.body.push(line.trim());
                }
            }
            if (currentItem) history.push(currentItem);
        }

        return {
            phase: phaseMatch ? phaseMatch[1].trim() : "PHASE_0",
            traceId: traceMatch ? traceMatch[1].trim() : "N/A",
            managerState: managerMatch ? managerMatch[1].trim() : "ACTIVE",
            tasks,
            history: history.slice(0, 15) // Return last 15 entries
        };
    } catch (e: unknown) {
        return { error: e instanceof Error ? e.message : String(e) };
    }
}

interface ProjectStructureEntry {
  name: string;
  path: string;
  type: "directory" | "file";
  children?: ProjectStructureEntry[];
}

export function getProjectStructure(): ProjectStructureEntry[] {
    const projectRoot = process.cwd();

    function walk(dir: string, depth = 0): ProjectStructureEntry[] {
        if (depth > 3) return []; // Limit depth for performance

        const entries: ProjectStructureEntry[] = [];
        let files: fs.Dirent[];

        try {
            files = fs.readdirSync(dir, { withFileTypes: true });
        } catch (_e) {
            // Silently ignore directories that cannot be read
            return [];
        }
        
        for (const file of files) {
            if (file.name.startsWith(".") || file.name === "node_modules" || file.name === "dist") continue;
            
            const fullPath = path.join(dir, file.name);
            const entry: ProjectStructureEntry = {
                name: file.name,
                path: path.relative(projectRoot, fullPath),
                type: file.isDirectory() ? "directory" : "file"
            };

            if (file.isDirectory()) {
                entry.children = walk(fullPath, depth + 1);
            }
            entries.push(entry);
        }
        return entries;
    }

    try {
        return walk(projectRoot);
    } catch {
        return [];
    }
}

export function readManagerLogs() {
    const frameworkDir = getFrameworkDir();
    if (!frameworkDir) return [];
    
    const logsPath = path.join(frameworkDir, "logs/manager.json");
    if (!fs.existsSync(logsPath)) return [];

    try {
        const raw = fs.readFileSync(logsPath, "utf8");
        // Handle both json array format and jsonl format
        if (raw.trim().startsWith("[")) {
            return JSON.parse(raw);
        } else {
            return raw.split("\n").filter(Boolean).map(line => JSON.parse(line));
        }
    } catch {
        return [];
    }
}

export function listAgents() {
    const frameworkDir = getFrameworkDir();
    if (!frameworkDir) return [];
    const agentsPath = path.join(frameworkDir, "agents");
    if (!fs.existsSync(agentsPath)) return [];

    try {
        const files = fs.readdirSync(agentsPath).filter(f => f.endsWith(".json") && f !== "agent_army_schema.json");
        return files.map(file => {
            const content = JSON.parse(fs.readFileSync(path.join(agentsPath, file), "utf8"));
            return {
                name: content.name,
                displayName: content.displayName || content.name,
                description: content.description,
                role: content.role,
                capability: content.capability,
                tags: content.tags || []
            };
        });
    } catch {
        return [];
    }
}
