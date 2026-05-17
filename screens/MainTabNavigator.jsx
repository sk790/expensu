import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS } from "../utils/constants";

// Import screens
import AddExpenseScreen from "./groups/AddExpenseScreen";
import AddMemberScreen from "./groups/AddMemberScreen";
import CreateGroupScreen from "./groups/CreateGroupScreen";
import ExpenseDetailScreen from "./groups/ExpenseDetailScreen";
import ExpenseHistoryScreen from "./groups/ExpenseHistoryScreen";
import GroupDetailsScreen from "./groups/GroupDetailsScreen";
import GroupMembersScreen from "./groups/GroupMembersScreen";
import GroupsListScreen from "./groups/GroupsListScreen";
import UserExpensesScreen from "./groups/UserExpensesScreen";
import HistoryScreen from "./groups/HistoryScreen";
import ProfileScreen from "./home/ProfileScreen";
import TermsOfServiceScreen from "./home/TermsOfServiceScreen";
import HelpCenterScreen from "./home/HelpCenterScreen";
import NotificationSettingsScreen from "./home/NotificationSettingsScreen";
import SecuritySettingsScreen from "./home/SecuritySettingsScreen";
import EditProfileScreen from "./home/EditProfileScreen";
import WalletScreen from "./home/WalletScreen";
import ReferAndEarnScreen from "./home/ReferAndEarnScreen";
import InvitationsScreen from "./home/InvitationsScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Shared gradient header background
const GradientHeader = () => (
  <LinearGradient
    colors={[COLORS.gradientStart, COLORS.gradientEnd]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{ flex: 1 }}
  />
);

const sharedStackOptions = {
  headerStyle: { backgroundColor: COLORS.gradientStart },
  headerBackground: () => <GradientHeader />,
  headerTintColor: "#FFFFFF",
  headerTitleStyle: { fontWeight: "700", fontSize: 18 },
  headerBackTitleVisible: false,
};

function GroupsStack() {
  return (
    <Stack.Navigator screenOptions={sharedStackOptions}>
      <Stack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="GroupDetails"
        component={GroupDetailsScreen}
        options={{ title: "Group Details" }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{ title: "Create Group" }}
      />
      <Stack.Screen
        name="AddExpense"
        component={AddExpenseScreen}
        options={{ title: "Add Expense" }}
      />
      <Stack.Screen
        name="AddMember"
        component={AddMemberScreen}
        options={{ title: "Add Member" }}
      />
      <Stack.Screen
        name="ExpenseHistory"
        component={ExpenseHistoryScreen}
        options={{ title: "Settlement" }}
      />
      <Stack.Screen
        name="ExpenseDetail"
        component={ExpenseDetailScreen}
        options={{ title: "Expense Details" }}
      />
      <Stack.Screen
        name="GroupMembers"
        component={GroupMembersScreen}
        options={{ title: "Group Members" }}
      />
      <Stack.Screen
        name="UserExpenses"
        component={UserExpensesScreen}
        options={{ title: "User Expenses" }}
      />
      <Stack.Screen
        name="Invitations"
        component={InvitationsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={sharedStackOptions}>
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationSettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Security"
        component={SecuritySettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Wallet"
        component={WalletScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ReferAndEarn"
        component={ReferAndEarnScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}

export default function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 58 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Groups: focused ? "people" : "people-outline",
            History: focused ? "receipt" : "receipt-outline",
            Profile: focused ? "person" : "person-outline",
          };
          return (
            <Ionicons
              name={icons[route.name] || "ellipse"}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: "#9CA3AF",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 12,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "700",
          letterSpacing: 0.3,
        },
      })}
    >
      <Tab.Screen name="Groups" component={GroupsStack} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
