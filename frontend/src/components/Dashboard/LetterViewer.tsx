import React, { useState } from 'react';
import api from '../../api/client';

interface LetterViewerProps {
  title: string;
  letterData: string;
  isOffer?: boolean;
  isAccepted?: boolean;
  applicantEmail?: string;
  onAcceptSuccess?: () => void;
}

const LetterViewer: React.FC<LetterViewerProps> = ({ 
  title, 
  letterData, 
  isOffer, 
  isAccepted, 
  applicantEmail,
  onAcceptSuccess 
}) => {
  const [joiningDate, setJoiningDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAccept = async () => {
    if (!joiningDate) {
      alert("Please select your actual date of joining.");
      return;
    }
    if (!window.confirm(`Are you sure you want to accept this offer with a joining date of ${joiningDate}?`)) return;

    setIsSubmitting(true);
    try {
      const res = await api.post('/applicant/accept-offer', { email: applicantEmail, actualJoiningDate: joiningDate });
      if (res.data.success) {
        alert("Offer accepted successfully!");
        if (onAcceptSuccess) onAcceptSuccess();
      } else {
        alert("Failed to accept offer: " + (res.data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert("Network error while accepting offer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (letterData.startsWith('data:application/pdf')) {
      return (
        <iframe 
          src={letterData} 
          title={title}
          style={{ width: '100%', height: '500px', border: '1px solid var(--glass-border)', borderRadius: '8px' }} 
        />
      );
    }
    return (
      <div 
        style={{ padding: '2rem', background: 'white', color: 'black', borderRadius: '8px', overflowX: 'auto' }}
        dangerouslySetInnerHTML={{ __html: letterData }} 
      />
    );
  };

  return (
    <div className="dash-card">
      <h3 style={{ marginBottom: '1rem', color: 'var(--primary-color)' }}>{title}</h3>
      
      {renderContent()}

      {isOffer && !isAccepted && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', borderRadius: '8px' }}>
          <h4 style={{ color: '#10b981', marginBottom: '1rem' }}>Accept Offer</h4>
          <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
            To accept this offer, please confirm your actual date of joining and submit.
          </p>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label className="form-label">Date of Joining</label>
              <input 
                type="date" 
                className="form-input" 
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </div>
            <div style={{ alignSelf: 'flex-end' }}>
              <button 
                className="btn btn-primary" 
                style={{ background: '#10b981', borderColor: '#10b981', padding: '12px 24px' }}
                onClick={handleAccept}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Accept Offer ✨'}
              </button>
            </div>
          </div>
        </div>
      )}

      {isOffer && isAccepted && (
        <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '8px', textAlign: 'center' }}>
          ✅ You have successfully accepted this offer letter.
        </div>
      )}
    </div>
  );
};

export default LetterViewer;
