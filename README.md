# 🏛️ Agent Enderun — Enterprise AI Governance & Autonomous Orchestration Framework

[![Stable Release](https://img.shields.io/badge/Release-v1.11.5-blue.svg)](https://github.com/ysf-bkr/Agent-Enderun)
[![Type-Safety](https://img.shields.io/badge/Type--Safety-100%25-green.svg)](https://github.com/ysf-bkr/Agent-Enderun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Agent Enderun** is an advanced "Supreme AI Governance & Autonomous Orchestration Framework" designed for complex, scalable, and highly auditable enterprise software projects. It transforms chaotic AI coding into a disciplined, governed, and traceable "Autonomous Army" operation.

## 🎯 The Problem We Solve

Standard AI coding assistants (Claude, Cursor, Aider) act as independent "code writers". Without strict governance, this leads to:
- **Rogue AI:** Uncontrolled rewrites of entire files.
- **Context Drift:** Severe memory loss between development sessions.
- **Token Waste:** High API costs due to a lack of prompt and context optimization.
- **Multi-Agent Chaos:** Conflicts and race conditions between different AI agents.
- **Loss of Corporate Control:** Unsupervised CRUD operations, schema changes, and admin-level tasks.

**Agent Enderun** solves these challenges by acting as a disciplined, auditable, and memory-persistent **Command System for an AI Army**.

## 🚀 Core Features

- **Strict Governance:** "Human-in-the-Loop" for critical operations (e.g., schema drops, bulk deletes) and Trace ID-based tracking for every action.
- **Advanced Memory System:** A 3-tier memory architecture (`PROJECT_MEMORY.md`, `shared-facts.json`, `agent-contexts`) that drastically prevents context drift.
- **Token Economy (Up to 90% Savings):** Employs "Surgical Edits" instead of full-file rewrites and smart memory pruning to keep context windows lean.
- **Hermes Message Broker:** Asynchronous, event-driven, DAG-based communication preventing agent conflicts.
- **13-Agent Specialized Army:** From `@manager` to `@security` and `@architect`, a complete virtual engineering team.
- **Multi-AI Synergy:** Out-of-the-box integration for **Grok** (Experimental/Recon), **Gemini** (Strategic Command), **Claude** (Field Operations), and **Cursor/Codex** (IDE Integration).

## 💰 Open Core & Pricing Model

Agent Enderun follows an **Open Core** model. The core framework is open-source (MIT), empowering individual developers and small teams to build structured projects. For large-scale organizations requiring advanced compliance, unlimited scaling, and premium support, we offer the **Enterprise Edition**.

| Feature | Community (Free/Open-Source) | Pro ($49/user/month) | Enterprise (Custom Pricing) |
| :--- | :--- | :--- | :--- |
| **Agent Army** | 13 Standard Agents | 13 Standard + Custom Agents | Unlimited Custom Agents |
| **Memory System** | Standard 3-Tier Memory | Extended Context & History | Infinite Archival & Vector DB Integration |
| **Governance** | Basic Rule Enforcement | Advanced Team Policies | EU AI Act Compliance & Full Audit Trails |
| **Security & RBAC** | Basic Access Controls | Role-Based Workflows | Advanced RLS & Custom SSO Integration |
| **Token Optimization**| Standard Surgical Edits | Enhanced Prompt Pruning | Dedicated Private Model Support |
| **Support** | Community / GitHub | Standard Email Support | 24/7 SLA & Dedicated Success Manager |

*For Enterprise inquiries and custom licensing, please contact: [enterprise@agent-enderun.com](mailto:enterprise@agent-enderun.com)*

## 🛠️ Quick Start (npx)

Initialize your workspace with a single command depending on your primary AI provider:

```bash
# Initialize for Gemini (Strategic Decision Center)
npx agent-enderun init gemini --unified --yes

# Initialize for Claude (Operational Surgery)
npx agent-enderun init claude --unified --yes

# Initialize for Grok (Autonomous Reconnaissance)
npx agent-enderun init grok
```

## 🕹️ Command Reference

*   **`npx agent-enderun status`**: View the current project Phase (0-4) and Agent health logs.
*   **`npx agent-enderun plan`**: Auto-detect tasks from `docs/` and schedule them via DAG.
*   **`npx agent-enderun orchestrate`**: Start the live Hermes agent synchronization loop.
*   **`npx agent-enderun approve [traceId]`**: Human sign-off for high-risk administrative or schema tasks.

---

Developed by **Yusuf BEKAR** | Framework Version **v1.11.5** | [Enterprise Inquiries](mailto:enterprise@agent-enderun.com)