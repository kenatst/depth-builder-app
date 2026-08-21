# REBOOT — Step 1 : Onboarding + Diagnostic natifs iOS

Conversion 1:1 de l'app web Lovable (REBOOT / depth-builder-app) en SwiftUI natif.
Source de vérité : l'app publiée sur https://depth-builder-app.lovable.app rendue aux largeurs
iPhone (375, 393, 402, 430 pt) + le code source du dépôt.

## WEB DESIGN TOKENS FOUND

Extraits du CSS (`styles.css`) et mesurés dans le DOM rendu (`getComputedStyle`) :

- **Couleurs (oklch → sRGB)** : void `#000000`, signal `#E60016`, cineFG `#F9F8F5`,
  cineMuted `#BCB6B1`, paper `#F9F7F1`, paperRaised `#FEFDFA`, ink `#18130E`,
  inkSoft `#5F5A54`, inkFaint `#95928B`, coral `#E54C4A`, cyan `#4AB6C7`,
  hairline `#E0DED8`, tint ombre `#342C23`.
- **Typographie** : Plus Jakarta Sans (300–800) pour l'UI ; Instrument Serif (400 + Italic)
  pour les titres éditoriaux. Tailles/lignes mesurées : méta 11/16.5/+3.08em, titre cinéma
  32.8/33.456/−1.148, question 33.6/36.288/−0.336, report 41.6/42.848/−0.624, CTA 16/24/−0.4.
- **Rayons** : cartes 28 pt, pills capsulaires.
- **Ombres** : soft (0 1px 2px @4% + 0 8px 24px @6%) et lift (0 2px 4px @5% + 0 18px 44px @10%).
- **Espacement** : gouttière 24 pt, safe-top ≥20, safe-bottom ≥28, piles 10/12/16/32/160 pt.
- **Gradients** : scrim cinéma (noir .25 → 0 → .55 → .94 → 1), halo rouge radial (22% signal,
  screen blend, 6.5 s), fondu diagnostic (transparent → paper .85 → paper).
- **Motion** : ease partagé `cubic-bezier(0.22,0.9,0.24,1)`, crossfade artwork 0.78 s
  (scale 1.02→1), reveals texte 0.58 s avec délais 0.16/0.26/0.34/0.40 et 12 px,
  cartes 0.36 s + 0.05+i·0.03, transition question 0.42 s, dissolution 1.5 s
  (halo 1.15 s scale [1.1,0.12,26], paper 0.62+0.72 s, « Clarity. » 0.95+0.6 s).

Détail complet : `DESIGN_MAPPING.md`.

## SWIFT TOKENS CREATED

`ios/REBOOT/Theme/` — `AppColors`, `AppTypography`, `AppSpacing`, `AppRadius`,
`AppShadow`, `AppMotion` ; `ios/REBOOT/Components/` — `PrimaryButton`, `ChoiceCard`,
`Pill`, `EditorialHeader`, `PaperSurface`, `MetaLabel`, `Reveal`, `ProgressBar`.
Tous les écrans utilisent ces tokens centralisés (aucun chiffre en dur).

## FONTS

- Plus Jakarta Sans (Regular, Medium, SemiBold, Bold) — instances statiques OFL générées
  depuis la variable font officielle (mêmes glyphes, poids exacts). Pas de substitution.
- Instrument Serif (Regular + Italic) — OFL, inclus tel quel.
- Licences OFL incluses dans le bundle (`Resources/Fonts/OFL-*.txt`).

## ASSETS

- Les 6 artworks officiels `page1.png … page6.png` (940/941 × 1672), téléchargés depuis le CDN
  Lovable, byte-identical aux manifests, placés dans `Resources/Assets/Onboarding/`.
  Aucune régénération ni recadrage (métadonnées C2PA conservées).

## SCREENS PORTED

1. Cinématique 1–6 (artwork plein écran, scrim, halo respirant, type + CTA)
2. Dissolution (halo → papier → « Clarity. »)
3. Diagnostic : 14 questions + branchement complet (`DiagnosisModels.swift` = port de
   `reboot-diagnosis.ts`), cartes de choix, barre Continue, compteur/progression
4. Rapport « Your starting point » (cartes, stats, statut Calibrating, retake)

Persistence locale UserDefaults (`reboot.state.v1`, même forme JSON que le web).
Navigation DEBUG : long-press sur le libellé méta (cinéma) ou le compteur (diagnostic)
→ saut vers chaque état. `-qaState <fichier>` + `-qaWatch <dossier>` pour le QA automatisé.

## MOTION PORTED

Crossfades 0.78 s avec scale, reveals staggerés, morphing sélection (0.2 s), press scale 0.985,
largeur des dots 8↔22 (0.5 s), halo 6.5 s, transitions de question 0.42 s, dissolution complète
(KeyframeAnimator), cascade du rapport (0–0.5 s). `accessibilityReduceMotion` respecté.

## VISUAL DIFFERENCES REMAINING

Écart pixel moyen (web vs natif, même largeur) après itération :

- Cinéma : Δ ~8–10/255 (halo respirant déphasé entre les deux captures, offset vertical ~6–12 pt,
  barre de statut présente côté natif seulement).
- Diagnostic : Δ ~8–16/255 (bande statut native, légères différences de rendu texte).
- Rapport : Δ ~16/255.

Aucune différence de design system (couleurs/rayons/espacements/mises en page) ; les écarts
résiduels sont des artefacts de capture (statut, phase d'animation) et des offsets infimes.

## BUILD STATUS

- `xcodebuild -scheme REBOOT -configuration Debug|Release` : **SUCCEEDED, 0 warning**.
- Cibles vérifiées : iPhone 16e (390×844), iPhone 17 (393×852), iPhone 17 Pro (402×874),
  iPhone 17 Pro Max (440×956). Safe areas/Dynamic Island gérées.

## QA SCREENSHOT PATHS

- Web : `qa/web/<largeur>/<état>.png` (375, 393, 402, 430 + 390/440 pour les devices)
- Natif : `qa/native/17pro/`, `qa/native/16e/`, `qa/native/17/`
- Comparaisons côte à côte : `qa/compare/<état>.png`
- Rapport de mesures : `qa/compare/report.json`
- États QA : `qa/state/*.json`
- Scripts : `tools/capture-web.mjs`, `tools/capture-native.sh`, `tools/compare-qa.mjs`

## NOTES

- « Start day one » est intentionnellement inerte (parité web ; Today est hors scope Step 1).
- Le repo web cloné est dans `webapp/` (source de vérité pour les tokens).
