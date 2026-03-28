let currentStep = 1;
let isSaving = false; // NAV GUARD

// --- SYSTEM MAINTENANCE ---
async function downloadDatabase() {
    try {
        lockUI("📥 Exporting Library...");
        const res = await fetch('/api/admin/system/export');
        const data = await res.blob();
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const date = new Date().toISOString().split('T')[0];
        a.download = `Emyris_Portal_Backup_${date}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        showToast("✅ Database export successful", "success");
    } catch (e) {
        showToast("❌ Export failed", "error");
    } finally {
        unlockUI();
    }
}

async function nukeDatabase() {
    const confirm1 = confirm("☢️ WARNING: This will PERMANENTLY delete all Applicant data and reset letter counters. Proceed?");
    if (!confirm1) return;
    
    const confirm2 = prompt("⚠️ NUCLEAR SAFETY CHECK: Type 'DELETE ALL' to confirm the total wipe.");
    if (confirm2 !== "DELETE ALL") {
        showToast("❌ Clear cancelled. Safety check failed.", "error");
        return;
    }

    try {
        lockUI("☢️ Nuking Database... Please Wait");
        const res = await fetch('/api/admin/system/clear', { method: 'POST' });
        const json = await res.json();
        if (json.success) {
            showToast("✅ Database cleared successfully", "success");
            await fetchCompanyData();
            await fetchApplicants(); 
            switchAdminTab('profile'); 
        }
    } catch (e) {
        showToast("❌ System wipe failed", "error");
    } finally {
        unlockUI();
    }
}

// Toggle UI Lock while saving/uploading
function lockUI(msg = "⚙️ Processing... Please Wait") {
    isSaving = true;
    const overlay = document.getElementById('processingOverlay');
    if (overlay) {
        document.getElementById('processingText').innerText = msg;
        overlay.classList.remove('hidden');
    }
    document.querySelectorAll('.admin-nav button').forEach(b => b.classList.add('nav-locked'));
}

function unlockUI() {
    isSaving = false;
    const overlay = document.getElementById('processingOverlay');
    if (overlay) overlay.classList.add('hidden');
    document.querySelectorAll('.admin-nav button').forEach(b => b.classList.remove('nav-locked'));
}

// Navigation Guard
window.onbeforeunload = function() {
    if (isSaving) return "Changes you made may not be saved.";
};

let companyData = {
    name: "EMYRIS BIOLIFESCIENCES PVT LTD.",
    address: "",
    phone: "",
    tollFree: "",
    website: "",
    logo: ""
};

let currentApplicant = null; // Stores logged-in applicant data
let allApplicants = []; // For Admin View

// Initial Setup
window.addEventListener('DOMContentLoaded', async () => {
    await fetchCompanyData();
    updateView('landingPage');
    initBackgroundAnimations();
    initFileListeners();
    initSetupListeners(); // New: FY Ref Preview
});

function initSetupListeners() {
    ['fyFrom', 'fyTo', 'letterCounterStart'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', updateRefPreview);
    });
}

// Show live image & file name on label when user picks a file
function initFileListeners() {
    const fileMap = {
        compLogoInput: { status: 'logoStatus', preview: 'logoPreview' },
        compStampInput: { status: 'stampStatus', preview: 'stampPreview' },
        compSigInput: { status: 'sigStatus', preview: 'sigPreview' },
        letterheadInput: { status: 'letterheadStatus', preview: 'letterheadPreview' },
        sidebarStampInput: { status: 'sidebarStampStatus', preview: 'sidebarStampPreview' },
        mobileTemplateInput: { status: 'mobileStatus' },
        tadaTemplateInput: { status: 'tadaStatus' }
    };
    for (const [inputId, config] of Object.entries(fileMap)) {
        const el = document.getElementById(inputId);
        if (el) el.addEventListener('change', () => {
            const label = document.getElementById(config.status);
            const files = el.files;
            if (label && files.length > 0) {
                label.innerText = files.length === 1 ? `✅ ${files[0].name.substring(0, 15)}` : `✅ ${files.length} Files Selected`;
                label.style.color = 'var(--success)';
                
                // Show preview if image (first one)
                if (config.preview && files[0].type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const img = document.getElementById(config.preview);
                        if (img) { img.src = e.target.result; img.classList.remove('hidden'); }
                    };
                    reader.readAsDataURL(files[0]);
                }
            }
        });
    }
}

async function fetchCompanyData() {
    try {
        const response = await fetch('/api/company-profile');
        const data = await response.json();
        if (data && data.name) companyData = data;
    } catch (error) { console.error('Error fetching company data:', error); }
    applyCompanyData();
}

function initBackgroundAnimations() {
    gsap.to(".blob-1", { x: '+=50', y: '+=30', duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".blob-2", { x: '-=40', y: '+=60', duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });
}

function applyCompanyData() {
    document.getElementById('displayCompanyName').innerText = companyData.name;
    const logoImg = document.getElementById('displayLogo');
    if (companyData.logo && companyData.logo.length > 0) {
        logoImg.src = companyData.logo[companyData.logo.length - 1].data; // Use .data
        logoImg.classList.remove('hidden');
    }
    const quickContact = document.getElementById('quickContact');
    quickContact.innerHTML = `
        ${companyData.phone ? `<div>📞 <a href="tel:${companyData.phone}" class="contact-link">${companyData.phone}</a></div>` : ''}
        ${companyData.tollFree ? `<div>☎️ Toll Free: <a href="tel:${companyData.tollFree}" class="contact-link">${companyData.tollFree}</a></div>` : ''}
        ${companyData.website ? `<div>🌐 <a href="${companyData.website}" target="_blank" class="contact-link">${companyData.website.replace('https://', '')}</a></div>` : ''}
    `;
    const headerTitle = document.getElementById('headerCompName');
    if (headerTitle) headerTitle.innerText = companyData.name;

    // Dynamic header logo icon
    const headerImg = document.getElementById('headerLogoImg');
    const headerLetter = document.getElementById('headerLogoLetter');
    if (companyData.logo && companyData.logo.length > 0 && headerImg) {
        headerImg.src = companyData.logo[companyData.logo.length - 1];
        headerImg.classList.remove('hidden');
        if (headerLetter) headerLetter.style.display = 'none';
    } else if (headerLetter) {
        // Use first letter of each word (max 2)
        const initials = (companyData.name || 'E').split(' ').filter(Boolean).slice(0,2).map(w => w[0]).join('');
        headerLetter.innerText = initials;
        headerLetter.style.display = 'inline';
        if (headerImg) headerImg.classList.add('hidden');
    }
}

function updateView(viewId) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
        s.classList.remove('active');
    });
    const activeSection = document.getElementById(viewId);
    activeSection.classList.remove('hidden');
    activeSection.style.display = 'block';
    activeSection.classList.add('active');
    
    if (['landingPage', 'adminLogin', 'adminDashboard', 'applicantRegister', 'applicantLogin'].includes(viewId)) {
        document.body.classList.add('onboarding-inactive');
    } else {
        document.body.classList.remove('onboarding-inactive');
    }
    gsap.fromTo(activeSection, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
}

function backToLanding() { updateView('landingPage'); }
function showAdminLogin() { updateView('adminLogin'); }

// --- APPLICANT AUTH ---

function showApplicantRegister() { updateView('applicantRegister'); }
function showApplicantLogin() { updateView('applicantLogin'); }

async function handleApplicantRegister(e) {
    e.preventDefault();
    const data = {
        fullName: document.getElementById('regName').value,
        email: document.getElementById('regEmail').value,
        phone: document.getElementById('regPhone').value
    };

    try {
        const res = await fetch('/api/register-applicant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            alert("Registration Successful! Please check your email for your 6-digit Login PIN.");
            updateView('applicantLogin');
        } else {
            alert(result.message);
        }
    } catch (err) { alert("Server error during registration."); }
}

async function handleApplicantLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPin').value;

    try {
        const res = await fetch('/api/applicant-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const result = await res.json();
        if (result.success) {
            currentApplicant = result.applicant;
            resumeApplication();
        } else {
            alert(result.message);
        }
    } catch (err) { alert("Login failed. Check connection."); }
}

function resumeApplication() {
    updateView('welcome');
    if (currentApplicant.formData) {
        const form = document.getElementById('onboardingForm');
        for (const [key, value] of Object.entries(currentApplicant.formData)) {
            const field = form.elements[key];
            if (field) {
                if (field.type === 'radio') {
                    if (field.value === value) field.checked = true;
                } else {
                    field.value = value;
                }
            }
        }
        // Trigger category change logic if exist
        const cat = currentApplicant.formData.category;
        if (cat) {
            const expFields = document.querySelectorAll('.exp-only');
            if (cat === 'experienced') expFields.forEach(f => f.classList.remove('hidden'));
        }
    }
}

async function saveDraft() {
    if (!currentApplicant) return;
    const form = document.getElementById('onboardingForm');
    const formData = Object.fromEntries(new FormData(form).entries());
    
    try {
        await fetch('/api/save-draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email, formData })
        });
    } catch (err) { console.warn("Auto-save failed."); }
}

// --- ONBOARDING FLOW ---

function nextStep(step) {
    if (step === 1 && document.getElementById('welcome').classList.contains('active')) {
        updateView('onboardingForm');
        document.getElementById('onboardingForm').classList.remove('hidden');
        document.getElementById('onboardingForm').style.display = 'block';
        updateProgress(1);
        return;
    }

    const currentSection = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    const inputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 2000);
        }
    });

    if (!isValid) return alert("Please fill all required fields.");

    saveDraft(); // Sync to DB

    gsap.to(currentSection, { opacity: 0, x: -50, filter: 'blur(10px)', duration: 0.4, onComplete: () => {
        currentSection.classList.add('hidden');
        currentSection.classList.remove('active');
        currentStep = step;
        const nextSection = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        nextSection.classList.remove('hidden');
        gsap.fromTo(nextSection, { opacity: 0, x: 50 }, { opacity: 1, x: 0, duration: 0.5, onComplete: () => {
            nextSection.classList.add('active');
            updateProgress(currentStep);
        }});
    }});
}

function prevStep(step) {
    const currentSection = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    saveDraft();
    gsap.to(currentSection, { opacity: 0, x: 50, duration: 0.4, onComplete: () => {
        currentSection.classList.add('hidden');
        currentSection.classList.remove('active');
        currentStep = step;
        const prevSection = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        prevSection.classList.remove('hidden');
        gsap.fromTo(prevSection, { opacity: 0, x: -50 }, { opacity: 1, x: 0, duration: 0.5, onComplete: () => {
            prevSection.classList.add('active');
            updateProgress(currentStep);
        }});
    }});
}

function updateProgress(step) {
    document.querySelectorAll('.step').forEach((s, i) => {
        const n = parseInt(s.dataset.step);
        s.classList.toggle('active', n === step);
        s.classList.toggle('completed', n < step);
    });
    document.querySelectorAll('.step-line').forEach((l, i) => l.classList.toggle('active', i < step - 1));
}

function showReview() {
    const form = document.getElementById('onboardingForm');
    const formData = new FormData(form);
    const reviewContent = document.getElementById('reviewContent');
    reviewContent.innerHTML = '';

    const groups = {
        "Personal": ["firstName", "lastName", "dob", "gender", "bloodGroup", "fatherName"],
        "Employment": ["designation", "joiningDate", "salary", "hq"],
        "Contact": ["phone", "address", "city", "state", "pin"],
        "Bank": ["bankName", "accNo", "ifsc"]
    };

    for (const [name, fields] of Object.entries(groups)) {
        let items = fields.map(f => {
            const val = formData.get(f) || "N/A";
            return `<div class="review-item"><span class="review-label">${f}</span><span class="review-value">${val}</span></div>`;
        }).join('');
        reviewContent.innerHTML += `<div class="review-section-group"><h4>${name}</h4><div class="review-grid">${items}</div></div>`;
    }
    nextStep(6);
}

// --- ADMIN PANEL ---

async function handleAdminLogin() {
    const username = document.getElementById('adminId').value;
    const password = document.getElementById('adminPass').value;
    const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    if ((await res.json()).success) {
        updateView('adminDashboard');
        switchAdminTab('profile');
    } else alert("Invalid Admin Credentials");
}

function logoutAdmin() {
    updateView('landingPage');
}

async function saveCompanyProfile(e) {
    e.preventDefault();
    lockUI("Saving Profile...");
    const formData = new FormData(e.target);
    const rawData = Object.fromEntries(formData.entries());
    
    // Base data
    const data = {
        name: rawData.compName,
        website: rawData.compWeb,
        phone: rawData.compPhone,
        tollFree: rawData.compTollFree,
        address: rawData.compAddress
    };
    
    // Helper to read multiple files as Base64 with NAMING PROMPT
    const readFiles = (id) => {
        return new Promise(async (resolve) => {
            const el = document.getElementById(id);
            if (!el || !el.files.length) return resolve([]);
            
            const results = [];
            for (let i = 0; i < el.files.length; i++) {
                const f = el.files[i];
                const assetName = prompt(`Enter a display name for this file:`, f.name.split('.')[0]) || f.name;
                const res = await new Promise((resFile) => {
                    const reader = new FileReader();
                    reader.onload = (event) => resFile(event.target.result);
                    reader.readAsDataURL(f);
                });
                results.push({ name: assetName, data: res });
            }
            resolve(results);
        });
    };

    const logos = await readFiles('compLogoInput');
    const stamps = await readFiles('compStampInput');
    const sigs = await readFiles('compSigInput');
    const lh = await readFiles('letterheadInput');
    const mobile = await readFiles('mobileTemplateInput');
    const tada = await readFiles('tadaTemplateInput');

    // Merge logic: Add to existing gallery, limit to 10
    const merge = (key, newFiles) => {
        const existing = companyData[key] || [];
        const merged = [...existing, ...newFiles];
        return merged.slice(-10); // Keep latest 10
    };

    if (logos.length) data.logo = merge('logo', logos);
    if (stamps.length) data.stamp = merge('stamp', stamps);
    if (sigs.length) data.digitalSignature = merge('digitalSignature', sigs);
    if (lh.length) data.letterheadImage = merge('letterheadImage', lh);
    if (mobile.length) data.mobileAppTemplate = merge('mobileAppTemplate', mobile);
    if (tada.length) data.tadaTemplate = merge('tadaTemplate', tada);

    await submitProfileUpdate(data);
}

async function submitProfileUpdate(data, silent = false) {
    if (!silent) lockUI("💾 Saving Changes...");
    try {
        const res = await fetch('/api/company-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            showToast('✅ Configuration Updated Successfully!', 'success');
            await fetchCompanyData();
            // Re-populate this tab to show status
            await loadSetupData(); 
        } else {
            showToast('❌ Save failed. Please try again.', 'error');
        }
    } catch (err) { 
        console.error("Save error:", err);
        showToast('❌ Connection error. Save failed.', 'error'); 
    } finally { 
        if (typeof isSaving !== 'undefined') isSaving = false;
        if (!silent) unlockUI(); 
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toastNotif');
    toast.textContent = message;
    toast.className = `show ${type}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = ''; }, 3500);
}

function switchAdminTab(tab) {
    if (isSaving) {
        showToast("⚠️ Please wait until the current save is completed.", "error");
        return;
    }
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    // Find the button with the correct click handler
    const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(`'${tab}'`));
    if (btn) btn.classList.add('active');
    
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
    
    if (tab === 'profile') {
        document.getElementById('adminProfileTab').classList.remove('hidden');
        const f = document.getElementById('companyProfileForm');
        f.compName.value = companyData.name;
        f.compWeb.value = companyData.website || '';
        f.compPhone.value = companyData.phone || '';
        f.compTollFree.value = companyData.tollFree || '';
        f.compAddress.value = companyData.address || '';

        // Update ALL asset statuses
        const updateStatus = (id, val, label) => {
            const el = document.getElementById(id);
            if (!el) return;
            if (val) {
                el.innerText = `✅ ${label || 'Uploaded'}`;
                el.style.color = 'var(--success)';
            } else {
                el.innerText = label ? `Upload ${label}` : 'Upload';
                el.style.color = 'var(--text-muted)';
            }
        };
        updateStatus('logoStatus',   companyData.logo?.length,               'Logo');
        updateStatus('stampStatus',  companyData.stamp?.length,              'Stamp');
        updateStatus('sigStatus',    companyData.digitalSignature?.length,   'Signature');
        updateStatus('letterheadStatus', companyData.letterheadImage?.length, 'Letterhead');
        updateStatus('mobileStatus', companyData.mobileAppTemplate?.length,  'Files');
        updateStatus('tadaStatus',   companyData.tadaTemplate?.length,       'Files');

        // Logo Previews (Show the latest one's data)
        const setPreview = (id, arr) => {
            const img = document.getElementById(id);
            if (img && arr && arr.length) {
                img.src = arr[arr.length - 1].data; // Use .data
                img.classList.remove('hidden');
            } else if (img) {
                img.classList.add('hidden');
                img.src = '';
            }
        };
        setPreview('logoPreview', companyData.logo);
        setPreview('stampPreview', companyData.stamp);
        setPreview('sigPreview', companyData.digitalSignature);
        setPreview('letterheadPreview', companyData.letterheadImage);
    } else if (tab === 'setup') {
        document.getElementById('adminSetupTab').classList.remove('hidden');
        loadSetupData();
    } else if (tab === 'gallery') {
        document.getElementById('adminGalleryTab').classList.remove('hidden');
        renderGallery();
    } else {
        document.getElementById('adminApplicantsTab').classList.remove('hidden');
        fetchApplicants();
    }
}

async function fetchApplicants() {
    const res = await fetch('/api/admin/applicants');
    allApplicants = await res.json();
    calculateStats(allApplicants);
    renderApplicantsTable(allApplicants);
}

function calculateStats(applicants) {
    const total = applicants.length;
    const pending = applicants.filter(a => a.status === 'submitted').length;
    const recentlyApproved = applicants.filter(a => {
        if (a.status !== 'approved' || !a.approvedAt) return false;
        const days = (Date.now() - new Date(a.approvedAt)) / (1000 * 60 * 60 * 24);
        return days <= 7;
    }).length;

    animateCounter('stat_total', total);
    animateCounter('stat_pending', pending);
    animateCounter('stat_approved', recentlyApproved);
}

function animateCounter(id, value) {
    const el = document.getElementById(id);
    const curr = parseInt(el.innerText) || 0;
    const obj = { val: curr };
    gsap.to(obj, {
        val: value,
        duration: 1.5,
        ease: "power2.out",
        onUpdate: () => {
            el.innerText = Math.floor(obj.val);
        }
    });
}

function renderApplicantsTable(data) {
    const body = document.getElementById('applicantsTableBody');
    body.innerHTML = data.map(app => {
        const t = app.tasks || {};
        const pipelineIcons = `
            <div class="pipeline-row">
                <span class="p-icon ${t.offerLetter ? 'done' : ''}" title="Offer Letter">📄</span>
                <span class="p-icon ${t.appointmentLetter ? 'done' : ''}" title="Appt Letter">📜</span>
                <span class="p-icon ${t.appLinkSent ? 'done' : ''}" title="App Link">📱</span>
                <span class="p-icon ${t.loginDetailsSent ? 'done' : ''}" title="Login ID">🔑</span>
            </div>
        `;

        let actionButtons = '';
        if (app.status === 'submitted') {
            actionButtons = `
                <button class="btn-action success" onclick="updateStatus('${app.email}', 'approved')" title="Approve">✓</button>
                <button class="btn-action error" onclick="updateStatus('${app.email}', 'rejected')" title="Reject">✕</button>
            `;
        } else if (app.status === 'approved') {
            actionButtons = `
                <button class="btn-action warning" onclick="openWorkflow('${app.email}')" title="Workflow Settings">⚙️</button>
            `;
        } else {
            actionButtons = `<button class="btn-action primary" onclick="openWorkflow('${app.email}')" title="View Record">👁️</button>`;
        }

        return `
            <tr>
                <td>${new Date(app.registeredAt).toLocaleDateString()}</td>
                <td><strong>${app.fullName}</strong></td>
                <td>${app.email}</td>
                <td><span class="badge ${app.status}">${app.status}</span></td>
                <td>${app.canLogin ? '✅ Active' : '🔒 Locked'}</td>
                <td>${pipelineIcons}</td>
                <td class="action-flex">
                    ${actionButtons}
                </td>
            </tr>
        `;
    }).join('');
}

async function toggleAccess(email, canLogin) {
    await fetch('/api/admin/toggle-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, canLogin })
    });
    fetchApplicants();
}

async function updateStatus(email, status) {
    if (!confirm(`Mark application as ${status.toUpperCase()}? This will lock the applicant's account.`)) return;
    await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, status })
    });
    fetchApplicants();
}

function filterApplicants() {
    const term = document.getElementById('applicantSearch').value.toLowerCase();
    const filtered = allApplicants.filter(a => a.email.toLowerCase().includes(term) || a.fullName.toLowerCase().includes(term));
    renderApplicantsTable(filtered);
}

// --- WORKFLOW LOGIC ---

let activeWfEmail = null;

async function openWorkflow(email) {
    activeWfEmail = email;
    const app = allApplicants.find(a => a.email === email);
    if (!app) return;

    document.getElementById('wfName').innerText = app.fullName;
    document.getElementById('wfEmail').innerText = app.email;
    
    // Assign Panel sync
    const divSelect = document.getElementById('wfDivisionSelect');
    await fetchDivisionsToDropdown(divSelect);
    divSelect.value = app.division || "";
    document.getElementById('wfReportingTo').value = app.reportingTo || "";
    document.getElementById('wfRefDisplay').innerText = app.refNo ? `Last Ref: ${app.refNo}` : "No Ref Generated Yet";

    // Sync Access Toggle Text
    const toggleBtn = document.getElementById('modalToggleAccess');
    toggleBtn.innerHTML = app.canLogin ? '<span>🔒</span> Lock Access' : '<span>🔓</span> Grant Access';
    toggleBtn.className = app.canLogin ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm';

    // Sync Task Status
    updateWfModalUI(app.tasks || {});
    
    document.getElementById('workflowModal').classList.remove('hidden');
    document.getElementById('workflowModal').style.display = 'flex';
}

async function fetchDivisionsToDropdown(selectEl) {
    const res = await fetch('/api/admin/divisions');
    const divisions = await res.json();
    selectEl.innerHTML = '<option value="">-- Select Division --</option>' + 
        divisions.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
}

async function saveWorkflowAssignment() {
    const data = {
        email: activeWfEmail,
        division: document.getElementById('wfDivisionSelect').value,
        reportingTo: document.getElementById('wfReportingTo').value
    };
    
    // Auto-generate Ref if not present
    const app = allApplicants.find(a => a.email === activeWfEmail);
    if (!app.refNo) {
        const refRes = await fetch('/api/admin/next-ref', { method: 'POST' });
        const refData = await refRes.json();
        if (refData.success) {
            data.refNo = refData.refNo;
            document.getElementById('wfRefDisplay').innerText = `Generated Ref: ${data.refNo}`;
        }
    }

    const res = await fetch('/api/admin/update-workflow-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    if ((await res.json()).success) {
        showToast("Workflow assignment saved!", "success");
        await fetchApplicants();
    }
}

async function toggleAccessFromModal() {
    const app = allApplicants.find(a => a.email === activeWfEmail);
    if (!app) return;
    await toggleAccess(activeWfEmail, !app.canLogin);
    openWorkflow(activeWfEmail); // Re-sync UI
}

function closeWorkflow() {
    document.getElementById('workflowModal').classList.add('hidden');
    document.getElementById('workflowModal').style.display = 'none';
}

function updateWfModalUI(tasks) {
    const setStatus = (id, done) => {
        const el = document.getElementById(id);
        el.innerText = done ? 'Completed ✅' : 'Pending ⏳';
        el.className = done ? 'completed' : 'pending';
    };

    setStatus('status_offer', !!tasks.offerLetter);
    setStatus('status_appt', !!tasks.appointmentLetter);
    setStatus('status_appLink', !!tasks.appLinkSent);
    setStatus('status_loginSent', !!tasks.loginDetailsSent);
}

async function handleTaskUpload(taskKey) {
    const fileInput = event.target;
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        await sendTaskUpdate(taskKey, base64);
    };
    reader.readAsDataURL(file);
}

async function toggleWfTask(taskKey) {
    const app = allApplicants.find(a => a.email === activeWfEmail);
    const currentValue = app.tasks ? !!app.tasks[taskKey] : false;
    await sendTaskUpdate(taskKey, !currentValue);
}

async function sendTaskUpdate(taskKey, value) {
    try {
        const res = await fetch('/api/admin/update-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: activeWfEmail, taskKey, value })
        });
        if ((await res.json()).success) {
            await fetchApplicants(); // Refresh list
            const app = allApplicants.find(a => a.email === activeWfEmail);
            updateWfModalUI(app.tasks || {});
        }
    } catch (err) { alert("Task update failed."); }
}

async function resetApplicantData() {
    if (!confirm("CRITICAL: Reset all submitted data for this applicant? This will allow them to re-fill the application.")) return;
    
    try {
        const res = await fetch('/api/admin/reset-applicant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: activeWfEmail })
        });
        if ((await res.json()).success) {
            alert("Applicant record reset successfully.");
            closeWorkflow();
            await fetchApplicants();
        }
    } catch (err) { alert("Reset failed."); }
}

// --- PDF GENERATION ---

// --- ASSET GALLERY ---
function renderGallery() {
    const grid = document.getElementById('assetGalleryGrid');
    const assetCategories = [
        { name: 'Logos', key: 'logo' },
        { name: 'Stamps', key: 'stamp' },
        { name: 'Signatures', key: 'digitalSignature' },
        { name: 'Letterheads', key: 'letterheadImage' },
        { name: 'Mobile App', key: 'mobileAppTemplate' },
        { name: 'TA/DA', key: 'tadaTemplate' }
    ];

    let html = '';
    assetCategories.forEach(cat => {
        const fileArr = companyData[cat.key] || [];
        fileArr.forEach((obj, idx) => {
            const val = obj.data;
            const isPdf = val && val.startsWith('data:application/pdf');
            const isImg = val && val.startsWith('data:image');
            
            html += `
                <div class="asset-card">
                    <button class="asset-delete-btn" onclick="deleteAsset('${cat.key}', '${obj._id}')" title="Delete Asset">×</button>
                    <div class="asset-card-preview">
                        ${isImg ? `<img src="${val}">` : (isPdf ? `<span class="pdf-icon">📄</span>` : '?')}
                    </div>
                    <div class="asset-card-body">
                        <span class="asset-card-name">${obj.name || cat.name + ' #' + (idx + 1)}</span>
                        <div class="asset-card-action">
                            <button class="btn-asset-view" onclick="viewAssetRaw('${val}')">${isImg ? '👁️ View' : '⬇️ Download'}</button>
                        </div>
                    </div>
                </div>
            `;
        });
    });

    grid.innerHTML = html || '<div class="setup-hint" style="grid-column: 1/-1; text-align: center;">No assets uploaded yet. Go to Company Profile to add files.</div>';
}

async function deleteAsset(category, assetId) {
    if (!confirm("Are you sure you want to PERMANENTLY delete this asset from the library?")) return;
    lockUI("🗑️ Deleting Asset...");
    try {
        const res = await fetch('/api/admin/delete-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ category, assetId })
        });
        if ((await res.json()).success) {
            showToast("🗑️ Asset deleted successfully", "success");
            await fetchCompanyData(); // Sync local state
            renderGallery(); // Re-render
            // Also refresh profile previews if on that tab
            if (!document.getElementById('adminProfileTab').classList.contains('hidden')) {
                switchAdminTab('profile');
            }
        }
    } catch (e) { showToast("❌ Delete failed", "error"); }
    finally { unlockUI(); }
}

function viewAssetRaw(val) {
    const win = window.open();
    win.document.write(`<iframe src="${val}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
}

// --- SETUP TAB LOGIC ---
async function loadSetupData() {
    if (!companyData || !companyData.name) await fetchCompanyData();
    populateDivisions();
    
    // Formatting & Typography
    const fields = {
        'signatoryName': companyData.signatoryName || "",
        'signatoryDesg': companyData.signatoryDesignation || "",
        'headerHeight': companyData.headerHeight || 65,
        'footerHeight': companyData.footerHeight || 25,
        'letterFontSize': companyData.letterFontSize || 11,
        'letterFontType': companyData.letterFontType || 'helvetica',
        'letterAlignment': companyData.letterAlignment || 'left',
        'offerLetterTemplate': companyData.offerLetterBody || "",
        'apptLetterTemplate': companyData.apptLetterBody || "",
        'fyFrom': companyData.fyFrom || "",
        'fyTo': companyData.fyTo || "",
        'letterCounterStart': companyData.letterCounter || 1001
    };

    for (const [id, val] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }
    
    updateRefPreview();
    
    // Letterhead Preview
    const lhStatus = document.getElementById('letterheadStatus');
    if (companyData.letterheadImage && companyData.letterheadImage.length > 0 && lhStatus) {
        lhStatus.innerText = "Letterhead Uploaded ✅";
        lhStatus.style.color = "var(--success)";
        const val = Array.isArray(companyData.letterheadImage) ? companyData.letterheadImage[companyData.letterheadImage.length - 1].data : companyData.letterheadImage;
        if (val && val.includes("data:image")) {
            const img = document.getElementById('letterheadPreview');
            if (img) { img.src = val; img.classList.remove('hidden'); }
        }
    }

    // Sidebar Stamp Preview
    const stStatus = document.getElementById('sidebarStampStatus');
    if (companyData.stamp && companyData.stamp.length > 0 && stStatus) {
        stStatus.innerText = "Stamp Uploaded ✅";
        stStatus.style.color = "var(--success)";
        const img = document.getElementById('sidebarStampPreview');
        if (img) { 
            img.src = companyData.stamp[companyData.stamp.length - 1].data; 
            img.classList.remove('hidden'); 
        }
    }
    
    syncEditorStyles();
    enableEditorTabSupport();
}

function enableEditorTabSupport() {
    document.querySelectorAll('.letter-editor').forEach(textarea => {
        textarea.onkeydown = function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = this.selectionStart;
                const end = this.selectionEnd;

                // Insert 4 spaces
                this.value = this.value.substring(0, start) + "    " + this.value.substring(end);

                // Put caret in right place
                this.selectionStart = this.selectionEnd = start + 4;
            }
        };
    });
}

function syncEditorStyles() {
    const size = document.getElementById('letterFontSize').value || 11;
    const type = document.getElementById('letterFontType').value || 'helvetica';
    const align = document.getElementById('letterAlignment').value || 'left';
    
    let fontStack = "'Courier New', monospace";
    if (type === 'times') fontStack = "'Times New Roman', Times, serif";
    else if (type === 'helvetica') fontStack = "'Plus Jakarta Sans', Arial, sans-serif";
    
    document.querySelectorAll('.letter-editor').forEach(el => {
        el.style.fontSize = `${size}pt`;
        el.style.fontFamily = fontStack;
        el.style.textAlign = align;
    });
}

async function populateDivisions() {
    const res = await fetch('/api/admin/divisions');
    const divisions = await res.json();
    const list = document.getElementById('divisionList');
    list.innerHTML = divisions.map(d => `
        <div class="division-chip">
            ${d.name}
            <button onclick="deleteDivision('${d._id}')">&times;</button>
        </div>
    `).join('');
}

async function addDivision() {
    const name = document.getElementById('newDivisionInput').value;
    if (!name) return;
    await fetch('/api/admin/divisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    document.getElementById('newDivisionInput').value = "";
    populateDivisions();
}

async function deleteDivision(id) {
    if (!confirm("Remove this division?")) return;
    await fetch(`/api/admin/divisions/${id}`, { method: 'DELETE' });
    populateDivisions();
}

function updateRefPreview() {
    const counterEl = document.getElementById('letterCounterStart');
    const fromEl = document.getElementById('fyFrom');
    const toEl = document.getElementById('toFrom'); // Wait, should be 'fyTo'
    
    const counter = counterEl ? counterEl.value : 1001;
    const from = fromEl ? fromEl.value : "";
    const to = document.getElementById('fyTo') ? document.getElementById('fyTo').value : "";
    
    let fyCode = "25-26";
    if (from && to) {
        fyCode = `${from.split('-')[0].slice(2)}-${to.split('-')[0].slice(2)}`;
    }
    const previewEl = document.getElementById('refPreview');
    if (previewEl) previewEl.innerText = `REF/${counter}/${fyCode}`;
}

async function saveFYSettings() {
    const data = {
        fyFrom: document.getElementById('fyFrom').value,
        fyTo: document.getElementById('fyTo').value,
        letterCounterStart: parseInt(document.getElementById('letterCounterStart').value) || 1001
    };
    // If resetting FY, also reset current counter to start
    data.letterCounter = data.letterCounterStart;
    
    await submitProfileUpdate(data);
    loadSetupData();
}

function injectDummyApplicant() {
    const dummy = {
        fullName: "SMRUTI RANJAN DASH",
        email: "test@dummy.com",
        refNo: `REF/${companyData.letterCounter || 1001}/${new Date().getFullYear().toString().slice(-2)}-${(new Date().getFullYear()+1).toString().slice(-2)}`,
        division: "CRITIZA",
        reportingTo: "MR. ASHOK KUMAR (VP SALES)",
        formData: {
            firstName: "SMRUTI",
            lastName: "DASH",
            gender: "male",
            address: "PLOT NO-42, CHANDRASEKHARPUR",
            city: "BHUBANESWAR",
            state: "ODISHA",
            pin: "751024",
            designation: "PRODUCT MANAGER",
            hq: "BHUBANESWAR",
            salary: "70833", // Approx 8.5L CTC
            joiningDate: new Date().toISOString().split('T')[0]
        }
    };
    
    const original = [...allApplicants];
    allApplicants.push(dummy);
    
    showToast("🧪 Generating High-Fidelity Test Offer Letter...", "success");
    downloadLetter("test@dummy.com", "offer").then(() => {
        allApplicants = original;
    });
}

async function convertPdfToPng(dataUri) {
    const loadingTask = pdfjsLib.getDocument(dataUri);
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // High-res scaling

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    await page.render({ canvasContext: context, viewport: viewport }).promise;
    return canvas.toDataURL('image/png');
}

// --- PERFORMANCE ENGINE: IMAGE OPTIMIZATION ---
function compressAndResize(file, maxWidth = 1800) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith('image/')) return resolve(null);
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = (maxWidth / width) * height;
                    width = maxWidth;
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL(file.type, 0.85); 
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// --- INSTANT DOCUMENT LAB: DB-FREE PREVIEW ---
async function previewTemporaryLetter(type) {
    const name = document.getElementById('labName').value || "SMRUTI DASH";
    const desg = document.getElementById('labDesg').value || "Product Manager";
    const salary = document.getElementById('labSalary').value || "75000";

    const mockApplicant = {
        fullName: name,
        firstName: name.split(' ')[0],
        email: "test@emyris.com",
        phone: "91XX XXX XXXX",
        division: "CRITIZA",
        reportingTo: "SR. ZONAL MANAGER",
        refNo: "REF/LAB/25-26",
        formData: {
            firstName: name.split(' ')[0],
            lastName: name.split(' ').slice(1).join(' '),
            designation: desg,
            hq: "Bhubaneswar",
            salary: salary,
            address: "Test Sector, Emyris Campus",
            city: "Bhubaneswar",
            state: "Odisha",
            pin: "751001"
        }
    };

    lockUI("⚖️ Generating Lab Preview...");
    try {
        const liveConfig = {
            headerHeight: parseInt(document.getElementById('headerHeight').value) || 65,
            footerHeight: parseInt(document.getElementById('footerHeight').value) || 25,
            letterFontSize: parseFloat(document.getElementById('letterFontSize').value) || 11,
            letterAlignment: document.getElementById('letterAlignment').value || 'left',
            letterFontType: document.getElementById('letterFontType').value || 'helvetica',
            signatoryName: document.getElementById('signatoryName').value,
            signatoryDesignation: document.getElementById('signatoryDesg').value
        };

        // Pickup UNSAVED images from UI for instant testing
        const lhFile = document.getElementById('letterheadInput').files[0];
        const stFile = document.getElementById('sidebarStampInput').files[0];
        
        if (lhFile) {
            const optLH = await compressAndResize(lhFile, 1800);
            liveConfig.letterheadImage = [{ name: 'temp_lh', data: optLH }];
        }
        if (stFile) {
            const optST = await compressAndResize(stFile, 800);
            liveConfig.stamp = [{ name: 'temp_st', data: optST }];
        }

        const originalConfig = { ...companyData };
        Object.assign(companyData, liveConfig);

        const originalApplicants = [...allApplicants];
        allApplicants.push(mockApplicant);
        
        const pdfData = await generateLetterPDF(mockApplicant.email, type);
        
        if (pdfData && pdfData.doc) {
            const safeName = name.replace(/[^a-z0-9]/gi, '_');
            savePDF(pdfData.doc, `${type.toUpperCase()}_SAMPLE_${safeName}.pdf`);
            showToast("✅ Lab Preview Downloaded", "success");
        } else {
            showToast("❌ Generation failed", "error");
        }
        
        companyData = originalConfig;
        allApplicants = originalApplicants;
    } catch (e) {
        console.error("Lab Generation Error:", e);
        showToast("❌ Lab Generation Failed", "error");
    } finally {
        unlockUI();
    }
}

async function saveSignatorySettings() {
    const btn = document.getElementById('saveSignatoryBtn');
    const originalText = btn.innerHTML;
    
    // Background Saving Feedback
    btn.innerHTML = "⌛ Saving...";
    btn.disabled = true;
    btn.style.opacity = "0.7";

    const data = {
        signatoryName: document.getElementById('signatoryName').value,
        signatoryDesignation: document.getElementById('signatoryDesg').value,
        headerHeight: parseInt(document.getElementById('headerHeight').value) || 65,
        footerHeight: parseInt(document.getElementById('footerHeight').value) || 25,
        letterFontSize: parseFloat(document.getElementById('letterFontSize').value) || 11,
        letterFontType: document.getElementById('letterFontType').value || 'helvetica',
        letterAlignment: document.getElementById('letterAlignment').value || 'left'
    };
    
    // Handle Sidebar File Uploads (Letterhead & Stamp)
    const lhFile = document.getElementById('letterheadInput').files[0];
    const stFile = document.getElementById('sidebarStampInput').files[0];
    
    try {
        if (lhFile) {
            const optLH = await compressAndResize(lhFile, 1800);
            data.letterheadImage = [{ name: lhFile.name.split('.')[0], data: optLH }]; 
        }
        if (stFile) {
            const optST = await compressAndResize(stFile, 800);
            data.stamp = [{ name: stFile.name.split('.')[0], data: optST }];
        }

        // Use Silent saving (No full-page lock)
        await submitProfileUpdate(data, true);
        
    } catch (err) {
        console.error("Sidebar save error:", err);
        showToast("❌ Save failed", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}

async function saveLetterTemplate(type) {
    const field = type === 'offer' ? 'offerLetterBody' : 'apptLetterBody';
    const val = document.getElementById(type + 'LetterTemplate').value;
    const data = {};
    data[field] = val;
    await submitProfileUpdate(data);
}


// --- SMART LETTER GENERATION ---
async function downloadLetter(email, type) {
    const pdfData = await generateLetterPDF(email, type);
    if (!pdfData) return;
    const safeEmail = email.replace(/[^a-z0-9]/gi, '_');
    savePDF(pdfData.doc, `${type.toUpperCase()}_LETTER_${safeEmail}.pdf`);
    
    // Mark task as done
    const taskKey = type === 'offer' ? 'offerLetter' : 'appointmentLetter';
    await sendTaskUpdate(taskKey, true);
}

async function emailLetter(email, type) {
    const btn = event.target;
    const originalText = btn.innerText;
    btn.innerText = "⌛ Sending...";
    btn.disabled = true;

    const pdfData = await generateLetterPDF(email, type);
    if (!pdfData) {
        btn.innerText = originalText;
        btn.disabled = false;
        return;
    }

    const pdfBase64 = pdfData.doc.output('datauristring');
    
    try {
        const res = await fetch('/api/admin/send-letter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, letterType: type, pdfBase64 })
        });
        if ((await res.json()).success) {
            showToast("📧 Letter emailed to candidate!", "success");
            const taskKey = type === 'offer' ? 'offerLetter' : 'appointmentLetter';
            await sendTaskUpdate(taskKey, true);
        } else {
            showToast("❌ Email failed.", "error");
        }
    } catch (e) { showToast("❌ Server error.", "error"); }
    
    btn.innerText = originalText;
    btn.disabled = false;
}

// Robust PDF Saving Trigger
function savePDF(doc, filename) {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

async function generateLetterPDF(email, type) {
    const app = allApplicants.find(a => a.email === email);
    if (!app || !app.formData) return alert("Applicant data missing.");
    if (!companyData.letterheadImage) return alert("Please upload Letterhead Strip in Setup first.");

    const template = type === 'offer' ? companyData.offerLetterBody : companyData.apptLetterBody;
    if (!template) return alert(`Please configure ${type} letter template in Setup first.`);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // PDF Config
    const PAGE_H = 297;
    const HEADER_H = companyData.headerHeight || 65; 
    const FOOTER_H = companyData.footerHeight || 25; 
    const FONT_SIZE = companyData.letterFontSize || 11;
    const FONT_TYPE = companyData.letterFontType || 'helvetica';
    const ALIGN = companyData.letterAlignment || 'left';

    const MARGIN_T = HEADER_H + 5; 
    const MARGIN_B = FOOTER_H + 5; 
    const MARGIN_L = 22;
    const MARGIN_R = 22;
    const USABLE_W = 210 - MARGIN_L - MARGIN_R; 
    const LINE_H = (FONT_SIZE * 0.58); 

    const refNo = app.refNo || "REF/PENDING";
    const todayDate = new Date().toLocaleDateString('en-GB');

    // Clean template: Remove placeholders if we are printing them in top-right
    let cleanedTemplate = template.split('{{REF_NO}}').join('').split('{{TODAY_DATE}}').join('');
    const mergedText = fillLetterPlaceholders(cleanedTemplate, app);
    
    let y = MARGIN_T;
    
    const drawPageExtras = () => {
        const lhArr = companyData.letterheadImage || [];
        if (lhArr.length) {
            const val = lhArr[lhArr.length - 1].data;
            doc.addImage(val, 'PNG', 0, 0, 210, 297);
        }
    };

    drawPageExtras();
    
    // Draw Ref No & Date in TOP RIGHT
    doc.setFont(FONT_TYPE, "bold");
    doc.setFontSize(FONT_SIZE);
    doc.text(`Ref: ${refNo}`, 188, y, { align: 'right' });
    y += LINE_H;
    doc.text(`Date: ${todayDate}`, 188, y, { align: 'right' });
    y += LINE_H * 2; // Extra gap after metadata

    // Split text into lines
    doc.setFont(FONT_TYPE, "normal");
    doc.setFontSize(FONT_SIZE);
    const lines = doc.splitTextToSize(mergedText, USABLE_W);
    
    lines.forEach((line, idx) => {
        if (y + LINE_H > PAGE_H - MARGIN_B) {
            doc.addPage();
            drawPageExtras();
            y = MARGIN_T;
        }
        
        let x = MARGIN_L;
        if (ALIGN === 'center') x = 105;
        else if (ALIGN === 'right') x = 188;
        
        doc.text(line, x, y, { align: ALIGN, maxWidth: USABLE_W });
        y += LINE_H;
    });

    // Signatory Logic
    if (y + 60 > PAGE_H - MARGIN_B) { doc.addPage(); drawPageExtras(); y = MARGIN_T; }
    y += 10;
    
    const stampArr = companyData.stamp || [];
    if (stampArr.length) doc.addImage(stampArr[stampArr.length - 1].data, 'PNG', MARGIN_L, y, 35, 35);
    
    const sigArr = companyData.digitalSignature || [];
    if (sigArr.length) doc.addImage(sigArr[sigArr.length - 1].data, 'PNG', 145, y + 10, 45, 20);
    
    y += 42;
    doc.setFont("helvetica", "bold");
    doc.text("Authorized Signatory", MARGIN_L, y);
    doc.text(companyData.signatoryName || "", 145, y);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(companyData.name, MARGIN_L, y + 5);
    doc.text(companyData.signatoryDesignation || "", 145, y + 5);

    return { doc };
}

function fillLetterPlaceholders(text, app) {
    const fd = app.formData || {};
    const placeholders = {
        "{{TODAY_DATE}}": new Date().toLocaleDateString('en-GB'),
        "{{REF_NO}}": app.refNo || "REF/PENDING",
        "{{TITLE}}": fd.gender === 'male' ? 'MR.' : 'MS.',
        "{{TITLE_SHORT}}": fd.gender === 'male' ? 'Mr.' : 'Ms.',
        "{{FULL_NAME}}": (app.fullName || "").toUpperCase(),
        "{{FIRST_NAME}}": (fd.firstName || "").toUpperCase(),
        "{{ADDRESS}}": (fd.address || ""),
        "{{CITY_STATE}}": `${fd.city || ""}, ${fd.state || ""}`.toUpperCase(),
        "{{PIN}}": fd.pin || "",
        "{{DESIGNATION}}": (fd.designation || "").toUpperCase(),
        "{{DIVISION}}": (app.division || "").toUpperCase(),
        "{{HQ}}": (fd.hq || "").toUpperCase(),
        "{{REPORTING_TO}}": (app.reportingTo || "").toUpperCase(),
        "{{SALARY_MONTHLY}}": Number(fd.salary || 0).toLocaleString('en-IN'),
        "{{SALARY_ANNUAL}}": (Number(fd.salary || 0) * 12).toLocaleString('en-IN'),
        "{{SALARY_WORDS}}": numberToWords(Number(fd.salary || 0)),
        "{{JOINING_DATE}}": formatDatePretty(fd.joiningDate),
        "{{COMPANY_NAME}}": companyData.name,
        "{{SIGNATORY_NAME}}": companyData.signatoryName || "",
        "{{SIGNATORY_DESG}}": companyData.signatoryDesignation || ""
    };

    let result = text;
    for (const [key, val] of Object.entries(placeholders)) {
        result = result.split(key).join(val);
    }
    return result;
}

function formatDatePretty(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    let suffix = 'th';
    if (day === 1 || day === 21 || day === 31) suffix = 'st';
    else if (day === 2 || day === 22) suffix = 'nd';
    else if (day === 3 || day === 23) suffix = 'rd';
    
    return `${day}${suffix} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function numberToWords(num) {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + " Only";
}

function downloadApplicantPDF(email) {
    const app = allApplicants.find(a => a.email === email);
    if (!app || !app.formData) return alert("No data found for this applicant.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    if (companyData.logo) {
        try {
            doc.addImage(companyData.logo, 'PNG', 15, 12, 40, 40);
        } catch(e) { console.warn("PDF Logo failed", e); }
    }

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(companyData.name || "Onboarding Record", 60, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`User Key: ${app.email}`, 60, 32);
    doc.text(`Status: ${app.status.toUpperCase()} | Generated: ${new Date().toLocaleString()}`, 60, 37);

    let y = 45;
    const sections = {
        "Personal Information": ["firstName", "lastName", "dob", "gender", "bloodGroup", "fatherName"],
        "Employment Details": ["designation", "joiningDate", "salary", "hq"],
        "Contact Information": ["phone", "address", "city", "state", "pin"],
        "Bank Details": ["bankName", "accNo", "ifsc"]
    };

    for (const [title, fields] of Object.entries(sections)) {
        const body = fields.map(f => [f.replace(/([A-Z])/g, ' $1').toUpperCase(), app.formData[f] || "N/A"]);
        
        doc.autoTable({
            startY: y,
            head: [[title, "Value"]],
            body: body,
            theme: 'striped',
            headStyles: { fillColor: [15, 23, 42] },
            margin: { left: 14, right: 14 }
        });
        y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : y) + 10;
        
        if (y > 270) { doc.addPage(); y = 20; }
    }

    const safeFileName = app.fullName.replace(/[^a-z0-9]/gi, '_');
    savePDF(doc, `${safeFileName}_Onboarding.pdf`);
}

// --- FORM SUBMISSION ---

document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!document.getElementById('agree').checked) return alert("Agree to declaration.");

    const submitBtn = e.target.querySelector('.btn-submit');
    submitBtn.innerText = "Finalizing...";
    submitBtn.disabled = true;

    const formData = Object.fromEntries(new FormData(e.target).entries());

    try {
        const response = await fetch('/api/submit-onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email, formData })
        });
        if ((await response.json()).success) {
            document.getElementById('appEmail').innerText = currentApplicant.email;
            updateView('successView');
        } else alert("Submission failed.");
    } catch (err) { alert("Server error."); }
});
