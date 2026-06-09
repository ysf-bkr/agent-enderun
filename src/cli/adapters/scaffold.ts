import { writeTextFile } from "../utils/fs.js";
import path from "path";
import fs from "fs";
import { getPackageRoot } from "../utils/pkg.js";
import { 
    ALL_AGENTS, 
    toClaudeCodeMd, 
    toGeminiCliMd, 
    toCodexMd, 
    toAntigravityJson,
    toCursorMdc
} from "../../modules/agents/definitions.js";

import type { AdapterId } from "../../modules/adapters/types.js";
import { ADAPTERS } from "./core.js";

export function scaffoldAgents(
    projectRoot: string, 
    adapterId: AdapterId, 
    dryRun: boolean, 
    agentsToScaffold?: string[],
    explicitDestDir?: string,
    explicitExt?: string
): void {
    const adapter = ADAPTERS[adapterId];
    if (!adapter) return;

    const allowedAgents = agentsToScaffold ? new Set(agentsToScaffold) : undefined;
    const destAgentsDir = explicitDestDir ? path.join(projectRoot, explicitDestDir) : (adapter.agentsDir ? path.join(projectRoot, adapter.agentsDir) : null);
    const extension = explicitExt || adapter.agentsExt || ".md";

    if (!destAgentsDir) return;

    const baseKnowledgeDir = path.join(getPackageRoot(), "templates/standards");

    try {
        if (!dryRun) fs.mkdirSync(destAgentsDir, { recursive: true });

        for (const agent of ALL_AGENTS) {
            if (allowedAgents && !allowedAgents.has(agent.name)) continue;
            
            let content = "";
            let fileName = `${agent.name}${extension}`;
            let secondaryContent: string | null = null;
            let secondaryFileName: string | null = null;

            switch (adapterId) {
                case "gemini":
                    content = toGeminiCliMd(agent, baseKnowledgeDir);
                    break;
                case "claude":
                    content = toClaudeCodeMd(agent, baseKnowledgeDir);
                    break;
                case "cursor":
                    content = toCursorMdc(agent, baseKnowledgeDir);
                    break;
                case "codex":
                    content = toCodexMd(agent, baseKnowledgeDir);
                    break;
                case "antigravity-cli": {
                    // Antigravity uses nested folders: agents/{name}/agent.json and agents/{name}/agent.md
                    const agentDir = path.join(destAgentsDir, agent.name);
                    if (!dryRun) fs.mkdirSync(agentDir, { recursive: true });
                    
                    content = toAntigravityJson(agent);
                    fileName = path.join(agent.name, "agent.json");
                    
                    secondaryContent = `# 🎖️ Agent Enderun — @${agent.name}\n\n${agent.instructions.identity}\n\n${agent.instructions.mission}`;
                    secondaryFileName = path.join(agent.name, "agent.md");
                    break;
                }
                default:
                    // Fallback to Gemini format
                    content = toGeminiCliMd(agent, baseKnowledgeDir);
                    break;
            }

            if (!dryRun) {
                writeTextFile(path.join(destAgentsDir, fileName), content, dryRun);
                if (secondaryContent && secondaryFileName) {
                    writeTextFile(path.join(destAgentsDir, secondaryFileName), secondaryContent, dryRun);
                }
            }
        }
    } catch (e) {
        console.warn(`⚠️  Failed to scaffold agents for ${adapterId}: ${e}`);
    }
}
