import React, { useState } from "react";
import { supabase } from "@/api/supabaseClient";
import { Link } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ type: null, message: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: null, message: "" });
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });
      if (error) throw error;
      setStatus({
        type: "success",
        message: "Email di reset inviata. Controlla la tua casella di posta.",
      });
    } catch (err) {
      setStatus({
        type: "error",
        message: err.message || "Impossibile inviare l'email di reset.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
        <p className="text-gray-600 mb-6">
          Inserisci la tua email per ricevere il link di reset password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="nome@esempio.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-indigo-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Invio in corso..." : "Invia link di reset"}
          </button>
        </form>

        {status.message && (
          <div
            className={`mt-4 text-sm rounded-lg px-4 py-3 ${
              status.type === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {status.message}
          </div>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <Link to="/auth" className="text-indigo-600 font-semibold hover:underline">
            Torna al login
          </Link>
        </div>
      </div>
    </div>
  );
}

