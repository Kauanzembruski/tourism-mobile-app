import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList, MainTabParamList } from '../types';
import { THEME } from '../constants/theme';

import { HomeScreen } from '../screens/HomeScreen';
import { MomentoScreen } from '../screens/MomentoScreen';
import { ListaScreen } from '../screens/ListaScreen';
import { DetalheScreen } from '../screens/DetalheScreen';
import { CidadesScreen } from '../screens/CidadesScreen';
import { FavoritosScreen } from '../screens/FavoritosScreen';
import { NoticiaDetalheScreen } from '../screens/NoticiaDetalheScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: THEME.colors.wineRed,
        tabBarInactiveTintColor: THEME.colors.gray,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Início',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MomentoTab"
        component={MomentoScreen}
        options={{
          tabBarLabel: 'No Momento',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive, { fontSize: 20 }]}>✨</Text>
          ),
        }}
      />
      <Tab.Screen
        name="BuscarTab"
        component={ListaScreen}
        options={{
          tabBarLabel: 'Buscar',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>🔍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="CidadesTab"
        component={CidadesScreen}
        options={{
          tabBarLabel: 'Cidades',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>📍</Text>
          ),
        }}
      />
      <Tab.Screen
        name="FavoritosTab"
        component={FavoritosScreen}
        options={{
          tabBarLabel: 'Salvos',
          tabBarIcon: ({ focused }) => (
            <Text style={[styles.tabIcon, focused && styles.tabIconActive]}>❤️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: THEME.colors.cream },
      }}
    >
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen 
        name="Detalhes" 
        component={DetalheScreen} 
        options={{
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="ListaPorCidade" 
        component={ListaScreen} 
        options={{
          headerShown: true,
          headerTitle: 'Estabelecimentos',
          headerStyle: { backgroundColor: THEME.colors.wineRed },
          headerTintColor: THEME.colors.white,
          headerTitleStyle: { fontWeight: '800' },
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="MomentoScreen" 
        component={MomentoScreen} 
        options={{
          headerShown: true,
          headerTitle: '✨ No Momento',
          headerStyle: { backgroundColor: THEME.colors.wineRed },
          headerTintColor: THEME.colors.white,
          headerTitleStyle: { fontWeight: '800' },
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen 
        name="NoticiaDetalhe" 
        component={NoticiaDetalheScreen} 
        options={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: THEME.colors.white,
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  tabIcon: {
    fontSize: 18,
    opacity: 0.7,
  },
  tabIconActive: {
    opacity: 1,
  },
});
