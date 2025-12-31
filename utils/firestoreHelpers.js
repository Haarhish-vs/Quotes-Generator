import { db } from '../config/firebase';
import { 
  collection, 
  addDoc,
  getDocs,
  query,
  where,
  writeBatch,
  doc
} from 'firebase/firestore';
import { sampleQuotes } from '../data/sampleQuotes';

// Get all categories from sample quotes
const getUniqueCategories = () => {
  const categoriesSet = new Set();
  sampleQuotes.forEach(quote => {
    if (quote.category) {
      categoriesSet.add(quote.category);
    }
  });
  return Array.from(categoriesSet);
};

// Populate the database with sample quotes
export const populateSampleData = async () => {
  try {
    // Check if quotes collection already has data
    const quotesCollection = collection(db, 'quotes');
    const quotesSnapshot = await getDocs(quotesCollection);
    
    if (!quotesSnapshot.empty) {
      console.log("Quotes collection already has data, skipping population");
      return true;
    }
    
    // Add sample quotes using batch write for better performance
    const batch = writeBatch(db);
    
    // Add quotes in batches of 20 to avoid hitting limits
    for (let i = 0; i < sampleQuotes.length; i += 20) {
      const batchQuotes = sampleQuotes.slice(i, i + 20);
      let currentBatch = writeBatch(db);
      
      for (const quote of batchQuotes) {
        const quoteRef = collection(db, 'quotes');
        const newDocRef = doc(quoteRef);
        currentBatch.set(newDocRef, {
          text: quote.text,
          author: quote.author,
          category: quote.category || 'Uncategorized'
        });
      }
      
      // Commit the batch
      await currentBatch.commit();
      console.log(`Added batch of quotes ${i + 1} to ${i + batchQuotes.length}`);
    }
    
    // Add categories
    const categories = getUniqueCategories();
    const categoriesCollection = collection(db, 'categories');
    const categoriesSnapshot = await getDocs(categoriesCollection);
    
    if (categoriesSnapshot.empty) {
      for (const category of categories) {
        await addDoc(categoriesCollection, { name: category });
      }
      console.log("Added categories");
    }
    
    return true;
  } catch (error) {
    console.error("Error populating sample data:", error);
    return false;
  }
};

// Check if a user has any favorites
export const hasUserFavorites = async (deviceId) => {
  try {
    const favoritesRef = collection(db, 'favorites');
    const q = query(favoritesRef, where("deviceId", "==", deviceId));
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking favorites:", error);
    return false;
  }
};

// Add custom error reporting function
export const logFirestoreError = (operation, error) => {
  // Log the error with additional context
  console.error(`Firestore ${operation} failed:`, error);
  
  // Check for specific error types and provide helpful messages
  if (error.code === 'permission-denied') {
    console.log("Security rules are preventing this operation. Check your Firestore rules.");
  } else if (error.code === 'unavailable') {
    console.log("Firebase is currently unavailable. Check your network connection.");
  } else if (error.code === 'resource-exhausted') {
    console.log("You've exceeded your Firebase quota. Check your billing status.");
  }
  
  // You could add analytics logging here too
  return {
    success: false,
    code: error.code || 'unknown',
    message: error.message || 'Unknown error occurred'
  };
};
