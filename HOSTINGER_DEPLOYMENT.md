# Tutor Monk - Hostinger Deployment (Node.js + MariaDB)

Backend = Express + **MariaDB/MySQL (SQL only)**. Frontend = React (Vite).
Everything (website + API) runs as ONE Node.js app.

## 1. Create the database (hPanel)
1. hPanel -> **Databases -> Management** -> create database + user + password.
2. Note the 3 values: DB name, DB user (both look like `u123456789_xxx`) and the password.

> Optional: phpMyAdmin -> Import -> `server/mariadb-schema.sql`.
> You can skip it: the app creates all tables automatically on first start.

## 2. Build the project
Locally (Node 20 or 22):
```bash
npm install
npm run build        # creates dist/ (frontend + dist/server.js)
```

## 3. Upload
Upload these to the Node.js app folder (zip -> File Manager, or Git):
```
dist/                 <- built output
server/mariadb-schema.sql
package.json
```
(If you use Git deploy, Hostinger can run `npm install && npm run build` itself.)

## 4. Create the Node.js app (hPanel -> Websites -> Add Website / Node.js)
- Node version: **22.x** (minimum 20.19 - Vite 8 will not build on older Node 20)
- Install command: `npm install`
- Build command: `npm run build` (skip if you uploaded `dist/` already)
- Entry/start file: `dist/server.js`  (start command `npm start`)
- Environment variables: copy everything from `.env.example` and fill real values
  (**DB_*, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, NODE_ENV=production**)

Deploy / Restart.

## 5. First run check
- Open `https://YOUR-DOMAIN/api/health` -> should show `"database":"connected"`.
- Open the site -> Portal -> log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
- Book a demo from the website -> it appears in Admin -> "Demo Booking Queue".

## Troubleshooting
| Problem | Fix |
|---|---|
| `database: disconnected` | Check DB_USER / DB_PASSWORD / DB_NAME. Try `DB_HOST=127.0.0.1` instead of `localhost`. |
| `ER_ACCESS_DENIED` | Wrong password, or the DB user is not assigned to that database in hPanel. |
| App crashes: `JWT_SECRET ... required` | Add JWT_SECRET in environment variables. |
| Blank page / `index.html not found` | `dist/` missing - run `npm run build` and upload `dist/`. |
| Changed env variables | Restart the Node.js app. |
| Admin cannot log in (password set after first start) | The admin is created only once. Add `RESET_ADMIN_PASSWORD=true` + `ADMIN_PASSWORD=...`, restart, log in, then remove `RESET_ADMIN_PASSWORD`. |
| Login says `Internal server error` | Database not connected - open `/api/health` and fix DB_* values first. |
| Login says `Too many requests` | Wait 15 minutes (limit is per IP). |
| `esbuild: not found` / `vite: not found` during build | Fixed in package.json (esbuild now in dependencies). Make sure you uploaded the new package.json. |
| `ECONNREFUSED ::1:3306` | Use `DB_HOST=127.0.0.1` (code now converts localhost automatically). |
| `Unsupported engine` / Vite error | Select Node 22.x in hPanel. |

## Passwords
- First admin: set `ADMIN_EMAIL` + `ADMIN_PASSWORD` in env before first start (if you forget, a temporary password is printed in the app logs).
- New users: Portal -> Admin -> **Users & Passwords** -> Create user. A temporary password is shown once; the user must change it.
- Forgot a password: same screen -> **Reset password** (admin gives the new temp password to the user).
- Forgot the ADMIN password itself: run `node scripts/hash-password.mjs "NewPass123"`, copy the hash, open phpMyAdmin -> `users` -> edit admin row -> paste in `password_hash`.

## Upload with WinSCP
Host = FTP/SFTP details from hPanel (Files -> FTP Accounts), upload into the Node app folder (for example `domains/yourdomain.com/nodejs/`). Upload `dist/`, `package.json`, `server/mariadb-schema.sql`, then Restart in hPanel.

## How to run the school (everything is saved in SQL)
1. Log in as admin -> **Users & Passwords** -> create Tutor and Student.
2. Give the temporary password to the user. At first login the portal forces them to choose their own password (lock icon in the top bar changes it later).
3. Admin -> **Classes & Billing**: (1) enroll student with tutor + course, (2) schedule a class (date/time + Meet/Zoom link), (3) add courses, (4) create invoices and mark them paid.
4. Tutor login: sees own classes, can mark a class completed, add remarks, assign and grade homework.
5. Student login: sees classes + Join button, progress, homework (submit), invoices.
Note: demo "Instant Test Login" buttons exist only in development (`npm run dev`), never in production.
