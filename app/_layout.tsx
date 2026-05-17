import React from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import MainTabNavigator from "../screens/MainTabNavigator";
import { createStackNavigator } from "@react-navigation/stack";
import { ActivityIndicator, View } from "react-native";

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

import { useEffect } from "react";
import { registerForPushNotificationsAsync } from "../utils/notifications";

export function AppNavigator() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (user) {
      console.log(user,'use');
      
      registerForPushNotificationsAsync();
    }
  }, [user]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{user ? <MainTabNavigator /> : <AuthStack />}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}
