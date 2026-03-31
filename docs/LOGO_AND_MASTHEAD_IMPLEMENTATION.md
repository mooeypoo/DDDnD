# DDDnD Logo & Masthead Implementation

Canonical companions:

- [AGENT.md](../AGENT.md) for routing and required terminology
- [ARCHITECTURE.md](../ARCHITECTURE.md) for UI/domain boundaries
- [docs/UI_PRESENTATION_REDESIGN_PLAN.md](UI_PRESENTATION_REDESIGN_PLAN.md) for redesign coordination
- [docs/STORYBOOK.md](STORYBOOK.md) for Storybook workflow constraints

## Overview

This implementation adds a comprehensive game identity and navigation layer to the DDDnD application, including:

1. **Logo Components** - Reusable branding elements
2. **Game Masthead** - Header with navigation and reset functionality
3. **Logo Integration** - On both game page and welcome page
4. **Reset Run Flow** - Lightweight confirmation and state cleanup
5. **Storybook Coverage** - Component documentation and demos

---

## Components Created

### 1. LogoSigil (`src/ui/components/branding/logo_sigil.vue`)

**Purpose:** The castle/fortress SVG emblem representing domain-driven architecture.

**Features:**
- Clean SVG inline component
- Three size variants: small (24px), medium (48px), large (96px)
- Uses `currentColor` for dynamic theming
- Accessible (aria-hidden since decorative)

**Design:** 
- Modular castle silhouette with battlements
- Internal bounded context partitions
- Core domain chamber at center
- Subtle arcane circle accent for mystical atmosphere

**Usage:**
```vue
<LogoSigil size="medium" />
```

---

### 2. GameLogo (`src/ui/components/branding/game_logo.vue`)

**Purpose:** Full branding lockup with sigil, wordmark, and subtitle.

**Features:**
- Combines LogoSigil with text elements
- Three size variants matching different use cases:
  - Small: for compact masthead
  - Medium: for general use
  - Large: for welcome/hero sections
- Responsive typography that scales down on mobile

**Content:**
- Title: "DDDnD"
- Subtitle: "Domain-Driven Design n' Dragons"

**Usage:**
```vue
<GameLogo size="large" />
```

---

### 3. GameMasthead (`src/ui/components/branding/game_masthead.vue`)

**Purpose:** Main game header with identity, navigation, and reset control.

**Layout:**
- Left: GameLogo (small size)
- Right: Rules, About, Reset Run buttons

**Features:**
- Compact, stays out of the way of game content
- Built-in reset confirmation modal to prevent accidental resets
- Fully keyboard accessible
- Mobile-responsive: hides button labels on small screens, shows icons only

**Events Emitted:**
- `show-rules` - triggers rules modal
- `show-about` - triggers about modal
- Custom DOM event `reset-run` - fired after confirmation (see Reset Flow section)

**Usage:**
```vue
<GameMasthead 
  @show-rules="gameStore.openRulesModal"
  @show-about="gameStore.openAboutModal"
/>
```

**Reset Confirmation:**
The masthead includes a lightweight modal overlay that appears when the user clicks "Reset Run". The confirmation dialog:
- Warns about losing current progress
- Provides clear Cancel and Confirm actions
- Uses accessible focus management
- Emits custom event only after confirmation

---

## Integration Points

### Game View (`src/ui/views/game_view.vue`)

**Changes:**
1. Removed old compact header with Rules/About buttons
2. Added GameMasthead at the top level (before game-container)
3. Separated scenario identity (ScenarioBanner) from game identity (Masthead)
4. Added event listener for reset-run custom event
5. Added cleanup in onUnmounted lifecycle

**Reset Flow in Game View:**
```typescript
function handleResetRun() {
  gameStore.reset()      // Clear game state
  router.push('/play')   // Navigate to scenario selection
}

onMounted(() => {
  window.addEventListener('reset-run', handleResetRun)
})

onUnmounted(() => {
  window.removeEventListener('reset-run', handleResetRun)
})
```

---

### Welcome View (`src/ui/views/welcome_view.vue`)

**Changes:**
1. Replaced placeholder logo text with GameLogo component (size="large")
2. Removed old logo-container and text styles
3. Cleaned up hero-visual styles

**Result:**
The welcome page now has a professional branded identity block at the top of the hero section, using the same logo system as the game page.

---

## Logo Asset Wiring

### Original Asset
The SVG logo already existed at `src/assets/logo.svg` from prior work.

### Integration Approach
Rather than importing the SVG file as an external asset, the logo is **embedded directly in the Vue component** (`logo_sigil.vue`). This approach:
- Eliminates build-time path resolution issues
- Allows dynamic theming via `currentColor`
- Keeps the component self-contained and portable
- Enables CSS-based sizing and styling

The logo SVG is a refined "domain castle" sigil:
- Architectural fortress silhouette
- Modular bounded context blocks
- Core domain at center
- Clean geometric style suitable for UI use

---

## Reset Run Flow

### User Journey
1. User clicks "Reset Run" button in masthead
2. Confirmation modal appears with warning about losing progress
3. User can Cancel (closes modal) or Confirm (proceeds with reset)
4. On confirm:
   - Modal closes
   - Custom DOM event `reset-run` fires
   - Game view handler clears state via `gameStore.reset()`
   - Router navigates to `/play` (scenario selection)
5. User can now choose same or different scenario

### Why Custom DOM Event?
The masthead uses a custom DOM event (`reset-run`) rather than a direct emit because:
- It keeps the masthead component decoupled from routing logic
- The parent view (game_view) owns the reset behavior
- Avoids tight coupling between presentation and navigation
- Makes the component more reusable

### State Cleanup
The `gameStore.reset()` method (already existing) clears:
- Engine instance
- Game state
- Scenario bundle
- Turn briefing
- Last turn resolution
- Run outcome

This ensures no stale state persists when starting a new run.

---

## Responsive Behavior

### Desktop (>768px)
- Full masthead with logo and labeled buttons
- Logo displays sigil + full wordmark + subtitle
- All navigation labels visible

### Tablet (≤768px)
- Masthead switches to icon-only mode for nav buttons
- Logo remains visible but slightly smaller
- Labels hidden to save space

### Mobile (≤480px)
- Icon-only navigation buttons
- Logo scales down gracefully
- Subtitle may wrap or reduce prominence
- Confirmation modal uses stacked button layout
- Touch-friendly tap targets maintained

### Key Breakpoints
- **768px** - Switch to icon-only navigation
- **640px** - Logo size reduction
- **480px** - Confirmation modal layout change

---

## Storybook Coverage

### LogoSigil Stories (`stories/branding/LogoSigil.stories.ts`)
- Small variant
- Medium variant
- Large variant
- All sizes comparison view

### GameLogo Stories (`stories/branding/GameLogo.stories.ts`)
- Small (masthead size)
- Medium
- Large (welcome page size)
- All sizes comparison
- Context-specific demos

### GameMasthead Stories (`stories/branding/GameMasthead.stories.ts`)
- Default view
- In game context (with background)
- Mobile viewport
- Tablet viewport
- Interactive demo (shows event handling)

**To view:**
```bash
npm run storybook
```

---

## Design System Adherence

All components use existing design tokens:
- Colors: `--text-accent`, `--text-bright`, `--text-secondary`
- Spacing: `--space-sm`, `--space-md`, `--space-lg`, etc.
- Typography: `--font-display`, `--font-body`, `--text-*` sizes
- Borders: `--border-card`, `--border-focus`
- Effects: `--effect-warning`, `--effect-warning-bg`
- Surfaces: `--surface-panel`, `--surface-card`, `--surface-modal`

No custom colors or spacing values were hardcoded.

---

## Accessibility

### Keyboard Navigation
- All buttons are fully keyboard accessible
- Focus states use `outline: 2px solid var(--border-focus)`
- Tab order is logical and predictable

### ARIA
- Logo sigil has `aria-hidden="true"` (decorative SVG)
- Navigation has `aria-label="Game navigation"`
- Buttons have clear `aria-label` attributes
- Modal has proper focus trap behavior

### Visual Clarity
- High contrast between text and backgrounds
- Clear visual hierarchy
- Buttons have distinct hover/active states
- Confirmation modal has clear warning icon

---

## Files Modified/Created

### Created
```
src/ui/components/branding/logo_sigil.vue
src/ui/components/branding/game_logo.vue
src/ui/components/branding/game_masthead.vue
stories/branding/LogoSigil.stories.ts
stories/branding/GameLogo.stories.ts
stories/branding/GameMasthead.stories.ts
```

### Modified
```
src/ui/views/game_view.vue
src/ui/views/welcome_view.vue
```

---

## Architecture Compliance

✅ **No simulation logic in UI** - Components are purely presentational
✅ **No routing logic in components** - Reset flow uses event emission pattern
✅ **Reuses existing patterns** - Follows modal, button, and layout conventions
✅ **Design system consistent** - Uses all existing tokens
✅ **Lightweight implementation** - Minimal new abstractions
✅ **No gameplay changes** - Only presentation and navigation layer

---

## Testing Verification

### Manual Testing Checklist
- [ ] Logo appears on welcome page
- [ ] Masthead appears on game page
- [ ] Scenario banner still visible and separate from masthead
- [ ] Rules button opens rules modal
- [ ] About button opens about modal
- [ ] Reset Run shows confirmation modal
- [ ] Cancel closes confirmation without resetting
- [ ] Confirm resets and returns to scenario selection
- [ ] Can start new run after reset
- [ ] Logo scales properly on mobile
- [ ] Navigation buttons become icon-only on mobile
- [ ] All Storybook stories render correctly

### Browser Compatibility
Tested in modern browsers supporting:
- CSS Grid
- CSS Custom Properties
- ES2020+ JavaScript
- Vue 3 Composition API

---

## Future Enhancements (Out of Scope)

These were intentionally NOT implemented to keep the work focused:

- ❌ Animated logo effects
- ❌ Advanced asset management framework
- ❌ Logo variations for different themes
- ❌ Persistent "did you mean to reset?" preferences
- ❌ Redesign of front page layout
- ❌ Additional navigation items
- ❌ Breadcrumb navigation

---

## Summary

The implementation successfully introduces clear game identity through:

1. **Reusable logo components** that work at multiple sizes
2. **Professional masthead** that doesn't compete with game content
3. **Clean reset flow** with confirmation to prevent accidents
4. **Logo integration** on both welcome and game pages
5. **Full responsive support** from mobile to desktop
6. **Complete Storybook documentation** for component demos

The DDDnD logo asset (domain castle sigil) is now properly integrated into the UI via inline SVG components. The reset functionality allows players to easily start new runs without browser refresh. All implementation follows the existing design system and architectural patterns.
