import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";


import { TOOLS, toolHandlers } from "./tools/index.js";


// ─── Server Setup ─────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Robustly find package.json by walking up from __dirname
function findPackageJson(startDir: string): string {
    let currentDir = startDir;
    while (currentDir !== path.parse(currentDir).root) {
        const pkgPath = path.join(currentDir, "package.json");
        if (fs.existsSync(pkgPath)) return pkgPath;
        currentDir = path.dirname(currentDir);
    }
    throw new Error("Could not find package.json for @agent-enderun/mcp");
}

const pkgPath = findPackageJson(__dirname);
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
const serverVersion = pkg.version;

const server = new Server(
    {
        name: "@agent-enderun/mcp",
        version: serverVersion,
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// Basic Schema Validator for Required Fields
function validateArgs(toolName: string, args: Record<string, unknown>): string | null {
    const definition = TOOLS.find(t => t.name === toolName);
    if (!definition) return `Unknown tool: ${toolName}`;
    
    const required = definition.inputSchema.required || [];
    for (const field of required) {
        if (args[field] === undefined || args[field] === null || args[field] === "") {
            return `Missing required argument: '${field}' for tool '${toolName}'`;
        }
    }
    return null;
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const req = request as { params: { name: string, arguments?: Record<string, unknown> } };
    const { name, arguments: args } = req.params;
    const projectRoot = process.env.ENDERUN_PROJECT_ROOT || process.cwd();

    try {
        const handler = toolHandlers[name];
        if (!handler) {
            return {
                isError: true,
                content: [{ type: "text" as const, text: `❌ Unknown tool: ${name}` }],
            };
        }

        // 🛡️ Runtime Validation
        const validationError = validateArgs(name, args || {});
        if (validationError) {
            return {
                isError: true,
                content: [{ type: "text" as const, text: `❌ Validation Error: ${validationError}` }],
            };
        }
        
        return await handler(projectRoot, args || {});
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        return {
            isError: true,
            content: [{ type: "text" as const, text: `❌ Execution failed: ${message}` }],
        };
    }
});

// ─── Graceful Startup & Shutdown ──────────────────────────────────

async function run() {
    const transport = new StdioServerTransport();

    // Prevent unhandled errors from crashing the MCP stream
    process.on("uncaughtException", (error: Error) => {
        process.stderr.write(`[agent-enderun-mcp] Uncaught exception: ${error.message}
`);
    });
    process.on("unhandledRejection", (reason: unknown) => {
        const message = reason instanceof Error ? reason.message : String(reason);
        process.stderr.write(`[agent-enderun-mcp] Unhandled rejection: ${message}
`);
    });

    // Graceful shutdown on SIGINT/SIGTERM
    const shutdown = async () => {
        try {
            await server.close();
        } catch {
            // Already closed or failed — safe to ignore
        }
        process.exit(0);
    };
    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);

    await server.connect(transport);
}

run().catch((error: Error) => {
    process.stderr.write(`[agent-enderun-mcp] Fatal startup error: ${error.message}
`);
    process.exit(1);
});
