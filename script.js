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

async function initializeApp() {
    console.log('🚀 Applicant Portal initializing...');
    initBackgroundAnimations();
    await fetchCompanyData();
    
    // Check for existing session (optional, for now we just show landing)
    updateView('landingPage');
}

async function fetchCompanyData() {
    try {
        const res = await fetch('/api/company-data');
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
    document.getElementById('displayCompanyName').innerText = compName;
    document.getElementById('headerCompName').innerText = compName;
    
    if (companyData.logo) {
        const logoImg = document.getElementById('displayLogo');
        const headerLogoImg = document.getElementById('headerLogoImg');
        const fallback = document.getElementById('landingLogoFallback');
        const headerFallback = document.getElementById('headerLogoLetter');
        
        logoImg.src = companyData.logo;
        logoImg.classList.remove('hidden');
        headerLogoImg.src = companyData.logo;
        headerLogoImg.classList.remove('hidden');
        
        if (fallback) fallback.classList.add('hidden');
        if (headerFallback) headerFallback.classList.add('hidden');
    }

    // Populate Footer Contact (Sync with Admin Portal)
    const landingQuickContact = document.getElementById('landingQuickContact');
    if (landingQuickContact) {
        const contactHTML = `
            ${companyData.phone ? `<div>📞 <a href="tel:${companyData.phone}" class="contact-link">${companyData.phone}</a></div>` : ''}
            ${companyData.tollFree ? `<div>☎️ Toll Free: <a href="tel:${companyData.tollFree}" class="contact-link">${companyData.tollFree}</a></div>` : ''}
            ${companyData.website ? `<div>🌐 <a href="${companyData.website}" target="_blank" class="contact-link">${companyData.website.replace('https://', '')}</a></div>` : ''}
        `;
        landingQuickContact.innerHTML = contactHTML;
    }

    syncMarquee(companyData.marqueeText, companyData.marqueeColor, companyData.marqueeSpeed);
    populateDropdowns();
}

function populateDropdowns() {
    const divSel = document.getElementById('regDivision');
    const desSel = document.getElementById('regDesignation');
    const hqSel = document.getElementById('hq');

    if (divSel) {
        divSel.innerHTML = '<option value="">-- Select Division --</option>' +
            (companyData.divisions || []).map(d => `<option value="${d.name}">${d.name}</option>`).join('');
            
        divSel.onchange = (e) => {
            const divName = e.target.value;
            const div = (companyData.divisions || []).find(d => d.name === divName);
            const picker = document.getElementById('regDesignationPicker');
            const hiddenIn = document.getElementById('regDesignation');
            
            // Logic: If division has specific designations, show them. 
            // Otherwise, show all designations defined in company profile.
            let desgs = (div && div.designations && div.designations.length > 0) ? div.designations : (companyData.designations || []);
            
            if (desgs.length > 0 && picker) {
                // Group by Department for the visual strip
                const groups = {};
                desgs.forEach(ds => {
                    const dept = (typeof ds === 'object' ? ds.department : 'SALES') || 'SALES';
                    if (!groups[dept]) groups[dept] = [];
                    groups[dept].push(typeof ds === 'string' ? ds : ds.title);
                });

                picker.innerHTML = Object.keys(groups).map(dept => `
                    <div class="dept-strip" style="background: var(--accent); color: #000; font-size: 0.65rem; font-weight: 800; padding: 2px 8px; margin: 5px 0 2px 0; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.05em;">${dept}</div>
                    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                        ${groups[dept].map(title => `
                            <div class="picker-chip" onclick="selectRegDesignation('${title.replace(/'/g, "\\'")}', this)" 
                                 style="background: rgba(255,255,255,0.05); color: white; padding: 4px 10px; border-radius: 20px; font-size: 0.75rem; cursor: pointer; border: 1px solid rgba(255,255,255,0.1); transition: all 0.2s;">
                                ${title}
                            </div>
                        `).join('')}
                    </div>
                `).join('');
                hiddenIn.value = ""; // Reset
            } else if (divName && picker) {
                picker.innerHTML = '<p style="font-size: 0.75rem; color: #ef4444; text-align: center; margin: 10px 0;">⚠️ No designations available</p>';
                hiddenIn.value = "";
            } else if (picker) {
                picker.innerHTML = '<p style="font-size: 0.75rem; color: var(--text-muted); text-align: center; margin: 10px 0;">-- Select Division First --</p>';
                hiddenIn.value = "";
            }
        };
    }

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

function showApplicantRegister() { updateView('applicantRegister'); }
function showApplicantLogin() { updateView('applicantLogin'); }

async function handleApplicantRegister(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('regTitle').value,
        fullName: document.getElementById('regName').value,
        division: document.getElementById('regDivision').value,
        designation: document.getElementById('regDesignation').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value
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
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pin = document.getElementById('loginPin').value;

    try {
        lockUI("🔐 Verifying PIN...");
        const res = await fetch('/api/applicant-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pin })
        });
        const result = await res.json();
        if (result.success) {
            currentApplicant = result.applicant;
            resumeApplication();
        } else {
            showToast(result.message, "error");
        }
    } catch (err) {
        showToast("Login failed.", "error");
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

function resumeApplication() {
    if (['submitted', 'approved'].includes(currentApplicant.status) || currentApplicant.offerAccepted) {
        renderApplicantDashboard();
        updateView('applicantDashboard');
        return;
    }

    // New or Draft
    updateView('onboardingForm');
    currentStep = 1;
    
    // Crucial: Populate dropdowns so they have options before pre-filling
    populateDropdowns(); 
    
    renderStep(1);
    prefillForm();
    renderApplicantDocuments();
}

function prefillForm() {
    const form = document.getElementById('onboardingForm');
    if (!form) return;

    // 1. Prefill from root properties
    if (currentApplicant.title) document.getElementById('onboardingTitle').value = currentApplicant.title;
    
    const fullName = currentApplicant.fullName || "";
    const nameParts = fullName.split(' ');
    if (nameParts.length >= 1) document.getElementById('firstName').value = nameParts[0];
    if (nameParts.length >= 3) {
        document.getElementById('lastName').value = nameParts.pop();
        document.getElementById('middleName').value = nameParts.slice(1).join(' ');
    } else if (nameParts.length === 2) {
        document.getElementById('lastName').value = nameParts[1];
    }

    if (currentApplicant.phone) document.getElementById('phone').value = currentApplicant.phone;
    if (currentApplicant.hq) document.getElementById('hq').value = currentApplicant.hq;
    
    // 2. Prefill from formData
    if (currentApplicant.formData) {
        for (const [key, val] of Object.entries(currentApplicant.formData)) {
            const field = form.elements[key];
            if (field) {
                if (field.type === 'checkbox') field.checked = val;
                else field.value = val;
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
            { id: 'hq', label: 'HQ Preference' },
            { id: 'employeeType', label: 'Category' }
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
            let val = fd.get(f.id) || "N/A";
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
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; background: rgba(255, 255, 255, 0.03); border-radius: 12px; border: 1px solid ${has ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};">
                <span style="font-size: 0.85rem; color: white; font-weight: 500;">${dName}</span>
                <span style="font-size: 0.75rem; font-weight: bold; color: ${has ? 'var(--success)' : '#ef4444'}">
                    ${has ? `✅ ${catDocs.length} ${catDocs.length > 1 ? 'FILES' : 'FILE'}` : '⚠️ MISSING'}
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
            <label>${docName}${hasFiles ? '' : '*'}</label>
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

function renderApplicantDashboard() {
    const app = currentApplicant;
    document.getElementById('dash_fullName').innerText = app.fullName;
    document.getElementById('dash_email').innerText = app.email;
    document.getElementById('applicantAvatar').innerText = app.fullName[0].toUpperCase();
    
    const badge = document.getElementById('dash_statusBadge');
    badge.innerText = app.status.toUpperCase();
    badge.className = `badge ${app.status}`;

    // Timeline
    const timeline = document.getElementById('onboardingTimeline');
    const steps = [
        { label: 'Register', done: true },
        { label: 'Submit', done: !!app.submittedAt || ['submitted', 'approved'].includes(app.status) },
        { label: 'Verify', done: app.status === 'approved' || app.offerLetterData },
        { label: 'Offer', done: !!app.offerLetterData },
        { label: 'Accept', done: app.offerAccepted }
    ];
    timeline.innerHTML = steps.map((s, i) => `
        <div class="timeline-item ${s.done ? 'done' : ''}">
            <div class="timeline-dot">${s.done ? '✓' : i + 1}</div>
            <div class="timeline-label">${s.label}</div>
        </div>
    `).join('');

    // Document Status List
    const docsList = document.getElementById('dash_docsList');
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

    // Offer Section
    if (app.offerLetterData) {
        document.getElementById('offerLetterSection').classList.remove('hidden');
        document.getElementById('waitingStatusCard').classList.add('hidden');
        document.getElementById('offerPreviewer').innerHTML = app.offerLetterData;
        
        if (app.offerAccepted) {
            document.getElementById('acceptanceForm').classList.add('hidden');
            document.getElementById('offerAcceptedStatus').classList.remove('hidden');
            document.getElementById('confirmedJoiningDateText').innerText = formatDatePretty(app.actualJoiningDate);
        }
    } else {
        document.getElementById('offerLetterSection').classList.add('hidden');
        document.getElementById('waitingStatusCard').classList.remove('hidden');
    }

    // Appointment Section
    if (app.apptLetterData) {
        document.getElementById('appointmentLetterSection').classList.remove('hidden');
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

function toggleOfferPreview() {
    document.getElementById('offerPreviewer').classList.toggle('hidden');
}

async function downloadMyLetter(type) {
    // Basic implementation using jspdf if needed, or just redirect to API if available
    showToast("Generating PDF...");
    try {
        const container = document.getElementById(type === 'offer' ? 'offerPreviewer' : 'apptPreviewer');
        container.classList.remove('hidden');
        
        const canvas = await html2canvas(container, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${type}_letter_${currentApplicant.email}.pdf`);
        
        if (type === 'offer') container.classList.add('hidden');
    } catch (e) {
        showToast("PDF generation failed.", "error");
    }
}

// --- FINAL SUBMISSION ---

document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!document.getElementById('agree').checked) {
        showToast("Please agree to the declaration.", "warning");
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
