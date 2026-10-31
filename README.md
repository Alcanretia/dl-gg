# dl-gg

A Deadlock stats website inspired by [op.gg](https://op.gg), built with Next.js 15 and TypeScript. Browse hero rankings, explore item builds, and look up a player's match history.

**Live demo:** [dl-gg.vercel.app](https://dl-gg.vercel.app)

## Features

- **Hero stats and tier rankings** – an overview of every hero, grouped into tiers based on their performance.
- **Hero build pages** – item build data for each hero, shown in an interactive chart (scroll to zoom, drag to pan).
- **Player match history** – search for a player and view their recent matches.

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
src/
├── app/          # App Router pages and API route handlers
├── components/   # Reusable UI components
└── ...
```

> Adjust the tree above to match your actual folder layout.

## Acknowledgements

- [deadlock-api](https://deadlock-api.com) for providing the community-built data API.
- [op.gg](https://op.gg) for the inspiration.

This project is a fan-made learning and portfolio project and is not affiliated with Valve or Deadlock.
