import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import {
    resolveAgentsDir,
    findAgentInstruction,
    detectActiveAgentLayouts,
    getUnifiedAgentLayoutBases,
    mirrorUnifiedAgentsToNative,
    UNIFIED_ADAPTER_SLUG,
} from "../../src/cli/adapters/paths.js";
import { scaffoldAgents } from "../../src/cli/adapters/scaffold.js";

describe("Adapter Paths", () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "enderun-paths-test-"));
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    describe("resolveAgentsDir", () => {
        it("should use adapter-specific dir in legacy mode", () => {
            expect(resolveAgentsDir("gemini", false).agentsDir).toBe(".gemini/agents");
            expect(resolveAgentsDir("codex", false).agentsDir).toBe(".agents/instructions");
        });

        it("should use per-platform subtree under unified hub in unified mode", () => {
            expect(resolveAgentsDir("gemini", true).agentsDir).toBe(".agents/gemini/agents");
            expect(resolveAgentsDir("cursor", true).agentsDir).toBe(".agents/cursor/rules");
            expect(resolveAgentsDir("codex", true).agentsDir).toBe(".agents/codex/instructions");
            expect(resolveAgentsDir("antigravity-cli", true).agentsDir).toBe(".agents/antigravity/agents");
        });

        it("should expose a layout base for every adapter slug", () => {
            const bases = getUnifiedAgentLayoutBases();
            expect(bases).toHaveLength(6);
            expect(bases.some((b) => b.includes(UNIFIED_ADAPTER_SLUG.gemini))).toBe(true);
        });
    });

    describe("findAgentInstruction", () => {
        it("should find unified gemini agent", () => {
            const dir = path.join(tempDir, ".agents/gemini/agents");
            fs.mkdirSync(dir, { recursive: true });
            fs.writeFileSync(path.join(dir, "manager.md"), "# manager");

            expect(findAgentInstruction(tempDir, "manager")).toBe(".agents/gemini/agents/manager.md");
        });

        it("should find nested antigravity agent.json", () => {
            const agentDir = path.join(tempDir, ".agents/antigravity/agents/manager");
            fs.mkdirSync(agentDir, { recursive: true });
            fs.writeFileSync(path.join(agentDir, "agent.json"), "{}");

            expect(findAgentInstruction(tempDir, "manager")).toBe(".agents/antigravity/agents/manager/agent.json");
        });
    });

    describe("mirrorUnifiedAgentsToNative", () => {
        it("should copy unified agents to native gemini path", () => {
            scaffoldAgents(tempDir, "gemini", false, ["manager"]);
            mirrorUnifiedAgentsToNative(tempDir, "gemini");

            expect(fs.existsSync(path.join(tempDir, ".gemini/agents/manager.md"))).toBe(true);
        });
    });

    describe("detectActiveAgentLayouts", () => {
        it("should list unified and legacy layouts", () => {
            fs.mkdirSync(path.join(tempDir, ".agents/claude/agents"), { recursive: true });
            fs.mkdirSync(path.join(tempDir, ".gemini/agents"), { recursive: true });

            const layouts = detectActiveAgentLayouts(tempDir);
            expect(layouts).toContain(".agents/claude/agents");
            expect(layouts).toContain(".gemini/agents");
        });
    });
});
