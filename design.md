# Kikin Design System

> Design documentation extracted from [kikin.io](https://www.kikin.io) — a purpose-driven fintech platform that provides working capital and supplier financing for UK SMEs, with fee discounts tied to ESG performance.

---

## 1. Brand Overview

**Kikin** positions itself at the intersection of finance and sustainability. The visual identity is optimistic, nature-inspired, and deliberately non-corporate. It uses bold illustration, high-contrast typography, and a limited but energetic color palette to signal “growth,” “planet,” and “cash flow” simultaneously.

**Tone of voice (visual + verbal)**
- Confident but approachable
- Mission-led without being preachy
- Clear, benefit-focused copy
- Playful illustration offsets the seriousness of finance

**Core metaphors**
- Nature / outdoors / adventure (mountains, trees, rivers, wildlife, outdoor work)
- Growth & flow (cash flow visualized as natural systems)
- Partnership / collaboration (“doing good, together”)

---

## 2. Color Palette

### Primary

| Name              | Hex       | RGB              | Usage                                      |
|-------------------|-----------|------------------|--------------------------------------------|
| Forest Black      | `#122315` | 18, 35, 21       | Primary dark background, nav, text on light |
| Neon Green        | `#55DD4A` | 85, 221, 74      | Primary CTA buttons, highlights, success    |
| Cream             | `#F3EDE4` | 243, 237, 228    | Hero text, light surfaces, off-white        |
| Soft Cream        | `#F4F1E8` | 244, 241, 232    | Section backgrounds                        |
| Off-White         | `#FDFCFB` | 253, 252, 251    | Cards, elevated surfaces                   |

### Secondary / Accent

| Name              | Hex       | RGB              | Usage                                      |
|-------------------|-----------|------------------|--------------------------------------------|
| Sky Blue          | `#73D3EB` | 115, 211, 235    | Illustrations, secondary accents           |
| Lime Yellow       | `#D8FF62` | 216, 255, 98     | Illustration highlights, badges            |
| Deep Forest       | `#0B3B2E` | 11, 59, 46       | Darker green overlays, secondary text      |
| Soft Green        | `#77E46E` | 119, 228, 110    | Hover states, lighter CTA variants         |
| Muted Green       | `#566053` | 86, 96, 83       | Subtle borders / secondary UI              |

### Neutrals & Functional

| Name              | Hex       | Usage                                      |
|-------------------|-----------|--------------------------------------------|
| Near Black        | `#141414` | Body text on light backgrounds             |
| Mid Gray          | `#333333` | Secondary body text                        |
| Light Gray        | `#CCCCCC` | Disabled / borders                         |
| White             | `#FFFFFF` | Pure white surfaces, text on dark          |

**Color usage rules**
- Dark sections (`#122315`) pair with cream or neon green text.
- Light sections use near-black text and neon green for CTAs.
- Neon green is reserved almost exclusively for primary actions and key numbers.
- Illustrations freely use the full accent range (sky blue, lime, orange, etc.).

---

## 3. Typography

### Font Families

| Role          | Family     | Fallback          | Notes                                      |
|---------------|------------|-------------------|--------------------------------------------|
| Display / Headings | **Deacon** | sans-serif     | Heavy, distinctive, slightly condensed     |
| Body / UI     | **Graphik**| sans-serif        | Clean geometric sans for UI and body copy  |
| System fallback | Arial    | sans-serif        | Used when custom fonts unavailable         |

### Type Scale (approximate from live site)

| Element              | Size (desktop) | Weight | Line height | Notes                          |
|----------------------|----------------|--------|-------------|--------------------------------|
| Hero H1              | 90–110px       | 900    | ~0.95       | Extremely large, stacked lines |
| Section H2           | 56–72px        | 800–900| 1.0–1.1     | Uppercase or title case        |
| Subsection H3 / H4   | 28–40px        | 700    | 1.15        | Feature titles                 |
| Body                 | 16–18px        | 400–500| 1.5–1.6     | Readable paragraph text        |
| Button / Nav         | 14–16px        | 500    | 1.2         | Medium weight, tracked slightly|
| Caption / Small      | 12–14px        | 400    | 1.4         | Secondary labels               |

**Typography principles**
- Headlines are often all-caps or mixed with very tight leading.
- Large display type is used as a visual element, not just content.
- Generous negative space around headlines.
- Body copy stays relatively short and scannable.

---

## 4. Logo & Brand Mark

- Wordmark: lowercase **“kikin”** in a custom bold, rounded sans.
- Color: cream/off-white on dark backgrounds; dark green on light.
- Clear space: roughly the height of the “k” on all sides.
- Do not stretch, outline, or add effects.
- Favicon / app icon uses a simplified “K” mark or the full wordmark at small sizes.

---

## 5. Illustration Style

**Signature visual language**
- Bold, hand-drawn vector illustrations with thick black outlines.
- Nature and outdoor themes: mountains, forests, rivers, wildlife (bears, birds), people engaged in physical work or adventure.
- Flat color fills with limited shading; high contrast.
- Circular badge-style illustrations used as decorative elements (e.g. “Put Planet First”, “Work Together”, “Borrow Wisely”).
- Landscape banners that act as section dividers (illustrated horizons with trees, water, sun).

**Color in illustrations**
- Primary palette + vibrant secondary colors (cyan, coral, yellow, orange).
- Black outlines are non-negotiable for the style.

**Usage**
- Full-bleed illustrated heroes and section backgrounds.
- Floating circular badges around text blocks.
- Product UI mockups are clean and realistic (screenshots / 3D-ish cards), contrasting with the illustrative world.

---

## 6. Layout & Spacing

### Grid & Structure
- Max content width: ~1200–1280px centered.
- Generous vertical rhythm; sections often have 120–200px padding top/bottom.
- Two-column layouts common for feature + visual pairs.
- Full-bleed dark or illustrated sections alternate with light cream sections.

### Spacing tokens (suggested)
- 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96 / 128 px scale.

### Section patterns
1. **Dark hero** – full viewport, large stacked headline, short subcopy, single CTA, illustrated landscape at bottom.
2. **Logo bar** – light blue strip with customer logos in monochrome/black.
3. **Mission block** – large headline + short paragraph + CTA + floating circular illustrations.
4. **Numbered features** – 01 / 02 / 03 / 04 with large title, short description, and supporting visual or UI mockup.
5. **Calculator** – dark section with interactive sliders + large result number.
6. **Testimonials** – repeated “doing good, together.” framing with quote cards.
7. **FAQ** – accordion style on light background.
8. **Footer** – dark, multi-column links + legal.

---

## 7. Components

### Buttons

**Primary CTA**
- Background: `#55DD4A`
- Text: `#122315`
- Border-radius: 10px
- Padding: 14px 24px
- Font: Graphik Medium 16px
- Hover: slightly brighter green or subtle scale/opacity

**Secondary / Outline**
- Transparent or cream background
- Border: 1–1.5px solid dark or light depending on context
- Text: matches border color
- Same radius and padding language

**Nav buttons**
- “LOG IN” – outline style
- “GET FUNDING” – solid neon green

### Navigation
- Sticky dark header (`#122315`)
- Logo left, links center, CTAs right
- Links: uppercase or title case, light weight, cream text
- Mobile: hamburger → full-screen or drawer menu

### Cards & Surfaces
- Soft cream or pure white backgrounds
- Subtle border or very soft shadow
- Rounded corners (8–16px typical)
- Product mockups use more pronounced depth and realistic UI chrome

### Form / Calculator Controls
- Horizontal sliders with neon green thumbs
- Large result numbers in neon green
- Discount badges / certification logos in a grid of rounded squares

### Cookie / Modal
- Light cream card, dark text, rounded corners
- Primary action filled dark, secondary text button

### Floating Action
- “Calculate your funding” pill in bottom-right (persistent on many pages)

---

## 8. Motion & Interaction

- Smooth scroll and section transitions.
- Subtle hover states on buttons and cards (color shift, slight lift).
- Illustrations may have light parallax or entrance animations.
- Calculator updates live as sliders move.
- Accordion FAQs expand/collapse cleanly.
- Cookie banner slides in from bottom-left.

Keep motion purposeful and restrained — the brand feels energetic through color and illustration rather than heavy animation.

---

## 9. Iconography

- Simple, geometric line icons for UI (document, clock, chart, etc.).
- Certification badges (B Corp, 1% for the Planet, Planet Mark, Climate Neutral) rendered as clean logos inside rounded containers.
- Custom illustrated circular badges for brand messaging.

---

## 10. Photography & Imagery

- Limited use of photography; when present it tends to be atmospheric nature shots or soft product/lifestyle imagery used behind UI cards.
- Primary visual weight is carried by the custom illustration system and clean product UI.

---

## 11. Responsive Behavior

- Desktop-first bold layouts collapse to single column on mobile.
- Hero type scales down significantly but remains impactful.
- Navigation collapses to hamburger.
- Calculator becomes vertically stacked.
- Floating “Calculate” button remains accessible.
- Illustrations may crop or simplify on smaller viewports.

---

## 12. Accessibility Notes

- High contrast between cream text and dark green backgrounds.
- Neon green on dark provides strong contrast for CTAs.
- Ensure focus states are visible (especially on dark backgrounds).
- Custom fonts should have solid system fallbacks.
- Interactive calculator and forms need clear labels and keyboard support.

---

## 13. Implementation Notes (Webflow origin)

The live site is built in **Webflow**, uses **Cloudflare**, **Lottie**, and standard analytics. Custom fonts (Deacon + Graphik) are loaded via the site’s asset pipeline. When rebuilding:

- Prefer variable or well-hinted versions of the display and UI fonts.
- Keep the illustration assets as optimized SVGs or high-quality PNGs with transparent backgrounds where needed.
- Maintain the strong section alternating pattern (dark ↔ light ↔ illustrated).

---

## 14. Design Principles Summary

1. **Bold type, generous space** — Headlines do heavy lifting.
2. **Nature meets finance** — Illustration humanizes and differentiates.
3. **Green = action + growth** — Neon green is the single most important interactive color.
4. **Mission without sacrifice** — ESG messaging is visual and structural, not just copy.
5. **Clarity over cleverness** — UI remains clean and scannable even when surroundings are illustrative.

---

*Document generated from visual and structural analysis of kikin.io (September 2026).*
