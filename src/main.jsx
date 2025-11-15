import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from "@/lib/AuthContext.jsx";
import { supabase } from './api/supabaseClient';
import { authApi } from './api/authApi';

// 🧩 Montiamo l'app
ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> // opzionale se vuoi
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
  // </React.StrictMode>
);

// 🧪 Test Supabase (puoi lasciarlo per ora)
async function testSupabase() {
  const { data, error } = await supabase.from('company_profiles').select('*');
  console.log('Supabase test:', { data, error });
}
testSupabase();

// 🧪 Test Auth (puoi commentarlo se non ti serve subito)
async function testAuth() {
  try {
    const res = await authApi.signUp("test@example.com", "password123");
    console.log("Signup OK:", res);
  } catch (err) {
    console.error("Signup error:", err.message);
  }
}
testAuth();

// 🔥 Hot reload helper (lascialo com’è)
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}


