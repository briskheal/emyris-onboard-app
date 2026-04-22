/**
 * EMYRIS ONBOARD - SHARED UTILITIES
 * Consolidated from 7c9783d baseline for cross-module compatibility.
 */

// --- UI LOCKING & TOASTS ---
function lockUI(msg = "⏳ Processing... Please Wait") {
    if (typeof isSaving !== 'undefined') isSaving = true;
    const overlay = document.getElementById('processingOverlay');
    if (overlay) {
        const text = document.getElementById('processingText');
        if (text) text.innerText = msg;
        overlay.classList.remove('hidden');
    }
    // Admin specific nav locking (safe check)
    const adminNav = document.querySelectorAll('.admin-nav button');
    if (adminNav.length > 0) {
        adminNav.forEach(b => b.classList.add('nav-locked'));
    }
}

function unlockUI() {
    if (typeof isSaving !== 'undefined') isSaving = false;
    const overlay = document.getElementById('processingOverlay');
    if (overlay) overlay.classList.add('hidden');
    // Admin specific nav unlocking (safe check)
    const adminNav = document.querySelectorAll('.admin-nav button');
    if (adminNav.length > 0) {
        adminNav.forEach(b => b.classList.remove('nav-locked'));
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toastNotif');
    if (!toast) return;
    
    // Clear previous state
    toast.className = '';
    void toast.offsetWidth; // Trigger reflow for animation reset
    
    toast.textContent = message;
    toast.className = `show ${type}`;
    
    if (toast._timer) clearTimeout(toast._timer);
    toast._timer = setTimeout(() => { 
        toast.classList.remove('show');
        // Final cleanup after fade out
        setTimeout(() => { if (!toast.classList.contains('show')) toast.className = ''; }, 500);
    }, 4000);
}

// --- DATA FORMATTING ---
function numberToWords(num) {
    if (!num || isNaN(num) || num <= 0) return "";
    num = Math.floor(num);
    const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
    const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
    const count = (n) => {
        if (n < 20) return a[n];
        let s = b[Math.floor(n / 10)];
        if (n % 10 > 0) s += ' ' + a[n % 10];
        return s;
    };
    if (num === 0) return 'zero';
    let words = '';
    if (Math.floor(num / 10000000) > 0) { words += count(Math.floor(num / 10000000)) + ' crore '; num %= 10000000; }
    if (Math.floor(num / 100000) > 0) { words += count(Math.floor(num / 100000)) + ' lakh '; num %= 100000; }
    if (Math.floor(num / 1000) > 0) { words += count(Math.floor(num / 1000)) + ' thousand '; num %= 1000; }
    if (Math.floor(num / 100) > 0) { words += count(Math.floor(num / 100)) + ' hundred '; num %= 100; }
    if (num > 0) {
        if (words !== '') words += 'and ';
        words += count(num);
    }
    return words.trim().toLowerCase();
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

// --- ANIMATIONS & GLOBAL HANDLERS ---
function initBackgroundAnimations() {
    if (typeof gsap !== 'undefined') {
        gsap.to(".blob-1", { x: '+=50', y: '+=30', duration: 8, repeat: -1, yoyo: true, ease: "sine.inOut" });
        gsap.to(".blob-2", { x: '-=40', y: '+=60', duration: 10, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }
    window.addEventListener('resize', () => {
        console.log(`[Diagnostic] Viewport: ${window.innerWidth}x${window.innerHeight}`);
    });
}

function updateSalaryWords(inputId, outputId) {
    const input = document.getElementById(inputId);
    const output = document.getElementById(outputId);
    if (!input || !output) return;
    
    const val = parseFloat(input.value);
    if (!val || isNaN(val) || val <= 0) {
        output.innerText = "";
        return;
    }
    output.innerText = `(rupees ${numberToWords(val)} only)`;
}
function updateView(viewId) {
    const landingPage = document.getElementById('landingPage');
    const appShell = document.getElementById('appShell');
    const sections = document.querySelectorAll('.view-section');
    const indicator = document.getElementById('stepIndicator');

    // Reset Scroll
    window.scrollTo(0, 0);

    if (viewId === 'landingPage') {
        if (landingPage) landingPage.classList.remove('hidden');
        if (appShell) appShell.classList.add('hidden');
        document.body.classList.add('at-landing');
    } else {
        if (landingPage) landingPage.classList.add('hidden');
        if (appShell) appShell.classList.remove('hidden');
        document.body.classList.remove('at-landing');

        sections.forEach(s => {
            s.classList.add('hidden');
            s.style.display = 'none';
            s.classList.remove('active');
        });

        const activeSection = document.getElementById(viewId);
        if (activeSection) {
            activeSection.classList.remove('hidden');
            activeSection.style.display = (viewId === 'adminDashboard' || viewId === 'applicantDashboard') ? 'flex' : 'block';
            activeSection.classList.add('active');
            
            if (typeof gsap !== 'undefined') {
                gsap.fromTo(activeSection, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" });
            }
        }

        // Show/Hide Step Indicator
        const onboardingSteps = ['onboardingForm'];
        if (indicator) {
            indicator.style.display = onboardingSteps.includes(viewId) ? 'flex' : 'none';
        }
    }
}

function backToLanding() { updateView('landingPage'); }

function syncMarquee(text, color, speed) {
    const marquees = document.querySelectorAll('.marquee-inner');
    marquees.forEach(m => {
        m.innerText = text || "Enhancing Life and Excelling in Care";
        if (color) m.style.color = color;
        if (speed) m.style.animationDuration = `${speed}s`;
        m.style.opacity = 1;
    });
}

async function compressAndResize(file, maxWidth = 1000) {
    return new Promise((resolve) => {
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
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });
}
