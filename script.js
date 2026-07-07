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
const OPTIONAL_DOCS = ["Medical Fitness Certificate", "Passport Photo"];

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
    populateAnniversaryDays();
    updateView('landingPage');

    // Check for existing session (optional, for now we just show landing)
    await fetchCompanyData();
    populateAnniversaryDays();
    updateView('landingPage');
}

function populateAnniversaryDays() {
    const daySel = document.getElementById('anniversaryDay');
    if (!daySel) return;
    for (let i = 1; i <= 31; i++) {
        const val = i.toString().padStart(2, '0');
        const opt = document.createElement('option');
        opt.value = val;
        opt.innerText = val;
        daySel.appendChild(opt);
    }
}

function toggleAnniversaryField() {
    const status = document.getElementById('maritalStatus').value;
    const group = document.getElementById('anniversaryGroup');
    const dayIn = document.getElementById('anniversaryDay');
    const monthIn = document.getElementById('anniversaryMonth');
    
    if (status === 'Married') {
        group.classList.remove('hidden');
        dayIn.required = true;
        monthIn.required = true;
    } else {
        group.classList.add('hidden');
        dayIn.required = false;
        monthIn.required = false;
        dayIn.value = '';
        monthIn.value = '';
    }
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

    /* Minimal & Secure Contact Restore with Color */
    const safetyBar = document.getElementById('emy-safety-contact-bar');
    if (safetyBar && companyData) {
        const accent = companyData.primaryColor || '#6366f1';
        safetyBar.innerHTML = `
            ${companyData.phone ? `<span><strong style="color:${accent};">Phone:</strong> ${companyData.phone}</span>` : ''}
            ${companyData.tollFree ? `<span><strong style="color:${accent};">Toll-Free:</strong> ${companyData.tollFree}</span>` : ''}
            ${companyData.website ? `<span><strong style="color:${accent};">Website:</strong> ${companyData.website.replace('https://', '')}</span>` : ''}
        `;
    }

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

    // ── EXISTING STAFF BYPASS ──────────────────────────────────────────────
    // If this is an existing employee fast-tracked by admin:
    //  • Skip rapid test (rapidTestCompleted is pre-set to true)
    //  • Skip offer/appointment letter flow (already completed)
    //  • Go directly to 6-step onboarding form to collect personal/bank/doc records
    if (app.isExistingStaff) {
        console.log('👤 [EXISTING STAFF] Bypassing rapid test and offer flow. Loading record update form...');
        // Update form heading to reflect this is a record update, not new onboarding
        const formHeader = document.getElementById('formTitle');
        if (formHeader) formHeader.innerText = '📋 Update Your Employee Records';
        const formSubtitle = document.getElementById('formSubtitle');
        if (formSubtitle) formSubtitle.innerText = 'Please fill in your personal details, bank information, and upload required documents.';
        // Hide offer/appointment pipeline steps in the sidebar if present
        document.querySelectorAll('[data-step-label="Offer Letter"], [data-step-label="Appointment"]').forEach(el => el.style.display = 'none');
        // Go directly to onboarding form
        updateView('onboardingForm');
        currentStep = 1;
        populateDropdowns();
        renderStep(1);
        prefillForm();
        renderApplicantDocuments();
        return;
    }
    // ── END EXISTING STAFF BYPASS ──────────────────────────────────────────

    if (!app.rapidTestCompleted) {
        startRapidTest();
        return;
    }

    // Candidates can resume the form if they are in draft, registered, rejected, or onboarding status 
    // (unless an offer has already been issued/accepted)
    const canResumeForm = ['draft', 'registered', 'rejected', 'onboarding'].includes(app.status);
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
        
        // Prefill Experience
        if (currentApplicant.formData.totalExperience !== undefined) {
            const el = document.getElementById('totalExperience');
            if (el) el.value = currentApplicant.formData.totalExperience;
        }

        // Toggle anniversary based on prefilled marital status
        if (currentApplicant.formData.maritalStatus) {
            toggleAnniversaryField();
        }
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

async function saveProgressManual() {
    try {
        lockUI("💾 Saving Draft...");
        await saveProgress();
        showToast("✅ Progress saved successfully!", "success");
    } catch (e) {
        showToast("❌ Failed to save draft", "error");
    } finally {
        unlockUI();
    }
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
        <div class="form-header-actions">
            <button class="btn-action-small" onclick="saveProgressManual()"><span>💾</span> Save Draft</button>
            <button class="btn-action-small btn-logout-danger" onclick="logoutApplicant()"><span>🚪</span> Logout</button>
        </div>
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
            { id: 'bloodGroup', label: 'Blood Group' },
            { id: 'maritalStatus', label: 'Marital Status' },
            { id: 'anniversaryDay', label: 'Anniversary Day', dependsOn: 'maritalStatus', dependsVal: 'Married' },
            { id: 'anniversaryMonth', label: 'Anniversary Month', dependsOn: 'maritalStatus', dependsVal: 'Married' }
        ],
        "💼 Employment & Location": [
            { id: 'joiningDate', label: 'Expected DOJ', isDate: true },
            { id: 'salary', label: 'Negotiated CTC', isMoney: true },
            { id: 'hq', label: 'HQ Preference' },
            { id: 'epfNumber', label: 'EPF Number' },
            { id: 'uanNumber', label: 'UAN Number' },
            { id: 'esiNumber', label: 'ESI Number' }
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
            let val = fd.get(f.id) || currentApplicant[f.id] || (currentApplicant.formData ? currentApplicant.formData[f.id] : null) || "N/A";
            
            // Handle conditional visibility in review
            if (f.dependsOn) {
                const parentVal = fd.get(f.dependsOn) || currentApplicant[f.dependsOn] || (currentApplicant.formData ? currentApplicant.formData[f.dependsOn] : null);
                if (parentVal !== f.dependsVal) return '';
            }

            if (f.isDate && val !== "N/A") {
                if (f.id === 'joiningDate') {
                    val = val.split('-').reverse().join('/');
                } else {
                    val = formatDatePretty(val);
                }
            }
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

    const isSigRequired = reqDocs.includes("Digital Signature");
    let sigHtml = '';
    if (isSigRequired) {
        const sig = docs.find(u => u.category === 'Digital Signature');
        sigHtml = `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid ${sig ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};">
                <span style="font-size: 0.85rem; color: white; font-weight: 500;">Digital Signature</span>
                <span style="font-size: 0.75rem; font-weight: bold; color: ${sig ? 'var(--success)' : '#ef4444'}">
                    ${sig ? '✅ UPLOADED' : '⚠️ MISSING'}
                </span>
            </div>
        `;
    }

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

    // Experience-based logic
    const expInput = document.getElementById('totalExperience');
    const totalExp = expInput ? parseFloat(expInput.value) || 0 : 0;
    const isExperienced = totalExp > 0;

    // Show warning note for experienced
    if (isExperienced) {
        const note = document.createElement('div');
        note.className = 'dash-alert warning';
        note.style.marginBottom = '1.5rem';
        note.innerHTML = `🛡️ <strong>Note for Experienced Candidate:</strong> Since you have ${totalExp} years of experience, uploading your <strong>Last Month Salary Slip</strong> and <strong>Previous Company Appointment/Experience letters</strong> is mandatory.`;
        container.appendChild(note);
    } else {
        const note = document.createElement('div');
        note.className = 'dash-alert success';
        note.style.marginBottom = '1.5rem';
        note.innerHTML = `✨ <strong>Note for Fresher:</strong> Since you are a fresher, previous employment documents (Salary slips, Experience letters) are optional for you.`;
        container.appendChild(note);
    }

    required.filter(d => d !== "Digital Signature").forEach(docName => {
        const safeId = docName.replace(/[^a-z0-9]/gi, '_');
        const categoryDocs = existing.filter(d => d.category === docName);
        const hasFiles = categoryDocs.length > 0;
        
        // DYNAMIC MANDATORY LOGIC
        const expDocs = ["Last Month Salary Slip", "Previous Company Appointment Letter", "Experience Letter - Previous Company", "Relieving Letter - Previous Company"];
        let isOptional = OPTIONAL_DOCS.includes(docName);
        
        if (expDocs.includes(docName)) {
            isOptional = !isExperienced;
        }

        const box = document.createElement('div');
        box.className = 'upload-box';
        
        let filesHtml = '';
        if (hasFiles) {
            filesHtml = `
                <div class="uploaded-files-list">
                    ${categoryDocs.map(d => `
                        <div class="file-item-pill" title="${d.name}">
                            <span>📄 ${truncateFilename(d.name, 25)}</span>
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

    // Signature - ONLY if required by Admin
    if (required.includes("Digital Signature")) {
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
}

function attachApplicantFileListener(inputId, category) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Prevent parallel uploads to ensure robust UX and no backend race conditions
        if (activeUploads > 0) {
            input.value = ''; // Reset selection
            return showToast("Wait, Uploading....", "warning");
        }

        const ribbon = document.getElementById(`ribbon_${inputId}`);
        const label = document.getElementById(`status_${inputId.replace('file_', '')}`);
        
        try {
            if (label) label.innerText = "Uploading...";
            if (ribbon) { ribbon.style.width = '30%'; ribbon.classList.add('active'); }
            
            activeUploads++;
            document.getElementById('globalUploadStatus').classList.add('show');

            const isImage = file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.jfif');
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
    frame.style.fontFamily = fontStack;
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
                { label: 'Submit', done: !!app.submittedAt || ['submitted', 'approved', 'onboarding', 'joined', 'confirmed', 'rejected'].includes(app.status) },
                { label: 'Verify', done: app.status === 'approved' || !!app.offerLetterData },
                { label: 'Offer', done: !!app.offerLetterData },
                { label: 'Joined', done: !!app.offerAccepted && !!app.actualJoiningDate },
                { label: 'Appointed', done: !!app.apptLetterData },
                { label: 'Confirmed', done: app.status === 'confirmed' }
            ];
            timeline.innerHTML = steps.map((s, i) => `
                <div class="timeline-item-premium ${s.done ? 'done' : ''}">
                    <div class="timeline-dot-premium">${s.done ? '✓' : i + 1}</div>
                    <div class="timeline-label-premium">${s.label}</div>
                </div>
            `).join('');

            const examBtn = document.getElementById('applicantExamBtn');
            if (examBtn) {
                examBtn.classList.add('hidden');
                if (companyData && companyData.activeExamDate && app.offerAccepted) {
                    const today = new Date().toISOString().split('T')[0];
                    if (companyData.activeExamDate.substring(0, 10) === today) {
                        examBtn.classList.remove('hidden');
                    }
                }
            }
            
            // Global Progress Animation
            let completedSteps = steps.filter(s => s.done).length;
            let pct = Math.round((completedSteps / steps.length) * 100);
            setTimeout(() => {
                const gbar = document.getElementById('hubGlobalProgressBar');
                if (gbar) gbar.style.width = pct + '%';
                const gtext = document.getElementById('hubGlobalProgressText');
                if (gtext) gtext.innerText = pct + '% Completed';
            }, 100);
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
                if (cjd) cjd.innerText = app.actualJoiningDate ? app.actualJoiningDate.split('-').reverse().join('/') : 'Not recorded';
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

        // Issued Letters Section
        if (app.issuedLetters && app.issuedLetters.length > 0) {
            const issuedSection = document.getElementById('issuedLettersSection');
            if (issuedSection) issuedSection.classList.remove('hidden');
            
            const issuedList = document.getElementById('issuedLettersList');
            if (issuedList) {
                issuedList.innerHTML = app.issuedLetters.map((letter, idx) => {
                    const letterLabel = (letter.type || 'Document').replace('_', ' ').toUpperCase();
                    const date = new Date(letter.issuedAt).toLocaleDateString();
                    return `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;">
                            <div>
                                <h4 style="margin: 0; color: var(--text-main); font-size: 0.95rem;">${letterLabel}</h4>
                                <p style="margin: 4px 0 0; font-size: 0.75rem; color: var(--text-muted);">Issued on: ${date}</p>
                            </div>
                            <button class="btn btn-sm btn-outline" onclick="previewApplicantIssuedLetter(${idx})">👁️ View PDF</button>
                        </div>
                    `;
                }).join('');
            }
        } else {
            const issuedSection = document.getElementById('issuedLettersSection');
            if (issuedSection) issuedSection.classList.add('hidden');
        }

        // Fetch user's exam scoreboard history
        if (typeof fetchMyExamScores === 'function') {
            fetchMyExamScores();
        }

    } catch (err) {
        console.error("Dashboard render error:", err);
        const container = document.getElementById('scoreboardContainer');
        if (container) {
            container.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 30px;">
                Dashboard render error prevented scores from loading:<br>
                ${err.message}<br>
                ${err.stack}
            </div>`;
        }
    }
}

function toggleApptPreview() {
    document.getElementById('apptPreviewer').classList.toggle('hidden');
}

function toggleOfferPreview() {
    const modal = document.getElementById('offerModal');
    modal.classList.remove('hidden');
    const el = document.getElementById('offerPreviewer');
    applyBrandingLayers(el);
}

function closeOfferModal() {
    document.getElementById('offerModal').classList.add('hidden');
}

window.previewApplicantIssuedLetter = function(idx) {
    const app = currentApplicant;
    if (!app || !app.issuedLetters || !app.issuedLetters[idx]) return;
    
    const letter = app.issuedLetters[idx];
    const win = window.open('', '_blank');
    win.document.write(`
        <html>
            <head>
                <title>Document Preview: ${letter.type.toUpperCase()}</title>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; background: #f1f5f9; color: #1e293b; line-height: 1.1; }
                    .container { background: white; padding: 50px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 800px; margin: 0 auto; min-height: auto; }
                </style>
            </head>
            <body>
                <div class="container">${letter.data}</div>
            </body>
        </html>
    `);
    win.document.close();
};

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
                    clonedFrame.style.minHeight = 'auto'; // Prevent 2nd page blank overflow
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

async function downloadCandidateDossier() {
    if (!currentApplicant) return;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const app = currentApplicant;
    const fd = app.formData || {};

    // Header
    doc.setFontSize(22);
    doc.setTextColor(99, 102, 241);
    doc.text("CANDIDATE ONBOARDING PROFILE", 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 105, 27, { align: 'center' });

    // Personal Details Section
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text("1. PERSONAL INFORMATION", 14, 40);
    
    const personalRows = [
        ["Full Name", app.fullName || "N/A"],
        ["Father's Name", fd.fatherName || "N/A"],
        ["Date of Birth", fd.dob ? formatDatePretty(fd.dob) : "N/A"],
        ["Gender", fd.gender || "N/A"],
        ["Blood Group", fd.bloodGroup || "N/A"],
        ["Marital Status", app.maritalStatus || fd.maritalStatus || "N/A"],
        ["Anniversary Date", app.anniversaryDate || (fd.maritalStatus === 'Married' ? `${fd.anniversaryDay || '??'}-${fd.anniversaryMonth || '??'}` : "N/A")],
        ["Current Address", app.address || fd.address || "N/A"],
        ["PIN Code", app.pin || fd.pin || "N/A"],
        ["State", app.state || fd.state || "N/A"],
        ["Email", app.email || "N/A"],
        ["Phone", app.phone || "N/A"]
    ];

    doc.autoTable({
        startY: 45,
        body: personalRows,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
    });

    // Professional & Bank Details
    doc.text("2. PROFESSIONAL & BANKING DETAILS", 14, doc.lastAutoTable.finalY + 15);
    const profRows = [
        ["Proposed Designation", app.designation || fd.designation || "N/A"],
        ["Expected DOJ", fd.joiningDate ? fd.joiningDate.split('-').reverse().join('/') : "N/A"],
        ["Negotiated CTC", fd.salary ? `Rs. ${parseFloat(fd.salary).toLocaleString('en-IN')}` : "N/A"],
        ["HQ Preference", fd.hq || "N/A"],
        ["EPF Number", app.epfNumber || fd.epfNumber || "N/A"],
        ["UAN Number", app.uanNumber || fd.uanNumber || "N/A"],
        ["ESI Number", app.esiNumber || fd.esiNumber || "N/A"],
        ["Bank Name", fd.bankName || "N/A"],
        ["Account Number", fd.accNo || "N/A"],
        ["IFSC Code", fd.ifsc || "N/A"]
    ];

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        body: profRows,
        theme: 'striped',
        styles: { fontSize: 10, cellPadding: 3 },
        columnStyles: { 0: { fontStyle: 'bold', width: 60 } }
    });

    // Testimonials List
    doc.text("3. UPLOADED TESTIMONIALS", 14, doc.lastAutoTable.finalY + 15);
    const docs = app.documents || [];
    const docRows = docs.map(d => [d.category, d.name, new Date(d.uploadedAt).toLocaleDateString()]);
    if (docRows.length === 0) docRows.push(["No documents uploaded", "", ""]);

    doc.autoTable({
        startY: doc.lastAutoTable.finalY + 20,
        head: [["Category", "Filename", "Date"]],
        body: docRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        headStyles: { fillStyle: 'f', fillColor: [99, 102, 241] }
    });

    // Save
    doc.save(`EMYRIS_PROFILE_${app.fullName.replace(/\s+/g, '_')}.pdf`);
    showToast("Profile Downloaded successfully!");
}

let consentGiven = false;

function showConsentModal() {
    const form = document.getElementById('onboardingForm');
    if (!form.reportValidity()) return;
    
    if (!document.getElementById('agree').checked) {
        showToast("Please agree to the initial declaration first.", "warning");
        return;
    }

    if (localStorage.getItem('finalConsentAccepted_' + currentApplicant.email) === 'true') {
        consentGiven = true;
        document.getElementById('onboardingForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        return;
    }

    document.getElementById('consentModal').classList.remove('hidden');
}

function closeConsentModal() {
    document.getElementById('consentModal').classList.add('hidden');
}

function acceptConsentAndSubmit() {
    consentGiven = true;
    localStorage.setItem('finalConsentAccepted_' + currentApplicant.email, 'true');
    closeConsentModal();
    document.getElementById('onboardingForm').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
}

document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!document.getElementById('agree').checked) {
        showToast("Please agree to the declaration.", "warning");
        return;
    }
    if (!consentGiven) {
        if (localStorage.getItem('finalConsentAccepted') === 'true') {
            consentGiven = true;
        } else {
            showToast("Security Check: You must accept the Data Privacy Consent before submitting.", "error");
            showConsentModal();
            return;
        }
    }
    
    // Clear flag for future re-submissions if necessary
    consentGiven = false;

    // 1. Mandatory Document Validation
    const docs = currentApplicant.documents || [];
    const reqDocs = companyData.requiredDocs || [];
    
    const expEl = document.getElementById('experience');
    const expVal = expEl ? parseFloat(expEl.value) : (currentApplicant.formData?.experience ? parseFloat(currentApplicant.formData.experience) : 0);
    const isExperienced = expVal > 0;
    const expDocs = ["Last Month Salary Slip", "Previous Company Appointment Letter", "Experience Letter - Previous Company", "Relieving Letter - Previous Company"];

    const missingMandatory = reqDocs.filter(d => {
        let isOptional = OPTIONAL_DOCS.includes(d);
        if (expDocs.includes(d)) {
            isOptional = !isExperienced;
        }
        return !isOptional && !docs.find(u => u.category === d);
    });
    
    if (missingMandatory.length > 0) {
        showToast(`⚠️ Mandatory documents missing: ${missingMandatory.join(', ')}`, "error");
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



// --- RAPID TEST LOGIC ---
let rapidTestTimer;
let rapidTestQuestions = [];
let rapidTestAnswers = {};

async function startRapidTest() {
    try {
        lockUI("Loading Rapid Assessment...");
        const res = await fetch('/api/applicant/test-questions');
        const data = await res.json();
        if (data.success) {
            rapidTestQuestions = data.questions;
            rapidTestAnswers = {};
            renderRapidTestUI();
            updateView('rapidTestView');
            startRapidTestTimer(25 * 60); // 25 minutes
        } else {
            showToast("Failed to load test.", "error");
        }
    } catch (e) {
        showToast("Error loading test.", "error");
    } finally {
        unlockUI();
    }
}

function startRapidTestTimer(seconds) {
    const display = document.getElementById('rapidTestTimerDisplay');
    if (!display) return;
    
    let timeLeft = seconds;
    if (rapidTestTimer) clearInterval(rapidTestTimer);
    rapidTestTimer = setInterval(() => {
        timeLeft--;
        const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const s = (timeLeft % 60).toString().padStart(2, '0');
        display.innerText = `${m}:${s}`;
        
        if (timeLeft <= 0) {
            clearInterval(rapidTestTimer);
            showToast("Time's up! Auto-submitting...", "warning");
            submitRapidTest();
        }
    }, 1000);
}

function renderRapidTestUI() {
    const container = document.getElementById('rapidTestQuestionsContainer');
    if (!container) return;
    
    let html = '';
    rapidTestQuestions.forEach((q, idx) => {
        html += `<div class="question-card" id="qcard_${q._id}" style="margin-bottom: 1.5rem; background: rgba(0,0,0,0.25); padding: 18px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); transition: all 0.3s ease;">`;
        html += `<h4 style="margin-bottom: 12px; color: #fff; font-size: 1.05rem; line-height: 1.4;">Q${idx + 1}. ${q.text}</h4>`;
        html += `<div id="qoptions_${q._id}">`;
        q.options.forEach((opt, optIdx) => {
            html += `
                <div id="optbox_${q._id}_${optIdx}" style="margin-bottom: 8px; padding: 10px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.06); background: rgba(255,255,255,0.02); transition: all 0.2s ease;">
                    <label style="cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; justify-content: space-between; width: 100%; font-size: 0.95rem; margin: 0;">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="radio" name="qt_${q._id}" value="${optIdx}" style="accent-color: var(--primary);" onchange="selectRapidAnswer('${q._id}', ${optIdx}, ${q.correctAnswerIndex})">
                            <span>${opt}</span>
                        </div>
                        <span id="optbadge_${q._id}_${optIdx}" style="font-weight: 700; font-size: 0.85rem;"></span>
                    </label>
                </div>
            `;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

function selectRapidAnswer(qId, selectedIdx, correctIdx) {
    rapidTestAnswers[qId] = selectedIdx;
    
    // Provide immediate educational feedback
    const card = document.getElementById(`qcard_${qId}`);
    if (card) {
        card.style.borderColor = selectedIdx === correctIdx ? 'rgba(34, 197, 94, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    }

    const optionsContainer = document.getElementById(`qoptions_${qId}`);
    if (!optionsContainer) return;

    // Block re-attempts: disable all radio buttons for this question
    const allRadios = optionsContainer.querySelectorAll('input[type="radio"]');
    allRadios.forEach(radio => radio.disabled = true);
    // Also disable pointer events on the container so they can't click labels
    optionsContainer.style.pointerEvents = 'none';

    // Reset and style options
    const optionBoxes = optionsContainer.querySelectorAll('[id^="optbox_"]');
    optionBoxes.forEach((box, idx) => {
        const badge = document.getElementById(`optbadge_${qId}_${idx}`);
        if (idx === correctIdx) {
            // Correct answer
            box.style.background = 'rgba(34, 197, 94, 0.15)';
            box.style.borderColor = 'rgba(34, 197, 94, 0.6)';
            box.style.color = '#4ade80';
            if (badge) badge.innerHTML = '✅ Correct Answer';
        } else if (idx === selectedIdx && selectedIdx !== correctIdx) {
            // Selected wrong answer
            box.style.background = 'rgba(239, 68, 68, 0.15)';
            box.style.borderColor = 'rgba(239, 68, 68, 0.6)';
            box.style.color = '#f87171';
            if (badge) badge.innerHTML = '❌ Incorrect';
        } else {
            // Unselected wrong answer
            box.style.background = 'rgba(255,255,255,0.02)';
            box.style.borderColor = 'rgba(255,255,255,0.06)';
            box.style.color = 'var(--text-secondary)';
            if (badge) badge.innerHTML = '';
        }
    });
}

async function submitRapidTest() {
    if (rapidTestTimer) clearInterval(rapidTestTimer);
    try {
        lockUI("Evaluating answers...");
        const res = await fetch('/api/applicant/submit-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email, answers: rapidTestAnswers })
        });
        const data = await res.json();
        unlockUI();
        
        if (data.success) {
            currentApplicant.rapidTestCompleted = true;
            currentApplicant.rapidTestScore = data.score;
            
            // Show score explicitly using native alert for simplicity, then route
            alert(`Assessment Complete!\n\nYour Score: ${data.score} / 20\n\nThank you. You will now be forwarded to your onboarding dashboard.`);
            resumeApplication(); 
        } else {
            showToast(data.error || "Failed to submit", "error");
        }
    } catch (e) {
        showToast("Error submitting test", "error");
        unlockUI();
    }
}

// --- ONGOING EXAM LOGIC ---
let ongoingExamQuestions = [];
let ongoingExamAnswers = {};
let ongoingExamTimerInterval;
let ongoingExamPhase = 1;

function launchOngoingExam() {
    updateView('ongoingExamView');
    document.getElementById('examIntroSection').classList.remove('hidden');
    document.getElementById('examQuestionsContainer').classList.add('hidden');
    document.getElementById('floatingExamTimer').style.display = 'none';
}

let ongoingExamMcqTime = 15;
let ongoingExamDescTime = 15;

async function startOngoingExam() {
    lockUI('⏳ Preparing your exam...');
    try {
        const res = await fetch('/api/applicant/exam-questions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email })
        });
        const data = await res.json();
        
        if (data.success && data.questions && data.questions.length > 0) {
            ongoingExamQuestions = data.questions;
            ongoingExamAnswers = {};
            ongoingExamPhase = 1;
            
            ongoingExamMcqTime = data.mcqTime || 15;
            ongoingExamDescTime = data.descTime || 15;
            
            renderOngoingExamQuestions();
            
            document.getElementById('examIntroSection').classList.add('hidden');
            document.getElementById('examQuestionsContainer').classList.remove('hidden');
            
            const submitBtn = document.getElementById('submitExamBtn');
            submitBtn.classList.remove('hidden');
            submitBtn.innerText = 'Submit MCQ & Continue';
            submitBtn.removeAttribute('onclick');
            submitBtn.onclick = submitPhase1;
            
            document.getElementById('floatingExamTimer').style.display = 'flex';
            startOngoingExamTimer(ongoingExamMcqTime * 60); 
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            alert(data.message || 'No questions available for today.');
        }
    } catch (e) {
        console.error(e);
        alert('Error loading exam. Please check your connection.');
    } finally {
        unlockUI();
    }
}

function submitPhase1() {
    let mcqTotal = 0;
    let mcqScore = 0;
    
    ongoingExamQuestions.forEach(q => {
        if (q.questionType === 'mcq') {
            mcqTotal++;
            if (ongoingExamAnswers[q._id] !== undefined && Number(ongoingExamAnswers[q._id]) === q.correctAnswerIndex) {
                mcqScore++;
            }
        }
    });

    alert(`Phase 1 Complete!\nYour MCQ Score: ${mcqScore} out of ${mcqTotal}\n\nYou will now proceed to the Descriptive Assessment.`);

    ongoingExamPhase = 2;
    renderOngoingExamQuestions();
    
    const submitBtn = document.getElementById('submitExamBtn');
    submitBtn.innerText = 'Submit Final Exam';
    submitBtn.onclick = submitOngoingExam;
    
    startOngoingExamTimer(ongoingExamDescTime * 60); // Use custom descriptive time
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert('Phase 1 Submitted! You now have 15 minutes for the Descriptive section. You cannot return to the previous section.');
}

function renderOngoingExamQuestions() {
    const list = document.getElementById('examQuestionsList');
    list.innerHTML = '';
    
    let displayedIndex = 0;
    ongoingExamQuestions.forEach((q) => {
        if (ongoingExamPhase === 1 && q.questionType !== 'mcq') return;
        if (ongoingExamPhase === 2 && q.questionType === 'mcq') return;
        displayedIndex++;
        const qContainer = document.createElement('div');
        qContainer.style.background = 'rgba(255,255,255,0.02)';
        qContainer.style.border = '1px solid var(--glass-border)';
        qContainer.style.borderRadius = '12px';
        qContainer.style.padding = '1.5rem';
        qContainer.style.marginBottom = '1.5rem';
        
        let qTypeLabel = q.questionType === 'descriptive' ? '<span style="color:#818cf8; font-size:0.75rem; font-weight:bold; margin-right:8px;">[DESCRIPTIVE]</span>' : '';
        
        let html = `
            <h4 style="margin-top:0; color:var(--text-main); font-size:1.1rem; line-height:1.4;">
                <span style="color:var(--primary); font-weight:800; margin-right:8px;">Q${displayedIndex}.</span>
                ${qTypeLabel}
                ${q.text}
            </h4>
        `;
        
        if (q.questionType === 'descriptive') {
            const inputsContainer = document.createElement('div');
            inputsContainer.style.display = 'flex';
            inputsContainer.style.flexDirection = 'column';
            inputsContainer.style.gap = '10px';
            inputsContainer.style.marginTop = '15px';
            
            if (q.inputFields && q.inputFields.length > 0) {
                q.inputFields.forEach(label => {
                    const wrap = document.createElement('div');
                    const lbl = document.createElement('label');
                    lbl.innerText = label;
                    lbl.style.display = 'block';
                    lbl.style.fontSize = '0.85rem';
                    lbl.style.color = 'var(--text-muted)';
                    lbl.style.marginBottom = '4px';
                    
                    const inp = document.createElement('input');
                    inp.type = 'text';
                    inp.className = 'form-input';
                    inp.style.width = '100%';
                    inp.oninput = (e) => saveOngoingAnswer(q._id, label, e.target.value);
                    
                    wrap.appendChild(lbl);
                    wrap.appendChild(inp);
                    inputsContainer.appendChild(wrap);
                });
            } else {
                const txa = document.createElement('textarea');
                txa.className = 'form-input';
                txa.style.width = '100%';
                txa.rows = 4;
                txa.oninput = (e) => saveOngoingAnswer(q._id, 'default', e.target.value);
                inputsContainer.appendChild(txa);
            }
            
            qContainer.innerHTML = html;
            qContainer.appendChild(inputsContainer);
        } else {
            let optsHtml = `<div id="examOpts_${q._id}" style="display:flex; flex-direction:column; gap:10px; margin-top:15px;">`;
            (q.options || []).forEach((opt, oIdx) => {
                optsHtml += `
                    <label id="examOptLbl_${q._id}_${oIdx}" style="display:flex; align-items:center; gap:10px; padding:12px 16px; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; cursor:pointer; transition:all 0.2s;"
                           onmouseenter="this.style.background='rgba(99,102,241,0.1)'"
                           onmouseleave="if(!this.querySelector('input').checked) this.style.background='rgba(0,0,0,0.2)'">
                        <input type="radio" name="exam_q_${q._id}" value="${oIdx}" onclick="selectOngoingMcqAnswer('${q._id}', ${oIdx}, ${q.correctAnswerIndex})">
                        <span>${opt}</span>
                    </label>
                `;
            });
            optsHtml += `</div>`;
            qContainer.innerHTML = html + optsHtml;
        }
        
        list.appendChild(qContainer);
    });
}

function selectOngoingMcqAnswer(qId, selectedIdx, correctIdx) {
    saveOngoingAnswer(qId, 'mcq', selectedIdx);
    
    const container = document.getElementById(`examOpts_${qId}`);
    if (!container) return;
    
    container.style.pointerEvents = 'none';
    const radios = container.querySelectorAll('input[type="radio"]');
    radios.forEach(r => r.disabled = true);
    
    const labels = container.querySelectorAll('label');
    labels.forEach((lbl, idx) => {
        if (idx === correctIdx) {
            lbl.style.background = 'rgba(34, 197, 94, 0.15)';
            lbl.style.borderColor = 'rgba(34, 197, 94, 0.6)';
            lbl.style.color = '#4ade80';
        } else if (idx === selectedIdx && selectedIdx !== correctIdx) {
            lbl.style.background = 'rgba(239, 68, 68, 0.15)';
            lbl.style.borderColor = 'rgba(239, 68, 68, 0.6)';
            lbl.style.color = '#f87171';
        } else {
            lbl.style.opacity = '0.5';
        }
    });
}

function saveOngoingAnswer(qId, key, value) {
    if (!ongoingExamAnswers[qId]) {
        if (key === 'mcq' || key === 'default') {
            ongoingExamAnswers[qId] = value;
        } else {
            ongoingExamAnswers[qId] = { [key]: value };
        }
    } else {
        if (key === 'mcq' || key === 'default') {
            ongoingExamAnswers[qId] = value;
        } else {
            ongoingExamAnswers[qId][key] = value;
        }
    }
}

function startOngoingExamTimer(seconds) {
    clearInterval(ongoingExamTimerInterval);
    const display = document.getElementById('examTimerDisplay');
    
    display.style.color = '';
    display.parentElement.style.borderColor = '';
    display.parentElement.style.animation = '';
    
    ongoingExamTimerInterval = setInterval(() => {
        seconds--;
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        display.innerText = `${m}:${s}`;
        
        if (seconds <= 60) {
            display.style.color = '#ff4444';
            display.parentElement.style.borderColor = '#ff4444';
            display.parentElement.style.animation = 'pulseError 1s infinite';
        }
        
        if (seconds <= 0) {
            clearInterval(ongoingExamTimerInterval);
            if (ongoingExamPhase === 1) {
                alert("Time Over! Moving to Descriptive Section.");
                submitPhase1();
            } else {
                alert("Time Over, Submit");
                submitOngoingExam();
            }
        }
    }, 1000);
}

async function submitOngoingExam() {
    clearInterval(ongoingExamTimerInterval);
    lockUI('🚀 Submitting your exam...');
    try {
        const res = await fetch('/api/applicant/submit-exam', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: currentApplicant.email,
                name: (currentApplicant.firstName || '') + ' ' + (currentApplicant.lastName || ''),
                hq: currentApplicant.hq || 'Not Specified',
                division: currentApplicant.division || 'Not Specified',
                examDate: new Date().toISOString().split('T')[0],
                totalQuestions: ongoingExamQuestions.length,
                answers: ongoingExamAnswers
            })
        });
        const data = await res.json();
        if (data.success) {
            alert('Your exam has been submitted successfully! Your final result will be declared after the Admin reviews your Descriptive Assessment.');
            renderApplicantDashboard();
            updateView('applicantDashboard');
            document.getElementById('floatingExamTimer').style.display = 'none';
            document.getElementById('applicantExamBtn').classList.add('hidden');
        } else {
            alert(data.message || 'Failed to submit exam.');
        }
    } catch (e) {
        console.error(e);
        alert('Error submitting exam.');
    } finally {
        unlockUI();
    }
}



// --- APPLICANT SCOREBOARD & REVIEW LOGIC ---
let myScoresData = [];
let myScoresQuestions = [];

async function fetchMyExamScores() {
    if (!currentApplicant || !currentApplicant.email) return;
    
    try {
        const res = await fetch(`/api/applicant/my-scores/${currentApplicant.email}`);
        const data = await res.json();
        
        if (data.success) {
            myScoresData = data.exams;
            myScoresQuestions = data.questions;
            renderScoreboard();
        } else {
            const container = document.getElementById('scoreboardContainer');
            if (container) container.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 30px;">Failed to load scores: API returned an error.</div>';
        }
    } catch (e) {
        console.error("Error fetching scores:", e);
        const container = document.getElementById('scoreboardContainer');
        if (container) container.innerHTML = '<div style="text-align: center; color: #ef4444; padding: 30px;">Connection failed. Is the Node.js backend server running?</div>';
    }
}

function renderScoreboard() {
    const container = document.getElementById('scoreboardContainer');
    if (!container) return;
    
    if (myScoresData.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 30px; background: rgba(0,0,0,0.2); border-radius: 12px; border: 1px dashed var(--glass-border);">No past exams found.</div>';
        return;
    }
    
    // Group by Year/Month
    const groups = {};
    myScoresData.forEach(exam => {
        const d = new Date(exam.submittedAt);
        const yyyyMm = d.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groups[yyyyMm]) groups[yyyyMm] = [];
        groups[yyyyMm].push(exam);
    });
    
    let html = '';
    
    for (const [monthGroup, exams] of Object.entries(groups)) {
        html += `<div style="margin-bottom: 30px;">
            <h3 style="font-size: 1.2rem; color: var(--text-main); margin-bottom: 15px; padding-bottom: 8px; border-bottom: 1px solid var(--glass-border);">🗓️ ${monthGroup}</h3>
            <div style="display: grid; gap: 15px;">`;
            
        exams.forEach(exam => {
            const dStr = new Date(exam.submittedAt).toLocaleDateString();
            const isGraded = exam.status === 'graded';
            
            let scoreBlock = '';
            if (isGraded) {
                scoreBlock = `<div style="display: flex; gap: 20px; align-items: center;">
                    <div style="text-align: center;">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">MCQ</div>
                        <div style="font-weight: 700;">${exam.autoScore}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Desc</div>
                        <div style="font-weight: 700;">${exam.manualScore}</div>
                    </div>
                    <div style="text-align: center; padding: 5px 15px; background: rgba(99,102,241,0.15); border-radius: 20px; border: 1px solid rgba(99,102,241,0.3);">
                        <div style="font-size: 0.75rem; color: var(--text-muted);">Total</div>
                        <div style="font-weight: 800; color: #818cf8;">${exam.totalScore} / ${exam.totalQuestions}</div>
                    </div>
                </div>`;
            } else {
                scoreBlock = `<span style="padding: 4px 10px; background: rgba(234,179,8,0.1); border: 1px solid rgba(234,179,8,0.3); color: #facc15; border-radius: 12px; font-size: 0.8rem;">Pending Review</span>`;
            }
            
            html += `
                <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--glass-border); border-radius: 12px; padding: 15px 20px; display: flex; justify-content: space-between; align-items: center; transition: all 0.3s;"
                     onmouseover="this.style.background='rgba(255,255,255,0.06)'; this.style.borderColor='var(--primary)'"
                     onmouseout="this.style.background='rgba(255,255,255,0.03)'; this.style.borderColor='var(--glass-border)'">
                    
                    <div>
                        <div style="font-size: 1.1rem; font-weight: 600; color: white; margin-bottom: 4px;">${exam.testedProduct || 'General'}</div>
                        <div style="font-size: 0.8rem; color: var(--text-muted);">Submitted: ${dStr}</div>
                    </div>
                    
                    ${scoreBlock}
                    
                    <button class="btn btn-outline btn-sm" style="margin-left: 20px;" onclick="openReviewModal('${exam._id}')">View Details</button>
                </div>
            `;
        });
        
        html += `</div></div>`;
    }
    
    container.innerHTML = html;
}

function openReviewModal(examId) {
    const exam = myScoresData.find(e => e._id === examId);
    if (!exam) return;
    
    document.getElementById('reviewExamProduct').innerText = exam.testedProduct || 'General';
    document.getElementById('reviewMcqScore').innerText = exam.autoScore;
    document.getElementById('reviewDescScore').innerText = exam.status === 'graded' ? exam.manualScore : 'Pending';
    
    const list = document.getElementById('reviewExamAnswersList');
    list.innerHTML = '';
    
    // Display all answers (MCQ and Desc)
    for (const [qId, ans] of Object.entries(exam.answers || {})) {
        const q = myScoresQuestions.find(qu => qu._id === qId);
        if (q) {
            const wrap = document.createElement('div');
            wrap.style.background = 'rgba(0,0,0,0.2)';
            wrap.style.padding = '15px';
            wrap.style.borderRadius = '8px';
            wrap.style.border = '1px solid var(--glass-border)';
            
            let isCorrectHtml = '';
            let ansText = '';
            
            if (q.questionType === 'mcq') {
                const isCorrect = Number(ans) === q.correctAnswerIndex;
                isCorrectHtml = isCorrect 
                    ? '<span style="color: #4ade80; font-size: 0.8rem; font-weight: bold; margin-left: 10px;">[CORRECT]</span>'
                    : '<span style="color: #f87171; font-size: 0.8rem; font-weight: bold; margin-left: 10px;">[INCORRECT]</span>';
                
                ansText = q.options[Number(ans)] || 'Unknown';
            } else {
                isCorrectHtml = '<span style="color: #60a5fa; font-size: 0.8rem; font-weight: bold; margin-left: 10px;">[DESCRIPTIVE]</span>';
                if (typeof ans === 'object') {
                    ansText = Object.entries(ans).map(([k, v]) => `<strong>${k}:</strong> ${v}`).join('<br>');
                } else {
                    ansText = ans;
                }
            }
            
            wrap.innerHTML = `
                <div style="font-size: 0.95rem; color: var(--text-main); margin-bottom: 10px;">
                    <strong>Q: ${q.text}</strong> ${isCorrectHtml}
                </div>
                <div style="font-size: 0.9rem; color: #e2e8f0; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 6px; border-left: 3px solid #6366f1;">
                    ${ansText || '<em>No answer provided</em>'}
                </div>
            `;
            list.appendChild(wrap);
        }
    }
    
    document.getElementById('reviewExamModal').classList.remove('hidden');
}

function closeReviewModal() {
    document.getElementById('reviewExamModal').classList.add('hidden');
}
