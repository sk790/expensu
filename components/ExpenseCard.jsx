import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/constants";

// Simple color palette for category icons
const CATEGORY_COLORS = [
  "#6C63FF", "#FF6584", "#43A047", "#FB8C00", "#00ACC1",
  "#8E24AA", "#E53935", "#1E88E5", "#F4511E", "#00897B",
];

const getCategoryColor = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return CATEGORY_COLORS[Math.abs(hash) % CATEGORY_COLORS.length];
};

const getInitials = (name = "") => name.substring(0, 2).toUpperCase();

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function ExpenseCard({ expense, onPress }) {
  const accentColor = getCategoryColor(expense.description);
  const perPerson = expense.amount / (expense.splitBetween?.length || 1);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

      <View style={styles.inner}>
        {/* Icon circle + Description + Amount */}
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: accentColor + "18" }]}>
            <Ionicons name="receipt-outline" size={20} color={accentColor} />
          </View>
          <View style={styles.descBlock}>
            <Text style={styles.description} numberOfLines={1}>{expense.description}</Text>
            {expense.createdAt && (
              <Text style={styles.dateText}>{formatDate(expense.createdAt)}</Text>
            )}
          </View>
          <View style={styles.amountBlock}>
            <Text style={styles.amount}>₹{Number(expense.amount).toFixed(2)}</Text>
            <Text style={styles.perPerson}>₹{perPerson.toFixed(2)}/person</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Bottom meta row */}
        <View style={styles.bottomRow}>
          <View style={styles.metaChip}>
            <View style={styles.payerAvatar}>
              <Text style={styles.payerAvatarText}>{getInitials(expense.paidBy?.name)}</Text>
            </View>
            <Text style={styles.metaText} numberOfLines={1}>
              {expense.paidBy?.name}
            </Text>
          </View>

          <View style={styles.splitChip}>
            <Ionicons name="people-outline" size={13} color={COLORS.primary} />
            <Text style={styles.splitText}>{expense.splitBetween?.length} people</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  inner: {
    flex: 1,
    padding: 14,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  descBlock: {
    flex: 1,
    marginRight: 10,
  },
  description: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 3,
  },
  dateText: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  amountBlock: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 2,
  },
  perPerson: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  payerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  payerAvatarText: {
    fontSize: 9,
    fontWeight: "800",
    color: COLORS.primary,
  },
  metaText: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  splitChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.primary + "10",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  splitText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
  },
});
