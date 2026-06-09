import { updateDocumentStore, generateULID, getFrameworkDir } from "../utils/memory.js";
import { sanitizeInput, normalizeAgentName, normalizePriority } from "../utils/string.js";

/**
 * Generate a new Trace ID and add it to project memory.
 */
export async function traceNewCommand(description: string, agent = "manager", priority = "P2"): Promise<string | void> {
    const traceId = generateULID();
    const safeDescription = sanitizeInput(description);
    const safeAgent = normalizeAgentName(agent);
    const safePriority = normalizePriority(priority);
    const frameworkDir = getFrameworkDir();
    // ...

    // --- Document Store Write ---
    updateDocumentStore("task", {
        traceId,
        description: safeDescription,
        agent: safeAgent,
        priority: safePriority,
        status: "IN_PROGRESS",
        createdAt: new Date().toISOString()
    }, traceId, frameworkDir);
    // ----------------------------

    console.warn(`
✅ New Trace ID created: ${traceId}`);
    console.warn(`📝 Added to task list: ${description}
`);
    return traceId;
}
