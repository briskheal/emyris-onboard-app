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
      
      const clone = captureRef.current.cloneNode(true) as HTMLElement;
      clone.style.position = 'absolute';
      clone.style.top = '-9999px';
      clone.style.left = '0';
      clone.style.width = '210mm';
      clone.style.height = 'auto';
      clone.style.overflow = 'visible';
      clone.style.transform = 'none';
      clone.style.margin = '0';
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      document.body.removeChild(clone);

      const canvasW = canvas.width;
      const canvasH = canvas.height;
      const A4_PX_H = Math.floor(canvasW * 1.414); 

      const pdf = new jsPDF('p', 'mm', 'a4');
      let cursorY = 0;
      let pageCount = 0;
      // Calculate 25mm bottom padding in pixels relative to canvas width (which represents 210mm)
      const bottomPaddingPx = Math.floor((25 / 210) * canvasW);

      while (cursorY < canvasH - bottomPaddingPx) {
        if (pageCount > 0) pdf.addPage();
        
        const sliceH = Math.min(A4_PX_H, canvasH - cursorY);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvasW;
        sliceCanvas.height = sliceH;
        
        const sCtx = sliceCanvas.getContext('2d');
        sCtx?.drawImage(canvas, 0, cursorY, canvasW, sliceH, 0, 0, canvasW, sliceH);
        
        const sliceData = sliceCanvas.toDataURL('image/png', 1.0);
        const sliceH_mm = (sliceH / canvasW) * 210;
        
        pdf.addImage(sliceData, 'PNG', 0, 0, 210, sliceH_mm, undefined, 'FAST');
        
        cursorY += A4_PX_H;
        pageCount++;
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
