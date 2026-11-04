# Little Lives V4 — Four AI Family Members

1. Replace GitHub repository `Reformat15/little-lives` main branch `index.html` with this file. Commit and wait for GitHub Pages.
2. In Cloudflare Workers > little-lives-ai > Edit code, replace existing Worker with `worker.js`, then Deploy.
3. Keep existing Cloudflare secret `GEMINI_API_KEY` and variable `ALLOWED_ORIGIN=https://reformat15.github.io`. Never paste the API key into HTML or GitHub.
4. On the website, expand Gemini connection settings, enter the HTTPS Worker URL, Save endpoint, then Enable Gemini.
5. Gemini now generates connected 3–4 turn conversations with at least 3 family members, played sequentially as speech bubbles. One API call is made about every 42 seconds when enabled and not already playing dialogue. Free tier quotas vary.

This is simulated agent behavior generated in one Gemini call, not four separately hosted models. Existing house, name labels, speech bubbles, minimize button and controls are retained. Public Workers need rate limiting or authentication before broad release; origin checking alone is not abuse protection.
