import React, { Suspense, lazy } from 'react';
import { HandCoins, Landmark } from 'lucide-react';

const LoanManagement = lazy(() => import('./SupportTabs/LoanManagement'));
const AdvanceSalaryManagement = lazy(() => import('./SupportTabs/AdvanceSalaryManagement'));

interface SupportManagementProps {
  activeSubTab: string;
  setSubTab: (tab: string) => void;
}

const SupportManagement: React.FC<SupportManagementProps> = ({ activeSubTab, setSubTab }) => {
  const tabs = [
    { id: 'loan', label: 'Loan', icon: <Landmark size={16} /> },
    { id: 'adv_salary', label: 'Adv. Salary', icon: <HandCoins size={16} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <HandCoins size={22} style={{ color: 'var(--primary)' }} />
        <div>
          <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.3rem', fontWeight: 700 }}>
            Support
          </h2>
          <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Manage employee loans and advance salary requests
          </p>
        </div>
      </div>

      {/* Sub-tab navigation */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeSubTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeSubTab === tab.id ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeSubTab === tab.id ? 700 : 400,
              fontSize: '0.88rem',
              cursor: 'pointer',
              transition: 'color 0.2s',
              marginBottom: '-1px',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div style={{ flex: 1 }}>
        <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading module...</div>}>
          {activeSubTab === 'loan' && <LoanManagement />}
          {activeSubTab === 'adv_salary' && <AdvanceSalaryManagement />}
        </Suspense>
      </div>
    </div>
  );
};

export default SupportManagement;
