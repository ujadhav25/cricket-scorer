# Cricket Scorer — UI/UX Design System

## Overview

Cricket Scorer uses a dark-first design language built on **Tailwind CSS** with **CSS custom properties** for theming. The visual style is modern, glass-morphic, and cricket-themed — centered around a signature green palette with amber accents.

---

## Color System

### Brand Colors

| Name | Hex | Usage |
|------|-----|-------|
| `cricket-green` | `#22c55e` | Primary brand color, CTAs, active states |
| `cricket-amber` | `#f59e0b` | Accent, highlights, warnings |

### Cricket Green Scale

| Token | Hex |
|-------|-----|
| `cricket-green-50` | `#f0fdf4` |
| `cricket-green-100` | `#dcfce7` |
| `cricket-green-200` | `#bbf7d0` |
| `cricket-green-300` | `#86efac` |
| `cricket-green-400` | `#4ade80` |
| `cricket-green-500` | `#22c55e` ← default |
| `cricket-green-600` | `#16a34a` |
| `cricket-green-700` | `#15803d` |
| `cricket-green-800` | `#166534` |
| `cricket-green-900` | `#14532d` |

### Semantic Color Tokens (CSS Variables)

These are resolved via `hsl(var(--token))` and adapt per theme:

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `hsl(0 0% 98%)` | `hsl(225 25% 5%)` | Page background |
| `--foreground` | `hsl(225 25% 8%)` | `hsl(210 40% 98%)` | Default text |
| `--card` | `hsl(0 0% 100%)` | `hsl(225 25% 8%)` | Card surfaces |
| `--primary` | `hsl(152 76% 36%)` | `hsl(152 76% 44%)` | Brand green |
| `--accent` | `hsl(43 100% 50%)` | `hsl(43 100% 56%)` | Amber highlight |
| `--muted` | `hsl(220 14% 96%)` | `hsl(225 20% 12%)` | Subdued surfaces |
| `--muted-foreground` | `hsl(220 10% 45%)` | `hsl(220 15% 65%)` | Secondary text |
| `--border` | `hsl(220 13% 91%)` | `hsl(225 15% 15%)` | Borders, dividers |
| `--destructive` | `hsl(0 72% 51%)` | `hsl(0 72% 51%)` | Errors, delete |
| `--ring` | matches `--primary` | matches `--primary` | Focus ring |
| `--radius` | `0.875rem` | — | Base border radius |

---

## Typography

| Element | Style |
|---------|-------|
| Font family | `Inter`, system-ui, sans-serif |
| Feature settings | `cv02`, `cv03`, `cv04`, `cv11` (Inter's tabular numerals, etc.) |
| Antialiasing | `antialiased` |

### Scale (Tailwind defaults)

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Labels, metadata, badges |
| `text-sm` | 14px | Body text, table cells |
| `text-base` | 16px | Standard text |
| `text-lg` | 18px | Card titles |
| `text-xl` | 20px | Section headings |
| `text-2xl` | 24px | Page titles |
| `text-3xl+` | 30px+ | Hero text |

### Special Utilities

```css
.text-gradient        /* green gradient text */
.text-gradient-amber  /* amber gradient text */
```

---

## Spacing & Layout

- **Container max width**: `1400px` (`2xl` breakpoint)
- **Container padding**: `2rem`
- **Base border radius**: `0.875rem` → maps to `rounded-lg`
  - `rounded-md` = `calc(0.875rem - 2px)` ≈ `0.75rem`
  - `rounded-sm` = `calc(0.875rem - 4px)` ≈ `0.625rem`
- Components generally use `rounded-xl` (11px) or `rounded-2xl` (16px)

---

## Components

### Button

Variants defined via `cva`:

| Variant | Style |
|---------|-------|
| `default` | Green gradient, drop shadow, brightens on hover |
| `destructive` | Red gradient, drop shadow |
| `outline` | Transparent with border; subtle bg on hover |
| `secondary` | Muted surface |
| `ghost` | No bg; subtle white overlay on hover |
| `link` | Underline on hover |
| `amber` | Amber gradient, drop shadow |
| `glass` | Glassmorphic background |

Sizes:

| Size | Height | Padding |
|------|--------|---------|
| `sm` | `h-9` | `px-3.5`, `text-xs`, `rounded-lg` |
| `default` | `h-10` | `px-5` |
| `lg` | `h-11` | `px-8` |
| `xl` | `h-14` | `px-8`, `text-base`, `rounded-2xl` |
| `icon` | `h-10 w-10` | — |

All buttons: `active:scale-[0.98]`, `transition-all duration-200`, min touch target `44px`.

---

### Card

```tsx
<Card>           // rounded-2xl border border-border/40 bg-card/80 backdrop-blur-sm shadow-sm
  <CardHeader>   // p-6 flex flex-col space-y-1.5
    <CardTitle>  // text-lg font-bold
    <CardDescription> // text-sm text-muted-foreground
  <CardContent>  // p-6 pt-0
```

---

### Input

- Height: `h-10`
- Style: `rounded-xl border border-input bg-background/50 px-4 py-2 text-sm`
- Focus: `ring-2 ring-ring ring-offset-2 ring-offset-background`
- Disabled: `opacity-50 cursor-not-allowed`

---

## Special Effects

### Glassmorphism

```css
.glass {
  background: hsl(var(--glass) / 0.6);
  backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid hsl(var(--border) / 0.5);
}

.glass-strong {
  background: hsl(var(--glass) / 0.8);
  backdrop-filter: blur(40px) saturate(200%);
  border: 1px solid hsl(var(--border) / 0.4);
}
```

### Glow Effects

```css
.glow-green  /* box-shadow with primary/15 */
.glow-amber  /* box-shadow with accent/15  */
```

### Gradient Backgrounds

```css
.bg-gradient-radial  /* radial green glow at top */
.bg-mesh             /* multi-point green+amber mesh */
.bg-mesh-subtle      /* lighter mesh variant */
```

### Gradient Border

```css
.gradient-border  /* ::before pseudo-element with green-to-amber gradient border */
```

---

## Animations

| Class | Keyframe | Duration | Usage |
|-------|----------|----------|-------|
| `animate-fade-in` | translateY(8px) → 0, opacity 0→1 | 0.4s ease-out | General reveal |
| `animate-fade-in-up` | translateY(20px) → 0 | 0.5s ease-out | Hero sections |
| `animate-slide-in-left` | translateX(-16px) → 0 | 0.3s ease-out | Sidebar items |
| `animate-slide-in-right` | translateX(16px) → 0 | 0.3s ease-out | Panels |
| `animate-slide-up` | translateY(100%) → 0 | 0.4s cubic-bezier(0.16,1,0.3,1) | Modals, sheets |
| `animate-scale-in` | scale(0.95) → 1 | 0.3s ease-out | Dropdowns, popovers |
| `animate-shimmer` | bg-position sweep | 2s linear ∞ | Skeleton loaders |
| `animate-pulse-soft` | opacity 1→0.7→1 | 2s ease-in-out ∞ | Live indicators |
| `animate-bounce-subtle` | translateY 0→-4px→0 | 2s ease-in-out ∞ | Soft bounce |
| `animate-float` | translateY 0→-10px→0 | 6s ease-in-out ∞ | Hero decorations |
| `animate-float-up` | translateY+scale, opacity→0 | 2.2s forwards | Score reaction fx |

---

## Scrollbar

Custom thin scrollbar (5px) using WebKit API:
- Track: transparent
- Thumb: `hsl(var(--border))`, `border-radius: 100px`
- Thumb hover: `hsl(var(--muted-foreground) / 0.3)`

---

## Theming

- Dark mode via `class` strategy (`darkMode: ['class']`)
- Toggle managed by `components/ui/theme-toggle.tsx`
- `html.dark` sets `color-scheme: dark` for native UI elements
- Default is **light mode**

---

## Accessibility

- All interactive elements have `min-height: 44px` (WCAG touch target)
- Focus rings: `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2`
- `::selection` uses `hsl(var(--primary) / 0.3)` for branded text selection
- `scroll-behavior: smooth` for all pages

---

## Layout Patterns

### Protected App (sidebar nav)
- Left sidebar with icon + label nav links
- Main content scrollable area
- Mobile: bottom tab bar or condensed top nav

### Admin Panel
- Fixed left sidebar `w-56`, hidden on mobile (`hidden md:flex`)
- Mobile: horizontal scrollable top nav bar
- Sidebar sections: logo, logged-in identity, nav links, sign out

### Landing Page
- Full-screen sections with `scroll-snap-type: y mandatory`
- Dot navigation via `components/LandingDotNav.tsx`
- `ScrollReveal` component for entrance animations

---

## Scoring UI Patterns

- Live match state driven by Zustand store (`store/scoring.ts`)
- Real-time updates via Pusher channels
- Animations triggered on boundary/wicket/six events
- Components in `components/scoring/` and `components/animations/`
