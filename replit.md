# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

### `artifacts/salam-journey` — Salam Journey website
- React + Vite + Tailwind v4 (no UI library; everything hand-built for design control).
- Bilingual Arabic/English with `src/lib/i18n.tsx` (`LanguageProvider` + `useLanguage` + `tx(ar, en)` helper). Direction (`rtl`/`ltr`), `<html lang>`, fonts, and the `lang-ar`/`lang-en` body class swap automatically; preference persists in `localStorage`.
- Brand palette is defined as CSS variables in `src/index.css` (sage / blush / cream) and exposed as Tailwind utilities (`bg-sage`, `text-cream`, etc.) via the `@theme inline` block.
- Fonts: Tajawal + Cairo for Arabic, Playfair Display + DM Sans for English (loaded via Google Fonts in `index.html`).
- Custom interactive booking calendar lives at `src/components/booking-calendar.tsx`. It owns its own state, persists confirmed bookings to `localStorage` under `salam-journey:booked-slots`, and seeds a few demo unavailable dates relative to today.
- Scroll reveal helper: `src/lib/use-reveal.ts` (IntersectionObserver) — add the `reveal` class to any element inside a section that uses the hook.
- **Auth (prototype, localStorage only)**: `src/hooks/use-auth.tsx` defines `AuthProvider`, `useAuth()`, plus helpers `initialsOf` / `firstNameOf`. Persists the registry under `salam_users` and the active user id under `salam_user`. Passwords are stored in plain text — clearly noted; this is a prototype, never do this in production. Account state includes `bookings[]` and `enrolledCourses[]` so the same data drives the `/account` page and the booking form prefill.
- **Modals & toasts**: reusable portal-based dialog at `src/components/ui/modal.tsx` (overlay, ESC, click-outside, body scroll lock, focus first input). Auth modals live under `src/components/auth/` and are orchestrated by `AuthModalsProvider` (`useAuthModals().openLogin/openRegister/openForgotPassword/openLogout/openAuthGate`). Toast notifications use `sonner` via the brand wrapper at `src/lib/notify.ts` (`notify.success / error / info`), mounted top-center in `App.tsx`.
- **Account page**: `/account` (`src/pages/account.tsx`) with sidebar tabs Profile / My Courses / My Bookings / Change Password; the active tab is mirrored to the URL via `?tab=`. If a guest hits `/account` they are redirected home with the auth-gate modal opened.

