import React, { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFGeneratorProps {
  applicant: any;
  type: 'offer' | 'appointment';
  onComplete: () => void;
  onCancel: () => void;
}

const PDFGenerator: React.FC<PDFGeneratorProps> = ({ applicant, type, onComplete, onCancel }) => {
  const [generating, setGenerating] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const generatePDF = async () => {
    setGenerating(true);
    try {
      if (!captureRef.current) return;
      
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`${applicant.fullName.replace(/\s+/g, '_')}_${type}_Letter.pdf`);

      alert(`${type.toUpperCase()} Letter generated successfully for ${applicant.fullName}!`);
      onComplete();
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('PDF generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  // Mock template - in a real scenario, this would be fetched from the backend company profile
  const htmlContent = `
    <div style="font-family: 'Times New Roman', serif; padding: 40px; color: #000;">
      <h1 style="text-align: center; color: #1e3a8a;">Emyris Biolifesciences</h1>
      <hr style="margin-bottom: 40px;" />
      
      <p style="text-align: right;">Date: ${new Date().toLocaleDateString()}</p>
      
      <h3>${type === 'offer' ? 'Offer of Employment' : 'Appointment Letter'}</h3>
      
      <p>Dear <strong>${applicant.fullName}</strong>,</p>
      
      <p>Following your recent application and interviews, we are delighted to offer you the position of <strong>${applicant.formData?.position || 'Associate'}</strong> at Emyris Biolifesciences.</p>
      
      <p>Your expected joining date will be communicated shortly. Please find the detailed terms and conditions attached to your onboarding portal.</p>
      
      <br /><br />
      <p>Sincerely,</p>
      <p><strong>HR Department</strong><br />Emyris Biolifesciences</p>
    </div>
  `;

  return (
    <div className="dash-card" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h2>Generate {type === 'offer' ? 'Offer' : 'Appointment'} Letter</h2>
      <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>
        Generating for: <strong>{applicant.fullName}</strong> ({applicant.email})
      </p>
      
      {/* Visible Preview Container */}
      <div style={{ margin: '2rem 0', border: '1px solid var(--glass-border)', background: '#fff', textAlign: 'left', maxHeight: '400px', overflowY: 'auto' }}>
        {/* Hidden Container for html2canvas to capture exactly A4 proportions */}
        <div 
          ref={captureRef}
          style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            padding: '20mm',
            background: 'white',
            boxSizing: 'border-box',
            margin: '0 auto'
          }}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
        <button className="btn btn-outline" onClick={onCancel} disabled={generating}>Cancel</button>
        <button className="btn btn-primary" onClick={generatePDF} disabled={generating}>
          {generating ? 'Capturing PDF...' : `Download ${type === 'offer' ? 'Offer' : 'Appt'} Letter`}
        </button>
      </div>
    </div>
  );
};

export default PDFGenerator;
