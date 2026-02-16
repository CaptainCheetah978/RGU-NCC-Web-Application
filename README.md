<p align="center">
  <img src="public/ncc-logo.png" alt="NCC Logo" width="100" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/rgu-logo.png" alt="RGU Logo" width="100" />
</p>

<h1 align="center">NCC RGU — Cadet Management System</h1>

<p align="center">
  A comprehensive, role-based web application for the <strong>National Cadet Corps (NCC)</strong> unit at <strong>Royal Global University (RGU)</strong>.<br/>
  Powered by a <strong>Supabase Backend</strong> for real-time data persistence, secure authentication, and cloud storage.
</p>

<p align="center">
  <a href="#features">Features</a>
  &nbsp;·&nbsp;
  <a href="#getting-started">Getting Started</a>
  &nbsp;·&nbsp;
  <a href="#tech-stack">Tech Stack</a>
  &nbsp;·&nbsp;
  <a href="#deployment">Deployment</a>
</p>

---

## Features

| Module | Description |
|--------|-------------|
| **Smart Dashboard** | Real-time statistics (cadets, attendance %, active classes), live recent activity feed, and unread note counters. |
| **Secure Auth** | Role-based access control (RBAC) securely managed via Supabase RLS policies and Server Actions. |
| **Attendance** | Mark attendance (Present/Absent/Late/Excused). View attendance charts and export monthly reports. |
| **Class Management** | Schedule training sessions, assign instructors, and track completion status. |
| **Cadet Registry** | Centralized database of all cadets with search, filter, and export (CSV) capabilities. Auto-unit assignment based on Wing. |
| **Certificates** | Digital Locker for cadets. Upload/View/Download A, B, C certificates. ANO has full admin control. |
| **Private Comms** | Secure internal messaging system. Cadets can message SUOs; SUOs can forward to ANO. |
| **Announcements** | Broadcast urgent updates to the entire unit. Priority flagging mechanisms included. |
| **Digital ID** | Auto-generated NCC ID card with QR code for instant verification. |
| **Dark Mode** | Fully responsive interface with a sleek, toggleable dark mode. |

## Role-Based Access

The system enforces strict data privacy through **Row Level Security (RLS)**:

| Role | Permissions |
|------|-------------|
| **ANO** (Super Admin) | **Full Access.** Manage all cadets, classes, attendance, logs, and global certificates. Can delete any record. |
| **SUO** (Admin) | **Manage Unit.** Create classes, mark attendance, post announcements. Read-only access to sensitive certificates. |
| **Cadet** (User) | **Personal Access.** View own dashboard, profile, attendance history, and uploaded certificates. Send notes to seniors. |

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Backend:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Realtime)
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Deployment:** Vercel

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase Project

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/CaptainCheetah978/RGU-NCC-Web-Application.git
    cd RGU-NCC-Web-Application
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env.local` file in the root directory:
    ```env
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_secret
    ```
    *(Note: `SUPABASE_SERVICE_ROLE_KEY` is required for Admin features like creating users and resetting passwords. Do not expose this variable to the client.)*

4.  **Database Setup**
    - Run the provided SQL policies in your Supabase SQL Editor to secure the database.
    - Check `supabase-policies.sql` for the latest RLS definitions.

5.  **Run Locally**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Vercel (Recommended)

1.  Push your code to GitHub.
2.  Import the project into Vercel.
3.  **CRITICAL:** Add the Environment Variables in Vercel Settings:
    - `NEXT_PUBLIC_SUPABASE_URL`
    - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - `SUPABASE_SERVICE_ROLE_KEY`
4.  Deploy!

---

<p align="center">
  Made with ❤️ for the <strong>National Cadet Corps</strong>
</p>
