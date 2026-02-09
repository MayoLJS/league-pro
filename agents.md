# League Pro - Football Management System

## 🎯 App Vision

League Pro is a comprehensive football session management platform designed to streamline the organization of casual football matches. The system manages player registration, team balancing, match fixtures, statistics tracking, and financial administration.

## 👥 User Roles

### Admin
- Manage match sessions (create, edit, delete)
- Control player registrations
- Generate balanced teams
- Record match results
- Manage finances (fees, expenses)
- View comprehensive statistics
- Control session settings (max players, fees, venue)

### Player
- Self-register for upcoming sessions
- View personal statistics (goals, assists, awards)
- Check payment status
- View match history
- See team assignments
- Track personal performance metrics

## 📊 Database Tables Overview

### 1. Players Table (Permanent)
**Purpose**: Central registry of all players in the system
- Unique player identification
- Contact information (mobile number)
- Playing position classification
- Registration metadata

### 2. Sessions Table
**Purpose**: Manage individual football sessions/events
- Session scheduling (date, time, venue)
- Financial tracking (fee per player, balance/purse)
- Session status (open, full, completed, cancelled)
- Configuration (max players, teams count)

### 3. Session Registrations (Junction Table)
**Purpose**: Track player sign-ups for sessions
- First-come, first-served registration order
- Payment status tracking
- Team assignment
- Attendance confirmation

### 4. Stats Table (Permanent)
**Purpose**: Lifetime player performance metrics
- Total goals scored
- Total assists
- Player of the Day awards count
- Matches played
- Win/loss records

### 5. Finance Ledger Table
**Purpose**: Complete financial audit trail
- Income tracking (player fees)
- Expense tracking (pitch rental, equipment)
- Transaction categorization
- Running balance calculation
- Date-stamped entries

### 6. Match Results Table (Session-Specific)
**Purpose**: Store match outcomes and performance data
- Match-level results (teams, scores)
- Individual player performance (goals, assists)
- Player of the Day selection
- Match timestamps
- Link to parent session

### 7. Teams Table (Generated per Session)
**Purpose**: Store team assignments for each session
- Team name/identifier
- Player roster
- Team balance metadata
- Position distribution

## ⚙️ Core Business Logic

### 1. First-Come, First-Served Registration
- Sessions have a maximum player capacity
- Players register in chronological order
- Registration closes when capacity is reached
- Waitlist functionality for popular sessions
- Registration cutoff time before session starts

### 2. Team Balancing Algorithm
**Objective**: Create fair, balanced teams based on playing positions

**Logic**:
1. **Input**: List of registered players with positions (DEF, MID, ATT, GK)
2. **Position Distribution**:
   - Calculate total players per position
   - Divide evenly across teams
   - Handle remainder players with balancing rules
3. **Balancing Rules**:
   - Each team gets equal defenders
   - Each team gets equal midfielders
   - Each team gets equal attackers
   - Goalkeepers distributed evenly (or rotate if insufficient)
4. **Randomization**: Within position groups, randomly assign to teams
5. **Validation**: Ensure no team has significant positional advantage

**Example for 14 players, 2 teams**:
- If 4 DEF, 6 MID, 3 ATT, 1 GK
- Team A: 2 DEF, 3 MID, 1 ATT, 1 GK (7 players)
- Team B: 2 DEF, 3 MID, 2 ATT, 0 GK (7 players)

### 3. Winner Stays On Fixture Generator
**Objective**: Generate dynamic fixtures where winning team continues playing

**Format**: Best used for 3+ teams with rolling matches

**Logic**:
1. Initial match: Team A vs Team B (Team C rests)
2. Winner of Match 1 vs Team C (loser rests)
3. Winner of Match 2 vs rested team
4. Continue rotation until session time expires

**Tracking**:
- Match sequence number
- Active teams vs resting team
- Cumulative wins per team
- Time elapsed per match

### 4. Temporary Match Results Table
**Purpose**: Capture in-session match data that resets after completion

**Lifecycle**:
1. **Created**: When admin starts match day
2. **Populated**: During matches (goals, assists, events)
3. **Finalized**: When session ends
4. **Aggregated**: Data rolled up to permanent Stats table
5. **Archived/Cleared**: After successful aggregation

**Data Captured**:
- Real-time score updates
- Goal scorers with timestamps
- Assist providers
- Player of the Day votes
- Match events (cards, substitutions)

**Reset Process**:
1. Aggregate individual stats to Stats table
2. Save complete match record to Match Results table
3. Clear temporary table for next session

## 🏗️ Technical Stack

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: React Context API + Server Actions

### Backend
- **Hosting**: Vercel (Serverless Functions)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime (for live match updates)
- **API**: Next.js API Routes / Server Actions

### Database & Auth
- **Database**: Supabase PostgreSQL
- **Auth Provider**: Supabase Auth
- **Row Level Security**: Enabled for data protection
- **Storage**: Supabase Storage (for player photos, receipts)

## 🔐 Authentication & Authorization

### Auth Flow
1. **Player Registration**: Mobile number + SMS OTP (Supabase Auth)
2. **Admin Access**: Email + password with 2FA
3. **Session Management**: JWT tokens via Supabase
4. **Role Assignment**: Database-driven roles (players table)

### Authorization Rules
- **Public**: View public session listings
- **Player**: Register for sessions, view own stats
- **Admin**: Full CRUD on all entities

## 📱 User Interface Structure

### Admin Dashboard
- Session management (create, edit, close registrations)
- Player list with registration status
- Team generator interface
- Live match scoring interface
- Finance dashboard (income vs expenses)
- Statistics overview (top scorers, attendance)

### Player Portal
- Upcoming sessions calendar
- Quick registration button
- Personal stats dashboard
- Payment history
- Match history and performance

## 🎯 Key Features & User Flows

### Admin: Create New Session
1. Navigate to "Create Session"
2. Set date, time, venue, max players, fee
3. Set registration deadline
4. Publish session
5. Players can now register

### Admin: Generate Teams
1. View registered players for session
2. Click "Generate Teams"
3. System applies balancing algorithm
4. Preview team assignments
5. Confirm or regenerate
6. Notify players of team assignments

### Admin: Record Match Results
1. Select completed session
2. Enter scores for each match
3. Record individual goals and assists
4. Select Player of the Day
5. Submit results
6. System updates Stats table
7. Clear temporary results table

### Player: Register for Session
1. View upcoming sessions
2. Click "Register" on desired session
3. Confirm position
4. Receive confirmation
5. Pay session fee (mark as paid)
6. Receive team assignment before session

### Player: View Statistics
1. Navigate to "My Stats"
2. View lifetime metrics:
   - Games played
   - Goals scored
   - Assists provided
   - Player of the Day awards
   - Win rate
3. View match history with detailed breakdowns

## 💰 Finance Management

### Income Tracking
- Automatic calculation: Players registered × Session fee
- Manual adjustments for late payments
- Payment status per player (Paid/Pending/Waived)

### Expense Tracking
- Pitch rental fees
- Equipment purchases
- Other operational costs
- Receipt upload capability

### Balance Calculation
- Running balance: Total Income - Total Expenses
- Per-session profit/loss
- Historical financial reports
- Export to CSV for accounting

## 📈 Statistics & Reporting

### Individual Player Stats
- Total matches played
- Goals scored (lifetime, per season)
- Assists provided
- Player of the Day awards
- Attendance rate
- Recent form (last 5 matches)

### League-Wide Stats
- Top scorers leaderboard
- Most assists provider
- Most Player of the Day awards
- Most active players
- Position-based statistics

### Session Analytics
- Average attendance
- Revenue per session
- Popular time slots
- Player retention rate

## 🔄 Data Flow Examples

### Registration Flow
```
Player → Register → Session Registrations → Update Session (player count) → Notify Admin
```

### Match Completion Flow
```
Admin → Enter Results → Temporary Results Table → Aggregate → Stats Table + Match Results → Clear Temporary → Notify Players
```

### Team Generation Flow
```
Admin → Request Teams → Filter Registered Players → Apply Balancing Algorithm → Generate Teams → Save to Teams Table → Notify Players
```

## 🚀 Success Metrics

- Session fill rate (% of sessions reaching max capacity)
- Player retention (% returning for multiple sessions)
- Payment collection rate
- Admin time saved vs manual management
- Player satisfaction (feedback scores)
- Financial balance (positive purse)

---

**Next Steps**: Review and approve this specification before proceeding to implementation planning.
