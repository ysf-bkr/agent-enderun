#!/usr/bin/env node
import fs from "fs";
import { approveCommand } from "./commands/approve.js";
import { checkCommand } from "./commands/check.js";
import { updateApiContractCommand, verifyApiContractCommand } from "./commands/contract.js";
import { initCommand } from "./commands/init.js";
import { updateProjectMemoryCommand } from "./commands/memory.js";
import { orchestrateCommand, sendMessage } from "./commands/orchestrate.js";
import { planCommand } from "./commands/plan.js";
import { statusCommand } from "./commands/status.js";
import { traceNewCommand } from "./commands/trace.js";
import { getMemoryPath, readActiveTraceId } from "./utils/memory.js";
import { getPackageVersion, getValidatorPath } from "./utils/pkg.js";

/**
 * Main CLI entry point.
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    const KNOWN_COMMANDS = [
        "init", "check", "status", "trace:new", "update_project_memory",
        "plan", "orchestrate", "loop", "verify-contract", "update-contract",
        "validate", "validate-army", "check:al", "version", "-v", "--version", "help", "-h", "--help",
        "git:commit", "git:sync", "check:compliance", "explorer:graph", "explorer:audit",
        "knowledge:update", "knowledge:search", "log:action", "run-script", "security:audit", "check:lint", "approve"
    ];

    // Handle @agent delegation syntax
    if (command?.startsWith("@")) {
        const to = command;
        const content = args.slice(1).join(" ");
        if (!content) {
            process.stderr.write(`❌ Error: Missing task content for ${to}.\n`);
            process.stderr.write(`Usage: agent-enderun ${to} "Your task description"\n`);
            process.exit(64);
        }

        const memoryPath = getMemoryPath();

        let traceId = "T-000";
        if (fs.existsSync(memoryPath)) {
            const memoryContent = fs.readFileSync(memoryPath, "utf8");
            const tid = readActiveTraceId(memoryContent);
            if (tid) traceId = tid.trim();
        }

        await sendMessage({
            from: "@manager",
            to,
            category: "DELEGATION",
            content,
            traceId
        });

        process.stdout.write(`✅ Task delegated to ${to} (Trace: ${traceId})\n`);
        process.stdout.write("👉 Run \"agent-enderun orchestrate\" to process.\n");
        return;
    }

    switch (command) {
        case "init": {
            const dryRun = args.includes("--dry-run");
            const isUnified = args.includes("--unified");
            const forceYes = args.includes("--yes") || args.includes("-y");
            const adapter = args.find(a => !a.startsWith("-") && a !== "init") || "gemini";
            await initCommand(adapter, { dryRun, unified: isUnified, yes: forceYes });
            break;
        }

        case "check":
            await checkCommand();
            break;

        case "plan":
            await planCommand();
            break;

        case "status":
            await statusCommand();
            break;

        case "trace:new": {
            const description = args[1] || "Default task";
            const agent = args[2] || "manager";
            const priority = args[3] || "P1";
            await traceNewCommand(description, agent, priority);
            break;
        }

        case "update_project_memory": {
            const section = args[1];
            const content = args[2];
            if (!section || !content) {
                process.stderr.write("❌ Error: section and content are required.\n");
                process.exit(64);
            }
            await updateProjectMemoryCommand(section, content);
            break;
        }

        case "orchestrate":
        case "loop":
            await orchestrateCommand();
            break;

        case "approve": {
            const traceId = args[1];
            if (!traceId) {
                process.stderr.write("❌ Error: traceId is required.\n");
                process.exit(64);
            }
            await approveCommand(traceId);
            break;
        }

        case "verify-contract":
            await verifyApiContractCommand();
            break;

        case "update-contract":
            await updateApiContractCommand();
            break;

        case "validate":
        case "validate-army":
        case "check:al": {
            const { execSync } = await import("child_process");
            try {
                const validatorPath = getValidatorPath();
                execSync(`node "${validatorPath}"`, { stdio: "inherit" });
            } catch {
            // handled by validator
            }
            break;
        }

        case "git:commit": {
            const memoryContent = fs.existsSync(getMemoryPath()) ? fs.readFileSync(getMemoryPath(), "utf8") : "";
            const traceId = readActiveTraceId(memoryContent) || "T-000";
            const { gitCommitCommand } = await import("./commands/git.js");
            await gitCommitCommand(traceId);
            break;
        }

        case "git:sync": {
            const { gitSyncCommand } = await import("./commands/git.js");
            await gitSyncCommand();
            break;
        }

        case "check:compliance": {
            const targetPath = args[1] || "src";
            const { complianceCheckCommand } = await import("./commands/compliance.js");
            await complianceCheckCommand(targetPath);
            break;
        }

        case "explorer:graph": {
            const targetPath = args[1] || "src";
            const { explorerGraphCommand } = await import("./commands/explorer.js");
            await explorerGraphCommand(targetPath);
            break;
        }

        case "explorer:audit": {
            const targetPath = args[1] || "src";
            const { explorerAuditCommand } = await import("./commands/explorer.js");
            await explorerAuditCommand(targetPath);
            break;
        }

        case "knowledge:update": {
            const topic = args[1];
            const content = args[2];
            const { updateKnowledgeBaseCommand } = await import("./commands/knowledge.js");
            await updateKnowledgeBaseCommand(topic, content);
            break;
        }

        case "knowledge:search": {
            const query = args[1];
            const { searchKnowledgeBaseCommand } = await import("./commands/knowledge.js");
            await searchKnowledgeBaseCommand(query);
            break;
        }

        case "log:action": {
            const agent = args[1];
            const action = args[2];
            const status = args[3] || "SUCCESS";
            const summary = args[4] || "";
            const memoryContent = fs.existsSync(getMemoryPath()) ? fs.readFileSync(getMemoryPath(), "utf8") : "";
            const traceId = readActiveTraceId(memoryContent) || "T-000";
            const { logAgentActionCommand } = await import("./commands/log.js");
            await logAgentActionCommand({ agent, action, status, summary, traceId });
            break;
        }

        case "run-script": {
            const script = args[1];
            const projectPath = args[2] || ".";
            const { runScriptCommand } = await import("./commands/script.js");
            await runScriptCommand(script, projectPath);
            break;
        }

        case "security:audit": {
            const targetPath = args[1] || "src";
            const { securityAuditCommand } = await import("./commands/security.js");
            await securityAuditCommand(targetPath);
            break;
        }

        case "check:lint": {
            const { lintCommand } = await import("./commands/lint.js");
            await lintCommand();
            break;
        }

        case "version":
        case "-v":
        case "--version":
            process.stdout.write(`v${getPackageVersion()}\n`);
            break;

        case "help":
        case "-h":
        case "--help":
            showHelp();
            break;

        default:
            if (command && !KNOWN_COMMANDS.includes(command)) {
            // Natural language request fallback to @manager
                const content = args.join(" ");
                const memoryPath = getMemoryPath();

                let traceId = "T-000";
                if (fs.existsSync(memoryPath)) {
                    const memoryContent = fs.readFileSync(memoryPath, "utf8");
                    const tid = readActiveTraceId(memoryContent);
                    if (tid) traceId = tid.trim();
                }

                await sendMessage({
                    from: "@user",
                    to: "@manager",
                    category: "ACTION",
                    content,
                    traceId
                });

                process.stdout.write(`📡 Request sent to @manager: "${content}" (Trace: ${traceId})\n`);
                process.stdout.write("👉 Run 'agent-enderun orchestrate' to process.\n");
            } else {
                showHelp();
            }
            break;
    }
}

function showHelp() {
    process.stdout.write(`
🎖️  Agent Enderun CLI (v${getPackageVersion()}) — The Supreme AI Orchestrator

Usage:
  agent-enderun <command> [options]
  agent-enderun @<agent> "task description"
  agent-enderun "natural language request"

Commands:
  @<agent> <task>     Delegate a task to a specialist agent (e.g. @backend, @frontend)
  init [adapter]      Initialize Agent Enderun framework.
                      Options: --interactive, --dry-run
  check               Perform an enterprise-grade system health check
  status              Show active phase, trace ID, and agent statuses
  trace:new <desc>    Start a new task chain with a unique Trace ID
  plan                Read all docs/ files and create planning tasks
  orchestrate         Start the dynamic Hermes agent orchestration loop
  verify-contract     Validate type alignment between backend and frontend
  update-contract     Generate and synchronize a new contract hash
  git:commit          Suggest git commit messages matching the Trace ID
  git:sync            Sync and rebase the project with remote repository
  check:compliance    Verify file compliance with ENDERUN.md rules
  explorer:graph      Generate import dependency charts in Mermaid format
  explorer:audit      Scan source files for lines-of-code complexity
  knowledge:update    Add or update a topic in the local knowledge base
  knowledge:search    Search the local knowledge base for a topic query
  log:action          Record structured logs for agent executions
  run-script          Execute package scripts in the project directory
  security:audit      Audit source files for secrets and unsafe coding
  check:lint          Run ESLint checks on the project files
  version             Show version information

Natural Language:
  If you provide a sentence that is not a known command, it will be automatically
  sent to the @manager for orchestration.

Example:
  agent-enderun "Audit my project"
  agent-enderun @backend "Create the login page"
    \n`);
}

import { EnderunBaseError } from "../shared/errors.js";
import { logger } from "../shared/logger.js";

main().catch((err) => {
    if (err instanceof EnderunBaseError) {
        process.stderr.write(`\n❌ [${err.code}] Error: ${err.message}\n`);
        if (err.solution) {
            process.stderr.write(`💡 Solution Tip: ${err.solution}\n\n`);
        }
    } else {
        process.stderr.write(`\n❌ Fatal Error: ${err.message || String(err)}\n`);
    }

    logger.fatal("Fatal exception during CLI execution", err);
    process.exit(1);
});
