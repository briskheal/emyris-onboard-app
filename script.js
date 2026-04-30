/**
 * EMYRIS ONBOARD - APPLICANT PORTAL LOGIC
 * Standalone module for registration, onboarding form, and status tracking.
 */

let currentApplicant = null;
let companyData = {};
let currentStep = 1;
let activeUploads = 0;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', initializeApp);

const POST_SUBMISSION_STATUSES = ['submitted', 'approved', 'onboarding', 'joined', 'confirmed', 'rejected'];
const OPTIONAL_DOCS = ["Last Month Salary Slip", "Previous Company Appointment Letter"];

// Override shared-utils handlers to include portal-specific logic
async function showApplicantRegister() {
    console.log('🔄 Opening registration: Forcing real-time sync with Admin panel...');
    const divSel = document.getElementById('regDivision');
    if (divSel) divSel.innerHTML = '<option value="">⏳ Loading Divisions...</option>';
    
    await fetchCompanyData(); // Ensure global state is fresh
    await populateDropdowns(); // Populate UI
    updateView('applicantRegister');
}

async function initializeApp() {
    console.log('🚀 Applicant Portal initializing...');
    initBackgroundAnimations();
    initCardEffects(); // Magnetic/Glow effects for landing cards
    // PIN Code -> State Auto-Selection
    const pinInput = document.getElementById('pin');
    if (pinInput) {
        pinInput.addEventListener('input', async (e) => {
            const pin = e.target.value;
            if (pin.length === 6) {
                await fetchStateFromPin(pin);
            }
        });
    }

    // Check for existing session (optional, for now we just show landing)
    await fetchCompanyData();
    updateView('landingPage');
}

async function fetchStateFromPin(pin) {
    try {
        const stateInput = document.getElementById('state');
        const cityInput = document.getElementById('city');
        if (!stateInput) return;

        stateInput.placeholder = "🔍 Detecting State...";
        const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
        const data = await res.json();
        
        if (data && data[0] && data[0].Status === "Success") {
            const details = data[0].PostOffice[0];
            stateInput.value = details.State;
            if (cityInput && !cityInput.value) {
                cityInput.value = details.District;
            }
            showToast(`Location detected: ${details.District}, ${details.State}`, "success");
        } else {
            stateInput.placeholder = "";
        }
    } catch (e) {
        console.warn("State detection failed", e);
    }
}

function initBackgroundAnimations() {
    // Already handled via CSS keyframes for .blob, 
    // but we can add more GSAP magic here if needed.
    console.log('🎨 Background animations active');
}

function initCardEffects() {
    document.addEventListener('mousemove', (e) => {
        const cards = document.querySelectorAll('.lcard');
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.setProperty('--x', `${x}px`);
            card.style.setProperty('--y', `${y}px`);
        });
    });
}

async function fetchCompanyData() {
    try {
        const res = await fetch('/api/company-data');
        if (!res.ok) throw new Error('Fetch failed');
        const data = await res.json();
        if (data) {
            companyData = data;
            applyCompanyData();
        }
    } catch (e) {
        console.error('❌ Failed to fetch company data', e);
        showToast("Error loading system configurations.", "error");
    }
}

function applyCompanyData() {
    const compName = companyData.name || "Emyris Biolifesciences";
    const dpName = document.getElementById('displayCompanyName');
    const headerCompName = document.getElementById('headerCompName');
    
    if (dpName) dpName.innerText = compName;
    if (headerCompName) headerCompName.innerText = compName;
    
    const logoImg = document.getElementById('displayLogo');
    const headerLogoImg = document.getElementById('headerLogoImg');
    const fallback = document.getElementById('landingLogoFallback');
    const headerFallback = document.getElementById('headerLogoLetter');
    
    if (companyData.logo) {
        const logoData = Array.isArray(companyData.logo) ? companyData.logo[companyData.logo.length - 1].data : companyData.logo;
        if (logoImg) {
            logoImg.src = logoData;
            logoImg.classList.remove('hidden');
        }
        if (headerLogoImg) {
            headerLogoImg.src = logoData;
            headerLogoImg.classList.remove('hidden');
        }
        if (fallback) fallback.classList.add('hidden');
        if (headerFallback) headerFallback.classList.add('hidden');
    } else {
        const nameStr = String(compName || "Emyris");
        const initials = nameStr.split(' ').filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join('') || 'E';
        if (fallback) {
            fallback.innerText = initials;
            fallback.classList.remove('hidden');
        }
        if (headerFallback) {
            headerFallback.innerText = initials;
            headerFallback.classList.remove('hidden');
        }
        if (logoImg) logoImg.classList.add('hidden');
        if (headerLogoImg) headerLogoImg.classList.add('hidden');
    }

    // Populate Footer Contact (Sync with Admin Portal)
    const landingQuickContact = document.getElementById('landingQuickContact');
    const mainAppFooterContact = document.getElementById('mainAppFooterContact');
    const contactHTML = `
        ${companyData.phone ? `<span>📞 <a href="tel:${companyData.phone}">${companyData.phone}</a></span>` : ''}
        ${companyData.tollFree ? `<span>☎️ <a href="tel:${companyData.tollFree}">${companyData.tollFree}</a></span>` : ''}
        ${companyData.website ? `<span>🌐 <a href="${companyData.website}" target="_blank">${companyData.website.replace('https://', '')}</a></span>` : ''}
        ${companyData.email ? `<span>✉️ <a href="mailto:${companyData.email}">${companyData.email}</a></span>` : ''}
    `;

    if (landingQuickContact) landingQuickContact.innerHTML = contactHTML;
    if (mainAppFooterContact) mainAppFooterContact.innerHTML = contactHTML;

    if (companyData.marqueeColor) {
        document.documentElement.style.setProperty('--accent-marquee', companyData.marqueeColor);
    }
    syncMarquee(companyData.marqueeText, companyData.marqueeColor, companyData.marqueeSpeed);
    populateDropdowns();

    // Apply branding to previewers if they are visible or when they open
    const offerFrame = document.getElementById('offerPreviewer');
    if (offerFrame) applyBrandingLayers(offerFrame);
}

function applyBrandingLayers(el) {
    if (!el) return;
    const lhAsset = companyData.letterheadImage?.[companyData.letterheadImage.length - 1];
    
    // Clean old branding
    const old = el.querySelectorAll('.a4-branding-layer');
    old.forEach(o => o.remove());
    
    if (lhAsset?.data) {
        // Calculate pages needed based on content height
        // Use a 10mm tolerance to prevent "ghost" pages from tiny overflows
        const pageH_px = 297 * 3.7795275591;
        const tolerance_px = 10 * 3.7795275591; 
        const totalH_px = el.scrollHeight;
        
        const pages = Math.max(1, Math.ceil((totalH_px - tolerance_px) / pageH_px));
        
        for (let i = 0; i < pages; i++) {
            const img = document.createElement('img');
            img.src = lhAsset.data;
            img.className = 'a4-branding-layer';
            img.style.position = 'absolute';
            img.style.top = `${i * 297}mm`;
            img.style.left = '0';
            img.style.width = '210mm';
            img.style.height = '297mm';
            img.style.zIndex = '-1';
            img.style.pointerEvents = 'none';
            el.appendChild(img);
        }
    }
}

async function populateDropdowns() {
    const divSel = document.getElementById('regDivision');
    const desSel = document.getElementById('regDesignation');
    const hqSel = document.getElementById('hq');

    if (!divSel) return;

    const divs = companyData.divisions || [];
    console.log('📊 Synchronized Divisions found:', divs.length);

    divSel.innerHTML = '<option value="">-- Select Division --</option>' +
        divs.map(d => {
            const name = typeof d === 'string' ? d : (d.name || "Unknown");
            return `<option value="${name}">${name}</option>`;
        }).join('');
            
    divSel.onchange = (e) => {
        const divName = e.target.value;
        const div = (companyData.divisions || []).find(d => d.name === divName);
        const picker = document.getElementById('regDesignationPicker');
        const hiddenIn = document.getElementById('regDesignation');
        
        let desgs = (div && div.designations && div.designations.length > 0) ? div.designations : (companyData.designations || []);
        
        if (desgs.length > 0 && picker) {
            const groups = {};
            desgs.forEach(ds => {
                const dept = (typeof ds === 'object' ? ds.department : 'SALES') || 'SALES';
                if (!groups[dept]) groups[dept] = [];
                groups[dept].push(typeof ds === 'string' ? ds : ds.title);
            });

            picker.innerHTML = Object.keys(groups).map(dept => `
                <div class="dept-strip" style="background: var(--accent); color: #000; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; margin: 5px 0 2px 0; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em;">${dept}</div>
                <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                    ${groups[dept].map(title => {
                        const safeTitle = String(title || 'Unknown');
                        return `
                            <div class="picker-chip" onclick="selectRegDesignation('${safeTitle.replace(/'/g, "\\'")}', this)" 
                                 style="background: rgba(255,255,255,0.05); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                                ${safeTitle}
                            </div>
                        `;
                    }).join('')}
                </div>
            `).join('');
            hiddenIn.value = ""; 
        } else if (divName && picker) {
            picker.innerHTML = '<p style="font-size: 0.75rem; color: #ef4444; text-align: center; margin: 10px 0;">⚠️ No designations available</p>';
            hiddenIn.value = "";
        } else if (picker) {
            picker.innerHTML = '<p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin: 10px 0;">-- Select Division First --</p>';
            hiddenIn.value = "";
        }
    };

    if (hqSel) {
        hqSel.innerHTML = '<option value="">-- Select HQ --</option>' +
            (companyData.hqs || []).map(h => `<option value="${h.name}">${h.name}</option>`).join('');
    }
}

function selectRegDesignation(title, el) {
    document.getElementById('regDesignation').value = title;
    document.querySelectorAll('#regDesignationPicker .picker-chip').forEach(c => {
        c.style.background = 'rgba(255,255,255,0.05)';
        c.style.borderColor = 'rgba(255,255,255,0.1)';
        c.style.color = 'white';
    });
    el.style.background = 'var(--accent)';
    el.style.borderColor = 'var(--accent)';
    el.style.color = '#000';
}

// --- AUTH HANDLERS ---


async function handleApplicantRegister(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('regTitle').value,
        fullName: document.getElementById('regName').value,
        division: document.getElementById('regDivision').value,
        designation: document.getElementById('regDesignation').value,
        email: document.getElementById('regEmail').value.trim().toLowerCase(),
        phone: document.getElementById('regPhone').value.trim()
    };

    if (!data.division || !data.designation) {
        showToast("Please select Division and Designation", "warning");
        return;
    }

    try {
        lockUI("✨ Creating Secure Profile...");
        const res = await fetch('/api/register-applicant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success || result.needsRecovery) {
            document.getElementById('securePinDisplay').innerText = result.pin;
            updateView('pinDisplay');
        } else if (result.isReturning) {
            // Intelligent Recovery: Pre-fill login and switch
            showToast(result.message, "success");
            const loginEmail = document.getElementById('loginEmail');
            if (loginEmail) loginEmail.value = data.email;
            setTimeout(() => updateView('applicantLogin'), 1500);
        } else {
            showToast(result.message, "error");
        }
    } catch (err) {
        showToast("Registration failed. Try again.", "error");
    } finally {
        unlockUI();
    }
}

async function handleApplicantLogin(e) {
    if (e) e.preventDefault();
    const email = document.getElementById('loginEmail').value.trim().toLowerCase();
    const pin = document.getElementById('loginPin').value.trim();

    try {
        lockUI("🔐 Verifying PIN...");
        const res = await fetch('/api/applicant-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pin })
        });
        const result = await res.json();
        if (result.success && result.applicant) {
            currentApplicant = result.applicant;
            resumeApplication();
        } else {
            showToast(result.message, "error");
        }
    } catch (err) {
        console.error('❌ Login Error:', err);
        showToast("Login failed: " + err.message, "error");
    } finally {
        unlockUI();
    }
}

async function handleForgotPin() {
    const email = document.getElementById('loginEmail').value;
    if (!email) {
        showToast("Enter your email address first.", "warning");
        return;
    }
    if (!confirm(`Resend PIN to ${email}?`)) return;

    try {
        lockUI("📧 Resending PIN...");
        const res = await fetch('/api/resend-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const result = await res.json();
        showToast(result.message, result.success ? "success" : "error");
    } catch (e) {
        showToast("Recovery failed.", "error");
    } finally {
        unlockUI();
    }
}

function logoutApplicant() {
    currentApplicant = null;
    backToLanding();
    populateDropdowns(); // Ensure dropdowns are fresh
    showToast("Logged out safely.");
}

// --- ONBOARDING FLOW ---

// Statuses that mean "beyond the onboarding form" — show the hub dashboard

function resumeApplication() {
    const app = currentApplicant;
    // Candidates can resume the form if they are in draft, rejected, or onboarding status 
    // (unless an offer has already been issued/accepted)
    const canResumeForm = ['registered', 'rejected', 'onboarding'].includes(app.status);
    const hasOffer = !!(app.offerAccepted || app.offerLetterData);

    if (!canResumeForm || hasOffer) {
        renderApplicantDashboard();
        updateView('applicantDashboard');
        return;
    }

    // Show the multi-step form for drafts or re-submissions
    updateView('onboardingForm');
    currentStep = 1;
    populateDropdowns();
    renderStep(1);
    prefillForm();
    renderApplicantDocuments();
}

function prefillForm() {
    const form = document.getElementById('onboardingForm');
    if (!form) return;

    // 1. Prefill from root properties
    if (currentApplicant.title) {
        const el = document.getElementById('onboardingTitle');
        if (el) el.value = currentApplicant.title;
    }
    
    const fullName = currentApplicant.fullName || "";
    const nameParts = fullName.split(' ');
    if (nameParts.length >= 1) {
        const el = document.getElementById('firstName');
        if (el) el.value = nameParts[0];
    }
    if (nameParts.length >= 3) {
        const ln = document.getElementById('lastName');
        const mn = document.getElementById('middleName');
        if (ln) ln.value = nameParts.pop();
        if (mn) mn.value = nameParts.slice(1).join(' ');
    } else if (nameParts.length === 2) {
        const ln = document.getElementById('lastName');
        if (ln) ln.value = nameParts[1];
    }

    if (currentApplicant.phone) {
        const el = document.getElementById('phone');
        if (el) el.value = currentApplicant.phone;
    }
    if (currentApplicant.email) {
        const el = document.getElementById('email');
        if (el) el.value = currentApplicant.email;
    }
    if (currentApplicant.hq) {
        const el = document.getElementById('hq');
        if (el) el.value = currentApplicant.hq;
    }
    
    // 2. Prefill from formData
    if (currentApplicant.formData) {
        for (const [key, val] of Object.entries(currentApplicant.formData)) {
            const field = form.elements[key];
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = val;
                } else if (field.type === 'date' && val && val.includes('-')) {
                    // Convert DD-MM-YYYY to YYYY-MM-DD for native date picker
                    const parts = val.split('-');
                    if (parts.length === 3 && parts[0].length === 2) {
                        field.value = `${parts[2]}-${parts[1]}-${parts[0]}`;
                    } else {
                        field.value = val;
                    }
                } else {
                    field.value = val;
                }
            }
        }
        // Sync salary words if prefilled
        if (currentApplicant.formData.salary) updateSalaryWords('salary', 'salary_words');
    }
}

function nextStep(step) {
    // Basic validation for current step
    const currentSection = document.querySelector(`.form-step[data-step="${step - 1}"]`);
    if (currentSection) {
        const inputs = currentSection.querySelectorAll('[required]');
        for (let input of inputs) {
            if (!input.value) {
                showToast(`Please fill ${input.previousElementSibling?.innerText || 'all fields'}`, "warning");
                input.focus();
                return;
            }
        }
    }

    // Auto-save draft on every step transition
    saveProgress();

    renderStep(step);
}

async function saveProgress() {
    if (!currentApplicant) return;
    const form = document.getElementById('onboardingForm');
    if (!form) return;
    
    const formData = Object.fromEntries(new FormData(form).entries());
    try {
        await fetch('/api/applicant/save-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email, formData })
        });
    } catch (e) { console.warn('Draft save failed'); }
}

function prevStep(step) {
    renderStep(step);
}

function renderStep(step) {
    currentStep = step;
    document.querySelectorAll('.form-step').forEach(s => {
        s.classList.remove('active');
        if (parseInt(s.getAttribute('data-step')) === step) s.classList.add('active');
    });
    
    // Progress bar
    const bar = document.getElementById('formProgress');
    if (bar) bar.style.width = `${(step / 6) * 100}%`;
    
    // Indicators
    document.querySelectorAll('.step').forEach(s => {
        const sStep = parseInt(s.getAttribute('data-step'));
        s.classList.remove('active', 'completed');
        if (sStep < step) s.classList.add('completed');
        else if (sStep === step) s.classList.add('active');
    });

    window.scrollTo(0, 0);

    if (step === 5) renderApplicantDocuments();
}

function showReview() {
    const form = document.getElementById('onboardingForm');
    const fd = new FormData(form);
    const reviewContent = document.getElementById('reviewContent');
    
    // Clear and prepare
    reviewContent.innerHTML = '';
    const docs = currentApplicant.documents || [];

    // Header with Profile Preview
    const headerHtml = `
        <div class="review-section-group" style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(6, 182, 212, 0.05)); border: 1px solid var(--primary); margin-bottom: 2rem;">
            <div style="display: flex; gap: 20px; align-items: center;">
                <div style="width: 60px; height: 60px; background: var(--primary); border-radius: 15px; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: white; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);">👤</div>
                <div>
                    <h3 style="margin: 0; color: white; letter-spacing: -0.5px;">${currentApplicant.fullName.toUpperCase()}</h3>
                    <p style="margin: 0; color: var(--text-muted); font-size: 0.85rem; font-weight: 600;">${currentApplicant.designation || currentApplicant.formData?.designation || 'Role Not Set'}</p>
                    <div style="display: flex; gap: 15px; margin-top: 5px;">
                        <span style="font-size: 0.75rem; color: var(--primary-light);">📧 ${currentApplicant.email}</span>
                        <span style="font-size: 0.75rem; color: var(--success);">🏢 ${currentApplicant.division || 'General'}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const groups = {
        "👥 Personal Information": [
            { id: 'title', label: 'Title' },
            { id: 'firstName', label: 'First Name' },
            { id: 'middleName', label: 'Middle Name' },
            { id: 'lastName', label: 'Last Name' },
            { id: 'fatherName', label: "Father's Name" },
            { id: 'dob', label: 'Date of Birth', isDate: true },
            { id: 'gender', label: 'Gender' },
            { id: 'bloodGroup', label: 'Blood Group' }
        ],
        "💼 Employment & Location": [
            { id: 'joiningDate', label: 'Expected DOJ', isDate: true },
            { id: 'salary', label: 'Negotiated CTC', isMoney: true },
            { id: 'hq', label: 'HQ Preference' }
        ],
        "📍 Contact Details": [
            { id: 'phone', label: 'Contact Phone' },
            { id: 'address', label: 'Residential Address' },
            { id: 'city', label: 'City' },
            { id: 'state', label: 'State' },
            { id: 'pin', label: 'Pincode' }
        ],
        "🏦 Financial Details": [
            { id: 'bankName', label: 'Bank Name' },
            { id: 'accHolder', label: 'Account Holder' },
            { id: 'accNo', label: 'Account Number' },
            { id: 'ifsc', label: 'IFSC Code' }
        ]
    };

    let groupsHtml = '';
    for (const [name, fields] of Object.entries(groups)) {
        const items = fields.map(f => {
            let val = fd.get(f.id) || currentApplicant[f.id] || "N/A";
            if (f.isDate && val !== "N/A") val = formatDatePretty(val);
            if (f.isMoney && val !== "N/A") val = `₹${parseFloat(val).toLocaleString('en-IN')}`;
            
            return `
                <div class="review-item">
                    <span class="review-label">${f.label}</span>
                    <span class="review-value">${val}</span>
                </div>
            `;
        }).join('');

        groupsHtml += `
            <div class="review-section-group" style="margin-bottom: 1.5rem;">
                <h4>${name}</h4>
                <div class="review-grid">
                    ${items}
                </div>
            </div>
        `;
    }

    // Documents Summary
    const reqDocs = companyData.requiredDocs || [];
    const docItems = reqDocs.map(dName => {
        const catDocs = docs.filter(u => u.category === dName);
        const has = catDocs.length > 0;
        const isOptional = OPTIONAL_DOCS.includes(dName);

        let statusText = has ? `✅ ${catDocs.length} FILES` : '⚠️ MISSING';
        if (isOptional && !has) statusText = '💡 OPTIONAL';

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid ${has ? 'rgba(16, 185, 129, 0.1)' : (isOptional ? 'rgba(99, 102, 241, 0.1)' : 'rgba(239, 68, 68, 0.1)')};">
                <span style="font-size: 0.85rem; color: white; font-weight: 500;">${dName}${isOptional ? ' (Opt)' : ''}</span>
                <span style="font-size: 0.75rem; font-weight: bold; color: ${has ? 'var(--success)' : (isOptional ? 'var(--accent)' : '#ef4444')}">
                    ${statusText}
                </span>
            </div>
        `;
    }).join('');

    const sig = docs.find(u => u.category === 'Digital Signature');
    const sigHtml = `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid ${sig ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};">
            <span style="font-size: 0.85rem; color: white; font-weight: 500;">Digital Signature</span>
            <span style="font-size: 0.75rem; font-weight: bold; color: ${sig ? 'var(--success)' : '#ef4444'}">
                ${sig ? '✅ UPLOADED' : '⚠️ MISSING'}
            </span>
        </div>
    `;

    const docGroupHtml = `
        <div class="review-section-group">
            <h4>📁 Document Verification Status</h4>
            <div class="review-grid" style="grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));">
                ${docItems}
                ${sigHtml}
            </div>
            ${docs.length === 0 ? '<div class="dash-alert warning" style="margin-top: 1rem; border-radius: 10px;">⚠️ No documents detected. Please ensure all required files are uploaded in Step 5.</div>' : ''}
        </div>
    `;

    reviewContent.innerHTML = headerHtml + groupsHtml + docGroupHtml;
    
    reviewContent.innerHTML += `
        <p style="margin-top: 1.5rem; font-size: 0.82rem; color: var(--accent); background: rgba(99, 102, 241, 0.1); padding: 15px; border-radius: 12px; border: 1px solid rgba(99, 102, 241, 0.2);">
            ⚠️ <strong>Final Confirmation:</strong> Please review the above details and documents carefully. Once submitted, you cannot change them without admin intervention.
        </p>
    `;

    renderStep(6);
}

// --- DOCUMENT UPLOAD LOGIC ---

function renderApplicantDocuments() {
    const container = document.getElementById('dynamicTestimonialUploads');
    if (!container) return;
    container.innerHTML = '';
    
    const required = companyData.requiredDocs || [];
    const existing = currentApplicant.documents || [];

    required.forEach(docName => {
        const safeId = docName.replace(/[^a-z0-9]/gi, '_');
        const categoryDocs = existing.filter(d => d.category === docName);
        const hasFiles = categoryDocs.length > 0;
        const isOptional = OPTIONAL_DOCS.includes(docName);

        const box = document.createElement('div');
        box.className = 'upload-box';
        
        let filesHtml = '';
        if (hasFiles) {
            filesHtml = `
                <div class="uploaded-files-list">
                    ${categoryDocs.map(d => `
                        <div class="file-item-pill">
                            <span>📄 ${d.name}</span>
                            <button type="button" class="btn-remove-file" onclick="deleteApplicantDoc('${d.assetId}', '${docName}')">&times;</button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        box.innerHTML = `
            <label>${docName}${isOptional ? ' <small>(Optional)</small>' : (hasFiles ? '' : '*')}</label>
            <div class="drop-zone ${hasFiles ? 'has-files' : ''}" onclick="document.getElementById('file_${safeId}').click()">
                <div class="progress-ribbon" id="ribbon_file_${safeId}" style="width: 0%"></div>
                <span class="drop-icon">${hasFiles ? '📁' : '➕'}</span>
                <span id="status_${safeId}" class="drop-label">${hasFiles ? 'Add More' : 'Upload'}</span>
                <input type="file" id="file_${safeId}" class="hidden" accept="application/pdf,image/*">
            </div>
            ${filesHtml}
        `;
        container.appendChild(box);
        attachApplicantFileListener(`file_${safeId}`, docName);
    });

    // Signature
    const sigDocs = existing.filter(d => d.category === 'Digital Signature');
    const hasSig = sigDocs.length > 0;
    const sigBox = document.createElement('div');
    sigBox.className = 'upload-box';
    sigBox.innerHTML = `
        <label>Digital Signature*</label>
        <div class="drop-zone ${hasSig ? 'has-files' : ''}" onclick="document.getElementById('file_Sig').click()">
            <div class="progress-ribbon" id="ribbon_file_Sig" style="width: 0%"></div>
            <span class="drop-icon">${hasSig ? '🖋️' : '➕'}</span>
            <span id="status_Sig" class="drop-label">${hasSig ? 'Change Signature' : 'Upload Sign'}</span>
            <input type="file" id="file_Sig" class="hidden" accept="image/*">
        </div>
        ${hasSig ? `<div class="uploaded-files-list"><div class="file-item-pill"><span>🖋️ Signature Saved</span><button type="button" class="btn-remove-file" onclick="deleteApplicantDoc('${sigDocs[0].assetId}', 'Digital Signature')">&times;</button></div></div>` : ''}
    `;
    container.appendChild(sigBox);
    attachApplicantFileListener('file_Sig', 'Digital Signature');
}

function attachApplicantFileListener(inputId, category) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const ribbon = document.getElementById(`ribbon_${inputId}`);
        const label = document.getElementById(`status_${inputId.replace('file_', '')}`);
        
        try {
            if (label) label.innerText = "Uploading...";
            if (ribbon) { ribbon.style.width = '30%'; ribbon.classList.add('active'); }
            
            activeUploads++;
            document.getElementById('globalUploadStatus').classList.add('show');

            const isImage = file.type.startsWith('image/');
            const fileData = isImage ? await compressAndResize(file) : await new Promise(r => {
                const reader = new FileReader();
                reader.onload = (ev) => r(ev.target.result);
                reader.readAsDataURL(file);
            });

            if (ribbon) ribbon.style.width = '70%';

            const res = await fetch('/api/applicant/upload-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentApplicant.email, category, fileName: file.name, fileData })
            });
            const result = await res.json();
            if (result.success) {
                if (!currentApplicant.documents) currentApplicant.documents = [];
                currentApplicant.documents.push({ category, name: file.name, assetId: result.assetId, uploadedAt: new Date() });
                renderApplicantDocuments();
                showToast(`${category} Uploaded!`);
            } else {
                showToast(result.message, "error");
            }
        } catch (err) {
            showToast("Upload failed.", "error");
        } finally {
            activeUploads = Math.max(0, activeUploads - 1);
            if (activeUploads === 0) document.getElementById('globalUploadStatus').classList.remove('show');
            if (ribbon) { ribbon.style.width = '0%'; ribbon.classList.remove('active'); }
        }
    };
}

async function deleteApplicantDoc(assetId, category) {
    if (!confirm("Remove this document?")) return;
    try {
        lockUI("Removing...");
        const res = await fetch('/api/applicant/delete-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email, assetId, category })
        });
        if ((await res.json()).success) {
            currentApplicant.documents = currentApplicant.documents.filter(d => d.assetId !== assetId);
            renderApplicantDocuments();
            showToast("Document deleted.");
        }
    } catch (e) {
        showToast("Deletion failed.", "error");
    } finally {
        unlockUI();
    }
}

// --- DASHBOARD RENDERING ---

function applyLetterheadStyles(elementId) {
    const frame = document.getElementById(elementId);
    if (!frame || !companyData) return;

    // 1. Configs from Company Data
    const size = companyData.letterFontSize || 11;
    const fontType = companyData.letterFontType || 'helvetica';
    const align = companyData.letterAlignment || 'left';
    const marginT = companyData.headerHeight || 65;
    const marginB = companyData.footerHeight || 25;

    let fontStack = "'Plus Jakarta Sans', sans-serif";
    if (fontType === 'times') fontStack = "'Times New Roman', Times, serif";
    
    frame.style.fontSize = `${size}pt`;
    frame.style.fontFamily = font;
    frame.style.textAlign = align;

    if (companyData.letterheadImage && companyData.letterheadImage.length > 0) {
        const val = companyData.letterheadImage[companyData.letterheadImage.length - 1].data;
        frame.style.backgroundImage = `url(${val})`;
        frame.style.backgroundSize = '100% 100%';
        frame.style.backgroundRepeat = 'no-repeat';
        frame.style.backgroundPosition = 'center';
    }
}

function renderApplicantDashboard() {
    try {
        const app = currentApplicant;
        if (!app) return;

        if (document.getElementById('dash_fullName')) document.getElementById('dash_fullName').innerText = app.fullName || 'User';
        if (document.getElementById('dash_email')) document.getElementById('dash_email').innerText = app.email || '';
        
        const divEl = document.getElementById('dash_division');
        const desEl = document.getElementById('dash_designation');
        if (divEl) divEl.innerText = app.division || app.formData?.division || 'Division Not Set';
        if (desEl) desEl.innerText = app.designation || app.formData?.designation || 'Role Not Set';
        
        if (document.getElementById('applicantAvatar') && app.fullName) {
            document.getElementById('applicantAvatar').innerText = app.fullName[0].toUpperCase();
        }
        
        const badge = document.getElementById('dash_statusBadge');
        if (badge) {
            badge.innerText = (app.status || '').toUpperCase();
            badge.className = `badge ${app.status || 'draft'}`;
        }

        // Timeline
        const timeline = document.getElementById('onboardingTimeline');
        if (timeline) {
            const steps = [
                { label: 'Register', done: true },
                { label: 'Submit', done: !!app.submittedAt || ['submitted', 'approved'].includes(app.status) },
                { label: 'Verify', done: app.status === 'approved' || app.offerLetterData },
                { label: 'Offer', done: !!app.offerLetterData },
                { label: 'Joined', done: !!app.actualJoiningDate },
                { label: 'Appointed', done: !!app.apptLetterData },
                { label: 'Confirmed', done: app.status === 'confirmed' }
            ];
            timeline.innerHTML = steps.map((s, i) => `
                <div class="timeline-item-premium ${s.done ? 'done' : ''}">
                    <div class="timeline-dot-premium">${s.done ? '✓' : i + 1}</div>
                    <div class="timeline-label-premium">${s.label}</div>
                </div>
            `).join('');
        }

        // Verification Deep Dive
        const statusTitle = document.getElementById('statusTitle');
        const statusDesc = document.getElementById('statusDesc');
        
        if (statusTitle && statusDesc) {
            if (app.status === 'submitted') {
                statusTitle.innerText = "Documents Under Verification";
                statusDesc.innerText = "Our compliance team is currently reviewing your uploaded credentials. You will be notified the moment your Offer Section is activated.";
            } else if (app.status === 'rejected') {
                statusTitle.innerText = "Action Required: Re-submission";
                statusDesc.innerText = "Some of your documents were not approved. Please check the list below and resubmit them.";
            } else if (app.status === 'approved') {
                statusTitle.innerText = "Welcome Aboard!";
                statusDesc.innerText = "Your application has been approved. Please review and accept your offer letter below.";
            }
        }

        // Document Status List
        const docsList = document.getElementById('dash_docsList');
        if (docsList) {
            const required = companyData.requiredDocs || [];
            const checks = app.verificationChecks || {};
            
            docsList.innerHTML = required.map(d => {
                const status = checks[d];
                const isApproved = status === true;
                const isRejected = status === 'rejected';
                return `
                    <div class="doc-status-row">
                        <div class="doc-info">
                            <span class="name">${d}</span>
                            <span class="tag ${isApproved ? 'approved' : (isRejected ? 'rejected' : 'pending')}">
                                ${isApproved ? 'Approved' : (isRejected ? 'Rejected' : 'Pending')}
                            </span>
                        </div>
                        ${isRejected ? `<button class="btn btn-sm btn-outline" onclick="triggerDocResubmit('${d}')">Resubmit</button>` : ''}
                    </div>
                `;
            }).join('');
        }

        // Offer Section
        if (app.offerLetterData) {
            const ols = document.getElementById('offerLetterSection');
            const wsc = document.getElementById('waitingStatusCard');
            if (ols) ols.classList.remove('hidden');
            if (wsc) wsc.classList.add('hidden');
            
            const previewer = document.getElementById('offerPreviewer');
            if (previewer) {
                if (app.offerLetterData.startsWith('data:application/pdf')) {
                    previewer.innerHTML = `<iframe src="${app.offerLetterData}" style="width:100%; height:400px; border:none; border-radius:8px;"></iframe>`;
                } else {
                    previewer.innerHTML = app.offerLetterData;
                    applyLetterheadStyles('offerPreviewer');
                }
            }
            
            if (app.offerAccepted) {
                const af = document.getElementById('acceptanceForm');
                const oas = document.getElementById('offerAcceptedStatus');
                const cjd = document.getElementById('confirmedJoiningDateText');
                if (af) af.classList.add('hidden');
                if (oas) oas.classList.remove('hidden');
                if (cjd) cjd.innerText = formatDatePretty(app.actualJoiningDate);
            }
        } else {
            const ols = document.getElementById('offerLetterSection');
            const wsc = document.getElementById('waitingStatusCard');
            if (ols) ols.classList.add('hidden');
            if (wsc) wsc.classList.remove('hidden');
        }

        // Appointment Section
        if (app.apptLetterData) {
            const als = document.getElementById('appointmentLetterSection');
            if (als) als.classList.remove('hidden');
            const previewer = document.getElementById('apptPreviewer');
            if (previewer) {
                if (app.apptLetterData.startsWith('data:application/pdf')) {
                    previewer.innerHTML = `<iframe src="${app.apptLetterData}" style="width:100%; height:400px; border:none; border-radius:8px;"></iframe>`;
                } else {
                    previewer.innerHTML = app.apptLetterData;
                    applyLetterheadStyles('apptPreviewer');
                }
            }
        } else {
            const als = document.getElementById('appointmentLetterSection');
            if (als) als.classList.add('hidden');
        }
    } catch (err) {
        console.error('❌ Dashboard Render Error:', err);
    }
}

function toggleApptPreview() {
    document.getElementById('apptPreviewer').classList.toggle('hidden');
}

function toggleOfferPreview() {
    const el = document.getElementById('offerPreviewer');
    el.classList.toggle('hidden');
    if (!el.classList.contains('hidden')) {
        applyBrandingLayers(el);
    }
}

async function acceptOfferLetter() {
    const adoj = document.getElementById('actualJoiningDateInput').value;
    if (!adoj) { showToast("Select joining date", "warning"); return; }
    if (!confirm("Confirm acceptance?")) return;

    try {
        lockUI("Accepting...");
        const res = await fetch('/api/applicant/accept-offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email, actualJoiningDate: adoj })
        });
        if ((await res.json()).success) {
            currentApplicant.offerAccepted = true;
            currentApplicant.actualJoiningDate = adoj;
            renderApplicantDashboard();
            showToast("Welcome aboard!");
        }
    } catch (e) {
        showToast("Error accepting offer.", "error");
    } finally {
        unlockUI();
    }
}

async function downloadMyLetter(type) {
    const container = document.getElementById(type === 'offer' ? 'offerPreviewer' : 'apptPreviewer');
    const app = currentApplicant;
    if (!app) return;

    const data = type === 'offer' ? app.offerLetterData : app.apptLetterData;
    if (!data) return showToast("Letter not available.", "warning");

    // If it's already a PDF data URI, just download it
    if (data.startsWith('data:application/pdf')) {
        const a = document.createElement('a');
        a.href = data;
        a.download = `EMYRIS_${type.toUpperCase()}_${app.fullName.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
    }

    // Otherwise, generate PDF from the styled HTML container
    showToast("Generating Multi-page PDF...");
    lockUI("⏳ Synthesizing PDF Document...");
    try {
        const isHidden = container.classList.contains('hidden');
        if (isHidden) {
            container.classList.remove('hidden');
            container.style.position = 'fixed';
            container.style.left = '-9999px';
            container.style.top = '0';
        }

        // 1. Measure actual A4 height in pixels for high-fidelity slicing
        const measureEl = document.createElement('div');
        measureEl.style.height = '297mm';
        measureEl.style.width = '210mm';
        measureEl.style.position = 'absolute';
        measureEl.style.visibility = 'hidden';
        document.body.appendChild(measureEl);
        const actualPageH_px = measureEl.offsetHeight;
        document.body.removeChild(measureEl);

        const A4_PX_W = 794; 
        const lhAsset = companyData.letterheadImage?.[companyData.letterheadImage.length - 1];

        // Clean capture: Ensure branding layers are removed from the capture itself
        const oldBranding = container.querySelectorAll('.a4-branding-layer');
        oldBranding.forEach(b => b.remove());

        const canvas = await html2canvas(container, { 
            scale: 2,
            useCORS: true,
            logging: false,
            width: A4_PX_W,
            windowWidth: A4_PX_W,
            backgroundColor: null, // CRITICAL: Transparency for multi-page branding
            onclone: (clonedDoc) => {
                const clonedFrame = clonedDoc.getElementById(container.id);
                if (clonedFrame) {
                    clonedFrame.style.width = '794px';
                    clonedFrame.style.padding = '65mm 20mm 25mm'; 
                    clonedFrame.style.margin = '0';
                    clonedFrame.style.boxShadow = 'none';
                    clonedFrame.style.borderRadius = '0';
                    clonedFrame.style.background = 'transparent'; // CRITICAL: Transparency
                }
            }
        });

        // Restore branding for UI preview
        applyBrandingLayers(container);
        if (isHidden) {
            container.classList.add('hidden');
            container.style.position = '';
            container.style.left = '';
        }

        const canvasW = canvas.width;
        const canvasH = canvas.height;
        const finalSliceH = actualPageH_px * 2; 
        const tolerance_px = (10 * (actualPageH_px / 297)) * 2; 

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        let cursorY = 0;
        let pageCount = 0;

        while (cursorY < canvasH - tolerance_px) {
            if (pageCount > 0) pdf.addPage();
            
            // Add branding manually
            if (lhAsset?.data) {
                pdf.addImage(lhAsset.data, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
            }

            const sliceH = Math.min(finalSliceH, canvasH - cursorY);
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvasW;
            sliceCanvas.height = sliceH;
            
            const sCtx = sliceCanvas.getContext('2d');
            sCtx.drawImage(canvas, 0, cursorY, canvasW, sliceH, 0, 0, canvasW, sliceH);
            
            const sliceData = sliceCanvas.toDataURL('image/png', 1.0);
            pdf.addImage(sliceData, 'PNG', 0, 0, 210, (sliceH / canvasW) * 210, undefined, 'FAST');
            
            cursorY += finalSliceH;
            pageCount++;
        }

        pdf.save(`EMYRIS_${type.toUpperCase()}_${app.fullName.replace(/\s+/g, '_')}.pdf`);
        showToast("PDF Downloaded!", "success");
    } catch (e) {
        console.error("PDF Generation Error:", e);
        showToast("Failed to generate PDF.", "error");
    } finally {
        unlockUI();
    }
}

async function triggerDocResubmit(category) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/*';
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        lockUI(`Resubmitting ${category}...`);
        const fileData = await new Promise(r => {
            const reader = new FileReader();
            reader.onload = (ev) => r(ev.target.result);
            reader.readAsDataURL(file);
        });
        const res = await fetch('/api/applicant/resubmit-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email, category, data: fileData, name: file.name })
        });
        if ((await res.json()).success) {
            showToast("Resubmitted! Refreshing...");
            location.reload();
        } else {
            showToast("Resubmit failed.", "error");
            unlockUI();
        }
    };
    input.click();
}

// --- FINAL SUBMISSION ---

document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!document.getElementById('agree').checked) {
        showToast("Please agree to the declaration.", "warning");
        return;
    }

    // 1. Mandatory Document Validation
    const docs = currentApplicant.documents || [];
    const reqDocs = companyData.requiredDocs || [];
    const missingMandatory = reqDocs.filter(d => !OPTIONAL_DOCS.includes(d) && !docs.find(u => u.category === d));
    
    if (missingMandatory.length > 0) {
        showToast(`⚠️ Mandatory documents missing: ${missingMandatory.join(', ')}`, "error");
        renderStep(5);
        return;
    }

    const hasSig = docs.find(u => u.category === 'Digital Signature');
    if (!hasSig) {
        showToast("⚠️ Digital Signature is required.", "error");
        renderStep(5);
        return;
    }

    const formData = Object.fromEntries(new FormData(e.target).entries());
    
    try {
        lockUI("Submitting Application...");
        const res = await fetch('/api/submit-onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email, formData })
        });
        const result = await res.json();
        if (result.success) {
            document.getElementById('appEmail').innerText = currentApplicant.email;
            updateView('successView');
        } else {
            showToast(result.message, "error");
        }
    } catch (err) {
        showToast("Submission failed.", "error");
    } finally {
        unlockUI();
    }
});
