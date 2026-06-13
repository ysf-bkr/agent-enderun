import fs from "fs";
import path from "path";
import { execSync } from "child_process";

import { getFrameworkDir, getMemoryPath, getConfiguredPaths, isFrameworkDevelopmentRepo, readState } from "../utils/memory.js";
import { getPackageVersion, getValidatorPath } from "../utils/pkg.js";
import { UI } from "../utils/ui.js";
import { logger } from "../../shared/logger.js";
import { scanProjectCompliance } from "../utils/compliance.js";
import { ALL_AGENTS } from "../../modules/agents/definitions.js";
import { detectActiveAgentLayouts, findAgentInstruction } from "../adapters/paths.js";

import { verifyApiContractCommand } from "./contract.js";

export async function checkCommand() {
    UI.intent("Agent Enderun Health Check", `Checking system health and discipline rules (v${getPackageVersion()})...`);
    let issues = 0;

    const state = readState();
    if (!state) {
        UI.error("Memory state not found. Run 'init' first.");
        return;
    }

    const frameworkDir = getFrameworkDir();
    const memoryPath = getMemoryPath();
    const pathsMap = getConfiguredPaths();

    UI.success(`Using framework dir: ${frameworkDir}`);

    // --- Contract Gate (Phase 2+ Discipline) ---
    if (["PHASE_2", "PHASE_3", "PHASE_4"].includes(state.phase)) {
        console.warn("\n📝 Validating API Contracts (Phase 2+ Required)...");
        try {
            const contractOk = await verifyApiContractCommand({ silent: true });
            if (!contractOk) {
                UI.error("Contract verification FAILED! You cannot be in Phase 2+ with unverified contracts.");
                issues++;
            } else {
                UI.success("API Contracts verified and sealed.");
            }
        } catch {
            UI.error("Error during contract verification.");
            issues++;
        }
    }

    let knowledgeDir = "knowledge";
    if (frameworkDir === ".github") knowledgeDir = "instructions";

    const constitutionPath = fs.existsSync(path.join(process.cwd(), "ENDERUN.md")) ? "ENDERUN.md" : path.join(frameworkDir, "ENDERUN.md");
    
    const rootPandaPath = path.join(process.cwd(), "panda.config.ts");
    const appPandaPath = path.join(pathsMap.frontend, "panda.config.ts");

    if (fs.existsSync(rootPandaPath)) {
        UI.error(`Panda CSS config must NOT be at the root directory! Move it to '${pathsMap.frontend}/panda.config.ts'.`);
        issues++;
    }

    const isFrameworkDevelopment = isFrameworkDevelopmentRepo();

    const checks = [
        { name: "Constitution (ENDERUN.md)", path: constitutionPath },
        { name: "Memory (PROJECT_MEMORY.md)", path: path.relative(process.cwd(), memoryPath) },
        { name: "Command Map (cli-commands.json)", path: path.join(frameworkDir, "cli-commands.json") },
        { name: "Framework Config (config.json)", path: path.join(frameworkDir, "config.json") },
        { name: "Agent Status (STATUS.md)", path: path.join(frameworkDir, "STATUS.md") },
        { name: "MCP Config (mcp.json)", path: "mcp.json" },
        { name: "ESLint Config (eslint.config.js)", path: "eslint.config.js", optional: !isFrameworkDevelopment },
        { name: "ESLint Standards", path: path.join(frameworkDir, `${knowledgeDir}/eslint-standards.md`) },
        { name: "CRUD Governance Standards", path: path.join(frameworkDir, `${knowledgeDir}/crud-governance.md`) },
        { name: "Architecture Standards", path: path.join(frameworkDir, `${knowledgeDir}/architecture-standards.md`) },
        { name: "Frontend Standards", path: path.join(frameworkDir, `${knowledgeDir}/frontend-standards.md`) },
        { name: "Tailwind Standards", path: path.join(frameworkDir, `${knowledgeDir}/tailwind-standards.md`), optional: true },
        { name: "Mobile Standards", path: path.join(frameworkDir, `${knowledgeDir}/mobile-standards.md`) },
        { name: "Security Standards", path: path.join(frameworkDir, `${knowledgeDir}/security-standards.md`) },
        { name: "Quality & Discipline Standards", path: path.join(frameworkDir, `${knowledgeDir}/quality-standards.md`) },
        { name: "Logging & Secrets Standards", path: path.join(frameworkDir, `${knowledgeDir}/logging-and-secrets.md`) },
        { name: "Testing Standards", path: path.join(frameworkDir, `${knowledgeDir}/testing-standards.md`) },
        { name: "i18n Standards", path: path.join(frameworkDir, `${knowledgeDir}/i18n-standards.md`) },
        { name: ".env.example", path: ".env.example" },
        ...(isFrameworkDevelopment ? [{ name: "MCP Server", path: "framework-mcp/package.json" }] : []),
        { name: "Panda CSS Config", path: appPandaPath, optional: true },
    ];

    for (const check of checks) {
        const fullPath = path.isAbsolute(check.path) ? check.path : path.join(process.cwd(), check.path);
        if (fs.existsSync(fullPath)) {
            UI.success(`${check.name} found.`);
        } else {
            if (check.optional) {
                UI.warning(`${check.name} MISSING! (${check.path}) [Optional]`);
            } else {
                UI.error(`${check.name} MISSING! (${check.path})`);
                issues++;
            }
        }
    }

    // Agent Army Check
    console.warn("\n🛡️  Running Agent Army Compliance...");
    try {
        const validatorScript = getValidatorPath();
        execSync(`node "${validatorScript}"`, { stdio: "pipe" });
        UI.success("Agent Army AL validation PASSED.");
    } catch (error: unknown) {
        const err = error as Error & { stderr?: Buffer };
        UI.error(`Agent Army AL validation FAILED: ${err.message}`);
        if (err.stderr) console.error(err.stderr.toString());
        issues++;
    }

    // Agent Documentation Check (Live Integrity)
    console.warn("\n📚 Checking Agent Integrity (Instructions)...");

    const projectRoot = process.cwd();
    const activeLayouts = detectActiveAgentLayouts(projectRoot);

    if (activeLayouts.length > 0) {
        UI.success(`Active agent layout(s): ${activeLayouts.join(", ")}`);
        ALL_AGENTS.forEach((agent) => {
            const found = findAgentInstruction(projectRoot, agent.name);
            if (found) {
                UI.success(`Instructions for @${agent.name} found at ${found}`);
            } else {
                UI.error(`Instructions for @${agent.name} MISSING! Run 'agent-enderun init' to scaffold.`);
                issues++;
            }
        });
    } else {
        UI.warning("No active agent instruction directory detected. Run 'agent-enderun init [adapter]' first.");
        issues++;
    }

    // Code Quality - Using the new Compliance Scanner
    console.warn("\n⚖️  Checking Discipline (Code Quality)...");
    const complianceIssues = scanProjectCompliance();
    if (complianceIssues.length > 0) {
        complianceIssues.forEach(issue => {
            UI.error(`${issue.rule} in ${issue.file}:${issue.line}`);
        });
        issues += complianceIssues.length;
    } else {
        UI.success("No compliance issues detected.");
    }

    const rootTestFiles = checkRootTestFiles();
    if (rootTestFiles.length > 0) {
        UI.warning(`Test files found in the root directory: ${rootTestFiles.join(", ")}. It is recommended to place all test files under the 'tests/' folder or application-specific directories.`);
    }

    try {
        UI.intent("Type Check", "Running 'npx tsc --noEmit' (this may take a few seconds)...");
        execSync("npx tsc --noEmit", { stdio: "pipe" });
        UI.success("TypeScript type check PASSED.");
    } catch (err) {
        UI.warning("TypeScript type check FAILED or 'tsc' not found. This is a non-blocking warning for lightweight checks.");
        logger.debug("npx tsc --noEmit check failed", err);
    }

    if (issues === 0) {
        UI.success("\n🚀 All systems green! Agent Enderun is ready.");
    } else {
        UI.error(`\n⚠️  Found ${issues} issues. Please fix them.`);
        process.exit(1);
    }
}

function checkRootTestFiles(): string[] {
    const rootDir = process.cwd();
    if (!fs.existsSync(rootDir)) return [];
    const files = fs.readdirSync(rootDir);
    const testFiles: string[] = [];
    for (const file of files) {
        const fullPath = path.join(rootDir, file);
        try {
            if (fs.statSync(fullPath).isFile()) {
                if (file.includes(".test.") || file.includes(".spec.")) {
                    testFiles.push(file);
                }
            }
        } catch (err) {
            logger.debug(`Failed to stat file ${fullPath} in checkRootTestFiles`, err);
        }
    }
    return testFiles;
}
