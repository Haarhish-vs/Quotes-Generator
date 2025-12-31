import { collection, getDocs, doc } from "firebase/firestore";
import { db } from "../config/firebase";
import { populateSampleData } from "./firestoreHelpers";

// This function checks if the Firebase connection is working properly
// If not, it should be called in the catch blocks to determine if it's a DB issue
export const checkFirebaseConnection = async () => {
  try {
    // Try a simple operation to see if Firebase is connected
    const testCollection = collection(db, "_test_connection");
    await getDocs(testCollection);
    return true;
  } catch (error) {
    console.error("Firebase connection error:", error);
    return false;
  }
};

// Create initial Firestore collections if they don't exist
export const initializeFirestoreCollections = async () => {
  try {
    const collections = ["quotes", "favorites", "categories", "usageStats"];
    
    // Check if Firestore connection works first
    const isConnected = await checkFirebaseConnection();
    if (!isConnected) {
      console.log("Firestore connection not available, using local sample data");
      return false;
    }
    
    let needsDataPopulation = false;
    
    for (const collectionName of collections) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        
        if (snapshot.empty && collectionName === "quotes") {
          needsDataPopulation = true;
          console.log(`Collection ${collectionName} is empty and needs population`);
        }
      } catch (collectionError) {
        console.log(`Error accessing ${collectionName} collection:`, collectionError);
        // Continue with next collection instead of failing completely
      }
    }
    
    // If quotes collection is empty, populate with sample data
    if (needsDataPopulation) {
      console.log("Populating database with sample data...");
      await populateSampleData();
    }
    
    return true;
  } catch (error) {
    console.error("Error initializing Firestore collections:", error);
    return false;
  }
};
