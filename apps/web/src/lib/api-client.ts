/**
 * Apex Commerce - Centralized Typed API Client
 * Connects to NestJS Backend (http://localhost:4000/v1) with JWT auth forwarding
 */

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Array<{ field?: string; issue: string }>;
  requestId?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('apex_customer_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // for refresh token cookie
      });

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const errorInfo: ApiError = json?.error || {
          code: `HTTP_${res.status}`,
          message: res.statusText || 'An unexpected error occurred.',
        };
        throw new Error(errorInfo.message);
      }

      return json;
    } catch (err: any) {
      // Re-throw with formatted message
      throw new Error(err.message || 'Network error connecting to Apex API.');
    }
  }

  // HTTP Verbs
  get<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(endpoint: string, body?: any, options?: RequestInit) {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestInit) {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Pre-signed Media Upload
  async uploadMedia(file: File, folder = 'catalog'): Promise<string> {
    try {
      const signRes = await this.post<{ uploadUrl: string; fileUrl: string }>('/media/sign', {
        filename: file.name,
        contentType: file.type,
        folder,
      });

      if (signRes.data?.uploadUrl) {
        await fetch(signRes.data.uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type },
        });
        return signRes.data.fileUrl;
      }
    } catch {
      // Fallback: create base64 object URL for offline/local resilience
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
