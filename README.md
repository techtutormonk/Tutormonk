# Tutor Monk

React + Express + MariaDB (SQL).

```bash
npm install
cp .env.example .env   # fill DB_* , JWT_SECRET, ADMIN_*
npm run dev            # http://localhost:3000
npm run build && npm start
```
See HOSTINGER_DEPLOYMENT.md for hosting steps.

## Class calendar and time zones
- The portal has its own calendar (Day / Week / Month / List). Google Calendar is not used.
- Every class is stored in UTC. Each user has a country + timezone (Users tab). Classes are shown in the viewer's zone
  and in the student's local time. When scheduling you choose which zone you type the time in (India, teacher, student).
- Weekly repeats keep the same local time across daylight-saving changes.
