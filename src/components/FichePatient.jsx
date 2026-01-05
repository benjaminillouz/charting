import React, { useState } from 'react';
import jsPDF from 'jspdf';

const WEBHOOK_URL = 'https://n8n.cemedis.app/webhook/386b9565-48c8-42c6-969d-85f320a96ba2';

export default function FichePatient({ patientInfo, contextInfo }) {
  const [patientEmail, setPatientEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);

  const generatePDF = () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - 2 * margin;
    let yPos = 0;

    const addNewPageIfNeeded = (requiredSpace = 20) => {
      if (yPos > pageHeight - requiredSpace) {
        pdf.addPage();
        yPos = 20;
        return true;
      }
      return false;
    };

    const addTitle = (text, size = 14, color = [0, 75, 99]) => {
      addNewPageIfNeeded(15);
      pdf.setFontSize(size);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(...color);
      pdf.text(text, margin, yPos);
      yPos += size * 0.5 + 2;
    };

    const addSubtitle = (text, size = 11) => {
      addNewPageIfNeeded(12);
      pdf.setFontSize(size);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(60, 60, 60);
      pdf.text(text, margin, yPos);
      yPos += size * 0.4 + 2;
    };

    const addParagraph = (text, indent = 0) => {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(50, 50, 50);
      const lines = pdf.splitTextToSize(text, contentWidth - indent);
      lines.forEach(line => {
        addNewPageIfNeeded(6);
        pdf.text(line, margin + indent, yPos);
        yPos += 4;
      });
      yPos += 2;
    };

    const addBulletPoint = (text, indent = 5) => {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(50, 50, 50);
      const lines = pdf.splitTextToSize(text, contentWidth - indent - 5);
      addNewPageIfNeeded(6);
      pdf.text('•', margin + indent, yPos);
      lines.forEach((line, idx) => {
        if (idx > 0) addNewPageIfNeeded(6);
        pdf.text(line, margin + indent + 5, yPos);
        yPos += 4;
      });
    };

    const addHighlight = (text, bgColor = [255, 243, 205]) => {
      addNewPageIfNeeded(12);
      pdf.setFillColor(...bgColor);
      const lines = pdf.splitTextToSize(text, contentWidth - 10);
      const boxHeight = lines.length * 4 + 6;
      pdf.roundedRect(margin, yPos - 3, contentWidth, boxHeight, 2, 2, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 60, 0);
      lines.forEach(line => {
        pdf.text(line, margin + 5, yPos + 2);
        yPos += 4;
      });
      yPos += 5;
    };

    // === PAGE 1: EN-TETE ===
    pdf.setFillColor(0, 75, 99);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Soins de parodontie', margin, 18);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Fiche d\'information patient', margin, 26);

    const praticienText = contextInfo?.praticienNom ? 'Dr ' + contextInfo.praticienNom : '';
    const centreText = contextInfo?.centreNom || 'HelloParo';
    if (praticienText) {
      pdf.text(praticienText + ' - ' + centreText, margin, 34);
    } else {
      pdf.text(centreText, margin, 34);
    }

    // Patient info box
    yPos = 50;
    pdf.setFillColor(248, 250, 252);
    pdf.roundedRect(margin, yPos, contentWidth, 18, 3, 3, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(margin, yPos, contentWidth, 18, 3, 3, 'S');

    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    const patientFullName = ((patientInfo?.firstName || '') + ' ' + (patientInfo?.name || '')).trim() || 'Patient';
    pdf.setFont('helvetica', 'bold');
    pdf.text('Patient:', margin + 5, yPos + 7);
    pdf.setFont('helvetica', 'normal');
    pdf.text(patientFullName, margin + 25, yPos + 7);

    pdf.setFont('helvetica', 'bold');
    pdf.text('Date:', margin + 5, yPos + 13);
    pdf.setFont('helvetica', 'normal');
    pdf.text(patientInfo?.date || new Date().toLocaleDateString('fr-FR'), margin + 20, yPos + 13);

    yPos = 78;

    // Introduction
    pdf.setFillColor(224, 242, 254);
    pdf.roundedRect(margin, yPos - 3, contentWidth, 14, 2, 2, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'italic');
    pdf.setTextColor(3, 105, 161);
    const introText = pdf.splitTextToSize('Vous avez ete vu en consultation pour le traitement d\'une maladie parodontale, voici un recapitulatif de la consultation.', contentWidth - 10);
    introText.forEach((line, idx) => {
      pdf.text(line, margin + 5, yPos + 4 + idx * 4);
    });
    yPos += 20;

    // === LA MALADIE PARODONTALE ===
    addTitle('La maladie parodontale', 16, [0, 75, 99]);
    yPos += 3;

    // 1. Definition
    addSubtitle('1. Definition');
    addParagraph('La maladie parodontale est une maladie chronique, inflammatoire et multifactorielle. Elle touche les tissus de soutien de la dent (gencive, ligament, os) et peut, si elle n\'est pas traitee, conduire a un dechaussement progressif des dents.');

    // 2. Approche globale
    addSubtitle('2. Une approche globale du traitement');
    addParagraph('Pour obtenir un traitement efficace et des resultats durables, tous les facteurs impliques doivent etre pris en compte. Le traitement repose sur une collaboration etroite entre le patient et l\'equipe soignante.');

    // 3. Les differents facteurs
    addSubtitle('3. Les differents facteurs a considerer');
    yPos += 2;

    // Facteur familial
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 75, 99);
    addNewPageIfNeeded(10);
    pdf.text('Le facteur familial', margin + 3, yPos);
    yPos += 5;
    addParagraph('La maladie parodontale presente souvent une predisposition genetique. Il est donc important d\'etre vigilant si des antecedents familiaux sont connus.');
    addHighlight('Faites surveiller vos enfants des leur plus jeune age, afin de prevenir toute apparition precoce de signes de la maladie.', [254, 243, 199]);

    // Facteur bacterien
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 75, 99);
    addNewPageIfNeeded(10);
    pdf.text('Le facteur bacterien', margin + 3, yPos);
    yPos += 5;
    addParagraph('La plaque bacterienne est la cause principale de l\'inflammation des gencives. Son elimination doit etre :');
    addBulletPoint('Quotidienne, par le patient, a l\'aide d\'un brossage adapte et des aides interdentaires recommandees par le chirurgien-dentiste.');
    addBulletPoint('Professionnelle, lors du debridement effectue par le praticien pour assainir les tissus en profondeur.');
    yPos += 2;
    addHighlight('Plus le brossage est rigoureux et complet, meilleurs seront les resultats du traitement.', [220, 252, 231]);

    // Facteurs de risque generaux
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 75, 99);
    addNewPageIfNeeded(10);
    pdf.text('Les facteurs de risque generaux', margin + 3, yPos);
    yPos += 5;
    addParagraph('Certains facteurs peuvent aggraver ou favoriser la maladie parodontale :');
    addBulletPoint('Maladies generales : diabete, hypertension, stress chronique.');
    addBulletPoint('Tabac : il s\'agit d\'un facteur de risque majeur. Le tabac diminue la capacite de cicatrisation et reduit l\'efficacite du traitement.');
    yPos += 2;
    addHighlight('Un sevrage tabagique est fortement recommande pour favoriser la guerison et stabiliser la maladie. N\'hesitez pas a en parler a votre praticien, qui pourra vous orienter vers un confrere specialise dans l\'accompagnement au sevrage.', [254, 226, 226]);

    // 4. En resume
    addNewPageIfNeeded(30);
    addSubtitle('4. En resume');
    addParagraph('La maladie parodontale est :');
    addBulletPoint('Chronique : elle necessite un suivi a vie.');
    addBulletPoint('Inflammatoire : elle est causee par la plaque bacterienne.');
    addBulletPoint('Multifactorielle : elle depend de facteurs genetiques, comportementaux et systemiques.');
    yPos += 2;
    addParagraph('Une prise en charge globale et personnalisee est essentielle pour preserver votre sante bucco-dentaire a long terme.');

    // === PAGE 2: LE TRAITEMENT ===
    pdf.addPage();
    yPos = 20;

    addTitle('La maladie parodontale : le traitement', 16, [0, 75, 99]);
    yPos += 3;

    // 1. Le bilan parodontal
    addSubtitle('1. Le bilan parodontal');
    addParagraph('La premiere etape du traitement consiste a realiser un bilan parodontal complet. Ce bilan comprend :');
    addBulletPoint('Un examen clinique approfondi des gencives et des dents.');
    addBulletPoint('Des radiographies dentaires permettant d\'evaluer la perte osseuse et l\'etat des tissus de soutien.');
    yPos += 2;
    addParagraph('Ces elements permettent d\'etablir un diagnostic precis de la maladie parodontale (stade et grade) et de definir un plan de traitement personnalise :');
    addBulletPoint('Nombre de seances necessaires');
    addBulletPoint('Etendue du debridement (zones concernees)');
    addBulletPoint('Chirurgie a prevoir');

    // 2. Le debridement parodontal
    yPos += 3;
    addSubtitle('2. Le debridement parodontal');
    addParagraph('Le debridement correspond a un nettoyage en profondeur des poches parodontales. Il permet :');
    addBulletPoint('D\'assainir les tissus autour des dents');
    addBulletPoint('De reduire la quantite de bacteries pathogenes');
    addBulletPoint('De favoriser la cicatrisation et la stabilisation de la maladie');

    // 3. Le controle de cicatrisation
    yPos += 3;
    addSubtitle('3. Le controle de cicatrisation et la maintenance');
    addParagraph('Environ trois mois apres le debridement, un controle de cicatrisation est realise. C\'est la seance de maintenance parodontale, essentielle pour verifier la stabilite du resultat et adapter les mesures d\'hygiene ou les traitements complementaires si necessaire.');
    addParagraph('Selon l\'etendue et la severite de la maladie, une maintenance reguliere est ensuite mise en place :');
    addBulletPoint('De 1 a 4 fois par an en moyenne');
    addBulletPoint('Pour prevenir les rechutes et maintenir les tissus sains');
    yPos += 2;
    addHighlight('La maladie parodontale est une maladie chronique : un suivi a vie est necessaire pour conserver les resultats obtenus.', [254, 243, 199]);

    // 4. Prise en charge financiere
    yPos += 3;
    addSubtitle('4. Prise en charge financiere');
    addParagraph('Les soins de parodontie ne sont pas rembourses par la Securite sociale. Cependant, lors des seances de maintenance, une partie de l\'acte peut etre prise en charge selon les regles en vigueur. Un devis detaille vous sera remis avant le debut du traitement.');

    // 5. Modalites de reglement
    yPos += 3;
    addSubtitle('5. Modalites de reglement');
    addParagraph('Les soins de parodontie representent un investissement pour votre sante bucco-dentaire.');
    addHighlight('Il est possible de regler en plusieurs fois sans frais. Pour connaitre les modalites, merci de vous rapprocher de l\'accueil.', [220, 252, 231]);

    // Pied de page sur chaque page
    const totalPages = pdf.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(7);
      pdf.setTextColor(128, 128, 128);
      const dateStr = new Date().toLocaleDateString('fr-FR');
      pdf.text('Document genere le ' + dateStr + ' - HelloParo - Page ' + i + '/' + totalPages, margin, pageHeight - 8);
    }

    return pdf;
  };

  const handlePreview = () => {
    const pdf = generatePDF();
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    setPdfPreviewUrl(url);
  };

  const handleDownload = () => {
    const pdf = generatePDF();
    const patientFullName = ((patientInfo?.firstName || '') + ' ' + (patientInfo?.name || '')).trim() || 'Patient';
    pdf.save(`Fiche-Patient-Parodontie-${patientFullName.replace(/\s+/g, '-')}.pdf`);
  };

  const handlePrint = () => {
    const pdf = generatePDF();
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, '_blank');
    if (printWindow) {
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  const handleSendEmail = async () => {
    if (!patientEmail || !patientEmail.includes('@')) {
      setSendStatus({ type: 'error', message: 'Veuillez entrer une adresse email valide' });
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      const pdf = generatePDF();
      const base64Data = pdf.output('datauristring').split(',')[1];
      const patientFullName = ((patientInfo?.firstName || '') + ' ' + (patientInfo?.name || '')).trim() || 'Patient';

      const payload = {
        patient_email: patientEmail,
        patient_name: patientFullName,
        pdf_base64: base64Data,
        document_type: 'fiche_patient_parodontie',
        centre: contextInfo?.centreNom || 'HelloParo',
        praticien: contextInfo?.praticienNom || '',
        date: new Date().toISOString()
      };

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        setSendStatus({ type: 'success', message: 'Email envoye avec succes!' });
        setPatientEmail('');
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSendStatus({ type: 'error', message: 'Erreur lors de l\'envoi de l\'email' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Fiche Patient - Soins de Parodontie</h2>
        <p className="opacity-90">Document d'information complet pour le patient sur la maladie parodontale et son traitement</p>
      </div>

      {/* Actions principales */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Actions</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Apercu */}
          <button
            onClick={handlePreview}
            className="flex items-center justify-center gap-3 px-4 py-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span className="font-medium">Apercu PDF</span>
          </button>

          {/* Telecharger */}
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-3 px-4 py-4 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="font-medium">Telecharger</span>
          </button>

          {/* Imprimer */}
          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-3 px-4 py-4 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="font-medium">Imprimer</span>
          </button>
        </div>
      </div>

      {/* Envoi par email */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Envoyer par email</h3>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Email du patient</label>
            <input
              type="email"
              value={patientEmail}
              onChange={(e) => setPatientEmail(e.target.value)}
              placeholder="patient@exemple.com"
              className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSendEmail}
              disabled={isSending || !patientEmail}
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Envoi...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Envoyer</span>
                </>
              )}
            </button>
          </div>
        </div>

        {sendStatus && (
          <div className={`mt-4 p-3 rounded-lg ${
            sendStatus.type === 'success'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {sendStatus.message}
          </div>
        )}
      </div>

      {/* Apercu du PDF */}
      {pdfPreviewUrl && (
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Apercu du document</h3>
            <button
              onClick={() => {
                URL.revokeObjectURL(pdfPreviewUrl);
                setPdfPreviewUrl(null);
              }}
              className="text-slate-500 hover:text-slate-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <iframe
            src={pdfPreviewUrl}
            className="w-full h-[600px] rounded-lg border border-slate-200"
            title="Apercu PDF"
          />
        </div>
      )}

      {/* Contenu informatif */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800 mb-4">Contenu du document</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">La maladie parodontale</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Definition</li>
              <li>Approche globale du traitement</li>
              <li>Facteur familial</li>
              <li>Facteur bacterien</li>
              <li>Facteurs de risque generaux</li>
              <li>Resume</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">Le traitement</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Bilan parodontal</li>
              <li>Debridement parodontal</li>
              <li>Controle de cicatrisation et maintenance</li>
              <li>Prise en charge financiere</li>
              <li>Modalites de reglement</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
