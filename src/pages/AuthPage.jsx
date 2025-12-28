import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { useNavigate, Link } from "react-router-dom";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }

      navigate("/"); // ✅ dopo login o signup torna alla home
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-4">
          <img src="/logo.png" alt="DocuMate Logo" className="w-12 h-12" />
          <h1 className="text-2xl font-bold text-indigo-600">DocuMate</h1>
        </div>
        <p className="text-gray-500 text-center mb-6">
          Accedi o crea un account per continuare
        </p>

        {/* 🔵 TAB LOGIN/REGISTRAZIONE */}
        <div className="flex mb-4 border border-gray-200 rounded-lg overflow-hidden">
          <button
            className={`flex-1 py-2 font-medium transition-colors ${
              isLogin
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setIsLogin(true)}
          >
            Accedi
          </button>
          <button
            className={`flex-1 py-2 font-medium transition-colors ${
              !isLogin
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white"
                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setIsLogin(false)}
          >
            Registrati
          </button>
        </div>

        {/* 🔵 FORM */}
        <form onSubmit={handleAuth} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-400 outline-none"
          />
          <PasswordInput
            placeholder="Password (min 6 caratteri)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />

          {isLogin && (
            <div className="text-right mb-4">
              <Link 
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-800 hover:underline"
              >
                Hai dimenticato la password?
              </Link>
            </div>
          )}

          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg py-2 font-semibold hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {loading ? "Attendere..." : isLogin ? "Accedi" : "Crea account"}
          </button>
        </form>
      </div>
    </div>
  );
}
