import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { FavoritesProvider } from './src/context/FavoritesContext';
import { LocationProvider } from './src/context/LocationContext';
import { RoteiroProvider } from './src/context/RoteiroContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <LocationProvider>
        <FavoritesProvider>
          <RoteiroProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <AppNavigator />
            </NavigationContainer>
          </RoteiroProvider>
        </FavoritesProvider>
      </LocationProvider>
    </SafeAreaProvider>
  );
}
