import React, { useState } from 'react';
import { Text, View, Image, ScrollView, StyleSheet, TouchableOpacity, Linking } from "react-native";
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
            <Text style={styles.bulletPoint}>• VSCode</Text>
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
                  Nvidia GPU Setup
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
                  Remote Setup(Mac Users)
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
                    {`git clone https://github.com/BK15000/Shelfie-2025-Local.git`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Navigate to the project directory</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`cd Shelfie-2025-Local`}
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
              <Text style={styles.bulletPoint}>• Make sure to set OpenAI API key in profile</Text>
              <Text style={styles.bulletPoint}>• Do not modify the IP address from http://localhost</Text>
              <Text style={styles.bulletPoint}>• Do not modify the port from 8080</Text>
                <Text style={styles.bulletPoint}>• You can also view your collection here http://192.189.65.229:8081/collection, but identification services will not be available</Text>
              </View>
            </>
          )}
          
          {selectedSetup === 'cpu' && (
            <>
              <Text style={styles.subheading}>2. Set up Brev.dev Environment</Text>
              
              <Text style={styles.description}>
                First, we'll set up your Brev.dev environment for non-GPU development:
              </Text>

              <Text style={styles.bulletPoint}>1. Create Account</Text>
              <View style={styles.indentedContent}>
                <Text style={styles.description}>
                  Create a brev.dev account by following the documentation at:
                </Text>
                <TouchableOpacity 
                  onPress={() => Linking.openURL('https://docs.nvidia.com/brev/latest/quick-start.html')}
                  style={styles.link}
                >
                  <Text style={styles.linkText}>Brev.dev Quick Start Guide</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.bulletPoint}>2. Container Configuration</Text>
              <View style={styles.indentedContent}>
                <Text style={styles.description}>Use the following configuration when creating your container:</Text>
                <Image 
                  source={require('../assets/images/setup.jpg')} 
                  style={styles.setupImage}
                  resizeMode="contain"
                />
              </View>

              <Text style={styles.bulletPoint}>3. Container Setup</Text>
              <View style={styles.indentedContent}>
                <Text style={styles.description}>• Stay on the brev control panel</Text>
                <Text style={styles.description}>• Wait for container building to complete</Text>
                <Image 
                  source={require('../assets/images/FinishedSetup.jpg')} 
                  style={styles.setupImage}
                  resizeMode="contain"
                />
                <Text style={styles.description}>• Expose port 8080</Text>
                <Text style={styles.description}>• Save the HTTP URL/IP Address, for example:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>http://ec2-3-94-7-60.compute-1.amazonaws.com/</Text>
                </View>
              </View>

              <Text style={styles.bulletPoint}>4. Local Setup</Text>
              <View style={styles.indentedContent}>
                <Text style={styles.description}>• Download and sign into your brev account using the "Install CLI command" from the control panel</Text>
                <Text style={styles.description}>• Open the container in VSCode:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>brev open container-name</Text>
                </View>
                <Text style={styles.description}>Note: When brev asks for workspace selection, choose 'home'</Text>
              </View>

              <Text style={styles.subheading}>3. Clone Repository</Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>• Clone the repository:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`git clone https://github.com/BK15000/Shelfie-2025.git`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Navigate to the project directory:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`cd Shelfie-2025`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Download SAM:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`curl https://dl.fbaipublicfiles.com/segment_anything/sam_vit_l_0b3195.pth --output sam_vit_l_0b3195.pth`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Run the code:</Text>
                <View style={styles.codeBlock}>
                  <Text style={styles.code}>
                    {`docker compose up --build`}
                  </Text>
                </View>
                <Text style={styles.bulletPoint}>• Set your HTTP URL/IP from the Brev control panel and Port to 8080 on Profile page</Text>
              </View>

              <Text style={styles.subheading}>Notes</Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>• Make sure to set OpenAI API key in profile</Text>
                <Text style={styles.bulletPoint}>• Make sure to add funds to OpenAI API</Text>
                <Text style={styles.bulletPoint}>• Make sure to delete the brev container ater you're done</Text>
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
  indentedContent: {
    marginLeft: SPACING.lg,
    marginBottom: SPACING.md,
  },
  link: {
    marginVertical: SPACING.xs,
  },
  linkText: {
    color: COLORS.primary,
    textDecorationLine: 'underline',
    fontSize: TYPOGRAPHY.fontSizes.md,
  },
  setupImage: {
    width: '100%',
    height: 300,
    marginVertical: SPACING.md,
    borderRadius: 8,
  },
});
