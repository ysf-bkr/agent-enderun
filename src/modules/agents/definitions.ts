// ─────────────────────────────────────────────────────────────────────────────
//  Enderun Army — Agent Registry
//  Enderun Order v2 · Structured AgentDefinition schema
//
//  VALID FRONTMATTER FIELDS per platform:
//  ┌───────────────┬────────────────────────────────────────────────────────────┐
//  │ gemini-cli    │ name, description, model, tools (YAML list)                │
//  │ claude-code   │ name, description, model, tools (inline array), color      │
//  │ cursor        │ description, globs, alwaysApply                            │
//  │ codex-cli     │ agent-type, display-name, when-to-use, model, allowed-tools│
//  │ antigravity   │ JSON — customAgentSpec schema                              │
//  └───────────────┴────────────────────────────────────────────────────────────┘
//  Custom fields (capability, tags, tier) are Enderun-internal metadata and
//  must NOT appear in any platform frontmatter.
// ─────────────────────────────────────────────────────────────────────────────

import fs from "fs";
import path from "path";
import { AgentDefinition } from "./types.js";
import { getPackageRoot } from "../../cli/utils/pkg.js";
import { CURSOR_AGENT_GLOBS } from "../../shared/constants.js";

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
//  Tool Maps — Internal tool names → platform-native tool identifiers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Claude Code built-in tool names (case-sensitive).
 * Reference: https://docs.anthropic.com/en/docs/claude-code/sub-agents
 */
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
    update_contract_hash:  "Write",
    acquire_lock:          "Write",
    release_lock:          "Write",
    register_agent:        "Write",
    check_lint:            "Bash",
};

/**
 * Gemini CLI built-in tool names (canonical names validated by Gemini CLI agent schema).
 * Reference: https://github.com/google-gemini/gemini-cli
 *
 * Valid Gemini CLI tool names:
 *   read_file, write_file, replace, grep_search, glob,
 *   list_directory, run_shell_command
 */
const GEMINI_TOOL_MAP: Record<string, string> = {
    read_file:             "read_file",
    write_file:            "write_file",
    replace_text:          "replace",           // ✅ NOT replace_in_file
    batch_surgical_edit:   "replace",           // ✅ NOT replace_in_file
    patch_file:            "replace",           // ✅ NOT replace_in_file
    list_dir:              "list_directory",
    grep_search:           "grep_search",       // ✅ NOT search_file_content
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
    update_contract_hash:  "write_file",
    acquire_lock:          "write_file",
    release_lock:          "write_file",
    register_agent:        "write_file",
    check_lint:            "run_shell_command",
};

// ─────────────────────────────────────────────────────────────────────────────
//  Model Resolution
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assigns the appropriate model based on capability score.
 * Only valid, real model identifiers are used here.
 */
function resolveModel(
    cap: number,
    platform: "claude-code" | "gemini-cli" | "antigravity" | "codex-cli"
): string {
    if (platform === "claude-code") {
        // Verified Claude model names as of 2025-06
        return cap === 10 ? "claude-opus-4-5"
            : cap === 9  ? "claude-sonnet-4-5"
                :              "claude-haiku-3-5";
    }
    if (platform === "gemini-cli" || platform === "antigravity") {
        // Verified Gemini model names as of 2025-06
        return cap === 10 ? "gemini-2.5-pro"
            : cap === 9  ? "gemini-2.5-flash"
                :              "gemini-2.5-flash-lite";
    }
    // codex-cli / OpenAI
    return cap === 10 ? "o3" : "o4-mini";
}

// ─────────────────────────────────────────────────────────────────────────────
//  System Prompt Builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a rich, enterprise-grade system prompt from structured instructions.
 * Embeds governance document contents inline for agents that have knowledgeFiles.
 *
 * @param stripMetaComments - When true, skips the HTML meta-comment header block
 *   (name/capability/tags). Set to true for Gemini CLI and Grok, whose strict
 *   frontmatter validators may misinterpret HTML comments in the document body
 *   as unrecognized YAML keys and reject the agent file entirely.
 */
function buildSystemPrompt(
    ag: AgentDefinition,
    baseKnowledgeDir: string = path.join(getPackageRoot(), "templates/standards"),
    stripMetaComments = false,
    paths: Record<string, string> = { backend: "apps/backend", frontend: "apps/web", mobile: "apps/mobile", docs: "docs" }
): string {
    const metaHeader = stripMetaComments ? [] : [
        `<!-- name: ${ag.name} -->`,
        `<!-- capability: ${ag.capability} -->`,
        `<!-- tags: ${JSON.stringify(ag.tags)} -->`,
        "",
    ];
    const lines: string[] = [
        ...metaHeader,
        `# 🎖️ ${ag.displayName} — Agent Enderun`,
        "",
        "## Identity",
        ag.instructions.identity,
        "",
        "## Mission",
        ag.instructions.mission,
        "",
        "## Role Scope",
        `**Primary Role:** ${ag.role}`,
        `**Authority Tier:** ${ag.tier} (Capability: ${ag.capability}/10)`,
        "",
        "## Project Structure",
        `This project uses the following directory structure:`,
        `- **Backend:** \`${paths.backend}\``,
        `- **Frontend:** \`${paths.frontend}\``,
        `- **Mobile:** \`${paths.mobile}\``,
        `- **Documentation:** \`${paths.docs}\``,
        "",
        "## Chain of Thought Protocol",
        "> Follow these steps in strict order for every task:",
        "",
        ag.instructions.chainOfThought,
        "",
        "## Discipline Rules",
        "> These are **non-negotiable** governance mandates. Violating any rule triggers an immediate task freeze.",
        "",
        ...ag.instructions.rules.map((r: string, i: number) => `${i + 1}. ${r}`),
        "",
        "## Enterprise Context",
        "You are operating within a **multi-agent enterprise system** governed by the Agent Enderun framework.",
        "All actions are traced, logged, and auditable. Every decision must be defensible and reversible.",
        "- Always read PROJECT_MEMORY.md at session start for full context.",
        "- Always pass the active **Trace ID** in all agent-to-agent messages.",
        "- Never perform irreversible operations (schema drops, bulk deletes) without @manager approval.",
        "- Prefer surgical edits (`replace_text`, `patch_file`) over full file rewrites.",
        "- Escalate ambiguity to @manager instead of guessing.",
        `- Ensure all development happens exclusively inside \`${paths.backend}\`, \`${paths.frontend}\`, or \`${paths.mobile}\`.`,
    ];

    if (ag.instructions.knowledgeFiles?.length) {
        lines.push("", "## Governance Standards (Required Reading)");
        lines.push("> Read and internalize the following standards before acting on any task.");
        ag.instructions.knowledgeFiles.forEach((f: string) => {
            const filePath = path.join(baseKnowledgeDir, f);
            if (fs.existsSync(filePath)) {
                lines.push("", `### 📘 ${f}`, "", fs.readFileSync(filePath, "utf8").trim());
            } else {
                lines.push("", `### 📘 ${f}`, `> ⚠️ File not found at \`${filePath}\`. Run \`agent-enderun init\` to scaffold standards.`);
            }
        });
    }

    return lines.join("\n");
}

// ─────────────────────────────────────────────────────────────────────────────
//  CLAUDE CODE  →  .claude/agents/{name}.md
//  Valid fields: name, description, model, tools, color
//  Ref: https://docs.anthropic.com/en/docs/claude-code/sub-agents
// ─────────────────────────────────────────────────────────────────────────────

export function toClaudeCodeMd(ag: AgentDefinition, baseKnowledgeDir?: string, paths?: Record<string, string>): string {
    const tools = [...new Set(ag.tools.map((t: string) => CLAUDE_TOOL_MAP[t] ?? t))];
    const model = resolveModel(ag.capability, "claude-code");
    const color = ag.tier === "supreme" ? "purple"
        : ag.tier === "recon"   ? "gray"
            :                         "blue";

    // Only officially supported frontmatter fields
    const frontmatter = [
        "---",
        `name: ${ag.name}`,
        "description: >-",
        `  ${ag.description} Invoke proactively for ${ag.role.toLowerCase()} tasks in enterprise monorepo projects.`,
        `model: ${model}`,
        `tools: [${tools.map(t => `"${t}"`).join(", ")}]`,
        `color: ${color}`,
        "---",
    ].join("\n");

    return `${frontmatter}\n\n${buildSystemPrompt(ag, baseKnowledgeDir, false, paths)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  GEMINI CLI  →  .gemini/agents/{name}.md
//  Valid fields: name, description, model, tools (YAML list)
//  Ref: https://ai.google.dev/gemini-api/docs/agents
// ─────────────────────────────────────────────────────────────────────────────

export function toGeminiCliMd(ag: AgentDefinition, baseKnowledgeDir?: string, paths?: Record<string, string>): string {
    const tools = [...new Set(ag.tools.map((t: string) => GEMINI_TOOL_MAP[t] ?? t))];
    const model = resolveModel(ag.capability, "gemini-cli");

    const frontmatter = [
        "---",
        `name: ${ag.name}`,
        "description: >-",
        `  ${ag.description} Use for ${ag.role.toLowerCase()} tasks.`,
        `model: ${model}`,
        "tools:",
        ...tools.map(t => `  - ${t}`),
        "---",
    ].join("\n");

    const body = buildSystemPrompt(ag, baseKnowledgeDir, true, paths);

    const metaFooter = [
        "",
        `<!-- name: ${ag.name} -->`,
        `<!-- capability: ${ag.capability} -->`,
        `<!-- tags: ${JSON.stringify(ag.tags)} -->`,
    ].join("\n");

    return `${frontmatter}\n\n${body}${metaFooter}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ANTIGRAVITY CLI  →  .agents/{name}/agent.json
//  Spec: Antigravity customAgentSpec JSON schema
// ─────────────────────────────────────────────────────────────────────────────

export function toAntigravityJson(ag: AgentDefinition, baseKnowledgeDir?: string, paths?: Record<string, string>): string {
    const knowledgeBase = baseKnowledgeDir ?? path.join(getPackageRoot(), "templates/standards");

    // Embed actual file contents so the agent can read governance docs
    const knowledgeSections = (ag.instructions.knowledgeFiles ?? []).map((f: string) => {
        const filePath = path.join(knowledgeBase, f);
        const content = fs.existsSync(filePath)
            ? fs.readFileSync(filePath, "utf8").trim()
            : `(${f} — file not found at build time)`;
        return { title: `Required Reading — ${f}`, content };
    });

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
                        content: `${ag.instructions.identity}\n\n**Mission:** ${ag.instructions.mission}`,
                    },
                    {
                        title: "Project Structure",
                        content: [
                            "This project uses the following directory structure:",
                            `- Backend: ${paths?.backend || "apps/backend"}`,
                            `- Frontend: ${paths?.frontend || "apps/web"}`,
                            `- Mobile: ${paths?.mobile || "apps/mobile"}`,
                            `- Documentation: ${paths?.docs || "docs"}`,
                        ].join("\n"),
                    },
                    {
                        title: "Chain of Thought Protocol",
                        content: ag.instructions.chainOfThought,
                    },
                    {
                        title: "Discipline Rules",
                        content: ag.instructions.rules.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n"),
                    },
                    {
                        title: "Enterprise Context",
                        content: [
                            "You are part of a multi-agent enterprise governance system.",
                            "- Always include active Trace ID in all messages.",
                            "- Read PROJECT_MEMORY.md at session start.",
                            "- Prefer surgical edits over full file rewrites.",
                            "- Escalate high-risk operations to @manager.",
                            `- Ensure development happens inside ${paths?.backend || "apps/backend"}, ${paths?.frontend || "apps/web"}, or ${paths?.mobile || "apps/mobile"}.`,
                        ].join("\n"),
                    },
                    ...knowledgeSections,
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
//  Valid fields: agent-type, display-name, when-to-use, model, allowed-tools
// ─────────────────────────────────────────────────────────────────────────────

export function toCodexMd(ag: AgentDefinition, baseKnowledgeDir?: string, paths?: Record<string, string>): string {
    const model = resolveModel(ag.capability, "codex-cli");
    const tools = [...new Set(ag.tools.map((t: string) => {
        if (["read_file","view_file","list_dir","grep_search","get_memory_insights","read_project_memory","get_project_map","get_project_gaps","get_framework_status"].includes(t)) return "read";
        if (["write_file","replace_text","batch_surgical_edit","patch_file","update_project_memory","log_agent_action","acquire_lock","release_lock","register_agent","update_contract_hash"].includes(t)) return "write";
        return "shell";
    }))];

    const frontmatter = [
        "---",
        `agent-type: "${ag.name}"`,
        `display-name: "${ag.displayName}"`,
        "when-to-use: >-",
        `  Invoke for ${ag.role.toLowerCase()} tasks. ${ag.description}`,
        `model: ${model}`,
        `allowed-tools: [${tools.map(t => `"${t}"`).join(", ")}]`,
        "---",
    ].join("\n");

    const body = buildSystemPrompt(ag, baseKnowledgeDir, true, paths);

    const metaFooter = [
        "",
        `<!-- name: ${ag.name} -->`,
        `<!-- capability: ${ag.capability} -->`,
        `<!-- tags: ${JSON.stringify(ag.tags)} -->`,
    ].join("\n");

    return `${frontmatter}\n\n${body}${metaFooter}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  CURSOR IDE  →  .cursor/rules/{name}.mdc
//  Valid fields: description, globs, alwaysApply
//  Ref: https://docs.cursor.com/context/rules
// ─────────────────────────────────────────────────────────────────────────────

export function toCursorMdc(ag: AgentDefinition, baseKnowledgeDir?: string, paths?: Record<string, string>): string {
    const glob = CURSOR_AGENT_GLOBS[ag.name] || "**/*";
    // Only officially supported Cursor MDC frontmatter fields
    const frontmatter = [
        "---",
        `description: "${ag.displayName} — ${ag.description.slice(0, 120).replace(/"/g, "'")}"`,
        `globs: ${glob}`,
        "alwaysApply: false",
        "---",
    ].join("\n");

    return `${frontmatter}\n\n${buildSystemPrompt(ag, baseKnowledgeDir, false, paths)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Batch export
// ─────────────────────────────────────────────────────────────────────────────

export type ExportTarget = "claude-code" | "gemini-cli" | "antigravity" | "codex-cli" | "cursor";

export interface ExportedFile {
  path: string;
  content: string;
}

export function exportAllAgents(target: ExportTarget, paths?: Record<string, string>): ExportedFile[] {
    return ALL_AGENTS.map(ag => {
        switch (target) {
            case "claude-code":
                return { path: `.claude/agents/${ag.name}.md`,         content: toClaudeCodeMd(ag, undefined, paths) };
            case "gemini-cli":
                return { path: `.gemini/agents/${ag.name}.md`,         content: toGeminiCliMd(ag, undefined, paths) };
            case "antigravity":
                return { path: `.agents/${ag.name}/agent.json`,        content: toAntigravityJson(ag, undefined, paths) };
            case "codex-cli":
                return { path: `.agents/${ag.name}.md`,                content: toCodexMd(ag, undefined, paths) };
            case "cursor":
                return { path: `.cursor/rules/${ag.name}.mdc`,         content: toCursorMdc(ag, undefined, paths) };
        }
    });
}
