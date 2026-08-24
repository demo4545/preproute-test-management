# Preproute Test Management

React + TypeScript application for creating, managing, and publishing tests.

## Setup

```bash
cd client
npm install
npm run dev
```

## Technical Decisions

- **Vite + React + TypeScript** — fast development and type safety
- **React Router** — 5-page flow with protected routes
- **Zustand** — minimal auth state management
- **Axios** — API calls with JWT interceptor
- **React Hook Form + Zod** — form validation on login, test, and question forms
- **CSS variables** — design tokens aligned with the Figma design system

## API

Set the live backend URL in `client/.env` (required):

```
VITE_API_BASE_URL=https://admin-moderator-backend-staging.up.railway.app/api
```

Test credentials:
- User ID: `vedant-admin`
- Password: `vedant123`
