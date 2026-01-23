import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useLayoutEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ExpenseCard from "../../components/ExpenseCard";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

export default function GroupDetailScreen({ route, navigation }) {
  const { groupId } = route.params;
  const [group, setGroup] = useState();
  const [expenses, setExpenses] = useState([]);
  const [inviteLink, setInviteLink] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchGroupDetails = async () => {
    try {
      const response = await groupService.getGroup(groupId);
      console.log(response, "red");

      setGroup(response.data);
      setInviteLink(response.inviteLink);
    } catch (error) {
      Alert.alert("Error", "Failed to load group details");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const fetchExpenses = async () => {
    try {
      const response = await groupService.getGroupExpenses(groupId);
      setExpenses(response.data);
    } catch (error) {
      console.log("Failed to fetch expenses:", error);
    }
  };
  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails();
      fetchExpenses();
    }, [groupId])
  );

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: group?.name || "Group Details",
    });
  }, [navigation, group?.name]);
  const shareInviteLink = async () => {
    try {
      await Share.share({
        message: `Join my group "${group.name}" on ExpenseSplitter!\n\n${inviteLink}`,
        title: `Join ${group.name}`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const copyInviteLink = () => {
    Alert.alert("Copied!", "Invite link copied to clipboard");
  };

  const regenerateInviteCode = async () => {
    Alert.alert(
      "Regenerate Invite Link",
      "This will invalidate the old invite link. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Regenerate",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await groupService.regenerateInviteCode(groupId);
              setInviteLink(response.inviteLink);
              Alert.alert("Success", "New invite link generated");
            } catch (error) {
              Alert.alert("Error", "Failed to regenerate invite link");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.containerWrapper}>
      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Members ({group?.members?.length || 0})
            </Text>
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={() =>
                  navigation.navigate("AddMember", {
                    groupId: groupId,
                    currentMembers: group?.members || [],
                  })
                }
              >
                <Text style={styles.addMemberButtonText}>+ Member</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.settleButton}
                onPress={() =>
                  navigation.navigate("ExpenseHistory", {
                    groupId: groupId,
                    groupName: group?.name,
                  })
                }
              >
                <Text style={styles.settleButtonText}>Settlement</Text>
              </TouchableOpacity>
            </View>
          </View>
          {group &&
            group?.members?.length > 0 &&
            group?.members?.map((member) => (
              <View key={member._id} style={styles.memberItem}>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
            ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Invite Link</Text>
          <View style={styles.inviteContainer}>
            <Text style={styles.inviteLink} numberOfLines={1}>
              {inviteLink}
            </Text>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.buttonSecondary]}
              onPress={copyInviteLink}
            >
              <Text style={styles.buttonSecondaryText}>Copy Link</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={shareInviteLink}
            >
              <Text style={styles.buttonText}>Share Link</Text>
            </TouchableOpacity>
          </View>

          {group?.createdBy?._id === group?.members[0]?._id && (
            <TouchableOpacity
              style={[styles.button, styles.buttonDanger]}
              onPress={regenerateInviteCode}
            >
              <Text style={styles.buttonText}>Regenerate Invite Link</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Expenses</Text>
          {expenses.length === 0 ? (
            <View style={styles.emptyExpenses}>
              <Icon name="receipt" size={40} color={COLORS.gray} />
              <Text style={styles.emptyExpensesText}>No expenses yet</Text>
            </View>
          ) : (
            expenses?.map((expense) => (
              <ExpenseCard key={expense._id} expense={expense} />
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.floatingButton}
        onPress={() =>
          navigation.navigate("AddExpense", {
            groupId: groupId,
            members: group?.members || [],
          })
        }
      >
        <Icon name="add" size={28} color={COLORS.white} />
        {/* <Text style={styles.floatingButtonText}>Expense</Text> */}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    flex: 1,
    position: "relative",
    backgroundColor: COLORS.white,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  section: {
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 0,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  addExpenseButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addExpenseButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  addMemberButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addMemberButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
  settleButton: {
    backgroundColor: COLORS.success,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
  },
  settleButtonText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  groupName: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  memberItem: {
    padding: 15,
    backgroundColor: COLORS.light,
    borderRadius: 8,
    marginBottom: 10,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  memberEmail: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
  },
  inviteContainer: {
    padding: 15,
    backgroundColor: COLORS.light,
    borderRadius: 8,
    marginBottom: 15,
  },
  inviteLink: {
    fontSize: 14,
    color: COLORS.dark,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  buttonDanger: {
    backgroundColor: "#ff4444",
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  buttonSecondaryText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyExpenses: {
    alignItems: "center",
    paddingVertical: 30,
  },
  emptyExpensesText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 10,
  },
  floatingButton: {
    position: "absolute",
    bottom: 30,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    paddingBottom: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  floatingButtonText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "bold",
  },
});
