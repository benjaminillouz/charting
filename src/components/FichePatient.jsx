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
    let yPos = 0;

    // En-tete avec fond colore
    pdf.setFillColor(0, 75, 99); // Dark teal
    pdf.rect(0, 0, pageWidth, 35, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Fiche Patient - Soins de Parodontie', margin, 15);

    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.text(contextInfo?.centreNom || 'HelloParo', margin, 24);

    const praticienText = contextInfo?.praticienNom ? 'Dr ' + contextInfo.praticienNom : '';
    if (praticienText) {
      pdf.text(praticienText, margin, 31);
    }

    yPos = 45;

    // Informations patient
    pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 20, 'F');
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(margin, yPos, pageWidth - 2 * margin, 20, 'S');

    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Informations Patient', margin + 5, yPos + 7);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const patientFullName = ((patientInfo?.firstName || '') + ' ' + (patientInfo?.name || '')).trim() || 'Non renseigne';
    pdf.text('Patient: ' + patientFullName, margin + 5, yPos + 15);
    pdf.text('Date: ' + (patientInfo?.date || new Date().toLocaleDateString('fr-FR')), pageWidth - margin - 40, yPos + 15);

    yPos += 30;

    // Titre section
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 75, 99);
    pdf.text('Informations sur les soins de parodontie', margin, yPos);
    yPos += 10;

    // Contenu informatif
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    const content = [
      {
        title: "Qu'est-ce que la parodontie ?",
        text: "La parodontie est la specialite dentaire qui traite les maladies des tissus de soutien des dents : la gencive, l'os alveolaire et le ligament parodontal. Ces maladies, appelees maladies parodontales, comprennent la gingivite et la parodontite."
      },
      {
        title: "Les signes d'alerte",
        text: "- Saignement des gencives lors du brossage ou spontane\n- Gencives rouges, gonflees ou sensibles\n- Mauvaise haleine persistante\n- Dents qui semblent plus longues (recession gingivale)\n- Dents mobiles ou qui se deplacent\n- Espaces qui apparaissent entre les dents"
      },
      {
        title: "L'importance du traitement",
        text: "Sans traitement, la parodontite peut entrainer la perte des dents. De plus, les bacteries responsables peuvent avoir des consequences sur la sante generale : maladies cardiovasculaires, diabete, complications pendant la grossesse."
      },
      {
        title: "Les etapes du traitement",
        text: "1. Enseignement a l'hygiene bucco-dentaire personnalise\n2. Detartrage supra et sous-gingival\n3. Surfacage radiculaire si necessaire\n4. Reevaluation apres cicatrisation\n5. Chirurgie parodontale si indiquee\n6. Suivi regulier (maintenance parodontale)"
      },
      {
        title: "Conseils d'hygiene bucco-dentaire",
        text: "- Brossez-vous les dents 2 a 3 fois par jour pendant 2 minutes\n- Utilisez une brosse a dents souple ou electrique\n- Nettoyez les espaces interdentaires quotidiennement\n- Utilisez des brossettes interdentaires adaptees\n- Rincez-vous la bouche apres les repas si le brossage est impossible"
      },
      {
        title: "Le suivi parodontal",
        text: "Apres le traitement actif, un suivi regulier est essentiel pour maintenir les resultats obtenus. La frequence des visites de maintenance sera determinee en fonction de votre situation clinique (generalement 2 a 4 fois par an)."
      }
    ];

    content.forEach(section => {
      // Verifier s'il faut passer a une nouvelle page
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = 20;
      }

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(0, 75, 99);
      pdf.text(section.title, margin, yPos);
      yPos += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(60, 60, 60);
      const splitText = pdf.splitTextToSize(section.text, pageWidth - 2 * margin);
      pdf.text(splitText, margin, yPos);
      yPos += splitText.length * 4 + 8;
    });

    // Pied de page
    pdf.setFontSize(7);
    pdf.setTextColor(128, 128, 128);
    const dateStr = new Date().toLocaleDateString('fr-FR') + ' ' + new Date().toLocaleTimeString('fr-FR');
    pdf.text('Document genere le ' + dateStr + ' - HelloParo', margin, pageHeight - 8);

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
        <p className="opacity-90">Document d'information pour le patient sur les soins parodontaux</p>
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
        <div className="space-y-4 text-sm text-slate-600">
          <div className="p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">Le document contient:</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Qu'est-ce que la parodontie ?</li>
              <li>Les signes d'alerte a surveiller</li>
              <li>L'importance du traitement</li>
              <li>Les etapes du traitement parodontal</li>
              <li>Conseils d'hygiene bucco-dentaire</li>
              <li>Le suivi parodontal</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
