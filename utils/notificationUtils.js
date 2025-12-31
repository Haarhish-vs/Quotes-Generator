import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { sampleQuotes } from '../data/sampleQuotes';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Set notification handler - MUST be called at app startup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request notification permissions
export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Daily Quotes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('❌ Failed to get push token for push notification!');
        return false;
      }
      
      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Error getting notification permissions:', error);
      return false;
    }
  } else {
    console.log('❌ Must use physical device for Push Notifications');
    return false;
  }
}

// Cancel all scheduled notifications and clear storage
export async function cancelAllNotifications() {
  try {
    console.log('🧹 Emergency: Cancelling ALL notifications and clearing storage...');
    
    // Cancel all scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Clear all notification-related storage
    const keysToRemove = [
      'notificationId',
      'scheduledHour',
      'scheduledMinute', 
      'nextScheduledTime',
      'notificationTime'
    ];
    
    for (const key of keysToRemove) {
      await AsyncStorage.removeItem(key);
    }
    
    console.log('✅ All notifications cancelled and storage cleared');
    return true;
  } catch (error) {
    console.error('❌ Error cancelling notifications:', error);
    return false;
  }
}

// Schedule a daily notification at specified time
export async function scheduleDailyNotification(hour, minute) {
  try {
    console.log(`📅 Scheduling daily notification for ${hour}:${minute.toString().padStart(2, '0')}`);
    
    // First, cancel any existing notifications to prevent duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();
    
    // Clear old notification data
    await AsyncStorage.removeItem('notificationId');
    await AsyncStorage.removeItem('nextScheduledTime');
    
    // Get a random quote
    const randomQuote = sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)];
    
    // Calculate when the notification should fire
    const now = new Date();
    const targetTime = new Date();
    targetTime.setHours(hour, minute, 0, 0);
    
    // If the time has passed today, schedule for tomorrow
    if (targetTime.getTime() <= now.getTime()) {
      targetTime.setDate(targetTime.getDate() + 1);
    }
    
    console.log(`⏰ Current time: ${now.toLocaleString()}`);
    console.log(`🎯 Target time: ${targetTime.toLocaleString()}`);
    
    // Schedule the notification using calendar trigger for better reliability
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '💭 Daily Quote',
        body: `"${randomQuote.text}" - ${randomQuote.author}`,
        data: { 
          type: 'daily',
          hour: hour.toString(),
          minute: minute.toString(),
          quote: randomQuote,
          scheduledFor: targetTime.toISOString()
        },
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
    
    // Save notification details
    await AsyncStorage.setItem('notificationId', notificationId);
    await AsyncStorage.setItem('scheduledHour', hour.toString());
    await AsyncStorage.setItem('scheduledMinute', minute.toString());
    
    // Calculate next notification time for display
    const nextNotification = new Date();
    nextNotification.setHours(hour, minute, 0, 0);
    
    if (nextNotification.getTime() <= now.getTime()) {
      nextNotification.setDate(nextNotification.getDate() + 1);
    }
    
    await AsyncStorage.setItem('nextScheduledTime', nextNotification.toISOString());
    
    console.log(`✅ Notification scheduled with ID: ${notificationId}`);
    console.log(`⏰ Next notification: ${nextNotification.toLocaleString()}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    return false;
  }
}

// Check if notifications are enabled
export async function checkNotificationStatus() {
  try {
    const settings = await Notifications.getPermissionsAsync();
    return settings.granted;
  } catch (error) {
    console.error('Error checking notification status:', error);
    return false;
  }
}

// Debug function to check current notification status
export async function debugNotificationStatus() {
  try {
    console.log('🔍 === NOTIFICATION DEBUG INFO ===');
    
    // Check permissions
    const permissions = await Notifications.getPermissionsAsync();
    console.log('📋 Permissions:', permissions);
    
    // Check scheduled notifications
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    console.log('📅 Scheduled notifications:', scheduled.length);
    
    scheduled.forEach((notification, index) => {
      console.log(`📌 Notification ${index + 1}:`, {
        id: notification.identifier,
        trigger: notification.trigger,
        content: notification.content.title
      });
    });
    
    // Check stored settings
    const hour = await AsyncStorage.getItem('scheduledHour');
    const minute = await AsyncStorage.getItem('scheduledMinute');
    const enabled = await AsyncStorage.getItem('notificationsEnabled');
    const nextTime = await AsyncStorage.getItem('nextScheduledTime');
    
    console.log('💾 Stored settings:', {
      hour,
      minute, 
      enabled,
      nextTime: nextTime ? new Date(nextTime).toLocaleString() : 'None'
    });
    
    return {
      permissions,
      scheduledCount: scheduled.length,
      scheduled,
      settings: { hour, minute, enabled, nextTime }
    };
  } catch (error) {
    console.error('❌ Debug error:', error);
    return null;
  }
}

// Show a test notification immediately
export async function showTestNotification() {
  try {
    const randomQuote = sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)];
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "🧪 TEST NOTIFICATION",
        body: `"${randomQuote.text}" - ${randomQuote.author}`,
        data: { type: 'test' },
      },
      trigger: null, // Show immediately
    });
    
    console.log("✅ Test notification sent");
    return true;
  } catch (error) {
    console.error('❌ Error showing test notification:', error);
    return false;
  }
}

// Verify notifications are scheduled correctly
export async function verifyNotificationSchedule() {
  try {
    const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const hour = await AsyncStorage.getItem('scheduledHour');
    const minute = await AsyncStorage.getItem('scheduledMinute');
    
    if (scheduledNotifications.length === 0) {
      return {
        scheduled: false,
        message: "No notifications are currently scheduled"
      };
    }
    
    const formattedTime = hour && minute ? 
      `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}` : 
      'unknown time';
    
    const nextNotification = scheduledNotifications[0];
    
    return {
      scheduled: true,
      count: scheduledNotifications.length,
      message: `✅ ${scheduledNotifications.length} notification(s) scheduled for ${formattedTime}`,
      details: nextNotification
    };
  } catch (error) {
    console.error('❌ Error verifying schedule:', error);
    return {
      scheduled: false,
      message: "Error checking scheduled notifications"
    };
  }
}

// MINIMAL configuration - NO AUTO-RESCHEDULING
export function configureNotifications() {
  console.log('🚀 Configuring notifications (minimal setup)');
  
  // Only add basic listeners - NO AUTO-RESCHEDULING
  const subscription = Notifications.addNotificationReceivedListener(notification => {
    console.log('📱 Notification received:', notification.request.content.title);
  });
  
  const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 Notification tapped:', response.notification.request.content.title);
  });
  
  return () => {
    Notifications.removeNotificationSubscription(subscription);
    Notifications.removeNotificationSubscription(responseSubscription);
  };
}