export interface ToolDefinition {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: Record<string, unknown>;
        required?: string[];
    };
}

// ─── File System ────────────────────────────────────────────────
export interface ReadFileArgs { path: string; startLine?: number; endLine?: number; }
export interface WriteFileArgs { path: string; content: string; }
export interface ReplaceTextArgs { path: string; oldText: string; newText: string; allowMultiple?: boolean; }
export interface PatchFileArgs { path: string; startLine: number; endLine: number; newContent: string; }
export interface BatchSurgicalEditArgs {
    edits: Array<{ path: string; oldText: string; newText: string; allowMultiple?: boolean; }>;
}

// ─── Search & Discovery ──────────────────────────────────────────
export interface ListDirArgs { path?: string; }
export interface GrepSearchArgs { pattern: string; includePattern?: string; excludePattern?: string; }
export interface GetProjectMapArgs { maxDepth?: number; includeFiles?: boolean; }
export interface GetProjectGapsArgs { path?: string; }

// ─── Messaging (Hermes) ─────────────────────────────────────────
export interface SendAgentMessageArgs {
    from: string;
    to: string;
    category: "ACTION" | "DELEGATION" | "SUBTASK" | "REPLY" | "ALERT";
    content: string;
    traceId: string;
    parentId?: string;
    priority?: "HIGH" | "NORMAL" | "LOW";
    requiresApproval?: boolean;
}
export interface LogAgentActionArgs {
    agent: string;
    action: string;
    traceId: string;
    status: "SUCCESS" | "FAILURE";
    summary: string;
    findings?: string;
}

// ─── Control Plane ──────────────────────────────────────────────
export interface AcquireLockArgs { resource: string; agent: string; ttl?: number; }
export interface ReleaseLockArgs { resource: string; agent: string; }
export interface RegisterAgentArgs { agent: string; role: string; capability?: number; }

// ─── Observability & Utils ──────────────────────────────────────
export interface StartDashboardArgs { port?: number; }
export interface CheckActivePortsArgs { filter?: string; }
export interface RunTestsArgs { command?: string; timeout?: number; }
export interface UpdateProjectMemoryArgs { section: string; content: string; }
export interface GetStatusArgs { timeout?: number; }
export interface OrchestrateArgs { timeout?: number; }
export interface UpdateContractHashArgs { timeout?: number; }
export interface RunCommandArgs { command: string; }

export type ToolArgs =
    | ReadFileArgs
    | WriteFileArgs
    | ReplaceTextArgs
    | PatchFileArgs
    | BatchSurgicalEditArgs
    | ListDirArgs
    | GrepSearchArgs
    | GetProjectMapArgs
    | GetProjectGapsArgs
    | SendAgentMessageArgs
    | LogAgentActionArgs
    | AcquireLockArgs
    | ReleaseLockArgs
    | RegisterAgentArgs
    | StartDashboardArgs
    | CheckActivePortsArgs
    | RunTestsArgs
    | UpdateProjectMemoryArgs
    | GetStatusArgs
    | OrchestrateArgs
    | UpdateContractHashArgs;

export interface ToolResult {
    isError?: boolean;
    content: Array<{ type: "text"; text: string }>;
}

export type ToolHandler = (projectRoot: string, args: unknown) => ToolResult | Promise<ToolResult>;
