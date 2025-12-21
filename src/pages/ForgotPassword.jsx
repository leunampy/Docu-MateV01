import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/api/supabaseClient';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://www.documate.it/auth/reset-password',
      });

      if (error) throw error;

      setEmailSent(true);
    } catch (err) {
      setError(err.message || 'Errore durante l\'invio dell\'email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader>
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl text-center">
            {emailSent ? '✉️ Email Inviata!' : '🔐 Password Dimenticata?'}
          </CardTitle>
          <p className="text-center text-gray-600 mt-2">
            {emailSent 
              ? 'Controlla la tua casella email per reimpostare la password'
              : 'Inserisci la tua email e ti invieremo un link per reimpostare la password'
            }
          </p>
        </CardHeader>

        <CardContent>
          {emailSent ? (
            <div className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-green-800 ml-2">
                  Abbiamo inviato un'email a <strong>{email}</strong> con le istruzioni per reimpostare la password.
                </AlertDescription>
              </Alert>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900">
                <p className="font-semibold mb-2">📬 Non hai ricevuto l'email?</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>Controlla la cartella spam/posta indesiderata</li>
                  <li>Verifica di aver inserito l'email corretta</li>
                  <li>Attendi qualche minuto</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEmailSent(false)}
                >
                  Riprova con altra email
                </Button>
                <Link to="/auth" className="flex-1">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Torna al Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Indirizzo Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tuaemail@esempio.it"
                  required
                  disabled={loading}
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                    Invio in corso...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-5 w-5" />
                    Invia Link di Reset
                  </>
                )}
              </Button>

              <Link to="/auth">
                <Button variant="ghost" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Torna al Login
                </Button>
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

