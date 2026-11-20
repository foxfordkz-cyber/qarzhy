# Otbasy Budget

Family budget web app in Kazakh: record income and expenses, see this month's
totals, spending by family member and by category, and a demo mode for presentations.

Open the [live AI demo](https://foxfordkz-cyber.github.io/qarzhy/?demo=ai). Check or edit the proposed expense and press «Шығысты қосу». In history, «Көмекшіден сұрау» calculates the total for that person and category. The reply opens the exact records behind it. The [regular budget](https://foxfordkz-cyber.github.io/qarzhy/) opens in personal mode.

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

- **Live draft on the home screen.** Type a Kazakh or Russian phrase to preview the amount, person and category as you write. «Жазбаны тексеру» opens the editable entry form. An empty composer opens a sample draft in demo mode.
- **«ИИ-мен жазу»** in the entry form: type or say one phrase
  («Айгүл Магнумнан 12 500-ге азық-түлік алды») and the form fills itself:
  income/expense, amount, family member, category, description. The person checks and saves.
- **Category suggestion** under the description. For an exact repeat, the app can reuse the category from previous confirmed entries and labels its source. Conflicting earlier categories leave the choice to the model or the user.
- **On-device model** (`js/ai.js`): naive Bayes over word stems and character 3-grams,
  trained in the browser on 291 labelled Kazakh/Russian examples, plus a rule-based
  parser for amounts and names. The parser accepts digits and spoken amounts such as «он екі мың бес жүз теңге» or «двенадцать тысяч пятьсот тенге». It leaves ambiguous amounts for review. The local model only auto-selects a label with a model score of at least 0.60. Browser speech recognition may use the browser vendor’s speech service.
- **Budget questions** use the selected month. Ask «Кім ең көп жұмсады?» or «Сколько Айгүл потратила на продукты?». Exact amounts are computed on-device from the matching records. A quoted phrase searches descriptions. Other offline topics use labelled, predefined answers.
- **Gemini** (optional) through a Google Apps Script proxy (`apps-script/`), so the key is
  never in the page. Enabling it in personal settings sends the phrase or the question and budget totals to the proxy. The sample family always stays local. The site falls back to the
  on-device model when Gemini is not configured or does not answer.
- Quality: `node ai/eval.js` (results in `ai/metrics.txt`): 86% accuracy on a fresh
  hold-out set never used for tuning, 28/28 test phrases parsed fully.

## Files

- `index.html` — page markup.
- `css/style.css` — styles.
- `js/app.js` — app logic (plain JavaScript, no libraries).
- `js/ai.js` — on-device AI model and phrase parser.
- `js/budget-query.js` — interpretation of local ledger questions.
- `ai/eval.js`, `ai/metrics.txt` — model evaluation.
- `node --test ai/regression.test.js` — spoken amounts, ambiguous inputs and question filters.
- `apps-script/` — Gemini proxy for Google Apps Script and setup steps.

Data is stored in the browser's `localStorage` under `otbasy-budget:v1:*`
(records, goal, limits, reminders, flags, theme). Demo data is generated in memory
and never written there.

No build step. Open `index.html` locally or serve it with GitHub Pages
(Settings → Pages → Deploy from a branch → this branch, `/ (root)`).
After the first online visit on HTTPS or localhost, the service worker caches the HTML, CSS and JavaScript so the site and the AI demo can also reopen offline. Only static application files are cached.
