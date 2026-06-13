import path from "path";
import readline from "readline";

import {
    resolveAdapter,
    runAdapterPostInit,
    scaffoldAgents,
    resolveAgentsDir,
    mirrorUnifiedAgentsToNative,
    ADAPTER_IDS,
    type AdapterId,
} from "../adapters/index.js";
import { ensureDir } from "../utils/fs.js";
import { initializeMemory, getConfiguredPaths } from "../utils/memory.js";
import { getPackageVersion } from "../utils/pkg.js";
import { UI } from "../utils/ui.js";

import { ALL_AGENTS } from "../../modules/agents/definitions.js";
import { 
    scaffoldConstitution, 
    scaffoldFrameworkConfigs, 
    scaffoldShims 
} from "./init/scaffold-core.js";
import { 
    scaffoldSkills, 
    scaffoldStandards 
} from "./init/scaffold-standards.js";
import { scaffoldOps } from "./init/scaffold-ops.js";

const FRAMEWORK_NAME = "Agent Enderun";

const FRAMEWORK_SUBDIRS = [
    "agents",
    "skills",
    "knowledge",
    "prompts",
    "memory",
    "router",
    "registry",
    "observability",
    "rules",
];

async function runInteractiveInit(): Promise<{ selectedDirs: string[], selectedAgents: string[], selectedPalette: string }> {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const question = (query: string): Promise<string> => new Promise((resolve) => rl.question(query, resolve));

    try {
        console.warn(`\n🚀 Welcome to ${FRAMEWORK_NAME} Interactive Setup!`);
        console.warn("\nAvailable Framework Directories:");
        FRAMEWORK_SUBDIRS.forEach((d, i) => console.warn(`${i + 1}. ${d}`));
        const dirInput = await question("\nEnter directory numbers to include (e.g. 1,2,3) or Enter for ALL: ");
        const selectedDirs = dirInput ? dirInput.split(",").map(n => FRAMEWORK_SUBDIRS[parseInt(n.trim()) - 1]).filter(Boolean) : [...FRAMEWORK_SUBDIRS];

        console.warn("\nAvailable Core Agents:");
        ALL_AGENTS.forEach((a, i) => console.warn(`${i + 1}. ${a.name}`));
        const agentInput = await question("\nEnter agent numbers to include (e.g. 1,2) or Enter for ALL: ");
        const selectedAgents = agentInput ? agentInput.split(",").map(n => ALL_AGENTS[parseInt(n.trim()) - 1].name).filter(Boolean) : ALL_AGENTS.map(a => a.name);

        console.warn("\nAvailable Color Palettes:");
        const palettes = ["Modern Blue", "Enterprise Slate", "Deep Purple"];
        palettes.forEach((p, i) => console.warn(`${i + 1}. ${p}`));
        const palInput = await question("\nSelect palette (1-3) or Enter for 'Modern Blue': ");
        const selectedPalette = palettes[parseInt(palInput.trim()) - 1] || "Modern Blue";

        return { selectedDirs, selectedAgents, selectedPalette };
    } finally { rl.close(); }
}

export async function initCommand(adapterName: string, options: { unified?: boolean, dryRun?: boolean, yes?: boolean, profile?: string }) {
    const adapterId = (adapterName || "gemini") as AdapterId;
    const adapter = resolveAdapter(adapterId);

    if (!adapter) {
        UI.error(`Unknown adapter: ${adapterId}`);
        process.exit(1);
    }

    const projectRoot = process.cwd();
    const isUnified = options.unified || false;
    const executionProfile = (options.profile || "full").toLowerCase();

    // STRICT ISOLATION STRATEGY
    const coreDir = ".enderun"; // Pure Memory & Knowledge
    const aiToolDir = isUnified ? ".agents" : adapter.frameworkDir; // Pure Agents & Skills

    const dryRun = options.dryRun || false;
    const forceYes = options.yes || false;

    UI.intent("Enderun Initialization", `Bootstrapping ${FRAMEWORK_NAME} (v${getPackageVersion()}) with ${adapterId} adapter [Profile: ${executionProfile}]...`);

    let selectedDirs: string[];
    let selectedAgents: string[];
    let selectedPalette: string;

    if (forceYes) {
        selectedDirs = ["knowledge", "prompts", "memory", "router", "registry", "observability", "rules"];
        
        if (executionProfile === "lite") {
            const liteAgents = ["manager", "architect", "frontend"];
            selectedAgents = ALL_AGENTS.filter(a => liteAgents.includes(a.name)).map(a => a.name);
        } else {
            selectedAgents = ALL_AGENTS.map(a => a.name);
        }
        
        selectedPalette = "Modern Blue";
        UI.success(`Non-interactive mode: Using default configurations for ${executionProfile} profile.`);
    } else {
        const result = await runInteractiveInit();
        selectedDirs = result.selectedDirs.filter(d => d !== "agents" && d !== "skills");
        selectedAgents = result.selectedAgents;
        selectedPalette = result.selectedPalette;
    }

    ensureDir(path.join(projectRoot, coreDir), dryRun);
    selectedDirs.forEach(dir => {
        ensureDir(path.join(projectRoot, coreDir, dir), dryRun);
    });

    ensureDir(path.join(projectRoot, aiToolDir), dryRun);
    if (adapter.nestedDirs) {
        adapter.nestedDirs.forEach(dir => ensureDir(path.join(projectRoot, aiToolDir, dir), dryRun));
    }

    scaffoldConstitution(projectRoot, coreDir, adapterId, dryRun);
    scaffoldFrameworkConfigs(projectRoot, coreDir, adapter, dryRun, selectedPalette, {
        unified: isUnified,
        adapters: isUnified ? [...ADAPTER_IDS] : [adapterId],
        profile: executionProfile
    });

    scaffoldStandards(path.join(projectRoot, coreDir), dryRun);

    const pathsMap = getConfiguredPaths();

    if (isUnified) {
        // Scaffold ALL agents for ALL adapters under unified hub
        for (const id of ADAPTER_IDS) {
            const dest = resolveAgentsDir(id, true, aiToolDir);
            scaffoldAgents(projectRoot, id, dryRun, selectedAgents, dest.agentsDir, dest.agentsExt, pathsMap);
            if (!dryRun) mirrorUnifiedAgentsToNative(projectRoot, id);
        }
        UI.success(`✅ Scaffolding complete for all adapters under ${aiToolDir}/ with native mirrors.`);
    } else {
        // Standard single-adapter scaffold
        const dest = resolveAgentsDir(adapterId, false);
        scaffoldAgents(projectRoot, adapterId, dryRun, selectedAgents, dest.agentsDir, dest.agentsExt, pathsMap);
        UI.success(`✅ Generated agent definitions under ${dest.agentsDir}/`);
    }

    const skillsBaseDir = path.join(projectRoot, aiToolDir, "skills");
    scaffoldSkills(skillsBaseDir, dryRun);
    scaffoldOps(path.join(projectRoot, coreDir), dryRun);
    scaffoldShims(projectRoot, coreDir, adapterId, adapter, dryRun, isUnified);

    // Initialize runtime directories
    if (!dryRun) {
        ensureDir(path.join(projectRoot, coreDir, "messages"));
        ensureDir(path.join(projectRoot, coreDir, "logs"));
        ensureDir(path.join(projectRoot, coreDir, "memory-graph"));
    }

    initializeMemory(path.join(projectRoot, coreDir), dryRun);
    runAdapterPostInit(adapter, projectRoot);

    UI.success(`\n🚀 ${FRAMEWORK_NAME} (v${getPackageVersion()}) initialized successfully!`);
    console.warn(`\n- Brain & Memory Hub (Protected): ${coreDir}/`);
    console.warn(`- AI Agent Commands (Active): ${aiToolDir}/`);
    console.warn("\nNext Steps:");
    console.warn("  1. Run 'agent-enderun status' to verify the environment.");
    console.warn(`  2. Open ${adapterId === "claude" ? "Claude Desktop" : "your AI Assistant"} and start commanding the Army.`);
}
