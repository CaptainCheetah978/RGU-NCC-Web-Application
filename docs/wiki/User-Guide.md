# NCC RGU Cadet Management System: Comprehensive User Guide

Welcome to the official, step-by-step operational manual for the NCC RGU Cadet Management System. This guide provides exhaustive instructions on every module and mechanism within the application, ensuring that users of all ranks know exactly how to leverage the system.

---

## 1. Access and Authentication

### 1.1 Logging In
1. Navigate to the application's root URL.
2. You will be greeted by the **Secure Gateway** screen.
3. Enter your **Regimental Number** exactly as it appears on your nominal roll (e.g., `AS20SDA100000`).
4. Enter your 6-digit **Security PIN**.
5. Click **Deploy**. Upon successful authentication, you will be redirected to the Dashboard.

*The Secure Gateway logic requires an exact match of your PIN.*
![Login Screen](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/login.png)

### 1.2 Session Management
- **Token Expiry**: For security purposes, your session is tied to a secure HTTP-only cookie.
- **Logging Out**: To securely terminate your session, click the **Logout** button located at the bottom of the navigation drawer (Sidebar). You will be immediately redirected to the login screen.

---

## 2. Role Permissions Directory

The CMS employs strict Row-Level Security (RLS). You will only see UI elements and data that your rank allows.

- **ANO (Associate NCC Officer)**: The system SuperAdmin. Has unobstructed read/write access to all directories, can bypass constraints, delete user records, and override PINs.
- **SUO (Senior Under Officer)**: Unit Administrator. Can enroll new cadets, create training classes, edit profiles (except the ANO), and export master performance sheets.
- **UO/SGT (Under Officer / Sergeant)**: Unit Moderator. Granted read-access to the registry for verification purposes and write-access to strictly mark attendance during training classes.
- **Cadet**: Standard User. Can only view and edit their personal profile, download their digital ID, and send/receive private notes.

---

## 3. The Dashboard Overview

The Dashboard serves as the central command center, providing real-time unit telemetry.

- **Statistic Cards**: Four dynamically updating cards displaying Total Active Cadets, Unit Attendance Rate, Total Logged Classes, and your Unread Notes count.
- **Announcement Banner**: A scrolling marquee at the top of the screen where high-priority alerts broadcasted by the ANO or SUO are displayed.
- **Upcoming Classes**: A chronological list of scheduled training sessions.
- **Activity Feed**: An asynchronous log of unit-wide administrative actions (e.g., "SUO enrolled Cadet XYZ", "ANO updated an announcement").

![Dashboard Overview](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/dashboard.png)

---

## 4. Cadet Registry & Alumni Management (SUO / ANO)

### 4.1 Navigating the Registry
- Click **Cadets** in the sidebar.
- You can toggle the view between a **Grid** (visual cards with photos) and a **List** (compact table data) using the icons in the top right.
- Use the **Search Bar** to instantly find cadets by Name or Regimental Number.
- Use the **Wing Filter** (Army/Navy/Air) to narrow down the personnel list.

![Cadet Registry](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/registry.png)

### 4.2 Enrolling a New Cadet
1. Click the **+ Enroll New Cadet** button.
2. Fill out the exhaustive data modal: Name, Registry No, Rank, Wing, Blood Group, and Unit Name.
3. **Important**: You must provide an initial, temporary 6-digit PIN for the cadet to log in for the first time. Advise them to change it immediately via their Profile.

### 4.3 Editing and Alumni Transition
When personnel graduate or leave the unit, they must not be deleted, as this destroys historical attendance data.
1. Click the **Edit** (Pencil) icon on the cadet's card.
2. In the "Status" dropdown menu, change `Active` to `Alumni`.
3. Save changes. The cadet is now removed from the active registry and roll calls, but their records are permanently archived. You can view them anytime by switching the main registry filter from "Active" to "Alumni".

---

## 5. Attendance Operations (UO / SUO / ANO)

### 5.1 Creating a Training Session
Before you can take attendance, the class must exist on the ledger.
1. Go to the **Attendance** module.
2. Click **+ New Class**.
3. Fill in the Title (e.g., "Drill Practice"), Date, Time, and Instructor Name.
4. Click **Create**. The class is now active in the dropdown menu.

### 5.2 Marking the Roll
1. Select the specific class from the dropdown menu.
2. The roster of all *Active* cadets will populate.
3. Next to each cadet, click the respective badge to log their status: **Present** (Green), **Absent** (Red), or **Late** (Yellow).
4. As you click, the system commits the change instantly to the database. There is no central "Save All" button.

![Attendance Tracking](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/attendance.png)

### 5.3 Offline Synchronization (Zero Connectivity Mode)
If you lose your 4G/5G connection on the parade ground, the system will not break.
1. A red banner will appear stating you are operating offline.
2. Continue marking attendance as usual. As you click 'Present' or 'Absent', a local cache (IndexedDB) quietly queues your commands.
3. The UI will optimistically show the cadet as marked so you don't lose your place.
4. **Resyncing**: Do not close the tab. Walk to an area with connectivity. Once the browser detects the internet, an automated script fires, emptying your queue into the centralized Supabase server. A green toast notification will confirm: *"Offline records synced successfully."*

---

## 6. Master Roll and Performance Analytics

### 6.1 The Master Sheet
- Click **Sheet** in the sidebar.
- This provides a massive, high-density table cross-referencing every cadet with every class they have attended.
- Use the **Export CSV** button to download a raw `.csv` file for Excel analysis.
- Use the **Export PDF** button for a beautifully formatted landscape document suitable for official battalion printing.

### 6.2 Performance Metrics
- Click **Performance** in the sidebar.
- View critical unit health statistics such as overall average attendance.
- Review the **Top Performers** list (Cadets with 90%+ attendance).
- Review the **At-Risk Cadets** list to identify personnel requiring disciplinary follow-up.

---

## 7. Personal Profile Management (All Ranks)

Navigate to **Profile** in the sidebar. This is your personal identity vault.

### 7.1 Updating Demographics & PIN
- Click **Edit Details** to update phone numbers, emergency contacts, or addresses.
- To maintain security, click **Change PIN**. Enter your exact old PIN to authorize the creation of a new, secure 6-digit code.

![Cadet Profile](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/profile.png)

### 7.2 Uploading a Uniform Photograph
1. In the Profile Header, click the camera icon overlaid on your avatar.
2. Select a `.jpg` or `.png` file.
3. The system compresses the image and uploads it to the Supabase Storage bucket, instantly linking it to your Digital ID.

### 7.3 Managing NCC Certificates
1. Scroll down to the **Certificates** section.
2. Click **Upload Document**.
3. Select whether you are uploading an 'A', 'B', or 'C' certificate.
4. Attach the PDF or Image file. Once uploaded, leadership can digitally verify your achievements.

---

## 8. Digital Identity (QR Verification)

Your Digital ID Card is an official representation of your enrollment.

### 8.1 Generation and Usage
1. On your Profile page, locate the Digital ID Card visualization.
2. Notice the dynamically generated QR code.
3. **Verification**: Any officer (or guard) can use their smartphone camera to scan your QR code. They will be directed to a public verification endpoint confirming your Name, Rank, and Status as an active NCC cadet.

![Digital ID Card](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/id-card.png)

### 8.2 Printing vs Downloading
Due to CSS quirks across hundreds of different mobile devices, we provide two distinct output mechanisms to ensure a perfect physical asset:
- **Download**: Captures the card layout (including all drop-shadows and border radii) as a high-resolution PNG image directly to your camera roll.
- **Print**: A specialized engine that takes a pristine snapshot of the card, creates a hidden image overlay across the entire screen, and invokes the native OS printing dialog. *Use this when connected to a wireless printer for a flawless 1:1 physical scale.*

---

## 9. Secure Communications (Notes Module)

The Notes system replaces fragmented WhatsApp groups with an auditable communication channel.

### 9.1 The Inbox and Sent Interfaces
- Go to **Notes**.
- Switch between **Inbox** (messages sent to you) and **Sent** (messages you composed) via the top tabs.
- Unread messages in your Inbox are bolded and highlighted with a blue "New" badge.

![Messaging Interface](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/messages.png)

### 9.2 Composing a Note
1. Click **+ New Note**.
2. Select a recipient from the dropdown. (The system intelligently filters this list based on your rank. Cadets can message NCOs/Officers; Officers can broadcast to Cadets).
3. Draft a Subject and Content.
4. Click **Send**.

### 9.3 Tracking and Forwarding
- **Read Receipts**: In your Sent tab, check the icon next to a note (Clock icon = Unread; Double Checkmarks = Read).
- **Escalation**: If a cadet sends a critical note to an SUO, the SUO can press the **Forward to ANO** button. This automatically prepends the note with `[Forwarded from Cadet XYZ]` and deposits it directly into the ANO's secure priority inbox.
