import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { 
  fetchQuotes, 
  fetchQuotesByCategory, 
  fetchFavorites, 
  addToFavorites, 
  removeFromFavorites,
  searchQuotes,
  updateUsageStats,
  subscribeFavorites,
  getDeviceId
} from '../utils/firebaseUtils';
import { sampleQuotes } from '../data/sampleQuotes';
import { checkFirebaseConnection } from '../utils/firestoreSetup';

// Quotes context for managing quotes data throughout the app
const QuotesContext = createContext();

export const QuotesProvider = ({ children }) => {
  const [quotes, setQuotes] = useState(sampleQuotes);
  const [currentQuote, setCurrentQuote] = useState(sampleQuotes[0]);
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [error, setError] = useState(null);
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(true);
  
  // Keep track of recently shown quotes to avoid repetition
  const recentQuotesRef = useRef([]);
  const MAX_RECENT_QUOTES = 5; // Don't show the same quote until at least 5 other quotes have been shown
  
  // Check Firebase connection on startup
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await checkFirebaseConnection();
      setIsFirebaseAvailable(isConnected);
      if (!isConnected) {
        console.log("Firebase not available, using local data only");
      }
    };
    
    checkConnection();
  }, []);
  
  // Load quotes on startup
  useEffect(() => {
    loadQuotes();
    
    // Only try to update stats if Firebase is available
    if (isFirebaseAvailable) {
      updateUsageStats().catch(err => {
        console.log("Error updating usage stats (normal in Expo Go):", err);
      });
      
      // Set up real-time favorites listener
      setupFavoritesSubscription();
    } else {
      // Load favorites normally if Firebase is not available
      loadFavorites();
    }
    
    // Cleanup subscription when component unmounts
    return () => {
      if (favoritesUnsubscribe) {
        favoritesUnsubscribe();
      }
    };
  }, [isFirebaseAvailable]);
  
  // Reference to store unsubscribe function
  const [favoritesUnsubscribe, setFavoritesUnsubscribe] = useState(null);
  
  // Load quotes from Firebase or fallback to sample quotes
  const loadQuotes = async () => {
    // Reset recently shown quotes when loading all quotes
    recentQuotesRef.current = [];
    
    setIsLoading(true);
    try {
      // If Firebase is not available, use sample quotes directly
      if (!isFirebaseAvailable) {
        setQuotes(sampleQuotes);
        setCurrentQuote(sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)]);
        setError(null);
        setIsLoading(false);
        return;
      }
      
      const fetchedQuotes = await fetchQuotes();
      
      if (fetchedQuotes.length > 0) {
        setQuotes(fetchedQuotes);
      } else {
        // Use sample quotes as fallback if no quotes in Firebase
        setQuotes(sampleQuotes);
      }
      
      // Set a random quote as current quote
      const randomIndex = Math.floor(Math.random() * (fetchedQuotes.length || sampleQuotes.length));
      const newQuote = fetchedQuotes.length > 0 ? fetchedQuotes[randomIndex] : sampleQuotes[randomIndex];
      setCurrentQuote(newQuote);
      
      // Add the initial quote to the recently shown list
      if (newQuote?.id) {
        recentQuotesRef.current = [newQuote.id];
      }
      
      setError(null);
    } catch (err) {
      console.error('Error loading quotes:', err);
      setQuotes(sampleQuotes);
      
      const randomIndex = Math.floor(Math.random() * sampleQuotes.length);
      const newQuote = sampleQuotes[randomIndex];
      setCurrentQuote(newQuote);
      
      // Add the initial quote to the recently shown list
      if (newQuote?.id) {
        recentQuotesRef.current = [newQuote.id];
      }
      
      setError('Failed to load quotes. Using sample quotes instead.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get a new random quote that hasn't been shown recently
  const getRandomQuote = () => {
    if (quotes.length === 0) return;
    
    // If we have very few quotes (less than MAX_RECENT_QUOTES + 1), just pick randomly
    if (quotes.length <= MAX_RECENT_QUOTES + 1) {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      const newQuote = quotes[randomIndex];
      
      // Don't repeat the current quote if we have at least 2 quotes
      if (quotes.length >= 2 && newQuote.id === currentQuote.id) {
        return getRandomQuote(); // Try again
      }
      
      setCurrentQuote(newQuote);
      return;
    }
    
    // Special handling for "All" category to ensure category mixing
    if (selectedCategory === 'All') {
      // Get all available categories from our current quotes
      const categories = [...new Set(quotes.map(quote => quote.category))];
      
      // If we have the current category, try to pick from a different one for variety
      let targetCategories = categories;
      if (currentQuote && currentQuote.category) {
        // Prefer a different category than the current one (50% chance)
        if (categories.length > 1 && Math.random() > 0.5) {
          targetCategories = categories.filter(cat => cat !== currentQuote.category);
        }
      }
      
      // Select a random category from our target categories
      const randomCategory = targetCategories[Math.floor(Math.random() * targetCategories.length)];
      
      // Get quotes from this category that haven't been shown recently
      const categoryQuotes = quotes.filter(quote => 
        quote.category === randomCategory &&
        !recentQuotesRef.current.includes(quote.id) && 
        quote.id !== currentQuote?.id
      );
      
      // If we found quotes in this category, pick one randomly
      if (categoryQuotes.length > 0) {
        const randomIndex = Math.floor(Math.random() * categoryQuotes.length);
        const newQuote = categoryQuotes[randomIndex];
        
        // Update the current quote
        setCurrentQuote(newQuote);
        
        // Update the recently shown quotes list
        recentQuotesRef.current = [
          ...recentQuotesRef.current, 
          newQuote.id
        ].slice(-MAX_RECENT_QUOTES);
        
        return;
      }
    }
    
    // Standard approach for single category or fallback
    // Get quotes that haven't been shown recently
    const availableQuotes = quotes.filter(quote => 
      !recentQuotesRef.current.includes(quote.id) && 
      quote.id !== currentQuote?.id
    );
    
    // If all quotes have been shown recently, reset the tracking
    if (availableQuotes.length === 0) {
      recentQuotesRef.current = [currentQuote?.id].filter(Boolean);
      const filteredQuotes = quotes.filter(quote => quote.id !== currentQuote?.id);
      const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
      setCurrentQuote(filteredQuotes[randomIndex]);
      return;
    }
    
    // Get a random quote from available ones
    const randomIndex = Math.floor(Math.random() * availableQuotes.length);
    const newQuote = availableQuotes[randomIndex];
    
    // Update the current quote
    setCurrentQuote(newQuote);
    
    // Update the recently shown quotes list
    recentQuotesRef.current = [
      ...recentQuotesRef.current, 
      newQuote.id
    ].slice(-MAX_RECENT_QUOTES);
  };
  
  // Load quotes by category
  const loadQuotesByCategory = async (category) => {
    // Reset recently shown quotes when changing categories
    recentQuotesRef.current = [];
    
    setIsLoading(true);
    try {
      if (category === 'All') {
        // For "All" category, use all quotes but show a mixed representation
        // This ensures we display quotes from different categories in random order
        if (!isFirebaseAvailable) {
          // When using sample quotes, ensure we have a mix of all categories
          setQuotes(sampleQuotes);
          
          // Select a truly random quote from all categories
          const randomIndex = Math.floor(Math.random() * sampleQuotes.length);
          setCurrentQuote(sampleQuotes[randomIndex]);
        } else {
          // When using Firebase, fetch all quotes
          const fetchedQuotes = await fetchQuotes();
          
          if (fetchedQuotes.length > 0) {
            setQuotes(fetchedQuotes);
            const randomIndex = Math.floor(Math.random() * fetchedQuotes.length);
            setCurrentQuote(fetchedQuotes[randomIndex]);
          } else {
            setQuotes(sampleQuotes);
            const randomIndex = Math.floor(Math.random() * sampleQuotes.length);
            setCurrentQuote(sampleQuotes[randomIndex]);
          }
        }
        
        setSelectedCategory(category);
        setError(null);
        setIsLoading(false);
        return;
      }
      
      // For specific categories
      // If Firebase is not available, filter sample quotes locally
      if (!isFirebaseAvailable) {
        const filtered = sampleQuotes.filter(q => q.category === category);
        
        if (filtered.length > 0) {
          setQuotes(filtered);
          // Get a random quote from the category instead of always using the first one
          const randomIndex = Math.floor(Math.random() * filtered.length);
          setCurrentQuote(filtered[randomIndex]);
        } else {
          setQuotes(sampleQuotes);
          setCurrentQuote(sampleQuotes[0]);
        }
        
        setSelectedCategory(category);
        setError(null);
        setIsLoading(false);
        return;
      }
      
      const filteredQuotes = await fetchQuotesByCategory(category);
      
      if (filteredQuotes.length > 0) {
        setQuotes(filteredQuotes);
        // Get a random quote from the category instead of always using the first one
        const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
        setCurrentQuote(filteredQuotes[randomIndex]);
      } else {
        // Fallback to filtered sample quotes
        const filtered = sampleQuotes.filter(q => q.category === category);
        
        if (filtered.length > 0) {
          setQuotes(filtered);
          const randomIndex = Math.floor(Math.random() * filtered.length);
          setCurrentQuote(filtered[randomIndex]);
        } else {
          setQuotes(sampleQuotes);
          setCurrentQuote(sampleQuotes[0]);
        }
      }
      
      setSelectedCategory(category);
      setError(null);
    } catch (err) {
      console.error('Error loading quotes by category:', err);
      const filtered = sampleQuotes.filter(q => q.category === category);
      
      if (filtered.length > 0) {
        setQuotes(filtered);
        const randomIndex = Math.floor(Math.random() * filtered.length);
        setCurrentQuote(filtered[randomIndex]);
      } else {
        setQuotes(sampleQuotes);
        setCurrentQuote(sampleQuotes[0]);
      }
      
      setError('Failed to load category quotes. Using sample quotes instead.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Search quotes
  const searchQuotesByTerm = async (term) => {
    if (!term) {
      loadQuotes();
      return;
    }
    
    // Reset recently shown quotes when searching
    recentQuotesRef.current = [];
    
    setIsLoading(true);
    try {
      const results = await searchQuotes(term);
      
      if (results.length > 0) {
        setQuotes(results);
        // Select a random quote from search results instead of always the first one
        const randomIndex = Math.floor(Math.random() * results.length);
        setCurrentQuote(results[randomIndex]);
      } else {
        // Fallback to search in sample quotes
        const filtered = sampleQuotes.filter(q => 
          q.text.toLowerCase().includes(term.toLowerCase()) || 
          q.author.toLowerCase().includes(term.toLowerCase()) ||
          (q.category && q.category.toLowerCase().includes(term.toLowerCase()))
        );
        
        setQuotes(filtered.length > 0 ? filtered : []);
        
        if (filtered.length > 0) {
          const randomIndex = Math.floor(Math.random() * filtered.length);
          setCurrentQuote(filtered[randomIndex]);
        } else {
          setCurrentQuote(null);
        }
      }
      
      setError(null);
    } catch (err) {
      console.error('Error searching quotes:', err);
      // Search in sample quotes as fallback
      const filtered = sampleQuotes.filter(q => 
        q.text.toLowerCase().includes(term.toLowerCase()) || 
        q.author.toLowerCase().includes(term.toLowerCase()) ||
        (q.category && q.category.toLowerCase().includes(term.toLowerCase()))
      );
      
      setQuotes(filtered.length > 0 ? filtered : []);
      
      if (filtered.length > 0) {
        const randomIndex = Math.floor(Math.random() * filtered.length);
        setCurrentQuote(filtered[randomIndex]);
      } else {
        setCurrentQuote(null);
      }
      
      setError('Failed to search online. Using sample quotes instead.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load user's favorite quotes (traditional way)
  const loadFavorites = async () => {
    try {
      const fetchedFavorites = await fetchFavorites();
      setFavorites(fetchedFavorites);
    } catch (err) {
      console.error('Error loading favorites:', err);
    }
  };
  
  // Set up real-time subscription to favorites
  const setupFavoritesSubscription = async () => {
    try {
      const deviceId = await getDeviceId();
      const unsubscribe = subscribeFavorites(deviceId, (updatedFavorites) => {
        setFavorites(updatedFavorites);
      });
      
      setFavoritesUnsubscribe(() => unsubscribe);
    } catch (err) {
      console.error('Error setting up favorites subscription:', err);
      // Fall back to regular loading
      loadFavorites();
    }
  };
  
  // Add a quote to favorites
  const addFavorite = async (quote) => {
    try {
      const success = await addToFavorites(quote);
      // No need to manually reload with real-time updates
      return success;
    } catch (err) {
      console.error('Error adding favorite:', err);
      return false;
    }
  };
  
  // Remove a quote from favorites
  const removeFavorite = async (favoriteId) => {
    try {
      const success = await removeFromFavorites(favoriteId);
      // No need to manually reload with real-time updates
      return success;
    } catch (err) {
      console.error('Error removing favorite:', err);
      return false;
    }
  };
  
  // Check if a quote is in favorites
  const isQuoteFavorite = (quoteId) => {
    return favorites.some(fav => fav.quoteId === quoteId);
  };
  
  // Get the favorite document ID for a quote
  const getFavoriteId = (quoteId) => {
    const favorite = favorites.find(fav => fav.quoteId === quoteId);
    return favorite ? favorite.id : null;
  };

  return (
    <QuotesContext.Provider
      value={{
        quotes,
        currentQuote,
        favorites,
        isLoading,
        error,
        selectedCategory,
        getRandomQuote,
        loadQuotes,
        loadQuotesByCategory,
        searchQuotesByTerm,
        addFavorite,
        removeFavorite,
        isQuoteFavorite,
        getFavoriteId,
        setSelectedCategory
      }}
    >
      {children}
    </QuotesContext.Provider>
  );
};

export const useQuotes = () => useContext(QuotesContext);
