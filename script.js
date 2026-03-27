let currentStep = 1;
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
});

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
    if (companyData.logo) {
        logoImg.src = companyData.logo;
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
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());
    
    // Helper to read file as Base64
    const readFile = (id) => {
        return new Promise((resolve) => {
            const file = document.getElementById(id).files[0];
            if (!file) return resolve(null);
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.readAsDataURL(file);
        });
    };

    const logo = await readFile('compLogoInput');
    const offer = await readFile('offerTemplateInput');
    const appt = await readFile('apptTemplateInput');
    const mobile = await readFile('mobileTemplateInput');
    const tada = await readFile('tadaTemplateInput');

    if (logo) data.logo = logo;
    if (offer) data.offerTemplate = offer;
    if (appt) data.apptTemplate = appt;
    if (mobile) data.mobileAppTemplate = mobile;
    if (tada) data.tadaTemplate = tada;

    await submitProfileUpdate(data);
}

async function submitProfileUpdate(data) {
    try {
        const res = await fetch('/api/company-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if ((await res.json()).success) {
            alert("Company Profile Updated!");
            await fetchCompanyData();
        }
    } catch (err) { alert("Update failed."); }
}

function switchAdminTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.tab-btn[onclick*="${tab}"]`).classList.add('active');
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
    
    if (tab === 'profile') {
        document.getElementById('adminProfileTab').classList.remove('hidden');
        const f = document.getElementById('companyProfileForm');
        f.compName.value = companyData.name;
        f.compWeb.value = companyData.website || '';
        f.compPhone.value = companyData.phone || '';
        f.compTollFree.value = companyData.tollFree || '';
        f.compAddress.value = companyData.address || '';

        // Update template statuses
        const updateStatus = (id, val) => {
            const el = document.getElementById(id);
            if (val) {
                el.innerText = "Template Uploaded ✅";
                el.style.color = "var(--success)";
            } else {
                el.innerText = "Upload Template";
                el.style.color = "var(--text-muted)";
            }
        };
        updateStatus('offerStatus', companyData.offerTemplate);
        updateStatus('apptStatus', companyData.apptTemplate);
        updateStatus('mobileStatus', companyData.mobileAppTemplate);
        updateStatus('tadaStatus', companyData.tadaTemplate);
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

function openWorkflow(email) {
    activeWfEmail = email;
    const app = allApplicants.find(a => a.email === email);
    if (!app) return;

    document.getElementById('wfName').innerText = app.fullName;
    document.getElementById('wfEmail').innerText = app.email;
    
    // Sync Access Toggle Text
    const toggleBtn = document.getElementById('modalToggleAccess');
    toggleBtn.innerHTML = app.canLogin ? '<span>🔒</span> Lock Access' : '<span>🔓</span> Grant Access';
    toggleBtn.className = app.canLogin ? 'btn btn-danger btn-sm' : 'btn btn-success btn-sm';

    // Sync Task Status
    updateWfModalUI(app.tasks || {});
    
    document.getElementById('workflowModal').classList.remove('hidden');
    document.getElementById('workflowModal').style.display = 'flex';
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
        y = doc.lastAutoTable.finalY + 10;
        
        if (y > 270) { doc.addPage(); y = 20; }
    }

    doc.save(`${app.fullName.replace(/ /g, '_')}_Onboarding.pdf`);
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
