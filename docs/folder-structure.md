# League Pro - Folder Structure

## Complete Directory Layout

```
league-pro/
├── .next/                          # Next.js build output (generated)
├── .gemini/                        # Gemini artifacts (auto-generated)
├── node_modules/                   # Dependencies (generated)
│
├── app/                            # Next.js 15 App Router
│   ├── (auth)/                     # Auth route group (no layout)
│   │   ├── login/
│   │   │   └── page.tsx           # Login page (Email/Password)
│   │   └── register/
│   │       └── page.tsx           # Player registration (Phone)
│   │
│   ├── (admin)/                    # Admin route group (requires admin role)
│   │   ├── dashboard/
│   │   │   └── page.tsx           # Admin dashboard home
│   │   ├── sessions/
│   │   │   ├── page.tsx           # Sessions list
│   │   │   ├── new/
│   │   │   │   └── page.tsx       # Create session
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Session detail & management
│   │   │       ├── teams/
│   │   │       │   └── page.tsx   # Generate/view teams
│   │   │       └── scoring/
│   │   │           └── page.tsx   # Live match scoring
│   │   ├── finance/
│   │   │   └── page.tsx           # Finance ledger & reports
│   │   ├── players/
│   │   │   └── page.tsx           # Player management
│   │   └── layout.tsx             # Admin layout with navigation
│   │
│   ├── (player)/                   # Player route group (requires auth)
│   │   ├── portal/
│   │   │   └── page.tsx           # Player home/dashboard
│   │   ├── sessions/
│   │   │   ├── page.tsx           # Available sessions
│   │   │   └── [id]/
│   │   │       └── page.tsx       # Session details & registration
│   │   ├── stats/
│   │   │   └── page.tsx           # Personal stats & leaderboards
│   │   └── layout.tsx             # Player layout
│   │
│   ├── api/                        # API Routes (optional, for webhooks)
│   │   └── webhooks/
│   │       └── supabase/
│   │           └── route.ts       # Supabase webhooks
│   │
│   ├── globals.css                 # Global styles (Tailwind directives)
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Landing page (role selection)
│
├── components/
│   ├── ui/                         # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   ├── table.tsx
│   │   ├── dialog.tsx
│   │   ├── badge.tsx
│   │   ├── toast.tsx
│   │   └── calendar.tsx
│   │
│   ├── admin/
│   │   ├── SessionForm.tsx        # Create/edit session form
│   │   ├── TeamGenerator.tsx      # Team generation interface
│   │   ├── MatchScoring.tsx       # Live scoring interface
│   │   ├── FinanceDashboard.tsx   # Finance overview
│   │   └── PlayerManager.tsx      # Player CRUD
│   │
│   ├── player/
│   │   ├── SessionCard.tsx        # Session display card
│   │   ├── RegistrationButton.tsx # Quick register button
│   │   ├── StatsCard.tsx          # Stats display
│   │   └── PaymentStatus.tsx      # Payment indicator
│   │
│   └── shared/
│       ├── Header.tsx             # App header
│       ├── Navigation.tsx         # Navigation component
│       ├── SessionSummary.tsx     # Session results (migrated)
│       ├── LeagueTable.tsx        # Match results table
│       └── LoadingSpinner.tsx     # Loading states
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts              # Browser Supabase client
│   │   ├── server.ts              # Server Supabase client
│   │   ├── middleware.ts          # Auth middleware
│   │   └── types.ts               # Generated database types
│   │
│   ├── actions/                    # Server Actions
│   │   ├── session-actions.ts     # Session CRUD actions
│   │   ├── registration-actions.ts # Registration actions
│   │   ├── team-actions.ts        # Team generation actions
│   │   ├── finance-actions.ts     # Finance actions
│   │   └── stats-actions.ts       # Stats actions
│   │
│   ├── services/                   # Business logic layer
│   │   ├── sessionService.ts      # Session business logic
│   │   ├── playerService.ts       # Player business logic
│   │   ├── teamService.ts         # Team business logic
│   │   ├── financeService.ts      # Finance business logic
│   │   └── statsService.ts        # Stats business logic
│   │
│   ├── utils/
│   │   ├── teamBalancing.ts       # ← MIGRATED from balancer.js
│   │   ├── fixtureGenerator.ts    # Winner stays on logic
│   │   ├── statsCalculator.ts     # ← MIGRATED from SessionSummary
│   │   ├── validators.ts          # Zod schemas
│   │   └── formatters.ts          # Date/currency formatters
│   │
│   ├── hooks/
│   │   ├── useSession.ts          # Session data hook
│   │   ├── usePlayer.ts           # Player data hook
│   │   └── useAuth.ts             # Auth state hook
│   │
│   └── types/
│       ├── database.types.ts      # Supabase generated types
│       └── app.types.ts           # App-specific types
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql         # Base tables from old project
│   │   ├── 002_add_stats_table.sql        # New stats table
│   │   ├── 003_add_finance_ledger.sql     # Enhanced finance
│   │   ├── 004_add_match_events.sql       # Match events table
│   │   └── 005_rls_policies.sql           # Row Level Security
│   │
│   └── seed.sql                    # Sample data for development
│
├── public/
│   ├── favicon.ico
│   └── images/
│       └── logo.png
│
├── .env.local                      # Environment variables (gitignored)
├── .env.example                    # Example env file
├── .gitignore
├── components.json                 # shadcn/ui config
├── next.config.js                  # Next.js configuration
├── package.json
├── postcss.config.js              # PostCSS config
├── tailwind.config.ts             # Tailwind configuration
├── tsconfig.json                  # TypeScript configuration
└── README.md
```

## Key Organizational Principles

### 1. Route Groups
- `(auth)` - No layout, public access
- `(admin)` - Admin layout, protected by role check
- `(player)` - Player layout, protected by auth

### 2. Component Organization
- **`ui/`** - Pure, reusable UI primitives (shadcn/ui)
- **`admin/`** - Admin-specific business components
- **`player/`** - Player-specific business components
- **`shared/`** - Shared across roles

### 3. Server vs Client Logic
- **`actions/`** - Server Actions (data mutations)
- **`services/`** - Business logic (can be used by actions or API routes)
- **`utils/`** - Pure functions (team balancing, calculations)
- **`hooks/`** - Client-side React hooks

### 4. Database
- **`migrations/`** - Versioned SQL migrations
- **`seed.sql`** - Development data

## Migration Map

| Old Project | New Project | Status |
|------------|-------------|--------|
| `lib/balancer.js` | `lib/utils/teamBalancing.ts` | Convert to TS |
| `components/SessionSummary.js` | `lib/utils/statsCalculator.ts` + `components/shared/SessionSummary.tsx` | Split logic/UI |
| `app/globals.css` | `tailwind.config.ts` + `app/globals.css` | Port colors |
| `schema.sql` | `supabase/migrations/001_initial_schema.sql` | Extend |
| `lib/supabase.js` | `lib/supabase/client.ts` + `lib/supabase/server.ts` | SSR pattern |
