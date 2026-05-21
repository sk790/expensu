import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { groupInvitationService } from "../../services/authService";
import { COLORS } from "../../utils/constants";
import Animated, {
  FadeInDown,
  FadeInUp,
  Layout,
  ZoomIn,
} from "react-native-reanimated";
import AnimatedView from "../../components/AnimatedView";
import * as Haptics from "expo-haptics";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "../../hooks/useAlert";
import LoadingSpinner from "../../components/LoadingSpinner";

const { width } = Dimensions.get("window");

const ACCENT = "#6C63FF";
const ACCENT2 = "#43C6AC";
const GREEN = "#10B981";
const RED = "#EF4444";

function getInitials(name = "") {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w.charAt(0).toUpperCase())
    .join("");
}

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// Color palette for group avatars
const AVATAR_PALETTES = [
  ["#6C63FF", "#43C6AC"],
  ["#F59E0B", "#EF4444"],
  ["#10B981", "#3B82F6"],
  ["#8B5CF6", "#EC4899"],
  ["#F97316", "#FBBF24"],
];

function getAvatarColors(name = "") {
  const idx = name.charCodeAt(0) % AVATAR_PALETTES.length;
  return AVATAR_PALETTES[idx];
}

export default function InvitationsScreen({ navigation }) {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState({ id: null, action: null });
  const { alertProps, showAlert } = useAlert();
  const insets = useSafeAreaInsets();

  const fetchInvitations = async () => {
    try {
      const response = await groupInvitationService.getMyInvitations();
      setInvitations(response.data);
    } catch (error) {
      console.error("Error fetching invitations:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleResponse = async (invitationId, status) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessing({ id: invitationId, action: status });
    try {
      await groupInvitationService.respondToInvitation(invitationId, status);
      setInvitations((prev) => prev.filter((inv) => inv._id !== invitationId));

      if (status === "accepted") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert({
          type: "success",
          title: "Joined! 🎉",
          message: "You have successfully joined the group.",
        });
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showAlert({
        type: "error",
        title: "Error",
        message: error.response?.data?.message || "Failed to process invitation.",
      });
    } finally {
      setProcessing({ id: null, action: null });
    }
  };

  const renderItem = ({ item, index }) => {
    const isProcessing = processing.id === item._id;
    const isAccepting = isProcessing && processing.action === "accepted";
    const isDeclining = isProcessing && processing.action === "rejected";
    const groupName = item.group?.name || "Deleted Group";
    const inviterName = item.inviter?.name || "Unknown User";
    const memberCount = item.group?.members?.length || 1;
    const avatarColors = getAvatarColors(groupName);
    const inviterColors = getAvatarColors(inviterName);

    return (
      <AnimatedView
        entering={FadeInDown.duration(400).delay(index * 100)}
        layout={Layout.springify()}
        style={styles.card}
      >
        {/* Top accent line */}
        <LinearGradient
          colors={avatarColors}
          style={styles.cardAccent}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />

        {/* Card Body */}
        <View style={styles.cardBody}>
          {/* Group Avatar + Info */}
          <View style={styles.cardTop}>
            <LinearGradient
              colors={avatarColors}
              style={styles.groupAvatar}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.groupAvatarText}>{getInitials(groupName)}</Text>
            </LinearGradient>

            <View style={styles.groupInfo}>
              <Text style={styles.groupName} numberOfLines={1}>{groupName}</Text>
              <View style={styles.inviterRow}>
                <LinearGradient
                  colors={inviterColors}
                  style={styles.inviterAvatar}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.inviterAvatarText}>{getInitials(inviterName).charAt(0)}</Text>
                </LinearGradient>
                <Text style={styles.inviterText}>
                  <Text style={styles.inviterName}>{inviterName}</Text>
                  <Text style={styles.invitedYou}> invited you</Text>
                </Text>
              </View>
            </View>

            <View style={styles.timeTag}>
              <Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Ionicons name="people" size={13} color={ACCENT} />
              <Text style={styles.statText}>{memberCount} member{memberCount !== 1 ? "s" : ""}</Text>
            </View>
            <View style={styles.statDot} />
            <View style={styles.statChip}>
              <Ionicons name="mail-outline" size={13} color={ACCENT} />
              <Text style={styles.statText}>Pending invite</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Action Buttons */}
          <View style={styles.actionRow}>
            {/* Decline */}
            <TouchableOpacity
              style={[styles.declineBtn, isProcessing && !isDeclining && { opacity: 0.4 }]}
              onPress={() => handleResponse(item._id, "rejected")}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              {isDeclining ? (
                <ActivityIndicator size="small" color={RED} />
              ) : (
                <>
                  <Ionicons name="close" size={18} color={RED} />
                  <Text style={styles.declineText}>Decline</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Accept */}
            <TouchableOpacity
              style={[styles.acceptBtnWrap, isProcessing && !isAccepting && { opacity: 0.4 }]}
              onPress={() => handleResponse(item._id, "accepted")}
              disabled={isProcessing}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[GREEN, "#059669"]}
                style={styles.acceptBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isAccepting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFF" />
                    <Text style={styles.acceptText}>Accept</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </AnimatedView>
    );
  };

  if (loading && !refreshing) {
    return <LoadingSpinner message="Checking invitations..." />;
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={ACCENT} translucent />
      <CustomAlert {...alertProps} />

      {/* Gradient Header */}
      <LinearGradient
        colors={[ACCENT, ACCENT2]}
        style={[styles.header, { paddingTop: insets.top + 14 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AnimatedView entering={FadeInDown.duration(400)}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.goBack();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={22} color="#FFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Invitations</Text>
              {invitations.length > 0 && (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{invitations.length}</Text>
                </View>
              )}
            </View>

            <View style={styles.headerIconBtn}>
              <Ionicons name="notifications" size={20} color="#FFF" />
            </View>
          </View>

          {invitations.length > 0 && (
            <AnimatedView entering={FadeInDown.duration(400).delay(80)}>
              <Text style={styles.headerSubtitle}>
                {invitations.length} pending group invite{invitations.length !== 1 ? "s" : ""} waiting for you
              </Text>
            </AnimatedView>
          )}
        </AnimatedView>
      </LinearGradient>

      <FlatList
        data={invitations}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={[
          styles.listContent,
          invitations.length === 0 && { flexGrow: 1 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchInvitations();
            }}
            colors={[ACCENT]}
            tintColor={ACCENT}
          />
        }
        ListHeaderComponent={
          invitations.length > 0 ? (
            <AnimatedView entering={FadeInDown.duration(300)}>
              <Text style={styles.sectionLabel}>PENDING INVITES</Text>
            </AnimatedView>
          ) : null
        }
        ListEmptyComponent={
          <AnimatedView entering={FadeInUp.duration(500)} style={styles.emptyContainer}>
            <LinearGradient
              colors={[ACCENT + "20", ACCENT2 + "15"]}
              style={styles.emptyIconCircle}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="mail-open-outline" size={52} color={ACCENT} />
            </LinearGradient>
            <Text style={styles.emptyTitle}>All Clear! ✨</Text>
            <Text style={styles.emptySubtitle}>
              You have no pending group invitations right now.{"\n"}
              When someone invites you, it will show up here.
            </Text>
          </AnimatedView>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F4F5FA" },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    gap: 10,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFF",
    letterSpacing: -0.3,
  },
  countBadge: {
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },
  countBadgeText: {
    color: "#FFF",
    fontSize: 13,
    fontWeight: "800",
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
    letterSpacing: 0.1,
  },

  // List
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#AAA",
    letterSpacing: 1.2,
    marginBottom: 4,
    marginTop: 8,
    textTransform: "uppercase",
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // Card
  card: {
    backgroundColor: "#FFF",
    borderRadius: 22,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardAccent: {
    height: 4,
    width: "100%",
  },
  cardBody: {
    padding: 18,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
    gap: 12,
  },
  groupAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  groupAvatarText: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  groupInfo: {
    flex: 1,
    gap: 6,
  },
  groupName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1A1A2E",
    letterSpacing: -0.2,
  },
  inviterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  inviterAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  inviterAvatarText: {
    color: "#FFF",
    fontSize: 9,
    fontWeight: "800",
  },
  inviterText: {
    fontSize: 13,
    color: "#888",
  },
  inviterName: {
    fontWeight: "700",
    color: ACCENT,
  },
  invitedYou: {
    color: "#888",
    fontWeight: "500",
  },
  timeTag: {
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  timeText: {
    fontSize: 11,
    color: "#94A3B8",
    fontWeight: "600",
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: ACCENT + "10",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  statText: {
    fontSize: 12,
    color: ACCENT,
    fontWeight: "600",
  },
  statDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginBottom: 14,
  },

  // Buttons
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  declineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: RED + "30",
    backgroundColor: RED + "08",
  },
  declineText: {
    color: RED,
    fontSize: 15,
    fontWeight: "700",
  },
  acceptBtnWrap: {
    flex: 1.4,
    borderRadius: 14,
    overflow: "hidden",
    height: 48,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  acceptText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "700",
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A2E",
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
    lineHeight: 23,
  },
});
