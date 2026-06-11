import fs from "fs";
import path from "path";
import { generateULID } from "../utils/time.js";
import { UI } from "../utils/ui.js";
import { writeJsonFile } from "../utils/fs.js";

/**
 * Reads ALL markdown files from the docs/ directory and creates
 * planning tasks from them. Agents will use this to understand
 * project requirements and generate code accordingly.
 */
export async function planCommand() {
    const projectRoot = process.cwd();
    const docsDir = path.join(projectRoot, "docs");

    if (!fs.existsSync(docsDir)) {
        UI.error("Docs directory not found at docs/");
        console.warn("💡  Create a docs/ folder with your project requirements in .md files.");
        return;
    }

    const entries = fs.readdirSync(docsDir, { withFileTypes: true });
    const mdFiles = entries.filter(e => e.isFile() && e.name.endsWith(".md"));

    if (mdFiles.length === 0) {
        UI.warning("No markdown files found in docs/ directory.");
        console.warn("💡  Add .md files to docs/ with your project requirements.");
        return;
    }

    UI.intent("Planning Engine", `Reading ${mdFiles.length} document(s) from docs/...`);

    // Discover available template standards
    const templatesDir = path.join(projectRoot, "templates");
    const standards: string[] = [];
    if (fs.existsSync(templatesDir)) {
        const templateFiles = fs.readdirSync(templatesDir);
        standards.push(...templateFiles.filter(f => f.endsWith("-standards.md")).map(f => `templates/${f}`));
        if (standards.length > 0) {
            UI.success(`Found ${standards.length} standard templates available for code generation.`);
        }
    }

    let totalTasks = 0;

    for (const file of mdFiles) {
        const filePath = path.join(docsDir, file.name);
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content.split("\n");
        const traceId = generateULID();

        UI.success(`📄 docs/${file.name} (${lines.length} lines) → Trace: ${traceId}`);

        console.warn(`   Content preview: ${content.substring(0, 200).replace(/\n/g, " ")}...`);

        // Extract headings as task descriptions
        const headingRegex = /^#{2,4}\s+(.+)$/gm;
        let headingMatch;
        let headingCount = 0;
        while ((headingMatch = headingRegex.exec(content)) !== null) {
            headingCount++;
            totalTasks++;
        }

        // Extract checklist items
        const taskRegex = /- \[ \]\s+(.+)/g;
        let taskMatch;
        let taskCount = 0;
        while ((taskMatch = taskRegex.exec(content)) !== null) {
            if (taskMatch[1].trim().length >= 3) {
                taskCount++;
                totalTasks++;
            }
        }

        console.warn(`   📋 ${headingCount} sections, ${taskCount} actionable tasks detected`);

        // Store in project memory-compatible format
        const memoryDir = path.join(projectRoot, ".enderun", "memory", "tasks");
        if (!fs.existsSync(memoryDir)) {
            fs.mkdirSync(memoryDir, { recursive: true });
        }

        const taskFile = path.join(memoryDir, `${traceId}.json`);
        const taskData = {
            traceId,
            source: `docs/${file.name}`,
            description: `Process requirements from docs/${file.name}`,
            status: "PENDING",
            createdAt: new Date().toISOString(),
            standards,
            headings: headingCount,
            tasks: taskCount,
            preview: content.substring(0, 500),
        };
        writeJsonFile(taskFile, taskData);
    }

    // Log available standards
    if (standards.length > 0) {
        console.warn("");
        UI.divider();
        console.warn("📚  Available Enterprise Standards:");
        standards.forEach(s => console.warn(`    - ${s}`));
        UI.divider();
    }

    UI.success(`\n✅ Planning complete: ${totalTasks} tasks identified from ${mdFiles.length} document(s).`);
    console.warn("\n📋  Next steps:");
    console.warn("    1. Run 'agent-enderun status' to see project state");
    console.warn("    2. AI agents (Claude, Gemini, Grok, etc.) will read docs/ and templates/");
    console.warn("    3. Agents generate enterprise-standard code based on requirements");
    console.warn("    4. Use @agent delegation for specific tasks: agent-enderun @backend \"...\"");
}
