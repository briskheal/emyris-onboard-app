import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

let reactRoot = null;

window.mountReactApp = (initialView = 'landing', applicantData = null) => {
    // Hide ALL legacy views
    const viewsToHide = ['landingPage', 'applicantRegister', 'applicantLogin', 'applicantDashboard'];
    viewsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    let rootElement = document.getElementById('react-applicant-root');
    if (!rootElement) {
        rootElement = document.createElement('div');
        rootElement.id = 'react-applicant-root';
        document.body.appendChild(rootElement);
    }

    if (!reactRoot) {
        reactRoot = ReactDOM.createRoot(rootElement);
    }

    reactRoot.render(
        <React.StrictMode>
            <App initialView={initialView} initialApplicant={applicantData} />
        </React.StrictMode>
    );

    rootElement.style.display = 'block';
};

// Legacy support just in case script.js calls this
window.mountReactDashboard = (applicantData) => {
    window.mountReactApp('dashboard', applicantData);
};
