# DevAssess

Interview assessment platform for sending coding and theory tests to candidates.

## Features

- **Three roles**: Admin (full access), Manager (create tests, view results), Recruiter (send links, view results)
- **Question types**: Multiple choice (single/multi-select), free text, and coding with Monaco Editor
- **Code execution**: Run code in 50+ languages via Piston API
- **Markdown support**: Write questions with rich formatting, code blocks, and tables
- **Timer**: Configurable time limit with auto-submit on expiry
- **Anti-cheating**: Paste detection and tab-switch tracking with integrity reports
- **Auto-save**: Answers saved every 30 seconds and on navigation
- **Scoring**: Auto-grading for MC questions, manual grading for free text and coding
- **Dark mode**: Built-in PatternFly 6 theme toggle

## Tech Stack

- **Next.js 15** (App Router)
- **React 19** + **TypeScript**
- **PatternFly 6** for UI
- **Drizzle ORM** + **Neon PostgreSQL**
- **Auth.js v5** (credentials provider)
- **Monaco Editor** for code editing
- **Piston API** for code execution

## Getting Started

### Prerequisites

- Node.js 18+
- A Neon database (free tier at [neon.tech](https://neon.tech))

### Setup

```bash
npm install
```

Create `.env.local`:

```env
DATABASE_URL=postgresql://...your-neon-connection-string...
NEXTAUTH_SECRET=your-random-secret
NEXTAUTH_URL=http://localhost:3000
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD=your-secure-password
```

Push the database schema:

```bash
npm run db:push
```

Seed the admin account:

```bash
curl -X POST http://localhost:3000/api/seed
```

Start the dev server:

```bash
npm run dev
```

### Vercel Deployment

1. Push to GitHub
2. Import in Vercel dashboard
3. Add Neon Postgres from Vercel Storage (or set `DATABASE_URL` manually)
4. Set environment variables: `NEXTAUTH_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
5. Deploy

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:studio` | Open Drizzle Studio |
