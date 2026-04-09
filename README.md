<div align="center">

# 🔄 SelfSync

**Your all-in-one personal productivity companion**

[![React Native](https://img.shields.io/badge/React%20Native-0.84-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Android](https://img.shields.io/badge/Android-Ready-34A853?style=for-the-badge&logo=android&logoColor=white)](https://developer.android.com)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

*Plan your day. Track your habits. Monitor your health. Manage your money.*

</div>

---

## ✨ Features

### 📅 Daily Planner
- Create and manage daily tasks
- Mark tasks as complete with satisfying animations
- Persistent storage — your tasks survive app restarts
- Progress circle showing tasks completed vs total

### 🔥 Habit Tracker
- Build and track recurring habits
- Visual streak indicators
- Progress overview on the dashboard

### 🍎 AI Calorie Tracker *(powered by Groq + Llama 4 Vision)*
- 📷 **Take a photo** of your meal — AI identifies the food and estimates calories automatically
- 🧠 Intelligent food recognition with ingredient-level breakdown
- ✏️ Edit AI suggestions before logging
- Daily calorie goal tracking with visual progress bar
- Manual entry fallback for any food
- Detects non-food images (won't let you log a photo of a wall!)

### 💸 Expense Tracker
- Income-first budgeting — set your monthly income, track spending against it
- Category breakdown: Food 🍔, Travel ✈️, Personal 🛍️
- Daily and monthly views
- Colour-coded budget progress (green → orange → red as you approach limit)
- Persistent expense history

### 🌙 Dark / Light Mode
- Full system-aware theming
- Toggle from the dashboard header
- All screens respect the active theme

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native 0.84 (CLI) |
| Language | TypeScript 5.8 |
| Navigation | React Navigation 7 (Native Stack) |
| Storage | AsyncStorage |
| AI Vision | Groq API — Llama 4 Scout Vision |
| Camera | react-native-image-picker |
| Icons | react-native-vector-icons (Ionicons) |
| Charts | react-native-svg |
| Safe Area | react-native-safe-area-context |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 22
- JDK 17
- Android Studio + Android SDK
- A physical Android device or emulator

### 1. Clone the repo

```bash
git clone https://github.com/MJamal26/SelfSync.git
cd SelfSync
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up your API key

The AI calorie scanner uses the **Groq API** (free tier — no credit card needed).

1. Sign up at [console.groq.com](https://console.groq.com)
2. Create a free API key
3. Copy the example config:

```bash
# Windows
copy src\config\keys.example.ts src\config\keys.ts

# macOS / Linux
cp src/config/keys.example.ts src/config/keys.ts
```

4. Open `src/config/keys.ts` and paste your key:

```ts
export const GROQ_API_KEY = 'gsk_your_key_here';
```

> ⚠️ `keys.ts` is gitignored and will never be committed. Never commit your API key directly.

### 4. Run on Android

```bash
# Start Metro bundler
npm start

# In another terminal — install and launch on device/emulator
npm run android
```

---

## 📱 Building a Release APK

```bash
# Generate a release APK
npm run build:apk

# Generate an AAB (Play Store)
npm run build:aab

# Clean + build APK
npm run build:release
```

Output: `android/app/build/outputs/apk/release/app-release.apk`

---

## 📂 Project Structure

```
SelfSync/
├── src/
│   ├── screens/
│   │   ├── DashboardScreen.tsx       # Home with progress circles
│   │   ├── DailyPlannerScreen.tsx    # Task management
│   │   ├── HabitTrackerScreen.tsx    # Habit tracking
│   │   ├── CalorieTrackerScreen.tsx  # AI food scanner + calorie log
│   │   └── ExpenseTrackerScreen.tsx  # Budget & expense management
│   ├── components/
│   │   ├── ProgressCircle.tsx        # SVG circular progress indicator
│   │   ├── ScreenHeader.tsx          # Consistent screen header
│   │   └── ...
│   ├── config/
│   │   ├── groq.ts                   # Groq AI service (food analysis)
│   │   ├── keys.ts                   # 🔒 Gitignored — your API keys
│   │   └── keys.example.ts           # Template — safe to commit
│   ├── context/
│   │   └── ThemeContext.tsx          # Dark/light theme provider
│   ├── navigation/
│   │   └── AppNavigator.tsx          # Navigation stack
│   └── types/
│       └── index.ts                  # Shared TypeScript types
├── android/                          # Native Android project
├── .gitignore
└── package.json
```

---

## 🔒 Security

- API keys are stored in `src/config/keys.ts` which is listed in `.gitignore`
- Never hardcode secrets directly in source files
- The `keys.example.ts` file shows the required structure without real values

---

## 🗺️ Roadmap

- [ ] iOS support (requires macOS + Xcode)
- [ ] Nutrition macros breakdown (protein / carbs / fat)
- [ ] Weekly/monthly expense charts
- [ ] Habit streak calendar view
- [ ] Cloud sync / backup
- [ ] Widget support

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

Made with ❤️ using React Native

</div>
