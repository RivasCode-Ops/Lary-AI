import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import NetInfo from '@react-native-community/netinfo';
import { ActivityIndicator, View, TouchableOpacity, Text, Alert } from 'react-native';
import { AuthProvider, useAuth } from './src/services/auth';

import LoginScreen from './src/screens/LoginScreen';
import ApontarScreen from './src/screens/ApontarScreen';
import IAProcessarScreen from './src/screens/IAProcessarScreen';
import RevisarScreen from './src/screens/RevisarScreen';
import PDFScreen from './src/screens/PDFScreen';
import ExportarScreen from './src/screens/ExportarScreen';
import SyncQueueScreen from './src/screens/SyncQueueScreen';

export type RootStackParamList = {
  Login: undefined;
  Apontar: undefined;
  IAProcessar: { rdoId: string; rawText: string };
  Revisar: { rdoId: string; fields: any[] };
  PDF: { rdoId: string; hash: string; auditTrail: any[] };
  Exportar: { rdoId: string };
  SyncQueue: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function LogoutButton() {
  const { logout, user } = useAuth();
  const label = user ? user.name_user.split(' ')[0] : '';
  return (
    <TouchableOpacity
      onPress={() =>
        Alert.alert('Sair', `Deseja realmente sair${label ? `, ${label}` : ''}?`, [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sair', style: 'destructive', onPress: logout },
        ])
      }
      style={{ marginRight: 8, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#ef4444' }}
    >
      <Text style={{ color: '#ef4444', fontSize: 13, fontWeight: '600' }}>Sair</Text>
    </TouchableOpacity>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected ?? false);
    });
    return () => unsubscribe();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0f172a' },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        {!isAuthenticated ? (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'LARY AI', headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen
              name="Apontar"
              component={ApontarScreen}
              options={{ title: 'LARY AI', headerRight: () => <LogoutButton /> }}
            />
            <Stack.Screen
              name="IAProcessar"
              component={IAProcessarScreen}
              options={{ title: 'IA Processando', headerRight: () => <LogoutButton /> }}
            />
            <Stack.Screen
              name="Revisar"
              component={RevisarScreen}
              options={{ title: 'Revisar RDO', headerRight: () => <LogoutButton /> }}
            />
            <Stack.Screen
              name="PDF"
              component={PDFScreen}
              options={{ title: 'RDO Gerado', headerRight: () => <LogoutButton /> }}
            />
            <Stack.Screen
              name="Exportar"
              component={ExportarScreen}
              options={{ title: 'Exportar', headerRight: () => <LogoutButton /> }}
            />
            <Stack.Screen
              name="SyncQueue"
              component={SyncQueueScreen}
              options={{ title: 'Sincronização', headerRight: () => <LogoutButton /> }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
