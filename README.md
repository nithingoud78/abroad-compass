<div align="center">
  
# Abroad Compass 🧭

**The Open-Source Germany Master's Application Operating System**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-purple?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green?logo=supabase)](https://supabase.com/)
[![Status](https://img.shields.io/badge/Status-Production_Ready-success)](#)

*Simplifying the journey to Germany for international students—from university shortlisting to landing.*

![Banner Placeholder](https://via.placeholder.com/1200x400/09090b/ffffff?text=Abroad+Compass+Banner)

</div>

---

## 📖 Overview

Applying for a Master's degree in Germany is notoriously complex. International students must navigate a maze of university-specific requirements, APS certification, TestAS, language exams (IELTS/Goethe), blocked account setup, and visa procedures. 

**Abroad Compass** is an open-source, end-to-end operating system designed to eliminate this friction. It serves as a unified dashboard that tracks progress, forecasts budgets, manages application documents, and provides AI-powered mentorship to help students succeed in their journey to Germany.

---

## ✨ Features

| Module | Description | Status |
| :--- | :--- | :---: |
| 🇩🇪 **Germany Roadmap** | Step-by-step progress tracker from initial research to arrival in Germany. | ✅ |
| 🎓 **University Search** | Shortlist and compare German universities (TU9, Fachhochschulen). | ✅ |
| 📝 **IELTS Planner** | Track band score goals, practice test results, and exam dates. | ✅ |
| 🗣️ **Goethe Tracker** | Manage German language proficiency (A1-C1) milestones. | ✅ |
| 🧠 **TestAS Planner** | Track core and subject-specific TestAS module scores. | ✅ |
| 📜 **APS Tracking** | Dedicated checklist for navigating the APS certification process. | ✅ |
| 💰 **Budget Planner** | Forecast blocked account requirements, living expenses, and tuition. | ✅ |
| 📊 **Analytics** | Personal dashboard visualizing overall application readiness. | ✅ |
| 🤖 **AI Mentor** | Vercel AI SDK integration (Gemini/OpenRouter) for SOP reviews. | ✅ |
| 🤝 **Community & Friends** | Connect with other applicants and find study buddies. | ✅ |
| 🛡️ **Admin Dashboard** | Full-fledged CMS for managing users, legal pages, and blog posts. | ✅ |

---

## 📸 Screenshots

*(Replace these placeholders with actual application screenshots)*

<div align="center">
  <img src="https://via.placeholder.com/800x450/09090b/ffffff?text=Dashboard+Screenshot" alt="Dashboard" width="48%">
  <img src="https://via.placeholder.com/800x450/09090b/ffffff?text=University+Planner+Screenshot" alt="University Planner" width="48%">
</div>

---

## 🛠️ Tech Stack

Abroad Compass is built on a modern, highly scalable, and type-safe stack.

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19, TanStack Start, Vite |
| **Routing & SSR** | TanStack Router, TanStack Query |
| **Styling & UI** | Tailwind CSS v4, Shadcn UI, Radix UI |
| **Backend & Database** | Supabase (PostgreSQL, Row Level Security) |
| **Authentication** | Supabase Auth (Email/Password, OAuth ready) |
| **AI Integration** | Vercel AI SDK (`@ai-sdk/openai-compatible`) |
| **Charts & Data** | Recharts |
| **Deployment** | Vercel (Frontend), Supabase (Backend) |

---

## 🏗️ Architecture

The application utilizes **TanStack Start** for Full-Stack React capabilities. 
- **Client-Side:** Rich, interactive dashboards with aggressive caching via TanStack Query.
- **Server-Side:** Secure API functions and Server-Side Rendering (SSR) for fast initial loads and SEO (Legal/Blog pages).
- **Database:** Direct PostgreSQL connection via Supabase Client, heavily protected by Row Level Security (RLS) policies.
- **AI Gateway:** A provider-agnostic implementation allowing seamless switching between Google AI Studio (Gemini) and OpenRouter models to optimize cost.

### Folder Structure

```
abroad-compass/
├── docs/               # Technical documentation & architecture specs
├── scripts/            # Build and utility scripts
├── src/
│   ├── components/     # Reusable UI components (Shadcn, App-specific)
│   ├── hooks/          # React custom hooks
│   ├── integrations/   # Supabase client and auto-generated types
│   ├── lib/            # Utilities, AI logic, and Admin functions
│   └── routes/         # TanStack file-based routing
├── supabase/
│   └── migrations/     # SQL schema migrations
└── public/             # Static assets, fonts, icons
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v20+ recommended)
- **Supabase CLI** (for local development)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/abroad-compass.git
   cd abroad-compass
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Copy the example environment file and populate it with your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` to view it in your browser.

---

## 🔐 Environment Variables

Ensure these variables are set in your `.env` (local) and in your deployment provider (Vercel). **Never commit your `.env` file.**

| Variable | Purpose | Safe for Public Client? |
| :--- | :--- | :---: |
| `VITE_SUPABASE_URL` | Connects the frontend to your Supabase instance. | ✅ Yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Public Anon key for standard user operations. | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key for bypassing RLS in server actions. | ❌ **NO** |
| `AI_PROVIDER` | Set to `google` or `openrouter`. | ✅ Yes |
| `GOOGLE_AI_API_KEY` | Key for Gemini access (if provider is Google). | ❌ **NO** |
| `OPENROUTER_API_KEY` | Key for OpenRouter access (if provider is OpenRouter).| ❌ **NO** |

---

## 🌍 Deployment

### Vercel (Frontend)
1. Push your code to GitHub.
2. Import the project into Vercel.
3. Ensure the Build Command is `npm run build` and Output Directory is `dist`.
4. Add all required Environment Variables.

### Supabase (Backend)
1. Link your local project to your remote Supabase instance: `supabase link --project-ref <your-ref>`
2. Push the database migrations: `supabase db push`

---

## 👑 Admin Panel & Security

The platform includes a dedicated Admin panel (`/admin`) for system monitoring, user management, and content management (Legal Pages & Blog).

### Security Model
- **Authentication:** Handled exclusively by Supabase Auth.
- **Authorization:** Handled via custom PostgreSQL Roles and Row Level Security (RLS). 
- **Roles:**
  - `user`: Standard applicant. Can only read/write their own data.
  - `admin`: Has read/write access to system settings, legal pages, and user metadata.

---

## 🗺️ Roadmap

- [ ] Interactive Map of German Universities
- [ ] Direct Uni-Assist integration tracking
- [ ] German Bank Account (Sperrkonto) API integrations
- [ ] Mobile Application (React Native)

---

## 🤝 Contributing

We welcome contributions from the open-source community! 
Please read our [CONTRIBUTING.md](CONTRIBUTING.md) to understand our development process, how to propose bug fixes and improvements, and how to build and test your changes.

Make sure to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) in all interactions.

---

## 📜 License

This project is licensed under the [MIT License](LICENSE) - see the LICENSE file for details.

---

## 👤 Author

Developed and maintained by **[Your Name/Organization]**.
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your Profile](https://linkedin.com/in/yourprofile)

---

## 🙏 Acknowledgements

- The incredible [TanStack](https://tanstack.com/) ecosystem.
- [Shadcn UI](https://ui.shadcn.com/) for the beautiful, accessible component blocks.
- [Supabase](https://supabase.com/) for the robust open-source Firebase alternative.
- All future contributors supporting international education in Germany!
