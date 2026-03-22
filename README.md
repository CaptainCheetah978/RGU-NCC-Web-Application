<p align="center">
  <img src="public/ncc-logo.png" alt="NCC Logo" width="120" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/rgu-logo.png" alt="RGU Logo" width="120" />
</p>

# NCC RGU Cadet Management System

<p align="center">
  <img src="https://github.com/CaptainCheetah978/RGU-NCC-Web-Application/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  <img src="https://img.shields.io/badge/Vitest-Tested-729B1B?style=for-the-badge&logo=vitest" alt="Vitest" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-success?style=for-the-badge&logo=vercel" alt="Vercel Deployed" />
  <img src="https://img.shields.io/badge/Next.js%2016-Black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-Database-3FC68D?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
</p>

A role-based Cadet Management System built with Next.js 16 and Supabase. Features real-time dashboards, QR verification, and administrative tools tailored for the National Cadet Corps.

## Tech Stack
- **Framework**: Next.js 16 (App Router, Server Actions)
- **Database**: PostgreSQL via Supabase
- **Auth**: Username + PIN login mapped to Supabase Auth
- **Styling**: Tailwind CSS
- **Offline Mode**: IndexedDB queueing via a Service Worker for parade ground usage without mobile data.
- **Testing**: Vitest + React Testing Library

### Use Cases & Features

1.  **Role-Based Security**: Different views for ANO, SUO, UO/SGT, and Cadets. Security is enforced at the database level using Supabase Row Level Security (RLS).
2.  **Attendance Logging**: Select class records, mark attendance, and it syncs to the database. Works offline too (it queues changes locally and pushes them when connected).
3.  **Digital ID Cards**: Cadets get a digital ID card page that can be printed or scanned. 
4.  **Alumni Records**: When cadets graduate, we move them to an alumni state to preserve their historical attendance and records.

## Core Modules Overview

| Module | What it does | Access Level |
| :--- | :--- | :--- |
| **Dashboard** | General stats and recent activity logs. | ANO, SUO |
| **Registry** | Full list of active and alumni cadets. | ANO, SUO, UO |
| **Digital ID** | ID card generator with a functional QR code for scanning. | All Ranks |
| **Attendance** | Roll sheet for marking present/absent. Supports offline mode. | SUO, UO |
| **Private Notes** | Messaging system between ranks. | All Ranks |

## Role-Based Access Control (RLS)
Security is rigidly enforced at the PostgreSQL database level using Supabase Row Level Security (RLS). UI conditional rendering provides a fallback, but DB policies dictate true access.

| Role | Responsibility | System Privileges |
| :--- | :--- | :--- |
| **ANO** | Associate NCC Officer | SuperAdmin (Full DB bypass capabilities) |
| **SUO** | Senior Under Officer | Admin (Read/Write class, attendance, registry schemas) |
| **UO/SGT**| Junior Officers | Moderator (Write attendance, Read registry) |
| **Cadet** | Standard User | User (Read/Write personal `profiles`, read scoped `notes`) |

## System Maintainer Guide

For developers and maintainers interacting with the core codebase, the following files contain the primary logic for security, authentication, and data synchronization:

### Technical Navigation Map

| System Component | Primary Source File | Functional Responsibility |
| :--- | :--- | :--- |
| **Authentication Flow** | `src/lib/auth-context.tsx` | Manages login, registration, and profile state hydration. |
| **Action Authorization**| `src/lib/server-auth.ts` | Validates user sessions and roles within Server Actions. |
| **Database Access** | `src/lib/supabase-client.ts` | Standard client used for data fetching with Row Level Security. |
| **Administrative Access**| `src/lib/supabase-admin.ts`| Privileged client for operations requiring RLS bypass (ANO/SUO only). |
| **Offline Performance** | `src/lib/offline-sync.ts` | Implements the IndexedDB queue and synchronization logic. |
| **Service Worker** | `public/sw.js` | Manages asset caching and offline page availability. |
| **Data Constraints** | `supabase/migrations/` | Defines the database schema, foreign keys, and RLS policies. |

For detailed documentation regarding data flow and security models, refer to [ARCHITECTURE.md](./ARCHITECTURE.md).

## File Architecture

A mental model of the source code for new contributors:

```text
├── public/                 # Static assets (logos, PWA manifest, service worker)
├── tests/                  # Automated Vitest suites (Context logic, Schemas, Offline sync)
├── src/
│   ├── app/                # Next.js App Router root
│   │   ├── actions/        # Server Actions (Zod validated, role-guarded DB mutations)
│   │   ├── dashboard/      # Protected app routes (auth-guarded layout)
│   │   ├── verify/         # Public routes (QR identity verification)
│   │   └── page.tsx        # Auth gateway / Login component
│   ├── components/         # Shared React Components
│   │   ├── ui/             # Atomic design elements (buttons, inputs, modals)
│   │   ├── providers.tsx   # Global Context Providers composition
│   │   ├── pwa-registration.tsx # Service Worker registration
│   │   ├── sidebar.tsx     # Role-aware navigation controller
│   │   └── topbar.tsx      # State-aware user header
│   ├── lib/                # Core Business Logic & Configurations
│   │   ├── auth-context.tsx  # Auth state, login/logout, session management
│   │   ├── data-context.tsx  # Global data fetching, realtime subscriptions
│   │   ├── toast-context.tsx # Centralized toast notification system
│   │   ├── theme-context.tsx # Dark/light mode toggle state
│   │   ├── offline-sync.ts   # IndexedDB offline attendance queueing
│   │   ├── schemas.ts        # Shared Zod schemas (client + server)
│   │   ├── get-access-token.ts# Client-side helper for JWT extraction
│   │   ├── server-auth.ts    # Server-side role guard (getCallerSession)
│   │   ├── supabase-client.ts# Browser-side Supabase client
│   │   ├── supabase-admin.ts # Service-role client (bypasses RLS — server only)
│   │   └── utils.ts          # Utility functions (cn, etc.)
│   └── types/              # Global TypeScript interfaces and Enums
├── supabase/
│   └── migrations/         # SQL migrations (schema, RLS policies, constraints)
├── package.json            # Dependencies and scripts (Tailwind 4)
├── vitest.config.ts        # Vitest configuration for unit/integration tests
└── postcss.config.mjs      # PostCSS config (Tailwind 4 plugin)
```

## Quick Start (Local Development)

This guide assumes you have Node.js (v20+) and Git installed.

**1. Clone & Install Dependencies**
```bash
git clone https://github.com/CaptainCheetah978/RGU-NCC-Web-Application.git
cd RGU-NCC-Web-Application
npm install
```

**2. Configure Environment**
Create a `.env.local` file in the project root. You will need a Supabase project.
```env
# Required Supabase Keys (from your Supabase Project Settings)
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-api-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" # Never expose this to the client!

# Branding Variables (Allows you to white-label the app)
NEXT_PUBLIC_UNIT_NAME="NCC RGU"
NEXT_PUBLIC_INSTITUTION_NAME="Royal Global University"
```

**3. Initialize Database**
- Open your Supabase Dashboard and navigate to the **SQL Editor**.
- Execute the migration files in `supabase/migrations/` in the following recommended order:
  1. `add_missing_columns.sql` — Ensures core profile schema
  2. `supabase-policies.sql` — Sets up base Row Level Security
  3. `001_data_integrity.sql` — Foreign keys, cascade deletes, and attendance locks
  4. `002_alumni_status.sql` — Lifecycle management enums
  5. `pending_migrations.sql` — Notes, logs, and storage setup instructions
  6. `fix_rls_performance.sql` — Optimized policy lookups (Supersedes `clean-slate-policies.sql`)
- Navigate to **Storage** and create a bucket named `files` (set to Private), then apply the storage policy instructions from `pending_migrations.sql`.

> [!NOTE]
> `clean-slate-policies.sql` is a legacy file and is effectively superseded by `fix_rls_performance.sql`. No need to run both.

**4. Run Development Server**
```bash
npm run dev
# App is ready at http://localhost:3000

**5. Run Automated Tests**
```bash
npm test          # Run all tests once
npm run test:watch # Run tests in interactive watch mode
```
```

## Documentation & Project State

This repo tracks its own issues and design choices:
- **[Architecture Overview](ARCHITECTURE.md)**: Basic overview of how everything connects.
- **[Known Issues](KNOWN_ISSUES.md)**: A list of current bugs, technical debt, and missing features.
- **[Security Policy](SECURITY.md)**: Basic guidelines for vulnerabilities.

## Multi-Unit Deployment
This repository is built to be unit-agnostic ("white-labeled"). To fork this for a different battalion or institution:
1. **Fork** the repository on GitHub.
2. Update the `NEXT_PUBLIC_*` branding variables in your deployment environment (e.g., Vercel).
3. Replace `public/ncc-logo.png` and `public/rgu-logo.png` with your respective unit vectors.
4. Ensure your Supabase backend is configured.

## Upcoming Roadmap
If you are planning to contribute, we are looking at:
- **Multilingual Support**: Abstracting strings for i18n routing (Hindi/Regional languages).
- **Camp Management**: High-volume parallel data ingestion logic.
- **Analytics Dashboard**: Attendance trends, cadet performance scoring.
- **Export Features**: Integrated `jspdf` and `jspdf-autotable` for attendance reports and cadet summaries.

## License & Primary Contact
Released under the [MIT License](LICENSE).

**Technical Lead:** [SUO Aditya Singh](https://github.com/CaptainCheetah978) 
**Unit:** 30 Assam Bn NCC, Guwahati Group, NER Directorate
