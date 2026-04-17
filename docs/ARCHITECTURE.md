# Frontend Architecture

## Directory Roles

- app: route-level pages and layouts (Next.js App Router)
- app/(protected)/<feature>/_components: feature-local UI specific to one route segment
- components/common: reusable presentation components
- components/layout: shell, sidebar, topbar, app layout helpers
- hooks: reusable client-side hooks
- lib/api: backend API clients
- lib/auth: auth storage/session helpers
- lib/utils: formatting and utility helpers
- types: shared TypeScript entity types

## Routing Strategy

- Public route: app/login
- Protected routes: app/(protected)/*

## RBAC Pattern

- Visibility and data fetching are permission-based.
- read_* permissions control data visibility.
- manage_* permissions control action buttons and mutation flow.
- Avoid role hardcode checks in page logic.

## UI Rules

- Keep page-level orchestration in app routes.
- Keep feature-specific components colocated in each feature _components folder.
- Push only cross-feature reusable parts to components/common and components/layout.
- Keep API contract logic in lib/api only.
- Keep string permissions centralized when possible.
