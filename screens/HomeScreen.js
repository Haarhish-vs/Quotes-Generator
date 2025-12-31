import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  ActivityIndicator,
  Animated,
  StatusBar,
  SafeAreaView
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQuotes } from '../contexts/QuotesContext';
import { useTheme } from '../contexts/ThemeContext';
import { commonStyles, getFontSize, gradients, fontFamily } from '../utils/themeUtils';

const HomeScreen = () => {
  const { currentQuote, getRandomQuote, addFavorite, removeFavorite, isQuoteFavorite, getFavoriteId, isLoading } = useQuotes();
  const { colors, theme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [gradientIndex, setGradientIndex] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(1));
  const [isFavoriting, setIsFavoriting] = useState(false);

  // Handle getting a new quote with animation
  const handleNewQuote = () => {
    // Save the current quote ID to check if we get a different one
    const currentId = currentQuote?.id;
    
    // Fade out
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      // Get new quote
      getRandomQuote();
      
      // Generate a new random gradient index that's different from the current one
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * gradients.length);
      } while (newIndex === gradientIndex && gradients.length > 1);
      
      setGradientIndex(newIndex);
      
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    });
  };

  // Copy quote to clipboard
  const copyToClipboard = async () => {
    if (!currentQuote) return;
    
    const quoteText = `"${currentQuote.text}" - ${currentQuote.author}`;
    await Clipboard.setStringAsync(quoteText);
    
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  // Share quote
  const shareQuote = async () => {
    if (!currentQuote) return;
    
    try {
      const quoteText = `"${currentQuote.text}" - ${currentQuote.author}\n\nShared from Quotes Generator App`;
      await Share.share({
        message: quoteText,
      });
    } catch (error) {
      console.error(error);
    }
  };

  // Toggle favorite status
  const toggleFavorite = async () => {
    if (!currentQuote) return;
    
    setIsFavoriting(true);
    
    try {
      if (isQuoteFavorite(currentQuote.id)) {
        // Remove from favorites
        const favoriteId = getFavoriteId(currentQuote.id);
        if (favoriteId) {
          const success = await removeFavorite(favoriteId);
          if (!success) {
            // Handle the error - could show a toast or alert
            console.log("Failed to remove from favorites");
          }
        }
      } else {
        // Add to favorites
        const success = await addFavorite(currentQuote);
        if (!success) {
          // Handle the error - could show a toast or alert
          console.log("Failed to add to favorites");
        }
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      // Handle the error - could show a toast or alert
    } finally {
      setIsFavoriting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea]}>
        <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (!currentQuote) {
    return (
      <SafeAreaView style={[styles.safeArea]}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.errorText, { color: colors.text }]}>
            No quote available. Try refreshing!
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.accent }]}
            onPress={getRandomQuote}
          >
            <Ionicons name="refresh" size={24} color="#fff" />
            <Text style={styles.buttonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      <LinearGradient
        colors={gradients[gradientIndex]}
        style={styles.gradientBackground}
      />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.quoteContainer, { opacity: fadeAnim }]}>
          <Text style={styles.quoteText}>"{currentQuote.text}"</Text>
          <Text style={styles.quoteAuthor}>— {currentQuote.author}</Text>
          
          {currentQuote.category && (
            <View style={styles.categoryContainer}>
              <Text style={styles.categoryText}>{currentQuote.category}</Text>
            </View>
          )}
        </Animated.View>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={toggleFavorite}
            disabled={isFavoriting}
          >
            {isFavoriting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons
                name={isQuoteFavorite(currentQuote.id) ? "heart" : "heart-outline"}
                size={28}
                color="#fff"
              />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={copyToClipboard}
          >
            <Ionicons
              name={copied ? "checkmark" : "copy-outline"}
              size={26}
              color="#fff"
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.iconButton}
            onPress={shareQuote}
          >
            <Ionicons name="share-social-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={handleNewQuote}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#4263eb', '#228be6']}
          style={styles.refreshGradient}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.refreshText}>New Quote</Text>
        </LinearGradient>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  quoteContainer: {
    padding: 25,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginHorizontal: 10,
    marginBottom: 20,
    backdropFilter: 'blur(10px)',
  },
  quoteText: {
    fontSize: getFontSize(24),
    fontFamily: fontFamily.regular,
    color: '#fff',
    lineHeight: getFontSize(34),
    textAlign: 'center',
    marginBottom: 20,
  },
  quoteAuthor: {
    fontSize: getFontSize(18),
    fontFamily: fontFamily.semiBold,
    color: '#fff',
    textAlign: 'right',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  categoryContainer: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginTop: 10,
  },
  categoryText: {
    color: '#fff',
    fontSize: getFontSize(14),
    fontFamily: fontFamily.medium,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 25,
    marginBottom: 15,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  refreshButton: {
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  refreshGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  refreshText: {
    color: '#fff',
    fontSize: getFontSize(18),
    fontFamily: fontFamily.semiBold,
    marginLeft: 10,
  },
  errorText: {
    fontSize: getFontSize(18),
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: getFontSize(16),
    fontFamily: fontFamily.semiBold,
    marginLeft: 8,
  },
});

export default HomeScreen;
