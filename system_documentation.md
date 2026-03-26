# HRMS System Documentation

## 1. System Overview
The Harmony-HR system is a modern Human Resource Management System (HRMS) built to streamline HR operations within an organization. It handles employee management, attendance, leave tracking, recruitment, training, performance, and more. 

The application uses a modern React-based Single Page Application (SPA) structure, powered by a robust backend utilizing Supabase (PostgreSQL + Auth + Storage).

## 2. Technology Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Routing:** React Router DOM (v6)
- **State Management & Data Fetching:** `@tanstack/react-query` for server state, React Context API for global UI/Auth state.
- **Styling:** Tailwind CSS with utility extensions (`tailwind-merge`, `clsx`, `class-variance-authority`).
- **UI Components:** Shadcn UI (Radix UI primitives for accessible components like dialogs, popovers, selects, etc.).
- **Forms & Validation:** `react-hook-form` paired with `zod` schema validation.
- **Charts:** Recharts.
- **Icons:** Lucide React.

### Backend & Database (Supabase)
- **Database:** PostgreSQL (Supabase managed).
- **Authentication:** Supabase Auth (Email/Password).
- **Row Level Security (RLS):** Policies enforced at the database level.
- **APIs:** Auto-generated Supabase REST/GraphQL APIs leveraging the generated [types.ts](file:///c:/Users/Nico/harmony-hr-main/src/integrations/supabase/types.ts) schemas.

---

## 3. Core Modules & Features

- **Dashboard:** Overview of HR metrics.
- **Employee Management:** Directory, profiles, historical data, and role tracking.
- **Departments:** Organization structuring and manager assignment.
- **Attendance:** Time-in/time-out tracking and reporting.
- **Leave Management:** Leave requests, types, approval workflows.
- **Recruitment:** Job postings and applicant tracking (resumes, interview scheduling, ratings).
- **Training & Onboarding:** Training programs, enrollments, onboarding checklists and tasks.
- **Activity & Announcements:** System-wide activity logs, notifications, and internal company announcements.
- **System Settings:** User management, role mappings, and organization preferences.

---

## 4. Security Architecture & Features

The system incorporates security at multiple levels ranging from UI constraints down to database Row-Level Security.

### 4.1 Authentication Management
- **Provider:** Managed securely via Supabase Auth.
- **Session Handling:** Token persistence securely handled by the Supabase client logic with auto-refresh mechanism (`@supabase/supabase-js`).
- **Context Awareness:** The application uses [AuthContext.tsx](file:///c:/Users/Nico/harmony-hr-main/src/contexts/AuthContext.tsx) to listen to real-time `onAuthStateChange` events, instantly logging out users when a session is revoked or expired.
- **Strong Password Enforcement:** During signup, passwords strictly require:
  - Minimum 8 characters.
  - At least 1 uppercase letter.
  - At least 1 lowercase letter.
  - At least 1 numeric digit.
  - At least 1 special character.

### 4.2 Route Protection
- **Guarded Routes:** A robust `<ProtectedRoute />` component wraps all core HR modules. It strictly validates the presence of an active session. If unauthenticated, users have no access to the application’s components structure and are entirely redirected to the `/auth` page.

### 4.3 Role-Based Access Control (RBAC)
The overarching authorization framework restricts visibility and actions depending on a user's defined role.
- **Roles Defined:** The database maintains an enum `app_role` containing:
  - `admin`
  - `hr_manager`
  - `employee`
- **Role Assignment:** Regulated via the `user_roles` database table. Changing roles uses strict backend mutations (deleting the old role reference and inserting the new one) restricted to administrators in [UserManagement.tsx](file:///c:/Users/Nico/harmony-hr-main/src/pages/UserManagement.tsx).
- **Database-Level Role Checks:** A securely defined PostgreSQL function `has_role(_role, _user_id)` dynamically grants/denies access at the table query level, preventing users from spoofing UI states to access arbitrary data.

### 4.4 Data Security & Persistence
- **Row-Level Security (RLS):** The integration with Supabase mandates that data access rules are executed securely on the PostgreSQL server. Even if a user extracts out API keys or attempts manual requests, RLS policies dictate that they can only select, insert, or update data permitted by their exact schema role (`hr_manager` vs `employee`).
- **Activity Logging:** Critical changes within the HR platform are structurally audited. The `activity_logs` table catalogs the exact timestamp, `user_id`, `action`, IP address (when available), and associated JSON details.

### 4.5 Environmental Security
- **Secure Key Storage:** Supabase URL and Publishable Keys are securely referenced via restricted `VITE_` prefixed environment properties during the build.
- **Input Sanitization:** Every form entry validates against rigorous typed schemas via Zod (`zod`), significantly decreasing risks associated with prototype pollution, XSS, or SQL injections when feeding data back to Supabase.
