# REBOOT — Web → SwiftUI Design Mapping

Source of truth: the published Lovable app (`https://depth-builder-app.lovable.app`, project
`8842c3fa-4318-4beb-8d68-df955f0a585e`) rendered headless at iPhone widths **375, 393, 402, 430pt**
(2× DPR), plus the committed web source (`webapp/src/styles.css`, `CinematicOnboarding.tsx`,
`DiagnosisFlow.tsx`, `StartingPoint.tsx`, `Dissolve.tsx`, `reboot-content.ts`, `reboot-diagnosis.ts`).
Measured with `getComputedStyle` from the rendered DOM; screenshots in `qa/web/`.

Every token below has a SwiftUI counterpart in `ios/REBOOT/Theme/` and `ios/REBOOT/Components/`.

---

## 1. Color palette

Web colors are defined in **oklch** and converted to sRGB below (verified against captured pixels).
SwiftUI colors are declared in `AppColors.swift` as `Color(hex:)` with the exact sRGB values.

| Web token | oklch | sRGB hex | Swift token | Notes |
|---|---|---|---|---|
| `--void` | `oklch(0 0 0)` | `#000000` | `AppColors.void` | cinematic backdrop |
| `--signal` | `oklch(0.58 0.24 27)` | `#E60016` | `AppColors.signal` | Signal Red — dots, halo, tiny emphasis |
| `--cine-fg` | `oklch(0.98 0.004 90)` | `#F9F8F5` | `AppColors.cineFG` | warm near-white, not pure white |
| `--cine-muted` | `oklch(0.78 0.01 60)` | `#BCB6B1` | `AppColors.cineMuted` | secondary cinema text |
| `--paper` | `oklch(0.977 0.008 90)` | `#F9F7F1` | `AppColors.paper` | cream background |
| `--paper-raised` | `oklch(0.995 0.004 95)` | `#FEFDFA` | `AppColors.paperRaised` | cards, chips |
| `--ink` | `oklch(0.19 0.012 60)` | `#18130E` | `AppColors.ink` | warm near-black, primary text/pills |
| `--ink-soft` | `oklch(0.47 0.012 70)` | `#5F5A54` | `AppColors.inkSoft` | secondary text |
| `--ink-faint` | `oklch(0.66 0.01 80)` | `#95928B` | `AppColors.inkFaint` | tertiary text, Back, counters |
| `--coral` | `oklch(0.63 0.19 25)` | `#E54C4A` | `AppColors.coral` | Coral Red accent (labels, status) |
| `--cyan` | `oklch(0.72 0.1 210)` | `#4AB6C7` | `AppColors.cyan` | restrained cyan accent |
| `--hairline` | `oklch(0.9 0.008 85)` | `#E0DED8` | `AppColors.hairline` | progress track only |

### Derived / mixed colors (web `color-mix(in oklab, …)`)

| Use | Web mix | Composite result | Swift implementation |
|---|---|---|---|
| Active choice check circle | `paper 22%` over ink | `#433E3A` | `AppColors.paper.opacity(0.22)` on ink |
| Inactive choice check circle | `ink 6%` over raised | `#EEEDEA` | `AppColors.ink.opacity(0.06)` on raised |
| Goal chips bg | `ink 5%` over raised | `#F1F0ED` | `AppColors.ink.opacity(0.05)` on raised |
| Absorption chips bg | `cyan 14%` over raised | `#E7F3F3` | `AppColors.cyan.opacity(0.14)` on raised |
| Absorption chip text | `ink 90% + cyan 10%` | `#1F201E` | `AppColors.ink` blended 90/10 with `cyan` |
| Status card bg | `coral 8%` over raised | `#FFF0EC` | `AppColors.coral.opacity(0.08)` on raised |

### Gradients

| Web | Stops | Swift |
|---|---|---|
| Cinematic bottom scrim | `black 0.25` → `clear` @26% → `black 0.55` @52% → `black 0.94` @74% → `black 1.0` | `LinearGradient` same stops, `AppColors.void` alphas |
| Red breathing halo | radial `signal 22%` → `transparent` 70%, ellipse 60%×38% anchored 50%/26%, `mix-blend-mode: screen` | `RadialGradient` (`signal.opacity(0.22)` → clear) in an ellipse-sized circle, `.blendMode(.screen)`, breathing 6.5s |
| Diagnosis bottom fade | `transparent` → `paper 0.85` @35% → `paper` @70% | `LinearGradient` fixed above CTA |

### Shadows

| Web | Value | Swift |
|---|---|---|
| `--shadow-soft` | `0 1px 2px` `#342C23` @4% + `0 8px 24px` @6% | `AppShadow.soft` (two nested `.shadow`) |
| `--shadow-lift` | `0 2px 4px` @5% + `0 18px 44px` @10% | `AppShadow.lift` (two nested `.shadow`) |

---

## 2. Typography

Web fonts: **Plus Jakarta Sans** (variable 300–800, UI/sans) and **Instrument Serif** (400 + Italic, editorial).
Both are OFL-licensed; TTFs are bundled in the app (`Resources/Fonts/`) — **no substitution needed**.

Swift: `AppTypography` builds fonts from the bundled TTFs (`PlusJakartaSans-Variable.ttf`,
`InstrumentSerif-Regular.ttf`, `InstrumentSerif-Italic.ttf`) via `UIFontDescriptor` so the variable
weight axis applies exactly. Line-height is enforced with runtime-computed `.lineSpacing`
(target line height − font natural line height), kerning uses `.kerning`.

| Web style | Font / weight | Size | Line-height | Tracking | Swift |
|---|---|---|---|---|---|
| `meta-label` | Plus Jakarta Sans 600 | 11px | 16.5px | +3.08px (0.28em) | `AppTypography.metaLabel` |
| `cine-title` | Plus Jakarta Sans 700 | 32.8px (2.05rem) | 33.46px (1.02) | −1.148px (−0.035em) | `AppTypography.cineTitle` |
| cine body | Plus Jakarta Sans 400 | 17px (1.0625rem) | 27.63px (1.625) | 0 | `AppTypography.cineBody` |
| cine secondary | Plus Jakarta Sans 400 | 15px (0.9375rem) | 24.4px (relaxed) | 0 | `AppTypography.cineSecondary` |
| stages pill | Plus Jakarta Sans 500 | 13px (0.8125rem) | 19.5px | 0 | `AppTypography.pillLabel` |
| cinema CTA | Plus Jakarta Sans 600 | 16px | 24px | −0.4px (−0.025em) | `AppTypography.buttonLabel` |
| question title | Instrument Serif 400 | 33.6px (2.1rem) | 36.29px (1.08) | −0.336px (−0.01em) | `AppTypography.questionTitle` |
| question hint | Plus Jakarta Sans 400 | 15px | 22.5px | 0 | `AppTypography.hint` |
| choice label | Plus Jakarta Sans 400 | 16px | 24px | 0 | `AppTypography.choiceLabel` |
| back / footer | Plus Jakarta Sans 400 | 13px (0.8125rem) | 19.5px | 0 | `AppTypography.smallLink` |
| report eyebrow | `meta-label` | 11px | 16.5px | +3.08px | `AppTypography.metaLabel` |
| report title | Instrument Serif 400 | 41.6px (2.6rem) | 42.85px (1.03) | −0.624px (−0.015em) | `AppTypography.reportTitle` |
| report body | Plus Jakarta Sans 400 | 15px | 24.4px | 0 | `AppTypography.reportBody` |
| card title | Instrument Serif 400 | 32px (2rem) | ~35.8px (tight) | 0 | `AppTypography.cardTitle` |
| stat value | Plus Jakarta Sans 500 | 17px | 23.4px (snug) | −0.17px (−0.01em) | `AppTypography.statValue` |
| chip text | Plus Jakarta Sans 500 | 14px | 21px | 0 | `AppTypography.chipText` |
| footnote | Plus Jakarta Sans 400 | 12px (0.75rem) | 19.5px | 0 | `AppTypography.footnote` |

`text-wrap: balance` on cine titles ≈ SwiftUI default balanced wrapping (iOS 17 `Text` wraps
whole-word by default; no extra step needed).

---

## 3. Spacing scale

Web uses Tailwind utilities; all values are exact rem/px mappings (16px base). Screen horizontal
padding is `px-6` = **24px** on every screen; content column is `max-w-[30rem]` (480px), so content
width = screen − 48px for all target phones.

| Web | px | Swift |
|---|---|---|
| `px-6` / safe horizontal gutter | 24 | `AppSpacing.screenPadding` |
| `safe-top` | `max(20px, safe-area-top)` | `safeAreaPadding(.top, max(20, inset))` |
| `safe-bottom` | `max(28px, safe-area-bottom)` | `safeAreaPadding(.bottom, max(28, inset))` |
| `mt-4` (body after title) | 16 | `AppSpacing.xs`… spacing map |
| `mt-8` (options/CTA after copy) | 32 | `AppSpacing.lg` |
| `mt-3` (hint / report body) | 12 | `AppSpacing.sm` |
| `space-y-2.5` (choice stack) | 10 | `AppSpacing.choicesGap` |
| `pb-40` (scroll runway) | 160 | `AppSpacing.choicesBottom` |
| `pt-10` (diagnosis main) | 40 | `AppSpacing.ptMain` |
| `gap-4` (header row) | 16 | `AppSpacing.headerGap` |
| `mt-8` above CTA / `pt-16` fade above CTA | 32 / 64 | `AppSpacing.ctaTop`, `AppSpacing.fadeTop` |
| report `space-y-3` (card stack) | 12 | `AppSpacing.cardStack` |
| report grid `gap-3` | 12 | `AppSpacing.gridGap` |
| card padding `p-6` | 24 | `PaperSurface.padding` |
| stat card padding `p-5` | 20 | `PaperSurface.statPadding` |
| choice card padding | 16v / 20h | `ChoiceCard` internal |
| CTA padding | 16v / 24h | `PrimaryButton` internal |

Full map lives in `AppSpacing.swift` (xs 12, sm 16, md 24, lg 32, xl 40, 2xl 64, 3xl 160).

---

## 4. Radii

| Web | px | Swift |
|---|---|---|
| `.paper-card` / choice cards | **28** | `AppRadius.card = 28` |
| pills (CTA, chips, dots, progress) | 999 (capsule) | `Capsule()` / `.clipShape(Capsule())` |
| (shadcn base radius unused in this flow) | 10 | n/a — not used by ported screens |

---

## 5. Component anatomy (measured @402pt)

### Cinematic screen
- Full-bleed artwork: `object-fit: cover`, `object-position: 50% <y>`, height 100% of viewport.
  Artwork is 940×1672 (page1) / 941×1672 (pages 2–6). Vertical focus is irrelevant at phone
  aspect (height-dominant crop); horizontal is centered.
- Header: meta label left, "Skip" right (`meta-label`, cine-muted 60–70%).
- Title block bottom-anchored: title → body (16px) → stages (20px) → secondary (16px), all inside
  a `max-w-[30rem]` column with 24px gutters.
- CTA: full-width pill, 56px tall, white (cine-fg) on black, `active:scale(0.985)` 0.2s.
- Footer row (24px tall): Back (13px, cine-muted 60%) · dots · ghost CTA ("Not now" on screen 6).
- Dots: 3px tall; active 22px wide `signal`, inactive 8px wide `cine-fg` 22%; 0.5s width transition.
- Bottom scrim gradient (section 1) ensures type legibility over artwork.

### Diagnosis screen
- Header: Back (13px ink-faint) · progress track 3px hairline, ink fill · counter `meta-label`.
- Question: Instrument Serif 33.6px ink; optional hint 15px ink-soft below (12px).
- Choices: `paper-card` 28px radius, `shadow-soft`, 57.5px tall, 16px label, 16px gap, 10px stack gap,
  24px side padding (content), options column 32px below title, 160px bottom runway.
- Selected choice: bg→ink, text→paper, shadow→`shadow-lift`, check circle 24px with paper 22% + check
  icon 14px stroke 3; morph transition 0.2s, press scale 0.99.
- Multi CTA: fixed bottom, gradient fade above, pill 56px, disabled at 25% opacity.

### Starting-point report
- Eyebrow `meta-label` ink-faint, title 41.6px Instrument Serif, body 15px ink-soft.
- Primary goal card (`shadow-lift`, p-6): coral meta label, 32px serif value, remaining goals as pills.
- 2-col stat grid: "Main breaker" (coral), "Focus window" (cyan); 20px padding cards.
- Absorption card: cyan 14% chips or "nothing reliable yet" copy.
- What we know / Unknown dimensions: dl rows (15px ink-soft labels, 15px medium values) / bulleted list.
- Status card: coral 8% bg, pulsing coral dot (10px), "Status: Calibrating" 16px semibold.
- CTA: "Start day one" pill 56px; below it "Retake the diagnosis" 14px ink-faint; footnote 12px centered.
- Fade-in cascade: 0/0.08/0.14/0.18/0.24/0.3/0.36/0.42/0.5s delays, 0.55s duration, 12px rise.

---

## 6. Motion

Shared ease: `cubic-bezier(0.22, 0.9, 0.24, 1)` → `UnitCurve(0.22, 0.9, 0.24, 1)` (`AppMotion.easeOutExpoLike`).
Dissolve ease: `cubic-bezier(0.7, 0, 0.2, 1)` → `UnitCurve(0.7, 0, 0.2, 1)`.

| Web | Value | Swift |
|---|---|---|
| artwork crossfade | 0.78s, enter scale 1.02→1, exit scale 1→1.01 | `.transition(.opacity)` + scale on appear, 0.78s |
| text reveal after artwork | delay 0.16s, 0.58s, opacity + 12px rise | `Reveal` component, same values |
| per-element stagger (cine) | body 0.26, stages 0.34, secondary 0.40 | same delays |
| CTA press | scale 0.985, 0.2s | `.scaleEffect` animated |
| dots morph | width 8↔22, 0.5s | `.frame` animated, 0.5s |
| breathing halo | 6.5s ease-in-out, opacity 0.32→0.62 | repeating 6.5s animation |
| question enter/exit | enter 0.42s y14→0, exit 0.42s y−10 | asymmetric transition 0.42s |
| choice stagger | 0.05 + i×0.03s delay, 0.36s, 8px rise | per-card delay on appear |
| single-choice advance | 220ms settle before next question | same |
| progress fill | 0.5s width ease | `.frame` animated 0.5s |
| report cascade | 0.55s, 12px rise, delays 0–0.5s | `Fade` component |
| dissolve halo | 1.15s scale [1.1→0.12→26], opacity [0.85→1→0], times [0, .42, 1] | `KeyframeAnimator`, 1.15s |
| paper reveal | delay 0.62s, 0.72s fade | delayed opacity 0.72s |
| "Clarity." | delay 0.95s, 0.6s, 10px rise, serif italic | same |
| dissolve total | 1.5s then diagnosis | timer 1.5s |
| reduced motion | durations→0.2s, offsets→0 | `@Environment(\.accessibilityReduceMotion)` |

---

## 7. Assets

| Asset | Source file | Dimensions | Swift location |
|---|---|---|---|
| page1–page6.png | Lovable CDN, downloaded byte-identical (md5 vs asset manifest sizes) | 940/941 × 1672 | `Resources/Assets/Onboarding/` |

Artwork is used exactly as-is: no regeneration, no re-crop. `C2PA` content-credentials metadata
preserved in the PNGs.

---

## 8. Content & branching (ported 1:1)

`reboot-diagnosis.ts` → `DiagnosisModels.swift`: `GOALS`, `QUESTIONS` (14), `visibleQuestions`,
`optionsFor`, `isUnknown`, `UNKNOWN` escape option on every non-goal question. State machine
`cinematic → dissolve → diagnosis → report` and localStorage persistence → `AppState` +
`UserDefaults` (`reboot.state.v1`, same shape).

---

## 9. Responsive behavior

- All screens use the web's fluid column: content width = screen − 48pt, centered, max 480pt.
- Cinematic layout: artwork fills viewport (ignores safe areas), type + CTA respect top/bottom safe
  insets; the type block is bottom-anchored via flexible spacer (same as web `flex-1`).
- Diagnosis: content scrolls (`pb-160` runway); CTA is fixed with gradient fade; keyboard-free flow.
- Report: scrolls end-to-end; safe-area padded.
- Verified widths: 375 (812), 393 (852), 402 (874), 430 (932); native devices 16e (390×844),
  17 Pro (402×874), 17 Pro Max (440×956).

