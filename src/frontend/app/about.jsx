import React, { useState } from 'react';
import { Text, View, Image, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS, SPACING, TYPOGRAPHY } from "../utils/theme";
import globalStyles from "../utils/styles";

export default function About() {
  const [selectedSetup, setSelectedSetup] = useState(null);

  const selectSetup = (type) => {
    setSelectedSetup(type);
  };

  return (
    <ScrollView style={globalStyles.scrollView}>
      <View style={globalStyles.container}>
        <Text style={[globalStyles.title, { textAlign: 'center', marginBottom: SPACING.lg }]}>
          About Shelfie
        </Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Image Guidelines</Text>
          
          <Text style={styles.subheading}>Good Images</Text>
          <Text style={styles.description}>
            Good images are clear, well-lit, and show the game components clearly. For best results:
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>• Stand approximately 3 feet away from the shelf</Text>
            <Text style={styles.bulletPoint}>• Only include 1 case at a time in each photo</Text>
            <Text style={styles.bulletPoint}>• Ensure good lighting with minimal glare</Text>
            <Text style={styles.bulletPoint}>• Take photos straight-on, not at an angle</Text>
            <Text style={styles.bulletPoint}>• Make sure game titles are clearly visible</Text>
          </View>
          
          <View style={styles.imagesContainer}>
            <View style={styles.imageWrapper}>
              <Image 
                source={require('../assets/images/examples/goodimage1.jpg')} 
                style={styles.exampleImage}
                resizeMode="contain"
              />
              <Text style={styles.imageCaption}>Good Example 1</Text>
            </View>
            
            <View style={styles.imageWrapper}>
              <Image 
                source={require('../assets/images/examples/goodimage2.jpg')} 
                style={styles.exampleImage}
                resizeMode="contain"
              />
              <Text style={styles.imageCaption}>Good Example 2</Text>
            </View>
          </View>
          
          <Text style={[styles.subheading, { marginTop: SPACING.lg }]}>Bad Images</Text>
          <Text style={styles.description}>
            Avoid these common issues when taking photos of your collection:
          </Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>• Too close or too far from the shelf</Text>
            <Text style={styles.bulletPoint}>• Multiple cases in one image</Text>
            <Text style={styles.bulletPoint}>• Poor lighting or excessive glare</Text>
            <Text style={styles.bulletPoint}>• Shadows blocking game edges</Text>
            <Text style={styles.bulletPoint}>• Angled shots that distort text</Text>
            <Text style={styles.bulletPoint}>• Blurry or low-resolution images</Text>
            <Text style={styles.bulletPoint}>• Crooked or tilted boxes</Text>
            <Text style={styles.bulletPoint}>• Small games may not be detected from too far away</Text>
          </View>
          
          <View style={styles.imagesContainer}>
            <View style={styles.imageWrapper}>
              <Image 
                source={require('../assets/images/examples/badimage1.jpg')} 
                style={styles.exampleImage}
                resizeMode="contain"
              />
              <Text style={styles.imageCaption}>Bad Example 1</Text>
            </View>
            
            <View style={styles.imageWrapper}>
              <Image 
                source={require('../assets/images/examples/badimage2.jpg')} 
                style={styles.exampleImage}
                resizeMode="contain"
              />
              <Text style={styles.imageCaption}>Bad Example 2</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Setup Instructions</Text>
          
          <Text style={styles.subheading}>1. Prerequisites</Text>
          <View style={styles.bulletPoints}>
            <Text style={styles.bulletPoint}>• Docker and Docker Compose</Text>
            <Text style={styles.bulletPoint}>• Git</Text>
          </View>
          
          <View style={styles.setupSelectionContainer}>
            <Text style={styles.question}>What type of setup do you have?</Text>
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[
                  styles.setupButton, 
                  selectedSetup === 'gpu' ? styles.activeButton : {}
                ]} 
                onPress={() => selectSetup('gpu')}
              >
                <Text style={[
                  styles.setupButtonText,
                  selectedSetup === 'gpu' ? styles.activeButtonText : {}
                ]}>
                  GPU Setup
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.setupButton, 
                  selectedSetup === 'cpu' ? styles.activeButton : {}
                ]} 
                onPress={() => selectSetup('cpu')}
              >
                <Text style={[
                  styles.setupButtonText,
                  selectedSetup === 'cpu' ? styles.activeButtonText : {}
                ]}>
                  Non-GPU Setup(Mac Users)
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {selectedSetup === 'gpu' && (
            <>
              <Text style={styles.subheading}>2. Clone Repository</Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>• Clone the repository:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`git clone https://gitlab.csi.miamioh.edu/2025-senior-design-projects/David_Maltbie/David-Maltbie.git`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Navigate to the project directory</Text>
                <Text style={styles.bulletPoint}>• Switch branches:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`git switch add-seperate-compose-for-frontend-and-identification`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Navigate to the identification directory:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`cd src/backend`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Download SAM:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`curl https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth --output sam_vit_l_0b3195.pth`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Navigate to the src directory:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`cd ..`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Run the code:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`docker compose up --build`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Navigate to the http://localhost:8081 in the browser to access the frontend</Text>
              </View>


              <Text style={styles.subheading}>Notes</Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>• You can alos view your collection here http://192.189.65.229:8081/collection</Text>
              </View>
            </>
          )}
          
          {selectedSetup === 'cpu' && (
            <>
              <Text style={styles.subheading}>2. Non-GPU Setup(Mac Users)</Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>• Clone the repository:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`git clone [repository URL]`}
                  </Text>
                </View>
              </View>

            </>
          )}
          
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: SPACING.xl,
    backgroundColor: COLORS.background.card,
    borderRadius: 12,
    padding: SPACING.md,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.fontSizes.xl,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  subheading: {
    fontSize: TYPOGRAPHY.fontSizes.lg,
    fontWeight: TYPOGRAPHY.fontWeights.bold,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  description: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  bulletPoints: {
    marginBottom: SPACING.md,
  },
  bulletPoint: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text.primary,
    marginBottom: SPACING.xs,
    paddingLeft: SPACING.sm,
  },
  imagesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
    marginVertical: SPACING.md,
  },
  imageWrapper: {
    width: '45%',
    marginBottom: SPACING.md,
    alignItems: 'center',
  },
  exampleImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  imageCaption: {
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text.secondary,
    marginTop: SPACING.xs,
    textAlign: 'center',
  },
  setupSelectionContainer: {
    marginVertical: SPACING.md,
    alignItems: 'center',
  },
  question: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    color: COLORS.text.primary,
    marginBottom: SPACING.sm,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
    marginBottom: SPACING.md,
  },
  setupButton: {
    backgroundColor: COLORS.background.secondary,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginHorizontal: SPACING.sm,
    minWidth: 120,
  },
  setupButtonText: {
    fontSize: TYPOGRAPHY.fontSizes.md,
    color: COLORS.text.primary,
    fontWeight: TYPOGRAPHY.fontWeights.medium,
    textAlign: 'center',
  },
  activeButton: {
    backgroundColor: COLORS.primary,
  },
  activeButtonText: {
    color: COLORS.text.inverse,
  },
  codeBlock: {
    backgroundColor: COLORS.background.secondary,
    borderRadius: 4,
    padding: SPACING.sm,
    marginVertical: SPACING.xs,
    marginLeft: SPACING.md,
    marginRight: SPACING.sm,
  },
  code: {
    fontFamily: 'monospace',
    fontSize: TYPOGRAPHY.fontSizes.sm,
    color: COLORS.text.code || COLORS.text.primary,
  },
});
