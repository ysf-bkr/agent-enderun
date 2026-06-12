import { TOOLS } from "./definitions.js";
import { handleReadFile } from "./file_system/read_file.js";
import { handleWriteFile } from "./file_system/write_file.js";
import { handleReplaceText } from "./file_system/replace_text.js";
import { handleBatchSurgicalEdit } from "./file_system/batch_surgical_edit.js";
import { handlePatchFile } from "./file_system/patch_file.js";
import { handleGrepSearch } from "./search/grep_search.js";
import { handleListDir } from "./search/list_dir.js";
import { handleGetProjectGaps } from "./search/get_gaps.js";
import { handleGetProjectMap } from "./search/get_map.js";
import { handleGetFrameworkStatus } from "./framework/get_status.js";
import { handleUpdateProjectMemory } from "./framework/update_memory.js";
import { handleAuditDependencies } from "./framework/audit_deps.js";
import { handleRunTests } from "./framework/run_tests.js";
import { handleGetSystemHealth } from "./observability/get_health.js";
import { handleCheckPorts } from "./observability/check_ports.js";
import { handleOrchestrateLoop } from "./framework/orchestrate.js";
import { handleUpdateContractHash } from "./framework/update_contract_hash.js";
import { handleReadProjectMemory } from "./memory/read_memory.js";
import { handleGetMemoryInsights } from "./memory/get_insights.js";
import { handleSendAgentMessage } from "./messaging/send_message.js";
import { handleLogAgentAction } from "./messaging/log_action.js";
import { handleAcquireLock, handleReleaseLock } from "./control_plane/locking.js";
import { handleRegisterAgent } from "./control_plane/registry.js";
import { handleRunCommand } from "./shell/run_command.js";
import { handleCheckLint } from "./quality/check_lint.js";
import { ToolHandler, ToolResult } from "./types.js";

// Map of tool names to their handler functions
const bind = <T>(fn: (root: string, args: T) => ToolResult | Promise<ToolResult>): ToolHandler => {
    return (root: string, args: unknown) => fn(root, args as T);
};

export const toolHandlers: Record<string, ToolHandler> = {
    read_file: bind(handleReadFile),
    view_file: bind(handleReadFile), // Alias
    list_dir: bind(handleListDir),
    grep_search: bind(handleGrepSearch),
    get_project_map: bind(handleGetProjectMap),
    get_project_gaps: bind(handleGetProjectGaps),
    write_file: bind(handleWriteFile),
    replace_text: bind(handleReplaceText),
    batch_surgical_edit: bind(handleBatchSurgicalEdit),
    patch_file: bind(handlePatchFile),
    get_framework_status: bind(handleGetFrameworkStatus),
    read_project_memory: bind(handleReadProjectMemory),
    get_memory_insights: bind(handleGetMemoryInsights),
    update_project_memory: bind(handleUpdateProjectMemory),
    audit_dependencies: bind(handleAuditDependencies),
    run_tests: bind(handleRunTests),
    get_system_health: bind(handleGetSystemHealth),
    check_active_ports: bind(handleCheckPorts),
    orchestrate_loop: bind(handleOrchestrateLoop),
    send_agent_message: bind(handleSendAgentMessage),
    log_agent_action: bind(handleLogAgentAction),
    update_contract_hash: bind(handleUpdateContractHash),
    acquire_lock: bind(handleAcquireLock),
    release_lock: bind(handleReleaseLock),
    register_agent: bind(handleRegisterAgent),
    run_shell_command: bind(handleRunCommand),
    check_lint: bind(handleCheckLint),
};

export { TOOLS };
