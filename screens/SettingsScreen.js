import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { getFontSize, fontFamily } from '../utils/themeUtils';
import { addQuote } from '../utils/firebaseUtils';
import { categories } from '../data/sampleQuotes';
import {
  scheduleDailyNotification,
  checkNotificationStatus,
  showTestNotification,
  registerForPushNotificationsAsync,
  verifyNotificationSchedule,
  cancelAllNotifications,
  debugNotificationStatus
} from '../utils/notificationUtils';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';

function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  
  const [quoteText, setQuoteText] = useState('');
  const [quoteAuthor, setQuoteAuthor] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState(new Date());
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isAddingQuote, setIsAddingQuote] = useState(false);
  
  // Check notification permission and settings on load
  useEffect(() => {
    async function checkNotifications() {
      try {
        // Check if permissions are granted
        const status = await checkNotificationStatus();
        
        // Check if user had enabled notifications
        const enabledSetting = await AsyncStorage.getItem('notificationsEnabled');
        
        // Only set as enabled if both permission is granted and user setting is enabled
        setNotificationsEnabled(status && enabledSetting === 'true');
        
        // Load saved notification time
        const savedTime = await AsyncStorage.getItem('notificationTime');
        if (savedTime) {
          setNotificationTime(new Date(JSON.parse(savedTime)));
        } else {
          // Default to 9:00 AM if not set
          const defaultTime = new Date();
          defaultTime.setHours(9);
          defaultTime.setMinutes(0);
          defaultTime.setSeconds(0);
          setNotificationTime(defaultTime);
          
          // Save the default time
          if (status && enabledSetting === 'true') {
            await AsyncStorage.setItem('notificationTime', JSON.stringify(defaultTime.toISOString()));
          }
        }
      } catch (error) {
        console.error('Error in notification setup:', error);
      }
    }
    
    checkNotifications();
  }, []);

  // Handle adding a new quote
  const handleAddQuote = async () => {
    if (!quoteText.trim()) {
      Alert.alert('Error', 'Please enter the quote text');
      return;
    }
    
    if (!quoteAuthor.trim()) {
      Alert.alert('Error', 'Please enter the author name');
      return;
    }
    
    setIsAddingQuote(true);
    
    try {
      const newQuote = await addQuote({
        text: quoteText.trim(),
        author: quoteAuthor.trim(),
        category: selectedCategory
      });
      
      if (newQuote) {
        // Clear fields
        setQuoteText('');
        setQuoteAuthor('');
        setSelectedCategory(categories[0]);
        
        // Show success message
        Alert.alert(
          'Success',
          'Your quote has been added and will appear in the app!'
        );
      } else {
        Alert.alert('Error', 'Failed to add quote. Please check your internet connection and try again.');
      }
    } catch (error) {
      console.error('Error adding quote:', error);
      Alert.alert('Error', 'Something went wrong. Please check your internet connection and try again.');
    } finally {
      setIsAddingQuote(false);
    }
  };

  // Handle notification toggle
  const handleNotificationToggle = async (value) => {
    if (value) {
      // Request permissions
      const hasPermission = await registerForPushNotificationsAsync();
      if (hasPermission) {
        setNotificationsEnabled(true);
        
        // Save settings
        await AsyncStorage.setItem('notificationsEnabled', 'true');
        await AsyncStorage.setItem('notificationTime', JSON.stringify(notificationTime.toISOString()));
        
        // Schedule notification
        const success = await scheduleDailyNotification(
          notificationTime.getHours(), 
          notificationTime.getMinutes()
        );
        
        const formattedTime = `${notificationTime.getHours().toString().padStart(2, '0')}:${notificationTime.getMinutes().toString().padStart(2, '0')}`;
        
        if (success) {
          Alert.alert(
            '✅ Notifications Enabled',
            `ONE daily quote will be sent at ${formattedTime}.\n\nAll previous notifications have been cancelled to prevent duplicates.`
          );
        } else {
          Alert.alert(
            '⚠️ Setup Issue',
            'There was a problem setting up notifications. Please try again.'
          );
        }
      } else {
        setNotificationsEnabled(false);
        Alert.alert(
          '🔐 Permission Required', 
          'Notification permission is required to receive daily quotes.'
        );
      }
    } else {
      // Disable notifications - USE EMERGENCY CANCEL
      setNotificationsEnabled(false);
      await AsyncStorage.setItem('notificationsEnabled', 'false');
      
      // EMERGENCY CANCEL ALL
      await cancelAllNotifications();
      
      Alert.alert(
        '🛑 ALL NOTIFICATIONS STOPPED',
        'All notifications have been completely cancelled and cleared.'
      );
    }
  };

  // Handle time change for notification
  const onTimeChange = async (event, selectedTime) => {
    setShowTimePicker(false);
    
    if (selectedTime) {
      setNotificationTime(selectedTime);
      
      const formattedTime = `${selectedTime.getHours().toString().padStart(2, '0')}:${selectedTime.getMinutes().toString().padStart(2, '0')}`;
      
      try {
        // Save the new time
        await AsyncStorage.setItem('notificationTime', JSON.stringify(selectedTime.toISOString()));
        
        // If notifications are enabled, reschedule
        if (notificationsEnabled) {
          console.log(`🕒 Rescheduling notification for ${formattedTime}`);
          
          const success = await scheduleDailyNotification(selectedTime.getHours(), selectedTime.getMinutes());
          
          if (success) {
            Alert.alert(
              '🕒 Time Updated',
              `Your daily quote time is now set to ${formattedTime}.\n\nAll old notifications cancelled, only ONE new notification scheduled.`
            );
          } else {
            Alert.alert(
              '⚠️ Update Failed',
              'Could not update notification time. Please try again.'
            );
          }
        } else {
          // Just confirm the time was saved if notifications are off
          Alert.alert(
            '🕒 Time Saved',
            `Notification time set to ${formattedTime}. Enable notifications to receive daily quotes at this time.`
          );
        }
      } catch (error) {
        console.error('Error updating notification time:', error);
        Alert.alert('❌ Error', 'Could not save your notification time.');
      }
    }
  };

  // Send test notification
  const handleTestNotification = async () => {
    const success = await showTestNotification();
    
    if (success) {
      const verificationResult = await verifyNotificationSchedule();
      const formattedTime = `${notificationTime.getHours().toString().padStart(2, '0')}:${notificationTime.getMinutes().toString().padStart(2, '0')}`;
      
      Alert.alert(
        '🧪 Test Sent!', 
        `Test notification sent immediately!\n\n${notificationsEnabled ? 
          verificationResult.message || `Daily notifications scheduled for ${formattedTime}` : 
          'Enable notifications to receive daily quotes.'}`
      );
    } else {
      Alert.alert(
        '❌ Test Failed',
        'Could not send test notification. Please check your notification permissions and try again.'
      );
    }
  };

  // Debug notification status
  const handleDebugNotifications = async () => {
    const debugInfo = await debugNotificationStatus();
    
    if (debugInfo) {
      const message = `📋 Permissions: ${debugInfo.permissions.granted ? '✅ Granted' : '❌ Denied'}
📅 Scheduled: ${debugInfo.scheduledCount} notification(s)
💾 Settings: ${debugInfo.settings.enabled === 'true' ? 'Enabled' : 'Disabled'}
⏰ Time: ${debugInfo.settings.hour}:${debugInfo.settings.minute}
🎯 Next: ${debugInfo.settings.nextTime}

Check console for detailed logs.`;
      
      Alert.alert('🔍 Debug Info', message);
    } else {
      Alert.alert('❌ Debug Failed', 'Could not retrieve debug information.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : null}
      >
        <ScrollView 
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          keyboardShouldPersistTaps="handled"
        >
          {/* Add Quote Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Add Your Own Quote</Text>
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="Enter quote text"
              placeholderTextColor={colors.secondary}
              multiline
              numberOfLines={4}
              value={quoteText}
              onChangeText={setQuoteText}
            />
            
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.text, backgroundColor: colors.card }]}
              placeholder="Author name"
              placeholderTextColor={colors.secondary}
              value={quoteAuthor}
              onChangeText={setQuoteAuthor}
            />
            
            <TouchableOpacity
              style={[styles.categoryPicker, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            >
              <Text style={{ color: colors.text, fontFamily: fontFamily.regular }}>{selectedCategory}</Text>
              <Ionicons name="chevron-down" size={20} color={colors.text} />
            </TouchableOpacity>
            
            {showCategoryPicker && (
              <View style={[styles.categoryList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[styles.categoryItem, selectedCategory === category && { backgroundColor: colors.accent + '20' }]}
                    onPress={() => {
                      setSelectedCategory(category);
                      setShowCategoryPicker(false);
                    }}
                  >
                    <Text style={{ color: colors.text, fontFamily: fontFamily.regular }}>{category}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.accent }]}
              onPress={handleAddQuote}
              disabled={isAddingQuote}
            >
              {isAddingQuote ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.addButtonText}>Add Quote</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Appearance Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
            
            <View style={styles.settingRow}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Dark Mode</Text>
              <Switch
                value={theme === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: colors.accent }}
                thumbColor="#f4f3f4"
              />
            </View>
          </View>
          
          {/* Notification Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notifications</Text>
            
            <View style={[styles.settingRow, { marginBottom: 5 }]}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Daily Quote</Text>
              <Switch
                value={notificationsEnabled}
                onValueChange={handleNotificationToggle}
                trackColor={{ false: '#767577', true: colors.accent }}
                thumbColor="#f4f3f4"
              />
            </View>
            
            {notificationsEnabled && (
              <Text style={[styles.notificationInfo, { color: colors.secondary }]}>
                📱 One notification will be sent daily at your selected time. Works even when the app is closed.
              </Text>
            )}
            
            {notificationsEnabled && (
              <>
                <TouchableOpacity
                  style={[styles.timePicker, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={{ color: colors.text, fontFamily: fontFamily.regular }}>
                    Notification Time: {notificationTime.getHours().toString().padStart(2, '0')}:
                    {notificationTime.getMinutes().toString().padStart(2, '0')}
                  </Text>
                  <Ionicons name="time-outline" size={20} color={colors.text} />
                </TouchableOpacity>
                
                <Text style={[styles.notificationInfo, { color: colors.secondary, marginTop: 5, marginBottom: 10 }]}>
                  A quote will be delivered daily exactly at this time
                </Text>
                
                {showTimePicker && (
                  <DateTimePicker
                    value={notificationTime}
                    mode="time"
                    is24Hour={true}
                    onChange={onTimeChange}
                  />
                )}
                
                <TouchableOpacity
                  style={[styles.testButton, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={handleTestNotification}
                >
                  <Text style={{ color: colors.accent, fontFamily: fontFamily.medium }}>Send Test Notification</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.testButton, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 10 }]}
                  onPress={handleDebugNotifications}
                >
                  <Text style={{ color: colors.accent, fontFamily: fontFamily.medium }}>🔍 Debug Notification Status</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          
          {/* Developer Options */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Developer Options</Text>
            
            <TouchableOpacity
              style={[styles.setupButton, { backgroundColor: colors.accent }]}
              onPress={() => {
                Alert.alert(
                  'Setup Database',
                  'This will populate your Firestore database with ALL sample quotes. Continue?',
                  [
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                    {
                      text: 'Continue',
                      onPress: async () => {
                        try {
                          // Import the setup function
                          const { checkAndSetupFirestore } = require('../scripts/setupFirestore');
                          
                          // Show loading message
                          Alert.alert('Working...', 'Setting up database with all quotes. This may take a moment.');
                          
                          // Run setup
                          const result = await checkAndSetupFirestore(true);
                          
                          // Show result
                          Alert.alert(
                            result ? 'Success' : 'Error',
                            result 
                              ? 'All quotes added to database successfully!' 
                              : 'Failed to populate database. Check console for details.'
                          );
                        } catch (error) {
                          Alert.alert('Error', `Failed to set up database: ${error.message}`);
                        }
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.setupButtonText}>Reload All Sample Data</Text>
            </TouchableOpacity>
            <Text style={[styles.setupDescription, { color: colors.secondary }]}>
              For developers only: Repopulate your database with all sample quotes
            </Text>
          </View>
          
          {/* App Info */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.appVersionText, { color: colors.secondary }]}>
              Quotes Generator v1.0.0
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: getFontSize(20),
    fontFamily: fontFamily.bold,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: getFontSize(16),
    fontFamily: fontFamily.regular,
    minHeight: 50,
  },
  categoryPicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  categoryList: {
    borderWidth: 1,
    borderRadius: 8,
    marginTop: -12,
    marginBottom: 16,
    maxHeight: 200,
  },
  categoryItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  addButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: '#fff',
    fontFamily: fontFamily.semiBold,
    fontSize: getFontSize(16),
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  settingLabel: {
    fontSize: getFontSize(16),
    fontFamily: fontFamily.medium,
  },
  timePicker: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  testButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  setupButton: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  setupButtonText: {
    color: '#fff',
    fontFamily: fontFamily.semiBold,
    fontSize: getFontSize(16),
  },
  setupDescription: {
    fontSize: getFontSize(14),
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
  },
  appVersionText: {
    fontSize: getFontSize(14),
    fontFamily: fontFamily.regular,
    textAlign: 'center',
  },
  notificationInfo: {
    fontSize: getFontSize(12),
    fontFamily: fontFamily.italic,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 20,
  },
});

export default SettingsScreen;
