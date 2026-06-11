# 📊 Observability and Monitoring Standards

This document defines the requirements for logging, tracing, and observability within Enderun-managed projects.

## 1. Traceability
- **Trace ID Enforcement:** Every single request, message, or task delegated between agents must include the active `Trace ID` in its metadata.
- **Context Logging:** Logs must be structured in JSON format where possible, containing at least: `timestamp`, `level`, `agentName`, `traceId`, `action`, and `message`.

## 2. Audit Trail
- **High-Risk Actions:** All administrative or high-risk actions (e.g., DB changes, User role updates) must be recorded in `observability/audit_log.md` with a timestamp, actor agent, and outcome.
- **Immutable Logs:** Audit logs should be appended only and never modified or deleted.

## 3. Monitoring
- **Health Checks:** Agents must periodically invoke the `get_system_health` tool.
- **Alerting:** Critical errors or timeouts must immediately trigger an `ALERT` message to the `@manager` agent for escalation.
