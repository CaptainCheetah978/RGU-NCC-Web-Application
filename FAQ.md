# Frequently Asked Questions (FAQ)

### Can I use this for my NCC Unit?
Yes. The repository is MIT licensed, and you are free to fork it. However, you will need to set up your own Supabase database and configure `unitName` and `institutionName` in your environment variables. See the README for deployment steps.

### Why doesn't the digital ID card work on my mobile browser?
The ID card uses `html-to-image` to generate a snapshot. If you are using a very old Android browser, the DOM rendering might clip. We strongly recommend using modern Chrome or Safari for the best experience.

### Does the app work without an internet connection?
Yes, for the Attendance module. If you are an ANO or SUO marking attendance on a parade ground without Wi-Fi, the app will queue the attendance data locally in your browser (via IndexedDB) and automatically sync it to the database when you regain a network connection.

### How do I reset a Cadet's PIN?
Currently, there is no email-based password reset since many cadets do not have active emails. An ANO must escalate the issue, and a database administrator can reset the PIN manually in the Supabase Auth dashboard.
