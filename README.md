# 🚀 Getu Client (`getu-client`)

> Modern, AI-powered job application & live discovery platform frontend. Built with **React 19**, **TypeScript**, **Vite**, **TailwindCSS**, **TanStack Query**, and **Zustand**.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## ✨ Overview

`getu-client` delivers an enterprise-grade, responsive user interface for automated job search and application workflows. It connects to the `getu-server` backend to discover live job openings, verify link freshness in real-time, compute candidate profile match scores, manage ATS resumes, and track job application statuses across top hiring platforms.

---

## 🌟 Key Features

### 🔍 1. Live Job Discovery Hub
- **Multi-Source Aggregator**: Seamlessly search jobs across **LinkedIn**, **Naukri**, **Indeed**, **Internshala**, **Unstop**, **Foundit**, **TimesJobs**, **Cutshort**, **Instahyre**, **Wellfound**, **Glassdoor**, and official career portals (**Greenhouse**, **Lever**, **Ashby**).
- **Dual Search Bar**: Instant search by keywords/tech stacks and locations (smart grouping for **Delhi NCR**, **Noida**, **Gurugram**, and **Remote**).
- **Multi-Source De-Duplication**: Merges postings across multiple platforms into a single card with direct platform links.

### 🎯 2. Advanced Search & Locality Filters
- **Experience Levels**: Quick filters for Freshers (`0-1 yr`), entry-level, and custom experience brackets.
- **Education Qualifications**: Support for **BCA**, **MCA**, **B.Tech**, **B.Sc**, and general degrees.
- **Salary Constraints**: Numeric annual CTC range filters.
- **Recruitment Types**: Dedicated tabs for **Bulk Hiring Campaigns**, **Walk-in Drives**, **Off-Campus Fresher Drives**, and **Regular Openings**.
- **Active Filter Chips**: Removable chips, "Clear All Filters", and "Save Search" to local storage.

### 🛡️ 3. Strict Live Freshness Verification
- On-demand HTTP freshness verification checking live application URLs.
- Visual badges distinguishing **Verified Live** (green), **Unverified** (amber), and **Closed/Expired** (rose) openings.

### 📑 4. Slide-Out Job Details & Tracking Drawer
- Comprehensive job descriptions, responsibilities checklist, and walk-in venue instructions.
- Real-time candidate match score breakdown (skills, experience, education, location).
- **Personal Application Tracker**: Update status (`Saved`, `Applied`, `Interviewing`, `Offered`, `Rejected`) and write interview notes directly to the backend.

### 📄 5. Candidate Profile & Resume Engine
- Multi-user candidate profiles with skills dictionary, experience bullets, and education details.
- Master resume versioning and ATS keyword scoring.
- Practice interview question screening and autofill answer repository.

---

## 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/), [Vite 6](https://vitejs.dev/) |
| **Language** | [TypeScript 5.7](https://www.typescriptlang.org/) (Strict Mode) |
| **Styling** | [TailwindCSS 3.4](https://tailwindcss.com/), [PostCSS](https://postcss.org/), [clsx](https://github.com/lukeed/clsx) |
| **State & Cache** | [TanStack React Query 5](https://tanstack.com/query), [Zustand 5](https://github.com/pmndrs/zustand) |
| **Routing** | [React Router 7](https://reactrouter.com/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v20.x` or `v22.x`
- **npm**: `v10.x` or higher
- **Backend API**: Running instance of `getu-server` (default: `http://localhost:5000`)

### 1. Installation
```bash
# Clone repository
git clone https://github.com/deepaksah11/getu-client.git
cd getu-client

# Install dependencies
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL of `getu-server` backend. In local dev, leave empty to use Vite proxy. | `http://localhost:5000` |

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Production Build & Deployment

### Build Locally
```bash
# Compile TypeScript and bundle with Vite
npm run build

# Preview production build locally
npm run preview
```

### Deploy to Vercel (1-Click)
Pre-configured with `vercel.json` for client-side SPA routing:
```bash
npx vercel
```
*Set environment variable: `VITE_API_URL=https://your-getu-server.onrender.com`.*

### Deploy to Netlify
Pre-configured with `netlify.toml`:
```bash
npx netlify deploy --prod
```

### Deploy with Docker
Multi-stage build with Nginx:
```bash
# Build container image
docker build -t getu-client:latest .

# Run container
docker run -d -p 8080:80 --name getu-client getu-client:latest
```
Access the application at `http://localhost:8080`.

---

## 📂 Project Structure

```
getu-client/
├── public/                 # Static assets & SVG icons
├── src/
│   ├── assets/             # Brand logos & graphics
│   ├── components/         # Reusable UI components
│   │   ├── Layout.tsx      # Main responsive shell
│   │   ├── Navbar.tsx      # Header & search controls
│   │   ├── Sidebar.tsx     # Navigation sidebar
│   │   ├── Skeleton.tsx    # Shimmer loading cards
│   │   └── ...
│   ├── pages/              # Application views
│   │   ├── Jobs.tsx        # Modernized Live Job Discovery Hub
│   │   ├── JobDetails.tsx  # Detailed job viewer
│   │   ├── Dashboard.tsx   # Metrics & automation pipeline
│   │   ├── Applications.tsx# Kanban application stages
│   │   ├── Resumes.tsx     # Master resume & ATS scoring
│   │   └── Profile.tsx     # Candidate skill profile
│   ├── services/
│   │   └── api.ts          # REST API client with TanStack hooks
│   ├── store/              # Zustand global application store
│   ├── types/              # Domain TypeScript interfaces
│   ├── App.tsx             # Root route definitions
│   └── main.tsx            # Application entry point
├── Dockerfile              # Multi-stage container definition
├── nginx.conf              # Production Nginx SPA configuration
├── vercel.json             # Vercel deployment config
├── netlify.toml            # Netlify deployment config
├── package.json            # Scripts & dependencies
└── vite.config.ts          # Vite build & proxy settings
```

---

## 📜 Available Scripts

| Script | Command | Description |
| :--- | :--- | :--- |
| `npm run dev` | `vite` | Starts local development server with HMR |
| `npm run build` | `tsc && vite build` | Typechecks and creates optimized production bundle in `/dist` |
| `npm run preview` | `vite preview` | Previews production build locally |
| `npm run typecheck`| `tsc --noEmit` | Validates TypeScript types across all files |

---

## 🤝 Contributing & License

Contributions are welcome! Please feel free to submit a pull request or open an issue.

Distributed under the **MIT License**.
