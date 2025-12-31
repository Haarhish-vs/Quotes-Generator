import { useEffect, useState } from 'react';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Ionicons, EvilIcons, MaterialIcons, FontAwesome } from '@expo/vector-icons';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export function useFonts() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        // Pre-load both custom fonts and icon fonts
        await Font.loadAsync({
          // App custom fonts
          'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
          'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
          'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
          'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
          'Poppins-Italic': require('../assets/fonts/Poppins-Italic.ttf'),
          
          // Icon fonts - this will fix the EvilIcons issue
          ...Ionicons.font,
          ...EvilIcons.font,
          ...MaterialIcons.font,
          ...FontAwesome.font,
        });
        
        // Fonts are loaded
        setFontsLoaded(true);
      } catch (error) {
        console.error("Error loading fonts:", error);
        // Fall back to system fonts if there's an error
        setFontsLoaded(true);
      } finally {
        // Hide the splash screen
        try {
          await SplashScreen.hideAsync();
        } catch (e) {
          // Ignore errors with hiding splash screen
          console.log("Could not hide splash screen:", e);
        }
      }
    }

    loadFonts();
  }, []);

  return fontsLoaded;
}
