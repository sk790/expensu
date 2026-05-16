import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { COLORS } from "../utils/constants";

// Deterministic gradient-like accent from group name
const GROUP_ACCENTS = [
  { bg: "#6C63FF", light: "#EEF0FF" },
  { bg: "#FF6B6B", light: "#FFF0F0" },
  { bg: "#FFB347", light: "#FFF8EE" },
  { bg: "#43C6AC", light: "#EDFAF6" },
  { bg: "#4158D0", light: "#EEEFFF" },
  { bg: "#F093FB", light: "#FDF0FF" },
  { bg: "#0BA360", light: "#E8FFF4" },
  { bg: "#F7971E", light: "#FFF7E8" },
];

function getAccent(name = "") {
  const idx = name.charCodeAt(0) % GROUP_ACCENTS.length;
  return GROUP_ACCENTS[idx];
}

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export default function GroupCard({ group, onPress }) {
  const accent = getAccent(group.name);
  const initials = getInitials(group.name);
  const memberCount = group.members?.length ?? 0;
  const expenseCount = group.expenseCount ?? 0;
  const totalExpense = group.totalExpense ?? 0;

  // Show up to 3 member avatar bubbles
  const previewMembers = (group.members ?? []).slice(0, 3);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Dynamic Accent Header */}
      <View style={[styles.cardHeader, { backgroundColor: accent.light }]}>
        <View style={[styles.avatarCircle, { backgroundColor: accent.bg }]}>
          <Text style={styles.avatarInitials}>{initials}</Text>
        </View>
        <View style={styles.amountBadge}>
          <Text style={[styles.amountLabel, { color: accent.bg }]}>Total Spent</Text>
          <Text style={[styles.amountValue, { color: accent.bg }]}>₹{totalExpense.toFixed(0)}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {/* Main Info */}
        <View style={styles.mainInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {group.name}
          </Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={14} color={COLORS.gray} />
              <Text style={styles.statText}>{memberCount} members</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statItem}>
              <Ionicons name="receipt-outline" size={14} color={COLORS.gray} />
              <Text style={styles.statText}>{expenseCount} bills</Text>
            </View>
          </View>
        </View>

        {/* Member Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.avatarStack}>
            {previewMembers.map((m, i) => {
              const memberInitial = (m.name ?? m.email ?? "?")[0].toUpperCase();
              const memberAccent = getAccent(m.name ?? m.email ?? "");
              return (
                <View
                  key={m._id ?? i}
                  style={[
                    styles.memberBubble,
                    {
                      backgroundColor: memberAccent.bg,
                      marginLeft: i === 0 ? 0 : -10,
                      zIndex: 10 - i,
                    },
                  ]}
                >
                  <Text style={styles.memberInitial}>{memberInitial}</Text>
                </View>
              );
            })}
            {memberCount > 3 && (
              <View style={[styles.memberBubble, styles.moreBubble, { marginLeft: -10, zIndex: 0 }]}>
                <Text style={styles.moreText}>+{memberCount - 3}</Text>
              </View>
            )}
          </View>

          <View style={[styles.chevronWrap, { backgroundColor: accent.bg + "15" }]}>
            <Ionicons name="chevron-forward" size={16} color={accent.bg} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 16,
    marginVertical: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 15,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingBottom: 12,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarInitials: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  amountBadge: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    opacity: 0.7,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: "800",
  },
  cardBody: {
    padding: 16,
    paddingTop: 8,
  },
  mainInfo: {
    marginBottom: 16,
  },
  name: {
    fontSize: 19,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 13,
    color: COLORS.gray,
    fontWeight: "600",
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
    paddingTop: 14,
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  memberInitial: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  moreBubble: {
    backgroundColor: "#F3F4F6",
  },
  moreText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },
  chevronWrap: {
    width: 32,
    height: 32,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});
