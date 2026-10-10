# SmartCivic — Civic Issue Management Platform

SmartCivic is an evidence-based, location-aware civic issue management platform. Citizens report physical civic problems with photo/video evidence and map coordinates. Issues are verified, routed to municipal departments, assigned to field workers, and tracked through an immutable lifecycle with before/after verification and citizen closure confirmation.

---

## 🏗️ Architecture & Monorepo Structure

```
smart-city-issue-reporting/
├── frontend/             # Vite + React (TypeScript) + Tailwind CSS + Lucide Icons + Leaflet
├── backend/              # Django + Django REST Framework + SimpleJWT + CORS
│   ├── smartcivic/       # Project core configuration
│   ├── accounts/         # Authentication, custom users, roles (RBAC)
│   ├── departments/      # Municipal local body departments & routing
│   ├── issues/           # Civic problem lifecycle state machine
│   ├── evidence/         # Photo/video verification & EXIF analysis
│   ├── ai/               # AI recommendation and category suggestion pipeline
│   ├── notifications/    # In-app user notifications & alerts
│   ├── analytics/        # SLA monitoring, heatmaps & departmental reporting
│   └── audit/            # Immutable status history & audit trail
└── docs/                 # Architecture guides & specifications
```

---

## 🎨 Design System & Palette (Strict Government-Grade Standards)

- **Typography**:
  - Headings / Display: `Bricolage Grotesque` (600, 700)
  - Body / UI: `IBM Plex Sans` (400, 500, 600)
  - Identifiers, Timestamps & Coordinates: `IBM Plex Mono` (500)
- **Palette**:
  - Ink: `ink-950` (#0A1A2A), `ink-700` (#243B53), `ink-500` (#52667A), `ink-300` (#A7B4C2)
  - Backgrounds: `surface` (#F5F7FA), `card` (#FFFFFF), `line` (#E2E8EF)
  - Civic Brand: `primary-700` (#0B5F63), `primary-600` (#0E7378), `primary-100` (#D9F0EF)
  - Accent: `accent-500` (#E8A317)
- **Gradients** (Strictly two):
  - `hero-gradient`: `linear-gradient(135deg, #0A1A2A 0%, #0B3B45 55%, #0B5F63 100%)`
  - `data-fade`: `linear-gradient(180deg, rgba(14,115,120,0.18) 0%, rgba(14,115,120,0) 100%)`

---

## 🚀 Running the Project Locally

### 1. Backend (Django + DRF)

```powershell
# Navigate to backend directory
cd backend

# Create & activate virtual environment (if not already active)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start backend development server (http://127.0.0.1:8000/)
python manage.py runserver
```

### 2. Frontend (Vite + React + Tailwind)

```powershell
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server (http://localhost:5173/)
npm run dev
```
