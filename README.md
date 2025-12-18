# 🦷 Charting Parodontal

Application web interactive de charting parodontal pour les professionnels dentaires. Permet d'enregistrer et visualiser les examens parodontaux complets avec une interface intuitive et des représentations anatomiques réalistes des dents.

![Periodontal Chart Demo](./docs/screenshot.png)

## ✨ Fonctionnalités

### Examen Parodontal Complet
- **6 sites de sondage par dent** (3 vestibulaires + 3 linguaux/palatins)
- **Profondeur de sondage (PD)** avec code couleur automatique
  - Vert : < 4mm (sain)
  - Jaune : 4mm (surveillance)
  - Rouge : ≥ 5mm (pathologique)
- **Récession gingivale (REC)** avec valeurs positives ou négatives
- **Saignement au sondage (BOP)** par site
- **Indice de plaque (PLI)** par site
- **Suppuration (SUP)** par site
- **Mobilité dentaire** (grades 0-3)
- **Furcation** (grades 0-3) pour les molaires
- **Dents absentes et implants**

### Visualisation
- **Vue graphique** avec représentation anatomique SVG des dents
- **Vue tableau** pour saisie rapide des données
- **Graphiques de sondage** en temps réel
- **Dents anatomiquement réalistes** :
  - Molaires avec racines multiples
  - Prémolaires avec cuspides
  - Canines pointues
  - Incisives avec bord incisif

### Statistiques Automatiques
- Nombre de dents présentes
- Nombre total de sites
- Pourcentage de saignement au sondage (BOP%)
- Indice de plaque (%)
- Nombre de poches ≥ 5mm
- Nombre de poches à 4mm

### Gestion des Données
- Export JSON complet
- Import de fichiers JSON
- Informations patient (nom, date, examinateur)
- Réinitialisation complète

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation locale

```bash
# Cloner le repository
git clone https://github.com/votre-username/periodontal-chart.git
cd periodontal-chart

# Installer les dépendances
npm install

# Lancer en mode développement
npm run dev

# Build pour production
npm run build
```

L'application sera accessible sur `http://localhost:3000`

## 📖 Utilisation

### Saisie des données

1. **Sélectionner une dent** en cliquant dessus dans la vue graphique
2. **Saisir les mesures** de sondage et récession pour chaque site
3. **Marquer les indicateurs** (saignement, plaque, suppuration) en cliquant sur les boutons
4. **Définir la mobilité** et la furcation si nécessaire

### Raccourcis

| Action | Description |
|--------|-------------|
| Clic sur dent | Sélectionner/désélectionner |
| Vue Graphique | Visualisation anatomique |
| Vue Tableau | Saisie rapide en grille |

### Export des données

Cliquez sur **Exporter** pour télécharger un fichier JSON contenant :
- Informations patient
- Toutes les mesures par dent
- Statistiques calculées
- Date d'export

## 🏗️ Structure du projet

```
periodontal-chart/
├── public/
│   └── tooth.svg          # Favicon
├── src/
│   ├── components/
│   │   └── PeriodontalChart.jsx  # Composant principal
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## 🛠️ Technologies utilisées

- **React 18** - Framework UI
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **SVG** - Visualisation des dents

## 📊 Nomenclature

L'application utilise la **numérotation FDI** (Fédération Dentaire Internationale) :

```
Maxillaire:  18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28
Mandibule:   48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38
```

## 🔮 Évolutions futures

- [ ] Saisie vocale des mesures
- [ ] Export PDF avec graphiques
- [ ] Comparaison entre examens
- [ ] Synchronisation cloud
- [ ] Mode hors-ligne (PWA)
- [ ] Intégration logiciels de cabinet

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👥 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à ouvrir une issue ou une pull request.

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push sur la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Ouvrir une Pull Request

## 🏥 À propos

Développé par **CEMEDIS** - Groupe de 26 centres médico-dentaires en Île-de-France.

---

<p align="center">
  Made with ❤️ for dental professionals
</p>
