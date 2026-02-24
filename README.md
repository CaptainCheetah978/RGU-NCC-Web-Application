<p align="center">
  <img src="public/ncc-logo.png" alt="NCC Logo" width="100" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/rgu-logo.png" alt="RGU Logo" width="100" />
</p>

<h1 align="center">NCC RGU — Cadet Management System</h1>

<p align="center">
  A comprehensive, role-based web application for the <strong>National Cadet Corps (NCC)</strong> unit at <strong>Royal Global University (RGU)</strong>.<br/>
  Built on a <strong>Supabase</strong> backend for real-time data, secure authentication, and private cloud storage.
</p>

<p align="center">
  <a href="#features">Features</a>
  &nbsp;·&nbsp;
  <a href="#role-based-access">Roles</a>
  &nbsp;·&nbsp;
  <a href="#tech-stack">Tech Stack</a>
  &nbsp;·&nbsp;
  <a href="#getting-started">Getting Started</a>
  &nbsp;·&nbsp;
  <a href="#deployment">Deployment</a>
</p>

---

## Features

| Module | Description |
|--------|-------------|
| **Dashboard** | Real-time statistics covering total cadets, attendance percentage, and active classes. Includes a live recent activity feed, upcoming class list, and announcement banner. |
| **Role-Based Auth** | PIN-based login with strict role separation enforced via Supabase Row Level Security policies and Next.js Server Actions. No client-side trust. |
| **Attendance** | Mark attendance per session (Present, Absent, Late, Excused). Visual attendance chart with per-cadet breakdowns and monthly history. |
| **Class Management** | Schedule and manage training sessions. Assign instructors, set venues, and track completion status. Officers and senior cadets can create classes. |
| **Cadet Registry** | Centralised database of all cadets. Supports search by name or regimental number, rank filtering, and both grid and list view modes. Wing-based auto-unit assignment on enrolment. |
| **Certificates** | Digital certificate locker per cadet. Upload, view, and download NCC A, B, and C certificates as well as other training documents. ANO has full administrative control. |
| **Private Notes** | Secure internal messaging between cadets and officers. Unread count badge on the sidebar. Messages are private and not visible across roles. |
| **Announcements** | Broadcast unit-wide announcements with urgency flagging. Officers can create, edit, and delete announcements. All roles can view. |
| **Activity Log** | Full audit trail of officer actions including enrolments, deletions, attendance marks, and profile updates. Visible to ANO only. |
| **My Profile** | Each cadet has a profile page showing personal details, ID card, blood group, enrolment year, and PIN management. |
| **Digital ID Card** | Auto-generated NCC identity card with cadet photo, rank, regimental number, unit, and a scannable QR code. Printable directly from the browser. |
| **Files and Media** | Shared file repository for the unit. Upload and download training materials, forms, and media. Accessible to all roles. |
| **Dark Mode** | Full dark mode across every page and component, toggled from the sidebar. Glassmorphism effects on key UI surfaces. |

---

## Role-Based Access

The application enforces strict data isolation through **Supabase Row Level Security (RLS)**. Every database query is scoped to the authenticated user's role.

| Role | Access Level | Key Permissions |
|------|-------------|-----------------|
| **ANO** | Super Admin | Full access to all modules. Can enrol and delete cadets, reset PINs, manage all attendance records, view the activity log, and oversee certificates for every cadet. |
| **SUO** | Unit Admin | Can create and manage classes, mark attendance, post announcements, and view cadet profiles. Cannot delete cadets or access the activity log. |
| **UO / SGT / CPL** | Junior Officer | Can mark attendance for their sessions and view the cadet registry. No destructive permissions. |
| **LCPL / Cadet** | Standard User | Personal dashboard, own profile and ID card, attendance history, certificate locker, private notes, files, and announcements. Cannot access administrative modules. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS with custom dark mode variants |
| Backend | Supabase (PostgreSQL, Row Level Security, Storage) |
| Authentication | Custom PIN-based auth backed by Supabase Auth |
| Animations | Framer Motion |
| Icons | Lucide React |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- A Supabase project (free tier is sufficient)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/CaptainCheetah978/RGU-NCC-Web-Application.git
   cd RGU-NCC-Web-Application
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**

   Create a `.env.local` file in the root of the project:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

   > **Important:** `SUPABASE_SERVICE_ROLE_KEY` is a secret key used only in Server Actions for privileged operations such as creating cadet accounts and updating PINs. Never expose this key to the client or commit it to version control.

4. **Database setup**

   Apply the Row Level Security policies to your Supabase project by running the SQL in `supabase-policies.sql` via the Supabase SQL Editor. This step is required for the access control system to function correctly.

5. **Storage setup**

   Create a private storage bucket named `cadet-files` in your Supabase project. The application uses signed URLs to serve files securely without exposing bucket contents publicly.

6. **Run the development server**
   ```bash
   npm run dev
   ```
   The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Deployment

### Vercel (Recommended)

1. Push the repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Add the following environment variables in the Vercel project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy. Vercel will automatically build and deploy on every push to `main`.

---

## Project Structure

```
src/
  app/
    dashboard/
      attendance/       Attendance tracking page
      cadets/           Cadet registry with enrol, edit, view, and delete
      classes/          Class scheduling and management
      announcements/    Unit-wide announcements
      notes/            Private internal messaging
      activity/         Activity audit log (ANO only)
      files/            Shared file repository
      profile/          Cadet profile and digital ID card
  components/
    dashboard/          Dashboard-specific widgets (stats, charts, banners)
    profile/            Certificate section component
    sidebar.tsx         Navigation sidebar with role-filtered links
    topbar.tsx          Top navigation bar with user info
    ui/                 Shared UI primitives (Button, Card, Input, Modal)
  lib/
    auth-context.tsx    Authentication state and login logic
    data-context.tsx    Global data fetching and caching
    theme-context.tsx   Dark/light mode toggle
    supabase.ts         Supabase client initialisation
  app/actions/          Server Actions for privileged database operations
  types/                Shared TypeScript types (Cadet, Role, Wing, etc.)
```

---

<p align="center">
  Built for the <strong>National Cadet Corps, Royal Global University</strong>
</p>
