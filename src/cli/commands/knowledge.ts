import fs from "fs";
import path from "path";

import { getFrameworkDir } from "../utils/memory.js";

import { writeTextFile } from "../utils/fs.js";

export async function updateKnowledgeBaseCommand(topic: string, content: string) {
    if (!topic || !content) {
        console.error("❌ Usage: agent-enderun update_knowledge_base <topic> <content>");
        return;
    }
    const frameworkDir = getFrameworkDir();
    const kbDir = path.join(frameworkDir, "knowledge");
    if (!fs.existsSync(kbDir)) fs.mkdirSync(kbDir, { recursive: true });
    const fileName = topic.replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".md";
    writeTextFile(path.join(kbDir, fileName), content);
    console.warn(`✅ Knowledge base updated: ${topic}`);
}

export async function searchKnowledgeBaseCommand(query: string) {
    if (!query) {
        console.error("❌ Usage: agent-enderun search_knowledge_base <query>");
        return;
    }
    const frameworkDir = getFrameworkDir();
    const kbDir = path.join(frameworkDir, "knowledge");
    if (!fs.existsSync(kbDir)) {
        console.warn("ℹ️ Knowledge base is empty.");
        return;
    }
    const files = fs.readdirSync(kbDir).filter(f => f.endsWith(".md"));
    let found = false;
    for (const file of files) {
        const content = fs.readFileSync(path.join(kbDir, file), "utf-8");
        if (content.toLowerCase().includes(query.toLowerCase()) || file.toLowerCase().includes(query.toLowerCase())) {
            console.warn(`
### ${file.replace(".md", "")}
${content.slice(0, 300)}...`);
            found = true;
        }
    }
    if (!found) console.warn("ℹ️ No matching entries found.");
}
