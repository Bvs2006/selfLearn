# AlgoMaster Study Tracker

A clean, responsive, distraction-free personal daily-learning tracker for **Low Level Design (LLD)** and **System Design**, with the official **AlgoMaster** curriculum as the sole source of truth.

---

## 🚀 Features

- **Single Source of Truth**:
  - **Low Level Design**: 19 sections, 134 verified resources (OOP, SOLID, UML, 38 design patterns, real-world problems like Parking Lot, LRU Cache, Splitwise, Uber).
  - **System Design**: 21 sections, 160 verified resources (Fundamentals, Networking, Caching, Databases, Scaling, Distributed Systems, Microservices).
  - Every resource links directly to its official `algomaster.io/learn/...` page. No proprietary lesson content is copied.
- **Strict Sequential Progression**:
  - Automatically identifies the current study day (`current_day = first incomplete day`).
  - **Missed Day Enforcement**: If an earlier day is incomplete, it stays pending and locks subsequent days (🔒). No skipping ahead.
  - A day completes only when all assigned resources are marked done.
- **Dual Course Isolation**:
  - Independent progress and daily schedules for Low Level Design and System Design.
- **Configurable Daily Pacing**:
  - Select 1, 2, 3 (default), or 5 resources per day in Settings while strictly preserving AlgoMaster's original ordering.
- **Mobile-First & PWA**:
  - Native bottom navigation bar for mobile devices.
  - Generous touch targets (40px–48px) and responsive calendar grid.
  - Web Push / PWA compatible daily study reminders.
- **Dual-Layer Storage**:
  - Real-time cloud sync with Supabase PostgreSQL + instant local storage caching for offline resilience.

---

## 🛠 Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Lucide Icons, next-themes (Dark/Light mode)
- **Database & Auth**: Supabase (PostgreSQL with RLS)
- **PWA**: Web App Manifest & Service Worker

---

## 📦 Getting Started

### 1. Clone repository & install dependencies
```bash
git clone https://github.com/Bvs2006/selfLearn.git
cd selfLearn
npm install
```

### 2. Environment Variables
Create a `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production
```bash
npm run build
npm run start
```

### 5. Automated Verification Tests
```bash
npx tsx tests/learning_engine.test.ts
```

---

## 📜 License
MIT License
