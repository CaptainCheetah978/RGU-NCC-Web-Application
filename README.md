<p align="center">
  <img src="public/ncc-logo.png" alt="NCC Logo" width="120" />
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
  <img src="public/rgu-logo.png" alt="RGU Logo" width="120" />
</p>

# 🛡️ NCC RGU — Cadet Management System

> **"Unity and Discipline"**  
> The official digital administrative suite for the National Cadet Corps unit at Royal Global University.

This application is a comprehensive, role-based management system designed to transition NCC unit administration from paper-based records to a secure, real-time digital environment. It empowers officers with data-driven insights and provides cadets with a modern interface for tracking their training progress.

---

## 📅 Project Meta
- **Developed In:** 2026
- **Current Version:** 1.0.0
- **Lead Developer:** [SUO Aditya Singh](https://github.com/CaptainCheetah978) (30 Assam Bn NCC)
- **Primary Stakeholder:** NCC Unit, Royal Global University (NER Directorate)
- **License:** MIT

---

## ✨ Features & Modules

### 1. 📊 Command Dashboard
A central hub providing visual analytics and real-time updates:
- **Unit Statistics**: Total enrollment, gender ratio, and monthly attendance growth.
- **Recent Activity Feed**: Audit trail of administrative actions (sign-ups, deletions, attendance marks).
- **Upcoming Schedule**: Quick view of scheduled classes and training sessions.
- **Announcement Banner**: Dynamic broadcast system for unit-wide notifications.

### 2. 🪪 Cadet Registry & Digital ID
- **Searchable Database**: Filter by Regimental Number, Name, Rank, or Enrollment Year.
- **Digital ID Generation**: Automatic creation of NCC Identity Cards with unique QR codes for instant verification.
- **Profile Management**: Cadets can update their blood group and contact info, and manage their authentication PIN.

### 3. ✅ Attendance & Training
- **Session Tracking**: Create classes with specific instructors, venues, and subjects.
- **Marking System**: Rapid attendance entry (Present, Absent, Late, Excused).
- **History Logs**: Visual calendars showing individual attendance streaks and monthly summaries.

### 4. 📂 Certificate Locker & Media
- **Secure File Storage**: Dedicated section for uploading NCC A, B, and C certificates.
- **Media Repository**: Unit-wide access to training manuals, drill videos, and ceremonial documents.
- **Signed URLs**: All files are served via Supabase Storage with temporary secure links to prevent unauthorized access.

### 5. 💬 Communication System
- **Private Notes**: Hierarchical messaging allowing cadets to send notes to officers and vice versa.
- **Notifications**: Unread message badges in the sidebar and real-time alerts.

---

## 🔐 Role-Based Access Control (RBAC)

The system operates on a state-of-the-art security model using **Supabase Row Level Security (RLS)**. No user can see data they aren't authorized to access.

| Role | Responsibility | Data Permission |
| :--- | :--- | :--- |
| **ANO** | Associate NCC Officer | **SuperAdmin**: Full control over all cadets, data, and logs. |
| **SUO** | Senior Under Officer | **Admin**: Schedule classes, mark attendance, manage registry. |
| **UO/SGT** | Junior Officers | **Moderator**: Mark attendance and view unit-wide registry. |
| **Cadet** | Standard User | **User**: Personal records, ID card, and private notes only. |

---

## 🛠️ Technical Architecture

### **The Stack**
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Server Components)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (hosted on Supabase)
- **Auth**: Custom PIN-based Authentication with Server-Side verification.
- **Styling**: [Tailwind CSS 4.0](https://tailwindcss.com/) with Custom Glassmorphism Theme.
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for fluid UI transitions.

### **Database Schema Highlights**
- **profiles**: Extended user information (Regt No, Wing, Unit info).
- **attendance**: Relational table linking cadets to specific classes.
- **notes**: Hierarchical message storage with read-status tracking.
- **classes**: Storage for training schedules and instructor assignments.

---

## 📥 Deployment Guide

### **1. Git Fork vs. Git Clone**

Understanding the difference is critical for maintaining this project:

*   **🔱 Git Fork**: Happens on GitHub. Think of it as "copy-pasting" the project into your own account. Use this if you want to customize the app for your own unit.
*   **📥 Git Clone**: Happens on your local machine. Use this to download the files from GitHub to your computer so you can actually run or edit the code.

#### **How to Fork**
1. Navigate to the [Official Repository](https://github.com/CaptainCheetah978/RGU-NCC-Web-Application).
2. Look at the top-right corner of the page and click the **Fork** button.
3. Select your GitHub account as the destination.
4. GitHub will create a copy of the entire project in your account within seconds.

#### **How to Clone**
1. Go to your version (the fork) or the original repository on GitHub.
2. Click the green **Code** button.
3. Copy the URL (it ends in `.git`).
4. Open your terminal or Command Prompt.
5. Type `git clone ` and then paste the URL:
   ```bash
   git clone https://github.com/YourUsername/RGU-NCC-Web-Application.git
   ```
6. Press Enter. The project folder will now be on your computer.

### **2. Installation**

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

### **3. Running Locally**

```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🚀 Multi-Unit Deployment
This application is designed to be **unit-agnostic**. To deploy this for a different NCC unit:
1. **Fork** the repository (follow the steps above).
2. **Clone** your fork to your machine.
3. Update the branding constants in the `.env` file.
4. Replace the logo files in the `/public` directory (`ncc-logo.png` and `rgu-logo.png`).
5. Push your changes and re-deploy to Vercel.

---

## ⚖️ License
This project is licensed under the **MIT License**. This means you are free to use, modify, and distribute the software, provided that the original copyright notice and permission notice are included in all copies or substantial portions of the software. See the [LICENSE](LICENSE) file for details.

---

## 📜 Acknowledgments
- **Institution**: Royal Global University
- **Unit**: 30 Assam Bn NCC, Guwahati Group
- **Directorate**: North-East Region (NER) Directorate
- **Vision**: To bring "Unity and Discipline" into the digital age.

---

<p align="center">
  <b>© 2026 SUO Aditya Singh • 30 Assam Bn NCC • Guwahati Gp • NER Dte</b><br/>
  <i>Built with pride for the National Cadet Corps</i>
</p>
