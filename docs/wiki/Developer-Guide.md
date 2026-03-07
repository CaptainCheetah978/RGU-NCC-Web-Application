# NCC RGU Cadet Management System: Exhaustive Developer Guide

Welcome to the technical documentation for the NCC RGU CMS. This guide is built to help new developers, contributors, and maintainers understand the core architecture, advanced mechanisms, and the deployment lifecycle of the application.

---

## 1. System Architecture & Request Lifecycle

The application is built on the modern **Next.js 15 App Router** paradigm, leaning heavily into a thick-client/thin-server architecture backed by **Supabase** (PostgreSQL).

- **Client Components (`"use client"`)**: Responsible for all interactive UI, including the Dashboard, Cadet Registry, and profile views.
- **Data Hydration**: Rather than fetching data on every page load, the app uses a centralized context `src/lib/data-context.tsx`. This component fetches all necessary data on initial load and establishes **Realtime Supabase Channels**. When a row in the database changes (e.g., someone marks attendance), the channel receives the payload and updates the React state strictly for that table, keeping the UI perfectly in sync across all logged-in devices without polling.
- **Server Actions (`src/app/actions/`)**: All destructive data mutations (Deletes, Complex Inserts, File Uploads) bypass the client entirely. They are submitted to Next.js Server Actions, authenticated on the server, and executed directly against the database.

---

## 2. Setting Up the Local Environment

### 2.1 Prerequisites
- Node.js v20.x or higher
- Git
- A Supabase Account

### 2.2 Environment Configuration
Clone the repository and run `npm install`. Then, create a `.env.local` file in the root directory.

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-api-key"

# Critical: Never expose this key to the browser (no NEXT_PUBLIC prefix)
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" 

# White-label Branding
NEXT_PUBLIC_UNIT_NAME="30 Assam Bn NCC"
NEXT_PUBLIC_INSTITUTION_NAME="Royal Global University"
```

### 2.3 Database & Storage Initialization
1. Open your Supabase Project Dashboard and navigate to the **SQL Editor**.
2. Run the SQL scripts found in `supabase/migrations/` consecutively. This will build your `profiles`, `classes`, `attendance`, `notes`, and `certificates` tables, along with all strict relational constraints.
3. Navigate to **Storage** in Supabase.
4. Create two separate buckets: `files` (Private) and `avatars` (Public). 

---

## 3. Database Schema & Security Principles

### 3.1 Row Level Security (RLS)
The PostgreSQL database is locked down via RLS. By default, no table can be read or written to.
- We attach specific policies to tables based on the user's `role` (ANO, SUO, UO, Cadet). 
- For instance, Cadets have a policy allowing them to `SELECT` and `UPDATE` records in the `profiles` table *only* where the `auth.uid() = id`.

### 3.2 The Server Action Bypass (Important)
Because RLS is so incredibly strict, performing cascading deletes across relational tables (e.g., deleting a User, their Attendance records, and their Notes simultaneously) natively from the browser is extremely fragile and prone to locking errors.

**Our Solution**: 
1. The client calls a server action in `src/app/actions/delete-actions.ts`.
2. The server action uses a helper `getCallerSession()` to cryptographically verify who the user is and what their role is.
3. If the role is authorized (e.g., ANO), the action instantiates a `supabaseAdmin` client using the `SUPABASE_SERVICE_ROLE_KEY`.
4. This Admin client entirely bypasses RLS, executing the cascading deletes instantaneously and cleanly at the root database level.

---

## 4. Advanced Mechanics: DOM Virtualization

**The Problem**: Rendering 2,000+ cadet UI cards simultaneously in the Registry or Attendance lists will immediately crash mobile browser tabs due to DOM bloat.

**The Solution**: We implemented `@tanstack/react-virtual`.
1. Found in `src/app/dashboard/cadets/page.tsx` and `src/app/dashboard/attendance/page.tsx`.
2. Instead of mapping over the entire array of cadets, the virtualizer calculates the exact height of the viewport and only renders the ~15 cadet elements currently visible on screen.
3. As the user scrolls, it re-uses those exact same 15 DOM nodes, swapping the underlying data out. This guarantees a locked 60 FPS scrolling experience regardless of database size.

![Cadet Registry Virtualization](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/registry.png)

---

## 5. Advanced Mechanics: Offline Attendance Sync

**The Problem**: The parade ground rarely has a stable 4G connection. If connectivity drops during roll call, the application must not break.

**The Solution**: An asynchronous IndexedDB queueing engine.
1. Implemented in `src/lib/offline-sync.ts`.
2. A custom hook `useNetworkStatus()` constantly listens to browser `navigator.onLine` events.
3. If the user marks a cadet "Present" while offline, the payload is intercepted and written to local storage using `idb-keyval` (Queue). The UI optimistically updates to show the cadet marked so the officer doesn't lose their place.
4. Upon reconnecting to the internet, `attendance/page.tsx` detects the network surge. It locks the UI momentarily, iterates through the entire `idb-keyval` queue, fires the mutations to Supabase in order, clears the local queue, and prompts a green success toast.

![Offline Attendance Tracker](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/attendance.png)

---

## 6. Digital ID Generator & HTML-to-Image Pipeline

**The Problem**: Natively printing a web element via `window.print()` strips out CSS box shadows, gradients, and custom radii to save printer ink. This ruins the aesthetics of the ID card. Mobile browsers also arbitrarily shrink dimensions.

**The Solution**: We built a custom snapshot engine.
1. When the user clicks "Download" or "Print", the app uses `html-to-image` (`toPng`).
2. Before capturing, the actual ID card element is wrapped in a pristine, white-padded `div`. This forces the canvas to capture the bleeding drop-shadow (`shadow-2xl`) completely, rather than clipping it at the component borders.
3. On mobile devices, the visual representation of the card is shrunk using CSS `transform: scale` so it fits the screen natively, but the underlying DOM object retains its massive, high-resolution 500x800px structure. When downloaded, it yields a perfect, print-ready asset.

![Digital ID Card Rendering](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/id-card.png)

---

## 7. Deployment & CI/CD pipeline

The application is deployed on **Vercel** to utilize Next.js Edge Caching and automated Service Worker generation.

### GitHub Actions (Continuous Integration)
We strictly enforce code stability. Located in `.github/workflows/ci.yml`, our automated bot runs two checks on every push to the `main` branch before Vercel is allowed to deploy:
1. **Lint Check**: Runs `npx eslint src`. Any unused variables, un-escaped entities, or broken React hooks will immediately fail the workflow.
2. **Build Check**: Runs `npm run build` to ensure the entire TypeScript application compiles perfectly.

If either of these fail, the broken code will not go live. Always test your local builds before pushing.
