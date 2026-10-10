# SmartCivic Platform — Complete Demonstration Guide

SmartCivic is a municipal grievance redressal and field workforce automation platform built with Django REST Framework, React (Vite, TypeScript, TailwindCSS), Leaflet mapping, and role-based access control.

---

## 🔑 Demo Role Credentials

All seeded demo accounts share the password: **`pass123`**

| Role | Username | Password | Department / Scope | Key Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen** | `citizen` | `pass123` | Citizen Portal | Report grievances with GPS map pin, track live SLA countdown, submit 5-star feedback or reopen tickets |
| **Department Officer** | `officer` | `pass123` | Roads & Infrastructure | Triaging command center, accept/reject with statutory reasons, reroute departments, assign field workers |
| **Field Worker** | `worker` | `pass123` | Roads & Infrastructure | Mobile-first task execution (`On the Way` → `Arrived` → `Work Started` → `In Progress`), GPS navigation, upload After-repair proof |
| **Supervisor** | `supervisor` | `pass123` | Roads & Infrastructure | Side-by-side Before/After photo inspection, quality verification, reject rework back to field worker |
| **Municipal Admin** | `admin` | `pass123` | City-wide Governance | Executive analytics charts, Category-to-Department dynamic routing engine, SLA matrix, immutable forensic audit ledger |

---

## 🚀 Quick Start (Running Locally)

### 1. Start the Backend API Server
```powershell
cd backend
..\venv\Scripts\python.exe manage.py runserver 127.0.0.1:8000
```

### 2. Start the Frontend Dev Server
```powershell
cd frontend
npm run dev
```
Open **http://localhost:5173** in your web browser.

---

## 🔄 End-to-End Walkthrough Scenario

Experience the full lifecycle of a civic issue from initial citizen submission to final verification and closure:

### Step 1: Citizen Reports an Issue
1. Log in as **`citizen`** (`pass123`).
2. Click **"Report New Issue"** in the top navigation.
3. **Step 1 (Category):** Choose **"Potholes & Road Damage"**.
4. **Step 2 (Location):** Click on the interactive Leaflet map to drop a pin on a road or search for an address.
5. **Step 3 (Media Evidence):** Upload a photo of the road defect.
6. **Step 4 (Details):** Enter a title like *"Dangerous Craters on MG Road Junction"* and set priority to High.
7. **Step 5 (Review & Submit):** Confirm details and click **"Submit Grievance"**.
8. Note the generated tracking token (e.g., `SC-2026-00069`).

### Step 2: Department Officer Triages & Dispatches Worker
1. Sign out and log in as **`officer`** (`pass123`).
2. Notice the live SLA countdown timers and department workload counters.
3. Click on the newly submitted issue in the **"Submitted / Triage"** tab.
4. Click **"Start Review"** to move the issue to `UNDER_REVIEW`.
5. Click **"Accept & Dispatch"**, select worker **"Rajesh Kumar (Roads)"**, and confirm.
6. The issue immediately moves to `ASSIGNED` with status history and audit records updated.

### Step 3: Field Worker Executes Repair & Submits Proof
1. Sign out and log in as **`worker`** (`pass123`).
2. Open the **"Active Tasks"** queue to find the assigned work order.
3. Click **"Mark On The Way"** → **"Mark Arrived (GPS)"** → **"Start Work"**.
4. When work is finished, click **"Complete Work Order"**.
5. Upload the **After-Repair photo**, describe materials used (*"85kg hot-mix asphalt, compaction roller applied"*), and submit.
6. Issue status moves to `DONE`.

### Step 4: Supervisor Verifies Work Quality
1. Sign out and log in as **`supervisor`** (`pass123`).
2. Open the **"Awaiting Verification"** tab.
3. Click **"Inspect & Verify"** on the ticket.
4. Compare the **Reported Before Photo** against the **Worker After Photo** in the dual-viewer modal.
5. Enter inspection remarks and click **"Approve & Mark Verified"**.
6. Status updates to `VERIFIED`.

### Step 5: Citizen Confirms Resolution & Rates Quality
1. Sign out and log back in as **`citizen`** (`pass123`).
2. In the **"Resolved"** tab, click on the grievance.
3. View the completed repair proof photos and worker materials breakdown.
4. Select a **5-Star rating**, enter comments (*"Fast and clean asphalt repair!"*), and click **"Confirm Resolution & Close"**.
5. Issue status advances to `CLOSED`.

### Step 6: Municipal Administrator Master Oversight
1. Sign out and log in as **`admin`** (`pass123`).
2. **Executive Analytics:** View department-wise caseload bars, resolution rate percentages, and state distribution charts.
3. **Category Routing Engine:** Reconfigure default departments or SLA priorities for any civic grievance category with live updates.
4. **SLA Matrix Policy:** Review statutory response and turnaround deadlines.
5. **Master Audit Ledger:** Search the immutable audit trail by ticket number (e.g. `SC-2026-00069`) to inspect the entire cryptographic timeline of actors, IP addresses, state transitions, and notes.

---

## 🧪 Testing & Data Reset

- **Run Django Test Suite:**
  ```powershell
  cd backend
  ..\venv\Scripts\python.exe manage.py test
  ```

- **Re-seed Realistic Dataset (60+ Issues):**
  ```powershell
  cd backend
  ..\venv\Scripts\python.exe manage.py seed_realistic_data
  ```
