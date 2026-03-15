<p align="center">
  <img src="public/ncc-logo.png" alt="NCC Logo" width="120" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/rgu-logo.png" alt="RGU Logo" width="120" />
</p>

# NCC RGU Cadet Management System

<p align="center">
  <img src="https://img.shields.io/badge/Vercel-Deployed-success?style=for-the-badge&logo=vercel" alt="Vercel Deployed" />
  <img src="https://img.shields.io/badge/Next.js%2016-Black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-Database-3FC68D?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
</p>

A role-based Cadet Management System built with Next.js 16 and Supabase. Features real-time dashboards, QR verification, and administrative tools tailored for the National Cadet Corps.

## Tech Stack Overview
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Actions for DB mutations)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode enabled)
- **Database Backend**: [PostgreSQL](https://www.postgresql.org/) (Managed via Supabase)
- **Authentication**: Username + PIN authentication (mapped to Supabase Auth email/password)
- **Validation**: [Zod](https://zod.dev/) shared schemas for client + server
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/) with custom Glassmorphism/Dark Mode support
- **UI & Animations**: [Framer Motion](https://www.framer.com/motion/) for transitions, Shadcn UI base components
- **PWA & Offline**: Service Worker with cache-first strategy; IndexedDB-backed offline queueing for zero-connectivity areas.
- **Performance**: High-speed list virtualization via `@tanstack/react-virtual` for large datasets.
- **CI/CD**: GitHub Actions for automated linting and build verification.

## Application Walkthrough & Features

### 1. Secure Login & Authentication
> Username + PIN authentication mapped to Supabase Auth under the hood with strict role-based access control.
![Login Screen](public/screenshots/login.png)

### 2. Comprehensive Dashboard
> Real-time statistics aggregation and asynchronous activity logging.
![Dashboard Overview](public/screenshots/dashboard.png)

### 3. Attendance Management
> Batch status updates and relational database joins connecting cadets to training classes.
![Attendance Tracking](public/screenshots/attendance.png)

### 4. Cadet Registry
> Full text search, client-side filtering, and automated profile state hydration.
![Cadet Registry](public/screenshots/registry.png)

### 5. Personal Profiles
> Detailed views of cadet progression, ranks, and uploaded certificates.
![Cadet Profile](public/screenshots/profile.png)

### 6. Digital Identity (QR)
> High-resolution image snapshots with drop-shadows and rounded borders. Features a robust printing engine that bypasses mobile browser layout issues.
![Digital ID Card](public/screenshots/id-card.png)

### 7. Secure Communications
> Hierarchical note passing with read-receipt real-time listeners between Cadets and Officers.
![Messaging Interface](public/screenshots/messages.png)

### 8. Offline Attendance Synchronization
> Built with an asynchronous IndexedDB queueing engine. Allows marking attendance in zero-connectivity environments (e.g., parade grounds). Data is automatically synced to the server with optimistic UI updates once a connection is restored.

### 9. Alumni Lifecycle Management
> Systematic transition pipeline for graduating cadets. Archives service history and performance scores to a specialized alumni vault without data loss, ensuring clean active rosters.

## Core Modules Overview

| Module | Description | Target User |
| :--- | :--- | :--- |
| **Dashboard** | Real-time stats aggregation and unit telemetry analytics. | ANO, SUO |
| **Registry** | Virtualized high-performance lists with multi-state (Active/Alumni) filtering. | ANO, SUO, UO |
| **Digital ID** | High-resolution snapshot engine with mobile-safe print/download pipeline. | All Ranks |
| **Attendance** | Offline-first queueing with incremental resync alerts. | SUO, UO |
| **Private Notes** | Hierarchical note passing with read-receipts and ANO escalation. | All Ranks |
| **Alumni Records**| Archiving of service history post-graduation. | ANO, SUO |

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
```

## Documentation & Governance

To ensure consistency and high-quality contributions across all units, please review the following technical and community documents:

- **[Architecture Overview](ARCHITECTURE.md)**: Detailed diagrams covering authentication flows, the PWA QR pipeline, and Permission Trees.
- **[Contributing Guidelines](CONTRIBUTING.md)**: Standards for bug reporting, PR workflow, and code styling.
- **[Code of Conduct](CODE_OF_CONDUCT.md)**: Our expectations for community behavior and enforcement details.
- **[Project Wiki](https://github.com/CaptainCheetah978/RGU-NCC-Web-Application/wiki)**: Comprehensive deployment guides, white-labeling instructions, and troubleshooting.
- **[Security Policy](SECURITY.md)**: Guidelines for reporting vulnerabilities.

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
- **Unit Tests**: Jest/Vitest + React Testing Library for Server Actions and components.
- **Analytics Dashboard**: Attendance trends, cadet performance scoring.
- **Export Features**: Integrated `jspdf` and `jspdf-autotable` for attendance reports and cadet summaries.

## License & Primary Contact
Released under the [MIT License](LICENSE).

**Technical Lead:** [SUO Aditya Singh](https://github.com/CaptainCheetah978) 
**Unit:** 30 Assam Bn NCC, Guwahati Group, NER Directorate
