import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ExpenseCard from "../../components/ExpenseCard";
import { COLORS } from "../../utils/constants";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";

export default function UserExpensesScreen({ route, navigation }) {
  const { member, expenses, groupId } = route.params;

  const userExpenses = expenses?.filter((exp) => exp.paidBy._id === member._id) || [];
  const totalPaid = userExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
  const initials = member.name.substring(0, 2).toUpperCase();

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* Member Header */}
        <AnimatedView entering={FadeInDown.duration(400).delay(100)} style={styles.memberHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.memberName}>{member.name}</Text>
          <Text style={styles.memberEmail}>{member.email}</Text>
        </AnimatedView>

        {/* Stats */}
        <AnimatedView entering={FadeInDown.duration(400).delay(200)} style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹{totalPaid.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Paid</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userExpenses.length}</Text>
            <Text style={styles.statLabel}>Expenses</Text>
          </View>
        </AnimatedView>

        {/* Expenses List */}
        <AnimatedView entering={FadeInUp.duration(400).delay(300)}>
          <Text style={styles.sectionTitle}>
            {userExpenses.length === 0 ? "No Expenses" : `${userExpenses.length} Expense${userExpenses.length !== 1 ? "s" : ""} Paid`}
          </Text>

          {userExpenses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="receipt-outline" size={40} color={COLORS.gray} />
              </View>
              <Text style={styles.emptyTitle}>No expenses paid</Text>
              <Text style={styles.emptyText}>{member.name} hasn't paid any expenses in this group yet.</Text>
            </View>
          ) : (
            <View style={styles.expensesList}>
              {userExpenses.map((expense, index) => (
                <AnimatedView key={expense._id} entering={FadeInDown.duration(300).delay(index * 50)}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      navigation.navigate("ExpenseDetail", { expense, groupId });
                    }}
                  >
                    <ExpenseCard expense={expense} />
                  </TouchableOpacity>
                </AnimatedView>
              ))}
            </View>
          )}
        </AnimatedView>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F9FA" },
  content: { padding: 20 },
  memberHeader: { alignItems: "center", backgroundColor: COLORS.white, borderRadius: 24, padding: 28, marginBottom: 20, shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.06, shadowRadius: 16, elevation: 4 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORS.primary + '20', justifyContent: "center", alignItems: "center", marginBottom: 14 },
  avatarText: { fontSize: 26, fontWeight: "bold", color: COLORS.primary },
  memberName: { fontSize: 22, fontWeight: "bold", color: COLORS.dark, marginBottom: 4 },
  memberEmail: { fontSize: 14, color: COLORS.gray },
  statsCard: { flexDirection: "row", backgroundColor: COLORS.white, borderRadius: 18, padding: 20, marginBottom: 28, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12, elevation: 3, alignItems: "center" },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 24, fontWeight: "bold", color: COLORS.primary, marginBottom: 4 },
  statLabel: { fontSize: 13, color: COLORS.gray, fontWeight: "500" },
  statDivider: { width: 1, height: 44, backgroundColor: "#E0E0E0" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.dark, marginBottom: 16 },
  expensesList: { gap: 12 },
  emptyContainer: { alignItems: "center", backgroundColor: COLORS.white, borderRadius: 16, paddingVertical: 50, paddingHorizontal: 24, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#F5F5F5", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: COLORS.dark, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.gray, textAlign: "center", lineHeight: 22 },
});
