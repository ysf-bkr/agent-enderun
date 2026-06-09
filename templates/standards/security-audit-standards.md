# 🛡️ Security Audit Standards

This document defines the security audit procedures required for all Agent Enderun-managed projects to ensure a "Defense-in-Depth" posture.

## 1. Automated Vulnerability Scanning
- **Dependency Audit:** All projects must execute `npm audit` within the CI/CD pipeline. Any high/critical vulnerability must block deployment.
- **Static Analysis (SAST):** Use `eslint-plugin-security` to detect potential vulnerabilities (e.g., insecure crypto, command injection risks) in the codebase.

## 2. Agent Governance (Prompt Security)
- **Prompt Sanitization:** All user-provided inputs must pass through `src/cli/utils/string.ts` sanitizers before being injected into system prompts.
- **Tool Allowlist:** Agents must only have access to a strictly defined, minimal toolset required for their role.
- **Approval Flow:** Any agent requesting an action that modifies persistent state (File write, DB mutation) must be routed through the `@manager` approval gate.

## 3. Secret Management
- **Environment Isolation:** No secrets in code. Use `.env` files exclusively.
- **CI/CD Secrets:** Production secrets must be managed via GitHub Secrets/Action Variables, never committed to the repository.
