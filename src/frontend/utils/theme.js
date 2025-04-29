// Theme configuration for the application

// Color palette
export const COLORS = {
  // Primary colors
  primary: '#007AFF',
  primaryDark: '#0062CC',
  primaryLight: '#4DA3FF',
  
  // Background colors
  background: {
    dark: '#121212',
    card: '#1E1E1E',
    elevated: '#2C2C2C',
    input: '#1A1A1A'
  },
  
  // Text colors
  text: {
    primary: '#FFFFFF',
    secondary: '#AAAAAA',
    disabled: '#666666'
  },
  
  // Action colors
  action: {
    approve: '#34C759',
    approveBackground: '#1A3A2A',
    reject: '#FF3B30',
    rejectBackground: '#3A1A1A'
  },
  
  // UI element colors
  border: '#333333',
  divider: '#333333',
  inactive: '#8E8E93',
  shadow: '#000000'
};

// Spacing values
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48
};

// Typography
export const TYPOGRAPHY = {
  fontSizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32
  },
  fontWeights: {
    regular: 'normal',
    medium: '500',
    bold: 'bold'
  }
};

// Common styles
export const COMMON_STYLES = {
  card: {
    backgroundColor: COLORS.background.card,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    padding: SPACING.md,
    marginBottom: SPACING.md
  },
  button: {
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center'
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center'
  }
};
