// ─────────────────────────────────────────────────────────────────────────────
//  Enderun Army — Agent Registry
//  Enderun Order v2 · Structured AgentDefinition schema
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import { AgentDefinition } from "./types.js";
import { getPackageRoot } from "../../cli/utils/pkg.js";

// Import individual agent definitions
import { manager } from "./registry/manager.js";
import { security } from "./registry/security.js";
import { architect } from "./registry/architect.js";
import { backend } from "./registry/backend.js";
import { frontend } from "./registry/frontend.js";
import { mobile } from "./registry/mobile.js";
import { quality } from "./registry/quality.js";
import { database } from "./registry/database.js";
import { devops } from "./registry/devops.js";
import { analyst } from "./registry/analyst.js";
import { native } from "./registry/native.js";
import { explorer } from "./registry/explorer.js";
import { git } from "./registry/git.js";

export const ALL_AGENTS: AgentDefinition[] = [
    manager,
    security,
    architect,
    backend,
    frontend,
    mobile,
    quality,
    database,
    devops,
    analyst,
    native,
    explorer,
    git
];

// ─────────────────────────────────────────────────────────────────────────────
//  Multi-Platform Agent Exporter
//  Supported targets:
//    claude-code  → .claude/agents/{name}.md   (YAML frontmatter + system prompt)
//    gemini-cli   → .gemini/agents/{name}.md   (same format, Gemini field names)
//    antigravity  → .agents/{name}/agent.json  (JSON, customAgent schema)
//    codex-cli    → .agents/{name}.md          (YAML frontmatter, AGENTS.md style)
// ─────────────────────────────────────────────────────────────────────────────

/** Map our internal tool names → Claude Code's built-in tool identifiers */
const CLAUDE_TOOL_MAP: Record<string, string> = {
    read_file:             "Read",
    write_file:            "Write",
    replace_text:          "Edit",
    batch_surgical_edit:   "MultiEdit",
    patch_file:            "Edit",
    list_dir:              "LS",
    grep_search:           "Grep",
    run_shell_command:     "Bash",
    view_file:             "Read",
    run_tests:             "Bash",
    log_agent_action:      "Write",
    send_agent_message:    "Task",
    // Enderun-custom tools pass through as-is (MCP or custom tools)
    orchestrate_loop:      "Task",
    get_project_map:       "Bash",
    get_project_gaps:      "Bash",
    get_memory_insights:   "Read",
    read_project_memory:   "Read",
    update_project_memory: "Write",
    audit_dependencies:    "Bash",
    get_framework_status:  "Bash",
    get_system_health:     "Bash",
    check_active_ports:    "Bash",
    start_dashboard:       "Bash",
    update_contract_hash:  "Write",
};

/** Map our internal tool names → Gemini CLI tool identifiers */
const GEMINI_TOOL_MAP: Record<string, string> = {
    read_file:             "read_file",
    write_file:            "write_file",
    replace_text:          "replace",
    batch_surgical_edit:   "replace",
    patch_file:            "replace",
    list_dir:              "list_directory",
    grep_search:           "grep_search",
    run_shell_command:     "run_shell_command",
    view_file:             "read_file",
    run_tests:             "run_shell_command",
    log_agent_action:      "write_file",
    send_agent_message:    "run_shell_command",
    orchestrate_loop:      "run_shell_command",
    get_project_map:       "run_shell_command",
    get_project_gaps:      "run_shell_command",
    get_memory_insights:   "read_file",
    read_project_memory:   "read_file",
    update_project_memory: "write_file",
    audit_dependencies:    "run_shell_command",
    get_framework_status:  "run_shell_command",
    get_system_health:     "run_shell_command",
    check_active_ports:    "run_shell_command",
    start_dashboard:       "run_shell_command",
    update_contract_hash:  "write_file",
};

/** Strategy: which model to assign based on capability score */
function resolveModel(
    cap: number,
    platform: "claude-code" | "gemini-cli" | "antigravity" | "codex-cli"
): string {
    if (platform === "claude-code") {
        return cap === 10 ? "claude-opus-4-8"
            : cap === 9  ? "claude-sonnet-4-6"
                :              "claude-haiku-4-5";
    }
    if (platform === "gemini-cli" || platform === "antigravity") {
        return cap === 10 ? "gemini-2.5-pro"
            : cap === 9  ? "gemini-2.5-flash"
                :              "gemini-2.5-flash-8b";
    }
    // codex-cli
    return cap === 10 ? "codex-1" : "o4-mini";
}

/** Build a flat system prompt string from structured instructions */
function buildSystemPrompt(ag: AgentDefinition, baseKnowledgeDir: string = path.join(getPackageRoot(), "templates/standards")): string {
    const lines: string[] = [
        "# Identity",
        ag.instructions.identity,
        "",
        "# Mission",
        ag.instructions.mission,
        "",
        "# Chain of Thought Protocol",
        ag.instructions.chainOfThought,
        "",
        "# Discipline rules",
        ...ag.instructions.rules.map(r => `- ${r}`),
    ];
    
    if (ag.instructions.knowledgeFiles?.length) {
        lines.push("", "# Required reading (Standards Enforced)");
        ag.instructions.knowledgeFiles.forEach(f => {
            const filePath = path.join(baseKnowledgeDir, f);
            if (fs.existsSync(filePath)) {
                lines.push(`\n## Content of ${f}:\n`, fs.readFileSync(filePath, "utf8"));
            } else {
                lines.push(`- ${f} (File not found)`);
            }
        });
    }
    return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
//  CLAUDE CODE  →  .claude/agents/{name}.md
// ─────────────────────────────────────────────────────────────────────────────

export function toClaudeCodeMd(ag: AgentDefinition, baseKnowledgeDir?: string): string {
    const tools = [...new Set(ag.tools.map(t => CLAUDE_TOOL_MAP[t] ?? t))];
    const model = resolveModel(ag.capability, "claude-code");
    const color = ag.tier === "supreme" ? "purple"
        : ag.tier === "recon"   ? "gray"
            :                         "blue";

    const frontmatter = [
        "---",
        `name: ${ag.name}`,
        "description: >-",
        `  ${ag.description} Use proactively for ${ag.role.toLowerCase()} tasks.`,
        `model: ${model}`,
        `tools: [${tools.map(t => `"${t}"`).join(", ")}]`,
        `capability: ${ag.capability}`,
        `tags: [${ag.tags.map(t => `"${t}"`).join(", ")}]`,
        `color: ${color}`,
        "---",
    ].join("\n");

    return `${frontmatter}\n\n${buildSystemPrompt(ag, baseKnowledgeDir)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  GEMINI CLI  →  .gemini/agents/{name}.md
// ─────────────────────────────────────────────────────────────────────────────

export function toGeminiCliMd(ag: AgentDefinition, baseKnowledgeDir?: string): string {
    const tools = [...new Set(ag.tools.map(t => GEMINI_TOOL_MAP[t] ?? t))];
    const model = resolveModel(ag.capability, "gemini-cli");

    const frontmatter = [
        "---",
        `name: ${ag.name}`,
        "description: >-",
        `  ${ag.description}`,
        `model: ${model}`,
        `capability: ${ag.capability}`,
        `tags: [${ag.tags.map(t => `"${t}"`).join(", ")}]`,
        "tools:",
        ...tools.map(t => `  - ${t}`),
        "---",
    ].join("\n");

    return `${frontmatter}\n\n${buildSystemPrompt(ag, baseKnowledgeDir)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ANTIGRAVITY CLI  →  .agents/{name}/agent.json
// ─────────────────────────────────────────────────────────────────────────────

export function toAntigravityJson(ag: AgentDefinition): string {
    const payload = {
        name: ag.name,
        displayName: ag.displayName,
        description: ag.description,
        hidden: false,
        customAgentSpec: {
            customAgent: {
                systemPromptSections: [
                    {
                        title: "Identity & Mission",
                        content: `${ag.instructions.identity}\n\n${ag.instructions.mission}`,
                    },
                    {
                        title: "Chain of Thought Protocol",
                        content: ag.instructions.chainOfThought,
                    },
                    {
                        title: "Discipline Rules",
                        content: ag.instructions.rules.join("\n"),
                    },
                    ...(ag.instructions.knowledgeFiles?.length
                        ? [{
                            title: "Required Reading",
                            content: ag.instructions.knowledgeFiles.join("\n"),
                        }]
                        : []),
                ],
                toolNames: ag.tools,
            },
        },
    };
    return JSON.stringify(payload, null, 2);
}

/** Alias for Antigravity JSON export used by CLI */
export const buildAgentJson = toAntigravityJson;

// ─────────────────────────────────────────────────────────────────────────────
//  CODEX CLI (OpenAI)  →  .agents/{name}.md
// ─────────────────────────────────────────────────────────────────────────────

export function toCodexMd(ag: AgentDefinition, baseKnowledgeDir?: string): string {
    const model = resolveModel(ag.capability, "codex-cli");
    const tools = [...new Set(ag.tools.map(t => {
        if (["read_file","view_file","list_dir","grep_search","get_memory_insights","read_project_memory"].includes(t)) return "read";
        if (["write_file","replace_text","batch_surgical_edit","patch_file","update_project_memory","log_agent_action"].includes(t)) return "write";
        return "shell"; 
    }))];

    const frontmatter = [
        "---",
        `agent-type: "${ag.name}"`,
        `display-name: "${ag.displayName}"`,
        "when-to-use: >-",
        `  Use for ${ag.role.toLowerCase()}. ${ag.description}`,
        `model: ${model}`,
        `allowed-tools: [${tools.map(t => `"${t}"`).join(", ")}]`,
        `tier: ${ag.tier}`,
        `capability: ${ag.capability}`,
        "---",
    ].join("\n");

    return `${frontmatter}\n\n${buildSystemPrompt(ag, baseKnowledgeDir)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CURSOR IDE  →  .cursor/rules/{name}.mdc
// ─────────────────────────────────────────────────────────────────────────────

const GLOB_MAP: Record<string, string> = {
    backend: "apps/backend/**/*",
    frontend: "apps/web/**/*",
    database: "apps/backend/src/database/**/*",
    mobile: "apps/mobile/**/*",
    native: "apps/native/**/*",
    quality: "*",
    security: "*",
    devops: "*",
    explorer: "*",
    git: "*",
    analyst: "*",
    manager: "*",
};

export function toCursorMdc(ag: AgentDefinition, baseKnowledgeDir?: string): string {
    const glob = GLOB_MAP[ag.name] || "**/*";
    const frontmatter = [
        "---",
        `description: Agent Enderun — @${ag.name} rules for ${ag.displayName}. ${ag.description.slice(0, 100)}`,
        `globs: ${glob}`,
        "alwaysApply: false",
        "---",
    ].join("\n");

    return `${frontmatter}\n\n${buildSystemPrompt(ag, baseKnowledgeDir)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Batch export
// ─────────────────────────────────────────────────────────────────────────────

export type ExportTarget = "claude-code" | "gemini-cli" | "antigravity" | "codex-cli" | "cursor";

export interface ExportedFile {
  path: string;
  content: string;
}

export function exportAllAgents(target: ExportTarget): ExportedFile[] {
    return ALL_AGENTS.map(ag => {
        switch (target) {
            case "claude-code":
                return { path: `.claude/agents/${ag.name}.md`,         content: toClaudeCodeMd(ag) };
            case "gemini-cli":
                return { path: `.gemini/agents/${ag.name}.md`,         content: toGeminiCliMd(ag) };
            case "antigravity":
                return { path: `.agents/${ag.name}/agent.json`,        content: toAntigravityJson(ag) };
            case "codex-cli":
                return { path: `.agents/${ag.name}.md`,                content: toCodexMd(ag) };
            case "cursor":
                return { path: `.cursor/rules/${ag.name}.mdc`,         content: toCursorMdc(ag) };
        }
    });
}
