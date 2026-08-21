
# Velora Explorer

**Velora** est un gestionnaire de fichiers moderne, réactif et épuré, développé pour l'environnement Linux avec GTK4 et GJS.

Conçu pour la fluidité, Velora propose une approche de navigation récursive haute performance et une interface épurée sans compromis sur la puissance.

<img width="1437" height="902" alt="image" src="https://github.com/user-attachments/assets/9ca3cc7d-f75b-4561-94b3-6438c0a91c19" />

## Fonctionnalités clés

*   **Moteur récursif ultra-rapide** : Indexation et recherche en temps réel sur toute l'arborescence.
*   **Navigation fluide** : Historique complet (précédent/suivant) et gestion intelligente des chemins.
*   **Interface contextuelle native** : Menu clic-droit natif, moderne et parfaitement intégré.
*   **Moteur d'opérations GIO** : Gestion robuste des copier/coller/déplacer avec suivi de progression en temps réel.
*   **Gestion des périphériques** : Détection dynamique des volumes, clés USB et lecteurs réseau.
*   **Personnalisation système** : Prise en charge des raccourcis clavier standards (Ctrl+C, Ctrl+V, Delete, etc.).

## Stack Technique

*   **Language** : JavaScript (via GJS - GNOME JavaScript)
*   **Framework UI** : GTK4
*   **Back-end** : GIO (G-Input/Output) pour les opérations asynchrones sur les fichiers.

## Installation & Exécution

Assure-toi d'avoir les bibliothèques GTK4 et GJS installées sur ton système.

1. Clone le dépôt :
```
git clone https://github.com/hugodev-teck/Velora-explorer.git
```

2. Rends le script exécutable :
```
chmod +x explorer.js
```


3. Lance l'application :
```
gjs explorer.js
```

## Note liée a l'utilisation de l'intelligence artificiel

**Velora Explorer** est un projet où l'architecture et les choix de conception sont définis par l'humain, tandis que l'intelligence artificielle intervient en tant qu'assistante d'exécution pour la réalisation (partielle), l'uniformisation du code, la résolution technique et la documentation ainsi que la réalisation de commentaires.

## Licence

Ce projet est sous licence GNU Affero General Public License v3.0.
Voir le fichier [LICENSE](https://www.google.com/search?q=LICENSE) pour plus de détails.

---

*Développé avec passion pour une gestion de fichiers sans friction.*
