import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuotes } from '../contexts/QuotesContext';
import { useTheme } from '../contexts/ThemeContext';
import { categories } from '../data/sampleQuotes';
import { fetchCategories } from '../utils/firebaseUtils';
import { commonStyles, getFontSize, fontFamily } from '../utils/themeUtils';

const CategoryScreen = () => {
  const { loadQuotesByCategory, selectedCategory, setSelectedCategory } = useQuotes();
  const { colors } = useTheme();
  const [categoryList, setCategoryList] = useState(categories);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load categories from Firebase
  useEffect(() => {
    const loadCategories = async () => {
      setIsLoading(true);
      try {
        const fetchedCategories = await fetchCategories();
        if (fetchedCategories.length > 0) {
          // Ensure 'All' is the first category and exists only once
          if (!fetchedCategories.includes('All')) {
            setCategoryList(['All', ...fetchedCategories]);
          } else {
            // Remove 'All' from the array if it exists, then add it at the beginning
            const filteredCategories = fetchedCategories.filter(cat => cat !== 'All');
            setCategoryList(['All', ...filteredCategories]);
          }
        } else {
          // Ensure 'All' is the first category with sample data
          setCategoryList(['All', ...categories]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategoryList(['All', ...categories]); // Fallback to sample categories
      } finally {
        setIsLoading(false);
      }
    };

    loadCategories();
  }, []);

  // Handle category selection
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    loadQuotesByCategory(category);
  };

  // Function to get appropriate icon for each category
  const getCategoryIcon = (category) => {
    const categoryIcons = {
      'All': 'grid',
      'Motivational': 'trophy',
      'Success': 'star',
      'Life': 'heart',
      'Wisdom': 'book',
      'Love': 'heart',
      'Happiness': 'sunny',
      'Friendship': 'people',
      'Funny': 'happy',
      'Inspirational': 'bulb',
      'Time': 'time',
      'Faith': 'cloud',
      'Hope': 'flower',
      'Family': 'home',
      'Leadership': 'flag',
    };
    
    return categoryIcons[category] || 'bookmark';
  };
  
  // Filter categories based on search term
  const filteredCategories = searchTerm
    ? categoryList.filter(category => 
        category.toLowerCase().includes(searchTerm.toLowerCase()))
    : categoryList;

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        { backgroundColor: selectedCategory === item ? colors.accent : colors.card },
      ]}
      onPress={() => handleCategorySelect(item)}
    >
      <Ionicons 
        name={getCategoryIcon(item)} 
        size={28} 
        color={selectedCategory === item ? '#fff' : colors.accent} 
        style={styles.categoryIcon}
      />
      <Text
        style={[
          styles.categoryText,
          { color: selectedCategory === item ? '#fff' : colors.text }
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Categories</Text>
      
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.secondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search categories..."
          placeholderTextColor={colors.secondary}
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm ? (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={colors.secondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} size="large" color={colors.accent} />
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          numColumns={2}
          contentContainerStyle={styles.categoriesContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No categories found
            </Text>
          }
        />
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
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRadius: 10,
    marginBottom: 20,
    height: 50,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: getFontSize(16),
  },
  categoriesContainer: {
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryButton: {
    flex: 1,
    margin: 6,
    height: 110,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    padding: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryText: {
    fontSize: getFontSize(16),
    fontWeight: '600',
    textAlign: 'center',
  },
  loader: {
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: getFontSize(16),
  },
});

export default CategoryScreen;
