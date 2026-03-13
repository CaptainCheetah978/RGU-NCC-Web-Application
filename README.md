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
> Real-time statistics aggregation and asynchronous activity logging across the unit.
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
> Robust queueing system that allows marking attendance in areas with no internet. Data is automatically synced to the server once connection is restored.

### 9. Alumni Lifecycle Management
> Systematic transition pipeline for graduating cadets, archiving their service history and performance scores without data loss.

## Core Modules Overview

| Module | Technical Features | Access Level |
| :--- | :--- | :--- |
| **Dashboard** | Real-time stats aggregation, async activity logging | ANO, SUO |
| **Registry** | Virtualized high-performance lists, multi-state (Active/Alumni) filtering | ANO, SUO, UO |
| **Digital ID** | Client-side QR generation, automated PDF extraction | All Ranks |
| **Attendance** | Offline-first queueing, relational DB joins, batch status updates | ANO, SUO, UO |
| **Vault** | Supabase Storage integration with expiring signed URLs for security | All Ranks |
| **Comms** | Hierarchical note passing, read-receipt real-time listeners | All Ranks |

## Role-Based Access Control (RLS)
Security is rigidly enforced at the PostgreSQL database level using Supabase Row Level Security (RLS). UI conditional rendering provides a fallback, but DB policies dictate true access.

| Role | Responsibility | System Privileges |
| :--- | :--- | :--- |
| **ANO** | Associate NCC Officer | SuperAdmin (Full DB bypass capabilities) |
| **SUO** | Senior Under Officer | Admin (Read/Write class, attendance, registry schemas) |
| **UO/SGT**| Junior Officers | Moderator (Write attendance, Read registry) |
| **Cadet** | Standard User | User (Read/Write personal `profiles`, read scoped `notes`) |

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

**3. Initialize Database**
- Open your Supabase Dashboard and navigate to the **SQL Editor**.
- Execute the migration files in `supabase/migrations/` in the following recommended order to ensure schema stability and RLS integrity:
  1. `add_missing_columns.sql` — Ensures core profile schema
  2. `supabase-policies.sql` — Sets up base Row Level Security
  3. `001_data_integrity.sql` — Foreign keys, cascade deletes, and attendance locks
  4. `002_alumni_status.sql` — Lifecycle management enums
  5. `pending_migrations.sql` — Notes, logs, and storage setup instructions
  6. `fix_rls_performance.sql` — Optimized policy lookups for large datasets
- Navigate to **Storage** and create a bucket named `files` (set to Private), then apply the policy instructions found in `pending_migrations.sql`.

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
