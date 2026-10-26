# 🏛️ IIIT Pune Campus Connect — Official Unified Student & ERP Portal

An institutional-grade, full-stack **Smart Campus ERP & Student Life Portal** developed for the **Indian Institute of Information Technology Pune** (Autonomous Institute under Ministry of Education, Govt. of India).

Designed with a modern 3-pillar architecture, real-time WebSocket communication, automated eligibility engines, AI-powered roommate matching, and institutional security controls.

---

## 🌟 Core Pillars & Feature Breakdown

```
                    🏛️ IIIT Pune Official Campus Connect
                                      │
   ┌──────────────────────────────────┼──────────────────────────────────┐
   │                                  │                                  │
🎓 Academic Portal              🏢 Hostel Management          🏛️ Campus Life & Grievances
 • Targeted Placement CRM        • Digital In/Out Pass        • Lost & Found Community Hub
 • Academic Noticeboard          • Digital Leave System       • Grievance Redressal (Anonymous)
 • Registration & Fee Payment    • Mess Headcount Intel       • Official SOS & Emergency Desk
 • Attendance & Calendar         • Problem Ticketing & Proof  • Anti-Ragging & Hospital Hotline
 • No-Dues Clearance Tracker     • Roommate Match & Bed Grid  • Harneshwar Tie-Up Hospital
```

### 1. 🎓 Academic Portal
- **Targeted Placement & Internship Drive Manager (CRM)**:
  - Replaces messy WhatsApp announcements and Google Sheet chaos with a direct institutional CRM.
  - **Automated Eligibility Engine**: Automatically cross-references verified student records (CGPA, active backlogs, department, graduating batch) against criteria from companies like **Google**, **Microsoft**, **NVIDIA**, and **Goldman Sachs**.
  - **1-Click Application & Interview Pipeline**: Tracks stages (*Applied → OA Shortlisted → Tech Round → HR*) with integrated interview room links.
- **Academic Circulars & Examination Notices**:
  - Official notices including the **Navratri 9-Day Traditional Dress Code Circular**, Mid-Sem examination datesheets, and Smart India Hackathon nominations.
- **Semester Registration & Roommate Onboarding**:
  - Online fee receipt upload and multi-stage institutional clearance with integrated lifestyle matching.
- **Daily Attendance & Academic Calendar**:
  - Interactive lecture calendar with subject-wise percentages, shortage indicators ($\le 75\%$), and daily presence logs.
- **15-Department No-Dues Clearance Tracker**:
  - Paperless single-window clearance across Library, Hostels, Accounts, Laboratories, Sports, and Administration.

### 2. 🏢 Hostel Management
- **Smart Roommate Matching & Bed Allotment**:
  - **Lifestyle Survey**: Captures sleep rhythm (*Early Riser vs. Night Owl*), study atmosphere (*Quiet vs. Collaborative*), cleanliness habits, diet, and AC preference.
  - **Vector Compatibility Algorithm**: Computes lifestyle compatibility scores (e.g. 96% match with peers).
  - **Interactive Bed Allocation Matrix**: Visual grid of rooms and beds (e.g. Block B, Rooms 201–204, Bed A/B) allowing students to select and lock vacant beds alongside compatible roommates.
- **Mess Intelligence & Food Waste Reduction**:
  - Dynamically calculates exact required portions for *Breakfast, Lunch, Snacks, and Dinner* by automatically deducting students on approved leaves or logged as outside via the digital gate.
- **Problem Ticketing with Verified Proof of Resolution**:
  - Categorized tickets (Plumbing, Electrical, Wi-Fi, Carpentry).
  - Enforces mandatory **Proof of Resolution** (work verification photo link, maintenance remarks, resolver credentials, and resolution timestamp) before tickets can be marked resolved.
- **Digital In/Out Pass & Outstation Leave**:
  - Instant gate movements logging with real-time inside/outside campus headcount monitors.

### 3. 🏛️ Campus Life & Grievances (Common Hub)
- **Lost & Found Community Hub**:
  - Cross-campus directory accessible to all students and staff. Supports item categorization, photos, location tags, 1-click claims, and resolution confirmation.
- **Institutional Grievance Redressal**:
  - Secure grievance submission with an **Anonymous Identity Masking Toggle** to protect student identity while ensuring prompt committee review.
- **24x7 Emergency & Health Desk**:
  - Quick dial access to **Campus Ambulance (+91 9826381867)**, empanelled **Harneshwar Multispeciality Hospital**, Chief Hostel Warden, and Security Control Room.

---

## 🔐 Authentication & Official Login Credentials

The portal features role-based access control (RBAC) enforced with JWT authentication and bcrypt password hashing.

### 👨‍🎓 Student Accounts (Password is MIS Number)
> **Default Policy**: For all enrolled students, your default password is your **9-Digit MIS Number** (Roll Number).

| Role | Username / MIS / Email | Default Password | Notes |
|:---|:---|:---|:---|
| **Student** | `112415079` *(or `112415079@cse.iiitp.ac.in`)* | `112415079` | Harshit Nagpal (B.Tech CSE, Sem 3) |
| **Student** | `112415001` *(or `112415001@cse.iiitp.ac.in`)* | `112415001` | A Sanjhanaa (B.Tech CSE) |
| **Student** | `112416001` *(or `112416001@ece.iiitp.ac.in`)* | `112416001` | ECE Student (B.Tech ECE) |
| **Graduating Student** | `112001001` | `112001001` | Aarav Verma (Finalist for No-Dues) |

### 👔 Faculty & Administration Accounts

| Role | Email / Identifier | Default Password | Access Level |
|:---|:---|:---|:---|
| **Chief Hostel Warden** | `warden@iiitp.ac.in` | `warden123` | Hostel leaves, In/Out gate monitor, problem tickets & proof verification, mess intelligence |
| **Chief Security Admin** | `admin@iiitp.ac.in` | `admin123` | Live Incident Command, ERT dispatch, system administration |
| **Faculty Advisor** | `advisor.cse@iiitp.ac.in` | `advisor123` | Semester registration approval, student attendance alerts |
| **Clearance Officer** | `clearance.officer@iiitp.ac.in` | `officer123` | No-Dues department clearance approvals & certificate issuance |
| **Security Control** | `security@iiitp.ac.in` | `security123` | Gate In/Out monitoring, dispatch assistance |

*Tip: The login page includes interactive **1-Click Auto-Fill** cards to immediately load credentials for any role.*

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
|:---|:---|
| **Frontend** | React 19, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client, Leaflet, Recharts |
| **Backend** | Node.js (ES Modules), Express.js, Socket.IO, Multer, bcryptjs, jsonwebtoken |
| **Database & ORM** | SQLite (development/demo) / PostgreSQL (production), Prisma ORM |
| **Architecture** | Monorepo with unified single-server production deployment capability |

---

## 🚀 Local Development Setup

### Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x

### Quickstart (3 Steps)

1. **Clone the repository**:
   ```bash
   git clone https://github.com/harshit24nagpal-dotcom/Student-Portal-IIITP.git
   cd Student-Portal-IIITP
   ```

2. **Install all dependencies & setup database**:
   ```bash
   # Install root, backend, and frontend packages
   npm run install:all

   # Initialize Prisma DB schema & seed sample dataset
   npm run db:setup
   ```

3. **Launch dev servers**:
   ```bash
   npm run dev
   ```
   - **Frontend App**: `http://localhost:5173`
   - **Backend API**: `http://localhost:5000`
   - **Health Check**: `http://localhost:5000/health`

---

## 🌐 Production Cloud Deployment Guide

This project is configured for seamless deployment on cloud hosting providers.

### Option 1: Monolithic Deployment on Render (Recommended)
1. Fork or push this repository to GitHub.
2. In [Render Dashboard](https://dashboard.render.com), click **New +** → **Web Service**.
3. Select this repository (`Student-Portal-IIITP`).
4. Configure service settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build:deploy`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `NODE_ENV`: `production`
     - `DATABASE_URL`: `file:./dev.db`
     - `JWT_SECRET`: `<any-strong-secret-key>`
5. Click **Deploy Web Service**. Render will automatically build the Vite React frontend, run Prisma migrations, seed the full dataset, and serve the application on a single secure URL with WebSocket support.

### Option 2: Monolithic Deployment on Railway
1. Go to [Railway.app](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repo** and choose `Student-Portal-IIITP`.
3. Set the environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key`
4. Railway will automatically detect `package.json`, run `npm run build:deploy`, and start the app via `npm start`.

### Option 3: Split Deployment (Vercel Frontend + Render Backend)
- **Backend (Render / Railway)**: Deploy the `backend/` directory as a Node service. Note the backend URL (e.g., `https://iiitp-api.onrender.com`).
- **Frontend (Vercel / Netlify)**:
  - Root directory: `frontend`
  - Build command: `npm run build`
  - Output directory: `dist`
  - Environment Variable: `VITE_API_URL=https://iiitp-api.onrender.com`

---

## 🛡️ Security & Access Control Matrix

| Route Endpoint | HTTP Method | Required Role | Functionality |
|:---|:---|:---|:---|
| `/api/auth/login` | POST | Public | Authenticate via MIS or Email |
| `/api/placement/drives` | GET | STUDENT, ADMIN, FACULTY | List drives with dynamic CGPA/backlog eligibility |
| `/api/placement/apply/:id`| POST | STUDENT | One-click verified drive application |
| `/api/roommate/preference`| GET/POST | STUDENT | Complete lifestyle survey & query allotment |
| `/api/roommate/allocate` | POST | STUDENT | Select and lock bed in hostel room matrix |
| `/api/hostel/tickets` | POST | STUDENT | Raise maintenance ticket |
| `/api/hostel/tickets/:id/resolve` | PUT | HOSTEL_WARDEN, ADMIN | Resolve ticket with mandatory proof |
| `/api/hostel/mess/headcount` | GET | All Authenticated | Compute real-time mess diners & waste reduction |
| `/api/complaints/all` | GET | ADMIN, HOSTEL_WARDEN, SECURITY | Grievance audit with anonymous mask protection |
| `/api/announcements` | POST | Staff / Admins / Wardens | Issue official circulars to Academic/Hostel portals |

---

## 🏛️ Official Institutional Contacts

- **Campus Emergency Ambulance**: `+91 9826381867`
- **Empanelled Hospital**: [Harneshwar Multispeciality Hospital](https://www.harneshwarhospital.com/) (`+91 20 2742 2222`)
- **Chief Hostel Warden**: `+91 98230 12345` (`warden@iiitp.ac.in`)
- **Campus Security Control Room**: `020-23456789`
- **Student Grievance Cell**: `020-23456711`

---

**Developed for Indian Institute of Information Technology Pune • Academic Year 2026-27**
