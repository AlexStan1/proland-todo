# Proland To Do List

Task management for Proland teams — built on Next.js 14, Convex, and OpenAI.

## Setup

Make sure `.env.local` is filled in, then run these three commands in order:

```bash
# 1. Install dependencies
npm install

# 2. Start Convex (keep this running in a separate terminal)
npx convex dev

# 3. Start the app (in a new terminal)
npm run dev
```

Open http://localhost:3000

## Features

- **Inbox / Today / Upcoming** views
- **Projects** with color coding
- **AI Quick Capture** — press Cmd+Shift+A anywhere
- **Focus Mode** — Pomodoro timer per task
- **Weekly Review** — completion stats and bar chart
- **Mobile responsive** — works on tablet and phone

## Deploy to Vercel

```bash
npx vercel --prod
```

Add all `.env.local` variables to Vercel's environment settings.
Then run `npx convex deploy` to push the backend to production.
