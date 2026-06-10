import path from "path";
import type { AdapterConfig, AdapterId } from "./types.js";
import { addMcpServerToClaude, findClaudeConfigPath } from "../../cli/utils/claude.js";
import { writeJsonFile } from "../../shared/fs.js";
import { registerGlobalAntigravityPlugins } from "./shared.js";
import { unifiedAdapterPath, UNIFIED_ADAPTER_SLUG } from "../../shared/constants.js";

/**
 * Mapped Adapter Configurations
 */
export const ADAPTER_CONFIGS: Record<AdapterId, AdapterConfig> = {
    gemini: {
        id: "gemini",
        frameworkDir: ".gemini",
        shimFile: "GEMINI.md",
        shimTemplate: "src/cli/shims/gemini.md",
        role: "commander",
        templateDir: ".enderun",
        nestedDirs: ["agents", "rules"],
        agentsDir: ".gemini/agents", // Use unified path
        agentsExt: ".md"
    },
    claude: {
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
    grok: {
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
    cursor: {
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
    codex: {
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
    "antigravity-cli": {
        id: "antigravity-cli",
        frameworkDir: ".antigravity",
        shimFile: "AGENTS.md",
        shimTemplate: "src/cli/shims/antigravity-cli.md",
        role: "general",
        templateDir: ".enderun",
        nestedDirs: ["agents", "plugins", "rules"],
        agentsDir: ".antigravity/agents",
        agentsExt: ".md"
    }
};

/**
 * Post-Initialization Handlers for specific adapters
 */
export const POST_INIT_HANDLERS: Record<AdapterId, (projectRoot: string, mcpBlock: unknown) => void> = {
    gemini: (projectRoot, mcpBlock) => {
        const frameworkDir = ADAPTER_CONFIGS.gemini.frameworkDir;
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp.json"), mcpBlock);
        console.warn(`✅ Gemini MCP registered → ${frameworkDir}/mcp.json`);
        registerGlobalAntigravityPlugins(mcpBlock);
    },
    claude: (projectRoot, mcpBlock) => {
        const configPath = findClaudeConfigPath();
        if (configPath) {
            const block = mcpBlock as { mcpServers: Record<string, unknown> };
            const mcpEntry = block.mcpServers["agent-enderun"] as Record<string, unknown>;
            const ok = addMcpServerToClaude(configPath, "agent-enderun", mcpEntry);
            if (ok) console.warn(`✅ Claude MCP registered → ${configPath}`);
        }
        const frameworkDir = ADAPTER_CONFIGS.claude.frameworkDir;
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp_config.json"), mcpBlock);
        writeJsonFile(path.join(projectRoot, ".mcp.json"), mcpBlock);
        console.warn("✅ Claude Code Project MCP → .mcp.json");
    },
    grok: (projectRoot, mcpBlock) => {
        const frameworkDir = ADAPTER_CONFIGS.grok.frameworkDir;
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp_config.json"), mcpBlock);
        console.warn(`✅ Grok MCP → ${frameworkDir}/mcp_config.json`);
    },
    cursor: (projectRoot, mcpBlock) => {
        const frameworkDir = ADAPTER_CONFIGS.cursor.frameworkDir;
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp.json"), mcpBlock);
        console.warn(`✅ Cursor IDE Project MCP → ${frameworkDir}/mcp.json`);
    },
    codex: (projectRoot, mcpBlock) => {
        const frameworkDir = ADAPTER_CONFIGS.codex.frameworkDir;
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp_config.json"), mcpBlock);
        writeJsonFile(path.join(projectRoot, ".vscode/mcp.json"), mcpBlock);
        writeJsonFile(path.join(projectRoot, ".mcp.json"), mcpBlock);
        console.warn("✅ GitHub Copilot Project MCP → .vscode/mcp.json & .mcp.json");
    },
    "antigravity-cli": (projectRoot, mcpBlock) => {
        const frameworkDir = ADAPTER_CONFIGS["antigravity-cli"].frameworkDir;
        writeJsonFile(path.join(projectRoot, frameworkDir, "mcp_config.json"), mcpBlock);
        console.warn(`✅ Antigravity CLI MCP → ${frameworkDir}/mcp_config.json`);
        registerGlobalAntigravityPlugins(mcpBlock);
    }
};
