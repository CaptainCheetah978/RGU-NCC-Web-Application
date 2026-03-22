# Known Issues & Technical Debt

This is a working document tracking areas of the app that still need polish or have known edge cases. Since this was built quickly for internal 30 Assam Bn NCC operational use, some tradeoffs were made.

### 1. Offline Sync Conflicts
- **Issue**: If an ANO marks someone PRESENT while offline, and another ANO marks them ABSENT while online, the offline record will blindly overwrite the online record when the first ANO connects to the internet. 
- **TODO**: Implement a timestamp-based conflict resolution in `offline-sync.ts` rather than just upserting.

### 2. QR Code Scanner / Verification Bounds
- **Issue**: The digital ID card QR code points to `/verify?id=XXX`. Right now, anyone with the link can see the verification page. It requires the viewer to be logged in as an ANO to see sensitive data, but the unauthenticated state is a bit broken (shows an ugly error instead of a clean "Please login" redirect).
- **TODO**: Fix the redirect loop logic in `verify-actions.ts` when a non-authenticated user scans a card.

### 3. PDF Export Truncation
- **Issue**: For classes with more than 150 cadets, the `jspdf-autotable` plugin sometimes clips the bottom rows off the page instead of beautifully handling the page break.
- **Workaround**: Split large enrollments into two class sessions ("Part A" and "Part B").
- **TODO**: Calibrate the `startY` and margin settings in `pdf-export-button.tsx`.

### 4. Mobile Safari Clipping
- **Issue**: The bottom navigation bar on newer iPhones overlaps the fixed submit button in the "Mark Attendance" sheet due to WebKit's safe-area padding not being fully accounted for.
- **TODO**: Add `padding-bottom: env(safe-area-inset-bottom)` to the sticky footer component.

### 5. Single-Tenant Architecture
- **Issue**: Everything assumes a single NCC unit. The `unitName` in profiles is currently a field, but there's no actual data partitioning. 
- **TODO**: If we ever want to onboard 10 Assam Bn or another unit, we'll need a full multi-tenant refactor with a new `units` table and massive changes to RLS policies. It's a huge undertaking we're deferring for now.
