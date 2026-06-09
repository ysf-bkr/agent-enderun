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
    options?: { unified?: boolean; adapters?: string[] }
) {
    if (dryRun) return;
    const frameworkDir = path.join(targetDir, fDir);
    const palette = COLOR_PALETTES[selectedPalette as keyof typeof COLOR_PALETTES] || COLOR_PALETTES["Modern Blue"];

    const config = {
        name: FRAMEWORK_NAME,
        version: getPackageVersion(),
        unified: options?.unified || false,
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
    for (const ag of ALL_AGENTS) {
        statusContent += "| @" + ag.name + " | READY | Idle | - | - | - | - |\n";
    }
    writeTextFile(path.join(frameworkDir, "STATUS.md"), statusContent);
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
        const isSelectedAdapter = name.toLowerCase() === adapterId.split("-")[0] || name === adapterId;
        
        if (unified || isSelectedAdapter) {
            const shimContent = remapFrameworkContent(content, coreDir, adapterId);
            const shimAdapter = ADAPTERS[name as AdapterId] || adapter;
            const shimFileName = (unified && !isSelectedAdapter) ? (shimAdapter.shimFile || `${name.toUpperCase()}.md`) : (adapter.shimFile || `${name.toUpperCase()}.md`);
            
            if (!dryRun) writeTextFile(path.join(projectRoot, shimFileName), shimContent);
            if (isSelectedAdapter) {
                console.warn(`✅ Platform shim created: ${shimFileName}`);
            } else if (unified) {
                console.warn(`✅ Unified platform shim added: ${shimFileName}`);
            }
        }
    }
}
