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
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue?style=for-the-badge&logo=apache" alt="Apache 2.0" />
</p>

> [!NOTE]
> **OPEN SOURCE LICENSE**: This project is licensed under the [Apache License 2.0](./LICENSE). You are free to use, modify, and distribute the source code. All original authorship and attribution to the **Aditya Singh** must be preserved in all copies and derivative works.

A role-based Cadet Management System built with Next.js 16 and Supabase. Features real-time dashboards, QR verification, and administrative tools tailored for the National Cadet Corps.

## Tech Stack
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions)
- **Database**: [PostgreSQL](https://www.postgresql.org/) via [Supabase](https://supabase.com/)
- **Auth**: Username + PIN login mapped to [Supabase Auth](https://supabase.com/auth)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Offline Mode**: [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) queueing via a [Service Worker](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Use Cases & Features

1.  **Role-Based Security**: Different views for **ANO**, **SUO/SCC**, **UO/CC/CUO**, and **Cadets**. Security is enforced at the database level using Supabase Row Level Security (RLS).
2.  **Attendance Logging**: Select class records, mark attendance, and it syncs to the database. Works offline too (it queues changes locally and pushes them when connected).
3.  **Digital ID Cards (Anti-Replay Security)**: Cadets get a digital ID card page that can be printed or scanned. The digital version features a **Visual Security Stack** (Ticking Clock, Holographic Shimmer, Color of the Day) and uses **Dynamic QR Codes**. The QR code generates a cryptographically signed JWT with a 30-second expiration to prevent screenshot replay attacks.
4.  **Alumni Records**: When cadets graduate, we move them to an alumni state to preserve their historical attendance and records.

## Core Modules Overview

| Module | What it does | Access Level |
| :--- | :--- | :--- |
| **Dashboard** | General stats and recent activity logs. | ANO / SUO/SCC |
| **Registry** | Full list of active and alumni cadets. | ANO / SUO/SCC / UO/CC/CUO |
| **Digital ID** | ID card generator with a functional QR code for scanning. | All Ranks |
| **Attendance** | Roll sheet for marking present/absent. Supports offline mode. | SUO/SCC / UO/CC/CUO |
| **Private Notes** | Messaging system between ranks. | All Ranks |

## Role-Based Access Control (RLS)
Security is rigidly enforced at the PostgreSQL database level using Supabase Row Level Security (RLS). UI conditional rendering provides a fallback, but DB policies dictate true access.

| Role | Responsibility | System Privileges / Official Wing Equivalents |
| :--- | :--- | :--- |
| **ANO / CTO** | Commissioned / Caretaker Officers | SuperAdmin / Full Database Access |
| **CSUO / SCC** | Senior Under Officer / Senior Cadet Captain | Admin / Registries / Announcements |
| **CJUO / CUO / CC / CWO**| Junior Rank Officers / All Wings | Moderator / Classes / Training Notes |
| **CSM / CQMS / SGT / PO**| Senior NCOs / Junior NCOs | Field Moderator / Attendance / Registry |
| **Cadet / CPL / AB**| Standard Unit Members | Standard User / Personal Data / Notes |

## System Maintainer Guide

For developers and maintainers interacting with the core codebase, the following files contain the primary logic for security, authentication, and data synchronization:

### Technical Navigation Map

| System Component | Primary Source File | Functional Responsibility |
| :--- | :--- | :--- |
| **Authentication Flow** | `src/lib/auth-context.tsx` | Manages login, registration, and profile state hydration. |
| **Cadet & Profile Logic** | `src/lib/cadet-context.tsx` | Manages the cadet registry, enrollments, and profile data. |
| **Training & Attendance** | `src/lib/training-context.tsx` | Handles class scheduling and offline attendance sync logic. |
| **Unit Communication** | `src/lib/communication-context.tsx` | Manages private notes, announcements, and certificates. |
| **Action Authorization** | `src/lib/server-auth.ts` | Validates user sessions and roles within Server Actions. |
| **Administrative Access** | `src/lib/supabase-admin.ts` | Privileged client for operations requiring RLS bypass (ANO/SUO only). |
| **Offline Synchronization** | `src/lib/offline-sync.ts` | Implements the IndexedDB queue and synchronization logic. |
| **Data Constraints** | `supabase/migrations/` | Defines the database schema, foreign keys, and unit-scoped RLS. |

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
│   ├── components/         # Shared React Components & Dynamic Modules
│   │   ├── ui/             # Atomic design elements (buttons, inputs, modals)
│   │   ├── providers.tsx   # Composition of domain-specific React Query providers
│   │   ├── pwa-registration.tsx # Service Worker registration
│   │   ├── sidebar.tsx     # Role-aware navigation controller
│   │   └── topbar.tsx      # State-aware user header showing Unit context
│   ├── lib/                # Core Business Logic (Domain-Split Architecture)
│   │   ├── auth-context.tsx  # Multi-wing Auth & PIN session state
│   │   ├── training-context.tsx  # Domain: Class scheduling & Attendance logic
│   │   ├── cadet-context.tsx     # Domain: Registry, Enrollments, & Profile data
│   │   ├── communication-context.tsx # Domain: Notes, Announcements, & Certs
│   │   ├── activity-context.tsx  # Domain: Secure system-wide audit logging
│   │   ├── offline-sync.ts   # IndexedDB offline attendance queueing
│   │   ├── schemas.ts        # Shared Zod schemas (client + server)
│   │   ├── server-auth.ts    # Server-side role guard (getCallerSession)
│   │   ├── supabase-client.ts# Browser-side Supabase client
│   │   ├── supabase-admin.ts # Service-role client (bypasses RLS — server only)
│   │   └── utils.ts          # Utility functions (cn, branch-specific logic)
│   └── types/              # Global TypeScript interfaces and Enums
├── supabase/
│   └── migrations/         # Verifiable SQL migrations (RLS, schema, tenancy)
├── package.json            # Dependencies and scripts (Tailwind 4 / Next.js 16)
├── vitest.config.ts        # Vitest configuration for unit/integration tests
└── postcss.config.mjs      # PostCSS config for Tailwind v4 engine
```

## Getting Started

### Path A: Local Development (Cloning)
Use this if you want to run the application locally for testing or development.

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
  1. `add_missing_columns.sql` — Ensures core profile schema.
  2. `supabase-policies.sql` — Sets up base Row Level Security.
  3. `001_data_integrity.sql` — Foreign keys, cascade deletes, and attendance locks.
  4. `002_alumni_status.sql` — Lifecycle management enums.
  5. `003_delete_demo_cadets.sql` [Optional] — Surgically removes demo placeholder data.
  6. `004_multi_tenancy.sql` — Injects unit-scoped multi-tenancy and RLS isolation.
  7. `005_fix_unit_recursion_and_schema.sql` — Resolves recursion loops in Unit profile fetches.
  8. `fix_rls_performance.sql` — Optimized policy lookups (includes support for CWO, CSM, CQMS, and SCC).
  9. `pending_migrations.sql` — Notes, logs, and bucket-specific storage policies.

- Navigate to **Storage** and create a bucket named `files` (set to Private), then apply the storage policy instructions from `pending_migrations.sql`.

> [!NOTE]
> `clean-slate-policies.sql` is a legacy file and is effectively superseded by `fix_rls_performance.sql`. No need to run both.

**4. Run Development Server**
```bash
npm run dev
# App is ready at http://localhost:3000
```

**5. Run Automated Tests**
```bash
npm test          # Run all tests once
npm run test:watch # Run tests in interactive watch mode
```

---

### Path B: Multi-Unit Deployment by Forking
Use this if you are deploying the application for a new NCC unit or battalion.

1. **Fork** the repository on GitHub to your own account.
2. **Branding**: Replace `public/ncc-logo.png` and `public/rgu-logo.png` with your respective unit logos.
3. **Configuration**: Update the `NEXT_PUBLIC_UNIT_NAME` and `NEXT_PUBLIC_INSTITUTION_NAME` in your deployment environment (e.g., Vercel) or `.env.local`.
4. **Database**: Initialize your own Supabase project following the **Initialize Database** steps above.

## Documentation & Project State

This repo tracks its own issues and design choices:
- **[Architecture Overview](ARCHITECTURE.md)**: Basic overview of how everything connects.
- **[Known Issues](KNOWN_ISSUES.md)**: A list of current bugs, technical debt, and missing features.
- **[Security Policy](SECURITY.md)**: Basic guidelines for vulnerabilities.

## Upcoming Roadmap
If you are planning to contribute, we are looking at:
- **Unit Manager Dashboard**: Improved administrative tools for cross-unit management.
- **Automated Certificate Reports**: Eligibility checking and PDF generation for 'B' and 'C' certificates.
- **Enhanced Visual Verification**: In-app scanner for ANOs to verify ID authenticity against live DB records.
- **Offline Reliability**: Further hardening of the synchronization engine for 2G/3G parade ground conditions.
- **Directorate-Level Scaling**: Advanced multi-tenant provisioning for large-scale directorate deployments.

## License & Primary Contact
Released under the [MIT License](LICENSE).

**Technical Lead:** [SUO Aditya Singh](https://github.com/CaptainCheetah978) 
**Unit:** 30 Assam Bn NCC, Guwahati Group, NER Directorate
