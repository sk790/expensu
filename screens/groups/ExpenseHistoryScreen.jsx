import { Ionicons } from "@expo/vector-icons";
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
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import BalanceCard from "../../components/BalanceCard";
import { groupService } from "../../services/authService";
import { COLORS } from "../../utils/constants";

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

export default function ExpenseHistoryScreen({ route }) {
  const { groupId, groupName } = route.params;
  const [balances, setBalances] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchGroupBalances = async () => {
    try {
      const response = await groupService.getGroupBalances(groupId);
      setBalances(response.data || response);
    } catch (error) {
      Alert.alert("Error", "Failed to load settlement details");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupExpenses = async () => {
    try {
      const response = await groupService.getGroupExpenses(groupId);
      setExpenses(response.data || response);
    } catch (error) {
      console.log("Failed to fetch expenses:", error);
    }
  };

  const fetchGroupDetails = async () => {
    try {
      const response = await groupService.getGroup(groupId);
      if (response.data) {
        setGroup(response.data);
      }
    } catch (error) {
      console.log("Failed to fetch group details in ExpenseHistoryScreen:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchGroupBalances();
      fetchGroupExpenses();
      fetchGroupDetails();
    }, [groupId]),
  );

  const currencySymbol = CURRENCY_SYMBOLS[group?.currency] || "₹";

  const totalExpense = expenses.reduce(
    (sum, expense) => sum + (expense.amount || 0),
    0,
  );
  const expensesByPayer = {};
  expenses.forEach((expense) => {
    const payerName = expense.paidBy?.name || "Unknown";
    expensesByPayer[payerName] =
      (expensesByPayer[payerName] || 0) + (expense.amount || 0);
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
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {/* Hero Card */}
      <AnimatedView
        entering={FadeInDown.duration(400).delay(100)}
        style={styles.heroCard}
      >
        <View style={styles.heroIconRow}>
          <Ionicons name="analytics-outline" size={28} color={COLORS.white} />
        </View>
        <Text style={styles.heroGroupName}>{groupName}</Text>
        <Text style={styles.heroLabel}>Total Group Spending</Text>
        <Text style={styles.heroAmount}>{currencySymbol}{totalExpense.toFixed(2)}</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>{expenses.length}</Text>
            <Text style={styles.heroStatLabel}>Expenses</Text>
          </View>
          <View style={styles.heroStatDivider} />
          <View style={styles.heroStatItem}>
            <Text style={styles.heroStatValue}>{payersArray.length}</Text>
            <Text style={styles.heroStatLabel}>Payers</Text>
          </View>
        </View>
      </AnimatedView>

      {/* Who Paid What */}
      <AnimatedView
        entering={FadeInDown.duration(400).delay(200)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Who Paid What</Text>
        {payersArray.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="receipt-outline" size={40} color={COLORS.gray} />
            <Text style={styles.emptyText}>No expenses recorded yet</Text>
          </View>
        ) : (
          <View style={styles.payersList}>
            {payersArray.map((payer, index) => (
              <AnimatedView
                key={index}
                entering={FadeInDown.duration(300).delay(100 + index * 50)}
                style={styles.payerCard}
              >
                <View style={styles.payerAvatar}>
                  <Text style={styles.payerAvatarText}>
                    {payer.name.substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.payerName}>{payer.name}</Text>
                <Text style={styles.payerAmount}>
                  {currencySymbol}{payer.amount.toFixed(2)}
                </Text>
              </AnimatedView>
            ))}
          </View>
        )}
      </AnimatedView>

      {/* Member Balances */}
      <AnimatedView
        entering={FadeInDown.duration(400).delay(300)}
        style={styles.section}
      >
        <Text style={styles.sectionTitle}>Member Balances</Text>
        {!balances.balances || balances.balances.length === 0 ? (
          <View style={styles.settledCard}>
            <View style={styles.settledIcon}>
              <Ionicons
                name="checkmark-circle"
                size={40}
                color={COLORS.success}
              />
            </View>
            <Text style={styles.settledTitle}>All Settled Up!</Text>
            <Text style={styles.settledSubtext}>No one owes anyone money</Text>
          </View>
        ) : (
          balances.balances.map((balance) => (
            <BalanceCard
              key={balance._id || balance.userId}
              balance={balance}
              currency={group?.currency}
            />
          ))
        )}
      </AnimatedView>

      {/* Info Card */}
      <AnimatedView
        entering={FadeInUp.duration(400).delay(400)}
        style={styles.infoCard}
      >
        <Ionicons
          name="information-circle-outline"
          size={22}
          color={COLORS.primary}
        />
        <View style={styles.infoTextBlock}>
          <Text style={styles.infoTitle}>How it works</Text>
          <Text style={styles.infoDescription}>
            {
              "• Positive balance: Member is owed money\n• Negative balance: Member owes others\n• Settled up: All expenses divided equally"
            }
          </Text>
        </View>
      </AnimatedView>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  content: { padding: 20 },
  heroCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  heroIconRow: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  heroGroupName: {
    fontSize: 18,
    fontWeight: "600",
    color: "rgba(255,255,255,0.85)",
    marginBottom: 6,
  },
  heroLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  heroAmount: {
    fontSize: 44,
    fontWeight: "bold",
    color: COLORS.white,
    marginBottom: 20,
  },
  heroStats: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    justifyContent: "space-around",
  },
  heroStatItem: { alignItems: "center" },
  heroStatValue: { fontSize: 22, fontWeight: "bold", color: COLORS.white },
  heroStatLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  heroStatDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.3)" },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 14,
  },
  payersList: { gap: 12 },
  payerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  payerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  payerAvatarText: { fontSize: 14, fontWeight: "bold", color: COLORS.primary },
  payerName: { flex: 1, fontSize: 16, fontWeight: "600", color: COLORS.dark },
  payerAmount: { fontSize: 18, fontWeight: "bold", color: COLORS.primary },
  emptyCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: { fontSize: 15, color: COLORS.gray, marginTop: 12 },
  settledCard: {
    alignItems: "center",
    backgroundColor: COLORS.white,
    borderRadius: 16,
    paddingVertical: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  settledIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.success + "15",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  settledTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.success,
    marginBottom: 6,
  },
  settledSubtext: { fontSize: 14, color: COLORS.gray },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.primary + "10",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
    gap: 12,
  },
  infoTextBlock: { flex: 1 },
  infoTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 6,
  },
  infoDescription: { fontSize: 13, color: COLORS.gray, lineHeight: 22 },
});
