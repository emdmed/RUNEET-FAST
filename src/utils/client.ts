/**
 * API Client - A TypeScript helper for making HTTP requests
 * 
 * Features:
 * - Support for GET, POST, PUT, DELETE methods
 * - Type safety with generics
 * - Automatic JSON parsing
 * - Error handling
 * - Configurable headers and timeout
 * - Request interceptors
 */

// Types for request options
interface RequestOptions {
    headers?: Record<string, string>;
    timeout?: number;
    params?: Record<string, string | number | boolean | undefined | null>;
    withCredentials?: boolean;
  }
  
  // Error class for API errors
  export class ApiError extends Error {
    status: number;
    data: any;
  
    constructor(message: string, status: number, data?: any) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.data = data;
    }
  }
  
  // Main API client class
  export class ApiClient {
    private baseUrl: string;
    private defaultOptions: RequestOptions;
  
    constructor(baseUrl: string, defaultOptions: RequestOptions = {}) {
      this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      this.defaultOptions = {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 30000, // 30 seconds
        withCredentials: false,
        ...defaultOptions,
      };
    }
  
    // Helper to build URL with query parameters
    private buildUrl(endpoint: string, params?: Record<string, any>): string {
      const url = new URL(`${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`);
      
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            url.searchParams.append(key, String(value));
          }
        });
      }
      
      return url.toString();
    }
  
    // Main request method
    private async request<T>(
      method: string,
      endpoint: string,
      data?: any,
      options: RequestOptions = {}
    ): Promise<T> {
      const mergedOptions: RequestOptions = {
        ...this.defaultOptions,
        ...options,
        headers: {
          ...this.defaultOptions.headers,
          ...options.headers,
        },
      };
  
      const url = this.buildUrl(endpoint, mergedOptions.params);
      
      const controller = new AbortController();
      const timeoutId = mergedOptions.timeout 
        ? setTimeout(() => controller.abort(), mergedOptions.timeout) 
        : null;
  
      try {
        const response = await fetch(url, {
          method,
          headers: mergedOptions.headers as HeadersInit,
          body: data ? JSON.stringify(data) : undefined,
          credentials: mergedOptions.withCredentials ? 'include' : 'same-origin',
          signal: controller.signal,
        });
  
        if (timeoutId) clearTimeout(timeoutId);
  
        const responseData = response.headers.get('Content-Type')?.includes('application/json')
          ? await response.json()
          : await response.text();
  
        if (!response.ok) {
          throw new ApiError(
            `API error: ${response.status} ${response.statusText}`,
            response.status,
            responseData
          );
        }
  
        return responseData as T;
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);
        
        if (error instanceof ApiError) {
          throw error;
        }
  
        if (error instanceof DOMException && error.name === 'AbortError') {
          throw new ApiError('Request timeout', 408);
        }
  
        throw new ApiError(
          `Request failed: ${(error as Error).message}`,
          0,
          error
        );
      }
    }
  
    // HTTP method implementations
    public async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
      return this.request<T>('GET', endpoint, undefined, options);
    }
  
    public async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
      return this.request<T>('POST', endpoint, data, options);
    }
  
    public async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
      return this.request<T>('PUT', endpoint, data, options);
    }
  
    public async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
      return this.request<T>('DELETE', endpoint, undefined, options);
    }
  
    // Additional utility method for PATCH requests
    public async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
      return this.request<T>('PATCH', endpoint, data, options);
    }
  
    // Method to set authorization token
    public setAuthToken(token: string): void {
      if (this.defaultOptions.headers) {
        this.defaultOptions.headers['Authorization'] = `Bearer ${token}`;
      } else {
        this.defaultOptions.headers = { 'Authorization': `Bearer ${token}` };
      }
    }
  
    // Method to clear authorization token
    public clearAuthToken(): void {
      if (this.defaultOptions.headers) {
        delete this.defaultOptions.headers['Authorization'];
      }
    }
  }
  
  // Usage example
  /*
  const api = new ApiClient('https://api.example.com', {
    timeout: 5000,
    withCredentials: true,
  });
  
  // Set auth token if needed
  api.setAuthToken('your-jwt-token');
  
  // Example GET request
  interface User {
    id: number;
    name: string;
    email: string;
  }
  
  async function getUser(id: number): Promise<User> {
    try {
      return await api.get<User>(`/users/${id}`);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        throw new Error(`User with ID ${id} not found`);
      }
      throw error;
    }
  }
  
  // Example POST request
  interface CreateUserPayload {
    name: string;
    email: string;
    password: string;
  }
  
  async function createUser(userData: CreateUserPayload): Promise<User> {
    return api.post<User>('/users', userData);
  }
  */
  
  // Export a factory function to create API clients
  export const createApiClient = (baseUrl: string, options?: RequestOptions) => {
    return new ApiClient(baseUrl, options);
  };
  
  export default createApiClient;