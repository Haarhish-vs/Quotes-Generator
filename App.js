import React, { useEffect } from 'react';
import { LogBox, StatusBar, View, StyleSheet, Text } from 'react-native';
import AppNavigator from './navigation/AppNavigator';
import { ThemeProvider } from './contexts/ThemeContext';
import { QuotesProvider } from './contexts/QuotesContext';
import { initializeFirestoreCollections } from './utils/firestoreSetup';
import { checkAndSetupFirestore } from './scripts/setupFirestore';
import NetworkStatus from './components/NetworkStatus';
import { useFonts } from './hooks/useFonts';
import * as SplashScreen from 'expo-splash-screen';

// Suppress specific warnings that might occur with Firebase and Expo
LogBox.ignoreLogs([
  'AsyncStorage has been extracted from react-native core',
  'Setting a timer for a long period of time',
  'VirtualizedLists should never be nested inside',
  '@firebase/analytics',
  'Firebase Analytics is not supported in this environment',
  'IndexedDB is not available in this environment',
  'expo-notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'Android Push notifications (remote notifications)',
  'quote',
  'quote-outline',
  'WebChannelConnection RPC',
  '@firebase/firestore: Firestore',
  'Error: Firestore',
  'Error: [object Object]',
  'NetInfo',
  'Require cycle',
  '[Reanimated]',
  'Seems like you are using a Babel plugin',
  'react-native-worklets',
]);

export default function App() {
  // Load fonts
  const fontsLoaded = useFonts();
  
  // Initialize Firestore collections on app start
  useEffect(() => {
    // First check collections
    initializeFirestoreCollections().catch(error => {
      console.log('Failed to initialize Firestore collections:', error);
    });
    
    // Then automatically populate with sample data if needed
    checkAndSetupFirestore().catch(error => {
      console.log('Note: Auto-setup of sample data failed (normal if offline):', error);
    });
  }, []);
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffff',
    },
    loadingText: {
      fontSize: 16,
      marginTop: 20,
    }
  });

  // Show loading screen while fonts load
  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ThemeProvider>
      <QuotesProvider>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="#fff" />
          <NetworkStatus />
          <AppNavigator />
        </View>
      </QuotesProvider>
    </ThemeProvider>
  );
}
