import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Save } from 'lucide-react';
import api from '../../api/client';
import StepPersonalInfo from './StepPersonalInfo';
import StepBanking from './StepBanking';
import StepExperience from './StepExperience';
import DocumentUploader from './DocumentUploader';
import RapidTestEngine from './RapidTestEngine';

interface ApplicantOnboardingProps {
  applicant: any;
  onComplete: () => void;
}

const ApplicantOnboarding: React.FC<ApplicantOnboardingProps> = ({ applicant, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({
    ...applicant,
    ...applicant.formData,
    experience: applicant.formData?.experience || applicant.experience || [],
    family: applicant.formData?.family || applicant.family || [],
    education: applicant.formData?.education || applicant.education || []
  });
  const [isSaving, setIsSaving] = useState(false);

  const totalSteps = 5;

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
        alert('Application submitted successfully! Now taking you to the Rapid Assessment.');
        setCurrentStep(5); // Advance to Rapid Test
      }
    } catch (err) {
      console.error('Submit failed', err);
      alert('Submission failed. Check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  // Skip the standard header for Rapid Test (Step 5) as it has its own UI
  if (currentStep === 5) {
    return (
      <div className="dash-card" style={{ maxWidth: '900px', margin: '0 auto 4rem auto' }}>
        <RapidTestEngine 
          applicant={applicant} 
          onComplete={onComplete} 
        />
      </div>
    );
  }

  return (
    <div className="dash-card" style={{ maxWidth: '900px', margin: '0 auto 4rem auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ color: 'var(--primary)' }}>Application Wizard</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Step {currentStep} of {totalSteps}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-sm btn-outline" onClick={handleSaveDraft} disabled={isSaving}>
            <Save size={16} /> {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
        </div>
      </div>

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
            disabled={currentStep === 1}
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
