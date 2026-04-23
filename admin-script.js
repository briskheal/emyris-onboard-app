console.log('📬 admin-script.js: Admin Gateway Active');
let currentStep = 1;
let isSaving = false;
let companyData = { name: "", address: "", phone: "", tollFree: "", website: "", logo: "" };
let currentApplicant = null;
let allApplicants = [];
let allHQs = [];
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
    const confirm3 = confirm("✅ Also clear all Divisions and HQs? (Click 'OK' for a total fresh start)");
    
    try {
        lockUI("☢️ Nuking Database... Please Wait");
        const res = await fetch('/api/admin/system/clear', { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ includeSetup: confirm3 })
        });
        if ((await res.json()).success) {
            showToast("✅ Database cleared successfully", "success");
            await fetchCompanyData();
            await fetchApplicants(); 
            switchAdminTab('profile'); 
        }
    } catch (e) { showToast("❌ System wipe failed", "error"); }
    finally { unlockUI(); }
}

// --- EXISTING STAFF FAST-TRACK ---
function openExistingStaffModal() {
    const modal = document.getElementById('existingStaffModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.pointerEvents = 'all'; // Enable interaction when open
        // Small delay to allow CSS block rendering before fading in opacity
        setTimeout(() => modal.style.opacity = '1', 10);
        
        // Populate divisions and HQs
        const divSel = document.getElementById('ex_division');
        const hqSel = document.getElementById('ex_hq');
        
        // Assuming fetchHQs and Divs might already be cached. Let's build options:
        if (divSel && document.getElementById('v_division')) {
            divSel.innerHTML = document.getElementById('v_division').innerHTML;
        }
        if (hqSel && document.getElementById('v_hq')) {
            hqSel.innerHTML = document.getElementById('v_hq').innerHTML;
        }
    }
}

function closeExistingStaffModal() {
    const modal = document.getElementById('existingStaffModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.pointerEvents = 'none'; // Disable interactions when fading out
        setTimeout(() => modal.classList.add('hidden'), 300);
        document.getElementById('existingStaffForm').reset();
    }
}


async function submitExistingStaff(event) {
    event.preventDefault();
    lockUI("⚡ Fast-Tracking Existing Staff...");
    
    const data = {
        fullName: document.getElementById('ex_fullName').value,
        email: document.getElementById('ex_email').value,
        phone: document.getElementById('ex_phone').value,
        dob: document.getElementById('ex_dob').value,
        address: document.getElementById('ex_address').value,
        empCode: document.getElementById('ex_empCode').value,
        designation: document.getElementById('ex_designation').value,
        targetSalary: document.getElementById('ex_salary').value,
        joinDate: document.getElementById('ex_joinDate').value,
        division: document.getElementById('ex_division').value,
        hq: document.getElementById('ex_hq').value
    };

    try {
        const res = await fetch('/api/admin/add-existing-staff', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await res.json();
        if (result.success) {
            showToast("🎊 Existing staff member fast-tracked successfully!", "success");
            closeExistingStaffModal();
            await fetchApplicants(); // Refresh main table
            
            // Switch to Letters tab and set up the newly added person directly into Appointment
            updateView('adminDashboard');
            switchAdminTab('setup');
            
            setTimeout(async () => {
                const targetEmail = data.email;
                const templateSel = document.getElementById('activeTemplateSelect');
                if (templateSel) templateSel.value = 'appt'; // Default to appointment for existing staff
                await switchEditorTemplate();
                await populateHubApplicantSelect();
                
                const targetSel = document.getElementById('hubTargetApplicant');
                if (targetSel) targetSel.value = targetEmail;
            
                fillEditorWithRealData(true);
            }, 500);

        } else {
            showToast(result.message || "Failed to add staff.", "error");
        }
    } catch (e) {
        showToast("Network error. Please try again.", "error");
    } finally {
        unlockUI();
    }
}

// Utility functions now loaded from shared-utils.js

window.onbeforeunload = function() { if (isSaving) return "Changes you made may not be saved."; };

// Initialization handled by window.onload at bottom of file

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
        attachStatusListener(inputId, config);
    }
}

function initEditorListeners() {
    const editor = document.getElementById('unifiedEditor');
    if (!editor) return;

    // Paste Hygiene: Strip all HTML formatting to keep font/size uniform
    editor.addEventListener('paste', (e) => {
        e.preventDefault();
        const text = (e.originalEvent || e).clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        // Refresh preview after manual paste if applicable
        if (typeof fillEditorWithRealData === 'function') {
             // Optional: trigger a data sync if needed
        }
    });

    // Ensure uniformity when user types or deletes
    editor.addEventListener('input', () => {
        if (editor.innerHTML === "" || editor.innerHTML === "<br>") {
            editor.innerHTML = "<div><br></div>";
        }
    });
}

function attachStatusListener(inputId, config) {
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
    fetchHQs(); // Fetch HQs whenever company data is refreshed
}

function initBackgroundAnimations() {
    if (typeof gsap !== 'undefined') {
        gsap.to(".blob-1", { x: '+=50', y: '+=30', duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".blob-2", { x: '-=40', y: '+=60', duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }

    // Diagnostic Logging for Viewport Responsiveness
    window.addEventListener('resize', () => {
        console.log(`[Diagnostic] Viewport: ${window.innerWidth}x${window.innerHeight} | Orientation: ${window.innerWidth > window.innerHeight ? 'Landscape' : 'Portrait'}`);
    });
}

// Infrastructure Management (Divisions & HQs) moved to bottom for better organization

function applyCompanyData() {
    console.log('🏗️ Applying Company Data:', companyData);
    const dpName = document.getElementById('displayCompanyName');
    if (dpName) {
        dpName.innerText = companyData.name || 'Emyris Biolifesciences';
        console.log('✅ Updated Hero Name:', dpName.innerText);
    }
    const logoImg = document.getElementById('displayLogo');
    if (logoImg) {
        if (companyData.logo && companyData.logo.length > 0) {
            logoImg.src = companyData.logo[companyData.logo.length - 1].data;
            logoImg.classList.remove('hidden');
            console.log('✅ Updated Hero Logo');
        } else {
            console.log('⚠️ No Logo in companyData');
        }
    }
    const quickContact = document.getElementById('quickContact');
    const landingQuickContact = document.getElementById('landingQuickContact');
    const contactHTML = `
        ${companyData.phone ? `<div>📞 <a href="tel:${companyData.phone}" class="contact-link">${companyData.phone}</a></div>` : ''}
        ${companyData.tollFree ? `<div>☎️ Toll Free: <a href="tel:${companyData.tollFree}" class="contact-link">${companyData.tollFree}</a></div>` : ''}
        ${companyData.website ? `<div>🌐 <a href="${companyData.website}" target="_blank" class="contact-link">${companyData.website.replace('https://', '')}</a></div>` : ''}
    `;

    if (quickContact) quickContact.innerHTML = contactHTML;
    if (landingQuickContact) landingQuickContact.innerHTML = contactHTML;
    const headerTitle = document.getElementById('headerCompName');
    if (headerTitle) {
        headerTitle.innerText = (companyData.name || "").replace(/\s*PVT\s*LTD\.?\s*/gi, "").trim();
        console.log('✅ Updated Header Name:', headerTitle.innerText);
    }

    const headerImg = document.getElementById('headerLogoImg');
    const headerLogoLetter = document.getElementById('headerLogoLetter');
    const landingLogoFallback = document.getElementById('landingLogoFallback');
    
    if (companyData.logo && companyData.logo.length > 0 && headerImg) {
        const logoData = companyData.logo[companyData.logo.length - 1].data;
        headerImg.src = logoData;
        headerImg.classList.remove('hidden');
        if (headerLogoLetter) headerLogoLetter.style.display = 'none';
        if (landingLogoFallback) landingLogoFallback.style.display = 'none';
        console.log('✅ Updated Header Logo');
    } else {
        const initials = companyData.name ? companyData.name.split(' ').filter(Boolean).slice(0,2).map(w => w[0]).join('') : 'E';
        if (headerLogoLetter) {
            headerLogoLetter.innerText = initials;
            headerLogoLetter.style.display = 'inline';
        }
        if (landingLogoFallback) {
            landingLogoFallback.innerText = initials;
            landingLogoFallback.style.display = 'flex';
        }
        if (headerImg) headerImg.classList.add('hidden');
        console.log('Γä╣∩╕Å Using Initials:', initials);
    }

    try {
        if (typeof renderRequiredDocsChips === 'function') renderRequiredDocsChips();
        if (typeof renderRequiredDocsSuggestions === 'function') renderRequiredDocsSuggestions();
        if (typeof renderApplicantDocuments === 'function') renderApplicantDocuments();
        if (typeof loadSetupProfile === 'function') loadSetupProfile();
        
        // Populate datalist for department suggestions
        const deptList = document.getElementById('deptSuggestions');
        if (deptList) {
            const currentDesgs = companyData.designations || [];
            const depts = [...new Set(currentDesgs.map(d => typeof d === 'string' ? 'SALES' : d.department))];
            deptList.innerHTML = depts.map(dt => `<option value="${dt}">`).join('');
        }
        
        // Designation handled during registration; no longer needed in onboarding form step 3
        
        if (typeof renderDesignationList === 'function') renderDesignationList();
    } catch (e) { console.error('❌ Error in child layout functions:', e); }
    
    // Apply Marquee Settings from Company Profile
    const marqueeElements = document.querySelectorAll('.marquee-inner');
    const mText = companyData.marqueeText || "Enhancing Life and Excelling in Care";
    const mColor = companyData.marqueeColor || "#fbbf24"; 
    const mSpeed = `${companyData.marqueeSpeed || 15}s`;
    
    marqueeElements.forEach(el => {
        el.innerText = mText;
        el.style.color = mColor;
        el.style.animationDuration = mSpeed;
        el.style.opacity = '1';
    });
    console.log('✅ Marquees Synchronized with Profile Settings');
}

function applyMarqueePreview() {
    const text = document.getElementById('profile_marqueeText')?.value || '';
    const color = document.getElementById('profile_marqueeColor')?.value || '#fbbf24';
    const speed = document.getElementById('profile_marqueeSpeed')?.value || 15;
    
    // Update all Marquee elements
    const marquees = document.querySelectorAll('.marquee-inner');
    marquees.forEach(el => {
        el.innerText = text;
        el.style.color = color;
        el.style.animationDuration = `${speed}s`;
        el.style.opacity = '1';
    });
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
        chip.innerHTML = `<span>${isSelected ? '✅ ' : '+ '}${doc}</span>`;
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



function updateView(viewId) {
    const landingPage = document.getElementById('landingPage');
    const appShell = document.getElementById('appShell');
    const sections = document.querySelectorAll('.view-section');
    const indicator = document.getElementById('stepIndicator');

    // Reset Scroll
    window.scrollTo(0, 0);

    if (viewId === 'landingPage') {
        // Switch to Landing Architecture
        if (landingPage) landingPage.classList.remove('hidden');
        if (appShell) appShell.classList.add('hidden');
        document.body.classList.add('at-landing');
        console.log('[UI] Switched to Fullscreen Landing Screen');
    } else {
        // Switch to App Shell Architecture
        if (landingPage) landingPage.classList.add('hidden');
        if (appShell) appShell.classList.remove('hidden');
        document.body.classList.remove('at-landing');

        // Hide all inner sections
        sections.forEach(s => {
            s.classList.add('hidden');
            s.style.display = 'none';
            s.classList.remove('active');
        });

        // Show targets
        const activeSection = document.getElementById(viewId);
        if (activeSection) {
            activeSection.classList.remove('hidden');
            activeSection.style.display = (viewId === 'adminDashboard') ? 'flex' : 'block';
            activeSection.classList.add('active');
            
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(activeSection, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
            }
        }

        // Show/Hide Step Indicator Based on Context (Onboarding flow)
        const onboardingSteps = ['applicantRegister', 'applicantLogin', 'applicantWelcome', 'applicantDataEntry', 'applicantDocumentUpload', 'applicantStatusView'];
        if (indicator) {
            if (onboardingSteps.includes(viewId)) {
                indicator.style.display = 'flex';
            } else {
                indicator.style.display = 'none';
            }
        }

        // Marquee Visibility
        if (viewId === 'adminDashboard' || viewId === 'applicantVerificationView') {
            document.body.classList.add('hide-marquee');
        } else {
            document.body.classList.remove('hide-marquee');
        }

        console.log(`[UI] App Shell Active -> ${viewId}`);
    }
}

function backToLanding() { updateView('landingPage'); }
function showAdminLogin() { updateView('adminLogin'); }

async function handleAdminLogin() {
    const username = document.getElementById('adminId').value.trim();
    const password = document.getElementById('adminPass').value.trim();
    
    if (!username || !password) {
        return showToast("⚠️ Admin ID and Password are required", "warning");
    }

    try {
        lockUI("🔐 Authenticating Admin...");
        const res = await fetch('/api/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await res.json();
        if (result.success) {
            showToast("🔓 Access Granted. Welcome to Admin Gateway.");
            sessionStorage.setItem('admin_auth', 'true');
            unlockUI(); // UNLOCK BEFORE SWITCHING TAB to avoid isSaving toast
            updateView('adminDashboard');
            switchAdminTab('profile');
        } else {
            unlockUI();
            showToast("❌ Authentication failed. Incorrect credentials.", "error");
            document.getElementById('adminPass').value = '';
        }
    } catch (e) {
        unlockUI();
        showToast("❌ Server Error during login", "error");
    }
}

// --- APPLICANT AUTH ---

function showApplicantRegister() { 
    updateView('applicantRegister'); 
    
    // Populate Division Dropdown
    const divSel = document.getElementById('regDivision');
    if (divSel) {
        divSel.innerHTML = '<option value="">-- Loading --</option>';
        fetch('/api/admin/divisions').then(res => res.json()).then(divisions => {
            divSel.innerHTML = '<option value="">-- Select Division --</option>' + 
                divisions.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
        }).catch(() => {
            divSel.innerHTML = '<option value="">-- Error --</option>';
        });
    }

    // Populate Designation Dropdown (Grouped by Department)
    const desgSel = document.getElementById('regDesignation');
    if (desgSel) {
        const populateGrouped = (desgList) => {
            const groups = {};
            desgList.forEach(d => {
                const dept = (typeof d === 'object' ? d.department : 'SALES') || 'SALES';
                const title = typeof d === 'object' ? d.title : d;
                if (!groups[dept]) groups[dept] = [];
                groups[dept].push(title);
            });

            let html = '<option value="">-- Select Designation --</option>';
            Object.keys(groups).sort().forEach(dept => {
                html += `<optgroup label="${dept}">`;
                groups[dept].sort().forEach(title => {
                    html += `<option value="${title}">${title}</option>`;
                });
                html += `</optgroup>`;
            });
            desgSel.innerHTML = html;
        };

        const rawDesgs = companyData.designations || [];
        if (rawDesgs.length === 0) {
            setTimeout(() => {
                populateGrouped(companyData.designations || []);
            }, 1000);
        } else {
            populateGrouped(rawDesgs);
        }
    }
}
function showApplicantLogin() { updateView('applicantLogin'); }

function logoutAdmin() {
    sessionStorage.removeItem('admin_auth');
    showToast("✅ Logged out successfully", "success");
    // Force reload to clean all memory states
    window.location.href = 'admin.html';
}


async function initializeApp() {
    console.log('🚀 Emyris App initialized v1.3');
    await fetchCompanyData();
    
    const wasAdmin = sessionStorage.getItem('admin_auth') === 'true';
    
    setTimeout(() => {
        if (wasAdmin) {
            updateView('adminDashboard');
            switchAdminTab('profile');
            console.log('🔄 Session Recovered: Admin Dashboard');
        } else {
            updateView('landingPage');
            console.log('✅ View state synchronized: landingPage');
        }
    }, 150);
    initBackgroundAnimations();
    initFileListeners();
    initEditorListeners();
    initInfrastructureListeners(); // Prevent Enter key submission
}

function initInfrastructureListeners() {
    const handleEnter = (e, callback) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            callback();
        }
    };

    const divInput = document.getElementById('profileNewDivisionInput');
    if (divInput) divInput.onkeydown = (e) => handleEnter(e, () => addDivision('profile'));

    const hqInput = document.getElementById('profileNewHQInput');
    if (hqInput) hqInput.onkeydown = (e) => handleEnter(e, addHQ);
    
    const setupDivInput = document.getElementById('newDivisionInput');
    if (setupDivInput) setupDivInput.onkeydown = (e) => handleEnter(e, () => addDivision('setup'));
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
function attachAssetUploadListener(id, info) {
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

        f.marqueeText.value = companyData.marqueeText || "Enhancing Life and Excelling in Care";
        f.marqueeColor.value = companyData.marqueeColor || "#fbbf24";
        const picker = document.getElementById('marqueeColorPicker');
        if (picker) picker.value = f.marqueeColor.value;
        
        f.marqueeSpeed.value = companyData.marqueeSpeed || 15;
        const speedLabel = document.getElementById('speedValueLabel');
        if (speedLabel) speedLabel.innerText = f.marqueeSpeed.value + 's';
        renderAssetLists();

        // Attach listeners for profile tab file inputs
        attachAssetUploadListener('compLogoInput', { status: 'logoStatus' });
        attachAssetUploadListener('compStampInput', { status: 'stampStatus' });
        attachAssetUploadListener('compSigInput', { status: 'sigStatus' });
        attachAssetUploadListener('letterheadInput', { status: 'letterheadStatus' });
        attachAssetUploadListener('mobileTemplateInput', { status: 'mobileStatus' });
        attachAssetUploadListener('tadaTemplateInput', { status: 'tadaStatus' });

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
        tollFree: rawData.compTollFree,
        address: rawData.compAddress,
        fyFrom: rawData.fyFrom,
        fyTo: rawData.fyTo,
        offerCounter: parseInt(rawData.offerCounter) || 1001,
        apptCounter: parseInt(rawData.apptCounter) || 1001,
        miscCounter: parseInt(rawData.miscCounter) || 1001,
        empCodeCounter: parseInt(rawData.empCodeCounter) || 1001,
        marqueeText: rawData.marqueeText,
        marqueeColor: rawData.marqueeColor,
        marqueeSpeed: parseInt(rawData.marqueeSpeed) || 20,
        requiredDocs: companyData.requiredDocs || [],
        designations: companyData.designations || []
    };
    
    // File uploads are now handled real-time via attachFileListener

    await submitProfileUpdate(data);
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
                    attachAssetUploadListener(`input_${safeKey}`, { status: `status_${safeKey}`, ribbon: `ribbon_input_${safeKey}` });
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
                    ${(() => {
                        if (app.status === 'approved') {
                            return `<button class="btn btn-sm" onclick="openVerificationView('${app.email}')" style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); color: #10b981; padding: 6px 12px; font-weight: 700; border-radius: 8px; font-size: 0.75rem;">📂 DATABASE</button>`;
                        } else if (app.status === 'rejected') {
                            return `<button class="btn btn-sm" onclick="openVerificationView('${app.email}')" style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); color: #ef4444; padding: 6px 12px; font-weight: 700; border-radius: 8px; font-size: 0.75rem;">🕵️‍♂️ AUDIT</button>`;
                        } else {
                            return `<button class="btn btn-sm btn-primary" onclick="openVerificationView('${app.email}')" style="background: var(--accent); border-color: var(--accent); padding: 6px 12px; font-weight: 700; border-radius: 8px; font-size: 0.75rem;">🔍 VERIFY</button>`;
                        }
                    })()}
                </td>
            </tr>
        `;
    }).join('');
}

function previewIssuedLetter(email, type) {
    const app = allApplicants.find(a => a.email === email);
    if (!app) return;
    const content = type === 'offer' ? app.offerLetterData : app.apptLetterData;
    if (!content) return showToast("No saved letter found.", "warning");

    const win = window.open('', '_blank');
    win.document.write(`
        <html>
            <head>
                <title>Preview: ${type.toUpperCase()}</title>
                <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
                <style>
                    body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; background: #f1f5f9; color: #1e293b; line-height: 1.6; }
                    .container { background: white; padding: 50px; border-radius: 8px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); max-width: 800px; margin: 0 auto; min-height: 1000px; }
                </style>
            </head>
            <body>
                <div class="container">${content}</div>
            </body>
        </html>
    `);
    win.document.close();
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
    resetVerificationUI(); // Ensure a clean slate before loading new data
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
    await populateDivisions(true); // Force fresh lists
    await populateManagers();  // Populate the hierarchical selector
    
    const divSel = document.getElementById('v_division');
    divSel.value = app.division || "";
    document.getElementById('v_reportingTo').value = app.reportingTo || "";
    document.getElementById('v_hq').value = app.hq || app.formData?.hq || "";
    document.getElementById('v_proposed_desg').innerText = app.designation || app.formData?.designation || "NOT SPECIFIED";

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
    
    // Auto-prefill salary breakup if it was never set (saves admin manual click)
    if (!sal.basic && app.formData?.salary && parseFloat(app.formData.salary) > 0) {
        console.log("⚡ Auto-calculating initial salary breakup for admin...");
        autoDistributeSalary();
    }

    // 4.6 Increment Tracking
    const inc = app.incrementData || {};
    const incEnabled = document.getElementById('v_incrementEnabled');
    if (incEnabled) {
        incEnabled.checked = !!inc.enabled;
        document.getElementById('v_currentSalary').value = inc.currentSalary || '';
        document.getElementById('v_revisedSalary').value = inc.revisedSalary || '';
        toggleIncrementSection();
        calcIncrementDiff();
    }

    // 5. Pipeline Switches
    syncPipelineSwitches(app.tasks || {});

    // 6. Acceptance & Rejection Notes (Admin visibility)
    const accNote = document.getElementById('v_acceptance_note');
    const rejNote = document.getElementById('v_rejection_note');
    
    if (accNote) {
        if (app.offerAccepted) {
            accNote.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <h5 style="color: var(--success); margin: 0 0 5px 0; font-size: 0.9rem;">🎊 OFFER ACCEPTED</h5>
                    <p style="font-size: 0.8rem; color: var(--text-main); margin: 0;">
                        The candidate has confirmed their acceptance.
                        <br><strong>Confirmed ADOJ:</strong> ${new Date(app.actualJoiningDate).toDateString()}
                    </p>
                </div>
            `;
            accNote.style.display = 'block';
        } else {
            accNote.innerHTML = '';
            accNote.style.display = 'none';
        }
    }

    if (rejNote) {
        if (app.status === 'rejected') {
            rejNote.innerHTML = `
                <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 12px; padding: 1rem; margin-bottom: 1rem;">
                    <h5 style="color: #ef4444; margin: 0 0 5px 0; font-size: 0.9rem;">🚫 APPLICATION REJECTED</h5>
                    <p style="font-size: 0.8rem; color: var(--text-main); margin: 0;">
                        <strong>Reason:</strong> ${app.rejectionReason || "No specific reason provided."}
                        <br><small style="color:var(--text-muted);">${app.rejectedAt ? new Date(app.rejectedAt).toLocaleString() : ''}</small>
                    </p>
                </div>
            `;
            rejNote.style.display = 'block';
        } else {
            rejNote.innerHTML = '';
            rejNote.style.display = 'none';
        }
    }

    // 7. Toggle Approval/Rejection buttons based on status
    const isProcessed = ['approved', 'rejected', 'onboarding', 'joined'].includes(app.status);
    const approveBtn = document.getElementById('v_approve_btn_bottom');
    const rejectBtn = document.getElementById('v_reject_btn');
    const masterBtn = document.getElementById('masterVerifyBtn');
    
    if (approveBtn) approveBtn.style.display = isProcessed ? 'none' : 'block';
    if (rejectBtn) rejectBtn.style.display = isProcessed ? 'none' : 'block';
    if (masterBtn) masterBtn.style.display = isProcessed ? 'none' : 'block';

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetVerificationUI() {
    // 1. Clear text inputs and selects
    document.querySelectorAll('#applicantVerificationView input:not([type="checkbox"]), #applicantVerificationView select').forEach(i => i.value = '');
    // 2. Reset checkboxes
    document.querySelectorAll('#applicantVerificationView input[type="checkbox"]').forEach(i => i.checked = false);
    // 3. Clear dynamic containers
    ['v_profile_content', 'v_checklist_container', 'v_doc_gallery', 'v_acceptance_note', 'v_rejection_note'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = '';
    });
    // 4. Reset labels/badges
    const badge = document.getElementById('v_statusBadge');
    if (badge) { badge.innerText = '...'; badge.className = 'badge draft'; }
    const totalEl = document.getElementById('v_salTotal');
    const annualEl = document.getElementById('v_salAnnualTotal');
    if (totalEl) totalEl.innerText = '₹0';
    if (annualEl) annualEl.innerText = '₹0';
    const feedback = document.getElementById('v_salary_feedback');
    if (feedback) feedback.style.display = 'none';
}

function closeVerificationView() {
    resetVerificationUI();
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
        { label: 'Designation', val: app.designation || fd.designation || 'N/A' },
        { label: 'Joining HQ', val: app.hq || fd.hq || 'N/A' },
        { label: 'Father\'s Name', val: fd.fatherName || 'N/A' },
        { label: 'Gender', val: fd.gender || 'N/A' },
        { label: 'Blood Group', val: fd.bloodGroup || 'N/A' },
        { label: 'Date of Birth', val: app.dob ? formatDatePretty(app.dob) : (fd.dob ? formatDatePretty(fd.dob) : 'N/A') },
        { label: 'Current Address', val: `${app.address || fd.address || 'N/A'}, ${fd.city || ''}, ${fd.state || ''} - ${fd.pin || ''}` },
        { label: 'Applied At', val: app.submittedAt ? new Date(app.submittedAt).toLocaleString() : (app.registeredAt ? new Date(app.registeredAt).toLocaleString() : 'N/A') },
        { label: 'Offer Status', val: app.offerAccepted ? '<span style="color:var(--success); font-weight:bold;">✅ ACCEPTED</span>' : (app.status === 'approved' ? 'Issued (Pending)' : 'Not Issued') },
        { label: 'Confirmed ADOJ', val: app.actualJoiningDate ? `<span style="color:var(--accent); font-weight:bold;">${new Date(app.actualJoiningDate).toDateString()}</span>` : 'N/A' },
        { 
            label: 'Published Letters', 
            val: `
                <div style="display:flex; gap:0.5rem; margin-top:5px; flex-wrap:wrap;">
                    ${app.offerLetterData ? `<button class="btn btn-sm btn-outline" onclick="previewIssuedLetter('${app.email}', 'offer')" style="padding:4px 8px; font-size:0.7rem; color:var(--accent); border-color:var(--accent);">📄 OFFER</button>` : ''}
                    ${app.apptLetterData ? `<button class="btn btn-sm btn-outline" onclick="previewIssuedLetter('${app.email}', 'appt')" style="padding:4px 8px; font-size:0.7rem; color:var(--primary-light); border-color:var(--primary-light);">📜 APPT</button>` : ''}
                    ${(!app.offerLetterData && !app.apptLetterData) ? '<span style="color:var(--text-muted); font-size:0.75rem;">None</span>' : ''}
                </div>
            `
        }
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
        const categoryFiles = uploads.filter(d => d.category === dName);
        const hasFiles = categoryFiles.length > 0;
        const isVerified = verificationChecks[dName] === true;
        
        return `
            <div class="v-check-item ${isVerified ? 'verified' : (hasFiles ? 'waiting' : 'missing')}">
                <div class="v-check-info">
                    <span style="font-weight: 700;">${dName}</span>
                    <label style="font-size:0.7rem; color:${hasFiles ? 'var(--success)' : '#ef4444'}">
                        ${hasFiles ? `✅ ${categoryFiles.length} File(s)` : '❌ Missing File'}
                    </label>
                    <div class="v-check-file-list" style="margin-top: 5px;">
                        ${categoryFiles.map(f => `
                            <div style="font-size: 0.7rem; color: var(--text-soft); display: flex; align-items: center; gap: 8px; margin-bottom: 2px;">
                                <span>📄 ${f.name}</span>
                                <div style="display:flex; gap: 4px;">
                                    <button class="btn btn-tool" onclick="viewDocument('${f.assetId || ''}')" style="padding: 2px 5px; font-size: 0.65rem;">👁️</button>
                                    <button class="btn btn-tool" onclick="downloadAsset('${f.assetId || ''}', '${dName}')" style="padding: 2px 5px; font-size: 0.65rem;">📥</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="v-check-actions" style="display:flex; align-items:center; gap:0.5rem;">
                    ${hasFiles ? `<button class="btn btn-tool btn-tool-danger" onclick="rejectDocument('${dName}')" title="Reject Category">🚩</button>` : ''}
                    <label class="switch-premium" style="margin-left:0.5rem;">
                        <input type="checkbox" ${isVerified ? 'checked' : ''} onchange="toggleDocCheck('${dName}', this.checked)">
                        <span class="slider-premium"></span>
                    </label>
                </div>
            </div>
        `;
    }).join('');
    
    updateVerificationProgress(allDocNames.length);
}

function toggleDocCheck(docName, isChecked) {
    verificationChecks[docName] = isChecked;
    // Recalculate total from checklist items
    const total = document.querySelectorAll('.v-check-item').length;
    updateVerificationProgress(total);
}

async function rejectDocument(docCategory) {
    const reason = prompt(`Reason for rejecting ${docCategory}:`, "The document is unclear or incorrect.");
    if (reason === null) return; // Cancelled

    try {
        lockUI(`🚩 Rejecting ${docCategory}...`);
        const res = await fetch('/api/admin/reject-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: activeV_Applicant.email,
                docCategory,
                reason
            })
        });
        const result = await res.json();
        if (result.success) {
            showToast(`✅ ${docCategory} rejected. Applicant notified.`, "success");
            // Mark as unchecked in UI
            verificationChecks[docCategory] = false;
            renderVerificationChecklist(activeV_Applicant);
        } else {
            showToast("Failed to reject document", "error");
        }
    } catch (e) {
        showToast("Error processing rejection", "error");
    } finally {
        unlockUI();
    }
}

function updateVerificationProgress(total) {
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
    const galleryItems = [];
    allDocNames.forEach(dName => {
        const categoryFiles = uploads.filter(u => u.category === dName);
        if (categoryFiles.length === 0) {
            galleryItems.push(`
                <div class="doc-preview-card missing">
                    <div class="doc-icon">❌</div>
                    <div class="doc-name">${dName}</div>
                    <div class="doc-status-tag" style="background:rgba(239,68,68,0.12); color:#ef4444">❌ Missing</div>
                    <div style="font-size:0.65rem;text-align:center;color:var(--text-muted);">Not uploaded</div>
                </div>
            `);
        } else {
            categoryFiles.forEach(f => {
                const isPdf = f.name && f.name.toLowerCase().endsWith('.pdf');
                galleryItems.push(`
                    <div class="doc-preview-card uploaded">
                        <div class="doc-icon">${isPdf ? '📄' : '🖼️'}</div>
                        <div class="doc-name">${dName}</div>
                        <div class="doc-status-tag" style="background:rgba(16,185,129,0.15); color:#10b981">
                            ✅ ${f.name}
                        </div>
                        <div class="doc-actions-row">
                            <button class="btn-tool" onclick="viewDocument('${f.assetId || ''}')" title="View">👁️</button> 
                            <button class="btn-tool" onclick="downloadAsset('${f.assetId || ''}', '${f.name}')" title="Download">📥</button>
                        </div>
                    </div>
                `);
            });
        }
    });
    gallery.innerHTML = galleryItems.join('');
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

async function saveInternalAssignment(silent = false) {
    const salaryBreakup = {
        basic: parseFloat(document.getElementById('v_salBasic').value) || 0,
        hra: parseFloat(document.getElementById('v_salHra').value) || 0,
        lta: parseFloat(document.getElementById('v_salLta').value) || 0,
        conveyance: parseFloat(document.getElementById('v_salConv').value) || 0,
        medical: parseFloat(document.getElementById('v_salMed').value) || 0,
        special: parseFloat(document.getElementById('v_salSpecial').value) || 0,
        edu: parseFloat(document.getElementById('v_salEdu').value) || 0,
        fixed: parseFloat(document.getElementById('v_salFixed').value) || 0
    };

    // Strict Match Check for 4L/Annual consistency
    const monthlyTotal = Object.values(salaryBreakup).reduce((a, b) => a + b, 0);
    const calculatedAnnual = monthlyTotal * 12;
    const targetAnnual = parseFloat(activeV_Applicant.formData?.salary) || 0;

    if (Math.abs(calculatedAnnual - targetAnnual) > 100) {
        if (!confirm(`⚠️ SALARY MISMATCH ALERT:\n\nThe current breakup totals ₹${calculatedAnnual.toLocaleString('en-IN')} annually,\nbut the Applicant's registered salary is ₹${targetAnnual.toLocaleString('en-IN')}.\n\nProceed anyway?`)) {
            return false;
        }
    }

    const data = {
        email: activeV_Applicant.email,
        division: document.getElementById('v_division').value,
        reportingTo: document.getElementById('v_reportingTo').value,
        hq: document.getElementById('v_hq').value,
        salaryBreakup,
        verificationChecks
    };

    try {
        lockUI("🏗️ Updating Assignment...");
        const res = await fetch('/api/admin/update-workflow-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        if (result.success) {
            if (!silent) showToast("✅ Core Assignment & Salary Updated!", "success");
            activeV_Applicant.division = data.division;
            activeV_Applicant.reportingTo = data.reportingTo;
            activeV_Applicant.hq = data.hq;
            activeV_Applicant.salaryBreakup = data.salaryBreakup;
            return true;
        } else {
            if (!silent) showToast(result.error || "Save failed", "error");
            return false;
        }
    } catch (e) { 
        console.error("Save assignment error:", e);
        if (!silent) showToast("Network error: Save failed", "error");
        return false;
    }
    finally { unlockUI(); }
}

// --- SALARY INCREMENT & REVISION LOGIC ---
function toggleIncrementSection() {
    const isEnabled = document.getElementById('v_incrementEnabled').checked;
    const section = document.getElementById('v_incrementSection');
    if (section) {
        if (isEnabled) {
            section.classList.remove('hidden');
            section.style.opacity = '1';
            section.style.pointerEvents = 'all';
        } else {
            section.classList.add('hidden');
            section.style.opacity = '0.5';
            section.style.pointerEvents = 'none';
        }
    }
}

function calcIncrementDiff() {
    // Handle both Dossier and "Add Existing Staff" modal
    const isModal = document.getElementById('existingStaffModal') && !document.getElementById('existingStaffModal').classList.contains('hidden');
    
    const prefix = isModal ? 'ex_' : 'v_';
    const curInput = document.getElementById(`${prefix}currentSalary`);
    const revInput = document.getElementById(`${prefix}revisedSalary`);
    
    if (!curInput || !revInput) return;
    
    const curVal = parseFloat(curInput.value) || 0;
    const revVal = parseFloat(revInput.value) || 0;
    
    const diff = revVal - curVal;
    const annualImpact = diff * 12;
    
    const monthlyEl = document.getElementById(isModal ? 'calc_monthly_inc' : 'v_calc_monthly_inc');
    const annualEl = document.getElementById(isModal ? 'calc_annual_inc' : 'v_calc_annual_inc');
    
    if (monthlyEl) monthlyEl.innerText = `₹${diff.toLocaleString('en-IN')}`;
    if (annualEl) annualEl.innerText = `₹${annualImpact.toLocaleString('en-IN')}`;
    
    // Update color based on positive/negative
    if (monthlyEl) monthlyEl.style.color = diff >= 0 ? 'var(--success)' : '#ef4444';
}

function applyRevisedSalary() {
    const revised = parseFloat(document.getElementById('v_revisedSalary').value);
    if (!revised || isNaN(revised)) {
        return showToast("⚠️ Please enter a valid Revised Salary first.", "warning");
    }
    
    // Update the Annual CTC in the main assignment panel
    const annualTarget = revised * 12;
    if (activeV_Applicant) activeV_Applicant.salary = annualTarget; // Temporary local update
    
    // Trigger auto-distribution
    autoDistributeSalary(annualTarget);
    showToast("✅ Revised salary applied to structure. Don't forget to SAVE.", "success");
}

async function saveIncrementData() {
    if (!activeV_Applicant) return;
    
    const data = {
        email: activeV_Applicant.email,
        incrementData: {
            enabled: document.getElementById('v_incrementEnabled').checked,
            currentSalary: parseFloat(document.getElementById('v_currentSalary').value) || 0,
            revisedSalary: parseFloat(document.getElementById('v_revisedSalary').value) || 0
        }
    };

    try {
        lockUI("💾 Saving Increment Record...");
        const res = await fetch('/api/admin/update-workflow-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if ((await res.json()).success) {
            showToast("✅ Salary increment data saved to record.", "success");
            activeV_Applicant.incrementData = data.incrementData;
        }
    } catch (e) { showToast("Save failed", "error"); }
    finally { unlockUI(); }
}

function calcSalaryTotal() {
    const sal = {
        basic: parseFloat(document.getElementById('v_salBasic').value) || 0,
        hra: parseFloat(document.getElementById('v_salHra').value) || 0,
        lta: parseFloat(document.getElementById('v_salLta').value) || 0,
        conveyance: parseFloat(document.getElementById('v_salConv').value) || 0,
        medical: parseFloat(document.getElementById('v_salMed').value) || 0,
        special: parseFloat(document.getElementById('v_salSpecial').value) || 0,
        edu: parseFloat(document.getElementById('v_salEdu').value) || 0,
        fixed: parseFloat(document.getElementById('v_salFixed').value) || 0
    };
    
    const total = Object.values(sal).reduce((a, b) => a + b, 0);
    const annual = total * 12;
    
    const totalEl = document.getElementById('v_salTotal');
    const annualEl = document.getElementById('v_salAnnualTotal');
    
    if (totalEl) totalEl.innerText = `₹${total.toLocaleString('en-IN')}`;
    if (annualEl) annualEl.innerText = `₹${annual.toLocaleString('en-IN')}`;
    
    // Feedback if it matches the target
    const targetAnnual = parseFloat(activeV_Applicant.salary || activeV_Applicant.formData?.salary) || 0;
    const feedback = document.getElementById('v_salary_feedback');
    if (feedback && targetAnnual > 0) {
        feedback.style.display = 'block';
        const diff = Math.abs(annual - targetAnnual);
        if (diff < 10) {
            feedback.innerText = "✅ Perfect Match with Registered CTC";
            feedback.style.background = 'rgba(16, 185, 129, 0.1)';
            feedback.style.color = '#10b981';
        } else {
            feedback.innerText = `⚠️ Gap: ₹${(annual - targetAnnual).toLocaleString('en-IN')} from Registered CTC`;
            feedback.style.background = 'rgba(239, 68, 68, 0.1)';
            feedback.style.color = '#ef4444';
        }
    }
}

function autoCalcHRA() {
    const basic = parseFloat(document.getElementById('v_salBasic').value) || 0;
    const hraField = document.getElementById('v_salHra');
    if (hraField) {
        hraField.value = Math.round(basic * 0.4);
    }
}

function autoDistributeSalary() {
    const targetSal = activeV_Applicant.salary || activeV_Applicant.formData?.salary;
    if (!targetSal) {
        showToast("No target salary found for this applicant", "error");
        return;
    }
    
    const annual = parseFloat(targetSal);
    const monthly = parseFloat((annual / 12).toFixed(2));
    
    // 1. Basic: 40% of monthly gross
    const basic = parseFloat((monthly * 0.40).toFixed(2));
    
    // 2. HRA: 40% of Basic
    const hra = parseFloat((basic * 0.40).toFixed(2));
    
    // 3. Fixed Allowances
    const edu = 200.00;
    const conveyance = 3000.00;
    const medical = 1250.00; // Fixed as requested
    
    // 4. LTA: 7% of (Monthly - (Basic + HRA))
    const ltaBase = monthly - (basic + hra);
    const lta = parseFloat((ltaBase * 0.07).toFixed(2));
    
    // 5. Initialize other fields to 0
    const fixedAllw = 0.00;
    
    // 6. Special Allowance: match Monthly Gross exactly
    const used = parseFloat((basic + hra + lta + edu + conveyance + medical + fixedAllw).toFixed(2));
    const special = parseFloat((monthly - used).toFixed(2));
    
    const fields = {
        'v_salBasic': basic,
        'v_salHra': hra,
        'v_salLta': lta,
        'v_salConv': conveyance,
        'v_salMed': medical,
        'v_salEdu': edu,
        'v_salFixed': fixedAllw,
        'v_salSpecial': special
    };
    
    for (const [id, val] of Object.entries(fields)) {
        const el = document.getElementById(id);
        if (el) el.value = val.toFixed(2);
    }
    
    calcSalaryTotal();
    showToast("✅ Salary breakup updated (Medical @ 1250, Basic @ 40%)", "success");
}



async function commitMasterVerification() {
    const total = Object.keys(verificationChecks).length;
    const checked = Object.values(verificationChecks).filter(v => v === true).length;

    if (checked < total) {
        if (!confirm("Not all documents are checked. Proceed with partial verification?")) return;
    }

    // AUTO-SAVE ASSIGNMENT & SALARY BEFORE PROCEEDING
    // This solves the bug where users approve without saving the salary first.
    // The true parameter makes the toast silent so we don't spam them with notifications.
    const assignSuccess = await saveInternalAssignment(true);
    if (!assignSuccess) return; // Halt if the salary mismatched and they cancelled the prompt, or validation failed.

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
            showToast("🎉 Record Activated! Refreshing Data...", "success");
            
            // CRITICAL: Refresh the local cache from server to get new status/vars
            await fetchApplicants();
            
            // Find the fresh record in the updated list
            const freshApp = allApplicants.find(a => a.email === activeV_Applicant.email);
            if (freshApp) activeV_Applicant = freshApp;

            // Auto-transition to Letters module
            updateView('adminDashboard');
            switchAdminTab('setup');
            
            setTimeout(async () => {
                const targetEmail = activeV_Applicant.email;
                window._forceSelectEmail = targetEmail;

                // 1. Set Active Template to 'offer'
                const templateSel = document.getElementById('activeTemplateSelect');
                if (templateSel) templateSel.value = 'offer';
                
                // 2. Load the template into the editor
                await switchEditorTemplate();
                
                // 2.5 Refresh the Target Applicant Dropdown (uses fresh allApplicants)
                await populateHubApplicantSelect();
                
                // 3. Set the Target Applicant in the Editor Dropdown
                const targetSel = document.getElementById('hubTargetApplicant');
                if (targetSel) targetSel.value = targetEmail;
                
                // 4. AUTO-POPULATE: Inject real data into the loaded template immediately
                fillEditorWithRealData(true);
                
                // Scroll editor into view
                setTimeout(() => {
                    const editorContainer = document.getElementById('unifiedEditor');
                    if (editorContainer) {
                        editorContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        showToast(`📢 Data auto-filled for ${activeV_Applicant.fullName}`, "success");
                    }
                }, 300);
            }, 500);
        } else {
            showToast(result.error || "Activation failed", "error");
        }
    } catch (e) { 
        console.error("Master verification crash:", e);
        showToast("Network Error: Activation failed", "error"); 
    }
    finally { unlockUI(); }
}

async function rejectApplicantFlow() {
    if (!activeV_Applicant) return;
    const reason = prompt("⚠️ ATTENTION: Please specify the reason for rejection (this will be logged for audit purposes):");
    if (reason === null) return; // Cancelled
    
    if (!reason.trim()) {
        return showToast("⚠️ A reason is required for rejection.", "warning");
    }

    if (!confirm(`Are you sure you want to REJECT ${activeV_Applicant.fullName}? Access will be revoked immediately.`)) return;

    try {
        lockUI("🚫 Processing Rejection...");
        const res = await fetch('/api/admin/update-status', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                email: activeV_Applicant.email, 
                status: 'rejected',
                reason: reason.trim()
            })
        });
        const result = await res.json();
        if (result.success) {
            showToast("Application Rejected Successfully", "success");
            await fetchApplicants();
            closeVerificationView();
        }
    } catch (e) {
        showToast("Rejection failed", "error");
    } finally {
        unlockUI();
    }
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
    } catch (e) { showToast("? Step update failed", "error"); }
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
            showToast("🔄 Applicant record reset successfully.", "success");
            closeWorkflow();
            await fetchApplicants();
        }
    } catch (err) { showToast("❌ Reset failed.", "error"); }
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
                    <button class="asset-delete-btn" onclick="deleteAsset('${cat.key}', '${obj._id}')" title="Delete Asset">├ù</button>
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
    
    // Protected master backup ΓÇö ALWAYS contains clean placeholder versions from DB.
    // Never overwrite this with populated (real-data) content.
    window._masterTemplates = { ...window.letterTemplates };
    

    
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
            html += `<option value="misc_${m.id}">📂 ${m.title}</option>`;
        });
        html += `</optgroup>`;
    }
    
    html += `<option value="create_new" style="font-weight:bold; color:var(--primary);">📞 Create New Misc Letter...</option>`;
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
        // Always load from _masterTemplates (protected, placeholder-safe version)
        editor.innerHTML = (window._masterTemplates && window._masterTemplates[type]) || window.letterTemplates[type] || "";
        window.isDataPopulated = false; // Fresh template loaded
    }
    
    const delBtn = document.getElementById('deleteTemplateBtn');
    if (delBtn) delBtn.style.display = type.startsWith('misc_') ? 'inline-block' : 'none';

    syncEditorStyles();
    await populateHubApplicantSelect(); // Refresh target applicants based on the active template
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


function resetEditorToMaster(silent = false) {
    const type = document.getElementById('activeTemplateSelect').value;
    const editor = document.getElementById('unifiedEditor');
    const master = (window._masterTemplates && window._masterTemplates[type]) || window.letterTemplates[type] || "";
    
    editor.innerHTML = master;
    window.isDataPopulated = false;
    
    // Also clear the applicant selection to avoid confusion
    const sel = document.getElementById('hubTargetApplicant');
    if (sel) sel.value = "";

    if (!silent) showToast("🧹 Editor reset to Master Template (Variables Restored)", "success");
}

function fillEditorWithRealData(skipConfirm = false) {
    const targetEmail = document.getElementById('hubTargetApplicant')?.value;
    const applicant = allApplicants.find(a => a.email === targetEmail);
    if (!applicant) return; // No applicant selected ΓÇö do nothing silently

    const type = document.getElementById('activeTemplateSelect').value;
    const editor = document.getElementById('unifiedEditor');
    
    // ALWAYS use the protected master template (with {{PLACEHOLDERS}}) as the base.
    // This ensures switching between applicants always starts clean.
    const masterBase = (window._masterTemplates && window._masterTemplates[type]) || window.letterTemplates[type] || editor.innerHTML;
    
    if (!masterBase || masterBase.trim() === '') {
        return showToast("⚠️ No master template found. Please create and save a template with {{PLACEHOLDERS}} first.", "warning");
    }
    
    const filled = fillLetterPlaceholders(masterBase, applicant);
    editor.innerHTML = filled;
    window.isDataPopulated = true; // Mark as containing real data
    showToast(`ΓÜí Data loaded for ${applicant.fullName} ΓÇö ready to issue.`, "success");
}

async function saveActiveTemplate() {
    const btn = event.target;
    const originalText = btn.innerHTML;
    btn.innerHTML = "💾 Saving...";
    btn.disabled = true;

    try {
        const type = document.getElementById('activeTemplateSelect').value;
        const editor = document.getElementById('unifiedEditor');
        const content = editor.innerHTML;
        
        // Safety Guard: Detect if content has been populated (placeholders replaced with real data).
        const hasPlaceholders = content.includes('{{') && content.includes('}}');
        if (window.isDataPopulated || !hasPlaceholders) {
            const confirmSave = confirm("⚠️ WARNING: This content appears to contain real applicant data or is missing template variables ({{...}}).\n\nIf you save this, it will overwrite your master template. Usually, you should use 'Issue to Applicant' instead.\n\nAre you ABSOLUTELY sure you want to save this as the new Master Template?");
            if (!confirmSave) return;
        }
        
        // Save to both runtime caches ΓÇö letterTemplates (working copy) and _masterTemplates (protected copy)
        window.letterTemplates[type] = content;
        if (!window._masterTemplates) window._masterTemplates = {};
        window._masterTemplates[type] = content;
        
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
    
    let fontStack = "'Plus Jakarta Sans', sans-serif";
    if (type === 'times') fontStack = "'Times New Roman', Times, serif";
    else if (type === 'helvetica') fontStack = "'Plus Jakarta Sans', Arial, sans-serif";
    else if (type === 'verdana') fontStack = "Verdana, Geneva, sans-serif";
    else if (type === 'courier') fontStack = "'Courier New', monospace";
    else if (type === 'roboto') fontStack = "'Roboto', sans-serif";
    else if (type === 'outfit') fontStack = "'Outfit', sans-serif";
    else if (type === 'jakarta') fontStack = "'Plus Jakarta Sans', sans-serif";
    else if (type === 'georgia') fontStack = "Georgia, serif";
    
    const editor = document.getElementById('unifiedEditor');
    if (editor) {
        editor.style.fontSize = `${size}pt`;
        editor.style.fontFamily = fontStack; // FORCE CHANGE
        editor.style.setProperty('--current-letter-font', fontStack);
        editor.style.textAlign = align;
        // Match app's dark theme
        editor.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
        editor.style.color = '#f1f5f9';
    }

    // Update live preview if open
    const preview = document.getElementById('livePreviewContainer');
    if (preview && !preview.classList.contains('hidden')) {
        updateLivePreviewFrame();
    }
}

async function populateDivisions(force = false) {
    // Add cache-busting timestamp to prevent "vanishing" due to browser cache
    const res = await fetch(`/api/admin/divisions?t=${Date.now()}`);
    const divisions = await res.json();
    
    const list = document.getElementById('divisionList');
    const profileList = document.getElementById('profileDivisionList');
    
    // Deduplicate in memory for safety
    const uniqueNames = new Set();
    const uniqueDivs = divisions.filter(d => {
        if (uniqueNames.has(d.name)) return false;
        uniqueNames.add(d.name);
        return true;
    });

    const html = uniqueDivs.map(d => `
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
                uniqueDivs.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
            sel.value = currentVal;
        }
    });

    // Sync Designation Management Dept Selection
    const deptPicker = document.getElementById('profileDeptPicker');
    if (deptPicker) {
        const currentDept = document.getElementById('profileNewDeptInput').value;
        deptPicker.innerHTML = uniqueDivs.map(d => `
            <button type="button" class="chip-btn ${currentDept === d.name ? 'active' : ''}" 
                    onclick="setProfileDept('${d.name}', this)">
                ${d.name}
            </button>
        `).join('');
    }

    if (typeof populateManagers === 'function') populateManagers();
}

function setProfileDept(name, btn) {
    document.getElementById('profileNewDeptInput').value = name;
    document.querySelectorAll('#profileDeptPicker .chip-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

async function addDivision(source = 'setup') {
    const inputId = source === 'profile' ? 'profileNewDivisionInput' : 'newDivisionInput';
    const input = document.getElementById(inputId);
    const name = input ? input.value.trim() : "";
    
    if (!name) return;
    if (window._addingDiv) return;
    window._addingDiv = true;
    
    try {
        const res = await fetch('/api/admin/divisions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.toUpperCase() })
        });
        const result = await res.json();
        if (result.success) {
            if (input) input.value = "";
            showToast(`✅ Division "${name.toUpperCase()}" added`, "success");
            await populateDivisions(true);
        } else {
            showToast("❌ Division already exists or save failed", "error");
        }
    } catch (e) {
        showToast("❌ Communication error", "error");
    } finally {
        window._addingDiv = false;
    }
}

async function addHQ() {
    const input = document.getElementById('profileNewHQInput');
    const name = input ? input.value.trim() : "";
    if (!name) return;

    if (window._addingHQ) return;
    window._addingHQ = true;

    try {
        const res = await fetch('/api/admin/hqs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.toUpperCase() })
        });
        const result = await res.json();
        if (result.success) {
            if (input) input.value = "";
            showToast(`✅ HQ "${name.toUpperCase()}" added`, "success");
            await fetchHQs(); // Consolidated fetching
        } else {
            showToast("❌ HQ already exists or save failed", "error");
        }
    } catch (e) { 
        showToast("❌ HQ addition failed", "error"); 
    } finally {
        window._addingHQ = false;
    }
}

async function fetchHQs() {
    try {
        const res = await fetch('/api/admin/hqs');
        allHQs = await res.json();
        populateHQs();
    } catch (e) { console.error("HQ fetch fail:", e); }
}

function populateHQs() {
    const list = document.getElementById('profileHQList');
    if (list) {
        list.innerHTML = allHQs.map(h => `
            <div class="division-chip">
                <span>${h.name}</span>
                <button onclick="deleteHQ('${h._id}')">&times;</button>
            </div>
        `).join('');
    }
    
    const selects = ['v_hq']; // HQ field in verification
    selects.forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            const currentVal = sel.value;
            sel.innerHTML = '<option value="">-- Select HQ --</option>' + 
                allHQs.map(h => `<option value="${h.name}">${h.name}</option>`).join('');
            sel.value = currentVal;
        }
    });
}

async function deleteHQ(id) {
    if (!confirm("Are you sure you want to remove this HQ?")) return;
    try {
        const res = await fetch(`/api/admin/hqs/${id}`, { method: 'DELETE' });
        if ((await res.json()).success) {
            showToast("✅ HQ removed", "success");
            await fetchHQs();
        }
    } catch (e) { showToast("❌ Delete failed", "error"); }
}

async function populateManagers() {
    const select = document.getElementById('v_reportingTo');
    if (!select) return;

    try {
        // PERFORMANCE: If we already have applicants from the main fetch, use them instead of hitting the server again
        let applicants = allApplicants;
        if (!applicants.length) {
            const res = await fetch('/api/admin/applicants');
            applicants = await res.json();
        }
        
        const joined = applicants.filter(a => a.status === 'joined' || a.status === 'approved' || a.isExistingStaff);

        // Group by Division
        const grouped = {};
        joined.forEach(a => {
            const div = a.division || 'General/Unassigned';
            if (!grouped[div]) grouped[div] = [];
            grouped[div].push(a);
        });

        let html = '<option value="">-- Select Reporting Manager --</option>';
        
        // 1. Add Actual People (Grouped by Division)
        for (const [div, users] of Object.entries(grouped)) {
            html += `<optgroup label="STAFF: ${div}">`;
            users.forEach(u => {
                html += `<option value="${u.fullName} (${u.formData?.designation || 'Manager'})">${u.fullName} - ${u.formData?.designation || 'Manager'}</option>`;
            });
            html += `</optgroup>`;
        }

        // 2. Add Company Roles (Fallback/Standard)
        if (companyData && companyData.designations) {
            const desgs = (companyData.designations || []).map(d => typeof d === 'string' ? { title: d, department: 'MANAGEMENT' } : d);
            const dGroups = {};
            desgs.forEach(d => {
                if (!dGroups[d.department]) dGroups[d.department] = [];
                dGroups[d.department].push(d.title);
            });
            
            for (const [dept, titles] of Object.entries(dGroups)) {
                html += `<optgroup label="ROLE: ${dept}">`;
                titles.forEach(t => {
                    html += `<option value="${t}">${t} (Role Only)</option>`;
                });
                html += `</optgroup>`;
            }
        }
        
        const currentVal = select.value;
        select.innerHTML = html;
        if (currentVal) select.value = currentVal;
    } catch (e) {
        console.error("Failed to populate managers:", e);
    }
}

async function deleteDivision(id) {
    if (!confirm("Remove this division?")) return;
    await fetch(`/api/admin/divisions/${id}`, { method: 'DELETE' });
    populateDivisions();
}

function renderDepartmentalPicker(containerId, hiddenInputId, selectedValue) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const rawDesgs = companyData.designations || [];
    const desgs = rawDesgs.map(d => typeof d === 'string' ? { title: d, department: 'SALES' } : d);
    
    const groups = {};
    desgs.forEach(d => {
        if (!groups[d.department]) groups[d.department] = [];
        groups[d.department].push(d.title);
    });

    const deptNames = Object.keys(groups).sort();
    
    container.innerHTML = deptNames.map(dept => `
        <div class="picker-card">
            <h5>${dept}</h5>
            <div class="picker-grid">
                ${groups[dept].map(title => `
                    <div class="picker-btn ${selectedValue === title ? 'active' : ''}" 
                         onclick="selectFromPicker('${containerId}', '${hiddenInputId}', '${title.replace(/'/g, "\\'")}', this)">
                        ${title}
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

function selectFromPicker(containerId, hiddenInputId, value, btnEl) {
    document.getElementById(hiddenInputId).value = value;
    // Clear other actives in this container
    const container = document.getElementById(containerId);
    container.querySelectorAll('.picker-btn').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
    
    // Special trigger: if this is the registration form, update the view-state label if any
    if (hiddenInputId === 'designation') {
        showToast(`Selected: ${value}`, "success");
    }
}

function renderDesignationList() {
    const container = document.getElementById('profileDesignationList');
    if (!container) return;
    
    const rawDesgs = companyData.designations || [];
    // Normalize & Group
    const groups = {};
    rawDesgs.forEach(d => {
        const item = typeof d === 'string' ? { title: d, department: 'SALES' } : d;
        if (!groups[item.department]) groups[item.department] = [];
        groups[item.department].push(item.title);
    });

    const deptNames = Object.keys(groups).sort();
    
    if (deptNames.length === 0) {
        container.innerHTML = `<div style="grid-column: 1/-1; padding: 2rem; text-align: center; color: var(--text-muted); background: rgba(255,255,255,0.02); border-radius: 12px; border: 1px dashed rgba(255,255,255,0.1);">No designations defined. Add one below.</div>`;
        return;
    }

    container.innerHTML = deptNames.map(dept => `
        <div class="v-card" style="margin: 0; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255,255,255,0.05);">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                <h5 style="color: var(--accent); margin: 0; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em;">${dept}</h5>
                <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 700;">${groups[dept].length} ITEMS</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                ${groups[dept].map(title => `
                    <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.75rem; background: rgba(255,255,255,0.03); border-radius: 8px; font-size: 0.82rem;">
                        <span>${title}</span>
                        <button onclick="deleteDesignation('${title.replace(/'/g, "\\'")}', '${dept.replace(/'/g, "\\'")}')" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.1rem; line-height: 1;">&times;</button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

async function addDesignation() {
    const nameIn = document.getElementById('profileNewDesignationInput');
    const deptIn = document.getElementById('profileNewDeptInput');
    const name = nameIn?.value.trim();
    const dept = deptIn?.value.trim().toUpperCase() || 'SALES';
    
    if (!name) return;
    
    if (!companyData.designations) companyData.designations = [];
    
    // Check if already exists in this dept
    const exists = companyData.designations.find(d => 
        (typeof d === 'object' && d.title === name && d.department === dept) ||
        (typeof d === 'string' && d === name && dept === 'SALES')
    );
    
    if (exists) return showToast("Designation already exists in this department", "error");

    companyData.designations.push({ title: name, department: dept });
    await submitProfileUpdate({ designations: companyData.designations }, true);
    
    if (nameIn) nameIn.value = "";
    // Keep deptIn value for batch entry if needed, or clear it? 
    // Usually admin adds multiple to same dept.
    
    renderDesignationList();
    applyCompanyData();
    showToast(`Added ${name} to ${dept}`);
}

async function deleteDesignation(title, dept) {
    if (!confirm(`Delete "${title}" from ${dept}?`)) return;
    
    companyData.designations = companyData.designations.filter(d => {
        if (typeof d === 'string') return d !== title || dept !== 'SALES';
        return d.title !== title || d.department !== dept;
    });
    
    await submitProfileUpdate({ designations: companyData.designations }, true);
    renderDesignationList();
    applyCompanyData();
    showToast("Designation removed");
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
    
    showToast("≡ƒÅï∩╕Å Generating High-Fidelity Test Offer Letter...", "success");
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

    lockUI("≡ƒÅï∩╕Å Generating Live Preview...");
    
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
        
        const pdfData = await generateLetterPDF(finalEmail, type, editorHtml);
        
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

function updateLivePreviewFrame(specificHtml, specificRef = "REF/PRV/LIVE", skipHighlights = false) {
    const frame = document.getElementById('livePreviewFrame');
    if (!frame) return;
    
    const html = specificHtml || document.getElementById('unifiedEditor').innerHTML;
    let rendered = html;
    
    // 1. High-Fidelity Placeholder replacement using real targeted applicant data if available
    const selectedEmail = document.getElementById('hubTargetApplicant')?.value;
    let targetApp = null;
    
    if (selectedEmail) {
        targetApp = (allApplicants || []).find(a => a.email === selectedEmail);
    }

    const mockApp = targetApp || {
        fullName: 'SMRUTI RANJAN DASH',
        refNo: specificRef,
        salaryBreakup: { basic: 30000, hra: 12000, lta: 3000, conveyance: 2000, medical: 2000, special: 21000, edu: 0, fixed: 5000 }, 
        formData: {
            firstName: 'SMRUTI',
            designation: document.getElementById('signatoryDesg')?.value || 'PRODUCT MANAGER',
            hq: 'BHUBANESWAR',
            joiningDate: new Date().toISOString()
        }
    };

    rendered = fillLetterPlaceholders(html, mockApp);
    
    // Highlight placeholders in preview for visual clarity (Skip for PDF capture)
    if (!skipHighlights) {
        const todayStr = new Date().toLocaleDateString('en-GB');
        const hList = [
            'SMRUTI RANJAN DASH', specificRef, todayStr, 'PRODUCT MANAGER', 'BHUBANESWAR', 'Rs. 75,000'
        ];
        hList.forEach(h => {
            if (h && typeof h === 'string') {
                const regex = new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                rendered = rendered.replace(regex, `<span class="preview-highlight">${h}</span>`);
            }
        });
    }

    frame.innerHTML = rendered;
    
    // 2. Apply Real-time Styles accurately
    const size = document.getElementById('letterFontSize')?.value || 11;
    const type = document.getElementById('letterFontType')?.value || 'helvetica';
    const align = document.getElementById('letterAlignment')?.value || 'left';
    const marginT = document.getElementById('headerHeight')?.value || 65;
    const marginB = document.getElementById('footerHeight')?.value || 25;

    let fontStack = "'Plus Jakarta Sans', sans-serif";
    if (type === 'times') fontStack = "'Times New Roman', Times, serif";
    else if (type === 'helvetica') fontStack = "'Plus Jakarta Sans', Arial, sans-serif";
    else if (type === 'verdana') fontStack = "Verdana, Geneva, sans-serif";
    else if (type === 'courier') fontStack = "'Courier New', monospace";
    else if (type === 'roboto') fontStack = "'Roboto', sans-serif";
    else if (type === 'outfit') fontStack = "'Outfit', sans-serif";
    else if (type === 'jakarta') fontStack = "'Plus Jakarta Sans', sans-serif";
    else if (type === 'georgia') fontStack = "Georgia, serif";
    
    frame.style.fontSize = `${size}pt`;
    frame.style.setProperty('--current-letter-font', fontStack);
    frame.style.textAlign = align;
    frame.style.paddingTop = `${marginT}mm`;
    frame.style.paddingBottom = `${marginB}mm`;

    // 3. APPLY LETTERHEAD TO PREVIEW BACKGROUND
    const lhArr = companyData.letterheadImage || [];
    if (lhArr.length) {
        const val = lhArr[lhArr.length - 1].data;
        frame.style.backgroundImage = `url(${val})`;
        frame.style.backgroundSize = '100% auto';
        frame.style.backgroundRepeat = 'repeat-y';
        frame.style.backgroundPosition = 'top center';
        frame.style.backgroundColor = '#ffffff'; // White paper base
        frame.style.color = '#000000'; // Black text for letterhead
    } else {
        frame.style.backgroundImage = 'none';
        frame.style.backgroundColor = 'rgba(15, 23, 42, 0.6)'; // Restore Dark Theme
        frame.style.color = '#ffffff'; // White text for dark mode
    }
}

// --- SMART LETTER GENERATION ---
async function sendTaskUpdate(taskKey, completed) {
    const email = activeV_Applicant?.email || document.getElementById('hubTargetApplicant')?.value;
    if (!email) return;
    try {
        await fetch('/api/admin/update-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, task: taskKey, completed })
        });
    } catch (e) { console.error("Task update failed", e); }
}

async function downloadLetter(email, type) {
    // If we're in the Setup tab and the email matches the target, use the editor content to capture manual edits
    const targetEmail = document.getElementById('hubTargetApplicant')?.value;
    const editorHtml = (targetEmail === email) ? document.getElementById('unifiedEditor').innerHTML : null;
    
    const pdfData = await generateLetterPDF(email, type, editorHtml);
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
    btn.innerText = "Γî¢ Sending...";
    btn.disabled = true;

    // Capture manual editor edits if applicable
    const targetEmail = document.getElementById('hubTargetApplicant')?.value;
    const editorHtml = (targetEmail === email) ? document.getElementById('unifiedEditor').innerHTML : null;

    const pdfData = await generateLetterPDF(email, type, editorHtml);
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
            showToast("≡ƒôº Letter emailed to candidate!", "success");
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
    // native jsPDF save is more robust than manual blob creation on Windows/Chrome
    doc.save(filename);
}

async function generateLetterPDF(emailOrApp, type, htmlOverride = null) {
    lockUI("ΓÅ│ Finalizing Professional Document...");
    try {
        let app = null;
        if (typeof emailOrApp === 'object' && emailOrApp !== null) {
            app = emailOrApp;
        } else {
            app = (allApplicants || []).find(a => a.email === emailOrApp);
            if (!app && companyData.applicants) app = companyData.applicants[emailOrApp];
        }

        if (!app) {
            showToast("⚠️ Applicant record not found.", "error");
            return null;
        }

        const template = htmlOverride || companyData[`${type}LetterTemplate`] || (type === 'offer' ? companyData.offerLetterTemplate : companyData.appointmentLetterTemplate);
        if (!template) {
            showToast("⚠️ Letter template is missing in Setup.", "error");
            return null;
        }

        // 1. Configs (A4 = 210x297mm)
        const MARGIN_T = parseInt(document.getElementById('headerHeight')?.value || companyData.headerHeight || 65);
        const MARGIN_B = parseInt(document.getElementById('footerHeight')?.value || companyData.footerHeight || 25);
        const PAGE_W_MM = 210;
        const PAGE_H_MM = 297;
        const PX_PER_MM = 3.78; 
        const A4_PX_W = 794; // Critical for capture width
        
        // Exact clones of preview metrics
        const size = document.getElementById('letterFontSize')?.value || 11;
        const fontType = document.getElementById('letterFontType')?.value || 'helvetica';
        const align = document.getElementById('letterAlignment')?.value || 'left';

        let fontStack = "'Plus Jakarta Sans', sans-serif";
        if (fontType === 'times') fontStack = "'Times New Roman', Times, serif";
        else if (fontType === 'helvetica') fontStack = "'Plus Jakarta Sans', Arial, sans-serif";
        else if (fontType === 'verdana') fontStack = "Verdana, Geneva, sans-serif";
        else if (fontType === 'courier') fontStack = "'Courier New', monospace";
        else if (fontType === 'roboto') fontStack = "'Roboto', sans-serif";
        else if (fontType === 'outfit') fontStack = "'Outfit', sans-serif";
        else if (fontType === 'jakarta') fontStack = "'Plus Jakarta Sans', sans-serif";
        else if (fontType === 'georgia') fontStack = "Georgia, serif";

        // 2. Prepare the ACTUAL Live Preview Frame for capture
        const previewFrame = document.getElementById('livePreviewFrame');
        const previewContainer = document.getElementById('livePreviewContainer');
        if (!previewFrame || !previewContainer) { unlockUI(); return; }

        const isInitiallyHidden = previewContainer.classList.contains('hidden');
        const originalStyles = {
            position: previewContainer.style.position,
            left: previewContainer.style.left,
            top: previewContainer.style.top,
            zIndex: previewContainer.style.zIndex,
            opacity: previewContainer.style.opacity,
            display: previewContainer.style.display,
            visibility: previewContainer.style.visibility
        };

        // Render "Clean" version into the ACTUAL preview frame (no highlights)
        // This ensures the EXACT same rendering environment (CSS, Parents, etc.)
        updateLivePreviewFrame(htmlOverride, null, true); // Added 3rd param for clean render

        if (isInitiallyHidden) {
            previewContainer.classList.remove('hidden');
            previewContainer.style.position = 'fixed';
            previewContainer.style.left = '0';
            previewContainer.style.top = '0';
            previewContainer.style.zIndex = '-9999';
            previewContainer.style.opacity = '0';
            previewContainer.style.display = 'block';
            previewContainer.style.visibility = 'visible';
        }

        // Wait for rendering to settle
        await new Promise(r => setTimeout(r, 600)); 

        // 3. High-Precision Capture of the ACTUAL preview frame
        const canvas = await html2canvas(previewFrame, {
            scale: 3, // Even higher for text fidelity
            useCORS: true,
            backgroundColor: null, 
            logging: false,
            width: A4_PX_W,
            windowWidth: A4_PX_W
        });

        // 4. Restore original state
        if (isInitiallyHidden) {
            previewContainer.classList.add('hidden');
            Object.assign(previewContainer.style, originalStyles);
        } else {
            // Restore highlights for the user who is looking at the preview
            updateLivePreviewFrame(htmlOverride, null, false);
        }

        const canvasW = canvas.width;
        const canvasH = canvas.height;
        const totalHeightMM = (canvasH / canvasW) * PAGE_W_MM;
        
        // 4. PDF Generation (Slicing)
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const lhAsset = companyData.letterheadImage?.[companyData.letterheadImage.length - 1];

        // Tolerance to prevent tiny overflows from creating a 2nd page (5mm buffer)
        const pageTolerance = 5; 
        const totalPages = Math.ceil((totalHeightMM - pageTolerance) / PAGE_H_MM) || 1;

        for (let i = 0; i < totalPages; i++) {
            if (i > 0) pdf.addPage();

            // Layer 1: Letterhead (Background)
            if (lhAsset?.data) {
                const format = lhAsset.data.toLowerCase().includes('png') ? 'PNG' : 'JPEG';
                pdf.addImage(lhAsset.data, format, 0, 0, 210, 297, undefined, 'NONE');
            }

            // Layer 2: Content Slice
            const sourceY = i * (canvasW / PAGE_W_MM) * PAGE_H_MM;
            const sourceH = (canvasW / PAGE_W_MM) * PAGE_H_MM;
            
            const sliceCanvas = document.createElement('canvas');
            sliceCanvas.width = canvasW;
            sliceCanvas.height = Math.min(sourceH, canvasH - sourceY);
            
            if (sliceCanvas.height > 0) {
                const ctx = sliceCanvas.getContext('2d');
                ctx.drawImage(canvas, 0, sourceY, canvasW, sliceCanvas.height, 0, 0, canvasW, sliceCanvas.height);
                const sliceData = sliceCanvas.toDataURL('image/png');
                pdf.addImage(sliceData, 'PNG', 0, 0, PAGE_W_MM, (sliceCanvas.height / canvasW) * PAGE_W_MM, undefined, 'FAST');
            }
        }
        unlockUI();
        return { doc: pdf, totalPages };

    } catch (err) {
        console.error("PDF Generation Failed:", err);
        showToast("❌ PDF Generation Failed", "error");
        unlockUI();
        return null;
    }
}

function fillLetterPlaceholders(text, app, forPDF = false) {
    const fd = app.formData || {};
    const sal = app.salaryBreakup || {};
    const totalMonthly = (Number(sal.basic)||0) + (Number(sal.hra)||0) + (Number(sal.lta)||0) + (Number(sal.conveyance)||0) + (Number(sal.medical)||0) + (Number(sal.special)||0) + (Number(sal.edu)||0) + (Number(sal.fixed)||0);
    const totalAnnual = totalMonthly * 12;
    const fyFrom = companyData.fyFrom ? new Date(companyData.fyFrom) : new Date();
    const fyTo = companyData.fyTo ? new Date(companyData.fyTo) : new Date();
    const fyShort = `${String(fyFrom.getFullYear()).slice(2)}-${String(fyTo.getFullYear()).slice(2)}`;
    
    // Determine prefix based on current context (fallback to OFR)
    let prefix = "EMY/OFR";
    let counter = companyData.offerCounter || 1001;
    
    // We try to guess the type if not provided, though fillLetterPlaceholders usually doesn't know the type.
    // However, if app.refNo is missing, we can construct a placeholder one.
    const simRef = app.refNo || `${prefix}/${counter}/${fyShort} (SIM)`;

    const placeholders = {
        "{{TODAY_DATE}}": new Date().toLocaleDateString('en-GB'),
        "{{REF_NO}}": simRef,
        "{{TITLE}}": (app.title || ((fd.gender||"").toLowerCase() === 'male' ? 'Mr.' : 'Ms.')).toUpperCase(),
        "{{TITLE_SHORT}}": app.title || ((fd.gender||"").toLowerCase() === 'male' ? 'Mr.' : 'Ms.'),
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
        "{{DESIGNATION}}": (app.designation || fd.designation || "").toUpperCase(),
        "{{EMP_CODE}}": app.empCode || `EMY/EMPC/${companyData.empCodeCounter || 1001}`,
        "{{DIVISION}}": (app.division || "").toUpperCase(),
        "{{HQ}}": (app.hq || fd.hq || "").toUpperCase(),
        "{{REPORTING_TO}}": (app.reportingTo || "").toUpperCase(),
        "{{SALARY_MONTHLY}}": totalMonthly.toLocaleString('en-IN'),
        "{{SALARY_ANNUAL}}": totalAnnual.toLocaleString('en-IN'),
        "{{SALARY_WORDS}}": numberToWords(totalAnnual),
        "{{BANK_NAME}}": (fd.bankName || "").toUpperCase(),
        "{{BANK_ACC}}": fd.accNo || "",
        "{{IFSC}}": (fd.ifsc || "").toUpperCase(),
        "{{JOINING_DATE}}": formatDatePretty(fd.joiningDate),
        "{{COMPANY_NAME}}": companyData.name,
        "{{SIGNATORY_NAME}}": companyData.signatoryName || "",
        "{{SIGNATORY_DESG}}": companyData.signatoryDesignation || "",
        "{{OFFER_COUNTER}}": companyData.offerCounter || 1001,
        "{{APPT_COUNTER}}": companyData.apptCounter || 1001,
        "{{MISC_COUNTER}}": companyData.miscCounter || 1001,
        "{{EMP_CODE_COUNTER}}": companyData.empCodeCounter || 1001,
        // Individual Salary Components
        "{{SAL_BASIC}}": (Number(sal.basic) || 0).toLocaleString('en-IN'),
        "{{SAL_HRA}}": (Number(sal.hra) || 0).toLocaleString('en-IN'),
        "{{SAL_LTA}}": (Number(sal.lta) || 0).toLocaleString('en-IN'),
        "{{SAL_CONV}}": (Number(sal.conveyance) || 0).toLocaleString('en-IN'),
        "{{SAL_MED}}": (Number(sal.medical) || 0).toLocaleString('en-IN'),
        "{{SAL_SPECIAL}}": (Number(sal.special) || 0).toLocaleString('en-IN'),
        "{{SAL_EDU}}": (Number(sal.edu) || 0).toLocaleString('en-IN'),
        "{{SAL_FIXED}}": (Number(sal.fixed) || 0).toLocaleString('en-IN'),
        "{{SAL_GROSS_MONTHLY}}": totalMonthly.toLocaleString('en-IN'),
        "{{SAL_GROSS_ANNUAL}}": totalAnnual.toLocaleString('en-IN'),
        "{{SALARY_BREAKUP}}": (() => {
            const sal = app.salaryBreakup || {};
            const formatRs = (num) => 'Rs. ' + (Number(num) || 0).toLocaleString('en-IN');
            const total = (Number(sal.basic)||0) + (Number(sal.hra)||0) + (Number(sal.lta)||0) + (Number(sal.conveyance)||0) + 
                          (Number(sal.medical)||0) + (Number(sal.special)||0) + (Number(sal.edu)||0) + (Number(sal.fixed)||0);
            
            const borderColor = "#888";
            const headerBg = "rgba(128, 128, 128, 0.15)";

            return `
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; border: 1px solid ${borderColor}; color: inherit;">
                <thead>
                    <tr style="background: ${headerBg};">
                        <th style="border: 1px solid ${borderColor}; padding: 8px; text-align: left;">Earnings Components</th>
                        <th style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">Amount (Monthly)</th>
                        <th style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">Amount (Annual)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Basic Salary</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.basic)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.basic||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">HRA</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.hra)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.hra||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Leave Travel Allowance (LTA)</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.lta)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.lta||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Conveyance Allowance</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.conveyance)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.conveyance||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Medical Allowance</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.medical)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.medical||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Special Allowance</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.special)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.special||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Education Allowance</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.edu)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.edu||0)*12)}</td></tr>
                    <tr><td style="border: 1px solid ${borderColor}; padding: 6px 8px;">Fixed Allowance</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs(sal.fixed)}</td><td style="border: 1px solid ${borderColor}; padding: 6px 8px; text-align: right;">${formatRs((sal.fixed||0)*12)}</td></tr>
                    <tr style="font-weight: bold; background: ${headerBg};"><td style="border: 1px solid ${borderColor}; padding: 8px;">Gross Total</td><td style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">${formatRs(total)}</td><td style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">${formatRs(total*12)}</td></tr>
                </tbody>
            </table>
            `;
        })(),
        "{{SALARY_REVISION_BOX}}": (() => {
            const inc = app.incrementData || {};
            if (!inc.enabled) return "";
            
            const formatRs = (num) => 'Rs. ' + (Number(num) || 0).toLocaleString('en-IN');
            const diff = (Number(inc.revisedSalary) || 0) - (Number(inc.currentSalary) || 0);
            const perc = inc.currentSalary > 0 ? ((diff / inc.currentSalary) * 100).toFixed(1) : 0;
            
            const borderColor = "#888";
            const headerBg = "rgba(128, 128, 128, 0.15)";
            
            return `
            <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 13px; border: 1px solid ${borderColor}; color: inherit;">
                <thead>
                    <tr style="background: ${headerBg};">
                        <th style="border: 1px solid ${borderColor}; padding: 8px; text-align: left;">Particulars</th>
                        <th style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">Existing (Monthly)</th>
                        <th style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">Revised (Monthly)</th>
                        <th style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">Increment</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="border: 1px solid ${borderColor}; padding: 8px;">Gross Salary (Monthly)</td>
                        <td style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">${formatRs(inc.currentSalary)}</td>
                        <td style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">${formatRs(inc.revisedSalary)}</td>
                        <td style="border: 1px solid ${borderColor}; padding: 8px; text-align: right; font-weight: bold; color: #10b981;">${formatRs(diff)} (${perc}%)</td>
                    </tr>
                    <tr style="background: ${headerBg}; font-weight: bold;">
                        <td style="border: 1px solid ${borderColor}; padding: 8px;">Annualized CTC</td>
                        <td style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">${formatRs(inc.currentSalary * 12)}</td>
                        <td style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">${formatRs(inc.revisedSalary * 12)}</td>
                        <td style="border: 1px solid ${borderColor}; padding: 8px; text-align: right;">${formatRs(diff * 12)}</td>
                    </tr>
                </tbody>
            </table>
            `;
        })()
    };

    let result = text || "";
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

function getDefaultTemplate(type) {
    const co = '{{COMPANY_NAME}}';
    const header = `<p>Ref No: {{REF_NO}} &nbsp;&nbsp;&nbsp; Date: {{TODAY_DATE}}</p><p>&nbsp;</p><p>To,<br>{{TITLE_SHORT}} {{FULL_NAME}}<br>{{ADDRESS}}<br>{{CITY_STATE}} - {{PIN}}</p><p>&nbsp;</p>`;

    if (type === 'offer') return `${header}
<p><strong>Sub: OFFER OF EMPLOYMENT</strong></p><p>&nbsp;</p>
<p>Dear {{TITLE_SHORT}} {{FULL_NAME}},</p><p>&nbsp;</p>
<p>We are pleased to offer you the position of <strong>{{DESIGNATION}}</strong> with <strong>${co}</strong>, based at <strong>{{HQ}}</strong>, effective from <strong>{{JOINING_DATE}}</strong>.</p><p>&nbsp;</p>
<p>You will be reporting to <strong>{{REPORTING_TO}}</strong>. Your gross monthly CTC will be <strong>Rs. {{SALARY_MONTHLY}}/-</strong> (Rupees {{SALARY_WORDS}} per annum).</p><p>&nbsp;</p>
<p>{{SALARY_BREAKUP}}</p><p>&nbsp;</p>
<p>This offer is subject to your acceptance within 7 days. Please sign and return a copy of this letter as confirmation.</p><p>&nbsp;</p>
<p>Yours sincerely,</p><p>&nbsp;</p>
<p><strong>{{SIGNATORY_NAME}}</strong><br>{{SIGNATORY_DESG}}<br>${co}</p>`;

    if (type === 'appt') return `${header}
<p><strong>Sub: APPOINTMENT LETTER</strong></p><p>&nbsp;</p>
<p>Dear {{TITLE_SHORT}} {{FULL_NAME}},</p><p>&nbsp;</p>
<p>With reference to your acceptance of our Offer Letter, we are pleased to appoint you as <strong>{{DESIGNATION}}</strong> in the <strong>{{DIVISION}}</strong> division of <strong>${co}</strong>.</p><p>&nbsp;</p>
<p>Your appointment is effective from <strong>{{JOINING_DATE}}</strong>. Your Employee Code is <strong>{{EMP_CODE}}</strong>. You will be headquartered at <strong>{{HQ}}</strong> and will report to <strong>{{REPORTING_TO}}</strong>.</p><p>&nbsp;</p>
<p>Your consolidated monthly CTC is <strong>Rs. {{SALARY_MONTHLY}}/-</strong>.</p><p>&nbsp;</p>
<p>{{SALARY_BREAKUP}}</p><p>&nbsp;</p>
<p>Yours sincerely,</p><p>&nbsp;</p>
<p><strong>{{SIGNATORY_NAME}}</strong><br>{{SIGNATORY_DESG}}<br>${co}</p>`;

    if (type === 'confirm') return `${header}
<p><strong>Sub: CONFIRMATION OF EMPLOYMENT</strong></p><p>&nbsp;</p>
<p>Dear {{TITLE_SHORT}} {{FULL_NAME}},</p><p>&nbsp;</p>
<p>We are pleased to confirm your appointment as <strong>{{DESIGNATION}}</strong> with <strong>${co}</strong>. After successful completion of your probationary period, your services are hereby confirmed.</p><p>&nbsp;</p>
<p>Your confirmed monthly CTC remains <strong>Rs. {{SALARY_MONTHLY}}/-</strong>.</p><p>&nbsp;</p>
<p>Yours sincerely,</p><p>&nbsp;</p>
<p><strong>{{SIGNATORY_NAME}}</strong><br>{{SIGNATORY_DESG}}<br>${co}</p>`;

    if (type === 'revised_salary') return `${header}
<p><strong>Sub: REVISED SALARY LETTER</strong></p><p>&nbsp;</p>
<p>Dear {{TITLE_SHORT}} {{FULL_NAME}},</p><p>&nbsp;</p>
<p>Pursuant to your performance review, your revised gross monthly CTC is <strong>Rs. {{SALARY_MONTHLY}}/-</strong> (Rupees {{SALARY_WORDS}} per annum), effective from {{TODAY_DATE}}.</p><p>&nbsp;</p>
<p>{{SALARY_REVISION_BOX}}</p><p>&nbsp;</p>
<p>{{SALARY_BREAKUP}}</p><p>&nbsp;</p>
<p>Yours sincerely,</p><p>&nbsp;</p>
<p><strong>{{SIGNATORY_NAME}}</strong><br>{{SIGNATORY_DESG}}<br>${co}</p>`;

    return `${header}<p>Dear {{TITLE_SHORT}} {{FULL_NAME}},</p><p>&nbsp;</p><p>[Letter content here]</p><p>&nbsp;</p><p>Yours sincerely,</p><p><strong>{{SIGNATORY_NAME}}</strong><br>{{SIGNATORY_DESG}}<br>${co}</p>`;
}

function numberToWords(num) {

    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (Number(n[1]) != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (Number(n[2]) != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (Number(n[3]) != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (Number(n[4]) != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (Number(n[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return (str.trim() + " Only").toUpperCase();
}

async function viewDocument(idOrData) {
    if (!idOrData) return;
    
    // Open window immediately to avoid popup blockers
    const win = window.open("", "_blank");
    win.document.write("<html><head><title>Loading Document...</title></head><body style='background:#0f172a; color:white; font-family:sans-serif; display:flex; align-items:center; justify-content:center; height:100vh;'><div>Γî¢ Loading Document Data... Please wait.</div></body></html>");

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
            showToast("Γî¢ Preparing Download...", "secondary");
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
    if (!app || !app.formData) return showToast("?? No data found for this applicant.", "warning");

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


// --- MASTER EDITOR v2.0 CORE LOGIC ---
function copyTag(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`Copied: ${text}`, 'success');
    });
}

// --- SYSTEM MAINTENANCE ---
// Consolidated into main nukeDatabase above



async function vacuumAssets() {
    if (!confirm("This will prune the asset history, keeping only the currently active version of each asset to save space. Proceed?")) return;

    try {
        lockUI("≡ƒº╣ Vacuuming Assets...");
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
                    <span style="font-size:0.9rem; color: #fff;">${a.type === 'APPOINTMENT_PENDING' ? '🗓️' : '🕵️‍♂️'} ${a.message}</span>
                    <button class="btn btn-sm btn-outline" style="padding:4px 10px; font-size:0.75rem; border-color: rgba(99,102,241,0.5); color: #fff;" onclick="openWorkflow('${a.email}')">Action Required</button>
                </div>
            `).join('');
        } else {
            container.classList.add('hidden');
        }
    } catch (e) { console.error("Lifecycle check failed", e); }
}

// Consolidated into version near admin area or line 1056

async function populateHubApplicantSelect() {
    const sel = document.getElementById('hubTargetApplicant');
    if (!sel) return;
    
    try {
        // ALWAYS fetch fresh data to ensure latest salary/designation is used in letters
        const res = await fetch('/api/admin/applicants');
        const data = await res.json();
        if (Array.isArray(data)) {
            allApplicants = data;
        }
    } catch (e) {
        console.error("Select refresh failed", e);
    }
    
    const activeTemplate = document.getElementById('activeTemplateSelect')?.value;
    
    // Select approved or ongoing ones
    let filtered = allApplicants.filter(a => ['approved', 'submitted', 'onboarding'].includes(a.status));
    
    // Context-aware filtering: hide applicants who have already received this core letter
    if (activeTemplate === 'offer') {
        filtered = filtered.filter(a => !(a.tasks && a.tasks.offerLetter) || a.email === window._forceSelectEmail);
    } else if (activeTemplate === 'appt') {
        filtered = filtered.filter(a => !(a.tasks && a.tasks.appointmentLetter) || a.email === window._forceSelectEmail);
    }
    
    const currentVal = sel.value;
    sel.innerHTML = '<option value="">-- Choose Target --</option>' + 
        filtered.map(a => `<option value="${a.email}">${a.fullName}</option>`).join('');
        
    // Preserve previously selected value if still valid
    if (currentVal && Array.from(sel.options).some(o => o.value === currentVal)) {
        sel.value = currentVal;
    }
}

async function publishLetterToHub() {
    const email = document.getElementById('hubTargetApplicant').value;
    const type = document.getElementById('activeTemplateSelect').value;
    const content = document.getElementById('unifiedEditor').innerHTML.trim();
    
    if (!email) return showToast("?? Please select a target applicant first.", "warning");
    if (!content || content === '<br>') return showToast("?? Letter content is empty.", "warning");

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
            
            // Increment the relevant counter in admin settings
            let counterKey = "";
            if (type === 'offer') counterKey = 'offerCounter';
            else if (type === 'appt') counterKey = 'apptCounter';
            else if (type.startsWith('misc_')) counterKey = 'miscCounter';

            if (counterKey) {
                const newVal = (companyData[counterKey] || 1001) + 1;
                await submitProfileUpdate({ [counterKey]: newVal }, true);
                console.log(`≡ƒôê Incrementing ${counterKey} to ${newVal}`);
            }

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
            
            // Un-force the email and immediately refresh dropdown to remove them from list
            if (window._forceSelectEmail === email) {
                window._forceSelectEmail = null;
            }
            await fetchApplicants(); // Refresh main list to sync canLogin and other states
            await populateHubApplicantSelect();
            resetEditorToMaster(true); // HARD RESET: Revert editor to clean template after publication
        }
    } catch (e) { showToast("? Publication failed. Check server.", "error"); }
    finally { unlockUI(); }
}


window.onload = initializeApp;

// --- SYSTEM MAINTENANCE RE-AUTH LOGIC ---
function toggleReauthForm(show) {
    const container = document.getElementById('reauthContainer');
    const showBtn = document.getElementById('showReauthBtn');
    if (show) {
        container.style.display = 'block';
        showBtn.style.display = 'none';
        document.getElementById('reauthId').focus();
    } else {
        container.style.display = 'none';
        showBtn.style.display = 'inline-block';
        document.getElementById('reauthId').value = '';
        document.getElementById('reauthPass').value = '';
    }
}

function cancelMaintenanceAuth() {
    toggleReauthForm(false);
}

async function verifyMaintenanceAuth() {
    const username = document.getElementById('reauthId').value.trim();
    const password = document.getElementById('reauthPass').value.trim();
    
    if (!username || !password) {
        return showToast("⚠️ Admin ID and Password are required", "warning");
    }

    try {
        lockUI("≡ƒöÉ Verifying Identity...");
        const res = await fetch('/api/admin-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const result = await res.json();
        if (result.success) {
            showToast("🔑 Access Granted. Maintaining secure pipeline.");
            document.getElementById('maintenanceLocked').classList.add('hidden');
            document.getElementById('maintenanceUnlocked').classList.remove('hidden');
            fetchDatabaseStats(); // Refresh stats on unlock
        } else {
            showToast("❌ Re-authentication failed. Incorrect credentials.", "error");
            document.getElementById('reauthPass').value = '';
        }
    } catch (e) {
        showToast("❌ Server Error during re-auth", "error");
    } finally {
        unlockUI();
    }
}

function lockMaintenanceMode() {
    document.getElementById('maintenanceUnlocked').classList.add('hidden');
    document.getElementById('maintenanceLocked').classList.remove('hidden');
    toggleReauthForm(false);
}

window.addEventListener('DOMContentLoaded', initializeApp);
