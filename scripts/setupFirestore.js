import { db } from '../config/firebase';
import { 
  collection, 
  addDoc,
  getDocs,
  query,
  writeBatch,
  doc
} from 'firebase/firestore';
import { sampleQuotes } from '../data/sampleQuotes';

// Quietly check and setup Firestore if needed
export const checkAndSetupFirestore = async () => {
  try {
    // Check if collections exist
    const quotesCollection = collection(db, 'quotes');
    const quotesSnapshot = await getDocs(quotesCollection);
    
    if (quotesSnapshot.empty) {
      console.log("Quotes collection is empty, setting up database...");
      
      // 1. Add categories
      const categories = getUniqueCategories();
      const categoriesCollection = collection(db, 'categories');
      
      for (const category of categories) {
        await addDoc(categoriesCollection, { name: category });
      }
      console.log("Added categories");
      
      // 2. Add a subset of sample quotes (to keep it fast)
      const quoteSubset = sampleQuotes.slice(0, 50); // Add first 50 quotes
      
      // Add in batches of 10
      const BATCH_SIZE = 10;
      for (let i = 0; i < quoteSubset.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchQuotes = quoteSubset.slice(i, i + BATCH_SIZE);
        
        for (const quote of batchQuotes) {
          const quoteRef = doc(collection(db, 'quotes'));
          batch.set(quoteRef, {
            text: quote.text,
            author: quote.author,
            category: quote.category || 'Uncategorized'
          });
        }
        
        await batch.commit();
      }
      
      console.log(`Added initial set of quotes to Firestore`);
      return true;
    } else {
      console.log("Quotes collection already populated");
      return true;
    }
  } catch (error) {
    console.error("Error setting up Firestore:", error);
    return false;
  }
};

// Get all categories from sample quotes
const getUniqueCategories = () => {
  const categoriesSet = new Set();
  sampleQuotes.forEach(quote => {
    if (quote.category) {
      categoriesSet.add(quote.category);
    } else {
      categoriesSet.add('Uncategorized');
    }
  });
  return Array.from(categoriesSet);
};

// Setup all collections for production
const setupFirestore = async () => {
  console.log("🔥 Starting Firestore setup...");
  
  try {
    // 1. Create categories collection
    console.log("Creating categories collection...");
    const categories = getUniqueCategories();
    const categoriesCollection = collection(db, 'categories');
    
    // Check if categories already exist
    const categoriesSnapshot = await getDocs(categoriesCollection);
    if (categoriesSnapshot.empty) {
      for (const category of categories) {
        await addDoc(categoriesCollection, { name: category });
        console.log(`✅ Added category: ${category}`);
      }
    } else {
      console.log("Categories collection already exists, skipping...");
    }
    
    // 2. Create quotes collection with sample data
    console.log("Creating quotes collection...");
    const quotesCollection = collection(db, 'quotes');
    const quotesSnapshot = await getDocs(quotesCollection);
    
    if (quotesSnapshot.empty) {
      // Use batched writes for better performance
      const BATCH_SIZE = 20; // Firestore limit is 500, but we'll use smaller batches
      
      for (let i = 0; i < sampleQuotes.length; i += BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchQuotes = sampleQuotes.slice(i, i + BATCH_SIZE);
        
        for (const quote of batchQuotes) {
          const quoteRef = doc(collection(db, 'quotes'));
          batch.set(quoteRef, {
            text: quote.text,
            author: quote.author,
            category: quote.category || 'Uncategorized'
          });
        }
        
        await batch.commit();
        console.log(`✅ Added quotes batch ${Math.floor(i/BATCH_SIZE) + 1}`);
      }
      
      console.log(`✅ Successfully added ${sampleQuotes.length} quotes to Firestore`);
    } else {
      console.log("Quotes collection already exists, skipping...");
    }
    
    // 3. Create empty favorites collection structure (actual favorites will be added by users)
    console.log("Ensuring favorites collection exists...");
    const favoritesCollection = collection(db, 'favorites');
    
    // 4. Create usageStats collection structure
    console.log("Ensuring usageStats collection exists...");
    const usageStatsCollection = collection(db, 'usageStats');
    
    console.log("🎉 Firestore setup complete!");
    return true;
  } catch (error) {
    console.error("❌ Error setting up Firestore:", error);
    return false;
  }
};

export default setupFirestore;
