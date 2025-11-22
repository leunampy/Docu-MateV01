import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from "@/lib/AuthContext.jsx";
import ErrorBoundary from '@/components/ErrorBoundary.jsx';
// import { supabase } from './api/supabaseClient'; // Commentato perché non usato
// import { authApi } from './api/authApi'; // Commentato perché non usato

// 🧩 Montiamo l'app
ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode> // opzionale se vuoi
  <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
  // </React.StrictMode>
);

// 🧪 Test Supabase (commentato per evitare errori al caricamento)
// async function testSupabase() {
//   const { data, error } = await supabase.from('company_profiles').select('*');
//   console.log('Supabase test:', { data, error });
// }
// testSupabase();

// 🧪 Test Auth (commentato per evitare errori al caricamento)
// async function testAuth() {
//   try {
//     const res = await authApi.signUp("test@example.com", "password123");
//     console.log("Signup OK:", res);
//   } catch (err) {
//     console.error("Signup error:", err.message);
//   }
// }
// testAuth();

// 🔥 Hot reload helper (lascialo com’è)
if (import.meta.hot) {
  import.meta.hot.on('vite:beforeUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:beforeUpdate' }, '*');
  });
  import.meta.hot.on('vite:afterUpdate', () => {
    window.parent?.postMessage({ type: 'sandbox:afterUpdate' }, '*');
  });
}


