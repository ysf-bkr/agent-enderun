import chalk from "chalk";

import { listTasks, readState, readStatus } from "../utils/memory.js";

/**
 * Print the current framework status.
 */
export async function statusCommand() {
    const state = readState();
    const tasks = listTasks();
    const agentStatuses = readStatus();

    if (!state) {
        console.error("❌ Error: Memory state not found. Please run 'init' first.");
        return;
    }

    console.warn("\n📊 --- PROJECT STATUS ---");
    console.warn(`🔹 Phase: ${state.phase}`);
    console.warn(`🆔 Trace ID: ${state.traceId}`);
    console.warn(`🤖 Manager: ${state.managerState}`);

    // Read Agent Status from Document Store
    console.warn("\n🎖️  Enderun Army Status (Agent States):");
    for (const [agentName, info] of Object.entries(agentStatuses)) {
        const { state, task } = info as { state: string; task: string };
        let coloredState = state;
        if (state === "READY") coloredState = chalk.green(state);
        else if (state === "EXECUTING") coloredState = chalk.yellow(state);
        else if (state === "BLOCKED" || state === "TIMEOUT") coloredState = chalk.red(state);
        else if (state === "WAITING") coloredState = chalk.cyan(state);
        
        console.warn(`  ${chalk.bold(agentName.padEnd(12))} : [${coloredState}] - ${task}`);
    }

    if (tasks.length > 0) {
        console.warn("\n📋 Active Tasks:");
        tasks.forEach((t: { priority: string; status: string; description: string; agent: string }) => {
            console.warn(`  - [${t.priority}] ${t.status}: ${t.description} (@${t.agent})`);
        });
    }

    console.warn("\n-----------------------\n");
}

