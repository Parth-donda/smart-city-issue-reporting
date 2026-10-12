# SmartCivic Architecture & Design Guide

SmartCivic is an evidence-based, location-aware civic issue management platform designed with strict physical lifecycle verification, role-based access control (RBAC), and high auditability.

## 1. System Layers

```
┌─────────────────────────────────────────────────────────────┐
│                       Client Layer                          │
│  React (Vite + TS) + Tailwind CSS + Lucide + Leaflet        │
│   - Citizen Portal (Mobile-first, 360px+)                   │
│   - Field Worker App (Mobile-first, field execution)        │
│   - Department & Municipal Dashboards (Desktop command)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST / JSON (JWT Auth)
┌──────────────────────────────▼──────────────────────────────┐
│                    Django REST Framework Layer              │
│   - Auth & RBAC (SimpleJWT, Custom User Roles)              │
│   - Issue Lifecycle State Machine (Strict transitions)      │
│   - Evidence & Media Storage (Multipart Uploads)            │
│   - Audit Trail & Notification Dispatchers                  │
└──────────────────────────────┬──────────────────────────────┘
                               │ Django ORM
┌──────────────────────────────▼──────────────────────────────┐
│                     Persistence Layer                       │
│   - SQLite / PostgreSQL (Relational schema & GIS lat/lng)   │
│   - File Storage for evidence photos and videos             │
└─────────────────────────────────────────────────────────────┘
```

## 2. Issue Lifecycle State Machine

```
[SUBMITTED]
     │
     ▼
[UNDER_REVIEW] ───────► [REJECTED] (Reason required)
     │
     ▼
[ACCEPTED]
     │
     ▼
[ASSIGNED]
     │
     ▼
[ON_THE_WAY]
     │
     ▼
[ARRIVED]
     │
     ▼
[WORK_STARTED]
     │
     ▼
[IN_PROGRESS]
     │
     ▼
[DONE] (Requires completion evidence photo + description)
     │
     ▼
[VERIFIED] (Supervisor verification)
     │
     ├──────────────────────┐
     ▼                      ▼
[CLOSED]               [REOPENED] (Citizen rejects resolution)
                            │
                            └────► Routes back to Department
```

## 3. Strict Design Tokens

- **Fonts**:
  - Headings: `Bricolage Grotesque` (600, 700)
  - Body/UI: `IBM Plex Sans` (400, 500, 600)
  - Mono (IDs, hashes, coords, timestamps): `IBM Plex Mono` (500)
- **Palette**:
  - Ink: `ink-950` (#0A1A2A), `ink-700` (#243B53), `ink-500` (#52667A), `ink-300` (#A7B4C2)
  - Line & Surface: `line` (#E2E8EF), `surface` (#F5F7FA), `card` (#FFFFFF)
  - Civic Teal: `primary-700` (#0B5F63), `primary-600` (#0E7378), `primary-100` (#D9F0EF)
  - Accent: `accent-500` (#E8A317)
- **Gradients**:
  - `hero-gradient`: `linear-gradient(135deg, #0A1A2A 0%, #0B3B45 55%, #0B5F63 100%)` (Hero/Auth side panel only)
  - `data-fade`: `linear-gradient(180deg, rgba(14,115,120,0.18) 0%, rgba(14,115,120,0) 100%)` (Area chart fills only)
