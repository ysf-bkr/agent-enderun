# 🛠️ Hermes Control Center — Tech Stack Specification

Bu doküman, Agent Enderun çerçevesi altında geliştirilecek olan **Hermes Control Center (Enderun Yönetişim Paneli)** uygulamasının kurumsal teknoloji yığınını tanımlar.

---

## 🏛️ Kurumsal Mimari Standartları

| Parametre | Seçim / Standart | Açıklama |
| :--- | :--- | :--- |
| **Hedef Kitle** | Enterprise AI Yöneticileri ve Denetçiler | Kurumsal yapay zeka operasyonlarını izleyen ve onaylayan yetkililer. |
| **Platform** | Web (Monorepo) | `apps/web` (Frontend) ve `apps/backend` (Backend) katmanları. |
| **Geliştirme Ortamı** | Node.js v20+ & TypeScript v5+ | ESM (ES Modules) standartlarında, tip güvenliği %100 doğrulanmış mimari. |
| **Veritabanı** | PostgreSQL / SQLite | SQLite (Yerel geliştirme ve test için), PostgreSQL (Üretim/Enterprise için) — `Kysely` query builder ile. |
| **Kimlik Doğrulama** | JWT Tabanlı Kurumsal Auth | Rol tabanlı yetkilendirme (RBAC) ve `@security` ajanı tarafından denetlenen RLS politikaları. |
| **Frontend Altyapısı** | React 19 + Vite | Minimal, performanslı ve derleme süreleri optimize edilmiş modern web altyapısı. |
| **Tasarım Sistemi** | Vanilla CSS + Panda CSS | Tailwind CSS yerine performans ve özelleştirilebilirlik için Panda CSS ve fluid responsive tasarım. |
| **Test Altyapısı** | Vitest & Playwright | Birim ve entegrasyon testleri için Vitest, uçtan uca (E2E) testler için Playwright. |
| **Gözlemlenebilirlik** | Pino Logger & OpenTelemetry | Yapay zeka ajanlarının tüm eylemlerini izlenebilir kılan audit günlükleri ve telemetri veri akışları. |
| **API Sürümleme** | URL Path Sürümleme (`/api/v1`) | `apps/backend/contract.version.json` üzerinden SHA-256 kontrat doğrulaması. |
| **Erişilebilirlik** | WCAG 2.1 AA | Standart erişilebilirlik gereksinimlerine tam uyumluluk. |

---

## 🔒 Güvenlik ve Disiplin Kuralları (MANDATORY)
1.  **Zero Type Hole:** Kod tabanında `any` kullanımı kesinlikle yasaktır. Tüm veri tipleri branded tipler veya kesin arayüzler (Interfaces) ile tanımlanacaktır.
2.  **Zero Mock Policy:** Entegrasyon ve API çağrılarında sahte (mock) veri kullanılamaz; tüm API'ler gerçek tip kontratlarına bağlı çalışacaktır.
3.  **Zero Console:** Üretim kodunda `console.log` yer alamaz; tüm izleme `Pino` veya kurumsal log kütüphanesi üzerinden yürütülür.
4.  **Audit Trail:** Sistemde yapılan her onay (`agent-enderun approve`) ve kural ihlali audit veritabanına ULID ile damgalanarak kaydedilir.
