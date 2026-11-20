# Otbasy Budget

Family budget web app in Kazakh: record income and expenses, see this month's
totals, spending by family member and by category, and a demo mode for presentations.

Try the [two-entry demo](https://foxfordkz-cyber.github.io/qarzhy/?demo=batch). One phrase produces yesterday's grocery purchase of 12,500 ₸ and a taxi ride of 1,800 ₸. Review both drafts, change either amount and confirm. Open the two saved records from the history card. In the [single-entry demo](https://foxfordkz-cyber.github.io/qarzhy/?demo=ai), «Көмекшіден сұрау» calculates the total for that person and category and links to the underlying records.

## A shared budget on two phones

Open [Ортақ бюджет](https://foxfordkz-cyber.github.io/qarzhy/?family=1) and choose «Жаңа бөлме ашу». Open the invitation on the second phone and choose «Бөлмеге қосылу». Each room starts with an empty ledger. Members can add, edit and delete transactions, set category limits and goals, and mark reminders as paid. The status line shows when local changes have reached the server. Previously connected phones can queue edits offline.

Every invitation grants read and write access. The secret is in the URL fragment and stays on the devices. Web Crypto derives separate keys for the room address, access token and AES-GCM encryption. The relay stores encrypted snapshots and revisions. Personal and demo records use separate storage. In a shared room, text analysis and budget queries run on the device.

## Timed pilot

The [pilot](https://foxfordkz-cyber.github.io/qarzhy/pilot/) has six sample transactions in Kazakh and Russian. Participants enter three manually and three with AI. Active time pauses when the tab is hidden. Each participant sees their times, wrong confirmations and corrections before opting in to share anonymous measurements. The [public summary](https://foxfordkz-cyber.github.io/qarzhy/pilot/?results=1) shows submitted sessions and the median of participants' median times per method. The QA route (`?qa=1`) cannot submit a result.

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
  trained in the browser on 297 labelled Kazakh/Russian examples, plus a rule-based
  parser for amounts and names. The parser accepts digits and spoken amounts such as «он екі мың бес жүз теңге» or «двенадцать тысяч пятьсот тенге». It leaves ambiguous amounts for review. The local model only auto-selects a label with a model score of at least 0.60. Browser speech recognition may use the browser vendor’s speech service.
- **Budget questions** use the selected month. Ask «Кім ең көп жұмсады?» or «Сколько Айгүл потратила на продукты?». Exact amounts are computed on-device from the matching records. A quoted phrase searches descriptions. Other offline topics use labelled, predefined answers.
- **Several records in one phrase.** Up to eight recognizable entries can be reviewed and saved together. Dates such as «кеше» and «вчера» apply to following entries until another day is specified. A payment with change requires confirmation of the actual expense.
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
- Run the parser, synchronization, timing and API checks with Node.js 22.13 or newer using `node --test ai/*.test.js pilot/*.test.js service/*.test.mjs`.
- `js/family-room.js` handles client-side encryption and offline edits. `service/api.mjs` and `service/schema.sql` contain the deployed relay handler and its D1 schema. `js/service-config.js` selects the relay.
- `apps-script/` — Gemini proxy for Google Apps Script and setup steps.

Personal data is stored in the browser's `localStorage` under `otbasy-budget:v1:*`
(records, goal, limits, reminders, flags, theme). Demo data is generated in memory
and never written there.

The frontend has no build step. Use HTTPS or localhost for encrypted sharing and offline caching. The public frontend uses GitHub Pages
(Settings → Pages → Deploy from a branch → this branch, `/ (root)`).
After the first online visit on HTTPS or localhost, the service worker caches the HTML, CSS and JavaScript so the site and the AI demo can also reopen offline. Only static application files are cached.
