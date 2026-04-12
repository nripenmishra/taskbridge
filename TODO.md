# TaskBridge — personal to-do tracker

Update this file whenever you want. Use `- [ ]` for open items and `- [x]` for done.

---

## Google OAuth setup

- [X] Create a project in [Google Cloud Console](https://console.cloud.google.com/) (or pick an existing one).
- [ ] Enable **Google+ API** / **Google Identity** APIs if the console prompts you (OAuth consent screen may be required first).
- [ ] Configure **OAuth consent screen** (External or Internal; add app name, support email, developer contact).
- [ ] Create **OAuth 2.0 Client ID** credentials:
  - Application type: **Web application** (or the type that matches your local redirect).
  - **Authorized redirect URIs** — add exactly what you use in `.env` as `GOOGLE_CALLBACK_URL`, for example:
    - `http://localhost:4000/v1/auth/google/callback`
- [ ] Copy **Client ID** and **Client Secret** into your **`.env`** (not committed to git):
  - `GOOGLE_CLIENT_ID=...`
  - `GOOGLE_CLIENT_SECRET=...`
  - Confirm `GOOGLE_CALLBACK_URL` matches the URI you registered in Google Cloud.
- [ ] Start the API (`npm run dev:api`) and test:
  - Open `http://localhost:4000/v1/auth/google` in a browser (should redirect to Google, then back to your callback).
- [ ] (Optional) Add production redirect URIs later when you deploy (same value pattern, different host).

**Notes**

- Email/password auth works without Google; Google is optional until the steps above are done.
- If Google shows “redirect_uri_mismatch”, the URI in Google Cloud and `GOOGLE_CALLBACK_URL` must match **character for character** (including `http` vs `https` and path).

---

## Other tasks

_Add bullets below; copy the checkbox pattern._

- [ ] Example: run `npm run prisma:deploy` after pulling DB changes
- [ ]

---

## Done (archive)

_Move finished items here if you like a paper trail._

- [ ] _(none yet)_
