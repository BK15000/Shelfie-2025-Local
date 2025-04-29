import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useAuth } from '../utils/authContext';
import { COLORS, SPACING, TYPOGRAPHY } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [gpuEndpoint, setGpuEndpoint] = useState('localhost');
  const [ipError, setIpError] = useState('');
  const [serverStatus, setServerStatus] = useState(null);
  const { login, register, authError, isLoading } = useAuth();



  // Validate IP address format or localhost
  const isValidIpAddress = (ip) => {
    if (ip === 'localhost') return true;
    // IPv4 regex pattern
    const ipv4Pattern = /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    return ipv4Pattern.test(ip);
  };

  const handleSubmit = async () => {
    console.log('Submit button clicked');
    try {
      if (isLogin) {
        console.log('Attempting login with email:', email);
        await login(email, password);
      } else {
        // Check if there's an IP error
        if (ipError) {
          return; // Don't proceed if there's an IP error
        }
        
        // Double-check IP address format
        if (!isValidIpAddress(gpuEndpoint)) {
          setIpError('Please enter a valid hostname (localhost) or IP address (e.g., 192.168.1.1)');
          return;
        }
        
        console.log('Attempting registration with email:', email);
        await register(email, password, gpuEndpoint);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Ionicons name="albums" size={64} color={COLORS.primary} />
          <Text style={styles.title}>Board Game Collection</Text>
          <Text style={styles.subtitle}>{isLogin ? 'Login to your account' : 'Create a new account'}</Text>
        </View>

        {authError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{authError}</Text>
          </View>
        )}
        

        <View style={styles.formContainer}>
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={COLORS.text.secondary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={COLORS.text.secondary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons name="server-outline" size={20} color={COLORS.text.secondary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, ipError ? { borderColor: COLORS.action.reject, borderWidth: 1 } : {}]}
                    placeholder="GPU Endpoint (e.g., localhost or 192.168.1.1)"
                    placeholderTextColor={COLORS.text.secondary}
                    value={gpuEndpoint}
                    onChangeText={(text) => {
                      setGpuEndpoint(text);
                      if (text && !isValidIpAddress(text)) {
                        setIpError('Please enter a valid hostname (localhost) or IP address (e.g., 192.168.1.1)');
                      } else {
                        setIpError('');
                      }
                    }}
                  />
                </View>
                
                {ipError ? (
                  <Text style={styles.errorText}>{ipError}</Text>
                ) : null}
              </>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.text.primary} />
              ) : (
                <Text style={styles.buttonText}>{isLogin ? 'Login' : 'Sign Up'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchButton}
              onPress={() => setIsLogin(!isLogin)}
              disabled={isLoading}
            >
              <Text style={styles.switchButtonText}>
                {isLogin ? 'Need an account? Sign Up' : 'Already have an account? Login'}
              </Text>
            </TouchableOpacity>
            
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background.dark,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: TYPOGRAPHY.fontSizes.xxl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text.primary,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text.secondary,
    marginTop: SPACING.sm,
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  form: {
    width: '66%', // Take up 2/3 of the width (1/3 gap on each side)
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background.card,
    borderRadius: 8,
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  buttonText: {
    color: COLORS.text.primary,
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
  },
  switchButton: {
    marginTop: SPACING.lg,
    alignItems: 'center',
  },
  switchButtonText: {
    color: COLORS.primary,
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  errorContainer: {
    backgroundColor: COLORS.action.rejectBackground,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.action.reject,
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
  successContainer: {
    backgroundColor: 'rgba(39, 174, 96, 0.2)',
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  successText: {
    color: '#27AE60',
    fontSize: TYPOGRAPHY.fontSizes.sm,
  },
});
