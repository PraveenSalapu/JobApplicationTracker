# Job Application Tracker

A simple, AI-assisted web app to help you manage your job applications, interviews, and notes in one place. Built with **React + TypeScript + Vite**, it supports authentication, job tracking, and smart organization for candidates navigating multiple applications.

---

## 🚀 Features
- 📋 **Track applications** – add, edit, and delete jobs with title, company, and stage  
- 🏷️ **Status pipeline** – organize jobs by stage (Applied, Interview, Offer, Rejected)  
- 🔍 **Search & filter** – quickly find jobs by company, role, or tags  
- 🗒️ **Notes** – attach interview prep notes to each application  
- 📂 **Import/Export** – backup or migrate your application data with CSV  
- 🔐 **Secure login** – Google OAuth for authentication (optional)  
- ⚡ **AI integration** – experiment with Gemini API to generate interview prep suggestions  

---

## 🛠️ Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS  
- **Backend/Services**: Node.js, Express (planned integrations)  
- **Authentication**: Google OAuth 2.0  
- **Cloud/Hosting**: Netlify / Vercel  
- **Testing/Quality**: ESLint, Prettier (with CI build + lint pipeline)  

---

## 🏗️ Architecture
```
React (Vite) ───> Express API ───> Database (future)
       │
       └── Google OAuth / AI APIs (Gemini)
```

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+  
- npm or yarn  

### Setup
1. **Clone the repo**
   ```bash
   git clone https://github.com/PraveenSalapu/JobApplicationTracker.git
   cd JobApplicationTracker
   ```
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Create `.env` file** (see `.env.example`)  

   | Variable | Description | Required |
   |----------|-------------|----------|
   | `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ |
   | `VITE_GEMINI_API_KEY`   | Gemini API Key (optional, for AI notes) | ⬜ |
   | `VITE_BACKEND_URL`      | Backend API endpoint | ⬜ |

4. **Run the app locally**
   ```bash
   npm run dev
   ```
5. Open [http://localhost:5173](http://localhost:5173)  

---

## 🌐 Demo
- **Live Demo**: http://basicinterviewprep.netlify.app/
- Currently available with personal email. 

---

## 📌 Roadmap
- [ ] Kanban board for job stages  
- [ ] Interview reminders + calendar integration  
- [ ] AI-powered job description analysis  
- [ ] Persistent backend with database (MongoDB/Postgres)  

---

## 🤝 Contributing
Contributions are welcome! Please fork, create a feature branch, and submit a PR.  

