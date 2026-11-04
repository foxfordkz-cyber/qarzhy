# Otbasy Budget

Family budget web app in Kazakh: record income and expenses, see this month's
totals, spending by family member and by category, and a demo mode for presentations.

- Single self-contained file: `index.html` (inline CSS and JS, fonts from Google Fonts).
- Data is stored in the browser's `localStorage` under `otbasy-budget:v1:records`;
  demo data is generated in memory and never written there.
- No build step. Open `index.html` locally or serve it with GitHub Pages
  (Settings → Pages → Deploy from a branch → this branch, `/ (root)`).
