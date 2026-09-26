# Mistral Chat — repli des messages longs

Extension Firefox (compatible Zen Browser) qui replie les messages trop longs
sur [chat.mistral.ai](https://chat.mistral.ai) derrière un bouton
« Afficher plus » / « Afficher moins ·, comme le fait Claude.

- Fonctionne uniquement sur `https://chat.mistral.ai/*` (aucune autre page).
- Par défaut, seuls les **messages utilisateur** (les prompts) sont repliés.
- Hauteur limite configurable (défaut : 300 px) via la page d'options.
- Compatible thème clair et sombre (fondu en dégradé + bouton translucide).
- L'état « affiché en entier · est mémorisé par message, même après un
  re-rendu de l'interface.

## Structure

```
manifest.json     # Manifest V3, injection limitée à chat.mistral.ai
content.js        # Détection des messages + bouton Afficher plus / moins
content.css       # Repli (max-height + fondu) et style du bouton
options.html/.js  # Hauteur max, activation, application aux réponses
icons/icon.svg    # Icône
```

## Installation (Firefox / Zen)

### Essai rapide (temporaire, retiré au redémarrage)

1. Ouvrir `about:debugging#/runtime/this-firefox`
2. « Load Temporary Add-on… »
3. Sélectionner `manifest.json` dans ce dossier.

### Installation permanente

Firefox (et Zen) n'acceptent en permanence que les extensions **signées**.
Signer gratuitement via [addons.mozilla.org](https://addons.mozilla.org/) :

1. Créer un compte AMO, puis « Développeurs » → « Soumettre une nouvelle extension ».
2. Choisir la distribution « non listée » (self-distribution).
3. Télécharger le `.xpi` signé obtenu, puis l'ouvrir dans Firefox/Zen.

## Options

Accès : `about:addons` → Mistral Chat — repli des messages longs → Options.

| Option | Défaut | Description |
|---|---|---|
| Activer | oui | Coupe le repli sans désinstaller |
| Hauteur maximale | 300 px | Seuil de repli d'un message |
| Aussi les réponses | non | Replie aussi les messages de l'assistant |

## Développement / déploiement

Prérequis : Node.js. `npm install` installe `web-ext` (outil officiel Mozilla).

```bash
npm run lint    # validation du manifest et du code (doit être 0 erreur)
npm run build   # produit web-ext-artifacts/*.zip prêt pour AMO
npm run sign    # signature Mozilla (clés API requises, voir ci-dessous)
```

### Signer pour installation permanente (AMO)

1. Créer un compte sur [addons.mozilla.org](https://addons.mozilla.org/) et
   accepter l'accord développeur.
2. Générer des clés API : https://addons.mozilla.org/developers/manage/api-keys/
3. Signer en distribution « non listée » (usage personnel) :

```bash
npx web-ext sign --channel unlisted --api-key VOTRE_CLE --api-secret VOTRE_SECRET
```

Le `.xpi` signé arrive dans `web-ext-artifacts/` : l'ouvrir dans Firefox/Zen
pour installation permanente. Chaque signature exige d'incrémenter
`version` dans `manifest.json`.

## Si l'UI de Mistral change

L'extension s'appuie sur :

- conteneurs de message : `[data-message-author-role]` (+ `data-message-id`)
- content du message : `.select-text`

En cas de changement de l'UI (l'extension ne replie plus rien), ajuster
`MESSAGE_SELECTOR_*` et `CONTENT_SELECTOR` en tête de `content.js`.
Un avertissement apparaît dans la console (F12) si aucun message n'est détecté.
