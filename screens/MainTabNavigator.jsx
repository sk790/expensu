import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
import { COLORS } from "../utils/constants";

// Import screens
import AddExpenseScreen from "./groups/AddExpenseScreen";
import AddMemberScreen from "./groups/AddMemberScreen";
import CreateGroupScreen from "./groups/CreateGroupScreen";
import ExpenseHistoryScreen from "./groups/ExpenseHistoryScreen";
import GroupDetailsScreen from "./groups/GroupDetailsScreen";
import GroupsListScreen from "./groups/GroupsListScreen";
import Home from "./home/Home";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function GroupsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="GroupsList"
        component={GroupsListScreen}
        options={{ title: "My Groups" }}
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
    </Stack.Navigator>
  );
}
function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Profile"
        component={Home}
        options={{ title: "Home" }}
      />
    </Stack.Navigator>
  );
}

export default function MainTabNavigator() {
  const a = true;
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === "Groups") {
            iconName = "group";
          }
          if (route.name === "Home") {
            iconName = "home";
          }
          if (route.name === "Profile") {
            iconName = "logo";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        headerShown: false,
      })}
    >
      {a && <Tab.Screen name="Groups" component={GroupsStack} />}

      <Tab.Screen name="Home" component={HomeStack} />
    </Tab.Navigator>
  );
}
