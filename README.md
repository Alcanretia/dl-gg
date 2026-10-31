# dl-gg

A Deadlock stats website inspired by [op.gg](https://op.gg), built with Next.js 15 and TypeScript. Browse hero rankings, explore item builds, and look up a player's match history.

**Live demo:** [dl-gg.vercel.app](https://dl-gg.vercel.app)

## Features

- **Hero stats and tier rankings** – an overview of every hero with win rates, grouped into tiers based on performance.
- **Hero build pages** – item build data for each hero, with an interactive build timing chart (scroll to zoom, drag to pan).
- **Leaderboard** – regional leaderboards for ranked players.
- **Player search and profiles** – search for a player by name or Steam ID and view their profile and match history.

## Tech Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React, CSS Modules |
| Charts | Recharts |
| Data source | [deadlock-api](https://deadlock-api.com) (community-built API) |
| Deployment | Vercel |

## Architecture Highlights

- **API route handlers with in-memory caching** – requests to the upstream API go through Next.js route handlers that cache responses in a `Map`, reducing repeated calls to a community-run service.
- **Server/client component split** – data fetching happens in server components; only interactive pieces (such as the build chart) are client components.
- **Parallel data fetching** – independent requests are run together with `Promise.all` to cut page load time.
- **Percentile-based tier ranking** – heroes are ranked by combining their stats into Z-scores and assigning tiers by percentile.
- **Custom chart interactions** – scroll-to-zoom and drag-to-pan built on top of Recharts.

## Getting Started

### Prerequisites

- Node.js 18.18 or later
- npm (or yarn / pnpm)

### Installation

```bash
git clone https://github.com/<your-username>/dl-gg.git
cd dl-gg
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
npm start
```

## Project Structure

```
dl-gg/
├── app/
│   ├── api/                      # Route handlers (proxy and cache deadlock-api)
│   │   ├── heroes/
│   │   │   ├── winrates/         # GET hero win rates
│   │   │   └── [id]/builds/      # GET builds for a hero
│   │   ├── leaderboard/[region]/ # GET leaderboard by region
│   │   └── players/
│   │       ├── search/           # GET player search
│   │       └── [steamId]/        # GET player data and matches
│   ├── components/               # Shared UI: topbar, spinner, hero win rate table
│   ├── heroes/                   # Heroes list page
│   │   └── [id]/                 # Hero page: builds display and BuildTimingChart
│   ├── leaderboard/              # Leaderboard page and table
│   ├── players/                  # Player search page
│   │   └── [steamId]/            # Player page and MatchTable
│   ├── lib/                      # Shared helpers (getHeroBuilds, ranks)
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx                  # Home page
├── public/                       # Static assets
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

Each route has a matching `loading.tsx`, so pages show a spinner while server-side data loads.

## Acknowledgements

- [deadlock-api](https://deadlock-api.com) for providing the community-built data API.
- [op.gg](https://op.gg) for the inspiration.

This project is a fan-made learning and portfolio project and is not affiliated with Valve or Deadlock.
