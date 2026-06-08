# Pixel Palette Lab

## Présentation

Pixel Palette Lab est une application web destinée aux artistes pixel art, game designers et développeurs indépendants. Elle permet de créer, analyser, modifier et exporter des palettes de couleurs optimisées pour le pixel art.

L'objectif est de centraliser dans un seul outil les tâches courantes liées à la création de palettes : génération de nuances, extraction depuis une image, prévisualisation sur des sprites et export vers différents formats.

---

# Objectifs

* Créer rapidement des palettes cohérentes.
* Faciliter la création de dégradés et de nuances.
* Analyser les palettes existantes.
* Prévisualiser le rendu des palettes sur des sprites.
* Exporter les palettes dans des formats compatibles avec les principaux outils graphiques.

---

# Fonctionnalités

## 1. Éditeur de palette

### Création de couleurs

L'utilisateur peut :

* Ajouter une couleur.
* Supprimer une couleur.
* Modifier une couleur.
* Réorganiser les couleurs par glisser-déposer.

### Informations affichées

Pour chaque couleur :

* Aperçu visuel.
* Code HEX.
* Valeurs RGB.
* Valeurs HSL.

---

## 2. Génération automatique de nuances

À partir d'une couleur de base, l'application génère :

* Ombres.
* Tons intermédiaires.
* Highlights.

### Paramètres

* Nombre d'ombres.
* Nombre de highlights.
* Intensité des variations.
* Température des ombres.
* Température des lumières.

---

## 3. Génération de palettes

### Génération aléatoire

Création automatique de palettes cohérentes.

### Génération par style

Styles proposés :

* Fantasy
* Medieval
* Forest
* Desert
* Tropical
* Cyberpunk
* Horror
* Sci-Fi
* Retro Console
* Game Boy
* PICO-8 Inspired

---

## 4. Extraction depuis une image

L'utilisateur importe une image.

L'application :

* Extrait les couleurs dominantes.
* Affiche les couleurs les plus utilisées.
* Génère une palette exploitable.

### Paramètres

* Nombre maximal de couleurs.
* Tolérance de regroupement.
* Réduction automatique des couleurs proches.

---

## 5. Réduction de palette

Optimisation d'une palette existante.

Fonctionnalités :

* Fusion des couleurs similaires.
* Réduction vers un nombre cible de couleurs.
* Comparaison avant/après.

Cas d'usage :

* Optimisation pour le pixel art.
* Contraintes de consoles rétro.
* Réduction de taille de spritesheets.

---

## 6. Prévisualisation en temps réel

### Sprites intégrés

L'application fournit plusieurs sprites de démonstration :

* Personnage RPG.
* Arbre.
* Maison.
* Coffre.
* Monstre.

### Recolorisation

La palette sélectionnée est appliquée automatiquement.

L'utilisateur visualise instantanément :

* Les contrastes.
* Les ombres.
* Les transitions de couleurs.

---

## 7. Vérification de lisibilité

Analyse automatique :

* Contraste entre couleurs.
* Détection des couleurs trop proches.
* Détection des doublons.

Affichage de recommandations visuelles.

---

## 8. Gestion de projets

Fonctionnalités :

* Sauvegarde locale.
* Chargement de projets.
* Duplication de palettes.
* Historique des modifications.

---

## 9. Import / Export

### Import

* JSON
* PNG
* Palette personnalisée

### Export

* JSON
* PNG
* GPL (GIMP Palette)
* CSS Variables
* Tailwind Config
* ASE (option avancée)

---

# Architecture technique

## Frontend

* React
* TypeScript
* Vite

## Interface

* Tailwind CSS
* shadcn/ui
