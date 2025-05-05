import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../utils/authContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';
import { getApiUrl, getAuthUrl, API_CONFIG } from './config';
import { router } from 'expo-router';

export default function Profile() {
  const { user, isAuthenticated, isLoading, updateGpuEndpoint, updateUserSettings, fetchGpuEndpoint, logout, authFetch } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [gpuEndpoint, setGpuEndpoint] = useState('');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [port, setPort] = useState('');
  // Initialize user settings when user data is available
  useEffect(() => {
    if (user) {
      // First set values from the user object
      if (user.gpu_endpoint) {
        setGpuEndpoint(user.gpu_endpoint);
      }
      
      if (user.openai_api_key) {
        setOpenaiApiKey(user.openai_api_key);
      }
      
      if (user.port) {
        setPort(user.port);
      }
      
      // Then fetch the latest values from the server
      const getLatestUserData = async () => {
        try {
          await fetchGpuEndpoint();
          
          // Update state with the latest values from the user object
          if (user.gpu_endpoint) {
            setGpuEndpoint(user.gpu_endpoint);
          }
          
          if (user.openai_api_key) {
            setOpenaiApiKey(user.openai_api_key);
          }
          
          if (user.port) {
            setPort(user.port);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      };
      
      getLatestUserData();
    }
  }, [user, fetchGpuEndpoint]);
    
  // Set a timeout for loading state
  useEffect(() => {
    let timeoutId;
    
    if (isLoading) {
      timeoutId = setTimeout(() => {
        setLoadingTimeout(true);
      }, 5000); // 5 seconds timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isLoading]);

  const handleUpdateGpuEndpoint = async () => {
    setIsUpdating(true);
    try {
      const success = await updateGpuEndpoint(gpuEndpoint);
      if (success) {
        Alert.alert('Success', 'GPU endpoint updated successfully');
      } else {
        Alert.alert('Error', 'Failed to update GPU endpoint');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCleanSegments = async () => {
    setIsCleaning(true);
    try {
      // Call the cleaning service
      const response = await authFetch(getApiUrl('/segments/clean'));
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to clean segments');
      }
      
      const data = await response.json();
      Alert.alert('Success', `Cleaned ${data.cleaned_count} segments`);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsCleaning(false);
    }
  };
  const directLogout = async () => {
    console.log("DIRECT LOGOUT FUNCTION CALLED");
    
    // Clear AsyncStorage
    await AsyncStorage.removeItem('auth_access_token');
    await AsyncStorage.removeItem('auth_refresh_token');
    await AsyncStorage.removeItem('auth_user_data');
    
    // Clear localStorage for boardGameSegments
    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem('boardGameSegments');
        console.log("boardGameSegments cleared from localStorage");
      } catch (error) {
        console.error("Error clearing boardGameSegments from localStorage:", error);
      }
    }
    
    // Clear image cache if in a web environment
    if (typeof window !== 'undefined' && window.caches) {
      try {
        // Try to clear all caches
        const cacheKeys = await window.caches.keys();
        await Promise.all(
          cacheKeys.map(cacheKey => window.caches.delete(cacheKey))
        );
        console.log("Browser cache cleared successfully");
      } catch (error) {
        console.error("Error clearing browser cache:", error);
      }
    }
    
    // Navigate to login page
    router.replace('/login');
  };
  // Show loading indicator while authentication state is being determined
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        
        {loadingTimeout && (
          <View style={styles.timeoutContainer}>
            <Text style={styles.errorText}>
              Loading is taking longer than expected. There might be an issue with the authentication service.
            </Text>
            <TouchableOpacity
              style={[styles.button, styles.logoutButton, { marginTop: SPACING.md }]}
              onPress={() => router.replace('/login')}
            >
              <Ionicons name="log-in-outline" size={20} color={COLORS.text.primary} />
              <Text style={styles.buttonText}>Go to Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }
  
  // If not loading but user is null, there might be an authentication issue
  if (!user && !isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Unable to load profile. Please try logging in again.</Text>
        <TouchableOpacity
          style={[styles.button, styles.logoutButton, { marginTop: SPACING.md }]}
          onPress={() => router.replace('/login')}
        >
          <Ionicons name="log-in-outline" size={20} color={COLORS.text.primary} />
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="person-circle-outline" size={80} color={COLORS.primary} />
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.email}>{user.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collection Management</Text>
        <Text style={styles.sectionDescription}>
          Manage and export your board game collection
        </Text>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: COLORS.action.approveBackground }]}
          onPress={async () => {
            try {
              console.log('Starting CSV export...');
              const token = await AsyncStorage.getItem('auth_access_token');
              if (!token) {
                throw new Error('No auth token found');
              }
              
              const url = getAuthUrl('/collection/export-csv');
              console.log('Export URL:', url);
              console.log('Auth token:', token);
              
              const response = await fetch(url, {
                method: 'GET',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              console.log('Response status:', response.status);
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Export failed:', response.status, errorText);
                throw new Error(`Failed to export collection: ${response.status} ${errorText}`);
              }
              console.log('Response headers:', Object.fromEntries(response.headers.entries()));
              
              console.log('Response received, creating blob...');
              const blob = await response.blob();
              console.log('Blob created, initiating download...');
              
              // For React Native Web
              if (typeof window !== 'undefined') {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'collection.csv';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } else {
                // For React Native mobile
                Alert.alert('Error', 'CSV export is only supported on web platforms');
                return;
              }
              
              Alert.alert('Success', 'Collection exported successfully');
            } catch (error) {
              console.error('Export error:', error);
              Alert.alert('Error', `Export failed: ${error.message}`);
            }
          }}
        >
          <Ionicons name="download-outline" size={20} color={COLORS.text.primary} />
          <Text style={styles.buttonText}>Export Collection to CSV</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Server Settings</Text>
        <Text style={styles.sectionDescription}>
          Configure your server settings for image processing and game identification
        </Text>
        
        {/* GPU Endpoint */}
        <Text style={styles.fieldLabel}>GPU Endpoint URL</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="server-outline" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="GPU Endpoint (e.g., http://192.168.1.1 or https://example.com)"
            placeholderTextColor={COLORS.text.secondary}
            value={gpuEndpoint}
            onChangeText={setGpuEndpoint}
          />
        </View>
        
        {/* Port (Optional) */}
        <Text style={styles.fieldLabel}>Port (Optional)</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="git-network-outline" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            defaultValue={'8080'}
            placeholderTextColor={COLORS.text.secondary}
            value={port}
            onChangeText={setPort}
            keyboardType="numeric"
          />
        </View>
        
        {/* OpenAI API Key */}
        <Text style={styles.fieldLabel}>OpenAI API Key</Text>
        <View style={styles.inputContainer}>
          <Ionicons name="key-outline" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="OpenAI API Key"
            placeholderTextColor={COLORS.text.secondary}
            value={openaiApiKey}
            onChangeText={setOpenaiApiKey}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() => {
            setIsUpdating(true);
            updateUserSettings({
              gpu_endpoint: gpuEndpoint,
              port: port,
              openai_api_key: openaiApiKey
            })
              .then(success => {
                if (success) {
                  Alert.alert('Success', 'Settings updated successfully');
                } else {
                  Alert.alert('Error', 'Failed to update settings');
                }
              })
              .catch(error => {
                Alert.alert('Error', error.message);
              })
              .finally(() => {
                setIsUpdating(false);
              });
          }}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color={COLORS.text.primary} />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color={COLORS.text.primary} />
              <Text style={styles.buttonText}>Save Settings</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Direct logout button with no complex logic */}
      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={directLogout}
      >
        <Ionicons name="log-out-outline" size={20} color={COLORS.text.primary} />
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Shelfie</Text>
        <Text style={styles.footerVersion}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  header: {
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    marginLeft: '17%', // Align with input container
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
  },
  email: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  section: {
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text.secondary,
    marginBottom: SPACING.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    borderRadius: 8,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    width: '66%', // Take up 2/3 of the width (1/3 gap on each side)
    alignSelf: 'center',
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 50,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    width: '66%', // Take up 2/3 of the width (1/3 gap on each side)
    alignSelf: 'center',
  },
  buttonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginLeft: SPACING.sm,
  },
  cleanButton: {
    backgroundColor: COLORS.action.approveBackground,
  },
  logoutButton: {
    backgroundColor: COLORS.action.rejectBackground,
    margin: SPACING.lg,
  },
  footer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text.secondary,
  },
  footerVersion: {
    fontSize: TYPOGRAPHY.fontSizes.xs,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.action.reject,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  timeoutContainer: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
    backgroundColor: COLORS.background.card,
    borderRadius: 8,
    width: '80%',
    alignItems: 'center',
  },
});
