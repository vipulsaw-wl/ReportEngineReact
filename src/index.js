import React from 'react';
import ReactDOM from 'react-dom/client';
import AppWL from './AppWL';

// Worldline theme global styles
const style = document.createElement('style');
style.textContent = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; }

  body {
    margin: 0;
    font-family: 'DM Sans', 'Segoe UI', sans-serif;
    background: #F5F7FA;
    -webkit-font-smoothing: antialiased;
  }

  /* Worldline scrollbar */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: #F0F2F5; }
  ::-webkit-scrollbar-thumb { background: #C4CDD8; border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: #00A99D; }

  /* WL form inputs */
  input, select, textarea {
    font-family: 'DM Sans', sans-serif;
  }

  /* Remove outline on WL buttons */
  button:focus { outline: 2px solid #00A99D; outline-offset: 2px; }

  /* Smooth transitions */
  a, button { transition: color 0.12s, background 0.12s, border-color 0.12s; }
`;
document.head.appendChild(style);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppWL />
  </React.StrictMode>
);
