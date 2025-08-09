import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import TicketDetailsScreen from './src/screens/TicketDetailsScreen';
import CreateTicketScreen from './src/screens/CreateTicketScreen';
import MarketplaceScreen from './src/screens/MarketplaceScreen';

// Import providers
import { AuthProvider } from './src/contexts/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
        <NavigationContainer>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack.Navigator initialRouteName="Login">
            <Stack.Screen 
              name="Login" 
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen}
              options={{ title: 'Maintenance Dashboard' }}
            />
            <Stack.Screen 
              name="TicketDetails" 
              component={TicketDetailsScreen}
              options={{ title: 'Ticket Details' }}
            />
            <Stack.Screen 
              name="CreateTicket" 
              component={CreateTicketScreen}
              options={{ title: 'Create Ticket' }}
            />
            <Stack.Screen 
              name="Marketplace" 
              component={MarketplaceScreen}
              options={{ title: 'Marketplace' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </AuthProvider>
    </PaperProvider>
  );
}