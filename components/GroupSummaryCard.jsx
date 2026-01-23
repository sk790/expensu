import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { COLORS } from "../utils/constants";

export default function GroupSummaryCard({
  group,
  totalExpenses,
  onAddMember,
  onPress,
}) {
  const memberNames = group?.members?.map((member) => member.name).join(", ");

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.headerRow}>
        <View style={styles.expenseSection}>
          <Icon name="receipt-long" size={24} color={COLORS.primary} />
          <View style={styles.expenseContent}>
            <Text style={styles.label}>Total Expenses</Text>
            <Text style={styles.amount}>₹{totalExpenses.toFixed(2)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.membersSection}>
        <View style={styles.memberHeaderRow}>
          <View style={styles.memberHeader}>
            <Icon name="group" size={20} color={COLORS.primary} />
            <Text style={styles.membersLabel}>
              Members ({group?.members?.length || 0})
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddMember}
            activeOpacity={0.7}
          >
            <Icon name="person-add" size={18} color={COLORS.white} />
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.memberNames} numberOfLines={3}>
          {memberNames}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expenseSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  expenseContent: {
    marginLeft: 12,
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "500",
  },
  amount: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.light,
    marginVertical: 15,
  },
  membersSection: {
    marginTop: 5,
  },
  memberHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  memberHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  membersLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.dark,
    marginLeft: 8,
  },
  memberNames: {
    fontSize: 13,
    color: COLORS.gray,
    lineHeight: 18,
    marginLeft: 28,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "bold",
  },
});
