// api.ts or services/api.ts
import createApiClient from './client';

// Create a single instance with your base URL and default options
export const api = createApiClient(import.meta.env.VITE_API_URL, {
  timeout: 10000,
  withCredentials: true
});

// Optionally set auth token if you're using authentication
// api.setAuthToken(getTokenFromStorage());

export default api;