# Technical Specifications

## Data Models

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  duration: number; // minutes
  startTime: string; // HH:mm
  icon: string; // Emoji
  date: string; // YYYY-MM-DD
  color: string; // Tailwind class string
  completed: boolean;
}
```

### ThemeConfig
```typescript
interface ThemeConfig {
  accentColor: string; // Tailwind color class
  backgroundPreset: 'midnight' | 'cosmic' | 'obsidian';
  showParticles: boolean;
  particleType: 'meteors' | 'leaves';
  journalStyle: 'astral' | 'mono';
  showMoodStar: boolean;
}
```

## UI Engine
- **Framework**: React 19.
- **Styling**: Tailwind CSS + custom CSS animations (`@keyframes`).
- **Animations**: CSS transitions + Tailwind `animate-in` for view transitions.
- **Sensory**: `Notification` API for alerts, `navigator.vibrate` for haptics.

### Atmospheric Rendering
- **Meteors (Stellar Stream)**: Uses a `Meteor` class with linear gradients and overscan resets.
- **Leaves (Maple Descent)**: Uses a `Leaf` class with a custom SVG path (`leafPath`) and oscillation physics (`Math.sin(swing)`).

### Audio Engine
- **Capture**: `MediaRecorder` with `audio/webm` or `audio/mp4` fallback.
- **Visualization**: `AudioContext` + `AnalyserNode` feeding a 60fps Canvas loop that renders ribbons of "nebula" and "core" frequency data.

## AI Integration
- **Model**: `gemini-3-flash-preview`.
- **Primary Use Case**: Semantic icon mapping (`suggestTaskIcon`).
