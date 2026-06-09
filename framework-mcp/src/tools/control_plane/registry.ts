import fs from "fs";
import path from "path";
import { ToolResult, RegisterAgentArgs } from "../types.js";
import { resolveFrameworkDir } from "../../utils/security.js";

/**
 * Handles agent registration with the Control Plane.
 * This can be used to validate permissions and active status.
 */
export async function handleRegisterAgent(projectRoot: string, args: RegisterAgentArgs): Promise<ToolResult> {
    const { agent, role, capability = 5 } = args;
    const frameworkDir = resolveFrameworkDir(projectRoot);
    const registryDir = path.join(projectRoot, frameworkDir, "registry");
    const agentFile = path.join(registryDir, `${agent.replace("@", "")}_active.json`);

    try {
        if (!fs.existsSync(registryDir)) fs.mkdirSync(registryDir, { recursive: true });

        const agentData = {
            agent,
            role,
            capability,
            last_seen: new Date().toISOString(),
            status: "ACTIVE"
        };

        fs.writeFileSync(agentFile, JSON.stringify(agentData, null, 2));
        
        return {
            content: [{ type: "text", text: `🎖️ Agent ${agent} (${role}) registered successfully in the Enderun Control Plane.` }]
        };
    } catch (e) {
        return {
            isError: true,
            content: [{ type: "text", text: `Failed to register agent: ${String(e)}` }]
        };
    }
}
