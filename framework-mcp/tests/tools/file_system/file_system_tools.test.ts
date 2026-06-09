import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import { handleReplaceText } from "../../../src/tools/file_system/replace_text.js";
import { handlePatchFile } from "../../../src/tools/file_system/patch_file.js";
import { handleReadFile } from "../../../src/tools/file_system/read_file.js";
import { handleWriteFile } from "../../../src/tools/file_system/write_file.js";
import { ToolArgs } from "../../../src/tools/types.js";

import os from "os"; // Need to import os

let TEST_DIR: string; // Declare as let
let TEST_FILE: string;
let MEMORY_DIR: string;
let MEMORY_FILE: string;

beforeEach(() => {
    TEST_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "fs-tools-test-")); // Unique temp dir
    fs.mkdirSync(path.join(TEST_DIR, ".enderun"));
    TEST_FILE = path.join(TEST_DIR, "test_file.txt");
    MEMORY_DIR = path.join(TEST_DIR, ".enderun/memory");
    MEMORY_FILE = path.join(MEMORY_DIR, "PROJECT_MEMORY.md");
});

afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
});

describe("File System Tools", () => {
    
    describe("handleReplaceText", () => {
        it("should replace a single occurrence of text", () => {
            fs.writeFileSync(TEST_FILE, "hello world", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                oldText: "world",
                newText: "there",
            };
            const result = handleReplaceText(TEST_DIR, args as any);
            expect(result.content[0].text).toContain("✅ Surgical edit successful in");
            expect(fs.readFileSync(TEST_FILE, "utf8")).toBe("hello there\n");
        });

        it("should throw an error if text is not found", () => {
            fs.writeFileSync(TEST_FILE, "hello world", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                oldText: "missing",
                newText: "found",
            };
            expect(() => handleReplaceText(TEST_DIR, args)).toThrowError("Text not found in file");
        });

        it("should throw an error for ambiguous replacement if allowMultiple is false", () => {
            fs.writeFileSync(TEST_FILE, "hello world world", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                oldText: "world",
                newText: "there",
                allowMultiple: false,
            };
            expect(() => handleReplaceText(TEST_DIR, args)).toThrowError("Ambiguous replacement");
        });

        it("should replace all occurrences of text if allowMultiple is true", () => {
            fs.writeFileSync(TEST_FILE, "hello world world", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                oldText: "world",
                newText: "there",
                allowMultiple: true,
            };
            const result = handleReplaceText(TEST_DIR, args as any);
            expect(result.content[0].text).toContain("✅ Surgical edit successful in");
            expect(fs.readFileSync(TEST_FILE, "utf8")).toBe("hello there there\n");
        });

        it("should log usage to metrics.json upon replace", () => {
            fs.writeFileSync(TEST_FILE, "hello world", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                oldText: "world",
                newText: "there",
            };
            handleReplaceText(TEST_DIR, args);
            const metricsPath = path.join(TEST_DIR, ".enderun/observability/metrics.json");
            expect(fs.existsSync(metricsPath)).toBe(true);
            const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
            expect(metrics[0].action).toContain("replace_text");
        });
    });

    describe("handlePatchFile", () => {
        it("should replace lines in specified range", () => {
            fs.writeFileSync(TEST_FILE, "line1\nline2\nline3\nline4", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                startLine: 2,
                endLine: 3,
                newContent: "patched2\npatched3",
            };
            const result = handlePatchFile(TEST_DIR, args);
            expect(result.content[0].text).toContain("✅ File patched successfully");
            expect(fs.readFileSync(TEST_FILE, "utf8")).toBe("line1\npatched2\npatched3\nline4");
        });

        it("should throw an error for invalid start line", () => {
            fs.writeFileSync(TEST_FILE, "line1\nline2", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                startLine: 5,
                endLine: 2,
                newContent: "error",
            };
            expect(() => handlePatchFile(TEST_DIR, args)).toThrowError("Invalid start line");
        });

        it("should throw an error for invalid end line", () => {
            fs.writeFileSync(TEST_FILE, "line1\nline2", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                startLine: 1,
                endLine: 5,
                newContent: "error",
            };
            expect(() => handlePatchFile(TEST_DIR, args)).toThrowError("Invalid end line");
        });

        it("should log usage to metrics.json upon patch", () => {
            fs.writeFileSync(TEST_FILE, "line1\nline2\nline3\nline4", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                startLine: 2,
                endLine: 3,
                newContent: "patched2\npatched3",
            };
            handlePatchFile(TEST_DIR, args as any);
            const metricsPath = path.join(TEST_DIR, ".enderun/observability/metrics.json");
            expect(fs.existsSync(metricsPath)).toBe(true);
            const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
            expect(metrics[0].action).toContain("patch_file");
        });
    });

    describe("handleReadFile", () => {
        it("should read full file content", () => {
            fs.writeFileSync(TEST_FILE, "hello world", "utf8");
            const args: ToolArgs = { path: TEST_FILE };
            const result = handleReadFile(TEST_DIR, args as any);
            expect(result.content[0].text).toBe("hello world");
        });

        it("should read sliced lines", () => {
            fs.writeFileSync(TEST_FILE, "line1\nline2\nline3\nline4", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                startLine: 2,
                endLine: 3
            };
            const result = handleReadFile(TEST_DIR, args as any);
            expect(result.content[0].text).toBe("line2\nline3");
        });

        it("should truncate long files", () => {
            const longContent = Array.from({ length: 1005 }, (_, i) => `line ${i + 1}`).join("\n");
            fs.writeFileSync(TEST_FILE, longContent, "utf8");
            const args: ToolArgs = { path: TEST_FILE };
            const result = handleReadFile(TEST_DIR, args as any);
            expect(result.content[0].text).toContain("TRUNCATED");
            expect(result.content[0].text).toContain("line 1000");
            expect(result.content[0].text).not.toContain("line 1001");
        });
    });

    describe("handleWriteFile", () => {
        it("should write new file and log usage", () => {
            const args: ToolArgs = {
                path: TEST_FILE,
                content: "hello world"
            };
            const result = handleWriteFile(TEST_DIR, args);
            expect(result.content[0].text).toContain("✅ File written:");
            expect(fs.readFileSync(TEST_FILE, "utf8")).toBe("hello world\n");
        });

        it("should write new file and log usage to metrics.json", () => {
            const args: ToolArgs = {
                path: TEST_FILE,
                content: "hello world"
            };
            handleWriteFile(TEST_DIR, args);
            const metricsPath = path.join(TEST_DIR, ".enderun/observability/metrics.json");
            expect(fs.existsSync(metricsPath)).toBe(true);
            const metrics = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
            expect(metrics[0].action).toContain("write_file");
            expect(metrics[0].estimatedTokens).toBeGreaterThan(0);
        });

        it("should append update to PROJECT_MEMORY.md if it exists", () => {
            fs.mkdirSync(MEMORY_DIR, { recursive: true });
            fs.writeFileSync(MEMORY_FILE, "## CURRENT STATUS\n", "utf8");
            const args: ToolArgs = {
                path: TEST_FILE,
                content: "hello world"
            };
            handleWriteFile(TEST_DIR, args);
            const memoryContent = fs.readFileSync(MEMORY_FILE, "utf8");
            expect(memoryContent).toContain("Auto-Update");
            expect(memoryContent).toContain("wrote file");
        });
    });
});
