import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import * as memoryUtils from "../../src/cli/utils/memory.js";
import { sendMessage, orchestrateCommand } from "../../src/cli/commands/orchestrate.js";

describe("Agent Integration Flow", () => {
    let tempDir: string;
    let memoryDir: string;
    let messagesDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "enderun-integration-test-"));
        memoryDir = path.join(tempDir, "memory");
        messagesDir = path.join(tempDir, "messages");
        
        vi.spyOn(memoryUtils, "getFrameworkDir").mockReturnValue(tempDir);
        vi.spyOn(memoryUtils, "getDocumentStorePath").mockReturnValue(memoryDir);
        
        memoryUtils.initDocumentStore(tempDir);
        fs.mkdirSync(messagesDir, { recursive: true });
        
        // Setup initial status
        memoryUtils.updateDocumentStore("status", {
            "@manager": { state: "READY", task: "Idle" },
            "@backend": { state: "READY", task: "Idle" }
        });
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    it("should allow Manager to delegate a task to Backend and update status", async () => {
        const traceId = "test-flow-123";
        
        // 1. Manager delegates task
        const taskPayload = {
            traceId: traceId,
            task: "Process data",
            priority: "P1",
            agent: "@backend"
        };
        await sendMessage({
            from: "@manager",
            to: "@backend",
            category: "DELEGATION",
            content: JSON.stringify(taskPayload),
            traceId: traceId
        });

        // 2. Orchestrator processes the task
        await orchestrateCommand();

        // 3. Verify Backend status changed to EXECUTING
        const status = memoryUtils.readStatus();
        expect(status["@backend"].state).toBe("EXECUTING");
        expect(status["@backend"].task).toBe("Process data");
    });
});
