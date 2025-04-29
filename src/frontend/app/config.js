// Configuration settings for the application

// Backend API configuration
export const API_CONFIG = {
  // Base URL for API calls - change this when the backend server IP changes
  baseUrl: 'http://localhost:8080',
  
  // Auth backend URL - using the same URL format as baseUrl for consistency
  authBaseUrl: 'http://192.189.65.229:8080',
  
  // API endpoints
  endpoints: {
    // Backend endpoints
    upload: '/upload',
    segments: '/segments',
    images: '/images',
    
    // Auth endpoints
    auth: {
      register: '/auth/register',
      login: '/auth/login',
      logout: '/auth/logout',
      refresh: '/auth/refresh',
      gpuEndpoint: '/auth/gpu-endpoint',
    },
    
    // Collection endpoints
    collection: {
      items: '/collection/items',
    }
  }
};

// Get full URL for an API endpoint
export const getApiUrl = (endpoint, params = {}, useAuthBackend = false) => {
  // Determine which base URL to use
  const baseUrl = useAuthBackend ? API_CONFIG.authBaseUrl : API_CONFIG.baseUrl;
  let url = `${baseUrl}${endpoint}`;
  
  // Replace path parameters
  Object.entries(params).forEach(([key, value]) => {
    url = url.replace(`:${key}`, value);
  });
  
  return url;
};

// Get auth API URL
export const getAuthUrl = (endpoint, params = {}) => {
  return getApiUrl(endpoint, params, true);
};
