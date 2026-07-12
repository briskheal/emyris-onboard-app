import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Optional: if we want React specific styles

// Create the mounting function that the Vanilla JS app will call
window.mountReactDashboard = (applicantData) => {
    // Hide the legacy dashboard element if it is visible
    const legacyDashboard = document.getElementById('applicantDashboard');
    if (legacyDashboard) {
        legacyDashboard.classList.add('hidden');
    }

    // Ensure the React mount point exists
    let rootElement = document.getElementById('react-applicant-dashboard-root');
    if (!rootElement) {
        rootElement = document.createElement('div');
        rootElement.id = 'react-applicant-dashboard-root';
        // Insert it right after the legacy dashboard container
        legacyDashboard.parentNode.insertBefore(rootElement, legacyDashboard.nextSibling);
    }

    // Render the React application
    const root = ReactDOM.createRoot(rootElement);
    root.render(
        <React.StrictMode>
            <App applicant={applicantData} />
        </React.StrictMode>
    );

    // Make the React root visible (in case it was hidden)
    rootElement.style.display = 'block';
};

window.unmountReactDashboard = () => {
    const rootElement = document.getElementById('react-applicant-dashboard-root');
    if (rootElement) {
        rootElement.style.display = 'none';
        // We could unmount the component here if we wanted to fully destroy it
    }
};
