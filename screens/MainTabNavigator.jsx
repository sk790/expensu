import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import React from "react";
import Icon from "react-native-vector-icons/MaterialIcons";
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
import ProfileScreen from "./home/ProfileScreen";

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
    </Stack.Navigator>
  );
}
function ProfileStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: "Profile", headerShown: false }}
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
          if (route.name === "Profile") {
            iconName = "person";
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        headerShown: false,
      })}
    >
      {a && <Tab.Screen name="Groups" component={GroupsStack} />}

      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
