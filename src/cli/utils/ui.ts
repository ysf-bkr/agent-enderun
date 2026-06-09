import chalk from "chalk";

/**
 * Professional UI Utilities for Agent Enderun CLI.
 * Standardizes headers, status boxes, and strategic intent reporting.
 */

export const UI = {
    /**
     * Renders a strategic intent block similar to Gemini CLI's topic updates.
     */
    intent: (title: string, intent: string) => {
        console.warn(`\n${chalk.bold.cyan(title)}:`);
        console.warn(`${chalk.italic.gray(`  ${intent}`)}\n`);
    },

    /**
     * Renders a professional agent execution box.
     */
    agentBox: (agentName: string, action: string, details?: string) => {
        const width = process.stdout.columns || 80;
        const line = "─".repeat(Math.max(0, width - 2));
        
        console.warn(chalk.gray(`╭${line}╮`));
        const padding = Math.max(0, width - agentName.length - 27);
        console.warn(`${chalk.gray("│")} ${chalk.bold.yellow("≡")} ${chalk.white(`Running Agent: ${chalk.bold.green(agentName)}...`)} ${chalk.gray("(ctrl+o to expand)".padStart(padding))} ${chalk.gray("│")}`);
        if (action) {
            const paddingAction = Math.max(0, width - action.length - 6);
            console.warn(`${chalk.gray("│")} ${chalk.blue("!")} ${chalk.cyan(action)} ${" ".repeat(paddingAction)} ${chalk.gray("│")}`);
        }
        if (details) {
            const paddingDetails = Math.max(0, width - details.length - 7);
            console.warn(`${chalk.gray("│")}   ${chalk.gray(details.slice(0, width - 10))} ${" ".repeat(paddingDetails)} ${chalk.gray("│")}`);
        }
        console.warn(chalk.gray(`╰${line}╯`));
    },

    /**
     * Renders a success status message.
     */
    success: (msg: string) => {
        console.warn(`${chalk.bold.green("✅")} ${msg}`);
    },

    /**
     * Renders an error status message.
     */
    error: (msg: string) => {
        console.error(`${chalk.bold.red("❌")} ${chalk.red(msg)}`);
    },

    /**
     * Renders a warning status message.
     */
    warning: (msg: string) => {
        console.warn(`${chalk.bold.yellow("⚠️")} ${chalk.yellow(msg)}`);
    },

    /**
     * Renders an info/divider line.
     */
    divider: () => {
        const width = process.stdout.columns || 80;
        console.warn(chalk.gray("─".repeat(width)));
    }
};
