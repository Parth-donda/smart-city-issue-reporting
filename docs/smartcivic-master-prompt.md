# SmartCivic — Antigravity Master Prompt (Phased)

## How to use this

1. Put **Part 1 (Global Master Prompt)** into Antigravity as the workspace rules / first message, so it applies to every task.
2. Paste **one phase at a time** from Part 2. Do not move on until the phase's acceptance checklist passes.
3. For every phase, ask the agent to produce a plan first, then implement, then run the app and verify it in the browser.
4. Upload `summary.md` into the workspace so the agent can read the full spec.

---

# PART 1 — GLOBAL MASTER PROMPT (paste once, applies always)

```
You are a senior full-stack engineer and product designer building SmartCivic.

PRODUCT
SmartCivic is an evidence-based, location-aware civic issue management platform. Citizens report a physical civic problem with photos and a map location. The issue is verified, routed to the right municipal department, assigned to a worker, completed with before/after proof, verified by a supervisor, and confirmed by the citizen.
Core flow: Evidence -> Verification -> Routing -> Work -> Verification -> Closure.
This is NOT a generic form -> database -> status app. The physical issue lifecycle is the center of the system.
The full spec is in summary.md. Read it before planning any phase.

ROLES (strict RBAC)
Citizen, Department Officer, Worker, Department Supervisor, Municipal Admin, System Admin.
Every role sees only what it needs. Enforce permissions on the server, never only in the UI.

ISSUE LIFECYCLE (single source of truth, implement as a state machine)
SUBMITTED -> UNDER_REVIEW -> ACCEPTED or REJECTED (reason required) -> ASSIGNED -> ON_THE_WAY -> ARRIVED -> WORK_STARTED -> IN_PROGRESS -> DONE -> VERIFIED -> CLOSED
Plus REOPENED (citizen says not resolved).
Rules: citizens create issues; departments/workers control operational status; there is no simple "Done" button, DONE requires completion evidence; CLOSED is set by the system after VERIFIED. Illegal transitions must be rejected by the backend. Every transition writes an audit log entry.

TECH STACK (do not substitute without asking)
- Frontend: React + Vite + Tailwind CSS (plain JavaScript), React Router, and the built-in fetch API. Keep state with React hooks and context only, no extra state libraries.
- Maps: Leaflet + OpenStreetMap tiles (no paid API keys)
- Charts: Recharts
- Icons: lucide-react ONLY
- Backend: Django + Django REST Framework, DRF serializers for validation, SimpleJWT for login tokens, Django's default password hashing, django-cors-headers. Nothing else unless a phase truly needs it.
- Database: PostgreSQL (installed locally, accessed with psycopg 3) using the Django ORM and migrations. Plain lat/lng fields with database indexes, no PostGIS. Never use SQLite, and never write raw SQL.
- Background work: none for the MVP. Run verification inline on upload, and run SLA checks with a Django management command. No Celery, no Redis, no Docker (PostgreSQL runs as a normal local install).
- File storage: Django's default media storage on local disk. Never store images in DB rows.
- Image/AI libraries (advanced phases only): Pillow, exifread, imagehash.
- Monorepo layout: /frontend, /backend (Django project 'smartcivic' with apps: accounts, departments, issues, evidence, ai, notifications, analytics, audit), /docs
- Use a custom User model (AbstractUser with a role field) from the very first migration. Use Django apps to separate concerns. Keep business logic in service modules, not in views.

DESIGN SYSTEM — MANDATORY, NO DEVIATIONS
Personality: calm, trustworthy, government-grade, data-dense but breathable. It must NOT look like a generic AI-generated template.

Colors (define as CSS variables and Tailwind theme tokens, use ONLY these):
- ink-950 #0A1A2A (primary text, dark surfaces)
- ink-700 #243B53
- ink-500 #52667A (secondary text)
- ink-300 #A7B4C2 (disabled, placeholders)
- line #E2E8EF (borders, dividers)
- surface #F5F7FA (app background)
- card #FFFFFF
- primary-700 #0B5F63 (deep civic teal: primary buttons, active nav)
- primary-600 #0E7378
- primary-100 #D9F0EF (tinted backgrounds)
- accent-500 #E8A317 (amber: highlights, SLA warnings, key callouts, used sparingly)
- Status colors: submitted #64748B, under-review #2F6FDE, accepted #0E7378, rejected #C2410C, assigned #0369A1, on-the-way #B45309, in-progress #A16207, done #4D7C0F, verified #15803D, closed #475569, reopened #BE123C
- Priority colors: LOW #64748B, MEDIUM #2F6FDE, HIGH #D97706, CRITICAL #B91C1C
- Semantic: success #15803D, warning #D97706, danger #B91C1C, info #0369A1
FORBIDDEN colors: purple, violet, magenta, pink, neon, hot gradients, pure #000000 text, any color not listed above.
Status and priority must never rely on color alone: always pair color with an icon and a text label.

Typography (load via Google Fonts, with proper fallbacks):
- Display / headings: "Bricolage Grotesque" (600, 700)
- Body / UI: "IBM Plex Sans" (400, 500, 600)
- Mono (issue IDs like SC-2026-00125, coordinates, hashes, timestamps): "IBM Plex Mono" (500)
FORBIDDEN fonts: Inter, Roboto, Arial, Helvetica, system-ui as the main face, Poppins, Montserrat, Space Grotesk, Open Sans.
Scale: 12 / 14 / 16 / 18 / 20 / 24 / 30 / 40. Body is 14 or 16. Line height 1.5 for body, 1.2 for headings. Never use more than 3 font weights per screen.

Gradients (STRICT):
- Only two gradients exist in the whole product:
  1. hero-gradient: linear-gradient(135deg, #0A1A2A 0%, #0B3B45 55%, #0B5F63 100%), used ONLY on the landing hero and the login/register side panel.
  2. data-fade: linear-gradient(180deg, rgba(14,115,120,0.18) 0%, rgba(14,115,120,0) 100%), used ONLY as area-chart fills.
- NO gradient buttons, NO gradient text, NO gradient borders, NO gradient cards, NO rainbow/mesh/aurora backgrounds, NO purple-to-blue or pink-to-orange gradients.

Style:
- Flat, clean surfaces. White cards on #F5F7FA background, 1px #E2E8EF border, radius 12px for cards, 8px for inputs and buttons, 999px only for badges.
- Shadows: at most one very soft shadow (0 1px 2px rgba(10,26,42,0.06)) and one for modals/popovers. No glow, no neon, no heavy drop shadows.
- NO glassmorphism, NO backdrop blur panels, NO neumorphism, NO floating blobs, NO decorative 3D, NO emoji in the UI.
- Spacing on an 8px grid. Generous whitespace on citizen screens, denser tables on department/admin screens.
- Motion: 150-200ms ease-out transitions only, for hover, focus, drawer and modal. No bouncing, parallax, or looping animations. Respect prefers-reduced-motion.
- Components: one Button set (primary, secondary, ghost, danger), one Badge set (status, priority, confidence), one Card, one Table, one Modal/Drawer, one Toast, one EmptyState, one Skeleton loader. Reuse them everywhere. Never restyle ad hoc.
- Every screen needs loading, empty, error, and success states.
- Fully responsive. Citizen and Worker views are mobile-first (360px+). Department and Admin views are desktop-first but must not break on tablet.
- Accessibility: WCAG AA contrast, visible focus rings (2px primary-600), full keyboard navigation, labels on all inputs, alt text on images.

AI-FEATURE RULES (apply to anything labeled AI)
- AI only RECOMMENDS. Humans (authorized officers/supervisors) DECIDE. Never auto-reject, auto-close, or auto-ban from an AI result.
- Never label an image "REAL" or "FAKE". Show an Evidence Confidence score (0-100) with wording like "Location appears consistent", "Possible location mismatch", "Possible duplicate/reused image", "No obvious manipulation detected".
- Confidence bands: 90-100 High, 70-89 Medium, below 70 Manual Review. State in the UI that it is an operational indicator, not proof.
- EXIF and timestamp mismatches are WARNINGS for manual review, never proof of fraud.
- Show AI suggestions in a clearly labeled "AI suggestion" box (primary-100 background, sparkles icon from lucide) with confidence %, and a human-action control next to it.
- If AI output disagrees with the citizen's selection, show "Category mismatch - Manual Review Recommended".

ENGINEERING RULES
- Validate everything on the server (types, MIME + file signature, size, dimensions). Frontend validation is only for UX.
- Rate-limit auth and upload endpoints (DRF throttling). Hash passwords. No secrets in code, use .env and provide .env.example.
- Preserve full issue history: IssueStatusHistory + AuditLog for every important action.
- Config over hardcoding: category->department mapping, SLA targets (CRITICAL 4h, HIGH 24h, MEDIUM 3d, LOW 7d), distance tolerances, and confidence thresholds live in DB/config, editable by admin.
- Issue ID format: SC-YYYY-NNNNN, generated server-side. Server records all timestamps.
- Write clean, typed, modular code. Small files, no dead code, no placeholder lorem ipsum, no fake data in production paths. Seed script is allowed for demo data.
- Add tests (Django's built-in test runner) for the state machine, RBAC permissions, and upload validation. Put the lifecycle state machine in issues/services/lifecycle.py and have every status change go through it.

WORKING PROTOCOL
1. Work on ONE phase at a time. Do not build features from later phases.
2. Before coding, post a short implementation plan and list files you will create or change.
3. After coding, run the app, test the flow in the browser, and fix errors.
4. End every phase with: what was built, how to run it, what was verified, known gaps, and the acceptance checklist ticked or unticked.
5. If something in the spec is ambiguous, pick the simplest sensible option, state the assumption, and continue. Do not stop to ask unless blocked.
6. Never change the design tokens, fonts, or lifecycle without being told.
```

---

# PART 2 — PHASE PROMPTS (paste one at a time)

## MVP block (Phases 0–7)

### PHASE 0 — Foundation and Design System

```
PHASE 0: Project foundation and design system. Do not build any product features yet.

Tasks:
1. Scaffold /frontend (Vite + React + Tailwind) and /backend (Django + DRF) with a clean app-based folder structure, .env.example, and a README with run instructions.
2. Set up the Django project with PostgreSQL (psycopg), DRF, SimpleJWT, and CORS. Read DB name, user, password, host, and port from .env and list them in .env.example. Add a README section: install PostgreSQL, create the database and user (`CREATE DATABASE smartcivic;`), then run `python manage.py migrate`. No Docker. Create the empty apps listed in the master prompt.
3. Implement the full design system from the master prompt: Tailwind theme with the exact color tokens, font loading (Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono), spacing, radius, shadow tokens, and the two allowed gradients as CSS variables.
4. Build the shared component library: Button, Input, Select, Textarea, Badge (Status, Priority, Confidence), Card, Table, Modal, Drawer, Toast, Tabs, EmptyState, Skeleton, Stepper/Timeline, MapPicker placeholder, AppShell (sidebar + topbar), and a mobile bottom-nav shell.
5. Build a hidden /design-system route that renders every component and every state so the look can be reviewed.
6. Add the Status and Priority badge maps exactly as specified (color + icon + label).

Acceptance:
- [ ] Frontend and backend both run with one documented command each
- [ ] Django connects to PostgreSQL and `python manage.py migrate` succeeds
- [ ] /design-system shows all components using only approved colors and fonts
- [ ] No forbidden font, color, or gradient appears anywhere
- [ ] Layouts work at 360px and 1440px
```

### PHASE 1 — Database, Authentication, and RBAC

```
PHASE 1: Data model, auth, and role-based access control.

Tasks:
1. Create Django models + migrations (custom User model first) for: User, Role, Department, WorkerProfile, IssueCategory, Issue, IssueImage, IssueVideo, IssueLocation, IssueStatusHistory, IssueAssignment, EvidenceVerification, AIAnalysis, DuplicateMatch, IssuePriority, CompletionEvidence, CitizenFeedback, Notification, SLAConfiguration, AuditLog. Use proper foreign keys, indexes (including lat/lng), and enums.
2. Implement register, login, refresh, logout, and /me with SimpleJWT, hashed passwords, and DRF throttling.
3. Implement reusable DRF permission classes (IsCitizen, IsOfficer, IsWorker, IsSupervisor, IsMunicipalAdmin) plus object-level checks (e.g. officer only sees own department), and apply them to every viewset.
4. Seed management command: 6 departments (Electrical, Roads & Infrastructure, Water Supply, Sanitation, Traffic, Parks & Gardens) + Other, the issue categories from summary.md with configurable category->department mapping, SLA defaults, and one demo user per role.
5. Frontend: Login and Register pages (use the hero-gradient side panel), auth context, protected routes, role-based redirect to the correct dashboard shell.

Acceptance:
- [ ] Each seeded role logs in and lands on its own empty dashboard
- [ ] A citizen cannot call department/admin endpoints (403 verified by test)
- [ ] Passwords are hashed, tokens expire, auth is rate-limited
- [ ] `python manage.py migrate` and the seed command (`python manage.py seed_demo`) run clean on a fresh database
```

### PHASE 2 — Citizen Issue Reporting

```
PHASE 2: Citizen "Report Issue" flow (mobile-first).

Tasks:
1. Multi-step form: Category -> Photos/Video -> Location -> Description -> Review & Submit. Use a simple stepper with plain React state and basic validation.
2. Media: multiple photo upload, optional video, "Take Photo" (camera capture) and "Upload from Gallery" options, previews with remove.
3. Location: "Use my current location", address search, tap-on-map to select, and a draggable marker (Leaflet + OSM). Store lat, lng, address text, and location capture time.
4. Show the recommended department live, based on the category mapping.
5. Backend: POST /issues (DRF MultiPartParser) with multipart upload. Validate file signature, MIME, size, dimensions, corrupt files. Store files via Django's storage API (local FileSystemStorage). Generate the SC-YYYY-NNNNN ID and set status SUBMITTED with server timestamp. Record capture source (camera vs gallery).
6. Success screen showing the issue ID in IBM Plex Mono and a "Track this issue" button.

Acceptance:
- [ ] A citizen can submit an issue with 3 photos and a map location on a phone-sized screen
- [ ] Invalid or oversized or disguised files are rejected by the server with clear messages
- [ ] Issue appears in the database with SUBMITTED status, files in storage, and a StatusHistory row
```

### PHASE 3 — Routing, Citizen Tracking, and Notifications

```
PHASE 3: Department routing, "My Issues", issue detail, and in-app notifications.

Tasks:
1. On submission, route the issue to the department from the configurable category mapping and move status to UNDER_REVIEW when a department opens it (or per config).
2. Citizen dashboard "My Issues" with tabs: Submitted, Under Review, In Progress, Resolved, Rejected, Reopened.
3. Issue detail page: images, map, status Timeline (vertical stepper with timestamps), assigned department, and department/worker updates.
4. Notification system (in-app): bell icon with unread count, notification list, mark as read. Create notifications for every lifecycle event listed in the spec.
5. Implement the lifecycle state machine module in the backend with allowed transitions per role. Write tests for legal and illegal transitions.

Acceptance:
- [ ] Citizen sees live status and timeline for each issue
- [ ] Notifications fire on every transition and display correctly
- [ ] State machine rejects illegal transitions (test passes)
```

### PHASE 4 — Department Dashboard (Accept / Reject / Review)

```
PHASE 4: Department Officer dashboard (desktop-first).

Tasks:
1. Dashboard overview cards: New Requests, Under Review, Accepted, Assigned, On the Way, In Progress, Done, Awaiting Verification, Resolved, SLA Breached.
2. Issue queue table with filters (status, priority, category, date), search, sorting, and pagination.
3. Issue review drawer/page: gallery, video, description, map, evidence info placeholder, citizen report count placeholder.
4. Accept action, and Reject action with a REQUIRED reason from the configured list (invalid evidence, duplicate, outside responsibility, insufficient information, not found after inspection, other) plus optional "recommend correct department" which re-routes the issue.
5. Priority confirm/change (permission-gated) with audit entry.
6. Every action updates status, StatusHistory, AuditLog, and sends a citizen notification.

Acceptance:
- [ ] Officer sees only their own department's issues
- [ ] Rejecting without a reason is impossible (UI and API)
- [ ] Re-routing moves the issue to the other department's queue
```

### PHASE 5 — Worker Assignment and Worker Mobile View

```
PHASE 5: Assign work and build the worker experience.

Tasks:
1. Supervisor/officer can assign or reassign an ACCEPTED issue to a worker in the same department (show worker workload next to each name). Status becomes ASSIGNED.
2. Worker app view (mobile-first, minimal, large tap targets): "My Tasks" list, then task detail with issue photos, description, priority badge, map, distance, and a Navigate button (opens the maps app with the coordinates).
3. Worker status buttons in order: On the Way -> Arrived -> Start Work -> (In Progress with notes) -> Complete Work. Show only the next valid action.
4. Optional: worker location recorded when pressing Arrived.
5. All transitions go through the state machine with audit + citizen notifications.

Acceptance:
- [ ] A worker only sees tasks assigned to them
- [ ] The worker cannot skip states or mark VERIFIED/CLOSED
- [ ] Citizen sees "Worker on the way" and "Work started" updates in real time (polling is fine)
```

### PHASE 6 — Completion Evidence, Verification, Feedback, Reopen

```
PHASE 6: Proof of work, verification, closure, and citizen confirmation.

Tasks:
1. Worker "Complete Work" form: after photo(s), optional before photo, work description, materials used, auto completion timestamp, and current location. DONE is blocked without at least one after photo and a description.
2. Supervisor verification screen: side-by-side BEFORE / AFTER viewer, work notes, completion location/time. Actions: Verify or Reject completion (with reason, sends back to IN_PROGRESS).
3. On VERIFIED the system moves the issue to CLOSED after citizen confirmation or a configurable timeout.
4. Citizen sees "Was your issue actually resolved?" with YES / NO and the Before -> After view. NO = REOPEN with new photo, comment, and updated description. YES = 1-5 star rating, satisfaction, optional comment.
5. Reopened issues return to the department queue flagged as REOPENED.

Acceptance:
- [ ] The full end-to-end scenario from section 43 of summary.md works from SUBMITTED to CLOSED
- [ ] A citizen can reopen and the department sees it flagged
- [ ] Feedback is stored and visible to the department
```

### PHASE 7 — Basic Admin Dashboard and Audit Trail (MVP complete)

```
PHASE 7: Municipal Admin basics and audit trail. This completes the MVP.

Tasks:
1. Admin overview: Total, Active, Critical, Rejected, Resolved, Reopened issue counts and a recent-activity list.
2. Management screens: Departments, Users and Roles, Issue Categories with category->department mapping, SLA/priority configuration.
3. All-issues table with filters.
4. Per-issue Audit Trail view showing every action in time order (as in section 34), with actor, role, action, and timestamp. Admin-only.
5. Basic charts with Recharts: issues by department, by category, by status. Use the approved palette only.
6. Seed realistic demo data (about 60 issues across statuses) via a script.

Acceptance:
- [ ] Admin can change a category->department mapping and the next issue routes accordingly
- [ ] Audit trail for an issue matches its status history exactly
- [ ] All 17 MVP features from section 40 are demonstrable
- [ ] Record a short click-through demo script in /docs/DEMO.md
```

---

## Advanced block (Phases 8–12): start only after the MVP is stable

### PHASE 8 — Evidence Verification Pipeline

```
PHASE 8: Evidence verification pipeline (backend service + UI panel).

Tasks:
1. Build a verification service run on every upload: file validation recap, EXIF extraction (capture time, GPS, device, dimensions), location consistency (complaint vs device vs image GPS using a configurable tolerance), timestamp consistency (EXIF vs submission vs server), basic manipulation indicators (recompression / error-level analysis), SHA-256 file hash and perceptual hash (pHash).
2. Compute Evidence Confidence 0-100 from weighted signals (weights in config). Bands: 90-100 High, 70-89 Medium, below 70 Manual Review.
3. Store results in EvidenceVerification. Create an "Evidence" panel on the officer review page: confidence badge, per-check results with plain wording ("Location appears consistent", "Possible location mismatch", "No obvious manipulation detected"), and a note that this is an indicator, not proof.
4. Low confidence sends the issue to a "Manual Review" queue. NEVER auto-reject.
5. Capture-now photos get a stronger "captured during reporting" signal.

Acceptance:
- [ ] Missing EXIF lowers confidence mildly but never blocks submission
- [ ] Re-uploading the same image raises "Possible duplicate/reused image"
- [ ] Wording never says real or fake anywhere in code or UI
```

### PHASE 9 — Duplicate Detection, Same-Problem Upvote, Spam Flags

```
PHASE 9: Duplicate issues and abuse signals.

Tasks:
1. Duplicate detection using distance radius, same category, perceptual-hash similarity, description similarity, and a time window (all configurable). Create DuplicateMatch records and a Master Issue with a "N citizen reports" counter.
2. Citizen UI: when a likely duplicate exists nearby, show it and offer "I have this problem too" instead of creating a new issue. Show "Affected citizens: N".
3. Upvotes/affected-count can raise suggested priority (suggestion only).
4. Officer UI: duplicate cluster view, merge/unmerge with audit.
5. Spam/abuse flags: excessive reports, repeated identical images, same-location repeats, rapid submissions, invalid files. Flag for review only, never auto-ban.

Acceptance:
- [ ] Three nearby pothole reports collapse into one master issue with count 3
- [ ] Officers can merge and unmerge, and history is preserved
```

### PHASE 10 — AI Classification, Department and Priority Recommendation

```
PHASE 10: AI assistance (recommendation only).

Tasks:
1. Create an AI service interface with a pluggable provider (start with a pretrained/zero-shot image classification model or a vision API behind one adapter). Output: detected issue type, confidence %, recommended category/department, suggested priority (LOW/MEDIUM/HIGH/CRITICAL), and short reasoning.
2. Store results in AIAnalysis. Failures must degrade gracefully: the workflow continues without AI.
3. UI: "AI suggestion" box (primary-100 background, sparkles icon) with confidence and clear human actions: Accept suggestion / Override. Overrides are audited.
4. Mismatch detection: if the citizen category differs from the AI result, show "Category mismatch - Manual Review Recommended".
5. Optional: NLP classification of the description, and AI before/after similarity as a hint only for supervisors.
6. Add a visible disclaimer: "AI suggestions are advisory. Final decisions are made by authorized staff."

Acceptance:
- [ ] Every AI output is displayed as a recommendation with a human decision control
- [ ] Turning AI off (config flag) leaves the whole workflow functional
- [ ] No AI result can change status, close, or reject an issue by itself
```

### PHASE 11 — SLA, Heatmap, Hotspots, and Analytics

```
PHASE 11: Monitoring and city intelligence.

Tasks:
1. SLA engine: compute deadline from priority at acceptance; show "SLA Remaining" or "SLA Breached by X hours" (amber for near breach, red for breached, with icon + text). A management command (run on a schedule or manually) flags breaches and notifies supervisors.
2. City Issue Map for admin: markers by category (icon + color from the approved palette), clustering, filters, and click popups showing Issue ID, category, priority, status, department, location, report count.
3. Heatmap and hotspot detection by grid/zone (issue density). Recurring-issue detection (same place + category repeating).
4. Admin analytics: totals, trends (weekly/monthly), average resolution time, issues by department/category/area/priority, SLA compliance, citizen satisfaction, department performance ranking.
5. Department analytics: pending, active, completed, SLA compliance, average resolution, worker workload, satisfaction.
6. Report export (CSV and printable PDF summary).

Acceptance:
- [ ] Breached issues appear in a dedicated "SLA Breached" view
- [ ] Heatmap highlights seeded hotspot zones
- [ ] Charts use only approved colors and the single data-fade gradient
```

### PHASE 12 — Hardening, Polish, and Demo Readiness

```
PHASE 12: Final quality pass. No new features.

Tasks:
1. Security review: authz on every endpoint, upload hardening, rate limits, CORS, Django security settings, secrets handling, and XSS checks. Use the ORM only, no raw SQL.
2. Design audit: scan the whole UI for forbidden fonts, colors, gradients, emojis, and inconsistent components; fix all.
3. UX audit: loading, empty, error, and success states on every screen; mobile checks at 360px for Citizen and Worker; keyboard and contrast checks.
4. Performance: image thumbnails, pagination, query indexes, lazy-loaded maps and charts.
5. Tests: state machine, RBAC, upload validation, duplicate detection, SLA calculation.
6. Documentation: README, architecture diagram, ER diagram, API docs, role guide, and /docs/DEMO.md with a 5-minute demo script following the section 43 scenario.
7. Seed a polished demo dataset and one-command setup.

Acceptance:
- [ ] Fresh clone to running app in under 10 minutes using the README
- [ ] Full demo script runs without errors
- [ ] Design audit reports zero violations
```

---

## Quick-fix prompt (use any time the agent drifts)

```
Stop. Re-read the DESIGN SYSTEM and AI-FEATURE RULES in the master prompt. Audit what you just built against them: fonts, color tokens, gradients (only hero-gradient and data-fade are allowed), icons (lucide only), emojis (none), shadows, radius, states, and AI wording (never "real"/"fake"). List every violation, fix them all, then continue the current phase only.
```
