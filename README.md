# 🏛️ Agent Enderun — Enterprise AI Governance & Autonomous Orchestration Framework

[![Stable Release](https://img.shields.io/badge/Release-v1.11.5-blue.svg)](https://github.com/ysf-bkr/Agent-Enderun)
[![Type-Safety](https://img.shields.io/badge/Type--Safety-100%25-green.svg)](https://github.com/ysf-bkr/Agent-Enderun)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🇹🇷 TÜRKÇE — Genel Bakış

**Agent Enderun**, karmaşık, ölçeklenebilir ve yüksek denetim gerektiren kurumsal yazılım projeleri için tasarlanmış bir **"Üstün Yapay Zeka Yönetişimi ve Otonom Orkestrasyon Çerçevesidir"**. Kaotik yapay zeka kodlamasını disiplinli, yönetilebilir ve izlenebilir bir **"Otonom Ordu"** operasyonuna dönüştürür.

### 🎯 Çözdüğümüz Problemler
Standart yapay zeka kod asistanları (Claude, Cursor, Aider vb.) bağımsız "kod yazıcılar" olarak çalışır. Sıkı bir yönetişim olmadan bu durum şunlara yol açar:
- **Kontrolsüz Yapay Zeka (Rogue AI):** Dosyaların tamamının kontrolsüzce yeniden yazılması.
- **Bağlam Kayması (Context Drift):** Oturumlar arasında ciddi hafıza kaybı.
- **Token İsrafı:** Optimizasyon eksikliği nedeniyle yüksek API maliyetleri.
- **Çoklu Ajan Kaosu:** Farklı ajanlar arasında çakışmalar ve yarış durumları.
- **Kurumsal Kontrol Kaybı:** Denetimsiz CRUD işlemleri ve şema değişiklikleri.

### 🚀 Temel Özellikler
- **Sıkı Yönetişim:** Kritik işlemler için "Human-in-the-Loop" onayı ve Trace ID tabanlı izleme.
- **Gelişmiş Hafıza Sistemi:** Bağlam kaymasını engelleyen 3 katmanlı hafıza mimarisi.
- **Token Ekonomisi:** %90'a varan tasarruf sağlayan "Cerrahi Müdahale" (Surgical Edits) mantığı.
- **Hermes Mesaj Aracısı:** Ajan çakışmalarını engelleyen asenkron, olay tabanlı iletişim.
- **Güvenli Yerel AI:** %100 veri gizliliği için **Yerel LLM** (Ollama, vLLM) desteği.

---

## 🇺🇸 ENGLISH — Overview

**Agent Enderun** is an advanced "Supreme AI Governance & Autonomous Orchestration Framework" designed for complex, scalable, and highly auditable enterprise software projects. It transforms chaotic AI coding into a disciplined, governed, and traceable "Autonomous Army" operation.

### 🎯 The Problem We Solve
Standard AI coding assistants act as independent "code writers". Without strict governance, this leads to:
- **Rogue AI:** Uncontrolled rewrites of entire files.
- **Context Drift:** Severe memory loss between development sessions.
- **Token Waste:** High API costs due to lack of optimization.
- **Multi-Agent Chaos:** Conflicts and race conditions between different agents.
- **Loss of Corporate Control:** Unsupervised CRUD operations and schema changes.

### 🚀 Core Features
- **Strict Governance:** "Human-in-the-Loop" for critical operations and Trace ID tracking.
- **Advanced Memory System:** 3-tier architecture that prevents context drift.
- **Token Economy:** Up to 90% savings via "Surgical Edits" instead of full rewrites.
- **Hermes Message Broker:** Asynchronous communication preventing agent conflicts.
- **Private & Secure AI:** Support for **Local LLMs** (Ollama, vLLM) ensuring 100% data privacy.

---

## 🪖 The 13-Agent Specialized Army / 13 Uzman Ajanlık Ordu

| Agent | Tier | Role & Responsibility / Rol ve Sorumluluk |
| :--- | :--- | :--- |
| **@manager** | Supreme | **Orchestration & Governance:** Task delegation, memory pruning, compliance. |
| **@architect**| Core | **System Design:** Core architecture, type contracts, governance locks. |
| **@analyst** | Core | **Contract Audit:** Verifies requirements map to code; contract-first compliance. |
| **@security** | Core | **Safety Guardian:** Manages auth, encryption, RLS, and secret protection. |
| **@backend**  | Core | **Domain Logic:** API design, branded types, and layered architecture. |
| **@database** | Core | **DB Management:** Schema migrations, query optimization, type-safe access. |
| **@frontend** | Core | **UI Specialist:** Atomic, responsive-first interfaces, Zero-UI dependency. |
| **@mobile**   | Core | **Mobile Engineer:** React Native/Expo specialist, offline-first focus. |
| **@native**   | Core | **Native Division:** OS-level integrations, desktop (Tauri/Electron) layers. |
| **@quality**  | Recon | **QA & Testing:** Enforces 80% coverage and zero-mock testing policies. |
| **@explorer** | Recon | **Intel Explorer:** Codebase discovery, dependency mapping, recon reports. |
| **@git**      | Recon | **Logistics Master:** Version control hygiene, Trace-ID commit enforcement. |
| **@devops**   | Recon | **Infrastructure:** CI/CD pipelines, containers, immutable deployments. |

---

## 🧪 Core Agent Skills / Temel Ajan Yetenekleri

1.  **📂 File System Mastery:** Token-verimli dosya okuma ve yazma.
2.  **✂️ Surgical Modification:** `replace_text` ile milimetrik kod düzenleme.
3.  **📨 Hermes Messaging:** Trace-ID takipli ajanlar arası iletişim.
4.  **🏛️ Governance & Locking:** OS seviyesinde kaynak kilitleme (Race condition koruması).
5.  **🧪 QA & Discipline:** AST tabanlı kod uyumluluk denetimi ve test kapıları.
6.  **🗄️ Database Excellence:** Tip-güvenli sorgular (Kysely) ve repository desenleri.
7.  **🚀 DevOps Automation:** Güvenli sır (secret) yönetimi ve otonom yayın hatları.

---

## ⚙️ Structural Modes / Yapısal Modlar

- **Unified Mode (`--unified`):** Tüm AI yapılandırmalarını tek bir `.enderun/` klasöründe toplar. Temiz çalışma alanları için kurumsal standarttır.
- **Native Mode:** Her AI asistanı için ayrı klasörler (örn: `.claude`, `.gemini`) kullanır.

---

## 💰 Open Core & Pricing Model / Fiyatlandırma Modeli

Agent Enderun **Open Core** modelini takip eder. Çekirdek çerçeve açık kaynaklıdır (MIT). Kurumsal uyumluluk ve sınırsız ölçeklendirme için **Enterprise Edition** sunulmaktadır.

| Feature / Özellik | Community (Free) | Pro ($49/user/month) | Enterprise (Custom) |
| :--- | :--- | :--- | :--- |
| **Agent Army** | 13 Standard Agents | 13 Standard + Custom Agents | Unlimited Custom Agents |
| **Memory System** | Standard 3-Tier Memory | Extended Context & History | Infinite Archival & Vector DB |
| **Governance** | Basic Rules | Advanced Team Policies | EU AI Act & Full Audit |
| **Security & RBAC** | Basic Access | Role-Based Workflows | Advanced RLS & SSO |
| **Support** | Community / GitHub | Standard Email Support | 24/7 SLA & Success Manager |

*Enterprise: [enterprise@agent-enderun.com](mailto:enterprise@agent-enderun.com)*

---

## 🛠️ Quick Start / Hızlı Başlangıç

```bash
# Gemini için (Strategic Decision Center)
npx agent-enderun init gemini --unified --yes

# Claude için (Operational Surgery)
npx agent-enderun init claude --unified --yes

# Grok için (Autonomous Reconnaissance)
npx agent-enderun init grok

# Yerel LLM için (Private AI - Ollama/vLLM)
npx agent-enderun init local
```

---

Developed by **Yusuf BEKAR** | Framework Version **v1.11.5** | [Enterprise Inquiries](mailto:enterprise@agent-enderun.com)
