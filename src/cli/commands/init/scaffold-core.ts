import fs from "fs";
import path from "path";
import { 
    remapFrameworkContent, 
    type AdapterConfig, 
    type AdapterId,
    ADAPTERS
} from "../../adapters/index.js";
import { SHIM_TEMPLATES } from "../../shims.js";
import { writeJsonFile, writeTextFile } from "../../utils/fs.js";
import { getPackageRoot, getPackageVersion } from "../../utils/pkg.js";
import { ALL_AGENTS } from "../../../modules/agents/definitions.js";

const FRAMEWORK_NAME = "Agent Enderun";

const COLOR_PALETTES = {
    "Modern Blue": { primary: "#0ea5e9", secondary: "#64748b", accent: "#f43f5e" },
    "Enterprise Slate": { primary: "#334155", secondary: "#94a3b8", accent: "#10b981" },
    "Deep Purple": { primary: "#8b5cf6", secondary: "#d8b4fe", accent: "#f59e0b" }
};

export function scaffoldConstitution(targetDir: string, frameworkDir: string, adapterId: AdapterId, dryRun: boolean) {
    if (dryRun) return;
    let content = `# 🎖️ ${FRAMEWORK_NAME} — Constitution (v${getPackageVersion()})\n\nDiscipline and Order.`;
    let readSuccess = false;
    try {
        const templatePath = path.join(getPackageRoot(), "ENDERUN.md");
        if (fs.existsSync(templatePath)) {
            content = fs.readFileSync(templatePath, "utf8");
            readSuccess = true;
        }
    } catch (e) {
        console.warn(`⚠️  Failed to read global constitution template: ${e}`);
    }
    content = remapFrameworkContent(content, frameworkDir, adapterId);
    const destPath = path.join(targetDir, frameworkDir, "ENDERUN.md");
    writeTextFile(destPath, content);

    console.warn(`✅ Constitution file created inside: ${frameworkDir}/ENDERUN.md${readSuccess ? "" : " (default template)"}`);
}

export function scaffoldFrameworkConfigs(
    targetDir: string, 
    fDir: string, 
    adapter: AdapterConfig, 
    dryRun: boolean, 
    selectedPalette: string,
    options?: { unified?: boolean; adapters?: string[]; profile?: string }
) {
    if (dryRun) return;
    const frameworkDir = path.join(targetDir, fDir);
    const palette = COLOR_PALETTES[selectedPalette as keyof typeof COLOR_PALETTES] || COLOR_PALETTES["Modern Blue"];

    const config = {
        name: FRAMEWORK_NAME,
        version: getPackageVersion(),
        unified: options?.unified || false,
        profile: options?.profile || "full",
        adapters: options?.adapters || [adapter.id],
        theme: {
            palette: selectedPalette,
            colors: palette
        }
    };
    writeJsonFile(path.join(frameworkDir, "config.json"), config, dryRun);

    // Scaffold shared-facts.json in memory-graph
    const graphDir = path.join(frameworkDir, "memory-graph");
    if (!fs.existsSync(graphDir)) fs.mkdirSync(graphDir, { recursive: true });
    const sharedFactsPath = path.join(graphDir, "shared-facts.json");
    if (!fs.existsSync(sharedFactsPath)) {
        writeJsonFile(sharedFactsPath, {
            project: FRAMEWORK_NAME,
            initializedAt: new Date().toISOString(),
            stack: [],
            policies: []
        }, dryRun);
    }

    let statusContent = "# 🎖️ Status\n\n| Agent | State | Active Task | Last Updated | Notes | Extra | Backup |\n|---|---|---|---|---|---|---|\n";
    
    const liteAgents = ["manager", "architect", "frontend"];
    const activeAgents = (options?.profile === "lite")
        ? ALL_AGENTS.filter(ag => liteAgents.includes(ag.name))
        : ALL_AGENTS;

    const initialStatusJson: Record<string, { state: string; task: string; lastUpdated: string }> = {};
    const now = new Date().toISOString();

    for (const ag of activeAgents) {
        statusContent += "| @" + ag.name + " | READY | Idle | - | - | - | - |\n";
        initialStatusJson[ag.name] = { state: "READY", task: "Idle", lastUpdated: now };
    }
    writeTextFile(path.join(frameworkDir, "STATUS.md"), statusContent);

    // Populate initial status.json
    const statusJsonPath = path.join(frameworkDir, "memory", "status.json");
    if (!fs.existsSync(path.join(frameworkDir, "memory"))) fs.mkdirSync(path.join(frameworkDir, "memory"), { recursive: true });
    writeJsonFile(statusJsonPath, initialStatusJson, dryRun);
}

export function scaffoldShims(
    projectRoot: string, 
    coreDir: string, 
    adapterId: AdapterId, 
    adapter: AdapterConfig, 
    dryRun: boolean,
    unified: boolean = false
) {
    for (const [name, content] of Object.entries(SHIM_TEMPLATES)) {
        // Normalize: "antigravity-cli" template key needs exact match or prefix match
        const isSelectedAdapter = name === adapterId ||
            name.toLowerCase() === adapterId.split("-")[0].toLowerCase();
        
        if (unified || isSelectedAdapter) {
            const shimContent = remapFrameworkContent(content, coreDir, adapterId);
            // In unified mode, each adapter writes its OWN shimFile name.
            // In single-adapter mode, use selected adapter's shimFile.
            const shimAdapter = ADAPTERS[name as AdapterId] || adapter;
            const shimFileName = (unified && !isSelectedAdapter)
                ? (shimAdapter.shimFile || `${name.toUpperCase()}.md`)   // each adapter's own file
                : (adapter.shimFile || `${name.toUpperCase()}.md`);       // selected adapter's file
            
            if (!dryRun) writeTextFile(path.join(projectRoot, shimFileName), shimContent);
            if (isSelectedAdapter) {
                console.warn(`✅ Platform shim created: ${shimFileName}`);
            } else if (unified) {
                console.warn(`✅ Unified platform shim added: ${shimFileName}`);
            }
        }
    }
}
