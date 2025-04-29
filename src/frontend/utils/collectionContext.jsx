import { createContext, useState, useEffect, useContext } from 'react';
import { getAuthUrl } from '../app/config';
import { useAuth } from './authContext';

// Create the context
const CollectionContext = createContext();

// Provider component
export const CollectionProvider = ({ children }) => {
  const [collection, setCollection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { authFetch, isAuthenticated } = useAuth();

  // Load collection from backend API on mount and when auth state changes
  useEffect(() => {
    const loadCollection = async () => {
      if (!isAuthenticated) {
        setCollection([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await authFetch(getAuthUrl('/collection/items'));
        
        if (!response.ok) {
          throw new Error('Failed to fetch collection');
        }
        
        const items = await response.json();
        
        console.log('Items from backend:', items);
        
        // First, get all the items without images
        const itemsWithoutImages = items.map(item => ({
          id: item.id,
          image: '',
          game_name: item.game_name,
          created_at: item.created_at,
          game_id: item.game_id,  // Include game_id from the backend response
          shelf: item.shelf,
          case: item.case
        }));
        
        // Then, fetch all the images in parallel
        const imagePromises = items.map(item => getItemImage(item.id));
        const images = await Promise.all(imagePromises);
        
        // Finally, combine the items with their images
        const transformedItems = itemsWithoutImages.map((item, index) => {
          console.log('Item from backend:', item);
          return {
            ...item,
            image: `data:image/jpeg;base64,${images[index]}`,
            game_id: item.game_id || "-1"  // Include game_id from the backend
          };
        });
        
        setCollection(transformedItems);
      } catch (error) {
        console.error('Failed to load collection from API:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCollection();
  }, [isAuthenticated]);

  // Helper function to get the base64 image for a collection item
  const getItemImage = async (itemId) => {
    try {
      const response = await authFetch(getAuthUrl(`/collection/items/${itemId}/image`));
      
      if (!response.ok) {
        throw new Error('Failed to fetch item image');
      }
      
      const data = await response.json();
      
      // Extract the base64 part from the data URL
      const base64Data = data.image_data.split(',')[1];
      return base64Data;
    } catch (error) {
      console.error(`Failed to get image for item ${itemId}:`, error);
      return '';
    }
  };

  // Add a segment to the collection
  const addToCollection = async (segment) => {
    if (!isAuthenticated) return;
    
    // Check if segment already exists in collection
    const exists = collection.some(item => item.id === segment.id);
    if (exists) return;
    
    try {
      // Extract the base64 data from the image URL
      let base64Data = segment.image;
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }
      
      console.log('Adding segment to collection with game_name:', 
        segment.metadata?.originalImageId || 'Board Game Segment');
      
      // Use the game name if available, otherwise use a default
      let gameName = segment.name || 'Board Game Segment';
      
      console.log('Sending to backend with game_name:', gameName, 'type:', typeof gameName);
      
      const response = await authFetch(getAuthUrl('/collection/items'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          game_name: gameName,
          image_data: base64Data,
          shelf: segment.shelf,
          case: segment.case
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', response.status, errorText);
        throw new Error(`Failed to add item to collection: ${response.status} ${errorText}`);
      }
      
      const newItem = await response.json();
      console.log('Successfully added item to collection:', newItem);
      
      // Add the new item to the collection state
      setCollection(prevCollection => [
        ...prevCollection, 
        {
          id: newItem.id,
          image: segment.image,
          game_name: newItem.game_name,
          created_at: newItem.created_at,
          game_id: newItem.game_id || "-1",  // Include game_id from the response
          shelf: newItem.shelf || segment.shelf,
          case: newItem.case || segment.case
        }
      ]);
    } catch (error) {
      console.error('Failed to add item to collection:', error);
      throw error; // Re-throw the error so it can be caught by the caller
    }
  };

  // Remove a segment from the collection
  const removeFromCollection = async (segmentId) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await authFetch(getAuthUrl(`/collection/items/${segmentId}`), {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove item from collection');
      }
      
      // Remove the item from the collection state
      setCollection(prevCollection => 
        prevCollection.filter(segment => segment.id !== segmentId)
      );
    } catch (error) {
      console.error('Failed to remove item from collection:', error);
    }
  };

  // Clear the entire collection
  const clearCollection = async () => {
    if (!isAuthenticated) return;
    
    try {
      // Delete each item individually
      const deletePromises = collection.map(item => 
        authFetch(getAuthUrl(`/collection/items/${item.id}`), {
          method: 'DELETE',
        })
      );
      
      await Promise.all(deletePromises);
      
      // Clear the collection state
      setCollection([]);
    } catch (error) {
      console.error('Failed to clear collection:', error);
    }
  };

  // Update a collection item
  const updateCollectionItem = async (itemId, updates) => {
    if (!isAuthenticated) return;
    
    try {
      const response = await authFetch(getAuthUrl(`/collection/items/${itemId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update item');
      }
      
      const updatedItem = await response.json();
      
      // Update the collection state
      setCollection(prevCollection => 
        prevCollection.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              ...updatedItem,
              image: updates.image_data || item.image, // Keep existing image if no new one provided
              game_id: updatedItem.game_id || "-1"
            };
          }
          return item;
        })
      );
    } catch (error) {
      console.error('Failed to update item:', error);
      throw error;
    }
  };

  return (
    <CollectionContext.Provider
      value={{
        collection,
        isLoading,
        addToCollection,
        removeFromCollection,
        clearCollection,
        updateCollectionItem
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
};

// Export CollectionProvider as default for routing
export default CollectionProvider;

// Custom hook to use the collection context
export const useCollection = () => {
  const context = useContext(CollectionContext);
  if (!context) {
    throw new Error('useCollection must be used within a CollectionProvider');
  }
  return context;
};
