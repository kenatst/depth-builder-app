# REBOOT — Digital Environment / Screen Time Intelligence — Integration Pass

Ajout de l'environnement numérique comme capacité adaptative de première classe,
sans rendre REBOOT dépendant de Screen Time. Architecture existante conservée :
diagnostic → profil → prescription → Today → session → mise à jour → prescription suivante.

## SCREEN TIME FOUNDATION

- `DigitalEnvironmentProvider` (protocole) + `AppleScreenTimeProvider` +
  `ManualEnvironmentProvider`. Le moteur consomme des capacités, pas du code Apple.
- États de capacité explicites : unavailable / notRequested / authorized /
  authorizedWithDataAccess / denied / revoked / error. Aucun succès inventé.
- Sélection d'activités via `FamilyActivityPicker` (apps, catégories, domaines web),
  persistée en `ProtectedSelection` (Data opaque — jamais logguée, jamais convertie).
- `FamilyControls`, `ManagedSettings`, `DeviceActivity`, `ManagedSettingsUI` uniquement.
- REBOOT reste pleinement fonctionnel sans autorisation : tous les chemins
  d'échec retombent sur les interventions manuelles existantes.

## TODAY INTEGRATION

- Connexion Screen Time proposée **contextuellement** (jamais au lancement ni à
  l'onboarding) : carte « Before you start » → CTA « Connect Screen Time ».
- Sheet éditoriale « Protect your focus windows. » avant l'UI Apple (Continue /
  Not now) avec « REBOOT works fully without this. »
- Une seule carte environnement sur Today : manuelle (phone/tabs) ou protection
  de session (« Protect this session. » / « Enable protection »). Pas de dashboard.
- Quand la protection est active pendant la session : texte discret
  « Environment protected · N min ». Today reste épuré.

## ENVIRONMENT EVIDENCE

- `EnvironmentSnapshot` dans chaque session : protectionOffered/Accepted/Activated/
  EndedEarly, selectionID, intervention manuelle, condition, self-report
  « did protection make starting easier? », raison de sortie anticipée.
- `EnvironmentObservation` (CONDITION + OUTCOME séparés, jamais de conclusion
  encodée) + états KEEP / DROP / INCONCLUSIVE pour les futures expériences.
- Dimension `environmentEvidence` du profil : état, confiance, nombre de preuves,
  source (session/repeated), tendance, updatedAt, compteurs protégés/manuels,
  faits appareil (connecté, sélection, fenêtres, seuil).
- UNKNOWN préservé tant que les preuves sont insuffisantes.

## ADAPTIVE ENGINE CHANGES

- Chaîne déterministe existante inchangée (baseline, récupération, mémoire,
  distracteurs, Flow, défaut STAY). La branche distracteurs gagne
  `environmentAction` (friction ladder 0–4) issu de l'échelle :
  0 observe / 1 friction manuelle / 2 protection de session / 3 fenêtre récurrente /
  4 règle de seuil.
- Le moteur choisit TOUJOURS le niveau le plus bas soutenu par la preuve :
  friction manuelle qui marche → pas d'escalade ; échecs manuels répétés + opt-in →
  protection ; sorties anticipées répétées → redescendre ; bonne session protégée →
  pas de conclusion forte.
- « Why this? » enrichi : « You identified social apps as a common interruption »
  / « Your recent protected sessions have involved fewer reported switches. »
  — formulation prudente uniquement.

## APPLE EXTENSIONS

- `ShieldConfigurationExtension` : écran « Focus protected / This can wait. »
  (ton REBOOT, pas de stats, pas de clichés).
- `DeviceActivityMonitorExtension` : enregistre uniquement nos propres noms
  d'événements + horodatages dans le conteneur partagé (jamais de tokens).
- Les deux sont embarqués dans `REBOOT.app/PlugIns` (vérifié dans le bundle).
- Pas de DeviceActivityReport (non requis).

## ENTITLEMENTS / APPROVAL REQUIREMENTS

- Configurés localement : `com.apple.developer.familycontrols` + App Group
  `group.com.kenatst.reboot` (app + 2 extensions).
- Testables maintenant sur simulateur : flux UI, expliquer, picker (rendu vide
  sans entitlement), état de capacité, cartes manuelles, moteur, tests unitaires.
- Nécessitent un appareil physique + profil de provisionnement : application
  réelle des shields, fenêtres DeviceActivity, événements de seuil, Shield UI.
- Exigent l'approbation Apple pour la distribution (entitlement Family Controls).
- L'accès riche (App & Website Usage / EU) reste isolé (`supportsRichData=false`
  partout sauf si l'API le confirme sur appareil autorisé).

## PRIVACY

- Tout l'environnement/Screen Time reste local (`reboot.environment.v1`,
  `reboot.product.v2`). Aucun upload, aucune payload d'analytics, aucun log de
  tokens, pas de conversion token → identité d'app.
- Migration sûre : `reboot.product.v1` lu puis migré vers v2 ; champs nouveaux
  optionnels → les anciens payloads décodent sans perte.

## REGRESSION TESTS

`tools/test-engine.swift` — 19 tests, tous verts :
- 4 profils QA conservent EXACTEMENT leurs prescriptions (OBSERVE 15 /
  STAY 20 / RECALL 30 / NOTHING 10)
- 7 règles de friction ladder (niveau minimal, pas d'escalade injustifiée)
- 2 cas de migration (profil/session anciens décodés, champs env = nil)
- 6 mises à jour de preuves (compteurs, confiance, sorties anticipées, device facts)

## PHYSICAL DEVICE STATUS

- Simulateur : build + UI + moteur vérifiés. Shields/fenêtres/seuils non
  effectifs (pas d'entitlement embarqué avec CODE_SIGNING_ALLOWED=NO).
- Appareil physique requis pour valider : autorisation réelle, shields de session,
  fenêtres récurrentes, événements de seuil, rendu du shield personnalisé.

## KNOWN APPLE LIMITATIONS

- `FamilyActivityData` / richer data : région (UE) et appareil-dépendant,
  non détectable sur simulateur ; capacité isolée, jamais requise.
- Les tokens restent opaques : pas de noms d'apps depuis Screen Time (labels
  uniquement via l'UI Apple).
- Les extensions ne s'exécutent pas de manière fiable sur simulateur.
- Pas de VPN/Accessibilité/foreground detection — volontaire.

## BUILD STATUS

- Debug et Release : **BUILD SUCCEEDED, 0 erreur, 0 warning de compilation**
  (seul le note système AppIntents metadata processor, non lié au code).
- 3 cibles (app + 2 extensions), 62 fichiers, extensions embarquées dans PlugIns.

## QA VISUEL (minimal, conforme à la règle d'économie de tokens)

- `qa/environment/17pro/today-env-card.png` — carte environnement Today (manuelle)
- `qa/environment/17pro/connect-explainer.png` — sheet « Protect your focus windows. »
- `qa/environment/17pro/activity-selection.png` — sélection d'activités
- `qa/environment/17pro/protected-session.png` — session protégée (timer)

## REMAINING LIMITATIONS

- `firstSwitchMinute` capturé mais pas encore demandé à l'écran.
- La sortie anticipée garde le snapshot ; l'interprétation (« protection may have
  felt too restrictive ») apparaît dans l'insight après preuves répétées.
- Les fenêtres récurrentes : un seul flux de création/édition minimal.
- Les événements de seuil attendent l'appareil physique pour être validés.
