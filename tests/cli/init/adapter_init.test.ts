import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { ADAPTER_IDS } from "../../../src/cli/adapters/index.js";
import { scaffoldAgents, runAdapterPostInit } from "../../../src/cli/adapters/index.js";
import { ADAPTERS } from "../../../src/cli/adapters/core.js";

describe("Adapter Initialization & Scaffolding - Granular Verification", () => {
    let tempDir: string;

    beforeEach(() => {
        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "enderun-init-test-"));
        vi.spyOn(process, "cwd").mockReturnValue(tempDir);
    });

    afterEach(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
        vi.restoreAllMocks();
    });

    ADAPTER_IDS.forEach((adapterId) => {
        describe(`Adapter: ${adapterId}`, () => {
            it("should scaffold agent files and configure MCP", () => {
                const adapter = ADAPTERS[adapterId];
                
                // 1. Scaffold
                scaffoldAgents(tempDir, adapterId, false);
                if (adapter.agentsDir) {
                    const agentsPath = path.join(tempDir, adapter.agentsDir);
                    expect(fs.existsSync(agentsPath)).toBe(true);
                    // Check if at least one agent file was created
                    const files = fs.readdirSync(agentsPath, { recursive: true });
                    expect(files.length).toBeGreaterThan(0);
                }

                // 2. Post-Init
                runAdapterPostInit(adapter, tempDir);
                
                // Verification: mcp.json should exist
                expect(fs.existsSync(path.join(tempDir, "mcp.json"))).toBe(true);
            });
        });
    });
});
