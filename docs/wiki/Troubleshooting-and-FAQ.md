# Troubleshooting & FAQ

This document serves as the ultimate diagnostic manual for both end-users (Cadets/Officers) experiencing UI issues, and developers debugging backend or deployment anomalies.

---

## 1. Authentication & Access Errors

### 1.1 "Invalid Reg No or PIN" during Login
- **For the Cadet**: Ensure you are typing your exact Regimental Name (e.g., `AS20SDA100000`) without extra spaces. If you forgot your PIN, you cannot self-reset it for security reasons. Contact your SUO or ANO.
- **For the Admin**: 
    1. Wait for the cadet to report their lock-out.
    2. Go to the **Cadet Registry**.
    3. Click the **Edit (Pencil)** icon on the specific cadet.
    4. Type a new 6-digit PIN into the override field.
    5. Hit **Save changes** and communicate the temporary PIN to the cadet.

![Login Screen](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/login.png)

### 1.2 Infinite Loading Spinner on Login
- **Diagnosis**: This usually implies a failure to connect to Supabase or a corrupted session cookie.
- **Solution**: 
    1. Clear your browser cache and cookies for the specific site. 
    2. If you are developing locally, verify that your `.env.local` Supabase URL is correct.
    3. Restart your local Next.js development server.

---

## 2. Dashboard, Profile, and ID Card Anomalies

### 2.1 Profile Photo Fails to Upload
- **Issue**: Clicking upload either stalls or throws a red toast error.
- **Solution for Cadet**:
    1. Ensure the file is smaller than 5MB.
    2. Ensure the file is a standard `.jpg` or `.png`.
- **Developer Fix**: 
    1. Go to your Supabase Project.
    2. Navigate to **Storage** -> `avatars` bucket. 
    3. Ensure the bucket is set to **Public**. If it is private, the client cannot read the generated URL.

![Cadet Profile](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/profile.png)

### 2.2 ID Card Edges are Clipped / Shadow is Missing
- **Issue**: When downloading the ID card, the beautiful rounded corners and drop-shadows are cut off sharply.
- **Solution**: This is a known limitation with the DOM-to-Canvas engine bounding boxes. We fixed this by wrapping the ID card in a white padding layer. Do not manually apply `overflow: hidden` to the ID Card's parent container in `globals.css` or Tailwind classes, as this breaks the snapshot engine.

### 2.3 ID Card "Print" Button Outputs Blank Pages on Mobile
- **Issue**: Pressing 'Print' on iPhone Safari or Chrome Android yields a blank white PDF.
- **Solution**: Native mobile browsers aggressively strip complex CSS to save printer ink. We specifically engineered a workaround where the Print button actually captures a static PNG hidden overlay. 
    - **Step 1:** Click **Download** instead to save the generated image to your camera roll.
    - **Step 2:** Open the image in your gallery app and print that specific image directly.

![Digital ID Card](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/id-card.png)

---

## 3. Attendance & Offline Sync Failures

### 3.1 "No Active Classes Found"
- **Issue**: The Attendance dropdown is completely empty.
- **Solution**: 
    1. The SUO or ANO must log in.
    2. Navigate to the **Attendance** tab.
    3. Click **+ New Class** and define the training session before anyone can mark personnel present or absent.

### 3.2 Offline Records Lost or Not Deployed to the Sheet
- **Issue**: A Moderator logs attendance on the parade ground (offline mode), but later the Master Sheet shows everyone as Absent.
- **Diagnosis**: The offline queue (`IndexedDB`) was destroyed or never authorized to sync.
- **Prevention Steps**: 
    1. When working offline, the system queues data locally.
    2. **Do not close the browser tab**. 
    3. Walk back to an area with connectivity while keeping the tab open. 
    4. Wait for the app to detect internet and automatically sync. 
    5. Wait for the green "Offline records synced successfully" toast to appear. (If you close the app before this, the data is permanently lost).

![Attendance Tracking](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/attendance.png)

---

## 4. Developer Setup & Deployment Errors

### 4.1 "Unauthorized" Error when Deleting a Cadet or Class
- **Issue**: A user clicks the trash icon, but a red "Unauthorized" or generic "Failed to delete" toast appears.
- **Diagnosis**: The user's role is insufficient, or the Server Action bypass failed.
- **Solution**:
    1. Verify in `supabase/profiles` that your account has the string `ANO` or `SUO` exactly.
    2. Verify that your `.env.local` contains the `SUPABASE_SERVICE_ROLE_KEY`. If this is missing, the `supabaseAdmin` client cannot instantiate, and Row-Level Security will physically block the delete command.

### 4.2 Application Build Fails on Vercel
- **Issue**: The GitHub Action or Vercel pipeline crashes during the `Build Command`.
- **Diagnosis**: TypeScript or ESLint identified a fatal flaw. Vercel will not deploy broken code.
- **Solution**: Open your local terminal and run `npm run lint`. Fix any "unused variables" or React Hook dependency warnings. Then run `npm run build` locally. The terminal output will point you to the exact line of code causing the crash.

### 4.3 App Logo looks Distorted on Mobile Homescreen (PWA)
- **Issue**: When "Adding to Homescreen", the NCC logo is stretched or squished.
- **Solution**: The PWA specification strictly requires perfectly square icons (e.g., 192x192). The raw NCC logo is rectangular. We use the `sharp` node module to pad the icon with white space procedurally. 
    1. Ensure `sharp` is installed in your `package.json` dependencies.
    2. Rebuild the application using `npm run build`.

### 4.4 Dashboard Numbers Don't Update Immediately
- **Issue**: Someone marks attendance on another phone, but your dashboard doesn't reflect it unless you refresh the page.
- **Diagnosis**: Supabase Realtime Channels are disconnected.
- **Solution**: 
    1. Log into your Supabase Dashboard. 
    2. Navigate to **Database** -> **Replication**. 
    3. Under the `supabase_realtime` publication, ensure that the tables (`attendance`, `classes`, `profiles`, `notes`) have "Insert, Update, Delete" toggled strictly **ON**. Without this, the server will never broadcast change payloads to connected clients.

![Dashboard Overview](https://raw.githubusercontent.com/CaptainCheetah978/RGU-NCC-Web-Application/main/public/screenshots/dashboard.png)

---

## 5. Contacting Core Support

If you have exhausted all diagnostic steps listed above:
1. Isolate the explicit error message from the browser's Developer Console (F12 > Console tab).
2. Document the steps to reproduce the exact failure.
3. Open a detailed Issue Ticket on the project's GitHub Repository.
