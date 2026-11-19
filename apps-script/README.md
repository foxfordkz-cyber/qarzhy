# Gemini proxy (Google Apps Script)

The site works without it: phrases are parsed and categorised by the on-device model.
With the proxy, phrase parsing and the assistant use Gemini, and the key stays inside Google Apps Script.

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
   To make it the default for everyone, put the URL into `AI_DEFAULT_ENDPOINT` in `index.html`.

Limits: 40 requests per minute in total (`MAX_PER_MINUTE`), so a leaked URL cannot burn the quota quickly.
