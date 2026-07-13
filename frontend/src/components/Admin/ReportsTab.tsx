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

type ReportTabType = 'details' | 'exam' | 'monthly';

const ReportsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTabType>('details');
  const [applicants, setApplicants] = useState<any[]>([]);
  const [examReports, setExamReports] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Sub-report 1 state: Applicant Complete Details
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [detailsSearch, setDetailsSearch] = useState<string>('');

  // Sub-report 2 state: Test Exam Breakdown
  const [examSearch, setExamSearch] = useState<string>('');
  const [selectedExamDetail, setSelectedExamDetail] = useState<any | null>(null);

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

  const exportApplicantProfileCSV = (app: any) => {
    if (!app) return;
    const fd = app.formData || {};
    const rows = [
      ["FIELD", "DETAILS"],
      ["Full Name", app.fullName || fd.fullName || ""],
      ["Email ID", app.email || fd.email || ""],
      ["Phone Number", app.phone || fd.phone || ""],
      ["Employee Code", app.empCode || fd.empCode || "Not Assigned"],
      ["Designation", app.designation || fd.designation || ""],
      ["Division", app.division || fd.division || ""],
      ["Headquarters (HQ)", app.hq || fd.hq || ""],
      ["Onboarding Status", app.status || "Draft"],
      ["Date of Birth", fd.dob || ""],
      ["Gender", fd.gender || ""],
      ["Marital Status", fd.maritalStatus || ""],
      ["Blood Group", fd.bloodGroup || ""],
      ["Current Address", fd.currentAddress || ""],
      ["Permanent Address", fd.permanentAddress || ""],
      ["Highest Qualification", fd.highestQualification || fd.qualification || ""],
      ["Year of Passing", fd.yearOfPassing || ""],
      ["Previous Company", fd.lastCompany || fd.previousCompany || ""],
      ["Total Experience", fd.totalExperience || ""],
      ["Last Drawn Salary", fd.lastSalary ? `INR ${fd.lastSalary}` : ""],
      ["Bank Name", fd.bankName || ""],
      ["Account Number", fd.accountNumber || ""],
      ["IFSC Code", fd.ifscCode || ""],
      ["PAN Number", fd.panNumber || ""],
      ["Aadhar Number", fd.aadharNumber || ""],
      ["Emergency Contact Name", fd.emergencyContactName || ""],
      ["Emergency Contact Number", fd.emergencyContactPhone || fd.emergencyContactNumber || ""],
      ["Registration Date", app.registeredAt ? new Date(app.registeredAt).toLocaleString() : ""],
      ["Submission Date", app.submittedAt ? new Date(app.submittedAt).toLocaleString() : ""],
      ["Approval Date", app.approvedAt ? new Date(app.approvedAt).toLocaleString() : ""],
      ["Joining Date", app.joinedAt ? new Date(app.joinedAt).toLocaleString() : ""]
    ];
    downloadCSV(`${(app.fullName || 'Applicant').replace(/\s+/g, '_')}_Complete_Dossier`, rows);
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

            {currentApplicant && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => exportApplicantProfileCSV(currentApplicant)}
                  className="btn btn-sm btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', borderColor: '#10b981', color: '#10b981' }}
                >
                  <Download size={15} /> Export Dossier (CSV)
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-sm btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Printer size={15} /> Print Report
                </button>
              </div>
            )}
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
                        onClick={() => setSelectedExamDetail(exam)}
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
            <div className="modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '1rem' }}>
              <div className="dash-card" style={{ width: '100%', maxWidth: '750px', maxHeight: '85vh', overflowY: 'auto', padding: '2rem', borderTop: '4px solid #3b82f6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'white' }}>📋 Exam Breakdown: {selectedExamDetail.fullName}</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                      Email: {selectedExamDetail.email} | Total Score: {selectedExamDetail.totalScore || 0} Points
                    </p>
                  </div>
                  <button onClick={() => setSelectedExamDetail(null)} className="btn btn-sm btn-outline">Close</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#93c5fd' }}>MCQ SECTION (AUTO-SCORE)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#60a5fa' }}>{selectedExamDetail.autoScore || 0} Points</div>
                  </div>
                  <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: '#fde68a' }}>DESCRIPTIVE SECTION (MANUAL)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fbbf24' }}>{selectedExamDetail.manualScore || 0} Points</div>
                  </div>
                </div>

                {/* Answers review if present */}
                <h4 style={{ color: 'var(--primary)', marginBottom: '0.75rem' }}>Submitted Answers</h4>
                {selectedExamDetail.descriptiveAnswers && Object.keys(selectedExamDetail.descriptiveAnswers).length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Object.entries(selectedExamDetail.descriptiveAnswers).map(([qId, ans]: any, i: number) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '8px' }}>
                        <div style={{ fontWeight: 600, color: '#e2e8f0', marginBottom: '6px' }}>Question #{i+1} ({qId})</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', whiteSpace: 'pre-wrap', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: '6px' }}>
                          {ans || 'No response entered.'}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>No descriptive responses stored or this exam was purely objective.</div>
                )}
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
    </div>
  );
};

export default ReportsTab;
