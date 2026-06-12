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
        process.stdout.write(`\n${chalk.bold.cyan(title)}:\n`);
        process.stdout.write(`${chalk.italic.gray(`  ${intent}`)}\n\n`);
    },

    /**
     * Renders a professional agent execution box.
     */
    agentBox: (agentName: string, action: string, details?: string) => {
        const width = process.stdout.columns || 80;
        const line = "─".repeat(Math.max(0, width - 2));
        
        process.stdout.write(chalk.gray(`╭${line}╮`) + "\n");
        const padding = Math.max(0, width - agentName.length - 27);
        process.stdout.write(`${chalk.gray("│")} ${chalk.bold.yellow("≡")} ${chalk.white(`Running Agent: ${chalk.bold.green(agentName)}...`)} ${chalk.gray("(ctrl+o to expand)".padStart(padding))} ${chalk.gray("│")}\n`);
        if (action) {
            const paddingAction = Math.max(0, width - action.length - 6);
            process.stdout.write(`${chalk.gray("│")} ${chalk.blue("!")} ${chalk.cyan(action)} ${" ".repeat(paddingAction)} ${chalk.gray("│")}\n`);
        }
        if (details) {
            const paddingDetails = Math.max(0, width - details.length - 7);
            process.stdout.write(`${chalk.gray("│")}   ${chalk.gray(details.slice(0, width - 10))} ${" ".repeat(paddingDetails)} ${chalk.gray("│")}\n`);
        }
        process.stdout.write(chalk.gray(`╰${line}╯`) + "\n");
    },

    /**
     * Renders a success status message.
     */
    success: (msg: string) => {
        process.stdout.write(`${chalk.bold.green("✅")} ${msg}\n`);
    },

    /**
     * Renders an error status message.
     */
    error: (msg: string) => {
        process.stderr.write(`${chalk.bold.red("❌")} ${chalk.red(msg)}\n`);
    },

    /**
     * Renders a warning status message.
     */
    warning: (msg: string) => {
        process.stdout.write(`${chalk.bold.yellow("⚠️")} ${chalk.yellow(msg)}\n`);
    },

    /**
     * Renders an info/divider line.
     */
    divider: () => {
        const width = process.stdout.columns || 80;
        process.stdout.write(chalk.gray("─".repeat(width)) + "\n");
    }
};
