# 🏋️ RepQuest

A gamified workout tracker built with **Expo (SDK 57) + React Native + TypeScript**.
RepQuest suggests which muscles to train today, shows you how to do each exercise, logs your sets, and rewards consistency with XP, levels and titles.

> The full product plan (features, data model, roadmap) lives in [`docs/PLAN.md`](docs/PLAN.md).

---

## ✅ What's built (Phase 1 + core of Phase 2)

| Area | What works |
|---|---|
| **Login** | Lifting intro animation, then email/password sign-in, sign-up and password reset via Supabase; or use the app without an account |
| **Cloud sync** | Signed-in accounts sync workouts, XP, PRs and settings to Supabase (photos stay on the phone); asks which copy to keep if both changed |
| **Onboarding** | Name → training split → equipment, with animated step transitions |
| **Today** | Recovery-aware daily suggestion (PPL / Upper-Lower / Full Body / Body Part / Two Muscles a Day), readiness %, body map of target muscles, auto-built exercise list, switch focus, rest-day mode |
| **Library** | 112 curated exercises across 11 muscle groups · search · muscle & equipment filters · favourites · **tap-a-muscle body map filter** |
| **Exercise detail** | Looping form preview (start ↔ end position cross-fade), primary/secondary muscle map, step-by-step instructions, your best & last session |
| **Workout logger** | Sets × kg × reps, pre-filled from last session, progressive-overload hint per exercise, animated set check-off with haptics, rest timer sheet (±15s, skip), add/remove sets & exercises, screen stays awake |
| **Summary** | XP count-up, breakdown, level-up banner, new PRs, achievement unlocks |
| **Progress** | Stats, **recovery heatmap** body map, weekly sets-per-muscle balance, 8-week volume / sets / workouts chart, per-exercise strength trend (est. 1RM), PR list, 5-week calendar, history |
| **Profile** | Level ring, title ladder (11 titles), 10 achievements, split / equipment / rest-timer settings, reset |
| **Quests** | 3 daily quests + 1 weekly quest, picked per day/week and filtered by your equipment; bonus XP paid when a workout finishes |
| **Streak freezes** | Earn a token every 7 streak days (max 2); missed days are covered automatically if you hold enough tokens |
| **Custom exercises** | Create your own (muscles, equipment, steps, photo); they work in plans, workouts, PRs, charts and suggestions; edit or delete any time |
| **Weekly schedule** | Pick your training days in Profile; the others are rest days that never break your streak. A **Rest today** button is always on the Today card (+10 XP) |
| **Reminders** | Weekly training reminders on chosen days and time, plus an 8:30 PM streak warning when today isn't saved yet |
| **Body stats** | Weight, waist, chest and arm with a weight trend chart; progress photos from the camera or library, stored only on the device |
| **Your data** | JSON backup and restore, CSV export of every set (opens in Excel / Sheets) |
| **Language** | English and Bahasa Melayu, following the device by default; switch in Profile or on the first onboarding screen |
| **Gamification** | XP per set (capped), workout bonus, plan bonus, PR bonus, streak bonus · level curve `100 × n^1.5` · streaks that count logged rest days |

Everything is stored **offline on the device** (SQLite key-value store) — no account needed.

---

## 🚀 Run it

**Requirements:** Node.js 20+ and the **Expo Go** app (SDK 57) on your phone.

```bash
npm install
npx expo start
```

**Login setup:** copy `.env.example` to `.env.local` and fill in your Supabase project URL and publishable key (Supabase → Connect). Without it the app still runs; the login page offers “Use without an account”. For cloud sync, run [`supabase/migrations/0001_user_data.sql`](supabase/migrations/0001_user_data.sql) once in Supabase → SQL Editor.

Scan the QR code with Expo Go (Android) or the Camera app (iOS). Every library used is supported by Expo Go, so no custom build is needed to try it.

Other commands:

```bash
npx tsc --noEmit     # typecheck
npx expo lint        # lint
npx expo start --web # quick look in the browser (preview only)
```

### Build an installable app (later)

```bash
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview   # APK
```

---

## 🧰 Stack actually used

| Layer | Choice |
|---|---|
| Framework | Expo SDK 57, React Native 0.86, React 19, React Compiler on |
| Navigation | Expo Router (native tabs: Liquid Glass on iOS, Material 3 on Android) |
| State | Zustand + `persist` |
| Storage | `expo-sqlite/kv-store` (device) · `localStorage` (web preview) |
| Animation | React Native Reanimated 4 (springs, layout & entering animations, animated SVG) |
| Body map | `react-native-body-highlighter` on `react-native-svg` |
| Icons | `expo-symbols` (SF Symbols on iOS, Material Symbols on Android) |
| Media | `expo-image` (cached exercise frames) |
| Feedback | `expo-haptics`, `expo-keep-awake` |
| Reminders | `expo-notifications` (local, scheduled weekly + streak warning) |
| Photos & files | `expo-image-picker`, `expo-file-system`, `expo-sharing`, `expo-document-picker` |
| Language | Small typed dictionary in `src/i18n` (EN / BM) + `expo-localization` for the device default |

**Changes from the plan:** Phase 1 stores state as JSON in SQLite via Zustand rather than Drizzle tables — simpler while the data model settles. Move to Drizzle when cloud sync arrives. NativeWind was skipped in favour of a small token-based `StyleSheet` theme (`src/constants/theme.ts`). i18next was replaced by a ~60-line typed dictionary (`src/i18n`) — the Malay file is typed against the English keys, so a missing translation fails `tsc`. Level-up and unlock celebrations use a Reanimated confetti burst instead of Lottie files, so there are no third-party animation assets to license.

---

## 📁 Structure

```
src/
├── app/                      # Expo Router screens
│   ├── _layout.tsx           # Root stack, hydration gate, onboarding guard
│   ├── onboarding.tsx
│   ├── (tabs)/               # Today · Library · Progress · Profile
│   ├── exercise/[id].tsx     # Exercise detail
│   └── workout/              # active · add (picker) · summary
├── components/               # BodyMap, ExercisePreview, XpCard, StreakWeek, RestTimer…
│   └── ui/                   # Text, Icon, PressableScale, Card/Button/Chip/ProgressBar, Screen
├── constants/                # theme, muscles, splits, progression (titles/XP/achievements)
├── data/exercises.ts         # Curated exercise library (generated)
├── lib/                      # suggestion engine, recovery, progression maths, dates, storage
├── stores/app-store.ts       # All app state + actions (finishWorkout computes XP/PRs/achievements)
└── types.ts
```

### Key logic
- **`lib/suggestion.ts`** — picks the next day in your split; if its muscles are < 80% recovered it switches to the most-recovered day; after 3 training days in a row (or nothing recovered) it suggests rest. Exercise picks favour compound moves, respect your equipment, and rotate away from recent sessions (stable within a day).
- **`lib/recovery.ts`** — per-muscle recovery from the last 5 days (48–60h for big muscles, 32–40h for small; secondary muscles count as half).
- **`stores/app-store.ts → finishWorkout`** — volume, PRs (Epley 1RM; first log is a baseline, not a PR), XP breakdown, streak, achievements.

---

## 📚 Exercise data

Exercises and images come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db) (public domain / Unlicense). Images load from GitHub on first view and are cached, so the library list works offline but previews need a connection the first time.

---

## 🗺 Next steps

- [x] Daily quests & streak-freeze tokens
- [x] Progressive-overload hints ("try 22.5 kg")
- [x] Reminders with `expo-notifications`
- [x] Charts per exercise (weight over time)
- [x] Bahasa Melayu translation
- [x] Body stats & progress photos
- [x] Data export / import (JSON backup, CSV of sets)
- [x] Custom exercises
- [ ] Supabase auth + cloud sync (needs a Supabase project)
- [ ] Apple Health / Health Connect (needs a development build — not available in Expo Go)
- [ ] Bahasa Melayu exercise instructions (exercise names and steps are still English)

---

⚠️ General fitness guidance only — not medical advice.

MIT © Muhammad Hafizi Syamir Bin Herman
