# MostAI — marketing site

The MostAI marketing website. Static HTML/CSS/JS — **no build step, no framework**.

## Run locally
Any static file server works, e.g.:
```bash
python -m http.server 8000
```
then open http://localhost:8000

## Deploy (Vercel)
Import this repo into Vercel. It's a static site:
- Framework preset: **Other**
- Build command: *(none)*
- Output directory: `.` (repo root)

The homepage is `index.html`, served at the root.

## ⚠️ Before launch — make the contact form live
The contact form sends submissions to you via [Web3Forms](https://web3forms.com).
1. Go to web3forms.com, enter **elimelechmoster@gmail.com**, and copy the free access key they email you.
2. In `contact.html`, replace `REPLACE_WITH_WEB3FORMS_ACCESS_KEY` with that key.

Until then the form shows a friendly "email us directly" message instead of sending.

## Pages
- `index.html` — home
- `service-websites.html` · `service-ai-agents.html` · `service-automation.html` · `service-software.html` — service detail pages
- `work.html` — case studies
- `contact.html` — contact form
- `privacy.html` — privacy policy

## Structure
- `styles.css` + `tokens/` — design-system tokens (colors, type, spacing, effects, fonts)
- `site.css` · `previews.css` — site + preview styling
- `site.js` — nav, smooth scroll, animations, mobile menu, form handling
- `ink.js` — the live WebGL "ink" background (with text-avoidance)
- `previews.js` — the live service mockups
- `logo-white.png` · `logo-blue.png` — brand marks
