import { safeExec } from "../../utils/cli.js";
import { UpdateContractHashArgs, ToolResult } from "../types.js";

export function handleUpdateContractHash(projectRoot: string, args: UpdateContractHashArgs): ToolResult {
    const output = safeExec("npx", ["agent-enderun", "update-contract"], projectRoot, args.timeout);
    return { content: [{ type: "text", text: output }] };
}
