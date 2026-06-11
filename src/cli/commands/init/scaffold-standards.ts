import fs from "fs";
import path from "path";
import { ensureDir, writeTextFile } from "../../utils/fs.js";
import { getPackageRoot } from "../../utils/pkg.js";
import { CORE_SKILLS } from "../../../modules/skills/definitions.js";

const FRAMEWORK_NAME = "Agent Enderun";

export function scaffoldSkills(skillsBaseDir: string, dryRun: boolean) {
    if (dryRun) return;
    ensureDir(skillsBaseDir, dryRun);
    for (const [key, skill] of Object.entries(CORE_SKILLS)) {
        const mdContent = `# 🛠️ ${FRAMEWORK_NAME} Skill — ${skill.name}\n\n${skill.description}\n\n## 🔌 Associated Tools\n${skill.tools.map(t => `- \`${t}\``).join("\n")}\n\n## 🛡️ Core Mandates\n${skill.mandates.join("\n")}\n`;
        writeTextFile(path.join(skillsBaseDir, `${key.toLowerCase()}.md`), mdContent);
    }
}

export function scaffoldStandards(frameworkDir: string, dryRun: boolean) {
    if (dryRun) return;
    const knowledgePath = path.join(frameworkDir, "knowledge");
    if (!fs.existsSync(knowledgePath)) fs.mkdirSync(knowledgePath, { recursive: true });

    const eslintStandardsContent = `# 🎖️ Agent Enderun — ESLint Standards

This document outlines the strict ESLint coding standards for Agent Enderun projects.

## 📏 Core Rules
- **Indentation:** 4 spaces (strict).
- **Quotes:** Double quotes (\`"\`) for strings.
- **Semicolons:** Always terminate statements with a semicolon (\`;\`).
- **No Explicit Any:** Avoid using \`any\`. Use strongly typed interfaces, generics, or \`unknown\` with type assertions.
- **Unused Variables:** Warning on unused variables unless prefixed with an underscore (\`_\`).
`;
    writeTextFile(path.join(knowledgePath, "eslint-standards.md"), eslintStandardsContent);

    const standards = [
        // ── Supreme Governance (required by @manager, @security, @architect) ──────
        { file: "governance-standards.md", template: "templates/standards/governance-standards.md", default: "# 🎖️ Agent Enderun — Governance & Nizam Standards" },
        // ── Core Engineering Standards ────────────────────────────────────────────
        { file: "crud-governance.md", template: "templates/standards/crud-governance.md", default: "# 🏛️ Corporate CRUD and Governance Standards" },
        { file: "architecture-standards.md", template: "templates/standards/architecture-standards.md", default: "# 📐 Corporate Architecture Standards" },
        { file: "frontend-standards.md", template: "templates/standards/frontend-standards.md", default: "# 🎨 Corporate Frontend Standards" },
        { file: "tailwind-standards.md", template: "templates/standards/tailwind-standards.md", default: "# 🌊 Corporate Tailwind Standards" },
        { file: "mobile-standards.md", template: "templates/standards/mobile-standards.md", default: "# 📱 Corporate Mobile Standards" },
        { file: "security-standards.md", template: "templates/standards/security-standards.md", default: "# 🛡️ Corporate Security Standards" },
        { file: "quality-standards.md", template: "templates/standards/quality-standards.md", default: "# ⚖️ Corporate Code Quality Standards" },
        { file: "logging-and-secrets.md", template: "templates/standards/logging-and-secrets.md", default: "# 🪵 Corporate Logging Standards" },
        { file: "testing-standards.md", template: "templates/standards/testing-standards.md", default: "# 🧪 Corporate Testing Standards" },
        { file: "i18n-standards.md", template: "templates/standards/i18n-standards.md", default: "# 🌐 Corporate i18n Standards" },
        { file: "llm-governance.md", template: "templates/standards/llm-governance.md", default: "# 🤖 LLM Governance Standards" },
        { file: "observability-standards.md", template: "templates/standards/observability-standards.md", default: "# 📈 Corporate Observability Standards" },
        { file: "deployment-standards.md", template: "templates/standards/deployment-standards.md", default: "# 🚀 Corporate Deployment Standards" },
        { file: "performance-standards.md", template: "templates/standards/performance-standards.md", default: "# ⚡ Corporate Performance Standards" },
        { file: "security-audit-standards.md", template: "templates/standards/security-audit-standards.md", default: "# 🔍 Corporate Security Audit Standards" }
    ];

    for (const std of standards) {
        let content = std.default;
        try {
            const fullTemplatePath = path.join(getPackageRoot(), std.template);
            if (fs.existsSync(fullTemplatePath)) {
                content = fs.readFileSync(fullTemplatePath, "utf8");
            }
        } catch { /* fallback to default */ }
        writeTextFile(path.join(knowledgePath, std.file), content);
    }
}
