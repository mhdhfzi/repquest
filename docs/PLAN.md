# 🏋️ RepQuest — Gamified Workout Tracker

> Train smarter, not randomly. RepQuest plans which muscle group to hit each day, shows you how to do every exercise, logs your sets, and turns consistency into XP, levels and titles.

*(RepQuest is a working name — rename freely.)*

---

## 📌 Table of Contents

1. [Problem & Goal](#-problem--goal)
2. [Core Features](#-core-features)
3. [Extra Features](#-extra-features)
4. [Tech Stack](#-tech-stack)
5. [Architecture](#-architecture)
6. [Project Structure](#-project-structure)
7. [Data Model](#-data-model)
8. [Smart Daily Suggestion Logic](#-smart-daily-suggestion-logic)
9. [Gamification System](#-gamification-system)
10. [Exercise Data & Media Sources](#-exercise-data--media-sources)
11. [Screens](#-screens)
12. [Getting Started](#-getting-started)
13. [Roadmap](#-roadmap)
14. [License](#-license)

---

## 🎯 Problem & Goal

**Problem:** Doing random exercises every day leads to unbalanced training — some muscles get overworked, others get skipped, and there's no sense of progress or motivation to stay consistent.

**Goal:** A mobile app that:

- Organises exercises by **muscle group**
- **Suggests** which muscle group(s) to train each day based on a split and recovery
- **Visualises** the muscles each exercise targets on a body map
- **Shows how** to perform each exercise (animation / GIF / video + steps)
- **Rewards consistency** with XP, levels, titles, streaks and achievements

---

## ✅ Core Features

### 1. Exercise Library by Muscle Group
- Browse groups: Chest, Back, Shoulders, Biceps, Triceps, Forearms, Abs/Core, Glutes, Quads, Hamstrings, Calves
- Filter by **equipment** (bodyweight, dumbbell, barbell, machine, resistance band) — great for home workouts
- Filter by **difficulty** (beginner / intermediate / advanced)
- Search by name
- Favourite exercises
- Add **custom exercises**

### 2. Muscle Map Visualisation
- Interactive front/back body diagram
- Each exercise highlights **primary** muscles (strong colour) and **secondary** muscles (light colour)
- Tap a muscle on the body map → see all exercises for that muscle
- **Recovery heatmap**: body map coloured by how recently each muscle was trained (red = fatigued, green = recovered)

### 3. Exercise Preview / How-To
- Looping animation or GIF of correct form
- Step-by-step instructions
- Common mistakes & form tips
- Target muscles, equipment, difficulty

### 4. Daily Muscle Group Suggestion
- Choose a training split (Full Body, Upper/Lower, Push/Pull/Legs, Bro Split, or Custom)
- Set your available training days per week
- App suggests **today's focus** (e.g. *"Today: Pull — Back & Biceps"*) and a ready-made exercise list
- Adapts if you skip a day or train something else (recovery-aware, see [logic](#-smart-daily-suggestion-logic))

### 5. Workout Logger
- Start a suggested workout or build your own
- Log **sets × reps × weight** (or duration for planks/cardio)
- Built-in **rest timer** with vibration/sound
- Auto-fills last session's numbers so you know what to beat
- Mark sets as warm-up / working / drop set
- Finish summary: total volume, duration, XP earned, PRs hit

### 6. Level-Up & Rewards
- Earn **XP** for completing sets, workouts and streaks
- **Levels** that require increasing XP
- Unlock **titles** as you level up (e.g. *Couch Potato → Rookie → Iron Apprentice → … → Legend*)
- **Achievements / badges** for milestones
- **Streaks** with streak-freeze tokens

---

## ✨ Extra Features

| Feature | Why it fits |
|---|---|
| **Personal Records (PRs)** | Auto-detect best weight / reps / estimated 1RM per exercise; celebrate new PRs |
| **Progressive overload hints** | "You did 3×10 @ 20 kg last time — try 22.5 kg or 3×11" |
| **Progress charts** | Volume per week, weight per exercise, workouts per month, muscle-group balance |
| **Workout calendar** | Month view with completed days, coloured by muscle focus |
| **Body stats tracking** | Weight, body measurements, optional progress photos (stored locally) |
| **Weekly muscle balance report** | Shows undertrained muscle groups so training stays balanced |
| **Warm-up & cool-down routines** | Short guided stretches tied to the day's muscle group |
| **Daily quests** | e.g. "Complete 15 sets today", "Train legs this week" — bonus XP |
| **Reminders** | Local push notifications on training days at a chosen time |
| **Rest-day mode** | Recovery days count toward the streak (prevents overtraining for XP) |
| **Workout templates** | Save and reuse favourite routines |
| **Offline-first** | Everything works with no internet; optional cloud sync |
| **Dark mode** | Default — easier in the gym |
| **Bilingual (EN / BM)** | English and Bahasa Melayu UI |
| **Health integration** *(later)* | Apple Health / Android Health Connect to sync workouts & body weight |
| **Data export** | Export history as CSV / JSON backup |

---

## 🧰 Tech Stack

### Mobile App (Frontend)

| Layer | Choice | Why |
|---|---|---|
| Framework | **React Native + Expo** (managed workflow, dev builds) | One codebase for Android & iOS; builds on existing React knowledge; fast iteration with Expo Go |
| Language | **TypeScript** | Type safety for data models & XP logic |
| Navigation | **Expo Router** (file-based) | Simple, modern routing with tabs & stacks |
| Styling | **NativeWind** (Tailwind for RN) | Fast, consistent styling, easy dark mode |
| UI components | **React Native Reusables** or **Tamagui** | Pre-built accessible components |
| State management | **Zustand** | Lightweight global state (active workout, user settings) |
| Server/async state | **TanStack Query** | Caching for any remote data (sync, exercise API) |
| Forms & validation | **React Hook Form + Zod** | Custom exercise and profile forms |
| Animations | **React Native Reanimated** + **Lottie** (`lottie-react-native`) | Smooth UI, XP bar fill, level-up / badge unlock celebrations |
| Muscle body map | **react-native-body-highlighter** (or custom SVG via **react-native-svg**) | Front/back body highlighting by muscle |
| Exercise media | **expo-image** (GIF/WebP) / **expo-video** | Exercise previews with caching |
| Charts | **Victory Native** (Skia-based) or **react-native-gifted-charts** | Progress & volume charts |
| Haptics & sound | **expo-haptics**, **expo-audio** | Rest timer alerts, set completion feedback |
| Notifications | **expo-notifications** | Training reminders, streak warnings |
| Keep awake | **expo-keep-awake** | Screen stays on during workouts |
| i18n | **i18next + react-i18next** | English / Bahasa Melayu |

### Data & Storage

| Layer | Choice | Why |
|---|---|---|
| Local database | **expo-sqlite** | Offline-first, relational data (workouts, sets, XP log) |
| ORM | **Drizzle ORM** | Type-safe queries + migrations, works with expo-sqlite |
| Key-value settings | **react-native-mmkv** | Fast storage for preferences/flags |
| Seed data | Bundled JSON of exercises (see [sources](#-exercise-data--media-sources)) | Library works offline from first launch |

### Backend (optional — Phase 3, for accounts & sync)

| Layer | Choice | Why |
|---|---|---|
| BaaS | **Supabase** (PostgreSQL + Auth + Storage) | Free tier, SQL matches local schema, auth built in |
| Auth | Supabase Auth (email, Google) | Cross-device login |
| File storage | Supabase Storage | Optional progress photo backup, custom exercise media |
| Edge logic | Supabase Edge Functions | Leaderboards, anti-cheat XP validation (if social features added) |

> **Alternative:** Firebase (Firestore + Auth) if you prefer NoSQL. Supabase is recommended because workout data is naturally relational.

### Tooling & Quality

| Purpose | Tool |
|---|---|
| Linting / formatting | ESLint + Prettier |
| Unit tests | Jest + React Native Testing Library |
| E2E tests | Maestro |
| Builds & releases | **EAS Build** / **EAS Submit** |
| OTA updates | **EAS Update** |
| Crash reporting | Sentry (`@sentry/react-native`) |
| Version control / CI | Git + GitHub Actions |
| Design | Figma |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     React Native (Expo)                   │
│                                                           │
│  Screens (Expo Router)                                    │
│     │                                                     │
│     ▼                                                     │
│  UI Components ── Body Map (SVG) ── Charts ── Lottie      │
│     │                                                     │
│     ▼                                                     │
│  State: Zustand (active workout, settings)                │
│     │                                                     │
│     ▼                                                     │
│  Domain Services                                          │
│   • SuggestionEngine  (which muscle group today)          │
│   • XPService         (XP, levels, titles, achievements)  │
│   • PRService         (personal records, 1RM)             │
│   • RecoveryService   (muscle fatigue heatmap)            │
│     │                                                     │
│     ▼                                                     │
│  Repository layer (Drizzle ORM)                           │
│     │                                                     │
│     ▼                                                     │
│  SQLite (on device)  ◄────── optional sync ──────►  Supabase
└──────────────────────────────────────────────────────────┘
```

Key principle: **offline-first**. The device database is the source of truth; cloud sync is an add-on.

---

## 📁 Project Structure

```
repquest/
├── app/                          # Expo Router screens
│   ├── (tabs)/
│   │   ├── index.tsx             # Home / Today
│   │   ├── library.tsx           # Exercise library
│   │   ├── progress.tsx          # Charts, PRs, calendar
│   │   └── profile.tsx           # Level, titles, achievements, settings
│   ├── exercise/[id].tsx         # Exercise detail + preview + muscle map
│   ├── workout/active.tsx        # Live workout logger
│   ├── workout/summary.tsx       # Post-workout summary + XP
│   └── onboarding/               # Goal, split, days, experience level
├── src/
│   ├── components/               # Reusable UI (BodyMap, XPBar, SetRow, RestTimer…)
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema
│   │   ├── migrations/
│   │   └── seed/exercises.json   # Bundled exercise library
│   ├── services/
│   │   ├── suggestionEngine.ts
│   │   ├── xpService.ts
│   │   ├── prService.ts
│   │   └── recoveryService.ts
│   ├── stores/                   # Zustand stores
│   ├── hooks/
│   ├── constants/                # muscles.ts, titles.ts, achievements.ts, splits.ts
│   ├── i18n/                     # en.json, ms.json
│   └── utils/
├── assets/
│   ├── lottie/                   # level-up, badge-unlock animations
│   ├── exercises/                # GIF/WebP previews
│   └── images/
├── __tests__/
├── app.json
├── eas.json
├── drizzle.config.ts
├── tailwind.config.js
└── package.json
```

---

## 🗄 Data Model

```sql
-- Static / seeded
muscle_groups      (id, name, region[upper|lower|core], body_side[front|back])
exercises          (id, name, description, instructions_json, tips_json,
                    equipment, difficulty, media_url, is_custom, created_at)
exercise_muscles   (exercise_id, muscle_group_id, role[primary|secondary])

-- User setup
user_profile       (id, name, experience_level, goal, split_type,
                    training_days_json, reminder_time, unit[kg|lb],
                    total_xp, level, active_title_id, created_at)
split_days         (id, split_type, day_index, label, muscle_groups_json)

-- Training
workout_templates  (id, name, exercise_ids_json, created_at)
workouts           (id, started_at, ended_at, focus_label, notes,
                    total_volume, xp_earned, is_rest_day)
workout_exercises  (id, workout_id, exercise_id, order_index)
sets               (id, workout_exercise_id, set_index, reps, weight_kg,
                    duration_sec, type[warmup|working|drop], completed)
personal_records   (id, exercise_id, type[max_weight|max_reps|est_1rm|max_volume],
                    value, achieved_at, workout_id)

-- Gamification
xp_events          (id, source[set|workout|streak|quest|achievement|pr],
                    amount, ref_id, created_at)
titles             (id, name, required_level, description)
achievements       (id, code, name, description, icon, xp_reward)
user_achievements  (achievement_id, unlocked_at)
streak             (current_days, longest_days, freeze_tokens, last_active_date)
daily_quests       (id, date, code, target, progress, completed, xp_reward)

-- Body tracking
body_stats         (id, date, weight_kg, waist_cm, chest_cm, arm_cm, photo_uri)
```

---

## 🧠 Smart Daily Suggestion Logic

The `SuggestionEngine` decides today's focus in three steps:

1. **Follow the split** — look up the next day in the user's chosen split (e.g. PPL: Push → Pull → Legs → Rest).
2. **Check recovery** — for each muscle group, compute hours since last trained and the volume done:
   - Large muscles (back, quads, chest, glutes, hamstrings): ~48–72 h recovery
   - Small muscles (biceps, triceps, calves, abs, forearms): ~24–48 h recovery
3. **Adjust** — if the planned group isn't recovered (or the user trained it off-plan), swap to the most-recovered, least-trained group this week. If nothing is recovered, suggest a **rest / mobility day**.

It then builds a workout:
- 4–6 exercises for the focus group(s)
- Starts with compound movements, then isolation
- Respects available equipment and experience level
- Avoids repeating the exact same exercises every session (rotation)

```ts
// Pseudocode
function suggestToday(user, history): Suggestion {
  const planned = nextSplitDay(user.split, history);
  const recovery = computeRecovery(history);           // 0–100% per muscle
  if (planned.muscles.every(m => recovery[m] >= 80)) return build(planned);
  const fallback = pickMostRecoveredUndertrained(recovery, weeklyVolume(history));
  return fallback ? build(fallback) : restDay();
}
```

---

## 🎮 Gamification System

### XP Sources

| Action | XP |
|---|---|
| Complete a working set | +5 |
| Complete a full workout (≥ 3 exercises) | +50 |
| Follow today's suggested muscle group | +20 bonus |
| Hit a new Personal Record | +30 |
| Complete a daily quest | +15 – 40 |
| Log a planned rest day | +10 |
| Streak bonus | +5 × current streak (capped at +100) |
| Unlock an achievement | varies |

> Anti-grinding: XP from sets is capped per workout (e.g. max 30 sets), so the system rewards **consistency**, not junk volume.

### Level Curve

```
XP required for level n = 100 × n^1.5   (rounded)

Level 2  →   283 XP
Level 5  → 1,118 XP
Level 10 → 3,162 XP
Level 20 → 8,944 XP
```

### Titles

| Level | Title |
|---|---|
| 1 | Couch Potato |
| 3 | Rookie Lifter |
| 5 | Gym Regular |
| 8 | Iron Apprentice |
| 12 | Rep Machine |
| 16 | Steel Warrior |
| 20 | Muscle Knight |
| 25 | Iron Champion |
| 30 | Titan |
| 40 | Legend |
| 50 | Mythic |

### Achievement Examples

- **First Rep** — complete your first workout
- **Week Warrior** — 7-day streak
- **Balanced Build** — train every muscle group in one week
- **Leg Day Survivor** — 10 leg workouts
- **PR Hunter** — set 10 personal records
- **Early Bird** — 5 workouts before 8 AM
- **Century** — 100 workouts completed
- **Tonne Club** — lift 1,000 kg total volume in one workout

### Streaks
- A day counts if you complete a workout **or** a planned rest day
- Earn a **streak freeze** token every 7 days (max 2) to protect the streak on a missed day

---

## 📚 Exercise Data & Media Sources

| Source | Type | Notes |
|---|---|---|
| **free-exercise-db** (GitHub: `yuhonas/free-exercise-db`) | JSON + images, public domain | ~800 exercises with muscles, equipment, level, instructions — good for seeding offline |
| **ExerciseDB API** (via RapidAPI) | API with animated GIFs | Good preview animations; check licence/terms and API limits before shipping |
| **wger** (wger.de) | Open-source API | Exercises, muscles, images; open licence |
| Custom Lottie / recorded clips | Own media | Best long-term option for consistent style and full rights |

> ⚠️ Always check each source's licence before publishing to the Play Store / App Store. Bundle the free data offline; load heavier GIFs/videos on demand with caching.

---

## 📱 Screens

1. **Onboarding** — name, goal (strength / muscle / fitness), experience, available equipment, split, training days, reminder time
2. **Home / Today** — today's suggested focus, body map preview, "Start Workout", streak, XP bar, daily quests
3. **Exercise Library** — muscle group tabs, filters, search, tap-on-body-map browsing
4. **Exercise Detail** — preview animation, instructions, tips, primary/secondary muscle map, history & PR for this exercise
5. **Active Workout** — exercise list, set logger, rest timer, previous numbers, add/swap exercise
6. **Workout Summary** — volume, duration, PRs, XP gained, level-up animation
7. **Progress** — calendar, charts, PR list, muscle balance report, recovery heatmap, body stats
8. **Profile** — level, current title, title collection, achievements, settings, export

---

## 🚀 Getting Started

### Prerequisites
- Node.js (LTS)
- Git
- Expo Go app on your phone (for quick testing) **or** Android Studio emulator / Xcode simulator
- An Expo account (for EAS builds)

### Setup

```bash
# 1. Create the project
npx create-expo-app@latest repquest --template default
cd repquest

# 2. Core dependencies
npx expo install expo-sqlite expo-notifications expo-haptics expo-image \
  expo-video expo-audio expo-keep-awake react-native-svg \
  react-native-reanimated lottie-react-native react-native-mmkv

# 3. Data, state & UI
npm install drizzle-orm zustand @tanstack/react-query \
  react-hook-form zod i18next react-i18next nativewind \
  react-native-body-highlighter victory-native
npm install -D drizzle-kit tailwindcss typescript

# 4. Run
npx expo start
```

> Note: MMKV and some native modules need a **development build** rather than Expo Go:
> ```bash
> npx expo install expo-dev-client
> eas build --profile development --platform android
> ```

### Database

```bash
npx drizzle-kit generate     # generate migrations from schema.ts
# migrations run automatically on app start via drizzle's migrate()
```

### Build for release

```bash
npm install -g eas-cli
eas login
eas build --platform android   # APK / AAB
eas build --platform ios
```

---

## 🗺 Roadmap

### Phase 1 — MVP (core loop)
- [ ] Project setup (Expo, TypeScript, Expo Router, NativeWind)
- [ ] SQLite + Drizzle schema, seed exercise library
- [ ] Exercise library with muscle group filter & search
- [ ] Exercise detail with preview + body map highlight
- [ ] Workout logger with rest timer
- [ ] Basic split selection & daily suggestion

### Phase 2 — Gamification & Progress
- [x] XP events, levels, titles
- [x] Streaks + streak freeze
- [x] Achievements & level-up animations (Reanimated confetti instead of Lottie)
- [x] Personal records & progressive overload hints
- [x] Progress charts, calendar, recovery heatmap
- [x] Daily quests
- [x] Reminders (local notifications)

### Phase 3 — Polish & Cloud
- [x] Bahasa Melayu translation (UI; exercise instructions still English)
- [x] Body stats & progress photos
- [x] Data export / import
- [ ] Supabase auth + cloud sync
- [ ] Apple Health / Health Connect integration

### Phase 4 — Social (optional)
- [ ] Friends & leaderboards (weekly XP)
- [ ] Shareable workout cards
- [ ] Community challenges

---

## ⚠️ Disclaimer

RepQuest provides general fitness guidance only and is not medical advice. Consult a qualified professional before starting a new exercise programme, especially if you have an injury or health condition.

---

## 📄 License

MIT © Muhammad Hafizi Syamir Bin Herman
