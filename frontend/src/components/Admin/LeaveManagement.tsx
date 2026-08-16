import React, { Suspense, lazy } from 'react';

const CreateLeaveType = lazy(() => import('./LeaveTabs/CreateLeaveType'));
const AssignLeave = lazy(() => import('./LeaveTabs/AssignLeave'));
const AssignedLeaves = lazy(() => import('./LeaveTabs/AssignedLeaves'));

interface LeaveManagementProps {
    activeSubTab: string;
    setSubTab: (tab: string) => void;
}

const LeaveManagement: React.FC<LeaveManagementProps> = ({ activeSubTab }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
            
            {/* Header Area representing the Active Sub Tab */}
            <div className="dash-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--primary)', cursor: 'pointer' }}>{'<'}</span> 
                    {activeSubTab.replace('_', ' ').toUpperCase()}
                </h3>
            </div>

            {/* Dynamic Content Area based on the active tab from sidebar */}
            <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                {activeSubTab === 'create_type' && <CreateLeaveType />}
                {activeSubTab === 'assign_leave' && <AssignLeave />}
                {activeSubTab === 'assigned_leaves' && <AssignedLeaves />}
            </Suspense>

        </div>
    );
};

export default LeaveManagement;
