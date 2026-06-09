import path from "path";
import fs from "fs";
import os from "os";
import { writeJsonFile, writeTextFile } from "../../shared/fs.js";
import { ALL_AGENTS, toAntigravityJson } from "../agents/definitions.js";
import { CORE_SKILLS } from "../skills/definitions.js";

export function registerGlobalAntigravityPlugins(mcpBlock: unknown): void {
    const targets = [
        path.join(os.homedir(), ".gemini/antigravity-cli")
    ];

    for (const globalDir of targets) {
        try {
            // Write directly under directory
            fs.mkdirSync(globalDir, { recursive: true });
            writeJsonFile(path.join(globalDir, "mcp.json"), mcpBlock);
            writeJsonFile(path.join(globalDir, "mcp_config.json"), mcpBlock);
            console.warn(`✅ Antigravity MCP registered → ${globalDir}/`);

            // Global Plugin configuration under plugins/agent-enderun/
            const globalPluginDir = path.join(globalDir, "plugins/agent-enderun");
            fs.mkdirSync(globalPluginDir, { recursive: true });

            // plugin.json marker
            writeJsonFile(path.join(globalPluginDir, "plugin.json"), {
                name: "agent-enderun",
                version: "1.0.0",
                description: "Agent Enderun AI Orchestration framework"
            });

            // MCP Server configs inside the plugin
            writeJsonFile(path.join(globalPluginDir, "mcp.json"), mcpBlock);
            writeJsonFile(path.join(globalPluginDir, "mcp_config.json"), mcpBlock);

            // Scaffold 13 agents
            const agentsBaseDir = path.join(globalPluginDir, "agents");
            fs.mkdirSync(agentsBaseDir, { recursive: true });
            for (const ag of ALL_AGENTS) {
                const agentJson = toAntigravityJson(ag);

                // 1. Nested format (agents/{agent_name}/agent.json)
                const nestedAgentDir = path.join(agentsBaseDir, ag.name);
                fs.mkdirSync(nestedAgentDir, { recursive: true });
                writeTextFile(path.join(nestedAgentDir, "agent.json"), agentJson);

                // 2. Direct flat format (agents/{agent_name}.json)
                writeTextFile(path.join(agentsBaseDir, `${ag.name}.json`), agentJson);
            }

            // Scaffold skills
            const skillsDir = path.join(globalPluginDir, "skills");
            fs.mkdirSync(skillsDir, { recursive: true });
            for (const [key, skill] of Object.entries(CORE_SKILLS)) {
                const skillContent = `# 🛠️ Skill — ${skill.name}\n\n${skill.mandates.join("\n")}\n`;
                writeTextFile(path.join(skillsDir, `${key.toLowerCase()}.md`), skillContent);
            }

            // Scaffold rules
            const rulesDir = path.join(globalPluginDir, "rules");
            fs.mkdirSync(rulesDir, { recursive: true });
            for (const ag of ALL_AGENTS) {
                const ruleContent = `# 🎖️ Agent Enderun — @${ag.name} (${ag.displayName})

You are the **${ag.displayName}** of the Agent Enderun Army.

## 🤖 Specialist Directive (Role: @${ag.name})
${ag.instructions.identity}

### 🎯 Mission
${ag.instructions.mission}

### 📜 Discipline Rules
${ag.instructions.rules.map(r => `- ${r}`).join("\n")}

## 🛡️ Core Mandates
- **Surgical Precision:** Enforce replace_text / replace_file_content for all code modifications.
- **Traceability:** Inherit and pass the active Trace ID across all delegations.
- **Approval Signature:** High-risk actions require manager approval signature.
`;
                writeTextFile(path.join(rulesDir, `${ag.name}.md`), ruleContent);
            }

            // Scaffold optional empty hooks.json
            writeJsonFile(path.join(globalPluginDir, "hooks.json"), {
                preTool: [],
                postTool: []
            });

            console.warn(`✅ Antigravity Plugin registered → ${globalPluginDir}/`);

        } catch (e) {
            console.warn(`⚠️ Failed to register plugin/MCP in ${globalDir}:`, e);
        }
    }
}
