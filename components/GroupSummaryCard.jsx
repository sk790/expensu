import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SHADOWS } from "../utils/constants";

const CURRENCY_SYMBOLS = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CAD: "C$",
  AUD: "A$",
};

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

export default function GroupSummaryCard({ group, totalExpenses, onAddMember, onPress, isAdmin }) {
  const members = group?.members || [];
  const memberCount = members.length;
  const MAX_VISIBLE = 2;
  const visibleMembers = members.slice(0, MAX_VISIBLE);
  const overflow = memberCount - MAX_VISIBLE;

  const currencySymbol = CURRENCY_SYMBOLS[group?.currency] || "₹";

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* LINE 1: Group Icon, Name & Total Spent */}
      <View style={styles.lineOne}>
        <View style={styles.groupIconBox}>
          <Ionicons name="people" size={18} color={COLORS.primary} />
        </View>
        <Text style={styles.groupName} numberOfLines={1}>{group?.name || "Group"}</Text>

        <View style={styles.spentBadge}>
          <Text style={styles.spentLabel}>Spent: </Text>
          <Text style={styles.spentValue}>{currencySymbol}{totalExpenses.toFixed(0)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#9CA3AF" style={{ marginLeft: 6 }} />
      </View>

      {/* LINE 2: Member Avatars & Add Member Button */}
      <View style={styles.lineTwo}>
        <View style={styles.avatarStack}>
          {visibleMembers.map((member, i) => {
            const color = getAvatarColor(member.name);
            return (
              <View
                key={member._id || i}
                style={[
                  styles.memberAvatar,
                  { backgroundColor: color + "25", marginLeft: i === 0 ? 0 : -8 },
                ]}
              >
                {member.avatar ? (
                  <Image source={{ uri: member.avatar }} style={styles.memberAvatarImage} />
                ) : (
                  <Text style={[styles.memberAvatarText, { color }]}>
                    {getInitials(member.name)}
                  </Text>
                )}
              </View>
            );
          })}
          {overflow > 0 && (
            <View style={[styles.memberAvatar, styles.overflowAvatar, { marginLeft: -8 }]}>
              <Text style={styles.overflowText}>+{overflow}</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} />

        {isAdmin && (
          <TouchableOpacity style={styles.addBtnWrap} onPress={onAddMember} activeOpacity={0.8}>
            <View style={styles.addBtnContent}>
              <Ionicons name="person-add" size={13} color={COLORS.primary} />
              <Text style={styles.addBtnText}>Add Member</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    ...SHADOWS.medium,
  },
  lineOne: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  groupIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  groupName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    color: "#1A1A2E",
    marginRight: 8,
  },
  spentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#EBEBF0",
  },
  spentLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: "500",
  },
  spentValue: {
    fontSize: 14,
    fontWeight: "800",
    color: COLORS.dark,
  },
  lineTwo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  avatarStack: {
    flexDirection: "row",
    alignItems: "center",
  },
  memberAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  memberAvatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 13,
  },
  memberAvatarText: {
    fontSize: 10,
    fontWeight: "800",
  },
  overflowAvatar: {
    backgroundColor: "#E5E7EB",
  },
  overflowText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },
  addBtnWrap: {
    backgroundColor: COLORS.primary + "12",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.primary + "28",
    paddingHorizontal: 11,
    paddingVertical: 6,
  },
  addBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "750",
  },
});
