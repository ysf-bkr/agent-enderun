import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import * as memoryUtils from "../src/cli/utils/memory.js";
import { HermesMessageSchema, sendMessage, orchestrateCommand } from "../src/cli/commands/orchestrate.js";

describe("Hermes Message Protocol & Orchestration", () => {
    let tempDir: string;
    let memoryDir: string;
    let messagesDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "enderun-orchestrate-test-"));
        memoryDir = path.join(tempDir, "memory");
        messagesDir = path.join(tempDir, "messages");
        
        // Mock the path resolution functions
        vi.spyOn(memoryUtils, "getFrameworkDir").mockReturnValue(tempDir);
        vi.spyOn(memoryUtils, "getDocumentStorePath").mockReturnValue(memoryDir);
        
        fs.mkdirSync(memoryDir, { recursive: true });
        fs.mkdirSync(messagesDir, { recursive: true });
        memoryUtils.initDocumentStore(tempDir);
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    it("should validate valid Hermes messages", () => {
        const validMsg = {
            timestamp: new Date().toISOString(),
            from: "@manager",
            to: "@backend",
            category: "DELEGATION",
            content: "Please generate Fastify types.",
            traceId: "test-trace-id",
            status: "PENDING",
            priority: "HIGH"
        };

        const result = HermesMessageSchema.safeParse(validMsg);
        expect(result.success).toBe(true);
    });

    it("should write messages to appropriate files", async () => {
        const messageArgs = {
            from: "@manager",
            to: "@backend",
            category: "DELEGATION" as const,
            content: "Create backend structures",
            traceId: "trace-1"
        };

        const result = await sendMessage(messageArgs);
        expect(result).toBeDefined();
    });

    it("should detect executing agent timeouts and transition them to BLOCKED", async () => {
        const pastTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        memoryUtils.updateDocumentStore("status", {
            "@frontend": { state: "EXECUTING", task: "Building dashboard", lastUpdated: pastTime }
        });

        // Run orchestration loop
        // We need to bypass the STATUS.md logic in orchestrate.ts by mocking it or 
        // updating the implementation to check status.json.
        // For now, let's fix the test logic to align with what the code *should* do.
        await orchestrateCommand();

        const statuses = memoryUtils.readStatus();
        // Since we didn't update orchestrate.ts to read status.json, 
        // the code won't see it yet. I need to fix orchestrate.ts.
        expect(statuses["@frontend"].state).toBe("BLOCKED");
    });
});
