# Emyris Onboard App — Mandatory Architectural Rules

## 1. Single Source of Truth for Admin Portal UI (React / Vite)
- **ALL Admin Portal UI, navigation, modals, and reporting tools MUST be developed inside frontend/src/ (specifically AdminPanel.tsx, ReportsTab.tsx, DoctorDetailingStudio.tsx, etc.).**
- **DO NOT** create, modify, or restore legacy Vanilla HTML/JS files (admin.html, admin-script.js, admin.css) in the root directory. They have been permanently archived in _legacy_archive/.
- After making any edits inside frontend/src/, you **MUST** run npm run build inside the frontend/ directory so that frontend/dist/ is compiled. server.js serves frontend/dist/index.html for all /admin* routes.

## 2. Portal URLs & Routing
- **Candidate / Applicant Portal**: https://emyrishr.in (served by index.html and script.js).
- **Admin Portal (React SPA)**: https://emyrishr.in/admin (served by frontend/dist/index.html).

## 3. Psychometric Reports & Manual Grading Parity
- Candidate mindset indices, trait breakdowns, executive archetypes, and 0-score manual evaluations (grade-exam) are fully supported directly within ReportsTab.tsx and the React backend routes (routes/admin.js, routes/applicant.js).
