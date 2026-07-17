import React, { useState, useMemo } from 'react';

const Registration = ({ onNavigate, onRegistrationSuccess, companyData }) => {
  const [formData, setFormData] = useState({
    title: 'Mr.',
    name: '',
    email: '',
    phone: '',
    division: '',
    designation: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Extract divisions and designations from companyData
  const divisions = companyData?.divisions || [];
  
  // If a division is selected, and it has its own designations array, use that.
  // Otherwise fallback to global company designations.
  const availableDesignations = useMemo(() => {
    let raw = [];
    if (formData.division) {
      const selectedDiv = divisions.find(d => (typeof d === 'string' ? d : d.name) === formData.division);
      if (selectedDiv && selectedDiv.designations && selectedDiv.designations.length > 0) {
        raw = selectedDiv.designations;
      }
    }
    if (raw.length === 0) {
      raw = companyData?.designations || [];
    }
    return raw.map(desg => typeof desg === 'string' ? desg : (desg.title || desg.name || JSON.stringify(desg)));
  }, [formData.division, divisions, companyData]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const selectDesignation = (title) => {
    const desgStr = typeof title === 'string' ? title : (title.title || title.name || JSON.stringify(title));
    setFormData({ ...formData, designation: desgStr });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.name || !formData.email || !formData.phone || !formData.division || !formData.designation) {
      setError("Please fill out all mandatory fields, including Division and Designation.");
      return;
    }
    
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register-applicant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          fullName: formData.name,
          division: formData.division,
          designation: formData.designation,
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim()
        })
      });
      const data = await res.json();
      
      if (data.success || data.needsRecovery) {
        // Return PIN to App.jsx to show the PIN display
        onRegistrationSuccess(data.pin);
      } else if (data.isReturning) {
        alert(data.message);
        onNavigate('login');
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch (err) {
      setError('Network error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <button style={styles.backButton} onClick={() => onNavigate('landing')}>
            ← Back
          </button>
          <h2 style={styles.title}>New Applicant</h2>
        </div>

        {error && <div style={styles.errorBanner}>{error}</div>}

        <form onSubmit={handleRegister} style={styles.form}>
          
          <div style={styles.row}>
            <div style={{...styles.formGroup, flex: '1'}}>
              <label style={styles.label}>Title*</label>
              <select name="title" value={formData.title} onChange={handleChange} style={styles.input} required>
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>
            
            <div style={{...styles.formGroup, flex: '3'}}>
              <label style={styles.label}>Full Name*</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} style={styles.input} required placeholder="Enter your full name" />
            </div>
          </div>

          <div style={styles.row}>
            <div style={{...styles.formGroup, flex: '1'}}>
              <label style={styles.label}>Email*</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} required placeholder="Email Address" />
            </div>
            <div style={{...styles.formGroup, flex: '1'}}>
              <label style={styles.label}>Phone Number*</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} style={styles.input} required placeholder="Mobile Number" />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Applying for Division*</label>
            <select name="division" value={formData.division} onChange={handleChange} style={styles.input} required>
              <option value="">-- Select Division --</option>
              {divisions.map((div, i) => {
                const divName = typeof div === 'string' ? div : (div.name || "Unknown");
                return <option key={i} value={divName}>{divName}</option>;
              })}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Select Designation*</label>
            <div style={styles.pickerContainer}>
              {availableDesignations.length === 0 ? (
                <p style={{color: '#94a3b8', fontSize: '12px', margin: 0}}>Select a division first to see available roles.</p>
              ) : (
                availableDesignations.map((desg, i) => {
                  const desgStr = typeof desg === 'string' ? desg : (desg.title || desg.name || JSON.stringify(desg));
                  const isSelected = formData.designation === desgStr;
                  return (
                    <div 
                      key={i}
                      onClick={() => selectDesignation(desgStr)}
                      style={{
                        ...styles.chip,
                        background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                        borderColor: isSelected ? '#10b981' : 'rgba(255,255,255,0.1)',
                        color: isSelected ? '#10b981' : '#fff'
                      }}
                    >
                      {desgStr}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button type="submit" style={styles.submitBtn} disabled={loading}>
            {loading ? 'Processing...' : 'Register Securely'}
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    padding: '20px',
  },
  card: {
    background: 'rgba(30, 41, 59, 0.7)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '16px',
    padding: '24px 30px',
    width: '100%',
    maxWidth: '600px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    marginBottom: '15px'
  },
  backButton: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '0 0 10px 0',
    fontSize: '14px'
  },
  title: {
    color: '#fff',
    margin: 0,
    fontSize: '22px'
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#ef4444',
    padding: '10px',
    borderRadius: '8px',
    marginBottom: '15px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    fontSize: '13px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  row: {
    display: 'flex',
    gap: '12px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    textAlign: 'left'
  },
  label: {
    color: '#cbd5e1',
    fontSize: '12px'
  },
  input: {
    background: 'rgba(15, 23, 42, 0.6)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '15px',
    outline: 'none'
  },
  pickerContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    background: 'rgba(255,255,255,0.02)',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.05)',
    maxHeight: '150px',
    overflowY: 'auto'
  },
  chip: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    borderWidth: '1px',
    borderStyle: 'solid'
  },
  submitBtn: {
    background: 'linear-gradient(135deg, #10b981, #059669)',
    color: 'white',
    padding: '14px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  }
};

export default Registration;
