// src/api/compileApi.js
// API functions per upload/download documenti e salvataggio in Supabase

import { supabase } from './supabaseClient';

const STORAGE_BUCKET = 'compiled-documents';

/**
 * Upload un documento a Supabase Storage
 * @param {File} file - File da caricare
 * @param {string} userId - ID utente
 * @param {Function} onProgress - Callback per progress (0-100)
 * @returns {Promise<string>} URL del file caricato
 */
export async function uploadDocument(file, userId, onProgress = null) {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;
    
    // Upload con progress tracking
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      // Se il bucket non esiste, proviamo a crearlo (richiede permessi admin)
      if (error.message.includes('Bucket not found')) {
        throw new Error('Bucket di storage non configurato. Contatta l\'amministratore.');
      }
      throw error;
    }
    
    // Ottieni URL pubblico
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(filePath);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error('Errore upload documento:', error);
    throw new Error(`Impossibile caricare il documento: ${error.message}`);
  }
}

/**
 * Salva metadata del documento compilato nel database
 * @param {Object} metadata - Metadata del documento
 * @returns {Promise<Object>} Record salvato
 */
export async function saveCompiledDocument(metadata) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utente non autenticato');
    }
    
    const payload = {
      user_id: user.id,
      original_file_name: metadata.originalFileName,
      original_file_url: metadata.originalFileUrl,
      compiled_file_url: metadata.compiledFileUrl,
      company_profile_id: metadata.companyProfileId || null,
      fields_mapping: metadata.fieldsMapping || {},
    };
    
    const { data, error } = await supabase
      .from('compiled_documents')
      .insert([payload])
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Errore salvataggio documento compilato:', error);
    throw new Error(`Impossibile salvare il documento: ${error.message}`);
  }
}

/**
 * Ottiene la lista dei documenti compilati per un utente
 * @param {string} userId - ID utente
 * @returns {Promise<Array<Object>>} Lista documenti compilati
 */
export async function getCompiledDocuments(userId) {
  try {
    const { data, error } = await supabase
      .from('compiled_documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Errore recupero documenti compilati:', error);
    throw new Error(`Impossibile recuperare i documenti: ${error.message}`);
  }
}

/**
 * Download un documento da Supabase Storage
 * @param {string} fileUrl - URL del file
 * @param {string} fileName - Nome file per il download
 * @returns {Promise<void>}
 */
export async function downloadCompiledDocument(fileUrl, fileName) {
  try {
    // Estrai path dal URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf(STORAGE_BUCKET);
    
    if (bucketIndex === -1) {
      throw new Error('URL non valido');
    }
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    // Download file
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(filePath);
    
    if (error) {
      throw error;
    }
    
    // Crea blob e triggera download
    const blob = await data.blob();
    const url_blob = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url_blob;
    a.download = fileName || 'documento_compilato';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url_blob);
  } catch (error) {
    console.error('Errore download documento:', error);
    throw new Error(`Impossibile scaricare il documento: ${error.message}`);
  }
}

/**
 * Elimina un documento compilato
 * @param {string} documentId - ID del documento
 * @returns {Promise<void>}
 */
export async function deleteCompiledDocument(documentId) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Utente non autenticato');
    }
    
    // Recupera il documento per ottenere gli URL dei file
    const { data: document, error: fetchError } = await supabase
      .from('compiled_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !document) {
      throw new Error('Documento non trovato o non autorizzato');
    }
    
    // Elimina file da storage
    const filesToDelete = [document.original_file_url, document.compiled_file_url]
      .filter(url => url)
      .map(url => {
        const urlObj = new URL(url);
        const pathParts = urlObj.pathname.split('/');
        const bucketIndex = pathParts.indexOf(STORAGE_BUCKET);
        return pathParts.slice(bucketIndex + 1).join('/');
      });
    
    if (filesToDelete.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove(filesToDelete);
      
      if (storageError) {
        console.warn('Errore eliminazione file da storage:', storageError);
        // Continua comunque con l'eliminazione del record
      }
    }
    
    // Elimina record dal database
    const { error: deleteError } = await supabase
      .from('compiled_documents')
      .delete()
      .eq('id', documentId)
      .eq('user_id', user.id);
    
    if (deleteError) {
      throw deleteError;
    }
  } catch (error) {
    console.error('Errore eliminazione documento:', error);
    throw new Error(`Impossibile eliminare il documento: ${error.message}`);
  }
}

/**
 * Verifica se il bucket di storage esiste, altrimenti lo crea
 * Nota: Richiede permessi admin su Supabase
 * @returns {Promise<boolean>}
 */
export async function ensureStorageBucket() {
  try {
    // Prova a listare i bucket per verificare se esiste
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.warn('Impossibile verificare bucket:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET);
    
    if (!bucketExists) {
      // Prova a creare il bucket (richiede permessi)
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
      });
      
      if (createError) {
        console.warn('Impossibile creare bucket:', createError);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Errore verifica bucket:', error);
    return false;
  }
}

