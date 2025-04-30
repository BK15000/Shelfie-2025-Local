import { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_CONFIG, getAuthUrl } from '../app/config';

// Create the context
const AuthContext = createContext();

// Storage keys for AsyncStorage
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_DATA_KEY = 'auth_user_data';

// Provider component
export const AuthProvider = ({ children }) => {
  
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Load auth state from AsyncStorage on mount
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const [accessToken, refreshToken, userData] = await Promise.all([
          AsyncStorage.getItem(ACCESS_TOKEN_KEY),
          AsyncStorage.getItem(REFRESH_TOKEN_KEY),
          AsyncStorage.getItem(USER_DATA_KEY),
        ]);

        // If we have stored tokens and user data
        if (accessToken && userData && userData !== "undefined" && userData !== "null") {
          try {
            // Parse the user data
            const parsedUserData = JSON.parse(userData);
            
            // Validate the user data has the expected structure
            if (parsedUserData && parsedUserData.email) {
              setUser(parsedUserData);
              setIsAuthenticated(true);
            } else {
              console.error('Invalid user data format');
              // Clear invalid data
              await Promise.all([
                AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
                AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
                AsyncStorage.removeItem(USER_DATA_KEY),
              ]);
            }
          } catch (parseError) {
            console.error('Failed to parse user data:', parseError);
            // Clear invalid data
            await Promise.all([
              AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
              AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
              AsyncStorage.removeItem(USER_DATA_KEY),
            ]);
          }
        } else if (refreshToken && refreshToken !== "undefined" && refreshToken !== "null") {
          // If we have a refresh token but no access token, try to refresh
          try {
            // Attempt to refresh the token
            const response = await fetch(getAuthUrl(API_CONFIG.endpoints.auth.refresh), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                refresh_token: refreshToken,
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              
              // Validate the response data
              if (!data.access_token || !data.refresh_token) {
                throw new Error('Invalid response data from token refresh');
              }
              
              // Store the new tokens
              await Promise.all([
                AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token),
                AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token),
              ]);
              
              // Try to get the existing user data
              const existingUserData = await AsyncStorage.getItem(USER_DATA_KEY);
              if (existingUserData && existingUserData !== "undefined" && existingUserData !== "null") {
                try {
                  const parsedUserData = JSON.parse(existingUserData);
                  setUser(parsedUserData);
                  setIsAuthenticated(true);
                } catch (parseError) {
                  console.error('Failed to parse existing user data:', parseError);
                  // Create a minimal user object
                  const minimalUser = { email: 'user@example.com', gpu_endpoint: '' };

                  await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(minimalUser));
                  setUser(minimalUser);
                  setIsAuthenticated(true);
                }
              } else {
                // Create a minimal user object
                const minimalUser = { email: 'user@example.com', gpu_endpoint: '' };
                await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(minimalUser));
                setUser(minimalUser);
                setIsAuthenticated(true);
              }
            } else {
              console.error('Token refresh failed during initial load');
              // Clear invalid tokens
              await Promise.all([
                AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
                AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
                AsyncStorage.removeItem(USER_DATA_KEY),
              ]);
            }
          } catch (refreshError) {
            console.error('Failed to refresh token during initial load:', refreshError);
            // Clear invalid tokens
            await Promise.all([
              AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
              AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
              AsyncStorage.removeItem(USER_DATA_KEY),
            ]);
          }
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAuthState();
  }, []);

  // Register a new user
  const register = async (email, password, gpuEndpoint) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      const response = await fetch(getAuthUrl(API_CONFIG.endpoints.auth.register), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          gpu_endpoint: gpuEndpoint,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      // For registration, we get the user data directly in the response
      if (!data.id || !data.email) {
        throw new Error('Invalid response data from registration');
      }

      // Create a user object from the registration response
      const userData = {
        id: data.id,
        email: data.email,
        gpu_endpoint: data.gpu_endpoint || gpuEndpoint,
      };

      // Clear any existing auth state since we want explicit login
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);
      setUser(null);
      setIsAuthenticated(false);
      
      // Navigate to login page
      setTimeout(() => {
        router.replace('/login');
      }, 100);
      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      setAuthError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Login an existing user
  const login = async (email, password) => {
    setAuthError(null);
    setIsLoading(true);

    try {
      console.log('Attempting login for:', email);
      const loginUrl = getAuthUrl(API_CONFIG.endpoints.auth.login);
      console.log('Login URL:', loginUrl);
      
      let response, data;
      try {
        console.log('Preparing fetch request with body:', JSON.stringify({ email, password }));
        console.log('Request headers:', JSON.stringify({ 'Content-Type': 'application/json' }));
        
        // Add a timeout to the fetch request
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        response = await fetch(loginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
          }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log('Login response received, status:', response.status);
        
        data = await response.json();
        console.log('Login response data received:', JSON.stringify(data));
      } catch (fetchError) {
        console.error('Network error during login fetch:', fetchError);
        if (fetchError.name === 'AbortError') {
          throw new Error('Request timed out: The server took too long to respond');
        } else {
          throw new Error('Network error: ' + (fetchError.message || 'Failed to connect to server'));
        }
      }

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      // Validate the response data
      if (!data.access_token || !data.refresh_token) {
        throw new Error('Invalid response data from login');
      }

      // Store tokens
      await Promise.all([
        AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token),
        AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token),
      ]);

      // Create a user object with the email
      let userData = {
        email: email,
        gpu_endpoint: '',  // Default value
        openai_api_key: '',  // Default value
        port: '',  // Default value
      };

      // Store initial user data
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
      setUser(userData);
      setIsAuthenticated(true);
      
      // Fetch the GPU endpoint from the server
      try {
        console.log('Fetching GPU endpoint after login');
        const gpuResponse = await fetch(getAuthUrl(API_CONFIG.endpoints.auth.gpuEndpoint), {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (gpuResponse.ok) {
          const gpuData = await gpuResponse.json();
          console.log('GPU endpoint fetched successfully:', gpuData);
          
          // Update user data with the GPU endpoint
          userData = {
            ...userData,
            gpu_endpoint: gpuData.gpu_endpoint || '',
          };
          
          // Update stored user data
          await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
          setUser(userData);
        } else {
          console.error('Failed to fetch GPU endpoint after login:', gpuResponse.status);
        }
      } catch (gpuError) {
        console.error('Error fetching GPU endpoint after login:', gpuError);
      }
      
      // Delay navigation to ensure state is updated first
      setTimeout(() => {
        router.replace('/');
      }, 100);
      return true;
    } catch (error) {
      console.error('Login failed:', error);
      setAuthError(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout the current user
  const logout = async () => {
    console.log('Logout function called');
    
    try {
      // Get the access token
      const accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      
      if (accessToken) {
        // Make a simple fetch call to the logout endpoint
        try {
          console.log('Calling logout API');
          
          // Use the helper function to get the logout URL
          const logoutUrl = getAuthUrl(API_CONFIG.endpoints.auth.logout);
          console.log('Logout URL:', logoutUrl);
          
          // Add a timeout to the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
          
          // Include the token in the request body as well as the header
          const response = await fetch(logoutUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify({
              token: accessToken
            }),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          console.log('Logout API response status:', response.status);
          
          // Try to parse the response
          try {
            const data = await response.json();
            console.log('Logout API response data:', data);
          } catch (parseError) {
            console.log('No JSON response from logout API');
          }
          
          console.log('Logout API call completed');
        } catch (fetchError) {
          // Just log the error but continue with logout process
          console.error('Error calling logout API:', fetchError);
          if (fetchError.name === 'AbortError') {
            console.error('Logout request timed out');
          }
        }
      } else {
        console.error('No access token available for logout');
      }
      
      // Clear local storage
      await Promise.all([
        AsyncStorage.removeItem(ACCESS_TOKEN_KEY),
        AsyncStorage.removeItem(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem(USER_DATA_KEY),
      ]);
      console.log('AsyncStorage cleared successfully');
      
      // Update state
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      // Force navigation to login page with a slight delay to ensure state is updated first
      console.log('Redirecting to login page');
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    } catch (error) {
      console.error('Error during logout:', error);
      
      // Even if there's an error, try to clear state and redirect
      setUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      setTimeout(() => {
        router.replace('/login');
      }, 100);
    }
  };

  // Update user settings
  const updateUserSettings = async (settings) => {
    setIsLoading(true);

    try {
      // Get a fresh access token
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(getAuthUrl(API_CONFIG.endpoints.auth.gpuEndpoint), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to update user settings');
      }

      // Make sure we have a valid user object
      if (!user) {
        throw new Error('User data is not available');
      }

      // Update user data in storage and state
      const updatedUser = { ...user, ...settings };
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return true;
    } catch (error) {
      console.error('Failed to update GPU endpoint:', error);
      
      // If there's an authentication error, redirect to login with a slight delay
      if (error.message === 'Not authenticated' || error.message === 'User data is not available') {
        setTimeout(() => {
          router.replace('/login');
        }, 100);
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Get GPU endpoint from the server
  const fetchGpuEndpoint = async () => {
    try {
      // Get a fresh access token
      const accessToken = await getAccessToken();
      
      if (!accessToken) {
        console.error('Not authenticated, cannot fetch GPU endpoint');
        return null;
      }
      
      const response = await fetch(getAuthUrl(API_CONFIG.endpoints.auth.gpuEndpoint), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch GPU endpoint, status:', response.status);
        return null;
      }

      const data = await response.json();
      
      // Make sure we have a valid user object
      if (!user) {
        console.error('User data is not available');
        return null;
      }

      // Update user data in storage and state with all fields from the server
      const updatedUser = { 
        ...user, 
        gpu_endpoint: data.gpu_endpoint || user.gpu_endpoint || '',
        openai_api_key: data.openai_api_key || user.openai_api_key || '',
        port: data.port || user.port || ''
      };
      
      // Check if any field has changed
      if (JSON.stringify(updatedUser) !== JSON.stringify(user)) {
        console.log('Updating user data from server');
        await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
      
      return data.gpu_endpoint;
    } catch (error) {
      console.error('Failed to fetch GPU endpoint:', error);
      return null;
    }
  };

  // Decode JWT token to get payload
  const decodeJWT = (token) => {
    try {
      // JWT tokens are three parts separated by dots: header.payload.signature
      const parts = token.split('.');
      if (parts.length !== 3) {
        console.error('Invalid JWT format');
        return null;
      }
      
      // The payload is the second part, base64 encoded
      const base64Payload = parts[1];
      // Replace characters for base64url to base64
      const base64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
      // Decode the base64
      const jsonPayload = atob(base64);
      // Parse the JSON
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding JWT:', error);
      return null;
    }
  };
  
  // Check if token is expired
  const isTokenExpired = (token) => {
    const payload = decodeJWT(token);
    if (!payload) return true;
    
    // JWT exp is in seconds since epoch, Date.now() is in milliseconds
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token has an expiration and if it's expired
    return payload.exp && payload.exp < currentTime;
  };

  // Get the current access token with automatic refresh if needed
  const getAccessToken = async () => {
    try {
      let accessToken = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
      
      // Check if token exists and is valid
      if (!accessToken || accessToken === "undefined" || accessToken === "null" || isTokenExpired(accessToken)) {
        console.log('Token is missing or expired, attempting to refresh');
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (!refreshToken || refreshToken === "undefined" || refreshToken === "null") {
          console.error('No refresh token available');
          // Clear auth state and return null
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return null;
        }
        
        // Check if refresh token is also expired
        if (isTokenExpired(refreshToken)) {
          console.error('Refresh token is expired');
          // Clear auth state and return null
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return null;
        }
        
        // Attempt to refresh the token
        const response = await fetch(getAuthUrl(API_CONFIG.endpoints.auth.refresh), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh_token: refreshToken,
          }),
        });
        
        if (!response.ok) {
          console.error('Token refresh failed with status:', response.status);
          // Clear auth state and return null
          setIsAuthenticated(false);
          setUser(null);
          setIsLoading(false);
          return null;
        }
        
        const data = await response.json();
        
        // Store the new tokens
        await Promise.all([
          AsyncStorage.setItem(ACCESS_TOKEN_KEY, data.access_token),
          AsyncStorage.setItem(REFRESH_TOKEN_KEY, data.refresh_token),
        ]);
        
        accessToken = data.access_token;
      }
      
      return accessToken;
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, clear auth state
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
      return null;
    }
  };

  // Authenticated fetch wrapper that handles token refresh
  const authFetch = async (url, options = {}) => {
    const accessToken = await getAccessToken();
    
    if (!accessToken) {
      // If we couldn't get a token, redirect to login with a slight delay
      setTimeout(() => {
        router.replace('/login');
      }, 100);
      throw new Error('Not authenticated');
    }
    
    console.log('authFetch using token:', accessToken ? 'Token exists' : 'No token');
    
    const authOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${accessToken}`,
      },
    };
    
    console.log('authFetch URL:', url);
    console.log('authFetch headers:', JSON.stringify(authOptions.headers));
    
    try {
      const response = await fetch(url, authOptions);
      console.log('authFetch response status:', response.status);
      
      if (response.status === 401) {
        console.error('Authentication failed with 401 status');
        // Try to refresh the token explicitly
        try {
          console.log('Attempting to refresh token after 401 response');
          const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
          
          if (!refreshToken || refreshToken === "undefined" || refreshToken === "null") {
            console.error('No refresh token available for refresh attempt');
            throw new Error('No refresh token available');
          }
          
          // Explicitly call the refresh endpoint
          const refreshResponse = await fetch(getAuthUrl(API_CONFIG.endpoints.auth.refresh), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              refresh_token: refreshToken,
            }),
          });
          
          if (!refreshResponse.ok) {
            console.error('Token refresh failed with status:', refreshResponse.status);
            throw new Error('Token refresh failed');
          }
          
          const refreshData = await refreshResponse.json();
          
          // Store the new tokens
          await Promise.all([
            AsyncStorage.setItem(ACCESS_TOKEN_KEY, refreshData.access_token),
            AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshData.refresh_token),
          ]);
          
          console.log('Token refreshed successfully, retrying original request');
          
          // Retry the original request with the new token
          const retryOptions = {
            ...options,
            headers: {
              ...options.headers,
              'Authorization': `Bearer ${refreshData.access_token}`,
            },
          };
          
          return await fetch(url, retryOptions);
        } catch (refreshError) {
          console.error('Failed to refresh token for retry:', refreshError);
          // If refresh fails, clear auth state and redirect to login
          setIsAuthenticated(false);
          setUser(null);
          setTimeout(() => {
            router.replace('/login');
          }, 100);
          throw new Error('Authentication failed and token refresh failed');
        }
      }
      
      return response;
    } catch (error) {
      console.error('Auth fetch failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        authError,
        register,
        login,
        logout,
        updateGpuEndpoint: (gpuEndpoint) => updateUserSettings({ gpu_endpoint: gpuEndpoint }),
        updateUserSettings,
        fetchGpuEndpoint,
        getAccessToken,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export AuthProvider as default for routing
export default AuthProvider;

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
