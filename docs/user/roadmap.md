# 🗺️ Hermes Control Center — Project Roadmap

Bu roadmap, Hermes Control Center uygulamasının geliştirilme aşamalarını ve AI ajanlarının yapacağı işleri tanımlar. `agent-enderun plan` komutu ile otomatik olarak görev yönetimine aktarılır.

---

## PHASE 1: Genesis & Architecture
- [x] Initialize Project Memory and Brain Hub | P1 | @manager
- [x] Setup Technical Stack and Architecture Specs | P1 | @architect
- [ ] Define Core Database Schema and Kysely Migrations | P1 | @database
- [ ] Establish Branded Types for TraceID, MessageID and AuditLogs | P1 | @architect

## PHASE 2: Core Development
- [ ] Setup Express API server under apps/backend with TS/ESM | P2 | @backend
- [ ] Implement API endpoint to parse .enderun/memory/status.json and state.json | P2 | @backend
- [ ] Implement API endpoint to read active and archived Hermes messages | P2 | @backend
- [ ] Implement shell executor endpoint to run 'agent-enderun approve [traceId]' | P2 | @backend
- [ ] Initialize apps/web React UI scaffolding with Panda CSS | P2 | @frontend
- [ ] Build Agent Monitor and Hermes Broker View components | P2 | @frontend
- [ ] Build Human-in-the-Loop Approval Center component | P2 | @frontend
- [ ] Build Compliance Audit Panel component | P2 | @frontend

## PHASE 3: Integration & Testing
- [ ] Connect React Frontend to Express Backend endpoints using React Query | P3 | @frontend
- [ ] Integrate file watchers on .enderun/ directory to stream changes via WebSocket/SSE | P3 | @backend
- [ ] Write Vitest unit tests for backend controllers and services | P3 | @quality
- [ ] Write Vitest tests for frontend components | P3 | @quality

## PHASE 4: Validation & Hardening
- [ ] Run AST vulnerability scans and compliance checks | P4 | @quality
- [ ] Execute Playwright E2E tests to verify approval and lock flows | P4 | @quality
- [ ] Perform security audit on secret storage and environment config | P4 | @security

## PHASE 5: Deployment & Rollout
- [ ] Configure Docker container and local dev startup scripts | P5 | @devops
- [ ] Run final Agent Enderun compliance check and seal the project | P5 | @manager
