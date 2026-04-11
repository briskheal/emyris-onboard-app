let currentStep = 1;
let isSaving = false;
let companyData = { name: "", address: "", phone: "", tollFree: "", website: "", logo: "" };
let currentApplicant = null;
let allApplicants = [];
let activeV_Applicant = null;
let verificationChecks = {};
let activeUploads = 0;

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
    } catch (e) { showToast("❌ Export failed", "error"); }
    finally { unlockUI(); }
}

async function fetchDatabaseStats() {
    try {
        const res = await fetch('/api/admin/db-stats');
        const data = await res.json();
        if (data.success) {
            const summary = data.summary;
            const usedMB = (summary.totalStorageUsedBytes / (1024 * 1024)).toFixed(2);
            const bar = document.getElementById('storage_perc_bar');
            const percText = document.getElementById('storage_perc_text');
            const usedText = document.getElementById('storage_used_text');
            if (bar) bar.style.width = summary.usedPercentage + '%';
            if (percText) percText.innerText = summary.usedPercentage + '% Used';
            if (usedText) usedText.innerText = usedMB + ' MB';
            if (summary.usedPercentage > 85) bar.style.background = 'linear-gradient(90deg, #ef4444, #b91c1c)';
            else if (summary.usedPercentage > 60) bar.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        }
    } catch (e) { console.error("Stats fail:", e); }
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
        if ((await res.json()).success) {
            showToast("✅ Database cleared successfully", "success");
            await fetchCompanyData();
            if (typeof fetchApplicants === 'function') await fetchApplicants(); 
            if (typeof switchAdminTab === 'function') switchAdminTab('profile'); 
        }
    } catch (e) { showToast("❌ System wipe failed", "error"); }
    finally { unlockUI(); }
}

// --- UI HELPERS ---
function lockUI(msg = "⚙️ Processing... Please Wait") {
    isSaving = true;
    const overlay = document.getElementById('processingOverlay');
    if (overlay) {
        const text = document.getElementById('processingText');
        if (text) text.innerText = msg;
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

window.onbeforeunload = function() { if (isSaving) return "Changes you made may not be saved."; };

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', async () => {
    await fetchCompanyData();
    if (typeof updateView === 'function') updateView('landingPage');
    if (typeof initBackgroundAnimations === 'function') initBackgroundAnimations();
    initFileListeners();
});

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
        attachFileListener(inputId, config);
    }
}

function attachFileListener(inputId, config) {
    const el = document.getElementById(inputId);
    if (el) el.addEventListener('change', () => {
        const label = document.getElementById(config.status);
        const files = el.files;
        if (label && files.length > 0) {
            label.innerText = files.length === 1 ? `✅ ${files[0].name.substring(0, 15)}` : `✅ ${files.length} Files Selected`;
            label.style.color = 'var(--success)';
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

// --- COMPANY DATA ---
async function fetchCompanyData() {
    try {
        const response = await fetch('/api/company-profile');
        const data = await response.json();
        if (data && data.name) companyData = data;
    } catch (error) { console.error('Error fetching company data:', error); }
    applyCompanyData();
}

function initBackgroundAnimations() {
    if (typeof gsap !== 'undefined') {
        gsap.to(".blob-1", { x: '+=50', y: '+=30', duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".blob-2", { x: '-=40', y: '+=60', duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }
}

function applyCompanyData() {
    const dpName = document.getElementById('displayCompanyName');
    if (dpName) dpName.innerText = companyData.name;
    const logoImg = document.getElementById('displayLogo');
    if (companyData.logo && companyData.logo.length > 0 && logoImg) {
        logoImg.src = companyData.logo[companyData.logo.length - 1].data;
        logoImg.classList.remove('hidden');
    }
    const quickContact = document.getElementById('quickContact');
    if (quickContact) {
        quickContact.innerHTML = `
            ${companyData.phone ? `<div>📞 <a href="tel:${companyData.phone}" class="contact-link">${companyData.phone}</a></div>` : ''}
            ${companyData.tollFree ? `<div>☎️ Toll Free: <a href="tel:${companyData.tollFree}" class="contact-link">${companyData.tollFree}</a></div>` : ''}
            ${companyData.website ? `<div>🌐 <a href="${companyData.website}" target="_blank" class="contact-link">${companyData.website.replace('https://', '')}</a></div>` : ''}
        `;
    }
    const headerTitle = document.getElementById('headerCompName');
    if (headerTitle) headerTitle.innerText = (companyData.name || "").replace(/\s*PVT\s*LTD\.?\s*/gi, "").trim();

    const headerImg = document.getElementById('headerLogoImg');
    const headerLogoLetter = document.getElementById('headerLogoLetter');
    if (companyData.logo && companyData.logo.length > 0 && headerImg) {
        headerImg.src = companyData.logo[companyData.logo.length - 1].data;
        headerImg.classList.remove('hidden');
        if (headerLogoLetter) headerLogoLetter.style.display = 'none';
    } else if (headerLogoLetter) {
        const initials = companyData.name ? companyData.name.split(' ').filter(Boolean).slice(0,2).map(w => w[0]).join('') : 'E';
        headerLogoLetter.innerText = initials;
        headerLogoLetter.style.display = 'inline';
        if (headerImg) headerImg.classList.add('hidden');
    }
    if (typeof renderRequiredDocsChips === 'function') renderRequiredDocsChips();
    if (typeof renderRequiredDocsSuggestions === 'function') renderRequiredDocsSuggestions();
    if (typeof renderApplicantDocuments === 'function') renderApplicantDocuments();
    if (typeof loadSetupProfile === 'function') loadSetupProfile();
    
    // Populate Designation dropdown map
    const applicantDesg = document.getElementById('designation');
    const reportingToDesg = document.getElementById('v_reportingTo');
    const desgs = companyData.designations || [];
    
    if (applicantDesg) {
        applicantDesg.innerHTML = '<option value="" disabled selected>Select Designation</option>';
        desgs.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.innerText = d;
            applicantDesg.appendChild(opt);
        });
    }
    
    if (reportingToDesg && reportingToDesg.tagName === 'SELECT') {
        reportingToDesg.innerHTML = '<option value="">-- Select Reporting Manager --</option>';
        desgs.forEach(d => {
            const opt = document.createElement('option');
            opt.value = d;
            opt.innerText = d;
            reportingToDesg.appendChild(opt);
        });
    }

    if (typeof renderDesignationList === 'function') renderDesignationList();
}

// --- REQUIRED DOCUMENTS LOGIC ---
const STANDARD_DOCS = [
    "Aadhar Card - Front", "Aadhar Card - Back", "PAN Card", "Degree/Provisional Certificate",
    "Experience Letter - Previous Company", "Relieving Letter - Previous Company",
    "3 Months Pay Slips", "Bank Statement", "Passport Photo", "Medical Fitness Certificate"
];

function renderRequiredDocsChips() {
    const container = document.getElementById('requiredDocsContainer');
    const placeholder = document.getElementById('noDocsPlaceholder');
    if (!container) return;
    container.querySelectorAll('.division-chip').forEach(c => c.remove());
    const docs = companyData.requiredDocs || [];
    if (docs.length > 0) {
        if (placeholder) placeholder.style.display = 'none';
        docs.forEach(doc => {
            const chip = document.createElement('div');
            chip.className = 'division-chip';
            chip.style.background = 'var(--primary)';
            chip.innerHTML = `<span>${doc}</span><button type="button" onclick="toggleDocRequirement('${doc}')">×</button>`;
            container.appendChild(chip);
        });
    } else if (placeholder) placeholder.style.display = 'block';
}

function renderRequiredDocsSuggestions() {
    const container = document.getElementById('standardDocsSuggestions');
    if (!container) return;
    container.innerHTML = '';
    const selected = companyData.requiredDocs || [];
    STANDARD_DOCS.forEach(doc => {
        const isSelected = selected.includes(doc);
        const chip = document.createElement('div');
        chip.className = 'division-chip';
        chip.style.background = isSelected ? 'rgba(255,255,255,0.05)' : 'rgba(99, 102, 241, 0.15)';
        chip.style.opacity = isSelected ? '0.5' : '1';
        chip.innerHTML = `<span>${isSelected ? '✓ ' : '+ '}${doc}</span>`;
        if (!isSelected) chip.onclick = () => toggleDocRequirement(doc);
        container.appendChild(chip);
    });
}

function toggleDocRequirement(docName) {
    if (!companyData.requiredDocs) companyData.requiredDocs = [];
    const idx = companyData.requiredDocs.indexOf(docName);
    if (idx > -1) companyData.requiredDocs.splice(idx, 1);
    else companyData.requiredDocs.push(docName);
    renderRequiredDocsChips();
    renderRequiredDocsSuggestions();
}

function addCustomRequiredDoc() {
    const input = document.getElementById('customDocInput');
    const val = input.value?.trim();
    if (val) {
        if (!companyData.requiredDocs) companyData.requiredDocs = [];
        if (!companyData.requiredDocs.includes(val)) {
            companyData.requiredDocs.push(val);
            input.value = '';
            renderRequiredDocsChips();
            renderRequiredDocsSuggestions();
        }
    }
}

function renderApplicantDocuments() {
    const container = document.getElementById('dynamicTestimonialUploads');
    if (!container) return;
    container.innerHTML = '';
    const docs = companyData.requiredDocs || [];
    const existingDocs = currentApplicant?.documents || [];
    const getUpload = (name) => existingDocs.find(d => d.category === name);

    if (docs.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted); text-align: center; width:100%;">No specific documents required.</p>`;
    } else {
        docs.forEach(docName => {
            const safeId = docName.replace(/[^a-z0-9]/gi, '_');
            const upload = getUpload(docName);
            const box = document.createElement('div');
            box.className = 'upload-box';
            box.innerHTML = `
                <label>${docName}*</label>
                <div class="drop-zone" onclick="document.getElementById('file_${safeId}').click()">
                    <div class="progress-ribbon ${upload ? 'waiting' : ''}" id="ribbon_file_${safeId}" style="width: ${upload ? '100%' : '0%'}"></div>
                    <span class="drop-icon">${upload ? '✅' : '📎'}</span>
                    <span id="status_${safeId}" class="drop-label">${upload ? `${docName} Uploaded` : `Choose ${docName}`}</span>
                    <input type="file" id="file_${safeId}" class="hidden">
                </div>
            `;
            container.appendChild(box);
            attachApplicantFileListener(`file_${safeId}`, docName);
        });
    }
    const sigUpload = getUpload('Digital Signature');
    const sigBox = document.createElement('div');
    sigBox.className = 'upload-box';
    sigBox.innerHTML = `
        <label>Digital Signature (Photo)*</label>
        <div class="drop-zone" onclick="document.getElementById('file_Signature').click()">
            <div class="progress-ribbon ${sigUpload ? 'waiting' : ''}" id="ribbon_file_Signature" style="width: ${sigUpload ? '100%' : '0%'}"></div>
            <span class="drop-icon">${sigUpload ? '✍️ ✅' : '✍️'}</span>
            <span id="status_Signature" class="drop-label">${sigUpload ? 'Signature Saved' : 'Upload Sign'}</span>
            <input type="file" id="file_Signature" class="hidden">
        </div>
    `;
    if (container) container.appendChild(sigBox);
    attachApplicantFileListener(`file_Signature`, 'Digital Signature');
}

function attachApplicantFileListener(inputId, category) {
    const input = document.getElementById(inputId);
    if (!input) return;
    input.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const safeId = inputId.replace('file_', '');
        const label = document.getElementById(`status_${safeId}`);
        const ribbon = document.getElementById(`ribbon_${inputId}`);
        
        const fileSizeMB = file.size / (1024 * 1024);
        const isImage = file.type.startsWith('image/');
        const maxSizeMB = 12; // Synced with server 12MB limit

        if (fileSizeMB > maxSizeMB) {
            showToast(`❌ Too large. Max ${maxSizeMB}MB.`, "error");
            return;
        }

        if (label) label.innerText = `⏳ Uploading...`;
        if (ribbon) { 
            ribbon.classList.add('active'); 
            ribbon.style.width = '30%'; 
        }

        // Global Indicator ON
        activeUploads++;
        document.getElementById('globalUploadStatus').classList.add('show');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout (increased for slow connections)

        try {
            let fileData = isImage ? await compressAndResize(file, 1000) : await new Promise((res, rej) => {
                const r = new FileReader(); 
                r.onload = (ev) => res(ev.target.result); 
                r.onerror = rej; 
                r.readAsDataURL(file);
            });

            if (ribbon) ribbon.style.width = '60%';

            const res = await fetch('/api/applicant/upload-document', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentApplicant.email, category, fileName: file.name, fileData }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            const result = await res.json();

            if (result.success) {
                if (label) { 
                    label.innerText = `✅ ${category} Uploaded`; 
                    label.style.color = "var(--success)"; 
                }
                if (ribbon) { 
                    ribbon.classList.remove('active', 'waiting'); 
                    ribbon.style.width = '100%'; 
                    ribbon.style.background = 'linear-gradient(to right, #10b981, #34d399)';
                }
                
                if (!currentApplicant.documents) currentApplicant.documents = [];
                // Update local metadata (don't store the huge blob in memory if possible, but the backend now returns metadata)
                currentApplicant.documents = currentApplicant.documents.filter(d => d.category !== category);
                currentApplicant.documents.push({ 
                    category, 
                    name: file.name, 
                    uploadedAt: new Date(),
                    assetId: result.assetId // Backend will provide this
                });
                
                showToast(`✅ ${category} saved!`, "success");
            } else { 
                throw new Error(result.message || 'Server rejected upload'); 
            }
        } catch (err) {
            clearTimeout(timeoutId);
            console.error('Upload error:', err);
            const errMsg = err.name === 'AbortError' ? 'Upload timed out. Try a smaller file or better connection.' : err.message;
            
            if (label) { 
                label.innerText = `❌ ${errMsg.substring(0, 30)}...`; 
                label.style.color = "var(--error)"; 
            }
            if (ribbon) { 
                ribbon.classList.remove('active', 'waiting'); 
                ribbon.style.width = '0%'; 
            }
            showToast(`❌ Upload failed: ${errMsg}`, "error");
            input.value = '';
        } finally {
            activeUploads = Math.max(0, activeUploads - 1);
            if (activeUploads === 0) {
                document.getElementById('globalUploadStatus').classList.remove('show');
            }
        }
    });
}

function updateView(viewId) {
    const sections = document.querySelectorAll('.view-section');
    
    // 1. Hide everything first
    sections.forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
        s.classList.remove('active');
    });
    
    // 2. Perform scroll reset in the next frame to ensure DOM layout is updated
    requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    });
    
    const activeSection = document.getElementById(viewId);
    if (!activeSection) return;
    
    // 3. Show the new section
    activeSection.classList.remove('hidden');
    // Ensure display property matches its intended layout
    if (viewId === 'landingPage') {
        activeSection.style.display = 'flex';
    } else {
        activeSection.style.display = 'block';
    }
    activeSection.classList.add('active');
    
    // 4. Update body classes
    const majorViews = ['landingPage', 'adminLogin', 'adminDashboard', 'applicantRegister', 'applicantLogin', 'applicantVerificationView'];
    if (majorViews.includes(viewId)) {
        document.body.classList.add('onboarding-inactive');
    } else {
        document.body.classList.remove('onboarding-inactive');
    }
    
    // 5. Minimal GSAP entry
    gsap.fromTo(activeSection, 
        { opacity: 0, y: 15 }, 
        { 
            opacity: 1, 
            y: 0, 
            duration: 0.4, 
            ease: "power2.out", 
            clearProps: "all" 
        }
    );
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
        if (result.success || result.needsRecovery) {
            const pin = result.pin;
            alert(`✅ Registration Successful!\n\nYOUR LOGIN PIN: ${pin}\n\nPlease note this down now. We have also sent it to: ${data.email}`);
            document.getElementById('loginEmail').value = data.email;
            updateView('applicantLogin');
        } else {
            alert(`❌ Error: ${result.message}`);
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

async function handleForgotPin() {
    const email = document.getElementById('loginEmail').value;
    if (!email) {
        alert("Please enter your registered email address first.");
        return;
    }

    if (!confirm(`Should we resend the Login PIN to: ${email}?`)) return;

    try {
        lockUI("🔄 Resending PIN...");
        const res = await fetch('/api/resend-pin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const result = await res.json();
        alert(result.message);
    } catch (err) { 
        alert("Recovery failed. Check connection."); 
    } finally {
        unlockUI();
    }
}

function resumeApplication() {
    if (['approved', 'submitted'].includes(currentApplicant.status) || currentApplicant.offerAccepted) {
        renderApplicantDashboard();
        updateView('applicantDashboard');
        return;
    }

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
    }
    renderApplicantDocuments();
}

function renderApplicantDashboard() {
    const app = currentApplicant;
    document.getElementById('dash_fullName').innerText = app.fullName;
    document.getElementById('dash_email').innerText = `📧 ${app.email}`;
    
    // 1. Status Badge
    const badge = document.getElementById('dash_statusBadge');
    badge.innerText = app.status.toUpperCase();
    badge.className = `badge ${app.status}`;
    
    // 2. Avatar
    document.getElementById('applicantAvatar').innerText = app.fullName[0].toUpperCase();

    // 3. Timeline logic
    const timeline = document.getElementById('onboardingTimeline');
    const steps = [
        { id: 'draft', label: 'Registration', done: true },
        { id: 'submitted', label: 'Verification', done: !!app.submittedAt },
        { id: 'approved', label: 'Offer Issued', done: app.status === 'approved' || !!app.offerLetterData },
        { id: 'accepted', label: 'Offer Accepted', done: app.offerAccepted },
        { id: 'joined', label: 'Joined', done: app.offerAccepted && new Date(app.actualJoiningDate) <= new Date() }
    ];
    
    timeline.innerHTML = steps.map((s, i) => `
        <div class="timeline-item-premium ${s.done ? 'done' : ''}">
            <div class="timeline-dot-premium">${s.done ? '✓' : i + 1}</div>
            <div class="timeline-label-premium">${s.label}</div>
        </div>
    `).join('');

    // 4. Offer Letter Logic
    const offerSec = document.getElementById('offerLetterSection');
    const waitingSec = document.getElementById('waitingStatusCard');
    
    if (app.offerLetterData) {
        offerSec.classList.remove('hidden');
        waitingSec.classList.add('hidden');
        const previewer = document.getElementById('offerPreviewer');
        previewer.innerHTML = app.offerLetterData; // Assuming it's the generated HTML snapshot
        
        const form = document.getElementById('acceptanceForm');
        const acceptedAlert = document.getElementById('offerAcceptedStatus');
        
        if (app.offerAccepted) {
            form.classList.add('hidden');
            acceptedAlert.classList.remove('hidden');
            document.getElementById('confirmedJoiningDateText').innerText = new Date(app.actualJoiningDate).toDateString();
        } else {
            form.classList.remove('hidden');
            acceptedAlert.classList.add('hidden');
        }
    } else {
        offerSec.classList.add('hidden');
        waitingSec.classList.remove('hidden');
        // Update waiting text based on status
        if (app.status === 'submitted') {
            document.getElementById('statusTitle').innerText = "Document Verification in Progress";
            document.getElementById('statusDesc').innerText = "Our HR team is meticulously reviewing your testimonials. We'll activate your Offer section once the profile is validated.";
        }
    }

    // 5. Appointment Letter Logic (Viewable if ADOJ + 30 days)
    const apptSec = document.getElementById('appointmentLetterSection');
    if (app.offerAccepted && app.actualJoiningDate) {
        const adoj = new Date(app.actualJoiningDate);
        const diffDays = (new Date() - adoj) / (1000 * 60 * 60 * 24);
        
        if (diffDays >= 30 && app.apptLetterData) {
            apptSec.classList.remove('hidden');
            document.getElementById('apptPreviewer').innerHTML = app.apptLetterData;
        } else {
            apptSec.classList.add('hidden');
        }
    }
}

async function acceptOfferLetter() {
    const adoj = document.getElementById('actualJoiningDateInput').value;
    if (!adoj) return alert("Please select your Actual Date of Joining first.");

    if (!confirm(`Are you sure you want to accept the offer and confirm joining on ${new Date(adoj).toDateString()}?`)) return;

    try {
        lockUI("🤝 Accepting Offer...");
        const res = await fetch('/api/applicant/accept-offer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: currentApplicant.email, actualJoiningDate: adoj })
        });
        if ((await res.json()).success) {
            showToast("🎉 Congratulations! Welcome to the family.", "success");
            // Refresh local data then re-render
            const logRes = await fetch('/api/applicant-login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: currentApplicant.email, password: "SKIP" }) // Assuming backend handles refresh
            });
            // Better: just fetch current data directly
            currentApplicant.offerAccepted = true;
            currentApplicant.actualJoiningDate = adoj;
            renderApplicantDashboard();
        }
    } catch (e) { alert("Acceptance failed."); }
    finally { unlockUI(); }
}

function logoutApplicant() {
    currentApplicant = null;
    backToLanding();
}

async function saveDraft() {
    if (!currentApplicant || currentApplicant.status !== 'draft') return;
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
        updateProgress(1);
        return;
    }

    const currentSection = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    if (!currentSection) return;

    // 1. Regular Form Validation
    const inputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    inputs.forEach(input => {
        if (input.offsetParent === null) return; // Skip if hidden
        if (input.type === 'file') return; // Handled separately
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 3000);
        }
    });
    if (!isValid) return showToast("⚠️ Please fill all required fields", "warning");

    // 2. Document Validation (Step 5 to 6)
    if (currentStep === 5) {
        const requiredDocs = companyData.requiredDocs || [];
        const uploadedDocs = currentApplicant?.documents?.map(d => d.category) || [];
        const missing = requiredDocs.filter(d => !uploadedDocs.includes(d));
        if (!uploadedDocs.includes('Digital Signature')) missing.push('Digital Signature');
        if (missing.length > 0) {
            return alert(`⚠️ Please upload all required documents:\n\n${missing.join('\n')}`);
        }
    }

    // 3. Perform Transition
    document.querySelectorAll('.form-step').forEach(s => s.classList.remove('active'));
    currentStep = step;
    document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.add('active');
    if (currentStep === 5) renderApplicantDocuments(); 
    updateProgress(currentStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    saveDraft();
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
    const totalSteps = 6;
    const progress = (step / totalSteps) * 100;
    const bar = document.getElementById('formProgress');
    const indicator = document.getElementById('stepIndicator');
    if (bar) bar.style.width = `${progress}%`;
    if (indicator) indicator.innerText = `Step ${step} of ${totalSteps}`;
}


function showReview() {
    const form = document.getElementById('onboardingForm');
    const formData = new FormData(form);
    const reviewContent = document.getElementById('reviewContent');
    reviewContent.innerHTML = '';

    const groups = {
        "👥 Personal": ["firstName", "lastName", "dob", "gender", "bloodGroup", "fatherName"],
        "💼 Employment": ["designation", "joiningDate", "salary", "hq"],
        "📞 Contact": ["phone", "address", "city", "state", "pin"],
        "🏦 Bank": ["bankName", "accNo", "ifsc"]
    };

    for (const [name, fields] of Object.entries(groups)) {
        let items = fields.map(f => {
            const val = formData.get(f) || "N/A";
            const cleanLabel = f.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `<div class="review-item"><span class="review-label">${cleanLabel}</span><span class="review-value">${val}</span></div>`;
        }).join('');
        reviewContent.innerHTML += `<div class="review-section-group"><h4>${name}</h4><div class="review-grid">${items}</div></div>`;
    }

    // Add Documents Section
    const reqDocs = companyData.requiredDocs || [];
    const uploadedDocs = currentApplicant.documents || [];
    
    let docItems = reqDocs.map(dName => {
        const up = uploadedDocs.find(u => u.category === dName);
        return `
            <div class="review-item">
                <span class="review-label">${dName}</span>
                <span class="review-value" style="color: ${up ? 'var(--success)' : '#ef4444'}">
                    ${up ? '✅ Already Uploaded' : '❌ NOT UPLOADED'}
                </span>
            </div>
        `;
    }).join('');

    // Add Signature to docs
    const sig = uploadedDocs.find(u => u.category === 'Digital Signature');
    docItems += `
        <div class="review-item">
            <span class="review-label">Digital Signature</span>
            <span class="review-value" style="color: ${sig ? 'var(--success)' : '#ef4444'}">
                ${sig ? '✅ Already Uploaded' : '❌ NOT UPLOADED'}
            </span>
        </div>
    `;

    reviewContent.innerHTML += `
        <div class="review-section-group">
            <h4>📁 Uploaded Testimonials</h4>
            <div class="review-grid">${docItems}</div>
        </div>
    `;

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
    } else {
        alert("Invalid Admin Credentials");
        document.getElementById('adminPass').value = '';
    }
}

function logoutAdmin() {
    updateView('landingPage');
}

// Removed legacy saveCompanyProfile function

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
            // Reset ribbons
            document.querySelectorAll('.progress-ribbon').forEach(r => {
                r.classList.remove('active', 'waiting');
                r.style.width = '0%';
            });
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
    if (!toast) return;
    toast.textContent = message;
    toast.className = `show ${type}`;
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { toast.className = ''; }, 3500);
}

// --- REAL-TIME ASSET UPLOAD LOGIC ---
function attachFileListener(id, info) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // Clear old listeners if any
    el.onchange = async (e) => {
        const files = e.target.files;
        if (!files.length) return;

        // Map UI IDs to Server Categories early
        const categoryMap = {
            'compLogoInput': 'logo',
            'compStampInput': 'stamp',
            'compSigInput': 'digitalSignature',
            'letterheadInput': 'letterheadImage',
            'mobileTemplateInput': 'mobileAppTemplate',
            'tadaTemplateInput': 'tadaTemplate'
        };

        let category = categoryMap[id];
        // If not in map, it might be a dynamic category
        if (!category) {
            // Check if it's dynamic by finding its label
            const label = el.closest('.upload-box-sm')?.querySelector('label')?.innerText;
            category = label || 'other';
        }

        const ribbon = document.getElementById(info.ribbon || `ribbon_${id}`);
        if (ribbon) {
            ribbon.classList.add('active');
            ribbon.style.width = '30%';
        }

        try {
            for (let i = 0; i < files.length; i++) {
                const f = files[i];
                const base64 = await new Promise((res) => {
                    const reader = new FileReader();
                    reader.onload = (event) => res(event.target.result);
                    reader.readAsDataURL(f);
                });

                if (ribbon) ribbon.style.width = `${Math.round(((i + 1) / files.length) * 100)}%`;

                await uploadSingleAsset(category, f.name, base64);
            }
            showToast(`✅ ${files.length} file(s) uploaded!`);
            await fetchCompanyData();
            renderAssetLists();
        } catch (err) {
            showToast("❌ Upload failed", "error");
        } finally {
            if (ribbon) {
                setTimeout(() => {
                    ribbon.classList.remove('active');
                    ribbon.style.width = '0%';
                }, 1000);
            }
            el.value = ''; // Reset input
        }
    };
}

async function uploadSingleAsset(category, name, data) {
    // Standard categories should automatically become active when uploaded "fresh"
    const standardCategories = ['logo', 'stamp', 'digitalSignature', 'letterheadImage'];
    const setActive = standardCategories.includes(category);

    const res = await fetch('/api/admin/upload-asset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, name, data, setActive })
    });
    return res.json();
}

function switchAdminTab(tab) {
    if (typeof isSaving !== 'undefined' && isSaving) {
        showToast("⚠️ Please wait until the current save is completed.", "error");
        return;
    }
    
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const btn = Array.from(document.querySelectorAll('.tab-btn')).find(b => b.getAttribute('onclick').includes(`'${tab}'`));
    if (btn) btn.classList.add('active');
    
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
    
    if (tab === 'profile') {
        document.getElementById('adminProfileTab').classList.remove('hidden');
        fetchDatabaseStats();
        const f = document.getElementById('companyProfileForm');
        f.compName.value = companyData.name || '';
        f.compWeb.value = companyData.website || '';
        f.compPhone.value = companyData.phone || '';
        f.compTollFree.value = companyData.tollFree || '';
        f.compAddress.value = companyData.address || '';
        
        f.fyFrom.value = companyData.fyFrom || '';
        f.fyTo.value = companyData.fyTo || '';
        f.offerCounter.value = companyData.offerCounter || 1001;
        f.apptCounter.value = companyData.apptCounter || 1001;
        f.miscCounter.value = companyData.miscCounter || 1001;
        f.empCodeCounter.value = companyData.empCodeCounter || 1001;

        renderAssetLists();

        // Attach listeners for profile tab file inputs
        attachFileListener('compLogoInput', { status: 'logoStatus' });
        attachFileListener('compStampInput', { status: 'stampStatus' });
        attachFileListener('compSigInput', { status: 'sigStatus' });
        attachFileListener('letterheadInput', { status: 'letterheadStatus' });
        attachFileListener('mobileTemplateInput', { status: 'mobileStatus' });
        attachFileListener('tadaTemplateInput', { status: 'tadaStatus' });

    } else if (tab === 'setup') {
        document.getElementById('adminSetupTab').classList.remove('hidden');
        loadSetupData();
        populateHubApplicantSelect();
    } else if (tab === 'gallery') {
        document.getElementById('adminGalleryTab').classList.remove('hidden');
        renderGallery();
    } else {
        document.getElementById('adminApplicantsTab').classList.remove('hidden');
        fetchApplicants();
        fetchLifecycleAlerts();
    }
}

async function saveCompanyProfile(e) {
    e.preventDefault();
    lockUI("💾 Saving Profile...");
    const formData = new FormData(e.target);
    const rawData = Object.fromEntries(formData.entries());
    
    const data = {
        name: rawData.compName,
        website: rawData.compWeb,
        phone: rawData.compPhone,
        tollFree: rawData.tollFree,
        address: rawData.compAddress,
        fyFrom: rawData.fyFrom,
        fyTo: rawData.fyTo,
        offerCounter: parseInt(rawData.offerCounter) || 1001,
        apptCounter: parseInt(rawData.apptCounter) || 1001,
        miscCounter: parseInt(rawData.miscCounter) || 1001,
        empCodeCounter: parseInt(rawData.empCodeCounter) || 1001,
        requiredDocs: companyData.requiredDocs || [],
        designations: companyData.designations || []
    };
    
    // File uploads are now handled real-time via attachFileListener

    await submitProfileUpdate(data);
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

async function renderAssetLists() {
    try {
        const res = await fetch('/api/admin/asset-library');
        const allAssets = await res.json();
        
        const categories = {
            logo: 'logoList',
            stamp: 'stampList',
            digitalSignature: 'sigList',
            letterheadImage: 'lhList',
            mobileAppTemplate: 'mobileList',
            tadaTemplate: 'tadaList'
        };

        const activeMap = {
            'logo': companyData.activeLogoId,
            'stamp': companyData.activeStampId,
            'digitalSignature': companyData.activeSignatureId,
            'letterheadImage': companyData.activeLetterheadId
        };

        // Clear all lists first
        Object.values(categories).forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = '';
        });

        // Clear Dynamic Grid
        const dynGrid = document.getElementById('dynamicBrandingGrid');
        if (dynGrid) {
            dynGrid.innerHTML = '';
            // Generate Dynamic Boxes
            if (companyData.customAssetCategories && companyData.customAssetCategories.length > 0) {
                companyData.customAssetCategories.forEach(cat => {
                    const safeKey = cat.replace(/\s+/g, '_');
                    const box = document.createElement('div');
                    box.className = 'upload-box-sm';
                    box.innerHTML = `
                        <div class="progress-ribbon" id="ribbon_input_${safeKey}"></div>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.2rem;">
                            <label style="margin:0">${cat}</label>
                            <button type="button" onclick="deleteAssetCategory('${cat}')" style="background: none; border: none; color: #ef4444; cursor: pointer; font-size: 0.75rem; opacity: 0.6;" title="Remove Category">🗑️ Delete</button>
                        </div>
                        <div class="drop-zone-sm" onclick="document.getElementById('input_${safeKey}').click()">
                            <span class="drop-icon-sm">📎</span>
                            <span id="status_${safeKey}" class="drop-label-sm">Upload Files</span>
                            <input type="file" id="input_${safeKey}" class="hidden" multiple>
                        </div>
                        <div id="list_${safeKey}" class="asset-list-vertical"></div>
                    `;
                    dynGrid.appendChild(box);
                    // Add this to categories for standard mapping
                    categories[cat] = `list_${safeKey}`;

                    // IMPORTANT: Attach listener for NEWLY created dynamic input
                    attachFileListener(`input_${safeKey}`, { status: `status_${safeKey}`, ribbon: `ribbon_input_${safeKey}` });
                });
            }
        }

        allAssets.forEach(asset => {
            const listId = categories[asset.category];
            const listEl = document.getElementById(listId);
            if (!listEl) return;

            const isActive = activeMap[asset.category] === asset._id;
            
            const item = document.createElement('div');
            item.className = `asset-list-item ${isActive ? 'active' : ''}`;
            item.innerHTML = `
                <div class="asset-mini-preview">
                    ${asset.data.startsWith('data:image') 
                        ? `<img src="${asset.data}" alt="${asset.name}">` 
                        : `<span style="font-size:12px">📄</span>`}
                </div>
                <div class="asset-item-info">
                    <div class="asset-item-name" title="${asset.name}">${asset.name}</div>
                </div>
                <div class="asset-item-actions">
                    ${isActive 
                        ? `<button class="btn-asset-mini active-tag">Active</button>` 
                        : `<button class="btn-asset-mini" onclick="setActiveAsset('${asset._id}', '${asset.category}')">Set Active</button>`
                    }
                    <button class="btn-asset-mini delete-btn" onclick="deleteAssetRecord('${asset._id}')">🗑️</button>
                </div>
            `;
            listEl.appendChild(item);
        });

        // Update "Upload" labels to show counts
        const counts = allAssets.reduce((acc, a) => {
            acc[a.category] = (acc[a.category] || 0) + 1;
            return acc;
        }, {});

        const updateStatus = (id, count, label) => {
            const el = document.getElementById(id);
            if (!el) return;
            el.innerText = count ? `✅ ${count} ${label}(s) Uploaded` : `Upload ${label}`;
            el.style.color = count ? 'var(--success)' : 'var(--text-muted)';
        };

        updateStatus('logoStatus', counts['logo'], 'Logo');
        updateStatus('stampStatus', counts['stamp'], 'Stamp');
        updateStatus('sigStatus', counts['digitalSignature'], 'Signature');
        updateStatus('letterheadStatus', counts['letterheadImage'], 'Letterhead');
        updateStatus('mobileStatus', counts['mobileAppTemplate'], 'Images');
        updateStatus('tadaStatus',   counts['tadaTemplate'],   'Images');

        // Dynamic Statuses
        if (companyData.customAssetCategories) {
            companyData.customAssetCategories.forEach(cat => {
                const safeKey = cat.replace(/\s+/g, '_');
                const el = document.getElementById(`status_${safeKey}`);
                if (el) {
                    const count = counts[cat] || 0;
                    el.innerText = count ? `✅ ${count} File(s) Uploaded` : `Upload Files`;
                    el.style.color = count ? 'var(--success)' : 'var(--text-muted)';
                }
            });
        }

    } catch (e) { console.error("Error rendering asset list:", e); }
}

async function addAssetCategory() {
    const input = document.getElementById('newCategoryInput');
    const categoryName = input.value.trim().toUpperCase();
    if (!categoryName) return;
    
    try {
        lockUI("🏗️ Creating Category...");
        const res = await fetch('/api/admin/add-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryName })
        });
        if ((await res.json()).success) {
            showToast(`✅ Category ${categoryName} created!`);
            input.value = '';
            await fetchCompanyData();
            renderAssetLists();
        }
    } catch (e) { showToast("❌ Creation failed", "error"); }
    finally { unlockUI(); }
}

async function deleteAssetCategory(categoryName) {
    if (!confirm(`Are you sure you want to permanently delete the category "${categoryName}" and all assets inside it?`)) return;
    
    try {
        lockUI("🗑️ Removing Category...");
        const res = await fetch('/api/admin/delete-category', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoryName })
        });
        const result = await res.json();
        if (result.success) {
            showToast(`✅ Category ${categoryName} removed!`);
            await fetchCompanyData();
            renderAssetLists();
        } else {
            showToast(result.message || "❌ Deletion failed", "error");
        }
    } catch (e) { showToast("❌ Delete failed", "error"); }
    finally { unlockUI(); }
}

async function setActiveAsset(assetId, category) {
    try {
        lockUI("⚙️ Updating Active Asset...");
        const res = await fetch('/api/admin/set-active-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetId, category })
        });
        if ((await res.json()).success) {
            showToast("✅ Active asset updated!", "success");
            await fetchCompanyData(); // Refresh global pointers
            renderAssetLists(); // Refresh lists
        }
    } catch (e) { showToast("❌ Update failed", "error"); }
    finally { unlockUI(); }
}

async function deleteAssetRecord(assetId) {
    if (!confirm("Delete this asset permanently from the profile?")) return;
    try {
        lockUI("🗑️ Deleting Asset...");
        const res = await fetch('/api/admin/delete-asset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ assetId })
        });
        if ((await res.json()).success) {
            showToast("✅ Asset deleted!", "success");
            await fetchCompanyData();
            renderAssetLists();
        }
    } catch (e) { showToast("❌ Delete failed", "error"); }
    finally { unlockUI(); }
}

// Calculate how much of the onboarding form the applicant has filled
function calculateAppProgress(app) {
    const fd = app.formData || {};
    let filled = 0;
    let total = 8; // key fields to track

    if (fd.firstName || app.fullName) filled++;
    if (fd.phone || app.phone) filled++;
    if (fd.dob) filled++;
    if (fd.address) filled++;
    if (fd.designation) filled++;
    if (fd.bankName || fd.accNo) filled++;
    if (app.documents && app.documents.length > 0) filled++;
    if (app.status && app.status !== 'draft') filled++;

    return Math.round((filled / total) * 100);
}

// Corrected location for helper functions below


function renderApplicantsTable(applicants) {
    const tbody = document.getElementById('applicantsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = applicants.map(app => {
        const date = app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : (app.registeredAt ? new Date(app.registeredAt).toLocaleDateString() : 'Draft');
        const progress = calculateAppProgress(app);
        
        let statusClass = app.status || 'draft';
        let statusText = app.status ? app.status.toUpperCase() : 'DRAFT';

        return `
            <tr class="applicant-row">
                <td style="text-align: center; vertical-align: middle; padding-left: 15px;">
                    <button class="btn-tool-danger" onclick="deleteApplicant('${app.email}')" title="Delete Applicant" style="padding: 4px 8px; font-size: 0.8rem; opacity: 0.4; transition: opacity 0.2s;">
                        🗑️
                    </button>
                </td>
                <td><span style="font-size: 0.8rem; color: var(--text-muted);">${date}</span></td>
                <td>
                    <div class="user-info-cell">
                        <div class="user-avatar">${app.fullName ? app.fullName[0].toUpperCase() : '?'}</div>
                        <div class="user-name">${app.fullName || 'Unnamed'}</div>
                    </div>
                </td>
                <td style="font-family: monospace; font-size: 0.8rem; color: var(--primary-light);">${app.email}</td>
                <td><span class="badge ${statusClass}">${statusText}</span></td>
                <td style="text-align: center;">
                    <label class="switch-premium" title="Toggle Login Access">
                        <input type="checkbox" ${app.canLogin ? 'checked' : ''} onchange="toggleAccess('${app.email}', this.checked)">
                        <span class="slider-premium"></span>
                    </label>
                </td>
                <td>
                    <div class="progress-container-mini">
                        <div class="progress-bar-mini" style="width: ${progress}%"></div>
                        <span style="font-size:10px; color: var(--text-muted);">${progress}%</span>
                    </div>
                </td>
                <td style="text-align: right; white-space: nowrap;">
                    <button class="btn btn-sm btn-primary" onclick="openVerificationView('${app.email}')" style="background: var(--accent); border-color: var(--accent); padding: 6px 12px; font-weight: 700; border-radius: 8px; font-size: 0.75rem;">
                        🔎 VERIFY
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function filterApplicants() {
    const query = document.getElementById('applicantSearch').value.toLowerCase();
    const filtered = allApplicants.filter(a => 
        (a.fullName && a.fullName.toLowerCase().includes(query)) || 
        (a.email && a.email.toLowerCase().includes(query))
    );
    renderApplicantsTable(filtered);
}

async function deleteApplicant(email) {
    if (!confirm(`🚨 CRITICAL: Are you sure you want to permanently delete applicant ${email} and all their uploaded testimonials? This cannot be undone.`)) return;
    
    try {
        lockUI("🗑️ Deleting Record...");
        const res = await fetch('/api/admin/delete-applicant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const result = await res.json();
        if (result.success) {
            showToast("✅ Applicant and assets deleted successfully.", "success");
            await fetchApplicants(); // Refresh table
        } else {
            showToast("❌ Delete failed: " + result.error, "error");
        }
    } catch (e) { showToast("❌ Server communication error", "error"); }
    finally { unlockUI(); }
}

async function toggleAccess(email, canLogin) {
    try {
        const res = await fetch('/api/admin/toggle-access', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, canLogin })
        });
        if ((await res.json()).success) {
            showToast(`Access ${canLogin ? 'granted' : 'revoked'} for ${email}`, "success");
            // Sync local state
            const app = allApplicants.find(a => a.email === email);
            if (app) app.canLogin = canLogin;
        }
    } catch (e) { showToast("Toggle failed", "error"); }
}

async function openVerificationView(email) {
    const app = allApplicants.find(a => a.email === email);
    if (!app) return;
    activeV_Applicant = app;
    verificationChecks = app.verificationChecks || {};

    // 1. Navigation & Headers
    updateView('applicantVerificationView');
    document.getElementById('v_header_title').innerText = `VERIFYING: ${app.fullName.toUpperCase()}`;
    
    const badge = document.getElementById('v_statusBadge');
    badge.innerText = (app.status || 'NEW').toUpperCase();
    badge.className = `badge ${app.status || 'draft'}`;

    // 2. Profile Dossier
    renderVerificationProfile(app);

    // 3. Checklist (Documents & Testimonials) + Gallery
    renderVerificationChecklist(app);
    renderDocGallery(app);

    // 4. Assignments
    await populateDivisions(); // Ensure fresh lists
    await populateManagers();  // Populate the hierarchical selector
    
    const divSel = document.getElementById('v_division');
    divSel.value = app.division || "";
    document.getElementById('v_reportingTo').value = app.reportingTo || "";
    document.getElementById('v_proposed_desg').innerText = app.formData?.designation || "NOT SPECIFIED";

    // 4.5 Salary Breakup
    const sal = app.salaryBreakup || {};
    document.getElementById('v_salBasic').value = sal.basic || '';
    document.getElementById('v_salHra').value = sal.hra || '';
    document.getElementById('v_salLta').value = sal.lta || '';
    document.getElementById('v_salConv').value = sal.conveyance || '';
    document.getElementById('v_salMed').value = sal.medical || '';
    document.getElementById('v_salSpecial').value = sal.special || '';
    document.getElementById('v_salEdu').value = sal.edu || '';
    document.getElementById('v_salFixed').value = sal.fixed || '';
    if(typeof calcSalaryTotal === 'function') calcSalaryTotal();

    // 5. Pipeline Switches
    syncPipelineSwitches(app.tasks || {});

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function closeVerificationView() {
    updateView('adminDashboard');
    switchAdminTab('applicants');
}

function renderVerificationProfile(app) {
    const container = document.getElementById('v_profile_content');
    const fd = app.formData || {};
    
    const rows = [
        { label: 'Full Name', val: app.fullName },
        { label: 'Primary Email', val: app.email },
        { label: 'Contact Phone', val: app.phone },
        { label: 'Designation', val: fd.designation || 'N/A' },
        { label: 'HQ/Base City', val: fd.hq || 'N/A' },
        { label: 'Date of Birth', val: formatDatePretty(fd.dob) },
        { label: 'Current Address', val: fd.address || 'N/A' },
        { label: 'Applied At', val: app.submittedAt ? new Date(app.submittedAt).toLocaleString() : 'N/A' }
    ];

    container.innerHTML = rows.map(r => `
        <div class="detail-row">
            <label>${r.label}</label>
            <span>${r.val}</span>
        </div>
    `).join('');
}

function renderVerificationChecklist(app) {
    const container = document.getElementById('v_checklist_container');
    const docs = companyData.requiredDocs || [];
    const uploads = app.documents || [];
    
    if (docs.length === 0 && uploads.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:var(--text-muted);">No documents uploaded for verification.</p>';
        return;
    }

    const allDocNames = [...new Set([...docs, ...uploads.map(u => u.category)])];
    
    container.innerHTML = allDocNames.map(dName => {
        const upload = uploads.find(u => u.category === dName);
        const isVerified = verificationChecks[dName] === true;
        
        return `
            <div class="v-check-item ${isVerified ? 'verified' : ''}">
                <div class="v-check-info">
                    <span>${dName}</span>
                    <label style="font-size:0.7rem; color:${upload ? 'var(--success)' : '#ef4444'}">
                        ${upload ? '✅ File Uploaded' : '❌ Missing File'}
                    </label>
                </div>
                <div class="v-check-actions">
                    ${upload ? `<button class="btn btn-tool" onclick="viewDocument('${upload.assetId || upload.data || ''}')" title="View Document">👁️</button>` : ''} ${upload ? `<button class="btn btn-tool" onclick="downloadAsset('${upload.assetId || upload.data || ''}', '${dName}')" title="Download">📥</button>` : ''}
                    <label class="switch-premium">
                        <input type="checkbox" ${isVerified ? 'checked' : ''} onchange="toggleDocCheck('${dName}', this.checked)">
                        <span class="slider-premium"></span>
                    </label>
                </div>
            </div>
        `;
    }).join('');
    
    updateVerificationProgress();
}

function toggleDocCheck(docName, isChecked) {
    verificationChecks[docName] = isChecked;
    updateVerificationProgress();
}

function updateVerificationProgress() {
    const total = Object.keys(verificationChecks).length;
    const checked = Object.values(verificationChecks).filter(v => v === true).length;
    
    const progressEl = document.getElementById('v_progress_ratio');
    if (progressEl) progressEl.innerText = `${checked}/${total} VERIFIED`;

    const fillEl = document.getElementById('v_progress_fill');
    if (fillEl) fillEl.style.width = total > 0 ? `${Math.round((checked/total)*100)}%` : '0%';
    
    const masterBtn = document.getElementById('masterVerifyBtn');
    if (masterBtn) {
        if (checked === total && total > 0) {
            masterBtn.classList.remove('btn-outline');
            masterBtn.classList.add('btn-primary');
            masterBtn.style.background = 'var(--success)';
            masterBtn.style.borderColor = 'var(--success)';
        } else {
            masterBtn.classList.add('btn-outline');
            masterBtn.classList.remove('btn-primary');
            masterBtn.style.background = 'transparent';
        }
    }
}

function renderDocGallery(app) {
    const gallery = document.getElementById('v_doc_gallery');
    if (!gallery) return;
    const docs = companyData.requiredDocs || [];
    const uploads = app.documents || [];
    const allDocNames = [...new Set([...docs, ...uploads.map(u => u.category)])];
    if (allDocNames.length === 0) {
        gallery.innerHTML = '<p style="color:var(--text-muted);font-size:0.82rem;">No documents required or uploaded.</p>';
        return;
    }
    gallery.innerHTML = allDocNames.map(dName => {
        const upload = uploads.find(u => u.category === dName);
        const hasFile = !!upload;
        const isPdf = upload && upload.name && upload.name.toLowerCase().endsWith('.pdf');
        const safeData = upload ? upload.data.replace(/'/g, '%27') : '';
        return `
            <div class="doc-preview-card ${hasFile ? 'uploaded' : 'missing'}">
                <div class="doc-icon">${hasFile ? (isPdf ? '📄' : '🖼️') : '❌'}</div>
                <div class="doc-name">${dName}</div>
                <div class="doc-status-tag" style="background:${hasFile ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)'}; color:${hasFile ? '#10b981' : '#ef4444'}">
                    ${hasFile ? '✅ Uploaded' : '❌ Missing'}
                </div>
                ${hasFile ? `
                <div class="doc-actions-row">
                    <button class="btn-tool" onclick="viewDocument('${upload.assetId || upload.data || ''}')" title="View">👁️</button> <button class="btn-tool" onclick="downloadAsset('${upload.assetId || upload.data || ''}', '${dName}')" title="Download">📥</button>
                </div>` : '<div style="font-size:0.65rem;text-align:center;color:var(--text-muted);">Not uploaded</div>'}
            </div>
        `;
    }).join('');
}

async function updatePipelineTask(taskName, isChecked) {
    if (!activeV_Applicant) return;
    if (!activeV_Applicant.tasks) activeV_Applicant.tasks = {};
    activeV_Applicant.tasks[taskName] = isChecked;
    try {
        await fetch('/api/admin/update-workflow-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: activeV_Applicant.email, tasks: activeV_Applicant.tasks })
        });
        syncPipelineSwitches(activeV_Applicant.tasks);
        showToast('✅ Pipeline updated', 'success');
    } catch (e) { showToast('Pipeline save failed', 'error'); }
}

async function saveInternalAssignment() {
    const data = {
        email: activeV_Applicant.email,
        division: document.getElementById('v_division').value,
        reportingTo: document.getElementById('v_reportingTo').value,
        salaryBreakup: {
            basic: parseFloat(document.getElementById('v_salBasic').value) || 0,
            hra: parseFloat(document.getElementById('v_salHra').value) || 0,
            lta: parseFloat(document.getElementById('v_salLta').value) || 0,
            conveyance: parseFloat(document.getElementById('v_salConv').value) || 0,
            medical: parseFloat(document.getElementById('v_salMed').value) || 0,
            special: parseFloat(document.getElementById('v_salSpecial').value) || 0,
            edu: parseFloat(document.getElementById('v_salEdu').value) || 0,
            fixed: parseFloat(document.getElementById('v_salFixed').value) || 0
        }
    };

    try {
        lockUI("⚙️ Updating Assignment...");
        const res = await fetch('/api/admin/update-workflow-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if ((await res.json()).success) {
            showToast("✅ Core Assignment & Salary Updated!", "success");
            activeV_Applicant.division = data.division;
            activeV_Applicant.reportingTo = data.reportingTo;
            activeV_Applicant.salaryBreakup = data.salaryBreakup;
        }
    } catch (e) { alert("Save failed"); }
    finally { unlockUI(); }
}

function calcSalaryTotal() {
    const fields = ['v_salBasic', 'v_salHra', 'v_salLta', 'v_salConv', 'v_salMed', 'v_salSpecial', 'v_salEdu', 'v_salFixed'];
    let total = 0;
    fields.forEach(id => {
        const val = parseFloat(document.getElementById(id).value) || 0;
        total += val;
    });
    const totalEl = document.getElementById('v_salTotal');
    if(totalEl) totalEl.innerText = `₹${total.toLocaleString('en-IN')}`;
}

async function commitMasterVerification() {
    const total = Object.keys(verificationChecks).length;
    const checked = Object.values(verificationChecks).filter(v => v === true).length;

    if (checked < total) {
        if (!confirm("Not all documents are checked. Proceed with partial verification?")) return;
    }

    try {
        lockUI("🛡️ Activating Record...");
        const res = await fetch('/api/admin/verify-and-activate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: activeV_Applicant.email, 
                verificationChecks 
            })
        });
        const result = await res.json();
        if (result.success) {
            showToast("🎉 Record Activated! Internal status updated.", "success");
            activeV_Applicant.status = 'approved';
            
            // Auto-transition to Letters module
            switchAdminTab('setup');
            setTimeout(() => {
                const targetSel = document.getElementById('hubTargetApplicant');
                if (targetSel) {
                    targetSel.value = activeV_Applicant.email;
                    // Trigger populate to show their name if needed, though value set is enough
                    switchEditorTemplate(); 
                }
            }, 500);
        }
    } catch (e) { alert("Activation failed"); }
    finally { unlockUI(); }
}

function syncPipelineSwitches(tasks) {
    const checkStep = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.checked = !!val;
    };
    checkStep('pipe_offer', tasks.offerLetter);
    checkStep('pipe_hr', tasks.appointmentLetter);
    checkStep('pipe_app', tasks.appLinkSent);
    checkStep('pipe_email', tasks.loginDetailsSent);
    
    const ongoingCount = Object.values(tasks).filter(t => t === true).length;
    const display = document.getElementById('pipelineStatusDisplay');
    if (display) {
        if (ongoingCount === 4) {
            display.innerText = "COMPLETED";
            display.style.borderColor = "var(--success)";
            display.style.color = "var(--success)";
        } else {
            display.innerText = "ONGOING";
            display.style.borderColor = "var(--primary)";
            display.style.color = "var(--primary-light)";
        }
    }
}

async function togglePipelineStep(step, isChecked) {
    if (!activeV_Applicant) return;
    try {
        const res = await fetch('/api/admin/update-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: activeV_Applicant.email, task: step, completed: isChecked })
        });
        if ((await res.json()).success) {
            if (!activeV_Applicant.tasks) activeV_Applicant.tasks = {};
            activeV_Applicant.tasks[step] = isChecked;
            syncPipelineSwitches(activeV_Applicant.tasks);
            showToast(`🚀 Onboarding Step: ${step} updated`, "success");
        }
    } catch (e) { alert("Step update failed"); }
}

async function toggleAccessFromModal() {
    // Legacy support or remove
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

function openTemplateEditor(templateKey) {
    // Switch to Setup & Letters tab, then select the template
    switchAdminTab('setup');
    // Wait for tab DOM to be ready, then set the correct template
    setTimeout(() => {
        populateTemplateSelect(templateKey);
        switchEditorTemplate();
        // Scroll editor into view smoothly
        const editor = document.getElementById('unifiedEditor');
        if (editor) editor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

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
        'letterAlignment': companyData.letterAlignment || 'left'
    };

    for (const [id, val] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.value = val;
    }
    
    // Initialize Unified Editor specific state
    window.letterTemplates = {
        offer: companyData.offerLetterBody || "",
        appt: companyData.apptLetterBody || "",
        confirm: companyData.confirmLetterBody || "",
        revised_salary: companyData.revisedSalaryBody || "",
        incentive: companyData.incentiveCircularBody || ""
    };
    if (companyData.miscLetters) {
        companyData.miscLetters.forEach(m => {
            window.letterTemplates["misc_" + m.id] = m.body || "";
        });
    }
    
    populateTemplateSelect();
    switchEditorTemplate();

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
    document.querySelectorAll('.letter-editor').forEach(editor => {
        editor.onkeydown = function(e) {
            if (e.key === 'Tab') {
                e.preventDefault();
                document.execCommand('insertHTML', false, '&#009;');
            }
        };
    });
}

function populateTemplateSelect(forceSelectVal) {
    const sel = document.getElementById('activeTemplateSelect');
    const currentVal = forceSelectVal || sel.value;
    
    let html = `
        <optgroup label="Core Letters">
            <option value="offer">📄 Offer Letter</option>
            <option value="appt">📋 Appointment Letter</option>
            <option value="confirm">✅ Confirmation Letter</option>
            <option value="revised_salary">💰 Revised Salary Letter</option>
            <option value="incentive">🎯 Incentive Circular</option>
        </optgroup>
    `;
    
    if (companyData.miscLetters && companyData.miscLetters.length > 0) {
        html += `<optgroup label="Miscellaneous Letters">`;
        companyData.miscLetters.forEach(m => {
            html += `<option value="misc_${m.id}">🛡️ ${m.title}</option>`;
        });
        html += `</optgroup>`;
    }
    
    html += `<option value="create_new" style="font-weight:bold; color:var(--primary);">➕ Create New Misc Letter...</option>`;
    sel.innerHTML = html;
    
    if (currentVal && Array.from(sel.options).find(o => o.value === currentVal)) {
        sel.value = currentVal;
    } else {
        sel.value = "offer";
    }
}

async function switchEditorTemplate() {
    const type = document.getElementById('activeTemplateSelect').value;
    const editor = document.getElementById('unifiedEditor');
    
    if (type === 'create_new') {
        const name = prompt("Enter a title for this new Miscellaneous Letter (e.g., 'Warning Letter'):");
        if (!name || name.trim() === '') {
            populateTemplateSelect("offer");
            switchEditorTemplate();
            return;
        }
        const newId = Date.now().toString(36);
        if (!companyData.miscLetters) companyData.miscLetters = [];
        companyData.miscLetters.push({ id: newId, title: name.trim(), body: "" });
        
        window.letterTemplates["misc_" + newId] = "";
        
        // Save immediately so it persists
        await submitProfileUpdate({ miscLetters: companyData.miscLetters }, true);
        
        populateTemplateSelect("misc_" + newId);
        editor.innerHTML = "";
    } else {
        editor.innerHTML = window.letterTemplates[type] || "";
    }
    
    const delBtn = document.getElementById('deleteTemplateBtn');
    if (delBtn) delBtn.style.display = type.startsWith('misc_') ? 'inline-block' : 'none';

    syncEditorStyles();
}

async function deleteMiscellaneousLetter() {
    const type = document.getElementById('activeTemplateSelect').value;
    if (!type.startsWith('misc_')) return;
    
    if (!confirm("Are you sure you want to permanently delete this custom template?")) return;
    
    const idToDelete = type.split('_')[1];
    
    if (companyData.miscLetters) {
        companyData.miscLetters = companyData.miscLetters.filter(m => m.id !== idToDelete);
    }
    delete window.letterTemplates[type];
    
    await submitProfileUpdate({ miscLetters: companyData.miscLetters }, true);
    
    populateTemplateSelect("offer");
    switchEditorTemplate();
    showToast("Template deleted successfully", "success");
}


function fillEditorWithRealData() {
    const targetEmail = document.getElementById('hubTargetApplicant')?.value;
    const applicant = allApplicants.find(a => a.email === targetEmail);
    if (!applicant) return alert("Please select a target applicant from the dropdown first (under 'Target Applicant').");
    
    if (!confirm(`This will permanently replace placeholders in the editor with data for ${applicant.fullName}. Proceed?`)) return;

    const editor = document.getElementById('unifiedEditor');
    const content = editor.innerHTML;
    const filled = fillLetterPlaceholders(content, applicant);
    editor.innerHTML = filled;
    showToast(`⚡ Variables populated for ${applicant.fullName}`, "success");
}

async function saveActiveTemplate() {
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = "⌛ Saving...";
    btn.disabled = true;

    try {
        const type = document.getElementById('activeTemplateSelect').value;
        const editor = document.getElementById('unifiedEditor');
        const content = editor.innerHTML;
        
        window.letterTemplates[type] = content;
        
        const data = {};
        if (type === 'offer') data.offerLetterBody = content;
        else if (type === 'appt') data.apptLetterBody = content;
        else if (type === 'confirm') data.confirmLetterBody = content;
        else if (type === 'revised_salary') data.revisedSalaryBody = content;
        else if (type === 'incentive') data.incentiveCircularBody = content;
        else if (type.startsWith('misc_')) {
            const id = type.split('_')[1];
            if (!companyData.miscLetters) companyData.miscLetters = [];
            const index = companyData.miscLetters.findIndex(m => m.id === id);
            if (index > -1) {
                companyData.miscLetters[index].body = content;
            }
            data.miscLetters = companyData.miscLetters; 
        }
        
        // Also save the typography and margins that are now part of the editor UI
        data.headerHeight = document.getElementById('headerHeight').value;
        data.footerHeight = document.getElementById('footerHeight').value;
        data.letterFontSize = document.getElementById('letterFontSize').value;
        data.letterFontType = document.getElementById('letterFontType').value;
        data.letterAlignment = document.getElementById('letterAlignment').value;
        
        // Also save the authorized signatory inputs perfectly synced now
        data.signatoryName = document.getElementById('signatoryName').value;
        data.signatoryDesignation = document.getElementById('signatoryDesg').value;
        
        await submitProfileUpdate(data);
        showToast("✅ Template Saved!", "success");
    } catch (e) {
        showToast("❌ Template Save Failed", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

function execCmd(command, value = null) {
    document.execCommand(command, false, value);
    
    // Explicitly track alignment to sync with the PDF generator and Live Preview
    if (command && command.startsWith('justify')) {
        let align = 'left';
        if (command === 'justifyLeft') align = 'left';
        if (command === 'justifyCenter') align = 'center';
        if (command === 'justifyRight') align = 'right';
        if (command === 'justifyFull') align = 'justify';
        
        const alignInput = document.getElementById('letterAlignment');
        if (alignInput) alignInput.value = align;
    }
    
    // Immediate visual feedback if preview is open
    const preview = document.getElementById('livePreviewContainer');
    if (preview && !preview.classList.contains('hidden')) {
        updateLivePreviewFrame();
    }
    
    const editor = document.getElementById('unifiedEditor');
    if (editor) editor.focus();
}

function syncEditorStyles() {
    const size = document.getElementById('letterFontSize')?.value || 11;
    const type = document.getElementById('letterFontType')?.value || 'helvetica';
    const align = document.getElementById('letterAlignment')?.value || 'left';
    
    let fontStack = "'Courier New', monospace";
    if (type === 'times') fontStack = "'Times New Roman', Times, serif";
    else if (type === 'helvetica') fontStack = "'Plus Jakarta Sans', Arial, sans-serif";
    else if (type === 'verdana') fontStack = "Verdana, Geneva, sans-serif";
    
    const editor = document.getElementById('unifiedEditor');
    if (editor) {
        editor.style.fontSize = `${size}pt`;
        editor.style.fontFamily = fontStack;
        editor.style.textAlign = align;
    }

    // Update live preview if open
    const preview = document.getElementById('livePreviewContainer');
    if (preview && !preview.classList.contains('hidden')) {
        updateLivePreviewFrame();
    }
}

async function populateDivisions() {
    const res = await fetch('/api/admin/divisions');
    const divisions = await res.json();
    
    const list = document.getElementById('divisionList');
    const profileList = document.getElementById('profileDivisionList');
    
    const html = divisions.map(d => `
        <div class="division-chip">
            ${d.name}
            <button onclick="deleteDivision('${d._id}')">&times;</button>
        </div>
    `).join('');

    if (list) list.innerHTML = html;
    if (profileList) profileList.innerHTML = html;

    // Update all division dropdowns globally
    const selects = ['v_division'];
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            const currentVal = sel.value;
            sel.innerHTML = '<option value="">-- Select Division --</option>' + 
                divisions.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
            sel.value = currentVal;
        }
    });

    if (typeof populateManagers === 'function') populateManagers();
}

async function addDivision(source = 'setup') {
    const inputId = source === 'profile' ? 'profileNewDivisionInput' : 'newDivisionInput';
    const input = document.getElementById(inputId);
    const name = input ? input.value : "";
    
    if (!name) return;
    await fetch('/api/admin/divisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    });
    if (input) input.value = "";
    populateDivisions();
}

async function populateManagers() {
    const select = document.getElementById('v_reportingTo');
    if (!select) return;

    try {
        const res = await fetch('/api/admin/applicants');
        const applicants = await res.json();
        const joined = applicants.filter(a => a.status === 'joined' || a.status === 'approved');

        // Group by Division
        const grouped = {};
        joined.forEach(a => {
            const div = a.division || 'General/Unassigned';
            if (!grouped[div]) grouped[div] = [];
            grouped[div].push(a);
        });

        let html = '<option value="">-- Select Reporting Manager --</option>';
        for (const [div, users] of Object.entries(grouped)) {
            html += `<optgroup label="${div}">`;
            users.forEach(u => {
                html += `<option value="${u.fullName} (${u.formData?.designation || 'Manager'})">${u.fullName} - ${u.formData?.designation || 'Manager'}</option>`;
            });
            html += `</optgroup>`;
        }
        
        const currentVal = select.value;
        select.innerHTML = html;
        select.value = currentVal;
    } catch (e) {
        console.error("Failed to populate managers:", e);
    }
}

async function deleteDivision(id) {
    if (!confirm("Remove this division?")) return;
    await fetch(`/api/admin/divisions/${id}`, { method: 'DELETE' });
    populateDivisions();
}

function renderDesignationList() {
    const list = document.getElementById('profileDesignationList');
    if (!list) return;
    const desgs = companyData.designations || [];
    list.innerHTML = desgs.map(d => `
        <div class="division-chip" style="background: rgba(168,85,247,0.1); border: 1px solid rgba(168,85,247,0.3);">
            ${d}
            <button onclick="deleteDesignation('${d.replace(/'/g, '\\\'')}')">&times;</button>
        </div>
    `).join('');
}

async function addDesignation() {
    const input = document.getElementById('profileNewDesignationInput');
    const name = input ? input.value.trim() : "";
    if (!name) return;
    if (!companyData.designations) companyData.designations = [];
    if (!companyData.designations.includes(name)) {
        companyData.designations.push(name);
        await submitProfileUpdate({ designations: companyData.designations }, true);
        if (input) input.value = "";
        renderDesignationList();
        applyCompanyData();
        showToast("Designation added successfully");
    }
}

async function deleteDesignation(name) {
    if (!confirm(`Delete designation "${name}"?`)) return;
    companyData.designations = companyData.designations.filter(d => d !== name);
    await submitProfileUpdate({ designations: companyData.designations }, true);
    renderDesignationList();
    applyCompanyData();
    showToast("Designation deleted");
}



function injectDummyApplicant() {
    const fyFrom = companyData.fyFrom ? new Date(companyData.fyFrom) : new Date();
    const fyTo = companyData.fyTo ? new Date(companyData.fyTo) : new Date();
    const fyShort = `${String(fyFrom.getFullYear()).slice(2)}-${String(fyTo.getFullYear()).slice(2)}`;

    const dummy = {
        fullName: "SMRUTI RANJAN DASH",
        email: "test@dummy.com",
        refNo: `EMY/OFR/${companyData.offerCounter || 1001}/${fyShort}`,
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
function compressAndResize(file, maxWidth = 1000) {
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
                const dataUrl = canvas.toDataURL(file.type || 'image/jpeg', 0.7); 
                resolve(dataUrl);
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
}

// --- LIVE DOCUMENT PREVIEW ---
async function previewActiveTemplate() {
    const type = document.getElementById('activeTemplateSelect').value;
    const editorHtml = document.getElementById('unifiedEditor').innerHTML.trim();
    
    if (!editorHtml || editorHtml === '<br>') {
        showToast("Editor is empty", "error");
        return;
    }

    const dummyEmail = "preview_" + Date.now() + "@emyris.test";
    const dummyRef = `REF/PRV/TEST_01`;
    
    // Inject realistic mockup data directly into memory
    const mockApplicant = {
        fullName: "SMRUTI RANJAN DASH",
        firstName: "SMRUTI",
        email: dummyEmail,
        phone: "+91 98765 43210",
        division: "CRITIZA",
        reportingTo: "SR. ZONAL MANAGER",
        refNo: dummyRef,
        formData: {
            firstName: "SMRUTI",
            lastName: "DASH",
            designation: "PRODUCT MANAGER",
            hq: "BHUBANESWAR",
            salary: "75000",
            address: "PLOT NO-42, CHANDRASEKHARPUR",
            city: "BHUBANESWAR",
            state: "ODISHA",
            pin: "751024",
            joiningDate: new Date().toISOString().split('T')[0]
        }
    };

    lockUI("⏳ Generating Live Preview...");
    
    // Create shallow copies to prevent contaminating real data
    const originalConfig = { ...companyData };
    const originalApplicants = [...allApplicants];
    const originalTemplate = window.letterTemplates[type];
    
    try {
        // Feed live unsaved editor states into the generator's memory
        window.letterTemplates[type] = editorHtml;
        
        companyData.headerHeight = parseInt(document.getElementById('headerHeight')?.value || 65);
        companyData.footerHeight = parseInt(document.getElementById('footerHeight')?.value || 25);
        companyData.letterFontSize = parseFloat(document.getElementById('letterFontSize')?.value || 11);
        companyData.letterAlignment = document.getElementById('letterAlignment')?.value || 'left';
        companyData.letterFontType = document.getElementById('letterFontType')?.value || 'helvetica';
        companyData.signatoryName = document.getElementById('signatoryName')?.value || "";
        companyData.signatoryDesignation = document.getElementById('signatoryDesg')?.value || "";

        const targetEmail = document.getElementById('hubTargetApplicant')?.value;
        const realApp = allApplicants.find(a => a.email === targetEmail);
        const finalApp = realApp || mockApplicant;
        const finalEmail = realApp ? realApp.email : dummyEmail;

        if (!realApp) {
            allApplicants.push(mockApplicant);
        }
        
        const pdfData = await generateLetterPDF(finalEmail, type);
        
        if (pdfData && pdfData.doc) {
            savePDF(pdfData.doc, `PREVIEW_${type.toUpperCase()}.pdf`);
            showToast("✅ PDF Preview Generated", "success");
            
            // Handle placeholders for live frame
            const finalHtml = fillLetterPlaceholders(editorHtml, finalApp);
            updateLivePreviewFrame(finalHtml, realApp ? realApp.refNo : dummyRef);
        } else {
            showToast("❌ Generation failed", "error");
        }
        
    } catch (e) {
        console.error("Live Preview Error:", e);
        showToast("❌ Preview Generation Failed", "error");
    } finally {
        // Absolute guarantee: restore the global state exactly to how it was
        companyData = originalConfig;
        allApplicants = originalApplicants;
        window.letterTemplates[type] = originalTemplate;
        unlockUI();
    }
}

// --- VISUAL PREVIEW UI LOGIC ---
function toggleLivePreviewUI(show) {
    const container = document.getElementById('livePreviewContainer');
    const editor = document.getElementById('unifiedEditor');
    const toolbar = document.querySelector('.editor-toolbar');
    const adminBar = document.querySelector('.editor-admin-bar');
    
    if (!container || !editor) return;
    
    if (show) {
        container.classList.remove('hidden');
        editor.classList.add('hidden');
        if (toolbar) toolbar.style.display = 'none';
        if (adminBar) adminBar.style.display = 'none';
        updateLivePreviewFrame();
        // Scroll to the start of the preview frame
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        container.classList.add('hidden');
        editor.classList.remove('hidden');
        if (toolbar) toolbar.style.display = 'flex';
        if (adminBar) adminBar.style.display = 'flex';
    }
}

function updateLivePreviewFrame(specificHtml = null, specificRef = "REF/PRV/LIVE") {
    const frame = document.getElementById('livePreviewFrame');
    if (!frame) return;
    
    const html = specificHtml || document.getElementById('unifiedEditor').innerHTML;
    let rendered = html;
    
    // 1. Apply Background Letterhead to simulate the PDF
    const lhArr = companyData.letterheadImage || [];
    if (lhArr.length) {
        const val = lhArr[lhArr.length - 1].data;
        frame.style.backgroundImage = `url(${val})`;
        frame.style.backgroundSize = 'contain';
        frame.style.backgroundRepeat = 'no-repeat';
        frame.style.backgroundPosition = 'center';
    } else {
        frame.style.backgroundImage = 'none';
    }

    // 2. High-Fidelity Placeholder replacement
    const todayStr = new Date().toLocaleDateString('en-GB');
    const placeholders = {
        '{{REF_NO}}': specificRef,
        '{{TODAY_DATE}}': todayStr,
        '{{FULL_NAME}}': 'SMRUTI RANJAN DASH',
        '{{FIRST_NAME}}': 'SMRUTI',
        '{{DESIGNATION}}': 'PRODUCT MANAGER',
        '{{HQ}}': 'BHUBANESWAR',
        '{{SALARY_MONTHLY}}': '75,000',
        '{{SALARY_ANNUAL}}': '9,00,000',
        '{{SIGNATORY_NAME}}': document.getElementById('signatoryName')?.value || 'AUTHORIZED SIGNATORY',
        '{{SIGNATORY_DESG}}': document.getElementById('signatoryDesg')?.value || 'COMPANY OFFICIAL',
        '{{COMPANY_NAME}}': companyData.name || 'EMYRIS BIOLIFESCIENCES',
        '{{JOINING_DATE}}': formatDatePretty(new Date().toISOString())
    };

    Object.entries(placeholders).forEach(([key, val]) => {
        const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        rendered = rendered.replace(regex, `<span class="preview-highlight">${val}</span>`);
    });

    frame.innerHTML = rendered;
    
    // 3. Apply Real-time Styles accurately
    const size = document.getElementById('letterFontSize')?.value || 11;
    const type = document.getElementById('letterFontType')?.value || 'helvetica';
    const align = document.getElementById('letterAlignment')?.value || 'left';
    const marginT = document.getElementById('headerHeight')?.value || 65;
    const marginB = document.getElementById('footerHeight')?.value || 25;

    let fontStack = "'Courier New', monospace";
    if (type === 'times') fontStack = "'Times New Roman', Times, serif";
    else if (type === 'helvetica') fontStack = "'Plus Jakarta Sans', Arial, sans-serif";
    else if (type === 'verdana') fontStack = "Verdana, Geneva, sans-serif";
    
    frame.style.fontSize = `${size}pt`;
    frame.style.fontFamily = fontStack;
    frame.style.textAlign = align;
    frame.style.paddingTop = `${marginT}mm`;
    frame.style.paddingBottom = `${marginB}mm`;
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

    let template = "";
    if (type === 'offer') template = companyData.offerLetterBody;
    else if (type === 'appt') template = companyData.apptLetterBody;
    else if (type.startsWith('misc_')) {
        const id = type.split('_')[1];
        const miscObj = (companyData.miscLetters || []).find(m => m.id === id);
        if (miscObj) template = miscObj.body;
    }
    
    if (!template) return alert(`Please configure the letter template in Setup first.`);

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
    const mergedHTML = fillLetterPlaceholders(cleanedTemplate, app);
    
    let yMarker = MARGIN_T;
    
    const drawPageExtras = () => {
        const lhArr = companyData.letterheadImage || [];
        if (lhArr.length) {
            const val = lhArr[lhArr.length - 1].data;
            doc.addImage(val, 'PNG', 0, 0, 210, 297);
        }
    };

    drawPageExtras();

    // Monkey-patch to ensure background/header is drawn on all newly auto-generated pages
    const originalAddPage = doc.addPage.bind(doc);
    doc.addPage = function() {
        originalAddPage(...arguments);
        drawPageExtras();
        return doc;
    };
    
    // Draw Ref No & Date in TOP RIGHT
    doc.setFont(FONT_TYPE, "bold");
    doc.setFontSize(FONT_SIZE);
    doc.text(`Ref: ${refNo}`, 188, yMarker, { align: 'right' });
    yMarker += LINE_H;
    doc.text(`Date: ${todayDate}`, 188, yMarker, { align: 'right' });
    yMarker += LINE_H * 2; // Extra gap after metadata

    // Instead of raw text splitting, we use doc.html onto the precise container
    // To do this reliably with drawPageExtras spanning multiple pages, we first draw html 
    // And intercept adding pages by hooking or drawing overlay after.
    
    return new Promise((resolve) => {
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = mergedHTML;
        // Exact styling for html2canvas to match jsPDF output
        tempContainer.style.width = (USABLE_W * 3.779527) + 'px'; // Convert mm to px at 96PPI
        tempContainer.style.fontFamily = FONT_TYPE === 'helvetica' ? "Arial, sans-serif" : (FONT_TYPE === 'times' ? "Times New Roman, serif" : "Courier New, monospace");
        tempContainer.style.fontSize = (FONT_SIZE * 1.3333) + 'px'; // Convert pt to px
        tempContainer.style.lineHeight = '1.6';
        tempContainer.style.textAlign = ALIGN;
        tempContainer.style.position = 'absolute';
        tempContainer.style.top = '-9999px';
        tempContainer.style.left = '-9999px';
        tempContainer.style.whiteSpace = 'pre-wrap'; // Preserve tabs/spaces
        document.body.appendChild(tempContainer);

        doc.html(tempContainer, {
            x: MARGIN_L,
            y: yMarker,
            width: USABLE_W,
            windowWidth: (USABLE_W * 3.779527),
            autoPaging: 'text',
            margin: [MARGIN_T, MARGIN_R, MARGIN_B, MARGIN_L], // top, right, bottom, left
            callback: function (pdf) {
                document.body.removeChild(tempContainer);

                // html2canvas doesn't know about `drawPageExtras`, so we must draw it retroactively on all pages.
                // It also creates fresh blank pages. We draw our background on them.
                const pageCount = pdf.internal.getNumberOfPages();
                for(let i = 1; i <= pageCount; i++) {
                    pdf.setPage(i);
                    // We must use image in background, but jsPDF paints over. 
                    // Actually, drawPageExtras doesn't erase text if drawn correctly, but to avoid overlapping issues,
                    // doc.html has already painted text. If we draw image now it might be behind because jsPDF is cumulative vector?
                    // NO, jsPDF draws in z-index order. So image drawn now covers text!
                    // BUT wait! `doc.html` is vector! We can hook but jsPDF `insertPage` is complex.
                    
                    // IF we are dealing with a standard header, let's just draw the Header & Signatory on the LAST page.
                }

                // Since we need background first, doc.html takes over. We can't safely insert backgrounds UNDER html2canvas without complex API.
                // A very robust compromise: We draw the stamp and signature relative to the end of the document.
                let finalY = MARGIN_T; 
                // We know doc.html leaves us at the last page.
                
                // Signatory Logic
                pdf.setPage(pageCount);
                // Approximate Y position - sadly html() doesn't return final Y. We could use margins reliably by leaving space.
                // Let's draw signature at fixed bottom for robust layout since HTML pushed content.
                finalY = PAGE_H - MARGIN_B - 45; 
                
                const stampArr = companyData.stamp || [];
                if (stampArr.length) pdf.addImage(stampArr[stampArr.length - 1].data, 'PNG', MARGIN_L, finalY, 35, 35);
                
                const sigArr = companyData.digitalSignature || [];
                if (sigArr.length) pdf.addImage(sigArr[sigArr.length - 1].data, 'PNG', 145, finalY + 10, 45, 20);
                
                finalY += 42;
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(FONT_SIZE);
                pdf.text("Authorized Signatory", MARGIN_L, finalY);
                pdf.text(companyData.signatoryName || "", 145, finalY);
                pdf.setFontSize(9);
                pdf.setFont("helvetica", "normal");
                pdf.text(companyData.name, MARGIN_L, finalY + 5);
                pdf.text(companyData.signatoryDesignation || "", 145, finalY + 5);

                resolve({ doc: pdf });
            }
        });
    });
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
        "{{FATHER_NAME}}": (fd.fatherName || "").toUpperCase(),
        "{{DOB}}": fd.dob || "",
        "{{BLOOD_GROUP}}": (fd.bloodGroup || "").toUpperCase(),
        "{{PAN_NO}}": (fd.panNo || "").toUpperCase(),
        "{{PHONE}}": fd.phone || "",
        "{{ADDRESS}}": (fd.address || ""),
        "{{CITY_STATE}}": `${fd.city || ""}, ${fd.state || ""}`.toUpperCase(),
        "{{PIN}}": fd.pin || "",
        "{{DESIGNATION}}": (fd.designation || "").toUpperCase(),
        "{{EMP_CODE}}": app.empCode || `EMY/EMPC/${companyData.empCodeCounter || 1001}`,
        "{{DIVISION}}": (app.division || "").toUpperCase(),
        "{{HQ}}": (fd.hq || "").toUpperCase(),
        "{{REPORTING_TO}}": (app.reportingTo || "").toUpperCase(),
        "{{SALARY_MONTHLY}}": Number(fd.salary || 0).toLocaleString('en-IN'),
        "{{SALARY_ANNUAL}}": (Number(fd.salary || 0) * 12).toLocaleString('en-IN'),
        "{{SALARY_WORDS}}": numberToWords(Number(fd.salary || 0)),
        "{{BANK_NAME}}": (fd.bankName || "").toUpperCase(),
        "{{BANK_ACC}}": fd.accNo || "",
        "{{IFSC}}": (fd.ifsc || "").toUpperCase(),
        "{{JOINING_DATE}}": formatDatePretty(fd.joiningDate),
        "{{COMPANY_NAME}}": companyData.name,
        "{{SIGNATORY_NAME}}": companyData.signatoryName || "",
        "{{SIGNATORY_DESG}}": companyData.signatoryDesignation || "",
        "{{SALARY_BREAKUP}}": (() => {
            const sal = app.salaryBreakup || {};
            const formatRs = (num) => 'Rs. ' + (Number(num) || 0).toLocaleString('en-IN');
            const total = (Number(sal.basic)||0) + (Number(sal.hra)||0) + (Number(sal.lta)||0) + (Number(sal.conveyance)||0) + 
                          (Number(sal.medical)||0) + (Number(sal.special)||0) + (Number(sal.edu)||0) + (Number(sal.fixed)||0);
            return `
            <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 15px; font-size: 14px; border: 1px solid #333;">
                <thead>
                    <tr style="background: #f4f4f4;">
                        <th style="border: 1px solid #333; padding: 8px; text-align: left;">Earnings Components</th>
                        <th style="border: 1px solid #333; padding: 8px; text-align: right;">Amount (Monthly)</th>
                        <th style="border: 1px solid #333; padding: 8px; text-align: right;">Amount (Annual)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="border: 1px solid #333; padding: 6px 8px;">Basic Salary</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs(sal.basic)}</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs((sal.basic||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid #333; padding: 6px 8px;">HRA</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs(sal.hra)}</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs((sal.hra||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid #333; padding: 6px 8px;">Leave Travel Allowance (LTA)</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs(sal.lta)}</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs((sal.lta||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid #333; padding: 6px 8px;">Conveyance Allowance</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs(sal.conveyance)}</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs((sal.conveyance||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid #333; padding: 6px 8px;">Medical Allowance</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs(sal.medical)}</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs((sal.medical||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid #333; padding: 6px 8px;">Special Allowance</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs(sal.special)}</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs((sal.special||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid #333; padding: 6px 8px;">Education Allowance</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs(sal.edu)}</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs((sal.edu||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid #333; padding: 6px 8px;">Fixed Allowance</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs(sal.fixed)}</td><td style="border: 1px solid #333; padding: 6px 8px; text-align: right;">${formatRs((sal.fixed||0)*12)}</td></tr>
                    <tr style="font-weight: bold; background: #e9e9e9;"><td style="border: 1px solid #333; padding: 8px;">Gross Total</td><td style="border: 1px solid #333; padding: 8px; text-align: right;">${formatRs(total)}</td><td style="border: 1px solid #333; padding: 8px; text-align: right;">${formatRs(total*12)}</td></tr>
                </tbody>
            </table>
            `;
        })()
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
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim() + " Only";
}

async function viewDocument(idOrData) {
    if (!idOrData) return;
    
    // Open window immediately to avoid popup blockers
    const win = window.open("", "_blank");
    win.document.write("<html><head><title>Loading Document...</title></head><body style='background:#0f172a; color:white; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;'><div>⌛ Loading Document Data... Please wait.</div></body></html>");

    let finalData = idOrData;
    if (!idOrData.startsWith('data:')) {
        try {
            const res = await fetch(`/api/admin/document/${idOrData}`);
            const result = await res.json();
            if (result.data) finalData = result.data;
            else throw new Error("Missing data in response");
        } catch (e) {
            console.error("Fetch failed:", e);
            win.document.body.innerHTML = "❌ Failed to load document data. It may have been cleared or the connection was lost.";
            return;
        }
    }
    
    // Clear and write final content
    win.document.open();
    if (finalData.startsWith('data:image')) {
        win.document.write(`<html><head><title>View Document</title></head><body style="margin:0; background:#000; display:flex; justify-content:center;"><img src="${finalData}" style="max-width:100%; height:auto;"></body></html>`);
    } else {
        win.document.write(`<html><head><title>View Document</title></head><body style="margin:0;"><iframe src="${finalData}" frameborder="0" style="border:0; width:100%; height:100%;" allowfullscreen></iframe></body></html>`);
    }
    win.document.close();
}

async function downloadAsset(idOrData, name) {
    if (!idOrData) return;
    let finalData = idOrData;
    
    if (!idOrData.startsWith('data:')) {
        try {
            showToast("⌛ Preparing Download...", "secondary");
            const res = await fetch(`/api/admin/document/${idOrData}`);
            const result = await res.json();
            if (result.data) finalData = result.data;
            else throw new Error("Fail");
        } catch (e) {
            return showToast("❌ Download failed", "error");
        }
    }

    const a = document.createElement('a');
    a.href = finalData;
    a.download = (name || 'document').replace(/[^a-z0-9]/gi, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

function downloadApplicantPDF(email) {
    const app = allApplicants.find(a => a.email === email);
    if (!app || !app.formData) return alert("No data found for this applicant.");

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    const logoArr = companyData.logo || [];
    if (logoArr.length > 0) {
        try {
            doc.addImage(logoArr[logoArr.length-1].data, 'PNG', 15, 12, 35, 35);
        } catch(e) { console.warn("PDF Logo failed", e); }
    }

    doc.setFontSize(22);
    doc.setTextColor(15, 23, 42);
    doc.text(companyData.name || "Onboarding Record", 55, 25);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`User Key: ${app.email}`, 55, 32);
    doc.text(`Status: ${app.status.toUpperCase()} | Generated: ${new Date().toLocaleString()}`, 55, 37);

    let y = 50;
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
    const originalText = submitBtn.innerText;
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
        } else {
            alert("Submission failed.");
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    } catch (err) { 
        alert("Server error."); 
        submitBtn.innerText = originalText;
        submitBtn.disabled = false;
    }
});

// --- MASTER EDITOR v2.0 CORE LOGIC ---
function copyTag(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`Copied: ${text}`, 'success');
    });
}

function execCmd(command, value = null) {
    document.getElementById('unifiedEditor').focus();
    document.execCommand(command, false, value);
}

function syncEditorStyles() {
    const editor = document.getElementById('unifiedEditor');
    const font = document.getElementById('letterFontType').value;
    const size = document.getElementById('letterFontSize').value;
    const align = document.getElementById('letterAlignment').value || 'left';
    editor.style.fontFamily = font === 'helvetica' ? 'Helvetica, Arial, sans-serif' : font === 'times' ? '"Times New Roman", Times, serif' : font === 'courier' ? '"Courier New", Courier, monospace' : 'Verdana, sans-serif';
    editor.style.fontSize = size + 'pt';
    editor.style.textAlign = align;
}

function openTemplateEditor(type) {
    switchAdminTab('setup');
    document.getElementById('activeTemplateSelect').value = type;
    switchEditorTemplate();
    window.scrollTo({ top: document.querySelector('.editor-card').offsetTop - 50, behavior: 'smooth' });
}

function switchEditorTemplate() {
    const type = document.getElementById('activeTemplateSelect').value;
    const editor = document.getElementById('unifiedEditor');
    
    // Load from companyData
    let body = "";
    if (type === 'offer') body = companyData.offerLetterBody || "";
    else if (type === 'appt') body = companyData.apptLetterBody || "";
    else if (type === 'confirm') body = companyData.confirmLetterBody || "";
    else if (type === 'revised_salary') body = companyData.revisedSalaryBody || "";
    else if (type === 'incentive') body = companyData.incentiveCircularBody || "";
    
    if(!body && type === 'offer') body = `{{REF_NO}}\nDate: {{TODAY_DATE}}\n\nTo,\n{{TITLE_SHORT}} {{FULL_NAME}}\n{{ADDRESS}}\n{{CITY_STATE}} - {{PIN}}\n\nSubject: Offer of Employment\n\nDear {{TITLE_SHORT}} {{FULL_NAME}},\n\nWith reference to your application and subsequent interview you had with us, we are pleased to appoint you as {{DESIGNATION}} in our organization {{COMPANY_NAME}} on the following terms and conditions:\n\n1. DATE OF JOINING: Your date of joining will be {{JOINING_DATE}}.\n\n2. HEADQUARTER: Your headquarter will be {{HQ}}.\n\n3. REPORTING: You will report to {{REPORTING_TO}} or anyone else as decided by the management.\n\n4. REMUNERATION: Your monthly gross salary will be Rs. {{SALARY_MONTHLY}}/- totaling an Annual CTC of Rs. {{SALARY_ANNUAL}}/- ({{SALARY_WORDS}}).\n\nWe look forward to a long and mutually beneficial association.\n\nBest Regards,\n\n{{SIGNATORY_NAME}}\n{{SIGNATORY_DESG}}\n{{COMPANY_NAME}}`;
    
    // Convert newlines to HTML breaks if needed, but assuming HTML since it's a rich editor. If plain text, convert.
    if (body.includes('<') && body.includes('>')) {
        editor.innerHTML = body;
    } else {
        editor.innerHTML = body.replace(/\\n/g, '<br>');
    }
    
    document.getElementById('letterFontType').value = companyData.letterFontType || 'helvetica';
    document.getElementById('letterFontSize').value = companyData.letterFontSize || 11;
    document.getElementById('headerHeight').value = companyData.headerHeight || 65;
    document.getElementById('footerHeight').value = companyData.footerHeight || 25;
    document.getElementById('signatoryName').value = companyData.signatoryName || "";
    document.getElementById('signatoryDesg').value = companyData.signatoryDesignation || "";
    
    syncEditorStyles();
}

async function saveActiveTemplate() {
    const type = document.getElementById('activeTemplateSelect').value;
    const body = document.getElementById('unifiedEditor').innerHTML;
    const fontType = document.getElementById('letterFontType').value;
    const fontSize = document.getElementById('letterFontSize').value;
    const headerHeight = document.getElementById('headerHeight').value;
    const footerHeight = document.getElementById('footerHeight').value;
    const signatoryName = document.getElementById('signatoryName').value;
    const signatoryDesg = document.getElementById('signatoryDesg').value;

    try {
        lockUI("💾 Saving Template...");
        const res = await fetch('/api/admin/save-template', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                type, body, 
                fontType, fontSize, headerHeight, footerHeight, 
                signatoryName, signatoryDesg 
            })
        });
        const data = await res.json();
        if (data.success) {
            showToast("✅ Template saved successfully!", "success");
            await fetchCompanyData(); // refresh local data
        } else {
            showToast("❌ Failed to save template", "error");
        }
    } catch (e) {
        showToast("❌ Network error saving template", "error");
    } finally {
        unlockUI();
    }
}

function toggleLivePreviewUI(show) {
    const editor = document.getElementById('unifiedEditor');
    const previewContainer = document.getElementById('livePreviewContainer');
    const previewFrame = document.getElementById('livePreviewFrame');
    
    if (show) {
        editor.classList.add('hidden');
        document.querySelector('.editor-toolbar').classList.add('hidden');
        previewContainer.classList.remove('hidden');
        
        let content = editor.innerHTML;
        // Inject dummy variables to see how it looks
        const type = document.getElementById('activeTemplateSelect').value;
        const fyFrom = companyData.fyFrom ? new Date(companyData.fyFrom) : new Date();
        const fyTo = companyData.fyTo ? new Date(companyData.fyTo) : new Date();
        const fyShort = `${String(fyFrom.getFullYear()).slice(2)}-${String(fyTo.getFullYear()).slice(2)}`;
        
        let refPrefix = 'EMY/OFR';
        let refCounter = companyData.offerCounter || 1001;
        if(type === 'appt') { refPrefix = 'EMY/APT'; refCounter = companyData.apptCounter || 1001; }
        else if(type === 'confirm' || type === 'revised_salary' || type === 'incentive') { refPrefix = 'EMY/MISC'; refCounter = companyData.miscCounter || 1001; }

        const dummyData = {
            '{{FULL_NAME}}': 'John Doe',
            '{{FIRST_NAME}}': 'John',
            '{{TITLE_SHORT}}': 'Mr.',
            '{{ADDRESS}}': '123 Main Street',
            '{{CITY_STATE}}': 'Metropolis, NY',
            '{{PIN}}': '10001',
            '{{DESIGNATION}}': 'Senior Developer',
            '{{EMP_CODE}}': `EMY/EMPC/${companyData.empCodeCounter || 1001}`,
            '{{COMPANY_NAME}}': companyData.name || 'Emyris Bio',
            '{{JOINING_DATE}}': new Date().toLocaleDateString(),
            '{{HQ}}': 'New York',
            '{{REPORTING_TO}}': 'Jane Smith',
            '{{SALARY_MONTHLY}}': '100,000',
            '{{SALARY_ANNUAL}}': '1,200,000',
            '{{SALARY_WORDS}}': 'Twelve Lakhs Only',
            '{{SIGNATORY_NAME}}': document.getElementById('signatoryName').value || 'HR Head',
            '{{SIGNATORY_DESG}}': document.getElementById('signatoryDesg').value || 'Human Resources',
            '{{REF_NO}}': `${refPrefix}/${refCounter}/${fyShort}`,
            '{{TODAY_DATE}}': new Date().toLocaleDateString()
        };
        
        for (const [key, val] of Object.entries(dummyData)) {
            content = content.replace(new RegExp(key, 'g'), val);
        }
        
        const fontStr = document.getElementById('letterFontType').value;
        const fontMap = {
            'helvetica': 'Helvetica, Arial, sans-serif',
            'times': '"Times New Roman", Times, serif',
            'courier': '"Courier New", Courier, monospace',
            'verdana': 'Verdana, sans-serif'
        };
        
        const html = `<div style="font-family: ${fontMap[fontStr]}; font-size: ${document.getElementById('letterFontSize').value}pt; padding: 20px; text-align: ${document.getElementById('letterAlignment').value || 'left'}">${content}</div>`;
        previewFrame.innerHTML = html;
        previewFrame.style.background = 'white';
        previewFrame.style.color = 'black';
        previewFrame.style.minHeight = '500px';
        previewFrame.style.borderRadius = '8px';
        previewFrame.style.padding = '20px';
    } else {
        previewContainer.classList.add('hidden');
        editor.classList.remove('hidden');
        document.querySelector('.editor-toolbar').classList.remove('hidden');
    }
}

async function previewActiveTemplate() {
    showToast("Generating PDF preview...", "success");
    const doc = new window.jspdf.jsPDF();
    const frame = document.getElementById('livePreviewFrame');
    
    html2canvas(frame, { scale: 2 }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
        
        doc.addImage(imgData, 'JPEG', 0, parseInt(document.getElementById('headerHeight').value) || 20, pdfWidth, pdfHeight);
        doc.save('Template_Preview.pdf');
    });
}


// --- SYSTEM MAINTENANCE ---
async function nukeDatabase() {
    if (!confirm("🚨 WARNING: This will permanently delete ALL applicant data and reset all counters. This action cannot be undone!")) return;
    if (!confirm("Are you ABSOLUTELY sure?")) return;

    try {
        lockUI("☢️ Nuking Database...");
        const res = await fetch('/api/admin/system/clear', { method: 'POST' });
        const result = await res.json();
        if (result.success) {
            showToast("💥 Database cleared successfully!", "success");
            await fetchApplicants();
            await fetchCompanyData();
            switchAdminTab('applicants');
        }
    } catch (e) { showToast("❌ Reset failed", "error"); }
    finally { unlockUI(); }
}



async function vacuumAssets() {
    if (!confirm("This will prune the asset history, keeping only the currently active version of each asset to save space. Proceed?")) return;

    try {
        lockUI("🧹 Vacuuming Assets...");
        const res = await fetch('/api/admin/system/vacuum', { method: 'POST' });
        const result = await res.json();
        if (result.success) {
            showToast("✨ Assets vacuumed successfully!", "success");
            await fetchCompanyData();
            renderAssetLists();
        }
    } catch (e) { showToast("❌ Vacuum failed", "error"); }
    finally { unlockUI(); }
}

async function exportDatabase() {
    window.location.href = '/api/admin/system/export';
}

async function fetchLifecycleAlerts() {
    try {
        const res = await fetch('/api/admin/lifecycle-check');
        const alerts = await res.json();
        const container = document.getElementById('lifecycleAlertsContainer');
        const list = document.getElementById('lifecycleAlertsList');
        
        if (alerts && alerts.length > 0) {
            container.classList.remove('hidden');
            list.innerHTML = alerts.map(a => `
                <div class="dash-alert ${a.type === 'APPOINTMENT_PENDING' ? 'info' : 'warning'}" style="margin:0; padding:10px 15px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <span style="font-size:0.9rem; color: #fff;">${a.type === 'APPOINTMENT_PENDING' ? '📅' : '🕵️'} ${a.message}</span>
                    <button class="btn btn-sm btn-outline" style="padding:4px 10px; font-size:0.75rem; border-color: rgba(99,102,241,0.5); color: #fff;" onclick="openWorkflow('${a.email}')">Action Required</button>
                </div>
            `).join('');
        } else {
            container.classList.add('hidden');
        }
    } catch (e) { console.error("Lifecycle check failed", e); }
}

async function fetchApplicants() {
    try {
        const res = await fetch('/api/admin/applicants');
        const data = await res.json();
        
        if (Array.isArray(data)) {
            allApplicants = data;
            calculateStats(allApplicants);
            renderApplicantsTable(allApplicants);
        } else {
            console.error("Failed to fetch applicants:", data);
            showToast("⚠️ Could not load applicant data", "error");
        }
    } catch (err) {
        console.error("Fetch applicants crash:", err);
    }
}

async function populateHubApplicantSelect() {
    const sel = document.getElementById('hubTargetApplicant');
    if (!sel) return;
    
    // Ensure we have current allApplicants data
    if (!allApplicants.length) {
        const res = await fetch('/api/admin/applicants');
        allApplicants = await res.json();
    }
    
    // Select approved or ongoing ones
    const filtered = allApplicants.filter(a => ['approved', 'submitted', 'onboarding'].includes(a.status));
    sel.innerHTML = '<option value="">-- Choose Target --</option>' + 
        filtered.map(a => `<option value="${a.email}">${a.fullName}</option>`).join('');
}

async function publishLetterToHub() {
    const email = document.getElementById('hubTargetApplicant').value;
    const type = document.getElementById('activeTemplateSelect').value;
    const content = document.getElementById('unifiedEditor').innerHTML.trim();
    
    if (!email) return alert("Please select a target applicant from the 'Target Applicant' dropdown first.");
    if (!content || content === '<br>') return alert("Letter is empty.");

    if (!confirm(`Are you sure you want to officially publish this ${type.toUpperCase()} template to ${email}'s dashboard node?`)) return;

    try {
        lockUI(`🌐 Publishing to Hub...`);
        const res = await fetch('/api/admin/save-letter-snapshot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, letterType: type, letterData: content })
        });
        const result = await res.json();
        if (result.success) {
            showToast(`✅ ${type.toUpperCase()} published successfully!`, "success");
            // Also mark the task as done in the pipeline if it's offer or appt
            let taskKey = "";
            if (type === 'offer') taskKey = 'offerLetter';
            else if (type === 'appt') taskKey = 'appointmentLetter';

            if (taskKey) {
                await fetch('/api/admin/update-task', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, task: taskKey, completed: true })
                });
            }
        }
    } catch (e) { alert("Publication failed. Check server."); }
    finally { unlockUI(); }
}

// Master initialization
async function initializeApp() {
    console.log('🚀 Emyris App initialized');
    await fetchCompanyData();
    initBackgroundAnimations();
}

window.onload = initializeApp;
