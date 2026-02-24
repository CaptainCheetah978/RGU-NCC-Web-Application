<p align="center">
  <img src="public/ncc-logo.png" alt="NCC Logo" width="120" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/rgu-logo.png" alt="RGU Logo" width="120" />
</p>

# NCC RGU — Cadet Management System

<p align="center">
  <img src="https://img.shields.io/badge/Vercel-Deployed-success?style=for-the-badge&logo=vercel" alt="Vercel Deployed" />
  <img src="https://img.shields.io/badge/Next.js%2015-Black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Supabase-Database-3FC68D?style=for-the-badge&logo=supabase" alt="Supabase" />
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="MIT License" />
</p>

> **"Unity and Discipline"**  
> A premium, role-based Cadet Management System featuring real-time dashboards, QR-identity verification, and secure administrative tools. Engineered with Next.js 15 and Supabase for speed and scale.

---

## Contents
- [Project Meta](#project-meta)
- [Features and Modules](#features-and-modules)
- [Visual Overview](#visual-overview)
- [Role-Based Access Control](#role-based-access-control)
- [Technical Architecture](#technical-architecture)
- [Project Structure](#project-structure)
- [Deployment Guide](#deployment-guide)
- [Multi-Unit Deployment](#multi-unit-deployment)
- [Future Roadmap](#future-roadmap)
- [License](#license)
- [Acknowledgments](#acknowledgments)

---

## Project Meta
- **Developed In:** 2026
- **Current Version:** 1.0.0
- **Lead Developer:** [SUO Aditya Singh](https://github.com/CaptainCheetah978) (30 Assam Bn NCC)
- **Primary Stakeholder:** NCC Unit, Royal Global University (NER Directorate)
- **License:** MIT

---

## Features and Modules

The system is built on a modular architecture to ensure specific unit needs are met with high performance.

| Module | Core Features | Primary Users |
| :--- | :--- | :--- |
| **Command Dashboard** | Analytics, Live Logs, Announcements, Stats | ANO, SUO |
| **Cadet Registry** | Database, Advanced Search, Record Management | ANO, SUO, UO |
| **Digital ID System** | QR Code Gen, Identity Verification, PDF Export | All Ranks |
| **Attendance Tracker** | Daily Drill, Class History, Percentages | ANO, SUO, UO |
| **Training Records** | Session Planning, Instructor Logs, Syllabus | All Ranks |
| **Document Vault** | Certificate Uploads (A, B, C), Training Media | All Ranks |
| **Communication** | Private Hierarchical Notes, Unread Badges | All Ranks |

### Command Dashboard
A central hub providing visual analytics and real-time updates:
- **Unit Statistics**: Real-time tracking of total enrollment, gender distribution, and monthly attendance growth.
- **Recent Activity Feed**: A transparent audit trail of administrative actions (enrollments, deletions, attendance updates).
- **Upcoming Schedule**: Quick-view cards for scheduled training sessions and instructional classes.
- **Announcement Banner**: A broadcast system for important unit-wide notifications with priority levels.

### Cadet Registry and Digital ID
- **Searchable Database**: High-speed filtering by Regimental Number, Rank, Gender, or Enrollment Batch.
- **Digital ID Generation**: Automatic generation of official-style Identity Cards with unique QR codes for secure verification.
- **Profile Management**: Permission-based profile updates allowing cadets to manage blood group and personal authentication PINs.

### Attendance and Training
- **Session Tracking**: Create and manage classes with metadata for instructors, venues, and training subjects.
- **Marking System**: Rapid, mobile-responsive attendance entry (Present, Absent, Late, Excused).
- **History Logs**: Interactive visual calendars showing individual attendance streaks and monthly summaries per cadet.

### Certificate Locker and Media
- **Secure File Storage**: A structured digital locker for uploading and retrieving primary NCC certificates (A, B, and C).
- **Media Repository**: A centralized drive for unit training manuals, drill videos, and ceremonial documents.
- **Signed URLs**: Enhanced security for all stored files, ensuring documents are only accessible via authenticated sessions.

### Communication System
- **Private Notes**: A secure, rank-based internal messaging system (e.g., Cadet to ANO, SUO to Cadet).
- **Real-time Status**: Visible "Unread" badges in the sidebar to ensure critical communication is never missed.

---

## Visual Overview

> [!TIP]
> **Capture Instructions**: Set your browser to 1440x900 for consistent shots. Save images as `.png` or `.gif` in `public/screenshots/` using the names below.

| Login Interface | Command Dashboard |
| :---: | :---: |
| ![Login](public/screenshots/login.png) | ![Dashboard](public/screenshots/dashboard.png) |

| Cadet Registry | Attendance System |
| :---: | :---: |
| ![Registry](public/screenshots/registry.png) | ![Attendance](public/screenshots/attendance.png) |

| User Profile | Digital ID Card |
| :---: | :---: |
| ![Profile](public/screenshots/profile.png) | ![ID Card](public/screenshots/id-card.png) |

| Private Messaging |
| :---: |
| ![Messages](public/screenshots/messages.png) |

### Additional Gallery
*Add your own GIFs, videos, or extra screenshots here!*

- **Example Interaction**: `![Feature Demo](public/screenshots/demo.gif)`
- **Mobile View**: `![Mobile UI](public/screenshots/mobile.png)`

> [!TIP]
> **Modern GIF (MP4)**: For higher quality and smaller file sizes, you can use the MP4 files from your Snipping Tool as autoplaying GIFs. Use the code below:
> 
> ```html
> <p align="center">
>   <video src="public/screenshots/your-video.mp4" autoplay loop muted playsinline width="100%" style="border-radius: 8px;"></video>
> </p>
> ```

---

## Role-Based Access Control
The system operates on a state-of-the-art security model using **Supabase Row Level Security (RLS)**. No user can see data they aren't authorized to access.

| Role | Responsibility | Data Permission |
| :--- | :--- | :--- |
| **ANO** | Associate NCC Officer | **SuperAdmin**: Full control over all cadets, data, and logs. |
| **SUO** | Senior Under Officer | **Admin**: Schedule classes, mark attendance, manage registry. |
| **UO/SGT** | Junior Officers | **Moderator**: Mark attendance and view unit-wide registry. |
| **Cadet** | Standard User | **User**: Personal records, ID card, and private notes only. |

---

## Technical Architecture

### The Stack
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (hosted on Supabase)
- **Auth**: Custom PIN-based Authentication with Server-Side verification.
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/) with Custom Glassmorphism Theme.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for fluid UI transitions.

### Database Schema Highlights
- **profiles**: Extended user information (Regt No, Wing, Unit info).
- **attendance**: Relational table linking cadets to specific classes.
- **notes**: Hierarchical message storage with read-status tracking.
- **classes**: Storage for training schedules and instructor assignments.

---

## Project Structure

```text
├── 📂 public/              # Static assets (logos, icons, etc.)
│   ├── 🖼️ ncc-logo.png      # Official NCC emblem
│   └── 🖼️ rgu-logo.png      # Royal Global University emblem
├── 📂 src/
│   ├── 📂 app/             # Next.js App Router (pages and server actions)
│   │   ├── 📂 actions/      # 🔐 Server actions for secure database mutations
│   │   ├── 📂 dashboard/    # 📊 Protected dashboard routes for all roles
│   │   ├── 📂 verify/       # 🪪 Public identity verification via QR scan
│   │   ├── 📄 layout.tsx    # Root layout with fonts, metadata, and providers
│   │   └── 📄 page.tsx      # 🔑 Secure login and authentication gateway
│   ├── 📂 components/      # Reusable UI components
│   │   ├── 📂 ui/           # Atomic shadcn/ui-inspired primitives
│   │   ├── 📄 sidebar.tsx   # Dynamic rank-based navigation menu
│   │   └── 📄 topbar.tsx    # User profile and notification header
│   ├── 📂 lib/              # Core business logic and shared state
│   │   ├── 📄 auth-context.tsx # 🛡️ Holistic authentication state management
│   │   ├── 📄 data-context.tsx # 💾 Centralized data fetching and CRUD logic
│   │   └── 📄 supabase-admin.ts# ⚡ High-privilege database operations
│   └── 📂 types/            # 📍 Global TypeScript definitions and enums
├── 📄 .env.local           # Private environment variables (Supabase keys)
├── 📄 next.config.ts       # Next.js framework configuration
├── 📄 supabase-policies.sql# 🔒 Essential RLS security policy definitions
└── 📄 tsconfig.json        # TypeScript compiler configuration
```

---

## Deployment Guide

### Git Fork vs Git Clone
Understanding the difference is critical for maintaining this project:

*   **Git Fork**: Happens on GitHub. Think of it as "copy-pasting" the project into your own account. Use this if you want to customize the app for your own unit.
*   **Git Clone**: Happens on your local machine. Use this to download the files from GitHub to your computer so you can actually run or edit the code.

#### How to Fork
1. Navigate to the [Official Repository](https://github.com/CaptainCheetah978/RGU-NCC-Web-Application).
2. Look at the top-right corner of the page and click the **Fork** button.
3. Select your GitHub account as the destination.
4. GitHub will create a copy of the entire project in your account within seconds.

#### How to Clone
1. Go to your version (the fork) or the original repository on GitHub.
2. Click the green **Code** button.
3. Copy the URL (it ends in `.git`).
4. Open your terminal or Command Prompt.
5. Type `git clone ` and then paste the URL:
   ```bash
   git clone https://github.com/YourUsername/RGU-NCC-Web-Application.git
   ```
6. Press Enter. The project folder will now be on your computer.

### Installation
1.  **Enter the Directory**:
    ```bash
    cd RGU-NCC-Web-Application
    ```
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Setup**:
    Create a `.env.local` file with the following keys:
    ```env
    # Supabase connection
    NEXT_PUBLIC_SUPABASE_URL=your_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

    # Branding (Multi-Unit Support)
    NEXT_PUBLIC_UNIT_NAME="NCC RGU"
    NEXT_PUBLIC_INSTITUTION_NAME="Royal Global University"
    ```
4.  **Database Migration**:
    Run the SQL code found in `supabase-policies.sql` using the Supabase SQL Editor. This initializes the tables and sets up the security policies.

### Running Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Multi-Unit Deployment
This application is designed to be **unit-agnostic**. To deploy this for a different NCC unit:
1. **Fork** the repository (follow the steps above).
2. **Clone** your fork to your machine.
3. Update the branding constants in the `.env` file.
4. Replace the logo files in the `/public` directory (`ncc-logo.png` and `rgu-logo.png`).
5. Push your changes and re-deploy to Vercel.

---

## Future Roadmap

This system is continuously evolving. Planned enhancements include:
- **PWA Support**: Enabling "Install to Home Screen" for better mobile accessibility and offline capabilities.
- **Multilingual Support**: Integration of regional languages (Assamese, Hindi, etc.) for better inclusivity across the Directorate.
- **Automated Quality Gates**: CI/CD pipelines via GitHub Actions to ensure build stability and code quality.
- **Camp Module**: Dedicated logic for managing high-volume enrollment and training records during annual training camps.

---

## License
This project is licensed under the **MIT License**. This means you are free to use, modify, and distribute the software, provided that the original copyright notice and permission notice are included in all copies or substantial portions of the software. See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments
- **Institution**: Royal Global University
- **Unit**: 30 Assam Bn NCC, Guwahati Group
- **Directorate**: North-East Region (NER) Directorate
- **Vision**: To bring "Unity and Discipline" into the digital age.

---

<p align="center">
  <b>© 2026 SUO Aditya Singh • 30 Assam Bn NCC • Guwahati Gp • NER Dte</b><br/>
  <i>Built with pride for the National Cadet Corps</i>
</p>
