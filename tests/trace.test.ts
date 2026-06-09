import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import * as memoryUtils from "../src/cli/utils/memory.js";
import { traceNewCommand } from "../src/cli/commands/trace.js";

describe("Trace Command", () => {
    let tempDir: string;
    let memoryDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "enderun-trace-test-"));
        memoryDir = path.join(tempDir, "memory");
        process.env.ENDERUN_TEST_DIR = tempDir;
        
        // Initialize store
        memoryUtils.initDocumentStore(tempDir);
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        delete process.env.ENDERUN_TEST_DIR;
    });

    it("should successfully generate Trace ID and add task to JSON store", async () => {
        const traceId = await traceNewCommand("Implement tests", "coder", "P1");
        
        expect(traceId).toBeDefined();
        
        const taskPath = path.join(memoryDir, "tasks", `${traceId}.json`);
        expect(fs.existsSync(taskPath)).toBe(true);
    });
});
