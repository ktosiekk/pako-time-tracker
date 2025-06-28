import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import RaportPage from './RaportPage';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

function getPath() {
  return window.location.pathname;
}

root.render(
  <React.StrictMode>
    {getPath() === '/raport' ? <RaportPage /> : <App />}
  </React.StrictMode>
);

reportWebVitals();
