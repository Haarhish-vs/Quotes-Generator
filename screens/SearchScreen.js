import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuotes } from '../contexts/QuotesContext';
import { useTheme } from '../contexts/ThemeContext';
import { getFontSize, fontFamily } from '../utils/themeUtils';

const SearchScreen = () => {
  const { searchQuotesByTerm, quotes, isLoading } = useQuotes();
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = () => {
    if (searchTerm.trim().length > 0) {
      searchQuotesByTerm(searchTerm);
      setHasSearched(true);
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
    setHasSearched(false);
  };

  const renderQuoteItem = ({ item }) => (
    <View style={[styles.quoteCard, { backgroundColor: colors.card }]}>
      <Text style={[styles.quoteText, { color: colors.text }]}>"{item.text}"</Text>
      <Text style={[styles.quoteAuthor, { color: colors.secondary }]}>— {item.author}</Text>
      
      {item.category && (
        <View style={[styles.categoryChip, { backgroundColor: colors.accent + '20' }]}>
          <Text style={[styles.categoryText, { color: colors.accent }]}>{item.category}</Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Search Quotes</Text>
      
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, { backgroundColor: colors.card }]}>
          <Ionicons name="search" size={20} color={colors.secondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search by text, author, or keyword..."
            placeholderTextColor={colors.secondary}
            value={searchTerm}
            onChangeText={setSearchTerm}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
            autoCapitalize="none"
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.secondary} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          style={[styles.searchButton, { backgroundColor: colors.accent }]}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      ) : hasSearched ? (
        quotes.length > 0 ? (
          <FlatList
            data={quotes}
            renderItem={renderQuoteItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={70} color={colors.secondary} />
            <Text style={[styles.emptyText, { color: colors.text }]}>No quotes found</Text>
            <Text style={[styles.emptySubText, { color: colors.secondary }]}>
              Try searching with different keywords
            </Text>
          </View>
        )
      ) : (
        <View style={styles.initialContainer}>
          <Ionicons name="search" size={70} color={colors.secondary} style={styles.searchIcon} />
          <Text style={[styles.initialText, { color: colors.secondary }]}>
            Search for quotes by text, author, or keywords
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
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: getFontSize(16),
  },
  searchButton: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: getFontSize(16),
    fontWeight: '500',
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
  loader: {
    marginTop: 50,
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
  initialContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  searchIcon: {
    marginBottom: 20,
    opacity: 0.7,
  },
  initialText: {
    fontSize: getFontSize(16),
    textAlign: 'center',
    lineHeight: getFontSize(24),
  },
});

export default SearchScreen;
