# Contributing to Agent Enderun

Welcome to the **Agent Enderun** project. This framework is governed by the **Enderun Order (Enderun Nizamı)**, a set of strict engineering disciplines designed for stability, predictability, and AI-first development.

## 🎖️ The Enderun Order (Strict Rules)

To maintain the integrity of the framework, all contributors (human or AI) must adhere to these mandates:

### 1. Surgical Precision
- **Never overwrite entire files.** Always use surgical edit tools or methods (like `replace_text` or `patch_file`).
- Avoid "bloat" changes. Only modify what is necessary for the task.

### 2. Strict Type Safety
- **Zero `any` Policy:** Usage of the `any` type is considered a major breach of discipline. Always use precise types or `unknown` with type guards.
- **Branded Types:** Use Branded Types for identifiers (e.g., `TraceID`, `UserID`) to prevent logic errors.

### 3. Clean Communication
- **No `console.log`:** Production code must never contain `console.log`. Use the internal `EnterpriseLogger` for system events or `UI` utilities for CLI output.
- **Traceability:** Every operation must be linked to a `TraceID`.

### 4. Definition-First Development
- **Contracts First:** Update API or type contracts (`src/types/`) before implementing logic.
- **Agent Registry:** Every new agent must be defined in `src/modules/agents/definitions.ts`. The system will automatically generate the corresponding platform instructions during `init`.

## 🛠️ Development Workflow

1.  **Research:** Analyze the existing architecture and standards.
2.  **Strategy:** Plan your changes according to the Enderun Order.
3.  **Execute:** Apply surgical edits.
4.  **Validate:** Run `agent-enderun check` and existing tests.

## 🧪 Testing Standards

- **Integration Over Mocks:** Prefer real or service-compatible test backends over deep mocking.
- **Coverage:** Aim for 80%+ coverage for new core modules.

## 🛡️ Pre-commit Discipline

To automate the enforcement of the **Enderun Order**, it is highly recommended to set up a git `pre-commit` hook that runs the health check and tests:

1. Install `husky`: \`npm install husky --save-dev && npx husky init\`
2. Add the following to \`.husky/pre-commit\`:
   \`\`\`bash
   npx agent-enderun check && npm run enderun:test
   \`\`\`

This ensures that no code enters the repository without meeting our high-discipline standards.

Thank you for upholding the discipline of Agent Enderun.
