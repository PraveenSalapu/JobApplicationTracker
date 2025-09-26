<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1fG2NC4x-uRo30ShHeIr5z64s5OE7cu9Z

## Run Locally

**Prerequisites:**  Node.js

1. Install dependencies:
   `npm install`
2. Create a `.env.local` file (or update the existing one) with your keys:

```
GEMINI_API_KEY=your-gemini-key
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
VITE_GOOGLE_API_KEY=your-google-api-key
```

3. Run the app:
   `npm run dev`

## Deploy to Netlify

- Push your code without secrets. Netlify will pull environment variables from the dashboard at build time.
- In Netlify, open **Site settings -> Build & deploy -> Environment** and add the same variables:
  - `GEMINI_API_KEY`
  - `VITE_GOOGLE_CLIENT_ID`
  - `VITE_GOOGLE_API_KEY`
- Redeploy the site so the new configuration is baked into the build.
- If you rotate credentials, update them in Netlify and trigger a new deploy.
