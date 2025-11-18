# Beginner Diagnostic Guide for Birch Lounge

This walkthrough is written for someone with no app development background. Follow each step in order. Commands shown in code blocks should be run in a terminal from the project folder (`birch-lounge-app`).

## 1) Install prerequisites
- **Node.js 20+** (required to run the tools). If you do not have it, install it from <https://nodejs.org/> and reopen your terminal.
- **Yarn** package manager (used for all project commands). Install it once via:
  ```bash
  corepack enable
  ```

## 2) Get the project files ready
1. Open a terminal and change into the project folder:
   ```bash
   cd /path/to/birch-lounge-app
   ```
2. Copy the example environment file so required settings exist:
   ```bash
   cp .env.example .env.local
   ```
   - This works even if you do not yet have Supabase or Google keys; leave those values empty for now.

## 3) Install project dependencies
Run once after cloning the repo or whenever `package.json` changes:
```bash
yarn install
```
This downloads all JavaScript and TypeScript libraries the app needs.

## 4) Run code quality checks (quick health check)
Each command should print **no errors** when things are healthy. Run them in this order:
1. **Lint** (finds style or obvious code issues):
   ```bash
   yarn lint
   ```
2. **Type check** (catches TypeScript typing mistakes):
   ```bash
   yarn type-check
   ```
3. **Unit tests** (verifies functions and components):
   ```bash
   yarn test
   ```
   - If tests fail, read the error message shown in the terminal. Start fixing the first error before rerunning.

## 5) Build the app (ensures it can ship)
```bash
yarn build
```
- Success means the frontend can compile for production.
- If it fails, copy the first error message and fix that file before rerunning.

## 6) Try the app in the browser
1. Start the development server:
   ```bash
   yarn dev
   ```
   - Leave this command running; it shows live logs.
2. Open the printed local URL (for example `http://localhost:5173`) in your browser.
3. Click through the pages to confirm buttons, forms, and menus respond. If you see errors in the browser or terminal, copy the message, stop the server with `Ctrl+C`, fix the issue, and restart from step 6.1.

## 7) When you fix something, retest in the same order
- After any code change, rerun: `yarn lint`, `yarn type-check`, `yarn test`, `yarn build`, then `yarn dev` for manual checks.
- Address failures one at a time from top to bottom.

## 8) Asking for help
If you get stuck, share:
- The exact command you ran.
- The full error message (copy/paste).
- Any file path mentioned by the error.

With that information, another developer—or this assistant—can guide you to the next fix.
