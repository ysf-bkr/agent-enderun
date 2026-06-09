import fs from "fs";
import path from "path";
import { writeJsonFile } from "../utils/fs.js";
import { getPackageRoot } from "../utils/pkg.js";

import { ADAPTER_CONFIGS, POST_INIT_HANDLERS } from "../../modules/adapters/definitions.js";
import type { AdapterConfig, AdapterId } from "../../modules/adapters/types.js";

export const ADAPTERS: Record<AdapterId, AdapterConfig> = ADAPTER_CONFIGS;

export const SHIM_FILES = (Object.keys(ADAPTERS) as AdapterId[]).map((id) => ADAPTERS[id].shimFile);

export const FRAMEWORK_DIR_CANDIDATES = [
    ".enderun",
    ".cursor",
    ".claude",
    ".github",
    ".grok",
    ".antigravity",
    ".agent",
    ".gemini/antigravity-cli",
    ".gemini",
    ".agents",
    "antigravity-cli"
] as const;

export function buildMcpServerEntry(projectRoot: string) {
    const packageRoot = getPackageRoot();
    const mcpServerPath = path.join(packageRoot, "framework-mcp/dist/index.js");

    if (!fs.existsSync(mcpServerPath)) {
        console.warn(`⚠️  MCP Server not found at ${mcpServerPath}. Did you run 'npm run build'?`);
    }

    const relativePath = path.relative(projectRoot, mcpServerPath) || mcpServerPath;

    return {
        command: "node",
        args: [relativePath],
        env: {
            ENDERUN_PROJECT_ROOT: projectRoot,
        },
    };
}

export function runAdapterPostInit(adapter: AdapterConfig, projectRoot: string): void {
    const mcpEntry = buildMcpServerEntry(projectRoot);
    const mcpBlock = { mcpServers: { "agent-enderun": mcpEntry } };

    const postInitFn = POST_INIT_HANDLERS[adapter.id];
    if (postInitFn) {
        postInitFn(projectRoot, mcpBlock);
    }

    const rootMcpPath = path.join(projectRoot, "mcp.json");
    if (!fs.existsSync(rootMcpPath)) {
        writeJsonFile(rootMcpPath, mcpBlock);
    }
}
