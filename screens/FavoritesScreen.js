import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Share,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQuotes } from '../contexts/QuotesContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFontSize, fontFamily } from '../utils/themeUtils';

const FavoritesScreen = () => {
  const { favorites, removeFavorite, isLoading } = useQuotes();
  const { colors } = useTheme();
  const [copied, setCopied] = useState(null);

  // Copy quote to clipboard
  const copyToClipboard = async (quote) => {
    try {
      const quoteText = `"${quote.text}" - ${quote.author}`;
      await Clipboard.setStringAsync(quoteText);
      setCopied(quote.id);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  // Share quote
  const shareQuote = async (quote) => {
    try {
      const quoteText = `"${quote.text}" - ${quote.author}\n\nShared from Quotes Generator App`;
      await Share.share({
        message: quoteText,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Remove from favorites with confirmation
  const confirmRemoveFavorite = (favoriteId) => {
    Alert.alert(
      "Remove from Favorites",
      "Are you sure you want to remove this quote from your favorites?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Remove", 
          onPress: () => removeFavorite(favoriteId),
          style: "destructive"
        }
      ]
    );
  };

  const renderFavoriteItem = ({ item }) => (
    <View style={[styles.quoteCard, { backgroundColor: colors.card }]}>
      <View style={styles.quoteContent}>
        <Text style={[styles.quoteText, { color: colors.text }]}>"{item.text}"</Text>
        <Text style={[styles.quoteAuthor, { color: colors.secondary }]}>— {item.author}</Text>
        
        {item.category && (
          <View style={[styles.categoryChip, { backgroundColor: colors.accent + '20' }]}>
            <Text style={[styles.categoryText, { color: colors.accent }]}>
              {item.category}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: colors.background }]} 
          onPress={() => copyToClipboard(item)}
        >
          <Ionicons 
            name={copied === item.id ? "checkmark" : "copy-outline"} 
            size={20} 
            color={colors.accent} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: colors.background }]}
          onPress={() => shareQuote(item)}
        >
          <Ionicons name="share-social-outline" size={20} color={colors.accent} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.iconButton, { backgroundColor: colors.background }]}
          onPress={() => confirmRemoveFavorite(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Your Favorites</Text>
      
      {favorites.length > 0 ? (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={80} color={colors.secondary} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No favorites yet
          </Text>
          <Text style={[styles.emptySubText, { color: colors.secondary }]}>
            When you find a quote you love, tap the heart icon to add it here
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: getFontSize(24),
    fontFamily: fontFamily.bold,
    marginBottom: 20,
    marginTop: 20,
    marginLeft: 6,
  },
  listContainer: {
    paddingBottom: 20,
  },
  quoteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quoteContent: {
    marginBottom: 12,
  },
  quoteText: {
    fontSize: getFontSize(18),
    lineHeight: getFontSize(26),
    marginBottom: 8,
  },
  quoteAuthor: {
    fontSize: getFontSize(16),
    fontStyle: 'italic',
    textAlign: 'right',
    marginBottom: 8,
  },
  categoryChip: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 8,
  },
  categoryText: {
    fontSize: getFontSize(14),
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: getFontSize(20),
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  emptySubText: {
    fontSize: getFontSize(16),
    textAlign: 'center',
    lineHeight: getFontSize(22),
  },
});

export default FavoritesScreen;
