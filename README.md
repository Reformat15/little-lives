# Little Lives V5 — Roblox-inspired Family Simulator

## Install
1. In GitHub repository `Reformat15/little-lives`, edit **main/index.html**, replace all existing content with this package's `index.html`, and commit.
2. Wait for GitHub Pages deployment to succeed. Reload `https://reformat15.github.io/little-lives/`.
3. In Cloudflare Workers, open your existing `little-lives-ai` Worker, select **Edit code**, replace the code with `worker.js`, and **Deploy**.
4. Under Cloudflare **Settings → Variables and Secrets**, retain `GEMINI_API_KEY` as a **Secret** and `ALLOWED_ORIGIN` as `https://reformat15.github.io`.
5. On the website, open **Gemini connection settings**, paste the exact `https://...workers.dev` address, click **Save endpoint**, and **Enable Gemini**. If HTTPS still fails in Chrome, fix the public Worker domain/TLS before enabling.

## Features
- Roblox-inspired blocky family avatars: Dad, Mom, Alex, Mia.
- Walking animation, floating name tags and speech bubbles.
- Detailed open-top house with room decorations and furnishings.
- Minimize family status panel, pause, speed and reset.
- Offline family conversations with **real replies**, one turn at a time, even without Gemini.
- Optional Gemini-generated connected multi-person conversations via Cloudflare Worker.

## Notes
- Only one Gemini model call is used for a whole scene; four fictional characters are simulated, not four independent model processes.
- The Worker keeps the API key server-side but its public URL is **not access-controlled**: CORS and an Origin check are not authentication. Before public launch, add Cloudflare rate limits, request quotas, abuse protections, and usage monitoring.
- Conversation memory is in-page and resets on reload; no long-term database yet.
- The models are procedural and Roblox-inspired; no Roblox assets or engine are required.
- Three.js is loaded from jsDelivr, so the site needs an internet connection.
