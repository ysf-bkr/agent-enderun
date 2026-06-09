# 🤖 LLM Governance and Data Protection

This document outlines the security and discipline rules for interacting with Large Language Models within Enderun-managed projects.

## 1. Trust Zone
- **Input Sanitization:** All user-provided data must be sanitized before being sent to an LLM context to prevent Prompt Injection attacks.
- **PII Protection:** Absolutely no Personally Identifiable Information (PII) or customer-sensitive credentials should ever be included in prompts.

## 2. Token Discipline
- **Context Pruning:** Agents must proactively clear unnecessary context and follow the memory pruning protocol (`.enderun/memory/archive/`) to maintain prompt efficiency.
- **Prompt Scoping:** Prompts should be scoped to the minimum required knowledge to prevent "Context Drift".

## 3. Autonomous Behavior
- **Human-in-the-Loop:** Any action marked as `ACTION` category requiring state mutation must trigger an approval flow.
- **Escalation:** If an agent encounters an ambiguity that exceeds its capability (capability < 9), it must stop and escalate to `@manager`.
