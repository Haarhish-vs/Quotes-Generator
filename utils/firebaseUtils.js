import { db } from '../config/firebase';
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import * as Device from 'expo-device';

// Get a device ID for anonymous user identification (no login required)
export const getDeviceId = async () => {
  return Device.deviceName || Device.modelName || 'anonymous-device';
};

// Get all quotes
export const fetchQuotes = async () => {
  try {
    const quotesCollection = collection(db, 'quotes');
    const quotesSnapshot = await getDocs(quotesCollection);
    return quotesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return [];
  }
};

// Get quotes by category
export const fetchQuotesByCategory = async (category) => {
  try {
    const quotesRef = collection(db, 'quotes');
    const q = query(quotesRef, where("category", "==", category));
    const quotesSnapshot = await getDocs(q);
    return quotesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching quotes by category:", error);
    return [];
  }
};

// Search quotes by text or author
export const searchQuotes = async (searchTerm) => {
  try {
    // Note: Firestore doesn't support direct text search
    // This is a simplified approach - in production, consider using Algolia or similar
    const quotesRef = collection(db, 'quotes');
    const quotesSnapshot = await getDocs(quotesRef);
    const allQuotes = quotesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Manual search in the retrieved data
    return allQuotes.filter(quote => 
      quote.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
      quote.author.toLowerCase().includes(searchTerm.toLowerCase())
    );
  } catch (error) {
    console.error("Error searching quotes:", error);
    return [];
  }
};

// Get user's favorite quotes
export const fetchFavorites = async () => {
  try {
    const deviceId = await getDeviceId();
    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where("deviceId", "==", deviceId));
    const favoritesSnapshot = await getDocs(q);
    return favoritesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return [];
  }
};

// Subscribe to real-time updates for favorites
export const subscribeFavorites = (deviceId, callback) => {
  try {
    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where("deviceId", "==", deviceId));
    
    // Return the unsubscribe function
    return onSnapshot(q, (snapshot) => {
      const favorites = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(favorites);
    }, (error) => {
      console.error("Error in favorites subscription:", error);
      callback([]);
    });
  } catch (error) {
    console.error("Error setting up favorites subscription:", error);
    callback([]);
    return () => {}; // Empty unsubscribe function as fallback
  }
};

// Add a quote to favorites
export const addToFavorites = async (quote) => {
  try {
    const deviceId = await getDeviceId();
    const favoritesRef = collection(db, 'favorites');
    await addDoc(favoritesRef, {
      quoteId: quote.id,
      text: quote.text,
      author: quote.author,
      category: quote.category,
      deviceId,
      timestamp: new Date()
    });
    return true;
  } catch (error) {
    console.error("Error adding to favorites:", error);
    return false;
  }
};

// Remove a quote from favorites
export const removeFromFavorites = async (favoriteId) => {
  try {
    const docRef = doc(db, 'favorites', favoriteId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error removing from favorites:", error);
    return false;
  }
};

// Add a new quote
export const addQuote = async (quoteData) => {
  try {
    const deviceId = await getDeviceId();
    const quotesRef = collection(db, 'quotes');
    const newQuote = {
      ...quoteData,
      createdBy: deviceId,
      createdAt: new Date()
    };
    const docRef = await addDoc(quotesRef, newQuote);
    return {
      id: docRef.id,
      ...newQuote
    };
  } catch (error) {
    console.error("Error adding quote:", error);
    return null;
  }
};

// Get all categories
export const fetchCategories = async () => {
  try {
    const categoriesRef = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesRef);
    return categoriesSnapshot.docs.map(doc => doc.data().name);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
};

// Update usage statistics
export const updateUsageStats = async () => {
  try {
    const deviceId = await getDeviceId();
    
    // Check if stats document exists for this device
    const statsRef = collection(db, 'usageStats');
    const q = query(statsRef, where("deviceId", "==", deviceId));
    const statsSnapshot = await getDocs(q);
    
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (statsSnapshot.empty) {
      // Create new stats document
      await addDoc(statsRef, {
        deviceId,
        totalUsage: 1,
        streak: 1,
        lastUsed: today,
        firstUsed: today
      });
    } else {
      // Update existing stats
      const statDoc = statsSnapshot.docs[0];
      const statData = statDoc.data();
      const lastUsed = statData.lastUsed;
      
      // Calculate streak
      let streak = statData.streak || 0;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toISOString().split('T')[0];
      
      if (lastUsed === yesterdayString) {
        // Used yesterday, increment streak
        streak += 1;
      } else if (lastUsed !== today) {
        // Not used yesterday or today yet, reset streak
        streak = 1;
      }
      
      await updateDoc(doc(db, 'usageStats', statDoc.id), {
        totalUsage: (statData.totalUsage || 0) + 1,
        streak,
        lastUsed: today
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating usage stats:", error);
    return false;
  }
};
