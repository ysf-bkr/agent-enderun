import { describe, expect, it } from "vitest";
import { ALL_AGENTS, buildAgentJson } from "../src/modules/agents/definitions.js";

describe("Agents Definitions", () => {
    it("should have exactly 13 agents defined", () => {
        expect(ALL_AGENTS).toHaveLength(13);
    });

    it("should ensure all agents have required properties and types", () => {
        for (const agent of ALL_AGENTS) {
            expect(agent.name).toBeTypeOf("string");
            expect(agent.displayName).toBeTypeOf("string");
            expect(agent.role).toBeTypeOf("string");
            expect(agent.description).toBeTypeOf("string");
            expect(agent.capability).toBeTypeOf("number");
            expect(agent.tier).toBeTypeOf("string");
            expect(Array.isArray(agent.tags)).toBe(true);
            expect(agent.stateMachine).toBeTypeOf("string");
            expect(Array.isArray(agent.tools)).toBe(true);
            expect(agent.instructions).toBeTypeOf("object");
            expect(agent.instructions.identity).toBeTypeOf("string");
            expect(agent.instructions.mission).toBeTypeOf("string");
            expect(Array.isArray(agent.instructions.rules)).toBe(true);

            expect(agent.instructions.rules.length).toBeGreaterThan(0);
        }
    });

    it("should enforce unique names for all agents", () => {
        const names = ALL_AGENTS.map(agent => agent.name);
        const uniqueNames = new Set(names);
        expect(names).toHaveLength(uniqueNames.size);
    });

    it("should build valid agent JSON spec via buildAgentJson", () => {
        const mockAgent = {
            name: "test-agent",
            displayName: "Test Agent",
            role: "Testing stuff",
            description: "Test agent description",
            capability: 9,
            tier: "core",
            tags: ["core", "strategy"],
            stateMachine: "../schema/life.json",
            tools: ["tool1", "tool2"],
            instructions: {
                identity: "Mock Identity",
                mission: "Mock mission statement.",
                rules: ["Do test steps."]
            }
        };

        const jsonString = buildAgentJson(mockAgent as any);
        const parsed = JSON.parse(jsonString);

        expect(parsed.name).toBe("test-agent");
        expect(parsed.displayName).toBe("Test Agent");
        expect(parsed.description).toBe("Test agent description");
        expect(parsed.hidden).toBe(false);
        expect(parsed.customAgentSpec.customAgent.toolNames).toEqual(["tool1", "tool2"]);
        expect(parsed.customAgentSpec.customAgent.systemPromptSections[0].title).toBe("Identity & Mission");
        expect(parsed.customAgentSpec.customAgent.systemPromptSections[0].content).toContain("Mock Identity");
        expect(parsed.customAgentSpec.customAgent.systemPromptSections[0].content).toContain("Mock mission statement.");
        expect(parsed.customAgentSpec.customAgent.systemPromptSections[3].title).toBe("Discipline Rules");
        expect(parsed.customAgentSpec.customAgent.systemPromptSections[3].content).toContain("Do test steps.");
    });
});
