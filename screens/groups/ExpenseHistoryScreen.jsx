import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import BalanceCard from "../../components/BalanceCard";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

export default function ExpenseHistoryScreen({ route }) {
  const { groupId, groupName } = route.params;
  const [balances, setBalances] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchGroupBalances = async () => {
    try {
      const response = await groupService.getGroupBalances(groupId);
      setBalances(response.data || response);
    } catch (error) {
      console.log("Failed to fetch balances:", error);
      Alert.alert("Error", "Failed to load settlement details");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupExpenses = async () => {
    try {
      const response = await groupService.getGroupExpenses(groupId);
      console.log(response.data, "resss");

      setExpenses(response.data || response);
    } catch (error) {
      console.log("Failed to fetch expenses:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroupBalances();
      fetchGroupExpenses();
    }, [groupId])
  );

  // Calculate total expense
  const totalExpense = expenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0
  );

  // Group expenses by who paid
  const expensesByPayer = {};
  expenses.forEach((expense) => {
    const payerName = expense.paidBy?.name || "Unknown";
    if (!expensesByPayer[payerName]) {
      expensesByPayer[payerName] = 0;
    }
    expensesByPayer[payerName] += expense.amount || 0;
  });

  const payersArray = Object.entries(expensesByPayer).map(([name, amount]) => ({
    name,
    amount,
  }));

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>{groupName}</Text>
        <Text style={styles.subtitle}>Settlement & Expenses</Text>
      </View>

      {/* Total Expense Section */}
      <View style={styles.totalExpenseCard}>
        <Icon name="receipt" size={40} color={COLORS.primary} />
        <View style={styles.totalExpenseContent}>
          <Text style={styles.totalExpenseLabel}>Total Expense</Text>
          <Text style={styles.totalExpenseAmount}>
            ₹{totalExpense.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Who Paid What Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Who Paid What</Text>
        {payersArray.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="receipt-long" size={40} color={COLORS.gray} />
            <Text style={styles.emptyStateText}>No expenses yet</Text>
          </View>
        ) : (
          payersArray.map((payer, index) => (
            <View key={index} style={styles.payerCard}>
              <View style={styles.payerInfo}>
                <View style={styles.payerAvatar}>
                  <Text style={styles.payerAvatarText}>
                    {payer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.payerName}>{payer.name}</Text>
              </View>
              <Text style={styles.payerAmount}>₹{payer.amount.toFixed(2)}</Text>
            </View>
          ))
        )}
      </View>

      {/* Member Balances Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Member Balances</Text>
        {balances.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="check-circle" size={50} color={COLORS.success} />
            <Text style={styles.emptyStateText}>All settled up!</Text>
            <Text style={styles.emptyStateSubtext}>
              No one owes anyone money
            </Text>
          </View>
        ) : (
          balances.balances.map((balance) => (
            <BalanceCard
              key={balance._id || balance.userId}
              balance={balance}
            />
          ))
        )}
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoBox}>
          <Icon name="info" size={24} color={COLORS.primary} />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>How it works:</Text>
            <Text style={styles.infoDescription}>
              • Positive balance: Member paid more, others owe them{"\n"}•
              Negative balance: Member owes others{"\n"}• Settled up: All
              expenses are divided equally
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  headerSection: {
    backgroundColor: COLORS.primary,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  totalExpenseCard: {
    margin: 20,
    padding: 20,
    backgroundColor: COLORS.light,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  totalExpenseContent: {
    flex: 1,
    marginLeft: 15,
  },
  totalExpenseLabel: {
    fontSize: 14,
    color: COLORS.gray,
    marginBottom: 5,
  },
  totalExpenseAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 15,
  },
  payerCard: {
    backgroundColor: COLORS.white,
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.light,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  payerInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  payerAvatar: {
    width: 45,
    height: 45,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  payerAvatarText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  payerName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.dark,
  },
  payerAmount: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.success,
    marginTop: 15,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 5,
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  infoBox: {
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoText: {
    flex: 1,
    marginLeft: 15,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 5,
  },
  infoDescription: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 20,
  },
});
