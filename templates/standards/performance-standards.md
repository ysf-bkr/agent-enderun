# 📈 Performance Monitoring Standards

This document defines the metrics and monitoring requirements to ensure the Enderun Army operates at peak efficiency.

## 1. Core Metrics
- **Task Latency (Completion Time):** Time from task delegation (`PENDING`) to completion (`SUCCESS`) must be tracked.
- **Token Consumption:** The total LLM tokens used per `Trace ID` must be logged and analyzed to identify inefficient prompts.
- **Agent Error Rates:** The frequency of `FAILED` or `RETRY` statuses per agent must be monitored.

## 2. Telemetry Implementation
- **Standardized Logging:** Every task completion event must include the `Trace ID`, the duration (in milliseconds), and the tool/agent interaction summary.
- **Performance Budgeting:** Each agent role has an estimated token budget. Budget overflows must be reported by the `@analyst` agent.

## 3. Bottleneck Identification
- **Critical Path Analysis:** Agents identified as bottlenecking the orchestration loop (frequent `WAITING` or `BLOCKED` states) must be reviewed for logic optimization.
