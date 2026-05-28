# MyPT. — Personal Trainer

**[English](./README.md) · [Türkçe](./README.tr.md)**

> AI-powered personal trainer and nutrition tracking. Describe what you ate in plain words, run guided workouts, chat with your coach, share progress with friends.

**MIT · PWA · Mobile-first · TR + EN**

---

## Stack

- **Next.js 16** (App Router, TypeScript, Server Components, Turbopack)
- **Tailwind CSS v4** + custom UI primitives (iOS-style grouped list, dark / light / system)
- **Auth.js v5** (Google OAuth)
- **Turso** (libSQL) + **Drizzle ORM**
- **Z.AI GLM-5.1** (OpenAI-compatible SDK) — meal parsing, coach chat, workout planning
- **next-intl** (English + Turkish)
- **next-themes** (dark / light / system)
- **PWA** (manifest, service worker, offline shell, apple-touch-icon)

---

## Features

### Nutrition
- **Natural-language meal log** — Type "2 eggs, 1 slice of bread at 5:41 PM", AI extracts calories and macros (P/C/F).
- **Editing** — adjust time, date, calories and macros for any meal manually.
- **Water tracking** — dashboard widget with +200 / +500 / +750 ml quick buttons, undo last entry.

### Workouts
- **37 home-only exercises** — bodyweight only, categorized (chest / back / legs / core / arms / shoulder / cardio / full body).
- **Interval timer** — work / rest phases, audible beep, screen wake lock.
- **AI plan generator** — reads your profile and the last 7 days of workouts, returns a tailored plan with rotation.
- **Manual picker** — still pick exercises yourself if you prefer.

### Tracking
- **Profile**: height, weight, age, sex → **BMI auto-computed** → goal (lose / maintain / gain) auto-selected.
- **Activity level** — derived from completed workouts in the last 7 days.
- **BMR (Mifflin-St Jeor)** + **TDEE** + daily calorie target — all automatic.
- **Weight history** — log entries, trend bar chart, delta vs start.

### AI Coach
- **Chat** — message your personal trainer in a full-screen chat.
- **Context-aware** — today's calories, recent workouts, profile and goal are passed to the AI on every message.
- **Goal-aware** — won't suggest "filling the gap" if you're losing weight; recommends extra meals if you're gaining.
- **Quick prompts** — "What should I eat?", "Which workout today?", "Did I drink enough water?", "Motivate me".

### Social
- **Username search** — find friends by `@username`, send/accept requests.
- **Weekly summary sharing** — workout count + average calories (on by default).
- **Privacy toggles** — Settings lets you opt in to share weight / meals / water.

### Misc
- **Light + dark themes** with system support.
- **TR + EN** locale URL prefix (`/tr/`, `/en/`).
- **PWA** — add to home screen, offline shell, iOS safe-area.

---

## Setup

### 1. Clone

```bash
git clone https://github.com/system-conf/MyPT.git mypt
cd mypt
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|---|---|
| `AUTH_SECRET` | run `npx auth secret` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | https://console.cloud.google.com/apis/credentials |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | https://turso.tech |
| `ZAI_API_KEY` | https://z.ai |

**Google OAuth redirect URI**:
- Dev: `http://localhost:4000/api/auth/callback/google`
- Prod: `https://<your-domain>/api/auth/callback/google`

### 3. Database schema + exercise catalog

```bash
npm run db:push
npm run db:seed-exercises
```

### 4. Run

```bash
npm run dev
```

http://localhost:4000 → auto-redirects to `/tr` or `/en`.

---

## Vercel Deploy

1. Import project: https://vercel.com/new
2. Add the environment variables listed above.
3. Add the Vercel domain to Google OAuth redirect URIs.
4. Deploy.

---

## Folder Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── (app)/                 # authenticated pages
│   │   │   ├── page.tsx           # dashboard (today)
│   │   │   ├── log/               # add meal
│   │   │   ├── meals/[id]/edit/   # edit meal
│   │   │   ├── history/           # past meals
│   │   │   ├── workouts/          # workouts (list + new + active)
│   │   │   ├── weight/            # weight history
│   │   │   ├── friends/           # friends (list + search + detail)
│   │   │   ├── insights/          # AI coach (full-screen chat)
│   │   │   ├── profile/           # user profile
│   │   │   └── settings/          # theme, language, privacy
│   │   └── signin/                # sign-in screen
│   ├── api/                       # REST endpoints
│   └── layout.tsx                 # root (delegates to locale layout)
├── auth.ts                        # Auth.js v5 config
├── components/                    # UI components
├── db/                            # schema, client, queries, seed
├── i18n/                          # routing, request, messages
├── lib/
│   ├── ai/                        # Z.AI client + parse + coach + suggest
│   ├── calories.ts                # BMR/TDEE/BMI/goal/activity math
│   ├── stats.ts                   # daily aggregation helpers
│   └── utils.ts
└── proxy.ts                       # i18n middleware (Next.js 16)
```

---

## API Endpoints

| Path | Method | Description |
|---|---|---|
| `/api/auth/[...nextauth]` | GET/POST | NextAuth handlers |
| `/api/meals` | GET, POST | List / AI-parse and save meal |
| `/api/meals/[id]` | GET, PATCH, DELETE | Single meal CRUD |
| `/api/water` / `/api/water/[id]` | GET, POST, DELETE | Water tracking |
| `/api/weight` / `/api/weight/[id]` | GET, POST, DELETE | Weight entries |
| `/api/profile` | GET, PATCH | Profile + derived targets |
| `/api/insights` | GET, POST | (legacy) one-shot suggestion |
| `/api/coach` | GET, POST, DELETE | Chat messages |
| `/api/exercises` | GET | Exercise catalog |
| `/api/workouts` / `/api/workouts/[id]` | GET, POST, PATCH, DELETE | Workout session CRUD |
| `/api/workouts/suggest` | POST | AI workout plan |
| `/api/users/search` | GET | Username search |
| `/api/users/[username]/summary` | GET | Friend weekly summary |
| `/api/friends` / `/api/friends/[id]` | GET, POST, PATCH, DELETE | Friendships |
| `/api/privacy` | GET, PATCH | Sharing toggles |

---

## NPM Scripts

```bash
npm run dev                # next dev -p 4000
npm run build              # production build
npm run start              # next start -p 4000
npm run lint               # eslint
npm run db:push            # drizzle-kit push (sync schema → Turso)
npm run db:generate        # drizzle-kit generate migrations
npm run db:studio          # drizzle-kit studio
npm run db:seed-exercises  # seed/update exercise catalog
npm run auth:secret        # generate AUTH_SECRET
```

---

## Security

- `.env.local` is never committed (gitignored).
- Rotate any tokens leaked through chat / screenshots (Turso, Z.AI, Google Cloud Console).
- DB enforces PK + FK cascade, unique constraints (email, username); zod input validation on every POST/PATCH.

---

## License

MIT — see [LICENSE](./LICENSE).
