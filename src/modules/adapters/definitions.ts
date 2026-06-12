import path from "path";
import type { AdapterConfig, AdapterId } from "./types.js";
import { addMcpServerToClaude, findClaudeConfigPath } from "../../cli/utils/claude.js";
import { writeJsonFile } from "../../shared/fs.js";
import { registerGlobalAntigravityPlugins } from "./shared.js";
import { registry } from "./registry.js";
import { UI } from "../../cli/utils/ui.js";

// ─── Register Core Adapters ──────────────────────────────────────────────────

// ♊ Gemini
registry.register(
    {
        id: "gemini",
        frameworkDir: ".gemini",
        shimFile: "GEMINI.md",
        shimTemplate: "src/cli/shims/gemini.md",
        role: "commander",
        templateDir: ".enderun",
        nestedDirs: ["agents", "rules"],
        agentsDir: ".gemini/agents",
        agentsExt: ".md"
    },
    (projectRoot, mcpBlock) => {
        const frameworkDir = ".gemini";
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp.json"), mcpBlock);
        UI.success(`Gemini MCP registered → ${frameworkDir}/mcp.json`);
        registerGlobalAntigravityPlugins(mcpBlock);
    }
);

// 🚀 Claude
registry.register(
    {
        id: "claude",
        frameworkDir: ".claude",
        shimFile: "CLAUDE.md",
        shimTemplate: "src/cli/shims/claude.md",
        role: "architect",
        templateDir: ".enderun",
        nestedDirs: ["agents", "rules"],
        agentsDir: ".claude/agents",
        agentsExt: ".md"
    },
    (projectRoot, mcpBlock) => {
        const configPath = findClaudeConfigPath();
        if (configPath) {
            const block = mcpBlock as { mcpServers: Record<string, unknown> };
            const mcpEntry = block.mcpServers["agent-enderun"] as Record<string, unknown>;
            const ok = addMcpServerToClaude(configPath, "agent-enderun", mcpEntry);
            if (ok) UI.success(`Claude MCP registered → ${configPath}`);
        }
        const frameworkDir = ".claude";
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp_config.json"), mcpBlock);
        writeJsonFile(path.join(projectRoot, ".mcp.json"), mcpBlock);
        UI.success("Claude Code Project MCP → .mcp.json");
    }
);

// 🤖 Grok
registry.register(
    {
        id: "grok",
        frameworkDir: ".grok",
        shimFile: "GROK.md",
        shimTemplate: "src/cli/shims/grok.md",
        role: "researcher",
        templateDir: ".enderun",
        nestedDirs: ["agents", "rules"],
        agentsDir: ".grok/agents",
        agentsExt: ".md"
    },
    (projectRoot, mcpBlock) => {
        const frameworkDir = ".grok";
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp_config.json"), mcpBlock);
        UI.success(`Grok MCP → ${frameworkDir}/mcp_config.json`);
    }
);

// ✍️ Cursor
registry.register(
    {
        id: "cursor",
        frameworkDir: ".cursor",
        shimFile: "CURSOR.md",
        shimTemplate: "src/cli/shims/cursor.mdc",
        role: "implementer",
        templateDir: ".enderun",
        nestedDirs: ["rules"],
        agentsDir: ".cursor/rules",
        agentsExt: ".mdc"
    },
    (projectRoot, mcpBlock) => {
        const frameworkDir = ".cursor";
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp.json"), mcpBlock);
        UI.success(`Cursor IDE Project MCP → ${frameworkDir}/mcp.json`);
    }
);

// 💡 Codex (Copilot)
registry.register(
    {
        id: "codex",
        frameworkDir: ".agents",
        shimFile: "copilot-instructions.md",
        shimTemplate: "src/cli/shims/codex.md",
        role: "implementer",
        templateDir: ".enderun",
        nestedDirs: ["skills", "rules", "instructions"],
        agentsDir: ".agents/instructions",
        agentsExt: ".md"
    },
    (projectRoot, mcpBlock) => {
        const frameworkDir = ".agents";
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp_config.json"), mcpBlock);
        writeJsonFile(path.join(projectRoot, ".vscode/mcp.json"), mcpBlock);
        writeJsonFile(path.join(projectRoot, ".mcp.json"), mcpBlock);
        UI.success("GitHub Copilot Project MCP → .vscode/mcp.json & .mcp.json");
    }
);

// 🛸 Antigravity
registry.register(
    {
        id: "antigravity-cli",
        frameworkDir: ".antigravity",
        shimFile: "AGENTS.md",
        shimTemplate: "src/cli/shims/antigravity-cli.md",
        role: "general",
        templateDir: ".enderun",
        nestedDirs: ["agents", "plugins", "rules"],
        agentsDir: ".antigravity/agents",
        agentsExt: ".md"
    },
    (projectRoot, mcpBlock) => {
        const frameworkDir = ".antigravity";
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp_config.json"), mcpBlock);
        UI.success(`Antigravity CLI MCP → ${frameworkDir}/mcp_config.json`);
        registerGlobalAntigravityPlugins(mcpBlock);
    }
);

/**
 * Mapped Adapter Configurations
 */
export const ADAPTER_CONFIGS: Record<AdapterId, AdapterConfig> = registry.getConfigs();

/**
 * Post-Initialization Handlers for specific adapters
 */
export const POST_INIT_HANDLERS: Record<AdapterId, (projectRoot: string, mcpBlock: unknown) => void> = registry.getHandlers();
