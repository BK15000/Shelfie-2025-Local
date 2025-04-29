import { useState, useEffect } from "react";
import { Text, View, Image, TouchableOpacity, ScrollView, TextInput, Modal, Alert } from "react-native";
import { useCollection } from "../utils/collectionContext";
import { useAuth } from "../utils/authContext";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, TYPOGRAPHY } from "../utils/theme";
import globalStyles from "../utils/styles";
import { router } from "expo-router";
import * as Linking from 'expo-linking';
import * as ImagePicker from 'expo-image-picker';

export default function Collection() {
  const { collection, removeFromCollection, updateCollectionItem, addToCollection } = useCollection();
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'single'
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRenameModalVisible, setIsRenameModalVisible] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [addModalShelf, setAddModalShelf] = useState('');
  const [addModalCase, setAddModalCase] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [lastRenamedId, setLastRenamedId] = useState(null);
  
  // Filter collection by search query
  const filteredCollection = searchQuery 
    ? collection.filter(item => 
        (item.game_name || "Unknown Game")
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : collection;
  
  // Sort collection by shelf, case, and game_name
  const sortedCollection = [...filteredCollection].sort((a, b) => {
    // Helper function to extract numeric value or return Infinity for non-numeric strings
    const getNumericValue = (str) => {
      const num = parseInt(str, 10);
      return isNaN(num) ? Infinity : num;
    };

    // First sort by shelf numerically
    const shelfA = getNumericValue(a.shelf);
    const shelfB = getNumericValue(b.shelf);
    
    if (shelfA !== shelfB) {
      return shelfA - shelfB;
    }
    
    // If shelves are equal but one is Infinity (non-numeric), sort alphabetically
    if (shelfA === Infinity) {
      return (a.shelf || "").localeCompare(b.shelf || "");
    }
    
    // Then sort by case numerically
    const caseA = getNumericValue(a.case);
    const caseB = getNumericValue(b.case);
    
    if (caseA !== caseB) {
      return caseA - caseB;
    }
    
    // If cases are equal but one is Infinity (non-numeric), sort alphabetically
    if (caseA === Infinity) {
      return (a.case || "").localeCompare(b.case || "");
    }
    
    // Finally sort by game name alphabetically
    return (a.game_name || "Unknown Game").toLowerCase()
      .localeCompare((b.game_name || "Unknown Game").toLowerCase());
  });

  // Effect to update selected index when collection changes
  useEffect(() => {
    if (lastRenamedId) {
      // Wait for the next render cycle to ensure collection is updated
      setTimeout(() => {
        const newIndex = sortedCollection.findIndex(item => item.id === lastRenamedId);
        if (newIndex !== -1) {
          setSelectedIndex(newIndex);
          setLastRenamedId(null);
        }
      }, 0);
    }
  }, [collection, lastRenamedId, sortedCollection]);

  // If collection is empty
  if (collection.length === 0) {
    return (
      <View style={globalStyles.emptyContainer}>
        <Ionicons name="albums-outline" size={64} color={COLORS.text.secondary} />
        <Text style={globalStyles.emptyText}>Your collection is empty</Text>
        <Text style={globalStyles.emptySubtext}>
          Add segments by selecting the check mark on the home screen
        </Text>
      </View>
    );
  }

  if (viewMode === 'single') {
    const currentSegment = sortedCollection[selectedIndex];
    
    // Debug: Log the current segment's game_id
    console.log('Current segment:', currentSegment);
    console.log('Game ID:', currentSegment.game_id);
    console.log('Game ID type:', typeof currentSegment.game_id);
    
    return (
      <View style={[globalStyles.container, { alignItems: 'center' }]}>
        <View style={[globalStyles.navigationInfo, { width: '100%' }]}>
          <TouchableOpacity
            style={globalStyles.button}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons name="grid-outline" size={20} color={COLORS.text.primary} />
            <Text style={globalStyles.buttonText}>Grid View</Text>
          </TouchableOpacity>
          <Text style={globalStyles.navigationText}>
            Segment {selectedIndex + 1} of {sortedCollection.length}
          </Text>
        </View>

        {/* Game name and location displayed above the card */}
        <View style={{ marginBottom: SPACING.md, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
            {isRenameModalVisible ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={{
                    backgroundColor: COLORS.background.input,
                    padding: SPACING.md,
                    borderRadius: 8,
                    color: COLORS.text.primary,
                    minHeight: 44,
                    fontSize: TYPOGRAPHY.fontSizes.md,
                    marginRight: SPACING.sm,
                    minWidth: 200,
                  }}
                  value={newGameName}
                  onChangeText={setNewGameName}
                  autoFocus={true}
                />
                <TouchableOpacity
                  onPress={async () => {
                    try {
                      await updateCollectionItem(currentSegment.id, { game_name: newGameName });
                      setLastRenamedId(currentSegment.id);
                      setIsRenameModalVisible(false);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to rename game. Please try again.');
                    }
                  }}
                  style={{
                    padding: SPACING.xs,
                    backgroundColor: COLORS.primary,
                    borderRadius: 8,
                    marginRight: SPACING.xs,
                  }}
                >
                  <Ionicons name="checkmark" size={20} color={COLORS.text.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsRenameModalVisible(false);
                    setNewGameName(currentSegment.game_name || "");
                  }}
                  style={{
                    padding: SPACING.xs,
                    backgroundColor: COLORS.background.primary,
                    borderRadius: 8,
                  }}
                >
                  <Ionicons name="close" size={20} color={COLORS.text.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={[globalStyles.title, { textAlign: 'center', marginRight: SPACING.sm }]}>
                  {currentSegment.game_name || "Unknown Game"}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setNewGameName(currentSegment.game_name || "");
                    setIsRenameModalVisible(true);
                  }}
                  style={{
                    padding: SPACING.xs,
                    backgroundColor: COLORS.background.primary,
                    borderRadius: 8,
                  }}
                >
                  <Ionicons name="pencil" size={20} color={COLORS.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: SPACING.md }}>
            <Text style={[globalStyles.subtitle, { color: COLORS.text.secondary }]}>
              Shelf: {currentSegment.shelf || "Unassigned"}
            </Text>
            <Text style={[globalStyles.subtitle, { color: COLORS.text.secondary }]}>
              Case: {currentSegment.case || "Unassigned"}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[globalStyles.largeSegmentCard, { height: 500, width: '100%' }]}
          onPress={() => {
            // Only redirect if game_id is not -1, null, or undefined
            if (currentSegment.game_id && 
                currentSegment.game_id !== "-1" && 
                currentSegment.game_id !== "null" && 
                currentSegment.game_id !== "undefined") {
              // Open BoardGameGeek website with the game ID
              const url = `https://boardgamegeek.com/boardgame/${currentSegment.game_id}`;
              console.log('Opening URL:', url);
              
              // Check if running on web platform
              if (typeof window !== 'undefined' && window.open) {
                // For web, use window.open to open in a new tab
                window.open(url, '_blank');
              } else {
                // For native platforms, use Expo's Linking API
                Linking.openURL(url).catch(err => {
                  console.error('Failed to open URL:', err);
                });
              }
            } else {
              console.log('Not redirecting, invalid game_id:', currentSegment.game_id);
            }
          }}
        >
          <Image
            source={{ uri: currentSegment.image }}
            style={[globalStyles.largeSegmentImage, { width: '100%' }]}
            resizeMode="contain"
          />
          
          {/* Show info icon only if the game has a valid BoardGameGeek ID */}
          {currentSegment.game_id && 
           currentSegment.game_id !== "-1" && 
           currentSegment.game_id !== "null" && 
           currentSegment.game_id !== "undefined" && (
            <View style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              backgroundColor: 'rgba(0,0,0,0.6)',
              borderRadius: 20,
              padding: 8,
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
              <Text style={{ color: COLORS.text.primary, marginLeft: 5, fontSize: 12 }}>
                Tap for details
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={globalStyles.navigationControls}>
          <TouchableOpacity
            style={[globalStyles.navButton, selectedIndex === 0 && globalStyles.disabledButton]}
            onPress={() => setSelectedIndex(prev => Math.max(0, prev - 1))}
            disabled={selectedIndex === 0}
          >
            <Ionicons
              name="chevron-back"
              size={24}
              color={selectedIndex === 0 ? COLORS.text.disabled : COLORS.primary}
            />
          </TouchableOpacity>

            <TouchableOpacity
              style={[globalStyles.actionButton, globalStyles.rejectButton]}
              onPress={async () => {
                try {
                  await removeFromCollection(currentSegment.id);
                  if (selectedIndex >= sortedCollection.length - 1) {
                    setSelectedIndex(Math.max(0, sortedCollection.length - 2));
                  }
                } catch (error) {
                  console.error('Failed to remove item from collection:', error);
                  alert('Failed to remove item from collection. Please try again.');
                }
              }}
          >
            <Ionicons name="trash-outline" size={24} color={COLORS.action.reject} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              globalStyles.navButton,
              selectedIndex === sortedCollection.length - 1 && globalStyles.disabledButton,
            ]}
            onPress={() => setSelectedIndex(prev => Math.min(sortedCollection.length - 1, prev + 1))}
            disabled={selectedIndex === sortedCollection.length - 1}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={selectedIndex === sortedCollection.length - 1 ? COLORS.text.disabled : COLORS.primary}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.scrollView}>
      <View style={globalStyles.container}>
        <View style={[globalStyles.navigationInfo, { marginBottom: SPACING.lg }]}>
          <TouchableOpacity
            style={globalStyles.button}
            onPress={() => {
              setViewMode('single');
              setSelectedIndex(0);
              setIsRenameModalVisible(false);
            }}
          >
            <Ionicons name="expand-outline" size={20} color={COLORS.text.primary} />
            <Text style={globalStyles.buttonText}>Single View</Text>
          </TouchableOpacity>
          
          {/* Search input */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            width: '100%',
            marginTop: SPACING.md,
            backgroundColor: COLORS.background.input || COLORS.background.elevated,
            borderRadius: 8,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: COLORS.border
          }}>
            <Ionicons name="search" size={20} color={COLORS.text.secondary} style={{ marginRight: 8 }} />
            <TextInput
              style={{
                flex: 1,
                height: 40,
                color: COLORS.text.primary,
                fontSize: TYPOGRAPHY.fontSizes.md
              }}
              placeholder="Search by game name"
              placeholderTextColor={COLORS.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={COLORS.text.secondary} />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        {/* Group items by shelf */}
        {(() => {
          // Get unique shelves
          const shelves = [...new Set(sortedCollection.map(item => item.shelf || "Unassigned"))];
          
          return shelves.map(shelf => {
            // Get items for this shelf
            const shelfItems = sortedCollection.filter(item => (item.shelf || "Unassigned") === shelf);
            
            return (
              <View key={shelf} style={{ width: '100%', marginBottom: SPACING.xl }}>
                {/* Shelf header */}
                <Text style={{
                  fontSize: TYPOGRAPHY.fontSizes.xl,
                  fontWeight: TYPOGRAPHY.fontWeights.bold,
                  color: COLORS.text.primary,
                  marginBottom: SPACING.sm,
                  paddingHorizontal: SPACING.md,
                  borderBottomWidth: 1,
                  borderBottomColor: COLORS.border,
                  paddingBottom: SPACING.xs
                }}>
                  Shelf: {shelf}
                </Text>
                
                {/* Group items by case within this shelf */}
                {(() => {
                  // Get unique cases for this shelf and sort them numerically
                  const cases = [...new Set(shelfItems.map(item => item.case || "Unassigned"))]
                    .sort((a, b) => {
                      const numA = parseInt(a, 10);
                      const numB = parseInt(b, 10);
                      if (!isNaN(numA) && !isNaN(numB)) {
                        return numA - numB;
                      }
                      if (!isNaN(numA)) return -1;
                      if (!isNaN(numB)) return 1;
                      return a.localeCompare(b);
                    });
                  
                  return cases.map(caseId => {
                    // Get items for this case and sort by game name
                    const caseItems = shelfItems
                      .filter(item => (item.case || "Unassigned") === caseId)
                      .sort((a, b) => {
                        const nameA = (a.game_name || "Unknown Game").toLowerCase();
                        const nameB = (b.game_name || "Unknown Game").toLowerCase();
                        return nameA.localeCompare(nameB);
                      });
                    
                    return (
                      <View key={`${shelf}-${caseId}`} style={{ width: '100%', marginBottom: SPACING.md }}>
                        {/* Case header with count and add button */}
                        <View style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: SPACING.sm,
                          paddingHorizontal: SPACING.md,
                          paddingLeft: SPACING.lg // Indent case headers
                        }}>
                          <TouchableOpacity
                            onPress={() => {
                              setAddModalShelf(shelf);
                              setAddModalCase(caseId);
                              setIsAddModalVisible(true);
                            }}
                            style={{
                              padding: SPACING.xs,
                              backgroundColor: COLORS.background.primary,
                              borderRadius: 8,
                              marginRight: SPACING.sm,
                            }}
                          >
                            <Ionicons name="add" size={20} color={COLORS.primary} />
                          </TouchableOpacity>
                          <Text style={{
                            fontSize: TYPOGRAPHY.fontSizes.lg,
                            fontWeight: TYPOGRAPHY.fontWeights.medium,
                            color: COLORS.text.primary,
                          }}>
                            Case: {caseId}
                          </Text>
                          <View style={{
                            backgroundColor: COLORS.background.primary,
                            borderRadius: 12,
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            marginLeft: SPACING.sm
                          }}>
                            <Text style={{
                              fontSize: TYPOGRAPHY.fontSizes.sm,
                              color: COLORS.text.secondary,
                              fontWeight: TYPOGRAPHY.fontWeights.medium
                            }}>
                              {caseItems.length} {caseItems.length === 1 ? 'game' : 'games'}
                            </Text>
                          </View>
                        </View>
                        
                        {/* Items in this case */}
                        <View style={[globalStyles.gridContainer, { alignItems: 'center', justifyContent: 'center' }]}>
                          {caseItems.map((segment, index) => {
                            // Find the global index for this segment
                            const globalIndex = sortedCollection.findIndex(item => item.id === segment.id);
                            
                            return (
                              <TouchableOpacity
                                key={segment.id}
                                style={globalStyles.gridCard}
                                onPress={() => {
                                  setSelectedIndex(globalIndex);
                                  setViewMode('single');
                                }}
                              >
                                {/* Fixed-height title bar at the top */}
                                <Text 
                                  style={globalStyles.segmentTitle}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {segment.game_name || "Unknown Game"}
                                </Text>
                                
                                {/* Image takes up the rest of the space */}
                                <Image
                                  source={{ uri: segment.image }}
                                  style={globalStyles.gridImage}
                                  resizeMode="contain"
                                />
                                
                                {/* Delete button in the top-right corner */}
                                <TouchableOpacity
                                  style={[globalStyles.actionButton, globalStyles.rejectButton, { position: 'absolute', top: 5, right: 5, zIndex: 2 }]}
                                  onPress={async (e) => {
                                    e.stopPropagation();
                                    try {
                                      await removeFromCollection(segment.id);
                                    } catch (error) {
                                      console.error('Failed to remove item from collection:', error);
                                      alert('Failed to remove item from collection. Please try again.');
                                    }
                                  }}
                                >
                                  <Ionicons name="close" size={16} color={COLORS.action.reject} />
                                </TouchableOpacity>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>
                    );
                  });
                })()}
              </View>
            );
          });
        })()}
      </View>

      {/* Add Game Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}>
          <View style={{
            backgroundColor: COLORS.background.primary,
            padding: SPACING.xl,
            borderRadius: 12,
            width: '90%',
            maxWidth: 400,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          }}>
            <View style={{
              backgroundColor: COLORS.background.elevated,
              padding: SPACING.lg,
              borderRadius: 8,
              marginBottom: SPACING.md,
            }}>
              <Text style={[globalStyles.title, { marginBottom: SPACING.lg }]}>Add New Game</Text>
              
              <TouchableOpacity
              onPress={async () => {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 1,
                });

                if (!result.canceled) {
                  const response = await fetch(result.assets[0].uri);
                  const blob = await response.blob();
                  const base64 = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      const base64data = reader.result;
                      resolve(base64data.split(',')[1]);
                    };
                    reader.readAsDataURL(blob);
                  });
                  setSelectedImage({
                    uri: result.assets[0].uri,
                    base64: base64
                  });
                }
              }}
              style={{
                backgroundColor: COLORS.background.primary,
                padding: SPACING.md,
                borderRadius: 8,
                alignItems: 'center',
                marginBottom: SPACING.md,
              }}
            >
              <Ionicons name="image" size={24} color={COLORS.primary} />
              <Text style={{ color: COLORS.text.primary, marginTop: SPACING.xs }}>
                {selectedImage ? 'Change Image' : 'Select Image'}
              </Text>
            </TouchableOpacity>

            {selectedImage && (
              <Image
                source={{ uri: selectedImage.uri }}
                style={{
                  width: '100%',
                  height: 200,
                  borderRadius: 8,
                  marginBottom: SPACING.md,
                }}
                resizeMode="contain"
              />
            )}

            <TextInput
              style={{
                backgroundColor: COLORS.background.input,
                padding: SPACING.md,
                borderRadius: 8,
                color: COLORS.text.primary,
                marginBottom: SPACING.md,
                minHeight: 44,
                fontSize: TYPOGRAPHY.fontSizes.md,
              }}
              value={newGameName}
              onChangeText={setNewGameName}
              placeholder="Enter game name"
              placeholderTextColor={COLORS.text.secondary}
            />

            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm }}>
              <TouchableOpacity
                onPress={() => {
                  setIsAddModalVisible(false);
                  setSelectedImage(null);
                  setNewGameName('');
                }}
                style={{
                  padding: SPACING.sm,
                  borderRadius: 8,
                  backgroundColor: COLORS.background.primary,
                }}
              >
                <Text style={{ color: COLORS.text.primary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  if (!selectedImage || !newGameName.trim()) {
                    Alert.alert('Error', 'Please select an image and enter a name.');
                    return;
                  }

                  try {
                    await addToCollection({
                      image: `data:image/jpeg;base64,${selectedImage.base64}`,
                      name: newGameName,
                      shelf: addModalShelf,
                      case: addModalCase,
                    });
                    setIsAddModalVisible(false);
                    setSelectedImage(null);
                    setNewGameName('');
                  } catch (error) {
                    Alert.alert('Error', 'Failed to add game. Please try again.');
                  }
                }}
                style={{
                  padding: SPACING.sm,
                  borderRadius: 8,
                  backgroundColor: COLORS.primary,
                }}
              >
                <Text style={{ color: COLORS.text.primary }}>Add</Text>
              </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
