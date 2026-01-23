import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import ExpenseCard from "../../components/ExpenseCard";
import { COLORS } from "../../utils/constants";

export default function UserExpensesScreen({ route, navigation }) {
  const { member, expenses, groupId } = route.params;

  // Filter expenses paid by this member
  const userExpenses = expenses?.filter(
    (exp) => exp.paidBy._id === member._id
  ) || [];

  const totalPaid = userExpenses.reduce(
    (sum, exp) => sum + (exp.amount || 0),
    0
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* User Header Card */}
        {/* <View style={styles.headerCard}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {member.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{member.name}</Text>
            <Text style={styles.userEmail}>{member.email}</Text>
          </View>
        </View> */}

        {/* Summary Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Paid</Text>
            <Text style={styles.statValue}>₹{totalPaid.toFixed(2)}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Expenses Count</Text>
            <Text style={styles.statValue}>{userExpenses.length}</Text>
          </View>
        </View>

        {/* Expenses List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {userExpenses.length === 0
              ? "No Expenses"
              : `${userExpenses.length} Expense${userExpenses.length !== 1 ? "s" : ""}`}
          </Text>

          {userExpenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={50} color={COLORS.gray} />
              <Text style={styles.emptyText}>
                {member.name} hasn't paid any expenses yet
              </Text>
            </View>
          ) : (
            <View style={styles.expensesList}>
              {userExpenses.map((expense) => (
                <TouchableOpacity
                  key={expense._id}
                  onPress={() =>
                    navigation.navigate("ExpenseDetail", {
                      expense: expense,
                      groupId: groupId,
                    })
                  }
                >
                  <ExpenseCard expense={expense} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-back" size={24} color={COLORS.white} />
      </TouchableOpacity>
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
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.light,
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 5,
    borderLeftColor: COLORS.primary,
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: {
    color: COLORS.white,
    fontWeight: "bold",
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.dark,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.gray,
    marginTop: 4,
  },
  statsCard: {
    flexDirection: "row",
    backgroundColor: COLORS.light,
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "500",
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.gray,
    opacity: 0.3,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 15,
  },
  expensesList: {
    gap: 10,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 12,
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: COLORS.primary,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});
