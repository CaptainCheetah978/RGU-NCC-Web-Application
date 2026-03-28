# Known Issues & Technical Debt

This is a working document tracking areas of the app that still need polish or have known edge cases. Since this was built quickly for internal 30 Assam Bn NCC operational use, some tradeoffs were made.

### ~~1. Offline Sync Conflicts~~ ✅ RESOLVED (March 27, 2026)
- **Resolution**: Implemented timestamp-based Last-Write-Wins conflict resolution in `attendance-actions.ts`. Stale offline records are silently dropped; newer records overwrite.

### ~~2. QR Code Scanner / Verification Bounds~~ ✅ RESOLVED (March 27, 2026)
- **Resolution**: Added input validation guard in `verify-actions.ts`. Redesigned the guest verification view (`verify/page.tsx`) with proper "Not Found" and "Missing ID" error states and a clear "Return to Login" CTA.

### ~~3. PDF Export Truncation~~ ✅ RESOLVED (March 27, 2026)
- **Resolution**: Calibrated `jspdf-autotable` with explicit bottom margins (`margin: { bottom: 20 }`) and automatic page-break handling (`rowPageBreak: 'auto'`) in both `pdf-export-button.tsx` and `sheet/page.tsx`. Reports now include Unit Name in the header.

### ~~4. Mobile Safari Clipping~~ ✅ RESOLVED (March 27, 2026)
- **Resolution**: Applied `pb-[env(safe-area-inset-bottom)]` to the dashboard layout container in `layout.tsx`.

### ~~5. Single-Tenant Architecture~~ ✅ FOUNDATION LAID (March 27, 2026)
- **Resolution**: Created `004_multi_tenancy.sql` migration with a `units` table, `unit_id` columns on all entity tables, and unit-scoped RLS policies. Updated all server actions to inject `unit_id` on writes. Added `get_my_unit_id()` helper function for RLS. UI now displays unit branding in the Topbar and PDF exports.
- **Remaining**: New unit onboarding workflow/admin panel is not yet built. Currently, new units must be added via direct SQL.

---

## New Issues (Discovered March 27, 2026)

### ~~6. Activity Log Missing `unit_id` on Client Inserts~~ ✅ RESOLVED (March 27, 2026)
- **Resolution**: Migrated activity logging to a new server action (`activity-actions.ts`). The `unit_id` and `userName` are now securely injected from the caller session via an improved `getCallerSession` helper.

### ~~7. Avatar Signed URLs — 10-Year Expiry Risk~~ ✅ RESOLVED (March 27, 2026)
- **Resolution**: Switched from generating expiring signed URLs to generating persistent public bucket URLs via `getPublicUrl` in `profile/page.tsx`.

### ~~8. ID Card Download Clipping on Older Android~~ ✅ RESOLVED (March 27, 2026)
- **Resolution**: Hardened the `toPng` rendering in `profile/page.tsx` by adding explicit canvas sizing (`canvasWidth` / `canvasHeight`), explicitly setting the background color to white, and introducing a 100ms render delay to allow fonts and images to settle before snapshotting.

