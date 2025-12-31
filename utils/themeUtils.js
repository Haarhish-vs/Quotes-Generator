import { StyleSheet } from 'react-native';
import { Dimensions } from 'react-native';
import { Platform } from 'react-native';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Define font family based on availability
export const fontFamily = {
  regular: 'Poppins-Regular',
  medium: 'Poppins-Medium',
  semiBold: 'Poppins-SemiBold',
  bold: 'Poppins-Bold',
  italic: 'Poppins-Italic',
};

// Responsive font size calculation
export const getFontSize = (size) => {
  const baseWidth = 375; // Base width (iPhone X)
  return Math.round((size * windowWidth) / baseWidth);
};

// Theme colors
export const themes = {
  light: {
    background: '#ffffff',
    card: '#f8f9fa',
    text: '#343a40',
    accent: '#4263eb',
    secondary: '#868e96',
    success: '#51cf66',
    warning: '#fcc419',
    danger: '#ff6b6b',
    border: '#dee2e6',
  },
  dark: {
    background: '#1e1e1e',
    card: '#2d2d2d',
    text: '#f8f9fa',
    accent: '#748ffc',
    secondary: '#adb5bd',
    success: '#69db7c',
    warning: '#ffd43b',
    danger: '#ff8787',
    border: '#444444',
  },
};

// Gradient backgrounds
export const gradients = [
  ['#4263eb', '#228be6'],  // Blue
  ['#f03e3e', '#e64980'],  // Red to Pink
  ['#9775fa', '#be4bdb'],  // Purple
  ['#40c057', '#37b24d'],  // Green
  ['#f76707', '#e8590c'],  // Orange
  ['#343a40', '#495057'],  // Dark Gray
  ['#5f27cd', '#341f97'],  // Deep Purple
  ['#0abde3', '#48dbfb'],  // Light Blue
  ['#ee5253', '#ff9f43'],  // Red to Orange
  ['#10ac84', '#1dd1a1'],  // Teal
  ['#8395a7', '#c8d6e5'],  // Silver
  ['#576574', '#222f3e'],  // Dark Blue
  ['#8e44ad', '#9b59b6'],  // Violet
  ['#6ab04c', '#badc58'],  // Light Green
];

// Common styles
export const commonStyles = {
  container: {
    flex: 1,
    padding: 20,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  quoteCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  quoteText: {
    fontFamily: fontFamily.regular,
    fontSize: getFontSize(20),
    lineHeight: getFontSize(28),
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  quoteAuthor: {
    fontFamily: fontFamily.semiBold,
    fontSize: getFontSize(16),
    textAlign: 'right',
    fontStyle: 'italic',
  },
  button: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  buttonText: {
    fontFamily: fontFamily.semiBold,
    fontSize: getFontSize(16),
    marginLeft: 8,
  },
  input: {
    fontFamily: fontFamily.regular,
    borderWidth: 1,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: getFontSize(16),
  },
  sectionTitle: {
    fontFamily: fontFamily.bold,
    fontSize: getFontSize(22),
    marginBottom: 15,
    marginTop: 10,
  },
  tabBarStyle: {
    paddingVertical: 10,
    height: 60,
    borderTopWidth: 1,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 10,
  },
  chip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    fontFamily: fontFamily.medium,
    fontSize: getFontSize(14),
  },
  iconButton: {
    padding: 10,
    borderRadius: 50,
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Additional responsive styles for better UI alignment
  responsiveContainer: {
    width: windowWidth > 600 ? '80%' : '90%',
    alignSelf: 'center',
  },
  safeAreaContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  pageTitle: {
    fontFamily: fontFamily.bold,
    fontSize: getFontSize(24),
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
};
