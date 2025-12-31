import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Network from 'expo-network';
import { Ionicons } from '@expo/vector-icons';

const NetworkStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check network status initially
    const checkNetworkStatus = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setIsConnected(networkState.isConnected);
        setVisible(!networkState.isConnected);
      } catch (error) {
        console.log('Error checking network status:', error);
        // Assume connected in case of error
        setIsConnected(true);
        setVisible(false);
      }
    };
    
    checkNetworkStatus();
    
    // Set up interval to check network status every 5 seconds
    const interval = setInterval(async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        
        if (networkState.isConnected !== isConnected) {
          setIsConnected(networkState.isConnected);
          
          if (!networkState.isConnected) {
            setVisible(true);
          } else {
            // Hide after 3 seconds when connection is restored
            setTimeout(() => {
              setVisible(false);
            }, 3000);
          }
        }
      } catch (error) {
        console.log('Error checking network status:', error);
      }
    }, 5000);
    
    return () => {
      clearInterval(interval);
    };
  }, [isConnected]);

  if (!visible) return null;

  return (
    <View style={[styles.container, isConnected ? styles.online : styles.offline]}>
      <Ionicons 
        name={isConnected ? "wifi" : "wifi-outline"} 
        size={16} 
        color={isConnected ? '#fff' : '#fff'} 
      />
      <Text style={styles.text}>
        {isConnected ? 'Back online' : 'You are offline. Using local data.'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  offline: {
    backgroundColor: '#e74c3c',
  },
  online: {
    backgroundColor: '#27ae60',
  },
  text: {
    color: '#fff',
    marginLeft: 6,
    fontWeight: '500',
    fontSize: 14,
  }
});

export default NetworkStatus;
