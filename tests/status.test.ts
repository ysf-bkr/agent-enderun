import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import * as memoryUtils from "../src/cli/utils/memory.js";
import { statusCommand } from "../src/cli/commands/status.js";

describe("Status Command", () => {
    let tempDir: string;
    let memoryDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "enderun-status-test-"));
        memoryDir = path.join(tempDir, "memory");
        
        // Mock the path resolution functions directly
        vi.spyOn(memoryUtils, "getFrameworkDir").mockReturnValue(tempDir);
        vi.spyOn(memoryUtils, "getDocumentStorePath").mockReturnValue(memoryDir);
        // Force readState to return null
        vi.spyOn(memoryUtils, "readState").mockReturnValue(null);
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    it("should print error if memory state is missing", async () => {
        const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

        statusCommand();

        expect(consoleErrorSpy).toHaveBeenCalledWith("❌ Error: Memory state not found. Please run 'init' first.");
        consoleErrorSpy.mockRestore();
    });

    it("should display correctly when state and status exist", async () => {
        vi.spyOn(memoryUtils, "readState").mockReturnValue({ phase: "PHASE_1", traceId: "T-001", managerState: "ACTIVE" });
        vi.spyOn(memoryUtils, "readStatus").mockReturnValue({
            "@manager": { state: "READY", task: "Idle" },
            "@coder": { state: "EXECUTING", task: "Refactoring" }
        });
        vi.spyOn(memoryUtils, "listTasks").mockReturnValue([
            { priority: "P1", status: "IN_PROGRESS", description: "Test", agent: "manager" }
        ]);

        const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

        statusCommand();

        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Phase: PHASE_1"));
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Trace ID: T-001"));
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("@manager"));
        expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Refactoring"));

        consoleWarnSpy.mockRestore();
    });
});
