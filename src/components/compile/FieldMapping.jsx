// src/components/compile/FieldMapping.jsx
// Componente per UI mapping campi con override manuale

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, AlertCircle, CheckCircle, Edit2 } from 'lucide-react';

export default function FieldMapping({ 
  mappings = [], 
  companyProfile = {},
  onMappingChange,
  validation = null
}) {
  // Ottieni tutte le chiavi disponibili dal profilo aziendale
  const availableKeys = Object.keys(companyProfile || {}).filter(
    key => companyProfile[key] !== null && companyProfile[key] !== undefined && companyProfile[key] !== ''
  );

  const handleFieldChange = (fieldId, newValue) => {
    if (onMappingChange) {
      onMappingChange(fieldId, newValue);
    }
  };

  const getConfidenceBadge = (confidence) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-100 text-green-700">Alta</Badge>;
    } else if (confidence >= 0.5) {
      return <Badge className="bg-yellow-100 text-yellow-700">Media</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-700">Bassa</Badge>;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Mapping Campi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {validation && !validation.valid && validation.errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Errori di validazione:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.errors.map((error, idx) => (
                  <li key={idx} className="text-sm">{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {validation && validation.warnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold mb-1">Avvisi:</div>
              <ul className="list-disc list-inside space-y-1">
                {validation.warnings.map((warning, idx) => (
                  <li key={idx} className="text-sm">{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {mappings.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nessun campo identificato nel documento</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo Documento</TableHead>
                  <TableHead>Dato Selezionato</TableHead>
                  <TableHead>Valore</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings.map((mapping) => {
                  const currentValue = mapping.value || '';
                  const isManual = mapping.manualOverride || false;

                  return (
                    <TableRow 
                      key={mapping.fieldId}
                      className={!currentValue ? 'bg-red-50' : ''}
                    >
                      <TableCell>
                        <div className="font-medium">{mapping.fieldLabel}</div>
                        {mapping.fieldId && (
                          <div className="text-xs text-gray-500 mt-1">
                            ID: {mapping.fieldId}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={mapping.suggestedKey || ''}
                          onValueChange={(value) => {
                            const newValue = companyProfile[value] || '';
                            handleFieldChange(mapping.fieldId, {
                              ...mapping,
                              suggestedKey: value,
                              value: newValue,
                              manualOverride: false,
                            });
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Seleziona dato" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">-- Nessuno --</SelectItem>
                            {availableKeys.map((key) => (
                              <SelectItem key={key} value={key}>
                                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {isManual ? (
                          <Input
                            value={currentValue}
                            onChange={(e) => {
                              handleFieldChange(mapping.fieldId, {
                                ...mapping,
                                value: e.target.value,
                                manualOverride: true,
                              });
                            }}
                            placeholder="Inserisci valore manuale"
                            className="w-full"
                          />
                        ) : (
                          <div className="px-3 py-2 bg-gray-50 rounded-md text-sm">
                            {currentValue || <span className="text-gray-400">--</span>}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getConfidenceBadge(mapping.confidence || 0)}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => {
                            handleFieldChange(mapping.fieldId, {
                              ...mapping,
                              manualOverride: !isManual,
                              value: isManual ? (companyProfile[mapping.suggestedKey] || '') : currentValue,
                            });
                          }}
                          className="p-2 hover:bg-gray-100 rounded transition-colors"
                          title={isManual ? "Usa valore automatico" : "Override manuale"}
                        >
                          {isManual ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Edit2 className="w-4 h-4 text-gray-600" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {mappings.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5" />
              <div>
                <strong>Suggerimento:</strong> Seleziona un dato dal profilo aziendale per ogni campo, 
                oppure usa l'override manuale per inserire valori personalizzati.
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

