import { safeExec } from "../../utils/cli.js";
import { GetStatusArgs, ToolResult } from "../types.js";

export function handleGetFrameworkStatus(projectRoot: string, args: GetStatusArgs): ToolResult {
    const output = safeExec("npx", ["agent-enderun", "status"], projectRoot, args.timeout);
    return { content: [{ type: "text", text: output }] };
}
