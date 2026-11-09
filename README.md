# Otbasy Budget

Family budget web app in Kazakh: record income and expenses, see this month's
totals, spending by family member and by category, and a demo mode for presentations.

Live demo: https://foxfordkz-cyber.github.io/qarzhy/ → «Мысалды көру», then «Турды бастау».

## Features

- Income and expense records with family member, category, note and date
  (past dates allowed); click a record in the history to edit it.
- Month switcher: every summary card can show any past month.
- Monthly trend: income vs expenses for the last 6 months; click a month to open it.
- Category limits: monthly caps per category, warnings at 80% and when exceeded.
- Reminders: one-off or monthly payments; «Төленді» records the expense automatically.
- History search plus income/expense filter.
- Financial goal, income-drop scenario, budget / goal / purchase / loan calculators,
  fraud checklist, achievements, articles and a rule-based assistant.
- Export to CSV (opens in Excel), JSON backup and restore.
- Demo mode with six months of sample data and a guided tour for presentations.
- Light and dark theme, phone and desktop layouts.

## Files

- `index.html` — page markup.
- `css/style.css` — styles.
- `js/app.js` — all app logic (plain JavaScript, no libraries).

Data is stored in the browser's `localStorage` under `otbasy-budget:v1:*`
(records, goal, limits, reminders, flags, theme). Demo data is generated in memory
and never written there.

No build step. Open `index.html` locally or serve it with GitHub Pages
(Settings → Pages → Deploy from a branch → this branch, `/ (root)`).
