import { StyleSheet } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY, COMMON_STYLES } from "./theme";

// Centralized styles for the entire application
const globalStyles = StyleSheet.create({
  // Common container styles
  container: {
    flex: 1,
    padding: SPACING.md,
    backgroundColor: COLORS.background.dark,
  },
  
  scrollView: {
    backgroundColor: COLORS.background.dark,
  },
  
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.background.dark,
  },
  
  emptyText: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    textAlign: "center",
    color: COLORS.text.primary,
  },
  
  emptySubtext: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  
  // Button styles
  buttonContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  
  button: {
    ...COMMON_STYLES.button,
    flexDirection: 'row',
    backgroundColor: COLORS.background.elevated,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  
  buttonText: {
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginLeft: SPACING.xs,
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  // Image styles
  imageContainer: {
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  
  image: {
    width: 500,
    height: 500,
    marginBottom: SPACING.md,
    borderRadius: 8,
    resizeMode: 'contain',
  },
  
  // Title and text styles
  title: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    marginBottom: SPACING.sm,
    color: COLORS.text.primary,
  },
  
  subtitle: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    marginBottom: SPACING.sm,
    color: COLORS.text.primary,
  },
  
  text: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text.primary,
  },
  
  secondaryText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text.secondary,
  },
  
  // Single segment view styles
  singleSegmentContainer: {
    width: '100%',
    alignItems: 'center',
  },

  largeSegmentCard: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    backgroundColor: COLORS.background.card,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
  },

  mainPageSegmentCard: {
    flex: 1,
    width: '100%',
    maxWidth: 500, // Reduced from 800
    backgroundColor: COLORS.background.card,
    borderRadius: 12,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md, // Reduced from lg
    paddingTop: SPACING.md, // Reduced from xl
  },

  largeSegmentImage: {
    width: '100%',
    height: '100%',
    alignSelf: 'center',
  },

  centerActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },

  // Grid view styles
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl,
  },

  gridCard: {
    width: 180,
    height: 180,
    marginBottom: SPACING.sm,
    borderRadius: 8,
    backgroundColor: COLORS.background.card,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    alignSelf: 'center',
    position: 'relative',
  },

  gridImage: {
    width: '100%',
    height: '100%',
    marginTop: 5, // Reduced space for title
  },
  
  segmentTitle: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    padding: SPACING.xs,
    color: COLORS.text.primary,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.background.card,
    zIndex: 1,
    height: 25,
    textAlign: 'center',
    overflow: 'hidden',
  },
  
  segmentImage: {
    width: '100%',
    height: 350, // Reduced from 600
    aspectRatio: 1, // Maintain aspect ratio
    alignSelf: 'center',
  },
  
  segmentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.sm,
    backgroundColor: COLORS.background.card,
  },
  
  // Action button styles
  actionButton: {
    ...COMMON_STYLES.iconButton,
  },
  
  approveButton: {
    backgroundColor: COLORS.action.approveBackground,
  },
  
  rejectButton: {
    backgroundColor: COLORS.action.rejectBackground,
  },
  
  // Navigation styles
  navigationInfo: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  
  navigationText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text.primary,
  },
  
  navigationControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  
  // Metadata styles
  metadataContainer: {
    padding: SPACING.md,
    backgroundColor: COLORS.background.card,
    borderRadius: 8,
  },
  
  metadataText: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text.secondary,
  },
  
  // Loading indicator
  loader: {
    marginTop: SPACING.lg,
  },
});

// Export globalStyles as default for routing
export default globalStyles;
