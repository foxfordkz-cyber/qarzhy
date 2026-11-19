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

## AI

- **«ИИ-мен жазу»** in the entry form: type or say one phrase
  («Айгүл Магнумнан 12 500-ге азық-түлік алды») and the form fills itself:
  income/expense, amount, family member, category, description. The person checks and saves.
- **Category suggestion** while typing a description.
- **On-device model** (`js/ai.js`): naive Bayes over word stems and character 3-grams,
  trained in the browser on 291 labelled Kazakh/Russian examples, plus a rule-based
  parser for amounts and names. Works offline; data never leaves the device.
  Category is auto-selected only when the model is at least 60% sure.
- **Gemini** (optional) through a Google Apps Script proxy (`apps-script/`), so the key is
  never in the page. Used for phrase parsing and the assistant; the site falls back to the
  on-device model when Gemini is not configured or does not answer.
- Quality: `node ai/eval.js` (results in `ai/metrics.txt`): 86% accuracy on a fresh
  hold-out set never used for tuning, 28/28 test phrases parsed fully.

## Files

- `index.html` — page markup.
- `css/style.css` — styles.
- `js/app.js` — app logic (plain JavaScript, no libraries).
- `js/ai.js` — on-device AI model and phrase parser.
- `ai/eval.js`, `ai/metrics.txt` — model evaluation.
- `apps-script/` — Gemini proxy for Google Apps Script and setup steps.

Data is stored in the browser's `localStorage` under `otbasy-budget:v1:*`
(records, goal, limits, reminders, flags, theme). Demo data is generated in memory
and never written there.

No build step. Open `index.html` locally or serve it with GitHub Pages
(Settings → Pages → Deploy from a branch → this branch, `/ (root)`).
