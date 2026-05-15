import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../utils/constants";

const getInitials = (name = "") => name.substring(0, 2).toUpperCase();

const AVATAR_COLORS = [
  "#6C63FF", "#FF6584", "#43A047", "#FB8C00",
  "#00ACC1", "#8E24AA", "#E53935", "#1E88E5",
];
const getAvatarColor = (name = "") => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function GroupSummaryCard({ group, totalExpenses, onAddMember, onPress }) {
  const members = group?.members || [];
  const memberCount = members.length;
  const MAX_VISIBLE = 5;
  const visibleMembers = members.slice(0, MAX_VISIBLE);
  const overflow = memberCount - MAX_VISIBLE;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Group name + manage row */}
      <View style={styles.topRow}>
        <View style={styles.groupIconBox}>
          <Ionicons name="people" size={22} color={COLORS.primary} />
        </View>
        <View style={styles.groupTitleBlock}>
          <Text style={styles.groupName} numberOfLines={1}>{group?.name || "Group"}</Text>
          <Text style={styles.groupSubtitle}>Tap to manage members</Text>
        </View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color="#C0C0C0" />
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>₹{totalExpenses.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{memberCount}</Text>
          <Text style={styles.statLabel}>Members</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {memberCount > 0 ? `₹${(totalExpenses / memberCount).toFixed(0)}` : "₹0"}
          </Text>
          <Text style={styles.statLabel}>Per Person</Text>
        </View>
      </View>

      {/* Member avatars + Add button */}
      <View style={styles.membersRow}>
        <View style={styles.avatarStack}>
          {visibleMembers.map((member, i) => {
            const color = getAvatarColor(member.name);
            return (
              <View
                key={member._id || i}
                style={[
                  styles.memberAvatar,
                  { backgroundColor: color + "25", borderColor: "#FFFFFF", marginLeft: i === 0 ? 0 : -10 },
                ]}
              >
                <Text style={[styles.memberAvatarText, { color }]}>
                  {getInitials(member.name)}
                </Text>
              </View>
            );
          })}
          {overflow > 0 && (
            <View style={[styles.memberAvatar, styles.overflowAvatar, { marginLeft: -10 }]}>
              <Text style={styles.overflowText}>+{overflow}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={onAddMember} activeOpacity={0.8}>
          <Ionicons name="person-add-outline" size={15} color={COLORS.white} />
          <Text style={styles.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  groupIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: COLORS.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  groupTitleBlock: { flex: 1 },
  groupName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1A1A2E",
    marginBottom: 2,
  },
  groupSubtitle: {
    fontSize: 12,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  chevron: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginBottom: 18,
  },
  statBox: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: COLORS.dark,
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  statDivider: { width: 1, height: 32, backgroundColor: "#E5E7EB" },

  // Members
  membersRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarText: {
    fontSize: 11,
    fontWeight: "800",
  },
  overflowAvatar: {
    backgroundColor: "#E5E7EB",
  },
  overflowText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#6B7280",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
