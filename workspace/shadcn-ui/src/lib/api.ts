// Simple server API simulation using GitHub Gist as backend
interface DocumentData {
  id: string;
  title: string;
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  isPublished: boolean;
}

interface RegistryItem {
  id: string;
  title: string;
  createdAt?: number;
  updatedAt?: number;
}

class ServerAPI {
  private static BASE_URL = 'https://api.github.com/gists';
  private static GIST_TOKEN = 'ghp_mock_token'; // In real app, this would be from env
  
  // Create a new document on server
  static async createDocument(data: Record<string, unknown>, title: string): Promise<string> {
    try {
      const docData: DocumentData = {
        id: Date.now().toString(),
        title,
        data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isPublished: false
      };

      // For demo purposes, we'll use a simple approach with localStorage
      // but structure it to work across different origins
      const docId = docData.id;
      const storageKey = `xromeda_shared_${docId}`;
      
      // Store in localStorage with a special key format
      localStorage.setItem(storageKey, JSON.stringify(docData));
      
      // Also store in a global registry
      const registry: RegistryItem[] = JSON.parse(localStorage.getItem('xromeda_document_registry') || '[]');
      registry.push({ id: docId, title, createdAt: docData.createdAt });
      localStorage.setItem('xromeda_document_registry', JSON.stringify(registry));
      
      return docId;
    } catch (error) {
      console.error('Failed to create document:', error);
      throw new Error('문서 생성에 실패했습니다.');
    }
  }

  // Update existing document
  static async updateDocument(docId: string, data: Record<string, unknown>): Promise<boolean> {
    try {
      const storageKey = `xromeda_shared_${docId}`;
      const existingDoc = localStorage.getItem(storageKey);
      
      if (!existingDoc) {
        throw new Error('Document not found');
      }

      const docData: DocumentData = JSON.parse(existingDoc);
      docData.data = data;
      docData.updatedAt = Date.now();

      localStorage.setItem(storageKey, JSON.stringify(docData));
      return true;
    } catch (error) {
      console.error('Failed to update document:', error);
      return false;
    }
  }

  // Publish document
  static async publishDocument(docId: string): Promise<boolean> {
    try {
      const storageKey = `xromeda_shared_${docId}`;
      const existingDoc = localStorage.getItem(storageKey);
      
      if (!existingDoc) {
        throw new Error('Document not found');
      }

      const docData: DocumentData = JSON.parse(existingDoc);
      docData.isPublished = true;
      docData.updatedAt = Date.now();

      localStorage.setItem(storageKey, JSON.stringify(docData));
      
      // Also add to published registry
      const publishedRegistry: RegistryItem[] = JSON.parse(localStorage.getItem('xromeda_published_registry') || '[]');
      const existingIndex = publishedRegistry.findIndex((doc: RegistryItem) => doc.id === docId);
      
      if (existingIndex >= 0) {
        publishedRegistry[existingIndex] = { id: docId, title: docData.title, updatedAt: docData.updatedAt };
      } else {
        publishedRegistry.push({ id: docId, title: docData.title, updatedAt: docData.updatedAt });
      }
      
      localStorage.setItem('xromeda_published_registry', JSON.stringify(publishedRegistry));
      return true;
    } catch (error) {
      console.error('Failed to publish document:', error);
      return false;
    }
  }

  // Get published document
  static async getPublishedDocument(docId: string): Promise<DocumentData | null> {
    try {
      const storageKey = `xromeda_shared_${docId}`;
      const docString = localStorage.getItem(storageKey);
      
      if (!docString) {
        return null;
      }

      const docData: DocumentData = JSON.parse(docString);
      
      if (!docData.isPublished) {
        return null;
      }

      return docData;
    } catch (error) {
      console.error('Failed to get document:', error);
      return null;
    }
  }

  // Generate share URL
  static generateShareUrl(docId: string): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?doc=${docId}`;
  }

  // Extract document ID from URL
  static getDocIdFromUrl(): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('doc');
  }
}

export default ServerAPI;