import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Save, Mic } from 'lucide-react';
import api from '../../api/client';
import StepPersonalInfo from './StepPersonalInfo';
import StepBanking from './StepBanking';
import StepExperience from './StepExperience';
import DocumentUploader from './DocumentUploader';
import DoctorDetailingStudio from '../Dashboard/DoctorDetailingStudio';

interface ApplicantOnboardingProps {
  applicant: any;
  onComplete: () => void;
}

const ApplicantOnboarding: React.FC<ApplicantOnboardingProps> = ({ applicant, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(applicant.isExistingStaff ? 4 : 1);
  const [showStudio, setShowStudio] = useState(false);
  const [formData, setFormData] = useState<any>({
    ...applicant,
    ...applicant.formData,
    experience: applicant.formData?.experience || applicant.experience || [],
    family: applicant.formData?.family || applicant.family || [],
    education: applicant.formData?.education || applicant.education || []
  });
  const [isSaving, setIsSaving] = useState(false);

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const res = await api.post('/applicant/save-draft', { email: applicant.email, formData });
      if (res.data.success) {
        alert('Draft saved successfully!');
      }
    } catch (err) {
      console.error('Save failed', err);
      alert('Failed to save draft. Check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitFinalAndProceed = async () => {
    if (!window.confirm("Are you sure you want to submit your application? You won't be able to edit your details or documents later.")) return;
    setIsSaving(true);
    try {
      const res = await api.post('/submit-onboarding', { email: applicant.email, formData });
      if (res.data.success) {
        alert('Application submitted successfully!');
        onComplete(); // Advance to Dashboard
      }
    } catch (err) {
      console.error('Submit failed', err);
      alert('Submission failed. Check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dash-card" style={{ maxWidth: '900px', margin: '0 auto 4rem auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary)' }}>Application Wizard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {applicant.isExistingStaff ? 'Final Step: Upload Testimonials' : `Step ${currentStep} of ${totalSteps}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className={`btn btn-sm ${showStudio ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setShowStudio(!showStudio)} 
            style={{ display: 'flex', alignItems: 'center', gap: '6px', background: showStudio ? 'var(--primary)' : 'rgba(168, 85, 247, 0.15)', borderColor: '#a855f7', color: '#fff', fontWeight: 600 }}
          >
            <Mic size={16} /> {showStudio ? 'Close Studio' : '🎙️ Voice Studio (`AI Lab`)'}
          </button>
          <button className="btn btn-sm btn-outline" onClick={handleSaveDraft} disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

      {showStudio && (
        <div style={{ marginBottom: '2rem' }}>
          <DoctorDetailingStudio onClose={() => setShowStudio(false)} />
        </div>
      )}

      <div style={{ minHeight: '400px' }}>
        {currentStep === 1 && (
          <StepPersonalInfo data={formData} updateData={(d: any) => setFormData({ ...formData, ...d })} />
        )}
        {currentStep === 2 && (
          <StepExperience data={formData} updateData={(d: any) => setFormData({ ...formData, ...d })} />
        )}
        {currentStep === 3 && (
          <StepBanking data={formData} updateData={(d: any) => setFormData({ ...formData, ...d })} />
        )}
        {currentStep === 4 && (
          <DocumentUploader 
            applicant={applicant} 
            formData={formData}
            onNext={handleSubmitFinalAndProceed}
            onBack={handlePrev}
          />
        )}
      </div>

      {currentStep < 4 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button 
            className="btn btn-outline" 
            onClick={handlePrev} 
            disabled={currentStep === 1 || applicant.isExistingStaff}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <ChevronLeft size={18} /> Previous
          </button>
          
          <button 
            className="btn btn-primary" 
            onClick={handleNext}
            style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            Next <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicantOnboarding;
