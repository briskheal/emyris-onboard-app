import { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import axios from 'axios';
import TargetPlanningView from './TargetPlanningView';
import TargetAchievementView from './TargetAchievementView';

const getUserId = () => {
  const u = localStorage.getItem('xl_user');
  return u ? JSON.parse(u).employeeId : '';
};

export default function TargetAnalysisReport() {
  const { kpiId } = useParams<{ kpiId: string }>();
  const [searchParams] = useSearchParams();
  const month = searchParams.get('month') || '';
  const year = searchParams.get('year') || '';

  const [loading, setLoading] = useState(true);
  const [planningSubmittedAt, setPlanningSubmittedAt] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [initialTargets, setInitialTargets] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = () => {
    setLoading(true);
    axios.get(`/api/xl/performance/my?email=${getUserId()}&month=${month}&year=${year}`)
      .then(res => {
        if (res.data.success && res.data.data) {
          const perf = res.data.data;
          setRecordId(perf._id);
          setPlanningSubmittedAt(perf.planningSubmittedAt);
          
          let dataStr = '[]';
          if (kpiId === 'brand') dataStr = perf.brandData;
          else if (kpiId === 'account') dataStr = perf.accountData;
          else if (kpiId === 'keyCustomer') dataStr = perf.keyCustomerData;
          else if (kpiId === 'roi') dataStr = perf.roiData;
          else if (kpiId === 'outstanding') dataStr = perf.outstandingData;

          try {
            let parsed = JSON.parse(dataStr);
            if (typeof parsed === "string") parsed = JSON.parse(parsed);
            setInitialTargets(Array.isArray(parsed) ? parsed : []);
          } catch (e) {
            setInitialTargets([]);
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [kpiId, month, year]);

  if (loading) {
    return (
      <div className="min-h-full bg-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If editing or not submitted, show Planning View
  if (isEditing || !planningSubmittedAt) {
    return (
      <TargetPlanningView 
        kpiId={kpiId} 
        month={month} 
        year={year} 
        initialTargets={initialTargets} 
        recordId={recordId} 
        onPlanSubmitted={() => {
          setIsEditing(false);
          fetchData();
        }}
        onCancelEdit={isEditing ? () => setIsEditing(false) : undefined}
      />
    );
  }

  return (
    <TargetAchievementView 
      kpiId={kpiId} 
      month={month} 
      year={year} 
      initialTargets={initialTargets} 
      recordId={recordId} 
      onEditPlan={() => setIsEditing(true)}
    />
  );
}


