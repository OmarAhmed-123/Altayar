/**
 * Document Service
 * Uses the unified API client
 */
import { API } from './apiClient';

export const documentService = {
  getMyDocuments: API.document.getMyDocuments,
  uploadDocument: API.document.uploadDocument,
  getDocumentById: API.document.getDocumentById,
  deleteDocument: API.document.deleteDocument,
};

