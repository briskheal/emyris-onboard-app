let currentStep = 1;
let companyData = JSON.parse(localStorage.getItem('emyris_company_data')) || {
    name: "EMYRIS BIOLIFESCIENCES PVT LTD.",
    address: "",
    phone: "",
    tollFree: "",
    website: "",
    logo: ""
};

// Initial Setup
window.addEventListener('DOMContentLoaded', () => {
    applyCompanyData();
    updateView('landingPage');
    initBackgroundAnimations();
});

function initBackgroundAnimations() {
    gsap.to(".blob-1", {
        x: '+=50',
        y: '+=30',
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
    gsap.to(".blob-2", {
        x: '-=40',
        y: '+=60',
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
    });
}

function applyCompanyData() {
    // Update Landing Page
    document.getElementById('displayCompanyName').innerText = companyData.name;
    const logoImg = document.getElementById('displayLogo');
    if (companyData.logo) {
        logoImg.src = companyData.logo;
        logoImg.classList.remove('hidden');
    } else {
        logoImg.classList.add('hidden');
    }

    // Update Quick Contact
    const quickContact = document.getElementById('quickContact');
    quickContact.innerHTML = `
        ${companyData.phone ? `<div>📞 ${companyData.phone}</div>` : ''}
        ${companyData.tollFree ? `<div>☎️ Toll Free: ${companyData.tollFree}</div>` : ''}
        ${companyData.website ? `<div>🌐 <a href="${companyData.website}" target="_blank">${companyData.website.replace('https://', '')}</a></div>` : ''}
    `;

    // Update Form Headings if any
    const headerLogo = document.querySelector('.logo-text h1');
    if (headerLogo) headerLogo.innerText = companyData.name.split(' ')[0];
}

function updateView(viewId) {
    const sections = document.querySelectorAll('.view-section');
    sections.forEach(s => {
        s.classList.add('hidden');
        s.style.display = 'none';
    });

    const activeSection = document.getElementById(viewId);
    activeSection.classList.remove('hidden');
    activeSection.style.display = 'block';
    
    // Add/Remove header indicators
    if (viewId === 'landingPage' || viewId === 'adminLogin' || viewId === 'adminDashboard') {
        document.body.classList.add('onboarding-inactive');
        document.body.classList.remove('onboarding-active');
    } else {
        document.body.classList.add('onboarding-active');
        document.body.classList.remove('onboarding-inactive');
    }

    gsap.fromTo(activeSection, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5 });
}

// Landing Actions
function startNewApplication() {
    updateView('welcome');
}

function showAdminLogin() {
    updateView('adminLogin');
}

function backToLanding() {
    window.location.reload(); // Quick reset
}

// Admin Logic
function handleAdminLogin() {
    const id = document.getElementById('adminId').value;
    const pass = document.getElementById('adminPass').value;

    if (id === 'admin' && pass === 'admin123') { // Simple mock
        showAdminDashboard();
    } else {
        alert("Invalid ID or Password");
    }
}

function showAdminDashboard() {
    updateView('adminDashboard');
    // Pre-fill form
    const form = document.getElementById('companyProfileForm');
    form.compName.value = companyData.name;
    form.compWeb.value = companyData.website;
    form.compPhone.value = companyData.phone;
    form.compTollFree.value = companyData.tollFree;
    form.compAddress.value = companyData.address;
    
    if (companyData.logo) {
        document.getElementById('logoPreview').src = companyData.logo;
        document.getElementById('logoPreview').classList.remove('hidden');
    }
}

function saveCompanyProfile(e) {
    e.preventDefault();
    const form = e.target;
    
    companyData.name = form.compName.value;
    companyData.website = form.compWeb.value;
    companyData.phone = form.compPhone.value;
    companyData.tollFree = form.compTollFree.value;
    companyData.address = form.compAddress.value;

    localStorage.setItem('emyris_company_data', JSON.stringify(companyData));
    applyCompanyData();
    alert("Company Profile Updated!");
    updateView('landingPage');
}

// Logo Upload Processing
document.getElementById('compLogoInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            companyData.logo = event.target.result;
            const preview = document.getElementById('logoPreview');
            preview.src = companyData.logo;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
    }
});

function logoutAdmin() {
    updateView('landingPage');
}

function nextStep(step) {
    if (step === 1 && document.getElementById('welcome').classList.contains('active') || document.getElementById('welcome').style.display !== 'none') {
        document.getElementById('welcome').classList.add('hidden');
        document.getElementById('welcome').style.display = 'none';
        
        document.getElementById('onboardingForm').classList.remove('hidden');
        document.getElementById('onboardingForm').style.display = 'block';
        updateProgress(1);
        return;
    }

    const currentSection = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    
    // Simple Validation
    const inputs = currentSection.querySelectorAll('input[required], select[required], textarea[required]');
    let isValid = true;
    inputs.forEach(input => {
        if (!input.value) {
            isValid = false;
            input.classList.add('error');
            setTimeout(() => input.classList.remove('error'), 2000);
        }
    });

    if (!isValid) {
        alert("Please fill all required fields before proceeding.");
        return;
    }

    // Advance with GSAP
    gsap.to(currentSection, { opacity: 0, x: -50, filter: 'blur(10px)', duration: 0.4, onComplete: () => {
        currentSection.classList.add('hidden');
        currentSection.classList.remove('active');
        currentStep = step;
        const nextSection = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        nextSection.classList.remove('hidden');
        
        gsap.fromTo(nextSection, { opacity: 0, x: 50, filter: 'blur(10px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.5, onComplete: () => {
            nextSection.classList.add('active');
            // Staggered reveal of form groups
            gsap.from(nextSection.querySelectorAll('.form-group, .upload-box, .experience-toggle-wrapper'), {
                opacity: 0,
                y: 20,
                stagger: 0.05,
                duration: 0.4,
                ease: "power2.out"
            });
        }});
        updateProgress(currentStep);
    }});
}

function prevStep(step) {
    const currentSection = document.querySelector(`.form-step[data-step="${currentStep}"]`);
    
    gsap.to(currentSection, { opacity: 0, x: 50, filter: 'blur(10px)', duration: 0.4, onComplete: () => {
        currentSection.classList.add('hidden');
        currentSection.classList.remove('active');
        currentStep = step;
        const prevSection = document.querySelector(`.form-step[data-step="${currentStep}"]`);
        prevSection.classList.remove('hidden');
        gsap.fromTo(prevSection, { opacity: 0, x: -50, filter: 'blur(10px)' }, { opacity: 1, x: 0, filter: 'blur(0px)', duration: 0.5, onComplete: () => {
            prevSection.classList.add('active');
        }});
        updateProgress(currentStep);
    }});
}

function updateProgress(step) {
    const steps = document.querySelectorAll('.step');
    const lines = document.querySelectorAll('.step-line');
    
    steps.forEach((s, idx) => {
        const stepNum = parseInt(s.dataset.step);
        if (stepNum < step) {
            s.classList.add('completed');
            s.classList.remove('active');
        } else if (stepNum === step) {
            s.classList.add('active');
            s.classList.remove('completed');
        } else {
            s.classList.remove('active', 'completed');
        }
    });

    lines.forEach((l, idx) => {
        if (idx < step - 1) {
            l.classList.add('active');
        } else {
            l.classList.remove('active');
        }
    });
}

function showReview() {
    const form = document.getElementById('onboardingForm');
    const formData = new FormData(form);
    const reviewContent = document.getElementById('reviewContent');
    reviewContent.innerHTML = '';

    const groups = {
        "Personal Information": {
            firstName: "First Name",
            middleName: "Middle Name",
            lastName: "Last Name",
            dob: "Date of Birth",
            gender: "Gender",
            bloodGroup: "Blood Group",
            fatherName: "Father's Name",
            anniversary: "Anniversary"
        },
        "Contact & Location": {
            address: "Address",
            city: "City",
            pin: "Pin Code",
            state: "State",
            phone: "Phone",
            personalId: "Personal ID",
            hq: "HQ"
        },
        "Professional Details": {
            designation: "Designation",
            joiningDate: "Joining Date",
            employeeType: "Type",
            salary: "Salary (Annual)",
            epf: "EPF No",
            uan: "UAN No",
            esi: "ESI No"
        },
        "Bank Details": {
            accType: "Account Type",
            bankName: "Bank Name",
            accFirstName: "Acc Holder First",
            accLastName: "Acc Holder Last",
            accNo: "Acc Number",
            ifsc: "IFSC Code"
        }
    };

    for (const [groupName, fields] of Object.entries(groups)) {
        const groupEl = document.createElement('div');
        groupEl.className = 'review-section-group';
        groupEl.innerHTML = `<h4>${groupName}</h4><div class="review-grid"></div>`;
        const grid = groupEl.querySelector('.review-grid');

        for (const [key, label] of Object.entries(fields)) {
            const value = formData.get(key) || "N/A";
            const item = document.createElement('div');
            item.className = 'review-item';
            item.innerHTML = `
                <span class="review-label">${label}</span>
                <span class="review-value">${value}</span>
            `;
            grid.appendChild(item);
        }
        reviewContent.appendChild(groupEl);
    }

    nextStep(6);
    
    // Animate review items
    gsap.from(".review-section-group", {
        opacity: 0,
        y: 30,
        stagger: 0.1,
        duration: 0.6,
        ease: "back.out(1.2)"
    });
}

// Experience toggle logic
document.querySelectorAll('input[name="category"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        const expFields = document.querySelectorAll('.exp-only');
        const appointmentInput = document.getElementById('fileAppt');
        const salaryInput = document.getElementById('fileSlips');

        if (e.target.value === 'experienced') {
            expFields.forEach(field => field.classList.remove('hidden'));
            appointmentInput.required = true;
            salaryInput.required = true;
        } else {
            expFields.forEach(field => field.classList.add('hidden'));
            appointmentInput.required = false;
            salaryInput.required = false;
        }
    });
});

// File input feedback
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', (e) => {
        const dropZone = e.target.closest('.drop-zone');
        const fileName = e.target.files.length > 1 
            ? `${e.target.files.length} files selected` 
            : e.target.files[0].name;
            
        dropZone.querySelector('.drop-text').innerText = fileName;
        dropZone.style.borderColor = 'var(--success)';
        dropZone.style.background = 'rgba(46, 204, 113, 0.05)';
    });
});

// Form Submission
document.getElementById('onboardingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const agree = document.getElementById('agree').checked;
    if (!agree) {
        alert("You must agree to the declaration before submitting.");
        return;
    }

    const submitBtn = e.target.querySelector('.btn-submit');
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Submitting...";
    submitBtn.disabled = true;

    // Collect all data
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch('/api/submit-onboarding', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            // Capture "Backend" UI data
            const now = new Date();
            const timestamp = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
            document.getElementById('capturedTime').innerText = timestamp;
            document.getElementById('subId').innerText = 'EB-' + now.getTime().toString().slice(-6);

            // Hide form, show success
            gsap.to('#onboardingForm', { opacity: 0, y: -20, duration: 0.4, onComplete: () => {
                document.getElementById('onboardingForm').style.display = 'none';
                const successView = document.getElementById('successView');
                successView.classList.remove('hidden');
                gsap.fromTo(successView, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" });
                
                // Finalize steps
                document.querySelectorAll('.step').forEach(s => s.classList.add('completed'));
                document.querySelectorAll('.step-line').forEach(l => l.classList.add('active'));
            }});
        } else {
            alert("Submission failed: " + result.message);
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Submission Error:', error);
        alert("Server error. Please try again later.");
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
});
