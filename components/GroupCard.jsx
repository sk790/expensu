import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { COLORS } from "../utils/constants";

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

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
      <View style={styles.cardContent}>
        {/* Top Info Row */}
        <View style={styles.topInfoRow}>
          {/* Group Avatar Squircle */}
          <View style={[styles.avatarCircle, { backgroundColor: accent.bg }]}>
            <Text style={styles.avatarInitials}>{initials}</Text>
          </View>
          
          {/* Title & Admin Block */}
          <View style={styles.nameBlock}>
            <Text style={styles.name} numberOfLines={1}>
              {group.name}
            </Text>
            <View style={styles.adminRow}>
              <Ionicons name="shield-checkmark" size={11} color={accent.bg} />
              <Text style={[styles.adminText, { color: accent.bg }]} numberOfLines={1}>
                Admin: {group.createdBy?.name || "Unknown"}
              </Text>
            </View>
          </View>

          {/* Amount Spent Badge */}
          <View style={styles.amountBadge}>
            <Text style={styles.amountLabel}>Total Spent</Text>
            <Text style={[styles.amountValue, { color: accent.bg }]}>
              {CURRENCY_SYMBOLS[group.currency] || "₹"}{totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </Text>
          </View>
        </View>

        {/* Dynamic Divider */}
        <View style={styles.divider} />

        {/* Bottom Metadata Footer */}
        <View style={styles.cardFooter}>
          {/* Overlapping Members Stack */}
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
                      marginLeft: i === 0 ? 0 : -8,
                      zIndex: 10 - i,
                    },
                  ]}
                >
                  {m.avatar ? (
                    <Image source={{ uri: m.avatar }} style={styles.memberAvatarImage} />
                  ) : (
                    <Text style={styles.memberInitial}>{memberInitial}</Text>
                  )}
                </View>
              );
            })}
            {memberCount > 3 && (
              <View style={[styles.memberBubble, styles.moreBubble, { marginLeft: -8, zIndex: 0 }]}>
                <Text style={styles.moreText}>+{memberCount - 3}</Text>
              </View>
            )}
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Members & Bills Count Badges */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="people-outline" size={13} color={COLORS.gray} />
              <Text style={styles.statText}>{memberCount} members</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statItem}>
              <Ionicons name="receipt-outline" size={13} color={COLORS.gray} />
              <Text style={styles.statText}>{expenseCount} bills</Text>
            </View>
          </View>

          {/* Sleek action arrow wrapper */}
          <View style={[styles.chevronWrap, { backgroundColor: accent.bg + "10" }]}>
            <Ionicons name="chevron-forward" size={14} color={accent.bg} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardContent: {
    padding: 16,
  },
  topInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarInitials: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  nameBlock: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.dark,
    marginBottom: 3,
  },
  adminRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  adminText: {
    fontSize: 11,
    fontWeight: "600",
  },
  amountBadge: {
    alignItems: "flex-end",
  },
  amountLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.gray,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 17,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  memberInitial: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  memberAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 11,
  },
  moreBubble: {
    backgroundColor: "#F3F4F6",
    borderColor: "#FFFFFF",
  },
  moreText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6B7280",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 10,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "700",
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#D1D5DB",
  },
  chevronWrap: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
});
