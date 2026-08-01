---
name: IronPixels Core
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#b9ccb2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#84967e'
  outline-variant: '#3b4b37'
  surface-tint: '#00e639'
  primary: '#ebffe2'
  on-primary: '#003907'
  primary-container: '#00ff41'
  on-primary-container: '#007117'
  inverse-primary: '#006e16'
  secondary: '#e9b3ff'
  on-secondary: '#510074'
  secondary-container: '#7d01b1'
  on-secondary-container: '#e5a9ff'
  tertiary: '#fff7f6'
  on-tertiary: '#690003'
  tertiary-container: '#ffd2cc'
  on-tertiary-container: '#c4010b'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#72ff70'
  primary-fixed-dim: '#00e639'
  on-primary-fixed: '#002203'
  on-primary-fixed-variant: '#00530e'
  secondary-fixed: '#f6d9ff'
  secondary-fixed-dim: '#e9b3ff'
  on-secondary-fixed: '#310048'
  on-secondary-fixed-variant: '#7200a3'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4aa'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930005'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
  obsidian-base: '#0A0A0A'
  charcoal-surface: '#1C1C1E'
  pixel-border: '#48484A'
  exp-blue: '#0A84FF'
  gold-loot: '#FFD60A'
typography:
  display-hero:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  stat-value:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '800'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
spacing:
  pixel-unit: 4px
  gutter-md: 16px
  margin-edge: 24px
  container-max: 600px
---

## Brand & Style

The design system embodies a **16-bit Retro RPG** aesthetic fused with **Modern Dark Mode** precision. It targets fitness enthusiasts who grew up with dungeon crawlers, bridging the gap between physical exertion and digital progression. 

The style is **Cyber-Retro-Brutalism**. It utilizes the structured, raw feeling of early console games—sharp edges, pixelated textures, and high-contrast color palettes—but applies modern UX principles like fluid spacing, subtle glows, and glassmorphism-inspired transparency to ensure it feels like a premium PWA rather than a dated emulator. Every interaction should feel like a "critical hit," evoking a sense of power, growth, and digital nostalgia.

## Colors

The palette is anchored in a deep **Obsidian** and **Charcoal** foundation to minimize eye strain in gym environments and make neon accents "pop." 

- **Primary (Matrix Green):** Used for leveling up, positive progression, and Tier A movement bonuses.
- **Secondary (Mana Purple):** Used for skill activations, special "Party" features, and epic loot.
- **Tertiary (Health Red):** Reserved for boss health bars, critical alerts, and heavy weight indicators.
- **Glow Effects:** All chromatic colors should be paired with a matching 10-20px outer glow (box-shadow) when an element is active or "charged" with energy.

## Typography

Typography uses a high-readability sans-serif for functional data entry and a technical, monospaced font for RPG mechanics.

- **Headlines:** Use **Space Grotesk** for a futuristic, geometric feel that mimics the structural nature of pixels.
- **RPG Stats & Labels:** Use **JetBrains Mono**. The monospaced nature is a nod to terminal interfaces and retro game stat screens, ensuring that numbers align perfectly in lists.
- **Body Text:** **Hanken Grotesk** provides a clean, modern contrast, ensuring that workout instructions and social feeds are easy to scan.
- **Styling Note:** For "Level Up" or "Boss Defeated" states, headers should use a `text-shadow` effect to simulate a glowing pixel font.

## Layout & Spacing

This design system uses a **fixed-fluid hybrid grid**. Since it is a PWA, the layout is optimized for a vertical mobile experience but centers itself within a 600px container on larger screens.

- **The 4px Rhythm:** All spacing must be multiples of 4px (the "pixel unit"). 
- **Layout Model:** A 4-column grid for mobile, expanding to 8 columns for tablets.
- **Combat Focus:** The "Combat Phase" (Workout Tracker) uses a focused, single-column layout to prevent distractions during lifting.
- **Hub View:** Uses a card-based "modular dashboard" where stats are grouped in 2x2 grids.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Luminescent Outlines** rather than traditional shadows.

- **Base Layer:** `#0A0A0A` (The Void).
- **Surface Layer:** `#1C1C1E` (The Plate). These surfaces should have a 1px solid border using `#48484A` (Pixel Border).
- **Interaction Depth:** When an element is pressed, it does not move "down" via shadow. Instead, the border color changes to the **Primary Green** and gains an outer glow of 8px.
- **Glassmorphism:** Use `backdrop-filter: blur(12px)` for sticky headers and navigation bars to provide a sense of transparency and modern layering over the background pixel art.

## Shapes

To maintain the 16-bit RPG aesthetic, **sharp edges (0px roundedness)** are the standard for all primary UI elements. 

To prevent the UI from feeling dated, use **stepped corners** (fake pixel-rounding) for high-level cards. This is achieved by using a clip-path or a custom SVG border that mimics a 4px pixel "staircase" on the corners. Input fields and secondary buttons remain strictly rectangular to emphasize the brutalist, functional nature of a "system" interface.

## Components

- **Buttons:** Rectangular with a 2px solid border. The "Primary Hit" button uses a green background with black text. On hover/active, it triggers a "flicker" animation.
- **Health Bars (RVS Bars):** High-contrast bars. The background is a dark neutral, and the "fill" is a solid neon color (Red for health, Blue for EXP) with a subtle horizontal "scanline" overlay.
- **Input Fields:** Dark charcoal background with a JetBrains Mono typeface. When focused, the border "charges up" with a Green glow.
- **Cards (Loot/Stats):** Feature a "pixel-frame" border. Use subtle 8-bit patterns (dots or diagonal lines) as a very low-opacity background texture.
- **Chips (Class/Tags):** Small monospaced labels with a solid neon border.
- **Combat Log (Lists):** Each entry is separated by a 1px dashed line. Use color-coded icons (e.g., a green sword icon for Tier A movements) to provide immediate visual feedback on workout quality.