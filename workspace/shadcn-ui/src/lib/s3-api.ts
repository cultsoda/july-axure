// AWS S3 기반 실제 서버 API
interface DocumentData {
  id: string;
  title: string;
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  isPublished: boolean;
}

interface ManifestData {
  latest: string;
  path: string;
  updatedAt: string;
}

interface OverviewData {
  title?: string;
}

class S3API {
  private static API_BASE = window.location.origin.includes('localhost') 
    ? 'http://localhost:3001' 
    : window.location.origin;
  private static S3_BASE = 'https://xromeda-docs.s3.ap-northeast-2.amazonaws.com';
  
  // Create a new document on S3
  static async createDocument(data: Record<string, unknown>, title: string): Promise<string> {
    try {
      // Generate a unique document ID
      const docId = 'xromeda-main'; // For now, use a fixed ID
      
      // First, save as draft
      await this.saveDraft(docId, data);
      
      return docId;
    } catch (error) {
      console.error('Failed to create document:', error);
      throw new Error('문서 생성에 실패했습니다.');
    }
  }

  // Save document as draft
  static async saveDraft(docId: string, data: Record<string, unknown>): Promise<boolean> {
    try {
      // Get presigned URL from server
      const response = await fetch(`${this.API_BASE}/api/get-presigned-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ docId }),
      });

      if (!response.ok) {
        throw new Error('Failed to get presigned URL');
      }

      const { url } = await response.json();

      // Upload to S3 using presigned URL
      const uploadResponse = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: docId,
          title: (data as { overview?: OverviewData })?.overview?.title || 'XROMEDA 기획서',
          data,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isPublished: false
        }),
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload to S3');
      }

      return true;
    } catch (error) {
      console.error('Failed to save draft:', error);
      return false;
    }
  }

  // Update existing document (same as save draft)
  static async updateDocument(docId: string, data: Record<string, unknown>): Promise<boolean> {
    return this.saveDraft(docId, data);
  }

  // Publish document (Draft → Release)
  static async publishDocument(docId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/api/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ docId }),
      });

      if (!response.ok) {
        throw new Error('Failed to publish document');
      }

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Failed to publish document:', error);
      return false;
    }
  }

  // Get published document
  static async getPublishedDocument(docId: string): Promise<DocumentData | null> {
    try {
      // First, get the manifest to find the latest version
      const manifestResponse = await fetch(
        `${this.S3_BASE}/docs/${docId}/manifest.json?t=${Date.now()}`,
        { 
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );

      if (!manifestResponse.ok) {
        console.log('No manifest found, document may not be published yet');
        return null;
      }

      const manifest: ManifestData = await manifestResponse.json();

      // Get the actual document
      const docResponse = await fetch(
        `${this.S3_BASE}/docs/${docId}/${manifest.path}?t=${Date.now()}`,
        { 
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );

      if (!docResponse.ok) {
        throw new Error('Failed to fetch document');
      }

      const docData: DocumentData = await docResponse.json();
      
      if (!docData.isPublished) {
        return null;
      }

      return docData;
    } catch (error) {
      console.error('Failed to get published document:', error);
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
    return urlParams.get('doc') || 'xromeda-main'; // Default to main document
  }

  // Check if server is available
  static async checkServerHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.API_BASE}/api/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.ok;
    } catch (error) {
      console.error('Server health check failed:', error);
      return false;
    }
  }
}

export default S3API;