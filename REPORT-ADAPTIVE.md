# REBOOT — Adaptive Core + Signature Home / Liquid Glass Editorial Pass

Suite directe du projet SwiftUI existant (rien n'a été jeté : onboarding, assets,
design system et diagnostic sont conservés). Cette passe ajoute la première vraie
boucle adaptative et reconstruit Today comme écran signature.

## ADAPTIVE LOGIC BUILT

- **Boucle complète** : Diagnosis → Attention Profile → Daily Prescription → Today →
  Session Result → Profile update → Next Prescription (vérifiée par pilote QA automatique :
  Day 1 OBSERVE « Work normally. » → session → Day 2 STAY « Stay with it. » avec
  stabilité/retour désormais observés).
- **AttentionProfile** : 11 dimensions (primary goal, goals, distractors, reflex,
  attention stability, return, recall, depth, environment, flow conditions, energy).
  Chaque dimension est soit UNKNOWN, soit connue avec une **source de preuve**
  (selfReport / observed / session / repeated). Aucune valeur inventée.
- **SessionRecord** : day, date, mode, cible, durée réelle, complété/écourté,
  première distraction, switches approximatifs, difficulté, énergie optionnelle,
  action environnement faite ou non.
- **ProfileUpdater** : met à jour stabilité, reflex, retour, depth, recall et la
  fenêtre de focus à partir de preuves réelles de session (source `.session` puis
  `.repeated` à partir de la 2e session).
- **Persistance** : `reboot.product.v1` (UserDefaults, même philosophie que le web).
- **Day 1** : vrai baseline — OBSERVE, 15 min, « Work normally. », aucune modification
  d'environnement imposée.

## HOME ELEMENTS BUILT

- `DAY 001 / 090` + pill CALIBRATING + ProgressRing (données réelles)
- Headline éditoriale générée depuis l'objectif du jour (« Work normally. »,
  « Make switching harder. », « Close it. Recall it. », « Give your mind less to react to. »…)
- Phrase humaine personnalisée (pas de jargon)
- **TodayHero** : une seule grande surface — label TODAY, mode, grande durée,
  objectif court, une raison, CTA « Start 20 min »
- **Real-world action** : une carte « Before you start » avec Done /
  « I can't do this » → fallback sans culpabiliser
- **Why this?** : pill glass → sheet « What REBOOT noticed » + « Why we're testing
  this today » + résumé de preuve (self-report · N sessions)
- **Micro-data** (max 2–3 signaux, réels uniquement) : moyenne focus + sparkline
  (≥2 sessions) ; sinon « Learning / 0–1 session / Not enough data yet »
- **Insight** : « What REBOOT learned » avec preuve réelle, sinon
  « REBOOT is still learning this. »
- Footer discret : « What happens today changes what comes next. »
- **FloatingGlassTabBar** (Today / Train / Program / Profile) — pill papier dans une
  capsule glass ; Train/Program/Profile = coquilles éditoriales vides, sans features
  factices ; Profile affiche le vrai profil (connus + sources, inconnus = Unknown)

## PROFILE DATA USED

- Primary goal + goals (diagnostic) → moteur de prescription
- Distractors (breaker / social_app / phone_place) → action réelle + environnement
- Focus window / reflex / attention stability (focus_window) → durée + variante STAY
- Reading / recall target → mode RECALL / EXPLAIN
- Absorption (flow conditions) → variante Flow
- Environment / energy / flow exit → contexte (Why this ?, profils)
- Toutes les dimensions non renseignées restent UNKNOWN et ne génèrent aucun score

## PRESCRIPTION RULES

Ordre déterministe (pas de rotation factice) :
1. Aucune session → OBSERVE baseline (15 min, « Work normally. »)
2. Difficulté ≥ 4 à la session précédente → NOTHING récupération (10 min, jamais
   deux fois de suite)
3. Objectif mémoire (read/remember/study) → rotation RECALL / EXPLAIN / STAY
   pilotée par l'objectif, la connaissance du recall et le nombre de sessions
4. Distracteurs connus → STAY + action environnement (téléphone hors de la pièce,
   onglets fermés, notifications silencieuses, casque…)
5. Objectif Flow → STAY « Find the seam. » avec conditions d'absorption
6. Défaut → STAY « Stay with it. »

La durée part de la fenêtre de focus auto-rapportée (10–45 min) et s'ajuste à la
difficulté récente. Quatre profils QA produisent quatre prescriptions distinctes
(vérifié par console) : OBSERVE 15 / STAY 20 / RECALL 30 / NOTHING 10.

## DESIGN COMPONENTS CREATED

`ios/REBOOT/Design/` — `AmbientBackground` (paper + blooms diffus lavande/glace/blush/coral),
`PaperCard`, `LiquidCard` (glass natif iOS 26 + fallback ultraThinMaterial),
`GlassPill`, `LiquidCapsule`, `PrimaryPillButton`, `TonalPillButton`, `ProgressRing`,
`MicroMetric`, `FocusSparkline`, `EditorialHeadline`, `InsightCard`,
`EditorialIllustrationContainer` + `AttentionBloomMark`.

`ios/REBOOT/Product/` — `AdaptiveCore` (profil, moteur, update, insights),
`ProductStore`, `QASeed` (seeds QA), `ProductRootView`, `FloatingGlassTabBar`,
`TodayView` + `TodayHero` + `RealWorldActionCard` + `AdaptiveDisclosureSheet`,
`SessionView`, `SessionDoneView`, coquilles Train/Program/Profile.

Nouveaux tokens : couleurs ambiantes (lavande, ice, blush, coral pâle, liserés glass)
et styles typographiques produit (todayHeadline 42 pt serif, heroDuration 40 pt,
heroGoal/reason, insightQuote serif italic, calendarMeta).

## WHAT CHANGES AFTER A SESSION

Une session complétée : (1) est persistée, (2) le jour avance (+1, plafonné à 90),
(3) met à jour le profil avec la source appropriée (session puis repeated),
(4) recompute la prescription du lendemain (mode, durée, headline, action),
(5) alimente les insights et la micro-donnée « return trend »,
(6) sort de l'état CALIBRATING après 3 sessions.

## SCREENSHOTS / QA

- `qa/product/17pro/` : day1, stay, recall, rest, running, done (iPhone 17 Pro)
- `qa/product/16e/`, `qa/product/17/` : variantes capturées avant arrêt demandé
- Vérification multi-format validée par l'utilisateur (16e, 17, 17 Pro, Pro Max)
- Pilote QA automatique : `-qaAuto` (boucle complète loggée) ; seeds : `-qaSeed`
  day1/stay/recall/rest/running/done ; navigation DEBUG étendue aux états produit

## BUILD STATUS

- Debug et Release : **BUILD SUCCEEDED, 0 erreur, 0 warning de compilation**
- 40 fichiers Swift, projet régénéré (`tools/gen_xcode_project.py`)
- iOS 17+ avec Liquid Glass natif conditionnel (`#available(iOS 26)`) et fallback
  matériau translucide pour les runtimes antérieurs

## REMAINING LIMITATIONS

- Train / Program / Profile sont des coquilles visuelles vides (conforme au scope)
- Le mode EXPLAIN n'apparaît qu'après 3 sessions avec un profil mémoire
- `firstSwitchMinute` est capturé dans le modèle mais pas encore demandé à l'écran
- Les insights dépendent de ≥2 sessions (honnêteté avant richesse)
- Session énergie : optionnelle, non obligatoire (par conception)
