import { ToolDefinition } from "../tools/types.js";

export const TOOLS: ToolDefinition[] = [
    {
        name: "read_file",
        description: "Read the content of a file within the project. Supports optional line range reading to prevent stream overload.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Path to the file relative to project root" },
                startLine: { type: "number", description: "Optional starting line number (1-indexed)" },
                endLine: { type: "number", description: "Optional ending line number (inclusive)" },
            },
            required: ["path"],
        },
    },
    {
        name: "list_dir",
        description: "List the contents of a directory. Essential for codebase exploration.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Path to the directory relative to project root (default: '.')" },
            },
        },
    },
    {
        name: "grep_search",
        description: "Perform a recursive regex search across the codebase to find functions, variables, or patterns.",
        inputSchema: {
            type: "object",
            properties: {
                pattern: { type: "string", description: "The regex pattern to search for" },
                includePattern: { type: "string", description: "Optional: Filter files by extension (e.g., '.ts')" },
                excludePattern: { type: "string", description: "Optional: Directory pattern to exclude (default: 'node_modules')" },
            },
            required: ["pattern"],
        },
    },
    {
        name: "write_file",
        description: "Write content to a file. Creates directories if missing.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Path to the file relative to project root" },
                content: { type: "string", description: "Complete content of the file" },
            },
            required: ["path", "content"],
        },
    },
    {
        name: "replace_text",
        description: "Surgically replace a string in a file with another string.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Path to the file" },
                oldText: { type: "string", description: "The exact text to find" },
                newText: { type: "string", description: "The text to replace it with" },
                allowMultiple: { type: "boolean", description: "Allow multiple replacements if oldText is not unique." }
            },
            required: ["path", "oldText", "newText"],
        },
    },
    {
        name: "batch_surgical_edit",
        description: "Perform multiple surgical text replacements across multiple files in a single batch request. More efficient for cross-cutting changes.",
        inputSchema: {
            type: "object",
            properties: {
                edits: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            path: { type: "string", description: "Path to the file" },
                            oldText: { type: "string", description: "The exact text to find" },
                            newText: { type: "string", description: "The text to replace it with" },
                            allowMultiple: { type: "boolean", description: "Allow multiple replacements in this file." }
                        },
                        required: ["path", "oldText", "newText"]
                    }
                }
            },
            required: ["edits"],
        },
    },
    {
        name: "patch_file",
        description: "Safely update a file by replacing a specific line range with new content.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Path to the file" },
                startLine: { type: "number", description: "Starting line number (1-indexed)" },
                endLine: { type: "number", description: "Ending line number (inclusive)" },
                newContent: { type: "string", description: "The new lines to insert" },
            },
            required: ["path", "startLine", "endLine", "newContent"],
        },
    },
    {
        name: "get_project_map",
        description: "Generate a tree-view map of the project structure to visualize the layout. Useful for onboarding and architectural analysis.",
        inputSchema: {
            type: "object",
            properties: {
                maxDepth: { type: "number", description: "Maximum directory depth to scan (default: 3)" },
                includeFiles: { type: "boolean", description: "Whether to include files in the map (default: true)" }
            }
        }
    },
    {
        name: "get_project_gaps",
        description: "Scans the codebase for TODOs, FIXMEs, and empty function bodies. Helps identify what is left and where the agent might have skipped logic.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Path to the source directory (default: 'src')" },
            },
        },
    },
    {
        name: "audit_dependencies",
        description: "Audits package.json for unused, redundant, or duplicate-like packages to ensure a clean dependency tree.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "run_tests",
        description: "Execute project test suites (Vitest, Playwright, etc.) and capture detailed pass/fail reports for analysis.",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", description: "The test command to run (default: 'npm test')" }
            }
        }
    },
    {
        name: "get_system_health",
        description: "Retrieve real-time system metrics like CPU load, RAM usage, and uptime.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "check_active_ports",
        description: "Identify which network ports are currently active and listening. Helps verify if the dev server or API is running.",
        inputSchema: {
            type: "object",
            properties: {
                filter: { type: "string", description: "Optional: Filter results by port number or service name (e.g., ':3000')" }
            }
        }
    },
    {
        name: "start_dashboard",
        description: "Start the Enderun Web Dashboard (Command Center) to visualize real-time agent status, logs, and system metrics in the browser.",
        inputSchema: {
            type: "object",
            properties: {
                port: { type: "number", description: "Optional: Port to run the dashboard on (default: 5858)" }
            }
        }
    },
    {
        name: "get_framework_status",
        description: "Get the current project phase, active traces, and agent states.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "read_project_memory",
        description: "Read the full project central memory (PROJECT_MEMORY.md). Use this at the start of a session to gain context.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "get_memory_insights",
        description: "Retrieve a summarized version of the project memory (active phase, trace, and last 5 actions) to save tokens.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "update_project_memory",
        description: "Update a specific section in PROJECT_MEMORY.md.",
        inputSchema: {
            type: "object",
            properties: {
                section: { type: "string", description: "Section name (e.g., HISTORY, ACTIVE TASKS)" },
                content: { type: "string", description: "Markdown content to append or set" },
            },
            required: ["section", "content"],
        },
    },
    {
        name: "orchestrate_loop",
        description: "Process the pending Hermes messages and trigger dynamic state transitions.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "send_agent_message",
        description: "Send a Hermes protocol message to another agent for collaboration or sub-tasking.",
        inputSchema: {
            type: "object",
            properties: {
                from: { type: "string", description: "Sender agent (e.g., @manager, @backend)." },
                to: { type: "string", description: "Target agent (e.g., @backend, @quality)." },
                category: { type: "string", enum: ["ACTION", "DELEGATION", "SUBTASK", "REPLY", "ALERT"], description: "Message type." },
                content: { type: "string", description: "Task description or message content." },
                traceId: { type: "string", description: "Active Trace ID." },
                parentId: { type: "string", description: "Optional parent task trace ID for hierarchical tracking." },
                priority: { type: "string", enum: ["HIGH", "NORMAL", "LOW"], description: "Optional priority level (HIGH, NORMAL, LOW). Defaults to HIGH for ALERT/ACTION." },
                requiresApproval: { type: "boolean", description: "If true, this message will require manager approval before being processed." },
            },
            required: ["from", "to", "category", "content", "traceId"],
        },
    },
    {
        name: "acquire_lock",
        description: "Acquire a stateful lock on a shared resource (like PROJECT_MEMORY.md) to prevent concurrent write conflicts.",
        inputSchema: {
            type: "object",
            properties: {
                resource: { type: "string", description: "The resource name or path to lock (e.g., 'memory')." },
                agent: { type: "string", description: "The agent requesting the lock (e.g., '@backend')." },
                ttl: { type: "number", description: "Time-to-live in seconds before the lock auto-expires (default: 60)." }
            },
            required: ["resource", "agent"]
        }
    },
    {
        name: "release_lock",
        description: "Release a previously acquired lock on a resource.",
        inputSchema: {
            type: "object",
            properties: {
                resource: { type: "string", description: "The resource name or path." },
                agent: { type: "string", description: "The agent releasing the lock." }
            },
            required: ["resource", "agent"]
        }
    },
    {
        name: "register_agent",
        description: "Register an agent instance with the Control Plane and validate its permissions.",
        inputSchema: {
            type: "object",
            properties: {
                agent: { type: "string", description: "The agent name (e.g., '@backend')." },
                role: { type: "string", description: "The role of the agent." },
                capability: { type: "number", description: "The capability score (1-10)." }
            },
            required: ["agent", "role"]
        }
    },
    {
        name: "log_agent_action",
        description: "Log an agent action to the framework logs.",
        inputSchema: {
            type: "object",
            properties: {
                agent: { type: "string", description: "The agent name (e.g., @manager, @backend)" },
                action: { type: "string", description: "Action type or name" },
                traceId: { type: "string", description: "The active Trace ID" },
                status: { type: "string", enum: ["SUCCESS", "FAILURE"], description: "The status of the action" },
                summary: { type: "string", description: "Brief description of the action taken" },
                findings: { type: "string", description: "Optional comma-separated findings or details" }
            },
            required: ["agent", "action", "traceId", "status", "summary"]
        }
    },
    {
        name: "update_contract_hash",
        description: "Re-generate and synchronize the backend contract SHA-256 hash.",
        inputSchema: { type: "object", properties: {} }
    },
    {
        name: "run_shell_command",
        description: "Execute a shell command. For security, only a limited set of commands are allowed.",
        inputSchema: {
            type: "object",
            properties: {
                command: { type: "string", description: "The shell command to execute." },
            },
            required: ["command"],
        },
    },
    {
        name: "check_lint",
        description: "Run the project's linter (e.g., ESLint) to check for code quality and style issues.",
        inputSchema: { type: "object", properties: {} },
    },
    {
        name: "view_file",
        description: "Alias for read_file. Reads the content of a file within the project.",
        inputSchema: {
            type: "object",
            properties: {
                path: { type: "string", description: "Path to the file relative to project root" },
                startLine: { type: "number", description: "Optional starting line number (1-indexed)" },
                endLine: { type: "number", description: "Optional ending line number (inclusive)" },
            },
            required: ["path"],
        },
    }
];