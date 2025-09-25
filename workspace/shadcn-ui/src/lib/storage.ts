import { v4 as uuidv4 } from 'uuid';

export interface SharedDocument {
  id: string;
  title: string;
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  isPublished: boolean;
}

// Simulated cloud storage using localStorage with unique keys
class CloudStorage {
  private static SHARED_DOCS_KEY = 'xromeda-shared-documents';
  private static PUBLISHED_DOCS_KEY = 'xromeda-published-documents';

  // Get all shared documents
  static getSharedDocuments(): SharedDocument[] {
    try {
      const docs = localStorage.getItem(this.SHARED_DOCS_KEY);
      return docs ? JSON.parse(docs) : [];
    } catch {
      return [];
    }
  }

  // Save shared document
  static saveSharedDocument(data: Record<string, unknown>, title: string = 'XROMEDA 기획서'): string {
    const documents = this.getSharedDocuments();
    const docId = uuidv4();
    const now = Date.now();

    const newDoc: SharedDocument = {
      id: docId,
      title,
      data,
      createdAt: now,
      updatedAt: now,
      isPublished: false
    };

    documents.push(newDoc);
    localStorage.setItem(this.SHARED_DOCS_KEY, JSON.stringify(documents));
    
    return docId;
  }

  // Update existing shared document
  static updateSharedDocument(docId: string, data: Record<string, unknown>): boolean {
    const documents = this.getSharedDocuments();
    const docIndex = documents.findIndex(doc => doc.id === docId);
    
    if (docIndex === -1) return false;

    documents[docIndex] = {
      ...documents[docIndex],
      data,
      updatedAt: Date.now()
    };

    localStorage.setItem(this.SHARED_DOCS_KEY, JSON.stringify(documents));
    return true;
  }

  // Get shared document by ID
  static getSharedDocument(docId: string): SharedDocument | null {
    const documents = this.getSharedDocuments();
    return documents.find(doc => doc.id === docId) || null;
  }

  // Publish document (make it publicly accessible)
  static publishDocument(docId: string): boolean {
    const documents = this.getSharedDocuments();
    const docIndex = documents.findIndex(doc => doc.id === docId);
    
    if (docIndex === -1) return false;

    documents[docIndex].isPublished = true;
    documents[docIndex].updatedAt = Date.now();

    localStorage.setItem(this.SHARED_DOCS_KEY, JSON.stringify(documents));
    
    // Also add to published documents for faster access
    const publishedDocs = this.getPublishedDocuments();
    const existingIndex = publishedDocs.findIndex(doc => doc.id === docId);
    
    if (existingIndex >= 0) {
      publishedDocs[existingIndex] = documents[docIndex];
    } else {
      publishedDocs.push(documents[docIndex]);
    }
    
    localStorage.setItem(this.PUBLISHED_DOCS_KEY, JSON.stringify(publishedDocs));
    return true;
  }

  // Get published documents
  static getPublishedDocuments(): SharedDocument[] {
    try {
      const docs = localStorage.getItem(this.PUBLISHED_DOCS_KEY);
      return docs ? JSON.parse(docs) : [];
    } catch {
      return [];
    }
  }

  // Get published document by ID
  static getPublishedDocument(docId: string): SharedDocument | null {
    const documents = this.getPublishedDocuments();
    return documents.find(doc => doc.id === docId && doc.isPublished) || null;
  }

  // Generate share URL
  static generateShareUrl(docId: string, baseUrl: string = window.location.origin): string {
    return `${baseUrl}?doc=${docId}`;
  }

  // Extract document ID from URL
  static getDocIdFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('doc');
  }

  // Delete shared document
  static deleteSharedDocument(docId: string): boolean {
    const documents = this.getSharedDocuments();
    const filteredDocs = documents.filter(doc => doc.id !== docId);
    
    if (filteredDocs.length === documents.length) return false;

    localStorage.setItem(this.SHARED_DOCS_KEY, JSON.stringify(filteredDocs));
    
    // Also remove from published documents
    const publishedDocs = this.getPublishedDocuments();
    const filteredPublished = publishedDocs.filter(doc => doc.id !== docId);
    localStorage.setItem(this.PUBLISHED_DOCS_KEY, JSON.stringify(filteredPublished));
    
    return true;
  }
}

export default CloudStorage;