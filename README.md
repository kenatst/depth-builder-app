# REBOOT iOS — Step 1 (Onboarding + Diagnostic)

Natif SwiftUI (iOS 17+), aucun WebView. Port 1:1 de l'app web Lovable.

## Ouvrir / construire

- Projet : `ios/REBOOT.xcodeproj` (schéma `REBOOT`)
- Build : `xcodebuild -project ios/REBOOT.xcodeproj -scheme REBOOT -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build`
- Génération du projet (après ajout/suppression de fichiers) :
  `python3 tools/gen_xcode_project.py`

## Navigation DEBUG

Appui long sur le libellé « REBOOT / 01 » (cinéma) ou sur le compteur « 1/14 » (diagnostic)
pour ouvrir le panneau de saut vers chaque écran.

## QA

- Web : `tools/capture-web.mjs` (Chrome headless, largeurs 375/393/402/430, insets simulés)
- Natif : `tools/capture-native.sh <device> <out>` (lancement unique + `-qaWatch`)
- Comparaison : `tools/compare-qa.mjs` → montages dans `qa/compare/`

Rapport détaillé : `REPORT.md`. Mapping des tokens : `DESIGN_MAPPING.md`.
Passe adaptive (Today / prescription / session) : `REPORT-ADAPTIVE.md`.
Passe Screen Time / environnement numérique : `REPORT-SCREENTIME.md`.
