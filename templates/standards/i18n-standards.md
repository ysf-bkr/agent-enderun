# 🌐 Corporate Multi-Language (i18n) Standards

This document defines the localization and multi-language management rules for projects managed by Agent Enderun.

## 1. Centralized Management
- **Hardcoded Forbidden:** No text visible to the user shall be written directly into the code (JSX/HTML/TS).
- **Locales Directory:** All languages are stored as JSON files under `apps/web/public/locales/` or `apps/web/src/locales/`.
- **Key-Value Standard:** Meaningful and hierarchical keys are used (e.g., `common.buttons.save`, `errors.auth.invalid_password`).

## 2. Technical Implementation
- **i18next:** The `next-i18next` or `react-i18next` library is standard in projects.
- **Dynamic Content:** i18n interpolation (`{{name}}`) must be used for text containing variables.
- **Pluralization:** Singular/plural cases must be managed using the i18n library's own rules.

## 3. Auditing
- When the `@frontend` agent creates a new UI component, it automatically moves texts to the relevant JSON files.
- Missing translation key (missing key) checks are performed by `@quality`.
