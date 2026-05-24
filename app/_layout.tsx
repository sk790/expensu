import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import MainTabNavigator from "../screens/MainTabNavigator";
import { createStackNavigator } from "@react-navigation/stack";
import SplashScreen from "../components/SplashScreen";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import * as ExpoSplashScreen from "expo-splash-screen";
import { Provider } from "react-redux";
import { store } from "../store";

// Keep native splash screen visible until we manually hide it
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

export function AppNavigator() {
  const { user, loading } = useAuth();
  const [splashFinished, setSplashFinished] = useState(false);

  useEffect(() => {
    // Dismiss the default native splash screen immediately so our custom one takes over
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    if (user) {
      registerForPushNotificationsAsync();
    }
  }, [user]);

  if (!splashFinished) {
    return (
      <SplashScreen
        loading={loading}
        onFinish={() => setSplashFinished(true)}
      />
    );
  }

  return <>{user ? <MainTabNavigator /> : <AuthStack />}</>;
}

export default function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </Provider>
  );
}
