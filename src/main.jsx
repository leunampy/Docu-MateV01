import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import { BrowserRouter } from 'react-router-dom'; // ✅ aggiungi questa riga

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
  <BrowserRouter>        {/* ✅ aggiungi il router qui */}
    <App />
  </BrowserRouter>
  // </React.StrictMode>,
);

if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}
import { supabase } from './api/supabaseClient';

async function testSupabase() {
  const { data, error } = await supabase.from('company_profiles').select('*');
  console.log('Supabase test:', { data, error });
}

testSupabase();
import { authApi } from './api/authApi';

async function testAuth() {
  try {
    const res = await authApi.signUp("test@example.com", "password123");
    console.log("Signup OK:", res);
  } catch (err) {
    console.error("Signup error:", err.message);
  }
}

testAuth();


