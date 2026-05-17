import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { userService } from "../services/authService";
import Constants from "expo-constants";

export async function registerForPushNotificationsAsync() {
  let token;

  // Remote notifications are NOT supported in Expo Go as of SDK 53 on Android.
  // We check if we are in Expo Go to avoid the crash.
  const isExpoGo = Constants.appOwnership === "expo";

  // if (isExpoGo && Platform.OS === "android") {
  //   console.warn(
  //     "Push Notifications are not supported in Expo Go on Android (SDK 53+). Please use a Development Build.",
  //   );
  //   return null;
  // }

  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Failed to get push token for push notification!");
      return;
    }

    try {
      let projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) {
        projectId = "f613e1c8-a400-4963-83f6-e305a1dcf3b1";
      }
      token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      console.log("Push Token Generated Successfully:", token);

      // Save token to backend
      if (token) {
        await userService.savePushToken(token);
        console.log("Push Token saved to backend successfully!");
      }
    } catch (error) {
      console.warn("Notification Error during registration:", error.message);
    }
  } else {
    console.log("Must use physical device for Push Notifications");
  }
  console.log(token,'token');
  

  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  return token;
}

// Set how notifications are handled when the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
