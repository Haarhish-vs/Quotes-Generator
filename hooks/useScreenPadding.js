import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform, StatusBar } from 'react-native';

export function useScreenPadding() {
  const insets = useSafeAreaInsets();
  
  // Add appropriate padding based on platform and status bar
  const screenPadding = {
    paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight || 20,
    paddingBottom: insets.bottom,
    paddingLeft: insets.left,
    paddingRight: insets.right
  };

  // For precise screen dimensions calculations
  return {
    top: insets.top || (StatusBar.currentHeight || 20),
    bottom: insets.bottom,
    left: insets.left,
    right: insets.right,
    screenPadding
  };
}
