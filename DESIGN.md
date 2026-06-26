# 🎨 Design System

## Philosophy

The whiteboard UI should feel **invisible** — the canvas is the hero. Controls should be minimal, contextual, and non-intrusive, similar to Excalidraw's approach.

## Color Palette

| Token | Value | Usage |
|---|---|---|
| `--bg-primary` | `#1e1e2e` | Canvas background |
| `--bg-surface` | `#2a2a3e` | Toolbar/panel backgrounds |
| `--bg-elevated` | `#363650` | Hover states, dropdowns |
| `--text-primary` | `#cdd6f4` | Primary text |
| `--text-secondary` | `#a6adc8` | Secondary/muted text |
| `--accent` | `#89b4fa` | Selected tool, active state |
| `--accent-hover` | `#74c7ec` | Accent hover |
| `--border` | `#45475a` | Subtle borders |
| `--cursor-self` | `#89b4fa` | Your cursor color |
| `--cursor-peer` | dynamically assigned | Other users' cursors |

## Typography

- **UI Font**: `Inter`, sans-serif
- **Canvas Text**: `Inter`, sans-serif (rendered on canvas)
- **Monospace**: `JetBrains Mono` (code blocks in lessons)

## Layout

```
┌─────────────────────────────────────────────┐
│ Toolbar (top)                                │
│ [Select] [Pen] [Rect] [Ellipse] [Text] ...  │
├─────────────────────────────────────────────┤
│                                             │
│              Canvas (infinite)              │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│ Status Bar: Room ID │ Users Online │ Sync   │
└─────────────────────────────────────────────┘
```

## Cursor Design

Each connected user gets a colored cursor label:

```
  ╱
 ╱  ← pointer
╱
 ┌──────────┐
 │ Preeti   │ ← name badge
 └──────────┘
```

## Canvas Grid

- Light dot grid on dark background
- Grid snapping (optional, toggle-able)
- Infinite canvas with pan & zoom (trackpad/scroll)

---

> Updated as UI components are built.
