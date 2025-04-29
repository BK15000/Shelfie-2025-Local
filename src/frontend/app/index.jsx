import { Text, View, Image, ScrollView, ActivityIndicator, TouchableOpacity, Modal, TextInput, Alert } from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { useState, useRef, useEffect } from "react";
import { useCollection } from "../utils/collectionContext";
import { useAuth } from "../utils/authContext";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING } from "../utils/theme";
import { getApiUrl } from "./config";
import globalStyles from "../utils/styles";

// Helper function to get GPU endpoint URL
const getGpuEndpointUrl = (user, endpoint) => {
  if (user && user.gpu_endpoint && user.gpu_endpoint.trim() !== '') {
    // Use the full GPU endpoint as provided in the database
    // If it doesn't include http://, add it
    let gpuEndpoint = user.gpu_endpoint;
    if (!gpuEndpoint.startsWith('http://') && !gpuEndpoint.startsWith('https://')) {
      gpuEndpoint = `http://${gpuEndpoint}`;
    }

    // Add port if specified, otherwise use default 8080
    const port = user.port && user.port.trim() !== '' ? user.port : '8080';
    gpuEndpoint = `${gpuEndpoint}:${port}`;
    
    // Make sure the endpoint starts with a slash if needed
    const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${gpuEndpoint}${formattedEndpoint}`;
  }
  // Fallback to the default API URL if no GPU endpoint is set
  return getApiUrl(endpoint);
};

export default function Index() {
  const [image, setImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [segments, setSegments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGameName, setNewGameName] = useState("");
  const [shelf, setShelf] = useState("");
  const [case_, setCase] = useState("");
  const { addToCollection } = useCollection();
  const { isAuthenticated, user, authFetch } = useAuth();
  
  // Create refs for scrolling
  const scrollViewRef = useRef(null);
  const segmentContainerRef = useRef(null);

  // Auto-scroll to segments when they are loaded
  useEffect(() => {
    if (segments.length > 0 && !isLoading && scrollViewRef.current) {
      // Use setTimeout to ensure the segments are rendered before scrolling
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 300);
    }
  }, [segments, isLoading]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setSelectedFile(result.assets[0]);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return;
    setIsLoading(true);

    const formData = new FormData();
    const fileUri = selectedFile.uri;
    const uriParts = fileUri.split('.');
    const fileType = uriParts[uriParts.length - 1];

    const response = await fetch(fileUri);
    const blob = await response.blob();
    formData.append('file', blob, `photo.${fileType}`);

    try {
      // Use the helper function to get the GPU endpoint URL for the new process_image endpoint
      const processUrl = getGpuEndpointUrl(user, '/process_image');
      console.log('Using endpoint for processing:', processUrl);

      // Add the OpenAI API key to the headers if available
      const headers = {};
      if (user && user.openai_api_key) {
        headers['X-OpenAI-API-Key'] = user.openai_api_key;
      }

      // Upload and process the image in a single call
      const processResponse = await authFetch(processUrl, {
        method: 'POST',
        headers: headers,
        body: formData
      });
      
      if (!processResponse.ok) {
        throw new Error('Failed to process image');
      }
      
      const processData = await processResponse.json();
      console.log('Image processing successful:', processData);
      
      // Set the segments from the response
      if (processData.segments && processData.segments.length > 0) {
        setSegments(processData.segments);
        setCurrentSegmentIndex(0);
      } else {
        Alert.alert('No segments found', 'No text segments were detected in the image.');
        setSegments([]);
      }
      
    } catch (error) {
      console.error('Image processing failed:', error);
      Alert.alert('Error', 'Failed to process the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle discarding a segment
  const handleDiscardSegment = () => {
    if (!segments[currentSegmentIndex]) {
      console.warn('Attempted to discard invalid segment');
      return;
    }

    const newSegments = [...segments];
    newSegments.splice(currentSegmentIndex, 1);
    
    if (newSegments.length === 0) {
      // All segments have been processed, clear the state
      resetState();
    } else {
      // First update the segments array
      setSegments(newSegments);
      
      // Then in a separate state update, adjust the current index if needed
      // This ensures proper state synchronization
      if (currentSegmentIndex >= newSegments.length) {
        setCurrentSegmentIndex(Math.max(0, newSegments.length - 1));
      }
    }
    
    // Always close the modal when discarding
    setModalVisible(false);
  };

  const resetState = () => {
    setImage(null);
    setSelectedFile(null);
    setSegments([]);
    setCurrentSegmentIndex(0);
    setShelf("");
    setCase("");
    setModalVisible(false);
  };
  
  return (
    <ScrollView 
      style={globalStyles.scrollView}
      ref={scrollViewRef}
    >
      <View style={globalStyles.centeredContainer}>
        <View style={globalStyles.buttonContainer}>
          <TouchableOpacity 
            style={globalStyles.button} 
            onPress={pickImage}
          >
            <Ionicons name="image-outline" size={20} color={COLORS.text.primary} />
            <Text style={globalStyles.buttonText}>Pick an image</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[globalStyles.button, !selectedFile && globalStyles.disabledButton]} 
            onPress={uploadImage}
            disabled={!selectedFile}
          >
            <Ionicons name="cloud-upload-outline" size={20} color={COLORS.text.primary} />
            <Text style={globalStyles.buttonText}>Process Image</Text>
          </TouchableOpacity>

          {/* Reset button */}
          {(image || segments.length > 0) && (
            <TouchableOpacity 
              style={[globalStyles.button, { backgroundColor: COLORS.action.rejectBackground }]} 
              onPress={() => {
                // Confirm before clearing
                if (confirm('Are you sure you want to clear all data? This will remove the current image and all segments.')) {
                  resetState();
                }
              }}
            >
              <Ionicons name="trash-outline" size={20} color={COLORS.text.primary} />
              <Text style={globalStyles.buttonText}>Clear Selection</Text>
            </TouchableOpacity>
          )}
        </View>

        {image && (
          <View style={globalStyles.imageContainer}>
            <Text style={globalStyles.title}>Initial Image</Text>
            {/* Shelf and Case input fields */}
            <View style={{ width: '100%', marginTop: SPACING.sm, zIndex: 2 }}>
              <Text style={[globalStyles.subtitle, { textAlign: 'center', marginBottom: SPACING.sm }]}>Location Information</Text>
              <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={[globalStyles.text, { textAlign: 'center', marginBottom: 5 }]}>Shelf</Text>
                  <TextInput
                    style={{
                      height: 40,
                      width: '100%',
                      borderColor: COLORS.border,
                      borderWidth: 1,
                      borderRadius: 5,
                      marginTop: 5,
                      paddingHorizontal: 10,
                      color: COLORS.text.primary,
                      backgroundColor: COLORS.background.input,
                      zIndex: 3 // Higher z-index to ensure it's clickable
                    }}
                    placeholder="Enter shelf number"
                    placeholderTextColor={COLORS.text.secondary}
                    value={shelf}
                    onChangeText={setShelf}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[globalStyles.text, { textAlign: 'center', marginBottom: 5 }]}>Case</Text>
                  <TextInput
                    style={{
                      height: 40,
                      width: '100%',
                      borderColor: COLORS.border,
                      borderWidth: 1,
                      borderRadius: 5,
                      marginTop: 5,
                      paddingHorizontal: 10,
                      color: COLORS.text.primary,
                      backgroundColor: COLORS.background.input,
                      zIndex: 3 // Higher z-index to ensure it's clickable
                    }}
                    placeholder="Enter case number"
                    placeholderTextColor={COLORS.text.secondary}
                    value={case_}
                    onChangeText={setCase}
                  />
                </View>
              </View>
            </View>
            <Image 
              source={{ uri: image }} 
              style={[globalStyles.image, { marginTop: 0, zIndex: 1 }]} // Removed negative margin and set lower z-index
              resizeMode="contain"
            />
          </View>
        )}

        {/* Segments display */}
        {!isLoading && segments && segments.length > 0 && (
          <View 
            style={globalStyles.singleSegmentContainer}
            ref={segmentContainerRef}
          >
            <View style={globalStyles.navigationInfo}>
              <Text style={globalStyles.navigationText}>
                Segment {currentSegmentIndex + 1} of {segments.length}
              </Text>
            </View>

            <View style={globalStyles.mainPageSegmentCard}>
              <Text style={globalStyles.segmentTitle}>
                Game: {segments[currentSegmentIndex].name || "Unknown Game"}
              </Text>
              <Image 
                source={{ uri: segments[currentSegmentIndex].image }} 
                style={globalStyles.segmentImage}
                resizeMode="contain"
              />
              
              <View style={globalStyles.segmentActions}>
                <View style={globalStyles.centerActions}>
                  <TouchableOpacity 
                    style={[globalStyles.actionButton, globalStyles.rejectButton]}
                    onPress={() => {
                      if (segments[currentSegmentIndex]) {
                        // Set the initial value for the rename input
                        setNewGameName(segments[currentSegmentIndex].name || "Unknown Game");
                        // Show the modal
                        setModalVisible(true);
                      }
                    }}
                  >
                    <Ionicons name="close" size={24} color={COLORS.action.reject} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[globalStyles.actionButton, globalStyles.approveButton]}
                    onPress={async () => {
                      try {
                        console.log('Adding segment to collection:', {
                          id: segments[currentSegmentIndex].id,
                          index: currentSegmentIndex
                        });
                        
                        // Ensure we have a valid image format
                        let segmentImage = segments[currentSegmentIndex].image;
                        if (!segmentImage.startsWith('data:')) {
                          segmentImage = `data:image/png;base64,${segmentImage}`;
                        }
                        
                        // Add to collection with proper formatting and game name
                        await addToCollection({
                          id: `${segments[currentSegmentIndex].id || Date.now()}-${currentSegmentIndex}`,
                          image: segmentImage,
                          name: segments[currentSegmentIndex].name || "Unknown Game",
                          shelf: shelf,
                          case: case_,
                          metadata: {
                            originalImageId: String(segments[currentSegmentIndex].id), // Convert to string
                            segmentIndex: currentSegmentIndex
                          }
                        });
                        
                        // Remove the current segment and adjust the remaining segments
                        const newSegments = [...segments];
                        newSegments.splice(currentSegmentIndex, 1);
                        
                        // Check if this was the last segment
                        if (newSegments.length === 0) {
                          // All segments have been processed, clear the state
                          resetState();
                        } else {
                          setSegments(newSegments);
                          
                          // Adjust current index if needed
                          if (currentSegmentIndex >= newSegments.length) {
                            setCurrentSegmentIndex(Math.max(0, newSegments.length - 1));
                          }
                        }
                      } catch (error) {
                        console.error('Failed to add segment to collection:', error);
                        Alert.alert('Error', `Failed to add segment to collection: ${error.message}`);
                      }
                    }}
                  >
                    <Ionicons name="checkmark" size={24} color={COLORS.action.approve} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Fixed position loading indicator */}
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 10
        }}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{
            color: COLORS.text.primary,
            marginTop: SPACING.md,
            fontSize: 16,
            fontWeight: 'bold'
          }}>
            Processing Image...
          </Text>
        </View>
      )}

      {/* Image Evaluation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.7)'
        }}>
          <View style={{
            width: '25%', // Much narrower width
            backgroundColor: COLORS.background.card,
            borderRadius: 10,
            padding: 10, // Even smaller padding
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5
          }}>
            {/* Game name at the top */}
            <Text style={{
              fontSize: 15, // Smaller font
              fontWeight: 'bold',
              marginBottom: 8, // Smaller margin
              color: COLORS.text.primary,
              textAlign: 'center'
            }}>
              {segments[currentSegmentIndex]?.name || "Unknown Game"}
            </Text>
            
            {/* Show the image in the modal */}
            <Image 
              source={{ uri: segments[currentSegmentIndex]?.image }} 
              style={{
                width: '100%',
                height: 120, // Fixed height
                marginBottom: 8,
                borderRadius: 5
              }}
              resizeMode="contain"
            />
            
            {/* Game name input field */}
            <TextInput
              style={{
                height: 36,
                width: '100%',
                borderColor: COLORS.border,
                borderWidth: 1,
                borderRadius: 5,
                marginBottom: 8,
                paddingHorizontal: 8,
                color: COLORS.text.primary,
                backgroundColor: COLORS.background.input,
                fontSize: 14
              }}
              placeholder="Enter game name"
              placeholderTextColor={COLORS.text.secondary}
              value={newGameName}
              onChangeText={setNewGameName}
            />
            
            {/* Evaluation buttons */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'center',
              width: '100%',
              marginBottom: 8
            }}>
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.action.rejectBackground,
                  borderRadius: 5,
                  padding: 8,
                  elevation: 2,
                  flex: 1,
                  marginRight: 4,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={handleDiscardSegment}
              >
                <Ionicons name="close" size={16} color={COLORS.action.reject} style={{ marginRight: 4 }} />
                <Text style={{
                  color: COLORS.text.primary,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: 13
                }}>
                  Reject
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.action.approveBackground,
                  borderRadius: 5,
                  padding: 8,
                  elevation: 2,
                  flex: 1,
                  marginLeft: 4,
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={async () => {
                  try {
                    // Ensure we have a valid image format
                    let segmentImage = segments[currentSegmentIndex].image;
                    if (!segmentImage.startsWith('data:')) {
                      segmentImage = `data:image/png;base64,${segmentImage}`;
                    }
                    
                    // Add to collection with proper formatting and game name
                    await addToCollection({
                      id: `${segments[currentSegmentIndex].id || Date.now()}-${currentSegmentIndex}`,
                      image: segmentImage,
                      name: newGameName || "Unknown Game", // Use the potentially renamed game
                      shelf: shelf,
                      case: case_,
                      metadata: {
                        originalImageId: String(segments[currentSegmentIndex].id),
                        segmentIndex: currentSegmentIndex
                      }
                    });
                    
                    // Remove the current segment and adjust the remaining segments
                    const newSegments = [...segments];
                    newSegments.splice(currentSegmentIndex, 1);
                    
                    if (newSegments.length === 0) {
                      // All segments have been processed, clear the state
                      resetState();
                    } else {
                      setSegments(newSegments);
                      
                      // Adjust current index if needed
                      if (currentSegmentIndex >= newSegments.length) {
                        setCurrentSegmentIndex(Math.max(0, newSegments.length - 1));
                      }
                    }
                    
                    setModalVisible(false);
                  } catch (error) {
                    console.error('Failed to add segment to collection:', error);
                    Alert.alert('Error', `Failed to add segment to collection: ${error.message}`);
                    setModalVisible(false);
                  }
                }}
              >
                <Ionicons name="checkmark" size={16} color={COLORS.action.approve} style={{ marginRight: 4 }} />
                <Text style={{
                  color: COLORS.text.primary,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  fontSize: 13
                }}>
                  Accept
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
