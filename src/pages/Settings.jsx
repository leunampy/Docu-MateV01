import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Save, Moon, Sun, Bell, Mail, CheckCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const queryClient = useQueryClient();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [settings, setSettings] = useState({
    theme: "light",
    email_notifications: true,
    document_notifications: true,
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  useEffect(() => {
    if (user) {
      setSettings({
        theme: user.theme || "light",
        email_notifications: user.email_notifications !== false,
        document_notifications: user.document_notifications !== false,
      });
    }
  }, [user]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleSave = () => {
    updateSettingsMutation.mutate(settings);
  };

  return (
    <div className="min-h-screen px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Impostazioni</h1>
          <p className="text-gray-600">Personalizza la tua esperienza su DocuMate</p>
        </div>

        {saveSuccess && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Impostazioni salvate con successo!
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {settings.theme === "dark" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
                Aspetto
              </CardTitle>
              <CardDescription>
                Scegli il tema dell'interfaccia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={settings.theme}
                onValueChange={(value) => setSettings({...settings, theme: value})}
                className="space-y-4"
              >
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="light" id="light" />
                  <Label htmlFor="light" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white border-2 border-gray-200 rounded-lg flex items-center justify-center">
                        <Sun className="w-5 h-5 text-gray-700" />
                      </div>
                      <div>
                        <p className="font-medium">Chiaro</p>
                        <p className="text-sm text-gray-600">Tema luminoso classico</p>
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                  <RadioGroupItem value="dark" id="dark" />
                  <Label htmlFor="dark" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-900 border-2 border-gray-700 rounded-lg flex items-center justify-center">
                        <Moon className="w-5 h-5 text-gray-100" />
                      </div>
                      <div>
                        <p className="font-medium">Scuro</p>
                        <p className="text-sm text-gray-600">Tema scuro per gli occhi</p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifiche
              </CardTitle>
              <CardDescription>
                Gestisci le tue preferenze di notifica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="email-notifications" className="text-base font-medium">
                      Notifiche Email
                    </Label>
                    <p className="text-sm text-gray-600">
                      Ricevi aggiornamenti via email
                    </p>
                  </div>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, email_notifications: checked})
                  }
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-gray-400" />
                  <div>
                    <Label htmlFor="document-notifications" className="text-base font-medium">
                      Notifiche Documenti
                    </Label>
                    <p className="text-sm text-gray-600">
                      Avvisi quando i documenti sono pronti
                    </p>
                  </div>
                </div>
                <Switch
                  id="document-notifications"
                  checked={settings.document_notifications}
                  onCheckedChange={(checked) => 
                    setSettings({...settings, document_notifications: checked})
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy e Sicurezza</CardTitle>
              <CardDescription>
                Gestisci i tuoi dati e la privacy
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Dati Personali</h4>
                <p className="text-sm text-gray-600">
                  I tuoi dati sono protetti e utilizzati solo per migliorare il servizio.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium">Documenti Generati</h4>
                <p className="text-sm text-gray-600">
                  Tutti i documenti sono crittografati e accessibili solo da te.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={updateSettingsMutation.isPending}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Salva Modifiche
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}