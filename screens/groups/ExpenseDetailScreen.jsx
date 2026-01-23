import { useFocusEffect } from "@react-navigation/native";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

export default function ExpenseDetailScreen({ route, navigation }) {
  const { expense: initialExpense, groupId } = route.params;
  const [expense, setExpense] = React.useState(initialExpense);
  const [loading, setLoading] = React.useState(false);
  const [refreshing, setRefreshing] = React.useState(false);

  // Refetch expense data when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const refreshExpense = async () => {
        try {
          setRefreshing(true);
          const response = await groupService.getGroupExpenses(groupId);
          // Find the matching expense
          const updatedExpense = response.data.find(
            (exp) => exp._id === initialExpense._id,
          );
          if (updatedExpense) {
            setExpense(updatedExpense);
          }
        } catch (error) {
          console.log("Failed to refresh expense:", error);
        } finally {
          setRefreshing(false);
        }
      };

      refreshExpense();
    }, [groupId, initialExpense._id]),
  );

  const splitAmount = expense.amount / expense.splitBetween.length;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await groupService.deleteExpense(groupId, expense._id);
              Alert.alert("Success", "Expense deleted successfully");
              navigation.goBack();
            } catch (error) {
              Alert.alert("Error", "Failed to delete expense");
              console.log("Delete error:", error);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleEdit = () => {
    navigation.navigate("AddExpense", {
      groupId: groupId,
      members: expense.splitBetween,
      isEditing: true,
      expenseData: {
        id: expense._id,
        description: expense.description,
        amount: expense.amount,
        splitBetween: expense.splitBetween.map((m) => m._id),
        paidBy: expense.paidBy._id,
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {refreshing && (
        <View style={styles.refreshIndicator}>
          <ActivityIndicator size="small" color={COLORS.primary} />
        </View>
      )}
      <ScrollView style={styles.scrollView}>
        {/* Main Amount Card */}
        <View style={styles.amountCard}>
          <Text style={styles.descriptionText}>{expense.description}</Text>
          {/* <Icon name="receipt-long" size={40} color={COLORS.primary} /> */}
          <View style={styles.dateContainer}>
            <Icon name="calendar-today" size={14} color={COLORS.gray} />
            <Text style={styles.dateText}>{formatDate(expense.createdAt)}</Text>
          </View>
          <Text style={styles.amountText}>₹{expense.amount}</Text>
        </View>

        {/* Paid By Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="payment" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Paid By</Text>
          </View>
          <View style={styles.paidByCard}>
            <View style={styles.paidByContent}>
              <Text style={styles.paidByName}>{expense.paidBy.name}</Text>
              <Text style={styles.paidByEmail}>{expense.paidBy.email}</Text>
            </View>
            <Text style={styles.paidByAmount}>₹{expense.amount}</Text>
          </View>
        </View>

        {/* Split Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="payment" size={20} color={COLORS.primary} />
            <Text style={styles.sectionTitle}>Split Among</Text>
          </View>
          <View style={styles.membersContainer}>
            {expense.splitBetween.map((member, index) => (
              <View key={member._id || index} style={styles.memberSplitCard}>
                <View style={styles.memberSplitLeft}>
                  <View style={styles.memberAvatar}>
                    <Text style={styles.avatarText}>
                      {member.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.memberSplitInfo}>
                    <Text style={styles.memberSplitName}>{member.name}</Text>
                    <Text style={styles.memberSplitEmail}>{member.email}</Text>
                  </View>
                </View>
                <View style={styles.memberSplitRight}>
                  <Text style={styles.memberSplitAmount}>
                    ₹{splitAmount.toFixed(2)}
                  </Text>
                  {expense.paidBy._id === member._id && (
                    <View style={styles.paidBadge}>
                      <Text style={styles.paidBadgeText}>Paid</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Settlement Info */}
        {/* <View style={styles.section}>
          <View style={styles.settlementCard}>
            <Icon name="info" size={20} color={COLORS.primary} />
            <View style={styles.settlementContent}>
              {expense.paidBy._id !== expense.splitBetween[0]._id && (
                <>
                  <Text style={styles.settlementText}>
                    {expense.splitBetween.length - 1} people owe{" "}
                    {expense.paidBy.name}
                  </Text>
                  <Text style={styles.settlementAmount}>
                    ₹
                    {(splitAmount * (expense.splitBetween.length - 1)).toFixed(
                      2,
                    )}{" "}
                    total
                  </Text>
                </>
              )}
            </View>
          </View>
        </View> */}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.editButton]}
          onPress={handleEdit}
        >
          <Icon name="edit" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={handleDelete}
        >
          <Icon name="delete" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  refreshIndicator: {
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: COLORS.light,
  },
  amountCard: {
    backgroundColor: COLORS.light,
    borderRadius: 15,
    padding: 30,
    alignItems: "center",
    marginBottom: 30,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  amountText: {
    fontSize: 36,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 10,
  },
  descriptionText: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.gray,
    marginTop: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "500",
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  paidByCard: {
    flexDirection: "row",
    backgroundColor: COLORS.light,
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    justifyContent: "space-between",
  },
  paidByContent: {
    flex: 1,
  },
  paidByName: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  paidByEmail: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
  },
  paidByAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  splitInfo: {
    backgroundColor: COLORS.light,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  splitLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "500",
  },
  splitAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 5,
  },
  membersContainer: {
    gap: 10,
  },
  memberSplitCard: {
    flexDirection: "row",
    backgroundColor: COLORS.light,
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    justifyContent: "space-between",
  },
  memberSplitLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 16,
  },
  memberSplitInfo: {
    flex: 1,
  },
  memberSplitName: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
  },
  memberSplitEmail: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  memberSplitRight: {
    alignItems: "flex-end",
  },
  memberSplitAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  paidBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 4,
  },
  paidBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: "bold",
  },
  settlementCard: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    gap: 12,
  },
  settlementContent: {
    flex: 1,
  },
  settlementText: {
    fontSize: 13,
    color: COLORS.dark,
    fontWeight: "500",
  },
  settlementAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2E7D32",
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  actionContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.light,
    backgroundColor: COLORS.white,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  editButton: {
    backgroundColor: COLORS.secondary,
  },
  deleteButton: {
    backgroundColor: "#ff4444",
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
  },
});
