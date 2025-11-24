// src/components/compile/DocumentPreview.jsx
// Componente per preview documento con campi evidenziati

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Eye } from 'lucide-react';

export default function DocumentPreview({ 
  file, 
  fileUrl, 
  extractedText, 
  fields = [],
  onFieldClick 
}) {
  if (!file && !fileUrl) {
    return null;
  }

  const fileName = file?.name || 'Documento';
  const isPDF = fileName.toLowerCase().endsWith('.pdf');
  const isWord = fileName.toLowerCase().endsWith('.docx') || fileName.toLowerCase().endsWith('.doc');

  // Evidenzia campi nel testo
  const highlightFieldsInText = (text) => {
    if (!text || fields.length === 0) {
      return text;
    }

    let highlightedText = text;
    
    fields.forEach(field => {
      const placeholder = field.placeholder || field.label;
      if (placeholder) {
        // Evidenzia il placeholder nel testo
        const regex = new RegExp(`(${placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlightedText = highlightedText.replace(
          regex,
          `<mark class="bg-yellow-200 px-1 rounded cursor-pointer hover:bg-yellow-300" data-field-id="${field.id}">$1</mark>`
        );
      }
    });

    return highlightedText;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Preview Documento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <strong>File:</strong> {fileName}
        </div>

        {isPDF && fileUrl && (
          <div className="border rounded-lg overflow-hidden">
            <iframe
              src={fileUrl}
              className="w-full h-96"
              title="PDF Preview"
            />
          </div>
        )}

        {isWord && extractedText && (
          <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: highlightFieldsInText(extractedText).replace(/\n/g, '<br />')
              }}
              onClick={(e) => {
                const mark = e.target.closest('mark');
                if (mark && onFieldClick) {
                  const fieldId = mark.getAttribute('data-field-id');
                  const field = fields.find(f => f.id === fieldId);
                  if (field) {
                    onFieldClick(field);
                  }
                }
              }}
            />
          </div>
        )}

        {!isPDF && !isWord && extractedText && (
          <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap font-mono">
              {extractedText}
            </pre>
          </div>
        )}

        {fields.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900 mb-2">
              <Eye className="w-4 h-4" />
              Campi identificati: {fields.length}
            </div>
            <div className="text-xs text-blue-700">
              Clicca sui campi evidenziati nel documento per modificarne il mapping.
            </div>
          </div>
        )}

        {!extractedText && !fileUrl && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nessun preview disponibile</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

