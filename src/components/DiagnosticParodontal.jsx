import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';

// Textes prédéfinis pour la CAT
const CAT_TEXTS = {
  hygiene: "Un protocole d'hygiène a été remis lors de la première consultation. C'est une étape clé du traitement. Un rdv de contrôle est prévu un mois après le premier rendez-vous. Lors de ce contrôle un bilan parodontal approfondi sera peut-être préconisé.",
  detartrage: "Un détartrage supra et sous gingival est recommandé.",
  surfacage: "Un débridement sous gingival (surfaçage) est recommandé.",
  facteurRetention: "Afin de favoriser le contrôle de plaque il est conseillé de refaire la restauration/prothèse sur la dent XXX. Je vous invite à contacter votre praticien traitant.",
  sevrageTabac: "Dans le cadre de votre pathologie gingivale un rdv avec un tabacologue est conseillé. Renseignez-vous auprès de votre médecin traitant.",
  substitutionMed: "Il est conseillé de prendre rdv avec le professionnel de santé qui vous a prescrit : XXXX. Ce médicament est responsable de l'hyperplasie/hypertrophie gingivale. Une substitution médicamenteuse est éventuellement possible.",
  adressage: "Suite à l'examen clinique, veuillez trouver ci-joint un courrier d'adressage à un confrère/consœur compétent (médecin traitant, endocrinologue, cardiologue, spécialiste en dermatologie buccale).",
  suiviParo: "Il est recommandé de venir en rdv de contrôle {frequency} fois par an.",
  chirurgie: "Suite à la réévaluation une thérapeutique chirurgicale est potentiellement recommandée au niveau de {site}.",
  prothese: "Une réhabilitation prothétique est recommandée. Nous vous invitons à prendre rdv avec votre praticien traitant.",
  odf: "Une réhabilitation orthodontique est recommandée. Nous vous invitons à prendre rdv avec votre praticien traitant. Un suivi parodontal régulier est fortement conseillé pendant toute la durée du traitement orthodontique."
};

// Classification des stades
const STADE_CRITERIA = {
  1: {
    perteAttache: "1-2 mm",
    alveolyse: "Tiers coronaire (<15%)",
    dentsAbsentes: 0,
    poches: "≤ 4 mm",
    alveolyseType: "Horizontale",
    lir: "Non ou classe I",
    defautCrestal: "Non ou léger",
    rehabilitationComplexe: false
  },
  2: {
    perteAttache: "3-4 mm",
    alveolyse: "Tiers coronaire (15-33%)",
    dentsAbsentes: 0,
    poches: "≤ 5 mm",
    alveolyseType: "Horizontale",
    lir: "Non ou classe I",
    defautCrestal: "Non ou léger",
    rehabilitationComplexe: false
  },
  3: {
    perteAttache: "≥ 5 mm",
    alveolyse: "Tiers moyen ou apical",
    dentsAbsentes: "≤ 4",
    poches: "≥ 6 mm",
    alveolyseType: "Verticale ≥ 3mm",
    lir: "Classe II ou III",
    defautCrestal: "Modéré",
    rehabilitationComplexe: false
  },
  4: {
    perteAttache: "≥ 5 mm",
    alveolyse: "Tiers moyen ou apical",
    dentsAbsentes: "≥ 5",
    poches: "≥ 6 mm",
    alveolyseType: "Verticale ≥ 3mm",
    lir: "Classe II ou III",
    defautCrestal: "Sévère",
    rehabilitationComplexe: true
  }
};

// Composant Section pliable
const CollapsibleSection = ({ title, icon, children, defaultOpen = false, color = "sky" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colorClasses = {
    sky: "bg-sky-50 border-sky-200 text-sky-800",
    amber: "bg-amber-50 border-amber-200 text-amber-800",
    red: "bg-red-50 border-red-200 text-red-800",
    green: "bg-green-50 border-green-200 text-green-800",
    purple: "bg-purple-50 border-purple-200 text-purple-800",
    slate: "bg-slate-50 border-slate-200 text-slate-800"
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-3 flex items-center justify-between ${colorClasses[color]} border-b`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon}</span>
          <h3 className="font-semibold">{title}</h3>
        </div>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="p-4 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
};

// Composant Toggle Oui/Non
const YesNoToggle = ({ value, onChange, label, description }) => (
  <div className="flex items-center justify-between py-2">
    <div>
      <span className="font-medium text-slate-700">{label}</span>
      {description && <p className="text-sm text-slate-500">{description}</p>}
    </div>
    <div className="flex gap-1">
      <button
        onClick={() => onChange(true)}
        className={`px-4 py-1.5 rounded-l-lg text-sm font-medium transition-all ${
          value === true
            ? 'bg-green-500 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        Oui
      </button>
      <button
        onClick={() => onChange(false)}
        className={`px-4 py-1.5 rounded-r-lg text-sm font-medium transition-all ${
          value === false
            ? 'bg-red-500 text-white'
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        Non
      </button>
    </div>
  </div>
);

// Composant Sélecteur de choix multiples
const MultiSelect = ({ options, value, onChange, label }) => (
  <div className="space-y-2">
    <label className="font-medium text-slate-700">{label}</label>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            value === opt.value
              ? 'bg-sky-500 text-white shadow-md'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

// Composant principal de diagnostic
export default function DiagnosticParodontal({ stats, patientInfo, contextInfo, radiographs = [], photos = [], onPdfGenerated }) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [diagnostic, setDiagnostic] = useState({
    adressePar: '',
    motifConsultation: '',
    antecedentsGeneraux: '',
    facteursRisque: {
      diabete: false,
      hta: false,
      stress: false,
      tabac: false,
      tabacQuantite: ''
    },
    antecedentsFamiliaux: null,
    traitementMedicamenteux: null,
    traitementDetails: '',
    typeExamen: 'initial',
    historiqueSoinsParo: null,
    historiqueSoinsDetails: '',
    hygienePerfectible: null,
    materielHygiene: '',
    frequenceBrossage: '',
    signesGingivite: {
      inflammation: null,
      oedeme: null,
      saignements: null,
      chaleur: null,
      erytheme: null,
      douleurs: null,
      halitose: null,
      alterationGout: null,
      alterationQualiteVie: null
    },
    aspectGingival: '',
    chartingRealise: true,
    bilonLongCone: null,
    perteAttacheMax: '',
    alveolyseRadio: '',
    dentsAbsentesParo: 0,
    profondeurPochesMax: 0,
    typeAlveolyse: '',
    lesionInterradiculaire: '',
    defautCrestal: '',
    rehabilitationComplexe: null,
    etendue: '',
    etendueType: '', // 'localisee' or 'generalisee'
    distributionIncisives: false,
    distributionMolaires: false,
    diagnosticType: '',
    gingiviteDetails: {
      induitePlaque: null,
      moduleFacteurs: null,
      accroissementMedicamenteux: null
    },
    gingiviteNonPlaqueType: '',
    stade: null,
    grade: null,
    cat: {
      enseignementHygiene: false,
      detartrage: false,
      surfacage: false,
      facteurRetention: false,
      sevrageTabac: false,
      substitutionMed: false,
      adressage: false,
      suiviParo: false,
      suiviParoFrequency: 2, // 1, 2, 3, or 4 times per year
      chirurgie: false,
      chirurgieSite: '', // Site for surgical therapy
      prothese: false,
      odf: false
    },
    notesLibres: '',
    conclusionTexte: ''
  });

  // Calcul automatique du stade
  const calculateStade = () => {
    const { profondeurPochesMax, dentsAbsentesParo, lesionInterradiculaire, rehabilitationComplexe } = diagnostic;

    if (rehabilitationComplexe === true || dentsAbsentesParo >= 5) return 4;
    if (profondeurPochesMax >= 6 || ['classeII', 'classeIII'].includes(lesionInterradiculaire) || (dentsAbsentesParo > 0 && dentsAbsentesParo <= 4)) return 3;
    if (profondeurPochesMax >= 4 && profondeurPochesMax <= 5) return 2;
    if (profondeurPochesMax <= 4 && profondeurPochesMax > 0) return 1;
    return null;
  };

  // Calcul automatique du grade
  const calculateGrade = () => {
    const { facteursRisque } = diagnostic;
    if (facteursRisque.tabac && facteursRisque.tabacQuantite === 'forte') return 'C';
    if (facteursRisque.tabac || facteursRisque.diabete) return 'B';
    return 'A';
  };

  useEffect(() => {
    if (diagnostic.diagnosticType === 'parodontite') {
      const calculatedStade = calculateStade();
      const calculatedGrade = calculateGrade();
      if (calculatedStade && !diagnostic.stade) setDiagnostic(prev => ({ ...prev, stade: calculatedStade }));
      if (calculatedGrade && !diagnostic.grade) setDiagnostic(prev => ({ ...prev, grade: calculatedGrade }));
    }
  }, [diagnostic.profondeurPochesMax, diagnostic.dentsAbsentesParo, diagnostic.facteursRisque, diagnostic.diagnosticType]);

  useEffect(() => {
    if (stats) {
      // Calculer le stade suggéré basé sur la profondeur max des poches
      const maxDepth = stats.maxPocketDepth || (stats.deepPockets > 0 ? 6 : (stats.moderatePockets > 0 ? 4 : 3));
      let suggestedStade = null;

      if (maxDepth >= 6) {
        suggestedStade = 3; // Stade 3 si poches ≥6mm
      } else if (maxDepth >= 5) {
        suggestedStade = 3; // Stade 3 si poches ≥5mm
      } else if (maxDepth >= 4) {
        suggestedStade = 2; // Stade 2 si poches 4-5mm
      } else if (maxDepth >= 1) {
        suggestedStade = 1; // Stade 1 si poches 1-4mm
      }

      // Auto-fill etendue based on percentage of teeth with deep pockets
      const suggestedEtendueType = stats.percentageDeepPockets >= 30 ? 'generalisee' : 'localisee';

      setDiagnostic(prev => ({
        ...prev,
        profondeurPochesMax: maxDepth,
        stade: prev.stade || suggestedStade, // Ne pas écraser si déjà défini
        etendueType: prev.etendueType || suggestedEtendueType,
        distributionIncisives: prev.distributionIncisives || stats.hasAffectedIncisives,
        distributionMolaires: prev.distributionMolaires || stats.hasAffectedMolaires
      }));
    }
  }, [stats]);

  // Générer le texte de conclusion
  const generateConclusion = () => {
    let conclusion = [];

    if (diagnostic.diagnosticType === 'parodontite') {
      conclusion.push(`Diagnostic : Parodontite Stade ${diagnostic.stade} Grade ${diagnostic.grade}`);
      if (diagnostic.etendueType) {
        let etendueText = diagnostic.etendueType === 'generalisee' ? 'Generalisee (>=30%)' : 'Localisee (<30%)';
        const distributions = [];
        if (diagnostic.distributionIncisives) distributions.push('Incisives');
        if (diagnostic.distributionMolaires) distributions.push('Molaires');
        if (distributions.length > 0) {
          etendueText += ` - Distribution: ${distributions.join(' et ')}`;
        }
        conclusion.push(`Etendue : ${etendueText}`);
      }
    } else if (diagnostic.diagnosticType === 'gingivite_plaque') {
      conclusion.push("Diagnostic : Gingivite induite par la plaque");
    } else if (diagnostic.diagnosticType === 'gingivite_non_plaque') {
      conclusion.push(`Diagnostic : Maladie gingivale non liee a la plaque - ${diagnostic.gingiviteNonPlaqueType}`);
    } else if (diagnostic.diagnosticType === 'sante') {
      conclusion.push("Diagnostic : Sante parodontale");
    }

    conclusion.push("\nConduite a tenir :");
    if (diagnostic.cat.enseignementHygiene) conclusion.push(`- ${CAT_TEXTS.hygiene}`);
    if (diagnostic.cat.detartrage) conclusion.push(`- ${CAT_TEXTS.detartrage}`);
    if (diagnostic.cat.surfacage) conclusion.push(`- ${CAT_TEXTS.surfacage}`);
    if (diagnostic.cat.sevrageTabac) conclusion.push(`- ${CAT_TEXTS.sevrageTabac}`);
    if (diagnostic.cat.suiviParo) {
      const suiviText = CAT_TEXTS.suiviParo.replace('{frequency}', diagnostic.cat.suiviParoFrequency);
      conclusion.push(`- ${suiviText}`);
    }
    if (diagnostic.cat.chirurgie) {
      const chirurgieText = CAT_TEXTS.chirurgie.replace('{site}', diagnostic.cat.chirurgieSite || 'sites concernés');
      conclusion.push(`- ${chirurgieText}`);
    }
    if (diagnostic.cat.prothese) conclusion.push(`- ${CAT_TEXTS.prothese}`);
    if (diagnostic.cat.odf) conclusion.push(`- ${CAT_TEXTS.odf}`);

    if (diagnostic.notesLibres) conclusion.push(`\nNotes : ${diagnostic.notesLibres}`);

    return conclusion.join('\n');
  };

  const updateField = (path, value) => {
    setDiagnostic(prev => {
      const keys = path.split('.');
      const newState = { ...prev };
      let current = newState;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return newState;
    });
  };

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      let yPos = 0;

      // En-tête avec fond coloré (plus grand pour inclure praticien)
      pdf.setFillColor(0, 75, 99); // Dark teal - professional medical color
      pdf.rect(0, 0, pageWidth, 38, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('HelloParo - Diagnostic Parodontal', margin, 12);

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(contextInfo?.centreNom || 'HelloParo', margin, 20);

      // Praticien et date
      const praticienText = contextInfo?.praticienNom ? 'Dr ' + contextInfo.praticienNom : '';
      const adresseParText = diagnostic.adressePar ? 'Adresse par: ' + diagnostic.adressePar : '';

      if (praticienText) {
        pdf.text(praticienText, margin, 27);
      }
      if (adresseParText) {
        pdf.text(adresseParText, pageWidth - margin - pdf.getTextWidth(adresseParText), 27);
      }

      pdf.text('Date: ' + (patientInfo?.date || new Date().toLocaleDateString('fr-FR')), margin, 34);

      yPos = 46;

      // Informations patient
      pdf.setTextColor(0, 0, 0);
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'F');
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(margin, yPos, pageWidth - 2 * margin, 25, 'S');

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Informations Patient', margin + 5, yPos + 7);

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      const patientFullName = ((patientInfo?.firstName || '') + ' ' + (patientInfo?.name || '')).trim() || 'Non renseigne';
      pdf.text('Patient: ' + patientFullName, margin + 5, yPos + 15);
      pdf.text('ID: ' + (patientInfo?.id || 'N/A'), margin + 5, yPos + 21);
      if (diagnostic.adressePar) {
        pdf.text('Adresse par: ' + diagnostic.adressePar, margin + 80, yPos + 15);
      }
      if (diagnostic.motifConsultation) {
        pdf.text('Motif: ' + diagnostic.motifConsultation, margin + 80, yPos + 21);
      }

      yPos += 32;

      // Statistiques du charting
      if (stats) {
        pdf.setFillColor(240, 253, 244);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 18, 'F');
        pdf.setDrawColor(187, 247, 208);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 18, 'S');

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(22, 101, 52);
        pdf.text('Resume du Charting', margin + 5, yPos + 6);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Dents: ' + stats.totalTeeth + '  |  Indice de saignement: ' + stats.bop + '%  |  Poches >=5mm: ' + stats.deepPockets + '  |  Poches 4mm: ' + stats.moderatePockets, margin + 5, yPos + 13);

        yPos += 25;
      }

      // Facteurs de risque
      const activeRisks = [];
      if (diagnostic.facteursRisque.diabete) activeRisks.push('Diabete');
      if (diagnostic.facteursRisque.hta) activeRisks.push('HTA');
      if (diagnostic.facteursRisque.stress) activeRisks.push('Stress');
      if (diagnostic.facteursRisque.tabac) activeRisks.push('Tabac' + (diagnostic.facteursRisque.tabacQuantite ? ' (' + diagnostic.facteursRisque.tabacQuantite + ')' : ''));

      if (activeRisks.length > 0 || diagnostic.antecedentsGeneraux) {
        pdf.setFillColor(254, 242, 242);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 18, 'F');
        pdf.setDrawColor(254, 202, 202);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 18, 'S');

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(153, 27, 27);
        pdf.text('Etat de Sante', margin + 5, yPos + 6);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        if (activeRisks.length > 0) {
          pdf.text('Facteurs de risque: ' + activeRisks.join(', '), margin + 5, yPos + 13);
        }

        yPos += 25;
      }

      // Signes cliniques
      const signesActifs = [];
      if (diagnostic.signesGingivite.inflammation) signesActifs.push('Inflammation');
      if (diagnostic.signesGingivite.saignements) signesActifs.push('Saignements');
      if (diagnostic.signesGingivite.oedeme) signesActifs.push('Oedeme');
      if (diagnostic.signesGingivite.halitose) signesActifs.push('Halitose');
      if (diagnostic.signesGingivite.douleurs) signesActifs.push('Douleurs');

      if (signesActifs.length > 0) {
        pdf.setFillColor(254, 252, 232);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 12, 'F');
        pdf.setDrawColor(254, 240, 138);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 12, 'S');

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        pdf.text('Signes cliniques: ' + signesActifs.join(', '), margin + 5, yPos + 7);

        yPos += 18;
      }

      // Diagnostic principal
      if (diagnostic.diagnosticType) {
        pdf.setFillColor(233, 213, 255);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 22, 'F');
        pdf.setDrawColor(192, 132, 252);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 22, 'S');

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(88, 28, 135);
        pdf.text('DIAGNOSTIC', margin + 5, yPos + 8);

        pdf.setFontSize(11);
        let diagText = '';
        if (diagnostic.diagnosticType === 'parodontite' && diagnostic.stade && diagnostic.grade) {
          diagText = 'PARODONTITE STADE ' + diagnostic.stade + ' GRADE ' + diagnostic.grade;
          if (diagnostic.etendue) {
            diagText += ' - ' + (diagnostic.etendue === 'generalisee' ? 'Generalisee' : diagnostic.etendue === 'localisee' ? 'Localisee' : 'Distribution molaires/incisives');
          }
        } else if (diagnostic.diagnosticType === 'gingivite_plaque') {
          diagText = 'Gingivite induite par la plaque';
        } else if (diagnostic.diagnosticType === 'gingivite_non_plaque') {
          diagText = 'Maladie gingivale non liee a la plaque';
        } else if (diagnostic.diagnosticType === 'sante') {
          diagText = 'Sante parodontale';
        }
        pdf.text(diagText, margin + 5, yPos + 17);

        yPos += 28;
      }

      // Conduite à tenir
      const catItems = [];
      if (diagnostic.cat.enseignementHygiene) catItems.push('Enseignement hygiene');
      if (diagnostic.cat.detartrage) catItems.push('Detartrage');
      if (diagnostic.cat.surfacage) catItems.push('Surfacage');
      if (diagnostic.cat.sevrageTabac) catItems.push('Sevrage tabagique');
      if (diagnostic.cat.suiviParo) catItems.push('Suivi parodontal');
      if (diagnostic.cat.chirurgie) catItems.push('Chirurgie');
      if (diagnostic.cat.prothese) catItems.push('Prothese');
      if (diagnostic.cat.odf) catItems.push('ODF');

      if (catItems.length > 0) {
        pdf.setFillColor(224, 242, 254);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 8 + catItems.length * 5, 'F');
        pdf.setDrawColor(125, 211, 252);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 8 + catItems.length * 5, 'S');

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(3, 105, 161);
        pdf.text('Conduite a Tenir', margin + 5, yPos + 6);

        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        catItems.forEach((item, idx) => {
          pdf.text('- ' + item, margin + 8, yPos + 12 + idx * 5);
        });

        yPos += 15 + catItems.length * 5;
      }

      // Notes libres
      if (diagnostic.notesLibres) {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'italic');
        pdf.setTextColor(100, 100, 100);
        const splitNotes = pdf.splitTextToSize('Notes: ' + diagnostic.notesLibres, pageWidth - 2 * margin - 10);
        pdf.text(splitNotes, margin + 5, yPos + 5);
        yPos += splitNotes.length * 5 + 10;
      }

      // Compte-rendu complet
      if (yPos < pageHeight - 60) {
        const conclusion = generateConclusion();
        pdf.setFillColor(241, 245, 249);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 50, 'F');
        pdf.setDrawColor(203, 213, 225);
        pdf.rect(margin, yPos, pageWidth - 2 * margin, 50, 'S');

        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(51, 65, 85);
        pdf.text('Compte-rendu', margin + 5, yPos + 6);

        pdf.setFontSize(7);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(0, 0, 0);
        const splitConclusion = pdf.splitTextToSize(conclusion, pageWidth - 2 * margin - 10);
        pdf.text(splitConclusion.slice(0, 10), margin + 5, yPos + 12);
      }

      // Radiographies (nouvelle page si présentes)
      if (radiographs && radiographs.length > 0) {
        pdf.addPage();

        // En-tête de la page radiographies
        pdf.setFillColor(0, 75, 99);
        pdf.rect(0, 0, pageWidth, 25, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Radiographies', margin, 15);

        let radioY = 35;
        const radioWidth = 85;
        const radioHeight = 65;
        let radioX = margin;
        let radioCount = 0;

        for (const radio of radiographs) {
          // Vérifier si on doit passer à une nouvelle ligne ou page
          if (radioCount > 0 && radioCount % 2 === 0) {
            radioY += radioHeight + 15;
            radioX = margin;
          }
          if (radioY + radioHeight > pageHeight - 20) {
            pdf.addPage();
            radioY = 20;
            radioX = margin;
          }

          try {
            pdf.addImage(radio.data, 'PNG', radioX, radioY, radioWidth, radioHeight);

            // Nom de la radiographie
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(radio.name, radioX, radioY + radioHeight + 5);
          } catch (e) {
            console.warn('Erreur ajout radiographie:', e);
          }

          radioX += radioWidth + 10;
          radioCount++;
        }
      }

      // Photographies (nouvelle page si présentes)
      if (photos && photos.length > 0) {
        pdf.addPage();

        // En-tête de la page photos
        pdf.setFillColor(0, 75, 99);
        pdf.rect(0, 0, pageWidth, 25, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Photographies', margin, 15);

        let photoY = 35;
        const photoWidth = 85;
        const photoHeight = 65;
        let photoX = margin;
        let photoCount = 0;

        for (const photo of photos) {
          if (photoCount > 0 && photoCount % 2 === 0) {
            photoY += photoHeight + 15;
            photoX = margin;
          }
          if (photoY + photoHeight > pageHeight - 20) {
            pdf.addPage();
            photoY = 20;
            photoX = margin;
          }

          try {
            pdf.addImage(photo.data, 'JPEG', photoX, photoY, photoWidth, photoHeight);
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(0, 0, 0);
            pdf.text(photo.name, photoX, photoY + photoHeight + 5);
          } catch (e) {
            console.warn('Erreur ajout photo:', e);
          }

          photoX += photoWidth + 10;
          photoCount++;
        }
      }

      // Pied de page
      pdf.setFontSize(7);
      pdf.setTextColor(128, 128, 128);
      const dateStr = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
      pdf.text('Genere le ' + dateStr + ' - HelloParo', margin, pageHeight - 8);

      // Générer blob URL pour l'affichage
      const pdfBlob = pdf.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Générer base64 pour l'envoi
      const base64Data = pdf.output('datauristring').split(',')[1];

      // Appeler le callback du parent pour afficher le modal
      if (onPdfGenerated) {
        onPdfGenerated(blobUrl, base64Data);
      }
    } catch (error) {
      console.error('Erreur PDF:', error);
      alert('Erreur lors de la generation du PDF: ' + error.message);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats du charting */}
      {stats && (
        <div className="bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
          <h2 className="text-xl font-bold mb-4">Resume du Charting Parodontal</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-3xl font-bold">{stats.totalTeeth}</div>
              <div className="text-sm opacity-80">Dents presentes</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className={`text-3xl font-bold ${parseFloat(stats.bop) > 30 ? 'text-red-300' : ''}`}>{stats.bop}%</div>
              <div className="text-sm opacity-80">Indice de saignement</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-3xl font-bold text-red-300">{stats.deepPockets}</div>
              <div className="text-sm opacity-80">Poches &ge;5mm</div>
            </div>
            <div className="bg-white/20 rounded-xl p-3">
              <div className="text-3xl font-bold text-amber-300">{stats.moderatePockets}</div>
              <div className="text-sm opacity-80">Poches 4mm</div>
            </div>
          </div>
        </div>
      )}

      {/* Etat civil */}
      <CollapsibleSection title="Etat Civil" icon="👤" color="slate" defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Adresse par</label>
            <input
              type="text"
              value={diagnostic.adressePar}
              onChange={(e) => updateField('adressePar', e.target.value)}
              placeholder="Nom du praticien"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motif de consultation</label>
            <input
              type="text"
              value={diagnostic.motifConsultation}
              onChange={(e) => updateField('motifConsultation', e.target.value)}
              placeholder="Ex: Saignements, mobilite dentaire..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>
      </CollapsibleSection>

      {/* Etat de sante */}
      <CollapsibleSection title="Etat de Sante" icon="🏥" color="red">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Antecedents generaux</label>
          <textarea
            value={diagnostic.antecedentsGeneraux}
            onChange={(e) => updateField('antecedentsGeneraux', e.target.value)}
            placeholder="Pathologies, chirurgies, allergies..."
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Facteurs de risque</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { key: 'diabete', label: 'Diabete' },
              { key: 'hta', label: 'HTA' },
              { key: 'stress', label: 'Stress' },
              { key: 'tabac', label: 'Tabac' }
            ].map(item => (
              <button
                key={item.key}
                onClick={() => updateField(`facteursRisque.${item.key}`, !diagnostic.facteursRisque[item.key])}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  diagnostic.facteursRisque[item.key]
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {diagnostic.facteursRisque.tabac && (
            <div className="mt-2">
              <label className="block text-sm text-slate-600 mb-1">Quantite tabac</label>
              <div className="flex gap-2">
                {['occasionnel', 'modere', 'forte'].map(q => (
                  <button
                    key={q}
                    onClick={() => updateField('facteursRisque.tabacQuantite', q)}
                    className={`px-3 py-1 rounded text-sm ${
                      diagnostic.facteursRisque.tabacQuantite === q
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {q === 'occasionnel' ? 'Occasionnel' : q === 'modere' ? 'Modere (<10/j)' : 'Fort (>10/j)'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <YesNoToggle
          label="Antecedents familiaux parodontaux"
          value={diagnostic.antecedentsFamiliaux}
          onChange={(v) => updateField('antecedentsFamiliaux', v)}
        />

        <YesNoToggle
          label="Traitement medicamenteux en cours"
          value={diagnostic.traitementMedicamenteux}
          onChange={(v) => updateField('traitementMedicamenteux', v)}
        />

        {diagnostic.traitementMedicamenteux && (
          <input
            type="text"
            value={diagnostic.traitementDetails}
            onChange={(e) => updateField('traitementDetails', e.target.value)}
            placeholder="Lesquels ?"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
          />
        )}
      </CollapsibleSection>

      {/* Examen clinique */}
      <CollapsibleSection title="Examen Clinique" icon="🔍" color="sky">
        <MultiSelect
          label="Type d'examen"
          options={[
            { value: 'initial', label: 'Initial' },
            { value: 'reevaluation', label: 'Reevaluation' }
          ]}
          value={diagnostic.typeExamen}
          onChange={(v) => updateField('typeExamen', v)}
        />

        <YesNoToggle
          label="Historique de soins parodontaux"
          value={diagnostic.historiqueSoinsParo}
          onChange={(v) => updateField('historiqueSoinsParo', v)}
        />

        <YesNoToggle
          label="Hygiene perfectible"
          value={diagnostic.hygienePerfectible}
          onChange={(v) => updateField('hygienePerfectible', v)}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Materiel d'hygiene utilise</label>
            <input
              type="text"
              value={diagnostic.materielHygiene}
              onChange={(e) => updateField('materielHygiene', e.target.value)}
              placeholder="Brosse a dent, brossettes, fil..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Frequence de brossage</label>
            <select
              value={diagnostic.frequenceBrossage}
              onChange={(e) => updateField('frequenceBrossage', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value="">Selectionner</option>
              <option value="1/j">1 fois/jour</option>
              <option value="2/j">2 fois/jour</option>
              <option value="3/j">3 fois/jour</option>
              <option value="irregulier">Irregulier</option>
            </select>
          </div>
        </div>
      </CollapsibleSection>

      {/* Signes gingivite */}
      <CollapsibleSection title="Signes et Symptomes de Gingivite" icon="🦷" color="amber">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {[
            { key: 'inflammation', label: 'Inflammation' },
            { key: 'oedeme', label: 'Oedeme' },
            { key: 'saignements', label: 'Saignements' },
            { key: 'erytheme', label: 'Erytheme' },
            { key: 'douleurs', label: 'Douleurs' },
            { key: 'halitose', label: 'Halitose' }
          ].map(item => (
            <YesNoToggle
              key={item.key}
              label={item.label}
              value={diagnostic.signesGingivite[item.key]}
              onChange={(v) => updateField(`signesGingivite.${item.key}`, v)}
            />
          ))}
        </div>

        <MultiSelect
          label="Aspect gingival"
          options={[
            { value: 'rouge', label: 'Rouge' },
            { value: 'lisse', label: 'Lisse' },
            { value: 'piquete', label: 'Piquete (peau d\'orange)' }
          ]}
          value={diagnostic.aspectGingival}
          onChange={(v) => updateField('aspectGingival', v)}
        />
      </CollapsibleSection>

      {/* Classification Parodontite */}
      <CollapsibleSection title="Classification Parodontite (Stade/Grade)" icon="📊" color="purple" defaultOpen={true}>
        <div className="bg-purple-50 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-purple-800">Criteres de Severite</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Perte d'attache max (mm)</label>
              <input
                type="text"
                value={diagnostic.perteAttacheMax}
                onChange={(e) => updateField('perteAttacheMax', e.target.value)}
                placeholder="Ex: 3-4 mm"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Profondeur de poches max (mm)</label>
              <input
                type="number"
                value={diagnostic.profondeurPochesMax}
                onChange={(e) => updateField('profondeurPochesMax', parseInt(e.target.value) || 0)}
                min="0"
                max="15"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Alveolyse radiographique</label>
              <select
                value={diagnostic.alveolyseRadio}
                onChange={(e) => updateField('alveolyseRadio', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                <option value="">Selectionner</option>
                <option value="tiersCoronaire15">Tiers coronaire (&lt;15%)</option>
                <option value="tiersCoronaire33">Tiers coronaire (15-33%)</option>
                <option value="tiersMoyen">Tiers moyen (33-66%)</option>
                <option value="tiersApical">Tiers apical (&gt;66%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Dents absentes (raisons paro)</label>
              <input
                type="number"
                value={diagnostic.dentsAbsentesParo}
                onChange={(e) => updateField('dentsAbsentesParo', parseInt(e.target.value) || 0)}
                min="0"
                max="32"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        <div className="bg-indigo-50 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-indigo-800">Criteres de Complexite</h4>

          <MultiSelect
            label="Type d'alveolyse"
            options={[
              { value: 'horizontale', label: 'Horizontale' },
              { value: 'verticale', label: 'Verticale >= 3mm' }
            ]}
            value={diagnostic.typeAlveolyse}
            onChange={(v) => updateField('typeAlveolyse', v)}
          />

          <MultiSelect
            label="Lesion interradiculaire (LIR)"
            options={[
              { value: 'non', label: 'Non' },
              { value: 'classeI', label: 'Classe I' },
              { value: 'classeII', label: 'Classe II' },
              { value: 'classeIII', label: 'Classe III' }
            ]}
            value={diagnostic.lesionInterradiculaire}
            onChange={(v) => updateField('lesionInterradiculaire', v)}
          />

          <YesNoToggle
            label="Besoin de rehabilitation complexe"
            description="Edentement necessitant prothese complexe"
            value={diagnostic.rehabilitationComplexe}
            onChange={(v) => updateField('rehabilitationComplexe', v)}
          />
        </div>

        {/* Section Etendue */}
        <div className="bg-white border-2 border-violet-200 rounded-xl p-4 space-y-4">
          <h4 className="font-semibold text-violet-800 flex items-center gap-2">
            Etendue
            {stats && stats.percentageDeepPockets > 0 && (
              <span className="text-xs font-normal bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full">
                {stats.teethWithDeepPockets?.length || 0} dents atteintes ({stats.percentageDeepPockets?.toFixed(1)}%)
              </span>
            )}
          </h4>

          {/* Localisée / Généralisée */}
          <div className="space-y-2">
            <label className="font-medium text-slate-700">Type d'etendue</label>
            <div className="flex gap-2">
              <button
                onClick={() => updateField('etendueType', 'localisee')}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all border-2 ${
                  diagnostic.etendueType === 'localisee'
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-lg">Localisee</div>
                <div className="text-xs opacity-70">&lt;30% des dents</div>
              </button>
              <button
                onClick={() => updateField('etendueType', 'generalisee')}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all border-2 ${
                  diagnostic.etendueType === 'generalisee'
                    ? 'bg-red-100 border-red-500 text-red-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className="text-lg">Generalisee</div>
                <div className="text-xs opacity-70">&ge;30% des dents</div>
              </button>
            </div>
          </div>

          {/* Distribution */}
          <div className="space-y-2">
            <label className="font-medium text-slate-700">Distribution</label>
            <div className="flex gap-3">
              <button
                onClick={() => updateField('distributionIncisives', !diagnostic.distributionIncisives)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all border-2 flex items-center justify-center gap-2 ${
                  diagnostic.distributionIncisives
                    ? 'bg-sky-100 border-sky-500 text-sky-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  diagnostic.distributionIncisives ? 'bg-sky-500 border-sky-500' : 'border-slate-300'
                }`}>
                  {diagnostic.distributionIncisives && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>Incisives</span>
                {stats?.hasAffectedIncisives && (
                  <span className="text-xs bg-sky-200 text-sky-700 px-1.5 py-0.5 rounded">auto</span>
                )}
              </button>
              <button
                onClick={() => updateField('distributionMolaires', !diagnostic.distributionMolaires)}
                className={`flex-1 px-4 py-3 rounded-xl font-medium transition-all border-2 flex items-center justify-center gap-2 ${
                  diagnostic.distributionMolaires
                    ? 'bg-amber-100 border-amber-500 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  diagnostic.distributionMolaires ? 'bg-amber-500 border-amber-500' : 'border-slate-300'
                }`}>
                  {diagnostic.distributionMolaires && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span>Molaires</span>
                {stats?.hasAffectedMolaires && (
                  <span className="text-xs bg-amber-200 text-amber-700 px-1.5 py-0.5 rounded">auto</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Stade et Grade */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <div className="bg-white border-2 border-purple-300 rounded-xl p-4">
            <h4 className="font-bold text-purple-800 mb-3">STADE</h4>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(s => (
                <button
                  key={s}
                  onClick={() => updateField('stade', s)}
                  className={`flex-1 py-3 rounded-xl text-xl font-bold transition-all ${
                    diagnostic.stade === s
                      ? s <= 2 ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              {diagnostic.stade && STADE_CRITERIA[diagnostic.stade] &&
                `Poches ${STADE_CRITERIA[diagnostic.stade].poches}`
              }
            </p>
          </div>

          <div className="bg-white border-2 border-indigo-300 rounded-xl p-4">
            <h4 className="font-bold text-indigo-800 mb-3">GRADE</h4>
            <div className="flex gap-2">
              {['A', 'B', 'C'].map(g => (
                <button
                  key={g}
                  onClick={() => updateField('grade', g)}
                  className={`flex-1 py-3 rounded-xl text-xl font-bold transition-all ${
                    diagnostic.grade === g
                      ? g === 'A' ? 'bg-green-500 text-white' :
                        g === 'B' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">
              {diagnostic.grade === 'A' && 'Progression lente'}
              {diagnostic.grade === 'B' && 'Progression moderee'}
              {diagnostic.grade === 'C' && 'Progression rapide'}
            </p>
          </div>
        </div>
      </CollapsibleSection>

      {/* Diagnostic Final */}
      <CollapsibleSection title="Diagnostic Final" icon="✅" color="green" defaultOpen={true}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[
            { value: 'sante', label: 'Sante parodontale', color: 'green' },
            { value: 'gingivite_plaque', label: 'Gingivite induite par la plaque', color: 'amber' },
            { value: 'gingivite_non_plaque', label: 'Maladie gingivale non liee a la plaque', color: 'orange' },
            { value: 'parodontite', label: 'Parodontite', color: 'red' }
          ].map(item => (
            <button
              key={item.value}
              onClick={() => updateField('diagnosticType', item.value)}
              className={`p-4 rounded-xl text-left font-medium transition-all border-2 ${
                diagnostic.diagnosticType === item.value
                  ? item.color === 'green' ? 'bg-green-100 border-green-500 text-green-800' :
                    item.color === 'amber' ? 'bg-amber-100 border-amber-500 text-amber-800' :
                    item.color === 'orange' ? 'bg-orange-100 border-orange-500 text-orange-800' :
                    'bg-red-100 border-red-500 text-red-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {diagnostic.diagnosticType === 'parodontite' && diagnostic.stade && diagnostic.grade && (
          <div className="mt-4 p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white text-center">
            <div className="text-sm opacity-80">Diagnostic</div>
            <div className="text-2xl font-bold">
              PARODONTITE STADE {diagnostic.stade} GRADE {diagnostic.grade}
            </div>
            <div className="text-sm mt-1">
              {diagnostic.etendue === 'generalisee' ? 'Generalisee' :
               diagnostic.etendue === 'localisee' ? 'Localisee' : ''}
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* CAT */}
      <CollapsibleSection title="Conduite a Tenir (CAT)" icon="📋" color="sky" defaultOpen={true}>
        <div className="space-y-3">
          {[
            { key: 'enseignementHygiene', label: "Enseignement a l'hygiene", text: CAT_TEXTS.hygiene },
            { key: 'detartrage', label: 'Detartrage supra et sous-gingival', text: CAT_TEXTS.detartrage },
            { key: 'surfacage', label: 'Debridement sous-gingival / Surfacage', text: CAT_TEXTS.surfacage },
            { key: 'sevrageTabac', label: 'Sevrage tabagique', text: CAT_TEXTS.sevrageTabac },
            { key: 'prothese', label: 'Rehabilitation prothetique', text: CAT_TEXTS.prothese },
            { key: 'odf', label: 'Rehabilitation orthodontique', text: CAT_TEXTS.odf }
          ].map(item => (
            <div
              key={item.key}
              className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                diagnostic.cat[item.key]
                  ? 'bg-sky-50 border-sky-300'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => updateField(`cat.${item.key}`, !diagnostic.cat[item.key])}
            >
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                  diagnostic.cat[item.key] ? 'bg-sky-500 border-sky-500' : 'border-slate-300'
                }`}>
                  {diagnostic.cat[item.key] && (
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`font-medium ${diagnostic.cat[item.key] ? 'text-sky-800' : 'text-slate-700'}`}>
                  {item.label}
                </span>
              </div>
              {diagnostic.cat[item.key] && (
                <p className="mt-2 text-sm text-slate-600 pl-9">{item.text}</p>
              )}
            </div>
          ))}

          {/* Suivi Parodontal with frequency selector */}
          <div
            className={`p-3 rounded-xl border-2 transition-all ${
              diagnostic.cat.suiviParo
                ? 'bg-green-50 border-green-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => updateField('cat.suiviParo', !diagnostic.cat.suiviParo)}
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                diagnostic.cat.suiviParo ? 'bg-green-500 border-green-500' : 'border-slate-300'
              }`}>
                {diagnostic.cat.suiviParo && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`font-medium ${diagnostic.cat.suiviParo ? 'text-green-800' : 'text-slate-700'}`}>
                Suivi parodontal
              </span>
            </div>
            {diagnostic.cat.suiviParo && (
              <div className="mt-3 pl-9 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Frequence:</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(freq => (
                      <button
                        key={freq}
                        onClick={(e) => {
                          e.stopPropagation();
                          updateField('cat.suiviParoFrequency', freq);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          diagnostic.cat.suiviParoFrequency === freq
                            ? 'bg-green-500 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {freq}x/an
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-sm text-slate-600">
                  {CAT_TEXTS.suiviParo.replace('{frequency}', diagnostic.cat.suiviParoFrequency)}
                </p>
              </div>
            )}
          </div>

          {/* Therapeutique chirurgicale with site field */}
          <div
            className={`p-3 rounded-xl border-2 transition-all ${
              diagnostic.cat.chirurgie
                ? 'bg-red-50 border-red-300'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => updateField('cat.chirurgie', !diagnostic.cat.chirurgie)}
            >
              <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center ${
                diagnostic.cat.chirurgie ? 'bg-red-500 border-red-500' : 'border-slate-300'
              }`}>
                {diagnostic.cat.chirurgie && (
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className={`font-medium ${diagnostic.cat.chirurgie ? 'text-red-800' : 'text-slate-700'}`}>
                Therapeutique chirurgicale (potentiellement recommandee)
              </span>
            </div>
            {diagnostic.cat.chirurgie && (
              <div className="mt-3 pl-9 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">Site:</span>
                  <input
                    type="text"
                    value={diagnostic.cat.chirurgieSite}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => updateField('cat.chirurgieSite', e.target.value)}
                    placeholder="Ex: 16, 17, secteur maxillaire droit..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  />
                </div>
                <p className="text-sm text-slate-600">
                  {CAT_TEXTS.chirurgie.replace('{site}', diagnostic.cat.chirurgieSite || 'sites concernes')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes libres</label>
          <textarea
            value={diagnostic.notesLibres}
            onChange={(e) => updateField('notesLibres', e.target.value)}
            rows={3}
            placeholder="Observations complementaires..."
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </CollapsibleSection>

      {/* Conclusion */}
      <div className="bg-slate-800 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Compte-rendu genere</h3>
          <button
            onClick={() => {
              navigator.clipboard.writeText(generateConclusion());
              alert('Copie dans le presse-papier !');
            }}
            className="px-4 py-2 bg-white/20 rounded-lg text-sm hover:bg-white/30 transition-all"
          >
            Copier
          </button>
        </div>
        <pre className="whitespace-pre-wrap text-sm text-slate-300 font-mono bg-slate-900 rounded-xl p-4 max-h-64 overflow-y-auto">
          {generateConclusion()}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        <button
          onClick={handleGeneratePdf}
          disabled={isGeneratingPdf}
          className="px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
        >
          {isGeneratingPdf ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generation...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Exporter PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
}
