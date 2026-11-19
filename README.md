# Clario Monorepo

> AI-powered articulation tool that helps users to clarify thoughts, organize ideas, and speak confidently through consistent daily articulation practice.

Monorepo for the **Clario** mobile application and Python backend service.

## Structure

```
clario/
├── mobile/       # Mobile application (React Native / Expo + Expo Router)
└── server/       # Python backend server
```

## Getting Started

### Mobile App (`/mobile`)

```bash
cd mobile
npm install
npm run start
```

Available commands:
- `npm run start`: Start Expo dev server
- `npm run android`: Start on Android emulator / device
- `npm run ios`: Start on iOS simulator (macOS required)
- `npm run web`: Start in web browser
