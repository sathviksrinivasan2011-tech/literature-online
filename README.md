# Literature Online

A production-minded multiplayer web app for the Indian/South Asian card game Literature. It is designed for friends and cousins to play together while using external voice chat on Discord, WhatsApp, Google Meet, or similar.

## Highlights

- Next.js, React, TypeScript, Tailwind CSS, and lightweight Framer Motion transitions
- Fully separated Node.js Socket.IO backend for realtime rooms
- Server-authoritative game state with per-player private hand payloads
- Prisma schema with SQLite for local development and profile/game archive persistence
- PWA manifest and service worker for installable mobile-style play
- Mobile-first table layout with sticky turn banner, bottom hand, ask modal, and temporary toasts
- No permanent move log, by design, because memory is part of Literature

## Game Rules Implemented

Literature Online uses a standard 52-card deck. The common South Asian literature books are represented as low and high suit books:

- Low: 2 through 7 of each suit
- High: 9 through A of each suit
- Eights: a small four-card set so the app still uses the full 52-card deck

Rules enforced on the server:

- Players can only ask during their turn.
- Players can only ask another player.
- Players can only ask for cards from sets where they already hold at least one card.
- Players cannot ask for a card they already hold.
- A successful ask transfers the card and the same player continues.
- A failed ask passes the turn to the target player.
- Sets can only be declared when the declaring player holds every card in that set.
- Declared cards are removed from hand, score is updated, and the game ends when all sets are complete or all hands are empty.

## Split Architecture

Literature Online is prepared for a split production deployment:

- Frontend: Next.js PWA on Vercel
- Backend: standalone Node.js + Socket.IO server on Render

The frontend never assumes localhost in production. It connects to the backend with:

```env
NEXT_PUBLIC_SOCKET_URL="https://literature-online.onrender.com"
```

For local development, run the frontend and backend as two processes:

```bash
npm run dev
npm run dev:server
```

Then use:

```env
NEXT_PUBLIC_SOCKET_URL="http://localhost:4000"
BACKEND_ALLOWED_ORIGINS="http://localhost:3000"
PORT="4000"
```

## Socket.IO Architecture

The server owns all room and game state in `server/index.ts`.

Client events:

- `room:create`
- `room:join`
- `player:ready`
- `game:start`
- `game:ask`
- `game:declare`
- `room:leave`

Server events:

- `room:state`
- `toast`
- `presence`

The standalone backend emits a personalized `room:state` to each socket. Public room data includes player names, card counts, scores, status, turn, and completed sets. Only the receiving player gets their own `hand`. This prevents client-side cheating while keeping payloads small.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create the local env file:

```bash
cp .env.example .env
```

3. Generate Prisma client and create the SQLite database:

```bash
npm run prisma:generate
npm run prisma:migrate
```

4. Start the frontend:

```bash
npm run dev
```

5. In another terminal, start the backend:

```bash
npm run dev:server
```

Open `http://localhost:3000`.

## Deployment

### Backend on Render

Create a Render Web Service from this repository.

Render settings:

- Runtime: Node
- Build command: `npm install && npm run build:server`
- Start command: `npm run server:start`
- Health check path: `/health`

Render environment variables:

```env
NODE_ENV="production"
BACKEND_ALLOWED_ORIGINS="https://literature-online.onrender.com"
CLIENT_ORIGIN="https://literature-online.onrender.com"
```

If you use a custom Vercel domain, put that exact origin in `BACKEND_ALLOWED_ORIGINS`. Multiple origins are comma-separated:

```env
BACKEND_ALLOWED_ORIGINS="https://literature.example.com,https://your-vercel-app.vercel.app"
```

Render exposes the Socket.IO endpoint at the service root using Socket.IO's default `/socket.io` path. Example frontend socket URL:

```env
NEXT_PUBLIC_SOCKET_URL="https://literature-online.onrender.com"
```

### Frontend on Vercel

Create a Vercel project from this repository.

Vercel settings:

- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: leave default

Vercel environment variables:

```env
NEXT_PUBLIC_SOCKET_URL="https://literature-online.onrender.com"
NEXT_PUBLIC_APP_URL="https://literature-online.onrender.com"
DATABASE_URL="file:./dev.db"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

`NEXT_PUBLIC_SOCKET_URL` is required for multiplayer in production. The value must be the public HTTPS URL of the Render backend, without a trailing `/socket.io`.

Deploy order:

1. Deploy the Render backend first.
2. Copy the Render service URL.
3. Set `NEXT_PUBLIC_SOCKET_URL` on Vercel.
4. Deploy the Vercel frontend.
5. Set `BACKEND_ALLOWED_ORIGINS` on Render to the final Vercel origin and redeploy/restart Render.

### CORS and WebSockets

The backend reads allowed browser origins from `BACKEND_ALLOWED_ORIGINS` or `CLIENT_ORIGIN`. In production, no origin is allowed by default, so this variable must be set. Render supports WebSocket upgrades for web services; Socket.IO is configured with `websocket` and `polling` transports for compatibility.

For horizontal scale, replace the in-memory room map with Redis and use the Socket.IO Redis adapter. The current implementation is intentionally lightweight and excellent for a single small instance.

## Performance Notes

- No game engines, physics engines, particle systems, canvas loops, or polling.
- Socket updates are event-based and room-scoped.
- The server sends each player only the private data they need.
- UI animation is limited to CSS transitions and small Framer Motion enter/exit transitions.
- Components such as cards, seats, table, hand, turn bar, and panels use `React.memo`.
- The permanent action log is intentionally absent. Only short-lived toasts appear.
- Visual polish relies on CSS gradients and shadows instead of large image assets.

## Optional Google Login

Guest nickname play works by default. `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are reserved in `.env.example` for adding lightweight Google sign-in later. The current core game does not require account creation.

## Project Structure

- `app/` - Next.js app shell and global styles
- `components/` - game UI components
- `hooks/useGameSocket.ts` - Socket.IO client integration
- `lib/game.ts` - shared game rules and state types
- `lib/socket-events.ts` - typed socket event contracts
- `server/index.ts` - standalone Socket.IO server and authoritative room manager
- `prisma/schema.prisma` - SQLite development schema
- `public/` - PWA manifest, icon, and service worker
