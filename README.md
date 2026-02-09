# League Pro

A modern football session management platform built with Next.js 15, Supabase, and TypeScript.

## 🚀 Features

- **Player Management**: Register and manage players with positions (DEF, MID, ATT)
- **Session Planning**: Create and manage football sessions
- **Smart Team Balancing**: Automated team generation with position-based balancing
- **Match Tracking**: Record match results and track statistics
- **Finance Management**: Track income and expenses with detailed ledger
- **Authentication**: Secure login with Supabase Auth (Email/Password for admins, Phone for players)

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Icons**: Lucide React

## 📋 Prerequisites

- Node.js 18.0 or higher
- npm 9.0 or higher
- Supabase account and project

## 🔧 Installation

1. **Clone the repository**:
   ```bash
   cd league-pro
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. **Run database migrations**:
   - Open your Supabase project dashboard
   - Go to SQL Editor
   - Run the migrations in order from `supabase/migrations/`

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
league-pro/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication routes
│   ├── (admin)/           # Admin dashboard routes
│   └── (player)/          # Player portal routes
├── components/            # React components
│   ├── ui/               # shadcn/ui primitives
│   ├── admin/            # Admin components
│   ├── player/           # Player components
│   └── shared/           # Shared components
├── lib/                   # Utilities and services
│   ├── supabase/         # Supabase client configuration
│   ├── actions/          # Server Actions
│   ├── services/         # Business logic
│   └── utils/            # Helper functions
└── supabase/             # Database migrations
```

## 🎮 Usage

### Admin

1. Log in with admin credentials
2. Create a new session with date, time, and venue
3. Players register for the session
4. Generate balanced teams using the smart balancer
5. Record match results
6. View statistics and financial reports

### Player

1. Register with phone number
2. Browse available sessions
3. Register for sessions
4. View assigned team
5. Check personal statistics

## 🧪 Development

- **Type checking**: `npm run type-check`
- **Linting**: `npm run lint`
- **Build**: `npm run build`

## 📝 License

Private project - All rights reserved

## 🙏 Acknowledgments

Built with modern web technologies and best practices for football session management.
