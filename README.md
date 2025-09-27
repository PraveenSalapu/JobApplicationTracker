# AI-Powered Web Application

This repository contains everything you need to run and deploy your AI-powered application locally or in production.

---

## Table of Contents

- [Introduction](#introduction)
- [Run Locally](#run-locally)
- [Deploy to Netlify](#deploy-to-netlify)
- [Environment Variables](#environment-variables)
- [License](#license)


---

## Introduction

This project is a modern web application built with JavaScript and powered by AI services. It includes local development support and a ready-to-deploy structure for Netlify hosting.

---

## Run Locally

**Prerequisites:**  
- [Node.js](https://nodejs.org)

### Steps

1. Install dependencies:
   ```bash
   npm install
2. Create a .env.local file in the root of the project and add your environment variables:

   GEMINI_API_KEY=your-gemini-key
   VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
   VITE_GOOGLE_API_KEY=your-google-api-key

3. Start the development server:
   ```bash
   npm run dev
The app should now be running at http://localhost:5173 (or another port depending on your setup).

4. Deploy to Netlify

   To deploy this application on Netlify:

   Push your code to a Git repository (excluding any sensitive .env files).

   In your Netlify dashboard, go to: Site settings → Build & deploy → Environment
   
   Add the following environment variables:

   GEMINI_API_KEY

   VITE_GOOGLE_CLIENT_ID

   VITE_GOOGLE_API_KEY

   Trigger a new deploy from the dashboard.

   🔁 If you rotate any credentials, make sure to update them in the dashboard and redeploy your site.

## Environment Variables

| Variable Name            | Description                          |
|--------------------------|--------------------------------------|
| `GEMINI_API_KEY`         | API key for Gemini AI services       |
| `VITE_GOOGLE_CLIENT_ID`  | Google OAuth client ID               |
| `VITE_GOOGLE_API_KEY`    | Google API key for client access     |


Let me know if you’d like to add badges, a Features list, or a Troubleshooting section.
