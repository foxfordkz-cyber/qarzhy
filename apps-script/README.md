# Gemini proxy (Google Apps Script)

The site works without it: phrases are parsed and categorised by the on-device model.
Enabling the proxy sends typed phrases or general questions and budget totals to Gemini. Per-person and category lookups, the home preview and the sample family demo always run on the device. The key stays inside Google Apps Script.

1. Get a key at https://aistudio.google.com → **Get API key**.
2. Open https://script.google.com → **New project**, replace the code with `Code.gs` from this folder, save.
3. **Project Settings → Script properties → Add property**
   - `GEMINI_API_KEY` = your key
   - `GEMINI_MODEL` = `gemini-2.5-flash` (optional; use any model the key has access to)
4. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Allow access when Google asks, then copy the URL ending in `/exec`.
5. On the site: **Параметрлер → Жасанды интеллект (Gemini)** → paste the URL → **Сақтау және тексеру**.
   The check calls the model before saving the address. Clear the address and save to return to local-only mode. An operator can prefill the address through `AI_DEFAULT_ENDPOINT` in `js/app.js`. Each browser still enables it in Settings.

Limits: 40 requests per minute in total (`MAX_PER_MINUTE`), so a leaked URL cannot burn the quota quickly.
