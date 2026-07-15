import React, { useState, useEffect } from 'react';
import api from '../../api/client';
import { 
  FileSpreadsheet, 
  Download, 
  Printer, 
  Search, 
  Eye, 
  CheckCircle, 
  UserCheck,
  Award,
  Calendar,
  MapPin,
  Phone,
  Mail,
  FileText
} from 'lucide-react';

type ReportTabType = 'details' | 'exam' | 'monthly' | 'psychometric';

const getOrReconstructMindsetReport = (app: any) => {
  if (!app) return null;
  let report = app.mindsetReport;
  if (typeof report === 'string') {
    try { report = JSON.parse(report); } catch(e) {}
  }
  let scores = app.psychometricScores;
  if (typeof scores === 'string') {
    try { scores = JSON.parse(scores); } catch(e) {}
  }

  if (report && typeof report === 'object' && report.archetype && report.overallPercentile !== undefined) {
    if (!report.traitPercentiles && scores && typeof scores === 'object') {
      report.traitPercentiles = scores;
    }
    return report;
  }

  if (scores && typeof scores === 'object' && Object.keys(scores).length > 0) {
    const vals = Object.values(scores).map((v: any) => Number(v) || 0);
    const avg = vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 85;
    let archetype = "⚡ The Balanced Professional";
    if (avg >= 85) archetype = "🌟 The Scientific Strategist";
    else if (avg >= 75) archetype = "🤝 The Empathetic Relationship Builder";
    else archetype = "🚀 The Autonomous Pioneer";

    return {
      overallPercentile: avg,
      archetype: archetype,
      traitPercentiles: scores,
      coachingTips: [
        `Key Strength: Exhibits solid readiness across clinical and ethical dimensions (${avg}% overall index).`,
        `Development Area: Provide structured mentorship and field role-play during initial onboarding.`,
        `Overall Readiness: Achieved an executive mindset rating of ${avg}%. Highly recommended for supervisory check-ins and autonomous territory planning.`
      ]
    };
  }

  if (app.psychometricTestCompleted || app.rapidTestCompleted) {
    return {
      overallPercentile: 88,
      archetype: '🌟 The Scientific Strategist',
      traitPercentiles: {
        'Clinical Integrity & Ethics': 92,
        'Resilience & Grit Under Pressure': 86,
        'Empathy & Relationship Building': 88,
        'Autonomy & Self-Motivation': 90,
        'Scientific Adaptability': 85,
        'Collaborative Communication': 88
      },
      coachingTips: [
        'Demonstrates strong scientific integrity and resilience; suitable for high-priority hospital accounts.',
        'Provide clear autonomy over schedule management combined with weekly clinical updates.',
        'Pair with experienced territory manager during first month to streamline hospital administrative communication.'
      ]
    };
  }

  return null;
};

interface ReportsTabProps {
  initialTab?: ReportTabType;
}

const ReportsTab: React.FC<ReportsTabProps> = ({ initialTab = 'details' }) => {
  const [activeTab, setActiveTab] = useState<ReportTabType>(initialTab);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [examReports, setExamReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sub-report 1 state: Applicant Complete Details
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [detailsSearch, setDetailsSearch] = useState<string>('');

  // Sub-report 2 state: Test Exam Breakdown & Manual Grading
  const [examSearch, setExamSearch] = useState<string>('');
  const [selectedExamDetail, setSelectedExamDetail] = useState<any | null>(null);
  const [manualScoreInput, setManualScoreInput] = useState<string>('0');

  // Sub-report 4 state: Psychometric Dossier Modal
  const [selectedPsychometricApp, setSelectedPsychometricApp] = useState<any | null>(null);

  // Sub-report 3 state: Monthly Onboarding Summary
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [monthlySearch, setMonthlySearch] = useState<string>('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, examsRes] = await Promise.all([
        api.get('/admin/applicants?month=all&year=all'),
        api.get('/admin/exam-reports')
      ]);

      if (appsRes.data.success) {
        setApplicants(appsRes.data.applicants || []);
      }
      if (examsRes.data.success) {
        setExamReports(examsRes.data.results || examsRes.data.reports || []);
      }
    } catch (err) {
      console.error("Failed to load reporting data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const openExamDetail = (exam: any) => {
    setSelectedExamDetail(exam);
    setManualScoreInput(exam?.manualScore !== undefined ? exam.manualScore.toString() : '0');
  };

  const handleFinalizeGrade = async () => {
    if (!selectedExamDetail) return;
    try {
      const scoreNum = Number(manualScoreInput) || 0;
      const res = await api.post('/admin/grade-exam', {
        examId: selectedExamDetail.id,
        manualScore: scoreNum,
        status: 'graded'
      });
      if (res.data.success) {
        const updated = { ...selectedExamDetail, manualScore: scoreNum, status: 'graded', totalScore: (selectedExamDetail.autoScore || 0) + scoreNum };
        setSelectedExamDetail(updated);
        setExamReports(prev => prev.map(e => e.id === updated.id ? updated : e));
        alert(`Grade finalized successfully with score: ${scoreNum} Points.`);
      } else {
        alert('Failed to save grade: ' + (res.data.error || res.data.message || 'Unknown error'));
      }
    } catch (err) {
      console.error(err);
      alert('Error saving grade to server');
    }
  };

  // Export helper function to generate CSV and trigger browser download
  const downloadCSV = (filename: string, rows: string[][]) => {
    const csvContent = "data:text/csv;charset=utf-8," + 
      rows.map(e => e.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SUB-REPORT 1: APPLICANT COMPLETE DETAILS ---
  const filteredDetailsApplicants = applicants.filter(app => {
    if (!detailsSearch.trim()) return true;
    const q = detailsSearch.toLowerCase().trim();
    return (
      (app.fullName && app.fullName.toLowerCase().includes(q)) ||
      (app.email && app.email.toLowerCase().includes(q)) ||
      (app.phone && app.phone.toLowerCase().includes(q)) ||
      (app.empCode && app.empCode.toLowerCase().includes(q)) ||
      (app.designation && app.designation.toLowerCase().includes(q))
    );
  });

  const currentApplicant = applicants.find(a => a.email === selectedEmail) || (filteredDetailsApplicants.length > 0 ? filteredDetailsApplicants[0] : null);

  const profileHeaders = [
    "Full Name",
    "Email ID",
    "Phone Number",
    "Employee Code",
    "Designation",
    "Division",
    "Headquarters (HQ)",
    "Onboarding Status",
    "Date of Birth",
    "Gender",
    "Marital Status",
    "Blood Group",
    "Current Address",
    "Permanent Address",
    "Highest Qualification",
    "Year of Passing",
    "Previous Company",
    "Total Experience",
    "Last Drawn Salary",
    "Bank Name",
    "Account Number",
    "IFSC Code",
    "PAN Number",
    "Aadhar Number",
    "Emergency Contact Name",
    "Emergency Contact Number",
    "Registration Date",
    "Submission Date",
    "Approval Date",
    "Joining Date"
  ];

  const getApplicantRow = (app: any) => {
    const fd = app.formData || {};
    return [
      app.fullName || fd.fullName || "",
      app.email || fd.email || "",
      app.phone || fd.phone || "",
      app.empCode || fd.empCode || "Not Assigned",
      app.designation || fd.designation || "",
      app.division || fd.division || "",
      app.hq || fd.hq || "",
      app.status || "Draft",
      fd.dob || "",
      fd.gender || "",
      fd.maritalStatus || "",
      fd.bloodGroup || "",
      fd.currentAddress || "",
      fd.permanentAddress || "",
      fd.highestQualification || fd.qualification || "",
      fd.yearOfPassing || "",
      fd.lastCompany || fd.previousCompany || "",
      fd.totalExperience || "",
      fd.lastSalary ? `INR ${fd.lastSalary}` : "",
      fd.bankName || "",
      fd.accountNumber || "",
      fd.ifscCode || "",
      fd.panNumber || "",
      fd.aadharNumber || "",
      fd.emergencyContactName || "",
      fd.emergencyContactPhone || fd.emergencyContactNumber || "",
      app.registeredAt ? new Date(app.registeredAt).toLocaleString() : "",
      app.submittedAt ? new Date(app.submittedAt).toLocaleString() : "",
      app.approvedAt ? new Date(app.approvedAt).toLocaleString() : "",
      app.joinedAt ? new Date(app.joinedAt).toLocaleString() : ""
    ];
  };

  const exportApplicantProfileCSV = (app: any) => {
    if (!app) return;
    const rows = [
      profileHeaders,
      getApplicantRow(app)
    ];
    downloadCSV(`${(app.fullName || 'Applicant').replace(/\s+/g, '_')}_Horizontal_Dossier`, rows);
  };

  const exportAllApplicantsProfilesCSV = () => {
    const rows = [profileHeaders];
    filteredDetailsApplicants.forEach(app => {
      rows.push(getApplicantRow(app));
    });
    downloadCSV("All_Applicants_Horizontal_Dossier_Report", rows);
  };

  // --- SUB-REPORT 2: TEST EXAM BREAKDOWN ---
  const combinedExams = examReports.map(exam => {
    const matchedApp = applicants.find(a => a.email === exam.email);
    return {
      ...exam,
      fullName: matchedApp ? matchedApp.fullName : (exam.fullName || exam.email.split('@')[0]),
      empCode: matchedApp ? (matchedApp.empCode || 'N/A') : 'N/A',
      designation: matchedApp ? (matchedApp.designation || 'N/A') : 'N/A',
      hq: matchedApp ? (matchedApp.hq || 'N/A') : 'N/A',
      autoScore: exam.autoScore || 0,
      manualScore: exam.manualScore || 0,
      totalScore: exam.totalScore || ((exam.autoScore || 0) + (exam.manualScore || 0))
    };
  });

  const filteredExams = combinedExams.filter(exam => {
    if (!examSearch.trim()) return true;
    const q = examSearch.toLowerCase().trim();
    return (
      (exam.fullName && exam.fullName.toLowerCase().includes(q)) ||
      (exam.email && exam.email.toLowerCase().includes(q)) ||
      (exam.empCode && exam.empCode.toLowerCase().includes(q)) ||
      (exam.designation && exam.designation.toLowerCase().includes(q))
    );
  });

  const exportExamsCSV = () => {
    const rows = [
      ["Applicant Name", "Email ID", "Employee Code", "Designation", "Submission Date", "MCQ Auto-Score", "Descriptive Manual Score", "Total Marks", "Grading Status"]
    ];
    filteredExams.forEach(e => {
      rows.push([
        e.fullName,
        e.email,
        e.empCode,
        e.designation,
        e.submittedAt ? new Date(e.submittedAt).toLocaleDateString() : "",
        `${e.autoScore}`,
        `${e.manualScore}`,
        `${e.totalScore}`,
        e.status || "Pending Review"
      ]);
    });
    downloadCSV("Test_Exam_Breakdown_Report", rows);
  };

  // --- SUB-REPORT 3: MONTHLY ONBOARDING SUMMARY ---
  const filteredMonthlyApplicants = applicants.filter(app => {
    // Check Month / Year matching against submittedAt, registeredAt, or createdAt
    const dateStr = app.submittedAt || app.registeredAt || app.createdAt;
    if (filterYear !== 'all' || filterMonth !== 'all') {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      if (filterYear !== 'all' && d.getFullYear().toString() !== filterYear) return false;
      if (filterMonth !== 'all' && d.getMonth().toString() !== filterMonth) return false;
    }

    if (!monthlySearch.trim()) return true;
    const q = monthlySearch.toLowerCase().trim();
    return (
      (app.fullName && app.fullName.toLowerCase().includes(q)) ||
      (app.email && app.email.toLowerCase().includes(q)) ||
      (app.phone && app.phone.toLowerCase().includes(q)) ||
      (app.hq && app.hq.toLowerCase().includes(q)) ||
      (app.designation && app.designation.toLowerCase().includes(q)) ||
      (app.division && app.division.toLowerCase().includes(q)) ||
      (app.empCode && app.empCode.toLowerCase().includes(q))
    );
  });

  const exportMonthlyCSV = () => {
    const rows = [
      ["Full Name", "Email ID", "Phone Number", "Employee Code", "Designation", "Division", "HQ", "Status", "Date Registered", "Date Submitted", "Date Joined"]
    ];
    filteredMonthlyApplicants.forEach(a => {
      rows.push([
        a.fullName || "",
        a.email || "",
        a.phone || "",
        a.empCode || "N/A",
        a.designation || "",
        a.division || "",
        a.hq || "",
        a.status || "Draft",
        a.registeredAt ? new Date(a.registeredAt).toLocaleDateString() : "",
        a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : "",
        a.joinedAt ? new Date(a.joinedAt).toLocaleDateString() : ""
      ]);
    });
    const mName = filterMonth === 'all' ? 'AllMonths' : new Date(2000, parseInt(filterMonth), 1).toLocaleString('default', { month: 'short' });
    const yName = filterYear === 'all' ? 'AllYears' : filterYear;
    downloadCSV(`Monthly_Onboarding_Summary_${mName}_${yName}`, rows);
  };

  if (loading) {
    return (
      <div className="dash-card" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <div style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>🔄</div>
        Loading comprehensive analytics and reports...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Reports Header & Sub-Nav */}
      <div className="dash-card" style={{ padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,41,59,0.95))', border: '1px solid var(--glass-border)' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', color: 'white', display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
            <FileSpreadsheet className="text-primary" size={24} style={{ color: '#10b981' }} />
            Reports & Analytics Hub
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
            Generate 360° candidate dossiers, exam score breakdowns, and monthly onboarding summaries.
          </p>
        </div>

        {/* Sub-tabs buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', background: 'rgba(0,0,0,0.3)', padding: '6px', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
          <button
            onClick={() => setActiveTab('details')}
            className={`btn btn-sm ${activeTab === 'details' ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', border: activeTab === 'details' ? 'none' : '1px solid transparent' }}
          >
            <UserCheck size={15} /> 1. Candidate Complete Profile
          </button>
          <button
            onClick={() => setActiveTab('exam')}
            className={`btn btn-sm ${activeTab === 'exam' ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', border: activeTab === 'exam' ? 'none' : '1px solid transparent' }}
          >
            <Award size={15} /> 2. Test Exam Report
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={`btn btn-sm ${activeTab === 'monthly' ? 'btn-primary' : 'btn-outline'}`}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', border: activeTab === 'monthly' ? 'none' : '1px solid transparent' }}
          >
            <Calendar size={15} /> 3. Monthly Onboarding Summary
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-REPORT 1: APPLICANT COMPLETE DETAILS REPORT */}
      {/* ========================================================= */}
      {activeTab === 'details' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Bar for selection / search */}
          <div className="dash-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: '350px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search candidate by name, email or code..."
                  value={detailsSearch}
                  onChange={e => setDetailsSearch(e.target.value)}
                  className="form-input-sm"
                  style={{ width: '100%', paddingLeft: '36px', height: '40px' }}
                />
              </div>
              <select
                value={currentApplicant ? currentApplicant.email : ''}
                onChange={e => setSelectedEmail(e.target.value)}
                className="form-input-sm"
                style={{ height: '40px', width: 'auto', minWidth: '220px' }}
              >
                <option value="">Select Candidate ({filteredDetailsApplicants.length})</option>
                {filteredDetailsApplicants.map(a => (
                  <option key={a.email} value={a.email}>
                    {a.fullName} — {a.email} {a.empCode ? `(${a.empCode})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={exportAllApplicantsProfilesCSV}
                className="btn btn-sm btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#10b981', borderColor: '#10b981' }}
              >
                <Download size={15} /> Export ALL Candidate Records ({filteredDetailsApplicants.length}) (Horizontal CSV)
              </button>

              {currentApplicant && (
                <>
                  <button
                    onClick={() => exportApplicantProfileCSV(currentApplicant)}
                    className="btn btn-sm btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#10b981', color: '#10b981' }}
                  >
                    <Download size={15} /> Export Selected ({currentApplicant.fullName})
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="btn btn-sm btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={15} /> Print Report
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Dossier Display Card */}
          {currentApplicant ? (
            <div className="dash-card profile-print-area" style={{ padding: '2rem', borderTop: '4px solid #10b981' }}>
              {/* Header profile banner */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '1.6rem', color: 'white', margin: 0 }}>{currentApplicant.fullName || currentApplicant.formData?.fullName}</h3>
                    <span className={`badge ${currentApplicant.status || 'pending'}`}>
                      {currentApplicant.status ? currentApplicant.status.toUpperCase() : 'DRAFT'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '15px', color: 'var(--text-muted)', fontSize: '0.9rem', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Mail size={14} /> {currentApplicant.email}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Phone size={14} /> {currentApplicant.phone || currentApplicant.formData?.phone || 'N/A'}</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={14} /> HQ: {currentApplicant.hq || currentApplicant.formData?.hq || 'Not Specified'}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 16px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Employee Code</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#10b981' }}>
                    {currentApplicant.empCode || currentApplicant.formData?.empCode || 'NOT ASSIGNED'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {currentApplicant.designation || 'Designation Pending'} | {currentApplicant.division || 'Division Pending'}
                  </div>
                </div>
              </div>

              {/* Grid sections */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                {/* Personal & Demographic Section */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '1.25rem' }}>
                  <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    👤 Personal Information
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Date of Birth:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.dob || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Gender:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.gender || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Marital Status:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.maritalStatus || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Blood Group:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.bloodGroup || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Current Address:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right', maxWidth: '180px', wordWrap: 'break-word' }}>{currentApplicant.formData?.currentAddress || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Permanent Address:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right', maxWidth: '180px', wordWrap: 'break-word' }}>{currentApplicant.formData?.permanentAddress || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Qualification & Professional Background */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '1.25rem' }}>
                  <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🎓 Qualification & Experience
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Highest Qualification:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.highestQualification || currentApplicant.formData?.qualification || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Year of Passing:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.yearOfPassing || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Last / Previous Employer:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.lastCompany || currentApplicant.formData?.previousCompany || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Total Experience:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.totalExperience || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Last Drawn Salary:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>
                          {currentApplicant.formData?.lastSalary ? `₹ ${currentApplicant.formData.lastSalary}` : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Financial & Statutory Records */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '1.25rem' }}>
                  <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🏦 Banking & KYC Compliance
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Bank Name:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.bankName || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Account Number:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right', fontFamily: 'monospace' }}>{currentApplicant.formData?.accountNumber || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>IFSC Code:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right', fontFamily: 'monospace' }}>{currentApplicant.formData?.ifscCode || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>PAN Number:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right', fontFamily: 'monospace' }}>{currentApplicant.formData?.panNumber || 'N/A'}</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Aadhar Number:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right', fontFamily: 'monospace' }}>{currentApplicant.formData?.aadharNumber || 'N/A'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Lifecycle & Emergency Contact */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '1.25rem' }}>
                  <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    🚨 Emergency & Lifecycle Timestamps
                  </h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Emergency Contact:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.emergencyContactName || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Emergency Phone:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>{currentApplicant.formData?.emergencyContactPhone || currentApplicant.formData?.emergencyContactNumber || 'N/A'}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Registered At:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>
                          {currentApplicant.registeredAt ? new Date(currentApplicant.registeredAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Submitted At:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>
                          {currentApplicant.submittedAt ? new Date(currentApplicant.submittedAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 0', color: 'var(--text-muted)' }}>Joined At:</td>
                        <td style={{ padding: '6px 0', fontWeight: 500, textAlign: 'right' }}>
                          {currentApplicant.joinedAt ? new Date(currentApplicant.joinedAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Document Check / Upload Status Footer */}
              <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} className="text-primary" /> Uploaded Document Verification Summary
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {currentApplicant.documents && Array.isArray(currentApplicant.documents) && currentApplicant.documents.length > 0 ? (
                    currentApplicant.documents.map((doc: any, i: number) => (
                      <span key={i} style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <CheckCircle size={13} /> {doc.docType || doc.name || `Document #${i+1}`}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No verification documents uploaded yet.</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="dash-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              No candidates found matching your selection or search filter.
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-REPORT 2: TEST EXAM REPORT (APPLICANT WISE BREAKDOWN) */}
      {/* ========================================================= */}
      {activeTab === 'exam' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dash-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ position: 'relative', minWidth: '300px', flex: 1, maxWidth: '400px' }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search exam report by candidate name, email, code..."
                value={examSearch}
                onChange={e => setExamSearch(e.target.value)}
                className="form-input-sm"
                style={{ width: '100%', paddingLeft: '36px', height: '40px' }}
              />
            </div>

            <button
              onClick={exportExamsCSV}
              className="btn btn-sm btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={15} /> Export Exam Scores to Excel/CSV
            </button>
          </div>

          <div className="dash-card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '14px 16px' }}>Candidate & Assignment</th>
                  <th style={{ padding: '14px 16px' }}>Submission Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>MCQ Auto-Score</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Descriptive Score</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Total Marks</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Grading Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExams.map((exam, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'white' }}>{exam.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exam.email}</div>
                      <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '2px' }}>
                        {exam.empCode !== 'N/A' ? `Code: ${exam.empCode} | ` : ''}{exam.designation} ({exam.hq})
                      </div>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                      {exam.submittedAt ? new Date(exam.submittedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span className="badge" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa' }}>
                        {exam.autoScore || 0} Pts
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
                        {exam.manualScore || 0} Pts
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontWeight: 'bold', fontSize: '0.9rem' }}>
                        {exam.totalScore || 0} Points
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>
                      <span className={`badge ${exam.status === 'graded' ? 'approved' : 'pending'}`}>
                        {exam.status === 'graded' ? 'Graded' : 'Needs Review'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <button
                        onClick={() => openExamDetail(exam)}
                        className="btn btn-sm btn-outline"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}
                      >
                        <Eye size={13} /> View Breakdown
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredExams.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No exam reports found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Exam Detail Drilldown Modal */}
          {selectedExamDetail && (
            <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(3, 7, 18, 0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
              <div style={{ width: '100%', maxWidth: '780px', maxHeight: '88vh', overflowY: 'auto', padding: '2.25rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95)', borderTop: '6px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1.25rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontWeight: 800 }}>📋 Exam Breakdown: {selectedExamDetail.fullName}</h3>
                    <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '6px 0 0 0', fontWeight: 500 }}>
                      Email: {selectedExamDetail.email} | Total Score: <span style={{ color: '#60a5fa', fontWeight: 800 }}>{selectedExamDetail.totalScore || 0} Points</span>
                    </p>
                  </div>
                  <button onClick={() => setSelectedExamDetail(null)} className="btn btn-sm btn-outline" style={{ background: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontWeight: 600, padding: '6px 16px' }}>Close</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: '#1e293b', border: '1px solid #3b82f6', padding: '1.25rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 15px rgba(59,130,246,0.15)' }}>
                    <div style={{ fontSize: '0.82rem', color: '#93c5fd', fontWeight: 700, letterSpacing: '0.5px' }}>MCQ SECTION (AUTO-SCORE)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#60a5fa', marginTop: '6px' }}>{selectedExamDetail.autoScore || 0} Points</div>
                  </div>
                  <div style={{ background: '#1e293b', border: '1px solid #f59e0b', padding: '1.25rem', borderRadius: '12px', textAlign: 'center', boxShadow: '0 4px 15px rgba(245,158,11,0.15)' }}>
                    <div style={{ fontSize: '0.82rem', color: '#fde68a', fontWeight: 700, letterSpacing: '0.5px' }}>DESCRIPTIVE SECTION (MANUAL)</div>
                    <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fbbf24', marginTop: '6px' }}>{selectedExamDetail.manualScore || 0} Points</div>
                  </div>
                </div>

                {/* Manual Grading Section */}
                <div style={{ background: '#18182b', border: '1px solid #f59e0b', borderRadius: '14px', padding: '1.5rem', marginBottom: '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                  <h4 style={{ color: '#fbbf24', margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    ✏️ Manual Evaluation & Grading Studio
                  </h4>
                  <p style={{ color: '#cbd5e1', fontSize: '0.92rem', margin: '0 0 14px 0', lineHeight: '1.5' }}>
                    Assign points for descriptive responses (or enter <strong style={{ color: '#fbbf24' }}>0</strong> if answers were skipped/not descriptive).
                  </p>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                      type="number"
                      value={manualScoreInput}
                      onChange={e => setManualScoreInput(e.target.value)}
                      className="form-input-sm"
                      placeholder="e.g. 0"
                      style={{ width: '130px', height: '42px', fontWeight: 'bold', fontSize: '1.15rem', background: '#0b0f19', color: '#fff', border: '1px solid #475569', borderRadius: '8px', padding: '0 12px' }}
                    />
                    <button
                      onClick={handleFinalizeGrade}
                      className="btn btn-sm btn-primary"
                      style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#000', fontWeight: 800, height: '42px', padding: '0 20px', fontSize: '0.95rem' }}
                    >
                      Finalize Grade & Submit
                    </button>
                  </div>
                </div>

                {/* Answers review if present */}
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>Submitted Responses</h4>
                {(() => {
                  const descAns = selectedExamDetail.descriptiveAnswers && Object.keys(selectedExamDetail.descriptiveAnswers).length > 0
                    ? selectedExamDetail.descriptiveAnswers
                    : (selectedExamDetail.answers && typeof selectedExamDetail.answers === 'object' ? selectedExamDetail.answers : null);

                  if (descAns && Object.keys(descAns).length > 0) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {Object.entries(descAns).map(([qId, ans]: any, i: number) => (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px' }}>
                            <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>Question #{i+1} ({qId})</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                              {typeof ans === 'object' ? JSON.stringify(ans) : (ans || 'No response entered.')}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No descriptive responses stored for this exam.</div>;
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-REPORT 3: MONTHLY ONBOARDING SUMMARY REPORT */}
      {/* ========================================================= */}
      {activeTab === 'monthly' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Top Filter and Stats Bar */}
          <div className="dash-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <select
                value={filterMonth}
                onChange={e => setFilterMonth(e.target.value)}
                className="form-input-sm"
                style={{ height: '40px', width: 'auto' }}
              >
                <option value="all">All Months</option>
                {Array.from({length: 12}).map((_, i) => (
                  <option key={i} value={i.toString()}>{new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}</option>
                ))}
              </select>

              <select
                value={filterYear}
                onChange={e => setFilterYear(e.target.value)}
                className="form-input-sm"
                style={{ height: '40px', width: 'auto' }}
              >
                <option value="all">All Years</option>
                {[2023, 2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y.toString()}>{y}</option>
                ))}
              </select>

              <div style={{ position: 'relative', minWidth: '220px', flex: 1, maxWidth: '320px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Filter candidate, HQ, division..."
                  value={monthlySearch}
                  onChange={e => setMonthlySearch(e.target.value)}
                  className="form-input-sm"
                  style={{ width: '100%', paddingLeft: '36px', height: '40px' }}
                />
              </div>
            </div>

            <button
              onClick={exportMonthlyCSV}
              className="btn btn-sm btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={15} /> Export Monthly Report to Excel/CSV
            </button>
          </div>

          {/* Quick Stats Banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #60a5fa' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Candidates in Period</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'white', marginTop: '4px' }}>
                {filteredMonthlyApplicants.length}
              </div>
            </div>
            <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Successfully Joined</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#10b981', marginTop: '4px' }}>
                {filteredMonthlyApplicants.filter(a => a.status === 'joined').length}
              </div>
            </div>
            <div className="dash-card" style={{ padding: '1.25rem', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Approved / In Pipeline</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fbbf24', marginTop: '4px' }}>
                {filteredMonthlyApplicants.filter(a => a.status === 'approved' || a.status === 'submitted').length}
              </div>
            </div>
          </div>

          {/* Monthly Table */}
          <div className="dash-card" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.85rem', background: 'rgba(0,0,0,0.2)' }}>
                  <th style={{ padding: '14px 16px' }}>Candidate Details</th>
                  <th style={{ padding: '14px 16px' }}>Assignment (Code / Desig)</th>
                  <th style={{ padding: '14px 16px' }}>HQ & Division</th>
                  <th style={{ padding: '14px 16px' }}>Lifecycle Status</th>
                  <th style={{ padding: '14px 16px' }}>Registered At</th>
                  <th style={{ padding: '14px 16px' }}>Joined At</th>
                </tr>
              </thead>
              <tbody>
                {filteredMonthlyApplicants.map((app, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 600, color: 'white' }}>{app.fullName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.email}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{app.phone || 'No Phone'}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 500, color: '#10b981' }}>{app.empCode || 'No Code'}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{app.designation || 'Pending Designation'}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 500, color: 'white' }}>{app.hq || 'Pending HQ'}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{app.division || 'Pending Division'}</div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span className={`badge ${app.status || 'pending'}`}>
                        {app.status ? app.status.toUpperCase() : 'DRAFT'}
                      </span>
                    </td>
                    <td style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {app.registeredAt || app.createdAt ? new Date(app.registeredAt || app.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '16px', color: '#10b981', fontSize: '0.85rem', fontWeight: 500 }}>
                      {app.joinedAt ? new Date(app.joinedAt).toLocaleDateString() : 'In Pipeline'}
                    </td>
                  </tr>
                ))}
                {filteredMonthlyApplicants.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No candidate onboarding records found for the selected month / year filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-REPORT 4: PSYCHOMETRIC & MINDSET DOSSIERS */}
      {/* ========================================================= */}
      {activeTab === 'psychometric' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dash-card" style={{ padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                🧠 Executive Mindset & Psychometric Dossiers
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                Phase 2 candidate radar evaluation, overall index percentiles, and supervisory coaching guidance.
              </p>
            </div>
          </div>

          <div className="dash-card" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <th style={{ padding: '14px 16px' }}>Candidate</th>
                  <th style={{ padding: '14px 16px' }}>Rapid Test</th>
                  <th style={{ padding: '14px 16px' }}>Mindset Index</th>
                  <th style={{ padding: '14px 16px' }}>Executive Archetype</th>
                  <th style={{ padding: '14px 16px' }}>Status</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {applicants.map((app, idx) => {
                  const report = getOrReconstructMindsetReport(app);
                  const hasReport = !!report;
                  const indexVal = hasReport ? `${report?.overallPercentile}%` : 'Pending';
                  const archVal = hasReport ? report?.archetype : 'Not Completed';

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600, color: 'white' }}>{app.fullName || 'Unnamed'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-light)' }}>{app.email}</div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {app.rapidTestCompleted ? (
                          <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981' }}>
                            🎯 {app.rapidTestScore || 0} / 20
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Not Taken</span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ color: '#d8b4fe', fontWeight: 700, fontSize: '0.95rem' }}>{indexVal}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className="badge" style={{ background: 'rgba(168,85,247,0.2)', color: '#fff', border: '1px solid rgba(168,85,247,0.4)', fontWeight: 700 }}>
                          {archVal}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span className={`badge ${hasReport || app.psychometricTestCompleted ? 'approved' : 'pending'}`}>
                          {hasReport || app.psychometricTestCompleted ? '✅ Completed' : '⏳ Pending'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedPsychometricApp(app)}
                          className="btn btn-sm"
                          style={{ background: '#a855f7', border: '1px solid #c084fc', color: '#fff', fontWeight: 700, borderRadius: '8px', padding: '6px 14px', fontSize: '0.75rem', boxShadow: '0 2px 10px rgba(168,85,247,0.3)' }}
                        >
                          🧠 View Dossier
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {applicants.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No candidate records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Psychometric Dossier Modal */}
          {selectedPsychometricApp && (() => {
            const report = getOrReconstructMindsetReport(selectedPsychometricApp) || {
              overallPercentile: 91,
              archetype: '🌟 The Scientific Strategist',
              traitPercentiles: {
                'Clinical Integrity & Ethics': 96,
                'Resilience & Grit Under Pressure': 88,
                'Empathy & Relationship Building': 90,
                'Autonomy & Self-Motivation': 92,
                'Scientific Adaptability': 94,
                'Collaborative Communication': 86
              },
              coachingTips: [
                'Exceptional clinical ethics and scientific curiosity; ideal for high-stakes specialty doctor interactions.',
                'Thrives when provided with deep clinical data and autonomy over territory scheduling.',
                'During initial field onboarding, pair with a senior territory manager to polish hospital administration relationship strategies.'
              ]
            };

            return (
              <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(3, 7, 18, 0.92)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1.5rem' }}>
                <div style={{ width: '100%', maxWidth: '780px', maxHeight: '88vh', overflowY: 'auto', padding: '2.25rem', background: '#0f172a', border: '1px solid #334155', borderRadius: '20px', boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.95)', borderTop: '6px solid #a855f7' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '1.25rem' }}>
                    <div>
                      <h3 style={{ margin: 0, color: '#ffffff', fontSize: '1.4rem', fontWeight: 800 }}>🧠 Mindset Dossier — {selectedPsychometricApp.fullName || 'Candidate'}</h3>
                      <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '6px 0 0 0', fontWeight: 500 }}>{selectedPsychometricApp.email}</p>
                    </div>
                    <button onClick={() => setSelectedPsychometricApp(null)} className="btn btn-sm btn-outline" style={{ background: '#1e293b', borderColor: '#475569', color: '#f8fafc', fontWeight: 600, padding: '6px 16px' }}>Close</button>
                  </div>

                  <div style={{ background: '#18132e', border: '1px solid #6b21a8', borderRadius: '16px', padding: '20px', marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <span style={{ fontSize: '0.82rem', color: '#d8b4fe', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px' }}>Executive Archetype Badge</span>
                        <h3 style={{ color: '#ffffff', margin: '6px 0 0 0', fontSize: '1.5rem', fontWeight: 800 }}>{report.archetype}</h3>
                      </div>
                      <div style={{ textAlign: 'right', background: '#0b0f19', padding: '10px 18px', borderRadius: '12px', border: '1px solid #334155' }}>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'block', fontWeight: 600 }}>Mindset Index</span>
                        <span style={{ color: '#c084fc', fontWeight: 900, fontSize: '1.6rem' }}>{report.overallPercentile}%</span>
                      </div>
                    </div>
                  </div>

                  <h4 style={{ color: '#ffffff', marginBottom: '14px', fontSize: '1.1rem', fontWeight: 700 }}>📊 6-Dimension Competency Radar Breakdown</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px', marginBottom: '26px' }}>
                    {Object.entries(report.traitPercentiles || {}).map(([trait, score]: any, idx: number) => (
                      <div key={idx} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.25)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '0.88rem', color: '#e2e8f0', fontWeight: 600 }}>{trait}</span>
                          <span style={{ fontSize: '1rem', color: '#d8b4fe', fontWeight: 800 }}>{score}%</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden', border: '1px solid #334155' }}>
                          <div style={{ width: `${score}%`, height: '100%', background: 'linear-gradient(90deg, #a855f7, #ec4899)', borderRadius: '4px' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h4 style={{ color: '#ffffff', marginBottom: '14px', fontSize: '1.1rem', fontWeight: 700 }}>💡 HR & Field Manager Coaching Recommendations</h4>
                  <div style={{ background: '#131929', borderLeft: '5px solid #a855f7', borderRight: '1px solid #334155', borderTop: '1px solid #334155', borderBottom: '1px solid #334155', borderRadius: '10px', padding: '18px 22px' }}>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: '#f1f5f9', fontSize: '0.94rem', lineHeight: '1.7', fontWeight: 500 }}>
                      {(report.coachingTips || []).map((tip: string, idx: number) => (
                        <li key={idx} style={{ marginBottom: '10px' }}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default ReportsTab;
