# Copilot Coding Agent Instructions

These instructions keep Copilot aligned with the NCC RGU Cadet Management System architecture, data flow, and quality bar.

## Optimization & Data Updates (Critical)
- **Optimistic UI first:** For creates/deletes, use the snapshot → optimistic update → rollback pattern in `src/lib/data-context.tsx`. Do not wait for server confirmation before updating local state.
- **Avoid global refreshes:** Never call broad refreshers (e.g., `refreshAttendance()`) after a single row change. Perform surgical in-memory updates instead.
- **In-memory filtering:** For high-volume tables (Attendance/Activity), filter/search locally with `useMemo`. Avoid redundant database calls.

## Architecture & Data Flow
- **Centralized state:** `DataContext` is the source of truth. Add new entities as state plus a targeted refresh function there.
- **Server actions only:** All DB mutations must go through `@/app/actions`. Do not call `supabase.from(...).insert/update/delete()` in UI components.
- **Type safety:** Follow types in `src/types/index.ts`. Add new entities there first.

## UI & Design System
- **Library first:** Prefer components in `src/components/ui/` (Tailwind-based) instead of new styles.
- **Accessibility:** Maintain high-contrast light mode; avoid low-contrast grays on white.
- **No placeholders:** Use descriptive SVG icons or logical fallbacks—no placeholder imagery.

## Roadmap & Structure
- **Avoid large components:** If a component nears 300+ lines (e.g., `cadets/page.tsx`), factor into a `components/` subfolder.
- **Context splitting:** New modules (e.g., camp management) should use a dedicated context, not the main `DataContext`.

## Security & Supabase Rules (Critical)
- **Respect RLS:** Never suggest service role keys in clients or disabling RLS.
- **No direct Supabase mutations in UI:** Enforce mutations via server actions only.
- **Auth on server:** Enforce identity/role checks server-side and align with RLS.
- **Validate inputs:** Validate data in server actions before Supabase calls.

## Next.js App Router Conventions
- Default to Server Components; add `"use client"` only when needed.
- Do not import client-only modules into Server Components.
- Avoid fetch loops—`DataContext` owns data. Use route-level `loading.tsx`/`error.tsx` where applicable.

## Performance & Rendering
- Memoize derived lists (filter/sort/group) with `useMemo` and proper deps.
- Use `useCallback` for deep-passed handlers when it prevents rerenders.
- Avoid heavy libraries for simple tasks; reuse existing utilities first.

## Testing & Regression Safety
- When adding server actions or complex reducers/state transitions, propose at least one test or minimal validation step.
- Include clear “How to test” steps in PR descriptions for significant changes.

## Repo Conventions
- Follow existing folder patterns; do not introduce parallel state/libs (e.g., Redux/Zustand) without request.
- Do not widen types or use `any` to “make it compile”; fix typing at the source.
- Keep diffs small and reviewable; prefer targeted changes.

## Tooling & Commands
- Install dependencies: `npm install`
- Lint: `npm run lint`
- Build: `npm run build`
- No test suite currently exists.

## Commit & Documentation Tone
- Use conventional commit prefixes (`feat:`, `fix:`, `perf:`, etc.).
- Keep comments/docs professional and technical—no emojis.
