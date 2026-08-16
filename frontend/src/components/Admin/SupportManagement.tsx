import React from 'react';
import { HandCoins, Landmark } from 'lucide-react';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
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
      <div className="dash-card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
          {activeSubTab === 'loan' ? '🏦' : '💰'}
        </div>
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 8px', fontSize: '1.1rem' }}>
          {activeSubTab === 'loan' ? 'Loan Management' : 'Advance Salary Management'}
        </h3>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
          This section is being set up. Details will be configured shortly.
        </p>
      </div>
    </div>
  );
};

export default SupportManagement;
