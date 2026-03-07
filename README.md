# 🎯 SSC Exam Hub Admin Panel

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

A comprehensive, production-ready administrative dashboard for the **SSC Exam Hub** ecosystem. This panel empowers administrators to manage users, educational content, dynamic tests, and real-time analytics with ease.

---

## 🚀 Key Features

### 📊 Advanced Analytics & Dashboard
*   **Real-time Stats:** Track total users, active users (7d), total tests, and question counts.
*   **Growth Visualization:** Interactive charts showing user acquisition and platform engagement.
*   **Recent Activity:** Live feed of administrative actions and platform updates.

### 📰 Automated News Engine
*   **RSS Integration:** Automatically fetches education-related news from Google News RSS.
*   **Smart Cleanup:** Native Supabase `pg_cron` system that automatically purges news older than 24 hours.
*   **Global Access:** Centralized repository for current affairs relevant to SSC aspirants.

### 📝 Exam & Content Management
*   **Dynamic Test Builder:** Create and edit complex tests with passing mark configurations.
*   **Bulk Question Upload:** Import questions via **CSV** or **XLSX** files with automated parsing.
*   **Study Materials:** Manage PDF resources with page counting, slug generation, and subject categorization.
*   **Study Templates:** Standardized templates for recurring study material structures.

### 👥 User & Security Management
*   **Profile Control:** Detailed user management including activity tracking and status updates.
*   **Audit Logs:** Comprehensive history of all administrative logins and database changes.
*   **Push Notifications:** Integrated FCM (Firebase Cloud Messaging) for real-time user engagement.

### 🎨 UI/UX Features
*   **Command Menu:** Quick navigation via `Ctrl + K` interface.
*   **Modern Aesthetics:** Built with Radix UI and Tailwind CSS for a responsive, accessible experience.
*   **Dark Mode Ready:** System-wide theme support.

---

## 🛠 Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Storage** | Supabase Storage (PDFs & Images) |
| **Styling** | Tailwind CSS + Lucide Icons |
| **Components** | Radix UI / Shadcn UI |
| **State Management** | TanStack Query (React Query) |
| **Forms** | React Hook Form + Zod |

---

## ⚙️ Installation & Setup

### 1. Prerequisites
*   Node.js (>= 18.0.0)
*   Supabase Account

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup
1. Enable the `pg_cron` extension in your Supabase dashboard.
2. Run the migrations located in the `/migrations` folder in order.
3. Specifically, ensure `20260307_news_auto_cleanup.sql` is applied to activate the automated cleanup system.

### 5. Start Development
```bash
npm run dev
```

---

## 🤖 Automated Workflows

### News Fetching
The news fetcher runs as a script that can be triggered via GitHub Actions or locally:
```bash
npx ts-node scripts/fetch-news.ts
```

### Auto-Cleanup (Supabase Native)
The system uses a database-level cron job (`delete-old-news`) that executes every hour:
- **Interval:** `0 * * * *`
- **Logic:** Deletes rows where `created_at < NOW() - INTERVAL '24 hours'`.

---

## 📂 Project Structure

```text
├── app/               # Next.js App Router (Dashboard, Login, API)
├── components/        # Reusable UI components (Banners, Tables, Forms)
├── lib/               # Shared utilities (Supabase clients, Logging, Utils)
├── migrations/        # SQL migration files for database schema
├── public/            # Static assets
└── scripts/           # Automation scripts (News fetching, data processing)
```

---

## 📜 Maintenance
For detailed information on the automated news system, refer to [NEWS_CLEANUP_SYSTEM.md](./NEWS_CLEANUP_SYSTEM.md).

---

Developed with ❤️ for SSC Aspirants.
